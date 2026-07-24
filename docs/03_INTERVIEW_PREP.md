# RAG Chatbot Interview Prep — Everything You Need to Know

This is your complete interview preparation guide. It covers every concept you need to understand to explain and build a RAG chatbot from scratch.

---

## Part 1: Core Concepts (Theory)

### Q1. What is RAG? Explain it simply.

**RAG = Retrieval-Augmented Generation**

Normal AI chatbots (like ChatGPT) answer from their training data — which can be outdated or wrong. RAG fixes this by:
1. **Retrieval**: First, SEARCH your own documents for relevant information
2. **Augmented**: ATTACH that information to the AI prompt as context
3. **Generation**: The AI generates an answer BASED ON your documents, not its training data

**Real-world analogy**: Imagine an open-book exam. The student (AI) doesn't memorize everything — they look up the answer in the book (your documents) and then write it in their own words.

**Why RAG matters**:
- No hallucinations (answers come from YOUR documents)
- Always up-to-date (update documents → chatbot updates)
- Domain-specific (medical, legal, education — any field)
- Cost-effective (no need to fine-tune expensive models)

---

### Q2. What are Vector Embeddings? Why do we need them?

A **vector embedding** is a list of numbers that represents the "meaning" of a piece of text.

```
"What is the fee structure?"  →  [0.12, -0.34, 0.56, 0.01, ...]  (768 numbers)
"How much does it cost?"      →  [0.11, -0.33, 0.55, 0.02, ...]  (very similar!)
"Best pizza in town"          →  [0.89, 0.12, -0.67, -0.45, ...]  (totally different!)
```

**Why 768 numbers?** The Gemini `text-embedding-004` model outputs 768-dimensional vectors. Each dimension captures some aspect of meaning — topic, sentiment, context, etc.

**Why we need them**: Computers can't compare sentences directly. But they CAN compare lists of numbers using math (cosine similarity). Two sentences with similar meaning → similar vectors → high cosine similarity score.

---

### Q3. What is Cosine Similarity? How does vector search work?

**Cosine similarity** measures the angle between two vectors:
- **1.0** = identical direction (same meaning)
- **0.0** = perpendicular (unrelated)
- **-1.0** = opposite direction (opposite meaning)

**Formula**: cos(θ) = (A · B) / (||A|| × ||B||)

In Supabase with pgvector, the `<=>` operator computes **cosine distance** (1 - similarity):
```sql
-- Find the 5 most similar chunks to the question
SELECT content, 1 - (embedding <=> query_embedding) AS similarity
FROM chunks
WHERE client_id = 'some-id'
ORDER BY embedding <=> query_embedding  -- ascending = most similar first
LIMIT 5;
```

---

### Q4. What is Text Chunking? Why not just embed the whole document?

**Problem**: AI models have limited context windows (e.g., 8K tokens). A 50-page PDF has ~25,000 words. You can't send it all.

**Solution**: Split the document into smaller "chunks" (~500 words each) and embed each chunk separately.

**Chunking strategies**:
| Strategy | How it works | Used in RAGForge? |
|---|---|---|
| Fixed-size word chunks | Split every N words | ✅ Yes (500 words) |
| Sentence-based | Split at sentence boundaries | ❌ |
| Paragraph-based | Split at paragraph boundaries | Partially (line-aware) |
| Semantic chunking | Use AI to detect topic shifts | ❌ (advanced) |

**Overlap**: We use 80-word overlap between chunks. This prevents losing context when a sentence is split across two chunks.

```
Document:  [The fee for BTech is ₹1.8L per year. Hostel charges are ₹85,000.]

Without overlap:
  Chunk 1: "The fee for BTech is"
  Chunk 2: "₹1.8L per year. Hostel charges are ₹85,000."
  → If someone asks "BTech fee?", Chunk 1 matches but has no number!

With overlap:
  Chunk 1: "The fee for BTech is ₹1.8L per year."
  Chunk 2: "₹1.8L per year. Hostel charges are ₹85,000."
  → Both chunks have the complete answer ✓
```

---

### Q5. What is pgvector? Why use it instead of Pinecone/Weaviate?

**pgvector** is a PostgreSQL extension that adds vector storage and similarity search to your existing database.

**Why pgvector (in Supabase)?**
- **Free** — comes with every Supabase project
- **No separate service** — your vectors live in the same database as your other data
- **SQL queries** — use familiar SQL to query vectors alongside regular data
- **Joins work** — `JOIN chunks ON documents.id = chunks.document_id`
- **Simple** — no new infrastructure to manage

**When to use dedicated vector DBs (Pinecone, Weaviate)?**
- When you have millions of vectors (pgvector slows down at ~1M+ vectors)
- When you need sub-10ms search latency
- For RAGForge's scale (hundreds of clients, thousands of chunks), pgvector is perfect.

---

### Q6. What is Prompt Engineering? What makes a good RAG prompt?

The **prompt** is the instruction you send to the LLM along with the context. A good RAG prompt:

1. **Sets the role**: "You are a helpful assistant for [business name]"
2. **Provides context**: "Here are the relevant document sections: [chunks]"
3. **Sets constraints**: "Only answer from the provided context. If the answer isn't in the context, say so."
4. **Handles language**: "Reply in the same language as the visitor"
5. **Formats output**: "Use bullet points and clear paragraphs"

**RAGForge's prompt structure**:
```
[Client's custom system prompt]

BUSINESS NAME: Apollo Dental
LANGUAGE INSTRUCTION: Reply in visitor's language
FORMATTING INSTRUCTION: Use bullet points

RETRIEVED DOCUMENT CONTEXT:
[Source 1]: Opening hours are 9am-6pm Monday to Saturday...
[Source 2]: We offer teeth whitening for ₹5,000...

CONVERSATION HISTORY:
USER: Hi there
ASSISTANT: Hello! How can I help?

VISITOR QUESTION: What are your hours?

ASSISTANT RESPONSE:
```

---

## Part 2: Technical Implementation (Code-Level)

### Q7. Walk me through the complete document ingestion pipeline.

```
Step 1: PARSE
  Input:  Raw file bytes (PDF/DOCX/TXT)
  Tool:   pdf-parse (for PDF), mammoth (for DOCX), Buffer.toString (for TXT)
  Output: Clean text string
  File:   src/lib/rag/parser.ts

Step 2: CHUNK
  Input:  Clean text string
  Tool:   Custom word-level splitter with line preservation
  Config: 500 words per chunk, 80-word overlap
  Output: Array of ChunkItem objects
  File:   src/lib/rag/chunker.ts

Step 3: EMBED
  Input:  Each chunk's text content
  Tool:   Gemini text-embedding-004 API (or local fallback)
  Output: 768-dimensional vector for each chunk
  File:   src/lib/rag/embedder.ts

Step 4: STORE
  Input:  Chunks with embeddings
  Tool:   Supabase INSERT into `chunks` table
  Output: Rows in database with content + embedding + metadata
  File:   src/lib/rag/ingestion.ts

Step 5: UPDATE STATUS
  Input:  Document ID
  Tool:   Supabase UPDATE on `documents` table
  Output: status = 'ready' (or 'failed' if error)
```

---

### Q8. Walk me through the complete query/answer pipeline.

```
Step 1: RECEIVE QUESTION
  Endpoint:  POST /api/chat
  Input:     { slug: "apollo-dental", message: "What are your fees?" }
  File:      src/app/api/chat/route.ts

Step 2: LOOK UP CLIENT
  Query:  SELECT * FROM clients WHERE slug = 'apollo-dental'
  Result: Client profile with system_prompt, bot_name, etc.

Step 3: MANAGE CONVERSATION
  Either resume existing conversation (using conversationId)
  Or create new one (INSERT INTO conversations)

Step 4: FETCH HISTORY
  Query:  Last 6 messages from this conversation
  Why:    So the AI has "memory" of what was discussed

Step 5: RETRIEVE CONTEXT
  a) Embed the question → 768-dim vector
  b) Call match_chunks RPC (pgvector cosine search)
  c) Filter by client_id (multi-tenancy!)
  d) Return top 5 chunks sorted by similarity
  File:  src/lib/rag/retrieval.ts

Step 6: GENERATE ANSWER
  a) Build prompt: system_prompt + context + history + question
  b) Call Gemini API (gemini-1.5-flash)
  c) If Gemini fails → fallback Q&A block extraction
  d) Return answer + source citations
  File:  src/lib/rag/generator.ts

Step 7: SAVE MESSAGES
  INSERT both user message and assistant reply into `messages` table

Step 8: RETURN RESPONSE
  JSON: { answer, sources, conversationId }
```

---

### Q9. How does multi-tenancy work in the database?

Every table has a `client_id` column. Every query filters by it.

```sql
-- Documents: only this client's documents
SELECT * FROM documents WHERE client_id = 'abc-123';

-- Chunks: vector search scoped to this client
SELECT * FROM chunks WHERE client_id = 'abc-123' ORDER BY embedding <=> query;

-- Conversations: only this client's chats
SELECT * FROM conversations WHERE client_id = 'abc-123';

-- Leads: only this client's leads
SELECT * FROM leads WHERE client_id = 'abc-123';
```

The `client_id` is set when data is created and checked on every read. There is NO way for Client A to access Client B's data through the API.

---

### Q10. How does the embedding fallback work?

When the Gemini API is unavailable (quota exceeded, invalid key, network error):

```typescript
function generateFallbackVector(text: string, dim: number = 768): number[] {
  // 1. Create empty 768-dim array
  const vector = new Array(768).fill(0);

  // 2. Tokenize text into words
  const words = text.toLowerCase().split(/\s+/);

  // 3. Hash each word to a position (0-767)
  for (const word of words) {
    let hash = 0;
    for (let j = 0; j < word.length; j++) {
      hash = (hash << 5) - hash + word.charCodeAt(j);
    }
    const idx = Math.abs(hash) % 768;
    vector[idx] += 1;  // increment that dimension
  }

  // 4. Normalize to unit vector
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  return vector.map(v => v / magnitude);
}
```

**Limitation**: This is a "bag of words" approach — it knows WHICH words appear but not their MEANING. So "I love dogs" and "Dogs love I" would get the same vector. Real embeddings from Gemini understand meaning, grammar, and context.

---

## Part 3: Architecture & Design Decisions

### Q11. Why Next.js App Router instead of Express.js + React?

| Feature | Next.js App Router | Express + React |
|---|---|---|
| API routes | Built-in (`src/app/api/`) | Separate Express server |
| Server-side rendering | Built-in | Manual setup |
| Deployment | One Vercel deploy | Two separate deploys |
| File-based routing | Automatic | Manual route config |
| TypeScript | First-class support | Manual setup |

**Decision**: Next.js lets us ship faster with one codebase, one deployment, and zero configuration.

---

### Q12. Why Supabase instead of Firebase or raw PostgreSQL?

| Feature | Supabase | Firebase | Raw Postgres |
|---|---|---|---|
| pgvector support | ✅ Built-in | ❌ No | ✅ Manual install |
| Free tier | Generous | Generous | Need to host |
| SQL queries | ✅ Full SQL | ❌ NoSQL | ✅ Full SQL |
| Auto-generated API | ✅ | ✅ | ❌ |
| Realtime | ✅ | ✅ | ❌ |

**Decision**: Supabase gives us PostgreSQL (for pgvector), a REST API, and free hosting — perfect for a startup SaaS.

---

### Q13. Why Gemini API instead of OpenAI?

| Feature | Gemini | OpenAI |
|---|---|---|
| Free tier | ✅ Generous free quota | ❌ Pay per token |
| Embedding model | text-embedding-004 (768-dim) | text-embedding-3-small (1536-dim) |
| Chat model | gemini-1.5-flash (fast, cheap) | gpt-3.5-turbo / gpt-4 |
| India pricing | Very affordable | More expensive |

**Decision**: For an Indian B2B SaaS targeting SMBs (₹5K-15K/month clients), Gemini's free tier and low cost make it the practical choice.

---

## Part 4: Common Interview Questions

### Q14. What happens if the document doesn't contain the answer?

The system prompt instructs the AI: "If the answer is not in the provided context, honestly say you don't have that information and offer to connect the visitor with a human."

In fallback mode (no API key), the generator returns:
```
"I don't have that specific information in my documents right now. 
Would you like to leave your contact details so our team can follow up with you?"
```

---

### Q15. How do you handle different languages?

The prompt includes:
```
LANGUAGE INSTRUCTION:
Detect the language of the visitor's question and respond in the EXACT same language.
```

So if a visitor asks in Hindi: "क्या फीस है?" → The AI responds in Hindi.
If they ask in English: "What is the fee?" → The AI responds in English.

This works because Gemini is a multilingual model trained on Hindi, Tamil, Telugu, and 100+ languages.

---

### Q16. What are the limitations of this RAG system?

| Limitation | Why | Possible Fix |
|---|---|---|
| Max ~500 word chunks | Longer chunks lose precision | Semantic chunking with AI |
| No image/table extraction from PDFs | pdf-parse only gets text | Use document AI (Google Document AI) |
| Fallback embeddings are weak | Hash-based, not semantic | Always use Gemini API in production |
| No streaming responses | Entire answer loads at once | Implement Server-Sent Events (SSE) |
| Single embedding model | Tied to Gemini 768-dim | Add OpenAI/Cohere as options |

---

### Q17. How would you scale this to 10,000 clients?

1. **Database**: Add HNSW index on pgvector for faster search:
   ```sql
   CREATE INDEX ON chunks USING hnsw (embedding vector_cosine_ops);
   ```
2. **Caching**: Redis cache for frequently asked questions
3. **Queue**: Use background job queue (BullMQ) for document ingestion
4. **CDN**: Serve chat widget JS from CDN edge
5. **Separate vector DB**: Migrate to Pinecone/Qdrant for sub-10ms search
6. **Horizontal scaling**: Vercel auto-scales serverless functions

---

### Q18. How would you add streaming (word-by-word) responses?

Replace the single POST response with **Server-Sent Events (SSE)**:

```typescript
// Instead of:
const { answer } = await generateGroundedAnswer({ ... });
return NextResponse.json({ answer });

// Use streaming:
const stream = new ReadableStream({
  async start(controller) {
    // Call Gemini with streaming enabled
    for await (const chunk of geminiStream) {
      controller.enqueue(chunk.text());
    }
    controller.close();
  },
});
return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } });
```

---

### Q19. Explain the database schema and why each table exists.

| Table | Purpose | Key Columns |
|---|---|---|
| `clients` | One row per business client | name, slug, system_prompt, bot_name |
| `documents` | Tracks uploaded files | client_id, filename, status (pending/processing/ready/failed) |
| `chunks` | Individual text pieces with vectors | document_id, client_id, content, embedding (768-dim) |
| `conversations` | Groups messages into sessions | client_id, visitor_session_id |
| `messages` | Individual chat messages | conversation_id, role (user/assistant), content, sources |
| `leads` | Visitor contact submissions | client_id, name, contact, reason |

**Why `client_id` is on `chunks` table too?**
It's denormalized for performance. Without it, vector search would need a JOIN:
```sql
-- Slow (with JOIN):
SELECT c.* FROM chunks c JOIN documents d ON c.document_id = d.id WHERE d.client_id = 'x'

-- Fast (denormalized):
SELECT * FROM chunks WHERE client_id = 'x'
```

---

### Q20. What would you do differently if starting over?

1. **Use streaming from day 1** — word-by-word response feels more natural
2. **Add hybrid search** — combine vector search + keyword search (BM25) for better accuracy
3. **Use semantic chunking** — let an AI model decide where to split text, not just word count
4. **Add evaluation metrics** — track answer quality, retrieval precision, user satisfaction
5. **Implement RAG evaluation** — automated tests: "Given this document and this question, does the system return the right answer?"

---

## Part 5: Key Terms Glossary

| Term | Meaning |
|---|---|
| **RAG** | Retrieval-Augmented Generation — search docs first, then generate answer |
| **Embedding** | Converting text to a fixed-length list of numbers |
| **Vector** | That list of numbers (e.g., 768 floats) |
| **Cosine Similarity** | Math formula measuring how similar two vectors are (0 to 1) |
| **pgvector** | PostgreSQL extension for storing and searching vectors |
| **Chunking** | Splitting a large document into smaller searchable pieces |
| **Overlap** | Shared words between consecutive chunks to avoid losing context |
| **Top-K** | Number of most-similar chunks to retrieve (we use K=5) |
| **Grounding** | Making AI answers based on specific documents, not general knowledge |
| **Multi-tenancy** | Multiple clients sharing one app while seeing only their own data |
| **System Prompt** | Instructions to the AI about how to behave and respond |
| **Hallucination** | When an AI makes up false information — RAG prevents this |
| **Token** | ~¾ of a word. Models process tokens, not words. |
| **Context Window** | Maximum tokens an AI model can process at once |
| **Denormalization** | Duplicating data across tables for faster queries |
| **HMAC-SHA256** | Hash function used for password security |
| **SSE** | Server-Sent Events — streaming data from server to client |
| **Middleware** | Code that runs before route handlers (used for auth checks) |
