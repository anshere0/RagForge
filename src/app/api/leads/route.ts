import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, name, contact, reason, conversationId } = body;

    if (!slug || !name || !contact) {
      return NextResponse.json(
        { error: 'Name and contact info are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Fetch client
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('slug', slug)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client chatbot not found' },
        { status: 404 }
      );
    }

    // Save lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        client_id: client.id,
        conversation_id: conversationId || null,
        name: name.trim(),
        contact: contact.trim(),
        reason: reason?.trim() || null,
      })
      .select()
      .single();

    if (leadError) {
      return NextResponse.json(
        { error: leadError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, lead });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to submit lead' },
      { status: 500 }
    );
  }
}
