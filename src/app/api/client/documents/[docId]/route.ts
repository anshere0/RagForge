import { NextResponse } from 'next/server';
import { getClientSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { processDocumentText } from '@/lib/rag/ingestion';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ docId: string }> }
) {
  try {
    const session = await getClientSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { docId } = await params;
    const supabase = createAdminClient();

    await supabase.from('chunks').delete().eq('document_id', docId).eq('client_id', session.clientId);

    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', docId)
      .eq('client_id', session.clientId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to delete document' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ docId: string }> }
) {
  try {
    const session = await getClientSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { docId } = await params;
    const supabase = createAdminClient();

    const { data: doc, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', docId)
      .eq('client_id', session.clientId)
      .single();

    if (fetchError || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const { data: chunks } = await supabase
      .from('chunks')
      .select('content')
      .eq('document_id', docId)
      .order('id', { ascending: true });

    const fullText = (chunks || []).map((c) => c.content).join('\n\n');

    if (!fullText) {
      return NextResponse.json(
        { error: 'No existing chunk text available to re-index' },
        { status: 400 }
      );
    }

    const result = await processDocumentText({
      documentId: docId,
      clientId: session.clientId,
      filename: doc.filename,
      rawText: fullText,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Re-indexing failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, chunkCount: result.chunkCount });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to re-index document' },
      { status: 500 }
    );
  }
}
