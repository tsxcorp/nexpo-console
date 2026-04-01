# nexpo-console — Super Admin Console

## Project Identity
- **Role**: Super Admin (Nexpo staff)
- **Domain**: `console.nexpo.vn`
- **Port**: 3004
- **Users**: Nexpo internal team managing tenants, subscriptions, quotas, analytics

## Tech Stack
- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 (CSS-first config)
- @directus/sdk v18
- lucide-react (icons)
- sonner (toasts)
- React Hook Form + Zod (forms)
- i18next (vi default, en supported)

## Backend / API
- **Directus**: `https://app.nexpo.vn`
- **Auth**: Super Admin role users via JWT
- **Server Actions**: use `DIRECTUS_ADMIN_TOKEN` for privileged cross-tenant ops
- **Admin Client**: `getAdminClient()` from `src/lib/server-client.ts` — server-side ONLY

## Routing Structure
```
/(auth)/login              — Login page (Super Admin only)
/(console)/                — Dashboard
/(console)/tenants         — Tenant list + CRUD
/(console)/tenants/[id]    — Tenant detail
/(console)/subscriptions   — Subscription tiers
/(console)/analytics       — Platform analytics
/(console)/settings        — Platform settings
```

## Auth & Permissions
- Middleware checks `role.name === "Super Admin"` from Directus
- Role verified via cookie cache (`console_role_verified`, 14min TTL)
- Non-Super-Admin users redirected to login with error
- All data queries are cross-tenant (no tenant scoping)

## Design
- **Sidebar**: Dark navy (`#06043E`) with white/nexpo-400 text
- **Brand**: Same nexpo-primary-500 (`#4F80FF`)
- **Components**: Same patterns as nexpo-portal (Button, ThemeToggle, etc.)

## Do NOT
- Expose `DIRECTUS_ADMIN_TOKEN` to client-side
- Use `any` TypeScript type
- Skip i18n on new UI pages
- Create tenant-scoped queries (this app is cross-tenant by design)
