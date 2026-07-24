import mammoth from 'mammoth';

/**
 * Extracts raw text from PDF, DOCX, or TXT file buffers.
 */
export async function extractTextFromFile(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const ext = filename.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'pdf': {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(buffer);
      return cleanText(data.text);
    }
    case 'docx': {
      const result = await mammoth.extractRawText({ buffer });
      return cleanText(result.value);
    }
    case 'txt': {
      const text = buffer.toString('utf-8');
      return cleanText(text);
    }
    default:
      throw new Error(`Unsupported file extension: .${ext}. Only PDF, DOCX, and TXT are supported.`);
  }
}

/**
 * Normalizes text spacing, preserves line breaks, and forces question boundaries onto newlines.
 */
function cleanText(text: string): string {
  let clean = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Force numbered questions (e.g. "1. ", "2. ", "10. ") onto clean newlines
  clean = clean.replace(/([^\n])\s*([0-9]+\.\s+[A-Z])/g, '$1\n\n$2');

  return clean;
}
