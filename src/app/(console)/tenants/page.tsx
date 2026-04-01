"use client";

import { Suspense } from "react";
import { TenantListTable } from "@/components/tenants/tenant-list-table";

export default function TenantsPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-96 bg-surface-100 dark:bg-surface-800 rounded-xl" />}>
      <TenantListTable />
    </Suspense>
  );
}
