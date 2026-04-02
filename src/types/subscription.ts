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
  // Billing integration fields
  trial_days: number;
  polar_product_id_monthly: string | null;
  polar_product_id_yearly: string | null;
  payos_amount_monthly: number | null;
  payos_amount_yearly: number | null;
  is_public: boolean;
}

/** Platform-level payment provider configuration */
export interface PlatformPaymentConfig {
  id: string;
  provider: 'polar' | 'payos';
  is_active: boolean;
  credentials: Record<string, string>;
  config: Record<string, unknown>;
  date_created: string | null;
  date_updated: string | null;
}

/** Coupon code for subscription discounts */
export interface CouponCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  valid_from: string | null;
  valid_until: string | null;
  max_uses: number | null;
  current_uses: number;
  applicable_tiers: string[] | null;
  is_active: boolean;
  date_created: string | null;
}

/** All known feature slugs in the platform */
export const FEATURE_SLUGS = [
  "events", "exhibitors", "registrations", "forms",
  "ticketing", "matching", "facilities", "site-builder",
  "analytics", "api-access",
] as const;

export type FeatureSlug = typeof FEATURE_SLUGS[number];
