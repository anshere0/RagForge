<p align="center">
  <h1 align="center">🤖 RAGForge</h1>
  <p align="center"><strong>Multi-Tenant RAG Chatbot SaaS Platform</strong></p>
  <p align="center">
    Create custom AI chatbots for any business in minutes — powered by their own documents.
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-pgvector-3ECF8E?logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Gemini_AI-API-4285F4?logo=google" alt="Gemini AI" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss" alt="Tailwind CSS" />
</p>

---

## 🧠 What is RAGForge?

RAGForge is a **white-label AI chatbot platform** that lets you create custom, document-grounded chatbots for different businesses.

**How it works:**
1. You create a client (e.g., "Apollo Dental Clinic")
2. Upload their documents (PDF, DOCX, TXT, or crawl a web page)
3. RAGForge creates an AI chatbot that answers questions using **only** their documents
4. Embed the chatbot on their website with a single `<script>` tag

Each client gets their own branded chatbot, their own login portal, and their own analytics — all from one platform.

### Why RAG?

**RAG (Retrieval-Augmented Generation)** prevents AI hallucination by grounding answers in your actual documents:

```
Traditional AI:  "I think the fee is around ₹50,000" (might be wrong)
RAG AI:          "The BTech fee is ₹1,80,000 per year" (directly from your document)
```

---

## ✨ Features

| Feature | Description |
|---|---|
| 📄 **Multi-format Document Ingestion** | Upload PDF, DOCX, TXT files or crawl web pages |
| 🔍 **Vector Search (pgvector)** | Semantic search using 768-dim Gemini embeddings |
| 💬 **Branded Chat Widget** | Embeddable chatbot with custom colors, logo, and bot name |
| 🏢 **Multi-Tenant Architecture** | One platform, unlimited clients, strict data isolation |
| 👤 **Admin Dashboard** | Manage all clients, documents, chats, leads, and analytics |
| 🔐 **Client Self-Serve Portal** | Clients can manage their own docs, branding, and view leads |
| 📊 **Analytics Dashboard** | Message volume, top questions, lead conversion rate |
| 🌙 **Dark/Light Mode** | Toggle on the chat widget |
| 🌍 **Multi-Language** | Auto-detects and responds in Hindi, Tamil, English, etc. |
| 📋 **Lead Capture** | Collects visitor name, contact, and inquiry reason |
| 📎 **Source Citations** | Shows which document the answer came from |
| 🧬 **Clone Templates** | Duplicate client settings for fast onboarding |
| 🔤 **Typo-Tolerant Search** | Handles misspellings in user queries |

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Full-stack React framework with API routes |
| **Language** | TypeScript 5 | Type-safe JavaScript |
| **Frontend** | React 19 + Tailwind CSS 4 | Interactive UI with utility-first styling |
| **Database** | Supabase (PostgreSQL) | Cloud-hosted relational database |
| **Vector Search** | pgvector extension | Cosine similarity search on 768-dim embeddings |
| **AI Models** | Google Gemini API | `text-embedding-004` (embeddings) + `gemini-1.5-flash` (chat) |
| **Document Parsing** | pdf-parse + mammoth | Extract text from PDF and DOCX files |
| **Icons** | Lucide React | Beautiful SVG icon set |
| **Deployment** | Vercel | One-click deployment with edge caching |

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org) v18+
- [Supabase](https://supabase.com) account (free tier)
- [Gemini API Key](https://aistudio.google.com/apikey) (free)

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/ragforge.git
cd ragforge
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Supabase (Dashboard → Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Google AI (https://aistudio.google.com/apikey)
GEMINI_API_KEY=AIzaSy...

# Admin credentials (choose your own)
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=YourSecurePassword
```

### 3. Set Up Database

Run these SQL files in your Supabase SQL Editor:

1. [`supabase/migrations/01_initial_schema.sql`](supabase/migrations/01_initial_schema.sql) — Creates tables + vector search function
2. [`supabase/migrations/02_phase3_client_auth.sql`](supabase/migrations/02_phase3_client_auth.sql) — Adds client auth column

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000/admin/login](http://localhost:3000/admin/login) and log in with your admin credentials.

---

## 📐 Architecture

### RAG Pipeline

```
Document Upload                              User Question
      │                                            │
      ▼                                            ▼
┌──────────┐                               ┌──────────────┐
│  Parser   │  PDF/DOCX/TXT → raw text      │   Embedder   │  question → 768-dim vector
└─────┬────┘                               └──────┬───────┘
      ▼                                            ▼
┌──────────┐                               ┌──────────────┐
│  Chunker  │  Split into ~500-word chunks   │  Retrieval   │  pgvector cosine search
└─────┬────┘                               └──────┬───────┘
      ▼                                            ▼
┌──────────┐                               ┌──────────────┐
│ Embedder  │  text → 768-dim vectors       │  Generator   │  context + LLM → answer
└─────┬────┘                               └──────┬───────┘
      ▼                                            ▼
┌──────────┐                                  💬 Answer
│ Supabase  │  Store chunks + vectors          + Sources
│ (pgvector)│
└──────────┘
```

### Database Schema

```
clients ─1:N─► documents ─1:N─► chunks (with VECTOR(768) embeddings)
   │
   ├──1:N──► conversations ─1:N─► messages
   │
   └──1:N──► leads
```

### API Routes

```
/api/
├── chat/           POST     Public chat endpoint
├── leads/          POST     Lead capture
├── admin/
│   ├── login       POST     Admin authentication
│   ├── logout      POST
│   └── clients/    GET/POST CRUD operations
│       └── [id]/
│           ├── documents/  GET/POST  Document management
│           ├── crawl       POST      Web page crawling
│           ├── clone       POST      Clone settings
│           ├── chats       GET       Conversation logs
│           ├── leads       GET       Lead list
│           └── analytics   GET       Dashboard stats
└── client/
    ├── login       POST     Client portal auth
    ├── logout      POST
    ├── me          GET      Client profile
    ├── documents/  GET/POST Self-serve document management
    ├── settings    PUT      Branding & prompt config
    ├── crawl       POST     Self-serve URL crawling
    ├── chats       GET      Own chat logs
    └── leads       GET      Own lead list
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── admin/            # Super-admin dashboard & client management
│   ├── login/            # Client portal login page
│   ├── dashboard/        # Client self-serve portal
│   ├── chat/[slug]/      # Public embeddable chat widget
│   └── api/              # All API routes (admin, client, chat, leads)
│
├── lib/
│   ├── auth.ts           # Authentication helpers (admin + client)
│   ├── supabase/         # Database connection & client resolver
│   └── rag/              # THE RAG ENGINE
│       ├── config.ts     # Chunk size, overlap, retrieval settings
│       ├── parser.ts     # PDF/DOCX/TXT text extraction
│       ├── chunker.ts    # Text splitting with overlap
│       ├── embedder.ts   # Gemini text-embedding-004 (768-dim vectors)
│       ├── ingestion.ts  # Full pipeline: parse → chunk → embed → store
│       ├── retrieval.ts  # pgvector semantic search
│       ├── generator.ts  # Gemini LLM answer generation
│       └── crawler.ts    # Web page text extraction
│
└── middleware.ts          # Route protection for /admin and /dashboard
```

---

## 🔒 Security

- **Passwords** are hashed with HMAC-SHA256 (never stored in plain text)
- **Admin secrets** stored in `.env.local` (gitignored)
- **Multi-tenancy** enforced via `client_id` filtering on every database query
- **Route protection** via middleware (redirects unauthenticated users)
- **Client data isolation** — `client_id` derived from session cookie, never from request body
- **Supabase service key** used only server-side (never exposed to browser)

---

## 📚 Documentation

Detailed documentation is available in the [`docs/`](docs/) folder:

| Document | Description |
|---|---|
| [00_PROJECT_DOCUMENTATION.md](docs/00_PROJECT_DOCUMENTATION.md) | Complete project guide with setup, architecture, APIs, and flows |
| [01_RAG_ENGINE_EXPLAINED.md](docs/01_RAG_ENGINE_EXPLAINED.md) | Deep dive into the 8-file RAG engine |
| [02_AUTH_AND_SECURITY.md](docs/02_AUTH_AND_SECURITY.md) | Authentication, middleware, and data isolation |
| [03_INTERVIEW_PREP.md](docs/03_INTERVIEW_PREP.md) | 20 interview Q&As covering RAG theory and implementation |
| [04_ISSUES_AND_FIXES.md](docs/04_ISSUES_AND_FIXES.md) | Bugs encountered and how they were solved |
| [05_BUILD_YOUR_OWN_RAG.md](docs/05_BUILD_YOUR_OWN_RAG.md) | Minimal step-by-step guide to build a RAG chatbot from scratch |

---

## 🧩 How to Embed the Chat Widget

After creating a client, add this to any website:

```html
<script
  src="https://your-domain.vercel.app/widget.js"
  data-ragforge-slug="apollo-dental"
></script>
```

This injects a floating chat bubble on the bottom-right corner of the website.

---

## 🗺️ Roadmap

- [x] Phase 0: Project setup + admin auth
- [x] Phase 1: MVP chatbot (upload → chat → leads)
- [x] Phase 2: Polish (crawler, analytics, clone, dark mode)
- [x] Phase 3: Client self-serve portal
- [ ] Phase 4: Paid integrations (WhatsApp, Telegram, Calendar, CRM)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

<p align="center">
  Built with ❤️ using Next.js, Supabase, and Google Gemini AI
</p>
