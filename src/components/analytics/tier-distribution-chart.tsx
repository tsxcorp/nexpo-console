"use client";

import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";
import type { TierBreakdown } from "@/types/analytics";

const PieChart = dynamic(() => import("recharts").then((m) => m.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then((m) => m.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then((m) => m.Cell), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });
const Legend = dynamic(() => import("recharts").then((m) => m.Legend), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });

const COLORS: Record<string, string> = {
  free: "#94a3b8",
  starter: "#3B82F6",
  pro: "#8B5CF6",
  enterprise: "#F59E0B",
  none: "#E2E8F0",
};

export function TierDistributionChart({ data }: { data: TierBreakdown[] }) {
  const { t } = useTranslation();

  if (!data.length) {
    return <div className="h-64 flex items-center justify-center text-surface-400">{t("analytics.no_chart_data")}</div>;
  }

  return (
    <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-4">
      <h3 className="text-sm font-semibold mb-4">{t("dashboard.tier_distribution")}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="tier"
              cx="50%"
              cy="50%"
              outerRadius={80}
              innerRadius={40}
              label={(props: { name?: string; value?: number }) => `${props.name} (${props.value})`}
              labelLine={false}
            >
              {data.map((entry) => (
                <Cell key={entry.tier} fill={COLORS[entry.tier] ?? COLORS.none} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
