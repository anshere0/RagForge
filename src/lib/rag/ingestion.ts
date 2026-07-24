import { createAdminClient } from '@/lib/supabase/server';
import { extractTextFromFile } from './parser';
import { chunkText } from './chunker';
import { generateEmbedding } from './embedder';

export interface ProcessDocumentOptions {
  documentId: string;
  clientId: string;
  filename: string;
  fileBuffer: Buffer;
}

export interface ProcessTextOptions {
  documentId: string;
  clientId: string;
  filename: string;
  rawText: string;
}

/**
 * Full ingestion pipeline from file buffer: Extract -> Chunk -> Embed -> Store in Supabase pgvector -> Update Status.
 */
export async function processDocument({
  documentId,
  clientId,
  filename,
  fileBuffer,
}: ProcessDocumentOptions): Promise<{ success: boolean; chunkCount?: number; error?: string }> {
  try {
    const rawText = await extractTextFromFile(fileBuffer, filename);
    return await processDocumentText({ documentId, clientId, filename, rawText });
  } catch (error: any) {
    const supabase = createAdminClient();
    await supabase
      .from('documents')
      .update({ status: 'failed' })
      .eq('id', documentId)
      .eq('client_id', clientId);

    return { success: false, error: error.message || 'Document processing failed' };
  }
}

/**
 * Ingestion pipeline from raw string text (for crawled URLs or direct text re-indexing).
 */
export async function processDocumentText({
  documentId,
  clientId,
  filename,
  rawText,
}: ProcessTextOptions): Promise<{ success: boolean; chunkCount?: number; error?: string }> {
  const supabase = createAdminClient();

  try {
    // 1. Update document status to processing
    await supabase
      .from('documents')
      .update({ status: 'processing' })
      .eq('id', documentId)
      .eq('client_id', clientId);

    if (!rawText || !rawText.trim()) {
      throw new Error('No readable text content provided.');
    }

    // 2. Chunk text into overlapping segments
    const chunks = chunkText(rawText);

    if (chunks.length === 0) {
      throw new Error('Document produced 0 text chunks.');
    }

    // 3. Clear existing chunks for this document if re-indexing
    await supabase.from('chunks').delete().eq('document_id', documentId);

    // 4. Generate embeddings and prepare database records
    const chunkRecords = [];

    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk.content);

      chunkRecords.push({
        document_id: documentId,
        client_id: clientId, // duplicated for fast client-scoped vector search
        content: chunk.content,
        embedding,
        metadata: {
          ...chunk.metadata,
          filename,
        },
      });
    }

    // 5. Store chunks in `chunks` table
    const { error: insertError } = await supabase
      .from('chunks')
      .insert(chunkRecords);

    if (insertError) {
      throw new Error(`Database error saving chunks: ${insertError.message}`);
    }

    // 6. Mark document status as ready
    await supabase
      .from('documents')
      .update({ status: 'ready' })
      .eq('id', documentId)
      .eq('client_id', clientId);

    return { success: true, chunkCount: chunkRecords.length };
  } catch (error: any) {
    console.error(`[Ingestion Error] Document ${documentId} (${filename}):`, error);

    // Mark document status as failed on error
    await supabase
      .from('documents')
      .update({ status: 'failed' })
      .eq('id', documentId)
      .eq('client_id', clientId);

    return {
      success: false,
      error: error.message || 'Document processing failed',
    };
  }
}
