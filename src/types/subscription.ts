/** Subscription tier definition */
export interface SubscriptionTier {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  features: string[] | null;
  max_events: number | null;
  max_exhibitors: number | null;
  max_registrations: number | null;
  max_users: number | null;
  price_monthly: string | number;
  price_yearly: string | number;
  sort_order: number;
  is_active: boolean;
}

/** All known feature slugs in the platform */
export const FEATURE_SLUGS = [
  "events", "exhibitors", "registrations", "forms",
  "ticketing", "matching", "facilities", "site-builder",
  "analytics", "api-access",
] as const;

export type FeatureSlug = typeof FEATURE_SLUGS[number];
