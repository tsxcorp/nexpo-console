"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerClient } from "@/lib/server-client";
import { readMe } from "@directus/sdk";

const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://app.nexpo.vn';

export async function loginAction(prevState: unknown, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "error_required" };
  }

  try {
    const res = await fetch(`${DIRECTUS_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, mode: "json" }),
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: "error_invalid" };
    }

    const { access_token, refresh_token, expires } = data.data;

    // Verify user has Super Admin role before setting cookies
    const userRes = await fetch(`${DIRECTUS_URL}/users/me?fields=role.name`, {
      headers: { Authorization: `Bearer ${access_token}` },
      cache: 'no-store',
    });

    if (userRes.ok) {
      const userData = await userRes.json();
      const roleName = userData?.data?.role?.name;
      if (roleName !== 'Super Admin') {
        return { error: "error_unauthorized" };
      }
    } else {
      return { error: "error_connection" };
    }

    const cookieStore = await cookies();

    cookieStore.set("directus_access_token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: Math.floor(expires / 1000),
      sameSite: "lax",
    });

    cookieStore.set("directus_refresh_token", refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
      sameSite: "lax",
    });

    // Mark role as verified
    cookieStore.set("console_role_verified", "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 14 * 60,
      sameSite: "lax",
    });
  } catch {
    return { error: "error_connection" };
  }

  redirect("/");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("directus_refresh_token")?.value;

  if (refreshToken) {
    try {
      await fetch(`${DIRECTUS_URL}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
        cache: "no-store",
      });
    } catch {
      // Ignore errors on logout
    }
  }

  cookieStore.delete("directus_access_token");
  cookieStore.delete("directus_refresh_token");
  cookieStore.delete("console_role_verified");
  redirect("/login");
}

export async function getCurrentUserAction() {
  try {
    const client = await getServerClient();
    const user = await client.request(
      readMe({ fields: ['id', 'first_name', 'last_name', 'email'] as any })
    );
    const u = user as Record<string, string>;
    const name = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email || '';
    const initials = [u.first_name?.[0], u.last_name?.[0]].filter(Boolean).join('').toUpperCase()
      || (u.email?.[0] || '?').toUpperCase();
    return { success: true, data: { name, email: u.email || '', initials } };
  } catch {
    return { success: false, data: null };
  }
}
