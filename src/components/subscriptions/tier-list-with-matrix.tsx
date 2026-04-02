"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { CreditCard, Plus, Check, X } from "lucide-react";
import { fetchTiers } from "@/actions/subscription-actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SubscriptionTier } from "@/types/subscription";
import { FEATURE_SLUGS } from "@/types/subscription";
import Link from "next/link";

export function TierListWithMatrix() {
  const { t } = useTranslation();
  const router = useRouter();
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"table" | "matrix">("table");

  useEffect(() => {
    fetchTiers().then((data) => {
      setTiers(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="h-96 bg-surface-100 dark:bg-surface-800 rounded-xl animate-pulse" />;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-nexpo-50 dark:bg-nexpo-500/10 flex items-center justify-center">
            <CreditCard size={20} className="text-nexpo-500" />
          </div>
          <h1 className="text-2xl font-bold">{t("subscriptions.title")}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-surface-100 dark:bg-surface-700 rounded-lg p-0.5">
            <button
              onClick={() => setView("table")}
              className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                view === "table" ? "bg-white dark:bg-surface-600 shadow-sm" : "text-surface-500")}
            >
              {t("common.details")}
            </button>
            <button
              onClick={() => setView("matrix")}
              className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                view === "matrix" ? "bg-white dark:bg-surface-600 shadow-sm" : "text-surface-500")}
            >
              {t("subscriptions.feature_matrix")}
            </button>
          </div>
          <Link href="/subscriptions/create">
            <Button size="sm" className="gap-2">
              <Plus size={16} /> {t("subscriptions.create_tier")}
            </Button>
          </Link>
        </div>
      </div>

      {view === "table" ? (
        <TierTable tiers={tiers} onEdit={(id) => router.push(`/subscriptions/${id}`)} />
      ) : (
        <FeatureMatrix tiers={tiers} />
      )}
    </div>
  );
}

function TierTable({ tiers, onEdit }: { tiers: SubscriptionTier[]; onEdit: (id: string) => void }) {
  const { t } = useTranslation();
  const fmt = (v: number | null) => v === null ? t("common.unlimited") : String(v);
  const fmtPrice = (v: string | number) => {
    const n = Number(v);
    return n === 0 ? "—" : n.toLocaleString("vi-VN") + "đ";
  };

  return (
    <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-surface-200 dark:border-surface-700">
            {[t("subscriptions.tier_name"), t("subscriptions.slug"), t("subscriptions.features"),
              t("subscriptions.max_events"), t("subscriptions.max_exhibitors"), t("subscriptions.max_users"),
              t("subscriptions.price_monthly"), t("subscriptions.is_active")
            ].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tiers.map((tier) => (
            <tr
              key={tier.id}
              onClick={() => onEdit(tier.id)}
              className="border-b border-surface-100 dark:border-surface-700/50 hover:bg-surface-50 dark:hover:bg-surface-700/30 cursor-pointer transition-colors"
            >
              <td className="px-4 py-3 font-medium text-sm">{tier.name}</td>
              <td className="px-4 py-3 text-xs font-mono text-surface-500">{tier.slug}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {(tier.features ?? []).slice(0, 3).map((f) => (
                    <span key={f} className="px-1.5 py-0.5 bg-nexpo-50 dark:bg-nexpo-500/10 text-nexpo-600 dark:text-nexpo-400 text-[10px] font-medium rounded">
                      {f}
                    </span>
                  ))}
                  {(tier.features ?? []).length > 3 && (
                    <span className="text-[10px] text-surface-400">+{(tier.features ?? []).length - 3}</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-center">{fmt(tier.max_events)}</td>
              <td className="px-4 py-3 text-sm text-center">{fmt(tier.max_exhibitors)}</td>
              <td className="px-4 py-3 text-sm text-center">{fmt(tier.max_users)}</td>
              <td className="px-4 py-3 text-sm">{fmtPrice(tier.price_monthly)}</td>
              <td className="px-4 py-3">
                <span className={cn("w-2 h-2 rounded-full inline-block", tier.is_active ? "bg-green-500" : "bg-red-500")} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FeatureMatrix({ tiers }: { tiers: SubscriptionTier[] }) {
  const { t } = useTranslation();
  return (
    <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-surface-200 dark:border-surface-700">
            <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider sticky left-0 bg-white dark:bg-surface-800">Feature</th>
            {tiers.map((tier) => (
              <th key={tier.id} className="px-4 py-3 text-center text-xs font-semibold text-surface-500 uppercase tracking-wider min-w-[100px]">
                {tier.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FEATURE_SLUGS.map((feature) => (
            <tr key={feature} className="border-b border-surface-100 dark:border-surface-700/50">
              <td className="px-4 py-2.5 text-sm font-medium sticky left-0 bg-white dark:bg-surface-800">{t(`features.${feature}`, feature)}</td>
              {tiers.map((tier) => {
                const has = tier.features?.includes(feature);
                return (
                  <td key={tier.id} className="px-4 py-2.5 text-center">
                    {has ? (
                      <Check size={16} className="inline text-green-500" />
                    ) : (
                      <X size={16} className="inline text-surface-300 dark:text-surface-600" />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
