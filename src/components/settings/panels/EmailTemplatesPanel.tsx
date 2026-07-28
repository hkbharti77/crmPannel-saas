import { useState, useEffect } from 'react';
import { cx } from '@/lib/types';
import {
  Mail, Plus, Trash2, Edit3, X, Save,
  Loader2, CheckCircle, AlertCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import { PanelHeader, SectionCard } from './_shared';
import { apiFetch } from '@/lib/api';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  interestCategory?: string;
}

const BLANK: Omit<EmailTemplate, 'id'> = {
  name: '',
  subject: '',
  content: '',
  interestCategory: '',
};

const CATEGORIES = ['General', 'Leads', 'Appointments', 'Bookings', 'Follow-up', 'Newsletter'];

export function EmailTemplatesPanel() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null); // id or 'new'
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<Omit<EmailTemplate, 'id'>>(BLANK);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Omit<EmailTemplate, 'id'>>(BLANK);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadTemplates(); }, []);

  const toast = (msg: string, isError = false) => {
    if (isError) { setError(msg); setMessage(null); }
    else { setMessage(msg); setError(null); }
    setTimeout(() => { setMessage(null); setError(null); }, 3500);
  };

  const loadTemplates = async () => {
    setLoading(true);
    const res = await apiFetch<EmailTemplate[]>('/api/v1/email-templates');
    setLoading(false);
    if (res.data) setTemplates(res.data);
    else toast('Failed to load email templates.', true);
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.subject.trim() || !form.content.trim()) {
      toast('Name, Subject, and Content are required.', true);
      return;
    }
    setSaving('new');
    const res = await apiFetch<EmailTemplate>('/api/v1/email-templates', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    setSaving(null);
    if (res.data) {
      setTemplates((p) => [res.data!, ...p]);
      setForm(BLANK);
      setShowCreate(false);
      toast('Email template created!');
    } else {
      toast(`Create failed: ${res.error}`, true);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editForm.name.trim() || !editForm.subject.trim() || !editForm.content.trim()) {
      toast('Name, Subject, and Content are required.', true);
      return;
    }
    setSaving(id);
    const res = await apiFetch<EmailTemplate>(`/api/v1/email-templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(editForm),
    });
    setSaving(null);
    if (res.data) {
      setTemplates((p) => p.map((t) => (t.id === id ? res.data! : t)));
      setEditId(null);
      toast('Template updated!');
    } else {
      toast(`Update failed: ${res.error}`, true);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this email template?')) return;
    setDeletingId(id);
    const res = await apiFetch(`/api/v1/email-templates/${id}`, { method: 'DELETE' });
    setDeletingId(null);
    if (!res.error) {
      setTemplates((p) => p.filter((t) => t.id !== id));
      toast('Template deleted.');
    } else {
      toast(`Delete failed: ${res.error}`, true);
    }
  };

  const startEdit = (t: EmailTemplate) => {
    setEditId(t.id);
    setEditForm({ name: t.name, subject: t.subject, content: t.content, interestCategory: t.interestCategory ?? '' });
    setExpandedId(t.id);
  };

  if (loading) {
    return (
      <SectionCard>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
          <span className="ml-2 text-sm text-secondary-c">Loading email templates…</span>
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toast */}
      {message && (
        <div className="flex items-center gap-2 rounded-xl2 border border-success-500/20 bg-success-500/10 px-4 py-3 text-sm font-medium text-success-700 dark:text-success-400">
          <CheckCircle className="h-4 w-4 shrink-0" /> {message}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl2 border border-danger-500/20 bg-danger-500/10 px-4 py-3 text-sm font-medium text-danger-700 dark:text-danger-400">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <SectionCard>
        <div className="flex items-center justify-between mb-4">
          <PanelHeader
            title="Email Templates"
            desc="Automated lead follow-up email sequences"
            icon={<Mail className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
          />
          <button
            onClick={() => { setShowCreate(true); setEditId(null); }}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-accent px-3 py-2 text-xs font-semibold text-white hover:scale-105 transition-transform"
          >
            <Plus className="h-3.5 w-3.5" /> New Template
          </button>
        </div>

        {/* Create Form */}
        {showCreate && (
          <div className="mb-4 rounded-xl2 border-2 border-primary-500/30 bg-primary-500/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">New Email Template</span>
              <button onClick={() => { setShowCreate(false); setForm(BLANK); }} className="grid h-6 w-6 place-items-center rounded text-muted-c hover:bg-slate-100 dark:hover:bg-ink-800">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-secondary-c">Template Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. New Lead Welcome" className="form-input" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-secondary-c">Category</label>
                <select value={form.interestCategory ?? ''} onChange={(e) => setForm({ ...form, interestCategory: e.target.value })} className="form-input">
                  <option value="">— None —</option>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-secondary-c">Email Subject *</label>
              <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Welcome to GyanVaniAi Connect!" className="form-input" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-secondary-c">Email Body *</label>
              <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={5} placeholder="Dear {{name}}, Thank you for your interest..." className="form-input resize-none" />
            </div>
            <button
              onClick={handleCreate}
              disabled={saving === 'new'}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-accent px-4 py-2 text-xs font-bold text-white hover:scale-105 disabled:opacity-60 transition-transform"
            >
              {saving === 'new' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Create Template
            </button>
          </div>
        )}

        {/* Templates List */}
        {templates.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-c">
            No email templates yet. Create your first one above.
          </div>
        ) : (
          <div className="space-y-2">
            {templates.map((t) => (
              <div key={t.id} className="rounded-xl2 border border-base-c bg-card-c overflow-hidden">
                {/* Row header */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-500/10">
                    <Mail className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-primary-c">{t.name}</p>
                    <p className="truncate text-xs text-muted-c">{t.subject}</p>
                  </div>
                  {t.interestCategory && (
                    <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-secondary-c dark:bg-ink-800">
                      {t.interestCategory}
                    </span>
                  )}
                  <button
                    onClick={() => startEdit(t)}
                    className="grid h-7 w-7 place-items-center rounded-lg text-muted-c hover:bg-primary-500/10 hover:text-primary-600"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    disabled={deletingId === t.id}
                    className="grid h-7 w-7 place-items-center rounded-lg text-muted-c hover:bg-danger-500/10 hover:text-danger-600 disabled:opacity-40"
                  >
                    {deletingId === t.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                    className="grid h-7 w-7 place-items-center rounded-lg text-muted-c hover:bg-slate-100 dark:hover:bg-ink-800"
                  >
                    {expandedId === t.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {/* Expanded edit form */}
                {expandedId === t.id && (
                  <div className="border-t border-base-c bg-slate-50/50 px-4 py-4 space-y-3 dark:bg-ink-900/30">
                    {editId === t.id ? (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1 block text-[11px] font-semibold text-secondary-c">Template Name *</label>
                            <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="form-input" />
                          </div>
                          <div>
                            <label className="mb-1 block text-[11px] font-semibold text-secondary-c">Category</label>
                            <select value={editForm.interestCategory ?? ''} onChange={(e) => setEditForm({ ...editForm, interestCategory: e.target.value })} className="form-input">
                              <option value="">— None —</option>
                              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-secondary-c">Email Subject *</label>
                          <input value={editForm.subject} onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })} className="form-input" />
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-secondary-c">Email Body *</label>
                          <textarea value={editForm.content} onChange={(e) => setEditForm({ ...editForm, content: e.target.value })} rows={6} className="form-input resize-none" />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdate(t.id)}
                            disabled={saving === t.id}
                            className="flex items-center gap-1.5 rounded-lg bg-gradient-accent px-4 py-2 text-xs font-bold text-white hover:scale-105 disabled:opacity-60 transition-transform"
                          >
                            {saving === t.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                            Save Changes
                          </button>
                          <button onClick={() => setEditId(null)} className="rounded-lg border border-base-c px-4 py-2 text-xs font-medium text-secondary-c hover:text-primary-c">
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-c mb-2">Email Body Preview</p>
                        <pre className="whitespace-pre-wrap text-xs text-secondary-c leading-relaxed">{t.content}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
