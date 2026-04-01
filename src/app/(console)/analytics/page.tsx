"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BarChart3, RefreshCw } from "lucide-react";
import { fetchKpiData, fetchTierDistribution, fetchTopTenants } from "@/actions/analytics-actions";
import { KpiCards } from "@/components/analytics/kpi-cards";
import { TierDistributionChart } from "@/components/analytics/tier-distribution-chart";
import { TopTenantsTable } from "@/components/analytics/top-tenants-table";
import { Button } from "@/components/ui/button";
import type { KpiData, TierBreakdown, TopTenant } from "@/types/analytics";

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [tiers, setTiers] = useState<TierBreakdown[]>([]);
  const [topTenants, setTopTenants] = useState<TopTenant[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    const [kpiData, tierData, topData] = await Promise.all([
      fetchKpiData(),
      fetchTierDistribution(),
      fetchTopTenants(10),
    ]);
    setKpi(kpiData);
    setTiers(tierData);
    setTopTenants(topData);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-nexpo-50 dark:bg-nexpo-500/10 flex items-center justify-center">
            <BarChart3 size={20} className="text-nexpo-500" />
          </div>
          <h1 className="text-2xl font-bold">{t("analytics.title")}</h1>
        </div>
        <Button variant="secondary" size="sm" onClick={loadAll} disabled={loading} className="gap-2">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          {t("analytics.refresh")}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-28 bg-surface-100 dark:bg-surface-800 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="h-80 bg-surface-100 dark:bg-surface-800 rounded-xl animate-pulse" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI cards */}
          {kpi && <KpiCards data={kpi} />}

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TierDistributionChart data={tiers} />
            <TopTenantsTable data={topTenants} />
          </div>
        </div>
      )}
    </div>
  );
}
