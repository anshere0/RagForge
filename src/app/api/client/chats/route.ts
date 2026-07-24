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

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('id, visitor_session_id, started_at, messages(id, role, content, sources, created_at)')
      .eq('client_id', session.clientId)
      .order('started_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ conversations });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch chats' },
      { status: 500 }
    );
  }
}
