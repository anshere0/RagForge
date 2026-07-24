import { NextResponse } from 'next/server';
import { getClientSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { crawlWebsiteUrl } from '@/lib/rag/crawler';
import { processDocumentText } from '@/lib/rag/ingestion';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getClientSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Valid URL is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const crawledPage = await crawlWebsiteUrl(url);

    const filename = `URL: ${crawledPage.title} (${new URL(crawledPage.url).hostname})`;
    const { data: docRecord, error: docError } = await supabase
      .from('documents')
      .insert({
        client_id: session.clientId,
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

    const ingestionResult = await processDocumentText({
      documentId: docRecord.id,
      clientId: session.clientId,
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
      { error: err.message || 'Failed to crawl URL' },
      { status: 500 }
    );
  }
}
