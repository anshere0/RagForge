'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building,
  FileText,
  MessageSquare,
  Users,
  Code,
  Save,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  BarChart3,
  Globe,
  RefreshCw,
  CopyPlus,
  X,
  RotateCw,
} from 'lucide-react';

interface ClientDetailClientProps {
  client: any;
  stats: {
    docsCount: number;
    chatsCount: number;
    leadsCount: number;
  };
}

export default function ClientDetailClient({ client, stats }: ClientDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    'settings' | 'documents' | 'embed' | 'chats' | 'leads' | 'analytics'
  >('settings');

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // URL Crawler state
  const [crawlUrlInput, setCrawlUrlInput] = useState('');
  const [crawling, setCrawling] = useState(false);

  // Document management state
  const [documentsList, setDocumentsList] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [docsLoading, setDocsLoading] = useState(false);
  const [reindexingId, setReindexingId] = useState<string | null>(null);

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Clone client modal state
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneName, setCloneName] = useState(`${client.name} (Copy)`);
  const [cloneSlug, setCloneSlug] = useState(`${client.slug}-copy`);
  const [cloning, setCloning] = useState(false);

  const fetchDocuments = useCallback(async () => {
    setDocsLoading(true);
    try {
      const res = await fetch(`/api/admin/clients/${client.id}/documents`);
      const data = await res.json();
      if (data.documents) {
        setDocumentsList(data.documents);
      }
    } catch {
      console.error('Failed to load documents');
    } finally {
      setDocsLoading(false);
    }
  }, [client.id]);

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch(`/api/admin/clients/${client.id}/analytics`);
      const data = await res.json();
      if (data.analytics) {
        setAnalyticsData(data.analytics);
      }
    } catch {
      console.error('Failed to load analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  }, [client.id]);

  // Chats and Leads state
  const [chatsList, setChatsList] = useState<any[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [leadsList, setLeadsList] = useState<any[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);

  const fetchChats = useCallback(async () => {
    setChatsLoading(true);
    try {
      const res = await fetch(`/api/admin/clients/${client.id}/chats`);
      const data = await res.json();
      if (data.conversations) {
        setChatsList(data.conversations);
      }
    } catch {
      console.error('Failed to load chats');
    } finally {
      setChatsLoading(false);
    }
  }, [client.id]);

  const fetchLeads = useCallback(async () => {
    setLeadsLoading(true);
    try {
      const res = await fetch(`/api/admin/clients/${client.id}/leads`);
      const data = await res.json();
      if (data.leads) {
        setLeadsList(data.leads);
      }
    } catch {
      console.error('Failed to load leads');
    } finally {
      setLeadsLoading(false);
    }
  }, [client.id]);

  useEffect(() => {
    if (activeTab === 'documents') {
      fetchDocuments();
    } else if (activeTab === 'chats') {
      fetchChats();
    } else if (activeTab === 'leads') {
      fetchLeads();
    } else if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [activeTab, fetchDocuments, fetchChats, fetchLeads, fetchAnalytics]);

  // Form states
  const [name, setName] = useState(client.name);
  const [slug, setSlug] = useState(client.slug);
  const [logoUrl, setLogoUrl] = useState(client.logo_url || '');
  const [primaryColor, setPrimaryColor] = useState(client.primary_color || '#3B82F6');
  const [botName, setBotName] = useState(client.bot_name || 'AI Assistant');
  const [welcomeMessage, setWelcomeMessage] = useState(client.welcome_message || '');
  const [systemPrompt, setSystemPrompt] = useState(client.system_prompt || '');
  const [llmProvider, setLlmProvider] = useState(client.llm_provider || 'gemini');
  const [clientPassword, setClientPassword] = useState('');

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/clients/${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          logo_url: logoUrl,
          primary_color: primaryColor,
          bot_name: botName,
          welcome_message: welcomeMessage,
          system_prompt: systemPrompt,
          llm_provider: llmProvider,
          client_password: clientPassword || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Client settings updated successfully' });
        router.refresh();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update client' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setSaving(false);
    }
  };

  const handleCrawlUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crawlUrlInput.trim()) return;
    setCrawling(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/clients/${client.id}/crawl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: crawlUrlInput.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: `Website URL crawled and indexed cleanly into ${data.chunkCount} vector chunks!`,
        });
        setCrawlUrlInput('');
        fetchDocuments();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to crawl URL' });
      }
    } catch {
      setMessage({ type: 'error', text: 'URL crawling failed.' });
    } finally {
      setCrawling(false);
    }
  };

  const handleCloneClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setCloning(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/clients/${client.id}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cloneName, slug: cloneSlug }),
      });
      const data = await res.json();

      if (data.success && data.client) {
        setShowCloneModal(false);
        router.push(`/admin/clients/${data.client.id}`);
        router.refresh();
      } else {
        alert(data.error || 'Failed to clone client settings');
      }
    } catch {
      alert('Failed to clone client settings');
    } finally {
      setCloning(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete client "${client.name}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/clients/${client.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        router.push('/admin');
        router.refresh();
      } else {
        alert(data.error || 'Failed to delete client');
      }
    } catch {
      alert('Failed to delete client');
    } finally {
      setDeleting(false);
    }
  };

  const embedCode = `<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget.js" data-client="${slug}"></script>`;

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 hover:bg-slate-800 text-slate-300 transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">{client.name}</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-mono">
                  {client.slug}
                </span>
              </div>
              <p className="text-xs text-slate-400">Created {new Date(client.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCloneModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
            >
              <CopyPlus className="w-3.5 h-3.5 text-blue-400" /> Clone Template
            </button>
            <a
              href={`/chat/${client.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium transition"
            >
              Preview Widget <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> {deleting ? 'Deleting...' : 'Delete Client'}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-2 border-t border-slate-800/60 pt-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-b-2 transition cursor-pointer shrink-0 ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building className="w-4 h-4" /> Branding & Prompt
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-b-2 transition cursor-pointer shrink-0 ${
              activeTab === 'documents'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" /> Documents ({stats.docsCount})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-b-2 transition cursor-pointer shrink-0 ${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" /> Analytics
          </button>
          <button
            onClick={() => setActiveTab('embed')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-b-2 transition cursor-pointer shrink-0 ${
              activeTab === 'embed'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-4 h-4" /> Embed Snippet
          </button>
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-b-2 transition cursor-pointer shrink-0 ${
              activeTab === 'chats'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Chats ({stats.chatsCount})
          </button>
          <button
            onClick={() => setActiveTab('leads')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-b-2 transition cursor-pointer shrink-0 ${
              activeTab === 'leads'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" /> Leads ({stats.leadsCount})
          </button>
        </div>
      </header>

      {/* Clone Client Modal */}
      {showCloneModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CopyPlus className="w-5 h-5 text-blue-400" /> Clone Client Settings
              </h3>
              <button
                onClick={() => setShowCloneModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Create a new client instant scaffold by cloning system prompt, bot name, and branding from <strong>{client.name}</strong>.
            </p>

            <form onSubmit={handleCloneClient} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">New Client Business Name</label>
                <input
                  type="text"
                  required
                  value={cloneName}
                  onChange={(e) => setCloneName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">New Client Slug</label>
                <input
                  type="text"
                  required
                  value={cloneSlug}
                  onChange={(e) => setCloneSlug(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCloneModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={cloning}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium"
                >
                  {cloning ? 'Cloning...' : 'Create Cloned Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {message && (
          <div
            className={`p-4 rounded-xl mb-6 text-sm flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Tab 1: Settings */}
        {activeTab === 'settings' && (
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-6">
              <h2 className="text-base font-semibold text-white">Client Configuration</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2">
                    Business Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2">
                    Slug
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2">
                    Set Client Portal Password
                  </label>
                  <input
                    type="password"
                    placeholder="Set password for client /login"
                    value={clientPassword}
                    onChange={(e) => setClientPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2">
                    Bot Name
                  </label>
                  <input
                    type="text"
                    value={botName}
                    onChange={(e) => setBotName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-10 h-10 rounded-lg bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 font-mono text-sm uppercase"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Welcome Message
                </label>
                <input
                  type="text"
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  LLM Provider
                </label>
                <select
                  value={llmProvider}
                  onChange={(e) => setLlmProvider(e.target.value)}
                  className="w-full md:w-64 px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-sm"
                >
                  <option value="gemini">Gemini 1.5 Flash (Default)</option>
                  <option value="openai">OpenAI GPT-4o-mini</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  System Prompt Template
                </label>
                <textarea
                  rows={6}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-xs font-mono leading-relaxed"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm shadow-lg shadow-blue-600/20 transition cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: Documents */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            {/* Website URL Crawler Form */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Ingest Website Web Page URL</h3>
              </div>
              <p className="text-xs text-slate-400">
                Enter a business web page URL (e.g. <code className="text-blue-400">https://apollodental.in/services</code>) to automatically scrape and index its text into the vector knowledge base.
              </p>

              <form onSubmit={handleCrawlUrl} className="flex gap-3">
                <input
                  type="url"
                  required
                  placeholder="https://example.com/about-us"
                  value={crawlUrlInput}
                  onChange={(e) => setCrawlUrlInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                />
                <button
                  type="submit"
                  disabled={crawling}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                >
                  <Globe className="w-4 h-4" /> {crawling ? 'Crawling...' : 'Crawl & Index URL'}
                </button>
              </form>
            </div>

            {/* Document File Upload */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-white">Client Documents</h2>
                  <p className="text-xs text-slate-400">Upload business FAQs, fee schedules, or services guides (PDF, DOCX, TXT).</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 font-mono">
                  {documentsList.length} Uploaded
                </span>
              </div>

              {/* Upload Zone */}
              <div className="p-8 border-2 border-dashed border-slate-800 hover:border-blue-500/50 rounded-2xl bg-slate-950/40 text-center space-y-4 transition">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    {uploading ? 'Processing document (Extracting → Chunking → Embedding)...' : 'Click to select or drag PDF, DOCX, or TXT file'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Maximum file size: 10MB</p>
                </div>

                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  disabled={uploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploading(true);
                    setMessage(null);

                    const formData = new FormData();
                    formData.append('file', file);

                    try {
                      const res = await fetch(`/api/admin/clients/${client.id}/documents`, {
                        method: 'POST',
                        body: formData,
                      });
                      const data = await res.json();

                      if (data.success) {
                        setMessage({
                          type: 'success',
                          text: `Document "${file.name}" indexed successfully into ${data.chunkCount} vector chunks!`,
                        });
                        fetchDocuments();
                      } else {
                        setMessage({
                          type: 'error',
                          text: data.error || 'Failed to process document',
                        });
                      }
                    } catch {
                      setMessage({ type: 'error', text: 'Document upload failed.' });
                    } finally {
                      setUploading(false);
                      e.target.value = '';
                    }
                  }}
                  className="block w-full text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer max-w-xs mx-auto"
                />
              </div>

              {/* Document List */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Indexed Knowledge Base Documents
                </h3>

                {docsLoading ? (
                  <p className="text-xs text-slate-500">Loading document index...</p>
                ) : documentsList.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No documents uploaded yet for this client.</p>
                ) : (
                  <div className="space-y-2">
                    {documentsList.map((doc: any) => (
                      <div
                        key={doc.id}
                        className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-mono text-xs uppercase font-bold shrink-0">
                            {doc.document_type || doc.source_type}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-200">{doc.filename}</p>
                            <p className="text-xs text-slate-500">
                              Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 ${
                              doc.status === 'ready'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : doc.status === 'processing'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : doc.status === 'failed'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {doc.status === 'ready' && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {doc.status === 'failed' && <AlertCircle className="w-3.5 h-3.5" />}
                            {doc.status}
                          </span>

                          <button
                            title="Re-index document"
                            onClick={async () => {
                              setReindexingId(doc.id);
                              try {
                                const res = await fetch(
                                  `/api/admin/clients/${client.id}/documents/${doc.id}`,
                                  { method: 'POST' }
                                );
                                const data = await res.json();
                                if (data.success) {
                                  fetchDocuments();
                                } else {
                                  alert(data.error || 'Failed to re-index');
                                }
                              } catch {
                                alert('Error re-indexing document');
                              } finally {
                                setReindexingId(null);
                              }
                            }}
                            className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                          >
                            <RotateCw className={`w-4 h-4 ${reindexingId === doc.id ? 'animate-spin' : ''}`} />
                          </button>

                          <button
                            title="Delete document"
                            onClick={async () => {
                              if (!confirm(`Delete document "${doc.filename}" and its vector chunks?`)) return;
                              try {
                                const res = await fetch(
                                  `/api/admin/clients/${client.id}/documents/${doc.id}`,
                                  { method: 'DELETE' }
                                );
                                const data = await res.json();
                                if (data.success) {
                                  fetchDocuments();
                                } else {
                                  alert(data.error || 'Failed to delete document');
                                }
                              } catch {
                                alert('Error deleting document');
                              }
                            }}
                            className="p-1.5 rounded-lg border border-slate-800 hover:border-red-500/40 hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Analytics */}
        {activeTab === 'analytics' && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-6">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" /> Client Analytics & Conversation Performance
            </h2>

            {analyticsLoading ? (
              <p className="text-xs text-slate-500">Loading analytics metrics...</p>
            ) : !analyticsData ? (
              <p className="text-xs text-slate-500">No analytics data recorded yet.</p>
            ) : (
              <div className="space-y-6">
                {/* Metric Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <p className="text-xs font-medium text-slate-400">Total Conversations</p>
                    <p className="text-2xl font-bold text-white mt-1">{analyticsData.totalConversations}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <p className="text-xs font-medium text-slate-400">Total Messages Handled</p>
                    <p className="text-2xl font-bold text-blue-400 mt-1">{analyticsData.totalMessages}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <p className="text-xs font-medium text-slate-400">Leads Captured</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">{analyticsData.totalLeads}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <p className="text-xs font-medium text-slate-400">Lead Conversion Rate</p>
                    <p className="text-2xl font-bold text-purple-400 mt-1">{analyticsData.leadConversionRate}%</p>
                  </div>
                </div>

                {/* Top Questions Table */}
                <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Top Visitor Question Topics</h3>
                  {analyticsData.topQuestions?.length === 0 ? (
                    <p className="text-xs text-slate-500">No questions recorded yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {analyticsData.topQuestions?.map((t: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                          <span className="text-slate-200 capitalize">&ldquo;{t.question}&rdquo;</span>
                          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono font-bold">
                            {t.count} asked
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Embed Snippet */}
        {activeTab === 'embed' && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-6">
            <h2 className="text-base font-semibold text-white">Embed Chat Widget</h2>
            <p className="text-xs text-slate-400">
              Paste this single <code className="text-blue-400">&lt;script&gt;</code> snippet into your client&apos;s website HTML before the closing <code className="text-blue-400">&lt;/body&gt;</code> tag.
            </p>

            <div className="relative">
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-blue-300 overflow-x-auto">
                {embedCode}
              </pre>
              <button
                onClick={copyEmbedCode}
                className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
          </div>
        )}

        {/* Tab 5: Chats */}
        {activeTab === 'chats' && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">Visitor Chat History</h2>
                <p className="text-xs text-slate-400">Log of real-time conversations handled by this chatbot.</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 font-mono">
                {chatsList.length} Sessions
              </span>
            </div>

            {chatsLoading ? (
              <p className="text-xs text-slate-500">Loading chat logs...</p>
            ) : chatsList.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">No conversation history recorded yet.</p>
            ) : (
              <div className="space-y-4">
                {chatsList.map((conv: any) => (
                  <div key={conv.id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-2">
                      <span className="font-mono text-blue-400">Session ID: {conv.visitor_session_id}</span>
                      <span>{new Date(conv.started_at).toLocaleString()}</span>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {conv.messages?.map((m: any) => (
                        <div
                          key={m.id}
                          className={`p-3 rounded-xl text-xs ${
                            m.role === 'user'
                              ? 'bg-blue-500/10 border border-blue-500/20 text-blue-200 ml-6'
                              : 'bg-slate-900 border border-slate-800 text-slate-300 mr-6'
                          }`}
                        >
                          <p className="font-semibold text-[10px] uppercase text-slate-400 mb-1">{m.role}</p>
                          <p className="whitespace-pre-wrap">{m.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 6: Leads */}
        {activeTab === 'leads' && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">Captured Customer Leads</h2>
                <p className="text-xs text-slate-400">Contact information left by visitors for follow-up.</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                {leadsList.length} Leads
              </span>
            </div>

            {leadsLoading ? (
              <p className="text-xs text-slate-500">Loading leads...</p>
            ) : leadsList.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">No leads captured yet for this client.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Visitor Name</th>
                      <th className="px-4 py-3">Phone / Email</th>
                      <th className="px-4 py-3">Reason / Inquiry</th>
                      <th className="px-4 py-3">Captured Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {leadsList.map((lead: any) => (
                      <tr key={lead.id} className="hover:bg-slate-900/50">
                        <td className="px-4 py-3.5 font-semibold text-white">{lead.name}</td>
                        <td className="px-4 py-3.5 font-mono text-blue-400">{lead.contact}</td>
                        <td className="px-4 py-3.5 text-slate-400">{lead.reason || '—'}</td>
                        <td className="px-4 py-3.5 text-slate-500">
                          {new Date(lead.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
