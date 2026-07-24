import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { resolveClientId } from '@/lib/supabase/clientResolver';
import { processDocumentText } from '@/lib/rag/ingestion';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: rawId, docId } = await params;
    const clientId = await resolveClientId(rawId);

    if (!clientId) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const supabase = createAdminClient();

    // 1. Delete associated chunks from `chunks` table
    await supabase.from('chunks').delete().eq('document_id', docId).eq('client_id', clientId);

    // 2. Delete document record from `documents` table
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', docId)
      .eq('client_id', clientId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Document and vector chunks deleted' });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to delete document' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: rawId, docId } = await params;
    const clientId = await resolveClientId(rawId);

    if (!clientId) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const supabase = createAdminClient();

    // Fetch document details
    const { data: doc, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', docId)
      .eq('client_id', clientId)
      .single();

    if (fetchError || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Fetch existing chunks to recombine text for re-indexing
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

    // Re-index document text
    const result = await processDocumentText({
      documentId: docId,
      clientId,
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
