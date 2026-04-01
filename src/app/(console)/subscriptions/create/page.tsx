"use client";

import { useTranslation } from "react-i18next";
import { TierForm } from "@/components/subscriptions/tier-form";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";

export default function CreateTierPage() {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link href="/subscriptions" className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">
          <ArrowLeft size={20} className="text-surface-500" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-nexpo-50 dark:bg-nexpo-500/10 flex items-center justify-center">
            <Plus size={20} className="text-nexpo-500" />
          </div>
          <h1 className="text-2xl font-bold">{t("subscriptions.create_tier")}</h1>
        </div>
      </div>
      <TierForm mode="create" />
    </div>
  );
}
