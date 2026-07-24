'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  FileText,
  X,
  UserCheck,
  CheckCircle2,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';

interface ChatWidgetViewProps {
  client: {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
    primary_color?: string;
    bot_name?: string;
    welcome_message?: string;
  };
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: { filename: string; snippet: string }[];
}

export default function ChatWidgetView({ client }: ChatWidgetViewProps) {
  const primaryColor = client.primary_color || '#3B82F6';
  const botName = client.bot_name || 'AI Assistant';

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: client.welcome_message || 'Hello! How can I help you today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Selected source modal
  const [selectedSource, setSelectedSource] = useState<{ filename: string; snippet: string } | null>(null);

  // Lead capture state
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadContact, setLeadContact] = useState('');
  const [leadReason, setLeadReason] = useState('');
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query || !query.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: client.slug,
          message: query.trim(),
          conversationId,
        }),
      });

      const data = await res.json();

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer || "I'm sorry, I couldn't generate a response.",
        sources: data.sources || [],
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Something went wrong. Please try again or leave your contact details so our team can follow up.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || !leadContact) return;

    setLeadSubmitting(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: client.slug,
          name: leadName,
          contact: leadContact,
          reason: leadReason || 'Question not found in documentation',
          conversationId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setLeadSuccess(true);
        setTimeout(() => {
          setShowLeadModal(false);
          setLeadSuccess(false);
          setLeadName('');
          setLeadContact('');
          setLeadReason('');
        }, 2000);
      }
    } catch {
      alert('Failed to submit contact details. Please try again.');
    } finally {
      setLeadSubmitting(false);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div
      className={`flex flex-col h-screen font-sans transition-colors ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Widget Header */}
      <header
        className="p-4 flex items-center justify-between text-white shadow-md border-b border-slate-800"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center gap-3">
          {client.logo_url ? (
            <img
              src={client.logo_url}
              alt={client.name}
              className="w-8 h-8 rounded-full object-cover bg-white/20 p-0.5"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-sm font-bold tracking-tight leading-none">{botName}</h1>
            <p className="text-[11px] text-white/80 mt-0.5">{client.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle Button */}
          <button
            title="Toggle theme"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="p-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition cursor-pointer"
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setShowLeadModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 text-white text-[11px] font-medium transition cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5" /> Leave Contact
          </button>
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div
        className={`flex-1 overflow-y-auto p-4 space-y-4 ${
          isDark ? 'bg-slate-950' : 'bg-slate-100'
        }`}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'text-white rounded-br-none font-medium'
                  : isDark
                  ? 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
              }`}
              style={{
                backgroundColor: msg.role === 'user' ? primaryColor : undefined,
              }}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>

              {/* Cited Sources */}
              {msg.sources && msg.sources.length > 0 && (
                <div
                  className={`mt-3 pt-2.5 border-t space-y-1.5 ${
                    isDark ? 'border-slate-800/80' : 'border-slate-200'
                  }`}
                >
                  <p
                    className={`text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    <FileText className="w-3 h-3 text-blue-500" /> Sourced from documents:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.sources.map((src, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedSource(src)}
                        className={`text-[10px] px-2 py-0.5 rounded-md font-mono flex items-center gap-1 transition cursor-pointer ${
                          isDark
                            ? 'bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700/60'
                            : 'bg-slate-200 hover:bg-slate-300 text-blue-700 border border-slate-300'
                        }`}
                      >
                        📄 {src.filename}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div
            className={`flex items-center gap-2 text-xs p-3 rounded-2xl w-fit border ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-slate-400'
                : 'bg-white border-slate-200 text-slate-600'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
            <span>Searching documents & generating answer...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div
        className={`p-3 border-t ${
          isDark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-200 bg-white'
        }`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Type your question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className={`flex-1 px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500'
                : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
            }`}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 rounded-xl text-white transition disabled:opacity-40 cursor-pointer"
            style={{ backgroundColor: primaryColor }}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Source Detail Modal */}
      {selectedSource && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div
            className={`rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div
              className={`flex items-center justify-between pb-3 border-b ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}
            >
              <h3 className="text-xs font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" /> {selectedSource.filename}
              </h3>
              <button
                onClick={() => setSelectedSource(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p
              className={`text-xs font-mono p-3 rounded-xl border leading-relaxed whitespace-pre-wrap ${
                isDark
                  ? 'bg-slate-950 border-slate-800/80 text-slate-300'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              {selectedSource.snippet}
            </p>
          </div>
        </div>
      )}

      {/* Lead Capture Modal */}
      {showLeadModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div
            className={`rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div
              className={`flex items-center justify-between pb-3 border-b ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}
            >
              <div>
                <h3 className="text-sm font-bold">Leave your contact details</h3>
                <p className="text-[11px] opacity-70">Our team will get back to you shortly</p>
              </div>
              <button
                onClick={() => setShowLeadModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {leadSuccess ? (
              <div className="p-6 text-center space-y-2 text-emerald-400">
                <CheckCircle2 className="w-8 h-8 mx-auto" />
                <p className="text-xs font-semibold">Thank you! Your details have been submitted.</p>
              </div>
            ) : (
              <form onSubmit={handleLeadSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-medium opacity-80 mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-xs ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium opacity-80 mb-1">Phone Number or Email *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +91 98765 43210 or rahul@email.com"
                    value={leadContact}
                    onChange={(e) => setLeadContact(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-xs ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium opacity-80 mb-1">How can we help you? (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Looking for pricing and availability"
                    value={leadReason}
                    onChange={(e) => setLeadReason(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-xs ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={leadSubmitting}
                  className="w-full py-2.5 rounded-xl text-white text-xs font-semibold transition cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  {leadSubmitting ? 'Submitting...' : 'Submit Contact Info'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
