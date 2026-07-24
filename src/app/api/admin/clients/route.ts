import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Client name and slug are required' },
        { status: 400 }
      );
    }

    // Sanitize slug (lowercase, alphanumerics and hyphens)
    const formattedSlug = slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-');

    const supabase = createAdminClient();

    // Check if slug already exists
    const { data: existing } = await supabase
      .from('clients')
      .select('id')
      .eq('slug', formattedSlug)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: `Slug "${formattedSlug}" is already taken by another client` },
        { status: 400 }
      );
    }

    const { data: newClient, error } = await supabase
      .from('clients')
      .insert({
        name: name.trim(),
        slug: formattedSlug,
        logo_url: logo_url || null,
        primary_color: primary_color || '#3B82F6',
        bot_name: bot_name || 'AI Assistant',
        welcome_message: welcome_message || 'Hello! How can I help you today?',
        system_prompt: system_prompt || `You are an AI assistant for ${name}. Answer strictly based on provided documents.`,
        llm_provider: llm_provider || 'gemini',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, client: newClient });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to create client' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ clients });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}
