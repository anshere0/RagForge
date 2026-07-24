'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
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
  Globe,
  RotateCw,
  LogOut,
  Bot,
} from 'lucide-react';

interface ClientDashboardViewProps {
  client: any;
  stats: {
    docsCount: number;
    chatsCount: number;
    leadsCount: number;
  };
}

export default function ClientDashboardView({ client, stats }: ClientDashboardViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'settings' | 'documents' | 'embed' | 'chats' | 'leads'>('settings');

  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [logoUrl, setLogoUrl] = useState(client.logo_url || '');
  const [primaryColor, setPrimaryColor] = useState(client.primary_color || '#3B82F6');
  const [botName, setBotName] = useState(client.bot_name || 'AI Assistant');
  const [welcomeMessage, setWelcomeMessage] = useState(client.welcome_message || '');
  const [systemPrompt, setSystemPrompt] = useState(client.system_prompt || '');

  // URL Crawler state
  const [crawlUrlInput, setCrawlUrlInput] = useState('');
  const [crawling, setCrawling] = useState(false);

  // Document management state
  const [documentsList, setDocumentsList] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [docsLoading, setDocsLoading] = useState(false);
  const [reindexingId, setReindexingId] = useState<string | null>(null);

  // Chats and Leads state
  const [chatsList, setChatsList] = useState<any[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [leadsList, setLeadsList] = useState<any[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);

  const fetchDocuments = useCallback(async () => {
    setDocsLoading(true);
    try {
      const res = await fetch('/api/client/documents');
      const data = await res.json();
      if (data.documents) setDocumentsList(data.documents);
    } catch {
      console.error('Failed to load documents');
    } finally {
      setDocsLoading(false);
    }
  }, []);

  const fetchChats = useCallback(async () => {
    setChatsLoading(true);
    try {
      const res = await fetch('/api/client/chats');
      const data = await res.json();
      if (data.conversations) setChatsList(data.conversations);
    } catch {
      console.error('Failed to load chats');
    } finally {
      setChatsLoading(false);
    }
  }, []);

  const fetchLeads = useCallback(async () => {
    setLeadsLoading(true);
    try {
      const res = await fetch('/api/client/leads');
      const data = await res.json();
      if (data.leads) setLeadsList(data.leads);
    } catch {
      console.error('Failed to load leads');
    } finally {
      setLeadsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'documents') fetchDocuments();
    else if (activeTab === 'chats') fetchChats();
    else if (activeTab === 'leads') fetchLeads();
  }, [activeTab, fetchDocuments, fetchChats, fetchLeads]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/client/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logo_url: logoUrl,
          primary_color: primaryColor,
          bot_name: botName,
          welcome_message: welcomeMessage,
          system_prompt: systemPrompt,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Branding and chatbot settings saved successfully!' });
        router.refresh();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update settings' });
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
      const res = await fetch('/api/client/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: crawlUrlInput.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: `Website URL indexed successfully into ${data.chunkCount} vector chunks!`,
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

  const handleLogout = async () => {
    await fetch('/api/client/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const embedCode = `<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget.js" data-client="${client.slug}"></script>`;

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Client Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">{client.name} Portal</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-mono">
                  {client.slug}
                </span>
              </div>
              <p className="text-xs text-slate-400">Client Self-Service Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`/chat/${client.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium transition"
            >
              Preview Bot <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
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
            onClick={() => setActiveTab('embed')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-b-2 transition cursor-pointer shrink-0 ${
              activeTab === 'embed'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-4 h-4" /> Embed Code
          </button>
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-b-2 transition cursor-pointer shrink-0 ${
              activeTab === 'chats'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Visitor Chats ({stats.chatsCount})
          </button>
          <button
            onClick={() => setActiveTab('leads')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-b-2 transition cursor-pointer shrink-0 ${
              activeTab === 'leads'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" /> Customer Leads ({stats.leadsCount})
          </button>
        </div>
      </header>

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

        {/* Tab 1: Branding & Prompt Settings */}
        {activeTab === 'settings' && (
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-6">
              <h2 className="text-base font-semibold text-white">Customize Your AI Assistant</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2">Bot Name</label>
                  <input
                    type="text"
                    value={botName}
                    onChange={(e) => setBotName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2">Theme Color</label>
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
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-sm uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2">Logo URL (Optional)</label>
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">Welcome Greeting</label>
                <input
                  type="text"
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">AI Assistant Instructions & Guardrails</label>
                <textarea
                  rows={6}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs font-mono leading-relaxed"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm shadow-lg shadow-blue-600/20 transition cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: Documents */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            {/* Website URL Ingestion */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Add Website Web Page URL</h3>
              </div>
              <p className="text-xs text-slate-400">
                Enter your website URL (e.g., <code className="text-blue-400">https://yourbusiness.com/about</code>) to index its content.
              </p>

              <form onSubmit={handleCrawlUrl} className="flex gap-3">
                <input
                  type="url"
                  required
                  placeholder="https://example.com/services"
                  value={crawlUrlInput}
                  onChange={(e) => setCrawlUrlInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                />
                <button
                  type="submit"
                  disabled={crawling}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                >
                  <Globe className="w-4 h-4" /> {crawling ? 'Indexing...' : 'Index Web Page'}
                </button>
              </form>
            </div>

            {/* Document File Upload */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-white">Knowledge Base Documents</h2>
                  <p className="text-xs text-slate-400">Upload FAQs, price lists, or service brochures (PDF, DOCX, TXT).</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 font-mono">
                  {documentsList.length} Files
                </span>
              </div>

              {/* Upload Dropzone */}
              <div className="p-8 border-2 border-dashed border-slate-800 hover:border-blue-500/50 rounded-2xl bg-slate-950/40 text-center space-y-4 transition">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    {uploading ? 'Extracting text and indexing into vector database...' : 'Select PDF, DOCX, or TXT file'}
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
                      const res = await fetch('/api/client/documents', {
                        method: 'POST',
                        body: formData,
                      });
                      const data = await res.json();

                      if (data.success) {
                        setMessage({
                          type: 'success',
                          text: `Document "${file.name}" indexed successfully!`,
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
                  Indexed Knowledge Documents
                </h3>

                {docsLoading ? (
                  <p className="text-xs text-slate-500">Loading document index...</p>
                ) : documentsList.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No documents uploaded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {documentsList.map((doc: any) => (
                      <div
                        key={doc.id}
                        className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-mono text-xs uppercase font-bold shrink-0">
                            {doc.document_type || 'file'}
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
                                const res = await fetch(`/api/client/documents/${doc.id}`, {
                                  method: 'POST',
                                });
                                const data = await res.json();
                                if (data.success) {
                                  fetchDocuments();
                                } else {
                                  alert(data.error || 'Failed to re-index');
                                }
                              } catch {
                                alert('Error re-indexing');
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
                              if (!confirm(`Delete document "${doc.filename}"?`)) return;
                              try {
                                const res = await fetch(`/api/client/documents/${doc.id}`, {
                                  method: 'DELETE',
                                });
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

        {/* Tab 3: Embed Snippet */}
        {activeTab === 'embed' && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-6">
            <h2 className="text-base font-semibold text-white">Embed Chat Widget on Your Website</h2>
            <p className="text-xs text-slate-400">
              Paste this single <code className="text-blue-400">&lt;script&gt;</code> tag into your website HTML before the closing <code className="text-blue-400">&lt;/body&gt;</code> tag.
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

        {/* Tab 4: Chats */}
        {activeTab === 'chats' && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">Visitor Chat History</h2>
                <p className="text-xs text-slate-400">Log of customer conversations handled by your chatbot.</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 font-mono">
                {chatsList.length} Sessions
              </span>
            </div>

            {chatsLoading ? (
              <p className="text-xs text-slate-500">Loading conversations...</p>
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

        {/* Tab 5: Leads */}
        {activeTab === 'leads' && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">Captured Customer Leads</h2>
                <p className="text-xs text-slate-400">Contact information left by your website visitors.</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                {leadsList.length} Leads
              </span>
            </div>

            {leadsLoading ? (
              <p className="text-xs text-slate-500">Loading customer leads...</p>
            ) : leadsList.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">No leads captured yet.</p>
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
