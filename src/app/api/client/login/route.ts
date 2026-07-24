import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyClientPassword, createClientToken, CLIENT_COOKIE_NAME } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, password } = body;

    if (!slug || !password) {
      return NextResponse.json(
        { error: 'Business Slug and Password are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Query client by slug
    const { data: client, error } = await supabase
      .from('clients')
      .select('id, name, slug, client_password_hash')
      .eq('slug', slug.toLowerCase().trim())
      .single();

    if (error || !client) {
      return NextResponse.json(
        { error: 'Invalid business slug or password' },
        { status: 401 }
      );
    }

    if (!client.client_password_hash) {
      return NextResponse.json(
        { error: 'Client password has not been set by administrator. Please contact support.' },
        { status: 401 }
      );
    }

    const isValid = verifyClientPassword(password, client.client_password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid business slug or password' },
        { status: 401 }
      );
    }

    const token = createClientToken(client.id, client.slug);

    const response = NextResponse.json({
      success: true,
      client: { id: client.id, name: client.name, slug: client.slug },
    });

    response.cookies.set({
      name: CLIENT_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Client login failed' },
      { status: 500 }
    );
  }
}
