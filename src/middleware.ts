import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://app.nexpo.vn';
const PUBLIC_ROUTES = ['/login'];

async function tryRefresh(refreshToken: string): Promise<{
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
 * Verify user has Super Admin role by fetching current user's role from Directus.
 * Returns true if user's role name is "Super Admin".
 */
async function isSuperAdmin(accessToken: string): Promise<boolean> {
  try {
    const res = await fetch(`${DIRECTUS_URL}/users/me?fields=role.name`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    if (!res.ok) return false;
    const data = await res.json();
    const roleName = data?.data?.role?.name;
    return roleName === 'Super Admin';
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const accessToken = request.cookies.get('directus_access_token')?.value;
  const refreshToken = request.cookies.get('directus_refresh_token')?.value;

  // CASE 1: Has valid access token
  if (accessToken) {
    if (pathname === '/login') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Check Super Admin role (cached in cookie to avoid checking every request)
    const roleChecked = request.cookies.get('console_role_verified')?.value;
    if (!roleChecked) {
      const isAdmin = await isSuperAdmin(accessToken);
      if (!isAdmin) {
        // Not Super Admin — clear cookies and redirect to login with error
        const response = NextResponse.redirect(new URL('/login?error=unauthorized', request.url));
        response.cookies.delete('directus_access_token');
        response.cookies.delete('directus_refresh_token');
        response.cookies.delete('console_role_verified');
        return response;
      }
      // Mark role as verified for this session
      const response = NextResponse.next();
      response.cookies.set('console_role_verified', '1', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 14 * 60, // 14 minutes (less than access token expiry)
        sameSite: 'lax',
      });
      return response;
    }

    return NextResponse.next();
  }

  // CASE 2: No access token but has refresh token — try refresh
  if (!accessToken && refreshToken) {
    const newTokens = await tryRefresh(refreshToken);

    if (newTokens) {
      const response = isPublicRoute
        ? NextResponse.redirect(new URL('/', request.url))
        : NextResponse.next();

      response.cookies.set('directus_access_token', newTokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: Math.floor(newTokens.expires / 1000),
        sameSite: 'lax',
      });
      response.cookies.set('directus_refresh_token', newTokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
        sameSite: 'lax',
      });
      // Clear role cache so it re-checks on next request
      response.cookies.delete('console_role_verified');
      return response;
    }

    // Refresh failed — clear stale tokens
    if (!isPublicRoute) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('directus_access_token');
      response.cookies.delete('directus_refresh_token');
      response.cookies.delete('console_role_verified');
      return response;
    }
  }

  // CASE 3: No tokens at all
  if (!isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
