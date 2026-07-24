# Rules — Guardrails for Whoever (or Whatever) Is Coding This

These apply for the whole project, every phase, no exceptions.

## Scope discipline

- Only build what the current phase in `PHASES.md` calls for. If a feature
  from a later phase would be "easy to add while I'm in here," don't — flag
  it and move on.
- If a request is ambiguous, state the assumption you're making rather than
  silently picking one and running with it.

## Multi-tenancy safety (the most important rule in this file)

- Every query that touches `documents`, `chunks`, `conversations`,
  `messages`, or `leads` MUST filter by `client_id`. No exceptions, no
  "I'll add the filter later." A missing `client_id` filter means one
  client's data leaking into another client's chatbot — this is the single
  most damaging bug this project could ship.
- Never hardcode a specific client's name, prompt, colors, or documents
  anywhere in the codebase. If you catch yourself typing a real client's
  name into a `.ts` file instead of pulling it from the database, stop.

## Secrets and security

- LLM API keys and the Supabase **service role** key are server-only. They
  must never appear in client-side code, never get sent to the browser, and
  never get logged.
- The Supabase **anon** key is fine client-side, but only combined with
  proper row-level security policies once those exist (Phase 3+). Until
  then, all data access goes through server-side API routes, not direct
  client-side Supabase calls.
- Never commit `.env` files. Always use `.env.example` with placeholder
  values for anything that needs a real secret.

## Code style

- TypeScript everywhere, strict mode on.
- Small, single-purpose components and functions. If a file is doing three
  unrelated things, split it.
- Prefer clear, boring code over clever one-liners — this codebase will be
  reused and modified for every new client, so the next read (by you or by
  an AI) needs to be fast.
- Consistent naming: `client_id` in the database, `clientId` in TypeScript —
  don't mix conventions within a layer.

## Dependencies

- Before installing a new package, say what it is and why it's needed.
  Prefer what's already in the stack (Next.js, Supabase client, shadcn/ui)
  over pulling in something new for a one-off need.

## LLM / RAG specific rules

- Every system prompt sent to the LLM must include the grounding instruction
  ("only answer from the provided context, say so if you don't know") — this
  is not optional per-client, it's baked into the prompt template itself.
- Always store and return which chunks were used as sources for an answer.
  Never fabricate a citation.
- Keep chunk size and retrieval `top_k` as named constants in one config
  location, not scattered magic numbers.

## Error handling

- Document upload/processing failures must update the document's `status`
  to `failed` and show that in the admin panel — never fail silently.
  Someone (you) needs to know a client's fee schedule PDF didn't index.
- Wrap all LLM and embedding API calls in try/catch with a clear fallback
  message to the end visitor ("Something went wrong, please try again or
  leave your contact info") — never let a raw error reach the chat widget.

## When you finish a chunk of work

- Update `MEMORY.md` with what was done, any decisions made, and what's next.
  Do this before moving to the next task, not "later."
