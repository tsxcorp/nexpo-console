/** Per-tenant quota overrides stored in Directus */
export interface TenantQuota {
  id: string;
  tenant_id: number;
  max_events: number | null;
  max_exhibitors: number | null;
  max_registrations: number | null;
  max_users: number | null;
  storage_mb: number | null;
}

/** Current usage counts for a tenant */
export interface TenantUsage {
  events: number;
  exhibitors: number;
  registrations: number;
  users: number;
}

/** Resolved quota: per-tenant override > tier default > null (unlimited) */
export interface ResolvedQuota {
  field: string;
  label: string;
  usage: number;
  limit: number | null;
  source: "custom" | "tier" | "unlimited";
  percent: number;
}
