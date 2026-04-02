"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { fetchTenant, toggleTenantStatusAction } from "@/actions/tenant-actions";
import { TenantDetailTabs } from "@/components/tenants/tenant-detail-tabs";
import { TenantStatusBadge } from "@/components/tenants/tenant-status-badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil } from "lucide-react";
import { toast } from "sonner";
import type { Tenant } from "@/types/tenant";
import Link from "next/link";

export default function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

  const handleToggleStatus = async () => {
    if (!tenant) return;
    const newStatus = tenant.status === "active" ? "inactive" : "active";
    const msg = newStatus === "active" ? t("tenants.confirm_activate") : t("tenants.confirm_deactivate");
    if (!confirm(msg)) return;

    const result = await toggleTenantStatusAction(tenant.id, newStatus);
    if (result.success) {
      toast.success(t("tenants.status_updated"));
      setTenant({ ...tenant, status: newStatus });
    } else {
      toast.error(result.error);
    }
  };

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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/tenants" className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">
            <ArrowLeft size={20} className="text-surface-500" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{tenant.name}</h1>
              <TenantStatusBadge status={tenant.status} />
            </div>
            <p className="text-sm text-surface-500 mt-0.5">{tenant.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleStatus}
            className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
              tenant.status === "active"
                ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                : "text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10"
            }`}
          >
            {tenant.status === "active" ? t("tenants.deactivate") : t("tenants.activate")}
          </button>
          <Link href={`/tenants/${tenant.id}/edit`}>
            <Button variant="secondary" size="sm" className="gap-2">
              <Pencil size={14} /> {t("common.edit")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <TenantDetailTabs tenant={tenant} />
    </div>
  );
}
