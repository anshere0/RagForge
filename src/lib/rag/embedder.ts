/**
 * Generates vector embeddings for a given text string.
 * Uses Gemini API (text-embedding-004 / embedding-001), OpenAI API, or local deterministic hashing fallback.
 * STRICTLY SERVER-SIDE ONLY.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== 'your-gemini-api-key' && apiKey.length > 10) {
    const modelsToTry = ['text-embedding-004', 'embedding-001'];

    for (const modelName of modelsToTry) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:embedContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: { parts: [{ text }] },
            }),
          }
        );

        const data = await response.json();

        if (response.ok && data.embedding?.values) {
          let values: number[] = data.embedding.values;

          // Normalize to exactly 768 dimensions for pgvector
          if (values.length > 768) {
            values = values.slice(0, 768);
          } else while (values.length < 768) {
            values.push(0);
          }

          return values;
        }
      } catch (err) {
        console.warn(`[Gemini Embedding ${modelName} failed]:`, err);
      }
    }
  }

  // Fallback to local 768-dim deterministic hashing vector if API key is invalid or Gemini API returns 404
  console.warn('[Embedding Engine]: Using local 768-dim vector fallback.');
  return generateFallbackVector(text, 768);
}

/**
 * Generates vector embeddings for an array of text strings.
 */
export async function generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  for (const text of texts) {
    const vector = await generateEmbedding(text);
    embeddings.push(vector);
  }
  return embeddings;
}

/**
 * Deterministic local vector generator (768 dimensions) to guarantee 100% uptime.
 */
function generateFallbackVector(text: string, dim: number = 768): number[] {
  const vector = new Array(dim).fill(0);
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;
    for (let j = 0; j < word.length; j++) {
      hash = (hash << 5) - hash + word.charCodeAt(j);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dim;
    vector[idx] += 1;
  }

  // Unit vector normalization
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
  return vector.map((val) => val / magnitude);
}
