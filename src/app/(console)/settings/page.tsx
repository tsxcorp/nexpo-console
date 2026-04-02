"use client";

import { Settings, ExternalLink, Server, Globe, Shield, CreditCard, Tag, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || "https://app.nexpo.vn";

const PLATFORM_APPS = [
  { name: "nexpo-admin", domain: "platform.nexpo.vn", port: 3000 },
  { name: "nexpo-portal", domain: "portal.nexpo.vn", port: 3003 },
  { name: "nexpo-public", domain: "[slug].nexpo.vn", port: 3001 },
  { name: "nexpo-insight", domain: "insights.nexpo.vn", port: 3002 },
  { name: "nexpo-console", domain: "console.nexpo.vn", port: 3004 },
  { name: "nexpo-services", domain: "services.nexpo.vn", port: 8000 },
];

export default function SettingsPage() {
  const { t } = useTranslation();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-nexpo-50 dark:bg-nexpo-500/10 flex items-center justify-center">
          <Settings size={20} className="text-nexpo-500" />
        </div>
        <h1 className="text-2xl font-bold">{t("nav.settings")}</h1>
      </div>

      <div className="space-y-6 max-w-3xl">
        {/* Billing config navigation */}
        <section className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-4 flex items-center gap-2">
            <CreditCard size={16} /> {t("billing.billing_config")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <NavCard
              href="/settings/payment"
              icon={<CreditCard size={18} className="text-nexpo-500" />}
              label={t("billing.payment_providers")}
              description={t("billing.payment_providers_desc")}
            />
            <NavCard
              href="/settings/coupons"
              icon={<Tag size={18} className="text-nexpo-500" />}
              label={t("billing.coupon_management")}
              description={t("billing.coupon_management_desc")}
            />
          </div>
        </section>

        {/* Platform info */}
        <section className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-4 flex items-center gap-2">
            <Server size={16} /> {t("settings.platform_info")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoCard label={t("settings.directus_url")} value={DIRECTUS_URL} />
            <InfoCard label={t("settings.environment")} value={process.env.NODE_ENV ?? "development"} />
          </div>
        </section>

        {/* Quick links */}
        <section className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-4 flex items-center gap-2">
            <Shield size={16} /> {t("settings.quick_links")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <QuickLink label={t("settings.directus_admin")} href={`${DIRECTUS_URL}/admin`} />
            <QuickLink label={t("settings.directus_roles")} href={`${DIRECTUS_URL}/admin/settings/roles`} />
            <QuickLink label={t("settings.directus_policies")} href={`${DIRECTUS_URL}/admin/settings/policies`} />
            <QuickLink label={t("settings.directus_schema")} href={`${DIRECTUS_URL}/admin/settings/data-model`} />
          </div>
        </section>

        {/* App registry */}
        <section className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-4 flex items-center gap-2">
            <Globe size={16} /> {t("settings.app_registry")}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200 dark:border-surface-700">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-surface-500 uppercase">{t("settings.app_name")}</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-surface-500 uppercase">{t("settings.domain")}</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-surface-500 uppercase">{t("settings.local_port")}</th>
                </tr>
              </thead>
              <tbody>
                {PLATFORM_APPS.map((app) => (
                  <tr key={app.name} className="border-b border-surface-100 dark:border-surface-700/50">
                    <td className="px-3 py-2.5 text-sm font-medium font-mono">{app.name}</td>
                    <td className="px-3 py-2.5 text-sm text-surface-500">{app.domain}</td>
                    <td className="px-3 py-2.5 text-sm text-surface-400">{app.port}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function NavCard({ href, icon, label, description }: { href: string; icon: React.ReactNode; label: string; description: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-4 bg-surface-50 dark:bg-surface-700/30 rounded-xl hover:bg-nexpo-50 dark:hover:bg-nexpo-500/10 border border-transparent hover:border-nexpo-200 dark:hover:border-nexpo-500/30 transition-all group"
    >
      <div className="w-9 h-9 rounded-lg bg-white dark:bg-surface-800 flex items-center justify-center shadow-sm shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-surface-400 truncate">{description}</div>
      </div>
      <ChevronRight size={14} className="text-surface-300 group-hover:text-nexpo-400 transition-colors shrink-0" />
    </Link>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-surface-50 dark:bg-surface-700/30 rounded-lg">
      <div className="text-xs text-surface-400 mb-1">{label}</div>
      <div className="text-sm font-medium font-mono truncate">{value}</div>
    </div>
  );
}

function QuickLink({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between px-3 py-2.5 bg-surface-50 dark:bg-surface-700/30 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700/50 transition-colors group"
    >
      <span className="text-sm font-medium">{label}</span>
      <ExternalLink size={14} className="text-surface-400 group-hover:text-nexpo-500 transition-colors" />
    </a>
  );
}
