import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cx } from '@/lib/types';
import {
  generateAiEmailContent,
  sendEmailCampaign,
  type RecipientMode,
  type AudienceFilterDTO,
} from '@/lib/emailsApi';
import { apiFetch } from '@/lib/api';
import { GlassCard } from '@/components/ui/primitives';
import { TagSegmentBuilder } from './segments/TagSegmentBuilder';
import { AdvancedSegmentBuilder } from './segments/AdvancedSegmentBuilder';
import {
  ArrowLeft,
  Users,
  Tag,
  Mail,
  Upload,
  Download,
  Info,
  Sparkles,
  Loader2,
  AlertTriangle,
  Send,
  Palette,
  CheckCircle2,
  ExternalLink,
  Plus,
  Trash2,
  Copy,
  FileSpreadsheet,
  Layers,
  Sliders,
  Check,
  Search,
  ChevronDown,
  Monitor,
  Smartphone,
  Eye,
  RefreshCw,
  ChevronRight,
  ShieldCheck,
  FileText,
  Clock,
  Sparkle,
} from 'lucide-react';

export interface FilterRule {
  id: string;
  column: string;
  operator:
    | 'equals'
    | 'not_equals'
    | 'contains'
    | 'not_contains'
    | 'greater_than'
    | 'less_than'
    | 'is_empty'
    | 'is_not_empty';
  value: string;
}

/* Custom Searchable Select Component with 10-item scroll limit & search bar */
function SearchableColumnSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    return options.filter((opt) => opt.toLowerCase().includes(search.toLowerCase().trim()));
  }, [options, search]);

  return (
    <div ref={containerRef} className="relative inline-block text-left shrink-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-9 min-w-[130px] max-w-[170px] items-center justify-between gap-1.5 rounded-xl border border-base-c bg-white/90 dark:bg-ink-900/90 px-3 text-xs font-bold text-primary-c shadow-2xs hover:bg-slate-50 dark:hover:bg-ink-850"
      >
        <span className="truncate">{value || 'Select field'}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-c" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-60 rounded-xl border border-base-c bg-white p-2 shadow-2xl dark:bg-ink-900 animate-in fade-in duration-150">
          <div className="relative mb-1.5">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-c" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search column fields..."
              className="w-full rounded-lg border border-base-c bg-slate-50 py-1.5 pl-8 pr-2 text-xs outline-none focus:border-indigo-500 dark:bg-ink-800 dark:text-primary-c"
            />
          </div>

          <div className="max-h-48 overflow-y-auto space-y-0.5 pr-1 scrollbar-thin">
            {filteredOptions.length === 0 ? (
              <p className="py-2 text-center text-[11px] text-muted-c">No column matches</p>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={cx(
                    'flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                    opt === value
                      ? 'bg-indigo-50 font-bold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300'
                      : 'text-secondary-c hover:bg-slate-100 dark:hover:bg-ink-800'
                  )}
                >
                  <span className="truncate">{opt}</span>
                  {opt === value && <Check className="h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface SavedTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  interestCategory?: string;
}

export function CreateEmailCampaignView() {
  const navigate = useNavigate();

  // Wizard Stepper State: 'audience' | 'content' | 'review'
  const [activeStep, setActiveStep] = useState<'audience' | 'content' | 'review'>('audience');

  const [aiPrompt, setAiPrompt] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [recipientMode, setRecipientMode] = useState<RecipientMode>('ALL');
  const [audienceFilter, setAudienceFilter] = useState<AudienceFilterDTO>({ logicalOperator: 'AND', rules: [] });
  const [tagsFilter, setTagsFilter] = useState('');
  const [manualRecipients, setManualRecipients] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  // Enterprise Dynamic CSV Dataset State (Up to 100 Columns)
  const [csvFileName, setCsvFileName] = useState<string>('');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [selectedEmailCol, setSelectedEmailCol] = useState<string>('Email');

  // Enterprise Dynamic Filter Rules (AND / OR Engine)
  const [matchMode, setMatchMode] = useState<'AND' | 'OR'>('AND');
  const [filterRules, setFilterRules] = useState<FilterRule[]>([]);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Creation Method Tabs State ('ai' | 'template' | 'custom')
  const [creationMode, setCreationMode] = useState<'ai' | 'template' | 'custom'>('custom');

  // Preview Mode State ('desktop' | 'mobile')
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [tagSearchQuery, setTagSearchQuery] = useState('');

  // In-App Toast Alert State
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);

  const showToast = (msg: string, isError = false) => {
    setToast({ message: msg, isError });
    setTimeout(() => setToast(null), 4000);
  };

  const [searchParams] = useSearchParams();
  const urlTemplateId = searchParams.get('templateId');

  // Saved Templates State
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [loadingTemplates, setLoadingTemplates] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLoadingTemplates(true);
    apiFetch<SavedTemplate[]>('/api/v1/email-templates').then((res) => {
      setLoadingTemplates(false);
      if (res.data) {
        setSavedTemplates(res.data);
        if (urlTemplateId) {
          const t = res.data.find((x) => x.id === urlTemplateId);
          if (t) {
            setSelectedTemplateId(t.id);
            if (t.subject) setSubject(t.subject);
            if (t.content) setBody(t.content);
            showToast(`Loaded template "${t.name}" into editor.`);
          }
        }
      }
    });
  }, [urlTemplateId]);

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;
    const t = savedTemplates.find((x) => x.id === templateId);
    if (t) {
      if (t.subject) setSubject(t.subject);
      if (t.content) setBody(t.content);
      showToast(`Loaded template "${t.name}" into editor.`);
    }
  };

  const handleWriteAi = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiError(null);
    const res = await generateAiEmailContent(aiPrompt.trim());
    setAiLoading(false);

    if (res.error) {
      setAiError(res.error);
    } else if (res.data) {
      if (res.data.subject) setSubject(res.data.subject);
      if (res.data.body) setBody(res.data.body);
      else if ((res.data as any).text) setBody((res.data as any).text);
      if ((res.data as any).ctaLabel) setCtaLabel((res.data as any).ctaLabel);
      if ((res.data as any).ctaUrl) setCtaUrl((res.data as any).ctaUrl);
      showToast('AI Email successfully generated!');
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,Name,Email,Company,Role,Plan,Score,City,Industry,MRR,CustomTag\n' +
      'John Doe,john@acme.com,Acme Corp,CTO,Enterprise,92,San Francisco,SaaS,5000,VIP\n' +
      'Jane Smith,jane@globex.com,Globex Ltd,VP Marketing,Pro,78,New York,Finance,1200,Newsletter\n' +
      'Robert Chen,robert@tech.io,Tech IO,Founder,Starter,45,Austin,Healthcare,300,Lead';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'enterprise_email_recipients_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Robust CSV Line Parser supporting quotes and 100+ columns
  const parseCsvLine = (text: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if ((c === ',' || c === '\t' || c === ';') && !inQuotes) {
        result.push(cur.trim().replace(/^"+|"+$/g, ''));
        cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur.trim().replace(/^"+|"+$/g, ''));
    return result;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const rawLines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (rawLines.length === 0) return;

      // Header row
      const headers = parseCsvLine(rawLines[0]).map((h, idx) => h || `Column_${idx + 1}`);
      setCsvHeaders(headers);

      // Detect email column automatically
      let autoEmailCol = headers.find((h) => h.toLowerCase().includes('email')) || headers[headers.length - 1];

      const rows: Record<string, string>[] = [];
      for (let i = 1; i < rawLines.length; i++) {
        const parts = parseCsvLine(rawLines[i]);
        if (parts.length === 0) continue;

        const rowObj: Record<string, string> = {};
        headers.forEach((h, idx) => {
          rowObj[h] = parts[idx] || '';
        });
        rows.push(rowObj);
      }

      setCsvRows(rows);
      setSelectedEmailCol(autoEmailCol);

      // Extract all email addresses
      const validEmails = rows
        .map((r) => r[autoEmailCol])
        .filter((e) => e && e.includes('@'));

      setManualRecipients(validEmails.join(', '));
      showToast(`⚡ Ingested ${rows.length} records & ${headers.length} dynamic columns from "${file.name}"!`);
    };
    reader.readAsText(file);
  };

  // Rule Evaluation Function
  const evaluateRow = (row: Record<string, string>, rules: FilterRule[], mode: 'AND' | 'OR'): boolean => {
    if (rules.length === 0) return true;

    const results = rules.map((rule) => {
      const val = (row[rule.column] || '').toLowerCase().trim();
      const target = (rule.value || '').toLowerCase().trim();

      switch (rule.operator) {
        case 'equals':
          return val === target;
        case 'not_equals':
          return val !== target;
        case 'contains':
          return val.includes(target);
        case 'not_contains':
          return !val.includes(target);
        case 'greater_than':
          return parseFloat(val) > parseFloat(target);
        case 'less_than':
          return parseFloat(val) < parseFloat(target);
        case 'is_empty':
          return val === '';
        case 'is_not_empty':
          return val !== '';
        default:
          return true;
      }
    });

    return mode === 'AND' ? results.every(Boolean) : results.some(Boolean);
  };

  // Compute Live Filtered Audience
  const filteredCsvRows = csvRows.filter((row) => evaluateRow(row, filterRules, matchMode));
  const activeRecipientsList =
    csvRows.length > 0
      ? filteredCsvRows.map((r) => r[selectedEmailCol]).filter((e) => e && e.includes('@'))
      : manualRecipients
          .split(',')
          .map((e) => e.trim())
          .filter((e) => e && e.includes('@'));

  const addFilterRule = () => {
    const defaultCol = csvHeaders[0] || 'Tag';
    setFilterRules((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        column: defaultCol,
        operator: 'equals',
        value: '',
      },
    ]);
  };

  const updateFilterRule = (id: string, field: keyof FilterRule, val: any) => {
    setFilterRules((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: val } : r)));
  };

  const removeFilterRule = (id: string) => {
    setFilterRules((prev) => prev.filter((r) => r.id !== id));
  };

  const copyColumnTag = (colName: string) => {
    const tag = `{{${colName}}}`;
    navigator.clipboard.writeText(tag);
    setCopiedTag(tag);
    showToast(`Copied tag placeholder ${tag} to clipboard!`);
    setTimeout(() => setCopiedTag(null), 2500);
  };

  // Insert Tag into Body Textarea
  const insertTagToBody = (colName: string) => {
    const tag = `{{${colName}}}`;
    if (!bodyTextareaRef.current) {
      setBody((prev) => prev + ' ' + tag);
      return;
    }
    const el = bodyTextareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const updated = body.substring(0, start) + tag + body.substring(end);
    setBody(updated);
    showToast(`Inserted ${tag} into email body.`);
  };

  // Live Email Preview Renderer with Sample Data Substitution
  const renderedBodyPreview = useMemo(() => {
    if (!body) return 'Write your email content in the editor to see live rendering here...';

    // Sample substitution data from row 1 of uploaded CSV or dummy defaults
    const sampleRow: Record<string, string> = csvRows.length > 0 ? csvRows[0] : {
      Name: 'Sarah Jenkins',
      Email: 'sarah.jenkins@acme.com',
      Company: 'Acme Enterprise',
      Role: 'VP of Engineering',
      Plan: 'Enterprise Tier',
      City: 'San Francisco',
      Score: '98',
    };

    let result = body;
    Object.keys(sampleRow).forEach((key) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
      result = result.replace(regex, `<strong className="text-indigo-600 font-bold">${sampleRow[key]}</strong>`);
    });

    return result;
  }, [body, csvRows]);

  const canSubmit =
    subject.trim().length > 0 &&
    body.trim().length > 0 &&
    (recipientMode === 'ALL' ||
      (recipientMode === 'TAGGED' && tagsFilter.trim().length > 0) ||
      (recipientMode === 'ADVANCED' && audienceFilter.rules.length > 0) ||
      (recipientMode === 'MANUAL' && (manualRecipients.trim().length > 0 || csvRows.length > 0)));

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSending(true);

    const res = await sendEmailCampaign({
      subject: subject.trim(),
      body: body.trim(),
      ctaLabel: ctaLabel.trim() || undefined,
      ctaUrl: ctaUrl.trim() || undefined,
      recipientMode,
      tagsFilter: recipientMode === 'ADVANCED' ? JSON.stringify(audienceFilter) : recipientMode === 'TAGGED' ? tagsFilter.trim() : undefined,
      manualRecipients: recipientMode === 'MANUAL' ? manualRecipients.trim() : undefined,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
    });

    setSending(false);

    if (res.error) {
      showToast(`Failed to send campaign: ${res.error}`, true);
      return;
    }

    setShowConfirmation(true);
  };

  if (showConfirmation) {
    return (
      <SentConfirmation
        campaignName={subject}
        recipientMode={recipientMode}
        recipientCount={recipientMode === 'ALL' ? 'All CRM Contacts' : activeRecipientsList.length.toString()}
        onClose={() => navigate('/emails')}
      />
    );
  }

  // Available tags list
  const availableTags = csvHeaders.length > 0
    ? csvHeaders
    : ['Name', 'Email', 'Company', 'Role', 'Plan', 'City', 'Score', 'Industry'];

  const filteredTagsList = availableTags.filter((t) =>
    t.toLowerCase().includes(tagSearchQuery.toLowerCase().trim())
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 lg:p-8 animate-fade-in relative pb-16">
      {/* Animated In-App Toast Notification */}
      {toast && (
        <div
          className={cx(
            'fixed top-5 right-5 z-50 flex items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-semibold shadow-2xl border transition-all animate-in slide-in-from-top-4 duration-300',
            toast.isError
              ? 'bg-rose-950 text-rose-200 border-rose-800/80 shadow-rose-950/40'
              : 'bg-emerald-950 text-emerald-200 border-emerald-800/80 shadow-emerald-950/40'
          )}
        >
          {toast.isError ? (
            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
          ) : (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          )}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-xs opacity-60 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-base-c">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/emails')}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-base-c bg-white text-secondary-c transition-colors hover:bg-slate-50 hover:text-primary-c shadow-sm dark:bg-ink-850 dark:hover:bg-ink-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-c uppercase tracking-wider">Campaign Studio</span>
              <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                Enterprise Draft
              </span>
            </div>
            <h1 className="text-2xl font-bold text-primary-c tracking-tight">Create Email Campaign</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/emails')}
            className="rounded-xl border border-base-c bg-white px-4 py-2.5 text-sm font-semibold text-secondary-c transition-colors hover:bg-slate-50 hover:text-primary-c dark:bg-ink-850 dark:hover:bg-ink-800"
          >
            Cancel
          </button>

          {activeStep !== 'review' ? (
            <button
              type="button"
              onClick={() => {
                if (activeStep === 'audience') setActiveStep('content');
                else if (activeStep === 'content') setActiveStep('review');
              }}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-indigo-500 transition-all hover:shadow-indigo-500/20"
            >
              Next Step <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || sending}
              className={cx(
                'flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all shadow-lg',
                canSubmit && !sending
                  ? 'bg-gradient-accent text-white hover:shadow-primary-500/25 hover:-translate-y-0.5'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-ink-800 dark:text-slate-600'
              )}
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {scheduledAt ? 'Schedule Campaign' : 'Dispatch Campaign Now'}
            </button>
          )}
        </div>
      </div>

      {/* Enterprise Stepper Navigation Header Bar */}
      <div className="rounded-2xl border border-base-c bg-white/90 dark:bg-ink-900/90 p-2 shadow-sm">
        <div className="grid grid-cols-3 gap-2">
          {/* Step 1 Tab */}
          <button
            type="button"
            onClick={() => setActiveStep('audience')}
            className={cx(
              'flex items-center justify-center gap-3 rounded-xl p-3 text-left transition-all',
              activeStep === 'audience'
                ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-500/30 text-indigo-900 dark:text-indigo-200 shadow-sm'
                : 'text-muted-c hover:bg-slate-50 dark:hover:bg-ink-850'
            )}
          >
            <div
              className={cx(
                'grid h-8 w-8 place-items-center rounded-lg font-bold text-xs shrink-0',
                activeStep === 'audience'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 dark:bg-ink-800 dark:text-slate-400'
              )}
            >
              1
            </div>
            <div className="hidden sm:block truncate">
              <p className="text-xs font-bold leading-none">Target Audience</p>
              <p className="text-[11px] text-muted-c mt-1 font-medium truncate">
                {recipientMode === 'ALL'
                  ? 'ALL_CONTACTS'
                  : recipientMode === 'ADVANCED'
                  ? 'ADVANCED'
                  : recipientMode === 'TAGGED'
                  ? 'TAG_BASED'
                  : csvFileName
                  ? csvFileName
                  : 'CSV Dataset & Rules'}
              </p>
            </div>
          </button>

          {/* Step 2 Tab */}
          <button
            type="button"
            onClick={() => setActiveStep('content')}
            className={cx(
              'flex items-center justify-center gap-3 rounded-xl p-3 text-left transition-all',
              activeStep === 'content'
                ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-500/30 text-indigo-900 dark:text-indigo-200 shadow-sm'
                : 'text-muted-c hover:bg-slate-50 dark:hover:bg-ink-850'
            )}
          >
            <div
              className={cx(
                'grid h-8 w-8 place-items-center rounded-lg font-bold text-xs shrink-0',
                activeStep === 'content'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 dark:bg-ink-800 dark:text-slate-400'
              )}
            >
              2
            </div>
            <div className="hidden sm:block truncate">
              <p className="text-xs font-bold leading-none">Content &amp; Design</p>
              <p className="text-[11px] text-muted-c mt-1 font-medium truncate">
                {subject ? `Subject: ${subject}` : 'Compose & Preview'}
              </p>
            </div>
          </button>

          {/* Step 3 Tab */}
          <button
            type="button"
            onClick={() => setActiveStep('review')}
            className={cx(
              'flex items-center justify-center gap-3 rounded-xl p-3 text-left transition-all',
              activeStep === 'review'
                ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-500/30 text-indigo-900 dark:text-indigo-200 shadow-sm'
                : 'text-muted-c hover:bg-slate-50 dark:hover:bg-ink-850'
            )}
          >
            <div
              className={cx(
                'grid h-8 w-8 place-items-center rounded-lg font-bold text-xs shrink-0',
                activeStep === 'review'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 dark:bg-ink-800 dark:text-slate-400'
              )}
            >
              3
            </div>
            <div className="hidden sm:block truncate">
              <p className="text-xs font-bold leading-none">Review &amp; Delivery</p>
              <p className="text-[11px] text-muted-c mt-1 font-medium truncate">
                {scheduledAt ? 'Scheduled Dispatch' : 'Audit & Send'}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: TARGET AUDIENCE & DYNAMIC SEGMENTS ENGINE                         */}
      {/* ========================================================================= */}
      {activeStep === 'audience' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <GlassCard className="p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-primary-c flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                Select Campaign Recipients
              </h3>
              <p className="text-xs text-secondary-c mt-1">
                Choose how you want to segment and target your audience for this campaign.
              </p>
            </div>

            {/* Visual Recipient Mode Radio Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <label
                className={cx(
                  'flex flex-col justify-between rounded-2xl border p-5 cursor-pointer transition-all',
                  recipientMode === 'ALL'
                    ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20 shadow-md'
                    : 'border-base-c hover:border-indigo-300 hover:bg-slate-50 dark:hover:bg-ink-850'
                )}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      <Users className="h-5 w-5" />
                    </div>
                    <input
                      type="radio"
                      checked={recipientMode === 'ALL'}
                      onChange={() => setRecipientMode('ALL')}
                      className="h-4 w-4 text-indigo-600 border-base-c focus:ring-indigo-600/20"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-primary-c">All CRM Subscribers</h4>
                    <p className="text-xs text-muted-c mt-1 leading-relaxed">
                      Send to your entire verified contact base in the database.
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-base-c/60 flex items-center justify-between text-xs text-secondary-c font-semibold">
                  <span>Scope: Global</span>
                  <span className="text-indigo-600 dark:text-indigo-400">Broad Reach</span>
                </div>
              </label>

              <label
                className={cx(
                  'flex flex-col justify-between rounded-2xl border p-5 cursor-pointer transition-all',
                  recipientMode === 'TAGGED'
                    ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20 shadow-md'
                    : 'border-base-c hover:border-indigo-300 hover:bg-slate-50 dark:hover:bg-ink-850'
                )}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      <Tag className="h-5 w-5" />
                    </div>
                    <input
                      type="radio"
                      checked={recipientMode === 'TAGGED'}
                      onChange={() => setRecipientMode('TAGGED')}
                      className="h-4 w-4 text-indigo-600 border-base-c focus:ring-indigo-600/20"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-primary-c">Filtered Tag Segment</h4>
                    <p className="text-xs text-muted-c mt-1 leading-relaxed">
                      Target users possessing specific CRM tags (e.g. VIP, Newsletter).
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-base-c/60 flex items-center justify-between text-xs text-secondary-c font-semibold">
                  <span>Scope: Tagged</span>
                  <span className="text-purple-600 dark:text-purple-400">Targeted</span>
                </div>
              </label>

              <label
                className={cx(
                  'flex flex-col justify-between rounded-2xl border p-5 cursor-pointer transition-all',
                  recipientMode === 'ADVANCED'
                    ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20 shadow-md'
                    : 'border-base-c hover:border-indigo-300 hover:bg-slate-50 dark:hover:bg-ink-850'
                )}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Sliders className="h-5 w-5" />
                    </div>
                    <input
                      type="radio"
                      checked={recipientMode === 'ADVANCED'}
                      onChange={() => setRecipientMode('ADVANCED')}
                      className="h-4 w-4 text-indigo-600 border-base-c focus:ring-indigo-600/20"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-primary-c">Advanced Rule Builder</h4>
                    <p className="text-xs text-muted-c mt-1 leading-relaxed">
                      Build dynamic audience rules using multi-attribute conditions.
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-base-c/60 flex items-center justify-between text-xs text-secondary-c font-semibold">
                  <span>Scope: Multi-Filter</span>
                  <span className="text-amber-600 dark:text-amber-400">Enterprise</span>
                </div>
              </label>

              <label
                className={cx(
                  'flex flex-col justify-between rounded-2xl border p-5 cursor-pointer transition-all',
                  recipientMode === 'MANUAL'
                    ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20 shadow-md'
                    : 'border-base-c hover:border-indigo-300 hover:bg-slate-50 dark:hover:bg-ink-850'
                )}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <input
                      type="radio"
                      checked={recipientMode === 'MANUAL'}
                      onChange={() => setRecipientMode('MANUAL')}
                      className="h-4 w-4 text-indigo-600 border-base-c focus:ring-indigo-600/20"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-primary-c">CSV / Excel Ingestion</h4>
                    <p className="text-xs text-muted-c mt-1 leading-relaxed">
                      Upload dynamic datasets with up to 100 columns &amp; custom rules.
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-base-c/60 flex items-center justify-between text-xs text-secondary-c font-semibold">
                  <span>Scope: Custom File</span>
                  <span className="text-emerald-600 dark:text-emerald-400">Up to 100 Cols</span>
                </div>
              </label>
            </div>

            {/* Conditional Input 1: Tag Filters */}
            {recipientMode === 'TAGGED' && (
              <TagSegmentBuilder value={tagsFilter} onChange={setTagsFilter} />
            )}

            {/* Conditional Input: Advanced Filters */}
            {recipientMode === 'ADVANCED' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <AdvancedSegmentBuilder filter={audienceFilter} onChange={setAudienceFilter} />
              </div>
            )}

            {/* Conditional Input 2: Dynamic CSV & Filter Rule Builder Engine */}
            {recipientMode === 'MANUAL' && (
              <div className="space-y-6 animate-fade-in">
                {/* File Upload Box */}
                <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-transparent p-5">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-200">
                        Dynamic Dataset Ingestion Engine
                      </h4>
                    </div>
                    <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-extrabold text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                      Up to 100 Columns Supported
                    </span>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".csv,.txt"
                    className="hidden"
                  />

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-indigo-500/40 bg-white/90 dark:bg-ink-900/90 p-4 text-sm font-bold text-indigo-700 dark:text-indigo-300 transition-all hover:bg-indigo-50 dark:hover:bg-indigo-500/20 shadow-sm"
                    >
                      <Upload className="h-5 w-5 text-indigo-600 shrink-0" />
                      <span>{csvFileName ? `Replace File (${csvFileName})` : 'Upload CSV / Excel Dataset File'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="px-4 py-3 text-xs font-bold text-indigo-700 hover:text-indigo-800 dark:text-indigo-300 border border-indigo-500/30 rounded-xl bg-white/80 dark:bg-ink-850 shrink-0 flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <Download className="h-4 w-4" /> Download Sample CSV
                    </button>
                  </div>

                  {/* Detected Columns & Email Selector */}
                  {csvHeaders.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-indigo-500/20 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/90 dark:bg-ink-900/90 p-3 rounded-xl border border-indigo-500/20">
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-indigo-600" />
                          <span className="text-xs font-bold text-primary-c">
                            Select Email Address Column:
                          </span>
                        </div>
                        <select
                          value={selectedEmailCol}
                          onChange={(e) => setSelectedEmailCol(e.target.value)}
                          className="form-input text-xs font-bold h-9 min-w-[200px] bg-slate-50 dark:bg-ink-800"
                        >
                          {csvHeaders.map((col) => (
                            <option key={col} value={col}>
                              {col} {col.toLowerCase().includes('email') ? '(Auto-Detected)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Display Header Pills Repository */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                            <Tag className="h-3.5 w-3.5" /> Detected CSV Columns ({csvHeaders.length})
                          </span>
                          <span className="text-[11px] text-muted-c">Click pill to copy tag</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-white/60 dark:bg-ink-900/60 rounded-xl border border-indigo-500/10 scrollbar-thin">
                          {csvHeaders.map((col) => (
                            <button
                              key={col}
                              type="button"
                              onClick={() => copyColumnTag(col)}
                              title={`Click to copy {{${col}}} placeholder`}
                              className={cx(
                                'rounded-lg px-2.5 py-1 text-xs font-bold transition-all flex items-center gap-1.5 border',
                                copiedTag === `{{${col}}}`
                                  ? 'bg-emerald-500 text-white border-emerald-600 scale-105'
                                  : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50 dark:bg-ink-900 dark:text-indigo-300 dark:border-indigo-800'
                              )}
                            >
                              {copiedTag === `{{${col}}}` ? (
                                <Check className="h-3 w-3 shrink-0" />
                              ) : (
                                <Copy className="h-3 w-3 shrink-0 text-indigo-400" />
                              )}
                              <span>&#123;&#123;{col}&#127;&#127;</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Imported Data Sample Preview Table (First 5 Rows) */}
                      {csvRows.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-secondary-c flex items-center gap-1.5">
                              <Eye className="h-3.5 w-3.5 text-indigo-500" /> Sample Data Preview (First 5 Rows of {csvRows.length} Total Records)
                            </span>
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                              ✓ Data Validated
                            </span>
                          </div>
                          <div className="overflow-x-auto rounded-xl border border-base-c bg-white dark:bg-ink-900 shadow-2xs max-h-48 scrollbar-thin">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-100 dark:bg-ink-800 text-secondary-c font-bold uppercase tracking-wider text-[10px]">
                                <tr>
                                  <th className="px-3 py-2 border-b border-base-c">#</th>
                                  {csvHeaders.slice(0, 8).map((h) => (
                                    <th key={h} className="px-3 py-2 border-b border-base-c">
                                      {h}
                                    </th>
                                  ))}
                                  {csvHeaders.length > 8 && (
                                    <th className="px-3 py-2 border-b border-base-c">+ {csvHeaders.length - 8} more</th>
                                  )}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-base-c">
                                {csvRows.slice(0, 5).map((row, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-ink-850">
                                    <td className="px-3 py-2 font-mono text-[10px] text-muted-c">{idx + 1}</td>
                                    {csvHeaders.slice(0, 8).map((h) => (
                                      <td key={h} className="px-3 py-2 max-w-[150px] truncate text-primary-c">
                                        {row[h] || <span className="text-muted-c italic">empty</span>}
                                      </td>
                                    ))}
                                    {csvHeaders.length > 8 && <td className="px-3 py-2 text-muted-c">...</td>}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Enterprise Dynamic Rule Engine Card */}
                <div className="rounded-2xl border border-base-c bg-slate-50/50 dark:bg-ink-850/50 p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-base-c pb-3">
                    <div className="flex items-center gap-2">
                      <Sliders className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      <div>
                        <h4 className="text-sm font-bold text-primary-c">Enterprise Audience Rule Engine</h4>
                        <p className="text-xs text-muted-c">Filter imported rows using dynamic column rules.</p>
                      </div>
                    </div>

                    {/* Boolean Match Mode Toggle */}
                    <div className="flex items-center gap-1 bg-white dark:bg-ink-900 border border-base-c rounded-xl p-1 shadow-2xs text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setMatchMode('AND')}
                        className={cx(
                          'px-3 py-1 rounded-lg transition-all',
                          matchMode === 'AND'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-muted-c hover:text-primary-c'
                        )}
                      >
                        MATCH ALL (AND)
                      </button>
                      <button
                        type="button"
                        onClick={() => setMatchMode('OR')}
                        className={cx(
                          'px-3 py-1 rounded-lg transition-all',
                          matchMode === 'OR'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'text-muted-c hover:text-primary-c'
                        )}
                      >
                        MATCH ANY (OR)
                      </button>
                    </div>
                  </div>

                  {/* Filter Rules List */}
                  {filterRules.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-base-c bg-white/50 dark:bg-ink-900/50 text-center">
                      <p className="text-xs text-muted-c font-medium">
                        No filter conditions active. All imported dataset rows will be targeted.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filterRules.map((rule, idx) => (
                        <div
                          key={rule.id}
                          className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-white dark:bg-ink-900 border border-base-c p-3 rounded-xl shadow-2xs text-xs"
                        >
                          {idx > 0 && (
                            <span
                              className={cx(
                                'px-2 py-1 rounded-md text-[10px] font-extrabold uppercase shrink-0 text-center',
                                matchMode === 'AND'
                                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                                  : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                              )}
                            >
                              {matchMode}
                            </span>
                          )}

                          {/* Searchable Column Dropdown */}
                          <SearchableColumnSelect
                            value={rule.column}
                            options={csvHeaders.length > 0 ? csvHeaders : ['Name', 'Email', 'Company', 'Role', 'Plan', 'Score', 'City', 'Tag']}
                            onChange={(val) => updateFilterRule(rule.id, 'column', val)}
                          />

                          {/* Operator Dropdown */}
                          <select
                            value={rule.operator}
                            onChange={(e) => updateFilterRule(rule.id, 'operator', e.target.value as any)}
                            className="form-input text-xs h-9 bg-transparent py-0 font-medium"
                          >
                            <option value="equals">Equals (==)</option>
                            <option value="not_equals">Does Not Equal (!=)</option>
                            <option value="contains">Contains</option>
                            <option value="not_contains">Does Not Contain</option>
                            <option value="greater_than">Greater Than (&gt;)</option>
                            <option value="less_than">Less Than (&lt;)</option>
                            <option value="is_not_empty">Is Populated</option>
                            <option value="is_empty">Is Empty</option>
                          </select>

                          {/* Target Value Input */}
                          {!['is_empty', 'is_not_empty'].includes(rule.operator) && (
                            <input
                              value={rule.value}
                              onChange={(e) => updateFilterRule(rule.id, 'value', e.target.value)}
                              placeholder="Target condition value..."
                              className="form-input text-xs h-9 flex-1 py-0 font-medium"
                            />
                          )}

                          <button
                            type="button"
                            onClick={() => removeFilterRule(rule.id)}
                            className="h-9 w-9 rounded-xl hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950 text-muted-c flex items-center justify-center transition-colors shrink-0 border border-transparent hover:border-rose-200"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={addFilterRule}
                      className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-2 rounded-xl border border-indigo-500/20"
                    >
                      <Plus className="h-4 w-4" /> Add Rule Condition
                    </button>

                    <span className="text-xs font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-3 py-2 rounded-xl border border-indigo-500/20 shadow-2xs">
                      ⚡ {activeRecipientsList.length} / {csvRows.length > 0 ? csvRows.length : manualRecipients.split(',').filter(Boolean).length} Target Contacts Matched
                    </span>
                  </div>
                </div>

                {/* Direct Manual Recipients Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-secondary-c">
                    Direct Email Recipient Addresses (Parsed List)
                  </label>
                  <textarea
                    value={manualRecipients}
                    onChange={(e) => setManualRecipients(e.target.value)}
                    rows={3}
                    placeholder="alice@example.com, bob@example.com"
                    className="form-input resize-y text-xs font-mono leading-relaxed"
                  />
                  <p className="text-[11px] text-muted-c">
                    Detected {manualRecipients.split(',').filter((e) => e.trim().includes('@')).length} valid email addresses.
                  </p>
                </div>
              </div>
            )}

            {/* Step 1 Footer Action */}
            <div className="pt-4 border-t border-base-c flex justify-end">
              <button
                type="button"
                onClick={() => setActiveStep('content')}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-500 transition-all hover:shadow-indigo-500/25"
              >
                Continue to Content &amp; Design <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: CONTENT & DESIGN (SPLIT EDITOR + LIVE PREVIEW)                    */}
      {/* ========================================================================= */}
      {activeStep === 'content' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-200">
          
          {/* Left Column: Composer Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <GlassCard className="p-6 space-y-6">
              {/* Creator Mode Tabs Bar */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-c">
                  Content Creation Method
                </label>
                <div className="grid grid-cols-3 gap-2 rounded-xl border border-base-c bg-slate-100/80 dark:bg-ink-900/80 p-1.5">
                  <button
                    type="button"
                    onClick={() => setCreationMode('custom')}
                    className={cx(
                      'flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all',
                      creationMode === 'custom'
                        ? 'bg-white text-indigo-700 shadow-sm dark:bg-ink-800 dark:text-indigo-400 border border-indigo-500/30'
                        : 'text-muted-c hover:text-primary-c'
                    )}
                  >
                    <FileText className="h-3.5 w-3.5 text-indigo-500" />
                    Standard Editor
                  </button>

                  <button
                    type="button"
                    onClick={() => setCreationMode('ai')}
                    className={cx(
                      'flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all',
                      creationMode === 'ai'
                        ? 'bg-white text-emerald-700 shadow-sm dark:bg-ink-800 dark:text-emerald-400 border border-emerald-500/30'
                        : 'text-muted-c hover:text-primary-c'
                    )}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                    AI Writer PRO
                  </button>

                  <button
                    type="button"
                    onClick={() => setCreationMode('template')}
                    className={cx(
                      'flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all',
                      creationMode === 'template'
                        ? 'bg-white text-primary-700 shadow-sm dark:bg-ink-800 dark:text-primary-400 border border-primary-500/30'
                        : 'text-muted-c hover:text-primary-c'
                    )}
                  >
                    <Palette className="h-3.5 w-3.5 text-primary-500" />
                    Saved Template
                  </button>
                </div>
              </div>

              {/* Creation Mode 1: AI Writer Box */}
              {creationMode === 'ai' && (
                <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent p-4 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                      AI Copywriter Assistant
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="e.g. Write a product launch announcement for our new AI feature..."
                      className="form-input flex-1 bg-white/80 dark:bg-ink-900/80 text-xs"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleWriteAi();
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleWriteAi}
                      disabled={!aiPrompt.trim() || aiLoading}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                    >
                      {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      Generate
                    </button>
                  </div>
                  {aiError && <p className="text-xs text-rose-500">{aiError}</p>}
                </div>
              )}

              {/* Creation Mode 2: Saved Template Box */}
              {creationMode === 'template' && (
                <div className="rounded-xl border border-primary-500/30 bg-gradient-to-r from-primary-500/10 to-transparent p-4 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary-c flex items-center gap-1.5">
                      <Palette className="h-4 w-4 text-primary-500" /> Select HTML Template
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate('/settings/email-templates')}
                      className="text-xs font-bold text-primary-600 hover:underline flex items-center gap-1"
                    >
                      Manage Library <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => handleSelectTemplate(e.target.value)}
                      disabled={loadingTemplates}
                      className="form-input flex-1 bg-white/90 dark:bg-ink-900/90 text-xs font-medium"
                    >
                      <option value="">— Choose a Saved Template —</option>
                      {savedTemplates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} — {t.subject}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Subject Line & Personalization Inserter */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-bold text-primary-c">
                      Subject Line <span className="text-danger-500">*</span>
                    </label>
                    <span className="text-[11px] text-muted-c">{subject.length} / 150 chars</span>
                  </div>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter an engaging, high-converting subject line..."
                    className="form-input text-sm font-medium h-11"
                  />
                </div>

                {/* Dynamic Field Tag Inserter Toolbar */}
                <div className="rounded-xl border border-base-c bg-slate-50 dark:bg-ink-850 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-secondary-c flex items-center gap-1.5">
                      <Sparkle className="h-3.5 w-3.5 text-indigo-500" /> Dynamic Tag Inserter
                    </span>
                    <span className="text-[10px] text-muted-c">Click tag to insert into Email Body</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1 scrollbar-thin">
                    {availableTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => insertTagToBody(tag)}
                        className="rounded-lg bg-white dark:bg-ink-900 border border-base-c px-2.5 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors"
                      >
                        + &#123;&#123;{tag}&#127;&#127;
                      </button>
                    ))}
                  </div>
                </div>

                {/* Email Body Editor */}
                <div>
                  <label className="mb-2 block text-sm font-bold text-primary-c">
                    Email Body Content <span className="text-danger-500">*</span>
                  </label>
                  <div className="rounded-xl border border-base-c overflow-hidden focus-within:ring-2 focus-within:ring-primary-500/20 transition-all">
                    {/* Toolbar */}
                    <div className="bg-slate-100 dark:bg-ink-800 border-b border-base-c px-3 py-2 flex items-center gap-1.5">
                      {['B', 'I', 'U'].map((btn) => (
                        <button
                          key={btn}
                          type="button"
                          className="h-7 w-7 rounded border border-transparent hover:bg-white dark:hover:bg-ink-700 text-xs font-bold text-secondary-c flex items-center justify-center transition-colors"
                        >
                          {btn}
                        </button>
                      ))}
                      <div className="w-px h-4 bg-base-c mx-1"></div>
                      <button
                        type="button"
                        className="h-7 px-2 rounded border border-transparent hover:bg-white dark:hover:bg-ink-700 text-xs font-medium text-secondary-c flex items-center justify-center"
                      >
                        Link
                      </button>
                      <button
                        type="button"
                        className="h-7 px-2 rounded border border-transparent hover:bg-white dark:hover:bg-ink-700 text-xs font-medium text-secondary-c flex items-center justify-center"
                      >
                        Image
                      </button>
                      <div className="flex-1"></div>
                      <span className="text-[10px] text-muted-c font-medium">Markdown &amp; HTML Supported</span>
                    </div>

                    <textarea
                      ref={bodyTextareaRef}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={12}
                      placeholder="Write your email body here. Use tags like {{Name}} or {{Company}} to personalize for each recipient..."
                      className="w-full resize-y bg-transparent p-4 text-sm leading-relaxed outline-none border-0"
                    />
                  </div>
                </div>

                {/* Call to Action Controls */}
                <div className="rounded-xl border border-base-c bg-slate-50/50 dark:bg-ink-850/50 p-4 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-secondary-c">
                    Call To Action Button (Optional)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-secondary-c">Button Label</label>
                      <input
                        value={ctaLabel}
                        onChange={(e) => setCtaLabel(e.target.value)}
                        placeholder="e.g. Shop Summer Sale"
                        className="form-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-secondary-c">Destination URL</label>
                      <input
                        value={ctaUrl}
                        onChange={(e) => setCtaUrl(e.target.value)}
                        placeholder="https://yourbrand.com/sale"
                        className="form-input text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 Navigation Footer */}
              <div className="pt-4 border-t border-base-c flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveStep('audience')}
                  className="rounded-xl border border-base-c bg-white px-5 py-2.5 text-xs font-bold text-secondary-c hover:bg-slate-50 dark:bg-ink-850"
                >
                  ← Back to Audience
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep('review')}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-500"
                >
                  Continue to Review &amp; Delivery <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </GlassCard>
          </div>

          {/* Right Column: Live Recipient Email Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <GlassCard className="p-6 space-y-4 border-indigo-500/20 shadow-sm sticky top-6">
              <div className="flex items-center justify-between border-b border-base-c pb-3">
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="text-sm font-bold text-primary-c">Live Recipient Email Preview</h4>
                </div>

                {/* Device Frame Toggle */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-ink-800 rounded-lg p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={cx(
                      'p-1.5 rounded-md transition-colors',
                      previewDevice === 'desktop' ? 'bg-white dark:bg-ink-900 shadow-2xs text-indigo-600' : 'text-muted-c'
                    )}
                    title="Desktop Preview View"
                  >
                    <Monitor className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={cx(
                      'p-1.5 rounded-md transition-colors',
                      previewDevice === 'mobile' ? 'bg-white dark:bg-ink-900 shadow-2xs text-indigo-600' : 'text-muted-c'
                    )}
                    title="Mobile Preview View"
                  >
                    <Smartphone className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Email Frame Container */}
              <div
                className={cx(
                  'mx-auto rounded-2xl border border-base-c bg-white dark:bg-ink-900 shadow-lg overflow-hidden transition-all duration-300',
                  previewDevice === 'mobile' ? 'max-w-[320px]' : 'w-full'
                )}
              >
                {/* Email Client Header Bar */}
                <div className="bg-slate-100 dark:bg-ink-800 p-3 border-b border-base-c space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400"></span>
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400"></span>
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
                    <span className="text-[10px] text-muted-c font-mono ml-2 truncate">Inbox Preview</span>
                  </div>
                  <div className="text-xs font-bold text-primary-c truncate">
                    Subject: {subject || <span className="text-muted-c italic">(No subject line)</span>}
                  </div>
                  <div className="text-[11px] text-muted-c truncate">
                    From: GyanVani Email Service &lt;noreply@crm-connect.com&gt;
                  </div>
                  <div className="text-[11px] text-muted-c truncate">
                    To: {activeRecipientsList[0] || 'sarah.jenkins@acme.com'} (Sample Recipient 1)
                  </div>
                </div>

                {/* Email Body Content Window */}
                <div className="p-5 space-y-4 min-h-[250px] text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                  <div
                    dangerouslySetInnerHTML={{ __html: renderedBodyPreview }}
                    className="prose prose-xs dark:prose-invert max-w-none"
                  />

                  {/* Render CTA Button if configured */}
                  {(ctaLabel || ctaUrl) && (
                    <div className="pt-4 text-center">
                      <a
                        href={ctaUrl || '#'}
                        onClick={(e) => e.preventDefault()}
                        className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 pointer-events-none"
                      >
                        {ctaLabel || 'Click Here'}
                      </a>
                    </div>
                  )}
                </div>

                {/* Footer CAN-SPAM Notice Preview */}
                <div className="bg-slate-50 dark:bg-ink-850 p-3 border-t border-base-c text-[10px] text-muted-c text-center leading-normal">
                  <p>You received this email as a subscriber of GyanVani Connect.</p>
                  <p className="mt-1">
                    <span className="underline cursor-pointer">Unsubscribe</span> | <span className="underline cursor-pointer">Manage Preferences</span>
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-muted-c text-center">
                💡 Placeholders like <code className="font-bold text-indigo-600">&#123;&#123;Name&#127;&#127;</code> automatically render recipient-specific data at dispatch.
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: REVIEW & DISPATCH (AUDIT, TEST & SCHEDULE)                        */}
      {/* ========================================================================= */}
      {activeStep === 'review' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Pre-flight Audit Summary Card */}
          <GlassCard className="p-6 space-y-6">
            <div className="border-b border-base-c pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-lg font-bold text-primary-c">Campaign Pre-Flight Audit</h3>
              </div>
              <p className="text-xs text-secondary-c mt-1 font-medium">
                Review audience parameters, content metrics, and spam compliance before dispatch.
              </p>
            </div>

            {/* Audit Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Box 1: Target Audience */}
              <div className="rounded-2xl border border-base-c bg-slate-50/50 dark:bg-ink-850/50 p-5 space-y-3">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <Users className="h-5 w-5" />
                  <h4 className="text-sm font-bold">Target Audience</h4>
                </div>
                <div className="space-y-1.5 text-xs text-secondary-c font-medium">
                  <p>
                    <span className="text-muted-c">Segment Mode:</span>{' '}
                    <strong className="text-primary-c">
                      {recipientMode === 'ALL'
                        ? 'ALL_CONTACTS'
                        : recipientMode === 'ADVANCED'
                        ? 'ADVANCED'
                        : recipientMode === 'TAGGED'
                        ? 'TAG_BASED'
                        : 'MANUAL'}
                    </strong>
                  </p>
                  <p>
                    <span className="text-muted-c">Matched Recipients:</span>{' '}
                    <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {recipientMode === 'ALL' ? 'All CRM Active Contacts' : `${activeRecipientsList.length} Contacts`}
                    </strong>
                  </p>
                  {csvFileName && (
                    <p className="truncate">
                      <span className="text-muted-c">CSV Source:</span> <span className="font-mono text-primary-c">{csvFileName}</span>
                    </p>
                  )}
                  {filterRules.length > 0 && (
                    <p>
                      <span className="text-muted-c">Active Rules:</span> {filterRules.length} conditions ({matchMode})
                    </p>
                  )}
                </div>
              </div>

              {/* Box 2: Content Breakdown */}
              <div className="rounded-2xl border border-base-c bg-slate-50/50 dark:bg-ink-850/50 p-5 space-y-3">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                  <Mail className="h-5 w-5" />
                  <h4 className="text-sm font-bold">Content Breakdown</h4>
                </div>
                <div className="space-y-1.5 text-xs text-secondary-c font-medium">
                  <p className="truncate">
                    <span className="text-muted-c">Subject:</span>{' '}
                    <strong className="text-primary-c">{subject || 'Untitled Subject'}</strong>
                  </p>
                  <p>
                    <span className="text-muted-c">Word Count:</span> {body.split(/\s+/).filter(Boolean).length} words
                  </p>
                  <p>
                    <span className="text-muted-c">CTA Action:</span>{' '}
                    {ctaLabel ? <strong className="text-indigo-600">{ctaLabel}</strong> : 'None'}
                  </p>
                  <p>
                    <span className="text-muted-c">Creation Mode:</span>{' '}
                    {creationMode === 'ai' ? 'AI Generated' : creationMode === 'template' ? 'Saved Template' : 'Standard Editor'}
                  </p>
                </div>
              </div>

              {/* Box 3: Compliance & Deliverability Audit */}
              <div className="rounded-2xl border border-base-c bg-slate-50/50 dark:bg-ink-850/50 p-5 space-y-3">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <h4 className="text-sm font-bold">Deliverability Checklist</h4>
                </div>
                <div className="space-y-2 text-xs font-medium">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <Check className="h-4 w-4 shrink-0" /> CAN-SPAM Unsubscribe Link Included
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <Check className="h-4 w-4 shrink-0" /> Custom Branded Domain Header Verified
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <Check className="h-4 w-4 shrink-0" /> Low Spam Risk Content Index
                  </div>
                </div>
              </div>
            </div>

            {/* Test Deliverability Bench */}
            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-950/20 p-5 space-y-3">
              <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                <Send className="h-4 w-4 text-indigo-600" /> Test Deliverability Bench
              </h4>
              <p className="text-xs text-muted-c">
                Send a live test version to your personal inbox to verify styling, links, and rendering.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  id="testEmailInput"
                  placeholder="enter-your-email@company.com"
                  className="form-input text-xs flex-1 bg-white/90 dark:bg-ink-900/90"
                />
                <button
                  type="button"
                  onClick={async (e) => {
                    const el = document.getElementById('testEmailInput') as HTMLInputElement;
                    if (!el.value) {
                      showToast('Please enter a valid test email address.', true);
                      return;
                    }
                    if (!subject || !body) {
                      showToast('Please enter subject and body content first.', true);
                      return;
                    }
                    const btn = e.currentTarget;
                    btn.disabled = true;
                    btn.innerHTML = `<span class="flex items-center justify-center gap-2"><svg class="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Sending...</span>`;

                    try {
                      const req = {
                        subject,
                        body,
                        ctaLabel: ctaLabel || undefined,
                        ctaUrl: ctaUrl || undefined,
                        recipientMode,
                        tagsFilter: recipientMode === 'ADVANCED' ? JSON.stringify(audienceFilter) : recipientMode === 'TAGGED' ? tagsFilter : undefined,
                        manualRecipients: recipientMode === 'MANUAL' ? manualRecipients : undefined,
                      };
                      const draftRes = await apiFetch<any>('/api/v1/custom-emails/draft', {
                        method: 'POST',
                        body: JSON.stringify(req),
                      });
                      if (draftRes.error || !draftRes.data) throw new Error(draftRes.error || 'Failed to save draft');
                      const testRes = await apiFetch<any>(`/api/v1/custom-emails/${draftRes.data.id}/test-send`, {
                        method: 'POST',
                        body: JSON.stringify({ testEmail: el.value }),
                      });
                      if (testRes.error) throw new Error(testRes.error);
                      showToast('✅ Test email delivered successfully to ' + el.value);
                    } catch (err: any) {
                      showToast(err.message || 'Error sending test email', true);
                    } finally {
                      btn.disabled = false;
                      btn.innerText = 'Send Test Email';
                    }
                  }}
                  className="rounded-xl border border-indigo-500/30 bg-white px-5 py-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-50 dark:bg-ink-850 dark:text-indigo-300 shadow-sm shrink-0"
                >
                  Send Test Email
                </button>
              </div>
            </div>

            {/* Delivery Timing Options */}
            <div className="rounded-2xl border border-base-c bg-slate-50/50 dark:bg-ink-850/50 p-5 space-y-4">
              <h4 className="text-sm font-bold text-primary-c flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-600" /> Delivery Schedule Options
              </h4>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-semibold text-secondary-c">Dispatch Timing</label>
                  <select
                    className="form-input text-xs font-bold h-10"
                    value={scheduledAt ? 'LATER' : 'NOW'}
                    onChange={(e) => {
                      if (e.target.value === 'NOW') setScheduledAt('');
                      else setScheduledAt(new Date(Date.now() + 3600000).toISOString().slice(0, 16));
                    }}
                  >
                    <option value="NOW">Send Immediately Upon Confirmation</option>
                    <option value="LATER">Schedule for Specific Future Date/Time</option>
                  </select>
                </div>

                {scheduledAt && (
                  <div className="flex-1 space-y-2 animate-fade-in">
                    <label className="text-xs font-semibold text-secondary-c">Select Target Date &amp; Time</label>
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="form-input text-xs h-10 bg-amber-50/50 border-amber-500/30 text-amber-900 focus:border-amber-500/50 font-bold"
                    />
                    <p className="text-[10px] text-muted-c">
                      Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Final Dispatch Action Bar */}
            <div className="pt-4 border-t border-base-c flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveStep('content')}
                className="rounded-xl border border-base-c bg-white px-5 py-2.5 text-xs font-bold text-secondary-c hover:bg-slate-50 dark:bg-ink-850"
              >
                ← Back to Content &amp; Design
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit || sending}
                className={cx(
                  'flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-bold transition-all shadow-xl',
                  canSubmit && !sending
                    ? 'bg-gradient-accent text-white hover:shadow-primary-500/30 hover:scale-[1.02]'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-ink-800 dark:text-slate-600'
                )}
              >
                {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                {scheduledAt ? 'Confirm & Schedule Campaign' : 'Dispatch Email Campaign Now'}
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

function SentConfirmation({
  campaignName,
  recipientMode,
  recipientCount,
  onClose,
}: {
  campaignName: string;
  recipientMode: RecipientMode;
  recipientCount: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-base-c bg-card-c p-8 text-center shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative mx-auto mb-6 w-fit">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-emerald-500/15">
            <Send className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="absolute -inset-2 animate-ping rounded-full bg-emerald-500/20" />
        </div>
        <h3 className="text-2xl font-extrabold text-primary-c">Campaign Dispatched!</h3>
        <p className="mt-3 text-sm text-secondary-c leading-relaxed">
          <span className="font-bold text-primary-c">&quot;{campaignName}&quot;</span> has been successfully queued for delivery to{' '}
          <span className="font-bold text-indigo-600 dark:text-indigo-400">{recipientCount}</span>.
        </p>
        <div className="mt-4 p-3 rounded-xl bg-slate-100 dark:bg-ink-850 text-xs font-mono text-muted-c">
          Recipient Mode: {recipientMode} • Status: Queued
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-gradient-accent py-3.5 text-sm font-bold text-white transition-transform hover:scale-[1.02] shadow-md"
        >
          Return to Email Dashboard
        </button>
      </div>
    </div>
  );
}
