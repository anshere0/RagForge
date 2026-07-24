import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { resolveClientId } from '@/lib/supabase/clientResolver';

export const dynamic = 'force-dynamic';

export async function POST(
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
      return NextResponse.json({ error: 'Source client not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, slug } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required for the new cloned client' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 1. Fetch source client settings
    const { data: sourceClient, error: sourceError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (sourceError || !sourceClient) {
      return NextResponse.json({ error: 'Source client not found' }, { status: 404 });
    }

    // 2. Format new slug
    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');

    // 3. Create cloned client with copied settings
    const { data: newClient, error: createError } = await supabase
      .from('clients')
      .insert({
        name: name.trim(),
        slug: cleanSlug,
        logo_url: sourceClient.logo_url,
        primary_color: sourceClient.primary_color,
        bot_name: sourceClient.bot_name,
        welcome_message: sourceClient.welcome_message,
        system_prompt: sourceClient.system_prompt,
        llm_provider: sourceClient.llm_provider,
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, client: newClient });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to clone client settings' },
      { status: 500 }
    );
  }
}
