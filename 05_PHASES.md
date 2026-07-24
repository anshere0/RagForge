# Phases — Build Order

Work through these in order. Don't jump ahead. Mark the current phase as
`CURRENT` and update it as you progress — this file is how you (and the AI)
know what "done" means at each stage.

---

## Phase 0 — Setup (a few hours)
**Status: COMPLETE**

- Next.js project with TypeScript + Tailwind + shadcn/ui
- Supabase project created, pgvector extension enabled
- Tables created per `ARCHITECTURE.md` data model
- Env vars set up: Supabase URL/keys, LLM API key, embedding API key
- One admin login working (just you)
- Deployed empty shell to Vercel — confirms the pipeline works end to end
  before any real feature is built

**Exit criteria:** you can log into `/admin` on a live Vercel URL and see an
empty client list pulling from the real Supabase database.

---

## Phase 1 — MVP: one working chatbot end to end
**Status: COMPLETE**

- Create client form (name, slug, logo URL, color, welcome message, system prompt)
- PDF/DOCX/TXT upload → extract → chunk → embed → store, with status tracking
- Chat API route: retrieve relevant chunks for a client, call LLM, return
  answer + sources
- Chat widget (embeddable, branded per client) with:
  - message send/receive
  - source display
  - suggested starter questions
  - lead capture flow after N unanswered turns or on request
- Embed snippet generator in admin panel
- Basic chat history view per client in admin
- Basic leads view per client in admin

**Exit criteria:** you can create a client, upload 2-3 real documents, embed
the widget on a test page, ask it questions, get accurate cited answers, and
see a captured lead show up in the admin panel. This is the version you use
to sign your first paying client.

---

## Phase 2 — Polish and operator efficiency
**Status: COMPLETE**

- Website URL crawler as an alternative document source
- Re-index / delete document flows
- Analytics: message volume, top questions, lead count, per client
- Dark mode toggle on the widget
- Multi-language response (bot replies in the language the visitor used)
- Faster re-onboarding: clone-client-settings feature so a new client can
  start from a similar existing client's template

**Exit criteria:** onboarding a new, similar client takes under an hour.

---

## Phase 3 — Client self-serve
**Status: COMPLETE**

- Client-facing login (separate from your admin login)
- Row-level security so each client only ever sees their own data
- Client can upload/delete their own documents and edit their own branding
  and prompt within guardrails you set
- You keep a super-admin view across all clients

**Exit criteria:** a new client can be handed a login and set up their own
bot with minimal help from you.

---

## Phase 4 — Paid integrations (build per client, on request, not speculatively)

Each of these is a separate module, only built when a specific paying client
wants it — not built into the core platform speculatively.

- WhatsApp Business API integration
- Telegram bot
- Google Calendar appointment booking
- CRM push (HubSpot/Zoho/etc.)
- Voice chat
- Gmail auto-draft replies

**Exit criteria per integration:** one paying client is using it in
production and it's billed as an add-on.
