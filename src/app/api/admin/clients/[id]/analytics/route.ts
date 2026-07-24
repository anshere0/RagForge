import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { resolveClientId } from '@/lib/supabase/clientResolver';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: rawId } = await params;
    const clientId = await resolveClientId(rawId);

    if (!clientId) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const supabase = createAdminClient();

    // 1. Total conversations count
    const { count: totalConversations } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId);

    // 2. Total leads count
    const { count: totalLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId);

    // 3. Fetch recent messages for message volume and top question topics
    const { data: messages } = await supabase
      .from('messages')
      .select('id, role, content, created_at, conversations!inner(client_id)')
      .eq('conversations.client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(200);

    const allMessages = messages || [];
    const totalMessages = allMessages.length;

    // 4. Calculate user question topics frequency
    const userQuestions = allMessages.filter((m) => m.role === 'user');
    const topicCounts: Record<string, number> = {};

    for (const q of userQuestions) {
      const text = q.content.toLowerCase().trim();
      if (text.length > 3) {
        topicCounts[text] = (topicCounts[text] || 0) + 1;
      }
    }

    const topQuestions = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([question, count]) => ({ question, count }));

    return NextResponse.json({
      analytics: {
        totalConversations: totalConversations || 0,
        totalMessages,
        totalLeads: totalLeads || 0,
        leadConversionRate:
          (totalConversations || 0) > 0
            ? Math.round(((totalLeads || 0) / (totalConversations || 1)) * 100)
            : 0,
        topQuestions,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
