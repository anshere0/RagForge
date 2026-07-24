import { redirect } from 'next/navigation';
import { getClientSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import ClientDashboardView from './ClientDashboardView';

export const dynamic = 'force-dynamic';

export default async function ClientDashboardPage() {
  const session = await getClientSession();
  if (!session) {
    redirect('/login');
  }

  const supabase = createAdminClient();

  const { data: client } = await supabase
    .from('clients')
    .select('id, name, slug, logo_url, primary_color, bot_name, welcome_message, system_prompt, llm_provider, created_at')
    .eq('id', session.clientId)
    .single();

  if (!client) {
    redirect('/login');
  }

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

  return (
    <ClientDashboardView
      client={client}
      stats={{
        docsCount: docsCount || 0,
        chatsCount: chatsCount || 0,
        leadsCount: leadsCount || 0,
      }}
    />
  );
}
