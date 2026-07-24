# 🤖 RAGForge — Complete Documentation

> Written for absolute beginners. No prior AI/ML knowledge needed.

---

## Table of Contents

1. [What Problem Does This Solve?](#what-problem-does-this-solve)
2. [What is a Chatbot?](#what-is-a-chatbot)
3. [What is RAG?](#what-is-rag)
4. [The Tech Behind RAG (Explained Like You're 5)](#the-tech-behind-rag)
5. [What Technologies Does RAGForge Use?](#what-technologies-does-ragforge-use)
6. [How to Set Up & Run This Project](#how-to-set-up--run-this-project)
7. [Folder Structure (What Each File Does)](#folder-structure)
8. [Database Tables (Where Data Lives)](#database-tables)
9. [All API Endpoints (How Frontend Talks to Backend)](#all-api-endpoints)
10. [How the Chat Works Step by Step](#how-the-chat-works-step-by-step)
11. [How Authentication Works](#how-authentication-works)
12. [How Multi-Tenancy Works](#how-multi-tenancy-works)

---

## What Problem Does This Solve?

Imagine you run a business that sells chatbots to other businesses. Each business (a dental clinic, a university, a hospital) wants their OWN chatbot that answers questions from THEIR documents.

**Without RAGForge:**
- You'd build a separate chatbot for each client = months of work
- Each chatbot needs its own server, database, code = expensive
- Updating one chatbot doesn't help others = no reuse

**With RAGForge:**
- ONE platform serves ALL clients
- Each client gets their own branded chatbot in minutes
- Upload a document → chatbot is ready
- Clients can even manage their own chatbot through a self-serve portal

---

## What is a Chatbot?

A chatbot is a program that talks to people through text. You type a question, it types back an answer.

**Types of chatbots:**

| Type | How it works | Example |
|---|---|---|
| Rule-based | Matches keywords to pre-written answers | "Type 1 for sales, 2 for support" |
| AI-powered (general) | Uses a large language model (like ChatGPT) | Can answer anything but might make stuff up |
| **RAG chatbot** (what we build) | Searches YOUR documents first, then uses AI to write the answer | Only answers from your actual data |

---

## What is RAG?

**RAG = Retrieval-Augmented Generation**

Let's break this down word by word:

### 1. Retrieval (= Search)
Before answering, the system SEARCHES your documents for relevant information. Like a student looking through their notes before answering an exam question.

### 2. Augmented (= Enhanced)
The AI's knowledge is ENHANCED with your specific documents. Instead of relying on its training data (which might be outdated or wrong), it uses YOUR data.

### 3. Generation (= Write the answer)
After finding the relevant information, the AI GENERATES a natural-language answer in its own words.

### The RAG Flow (Super Simple):

```
         ┌─────────────────────────────────────────────────┐
         │                                                 │
         │   "What is the fee for BTech?"                  │
         │                                                 │
         └────────────────────┬────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   1. SEARCH     │    ← Look through your documents
                    │   (Retrieval)   │      for anything about "fee" + "BTech"
                    └────────┬────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   2. ATTACH     │    ← Give the relevant paragraphs
                    │   (Augmented)   │      to the AI as context
                    └────────┬────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   3. ANSWER     │    ← AI writes a nice answer
                    │   (Generation)  │      using ONLY your documents
                    └────────┬────────┘
                              │
                              ▼
         ┌─────────────────────────────────────────────────┐
         │                                                 │
         │   "The BTech fee is ₹1,80,000 per year          │
         │    including tuition and lab fees."              │
         │                                                 │
         └─────────────────────────────────────────────────┘
```

### Why is RAG Better Than Just Using ChatGPT?

| Problem with plain ChatGPT | How RAG fixes it |
|---|---|
| Makes up fake facts ("hallucination") | Only answers from YOUR documents |
| Training data is outdated | Your documents are always current |
| Doesn't know YOUR business | Fed with YOUR specific information |
| No source citations | Shows which document the answer came from |
| Can't be controlled | You write the system prompt rules |

---

## The Tech Behind RAG

RAG uses several clever tricks to work. Let me explain each one:

### Trick 1: Text Extraction (Getting text out of files)

Documents come in many formats — PDF, Word, plain text. Before we can search them, we need to extract the raw text.

```
📄 brochure.pdf     →  "Our university offers BTech, MBA, and PhD programs..."
📝 services.docx    →  "Teeth whitening costs ₹5,000. Root canal costs ₹8,000..."
📋 faq.txt          →  "Q: What are your hours? A: 9am to 6pm Monday-Saturday"
```

**Tools we use:**
- `pdf-parse` → reads PDF files
- `mammoth` → reads DOCX (Microsoft Word) files
- `Buffer.toString('utf-8')` → reads plain text files

### Trick 2: Chunking (Splitting documents into small pieces)

**Problem:** A 50-page document has ~25,000 words. AI models can only process a limited amount of text at once (called the "context window"). We can't send the whole document.

**Solution:** Split it into smaller pieces called "chunks" (~500 words each).

```
Original document (2000 words):
┌──────────────────────────────────────────────────────────┐
│ The university was founded in 1990. It offers BTech in   │
│ Computer Science, Electronics, and Mechanical. The fee   │
│ for BTech is ₹1,80,000 per year. Hostel charges are      │
│ ₹85,000. Scholarships available for merit students....   │
│ ....(2000 words total)....                               │
└──────────────────────────────────────────────────────────┘

After chunking (4 chunks of ~500 words each):
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Chunk 1    │  │   Chunk 2    │  │   Chunk 3    │  │   Chunk 4    │
│ (~500 words) │  │ (~500 words) │  │ (~500 words) │  │ (~500 words) │
│              │  │              │  │              │  │              │
│ About the    │  │ Fee details  │  │ Scholarship  │  │ Campus       │
│ university   │  │ and hostel   │  │ information  │  │ facilities   │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

**What is "overlap"?**
When we split, some sentences might get cut in half. Overlap means we include the last ~80 words of the previous chunk at the start of the next chunk. This way, no sentence is lost:

```
Chunk 1: "...The fee for BTech is ₹1,80,000 per year. Hostel"
Chunk 2: "₹1,80,000 per year. Hostel charges are ₹85,000..."
                              ↑ these words appear in BOTH chunks
```

### Trick 3: Vector Embeddings (Turning words into numbers)

**The big problem:** Computers don't understand words. They understand numbers. How do we search for "similar meaning" when computers only see numbers?

**The solution: Embeddings.** We use an AI model to convert text into a long list of numbers (called a "vector"). The magic is that **similar sentences produce similar numbers**.

```
"What is the fee structure?"      →  [0.12, -0.34, 0.56, 0.78, ...]  (768 numbers)
"How much does BTech cost?"       →  [0.11, -0.33, 0.55, 0.77, ...]  (almost the same!)
"Best pizza place in town"        →  [0.89, 0.45, -0.67, -0.12, ...]  (totally different!)
```

**Why 768 numbers?** Google's Gemini embedding model (`text-embedding-004`) outputs exactly 768 numbers. Each number represents some aspect of meaning — topic, sentiment, formality, context, etc. We don't know exactly what each number means, but the AI learned these patterns from billions of text examples.

**What is an "embedding model"?** It's a special AI model trained specifically to convert text → numbers. It doesn't generate text — it only creates number representations. We use Google's `text-embedding-004` model.

### Trick 4: Vector Search (Finding the right chunks)

Now that every chunk is stored as 768 numbers, and the user's question is also 768 numbers, we can find the most similar chunks using math.

**Cosine Similarity** measures how "similar" two lists of numbers are:
- **1.0** = exactly the same meaning
- **0.5** = somewhat related
- **0.0** = completely unrelated

```
User asks: "What is the fee?"     →  vector: [0.12, -0.34, 0.56, ...]

Compare with every stored chunk:
  Chunk 1 (about fees):    similarity = 0.89  ✅ Very relevant!
  Chunk 2 (about campus):  similarity = 0.23  ❌ Not relevant
  Chunk 3 (about hostel):  similarity = 0.45  🔶 Somewhat relevant
  Chunk 4 (about courses): similarity = 0.31  ❌ Not relevant

→ Return Chunk 1 (and maybe Chunk 3) as context
```

**Where does this search happen?** In our PostgreSQL database using an extension called **pgvector**. It adds a special column type (`VECTOR(768)`) and a distance operator (`<=>`) that computes cosine distance between vectors.

```sql
-- This SQL finds the 5 most similar chunks to the question
SELECT content, 1 - (embedding <=> question_vector) AS similarity
FROM chunks
WHERE client_id = 'some-client-id'     -- only search THIS client's documents
ORDER BY embedding <=> question_vector  -- closest first
LIMIT 5;
```

### Trick 5: LLM Generation (The AI writes the answer)

Now we have:
- The user's question
- The 5 most relevant document chunks
- The conversation history (what they asked before)
- The system prompt (rules for how the bot should behave)

We pack all of this into one big prompt and send it to **Google Gemini** (an LLM — Large Language Model):

```
"You are a helpful assistant for Apollo Dental Clinic.

Here are the relevant document sections:
[Source 1]: Our teeth whitening service costs ₹5,000...
[Source 2]: Opening hours are 9am-6pm Monday to Saturday...

The visitor asked: "How much is teeth whitening?"

Write a helpful answer using ONLY the information above."
```

Gemini reads all this and generates a natural-sounding answer: *"Teeth whitening at Apollo Dental costs ₹5,000. You can visit us Monday to Saturday, 9am-6pm."*

---

## What Technologies Does RAGForge Use?

### The Main Tools

| Tool | What it is | Why we use it | ELI5 (Explain Like I'm 5) |
|---|---|---|---|
| **Next.js 16** | Web framework by Vercel | Handles both frontend (what users see) AND backend (API logic) in one project | It's like a Swiss Army knife — one tool that does everything |
| **React 19** | UI library by Meta | Builds interactive user interfaces with components | The building blocks (buttons, forms, lists) that make up the website |
| **TypeScript** | Typed JavaScript | Catches bugs before you run the code | Like spell-check but for code |
| **Tailwind CSS** | CSS utility framework | Style things fast with class names like `bg-blue-500` | Instead of writing CSS files, you add styles directly in HTML |
| **Supabase** | Database + Auth service | Free PostgreSQL database with vector search built in | A free online database that also understands AI vectors |
| **pgvector** | PostgreSQL extension | Stores and searches 768-dimension vectors | The part of the database that does the "find similar text" magic |
| **Gemini API** | Google's AI model | Generates embeddings AND chat answers | The brain — converts text to numbers AND writes answers |
| **pdf-parse** | PDF reader library | Extracts text from PDF files | Reads PDFs so the computer can understand them |
| **mammoth** | DOCX reader library | Extracts text from Word documents | Reads Word files so the computer can understand them |
| **Lucide React** | Icon library | Beautiful SVG icons | The little pictures (🏠📄🗑️) on buttons and menus |
| **Vercel** | Hosting platform | Deploys Next.js apps with one click | Where the website lives on the internet |

### How They Connect

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Frontend)                       │
│                                                                 │
│   React Components → Tailwind CSS → Lucide Icons                │
│                                                                 │
│   Pages: /admin, /dashboard, /login, /chat/[slug]               │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP requests (fetch)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS SERVER (Backend)                      │
│                                                                 │
│   API Routes: /api/chat, /api/admin/*, /api/client/*            │
│                                                                 │
│   RAG Engine: parser → chunker → embedder → retrieval → gen    │
└──────────┬────────────────────────────┬────────────────────────┘
           │                            │
           ▼                            ▼
┌────────────────────┐     ┌──────────────────────┐
│     SUPABASE       │     │    GEMINI API         │
│   (PostgreSQL +    │     │                       │
│    pgvector)       │     │  text-embedding-004   │
│                    │     │  gemini-1.5-flash     │
│  clients table     │     │                       │
│  documents table   │     │  Embeddings: text→768 │
│  chunks table      │     │  Chat: prompt→answer  │
│  conversations     │     │                       │
│  messages table    │     └──────────────────────┘
│  leads table       │
└────────────────────┘
```

---

## How to Set Up & Run This Project

### What You Need First

1. **Node.js** (v18 or later) — [Download here](https://nodejs.org)
   - This runs JavaScript on your computer
   - Check if installed: `node --version`

2. **A Supabase Account** (free) — [Sign up here](https://supabase.com)
   - This is your database in the cloud
   - Free tier gives you 500MB storage and unlimited API requests

3. **A Gemini API Key** (free) — [Get it here](https://aistudio.google.com/apikey)
   - This lets you use Google's AI for embeddings and chat
   - Free tier gives you 15 requests/minute

### Step-by-Step Setup

**Step 1: Download the code and install packages**
```bash
cd ragBOY
npm install
```
This downloads all the libraries listed in `package.json` into the `node_modules/` folder.

**Step 2: Create your environment file**
```bash
cp .env.example .env.local
```
Open `.env.local` and fill in these values:

```env
# Get these from Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci.....
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci.....

# Get this from https://aistudio.google.com/apikey
GEMINI_API_KEY=AIzaSy.....

# Choose your own admin login credentials
ADMIN_EMAIL=youremail@gmail.com
ADMIN_PASSWORD=YourSecurePassword123
```

**Where to find Supabase keys:**
1. Go to your Supabase project → Settings (gear icon) → API
2. Copy `Project URL` → paste as `NEXT_PUBLIC_SUPABASE_URL`
3. Copy `anon public` key → paste as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Copy `service_role` key → paste as `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ **NEVER share your `SUPABASE_SERVICE_ROLE_KEY` or commit `.env.local` to GitHub.** This key has admin access to your entire database.

**Step 3: Set up the database**
1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy-paste the contents of `supabase/migrations/01_initial_schema.sql` → Run
4. Copy-paste the contents of `supabase/migrations/02_phase3_client_auth.sql` → Run

This creates all 6 tables: `clients`, `documents`, `chunks`, `conversations`, `messages`, `leads`.

**Step 4: Start the development server**
```bash
npm run dev
```
Open `http://localhost:3000` in your browser. You should see the home page.

**Step 5: Log in as admin**
Go to `http://localhost:3000/admin/login` and enter your `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env.local`.

**Step 6: Create your first client**
1. Click "Add New Client"
2. Fill in: Name = "Test Clinic", Slug = "test-clinic"
3. Go to the Documents tab → Upload a `.txt` or `.pdf` file
4. Visit `http://localhost:3000/chat/test-clinic` — your chatbot is live!

---

## Folder Structure

```
ragBOY/
│
├── 📁 src/                           ← ALL source code lives here
│   │
│   ├── 📁 app/                       ← Next.js pages and API routes
│   │   │
│   │   ├── 📁 admin/                 ← Super-admin pages (YOU manage all clients)
│   │   │   ├── login/page.tsx        ← Admin login form
│   │   │   ├── page.tsx              ← Dashboard showing all your clients
│   │   │   ├── AdminDashboardClient.tsx ← The actual dashboard UI
│   │   │   └── clients/
│   │   │       ├── new/page.tsx      ← "Create New Client" form
│   │   │       └── [id]/            ← One page per client (dynamic route)
│   │   │           ├── page.tsx      ← Loads client data from database
│   │   │           └── ClientDetailClient.tsx ← Tabs: Settings, Docs, Chats, Leads, Analytics
│   │   │
│   │   ├── 📁 login/page.tsx         ← Client portal login (for your clients)
│   │   ├── 📁 dashboard/             ← Client self-serve portal (clients manage themselves)
│   │   │   ├── page.tsx              ← Auth check + loads data
│   │   │   └── ClientDashboardView.tsx ← Client's own management UI
│   │   │
│   │   ├── 📁 chat/[slug]/           ← The public chatbot widget
│   │   │   ├── page.tsx              ← Loads client branding
│   │   │   └── ChatWidgetView.tsx    ← The chat UI that visitors see and use
│   │   │
│   │   └── 📁 api/                   ← Backend API endpoints (server-side only)
│   │       ├── chat/route.ts         ← THE MAIN CHAT ENDPOINT
│   │       ├── leads/route.ts        ← Saves visitor contact info
│   │       ├── admin/...             ← Admin-only endpoints (13 routes)
│   │       └── client/...            ← Client self-serve endpoints (9 routes)
│   │
│   ├── 📁 lib/                       ← Shared utility code
│   │   ├── auth.ts                   ← Login/logout/password helpers
│   │   ├── constants.ts              ← Shared constants
│   │   ├── supabase/
│   │   │   ├── server.ts             ← Creates Supabase database connection
│   │   │   └── clientResolver.ts     ← Converts slug ↔ UUID
│   │   └── 📁 rag/                   ← THE AI BRAIN (8 files)
│   │       ├── config.ts             ← Settings (chunk size, overlap, etc.)
│   │       ├── parser.ts             ← Extracts text from PDF/DOCX/TXT
│   │       ├── chunker.ts            ← Splits text into ~500-word pieces
│   │       ├── embedder.ts           ← Converts text → 768 numbers (vectors)
│   │       ├── ingestion.ts          ← Orchestrates: parse → chunk → embed → store
│   │       ├── retrieval.ts          ← Searches database for relevant chunks
│   │       ├── generator.ts          ← Builds prompt + calls Gemini → answer
│   │       └── crawler.ts            ← Downloads web pages → extracts text
│   │
│   └── middleware.ts                 ← Guards /admin and /dashboard routes
│
├── 📁 public/
│   └── widget.js                     ← Embed script for client websites
│
├── 📁 supabase/migrations/
│   ├── 01_initial_schema.sql         ← Creates all database tables
│   └── 02_phase3_client_auth.sql     ← Adds client password column
│
├── 📁 docs/                          ← You are here! Documentation
│
├── .env.example                      ← Template for secrets (safe to share)
├── .env.local                        ← YOUR actual secrets (NEVER share!)
├── package.json                      ← Lists all dependencies
└── README.md                         ← Project overview for GitHub
```

---

## Database Tables

RAGForge uses 6 tables in Supabase (PostgreSQL). Here's what each one stores:

### Table 1: `clients` — Your business clients
| Column | Type | What it stores |
|---|---|---|
| `id` | UUID | Unique ID (auto-generated) |
| `name` | TEXT | Business name ("Apollo Dental") |
| `slug` | TEXT | URL-friendly name ("apollo-dental") |
| `logo_url` | TEXT | Link to their logo image |
| `primary_color` | TEXT | Brand color ("#3B82F6") |
| `bot_name` | TEXT | What the chatbot calls itself ("Dental Assistant") |
| `welcome_message` | TEXT | First message shown to visitors |
| `system_prompt` | TEXT | Instructions for the AI ("You are a dental assistant...") |
| `llm_provider` | TEXT | Which AI model to use ("gemini") |
| `client_password_hash` | TEXT | Hashed password for client portal login |

### Table 2: `documents` — Uploaded files
| Column | Type | What it stores |
|---|---|---|
| `id` | UUID | Unique document ID |
| `client_id` | UUID | Which client owns this document |
| `filename` | TEXT | Original filename ("faq.pdf") |
| `source_type` | TEXT | File type: "pdf", "docx", "txt", or "url" |
| `status` | TEXT | "pending" → "processing" → "ready" or "failed" |

### Table 3: `chunks` — Document pieces with vectors
| Column | Type | What it stores |
|---|---|---|
| `id` | UUID | Unique chunk ID |
| `document_id` | UUID | Which document this chunk came from |
| `client_id` | UUID | Which client owns this (for fast search) |
| `content` | TEXT | The actual text of this chunk (~500 words) |
| `embedding` | VECTOR(768) | 768 numbers representing the meaning |
| `metadata` | JSONB | Extra info: word count, chunk index, filename |

### Table 4: `conversations` — Chat sessions
| Column | Type | What it stores |
|---|---|---|
| `id` | UUID | Unique conversation ID |
| `client_id` | UUID | Which client's chatbot |
| `visitor_session_id` | TEXT | Identifies the visitor (anonymous) |

### Table 5: `messages` — Individual chat messages
| Column | Type | What it stores |
|---|---|---|
| `id` | UUID | Unique message ID |
| `conversation_id` | UUID | Which conversation this belongs to |
| `role` | TEXT | "user" or "assistant" |
| `content` | TEXT | The message text |
| `sources` | JSONB | Which documents were cited |

### Table 6: `leads` — Visitor contact info
| Column | Type | What it stores |
|---|---|---|
| `id` | UUID | Unique lead ID |
| `client_id` | UUID | Which client's visitor |
| `name` | TEXT | Visitor's name |
| `contact` | TEXT | Phone or email |
| `reason` | TEXT | What they were asking about |

### How the tables relate:

```
clients (1) ──────► documents (many) ──────► chunks (many)
   │                                            ↑
   │                                            │ vector search happens here
   │
   ├──────► conversations (many) ──────► messages (many)
   │
   └──────► leads (many)
```

---

## All API Endpoints

### What is an API endpoint?
An API endpoint is a URL that your frontend (browser) can call to get or send data. For example, when you click "Create Client", the browser sends a request to `POST /api/admin/clients`.

### Public Endpoints (no login needed)
| Method | URL | What it does | When it's called |
|---|---|---|---|
| `POST` | `/api/chat` | Send a message, get AI answer | Every time a visitor sends a chat message |
| `POST` | `/api/leads` | Save visitor's contact info | When visitor fills the lead capture form |

### Admin Endpoints (need admin login)
| Method | URL | What it does |
|---|---|---|
| `POST` | `/api/admin/login` | Log in as admin |
| `POST` | `/api/admin/logout` | Log out |
| `GET` | `/api/admin/clients` | Get list of all clients |
| `POST` | `/api/admin/clients` | Create a new client |
| `GET` | `/api/admin/clients/[id]` | Get one client's details |
| `PUT` | `/api/admin/clients/[id]` | Update a client's settings |
| `DELETE` | `/api/admin/clients/[id]` | Delete a client and all their data |
| `GET` | `/api/admin/clients/[id]/documents` | List a client's uploaded documents |
| `POST` | `/api/admin/clients/[id]/documents` | Upload a document for a client |
| `DELETE` | `/api/admin/clients/[id]/documents/[docId]` | Delete a specific document |
| `PUT` | `/api/admin/clients/[id]/documents/[docId]` | Re-process (re-index) a document |
| `POST` | `/api/admin/clients/[id]/crawl` | Crawl a website URL as a document |
| `POST` | `/api/admin/clients/[id]/clone` | Copy settings to create a new client |
| `GET` | `/api/admin/clients/[id]/chats` | View all chat conversations |
| `GET` | `/api/admin/clients/[id]/leads` | View all captured leads |
| `GET` | `/api/admin/clients/[id]/analytics` | Get dashboard stats |

### Client Self-Serve Endpoints (need client login)
| Method | URL | What it does |
|---|---|---|
| `POST` | `/api/client/login` | Client logs into their portal |
| `POST` | `/api/client/logout` | Client logs out |
| `GET` | `/api/client/me` | Get the logged-in client's profile |
| `GET` | `/api/client/documents` | List their own documents |
| `POST` | `/api/client/documents` | Upload their own document |
| `DELETE` | `/api/client/documents/[docId]` | Delete their own document |
| `PUT` | `/api/client/settings` | Update their own branding/prompt |
| `POST` | `/api/client/crawl` | Crawl a URL into their docs |
| `GET` | `/api/client/chats` | View their own chat logs |
| `GET` | `/api/client/leads` | View their own leads |

---

## How the Chat Works Step by Step

Here's exactly what happens when a visitor types "What are your fees?" in the chat widget:

```
STEP 1: VISITOR SENDS MESSAGE
────────────────────────────────
Browser sends: POST /api/chat
Body: { slug: "apollo-dental", message: "What are your fees?" }


STEP 2: FIND THE CLIENT
────────────────────────────────
SQL: SELECT * FROM clients WHERE slug = 'apollo-dental'
Result: { id: "abc-123", name: "Apollo Dental", system_prompt: "You are a dental assistant..." }


STEP 3: START OR RESUME CONVERSATION
────────────────────────────────
If no conversationId → INSERT INTO conversations (creates new chat session)
If conversationId provided → reuse existing session


STEP 4: GET CHAT HISTORY (MEMORY)
────────────────────────────────
SQL: SELECT role, content FROM messages WHERE conversation_id = '...' LIMIT 6
Result: Last 6 messages so the AI remembers what was discussed


STEP 5: SEARCH FOR RELEVANT CHUNKS (RETRIEVAL)
────────────────────────────────
5a. Convert question to numbers:
    "What are your fees?" → [0.12, -0.34, 0.56, ...]  (768 numbers)

5b. Search database for similar vectors:
    SQL: SELECT content FROM chunks
         WHERE client_id = 'abc-123'
         ORDER BY embedding <=> question_vector
         LIMIT 5

5c. Result: Top 5 most relevant text chunks from Apollo Dental's documents


STEP 6: GENERATE ANSWER (LLM CALL)
────────────────────────────────
Build prompt:
  "You are a dental assistant for Apollo Dental.
   Here are relevant docs: [chunk 1] [chunk 2] [chunk 3]
   Chat history: [previous messages]
   Question: What are your fees?
   Answer:"

Send to Gemini API → Get response:
  "At Apollo Dental, teeth whitening costs ₹5,000 and root canal treatment
   costs ₹8,000. Please call us at 080-1234-5678 to book an appointment."


STEP 7: SAVE MESSAGES
────────────────────────────────
INSERT INTO messages:
  { role: "user", content: "What are your fees?" }
  { role: "assistant", content: "At Apollo Dental, teeth whitening costs..." }


STEP 8: RETURN RESPONSE
────────────────────────────────
JSON: {
  answer: "At Apollo Dental, teeth whitening costs ₹5,000...",
  sources: [{ filename: "services.pdf", snippet: "..." }],
  conversationId: "conv-456"
}
```

---

## How Authentication Works

### Two Types of Users

| | Super-Admin (YOU) | Client (YOUR CUSTOMERS) |
|---|---|---|
| Login URL | `/admin/login` | `/login` |
| Dashboard URL | `/admin` | `/dashboard` |
| Cookie name | `ragforge_admin_session` | `ragforge_client_session` |
| Credentials | Email + Password (from `.env.local`) | Business Slug + Password (set by admin) |
| Can see | ALL clients' data | Only THEIR OWN data |

### How Login Works (Simplified)

**Admin Login:**
```
1. You type email + password at /admin/login
2. Server checks: does it match ADMIN_EMAIL and ADMIN_PASSWORD in .env.local?
3. If yes → creates a cookie: ragforge_admin_session = Base64("email:password")
4. Browser stores this cookie and sends it with every request
5. Every admin API route reads the cookie and checks if it's valid
```

**Client Login:**
```
1. Client types their business slug + password at /login
2. Server looks up the client by slug in the database
3. Server hashes the password and compares with stored hash
4. If match → creates a cookie: ragforge_client_session = Base64("clientId:slug")
5. Every client API route reads the cookie to know which client is logged in
```

### How Routes Are Protected (Middleware)

The file `src/middleware.ts` runs BEFORE every page load:

```
Visitor goes to /admin/clients/123
  → Middleware checks: does ragforge_admin_session cookie exist?
    → YES: allow access ✅
    → NO: redirect to /admin/login 🔒

Visitor goes to /dashboard
  → Middleware checks: does ragforge_client_session cookie exist?
    → YES: allow access ✅
    → NO: redirect to /login 🔒

Visitor goes to /chat/apollo-dental
  → No check needed (public page) ✅
```

---

## How Multi-Tenancy Works

**Multi-tenancy** = Multiple clients sharing ONE database, but each client can ONLY see their own data.

### How it's enforced:

Every single database query includes `WHERE client_id = '...'`:

```sql
-- When Apollo Dental asks for their documents:
SELECT * FROM documents WHERE client_id = 'apollo-dental-uuid'
-- They NEVER see Smile Dental's documents

-- When searching for answers in Apollo Dental's chat:
SELECT * FROM chunks WHERE client_id = 'apollo-dental-uuid'
-- Vector search is restricted to ONLY their chunks

-- When viewing leads:
SELECT * FROM leads WHERE client_id = 'apollo-dental-uuid'
-- They NEVER see another client's leads
```

### Security rule:
The `client_id` is ALWAYS taken from the authenticated session cookie — NEVER from the request body. This means even if someone tries to hack the API by sending a different `client_id`, the server ignores it and uses the one from their login session.
