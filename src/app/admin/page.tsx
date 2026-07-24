import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { Bot, Plus, Users, Database, LogOut, CheckCircle2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    redirect('/admin/login');
  }

  let clients: any[] = [];
  let dbError: string | null = null;
  let dbConnected = false;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('clients')
      .select('id, name, slug, bot_name, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      dbError = error.message;
    } else {
      clients = data || [];
      dbConnected = true;
    }
  } catch (err: any) {
    dbError = err.message || 'Database connection error';
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">RAGForge</h1>
              <p className="text-xs text-slate-400">Operator Admin Control Panel</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <form action="/api/admin/logout" method="POST">
              <button
                type="submit"
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> Log out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Status Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-400">Total Clients</p>
              <p className="text-2xl font-bold text-white">{clients.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-400">Database Status</p>
              <div className="flex items-center gap-2">
                {dbConnected ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-semibold text-emerald-400">Supabase Connected</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-semibold text-amber-400">Credentials Pending</span>
                  </>
                )}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-400">Active Phase</p>
              <span className="text-sm font-semibold text-blue-400">Phase 0 — Setup</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Database Warning if needed */}
        {dbError && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm space-y-1">
            <p className="font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              Supabase Connection Note:
            </p>
            <p className="text-slate-400 text-xs">
              {dbError}. Ensure your <code className="text-amber-200">.env.local</code> has valid <code className="text-amber-200">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="text-amber-200">SUPABASE_SERVICE_ROLE_KEY</code>, and the migration SQL in <code className="text-amber-200">supabase/migrations/01_initial_schema.sql</code> has been executed.
            </p>
          </div>
        )}

        {/* Clients Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-tight">Client Assistants</h2>
            <Link
              href="/admin/clients/new"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-lg shadow-blue-600/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add New Client
            </Link>
          </div>

          {clients.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/60 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-200">No clients onboarded yet</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Once Phase 1 opens, you can add client records, upload documents, customize branding, and copy embed snippets here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map((client) => (
                <Link
                  key={client.id}
                  href={`/admin/clients/${client.id}`}
                  className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 transition group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-white group-hover:text-blue-400 transition">
                      {client.name}
                    </h3>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 font-mono">
                      {client.slug}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Bot: {client.bot_name || 'AI Assistant'}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
