import { RAG_CONFIG } from './config';

export interface ChunkItem {
  content: string;
  chunkIndex: number;
  metadata: {
    characterCount: number;
    wordCount: number;
    chunkIndex: number;
  };
}

/**
 * Splits text into overlapping semantic chunks while STRICTLY PRESERVING newlines (\n)
 * and structural formatting (bullet points, numbered lists, headings).
 */
export function chunkText(
  text: string,
  chunkSize: number = RAG_CONFIG.CHUNK_SIZE,
  overlap: number = RAG_CONFIG.CHUNK_OVERLAP
): ChunkItem[] {
  if (!text || !text.trim()) {
    return [];
  }

  const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const wordsTotal = normalizedText.split(/\s+/).filter(Boolean).length;

  // If entire document fits within target chunk size, return as single formatted chunk
  if (wordsTotal <= chunkSize) {
    return [
      {
        content: normalizedText.trim(),
        chunkIndex: 0,
        metadata: {
          characterCount: normalizedText.length,
          wordCount: wordsTotal,
          chunkIndex: 0,
        },
      },
    ];
  }

  const lines = normalizedText.split('\n');
  const chunks: ChunkItem[] = [];
  let currentChunkLines: string[] = [];
  let currentWordCount = 0;
  let chunkIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineWordCount = line.split(/\s+/).filter(Boolean).length;

    currentChunkLines.push(line);
    currentWordCount += lineWordCount;

    if (currentWordCount >= chunkSize || i === lines.length - 1) {
      const content = currentChunkLines.join('\n').trim();
      if (content.length > 0) {
        chunks.push({
          content,
          chunkIndex,
          metadata: {
            characterCount: content.length,
            wordCount: currentWordCount,
            chunkIndex,
          },
        });
        chunkIndex++;
      }

      // Preserve last 2 lines for smooth chunk overlap without destroying line breaks
      currentChunkLines = currentChunkLines.slice(-2);
      currentWordCount = currentChunkLines.join('\n').split(/\s+/).filter(Boolean).length;
    }
  }

  return chunks;
}
