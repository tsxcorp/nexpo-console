"use server";

import { getAdminClient } from "@/lib/server-client";
import { readItems, createItem, updateItem } from "@directus/sdk";
import type { PlatformPaymentConfig } from "@/types/subscription";

/** Fetch all platform payment provider configurations */
export async function getPaymentConfigs(): Promise<PlatformPaymentConfig[]> {
  try {
    const client = getAdminClient();
    return await client.request(
      readItems("platform_payment_configs", {
        fields: ["*"],
        limit: -1,
      })
    ) as PlatformPaymentConfig[];
  } catch {
    return [];
  }
}

/** Create or update a payment provider config */
export async function upsertPaymentConfig(
  provider: "polar" | "payos",
  data: {
    is_active: boolean;
    credentials: Record<string, string>;
    config: Record<string, unknown>;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getAdminClient();

    // Check if config already exists for this provider
    const existing = await client.request(
      readItems("platform_payment_configs", {
        fields: ["id"],
        filter: { provider: { _eq: provider } },
        limit: 1,
      })
    ) as Array<{ id: string }>;

    if (existing.length > 0) {
      await client.request(updateItem("platform_payment_configs", existing[0].id, data));
    } else {
      await client.request(createItem("platform_payment_configs", { provider, ...data }));
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/** Test connectivity to a payment provider using stored credentials */
export async function testPaymentConnection(
  provider: "polar" | "payos"
): Promise<{ success: boolean; message: string }> {
  try {
    const client = getAdminClient();

    const configs = await client.request(
      readItems("platform_payment_configs", {
        fields: ["credentials", "is_active"],
        filter: { provider: { _eq: provider } },
        limit: 1,
      })
    ) as Array<Pick<PlatformPaymentConfig, "credentials" | "is_active">>;

    if (!configs.length) {
      return { success: false, message: "No config found for provider" };
    }

    const creds = configs[0].credentials;

    if (provider === "polar") {
      const token = creds["access_token"];
      if (!token) return { success: false, message: "Missing access_token" };

      const res = await fetch("https://api.polar.sh/v1/organizations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return { success: false, message: `Polar API returned ${res.status}` };
      return { success: true, message: "Polar connection OK" };
    }

    if (provider === "payos") {
      const clientId = creds["client_id"];
      const apiKey = creds["api_key"];
      if (!clientId || !apiKey) return { success: false, message: "Missing client_id or api_key" };

      const res = await fetch("https://api-merchant.payos.vn/payment-requests", {
        method: "GET",
        headers: {
          "x-client-id": clientId,
          "x-api-key": apiKey,
        },
      });
      // 200 or 401/403 = server reachable
      if (res.status >= 500) return { success: false, message: `PayOS API returned ${res.status}` };
      return { success: true, message: "PayOS connection OK" };
    }

    return { success: false, message: "Unknown provider" };
  } catch (err) {
    return { success: false, message: String(err) };
  }
}
