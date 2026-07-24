# PRD — RAGForge (Multi-Tenant RAG Chatbot Platform)

## 1. Problem

Indian small/mid businesses (colleges, clinics, coaching centers, local
service businesses) get the same repetitive questions from customers all day
(fees, timings, availability, services) and lose leads that arrive after
hours or get bored of waiting for a reply. They don't have the time, budget,
or technical skill to build an AI assistant themselves.

## 2. Who this is for

- **You (the operator):** manage all client chatbots from one admin panel.
- **Your clients (businesses):** get a branded chat widget on their website
  that answers questions from their own documents and captures leads. In v1,
  clients do NOT log in themselves — you configure everything for them.
- **End visitors (your clients' customers):** interact with the chat widget
  on the client's website.

## 3. What "done" looks like for v1 (MVP)

You can onboard a new client in under a few hours:
1. Create a client record.
2. Upload their PDFs/docs.
3. Set their brand colors, logo, welcome message, and system prompt.
4. Get an embed snippet.
5. Client pastes it into their site. It works.

Success = you can say yes to a new client and have their bot live same-day.

## 4. In scope for v1

**Admin side (you only):**
- Simple login (just for you — not client self-serve yet)
- Create/edit client records
- Upload PDF / DOCX / TXT per client
- Delete & re-index documents
- Edit system prompt per client
- Edit branding (logo URL, primary color, welcome message, bot name)
- Get embed `<script>` snippet per client
- View chat history per client
- View captured leads per client

**Chat widget (end visitor side):**
- Floating chat bubble, opens to a chat panel
- Ask questions, get answers grounded in that client's documents
- Source snippets shown with the answer (builds trust, reduces hallucination complaints)
- Suggested starter questions
- Conversation memory within a session
- Lead capture: if the bot can't answer, or after N messages, it asks for
  name + phone/email + reason
- Mobile responsive
- Light mode only for v1 (dark mode is a nice-to-have, not required)

**AI side:**
- RAG pipeline: ingest → chunk → embed → store → retrieve → generate → cite
- System prompt template per client (business name, tone, rules like
  "never give medical advice, refer to a doctor")
- Guardrail instruction baked into every prompt: answer only from retrieved
  context; if the answer isn't in the documents, say so honestly instead of
  guessing

## 5. Explicitly OUT of scope for v1 — do not build these yet

- Client self-serve login / dashboard (Phase 3)
- Website crawler (Phase 2)
- Analytics dashboard with graphs (Phase 2)
- Multi-language support (Phase 2/3)
- Dark mode toggle (Phase 2)
- WhatsApp, Telegram, Slack, Teams, Gmail, Calendar, CRM integrations (Phase 4 — paid upsells, only build for a client who's paying for it specifically)
- Voice chat (Phase 4)
- Billing/subscription automation (you'll invoice manually at first)
- Choosing between multiple LLM providers in the UI (hardcode one provider for v1, make it swappable in config, not a UI toggle)

If it's not listed under "In scope," it doesn't get built until its phase
comes up — even if it looks like a quick add. Small scope creep is how this
project turns into 6 months of building with zero paying clients.

## 6. Core user stories

- As the operator, I can add a new client and have their bot ready to embed
  in under a few hours.
- As a site visitor, I can ask a question and get an accurate answer sourced
  from that business's own documents, not a generic AI answer.
- As a site visitor, if the bot can't help, I can leave my contact info and
  the business will follow up.
- As the operator, I can see what visitors are asking across all my clients,
  so I know what documents are missing or what leads are coming in.

## 7. Success metrics (for you as a business, not vanity metrics)

- Time to onboard a new client (target: under 3 hours by client #3)
- Leads captured per client per week
- Number of paying clients (this is the real scoreboard — not features shipped)
