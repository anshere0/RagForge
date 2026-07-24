/**
 * Website URL Crawler for RAGForge.
 * Fetches HTML from a target URL, extracts clean main text content, title, and page metadata.
 */
export interface CrawledPage {
  url: string;
  title: string;
  textContent: string;
}

export async function crawlWebsiteUrl(url: string): Promise<CrawledPage> {
  // Validate URL format
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
  } catch {
    throw new Error('Invalid URL provided. Please enter a valid website address.');
  }

  const response = await fetch(parsedUrl.toString(), {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 RAGForgeBot/1.0',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL (${response.status} ${response.statusText})`);
  }

  const html = await response.text();

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : parsedUrl.hostname;

  // Clean HTML to extract main body text content
  const textContent = cleanHtmlToText(html);

  if (textContent.length < 50) {
    throw new Error('Could not extract sufficient text content from this web page.');
  }

  return {
    url: parsedUrl.toString(),
    title,
    textContent,
  };
}

/**
 * Strips script, style, nav, footer tags and extracts clean human-readable text from HTML string.
 */
function cleanHtmlToText(html: string): string {
  let clean = html;

  // Strip script, style, noscript, svg, header, nav, footer tags and content
  clean = clean.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  clean = clean.replace(/<style[\s\S]*?<\/style>/gi, ' ');
  clean = clean.replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ');
  clean = clean.replace(/<svg[\s\S]*?<\/svg>/gi, ' ');
  clean = clean.replace(/<nav[\s\S]*?<\/nav>/gi, ' ');
  clean = clean.replace(/<footer[\s\S]*?<\/footer>/gi, ' ');

  // Convert break tags and paragraph ends to newlines
  clean = clean.replace(/<br\s*\/?>/gi, '\n');
  clean = clean.replace(/<\/p>/gi, '\n\n');
  clean = clean.replace(/<\/h[1-6]>/gi, '\n\n');
  clean = clean.replace(/<\/li>/gi, '\n');
  clean = clean.replace(/<\/tr>/gi, '\n');

  // Strip remaining HTML tags
  clean = clean.replace(/<[^>]+>/g, ' ');

  // Decode common HTML entities
  clean = clean
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  // Collapse multiple whitespaces and consecutive newlines
  clean = clean
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');

  return clean;
}
