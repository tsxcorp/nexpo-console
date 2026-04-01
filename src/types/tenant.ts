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
  // Computed/joined fields
  user_count?: number;
  event_count?: number;
  exhibitor_count?: number;
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
