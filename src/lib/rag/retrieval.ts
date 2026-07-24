import { createAdminClient } from '@/lib/supabase/server';
import { generateEmbedding } from './embedder';
import { RAG_CONFIG } from './config';
import { RetrievedChunk } from './generator';

/**
 * Searches pgvector chunks table for relevant context filtered strictly by client_id.
 */
export async function retrieveRelevantContext(
  clientId: string,
  question: string,
  topK: number = RAG_CONFIG.TOP_K_RETRIEVAL
): Promise<RetrievedChunk[]> {
  const supabase = createAdminClient();

  // 1. Embed question
  const questionVector = await generateEmbedding(question);

  // 2. Perform client-scoped vector search via RPC
  const { data: chunks, error } = await supabase.rpc('match_chunks', {
    query_embedding: questionVector,
    match_count: topK,
    p_client_id: clientId, // STRICT MULTI-TENANCY FILTER
  });

  if (error) {
    console.error(`[Retrieval Error] Client ${clientId}:`, error);
    return [];
  }

  if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
    return [];
  }

  // Filter chunks by minimum similarity threshold (0.05)
  const filtered = chunks.filter((c: any) => (c.similarity || 0) >= 0.05);

  // Always return at least the top matching chunk if documents exist for this client
  return filtered.length > 0 ? filtered : [chunks[0]];
}
