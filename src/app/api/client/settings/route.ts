import { NextResponse } from 'next/server';
import { getClientSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request) {
  try {
    const session = await getClientSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { logo_url, primary_color, bot_name, welcome_message, system_prompt } = body;

    const supabase = createAdminClient();

    const { data: updatedClient, error } = await supabase
      .from('clients')
      .update({
        logo_url,
        primary_color,
        bot_name,
        welcome_message,
        system_prompt,
      })
      .eq('id', session.clientId)
      .select('id, name, slug, logo_url, primary_color, bot_name, welcome_message, system_prompt')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, client: updatedClient });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}
