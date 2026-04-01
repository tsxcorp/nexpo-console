"use server";

import { getAdminClient } from "@/lib/server-client";
import { createItem } from "@directus/sdk";

const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || "https://app.nexpo.vn";
const SERVICES_URL = process.env.NEXT_PUBLIC_SERVICES_URL || "https://services.nexpo.vn";
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

/** Full tenant onboarding: create tenant → create Directus user → link tenant_users → send welcome email */
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
    // Step 1: Create tenant
    const tenant = await client.request(createItem("tenants", {
      name: data.name,
      email: data.email,
      status: data.status || "active",
      subscription_tier: data.subscription_tier || undefined,
      default_language: data.default_language || "vi",
      timezone: data.timezone || "Asia/Ho_Chi_Minh",
    })) as { id: number };

    // Step 2: Find existing user or create new one
    const password = generatePassword();
    let userId = "";
    let isExistingUser = false;

    // Check if user already exists
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
      // Create new Directus user
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
        const msg = err.errors?.[0]?.message || "Failed to create user";
        return { success: false, error: `Tenant created but user creation failed: ${msg}`, tenantId: tenant.id };
      }

      const userData = await userRes.json();
      userId = userData.data.id;
    }

    // Step 3: Link user to tenant via tenant_users
    await client.request(createItem("tenant_users", {
      tenant: tenant.id,
      user: userId,
      role: TENANT_ADMIN_ROLE_ID,
      role_type: "admin",
      is_active: true,
    }));

    // Step 4: Send welcome email (only for new users — existing users already have credentials)
    if (!isExistingUser) {
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
              password,
              loginUrl: `https://platform.nexpo.vn/change-password?email=${encodeURIComponent(data.email)}&token=${encodeURIComponent(password)}`,
            }),
          }),
          cache: "no-store",
        });
      } catch {
        return {
          success: true,
          tenantId: tenant.id,
          userId,
          emailSent: false,
          isExistingUser,
          generatedPassword: password,
        };
      }
    }

    return {
      success: true,
      tenantId: tenant.id,
      userId,
      emailSent: !isExistingUser,
      isExistingUser,
    };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/** Build welcome email HTML */
function buildWelcomeEmail(params: {
  tenantName: string;
  firstName: string;
  email: string;
  password: string;
  loginUrl: string;
}): string {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #4F80FF; font-size: 24px; margin: 0;">NEXPO</h1>
        <p style="color: #666; font-size: 14px; margin: 5px 0 0;">Business Platform & Exhibition Operations</p>
      </div>

      <div style="background: #f8fafc; border-radius: 12px; padding: 30px; border: 1px solid #e2e8f0;">
        <h2 style="color: #1a1a1a; font-size: 20px; margin: 0 0 15px;">
          Xin chào ${params.firstName},
        </h2>
        <p style="color: #404040; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
          Tài khoản <strong>${params.tenantName}</strong> đã được tạo trên nền tảng Nexpo.
          Nhấn nút bên dưới để đặt mật khẩu và bắt đầu sử dụng.
        </p>

        <div style="background: #ffffff; border-radius: 8px; padding: 16px 20px; border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="margin: 0; color: #666; font-size: 14px;">Email đăng nhập: <strong style="color: #1a1a1a;">${params.email}</strong></p>
        </div>

        <div style="text-align: center; margin: 25px 0;">
          <a href="${params.loginUrl}"
             style="display: inline-block; background: #4F80FF; color: #ffffff; text-decoration: none;
                    padding: 14px 36px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Đặt mật khẩu & Đăng nhập
          </a>
        </div>

        <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 20px 0 0; border-top: 1px solid #e5e7eb; padding-top: 15px;">
          Link này chỉ sử dụng được một lần. Sau khi đặt mật khẩu, hãy dùng mật khẩu mới để đăng nhập.<br>
          Nếu bạn cần hỗ trợ, liên hệ <a href="mailto:contact@nexpo.vn" style="color: #4F80FF;">contact@nexpo.vn</a>
        </p>
      </div>

      <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 20px;">
        © ${new Date().getFullYear()} NEXPO. All rights reserved.
      </p>
    </div>
  `;
}
