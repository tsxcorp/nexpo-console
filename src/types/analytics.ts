export interface KpiData {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalEvents: number;
  totalRegistrations: number;
}

export interface TimeSeriesPoint {
  month: string; // "2025-01"
  count: number;
}

export interface TierBreakdown {
  tier: string;
  count: number;
}

export interface TopTenant {
  id: number;
  name: string;
  email: string;
  subscription_tier: string | null;
  event_count: number;
  registration_count: number;
}
