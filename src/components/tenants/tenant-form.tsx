"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateTenantAction } from "@/actions/tenant-actions";
import { onboardTenantAction } from "@/actions/onboarding-actions";
import { toast } from "sonner";
import type { Tenant } from "@/types/tenant";

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  status: z.enum(["active", "inactive"]),
  subscription_tier: z.enum(["free", "starter", "pro", "enterprise", ""]).optional(),
  default_language: z.enum(["en", "vi", ""]).optional(),
  timezone: z.string().optional(),
  admin_first_name: z.string().min(1, "First name is required"),
  admin_last_name: z.string().min(1, "Last name is required"),
  admin_email: z.string().email("Invalid email"),
});

const editSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  status: z.enum(["active", "inactive"]),
  subscription_tier: z.enum(["free", "starter", "pro", "enterprise", ""]).optional(),
  default_language: z.enum(["en", "vi", ""]).optional(),
  timezone: z.string().optional(),
});

type CreateFormData = z.infer<typeof createSchema>;
type EditFormData = z.infer<typeof editSchema>;

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

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateFormData | EditFormData>({
    resolver: zodResolver(mode === "create" ? createSchema : editSchema),
    defaultValues: {
      name: tenant?.name ?? "",
      email: tenant?.email ?? "",
      status: tenant?.status ?? "active",
      subscription_tier: tenant?.subscription_tier ?? "",
      default_language: tenant?.default_language ?? "vi",
      timezone: tenant?.timezone ?? "Asia/Ho_Chi_Minh",
      ...(mode === "create" ? { admin_first_name: "", admin_last_name: "", admin_email: "" } : {}),
    },
  });

  const onSubmit = async (data: CreateFormData | EditFormData) => {
    if (mode === "create") {
      const d = data as CreateFormData;
      const result = await onboardTenantAction({
        name: d.name,
        email: d.email,
        status: d.status,
        subscription_tier: d.subscription_tier || undefined,
        default_language: d.default_language || undefined,
        timezone: d.timezone,
        admin_first_name: d.admin_first_name,
        admin_last_name: d.admin_last_name,
        admin_email: d.admin_email,
      });

      if (result.success) {
        if ('emailSent' in result && result.emailSent === false) {
          toast.warning(`${t("tenants.created_success")} — Email gửi thất bại. Password: ${'generatedPassword' in result ? result.generatedPassword : ''}`);
        } else {
          toast.success(t("tenants.created_success"));
        }
        router.push("/tenants");
      } else {
        toast.error(result.error);
      }
    } else {
      const d = data as EditFormData;
      const result = await updateTenantAction(tenant!.id, {
        ...d,
        subscription_tier: d.subscription_tier || undefined,
        default_language: d.default_language || undefined,
      } as Partial<Tenant>);

      if (result.success) {
        toast.success(t("tenants.updated_success"));
        router.push("/tenants");
      } else {
        toast.error(result.error);
      }
    }
  };

  const fieldClass = "w-full px-3 py-2.5 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-sm outline-none transition-all";
  const labelClass = "block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5";
  const errorClass = "text-xs text-red-500 mt-1";
  const errs = errors as Record<string, { message?: string }>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-5">
      {/* Tenant info section */}
      <div className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-1">
        {t("tenants.tenant_detail")}
      </div>

      <div>
        <label className={labelClass}>{t("tenants.name")} *</label>
        <input {...register("name")} className={fieldClass} placeholder="Tên tổ chức" />
        {errs.name && <p className={errorClass}>{errs.name.message}</p>}
      </div>

      <div>
        <label className={labelClass}>{t("tenants.email")} *</label>
        <input {...register("email")} type="email" className={fieldClass} placeholder="contact@example.com" />
        {errs.email && <p className={errorClass}>{errs.email.message}</p>}
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

      {/* Admin user section — only in create mode */}
      {mode === "create" && (
        <>
          <div className="border-t border-surface-200 dark:border-surface-700 pt-5 mt-6">
            <div className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-3">
              Admin User — Tenant Admin
            </div>
            <p className="text-xs text-surface-400 mb-4">
              Hệ thống sẽ tạo tài khoản Directus với role Tenant Admin và gửi email kèm mật khẩu.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Họ *</label>
              <input {...(register as Function)("admin_first_name")} className={fieldClass} placeholder="Nguyễn" />
              {errs.admin_first_name && <p className={errorClass}>{errs.admin_first_name.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Tên *</label>
              <input {...(register as Function)("admin_last_name")} className={fieldClass} placeholder="Văn A" />
              {errs.admin_last_name && <p className={errorClass}>{errs.admin_last_name.message}</p>}
            </div>
          </div>

          <div>
            <label className={labelClass}>Email đăng nhập *</label>
            <input {...(register as Function)("admin_email")} type="email" className={fieldClass} placeholder="admin@company.com" />
            {errs.admin_email && <p className={errorClass}>{errs.admin_email.message}</p>}
          </div>
        </>
      )}

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("common.loading") : mode === "create" ? t("tenants.create_tenant") : t("common.save")}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}
