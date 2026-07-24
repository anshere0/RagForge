import { redirect, notFound } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import ClientDetailClient from './ClientDetailClient';

export const dynamic = 'force-dynamic';

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    redirect('/admin/login');
  }

  const { id } = await params;
  const supabase = createAdminClient();

  // Support lookup by UUID or slug
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  let query = supabase.from('clients').select('*');
  if (isUuid) {
    query = query.eq('id', id);
  } else {
    query = query.eq('slug', id);
  }

  const { data: client, error } = await query.single();

  if (error || !client) {
    notFound();
  }

  const clientId = client.id;

  // Fetch document count, chats count, leads count
  const { count: docsCount } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId);

  const { count: chatsCount } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId);

  const { count: leadsCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId);

  return (
    <ClientDetailClient
      client={client}
      stats={{
        docsCount: docsCount || 0,
        chatsCount: chatsCount || 0,
        leadsCount: leadsCount || 0,
      }}
    />
  );
}
