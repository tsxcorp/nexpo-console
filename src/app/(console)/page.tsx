"use client";

import { useState, useEffect } from "react";
import { LayoutDashboard, Building2, BarChart3, CreditCard, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { fetchKpiData } from "@/actions/analytics-actions";
import { KpiCards } from "@/components/analytics/kpi-cards";
import type { KpiData } from "@/types/analytics";

const QUICK_LINKS = [
  { href: "/tenants", label: "nav.tenants", icon: Building2, desc: "Quản lý tổ chức, exhibitor" },
  { href: "/subscriptions", label: "nav.subscriptions", icon: CreditCard, desc: "Gói dịch vụ & tính năng" },
  { href: "/analytics", label: "nav.analytics", icon: BarChart3, desc: "Thống kê toàn nền tảng" },
];

export default function DashboardPage() {
  const { t } = useTranslation();
  const [kpi, setKpi] = useState<KpiData | null>(null);

  useEffect(() => { fetchKpiData().then(setKpi); }, []);

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-nexpo-50 dark:bg-nexpo-500/10 flex items-center justify-center">
          <LayoutDashboard size={20} className="text-nexpo-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">{t("dashboard.welcome")}</p>
        </div>
      </div>

      {/* KPIs */}
      {kpi ? (
        <div className="mb-8">
          <KpiCards data={kpi} />
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-4 mb-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 bg-surface-100 dark:bg-surface-800 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {QUICK_LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group p-6 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl hover:border-nexpo-300 dark:hover:border-nexpo-500/30 hover:shadow-lg hover:shadow-nexpo-500/5 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-nexpo-50 dark:bg-nexpo-500/10 flex items-center justify-center group-hover:bg-nexpo-100 dark:group-hover:bg-nexpo-500/20 transition-colors">
                <item.icon size={20} className="text-nexpo-500" />
              </div>
              <ArrowRight size={16} className="text-surface-300 group-hover:text-nexpo-500 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="font-semibold text-surface-900 dark:text-white">{t(item.label)}</h3>
            <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
