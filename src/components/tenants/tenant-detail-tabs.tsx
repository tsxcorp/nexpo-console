"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { fetchTenantUsers, fetchTenantEvents, fetchTenantExhibitors } from "@/actions/tenant-actions";
import { TenantStatusBadge, TierBadge } from "./tenant-status-badge";
import type { Tenant, TenantUser, DirectusUserInfo } from "@/types/tenant";
import { Users, Calendar, Building2, Info, Globe, Clock, CreditCard, Mail, BarChart3 } from "lucide-react";
import { TenantQuotaPanel } from "./tenant-quota-panel";
import { TenantBillingTab } from "./tenant-billing-tab";

const TABS = ["overview", "users", "events", "exhibitors", "usage", "billing"] as const;
type Tab = typeof TABS[number];

function getUserDisplayName(user: string | DirectusUserInfo): string {
  if (typeof user === "string") return user;
  return [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email;
}

function getUserEmail(user: string | DirectusUserInfo): string {
  if (typeof user === "string") return "";
  return user.email;
}

function getRoleName(role: string | { id: string; name: string }): string {
  if (typeof role === "string") return role;
  return role.name;
}

export function TenantDetailTabs({ tenant }: { tenant: Tenant }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [events, setEvents] = useState<Record<string, unknown>[]>([]);
  const [exhibitors, setExhibitors] = useState<Record<string, unknown>[]>([]);
  const [loadingTab, setLoadingTab] = useState(false);

  useEffect(() => {
    if (activeTab === "overview") return;

    setLoadingTab(true);
    const load = async () => {
      try {
        if (activeTab === "users" && users.length === 0) {
          setUsers(await fetchTenantUsers(tenant.id));
        } else if (activeTab === "events" && events.length === 0) {
          setEvents(await fetchTenantEvents(tenant.id) as Record<string, unknown>[]);
        } else if (activeTab === "exhibitors" && exhibitors.length === 0) {
          setExhibitors(await fetchTenantExhibitors(tenant.id) as Record<string, unknown>[]);
        }
      } finally {
        setLoadingTab(false);
      }
    };
    load();
  }, [activeTab, tenant.id, users.length, events.length, exhibitors.length]);

  const tabIcons = { overview: Info, users: Users, events: Calendar, exhibitors: Building2, usage: BarChart3, billing: CreditCard };

  return (
    <div>
      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-surface-200 dark:border-surface-700 mb-6">
        {TABS.map((tab) => {
          const Icon = tabIcons[tab];
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
                activeTab === tab
                  ? "border-nexpo-500 text-nexpo-600 dark:text-nexpo-400"
                  : "border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
              )}
            >
              <Icon size={16} />
              {t(`tenants.tab_${tab}`)}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && <OverviewTab tenant={tenant} />}
      {activeTab === "users" && (
        loadingTab
          ? <LoadingSkeleton />
          : <UsersTab users={users} />
      )}
      {activeTab === "events" && (
        loadingTab
          ? <LoadingSkeleton />
          : <EventsTab events={events} />
      )}
      {activeTab === "exhibitors" && (
        loadingTab
          ? <LoadingSkeleton />
          : <ExhibitorsTab exhibitors={exhibitors} />
      )}
      {activeTab === "usage" && (
        <TenantQuotaPanel tenantId={tenant.id} />
      )}
      {activeTab === "billing" && (
        <TenantBillingTab tenantId={tenant.id} />
      )}
    </div>
  );
}

function OverviewTab({ tenant }: { tenant: Tenant }) {
  const { t } = useTranslation();
  const infoCards = [
    { icon: Mail, label: t("tenants.email"), value: tenant.email },
    { icon: CreditCard, label: t("tenants.tier"), value: tenant.subscription_tier ?? "—", isTier: true },
    { icon: Globe, label: t("tenants.language"), value: tenant.default_language?.toUpperCase() ?? "—" },
    { icon: Clock, label: t("tenants.timezone"), value: tenant.timezone ?? "—" },
  ];

  const stats = [
    { label: t("tenants.users"), value: tenant.user_count ?? 0, icon: Users },
    { label: t("tenants.events"), value: tenant.event_count ?? 0, icon: Calendar },
    { label: t("tenants.exhibitors"), value: tenant.exhibitor_count ?? 0, icon: Building2 },
  ];

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-surface-50 dark:bg-surface-700/30 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-nexpo-50 dark:bg-nexpo-500/10 flex items-center justify-center">
              <s.icon size={18} className="text-nexpo-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-surface-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {infoCards.map((c) => (
          <div key={c.label} className="flex items-center gap-3 p-4 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl">
            <c.icon size={16} className="text-surface-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-xs text-surface-400">{c.label}</div>
              {c.isTier ? <TierBadge tier={c.value} /> : <div className="text-sm font-medium truncate">{c.value}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Features */}
      {tenant.features && tenant.features.length > 0 && (
        <div className="p-4 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl">
          <h3 className="text-sm font-semibold mb-3">{t("tenants.features")}</h3>
          <div className="flex flex-wrap gap-2">
            {tenant.features.map((f) => (
              <span key={f} className="px-2.5 py-1 bg-nexpo-50 dark:bg-nexpo-500/10 text-nexpo-600 dark:text-nexpo-400 text-xs font-medium rounded-lg">
                {t(`features.${f}`, f)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function UsersTab({ users }: { users: TenantUser[] }) {
  const { t } = useTranslation();
  if (!users.length) return <EmptyState message={t("tenants.no_users")} />;

  return (
    <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-surface-200 dark:border-surface-700">
            {[t("tenants.user_name"), t("tenants.user_email"), "Role", t("tenants.role_type"), t("tenants.user_status")].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-surface-100 dark:border-surface-700/50">
              <td className="px-4 py-3 text-sm font-medium">{getUserDisplayName(u.user)}</td>
              <td className="px-4 py-3 text-sm text-surface-500">{getUserEmail(u.user)}</td>
              <td className="px-4 py-3 text-sm">{getRoleName(u.role)}</td>
              <td className="px-4 py-3">
                <span className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded capitalize",
                  u.role_type === "admin" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300" : "bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-300"
                )}>
                  {u.role_type}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={cn(
                  "w-2 h-2 rounded-full inline-block",
                  u.is_active ? "bg-green-500" : "bg-red-500"
                )} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EventsTab({ events }: { events: Record<string, unknown>[] }) {
  const { t } = useTranslation();
  if (!events.length) return <EmptyState message={t("tenants.no_events")} />;

  return (
    <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-surface-200 dark:border-surface-700">
            {[t("tenants.event_name"), t("tenants.event_date"), t("tenants.event_status"), "Code"].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={String(e.id)} className="border-b border-surface-100 dark:border-surface-700/50">
              <td className="px-4 py-3 text-sm font-medium">{String(e.name)}</td>
              <td className="px-4 py-3 text-sm text-surface-500">
                {e.start_date ? new Date(String(e.start_date)).toLocaleDateString("vi-VN") : "—"}
              </td>
              <td className="px-4 py-3">
                <span className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded capitalize",
                  e.status === "published" ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" :
                  e.status === "draft" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300" :
                  "bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-300"
                )}>
                  {String(e.status)}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-surface-400 font-mono">{String(e.event_code ?? "—")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExhibitorsTab({ exhibitors }: { exhibitors: Record<string, unknown>[] }) {
  const { t } = useTranslation();
  if (!exhibitors.length) return <EmptyState message={t("tenants.no_exhibitors")} />;

  return (
    <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-surface-200 dark:border-surface-700">
            {[t("tenants.exhibitor_name"), t("tenants.exhibitor_email"), t("tenants.status"), t("tenants.created")].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {exhibitors.map((ex) => (
            <tr key={String(ex.id)} className="border-b border-surface-100 dark:border-surface-700/50">
              <td className="px-4 py-3 text-sm font-medium">{String(ex.representative_name ?? "—")}</td>
              <td className="px-4 py-3 text-sm text-surface-500">{String(ex.representative_email ?? "—")}</td>
              <td className="px-4 py-3">
                <span className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded capitalize",
                  ex.status === "published" ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" :
                  "bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-300"
                )}>
                  {String(ex.status)}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-surface-400">
                {ex.date_created ? new Date(String(ex.date_created)).toLocaleDateString("vi-VN") : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-12 text-center text-surface-400">
      {message}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-4 space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-10 bg-surface-100 dark:bg-surface-700 rounded animate-pulse" />
      ))}
    </div>
  );
}
