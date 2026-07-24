import { NextResponse } from 'next/server';
import { getClientSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { processDocument } from '@/lib/rag/ingestion';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getClientSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('client_id', session.clientId)
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

export async function POST(request: Request) {
  try {
    const session = await getClientSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const filename = file.name;
    const bytes = await file.arrayBuffer();
    const fileBuffer = Buffer.from(bytes);

    const ext = filename.split('.').pop()?.toLowerCase();
    const sourceType = ext === 'pdf' ? 'pdf' : ext === 'docx' ? 'docx' : 'txt';

    const supabase = createAdminClient();

    // Insert pending document record
    const { data: docRecord, error: docError } = await supabase
      .from('documents')
      .insert({
        client_id: session.clientId,
        filename,
        document_type: sourceType,
        status: 'pending',
      })
      .select()
      .single();

    if (docError || !docRecord) {
      return NextResponse.json(
        { error: docError?.message || 'Failed to create document record' },
        { status: 500 }
      );
    }

    // Process ingestion
    const ingestionResult = await processDocument({
      documentId: docRecord.id,
      clientId: session.clientId,
      filename,
      fileBuffer,
    });

    if (!ingestionResult.success) {
      return NextResponse.json(
        { error: ingestionResult.error || 'Document ingestion failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      document: docRecord,
      chunkCount: ingestionResult.chunkCount,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to upload document' },
      { status: 500 }
    );
  }
}
