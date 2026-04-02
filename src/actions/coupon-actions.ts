"use server";

import { getAdminClient } from "@/lib/server-client";
import { readItems, createItem, updateItem, deleteItem } from "@directus/sdk";
import type { CouponCode } from "@/types/subscription";

interface CouponListParams {
  page?: number;
  limit?: number;
  search?: string;
}

/** Fetch coupons with pagination and optional search */
export async function getCoupons(params: CouponListParams = {}): Promise<{
  data: CouponCode[];
  total: number;
}> {
  try {
    const { page = 1, limit = 25, search } = params;
    const client = getAdminClient();

    const filter = search
      ? { code: { _icontains: search } }
      : undefined;

    const [items, countResult] = await Promise.all([
      client.request(
        readItems("coupon_codes", {
          fields: ["*"],
          limit,
          offset: (page - 1) * limit,
          sort: ["-date_created"],
          ...(filter ? { filter } : {}),
        })
      ) as Promise<CouponCode[]>,
      client.request(
        readItems("coupon_codes", {
          fields: ["id"],
          limit: -1,
          ...(filter ? { filter } : {}),
        })
      ) as Promise<Array<{ id: string }>>,
    ]);

    return { data: items, total: countResult.length };
  } catch {
    return { data: [], total: 0 };
  }
}

/** Create a new coupon code */
export async function createCoupon(
  data: Omit<CouponCode, "id" | "current_uses" | "date_created">
): Promise<{ success: boolean; data?: CouponCode; error?: string }> {
  try {
    const client = getAdminClient();
    const coupon = await client.request(
      createItem("coupon_codes", { ...data, current_uses: 0 })
    ) as CouponCode;
    return { success: true, data: coupon };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/** Update an existing coupon code */
export async function updateCoupon(
  id: string,
  data: Partial<Omit<CouponCode, "id" | "date_created">>
): Promise<{ success: boolean; data?: CouponCode; error?: string }> {
  try {
    const client = getAdminClient();
    const coupon = await client.request(
      updateItem("coupon_codes", id, data)
    ) as CouponCode;
    return { success: true, data: coupon };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/** Delete a coupon code */
export async function deleteCoupon(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getAdminClient();
    await client.request(deleteItem("coupon_codes", id));
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
