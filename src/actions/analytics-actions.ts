"use server";

import { getAdminClient } from "@/lib/server-client";
import { readItems, aggregate } from "@directus/sdk";
import type { KpiData, TierBreakdown, TopTenant } from "@/types/analytics";

/** Fetch platform-wide KPI totals */
export async function fetchKpiData(): Promise<KpiData> {
  const client = getAdminClient();

  const [tenantTotal, tenantActive, userCount, eventCount, regCount] = await Promise.all([
    client.request(aggregate("tenants", { aggregate: { count: "*" } })),
    client.request(aggregate("tenants", { aggregate: { count: "*" }, query: { filter: { status: { _eq: "active" } } } })),
    client.request(aggregate("tenant_users", { aggregate: { count: "*" } })),
    client.request(aggregate("events", { aggregate: { count: "*" } })),
    client.request(aggregate("registrations", { aggregate: { count: "*" } })),
  ]);

  const c = (r: unknown) => Number((r as Record<string, unknown>[])?.[0]?.count ?? 0);

  return {
    totalTenants: c(tenantTotal),
    activeTenants: c(tenantActive),
    totalUsers: c(userCount),
    totalEvents: c(eventCount),
    totalRegistrations: c(regCount),
  };
}

/** Fetch tenant count per subscription tier */
export async function fetchTierDistribution(): Promise<TierBreakdown[]> {
  const client = getAdminClient();
  const result = await client.request(aggregate("tenants", {
    aggregate: { count: "*" },
    groupBy: ["subscription_tier"],
  })) as { subscription_tier: string | null; count: string }[];

  return result.map((r) => ({
    tier: r.subscription_tier || "none",
    count: Number(r.count),
  }));
}

/** Fetch top tenants by event + registration count */
export async function fetchTopTenants(limit = 10): Promise<TopTenant[]> {
  const client = getAdminClient();

  const tenants = await client.request(readItems("tenants", {
    fields: ["id", "name", "email", "subscription_tier"],
    filter: { status: { _eq: "active" } },
    sort: ["-date_created"],
    limit: 50,
  })) as TopTenant[];

  if (!tenants.length) return [];

  const tenantIds = tenants.map((t) => t.id);

  const [eventCounts, regCounts] = await Promise.all([
    client.request(aggregate("events", {
      aggregate: { count: "*" },
      groupBy: ["tenant_id"],
      query: { filter: { tenant_id: { _in: tenantIds } } },
    })) as Promise<{ tenant_id: number; count: string }[]>,
    client.request(aggregate("registrations", {
      aggregate: { count: "*" },
      groupBy: ["tenant_id"],
      query: { filter: { tenant_id: { _in: tenantIds } } },
    })) as Promise<{ tenant_id: number; count: string }[]>,
  ]);

  const eventMap = new Map(eventCounts.map((r) => [r.tenant_id, Number(r.count)]));
  const regMap = new Map(regCounts.map((r) => [r.tenant_id, Number(r.count)]));

  for (const t of tenants) {
    t.event_count = eventMap.get(t.id) ?? 0;
    t.registration_count = regMap.get(t.id) ?? 0;
  }

  // Sort by registration count desc, take top N
  return tenants
    .sort((a, b) => b.registration_count - a.registration_count)
    .slice(0, limit);
}
