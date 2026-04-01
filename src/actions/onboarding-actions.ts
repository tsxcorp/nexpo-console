"use server";

import { getAdminClient } from "@/lib/server-client";
import { createItem, readItems } from "@directus/sdk";
import { randomUUID } from "crypto";

const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || "https://app.nexpo.vn";
const SERVICES_URL = process.env.NEXT_PUBLIC_SERVICES_URL || "https://services.nexpo.vn";
const ADMIN_APP_URL = process.env.NEXPO_ADMIN_URL || "https://platform.nexpo.vn";
const TENANT_ADMIN_ROLE_ID = "d8651e82-5b53-4ddc-8b5b-7e40f732983c";

/** Generate a random 12-char password with mixed chars */
function generatePassword(): string {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
}

/** Full tenant onboarding: resolve user → create tenant → link with invite token → send email */
export async function onboardTenantAction(data: {
  name: string;
  email: string;
  status?: string;
  subscription_tier?: string;
  default_language?: string;
  timezone?: string;
  admin_first_name: string;
  admin_last_name: string;
}) {
  const client = getAdminClient();
  const adminToken = process.env.DIRECTUS_ADMIN_TOKEN;

  try {
    // Step 1: Resolve user (find existing or create new)
    const password = generatePassword();
    let userId = "";
    let isExistingUser = false;

    const existingRes = await fetch(
      `${DIRECTUS_URL}/users?filter[email][_eq]=${encodeURIComponent(data.email)}&fields=id&limit=1`,
      { headers: { Authorization: `Bearer ${adminToken}` }, cache: "no-store" }
    );

    if (existingRes.ok) {
      const existing = await existingRes.json();
      if (existing.data?.length > 0) {
        userId = existing.data[0].id;
        isExistingUser = true;
      }
    }

    if (!isExistingUser) {
      const userRes = await fetch(`${DIRECTUS_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          first_name: data.admin_first_name,
          last_name: data.admin_last_name,
          email: data.email,
          password,
          role: TENANT_ADMIN_ROLE_ID,
          status: "active",
        }),
        cache: "no-store",
      });

      if (!userRes.ok) {
        const err = await userRes.json();
        return { success: false, error: err.errors?.[0]?.message || "Failed to create user" };
      }

      const userData = await userRes.json();
      userId = userData.data.id;
    }

    // Step 2: Create tenant + copy tier features if tier is set
    let features: string[] | null = null;
    if (data.subscription_tier) {
      const tiers = await client.request(readItems("subscription_tiers", {
        fields: ["features"],
        filter: { slug: { _eq: data.subscription_tier } },
        limit: 1,
      })) as { features: string[] | null }[];
      if (tiers.length > 0) features = tiers[0].features;
    }

    const tenant = await client.request(createItem("tenants", {
      name: data.name,
      email: data.email,
      status: data.status || "active",
      subscription_tier: data.subscription_tier || undefined,
      features,
      default_language: data.default_language || "vi",
      timezone: data.timezone || "Asia/Ho_Chi_Minh",
    })) as { id: number };

    // Step 3: Link user to tenant with invite token (48h expiry)
    const inviteToken = isExistingUser ? null : randomUUID();
    const inviteExpires = isExistingUser ? null : new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    await client.request(createItem("tenant_users", {
      tenant: tenant.id,
      user: userId,
      role: TENANT_ADMIN_ROLE_ID,
      role_type: "admin",
      is_active: true,
      invite_token: inviteToken,
      invite_expires: inviteExpires,
    }));

    // Step 4: Send email
    if (!isExistingUser && inviteToken) {
      // New user: invite email with set-password link
      const inviteUrl = `${ADMIN_APP_URL}/accept-invite?token=${inviteToken}`;
      try {
        await fetch(`${SERVICES_URL}/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            from_email: "Nexpo Platform <noreply@nexpo.vn>",
            to: data.email,
            subject: `Chào mừng đến Nexpo — Tài khoản ${data.name}`,
            html: buildWelcomeEmail({
              tenantName: data.name,
              firstName: data.admin_first_name,
              email: data.email,
              inviteUrl,
            }),
          }),
          cache: "no-store",
        });
      } catch {
        return { success: true, tenantId: tenant.id, userId, emailSent: false, isExistingUser };
      }
    } else if (isExistingUser) {
      // Existing user: notification email
      try {
        await fetch(`${SERVICES_URL}/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            from_email: "Nexpo Platform <noreply@nexpo.vn>",
            to: data.email,
            subject: `Bạn đã được thêm vào ${data.name} trên Nexpo`,
            html: buildAddedToTenantEmail({
              tenantName: data.name,
              loginUrl: `${ADMIN_APP_URL}/login`,
            }),
          }),
          cache: "no-store",
        });
      } catch {
        // Non-critical
      }
    }

    return { success: true, tenantId: tenant.id, userId, emailSent: true, isExistingUser };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/** Welcome email for new users — no password, just invite link */
function buildWelcomeEmail(params: {
  tenantName: string;
  firstName: string;
  email: string;
  inviteUrl: string;
}): string {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #4F80FF; font-size: 24px; margin: 0;">NEXPO</h1>
        <p style="color: #666; font-size: 14px; margin: 5px 0 0;">Business Platform & Exhibition Operations</p>
      </div>
      <div style="background: #f8fafc; border-radius: 12px; padding: 30px; border: 1px solid #e2e8f0;">
        <h2 style="color: #1a1a1a; font-size: 20px; margin: 0 0 15px;">Xin chào ${params.firstName},</h2>
        <p style="color: #404040; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
          Tài khoản <strong>${params.tenantName}</strong> đã được tạo trên nền tảng Nexpo.
          Nhấn nút bên dưới để đặt mật khẩu và bắt đầu sử dụng.
        </p>
        <div style="background: #fff; border-radius: 8px; padding: 16px 20px; border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="margin: 0; color: #666; font-size: 14px;">Email đăng nhập: <strong style="color: #1a1a1a;">${params.email}</strong></p>
        </div>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${params.inviteUrl}" style="display: inline-block; background: #4F80FF; color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Đặt mật khẩu & Đăng nhập
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 20px 0 0; border-top: 1px solid #e5e7eb; padding-top: 15px;">
          Link có hiệu lực trong 48 giờ. Nếu cần hỗ trợ, liên hệ <a href="mailto:contact@nexpo.vn" style="color: #4F80FF;">contact@nexpo.vn</a>
        </p>
      </div>
      <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 20px;">© ${new Date().getFullYear()} NEXPO. All rights reserved.</p>
    </div>`;
}

/** Notification email when existing user is added to a new tenant */
function buildAddedToTenantEmail(params: { tenantName: string; loginUrl: string }): string {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #4F80FF; font-size: 24px; margin: 0;">NEXPO</h1>
      </div>
      <div style="background: #f8fafc; border-radius: 12px; padding: 30px; border: 1px solid #e2e8f0;">
        <p style="color: #404040; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
          Bạn đã được thêm vào tổ chức <strong>${params.tenantName}</strong> trên Nexpo với vai trò <strong>Admin</strong>.
        </p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${params.loginUrl}" style="display: inline-block; background: #4F80FF; color: #fff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">Đăng nhập</a>
        </div>
      </div>
      <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 20px;">© ${new Date().getFullYear()} NEXPO. All rights reserved.</p>
    </div>`;
}
