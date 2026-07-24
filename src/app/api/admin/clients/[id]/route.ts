import { NextResponse } from 'next/server';
import { isAdminAuthenticated, hashClientPassword } from '@/lib/auth';
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
    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (error || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({ client });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch client' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const body = await request.json();
    const {
      name,
      slug,
      logo_url,
      primary_color,
      bot_name,
      welcome_message,
      system_prompt,
      llm_provider,
      client_password,
    } = body;

    const supabase = createAdminClient();

    const updatePayload: any = {
      ...(name && { name: name.trim() }),
      ...(slug && { slug: slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-') }),
      logo_url,
      primary_color,
      bot_name,
      welcome_message,
      system_prompt,
      llm_provider,
    };

    if (client_password && client_password.trim()) {
      updatePayload.client_password_hash = hashClientPassword(client_password.trim());
    }

    const { data: updatedClient, error } = await supabase
      .from('clients')
      .update(updatePayload)
      .eq('id', clientId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, client: updatedClient });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to update client' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const { error } = await supabase.from('clients').delete().eq('id', clientId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Client deleted' });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to delete client' },
      { status: 500 }
    );
  }
}
