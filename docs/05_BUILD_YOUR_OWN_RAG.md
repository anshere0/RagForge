# Build Your Own RAG Chatbot — Step-by-Step Guide

If you want to build a RAG chatbot from absolute zero, follow these steps. This is the simplified recipe.

---

## Step 1: Set Up the Project

```bash
npx -y create-next-app@latest ./my-rag-chatbot --typescript --tailwind --app --eslint
cd my-rag-chatbot
npm install @supabase/supabase-js mammoth pdf-parse lucide-react
```

---

## Step 2: Create Supabase Database

Go to [supabase.com](https://supabase.com), create a project, then run this SQL:

```sql
-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Clients table (one row per business)
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  system_prompt TEXT DEFAULT 'You are a helpful assistant.',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents table (uploaded files)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chunks table (text pieces with vector embeddings)
CREATE TABLE chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding VECTOR(768),
  metadata JSONB DEFAULT '{}'
);

-- Vector search function
CREATE FUNCTION match_chunks(
  query_embedding VECTOR(768),
  match_count INT DEFAULT 5,
  p_client_id UUID DEFAULT NULL
)
RETURNS TABLE (id UUID, content TEXT, metadata JSONB, similarity FLOAT)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.content, c.metadata,
         1 - (c.embedding <=> query_embedding) AS similarity
  FROM chunks c
  WHERE c.client_id = p_client_id
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

---

## Step 3: Build the RAG Pipeline (4 Functions)

### Function 1: Parse documents
```typescript
// lib/rag/parser.ts
import mammoth from 'mammoth';

export async function extractText(buffer: Buffer, filename: string): Promise<string> {
  const ext = filename.split('.').pop()?.toLowerCase();

  if (ext === 'pdf') {
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    return data.text;
  }
  if (ext === 'docx') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  return buffer.toString('utf-8'); // TXT files
}
```

### Function 2: Chunk text
```typescript
// lib/rag/chunker.ts
export function chunkText(text: string, chunkSize = 500, overlap = 80): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length);
    chunks.push(words.slice(start, end).join(' '));
    if (end >= words.length) break;
    start += chunkSize - overlap;
  }

  return chunks;
}
```

### Function 3: Generate embeddings
```typescript
// lib/rag/embedder.ts
export async function embed(text: string): Promise<number[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: { parts: [{ text }] } }),
    }
  );
  const data = await res.json();
  return data.embedding.values; // 768 numbers
}
```

### Function 4: Generate answer
```typescript
// lib/rag/generator.ts
export async function generateAnswer(question: string, context: string): Promise<string> {
  const prompt = `Answer the question using ONLY the context below.

CONTEXT:
${context}

QUESTION: ${question}

ANSWER:`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );
  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}
```

---

## Step 4: Build the API Route

```typescript
// app/api/chat/route.ts
import { createClient } from '@supabase/supabase-js';
import { embed } from '@/lib/rag/embedder';
import { generateAnswer } from '@/lib/rag/generator';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

export async function POST(req: Request) {
  const { slug, message } = await req.json();

  // 1. Find client
  const { data: client } = await supabase
    .from('clients').select('*').eq('slug', slug).single();

  // 2. Embed the question
  const questionVector = await embed(message);

  // 3. Search for relevant chunks
  const { data: chunks } = await supabase.rpc('match_chunks', {
    query_embedding: questionVector,
    match_count: 5,
    p_client_id: client.id,
  });

  // 4. Build context from chunks
  const context = chunks.map((c: any) => c.content).join('\n\n');

  // 5. Generate answer
  const answer = await generateAnswer(message, context);

  return Response.json({ answer });
}
```

---

## Step 5: Build the Chat UI

```tsx
// app/chat/page.tsx
'use client';
import { useState } from 'react';

export default function Chat() {
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [input, setInput] = useState('');

  const sendMessage = async () => {
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: 'my-client', message: input }),
    });
    const data = await res.json();

    setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
  };

  return (
    <div>
      {messages.map((m, i) => (
        <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
          {m.content}
        </div>
      ))}
      <input value={input} onChange={e => setInput(e.target.value)} />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
```

---

## That's It!

This is the minimal RAG chatbot. RAGForge adds:
- Multi-tenant client management
- Admin dashboard
- Client self-serve portal
- Document status tracking
- Conversation history & memory
- Lead capture
- Analytics
- Website URL crawling
- Clone client templates
- Embed script generator
- Dark/light mode widget
- Typo-tolerant fallback matching
- Multi-language support

But at its core, every RAG chatbot is these 4 functions:
1. **Parse** → extract text from files
2. **Chunk** → split into searchable pieces
3. **Embed** → convert to numbers (vectors)
4. **Generate** → search + prompt + LLM = answer
