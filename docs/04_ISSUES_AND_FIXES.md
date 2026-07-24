# Issues Faced & How They Were Solved

This document logs every major bug, error, and challenge encountered while building RAGForge — and how each was fixed. Read this to understand common RAG pitfalls.

---

## Issue 1: Chat Widget Returning 404 Error

**Symptom**: Opening `/chat/apollo-dental` showed a 404 page.

**Root Cause**: The `[slug]` dynamic route was looking up clients by UUID instead of slug.

**Fix**: Created `src/lib/supabase/clientResolver.ts` — a helper that checks if the input is a UUID or a slug, then resolves it to the correct `client_id`.

**Lesson**: Always support both UUID and slug lookups in multi-tenant apps. Users will bookmark URLs with slugs.

---

## Issue 2: Document Upload Failing Silently

**Symptom**: Uploading a PDF resulted in "Upload failed" with no useful error message.

**Root Cause**: The `pdf-parse` library tries to access `DOMMatrix` at import time, which crashes in Next.js server components during build.

**Fix**: Changed from `import pdfParse from 'pdf-parse'` to `const pdfParse = require('pdf-parse')` inside the function body. This delays loading until the function is actually called (dynamic require).

**Lesson**: Some npm packages assume they're running in a browser. When using them in Next.js server-side code, dynamic imports or `require()` inside function scope avoids build-time crashes.

---

## Issue 3: Chatbot Dumping Entire Document as One Block

**Symptom**: When asking "What is the fee structure?", the chatbot returned the ENTIRE document content — all 10 questions and answers in one giant paragraph.

**Root Cause**: Two issues:
1. **Chunker**: `words.join(' ')` was stripping all `\n` line breaks, flattening the document into one long string
2. **Generator fallback**: The Q&A block parser was treating the entire chunk as one block instead of splitting by numbered questions

**Fix (3 files)**:
1. `chunker.ts`: Rewrote to split by lines first, preserving `\n` characters in stored chunks
2. `parser.ts`: Added regex to force numbered questions onto new lines during text cleaning
3. `generator.ts`: Added regex lookahead splitting (`/(?=\b[0-9]+\.\s+[A-Z])/g`) to dynamically isolate Q&A blocks even from single-line chunks

**Lesson**: NEVER use `words.join(' ')` in a chunker — it destroys document structure. Preserve line breaks and formatting.

---

## Issue 4: Fallback Embeddings Not Matching Well

**Symptom**: When Gemini API key was invalid, the chatbot returned random unrelated answers.

**Root Cause**: The local fallback embedding generator creates "bag of words" vectors that only track word presence, not semantic meaning. Two sentences with the same words in different order get identical vectors.

**Fix**: Implemented multi-model fallback chain:
1. Try `text-embedding-004` (best model)
2. Try `embedding-001` (older model)
3. Fall back to local hash vectors (last resort)

**Lesson**: Always use real embedding APIs in production. Local fallbacks are for development/testing only.

---

## Issue 5: Typos Breaking Search Results

**Symptom**: Typing "wher is campus" or "fee structur for btech" returned "I don't have that information" instead of the correct answer.

**Root Cause**: Vector similarity search is sensitive to misspellings. "wher" and "where" produce different embeddings.

**Fix**: Added prefix-based fuzzy matching in the fallback Q&A extractor:
```typescript
// If exact match fails, try prefix matching
const prefix = token.slice(0, 4);  // "wher" → "wher" matches "where"
if (blockContent.includes(prefix)) score += 2;
```

**Lesson**: Real users make typos. Always add fuzzy matching as a safety net alongside vector search.

---

## Issue 6: Cross-Client Data Leakage Potential

**Symptom**: During testing, a crafted API request could theoretically fetch another client's documents if the `client_id` wasn't validated.

**Root Cause**: Some early API routes accepted `client_id` from the request body without verifying it matched the authenticated session.

**Fix**: All client self-serve API routes now extract `client_id` from the session cookie, NOT from the request body:
```typescript
const session = await getClientSession();
if (!session) return 401;
// Use session.clientId — NEVER trust client-provided IDs
```

**Lesson**: In multi-tenant apps, NEVER trust user-provided IDs for authorization. Always derive the `client_id` from the authenticated session.
