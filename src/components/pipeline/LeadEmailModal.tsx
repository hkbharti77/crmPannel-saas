import { useState, useEffect } from 'react';
import { cx } from '@/lib/types';
import {
  Mail, X, CheckCircle2, AlertCircle, Loader2, RotateCcw, Save, Sparkles, Code, Eye, FileText
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface LeadEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LeadEmailModal({ isOpen, onClose }: LeadEmailModalProps) {
  const PLACEHOLDERS = [
    '{{contactName}}', '{{businessName}}', '{{enquiryMessage}}',
    '{{contactEmail}}', '{{ownerName}}',
  ];

  const HTML_SAMPLE = `<p style="font-size: 15px; color: #1e293b;">Hi <strong>{{contactName}}</strong>,</p>

<div style="background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%); border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px; margin: 16px 0;">
  <p style="margin: 0; color: #1e3a8a; font-weight: 600;">
    Thank you for reaching out to <strong style="color: #2563eb;">{{businessName}}</strong>!
  </p>
  <p style="margin: 8px 0 0; color: #475569; font-size: 13px;">
    We have received your message: <em>"{{enquiryMessage}}"</em>
  </p>
</div>

<p style="color: #475569;">Our team will get back to you shortly at <strong>{{contactEmail}}</strong>.</p>`;

  // Customer receipt email state
  const [custSubject, setCustSubject] = useState('');
  const [savedCustSubject, setSavedCustSubject] = useState('');
  const [custBody, setCustBody]       = useState('');
  const [savedCustBody, setSavedCustBody] = useState('');

  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [loading, setLoading] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errMsg,  setErrMsg]  = useState<string | null>(null);

  const dirty = custSubject !== savedCustSubject || custBody !== savedCustBody;

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setLoading(true);
    const res = await apiFetch<Record<string, string | null>>('/api/v1/settings/ai/lead-emails');
    if (res.data) {
      const d = res.data;
      setCustSubject(d.leadCustomerEmailSubject || '');
      setSavedCustSubject(d.leadCustomerEmailSubject || '');
      setCustBody(d.leadCustomerEmailBody || '');
      setSavedCustBody(d.leadCustomerEmailBody || '');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setErrMsg(null);
    setToastMsg(null);
    const res = await apiFetch<any>('/api/v1/settings/ai/lead-emails', {
      method: 'PUT',
      body: JSON.stringify({
        leadCustomerEmailSubject: custSubject || null,
        leadCustomerEmailBody:    custBody    || null,
      }),
    });
    if (res.error) {
      setErrMsg(res.error || 'Failed to save.');
    } else {
      setSavedCustSubject(custSubject);
      setSavedCustBody(custBody);
      setToastMsg('Customer lead email template saved successfully.');
      setTimeout(() => setToastMsg(null), 3000);
    }
    setSaving(false);
  };

  const handleRevert = () => {
    setCustSubject(savedCustSubject);
    setCustBody(savedCustBody);
  };

  const handleClearAll = () => {
    setCustSubject('');
    setCustBody('');
  };

  const insertSampleHtml = () => {
    setCustBody(HTML_SAMPLE);
  };

  const getPreviewHtml = () => {
    if (!custBody.trim()) {
      return `<p style="color: #64748b; font-style: italic;">Hi Alex,<br/><br/>Thank you for contacting our team! We have received your inquiry and will be in touch shortly.</p>`;
    }
    let rendered = custBody
      .replace(/{{contactName}}/g, 'Alex Morgan')
      .replace(/{{businessName}}/g, 'Luxe Estates & Co.')
      .replace(/{{enquiryMessage}}/g, 'Interested in 3-BHK luxury apartment pricing details.')
      .replace(/{{contactEmail}}/g, 'alex.morgan@example.com')
      .replace(/{{ownerName}}/g, 'Sales Team');
    
    // If text does not contain HTML tags, convert newlines to <br/>
    if (!/<[a-z][\s\S]*>/i.test(rendered)) {
      rendered = rendered.replace(/\n/g, '<br/>');
    }
    return rendered;
  };

  if (!isOpen) return null;

  const inputClass = (val: string) => cx(
    'w-full rounded-xl border bg-white p-2.5 text-xs text-primary-c focus:outline-none transition-colors dark:bg-slate-950 font-mono',
    val.trim() ? 'border-amber-400 focus:border-amber-500' : 'border-base-c focus:border-amber-500'
  );
  const textareaClass = (val: string) => cx(
    'w-full rounded-xl border bg-white p-3 text-xs text-primary-c leading-relaxed focus:outline-none transition-colors dark:bg-slate-950 font-mono',
    val.trim() ? 'border-amber-400 focus:border-amber-500' : 'border-base-c focus:border-amber-500'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative flex flex-col w-full max-w-3xl max-h-[90vh] rounded-2xl border border-base-c bg-card-c shadow-2xl overflow-hidden">
        
        {/* Fixed Header */}
        <div className="flex items-center justify-between gap-4 border-b border-base-c bg-card-c px-5 sm:px-6 py-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-500 shadow-sm">
              <Mail className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <h3 className="text-base font-bold text-primary-c truncate">Customer Lead Email Template</h3>
                <span className="whitespace-nowrap inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 shrink-0">
                  <Code className="h-3 w-3" /> HTML & CSS Supported
                </span>
              </div>
              <p className="text-xs text-muted-c truncate mt-0.5">Customize automated lead confirmation emails with HTML markup & inline CSS</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-c hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Close Modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Control Toolbar Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-base-c bg-slate-50/80 dark:bg-slate-900/40 px-5 sm:px-6 py-2.5 shrink-0">
          <div className="flex items-center rounded-lg border border-base-c bg-slate-200/60 p-0.5 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              className={cx(
                'flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all',
                activeTab === 'edit'
                  ? 'bg-white text-primary-700 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-muted-c hover:text-primary-c'
              )}
            >
              <FileText className="h-3.5 w-3.5" /> Edit Template
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={cx(
                'flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all',
                activeTab === 'preview'
                  ? 'bg-white text-primary-700 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-muted-c hover:text-primary-c'
              )}
            >
              <Eye className="h-3.5 w-3.5" /> Live HTML Preview
            </button>
          </div>

          <button
            type="button"
            onClick={insertSampleHtml}
            className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300 transition-all shadow-xs"
            title="Insert rich HTML sample with inline styles"
          >
            <Code className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" /> Load Styled HTML Sample
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Toast / Error */}
          {toastMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> {toastMsg}
            </div>
          )}
          {errMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-xs font-medium text-rose-700 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" /> {errMsg}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
              <span className="ml-2.5 text-xs font-medium text-muted-c">Loading email template…</span>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Placeholder hint */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 dark:border-amber-800/50 dark:bg-amber-950/20">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <p className="text-[11px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">Available Dynamic Placeholders</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {PLACEHOLDERS.map(p => (
                    <span key={p} className="rounded-lg border border-amber-300 bg-amber-100 px-2 py-0.5 font-mono text-[11px] text-amber-800 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-300">{p}</span>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-amber-700/80 dark:text-amber-500 leading-relaxed">
                  Full HTML tags (e.g. <code>&lt;b&gt;</code>, <code>&lt;strong&gt;</code>, <code>&lt;p&gt;</code>, <code>&lt;div style="..."&gt;</code>, <code>&lt;a href="..."&gt;</code>) and inline CSS are fully supported! Placeholders will be replaced automatically.
                </p>
              </div>

              {/* TAB 1: Edit Mode */}
              {activeTab === 'edit' && (
                <div className="rounded-xl border border-base-c bg-slate-50/50 p-4 dark:bg-slate-900/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary-c flex items-center gap-2">
                      <span>📩</span> Customer Confirmation Email (Sent to Lead)
                    </span>
                    {(custSubject.trim() || custBody.trim()) ? (
                      <span className="rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300">Custom Template Active</span>
                    ) : (
                      <span className="rounded-md border border-base-c bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-muted-c dark:bg-slate-800">Using System Default</span>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-secondary-c">Subject Line (Plain Text)</label>
                    <input
                      value={custSubject}
                      onChange={e => setCustSubject(e.target.value)}
                      placeholder="System Default: Thank you for contacting {{businessName}}"
                      className={inputClass(custSubject)}
                    />
                  </div>

                  <div>
                    <label className="mb-1 flex items-center justify-between text-[11px] font-medium text-secondary-c">
                      <span>Email Body Content (Plain Text or Rich HTML & CSS)</span>
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">HTML / CSS Supported</span>
                    </label>
                    <textarea
                      value={custBody}
                      onChange={e => setCustBody(e.target.value)}
                      rows={8}
                      placeholder={`e.g. <p>Hi <b>{{contactName}}</b>,</p>\n<div style="background:#eff6ff;padding:12px;border-radius:8px;">Thank you for contacting <strong>{{businessName}}</strong>! We have received your message: <em>"{{enquiryMessage}}"</em></div>`}
                      className={textareaClass(custBody)}
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: Live HTML & CSS Preview */}
              {activeTab === 'preview' && (
                <div className="rounded-xl border border-base-c bg-slate-100 p-4 dark:bg-slate-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary-c flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5 text-indigo-500" />
                      Live Rendered HTML & CSS Email Preview
                    </span>
                    <span className="text-[10px] text-muted-c">Simulated Recipient View</span>
                  </div>

                  {/* Email Subject Box */}
                  <div className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800">
                    <span className="text-muted-c font-semibold mr-2">Subject:</span>
                    <span className="font-bold text-primary-c">
                      {custSubject.trim() ? custSubject.replace(/{{businessName}}/g, 'Luxe Estates & Co.').replace(/{{contactName}}/g, 'Alex Morgan') : 'Thank you for contacting Luxe Estates & Co.'}
                    </span>
                  </div>

                  {/* Email Rendered Container */}
                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 overflow-x-auto min-h-[160px]">
                    <div
                      className="prose prose-sm max-w-none text-slate-800 dark:text-slate-100 leading-relaxed text-xs"
                      dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fixed Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-base-c bg-card-c px-5 sm:px-6 py-4 shrink-0">
          <button
            type="button"
            onClick={handleClearAll}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Revert to System Default
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRevert}
              disabled={!dirty || saving}
              className="flex items-center gap-1.5 rounded-xl border border-base-c bg-white px-4 py-2 text-xs font-semibold text-secondary-c hover:bg-slate-50 disabled:opacity-40 dark:bg-slate-900 dark:hover:bg-slate-800 transition-colors"
            >
              Discard Changes
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!dirty || saving}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-white hover:bg-amber-600 disabled:opacity-50 transition-all shadow-sm"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save Email Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
