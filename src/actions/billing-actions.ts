"use server";

import { getAdminClient } from "@/lib/server-client";
import { readItems, updateItem } from "@directus/sdk";
import type { TenantSubscription, TenantBillingInfo, SubscriptionPayment } from "@/types/tenant";

/** Fetch the current subscription record for a tenant */
export async function getTenantSubscription(
  tenantId: number
): Promise<TenantSubscription | null> {
  try {
    const client = getAdminClient();
    const items = await client.request(
      readItems("tenant_subscriptions", {
        fields: ["*"],
        filter: { tenant_id: { _eq: tenantId } },
        sort: ["-date_created"],
        limit: 1,
      })
    ) as TenantSubscription[];
    return items[0] ?? null;
  } catch {
    return null;
  }
}

/** Fetch payment history for a tenant */
export async function getTenantPaymentHistory(
  tenantId: number,
  limit = 20
): Promise<SubscriptionPayment[]> {
  try {
    const client = getAdminClient();
    return await client.request(
      readItems("subscription_payments", {
        fields: ["*"],
        filter: { tenant_id: { _eq: tenantId } },
        sort: ["-date_created"],
        limit,
      })
    ) as SubscriptionPayment[];
  } catch {
    return [];
  }
}

/** Fetch billing info (tax / invoice details) for a tenant */
export async function getTenantBillingInfo(
  tenantId: number
): Promise<TenantBillingInfo | null> {
  try {
    const client = getAdminClient();
    const items = await client.request(
      readItems("tenant_billing_info", {
        fields: ["*"],
        filter: { tenant_id: { _eq: tenantId } },
        limit: 1,
      })
    ) as TenantBillingInfo[];
    return items[0] ?? null;
  } catch {
    return null;
  }
}

type OverrideAction = "activate" | "suspend" | "cancel";

const ACTION_STATUS_MAP: Record<OverrideAction, TenantSubscription["status"]> = {
  activate: "active",
  suspend: "suspended",
  cancel: "cancelled",
};

/**
 * Manually override the subscription status for a tenant.
 * Optionally change the tier when action is "activate".
 */
export async function manualSubscriptionOverride(
  tenantId: number,
  action: OverrideAction,
  tierSlug?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getAdminClient();

    // Find existing subscription
    const existing = await client.request(
      readItems("tenant_subscriptions", {
        fields: ["id"],
        filter: { tenant_id: { _eq: tenantId } },
        sort: ["-date_created"],
        limit: 1,
      })
    ) as Array<{ id: string }>;

    if (!existing.length) {
      return { success: false, error: "No subscription found for this tenant" };
    }

    const newStatus = ACTION_STATUS_MAP[action];
    await client.request(
      updateItem("tenant_subscriptions", existing[0].id, {
        status: newStatus,
        provider: "manual",
      })
    );

    // If activating with a tier change, update tenant record too
    if (action === "activate" && tierSlug) {
      await client.request(
        updateItem("tenants", tenantId, { subscription_tier: tierSlug })
      );
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
