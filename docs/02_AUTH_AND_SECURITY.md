# Authentication & Multi-Tenancy — How Security Works

This document explains how RAGForge handles two types of users (admin + client), protects routes, and ensures data isolation.

---

## Two Types of Users

| Feature | Super-Admin | Client |
|---|---|---|
| **Login page** | `/admin/login` | `/login` |
| **Dashboard** | `/admin` | `/dashboard` |
| **Cookie name** | `ragforge_admin_session` | `ragforge_client_session` |
| **Can see** | ALL clients' data | Only THEIR OWN data |
| **Can do** | Create/delete clients, manage everything | Upload docs, edit branding, view chats/leads |

---

## How Admin Authentication Works

**File: `src/lib/auth.ts`**

### Login Flow:
```
1. Admin enters email + password at /admin/login
2. Frontend sends POST /api/admin/login { email, password }
3. Server checks: email === ADMIN_EMAIL && password === ADMIN_PASSWORD
4. If match → creates token: Base64(email:password)
5. Sets cookie: ragforge_admin_session = "YWRtaW46cGFzc3dvcmQ="
6. Redirects to /admin
```

### Every Admin Request:
```
1. API route calls isAdminAuthenticated()
2. Reads ragforge_admin_session cookie
3. Compares with Base64(ADMIN_EMAIL:ADMIN_PASSWORD)
4. If match → allow. If not → return 401.
```

### Code (simplified):
```typescript
export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get('ragforge_admin_session');
  const expected = Buffer.from(`${ADMIN_EMAIL}:${ADMIN_PASSWORD}`).toString('base64');
  return session?.value === expected;
}
```

---

## How Client Authentication Works

### Login Flow:
```
1. Client enters business slug + password at /login
2. Frontend sends POST /api/client/login { slug, password }
3. Server finds client by slug in database
4. Checks: hashClientPassword(password) === client.client_password_hash
5. If match → creates token: Base64(clientId:slug)
6. Sets cookie: ragforge_client_session = "dXVpZDphcG9sbG8tZGVudGFs"
7. Redirects to /dashboard
```

### Password Hashing:
```typescript
export function hashClientPassword(password: string): string {
  const salt = 'ragforge-client-salt-2026';
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
}
```
- Uses HMAC-SHA256 with a fixed salt
- The plaintext password is NEVER stored — only the hash
- Even if someone steals the database, they can't reverse the hash

---

## How Route Protection Works (Middleware)

**File: `src/middleware.ts`**

The middleware runs BEFORE every page load. It checks:

```typescript
export function middleware(request: NextRequest) {
  // If visiting /admin/* (except /admin/login)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const adminCookie = request.cookies.get('ragforge_admin_session');
    if (!adminCookie) → redirect to /admin/login
  }

  // If visiting /dashboard/*
  if (pathname.startsWith('/dashboard')) {
    const clientCookie = request.cookies.get('ragforge_client_session');
    if (!clientCookie) → redirect to /login
  }
}
```

**Important**: Middleware only checks if a cookie EXISTS. The actual validation (checking the cookie value) happens in the API routes.

---

## How Multi-Tenancy Works (Data Isolation)

**Multi-tenancy** means multiple clients share the same database, but each can ONLY see their own data.

### How it's enforced:

Every database query includes a `client_id` filter:

```typescript
// Admin viewing a client's documents:
supabase.from('documents').select('*').eq('client_id', clientId)

// Vector search for relevant chunks:
WHERE c.client_id = p_client_id   -- in the SQL function

// Client self-serve (their own documents):
const session = await getClientSession();  // gets clientId from cookie
supabase.from('documents').select('*').eq('client_id', session.clientId)
```

### What this prevents:
- Client A cannot see Client B's documents
- Client A cannot read Client B's chat logs
- Client A cannot view Client B's leads
- Even if someone guesses another client's document ID, the `client_id` filter blocks access

---

## Security Checklist

| Risk | How RAGForge Handles It |
|---|---|
| Password stored in plain text | ✅ HMAC-SHA256 hashed |
| Admin secrets in code | ✅ Stored in `.env.local` (gitignored) |
| Cross-client data leakage | ✅ Every query filtered by `client_id` |
| Unauthenticated access to admin | ✅ Middleware redirects to login |
| Cookie tampering | ✅ Server validates cookie value matches expected token |
| Supabase service key exposed | ✅ Only used server-side (never in frontend) |
| SQL injection | ✅ Supabase client uses parameterized queries |
