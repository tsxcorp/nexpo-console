"use client";

import { useTranslation } from "react-i18next";
import { Building2, Users, Calendar, FileText, CheckCircle } from "lucide-react";
import type { KpiData } from "@/types/analytics";

const CARDS = [
  { key: "totalTenants", icon: Building2, label: "dashboard.total_tenants", color: "text-nexpo-500 bg-nexpo-50 dark:bg-nexpo-500/10" },
  { key: "activeTenants", icon: CheckCircle, label: "dashboard.active_tenants", color: "text-green-500 bg-green-50 dark:bg-green-500/10" },
  { key: "totalUsers", icon: Users, label: "dashboard.total_users", color: "text-purple-500 bg-purple-50 dark:bg-purple-500/10" },
  { key: "totalEvents", icon: Calendar, label: "dashboard.total_events", color: "text-blue-500 bg-blue-50 dark:bg-blue-500/10" },
  { key: "totalRegistrations", icon: FileText, label: "dashboard.total_registrations", color: "text-amber-500 bg-amber-50 dark:bg-amber-500/10" },
] as const;

export function KpiCards({ data }: { data: KpiData }) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {CARDS.map((card) => (
        <div key={card.key} className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-4">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${card.color}`}>
            <card.icon size={18} />
          </div>
          <div className="text-2xl font-bold">{data[card.key].toLocaleString("vi-VN")}</div>
          <div className="text-xs text-surface-500 mt-0.5">{t(card.label)}</div>
        </div>
      ))}
    </div>
  );
}
