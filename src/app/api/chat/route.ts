import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { retrieveRelevantContext } from '@/lib/rag/retrieval';
import { generateGroundedAnswer } from '@/lib/rag/generator';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, message, conversationId, visitorSessionId } = body;

    if (!slug || !message || !message.trim()) {
      return NextResponse.json(
        { error: 'Slug and message are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 1. Fetch Client Profile by slug
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('slug', slug)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client chatbot not found' },
        { status: 404 }
      );
    }

    // 2. Manage Conversation
    let activeConversationId = conversationId;

    if (!activeConversationId) {
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          client_id: client.id,
          visitor_session_id: visitorSessionId || 'anon-' + Date.now(),
        })
        .select()
        .single();

      if (convError || !newConv) {
        return NextResponse.json(
          { error: 'Failed to initialize conversation session' },
          { status: 500 }
        );
      }

      activeConversationId = newConv.id;
    }

    // 3. Fetch past messages for conversation memory (last 6 messages)
    const { data: historyMessages } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', activeConversationId)
      .order('created_at', { ascending: false })
      .limit(6);

    const history = (historyMessages || []).reverse().map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // 4. Retrieve Vector Context Chunks (Client Scoped)
    const contextChunks = await retrieveRelevantContext(client.id, message);

    // 5. Generate Grounded Answer from LLM
    const { answer, sources } = await generateGroundedAnswer({
      clientName: client.name,
      systemPrompt: client.system_prompt,
      question: message.trim(),
      contextChunks,
      conversationHistory: history,
    });

    // 6. Save User & Assistant Messages
    await supabase.from('messages').insert([
      {
        conversation_id: activeConversationId,
        role: 'user',
        content: message.trim(),
      },
      {
        conversation_id: activeConversationId,
        role: 'assistant',
        content: answer,
        sources,
      },
    ]);

    return NextResponse.json({
      success: true,
      answer,
      sources,
      conversationId: activeConversationId,
    });
  } catch (err: any) {
    console.error('[Chat API Error]:', err);
    return NextResponse.json(
      {
        error: 'An error occurred processing your request.',
        answer: 'Something went wrong. Please try again or leave your contact details so we can reach out.',
        sources: [],
      },
      { status: 500 }
    );
  }
}
