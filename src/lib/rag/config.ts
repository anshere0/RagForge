export const RAG_CONFIG = {
  CHUNK_SIZE: 500, // Target words per chunk
  CHUNK_OVERLAP: 80, // Overlap words between consecutive chunks
  TOP_K_RETRIEVAL: 5, // Top chunks retrieved during search
  MIN_SIMILARITY: 0.25, // Minimum similarity score for retrieved context
};
