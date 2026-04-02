/** Tenant (organizer) — the top-level organization entity */
export interface Tenant {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  logo: string | null;
  settings: Record<string, unknown> | null;
  features: string[] | null;
  subscription_tier: 'free' | 'starter' | 'pro' | 'enterprise' | null;
  default_language: 'en' | 'vi' | null;
  timezone: string | null;
  supported_currencies: string[] | null;
  folder_files_id: string | null;
  date_created: string | null;
  date_updated: string | null;
  sort: number | null;
  // Billing fields
  payment_region: 'global' | 'vietnam';
  trial_ends_at: string | null;
  // Computed/joined fields
  user_count?: number;
  event_count?: number;
  exhibitor_count?: number;
}

/** Subscription record for a tenant */
export interface TenantSubscription {
  id: string;
  tenant_id: number;
  provider: 'polar' | 'payos' | 'manual';
  external_subscription_id: string | null;
  external_customer_id: string | null;
  status: 'active' | 'past_due' | 'cancelled' | 'trialing' | 'pending' | 'suspended' | 'expired';
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  trial_end: string | null;
  dunning_stage: number | null;
  dunning_started_at: string | null;
  date_created: string | null;
  date_updated: string | null;
}

/** Billing info for tax invoices */
export interface TenantBillingInfo {
  id: string;
  tenant_id: number;
  company_name: string | null;
  tax_id: string | null;
  billing_address: string | null;
  billing_email: string | null;
  country: string;
  payment_region: 'global' | 'vietnam';
  date_created: string | null;
  date_updated: string | null;
}

/** Payment transaction record */
export interface SubscriptionPayment {
  id: string;
  tenant_id: number;
  subscription_id: string | null;
  provider: 'polar' | 'payos' | 'manual';
  external_payment_id: string | null;
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed' | 'pending' | 'refunded';
  description: string | null;
  invoice_url: string | null;
  receipt_url: string | null;
  date_created: string | null;
}

/** User linked to a tenant with role and module access */
export interface TenantUser {
  id: number;
  tenant: number;
  user: string | DirectusUserInfo;
  role: string | { id: string; name: string };
  role_type: 'admin' | 'staff';
  modules: string[] | null;
  is_active: boolean;
  sort: number | null;
}

/** Minimal Directus user info for display */
export interface DirectusUserInfo {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  status: string;
  avatar: string | null;
}

/** Params for listing tenants with pagination, sort, filter */
export interface TenantListParams {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  status?: 'active' | 'inactive' | '';
  tier?: string;
}

/** Paginated response wrapper */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
