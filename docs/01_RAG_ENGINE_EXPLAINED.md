# RAG Engine — How the AI Brain Works (Code Walkthrough)

This document explains every file in `src/lib/rag/` — the core AI engine that powers RAGForge. Read this to understand how documents become smart chatbot answers.

---

## What is RAG?

**RAG = Retrieval-Augmented Generation**

Instead of asking an AI model to "know everything", RAG works like this:
1. **Store** your documents in a searchable database
2. When a user asks a question, **search** for the most relevant parts of your documents
3. **Give** those relevant parts to the AI model along with the question
4. The AI generates an answer **grounded in your actual documents**

This means the chatbot ONLY answers from YOUR documents — it can't hallucinate random facts.

---

## The RAG Pipeline (7 Files, 7 Steps)

```
Document Upload
      │
      ▼
  ┌─────────┐     ┌─────────┐     ┌──────────┐     ┌──────────┐
  │ parser   │ ──► │ chunker │ ──► │ embedder │ ──► │ Supabase │
  │ .ts      │     │ .ts     │     │ .ts      │     │ (pgvec)  │
  │          │     │         │     │          │     │          │
  │ PDF/DOCX │     │ Split   │     │ Text →   │     │ Store    │
  │ → Text   │     │ into    │     │ Numbers  │     │ vectors  │
  └─────────┘     │ chunks  │     └──────────┘     └──────────┘
                  └─────────┘
                                        ↑ This whole flow is orchestrated by ingestion.ts

User Question
      │
      ▼
  ┌───────────┐     ┌───────────┐
  │ retrieval │ ──► │ generator │ ──► Answer!
  │ .ts       │     │ .ts       │
  │           │     │           │
  │ Search    │     │ Context + │
  │ vectors   │     │ LLM call  │
  └───────────┘     └───────────┘
```

---

## File 1: `config.ts` — Settings

```typescript
export const RAG_CONFIG = {
  CHUNK_SIZE: 500,        // Each chunk = ~500 words
  CHUNK_OVERLAP: 80,      // 80 words overlap between chunks
  TOP_K_RETRIEVAL: 5,     // Return top 5 matching chunks
  MIN_SIMILARITY: 0.25,   // Minimum match score (0 to 1)
};
```

**Why these numbers?**
- **CHUNK_SIZE = 500 words**: Too small → loses context. Too big → dilutes relevance. 500 is the sweet spot.
- **CHUNK_OVERLAP = 80 words**: If a sentence gets split across two chunks, overlap ensures it appears in both.
- **TOP_K = 5**: We retrieve the 5 most relevant chunks. More = more context but slower and noisier.
- **MIN_SIMILARITY = 0.25**: Chunks scoring below 25% similarity are probably irrelevant.

---

## File 2: `parser.ts` — Extract Text from Files

**What it does**: Takes a file (PDF, DOCX, or TXT) and extracts the raw text content.

```
Input:  Buffer (raw bytes of a file) + filename
Output: Clean text string
```

**How it works:**
1. Checks the file extension (`.pdf`, `.docx`, `.txt`)
2. Uses the right library to extract text:
   - `.pdf` → `pdf-parse` library
   - `.docx` → `mammoth` library
   - `.txt` → just read as UTF-8 string
3. Cleans the text: normalizes line endings, removes excess whitespace

**Key function:**
```typescript
extractTextFromFile(buffer: Buffer, filename: string): Promise<string>
```

---

## File 3: `chunker.ts` — Split Text into Pieces

**What it does**: Splits a long document into smaller overlapping pieces ("chunks").

**Why split at all?** AI models have a limited context window. If your document is 50 pages, you can't send ALL of it. Instead, you:
1. Split into ~500-word chunks
2. When a user asks a question, find the 5 most relevant chunks
3. Send ONLY those 5 chunks to the AI

**How overlap works:**
```
Chunk 1:  |████████████████████|
Chunk 2:            |████████████████████|
                    ↑ overlap zone
```
The overlap ensures sentences that fall on chunk boundaries aren't lost.

**Key function:**
```typescript
chunkText(text: string, chunkSize?: number, overlap?: number): ChunkItem[]
```

Each `ChunkItem` contains:
- `content`: the actual text of the chunk
- `chunkIndex`: position number (0, 1, 2, ...)
- `metadata`: word count, character count

---

## File 4: `embedder.ts` — Convert Text to Numbers (Vectors)

**What it does**: Converts a text string into a list of 768 numbers (a "vector embedding").

**Why?** Computers can't understand text directly. But they CAN compare lists of numbers. Two similar sentences will produce similar number lists. This is how we find "relevant" chunks.

**Example (simplified):**
```
"What is the fee structure?"  →  [0.12, -0.34, 0.56, ...]  (768 numbers)
"Fee details for BTech"      →  [0.11, -0.33, 0.55, ...]  (very similar!)
"Best restaurants nearby"    →  [0.89, 0.12, -0.67, ...]  (very different!)
```

**How it works:**
1. Sends text to **Gemini API** (`text-embedding-004` model)
2. Gets back a 768-dimensional vector
3. If API fails → uses a local fallback (deterministic hashing)

**Key function:**
```typescript
generateEmbedding(text: string): Promise<number[]>  // Returns 768 numbers
```

**The fallback vector generator:**
When the Gemini API is unavailable, we generate a deterministic vector by:
1. Tokenizing the text into words
2. Hashing each word to an index (0-767)
3. Incrementing that position
4. Normalizing to a unit vector

This isn't as good as Gemini embeddings, but ensures the system never breaks.

---

## File 5: `ingestion.ts` — The Full Pipeline Orchestrator

**What it does**: Runs the complete flow: Parse → Chunk → Embed → Store.

```
File Upload → extractText → chunkText → generateEmbedding (for each chunk) → INSERT into Supabase
```

**Two entry points:**
1. `processDocument()` — for file uploads (PDF/DOCX/TXT buffers)
2. `processDocumentText()` — for crawled web pages (raw text strings)

**Key steps in the pipeline:**
```typescript
// 1. Mark document as "processing"
await supabase.from('documents').update({ status: 'processing' })

// 2. Split text into chunks
const chunks = chunkText(rawText);

// 3. Clear old chunks (for re-indexing)
await supabase.from('chunks').delete().eq('document_id', documentId);

// 4. For each chunk: generate embedding vector
for (const chunk of chunks) {
  const embedding = await generateEmbedding(chunk.content);
  chunkRecords.push({ document_id, client_id, content, embedding, metadata });
}

// 5. Insert all chunks into database
await supabase.from('chunks').insert(chunkRecords);

// 6. Mark document as "ready"
await supabase.from('documents').update({ status: 'ready' })
```

---

## File 6: `retrieval.ts` — Find Relevant Chunks

**What it does**: When a user asks a question, finds the most relevant document chunks.

**How vector search works:**
1. Convert the user's question into a 768-dim vector (same as document chunks)
2. Use pgvector's `<=>` operator to find the closest vectors in the database
3. Filter by `client_id` (multi-tenancy: each client only sees their own docs)
4. Return top 5 matches sorted by similarity score

**The SQL function (in Supabase):**
```sql
SELECT content, 1 - (embedding <=> query_embedding) AS similarity
FROM chunks
WHERE client_id = 'some-uuid'
ORDER BY embedding <=> query_embedding
LIMIT 5;
```

The `<=>` operator computes **cosine distance**. We subtract from 1 to get **cosine similarity** (1 = identical, 0 = unrelated).

**Key function:**
```typescript
retrieveRelevantContext(clientId: string, question: string, topK?: number): Promise<RetrievedChunk[]>
```

---

## File 7: `generator.ts` — Generate the Answer

**What it does**: Takes the retrieved chunks + user question and produces a final answer.

**Two modes:**
1. **Gemini LLM mode** (when API key is valid): Sends everything to Gemini, gets a natural language answer
2. **Fallback Q&A extraction mode** (when API key is missing/invalid): Parses the document into Q&A blocks and returns the best-matching answer section

**The LLM prompt structure:**
```
[System Prompt from client settings]
BUSINESS NAME: Apollo Dental
LANGUAGE INSTRUCTION: Reply in the same language as the visitor
FORMATTING INSTRUCTION: Use bullet points and paragraph breaks

RETRIEVED DOCUMENT CONTEXT:
[Source 1 (faq.pdf)]: Opening hours are 9am to 6pm...
[Source 2 (services.pdf)]: Teeth whitening costs ₹5,000...

CONVERSATION HISTORY:
USER: Hi
ASSISTANT: Hello! How can I help you?

VISITOR QUESTION: How much is teeth whitening?

ASSISTANT RESPONSE:
```

**Typo tolerance in fallback mode:**
The fallback Q&A matcher uses prefix matching:
- User types "structur" → matches "structure"
- User types "wher" → matches "where"
- User types "appointemnt" → matches "appointment" (via "appo" prefix)

---

## File 8: `crawler.ts` — Fetch Web Page Text

**What it does**: Downloads a web page and extracts the readable text content (strips HTML tags).

**How it works:**
1. Fetches the URL with a browser-like User-Agent header
2. Strips all `<script>`, `<style>`, and `<nav>` tags
3. Extracts text from `<p>`, `<h1>`-`<h6>`, `<li>`, `<td>` tags
4. Returns clean text ready for chunking

**Key function:**
```typescript
crawlWebsiteUrl(url: string): Promise<{ title: string; text: string }>
```
