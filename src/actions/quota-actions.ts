"use server";

import { getAdminClient } from "@/lib/server-client";
import { readItems, readItem, createItem, updateItem, aggregate } from "@directus/sdk";
import type { TenantQuota, TenantUsage, ResolvedQuota } from "@/types/quota";
import type { SubscriptionTier } from "@/types/subscription";

/** Fetch tenant usage data + resolved quotas */
export async function fetchTenantUsage(tenantId: number): Promise<{
  usage: TenantUsage;
  quotas: ResolvedQuota[];
  rawQuota: TenantQuota | null;
}> {
  const client = getAdminClient();

  // Fetch tenant to get subscription_tier
  const tenant = await client.request(readItem("tenants", tenantId, {
    fields: ["subscription_tier"],
  })) as { subscription_tier: string | null };

  // Parallel fetch: quota overrides, tier defaults, usage counts
  const [quotaResults, tierResults, eventCount, exhibitorCount, registrationCount, userCount] = await Promise.all([
    client.request(readItems("tenant_quotas", {
      fields: ["*"],
      filter: { tenant_id: { _eq: tenantId } },
      limit: 1,
    })) as Promise<TenantQuota[]>,

    tenant.subscription_tier
      ? client.request(readItems("subscription_tiers", {
          fields: ["max_events", "max_exhibitors", "max_registrations", "max_users"],
          filter: { slug: { _eq: tenant.subscription_tier } },
          limit: 1,
        })) as Promise<SubscriptionTier[]>
      : Promise.resolve([] as SubscriptionTier[]),

    client.request(aggregate("events", {
      aggregate: { count: "*" },
      query: { filter: { tenant_id: { _eq: tenantId } } },
    })),
    client.request(aggregate("exhibitors", {
      aggregate: { count: "*" },
      query: { filter: { tenant_id: { _eq: tenantId } } },
    })),
    client.request(aggregate("registrations", {
      aggregate: { count: "*" },
      query: { filter: { tenant_id: { _eq: tenantId } } },
    })),
    client.request(aggregate("tenant_users", {
      aggregate: { count: "*" },
      query: { filter: { tenant: { _eq: tenantId } } },
    })),
  ]);

  const rawQuota = quotaResults[0] ?? null;
  const tier = tierResults[0] ?? null;

  const usage: TenantUsage = {
    events: Number((eventCount as Record<string, unknown>[])?.[0]?.count ?? 0),
    exhibitors: Number((exhibitorCount as Record<string, unknown>[])?.[0]?.count ?? 0),
    registrations: Number((registrationCount as Record<string, unknown>[])?.[0]?.count ?? 0),
    users: Number((userCount as Record<string, unknown>[])?.[0]?.count ?? 0),
  };

  // Resolve quotas: custom override > tier default > unlimited
  const fields = [
    { field: "max_events", label: "Events", usageKey: "events" as const },
    { field: "max_exhibitors", label: "Exhibitors", usageKey: "exhibitors" as const },
    { field: "max_registrations", label: "Registrations", usageKey: "registrations" as const },
    { field: "max_users", label: "Users", usageKey: "users" as const },
  ];

  const quotas: ResolvedQuota[] = fields.map(({ field, label, usageKey }) => {
    const customVal = rawQuota?.[field as keyof TenantQuota] as number | null;
    const tierVal = tier?.[field as keyof SubscriptionTier] as number | null;

    let limit: number | null = null;
    let source: "custom" | "tier" | "unlimited" = "unlimited";

    if (customVal !== null && customVal !== undefined) {
      limit = customVal;
      source = "custom";
    } else if (tierVal !== null && tierVal !== undefined) {
      limit = tierVal;
      source = "tier";
    }

    const usageVal = usage[usageKey];
    const percent = limit ? Math.min(Math.round((usageVal / limit) * 100), 100) : 0;

    return { field, label, usage: usageVal, limit, source, percent };
  });

  return { usage, quotas, rawQuota };
}

/** Upsert tenant quota overrides */
export async function updateTenantQuotasAction(tenantId: number, data: {
  max_events?: number | null;
  max_exhibitors?: number | null;
  max_registrations?: number | null;
  max_users?: number | null;
  storage_mb?: number | null;
}) {
  try {
    const client = getAdminClient();

    // Check if quota record exists
    const existing = await client.request(readItems("tenant_quotas", {
      fields: ["id"],
      filter: { tenant_id: { _eq: tenantId } },
      limit: 1,
    })) as { id: string }[];

    if (existing.length) {
      await client.request(updateItem("tenant_quotas", existing[0].id, data));
    } else {
      await client.request(createItem("tenant_quotas", { tenant_id: tenantId, ...data }));
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
