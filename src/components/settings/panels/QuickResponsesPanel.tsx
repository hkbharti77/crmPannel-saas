import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Zap, Plus, Search, Tag, Copy, Check, Edit2, Trash2,
  Loader2, AlertCircle, Sparkles, User, Building, Calendar, Info
} from 'lucide-react';
import { PanelHeader, SectionCard } from './_shared';

interface CannedResponse {
  id: string;
  title: string;
  shortcut: string;
  content: string;
  category: string;
  isShared: boolean;
  usageCount: number;
  createdByName?: string;
  createdAt?: string;
  updatedAt?: string;
}

const CATEGORIES = ['ALL', 'GREETINGS', 'SUPPORT', 'SALES', 'BILLING', 'GENERAL'];

export function QuickResponsesPanel() {
  const [responses, setResponses] = useState<CannedResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalShortcut, setModalShortcut] = useState('');
  const [modalCategory, setModalCategory] = useState('GENERAL');
  const [modalContent, setModalContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Delete Confirm State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const showToast = (text: string, isError = false) => {
    setToastMsg({ text, isError });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchResponses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/canned-responses', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setResponses(data || []);
      } else {
        showToast('Failed to load canned responses', true);
      }
    } catch {
      showToast('Network error loading canned responses', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResponses();
  }, []);

  const filteredResponses = useMemo(() => {
    return responses.filter((r) => {
      const matchesCat = selectedCategory === 'ALL' || r.category.toUpperCase() === selectedCategory.toUpperCase();
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q ||
        r.shortcut.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.content.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [responses, selectedCategory, searchQuery]);

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setModalTitle('');
    setModalShortcut('');
    setModalCategory('GENERAL');
    setModalContent('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (r: CannedResponse) => {
    setIsEditing(true);
    setEditingId(r.id);
    setModalTitle(r.title);
    setModalShortcut(r.shortcut);
    setModalCategory(r.category || 'GENERAL');
    setModalContent(r.content);
    setIsModalOpen(true);
  };

  const handleInsertVariable = (variable: string) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = modalContent;
    const newText = text.substring(0, start) + variable + text.substring(end);
    setModalContent(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 50);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle.trim() || !modalShortcut.trim() || !modalContent.trim()) {
      showToast('Please fill out all required fields', true);
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const cleanShortcut = modalShortcut.trim().replace(/^\//, '');
      const payload = {
        title: modalTitle.trim(),
        shortcut: cleanShortcut,
        category: modalCategory,
        content: modalContent.trim(),
        isShared: true,
      };

      const url = isEditing && editingId
        ? `/api/v1/canned-responses/${editingId}`
        : '/api/v1/canned-responses';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save canned response');
      }

      showToast(isEditing ? 'Canned response updated!' : 'Canned response created!');
      setIsModalOpen(false);
      fetchResponses();
    } catch (err: unknown) {
      showToast((err as Error).message, true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/canned-responses/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to delete canned response');
      showToast('Canned response deleted');
      setDeleteConfirmId(null);
      fetchResponses();
    } catch (err: unknown) {
      showToast((err as Error).message, true);
    }
  };

  const copyShortcut = (shortcut: string, id: string) => {
    navigator.clipboard.writeText(`/${shortcut}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Preview renderer
  const previewText = useMemo(() => {
    return modalContent
      .replace(/\{\{contact\.name\}\}/g, 'John Doe')
      .replace(/\{\{contact_name\}\}/g, 'John Doe')
      .replace(/\{\{agent\.name\}\}/g, 'Sarah Agent')
      .replace(/\{\{agent_name\}\}/g, 'Sarah Agent')
      .replace(/\{\{company\.name\}\}/g, 'Acme Corp')
      .replace(/\{\{company_name\}\}/g, 'Acme Corp')
      .replace(/\{\{date\}\}/g, new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))
      .replace(/\{\{today\}\}/g, new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
  }, [modalContent]);

  return (
    <div className="space-y-6">
      <PanelHeader
        title="Canned Responses & Quick Replies"
        desc="Create pre-written responses with dynamic variables. Agents can insert them instantly in the live chatroom by typing '/' followed by the shortcut."
      />

      {toastMsg && (
        <div
          className={`flex items-center gap-2 p-3.5 rounded-xl text-sm font-medium transition-all ${
            toastMsg.isError
              ? 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400'
              : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
          }`}
        >
          {toastMsg.isError ? <AlertCircle className="h-4 w-4 shrink-0" /> : <Check className="h-4 w-4 shrink-0" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-c" />
          <input
            type="text"
            placeholder="Search by shortcut, title, or message…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-base-c bg-card-c pl-10 pr-4 py-2 text-sm text-primary-c placeholder:text-muted-c focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>

        {/* Add Button */}
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:scale-102 active:scale-98 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>New Canned Response</span>
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-card-c border border-base-c text-muted-c hover:text-primary-c'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Canned Responses List */}
      <SectionCard title="Configured Snippets" desc="All canned responses available to agents during live chats.">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-c text-sm">
            <Loader2 className="h-5 w-5 animate-spin mr-2 text-emerald-500" />
            Loading canned responses…
          </div>
        ) : filteredResponses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-500 mb-3">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-primary-c">No canned responses found</h3>
            <p className="text-xs text-muted-c max-w-sm mt-1 mb-4">
              {searchQuery
                ? `No snippets matched "${searchQuery}". Try a different keyword.`
                : 'Create your first canned response so your support agents can reply to customers with lightning speed.'}
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create Canned Response</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-base-c/40 -mx-6">
            {filteredResponses.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 hover:bg-slate-50 dark:hover:bg-ink-850/50 transition-colors"
              >
                <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => copyShortcut(item.shortcut, item.id)}
                      className="group flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                      title="Click to copy shortcut"
                    >
                      <span>/{item.shortcut}</span>
                      {copiedId === item.id ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                      )}
                    </button>
                    <span className="font-semibold text-sm text-primary-c truncate">{item.title}</span>
                    {item.category && (
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-c bg-slate-100 dark:bg-ink-800 px-2 py-0.5 rounded-md border border-base-c/60">
                        <Tag className="h-2.5 w-2.5" />
                        {item.category}
                      </span>
                    )}
                    {item.usageCount > 0 && (
                      <span className="text-[10px] font-medium text-muted-c opacity-75">
                        • {item.usageCount} {item.usageCount === 1 ? 'use' : 'uses'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-c line-clamp-2 leading-relaxed whitespace-pre-wrap">
                    {item.content}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handleOpenEditModal(item)}
                    className="grid h-8 w-8 place-items-center rounded-lg border border-base-c text-muted-c hover:text-primary-c hover:border-emerald-500/40 hover:bg-card-c transition-all cursor-pointer"
                    title="Edit snippet"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(item.id)}
                    className="grid h-8 w-8 place-items-center rounded-lg border border-base-c text-muted-c hover:text-rose-600 hover:border-rose-500/40 hover:bg-rose-500/10 transition-all cursor-pointer"
                    title="Delete snippet"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-xl rounded-2xl border border-base-c bg-card-c shadow-2xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-base-c pb-3">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600">
                  <Zap className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-primary-c">
                  {isEditing ? 'Edit Canned Response' : 'New Canned Response'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-xs font-semibold text-muted-c hover:text-primary-c cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-primary-c mb-1">
                    Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Standard Greeting"
                    value={modalTitle}
                    onChange={(e) => setModalTitle(e.target.value)}
                    className="w-full rounded-xl border border-base-c bg-card-c px-3 py-2 text-xs text-primary-c placeholder:text-muted-c focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                {/* Shortcut */}
                <div>
                  <label className="block text-xs font-semibold text-primary-c mb-1">
                    Slash Shortcut <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-emerald-500">
                      /
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="greet"
                      value={modalShortcut}
                      onChange={(e) => setModalShortcut(e.target.value)}
                      className="w-full rounded-xl border border-base-c bg-card-c pl-6 pr-3 py-2 font-mono text-xs text-primary-c placeholder:text-muted-c focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-primary-c mb-1">Category</label>
                <select
                  value={modalCategory}
                  onChange={(e) => setModalCategory(e.target.value)}
                  className="w-full rounded-xl border border-base-c bg-card-c px-3 py-2 text-xs text-primary-c focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
                >
                  <option value="GENERAL">General</option>
                  <option value="GREETINGS">Greetings</option>
                  <option value="SUPPORT">Support</option>
                  <option value="SALES">Sales</option>
                  <option value="BILLING">Billing</option>
                </select>
              </div>

              {/* Variable Helper Chips */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-primary-c">
                    Message Template <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-muted-c flex items-center gap-1">
                    <Info className="h-3 w-3" /> Click pill to insert variable
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    { label: 'Customer Name', variable: '{{contact.name}}', icon: User },
                    { label: 'Agent Name', variable: '{{agent.name}}', icon: User },
                    { label: 'Company Name', variable: '{{company.name}}', icon: Building },
                    { label: 'Current Date', variable: '{{date}}', icon: Calendar },
                  ].map((v) => {
                    const Icon = v.icon;
                    return (
                      <button
                        key={v.variable}
                        type="button"
                        onClick={() => handleInsertVariable(v.variable)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        <Icon className="h-3 w-3" />
                        <span>+ {v.label}</span>
                      </button>
                    );
                  })}
                </div>

                <textarea
                  ref={textareaRef}
                  required
                  rows={4}
                  placeholder="Hello {{contact.name}}, thank you for reaching out to {{company.name}}! My name is {{agent.name}}, how may I assist you today?"
                  value={modalContent}
                  onChange={(e) => setModalContent(e.target.value)}
                  className="w-full rounded-xl border border-base-c bg-card-c p-3 text-xs leading-relaxed text-primary-c placeholder:text-muted-c focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              {/* Live Preview Card */}
              {modalContent.trim() && (
                <div className="rounded-xl border border-base-c/80 bg-slate-50 dark:bg-ink-850 p-3.5 space-y-1.5">
                  <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-c">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    <span>Customer Preview</span>
                  </div>
                  <div className="rounded-xl bg-[#005c4b] text-white p-3 text-xs leading-relaxed shadow-xs max-w-sm ml-auto">
                    {previewText}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-base-c">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-base-c px-4 py-2 text-xs font-semibold text-muted-c hover:text-primary-c cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-xs font-bold text-white shadow-sm transition-all hover:scale-102 active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{isEditing ? 'Save Changes' : 'Create Snippet'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-base-c bg-card-c p-5 shadow-xl flex flex-col gap-3">
            <h4 className="text-sm font-bold text-primary-c">Delete Canned Response?</h4>
            <p className="text-xs text-muted-c leading-relaxed">
              Are you sure you want to delete this canned response? Agents will no longer be able to expand its shortcut in chat.
            </p>
            <div className="flex items-center justify-end gap-2 mt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-xl border border-base-c px-3 py-1.5 text-xs font-semibold text-muted-c hover:text-primary-c cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-1.5 text-xs font-bold text-white shadow-xs cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
