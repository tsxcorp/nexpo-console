"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Building2, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchTenants, toggleTenantStatusAction } from "@/actions/tenant-actions";
import { TenantStatusBadge, TierBadge } from "./tenant-status-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Tenant, PaginatedResponse } from "@/types/tenant";
import Link from "next/link";

const TIERS = ["free", "starter", "pro", "enterprise"];

export function TenantListTable() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<PaginatedResponse<Tenant> | null>(null);
  const [loading, setLoading] = useState(true);

  // Read URL params
  const page = Number(searchParams.get("page") || 1);
  const search = searchParams.get("search") || "";
  const status = (searchParams.get("status") || "") as "" | "active" | "inactive";
  const tier = searchParams.get("tier") || "";

  const updateParams = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v); else params.delete(k);
    }
    // Reset page when filters change
    if (!("page" in updates)) params.delete("page");
    router.push(`/tenants?${params.toString()}`);
  }, [searchParams, router]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchTenants({ page, search, status, tier, limit: 25 });
      setData(result);
    } finally {
      setLoading(false);
    }
  }, [page, search, status, tier]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleToggleStatus = async (tenant: Tenant) => {
    const newStatus = tenant.status === "active" ? "inactive" : "active";
    const msg = newStatus === "active" ? t("tenants.confirm_activate") : t("tenants.confirm_deactivate");
    if (!confirm(msg)) return;

    const result = await toggleTenantStatusAction(tenant.id, newStatus);
    if (result.success) {
      toast.success(t("tenants.status_updated"));
      loadData();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-nexpo-50 dark:bg-nexpo-500/10 flex items-center justify-center">
            <Building2 size={20} className="text-nexpo-500" />
          </div>
          <h1 className="text-2xl font-bold">{t("tenants.title")}</h1>
        </div>
        <Link href="/tenants/create">
          <Button size="sm" className="gap-2">
            <Plus size={16} /> {t("tenants.create_tenant")}
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            defaultValue={search}
            placeholder={t("common.search")}
            onChange={(e) => {
              const timer = setTimeout(() => updateParams({ search: e.target.value }), 400);
              return () => clearTimeout(timer);
            }}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-sm outline-none"
          />
        </div>
        <select
          value={status}
          onChange={(e) => updateParams({ status: e.target.value })}
          className="px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-sm outline-none"
        >
          <option value="">{t("common.all")} — {t("tenants.status")}</option>
          <option value="active">{t("tenants.active")}</option>
          <option value="inactive">{t("tenants.inactive")}</option>
        </select>
        <select
          value={tier}
          onChange={(e) => updateParams({ tier: e.target.value })}
          className="px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-sm outline-none"
        >
          <option value="">{t("common.all")} — {t("tenants.tier")}</option>
          {TIERS.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-200 dark:border-surface-700">
                {[t("tenants.name"), t("tenants.email"), t("tenants.tier"), t("tenants.status"),
                  t("tenants.users"), t("tenants.events"), t("tenants.exhibitors"), t("tenants.created"), t("common.actions")
                ].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-surface-100 dark:border-surface-700/50">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-surface-100 dark:bg-surface-700 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : !data?.data.length ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-surface-400">{t("common.no_data")}</td>
                </tr>
              ) : (
                data.data.map((tenant) => (
                  <tr
                    key={tenant.id}
                    className="border-b border-surface-100 dark:border-surface-700/50 hover:bg-surface-50 dark:hover:bg-surface-700/30 cursor-pointer transition-colors"
                    onClick={() => router.push(`/tenants/${tenant.id}`)}
                  >
                    <td className="px-4 py-3 font-medium text-sm">{tenant.name}</td>
                    <td className="px-4 py-3 text-sm text-surface-500">{tenant.email}</td>
                    <td className="px-4 py-3"><TierBadge tier={tenant.subscription_tier} /></td>
                    <td className="px-4 py-3"><TenantStatusBadge status={tenant.status} /></td>
                    <td className="px-4 py-3 text-sm text-center">{tenant.user_count ?? 0}</td>
                    <td className="px-4 py-3 text-sm text-center">{tenant.event_count ?? 0}</td>
                    <td className="px-4 py-3 text-sm text-center">{tenant.exhibitor_count ?? 0}</td>
                    <td className="px-4 py-3 text-xs text-surface-400">
                      {tenant.date_created ? new Date(tenant.date_created).toLocaleDateString("vi-VN") : "—"}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleToggleStatus(tenant)}
                        className={cn(
                          "text-xs font-medium px-2.5 py-1 rounded-md transition-colors",
                          tenant.status === "active"
                            ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                            : "text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10"
                        )}
                      >
                        {tenant.status === "active" ? t("tenants.deactivate") : t("tenants.activate")}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200 dark:border-surface-700">
            <span className="text-xs text-surface-400">
              {t("common.showing", {
                from: (data.page - 1) * data.limit + 1,
                to: Math.min(data.page * data.limit, data.total),
                total: data.total,
              })}
            </span>
            <div className="flex gap-1">
              <button
                disabled={data.page <= 1}
                onClick={() => updateParams({ page: String(data.page - 1) })}
                className="p-1.5 rounded-md hover:bg-surface-100 dark:hover:bg-surface-700 disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={data.page >= data.totalPages}
                onClick={() => updateParams({ page: String(data.page + 1) })}
                className="p-1.5 rounded-md hover:bg-surface-100 dark:hover:bg-surface-700 disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
