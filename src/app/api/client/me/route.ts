import { NextResponse } from 'next/server';
import { getClientSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getClientSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { data: client, error } = await supabase
      .from('clients')
      .select('id, name, slug, logo_url, primary_color, bot_name, welcome_message, system_prompt, llm_provider, created_at')
      .eq('id', session.clientId)
      .single();

    if (error || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Counts
    const { count: docsCount } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', session.clientId);

    const { count: chatsCount } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', session.clientId);

    const { count: leadsCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', session.clientId);

    return NextResponse.json({
      client,
      stats: {
        docsCount: docsCount || 0,
        chatsCount: chatsCount || 0,
        leadsCount: leadsCount || 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch client details' },
      { status: 500 }
    );
  }
}
