import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { resolveClientId } from '@/lib/supabase/clientResolver';
import { crawlWebsiteUrl } from '@/lib/rag/crawler';
import { processDocumentText } from '@/lib/rag/ingestion';

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
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Valid URL is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Crawl website URL
    const crawledPage = await crawlWebsiteUrl(url);

    // 2. Create document record in Supabase with document_type = 'url'
    const filename = `URL: ${crawledPage.title} (${new URL(crawledPage.url).hostname})`;
    const { data: docRecord, error: docError } = await supabase
      .from('documents')
      .insert({
        client_id: clientId,
        filename,
        document_type: 'url',
        status: 'pending',
      })
      .select()
      .single();

    if (docError || !docRecord) {
      return NextResponse.json(
        { error: docError?.message || 'Failed to record document' },
        { status: 500 }
      );
    }

    // 3. Process extracted text in background / inline
    const ingestionResult = await processDocumentText({
      documentId: docRecord.id,
      clientId,
      filename,
      rawText: crawledPage.textContent,
    });

    if (!ingestionResult.success) {
      return NextResponse.json(
        { error: ingestionResult.error || 'Failed to ingest crawled web page' },
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
      { error: err.message || 'Failed to crawl website URL' },
      { status: 500 }
    );
  }
}
