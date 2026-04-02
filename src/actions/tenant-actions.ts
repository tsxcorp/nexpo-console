"use server";

import { getAdminClient } from "@/lib/server-client";
import {
  readItems, readItem, createItem, updateItem,
  aggregate,
} from "@directus/sdk";
import type {
  Tenant, TenantUser, TenantListParams, PaginatedResponse, DirectusUserInfo,
} from "@/types/tenant";

/** Fetch paginated tenant list with user/event/exhibitor counts */
export async function fetchTenants(params: TenantListParams = {}): Promise<PaginatedResponse<Tenant>> {
  const { page = 1, limit = 25, sort = '-date_created', search, status, tier } = params;
  const client = getAdminClient();

  // Build filter
  const filter: Record<string, unknown> = {};
  if (status) filter.status = { _eq: status };
  if (tier) filter.subscription_tier = { _eq: tier };
  if (search) {
    filter._or = [
      { name: { _icontains: search } },
      { email: { _icontains: search } },
    ];
  }

  const [tenants, countResult] = await Promise.all([
    client.request(readItems('tenants', {
      fields: ['id', 'name', 'email', 'status', 'logo', 'subscription_tier', 'features', 'date_created', 'default_language', 'timezone'],
      filter,
      sort: [sort],
      limit,
      offset: (page - 1) * limit,
    })) as Promise<Tenant[]>,
    client.request(aggregate('tenants', {
      aggregate: { count: '*' },
      query: { filter },
    })),
  ]);

  const total = Number((countResult as Record<string, unknown>[])?.[0]?.count ?? 0);

  // Batch fetch counts for tenant_users, events, exhibitors
  if (tenants.length > 0) {
    const tenantIds = tenants.map((t) => t.id);

    const [userCounts, eventCounts, exhibitorCounts] = await Promise.all([
      client.request(aggregate('tenant_users', {
        aggregate: { count: '*' },
        groupBy: ['tenant'],
        query: { filter: { tenant: { _in: tenantIds } } },
      })) as Promise<{ tenant: number; count: string }[]>,
      client.request(aggregate('events', {
        aggregate: { count: '*' },
        groupBy: ['tenant_id'],
        query: { filter: { tenant_id: { _in: tenantIds } } },
      })) as Promise<{ tenant_id: number; count: string }[]>,
      client.request(aggregate('exhibitors', {
        aggregate: { count: '*' },
        groupBy: ['tenant_id'],
        query: { filter: { tenant_id: { _in: tenantIds } } },
      })) as Promise<{ tenant_id: number; count: string }[]>,
    ]);

    const userMap = new Map(userCounts.map((r) => [r.tenant, Number(r.count)]));
    const eventMap = new Map(eventCounts.map((r) => [r.tenant_id, Number(r.count)]));
    const exhibitorMap = new Map(exhibitorCounts.map((r) => [r.tenant_id, Number(r.count)]));

    for (const t of tenants) {
      t.user_count = userMap.get(t.id) ?? 0;
      t.event_count = eventMap.get(t.id) ?? 0;
      t.exhibitor_count = exhibitorMap.get(t.id) ?? 0;
    }
  }

  return { data: tenants, total, page, limit, totalPages: Math.ceil(total / limit) };
}

/** Fetch single tenant with full details */
export async function fetchTenant(id: number): Promise<Tenant | null> {
  try {
    const client = getAdminClient();
    const tenant = await client.request(readItem('tenants', id, {
      fields: ['*'],
    })) as Tenant;

    // Fetch counts
    const [userCounts, eventCounts, exhibitorCounts] = await Promise.all([
      client.request(aggregate('tenant_users', {
        aggregate: { count: '*' },
        query: { filter: { tenant: { _eq: id } } },
      })),
      client.request(aggregate('events', {
        aggregate: { count: '*' },
        query: { filter: { tenant_id: { _eq: id } } },
      })),
      client.request(aggregate('exhibitors', {
        aggregate: { count: '*' },
        query: { filter: { tenant_id: { _eq: id } } },
      })),
    ]);

    tenant.user_count = Number((userCounts as Record<string, unknown>[])?.[0]?.count ?? 0);
    tenant.event_count = Number((eventCounts as Record<string, unknown>[])?.[0]?.count ?? 0);
    tenant.exhibitor_count = Number((exhibitorCounts as Record<string, unknown>[])?.[0]?.count ?? 0);

    return tenant;
  } catch {
    return null;
  }
}

/** Fetch tenant users with Directus user info */
export async function fetchTenantUsers(tenantId: number): Promise<TenantUser[]> {
  const client = getAdminClient();
  return client.request(readItems('tenant_users', {
    fields: ['id', 'role_type', 'modules', 'is_active', 'sort',
      { user: ['id', 'first_name', 'last_name', 'email', 'status', 'avatar'] },
      { role: ['id', 'name'] },
    ],
    filter: { tenant: { _eq: tenantId } },
    sort: ['sort', 'id'],
    limit: -1,
  })) as unknown as TenantUser[];
}

/** Fetch events belonging to a tenant */
export async function fetchTenantEvents(tenantId: number, limit = 25) {
  const client = getAdminClient();
  return client.request(readItems('events', {
    fields: ['id', 'name', 'start_date', 'end_date', 'status', 'event_code', 'has_ticketing', 'date_created'],
    filter: { tenant_id: { _eq: tenantId } },
    sort: ['-start_date'],
    limit,
  }));
}

/** Fetch exhibitors belonging to a tenant */
export async function fetchTenantExhibitors(tenantId: number, limit = 25) {
  const client = getAdminClient();
  return client.request(readItems('exhibitors', {
    fields: ['id', 'status', 'representative_name', 'representative_email', 'date_created',
      { translations: ['company_name', 'languages_code'] },
    ],
    filter: { tenant_id: { _eq: tenantId } },
    sort: ['-date_created'],
    limit,
  }));
}

/** Create a new tenant */
export async function createTenantAction(data: {
  name: string;
  email: string;
  status?: string;
  subscription_tier?: string;
  default_language?: string;
  timezone?: string;
}) {
  try {
    const client = getAdminClient();
    const tenant = await client.request(createItem('tenants', {
      ...data,
      status: data.status || 'active',
    }));
    return { success: true, data: tenant };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

/** Update an existing tenant */
export async function updateTenantAction(id: number, data: Partial<Tenant>) {
  try {
    const client = getAdminClient();
    // Clean empty strings to null for optional fields Directus may reject
    const cleaned: Record<string, unknown> = { ...data };
    for (const key of ['subscription_tier', 'default_language', 'timezone']) {
      if (cleaned[key] === '' || cleaned[key] === undefined) {
        cleaned[key] = null;
      }
    }
    const tenant = await client.request(updateItem('tenants', id, cleaned));
    return { success: true, data: tenant };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

/** Toggle tenant active/inactive status */
export async function toggleTenantStatusAction(id: number, newStatus: 'active' | 'inactive') {
  try {
    const client = getAdminClient();
    await client.request(updateItem('tenants', id, { status: newStatus }));
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}
