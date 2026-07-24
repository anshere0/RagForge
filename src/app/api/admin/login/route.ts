import { NextResponse } from 'next/server';
import { getAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const expectedEmail = process.env.ADMIN_EMAIL || 'admin@ragforge.local';
    const expectedPassword = process.env.ADMIN_PASSWORD || 'change-me-in-production';

    if (email === expectedEmail && password === expectedPassword) {
      const token = getAdminToken();
      const response = NextResponse.json({ success: true, message: 'Authenticated successfully' });

      response.cookies.set(ADMIN_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: 'Invalid email or password' },
      { status: 401 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}
