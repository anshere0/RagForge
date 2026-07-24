import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import ChatWidgetView from './ChatWidgetView';

export const dynamic = 'force-dynamic';

export default async function ChatPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: client, error } = await supabase
    .from('clients')
    .select('id, name, slug, logo_url, primary_color, bot_name, welcome_message')
    .eq('slug', slug)
    .single();

  if (error || !client) {
    notFound();
  }

  return <ChatWidgetView client={client} />;
}
