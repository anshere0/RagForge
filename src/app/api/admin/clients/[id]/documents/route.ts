import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { resolveClientId } from '@/lib/supabase/clientResolver';
import { processDocument } from '@/lib/rag/ingestion';

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

    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('client_id', clientId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ documents });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

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
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided in form data' },
        { status: 400 }
      );
    }

    const filename = file.name;
    const ext = filename.split('.').pop()?.toLowerCase();

    if (!ext || !['pdf', 'docx', 'txt'].includes(ext)) {
      return NextResponse.json(
        { error: 'Only PDF, DOCX, and TXT files are supported for v1.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 1. Create document record in DB with pending status
    const { data: docRecord, error: docError } = await supabase
      .from('documents')
      .insert({
        client_id: clientId,
        filename,
        source_type: ext,
        status: 'pending',
      })
      .select()
      .single();

    if (docError || !docRecord) {
      return NextResponse.json(
        { error: `Database error: ${docError?.message || 'Failed to create document record'}` },
        { status: 500 }
      );
    }

    // 2. Read file array buffer into Buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // 3. Process document (Extract -> Chunk -> Embed -> Save)
    const result = await processDocument({
      documentId: docRecord.id,
      clientId,
      filename,
      fileBuffer,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || 'Failed to process document',
          documentId: docRecord.id,
          status: 'failed',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      documentId: docRecord.id,
      chunkCount: result.chunkCount,
      status: 'ready',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'File upload failed' },
      { status: 500 }
    );
  }
}
