"use client";

import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createTierAction, updateTierAction } from "@/actions/subscription-actions";
import { FEATURE_SLUGS } from "@/types/subscription";
import type { SubscriptionTier } from "@/types/subscription";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type TierFormData = {
  name: string;
  slug: string;
  description?: string;
  max_events?: number | null;
  max_exhibitors?: number | null;
  max_registrations?: number | null;
  max_users?: number | null;
  price_monthly: number;
  price_yearly: number;
  sort_order: number;
  is_active: boolean;
};

interface TierFormProps {
  tier?: SubscriptionTier;
  mode: "create" | "edit";
}

export function TierForm({ tier, mode }: TierFormProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<TierFormData>({
    defaultValues: {
      name: tier?.name ?? "",
      slug: tier?.slug ?? "",
      description: tier?.description ?? "",
      max_events: tier?.max_events,
      max_exhibitors: tier?.max_exhibitors,
      max_registrations: tier?.max_registrations,
      max_users: tier?.max_users,
      price_monthly: Number(tier?.price_monthly ?? 0),
      price_yearly: Number(tier?.price_yearly ?? 0),
      sort_order: tier?.sort_order ?? 0,
      is_active: tier?.is_active ?? true,
    },
  });

  // Manage features as separate state since it's an array
  const features = tier?.features ?? [];
  const toggleFeature = (feature: string) => {
    // Features managed outside react-hook-form, stored in a ref-like approach
    const el = document.getElementById(`feature-${feature}`) as HTMLInputElement;
    el?.click();
  };

  const onSubmit = async (data: TierFormData) => {
    // Collect features from checkboxes
    const selectedFeatures = FEATURE_SLUGS.filter((f) => {
      const el = document.getElementById(`feature-${f}`) as HTMLInputElement;
      return el?.checked;
    });

    const payload = {
      ...data,
      features: selectedFeatures,
      // Convert empty strings / 0 to null for unlimited
      max_events: data.max_events || null,
      max_exhibitors: data.max_exhibitors || null,
      max_registrations: data.max_registrations || null,
      max_users: data.max_users || null,
    };

    const result = mode === "create"
      ? await createTierAction(payload as unknown as Omit<SubscriptionTier, "id">)
      : await updateTierAction(tier!.id, payload);

    if (result.success) {
      toast.success(t(mode === "create" ? "subscriptions.created_success" : "subscriptions.updated_success"));
      router.push("/subscriptions");
    } else {
      toast.error(result.error);
    }
  };

  const fieldClass = "w-full px-3 py-2.5 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-sm outline-none";
  const labelClass = "block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>{t("subscriptions.tier_name")} *</label>
          <input {...register("name")} className={fieldClass} />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className={labelClass}>{t("subscriptions.slug")} *</label>
          <input {...register("slug")} className={fieldClass} placeholder="e.g. starter" />
        </div>
      </div>

      <div>
        <label className={labelClass}>{t("subscriptions.description")}</label>
        <textarea {...register("description")} className={cn(fieldClass, "h-20 resize-none")} />
      </div>

      {/* Features checkboxes */}
      <div>
        <label className={labelClass}>{t("subscriptions.features")}</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {FEATURE_SLUGS.map((f) => (
            <label key={f} className="flex items-center gap-2 px-3 py-2 bg-surface-50 dark:bg-surface-700/30 rounded-lg cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-700/50 transition-colors">
              <input
                id={`feature-${f}`}
                type="checkbox"
                defaultChecked={features.includes(f)}
                className="rounded border-surface-300"
              />
              <span className="text-sm">{t(`features.${f}`, f)}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Quotas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <label className={labelClass}>{t("subscriptions.max_events")}</label>
          <input {...register("max_events")} type="number" className={fieldClass} placeholder="∞" />
        </div>
        <div>
          <label className={labelClass}>{t("subscriptions.max_exhibitors")}</label>
          <input {...register("max_exhibitors")} type="number" className={fieldClass} placeholder="∞" />
        </div>
        <div>
          <label className={labelClass}>{t("subscriptions.max_registrations")}</label>
          <input {...register("max_registrations")} type="number" className={fieldClass} placeholder="∞" />
        </div>
        <div>
          <label className={labelClass}>{t("subscriptions.max_users")}</label>
          <input {...register("max_users")} type="number" className={fieldClass} placeholder="∞" />
        </div>
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>{t("subscriptions.price_monthly")} (VND)</label>
          <input {...register("price_monthly")} type="number" className={fieldClass} />
        </div>
        <div>
          <label className={labelClass}>{t("subscriptions.price_yearly")} (VND)</label>
          <input {...register("price_yearly")} type="number" className={fieldClass} />
        </div>
        <div>
          <label className={labelClass}>{t("subscriptions.sort_order")}</label>
          <input {...register("sort_order")} type="number" className={fieldClass} />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input {...register("is_active")} type="checkbox" className="rounded border-surface-300" />
        <span className="text-sm font-medium">{t("subscriptions.is_active")}</span>
      </label>

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("common.loading") : t("common.save")}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}
