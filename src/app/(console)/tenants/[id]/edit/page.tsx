"use client";

import { useEffect, useState, use } from "react";
import { fetchTenant } from "@/actions/tenant-actions";
import { TenantForm } from "@/components/tenants/tenant-form";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import type { Tenant } from "@/types/tenant";

export default function EditTenantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { t } = useTranslation();
  const router = useRouter();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTenant(Number(id)).then((data) => {
      setTenant(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 bg-surface-100 dark:bg-surface-700 rounded animate-pulse" />
        <div className="h-96 bg-surface-100 dark:bg-surface-700 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-center py-20">
        <p className="text-surface-400 mb-4">{t("tenants.not_found")}</p>
        <Button variant="secondary" onClick={() => router.push("/tenants")}>
          {t("common.back")}
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link
          href={`/tenants/${tenant.id}`}
          className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
        >
          <ArrowLeft size={20} className="text-surface-500" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-nexpo-50 dark:bg-nexpo-500/10 flex items-center justify-center">
            <Pencil size={20} className="text-nexpo-500" />
          </div>
          <h1 className="text-2xl font-bold">
            {t("tenants.edit_tenant")}: {tenant.name}
          </h1>
        </div>
      </div>
      <TenantForm tenant={tenant} mode="edit" />
    </div>
  );
}
