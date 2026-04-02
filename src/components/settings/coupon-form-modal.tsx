"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { X, Loader2 } from "lucide-react";
import { createCoupon, updateCoupon } from "@/actions/coupon-actions";
import type { CouponCode, SubscriptionTier } from "@/types/subscription";
import { fetchTiers } from "@/actions/subscription-actions";
import { useEffect, useState } from "react";

const couponSchema = z.object({
  code: z.string().min(1, "Required").max(50),
  discount_type: z.enum(["percentage", "fixed"]),
  discount_value: z.coerce.number().positive("Must be positive"),
  valid_from: z.string().nullable().optional(),
  valid_until: z.string().nullable().optional(),
  max_uses: z.coerce.number().int().positive().nullable().optional(),
  applicable_tiers: z.array(z.string()).nullable().optional(),
  is_active: z.boolean(),
});

type CouponFormValues = z.infer<typeof couponSchema>;

const FIELD_CLASS = "w-full px-3 py-2.5 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-sm outline-none";

export function CouponFormModal({
  coupon,
  onClose,
  onSaved,
}: {
  coupon: CouponCode | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(coupon);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema) as any,
    defaultValues: {
      code: coupon?.code ?? "",
      discount_type: coupon?.discount_type ?? "percentage",
      discount_value: coupon?.discount_value ?? 0,
      valid_from: coupon?.valid_from ? coupon.valid_from.split("T")[0] : null,
      valid_until: coupon?.valid_until ? coupon.valid_until.split("T")[0] : null,
      max_uses: coupon?.max_uses ?? null,
      applicable_tiers: coupon?.applicable_tiers ?? [],
      is_active: coupon?.is_active ?? true,
    },
  });

  useEffect(() => {
    fetchTiers().then(setTiers);
  }, []);

  const onSubmit = async (values: CouponFormValues) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        valid_from: values.valid_from || null,
        valid_until: values.valid_until || null,
        max_uses: values.max_uses || null,
        applicable_tiers: values.applicable_tiers?.length ? values.applicable_tiers : null,
      };

      const result = isEdit && coupon
        ? await updateCoupon(coupon.id, payload)
        : await createCoupon(payload);

      if (result.success) {
        toast.success(isEdit ? t("billing.coupon_updated") : t("billing.coupon_created"));
        onSaved();
      } else {
        toast.error(result.error ?? t("common.error"));
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleTier = (slug: string) => {
    const current = form.getValues("applicable_tiers") ?? [];
    form.setValue(
      "applicable_tiers",
      current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug]
    );
  };

  const selectedTiers = form.watch("applicable_tiers") ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-700">
          <h3 className="font-semibold text-base">
            {isEdit ? t("billing.edit_coupon") : t("billing.create_coupon")}
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-4 space-y-4">
          {/* Code */}
          <div>
            <label className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1">{t("billing.coupon_code")}</label>
            <input {...form.register("code")} className={FIELD_CLASS} placeholder="SUMMER2025" />
            {form.formState.errors.code && <p className="text-xs text-red-500 mt-1">{form.formState.errors.code.message}</p>}
          </div>

          {/* Discount type + value */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1">{t("billing.discount_type")}</label>
              <select {...form.register("discount_type")} className={FIELD_CLASS}>
                <option value="percentage">{t("billing.percentage")}</option>
                <option value="fixed">{t("billing.fixed")}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1">{t("billing.discount_value")}</label>
              <input {...form.register("discount_value")} type="number" min={0} step="0.01" className={FIELD_CLASS} />
              {form.formState.errors.discount_value && <p className="text-xs text-red-500 mt-1">{form.formState.errors.discount_value.message}</p>}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1">{t("billing.valid_from")}</label>
              <input {...form.register("valid_from")} type="date" className={FIELD_CLASS} />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1">{t("billing.valid_until")}</label>
              <input {...form.register("valid_until")} type="date" className={FIELD_CLASS} />
            </div>
          </div>

          {/* Max uses */}
          <div>
            <label className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1">{t("billing.max_uses")} <span className="text-surface-400 font-normal">({t("billing.optional")})</span></label>
            <input {...form.register("max_uses")} type="number" min={1} className={FIELD_CLASS} placeholder="∞" />
          </div>

          {/* Applicable tiers */}
          {tiers.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-2">{t("billing.applicable_tiers")} <span className="text-surface-400 font-normal">({t("billing.leave_empty_all")})</span></label>
              <div className="flex flex-wrap gap-2">
                {tiers.map((tier) => (
                  <button
                    key={tier.slug}
                    type="button"
                    onClick={() => toggleTier(tier.slug)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      selectedTiers.includes(tier.slug)
                        ? "bg-nexpo-500 border-nexpo-500 text-white"
                        : "border-surface-200 dark:border-surface-600 hover:border-nexpo-400"
                    }`}
                  >
                    {tier.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...form.register("is_active")} className="w-4 h-4 accent-nexpo-500" />
            <span className="text-sm">{t("billing.coupon_active")}</span>
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-surface-200 dark:border-surface-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-surface-200 dark:border-surface-600 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-nexpo-500 hover:bg-nexpo-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? t("common.save") : t("common.create")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
