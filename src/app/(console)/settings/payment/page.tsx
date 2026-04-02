"use client";

import { useEffect, useState } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { CreditCard, Zap, CheckCircle, XCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { getPaymentConfigs, upsertPaymentConfig, testPaymentConnection } from "@/actions/payment-config-actions";
import type { PlatformPaymentConfig } from "@/types/subscription";

const polarSchema = z.object({
  access_token: z.string().min(1, "Required"),
  webhook_secret: z.string().min(1, "Required"),
  organization_id: z.string().min(1, "Required"),
  is_active: z.boolean(),
});

const payosSchema = z.object({
  client_id: z.string().min(1, "Required"),
  api_key: z.string().min(1, "Required"),
  checksum_key: z.string().min(1, "Required"),
  is_active: z.boolean(),
});

type PolarForm = z.infer<typeof polarSchema>;
type PayOSForm = z.infer<typeof payosSchema>;

export default function PaymentConfigPage() {
  const { t } = useTranslation();
  const [configs, setConfigs] = useState<PlatformPaymentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingPolar, setTestingPolar] = useState(false);
  const [testingPayos, setTestingPayos] = useState(false);

  useEffect(() => {
    getPaymentConfigs().then((data) => {
      setConfigs(data);
      setLoading(false);
    });
  }, []);

  const polarConfig = configs.find((c) => c.provider === "polar");
  const payosConfig = configs.find((c) => c.provider === "payos");

  const handleTestConnection = async (provider: "polar" | "payos") => {
    const setTesting = provider === "polar" ? setTestingPolar : setTestingPayos;
    setTesting(true);
    try {
      const result = await testPaymentConnection(provider);
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
    } finally {
      setTesting(false);
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
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl bg-nexpo-50 dark:bg-nexpo-500/10 flex items-center justify-center">
          <CreditCard size={18} className="text-nexpo-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold">{t("billing.payment_providers")}</h2>
          <p className="text-sm text-surface-500">{t("billing.payment_providers_desc")}</p>
        </div>
      </div>

      <PolarConfigCard
        existing={polarConfig}
        onTest={() => handleTestConnection("polar")}
        testing={testingPolar}
        onSaved={(updated) => setConfigs((prev) =>
          prev.some((c) => c.provider === "polar")
            ? prev.map((c) => c.provider === "polar" ? updated : c)
            : [...prev, updated]
        )}
      />

      <PayOSConfigCard
        existing={payosConfig}
        onTest={() => handleTestConnection("payos")}
        testing={testingPayos}
        onSaved={(updated) => setConfigs((prev) =>
          prev.some((c) => c.provider === "payos")
            ? prev.map((c) => c.provider === "payos" ? updated : c)
            : [...prev, updated]
        )}
      />
    </div>
  );
}

function PolarConfigCard({
  existing,
  onTest,
  testing,
  onSaved,
}: {
  existing?: PlatformPaymentConfig;
  onTest: () => void;
  testing: boolean;
  onSaved: (c: PlatformPaymentConfig) => void;
}) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);

  const form = useForm<PolarForm>({
    resolver: zodResolver(polarSchema),
    defaultValues: {
      access_token: existing?.credentials["access_token"] ?? "",
      webhook_secret: existing?.credentials["webhook_secret"] ?? "",
      organization_id: existing?.credentials["organization_id"] ?? "",
      is_active: existing?.is_active ?? false,
    },
  });

  const onSubmit = async (values: PolarForm) => {
    setSaving(true);
    const { is_active, ...creds } = values;
    const result = await upsertPaymentConfig("polar", {
      is_active,
      credentials: creds as Record<string, string>,
      config: {},
    });
    setSaving(false);
    if (result.success) {
      toast.success(t("billing.config_saved"));
      onSaved({ id: existing?.id ?? "", provider: "polar", is_active, credentials: creds as Record<string, string>, config: {}, date_created: null, date_updated: null });
    } else {
      toast.error(result.error ?? t("common.error"));
    }
  };

  return (
    <ProviderCard
      icon={<Zap size={18} />}
      title="Polar"
      description={t("billing.polar_desc")}
      isActive={existing?.is_active ?? false}
      onTest={onTest}
      testing={testing}
      onSubmit={form.handleSubmit(onSubmit)}
      saving={saving}
    >
      <MaskedField label="Access Token" id="polar_token" register={form.register("access_token")} error={form.formState.errors.access_token?.message} />
      <MaskedField label="Webhook Secret" id="polar_webhook" register={form.register("webhook_secret")} error={form.formState.errors.webhook_secret?.message} />
      <div>
        <label className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1">Organization ID</label>
        <input {...form.register("organization_id")} className="w-full px-3 py-2.5 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-sm outline-none" placeholder="org_..." />
        {form.formState.errors.organization_id && <p className="text-xs text-red-500 mt-1">{form.formState.errors.organization_id.message}</p>}
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" {...form.register("is_active")} className="w-4 h-4 accent-nexpo-500" />
        <span className="text-sm">{t("billing.enable_provider")}</span>
      </label>
    </ProviderCard>
  );
}

function PayOSConfigCard({
  existing,
  onTest,
  testing,
  onSaved,
}: {
  existing?: PlatformPaymentConfig;
  onTest: () => void;
  testing: boolean;
  onSaved: (c: PlatformPaymentConfig) => void;
}) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);

  const form = useForm<PayOSForm>({
    resolver: zodResolver(payosSchema),
    defaultValues: {
      client_id: existing?.credentials["client_id"] ?? "",
      api_key: existing?.credentials["api_key"] ?? "",
      checksum_key: existing?.credentials["checksum_key"] ?? "",
      is_active: existing?.is_active ?? false,
    },
  });

  const onSubmit = async (values: PayOSForm) => {
    setSaving(true);
    const { is_active, ...creds } = values;
    const result = await upsertPaymentConfig("payos", {
      is_active,
      credentials: creds as Record<string, string>,
      config: {},
    });
    setSaving(false);
    if (result.success) {
      toast.success(t("billing.config_saved"));
      onSaved({ id: existing?.id ?? "", provider: "payos", is_active, credentials: creds as Record<string, string>, config: {}, date_created: null, date_updated: null });
    } else {
      toast.error(result.error ?? t("common.error"));
    }
  };

  return (
    <ProviderCard
      icon={<CreditCard size={18} />}
      title="PayOS"
      description={t("billing.payos_desc")}
      isActive={existing?.is_active ?? false}
      onTest={onTest}
      testing={testing}
      onSubmit={form.handleSubmit(onSubmit)}
      saving={saving}
    >
      <MaskedField label="Client ID" id="payos_client" register={form.register("client_id")} error={form.formState.errors.client_id?.message} />
      <MaskedField label="API Key" id="payos_key" register={form.register("api_key")} error={form.formState.errors.api_key?.message} />
      <MaskedField label="Checksum Key" id="payos_checksum" register={form.register("checksum_key")} error={form.formState.errors.checksum_key?.message} />
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" {...form.register("is_active")} className="w-4 h-4 accent-nexpo-500" />
        <span className="text-sm">{t("billing.enable_provider")}</span>
      </label>
    </ProviderCard>
  );
}

function ProviderCard({
  icon,
  title,
  description,
  isActive,
  onTest,
  testing,
  onSubmit,
  saving,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  isActive: boolean;
  onTest: () => void;
  testing: boolean;
  onSubmit: React.FormEventHandler;
  saving: boolean;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <form onSubmit={onSubmit} className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-surface-50 dark:bg-surface-700 flex items-center justify-center text-surface-600 dark:text-surface-300">
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{title}</h3>
              {isActive
                ? <CheckCircle size={14} className="text-green-500" />
                : <XCircle size={14} className="text-surface-400" />
              }
            </div>
            <p className="text-xs text-surface-400">{description}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onTest}
          disabled={testing}
          className="text-xs px-3 py-1.5 border border-surface-200 dark:border-surface-600 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
          {testing && <Loader2 size={12} className="animate-spin" />}
          {t("billing.test_connection")}
        </button>
      </div>

      <div className="space-y-3">{children}</div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-nexpo-500 hover:bg-nexpo-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {t("common.save")}
        </button>
      </div>
    </form>
  );
}

const FIELD_CLASS = "w-full px-3 py-2.5 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-sm outline-none";

function MaskedField({
  label,
  id,
  register,
  error,
}: {
  label: string;
  id: string;
  register: UseFormRegisterReturn;
  error?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          {...register}
          className={`${FIELD_CLASS} pr-9`}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
        >
          {visible ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
