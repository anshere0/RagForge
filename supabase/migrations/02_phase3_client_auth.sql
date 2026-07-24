-- Phase 3 Migration: Add Client Password Hash for Client Self-Serve Portal
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS client_password_hash TEXT;

-- Index for fast client slug lookup on login
CREATE INDEX IF NOT EXISTS idx_clients_slug ON public.clients(slug);
