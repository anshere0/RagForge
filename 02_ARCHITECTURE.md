# Architecture — RAGForge

## 1. Tech stack (v1)

| Layer | Choice | Why |
|---|---|---|
| Frontend + Backend | Next.js (App Router) | One codebase, one deployment, API routes handle server logic — no separate backend service to run/monitor |
| UI | Tailwind CSS + shadcn/ui | Fast to build clean UI, matches what most vibe-coding tools are trained on |
| Database | Supabase (Postgres + pgvector) | Vector search + relational data (clients, leads, chat history) in one place, generous free tier |
| Auth (admin only, v1) | Supabase Auth, single admin account | You don't need multi-user auth yet — one login for you |
| LLM | Gemini 2.5 Flash (default) or OpenAI GPT-4o-mini | Cheap enough to run per-client without killing margins; swappable via env var, not a UI toggle |
| Embeddings | Gemini embedding model or OpenAI `text-embedding-3-small` | Must match whichever provider you pick — don't mix embedding models across a knowledge base |
| Hosting | Vercel | Zero-config Next.js deploys, generous free tier |
| Widget delivery | A single `<script>` tag that injects an iframe or web component | Same pattern as Intercom/Crisp — works on any client website regardless of their tech stack |

Dropped from the original plan: a separate FastAPI backend. Two backends
means two deployments, two places auth/env vars can go wrong, and no real
benefit at this scale — Next.js API routes handle ingestion, retrieval, and
generation fine for the traffic a small-business chatbot will see.

## 2. Multi-tenancy strategy

**One codebase, one deployment, one database — every table scoped by `client_id`.**

This is the key architectural decision. It's NOT "redeploy the app per
client" (that gets painful past client #3). It's also NOT "fully self-serve
SaaS with signup" yet (that's more than you need for v1). It's a middle
ground: one running app, multiple client records inside it, admin-managed.

Because every table is `client_id`-scoped from day one, moving to a
self-serve model in Phase 3 is mostly a new set of UI screens plus row-level
security policies — not a rebuild.

## 3. Data model

```
clients
  id
  name
  slug                 (used in the embed URL)
  logo_url
  primary_color
  bot_name
  welcome_message
  system_prompt
  llm_provider          (default from env, overridable per client)
  created_at

documents
  id
  client_id  → clients.id
  filename
  source_type            (pdf | docx | txt | url)
  status                 (pending | processing | ready | failed)
  uploaded_at

chunks
  id
  document_id → documents.id
  client_id   → clients.id   (duplicated here on purpose — makes vector search filtering by client fast and simple)
  content
  embedding    (vector, pgvector)
  metadata     (page number, section heading, etc.)

conversations
  id
  client_id → clients.id
  visitor_session_id
  started_at

messages
  id
  conversation_id → conversations.id
  role              (user | assistant)
  content
  sources           (jsonb — which chunks were cited)
  created_at

leads
  id
  client_id → clients.id
  conversation_id → conversations.id
  name
  contact               (phone or email)
  reason
  created_at
```

## 4. RAG pipeline (unchanged from your original plan — this part was right)

```
Document uploaded
  → extract text (pdf-parse / mammoth for docx / plain read for txt)
  → clean + chunk (e.g. ~500 tokens per chunk, with overlap)
  → embed each chunk
  → store chunk + embedding + client_id in `chunks` table
  → mark document status = ready

User question
  → embed the question
  → vector search chunks WHERE client_id = X, ordered by similarity
  → take top-k chunks
  → build prompt: [client's system_prompt] + [retrieved chunks] + [conversation history] + [question]
  → call LLM
  → return answer + which chunks were used as sources
  → store message + sources in `messages`
```

**Hallucination guardrail:** the system prompt template must always include
an explicit instruction like "Only answer using the provided context. If the
answer isn't in the context, say you don't have that information and offer
to collect their contact info instead of guessing." This is a prompt-level
control, not a separate feature — bake it into every client's system prompt
automatically, don't leave it optional.

## 5. Widget embed approach

```html
<script src="https://yourapp.com/widget.js" data-client="client-slug"></script>
```

The script injects a floating bubble + iframe pointing to
`yourapp.com/chat/[client-slug]`. The iframe is a lightweight, client-scoped
version of the chat UI. This keeps the widget isolated from the host site's
CSS (no style conflicts) and is the same pattern Intercom/Crisp/Chatbase use.

## 6. Admin panel routes (v1)

```
/admin/login
/admin                      — list of clients
/admin/clients/new          — create client
/admin/clients/[id]         — edit branding, prompt, documents
/admin/clients/[id]/documents
/admin/clients/[id]/chats   — chat history
/admin/clients/[id]/leads
/admin/clients/[id]/embed   — copy embed snippet
```

## 7. What changes in later phases (don't build now, just know it's coming)

- **Phase 2:** website crawler (fetch + strip HTML → treat as a document source), analytics aggregation queries, dark mode
- **Phase 3:** client-facing login, row-level security so each client only sees their own data, self-serve document upload
- **Phase 4:** integration workers (WhatsApp/Telegram via their APIs, Calendar booking, CRM push) — each as an isolated, optional module per client, not core platform code
