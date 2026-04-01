"use client";

import { Suspense } from "react";
import { TierListWithMatrix } from "@/components/subscriptions/tier-list-with-matrix";

export default function SubscriptionsPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-96 bg-surface-100 dark:bg-surface-800 rounded-xl" />}>
      <TierListWithMatrix />
    </Suspense>
  );
}
