"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createTenantAction, updateTenantAction } from "@/actions/tenant-actions";
import { toast } from "sonner";
import type { Tenant } from "@/types/tenant";

const tenantSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  status: z.enum(["active", "inactive"]),
  subscription_tier: z.enum(["free", "starter", "pro", "enterprise", ""]).optional(),
  default_language: z.enum(["en", "vi", ""]).optional(),
  timezone: z.string().optional(),
});

type TenantFormData = z.infer<typeof tenantSchema>;

const TIMEZONES = [
  "Asia/Ho_Chi_Minh", "Asia/Bangkok", "Asia/Singapore", "Asia/Tokyo",
  "Asia/Seoul", "Asia/Shanghai", "Asia/Jakarta", "Europe/London",
  "Europe/Paris", "America/New_York", "America/Los_Angeles",
];

interface TenantFormProps {
  tenant?: Tenant;
  mode: "create" | "edit";
}

export function TenantForm({ tenant, mode }: TenantFormProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: tenant?.name ?? "",
      email: tenant?.email ?? "",
      status: tenant?.status ?? "active",
      subscription_tier: tenant?.subscription_tier ?? "",
      default_language: tenant?.default_language ?? "vi",
      timezone: tenant?.timezone ?? "Asia/Ho_Chi_Minh",
    },
  });

  const onSubmit = async (data: TenantFormData) => {
    const payload = {
      ...data,
      subscription_tier: data.subscription_tier || undefined,
      default_language: data.default_language || undefined,
    };

    const result = mode === "create"
      ? await createTenantAction(payload)
      : await updateTenantAction(tenant!.id, payload);

    if (result.success) {
      toast.success(t(mode === "create" ? "tenants.created_success" : "tenants.updated_success"));
      router.push("/tenants");
    } else {
      toast.error(result.error);
    }
  };

  const fieldClass = "w-full px-3 py-2.5 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-sm outline-none transition-all";
  const labelClass = "block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5";
  const errorClass = "text-xs text-red-500 mt-1";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-5">
      <div>
        <label className={labelClass}>{t("tenants.name")} *</label>
        <input {...register("name")} className={fieldClass} placeholder="Tên tổ chức" />
        {errors.name && <p className={errorClass}>{errors.name.message}</p>}
      </div>

      <div>
        <label className={labelClass}>{t("tenants.email")} *</label>
        <input {...register("email")} type="email" className={fieldClass} placeholder="contact@example.com" />
        {errors.email && <p className={errorClass}>{errors.email.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>{t("tenants.status")}</label>
          <select {...register("status")} className={fieldClass}>
            <option value="active">{t("tenants.active")}</option>
            <option value="inactive">{t("tenants.inactive")}</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>{t("tenants.tier")}</label>
          <select {...register("subscription_tier")} className={fieldClass}>
            <option value="">—</option>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>{t("tenants.language")}</label>
          <select {...register("default_language")} className={fieldClass}>
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>{t("tenants.timezone")}</label>
          <select {...register("timezone")} className={fieldClass}>
            {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
          </select>
        </div>
      </div>

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
