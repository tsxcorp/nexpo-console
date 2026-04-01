"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { fetchTenantUsage, updateTenantQuotasAction } from "@/actions/quota-actions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ResolvedQuota, TenantQuota } from "@/types/quota";
import { Calendar, Building2, Users, FileText, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const ICONS: Record<string, typeof Calendar> = {
  max_events: Calendar,
  max_exhibitors: Building2,
  max_registrations: FileText,
  max_users: Users,
};

export function TenantQuotaPanel({ tenantId }: { tenantId: number }) {
  const { t } = useTranslation();
  const [quotas, setQuotas] = useState<ResolvedQuota[]>([]);
  const [rawQuota, setRawQuota] = useState<TenantQuota | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const load = async () => {
    setLoading(true);
    const result = await fetchTenantUsage(tenantId);
    setQuotas(result.quotas);
    setRawQuota(result.rawQuota);
    setLoading(false);
  };

  useEffect(() => { load(); }, [tenantId]);

  if (loading) {
    return <div className="h-48 bg-surface-100 dark:bg-surface-800 rounded-xl animate-pulse" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{t("quotas.title")}</h3>
        <button
          onClick={() => setEditing(!editing)}
          className="text-xs text-nexpo-500 hover:text-nexpo-600 font-medium flex items-center gap-1"
        >
          {editing ? <><X size={12} /> {t("common.cancel")}</> : <><Pencil size={12} /> {t("quotas.edit_quotas")}</>}
        </button>
      </div>

      {editing ? (
        <QuotaEditForm tenantId={tenantId} rawQuota={rawQuota} onSave={() => { setEditing(false); load(); }} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quotas.map((q) => {
            const Icon = ICONS[q.field] ?? FileText;
            const barColor = q.percent >= 80 ? "bg-red-500" : q.percent >= 60 ? "bg-yellow-500" : "bg-nexpo-500";

            return (
              <div key={q.field} className="p-4 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={14} className="text-surface-400" />
                  <span className="text-xs font-medium text-surface-600 dark:text-surface-300">{q.label}</span>
                  <span className={cn(
                    "ml-auto text-[10px] px-1.5 py-0.5 rounded",
                    q.source === "custom" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300" :
                    q.source === "tier" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" :
                    "bg-surface-100 text-surface-500 dark:bg-surface-700 dark:text-surface-400"
                  )}>
                    {q.source === "custom" ? t("subscriptions.custom_override") : q.source === "tier" ? t("quotas.tier_default") : t("common.unlimited")}
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-lg font-bold">{q.usage}</span>
                  <span className="text-sm text-surface-400">/ {q.limit ?? "∞"}</span>
                </div>
                {q.limit !== null && (
                  <div className="h-1.5 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${q.percent}%` }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function QuotaEditForm({ tenantId, rawQuota, onSave }: {
  tenantId: number;
  rawQuota: TenantQuota | null;
  onSave: () => void;
}) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState({
    max_events: rawQuota?.max_events ?? null,
    max_exhibitors: rawQuota?.max_exhibitors ?? null,
    max_registrations: rawQuota?.max_registrations ?? null,
    max_users: rawQuota?.max_users ?? null,
    storage_mb: rawQuota?.storage_mb ?? null,
  });

  const handleSave = async () => {
    setSaving(true);
    const result = await updateTenantQuotasAction(tenantId, values);
    setSaving(false);
    if (result.success) {
      toast.success(t("quotas.updated_success"));
      onSave();
    } else {
      toast.error(result.error);
    }
  };

  const fields = [
    { key: "max_events" as const, label: "Max Events" },
    { key: "max_exhibitors" as const, label: "Max Exhibitors" },
    { key: "max_registrations" as const, label: "Max Registrations" },
    { key: "max_users" as const, label: "Max Users" },
    { key: "storage_mb" as const, label: "Storage (MB)" },
  ];

  return (
    <div className="p-4 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl space-y-3">
      <p className="text-xs text-surface-400 mb-2">{t("quotas.custom_limit")} — leave empty for tier default</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="block text-xs font-medium text-surface-500 mb-1">{f.label}</label>
            <input
              type="number"
              value={values[f.key] ?? ""}
              onChange={(e) => setValues({ ...values, [f.key]: e.target.value ? Number(e.target.value) : null })}
              placeholder="∞"
              className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm outline-none"
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-2">
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? t("common.loading") : t("common.save")}
        </Button>
      </div>
    </div>
  );
}
