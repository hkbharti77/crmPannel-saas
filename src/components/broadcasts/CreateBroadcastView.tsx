import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cx } from '@/lib/types';
import { 
  fetchWhatsAppTemplates, 
  createCampaign,
  scheduleCampaign,
  executeDryRun,
  type WhatsAppTemplateDto 
} from '@/lib/broadcastsApi';
import { CsvBroadcastUploader } from '@/components/broadcasts/CsvBroadcastUploader';
import {
  Megaphone,
  Users,
  Sparkles,
  CheckCircle2,
  FileSpreadsheet,
  ArrowLeft,
  Loader2,
  Send,
  Smartphone,
  Globe,
  Phone,
  MessageSquare,
  Video,
  MoreVertical,
  ChevronLeft,
} from 'lucide-react';

/* ─── WhatsApp Text Formatter Helper ─── */
function renderWhatsAppFormattedText(text: string) {
  if (!text) return <span className="text-slate-400 italic">Body message content preview...</span>;

  const lines = text.split('\n');

  return lines.map((line, lIdx) => {
    const parts: (string | JSX.Element)[] = [];
    const regex = /(\{\{\d+\}\})|(\*[^*]+\*)|(_[^_]+_)|(~[^~]+~)|(`[^`]+`)/g;
    let match;
    let lastIdx = 0;

    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIdx) {
        parts.push(line.substring(lastIdx, match.index));
      }

      const val = match[0];
      if (val.startsWith('{{')) {
        parts.push(
          <span key={match.index} className="mx-0.5 inline-block rounded bg-emerald-500/20 px-1 py-0.5 font-mono text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
            {val}
          </span>
        );
      } else if (val.startsWith('*') && val.endsWith('*')) {
        parts.push(<strong key={match.index} className="font-bold text-slate-900 dark:text-white">{val.slice(1, -1)}</strong>);
      } else if (val.startsWith('_') && val.endsWith('_')) {
        parts.push(<em key={match.index} className="italic text-slate-800 dark:text-slate-200">{val.slice(1, -1)}</em>);
      } else if (val.startsWith('~') && val.endsWith('~')) {
        parts.push(<del key={match.index} className="line-through text-slate-500">{val.slice(1, -1)}</del>);
      } else if (val.startsWith('`') && val.endsWith('`')) {
        parts.push(<code key={match.index} className="rounded bg-slate-200 dark:bg-ink-800 px-1 font-mono text-[11px] text-pink-600 dark:text-pink-400">{val.slice(1, -1)}</code>);
      } else {
        parts.push(val);
      }
      lastIdx = match.index + val.length;
    }
    if (lastIdx < line.length) {
      parts.push(line.substring(lastIdx));
    }

    return (
      <div key={lIdx} className="min-h-[1.2em]">
        {parts.length > 0 ? parts : <br />}
      </div>
    );
  });
}

const DEFAULT_TEMPLATES: WhatsAppTemplateDto[] = [
  {
    name: '3p_direct_integration_test_template',
    category: 'UTILITY',
    language: 'en_US',
    status: 'APPROVED',
    bodyText: 'Welcome! This is a test message from the WhatsApp Business Platform. You have successfully configured your WhatsApp Business account and completed onboarding. You can now start sending messages to your customers.',
    footerText: 'WhatsApp Business Platform',
  }
];

export default function CreateBroadcastView() {
  const navigate = useNavigate();
  
  // Fetch templates directly
  const [fetchedTemplates, setFetchedTemplates] = useState<WhatsAppTemplateDto[]>([]);
  useEffect(() => {
    const fetchTemplates = async () => {
      const res = await fetchWhatsAppTemplates();
      if (res.data) setFetchedTemplates(res.data);
    };
    fetchTemplates();
  }, []);

  // Default audience counts (could be fetched later)
  const [audienceCounts, setAudienceCounts] = useState<{ all: number; qualified: number; vip: number }>({
    all: 0,
    qualified: 0,
    vip: 0,
  });

  useEffect(() => {
    // Simulate fetching audience counts
    const fetchAudience = async () => {
      setAudienceCounts({ all: 4, qualified: 0, vip: 0 });
    };
    fetchAudience();
  }, []);

  const [title, setTitle] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [targetType, setTargetType] = useState<string>('ALL_CONTACTS');
  const [variableMap, setVariableMap] = useState<Record<string, string>>({});
  const [scheduleType, setScheduleType] = useState<'IMMEDIATE' | 'SCHEDULED'>('IMMEDIATE');
  const [scheduleTime, setScheduleTime] = useState('');
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [csvUploadData, setCsvUploadData] = useState<{
    csvRecipients: Record<string, string | null>[];
    phoneColumn: string;
    appliedFilters: { column: string; operator: string; value: string }[];
    filteredCount: number;
  } | null>(null);
  const [saveImportedRecipients, setSaveImportedRecipients] = useState(false);

  // Fallback to default preset templates if templates array is empty
  const activeTemplates = useMemo(() => {
    if (fetchedTemplates && fetchedTemplates.length > 0) {
      return fetchedTemplates;
    }
    return DEFAULT_TEMPLATES;
  }, [fetchedTemplates]);

  // Selected template details
  const selectedTemplate = useMemo(() => {
    return activeTemplates.find((t: WhatsAppTemplateDto) => t.name === templateName) || activeTemplates[0] || null;
  }, [activeTemplates, templateName]);

  // Auto select first template if templateName is not set
  useEffect(() => {
    if (!templateName && activeTemplates.length > 0) {
      setTemplateName(activeTemplates[0].name);
    }
  }, [activeTemplates, templateName]);

  // Extract variables like {{1}}, {{2}} from template body
  const detectedVariables = useMemo(() => {
    if (!selectedTemplate || !selectedTemplate.bodyText) return [];
    const matches = selectedTemplate.bodyText.match(/\{\{\d+\}\}/g);
    if (!matches) return [];
    return Array.from(new Set(matches)) as string[];
  }, [selectedTemplate]);

  // Update default mapping when variables detected
  useEffect(() => {
    // Sync default mappings
    if (detectedVariables.length > 0) {
      const initMap: Record<string, string> = {};
      detectedVariables.forEach((v) => {
        initMap[v] = variableMap[v] || '';
      });
      setVariableMap(initMap);
    } else {
      setVariableMap({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectedVariables]);

  const targetCount =
    targetType === 'CSV_EXCEL_UPLOAD'
      ? csvUploadData?.filteredCount || 0
      : targetType === 'ALL_CONTACTS'
      ? audienceCounts.all
      : targetType === 'QUALIFIED_LEADS'
      ? audienceCounts.qualified
      : audienceCounts.vip;

  const handleLaunch = async () => {
    if (!title.trim() || !templateName) return;
    setSubmitting(true);

    // Build targetFilterJson for CSV upload with filters
    let targetFilterJson: string | undefined;
    if (targetType === 'CSV_EXCEL_UPLOAD' && csvUploadData) {
      targetFilterJson = JSON.stringify({
        csvRecipients: csvUploadData.csvRecipients,
        phoneColumn: csvUploadData.phoneColumn,
        appliedFilters: csvUploadData.appliedFilters,
      });
    }

    const payload = {
      title: title.trim(),
      templateId: templateName,
      targetType,
      targetFilterJson,
      variableMappingJson: Object.keys(variableMap).length > 0 ? JSON.stringify(variableMap) : undefined,
      scheduleType,
      scheduleTime: scheduleType === 'SCHEDULED' ? scheduleTime : undefined,
      testPhoneNumber: testPhoneNumber.trim() || undefined,
      targetCount,
    };
    
    const createRes = await createCampaign({
      name: payload.title,
      templateId: payload.templateId || 'UTILITY_GENERAL',
      targetType: payload.targetType || 'ALL_CONTACTS',
      targetFilterJson: payload.targetFilterJson,
      variableMappingJson: payload.variableMappingJson,
      saveImportedRecipients: targetType === 'CSV_EXCEL_UPLOAD' ? saveImportedRecipients : undefined,
    });

    if (createRes.data) {
      const campId = createRes.data.id;
      if (payload.testPhoneNumber) {
        await executeDryRun(campId, payload.testPhoneNumber);
      }
      if (payload.scheduleType === 'SCHEDULED' && payload.scheduleTime) {
        await scheduleCampaign(campId, payload.scheduleTime);
      } else {
        await scheduleCampaign(campId);
      }
    }
    
    setSubmitting(false);
    navigate('/broadcasts'); // Go back to broadcasts list
  };

  // Render formatted body with variable mapping replaced
  const renderPreviewBody = () => {
    if (!selectedTemplate || !selectedTemplate.bodyText) return 'Select an approved template to preview broadcast content...';
    let body = selectedTemplate.bodyText;
    Object.entries(variableMap).forEach(([k, v]) => {
      body = body.replace(new RegExp(k.replace(/[{}]/g, '\\$&'), 'g'), v || k);
    });
    return body;
  };

  return (
    <div className="flex flex-col h-full bg-base-c text-primary-c overflow-hidden">
      {/* Enterprise Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-base-c bg-card-c px-8 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/broadcasts')} 
            className="flex h-9 w-9 items-center justify-center rounded-full border border-base-c text-secondary-c hover:bg-subtle-c hover:text-primary-c transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-primary-c">New WhatsApp Broadcast</h1>
            <p className="text-xs font-medium text-muted-c">Target audience segments with Meta-approved templates.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/broadcasts')} 
            className="rounded-lg px-5 py-2 text-sm font-semibold text-secondary-c hover:bg-subtle-c transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleLaunch}
            disabled={!title.trim() || !templateName || submitting}
            className={cx(
              'flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-bold shadow-sm transition-all',
              title.trim() && templateName && !submitting 
                ? 'bg-gradient-accent text-white hover:scale-105 hover:shadow-md' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-ink-800 dark:text-slate-600'
            )}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {submitting ? 'Launching…' : 'Launch Broadcast'}
          </button>
        </div>
      </header>

      {/* Content Body */}
      <div className="grid flex-1 overflow-hidden lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
        
        {/* Left Form Controls */}
        <div className="overflow-y-auto p-8 lg:p-12 space-y-10 scrollbar-thin">
          <div className="max-w-3xl mx-auto space-y-10">
            
            {/* Section: Campaign Identity */}
            <section className="flex gap-6">
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                <Megaphone className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-5">
                <div>
                  <h3 className="text-base font-bold text-primary-c">Campaign Identity</h3>
                  <p className="text-sm text-secondary-c mt-1">Define the internal name and select your WhatsApp template.</p>
                </div>
                <div className="surface rounded-2xl p-6 space-y-6 shadow-sm">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-primary-c">Broadcast Campaign Name *</label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Q3 VIP Property Showcase & Special Offer"
                      className="w-full rounded-xl border border-base-c bg-subtle-c px-4 py-2.5 text-sm text-primary-c focus:bg-card-c focus:ring-2 focus:ring-primary-500/50 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-primary-c">Select Approved Meta Template *</label>
                      {selectedTemplate && (
                        <span className="text-[10px] font-mono font-bold text-primary-600 dark:text-primary-400 bg-primary-500/10 px-2.5 py-0.5 rounded-full border border-primary-500/20">
                          {selectedTemplate.status || 'APPROVED'}
                        </span>
                      )}
                    </div>
                    <select
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      className="w-full rounded-xl border border-base-c bg-subtle-c px-4 py-2.5 text-sm text-primary-c focus:bg-card-c focus:ring-2 focus:ring-primary-500/50 outline-none cursor-pointer appearance-none transition-all"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em' }}
                    >
                      {activeTemplates.map((t: WhatsAppTemplateDto) => (
                        <option key={t.name} value={t.name}>
                          {t.name} ({t.category} - {t.language})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </section>

            {/* Section: Audience */}
            <section className="flex gap-6">
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                <Users className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-primary-c">Target Audience</h3>
                    <p className="text-sm text-secondary-c mt-1">Select who should receive this broadcast.</p>
                  </div>
                  <span className="rounded-full bg-slate-100 dark:bg-ink-800 px-3 py-1 text-xs font-bold text-primary-c">
                    Reach: ~{targetCount}
                  </span>
                </div>
                
                <div className="surface rounded-2xl p-6 space-y-6 shadow-sm">
                  {targetType !== 'CSV_EXCEL_UPLOAD' && (
                    <div className="grid gap-3">
                      {/* All Contacts */}
                      <button
                        type="button"
                        onClick={() => { setTargetType('ALL_CONTACTS'); setCsvUploadData(null); }}
                        className={cx(
                          'flex items-center text-left p-4 rounded-xl border transition-all',
                          targetType === 'ALL_CONTACTS'
                            ? 'border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50 dark:border-ink-700 dark:bg-ink-800 dark:hover:border-ink-600'
                        )}
                      >
                        <div className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', targetType === 'ALL_CONTACTS' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500 dark:bg-ink-700 dark:text-slate-400')}>
                          <Users className="h-5 w-5" />
                        </div>
                        <div className="ml-4 flex-1">
                          <p className={cx('text-sm font-semibold', targetType === 'ALL_CONTACTS' ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-700 dark:text-slate-300')}>All Contacts</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Send to your entire contact database</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">~{audienceCounts.all}</p>
                          <p className="text-[10px] uppercase font-semibold text-slate-400">Leads</p>
                        </div>
                      </button>

                      {/* Qualified Leads */}
                      <button
                        type="button"
                        onClick={() => { setTargetType('QUALIFIED_LEADS'); setCsvUploadData(null); }}
                        className={cx(
                          'flex items-center text-left p-4 rounded-xl border transition-all',
                          targetType === 'QUALIFIED_LEADS'
                            ? 'border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50 dark:border-ink-700 dark:bg-ink-800 dark:hover:border-ink-600'
                        )}
                      >
                        <div className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', targetType === 'QUALIFIED_LEADS' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500 dark:bg-ink-700 dark:text-slate-400')}>
                          <Sparkles className="h-5 w-5" />
                        </div>
                        <div className="ml-4 flex-1">
                          <p className={cx('text-sm font-semibold', targetType === 'QUALIFIED_LEADS' ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-700 dark:text-slate-300')}>Qualified Leads</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Focus on highly engaged and qualified prospects</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">~{audienceCounts.qualified}</p>
                          <p className="text-[10px] uppercase font-semibold text-slate-400">Leads</p>
                        </div>
                      </button>

                      {/* VIP Clients */}
                      <button
                        type="button"
                        onClick={() => { setTargetType('VIP_CLIENTS'); setCsvUploadData(null); }}
                        className={cx(
                          'flex items-center text-left p-4 rounded-xl border transition-all',
                          targetType === 'VIP_CLIENTS'
                            ? 'border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50 dark:border-ink-700 dark:bg-ink-800 dark:hover:border-ink-600'
                        )}
                      >
                        <div className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', targetType === 'VIP_CLIENTS' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500 dark:bg-ink-700 dark:text-slate-400')}>
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div className="ml-4 flex-1">
                          <p className={cx('text-sm font-semibold', targetType === 'VIP_CLIENTS' ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-700 dark:text-slate-300')}>VIP Clients</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Exclusive list of high-value clients</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">~{audienceCounts.vip}</p>
                          <p className="text-[10px] uppercase font-semibold text-slate-400">VIPs</p>
                        </div>
                      </button>

                      {/* CSV / Excel */}
                      <button
                        type="button"
                        onClick={() => setTargetType('CSV_EXCEL_UPLOAD')}
                        className={cx(
                          'flex items-center text-left p-4 rounded-xl border transition-all',
                          targetType === 'CSV_EXCEL_UPLOAD'
                            ? 'border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50 dark:border-ink-700 dark:bg-ink-800 dark:hover:border-ink-600'
                        )}
                      >
                        <div className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', targetType === 'CSV_EXCEL_UPLOAD' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500 dark:bg-ink-700 dark:text-slate-400')}>
                          <FileSpreadsheet className="h-5 w-5" />
                        </div>
                        <div className="ml-4 flex-1">
                          <p className={cx('text-sm font-semibold', targetType === 'CSV_EXCEL_UPLOAD' ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-700 dark:text-slate-300')}>Custom CSV / Excel Upload</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Upload a specific list and apply custom data filters</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold text-indigo-500">Select &rarr;</span>
                        </div>
                      </button>
                    </div>
                  )}

                  {/* CSV Upload Panel */}
                  {targetType === 'CSV_EXCEL_UPLOAD' && !csvUploadData && (
                    <CsvBroadcastUploader
                      onComplete={(data) => setCsvUploadData(data)}
                      onCancel={() => setTargetType('ALL_CONTACTS')}
                    />
                  )}

                  {/* CSV Upload Complete Summary */}
                  {targetType === 'CSV_EXCEL_UPLOAD' && csvUploadData && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                             <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                              {csvUploadData.filteredCount} recipients ready
                            </p>
                            <p className="text-xs font-medium text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
                              Phone column: {csvUploadData.phoneColumn}
                              {csvUploadData.appliedFilters.length > 0 && ` • ${csvUploadData.appliedFilters.length} filter(s)`}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setCsvUploadData(null)}
                          className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50 transition-colors border border-emerald-200"
                        >
                          Re-upload
                        </button>
                      </div>

                      {/* Save to CRM Toggle */}
                      <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-base-c bg-subtle-c p-4 transition-all hover:bg-card-c">
                        <div className="mt-0.5 flex items-center h-5">
                          <input
                            type="checkbox"
                            checked={saveImportedRecipients}
                            onChange={(e) => setSaveImportedRecipients(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-primary-c">Save recipients as Contacts in CRM</p>
                          <p className="text-xs text-secondary-c mt-1 leading-relaxed">
                            If checked, recipients will be saved to your CRM. If they already exist, we won't overwrite their existing name or email. If unchecked, they will receive the broadcast but won't clutter your Contacts list.
                          </p>
                        </div>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Section: Personalization & Delivery */}
            <section className="flex gap-6 pb-20">
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
                <Send className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-5">
                <div>
                  <h3 className="text-base font-bold text-primary-c">Personalization & Delivery</h3>
                  <p className="text-sm text-secondary-c mt-1">Map template variables and set your schedule.</p>
                </div>
                
                <div className="space-y-4">
                  {/* Variable Mapping */}
                  {detectedVariables.length > 0 && (
                    <div className="surface rounded-2xl p-6 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-primary-c">Template Variables</label>
                        <span className="text-[10px] text-muted-c font-mono font-bold bg-slate-100 px-2 py-1 rounded">{detectedVariables.length} variable(s)</span>
                      </div>
                      <div className="grid gap-3">
                        {detectedVariables.map((v: string) => (
                          <div key={v} className="flex items-center gap-3">
                            <span className="font-mono text-sm font-bold text-primary-600 dark:text-primary-400 w-16 bg-primary-50/50 border border-primary-500/20 py-2 rounded-lg text-center shrink-0">
                              {v}
                            </span>
                            <input
                              value={variableMap[v] || ''}
                              onChange={(e) => setVariableMap((prev) => ({ ...prev, [v]: e.target.value }))}
                              placeholder="e.g. {{contact.name}} or Custom Value"
                              className="w-full rounded-xl border border-base-c bg-subtle-c px-4 py-2 text-sm text-primary-c focus:bg-card-c focus:ring-2 focus:ring-primary-500/50 outline-none transition-all"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Schedule */}
                  <div className="surface rounded-2xl p-6 shadow-sm space-y-6">
                    <div>
                      <label className="mb-3 block text-sm font-semibold text-primary-c">Delivery Schedule</label>
                      <div className="flex flex-wrap items-center gap-4">
                        <label className={cx(
                          "flex items-center gap-2 cursor-pointer text-sm font-semibold px-4 py-2 rounded-xl border transition-all",
                          scheduleType === 'IMMEDIATE' ? "border-primary-500 bg-primary-50 text-primary-700" : "border-base-c hover:bg-slate-50"
                        )}>
                          <input
                            type="radio"
                            name="scheduleType"
                            checked={scheduleType === 'IMMEDIATE'}
                            onChange={() => setScheduleType('IMMEDIATE')}
                            className="accent-primary-600 w-4 h-4"
                          />
                          <span>⚡ Send Immediately</span>
                        </label>

                        <label className={cx(
                          "flex items-center gap-2 cursor-pointer text-sm font-semibold px-4 py-2 rounded-xl border transition-all",
                          scheduleType === 'SCHEDULED' ? "border-primary-500 bg-primary-50 text-primary-700" : "border-base-c hover:bg-slate-50"
                        )}>
                          <input
                            type="radio"
                            name="scheduleType"
                            checked={scheduleType === 'SCHEDULED'}
                            onChange={() => setScheduleType('SCHEDULED')}
                            className="accent-primary-600 w-4 h-4"
                          />
                          <span>📅 Schedule for Later</span>
                        </label>
                      </div>

                      {scheduleType === 'SCHEDULED' && (
                        <div className="mt-4 animate-slide-up">
                          <input
                            type="datetime-local"
                            value={scheduleTime}
                            onChange={(e) => setScheduleTime(e.target.value)}
                            className="w-full max-w-sm rounded-xl border border-base-c bg-subtle-c px-4 py-2 text-sm text-primary-c focus:bg-card-c focus:ring-2 focus:ring-primary-500/50 outline-none"
                          />
                        </div>
                      )}
                    </div>

                    <hr className="border-base-c" />

                    {/* Test Send */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-primary-c">Test Send (Dry Run) <span className="text-secondary-c font-normal text-xs ml-1">(Optional)</span></label>
                      <input
                        value={testPhoneNumber}
                        onChange={(e) => setTestPhoneNumber(e.target.value)}
                        placeholder="Enter test phone number (e.g. +919876543210)"
                        className="w-full rounded-xl border border-base-c bg-subtle-c px-4 py-2.5 text-sm font-mono text-primary-c focus:bg-card-c focus:ring-2 focus:ring-primary-500/50 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Right Column: Premium Live Preview */}
        <div className="bg-slate-50 dark:bg-ink-950 border-l border-base-c p-8 flex flex-col items-center justify-start overflow-y-auto scrollbar-thin">
          <div className="flex items-center gap-2 mb-8 self-start w-full">
            <Smartphone className="h-5 w-5 text-emerald-600" />
            <h4 className="text-sm font-bold text-primary-c">Live WhatsApp Preview</h4>
          </div>

          {/* Premium Mock Phone */}
          <div className="relative w-full max-w-[340px] rounded-[3rem] border-[8px] border-slate-900 bg-[#E5DDD5] shadow-2xl overflow-hidden min-h-[640px] flex flex-col shrink-0">
            
            {/* Phone Notch */}
            <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 rounded-b-2xl w-32 mx-auto z-20"></div>

            {/* WhatsApp Header */}
            <div className="bg-[#075E54] text-white pt-10 pb-3 px-4 flex items-center justify-between shadow-md z-10">
              <div className="flex items-center gap-2">
                <ChevronLeft className="h-6 w-6" />
                <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                  <div className="h-7 w-7 rounded-full bg-slate-200" />
                </div>
                <div>
                  <div className="font-bold text-sm leading-tight">Business Name</div>
                  <div className="text-[10px] text-white/80 opacity-90">Business Account</div>
                </div>
              </div>
              <div className="flex gap-4">
                <Video className="h-5 w-5 opacity-90" />
                <Phone className="h-5 w-5 opacity-90" />
                <MoreVertical className="h-5 w-5 opacity-90" />
              </div>
            </div>

            {/* WhatsApp Chat Area */}
            <div className="flex-1 p-4 relative overflow-y-auto scrollbar-thin" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundSize: 'cover' }}>
              
              <div className="flex justify-center mb-4">
                <span className="bg-[#E1F3FB] text-slate-600 text-[11px] px-3 py-1 rounded-lg shadow-sm font-medium">TODAY</span>
              </div>

              <div className="flex justify-start">
                {/* Tail SVG */}
                <svg viewBox="0 0 8 13" width="8" height="13" className="absolute left-[8px] mt-1 text-white">
                  <path opacity="1" fill="currentColor" d="M1.533,3.568L8,12.193V1H2.812 C1.042,1,0.474,2.156,1.533,3.568z"></path>
                </svg>
                
                <div className="relative max-w-[275px] bg-white rounded-lg rounded-tl-none shadow-sm flex flex-col z-10 ml-2">
                  <div className="p-2.5 space-y-2">
                    <div className="text-[14px] text-[#111b21] leading-relaxed px-1">
                      {renderWhatsAppFormattedText(renderPreviewBody())}
                    </div>

                    {selectedTemplate?.footerText && (
                      <div className="flex items-end justify-between gap-4 px-1 pt-1 border-t border-slate-100 mt-2">
                        <p className="text-[11px] text-slate-500 truncate flex-1 pt-1">
                          {selectedTemplate.footerText}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 pt-0.5 pr-1">
                      <span>13:08</span>
                      <span className="font-bold text-sky-500 text-[9px]">✓✓</span>
                    </div>
                  </div>

                  {selectedTemplate?.buttons && selectedTemplate.buttons.length > 0 && (
                    <div className="border-t border-slate-100 bg-slate-50/50 rounded-b-lg overflow-hidden divide-y divide-slate-100">
                      {selectedTemplate.buttons.map((btn: Record<string, unknown>, idx: number) => (
                        <div key={idx} className="flex items-center justify-center gap-2 py-2.5 px-3 text-[14px] text-[#00A884] bg-white cursor-pointer hover:bg-slate-50 transition-colors">
                          {btn.type === 'URL' ? <Globe className="h-4 w-4" /> : btn.type === 'PHONE_NUMBER' ? <Phone className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                          <span className="font-medium truncate">{btn.text as string}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Phone bottom indicator */}
            <div className="absolute bottom-2 inset-x-0 flex justify-center">
              <div className="h-1 w-24 bg-slate-900/20 rounded-full" />
            </div>
          </div>
          
          <p className="mt-6 text-xs text-muted-c text-center max-w-[280px]">
            Preview illustrates how this message appears on iOS devices. Actual rendering may vary slightly on Android.
          </p>
        </div>
      </div>
    </div>
  );
}
