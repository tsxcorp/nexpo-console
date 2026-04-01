"use client";

import { useTranslation } from "react-i18next";
import { TierBadge } from "@/components/tenants/tenant-status-badge";
import type { TopTenant } from "@/types/analytics";
import Link from "next/link";

export function TopTenantsTable({ data }: { data: TopTenant[] }) {
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700">
        <h3 className="text-sm font-semibold">{t("dashboard.top_tenants")}</h3>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-surface-200 dark:border-surface-700">
            {[t("tenants.name"), t("tenants.tier"), t("common.events"), t("common.registrations")].map((h) => (
              <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((tenant) => (
            <tr key={tenant.id} className="border-b border-surface-100 dark:border-surface-700/50 hover:bg-surface-50 dark:hover:bg-surface-700/30 transition-colors">
              <td className="px-4 py-2.5">
                <Link href={`/tenants/${tenant.id}`} className="text-sm font-medium hover:text-nexpo-500 transition-colors">
                  {tenant.name}
                </Link>
              </td>
              <td className="px-4 py-2.5"><TierBadge tier={tenant.subscription_tier} /></td>
              <td className="px-4 py-2.5 text-sm text-center">{tenant.event_count}</td>
              <td className="px-4 py-2.5 text-sm text-center font-medium">{tenant.registration_count.toLocaleString("vi-VN")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
