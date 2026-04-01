"use server";

import { getAdminClient } from "@/lib/server-client";
import { readItems, readItem, createItem, updateItem } from "@directus/sdk";
import type { SubscriptionTier } from "@/types/subscription";

/** Fetch all subscription tiers sorted by sort_order */
export async function fetchTiers(): Promise<SubscriptionTier[]> {
  const client = getAdminClient();
  return client.request(readItems("subscription_tiers", {
    fields: ["*"],
    sort: ["sort_order"],
    limit: -1,
  })) as Promise<SubscriptionTier[]>;
}

/** Fetch a single tier by ID */
export async function fetchTier(id: string): Promise<SubscriptionTier | null> {
  try {
    const client = getAdminClient();
    return await client.request(readItem("subscription_tiers", id, {
      fields: ["*"],
    })) as SubscriptionTier;
  } catch {
    return null;
  }
}

/** Create a new tier */
export async function createTierAction(data: Omit<SubscriptionTier, "id">) {
  try {
    const client = getAdminClient();
    const tier = await client.request(createItem("subscription_tiers", data));
    return { success: true, data: tier };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/** Update an existing tier */
export async function updateTierAction(id: string, data: Partial<SubscriptionTier>) {
  try {
    const client = getAdminClient();
    const tier = await client.request(updateItem("subscription_tiers", id, data));
    return { success: true, data: tier };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/** Assign tier to tenant: copies tier features → tenant.features, sets subscription_tier */
export async function assignTierToTenantAction(tenantId: number, tierSlug: string) {
  try {
    const client = getAdminClient();

    // Fetch tier to get its features
    const tiers = await client.request(readItems("subscription_tiers", {
      fields: ["features"],
      filter: { slug: { _eq: tierSlug } },
      limit: 1,
    })) as SubscriptionTier[];

    if (!tiers.length) return { success: false, error: "Tier not found" };

    // Update tenant with tier + copy features
    await client.request(updateItem("tenants", tenantId, {
      subscription_tier: tierSlug,
      features: tiers[0].features,
    }));

    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/** Toggle individual feature on a tenant */
export async function toggleTenantFeatureAction(tenantId: number, currentFeatures: string[], feature: string, enabled: boolean) {
  try {
    const client = getAdminClient();
    const newFeatures = enabled
      ? [...currentFeatures, feature]
      : currentFeatures.filter((f) => f !== feature);

    await client.request(updateItem("tenants", tenantId, { features: newFeatures }));
    return { success: true, features: newFeatures };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
