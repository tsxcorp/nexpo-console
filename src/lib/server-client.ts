import { createDirectus, rest, staticToken } from '@directus/sdk';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://app.nexpo.vn';

/**
 * Refresh access token using stored refresh token.
 * Returns new tokens on success, null on failure.
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires: number;
} | null> {
  try {
    const res = await fetch(`${DIRECTUS_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken, mode: 'json' }),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data ?? null;
  } catch {
    return null;
  }
}

/**
 * Server-side Directus client with valid user JWT.
 * Automatically refreshes token if expired. Redirects to /login if no auth.
 */
export async function getServerClient() {
  const cookieStore = await cookies();
  let token = cookieStore.get('directus_access_token')?.value;
  const refreshToken = cookieStore.get('directus_refresh_token')?.value;

  if (!token && refreshToken) {
    const newTokens = await refreshAccessToken(refreshToken);
    if (newTokens) {
      token = newTokens.access_token;
      cookieStore.set('directus_access_token', newTokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: Math.floor(newTokens.expires / 1000),
        sameSite: 'lax',
      });
      cookieStore.set('directus_refresh_token', newTokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
        sameSite: 'lax',
      });
    }
  }

  if (!token) {
    redirect('/login');
  }

  return createDirectus(DIRECTUS_URL).with(rest()).with(staticToken(token as string));
}

/**
 * Server-side Directus client with admin token.
 * For privileged cross-tenant operations — server actions only, never expose to client.
 */
export function getAdminClient() {
  const adminToken = process.env.DIRECTUS_ADMIN_TOKEN;
  if (!adminToken) throw new Error('DIRECTUS_ADMIN_TOKEN is not configured');
  return createDirectus(DIRECTUS_URL).with(rest()).with(staticToken(adminToken));
}
