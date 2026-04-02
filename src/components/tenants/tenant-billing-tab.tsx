"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2, CreditCard, Receipt, Building2, ChevronDown } from "lucide-react";
import {
  getTenantSubscription,
  getTenantPaymentHistory,
  getTenantBillingInfo,
  manualSubscriptionOverride,
} from "@/actions/billing-actions";
import { fetchTiers } from "@/actions/subscription-actions";
import type { TenantSubscription, TenantBillingInfo, SubscriptionPayment } from "@/types/tenant";
import type { SubscriptionTier } from "@/types/subscription";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<TenantSubscription["status"], string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  trialing: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  past_due: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
  cancelled: "bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-400",
  pending: "bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-400",
  suspended: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  expired: "bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-400",
};

const PAYMENT_STATUS_STYLES: Record<SubscriptionPayment["status"], string> = {
  succeeded: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  refunded: "bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-400",
};

export function TenantBillingTab({ tenantId }: { tenantId: number }) {
  const { t } = useTranslation();
  const [subscription, setSubscription] = useState<TenantSubscription | null>(null);
  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [billingInfo, setBillingInfo] = useState<TenantBillingInfo | null>(null);
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const [tierDropdownOpen, setTierDropdownOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [sub, pmts, billing, tierList] = await Promise.all([
      getTenantSubscription(tenantId),
      getTenantPaymentHistory(tenantId),
      getTenantBillingInfo(tenantId),
      fetchTiers(),
    ]);
    setSubscription(sub);
    setPayments(pmts);
    setBillingInfo(billing);
    setTiers(tierList.filter((t) => t.is_active));
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (action: "activate" | "suspend" | "cancel", tierSlug?: string) => {
    setActioning(true);
    const result = await manualSubscriptionOverride(tenantId, action, tierSlug);
    setActioning(false);
    if (result.success) {
      toast.success(t("billing.override_applied"));
      load();
    } else {
      toast.error(result.error ?? t("common.error"));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 size={24} className="animate-spin text-nexpo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Subscription status */}
      <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <CreditCard size={16} className="text-nexpo-500" />
          {t("billing.subscription_status")}
        </h3>

        {subscription ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <InfoItem label={t("billing.status")}>
                <span className={cn("text-xs font-medium px-2 py-0.5 rounded capitalize", STATUS_STYLES[subscription.status])}>
                  {subscription.status}
                </span>
              </InfoItem>
              <InfoItem label={t("billing.provider")} value={subscription.provider} />
              <InfoItem
                label={t("billing.period")}
                value={subscription.current_period_start && subscription.current_period_end
                  ? `${new Date(subscription.current_period_start).toLocaleDateString("vi-VN")} → ${new Date(subscription.current_period_end).toLocaleDateString("vi-VN")}`
                  : "—"
                }
              />
              {subscription.trial_end && (
                <InfoItem
                  label={t("billing.trial_end")}
                  value={new Date(subscription.trial_end).toLocaleDateString("vi-VN")}
                />
              )}
              <InfoItem
                label={t("billing.cancel_at_end")}
                value={subscription.cancel_at_period_end ? t("common.yes") : t("common.no")}
              />
            </div>

            {/* Manual actions */}
            <div className="pt-3 border-t border-surface-100 dark:border-surface-700 flex flex-wrap gap-2">
              <button
                onClick={() => handleAction("activate")}
                disabled={actioning || subscription.status === "active"}
                className="px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 rounded-lg transition-colors disabled:opacity-40"
              >
                {t("billing.action_activate")}
              </button>
              <button
                onClick={() => handleAction("suspend")}
                disabled={actioning || subscription.status === "suspended"}
                className="px-3 py-1.5 text-xs font-medium bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-lg transition-colors disabled:opacity-40"
              >
                {t("billing.action_suspend")}
              </button>
              <button
                onClick={() => handleAction("cancel")}
                disabled={actioning || subscription.status === "cancelled"}
                className="px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 rounded-lg transition-colors disabled:opacity-40"
              >
                {t("billing.action_cancel")}
              </button>

              {/* Change tier dropdown */}
              <div className="relative">
                <button
                  onClick={() => setTierDropdownOpen((v) => !v)}
                  disabled={actioning}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-surface-200 dark:border-surface-600 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors disabled:opacity-40"
                >
                  {t("billing.change_tier")}
                  <ChevronDown size={12} />
                </button>
                {tierDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1 z-10 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl shadow-lg py-1 min-w-36">
                    {tiers.map((tier) => (
                      <button
                        key={tier.slug}
                        onClick={() => {
                          setTierDropdownOpen(false);
                          handleAction("activate", tier.slug);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
                      >
                        {tier.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {actioning && <Loader2 size={16} className="animate-spin text-nexpo-500 self-center" />}
            </div>
          </div>
        ) : (
          <p className="text-sm text-surface-400">{t("billing.no_subscription")}</p>
        )}
      </div>

      {/* Payment history */}
      <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-100 dark:border-surface-700 flex items-center gap-2">
          <Receipt size={16} className="text-nexpo-500" />
          <h3 className="text-sm font-semibold">{t("billing.payment_history")}</h3>
        </div>
        {payments.length === 0 ? (
          <div className="py-12 text-center text-surface-400 text-sm">{t("billing.no_payments")}</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-200 dark:border-surface-700">
                {[t("billing.date"), t("billing.amount"), t("billing.provider"), t("billing.payment_status"), t("billing.invoice")].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-surface-100 dark:border-surface-700/50">
                  <td className="px-4 py-3 text-sm text-surface-500">
                    {p.date_created ? new Date(p.date_created).toLocaleDateString("vi-VN") : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {p.amount.toLocaleString()} {p.currency.toUpperCase()}
                  </td>
                  <td className="px-4 py-3 text-sm capitalize">{p.provider}</td>
                  <td className="px-4 py-3">
                    <span className={cn("text-xs font-medium px-2 py-0.5 rounded capitalize", PAYMENT_STATUS_STYLES[p.status])}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {p.invoice_url ? (
                      <a href={p.invoice_url} target="_blank" rel="noopener noreferrer" className="text-nexpo-500 hover:underline text-xs">
                        {t("billing.view_invoice")}
                      </a>
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Billing info */}
      {billingInfo && (
        <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Building2 size={16} className="text-nexpo-500" />
            {t("billing.billing_info")}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoItem label={t("billing.company_name")} value={billingInfo.company_name ?? "—"} />
            <InfoItem label={t("billing.tax_id")} value={billingInfo.tax_id ?? "—"} />
            <InfoItem label={t("billing.billing_email")} value={billingInfo.billing_email ?? "—"} />
            <InfoItem label={t("billing.country")} value={billingInfo.country} />
            <InfoItem label={t("billing.payment_region")} value={billingInfo.payment_region} />
            {billingInfo.billing_address && (
              <InfoItem label={t("billing.billing_address")} value={billingInfo.billing_address} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="p-3 bg-surface-50 dark:bg-surface-700/30 rounded-lg">
      <div className="text-xs text-surface-400 mb-1">{label}</div>
      {children ?? <div className="text-sm font-medium">{value}</div>}
    </div>
  );
}
