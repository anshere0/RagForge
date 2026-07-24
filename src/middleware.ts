import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_COOKIE_NAME = 'ragforge_admin_session';
const CLIENT_COOKIE_NAME = 'ragforge_client_session';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /admin routes (except /admin/login)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const adminCookie = request.cookies.get(ADMIN_COOKIE_NAME);

    if (!adminCookie || !adminCookie.value) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect /dashboard routes (Client Self-Serve Portal)
  if (pathname.startsWith('/dashboard')) {
    const clientCookie = request.cookies.get(CLIENT_COOKIE_NAME);

    if (!clientCookie || !clientCookie.value) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
};
