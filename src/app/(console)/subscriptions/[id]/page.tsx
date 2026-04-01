"use client";

import { useEffect, useState, use } from "react";
import { useTranslation } from "react-i18next";
import { fetchTier } from "@/actions/subscription-actions";
import { TierForm } from "@/components/subscriptions/tier-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import type { SubscriptionTier } from "@/types/subscription";
import Link from "next/link";

export default function TierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useTranslation();
  const router = useRouter();
  const [tier, setTier] = useState<SubscriptionTier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTier(id).then((data) => {
      setTier(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return <div className="h-96 bg-surface-100 dark:bg-surface-800 rounded-xl animate-pulse" />;
  }

  if (!tier) {
    return (
      <div className="text-center py-20">
        <p className="text-surface-400 mb-4">Tier not found</p>
        <Button variant="secondary" onClick={() => router.push("/subscriptions")}>
          {t("common.back")}
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link href="/subscriptions" className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">
          <ArrowLeft size={20} className="text-surface-500" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-nexpo-50 dark:bg-nexpo-500/10 flex items-center justify-center">
            <Pencil size={20} className="text-nexpo-500" />
          </div>
          <h1 className="text-2xl font-bold">{t("subscriptions.edit_tier")}: {tier.name}</h1>
        </div>
      </div>
      <TierForm tier={tier} mode="edit" />
    </div>
  );
}
