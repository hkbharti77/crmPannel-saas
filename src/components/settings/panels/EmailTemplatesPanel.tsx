import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { cx } from '@/lib/types';
import {
  Mail, Plus, Trash2, Edit3, ArrowLeft, Save, Copy,
  Loader2, CheckCircle, AlertCircle, Code, Eye, Monitor, Smartphone,
  Palette, Search, Sparkles, Send, Layers, Filter, Check, ExternalLink, HelpCircle,
  LayoutGrid, List, MoreVertical, RotateCcw, AlertTriangle, Play, Wand2, FileCode, Sliders, CheckSquare
} from 'lucide-react';
import { SectionCard } from './_shared';
import { apiFetch } from '@/lib/api';
import { generateAiEmailContent } from '@/lib/emailsApi';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  interestCategory?: string;
  createdAt?: string;
}

// ─── STARTER ENTERPRISE TEMPLATES LIBRARY ───
const STARTER_TEMPLATES: Omit<EmailTemplate, 'id'>[] = [
  {
    name: 'Modern Welcome & Onboarding',
    subject: 'Welcome to {{business.name}} — Let\'s get started, {{lead.name}}!',
    interestCategory: 'Leads',
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 32px 16px; color: #1e293b; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 40px 32px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; }
    .header p { margin: 8px 0 0; opacity: 0.9; font-size: 14px; }
    .body { padding: 36px 32px; font-size: 15px; line-height: 1.6; color: #334155; }
    .cta-box { text-align: center; margin: 32px 0; }
    .btn { background-color: #2563eb; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 700; display: inline-block; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25); }
    .footer { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 32px; text-align: center; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Welcome to {{business.name}}</h1>
      <p>We are thrilled to have you with us!</p>
    </div>
    <div class="body">
      <p>Hi <strong>{{lead.name}}</strong>,</p>
      <p>Thank you for connecting with us. We have received your inquiry and our dedicated team is already setting things up for you.</p>
      <p>Here is what you can expect next:</p>
      <ul>
        <li>Direct consultation with our senior specialist</li>
        <li>Custom proposal tailored to your goals</li>
        <li>24/7 dedicated support team access</li>
      </ul>
      <div class="cta-box">
        <a href="{{unsubscribe_link}}" class="btn">Explore Your Dashboard →</a>
      </div>
      <p>If you have any urgent questions, simply reply to this email.</p>
      <p>Best regards,<br><strong>The {{business.name}} Team</strong></p>
    </div>
    <div class="footer">
      <p>&copy; {{current_date}} {{business.name}}. All rights reserved.</p>
      <p style="margin-top:6px;"><a href="{{unsubscribe_link}}" style="color:#64748b;text-decoration:underline;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`
  },
  {
    name: 'Appointment Confirmation & Reminders',
    subject: 'Appointment Confirmed: {{business.name}} with {{lead.name}}',
    interestCategory: 'Appointments',
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 32px 16px; color: #0f172a; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
    .banner { background: #059669; padding: 24px; text-align: center; color: #ffffff; }
    .body { padding: 32px; font-size: 15px; line-height: 1.6; }
    .info-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 24px 0; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
    .info-label { font-weight: 600; color: #166534; }
    .btn { background-color: #059669; color: #ffffff !important; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; display: inline-block; }
    .footer { text-align: center; font-size: 12px; color: #94a3b8; padding: 20px; border-top: 1px solid #f1f5f9; }
  </style>
</head>
<body>
  <div class="card">
    <div class="banner">
      <h2 style="margin:0;font-size:20px;">✓ Appointment Confirmed</h2>
    </div>
    <div class="body">
      <p>Hi {{lead.name}},</p>
      <p>Your upcoming consultation with <strong>{{business.name}}</strong> has been successfully booked.</p>
      <div class="info-box">
        <div class="info-row"><span class="info-label">Client Name:</span> <span>{{lead.name}}</span></div>
        <div class="info-row"><span class="info-label">Date:</span> <span>{{current_date}}</span></div>
        <div class="info-row"><span class="info-label">Organizer:</span> <span>{{business.name}}</span></div>
      </div>
      <div style="text-align:center;margin-top:24px;">
        <a href="{{unsubscribe_link}}" class="btn">View Appointment Details</a>
      </div>
    </div>
    <div class="footer">
      <p>&copy; {{current_date}} {{business.name}}</p>
    </div>
  </div>
</body>
</html>`
  },
  {
    name: 'VIP Promotional Launch & Discount',
    subject: '🔥 Exclusive 25% Off Offer for {{lead.name}}',
    interestCategory: 'Promotions',
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 32px 16px; color: #f8fafc; }
    .card { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 20px; border: 1px solid #334155; overflow: hidden; }
    .header { padding: 40px 32px; text-align: center; background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); }
    .header h1 { margin: 0; font-size: 28px; font-weight: 900; }
    .body { padding: 36px 32px; text-align: center; font-size: 16px; line-height: 1.6; color: #cbd5e1; }
    .badge { background: #f59e0b; color: #0f172a; font-weight: 800; padding: 6px 16px; border-radius: 999px; font-size: 13px; text-transform: uppercase; display: inline-block; margin-bottom: 16px; }
    .btn { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #0f172a !important; padding: 16px 36px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 16px; display: inline-block; box-shadow: 0 4px 20px rgba(245, 158, 11, 0.4); }
    .footer { text-align: center; font-size: 12px; color: #64748b; padding: 24px; border-top: 1px solid #334155; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <span class="badge">VIP EXCLUSIVE</span>
      <h1>Special Upgrade Unlocked</h1>
    </div>
    <div class="body">
      <p>Hello {{lead.name}},</p>
      <p>As a valued partner of <strong>{{business.name}}</strong>, we are giving you priority access to our flagship plan with an instant <strong>25% Discount</strong>.</p>
      <div style="margin:36px 0;">
        <a href="{{unsubscribe_link}}" class="btn">Claim 25% Off Today →</a>
      </div>
      <p style="font-size:13px;color:#94a3b8;">*Offer valid for a limited time only.</p>
    </div>
    <div class="footer">
      <p>&copy; {{current_date}} {{business.name}} &middot; <a href="{{unsubscribe_link}}" style="color:#94a3b8;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`
  }
];

const CATEGORIES = ['All', 'General', 'Leads', 'Appointments', 'Bookings', 'Follow-up', 'Newsletter', 'Promotions'];

const AI_PROMPT_PRESETS = [
  'Welcome & Onboarding email for new leads with CTA button',
  'Black Friday promotional email with 25% discount code',
  'Appointment confirmation & consultation reminder email',
  'Monthly product newsletter with features and updates'
];

const HTML_SNIPPET_BUILDERS = [
  {
    label: '+ Primary Button',
    code: `<div style="text-align: center; margin: 24px 0;"><a href="{{unsubscribe_link}}" style="background-color: #2563eb; color: #ffffff !important; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; display: inline-block; box-shadow: 0 4px 12px rgba(37,99,235,0.2);">Click Here to Get Started →</a></div>`
  },
  {
    label: '+ Hero Banner',
    code: `<div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 36px 24px; text-align: center; color: #ffffff; border-radius: 12px;"><h1 style="margin:0; font-size:24px; font-weight:800;">Special Announcement</h1><p style="margin:8px 0 0; opacity:0.9; font-size:14px;">Add your banner subheading description here</p></div>`
  },
  {
    label: '+ Card Box',
    code: `<div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 16px 0;"><h3 style="margin-top:0; color:#1e293b; font-size:16px;">Highlight Box Title</h3><p style="color:#64748b; font-size:14px; margin-bottom:0;">Add key summary information or feature points here.</p></div>`
  },
  {
    label: '+ 2-Column Table',
    code: `<table width="100%" cellpadding="0" cellspacing="0" style="margin: 16px 0; font-size:14px; border-collapse:collapse;"><tr><td width="50%" style="padding:12px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px 0 0 8px;"><strong>Feature Alpha</strong><br><span style="color:#64748b; font-size:12px;">Detailed explanation</span></td><td width="50%" style="padding:12px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:0 8px 8px 0;"><strong>Feature Beta</strong><br><span style="color:#64748b; font-size:12px;">Detailed explanation</span></td></tr></table>`
  }
];

const VARIABLE_GROUPS = [
  {
    group: 'Lead Data',
    vars: [
      { label: 'Lead Name', val: '{{lead.name}}' },
      { label: 'Lead Email', val: '{{lead.email}}' },
    ]
  },
  {
    group: 'Business Data',
    vars: [
      { label: 'Business Name', val: '{{business.name}}' },
      { label: 'Current Date', val: '{{current_date}}' },
    ]
  },
  {
    group: 'System Links',
    vars: [
      { label: 'Unsubscribe Link', val: '{{unsubscribe_link}}' },
    ]
  }
];

export function EmailTemplatesPanel({ initialCreateOpen, createTrigger, onEditorStateChange }: { initialCreateOpen?: boolean; createTrigger?: number; onEditorStateChange?: (isOpen: boolean) => void } = {}) {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [deleteModalState, setDeleteModalState] = useState<{ isOpen: boolean; id: string }>({ isOpen: false, id: '' });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // View & Filtering State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name-asc' | 'name-desc'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Editor State
  const [showEditor, setShowEditor] = useState(false);
  const [form, setForm] = useState<EmailTemplate | Omit<EmailTemplate, 'id'>>(STARTER_TEMPLATES[0]);
  const [isEditing, setIsEditing] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  // AI Template Generator State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Preview Modal State
  const [previewModalTemplate, setPreviewModalTemplate] = useState<EmailTemplate | null>(null);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onEditorStateChange?.(showEditor);
  }, [showEditor, onEditorStateChange]);

  useEffect(() => {
    loadTemplates();
    if (initialCreateOpen) {
      setForm(STARTER_TEMPLATES[0]);
      setIsEditing(false);
      setShowEditor(true);
    }
  }, [initialCreateOpen]);

  useEffect(() => {
    if (createTrigger && createTrigger > 0) {
      setForm(STARTER_TEMPLATES[0]);
      setIsEditing(false);
      setShowEditor(true);
    }
  }, [createTrigger]);

  const toast = (msg: string, isError = false) => {
    if (isError) { setError(msg); setMessage(null); }
    else { setMessage(msg); setError(null); }
    setTimeout(() => { setMessage(null); setError(null); }, 4000);
  };

  const loadTemplates = async () => {
    setLoading(true);
    setFetchError(null);
    const res = await apiFetch<EmailTemplate[]>('/api/v1/email-templates');
    setLoading(false);
    if (res.data) {
      setTemplates(res.data);
    } else {
      setFetchError(res.error || 'Failed to load email templates.');
      toast('Failed to load email templates.', true);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.subject.trim() || !form.content.trim()) {
      toast('Name, Subject, and HTML Content are required.', true);
      return;
    }
    
    const id = (form as EmailTemplate).id;
    const isNew = !id;
    setSaving(isNew ? 'new' : id);
    
    const res = await apiFetch<EmailTemplate>(
      isNew ? '/api/v1/email-templates' : `/api/v1/email-templates/${id}`,
      {
        method: isNew ? 'POST' : 'PUT',
        body: JSON.stringify(form),
      }
    );
    
    setSaving(null);
    if (res.data) {
      if (isNew) {
        setTemplates((p) => [res.data!, ...p]);
      } else {
        setTemplates((p) => p.map((t) => (t.id === id ? res.data! : t)));
      }
      setShowEditor(false);
      toast(`Template "${form.name}" ${isNew ? 'created' : 'updated'} successfully!`);
    } else {
      toast(`Save failed: ${res.error}`, true);
    }
  };

  const handleDuplicate = (t: EmailTemplate) => {
    const cloned: Omit<EmailTemplate, 'id'> = {
      name: `${t.name} (Copy)`,
      subject: t.subject,
      content: t.content,
      interestCategory: t.interestCategory || 'General',
    };
    setForm(cloned);
    setIsEditing(false);
    setShowEditor(true);
    toast(`Duplicating "${t.name}". Click Save to create.`);
  };

  const handleDelete = (id: string) => {
    setDeleteModalState({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    const id = deleteModalState.id;
    setDeleteModalState({ isOpen: false, id: '' });
    if (!id) return;

    setDeletingId(id);
    const res = await apiFetch(`/api/v1/email-templates/${id}`, { method: 'DELETE' });
    setDeletingId(null);
    if (!res.error) {
      setTemplates((p) => p.filter((t) => t.id !== id));
      toast('Template deleted successfully.');
    } else {
      toast(`Delete failed: ${res.error}`, true);
    }
  };

  const openNew = (starter?: Omit<EmailTemplate, 'id'>) => {
    setForm(starter || STARTER_TEMPLATES[0]);
    setIsEditing(false);
    setShowEditor(true);
  };

  const openEdit = (t: EmailTemplate) => {
    setForm({ ...t });
    setIsEditing(true);
    setShowEditor(true);
  };

  const copyVar = (val: string) => {
    navigator.clipboard.writeText(val);
    toast(`Copied ${val} to clipboard`);
  };

  const insertSnippet = (code: string) => {
    setForm((prev) => ({
      ...prev,
      content: prev.content ? `${prev.content}\n\n${code}` : code,
    }));
    toast('Inserted HTML snippet into source code!');
  };

  const formatHtmlCode = () => {
    if (!form.content) return;
    let formatted = form.content
      .replace(/></g, '>\n<')
      .replace(/\n\s*\n/g, '\n')
      .trim();
    setForm((prev) => ({ ...prev, content: formatted }));
    toast('Formatted HTML source code code indentation.');
  };

  const handleAiGenerateTemplate = async (promptOverride?: string) => {
    const targetPrompt = (promptOverride || aiPrompt).trim();
    if (!targetPrompt) {
      toast('Please describe the template you want AI to generate.', true);
      return;
    }
    if (promptOverride) setAiPrompt(promptOverride);
    setAiLoading(true);
    const res = await generateAiEmailTemplate(targetPrompt);
    setAiLoading(false);

    if (res.error) {
      toast(`AI Generation Failed: ${res.error}`, true);
      return;
    }

    if (res.data) {
      const generatedBody = res.data.html || '';
      if (res.data.subject) {
        setForm((prev) => ({ ...prev, subject: res.data.subject! }));
      }

      setForm((prev) => ({ ...prev, content: generatedBody }));
      toast('✨ AI successfully generated responsive HTML email template code!');
    }
  };

  // Filtered & Sorted Templates
  const filteredTemplates = useMemo(() => {
    let list = templates.filter((t) => {
      const matchesCat = selectedCategory === 'All' || (t.interestCategory || 'General').toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch = !searchQuery.trim() || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.subject.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });

    return list.sort((a, b) => {
      if (sortBy === 'newest') return (new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      if (sortBy === 'oldest') return (new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      return 0;
    });
  }, [templates, selectedCategory, searchQuery, sortBy]);

  // Real-time Tag Parser for Live Device Preview
  const parsedLivePreviewContent = useMemo(() => {
    let html = form.content || '';
    html = html.replace(/\{\{\s*lead\.name\s*\}\}/g, 'Alex Morgan');
    html = html.replace(/\{\{\s*lead\.email\s*\}\}/g, 'alex.morgan@example.com');
    html = html.replace(/\{\{\s*business\.name\s*\}\}/g, 'GyanVaniAi Connect');
    html = html.replace(/\{\{\s*current_date\s*\}\}/g, new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }));
    html = html.replace(/\{\{\s*unsubscribe_link\s*\}\}/g, '#');
    return html;
  }, [form.content]);

  const parsedLivePreviewSubject = useMemo(() => {
    let subj = form.subject || '(No Subject Line)';
    subj = subj.replace(/\{\{\s*lead\.name\s*\}\}/g, 'Alex Morgan');
    subj = subj.replace(/\{\{\s*business\.name\s*\}\}/g, 'GyanVaniAi Connect');
    subj = subj.replace(/\{\{\s*current_date\s*\}\}/g, new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }));
    return subj;
  }, [form.subject]);

  const formatDate = (dStr?: string) => {
    if (!dStr) return 'Recently';
    return new Date(dStr).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const lineCount = (form.content || '').split('\n').length;
  const charCount = (form.content || '').length;

  return (
    <div className="space-y-4">
      {/* Toast Feedback */}
      {message && (
        <div className="flex items-center gap-2 rounded-xl2 border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400 animate-in fade-in">
          <CheckCircle className="h-4 w-4 shrink-0" /> {message}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl2 border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-400 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* --- EMBEDDED ENTERPRISE TEMPLATE EDITOR --- */}
      {showEditor ? (
        <>
        {/* Sub-page Header — matches CampaignDetailsPanel & CreateEmailCampaignView */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-base-c pb-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowEditor(false)}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-base-c bg-white text-secondary-c transition-colors hover:bg-slate-50 hover:text-primary-c dark:bg-ink-850 dark:hover:bg-ink-800 shadow-sm"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-primary-c tracking-tight">
                  {isEditing ? 'Edit Email Template' : 'Create Email Template'}
                </h2>
                <span className={cx(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                  isEditing
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                    : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                )}>
                  <span className={cx('h-1.5 w-1.5 rounded-full', isEditing ? 'bg-amber-500' : 'bg-indigo-500')} />
                  {isEditing ? 'Edit Mode' : 'Draft'}
                </span>
              </div>
              <p className="text-sm text-secondary-c mt-1 font-medium">Customize responsive HTML layout with dynamic tags & live device preview</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Preview Mode Switcher */}
            <div className="flex rounded-xl border border-base-c bg-slate-100 p-0.5 dark:bg-ink-900">
              <button
                type="button"
                onClick={() => setPreviewMode('desktop')}
                className={cx(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
                  previewMode === 'desktop' ? 'bg-white text-primary-600 shadow-sm dark:bg-ink-800 dark:text-primary-400' : 'text-muted-c hover:text-primary-c'
                )}
              >
                <Monitor className="h-3.5 w-3.5" /> Desktop
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('mobile')}
                className={cx(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
                  previewMode === 'mobile' ? 'bg-white text-primary-600 shadow-sm dark:bg-ink-800 dark:text-primary-400' : 'text-muted-c hover:text-primary-c'
                )}
              >
                <Smartphone className="h-3.5 w-3.5" /> Mobile
              </button>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving !== null}
              className="flex items-center gap-2 rounded-xl bg-gradient-accent px-5 py-2.5 text-sm font-bold text-white shadow-md transition-transform hover:scale-105 disabled:opacity-50"
            >
              {saving !== null ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>Save Template</span>
            </button>
          </div>
        </div>

        <SectionCard>

          {/* Form Meta Fields & AI Generator */}
          <div className="space-y-5">
            {/* AI HTML Code Generator Banner */}
            <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent p-4 shadow-inner space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                      AI HTML Template Writer
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.2 text-[9px] font-extrabold text-emerald-700 dark:text-emerald-300 uppercase">
                        PRO FEATURE
                      </span>
                    </h4>
                    <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">Describe what you want, and AI will write full responsive HTML code & subject line for you.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. Write a Black Friday sale HTML email template with discount badge, bullet points, and CTA button..."
                  className="form-input flex-1 bg-white/90 dark:bg-ink-900/90 text-xs shadow-sm border-emerald-500/30 focus:border-emerald-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAiGenerateTemplate();
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleAiGenerateTemplate()}
                  disabled={!aiPrompt.trim() || aiLoading}
                  className={cx(
                    'rounded-xl px-5 py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0',
                    aiPrompt.trim() && !aiLoading
                      ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-500/20 hover:scale-105'
                      : 'bg-emerald-500/10 text-emerald-700/50 dark:bg-emerald-500/5 dark:text-emerald-400/30 cursor-not-allowed'
                  )}
                >
                  {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                  Generate HTML Code
                </button>
              </div>

              {/* Preset Quick Prompts */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-bold text-emerald-800/70 dark:text-emerald-400/70 uppercase">Presets:</span>
                {AI_PROMPT_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAiGenerateTemplate(preset)}
                    disabled={aiLoading}
                    className="rounded-lg border border-emerald-500/20 bg-white/60 px-2.5 py-1 text-[10px] font-semibold text-emerald-800 hover:bg-emerald-50 dark:bg-ink-900/50 dark:text-emerald-300 dark:hover:bg-ink-800 transition-colors"
                  >
                    + {preset.slice(0, 32)}...
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-bold text-secondary-c">Template Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. VIP Lead Welcome Email"
                  className="form-input text-sm"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-secondary-c">Category</label>
                <select
                  value={form.interestCategory ?? 'General'}
                  onChange={(e) => setForm({ ...form, interestCategory: e.target.value })}
                  className="form-input text-sm"
                >
                  {CATEGORIES.filter(c => c !== 'All').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-secondary-c">Email Subject Line</label>
                <span className="text-[10px] font-mono text-muted-c">{form.subject.length} chars</span>
              </div>
              <input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="e.g. Exclusive Offer Inside for {{lead.name}}"
                className="form-input text-sm font-medium"
              />
            </div>

            {/* Dynamic Tag Inserter & HTML Snippets Toolbar */}
            <div className="rounded-xl2 border border-base-c bg-slate-50/70 p-3.5 dark:bg-ink-900/40 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-base-c pb-2.5">
                <p className="text-xs font-bold text-primary-c flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Dynamic Tag Inserter (Click to Copy)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {HTML_SNIPPET_BUILDERS.map((sb) => (
                    <button
                      key={sb.label}
                      type="button"
                      onClick={() => insertSnippet(sb.code)}
                      className="rounded-lg border border-primary-500/20 bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary-700 hover:bg-primary-100 dark:bg-primary-500/10 dark:text-primary-300 transition-colors"
                    >
                      {sb.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {VARIABLE_GROUPS.map((vg) => (
                  <div key={vg.group} className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-c">{vg.group}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {vg.vars.map((v) => (
                        <button
                          key={v.val}
                          type="button"
                          onClick={() => copyVar(v.val)}
                          className="flex items-center gap-1.5 rounded-lg border border-base-c bg-white px-2.5 py-1 text-xs font-mono font-semibold text-primary-600 hover:border-primary-400 hover:bg-primary-50 dark:bg-ink-800 dark:text-primary-400 dark:hover:bg-ink-700 transition-colors shadow-xs"
                        >
                          <Copy className="h-3 w-3 text-muted-c" /> {v.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Split Screen Code Editor & Live Preview */}
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* HTML Code Editor */}
              <div className="flex flex-col rounded-xl2 border border-slate-800 bg-slate-950 text-slate-100 overflow-hidden shadow-inner min-h-[520px]">
                <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4 text-sky-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">HTML Source Code</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400">{lineCount} lines &middot; {charCount} chars</span>
                    <button
                      type="button"
                      onClick={formatHtmlCode}
                      title="Format & Beautify HTML Code"
                      className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
                    >
                      Format Code
                    </button>
                    <button
                      type="button"
                      onClick={() => copyVar(form.content)}
                      title="Copy HTML Source Code"
                      className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="flex-1 w-full min-h-[460px] resize-none p-4 font-mono text-xs leading-relaxed bg-transparent text-slate-200 outline-none focus:ring-0 selection:bg-sky-500/30"
                  spellCheck="false"
                />
              </div>

              {/* Live Device Preview */}
              <div className="flex flex-col rounded-xl2 border border-base-c bg-slate-100 dark:bg-ink-900 overflow-hidden min-h-[520px]">
                <div className="flex items-center justify-between border-b border-base-c bg-white px-4 py-2.5 dark:bg-ink-950">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-primary-c">Interactive Live Preview</span>
                  </div>
                  <span className="text-[10px] font-semibold text-muted-c uppercase">{previewMode} View (Tags Parsed)</span>
                </div>

                <div className="flex-1 p-4 flex items-start justify-center overflow-y-auto max-h-[570px]">
                  <div
                    className={cx(
                      'bg-white shadow-lg transition-all duration-300 border border-slate-200 overflow-hidden dark:border-ink-700 dark:bg-ink-950',
                      previewMode === 'mobile'
                        ? 'w-[320px] min-h-[500px] rounded-[2rem] border-4 border-slate-800 shadow-xl'
                        : 'w-full max-w-xl min-h-[480px] rounded-xl'
                    )}
                  >
                    {/* Simulated Client Header Bar */}
                    <div className="border-b border-slate-100 bg-slate-50/90 px-4 py-3 dark:border-ink-800 dark:bg-ink-900/90">
                      <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                        <span>From: <strong>marketing@yourbusiness.com</strong></span>
                        <span>To: <strong>alex.morgan@example.com</strong></span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{parsedLivePreviewSubject}</p>
                    </div>

                    <iframe
                      title="html-preview"
                      srcDoc={parsedLivePreviewContent}
                      className="w-full h-[470px] border-none bg-white"
                      sandbox="allow-same-origin"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
        </>
      ) : (
        /* --- MAIN TEMPLATE MANAGEMENT VIEW --- */
        <div className="space-y-4">
          {/* Toolbar Card */}
          <SectionCard>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-c" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search templates by name or subject..."
                  className="form-input pl-9 pr-8 text-xs py-2 w-full"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-c hover:text-primary-c"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filters, Sorting & View Toggle */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Category Dropdown */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-secondary-c hidden sm:inline">Category:</span>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="form-input text-xs py-1.5 px-2.5 bg-card-c cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => {
                      const count = cat === 'All' ? templates.length : templates.filter(t => (t.interestCategory || 'General').toLowerCase() === cat.toLowerCase()).length;
                      return (
                        <option key={cat} value={cat}>
                          {cat} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-secondary-c hidden sm:inline">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="form-input text-xs py-1.5 px-2.5 bg-card-c cursor-pointer"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="name-asc">Name (A - Z)</option>
                    <option value="name-desc">Name (Z - A)</option>
                  </select>
                </div>

                {/* Grid / List View Toggle */}
                <div className="flex rounded-xl border border-base-c bg-slate-100 p-0.5 dark:bg-ink-900 ml-auto sm:ml-0">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    title="Grid View"
                    className={cx(
                      'p-1.5 rounded-lg text-xs transition-all flex items-center gap-1 font-semibold',
                      viewMode === 'grid' ? 'bg-white text-primary-600 shadow-sm dark:bg-ink-800 dark:text-primary-400' : 'text-muted-c hover:text-primary-c'
                    )}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    title="List View"
                    className={cx(
                      'p-1.5 rounded-lg text-xs transition-all flex items-center gap-1 font-semibold',
                      viewMode === 'list' ? 'bg-white text-primary-600 shadow-sm dark:bg-ink-800 dark:text-primary-400' : 'text-muted-c hover:text-primary-c'
                    )}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Loading Skeleton State */}
          {loading ? (
            <SectionCard>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-36 bg-slate-200 dark:bg-ink-800 rounded animate-pulse" />
                  <div className="h-4 w-20 bg-slate-200 dark:bg-ink-800 rounded animate-pulse" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-xl2 border border-base-c bg-card-c p-4 space-y-3 animate-pulse">
                      <div className="h-32 bg-slate-200 dark:bg-ink-800 rounded-xl" />
                      <div className="h-4 w-3/4 bg-slate-200 dark:bg-ink-800 rounded" />
                      <div className="h-3 w-1/2 bg-slate-200 dark:bg-ink-800 rounded" />
                      <div className="h-8 bg-slate-200 dark:bg-ink-800 rounded-lg mt-4" />
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>
          ) : fetchError ? (
            /* Error State */
            <SectionCard>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-danger-500/10 text-danger-600 dark:text-danger-400 mb-3">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-primary-c">Unable to load email templates</h3>
                <p className="text-xs text-muted-c mt-1 max-w-md">
                  We couldn't retrieve your templates from the server. ({fetchError})
                </p>
                <button
                  type="button"
                  onClick={loadTemplates}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-gradient-accent px-4 py-2 text-xs font-bold text-white shadow-soft hover:scale-105 transition-transform"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Retry Connection
                </button>
              </div>
            </SectionCard>
          ) : templates.length === 0 ? (
            /* Empty State (Zero Templates in DB) */
            <SectionCard>
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-accent-soft text-primary-600 dark:text-primary-400 mb-3">
                  <Code className="h-7 w-7" />
                </div>
                <h3 className="text-base font-bold text-primary-c">No email templates yet</h3>
                <p className="text-xs text-muted-c mt-1 max-w-md">
                  Create reusable email templates to speed up campaign creation and maintain consistent branding.
                </p>
                <button
                  type="button"
                  onClick={() => openNew()}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-accent px-5 py-2.5 text-xs font-bold text-white shadow-md hover:scale-105 transition-transform"
                >
                  <Plus className="h-4 w-4" /> Create Template
                </button>
              </div>
            </SectionCard>
          ) : (
            /* Main Templates Display Card */
            <SectionCard>
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-bold text-primary-c flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary-500" /> Saved Templates ({filteredTemplates.length})
                </h4>
                {(searchQuery || selectedCategory !== 'All') && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                    className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>

              {filteredTemplates.length === 0 ? (
                /* Filtered Zero Results State */
                <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-base-c rounded-xl2 bg-slate-50/50 dark:bg-ink-900/20">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-200 dark:bg-ink-800 text-muted-c mb-2">
                    <Filter className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-primary-c">No templates match your filters</h3>
                  <p className="text-xs text-muted-c mt-1 max-w-xs">
                    Try adjusting your search query or category settings to find what you're looking for.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                    className="mt-3 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              ) : viewMode === 'grid' ? (
                /* GRID VIEW */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((t) => (
                    <div
                      key={t.id}
                      className="group relative flex flex-col rounded-xl2 border border-base-c bg-card-c overflow-hidden shadow-soft transition-all hover:border-primary-400 hover:shadow-soft-lg"
                    >
                      {/* Scaled HTML Thumbnail Container */}
                      <div className="h-32 bg-slate-100 dark:bg-ink-900 p-3 relative overflow-hidden border-b border-base-c flex flex-col">
                        {/* Action Menu (Three-dot) & Quick Preview */}
                        <div className="absolute top-2 right-2 flex items-center gap-1 z-20">
                          {/* Three-dot dropdown menu trigger */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setActiveMenuId(activeMenuId === t.id ? null : t.id)}
                              title="Template Actions"
                              className="grid h-7 w-7 place-items-center rounded-md bg-white/90 text-slate-700 shadow border border-slate-200 hover:bg-slate-50 dark:bg-ink-800/90 dark:border-ink-700 dark:text-slate-200 backdrop-blur-sm"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>

                            {/* Menu Dropdown Popover */}
                            {activeMenuId === t.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-30"
                                  onClick={() => setActiveMenuId(null)}
                                />
                                <div className="absolute right-0 top-8 z-40 w-44 rounded-xl border border-base-c bg-white py-1.5 shadow-xl dark:bg-ink-950 animate-in fade-in zoom-in-95">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      setPreviewModalTemplate(t);
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-secondary-c hover:bg-slate-50 hover:text-primary-c dark:hover:bg-ink-850"
                                  >
                                    <Eye className="h-3.5 w-3.5" /> Quick Preview
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      openEdit(t);
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-secondary-c hover:bg-slate-50 hover:text-primary-c dark:hover:bg-ink-850"
                                  >
                                    <Edit3 className="h-3.5 w-3.5" /> Edit & Customize
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      handleDuplicate(t);
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-secondary-c hover:bg-slate-50 hover:text-primary-c dark:hover:bg-ink-850"
                                  >
                                    <Copy className="h-3.5 w-3.5" /> Duplicate Template
                                  </button>

                                  <div className="my-1 border-t border-base-c" />

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      handleDelete(t.id);
                                    }}
                                    disabled={deletingId === t.id}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50"
                                  >
                                    {deletingId === t.id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-3.5 w-3.5" />
                                    )}
                                    <span>Delete Template</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Scaled Render of HTML */}
                        <div className="absolute inset-0 pt-3 pointer-events-none opacity-45 scale-[0.3] origin-top-left w-[330%]">
                          <iframe srcDoc={t.content} title="thumb" className="w-full h-[500px] border-none" tabIndex={-1} />
                        </div>
                      </div>

                      {/* Template Meta */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="inline-flex rounded-md bg-primary-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                              {t.interestCategory || 'General'}
                            </span>
                            <span className="text-[10px] text-muted-c font-medium">
                              {formatDate(t.createdAt)}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-primary-c line-clamp-1">{t.name}</h4>
                          <p className="text-xs text-muted-c mt-1 line-clamp-1">Subject: {t.subject}</p>
                        </div>

                        {/* Action Footer: Primary Use Template CTA */}
                        <div className="pt-3 border-t border-base-c flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/emails/create?templateId=${t.id}`)}
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-accent py-2 text-xs font-bold text-white shadow-soft transition-transform hover:scale-[1.02]"
                          >
                            <Play className="h-3.5 w-3.5 fill-current" /> Use Template
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* LIST VIEW TABLE */
                <div className="overflow-x-auto rounded-xl border border-base-c">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-ink-900 border-b border-base-c font-bold uppercase text-[10px] text-muted-c tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Template Name & Category</th>
                        <th className="px-4 py-3">Subject Line</th>
                        <th className="px-4 py-3">Last Updated</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-base-c">
                      {filteredTemplates.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/70 dark:hover:bg-ink-900/50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-primary-c">
                            <div className="flex items-center gap-2">
                              <span className="rounded bg-primary-500/10 px-2 py-0.5 text-[9px] font-bold uppercase text-primary-600 dark:text-primary-400">
                                {t.interestCategory || 'General'}
                              </span>
                              <span>{t.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-c max-w-xs truncate">
                            {t.subject}
                          </td>
                          <td className="px-4 py-3 text-muted-c font-mono text-[11px]">
                            {formatDate(t.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => navigate(`/emails/create?templateId=${t.id}`)}
                                className="flex items-center gap-1 rounded-lg bg-gradient-accent px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:scale-105 transition-transform"
                              >
                                <Play className="h-3 w-3 fill-current" /> Use Template
                              </button>

                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setActiveMenuId(activeMenuId === t.id ? null : t.id)}
                                  className="grid h-7 w-7 place-items-center rounded-lg border border-base-c text-secondary-c hover:bg-slate-100 dark:hover:bg-ink-800"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </button>

                                {activeMenuId === t.id && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-30"
                                      onClick={() => setActiveMenuId(null)}
                                    />
                                    <div className="absolute right-0 top-8 z-40 w-44 rounded-xl border border-base-c bg-white py-1.5 shadow-xl dark:bg-ink-950 animate-in fade-in zoom-in-95 text-left">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMenuId(null);
                                          setPreviewModalTemplate(t);
                                        }}
                                        className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-secondary-c hover:bg-slate-50 hover:text-primary-c dark:hover:bg-ink-850"
                                      >
                                        <Eye className="h-3.5 w-3.5" /> Quick Preview
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMenuId(null);
                                          openEdit(t);
                                        }}
                                        className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-secondary-c hover:bg-slate-50 hover:text-primary-c dark:hover:bg-ink-850"
                                      >
                                        <Edit3 className="h-3.5 w-3.5" /> Edit & Customize
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMenuId(null);
                                          handleDuplicate(t);
                                        }}
                                        className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-secondary-c hover:bg-slate-50 hover:text-primary-c dark:hover:bg-ink-850"
                                      >
                                        <Copy className="h-3.5 w-3.5" /> Duplicate Template
                                      </button>
                                      <div className="my-1 border-t border-base-c" />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMenuId(null);
                                          handleDelete(t.id);
                                        }}
                                        disabled={deletingId === t.id}
                                        className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50"
                                      >
                                        {deletingId === t.id ? (
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                          <Trash2 className="h-3.5 w-3.5" />
                                        )}
                                        <span>Delete Template</span>
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>
          )}

          {/* Pre-Built Starter Templates Gallery */}
          <SectionCard>
            <div className="mb-4">
              <h4 className="text-sm font-bold text-primary-c flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" /> Pre-built Starter Templates
              </h4>
              <p className="text-xs text-muted-c mt-0.5">
                Instantly load professional, tested HTML templates into your editor
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {STARTER_TEMPLATES.map((st, idx) => (
                <div key={idx} className="rounded-xl2 border border-base-c bg-slate-50/60 p-4 dark:bg-ink-900/40 flex flex-col justify-between">
                  <div>
                    <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">
                      {st.interestCategory} Starter
                    </span>
                    <h5 className="mt-2 text-sm font-bold text-primary-c">{st.name}</h5>
                    <p className="mt-1 text-xs text-muted-c line-clamp-2">Subject: {st.subject}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openNew(st)}
                    className="mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-base-c bg-white py-2 text-xs font-bold text-primary-600 hover:bg-primary-50 dark:bg-ink-800 dark:text-primary-400 dark:hover:bg-ink-700 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" /> Use This Starter Template
                  </button>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalState.isOpen}
        title="Delete Email Template"
        message="Are you sure you want to delete this HTML template? Any automated campaigns using this template will be affected."
        confirmText="Delete Template"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModalState({ isOpen: false, id: '' })}
      />

      {/* Quick Preview Modal */}
      {previewModalTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-ink-950 border border-base-c space-y-4">
            <div className="flex items-center justify-between border-b border-base-c pb-3">
              <div>
                <h3 className="text-base font-bold text-primary-c">{previewModalTemplate.name}</h3>
                <p className="text-xs text-muted-c">Subject: {previewModalTemplate.subject}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalTemplate(null)}
                className="rounded-lg p-1 text-muted-c hover:bg-slate-100 dark:hover:bg-ink-800"
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden dark:border-ink-800">
              <iframe
                title="quick-preview"
                srcDoc={previewModalTemplate.content}
                className="w-full h-[400px] border-none bg-white"
                sandbox="allow-same-origin"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPreviewModalTemplate(null)}
                className="rounded-lg border border-base-c px-4 py-2 text-xs font-semibold text-secondary-c"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const t = previewModalTemplate;
                  setPreviewModalTemplate(null);
                  openEdit(t);
                }}
                className="flex items-center gap-1.5 rounded-lg bg-gradient-accent px-4 py-2 text-xs font-bold text-white shadow-sm"
              >
                <Edit3 className="h-3.5 w-3.5" /> Edit Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
