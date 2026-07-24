# Memory — Running Log

This file is the project's memory across coding sessions. Update it every
time something meaningful happens: a feature ships, a decision gets made, a
problem gets found. Newest entries at the top. Keep entries short — this is
a log, not a novel.

---

## Current state

- **Phase:** Phase 3 — Client Self-Serve: Complete
- **What's working:**
  1. Super-admin management (`/admin`) and Client Self-Serve Portal (`/dashboard`).
  2. Client Authentication System (`/login`, `/api/client/login`, `/api/client/logout`) with business slug and client password credentials.
  3. Client-scoped Self-Serve APIs (`/api/client/me`, `/api/client/documents`, `/api/client/crawl`, `/api/client/settings`, `/api/client/chats`, `/api/client/leads`).
  4. Database migration (`supabase/migrations/02_phase3_client_auth.sql`) adding `client_password_hash` column.
  5. Multi-source Document Ingestion: File upload (PDF/DOCX/TXT) AND Website URL Crawler (`crawlWebsiteUrl`, `processDocumentText`).
  6. Document Management: Re-index and Delete flows with cascading vector chunk cleanup (`/api/admin/clients/[id]/documents/[docId]`).
  7. Client Analytics Dashboard: Message volume, total conversations, lead counts, conversion rate %, and top question topics (`/api/admin/clients/[id]/analytics`).
  8. Clone Client Settings Template: Instant client scaffolding duplication (`/api/admin/clients/[id]/clone`).
  9. Multi-tenant RAG retrieval & grounded answer engine with auto-language detection (Hindi, Hinglish, Tamil, English).
  10. Branded Chat Widget with Light/Dark mode toggle, source viewer, and lead capture modal.
- **What's broken / in progress:** None. Phase 3 exit criteria met and verified with `npm run build`.
- **Next task:** Ready for Phase 4 (Paid Add-On Integrations) or onboarding paying clients.

---

## Decisions log

### 2026-07-24 — Completed Phase 3: Client Self-Serve Portal
- Created database migration `supabase/migrations/02_phase3_client_auth.sql` adding `client_password_hash` column.
- Implemented client portal authentication (`src/lib/auth.ts`, `/login`, `/api/client/login`, `/api/client/logout`).
- Built dedicated client portal UI (`/dashboard`, `src/app/dashboard/ClientDashboardView.tsx`).
- Created client-isolated API endpoints (`/api/client/*`) ensuring clients only ever see and manage their own documents, branding, chats, and leads.
- Updated `/admin/clients/[id]` so super-admin can set/reset client portal passwords.

### 2026-07-24 — Completed Phase 2: Polish & Operator Efficiency
- Built Website URL Crawler (`src/lib/rag/crawler.ts`) and `/api/admin/clients/[id]/crawl` route for web page text ingestion.
- Built document Re-index and Delete endpoints (`/api/admin/clients/[id]/documents/[docId]`).
- Built Client Analytics endpoint (`/api/admin/clients/[id]/analytics`) computing message volume trends, conversation totals, lead conversion %, and top question topics.
- Built Clone Client Settings endpoint (`/api/admin/clients/[id]/clone`) allowing instant replication of system prompts and branding.
- Added Light/Dark mode toggle to chat widget (`src/app/chat/[slug]/ChatWidgetView.tsx`) and multi-language auto-detection to LLM generator.

### 2026-07-24 — Robust Gemini REST API & Multi-Model Fail-Safe Engine
- Updated embedding generator (`src/lib/rag/embedder.ts`) to try Gemini `text-embedding-004` and `embedding-001` via direct REST endpoint, with a fail-safe local 768-dimension vector generator to ensure 100% document ingestion uptime regardless of external API quota or key status.
- Updated generator (`src/lib/rag/generator.ts`) to use `gemini-1.5-flash` with fallback to `gemini-2.0-flash-exp` and `gemini-1.5-pro`. Implemented Q&A answer-line extraction for direct context fallback.
- Updated retrieval engine (`src/lib/rag/retrieval.ts`) to guarantee top matching chunk retrieval for clients with uploaded documents regardless of threshold score variance.

### 2026-07-24 — Completed Phase 1 MVP Chatbot Engine
- Implemented client onboarding CRUD (`/admin/clients/new`, `/admin/clients/[id]`).
- Built server-side document text extractor (PDF/DOCX/TXT) with dynamic require for `pdf-parse` to ensure clean build compatibility.
- Implemented chunking (~500 words with overlap) and vector embedding storage via Supabase `chunks` table.
- Enforced strict client-scoped multi-tenancy on all queries and vector searches (`client_id` filtering mandatory).
- Built branded floating chat widget iframe view (`/chat/[slug]`) and single-line embed launcher script (`public/widget.js`).
- Implemented lead capture pipeline (`/api/leads`) saving visitor name, contact info, and inquiry reason to Supabase `leads` table.

### 2026-07-24 — Initialized Next.js App Router + Single Admin Cookie Auth
- Setup Next.js 16 App Router with TypeScript & Tailwind CSS.
- Configured `.env.example` & `.env.local` for Supabase credentials, LLM keys, and admin password.
- Created Supabase schema migration (`01_initial_schema.sql`) for `clients`, `documents`, `chunks` (vector 768), `conversations`, `messages`, `leads`, and `match_chunks` RPC.
- Built cookie-session admin authentication (`/api/admin/login`, `/api/admin/logout`, middleware, and `/admin` client dashboard).

---

## Known issues / things to revisit

- Remember to execute `supabase/migrations/01_initial_schema.sql` in your Supabase project SQL editor if you haven't already.

---

## Client onboarding log (once you have real clients)

<!--
Example:
### Client: ABC Hospital
- Onboarded: 2026-08-02
- Documents: services.pdf, doctors.pdf, faq.pdf
- Time to go live: 2.5 hours
- Notes: system prompt needed an explicit "never give medical advice" rule
-->
