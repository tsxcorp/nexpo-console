"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export function TenantStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
      status === "active"
        ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
        : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
    )}>
      <span className={cn(
        "w-1.5 h-1.5 rounded-full mr-1.5",
        status === "active" ? "bg-green-500" : "bg-red-500"
      )} />
      {status === "active" ? t("tenants.active") : t("tenants.inactive")}
    </span>
  );
}

export function TierBadge({ tier }: { tier: string | null }) {
  if (!tier) return <span className="text-surface-400 text-xs">—</span>;

  const colors: Record<string, string> = {
    free: "bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-300",
    starter: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
    pro: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
    enterprise: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
  };

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize",
      colors[tier] ?? colors.free
    )}>
      {tier}
    </span>
  );
}
