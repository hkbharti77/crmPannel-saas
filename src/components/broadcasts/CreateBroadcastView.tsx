import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cx } from '@/lib/types';
import { 
  fetchWhatsAppTemplates, 
  createCampaign,
  scheduleCampaign,
  executeDryRun,
  type WhatsAppTemplateDto,
  type CampaignVariantInput
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
  RefreshCw,
  Split,
  Trophy,
  Sliders,
  Clock,
  ArrowRight,
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
  const [syncingTemplates, setSyncingTemplates] = useState(false);

  const handleSyncTemplates = async () => {
    setSyncingTemplates(true);
    try {
      const res = await fetchWhatsAppTemplates(true);
      if (res.data) {
        setFetchedTemplates(res.data);
      }
    } catch (err) {
      console.error('Failed to sync templates from Meta:', err);
    } finally {
      setSyncingTemplates(false);
    }
  };

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

  // ─── A/B Split Testing State (Gap 07) ──────────────────────────────────
  const [isAbTest, setIsAbTest] = useState(false);
  const [abTestPercentage, setAbTestPercentage] = useState<number>(20);
  const [abWinnerMetric, setAbWinnerMetric] = useState<'CLICK_RATE' | 'READ_RATE'>('CLICK_RATE');
  const [abEvaluationHours, setAbEvaluationHours] = useState<number>(4);
  const [activeVariantTab, setActiveVariantTab] = useState<'A' | 'B'>('A');

  const [variantA, setVariantA] = useState<{ templateName: string; variableMap: Record<string, string> }>({
    templateName: '',
    variableMap: {},
  });
  const [variantB, setVariantB] = useState<{ templateName: string; variableMap: Record<string, string> }>({
    templateName: '',
    variableMap: {},
  });

  const [previewVariant, setPreviewVariant] = useState<'A' | 'B'>('A');

  // Fallback to default preset templates if templates array is empty
  const activeTemplates = useMemo(() => {
    if (fetchedTemplates && fetchedTemplates.length > 0) {
      return fetchedTemplates;
    }
    return DEFAULT_TEMPLATES;
  }, [fetchedTemplates]);

  // Selected template details for standard single broadcast
  const selectedTemplate = useMemo(() => {
    return activeTemplates.find((t: WhatsAppTemplateDto) => t.name === templateName) || activeTemplates[0] || null;
  }, [activeTemplates, templateName]);

  // Auto select default templates
  useEffect(() => {
    if (activeTemplates.length > 0) {
      if (!templateName) {
        setTemplateName(activeTemplates[0].name);
      }
      if (!variantA.templateName) {
        setVariantA((prev) => ({ ...prev, templateName: activeTemplates[0].name }));
      }
      if (!variantB.templateName) {
        const secondTmpl = activeTemplates.length > 1 ? activeTemplates[1].name : activeTemplates[0].name;
        setVariantB((prev) => ({ ...prev, templateName: secondTmpl }));
      }
    }
  }, [activeTemplates, templateName, variantA.templateName, variantB.templateName]);

  // Extract variables for standard template
  const detectedVariables = useMemo(() => {
    if (!selectedTemplate || !selectedTemplate.bodyText) return [];
    const matches = selectedTemplate.bodyText.match(/\{\{\d+\}\}/g);
    if (!matches) return [];
    return Array.from(new Set(matches)) as string[];
  }, [selectedTemplate]);

  // Update default mapping when standard variables detected
  useEffect(() => {
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

  // Variant A & B template objects and detected variables
  const selectedVariantATemplate = useMemo(() => {
    const tName = variantA.templateName || templateName;
    return activeTemplates.find((t) => t.name === tName) || activeTemplates[0] || null;
  }, [activeTemplates, variantA.templateName, templateName]);

  const selectedVariantBTemplate = useMemo(() => {
    const tName = variantB.templateName || templateName;
    return activeTemplates.find((t) => t.name === tName) || activeTemplates[0] || null;
  }, [activeTemplates, variantB.templateName, templateName]);

  const detectedVariablesVariantA = useMemo(() => {
    if (!selectedVariantATemplate || !selectedVariantATemplate.bodyText) return [];
    const matches = selectedVariantATemplate.bodyText.match(/\{\{\d+\}\}/g);
    return matches ? Array.from(new Set(matches)) : [];
  }, [selectedVariantATemplate]);

  const detectedVariablesVariantB = useMemo(() => {
    if (!selectedVariantBTemplate || !selectedVariantBTemplate.bodyText) return [];
    const matches = selectedVariantBTemplate.bodyText.match(/\{\{\d+\}\}/g);
    return matches ? Array.from(new Set(matches)) : [];
  }, [selectedVariantBTemplate]);

  const targetCount =
    targetType === 'CSV_EXCEL_UPLOAD'
      ? csvUploadData?.filteredCount || 0
      : targetType === 'ALL_CONTACTS'
      ? audienceCounts.all
      : targetType === 'QUALIFIED_LEADS'
      ? audienceCounts.qualified
      : audienceCounts.vip;

  // A/B Partition Calculations for visual UI feedback
  const abCalculations = useMemo(() => {
    const effectiveTotal = Math.max(0, targetCount);
    const testSampleTotal = Math.min(effectiveTotal, Math.max(2, Math.round((effectiveTotal * abTestPercentage) / 100)));
    const perVariantCount = Math.floor(testSampleTotal / 2);
    const actualTestTotal = perVariantCount * 2;
    const holdoutCount = Math.max(0, effectiveTotal - actualTestTotal);
    return {
      total: effectiveTotal,
      testTotal: actualTestTotal,
      variantA: perVariantCount,
      variantB: perVariantCount,
      holdout: holdoutCount,
    };
  }, [targetCount, abTestPercentage]);

  const handleLaunch = async () => {
    if (!title.trim()) return;
    if (!isAbTest && !templateName) return;
    if (isAbTest && (!variantA.templateName || !variantB.templateName)) return;

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

    if (isAbTest) {
      const varATpl = variantA.templateName || templateName;
      const varBTpl = variantB.templateName || templateName;
      const variants: CampaignVariantInput[] = [
        {
          variantCode: 'A',
          name: 'Variant A',
          templateName: varATpl,
          variableMappingJson: Object.keys(variantA.variableMap).length > 0 ? JSON.stringify(variantA.variableMap) : undefined,
        },
        {
          variantCode: 'B',
          name: 'Variant B',
          templateName: varBTpl,
          variableMappingJson: Object.keys(variantB.variableMap).length > 0 ? JSON.stringify(variantB.variableMap) : undefined,
        },
      ];

      const createRes = await createCampaign({
        name: title.trim(),
        templateId: varATpl,
        targetType,
        targetFilterJson,
        variableMappingJson: Object.keys(variantA.variableMap).length > 0 ? JSON.stringify(variantA.variableMap) : undefined,
        saveImportedRecipients: targetType === 'CSV_EXCEL_UPLOAD' ? saveImportedRecipients : undefined,
        isAbTest: true,
        abTestPercentage,
        abWinnerMetric,
        abEvaluationHours,
        variants,
      });

      if (createRes.data) {
        const campId = createRes.data.id;
        if (testPhoneNumber.trim()) {
          await executeDryRun(campId, testPhoneNumber.trim());
        }
        if (scheduleType === 'SCHEDULED' && scheduleTime) {
          await scheduleCampaign(campId, scheduleTime);
        } else {
          await scheduleCampaign(campId);
        }
      }
      setSubmitting(false);
      navigate('/broadcasts');
      return;
    }

    // Standard broadcast payload
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

  // Preview template and text resolution
  const previewTemplate = useMemo(() => {
    if (!isAbTest) return selectedTemplate;
    return previewVariant === 'A' ? selectedVariantATemplate : selectedVariantBTemplate;
  }, [isAbTest, previewVariant, selectedTemplate, selectedVariantATemplate, selectedVariantBTemplate]);

  const renderPreviewBody = () => {
    if (!previewTemplate || !previewTemplate.bodyText) return 'Select an approved template to preview broadcast content...';
    let body = previewTemplate.bodyText;
    const currentVarMap = !isAbTest ? variableMap : (previewVariant === 'A' ? variantA.variableMap : variantB.variableMap);
    Object.entries(currentVarMap).forEach(([k, v]) => {
      body = body.replace(new RegExp(k.replace(/[{}]/g, '\\$&'), 'g'), v || k);
    });
    return body;
  };

  const isFormValid = useMemo(() => {
    if (!title.trim() || submitting) return false;
    if (isAbTest) {
      return !!variantA.templateName && !!variantB.templateName;
    }
    return !!templateName;
  }, [title, submitting, isAbTest, variantA.templateName, variantB.templateName, templateName]);

  return (
    <div className="flex flex-col h-full bg-base-c text-primary-c overflow-hidden">
      {/* Enterprise Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-base-c bg-card-c px-6 lg:px-8 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/broadcasts')} 
            className="flex h-9 w-9 items-center justify-center rounded-full border border-base-c text-secondary-c hover:bg-subtle-c hover:text-primary-c transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-primary-c">New WhatsApp Broadcast</h1>
              {isAbTest && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-bold text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  <Split className="h-3 w-3" /> A/B Split Test
                </span>
              )}
            </div>
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
            disabled={!isFormValid}
            className={cx(
              'flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-bold shadow-sm transition-all',
              isFormValid 
                ? 'bg-gradient-accent text-white hover:scale-105 hover:shadow-md' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-ink-800 dark:text-slate-600'
            )}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {submitting ? 'Launching…' : (isAbTest ? 'Launch A/B Test' : 'Launch Broadcast')}
          </button>
        </div>
      </header>

      {/* Content Body */}
      <div className="grid flex-1 overflow-hidden lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
        
        {/* Left Form Controls */}
        <div className="overflow-y-auto p-6 lg:p-8 space-y-8 scrollbar-thin">
          <div className="max-w-4xl space-y-8">
            
            {/* Section: Campaign Identity */}
            <section className="flex gap-4 sm:gap-5">
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                <Megaphone className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-5">
                <div>
                  <h3 className="text-base font-bold text-primary-c">Campaign Identity</h3>
                  <p className="text-sm text-secondary-c mt-1">Define the campaign name and choose your experiment mode.</p>
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

                  {/* A/B Split Testing Switch Card */}
                  <div className="rounded-xl border border-purple-500/30 bg-purple-50/50 dark:bg-purple-950/20 p-4 transition-all">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white shadow-sm">
                          <Split className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-purple-900 dark:text-purple-200">A/B Split Testing</h4>
                            <span className="rounded-full bg-purple-200 dark:bg-purple-900/60 px-2 py-0.5 text-[10px] font-bold text-purple-800 dark:text-purple-300">
                              Automated Winner Dispatch
                            </span>
                          </div>
                          <p className="text-xs text-purple-700/80 dark:text-purple-300/80 mt-0.5">
                            Test 2 template variations on a sample group. Quartz auto-promotes the best performing template to the remaining audience.
                          </p>
                        </div>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={isAbTest}
                          onChange={(e) => {
                            setIsAbTest(e.target.checked);
                            if (e.target.checked) {
                              setPreviewVariant('A');
                            }
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>

                    {/* A/B Test Parameters */}
                    {isAbTest && (
                      <div className="mt-5 border-t border-purple-500/20 pt-4 space-y-5 animate-slide-up">
                        {/* Sample Size Slider & Visual Bar */}
                        <div>
                          <div className="flex items-center justify-between text-xs font-semibold text-purple-950 dark:text-purple-200 mb-2">
                            <span className="flex items-center gap-1.5">
                              <Sliders className="h-3.5 w-3.5 text-purple-600" />
                              Test Sample Audience: <strong className="text-purple-700 dark:text-purple-300">{abTestPercentage}%</strong>
                            </span>
                            <span className="text-[11px] text-purple-600 dark:text-purple-400">
                              {abCalculations.testTotal} test recipients ({abCalculations.variantA} Variant A + {abCalculations.variantB} Variant B)
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="10"
                              max="50"
                              step="5"
                              value={abTestPercentage}
                              onChange={(e) => setAbTestPercentage(Number(e.target.value))}
                              className="w-full accent-purple-600 cursor-pointer"
                            />
                            <div className="flex items-center gap-1">
                              {[10, 20, 30, 50].map((pct) => (
                                <button
                                  key={pct}
                                  type="button"
                                  onClick={() => setAbTestPercentage(pct)}
                                  className={cx(
                                    'px-2 py-0.5 rounded text-[11px] font-bold border transition-colors',
                                    abTestPercentage === pct
                                      ? 'border-purple-600 bg-purple-600 text-white'
                                      : 'border-purple-300 bg-white dark:bg-ink-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100'
                                  )}
                                >
                                  {pct}%
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Visual Audience Breakdown Bar */}
                          <div className="mt-3 flex h-3.5 w-full overflow-hidden rounded-full border border-purple-200 bg-slate-100 dark:border-purple-900/40 dark:bg-ink-900 text-[9px] font-bold text-white text-center">
                            <div
                              style={{ width: `${abTestPercentage / 2}%` }}
                              className="bg-indigo-500 flex items-center justify-center truncate"
                              title={`Variant A: ${abCalculations.variantA} recipients`}
                            >
                              A
                            </div>
                            <div
                              style={{ width: `${abTestPercentage / 2}%` }}
                              className="bg-purple-500 flex items-center justify-center truncate"
                              title={`Variant B: ${abCalculations.variantB} recipients`}
                            >
                              B
                            </div>
                            <div
                              style={{ width: `${100 - abTestPercentage}%` }}
                              className="bg-emerald-600 flex items-center justify-center truncate"
                              title={`Holdout Pool: ${abCalculations.holdout} recipients (Dispatched to Winner)`}
                            >
                              Holdout {100 - abTestPercentage}% (Winner)
                            </div>
                          </div>
                        </div>

                        {/* Winner Metric & Evaluation Window */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-semibold text-purple-950 dark:text-purple-200 block mb-2">
                              Optimization Goal (Winner Metric)
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setAbWinnerMetric('CLICK_RATE')}
                                className={cx(
                                  'flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all',
                                  abWinnerMetric === 'CLICK_RATE'
                                    ? 'border-purple-600 bg-purple-600 text-white shadow-xs'
                                    : 'border-purple-200 bg-white dark:bg-ink-800 text-slate-700 dark:text-slate-300 hover:border-purple-400'
                                )}
                              >
                                <span className="font-bold flex items-center gap-1">
                                  <Trophy className="h-3.5 w-3.5 text-amber-300" /> CTR %
                                </span>
                                <span className="text-[10px] opacity-80 mt-0.5">Click-Through</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setAbWinnerMetric('READ_RATE')}
                                className={cx(
                                  'flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all',
                                  abWinnerMetric === 'READ_RATE'
                                    ? 'border-purple-600 bg-purple-600 text-white shadow-xs'
                                    : 'border-purple-200 bg-white dark:bg-ink-800 text-slate-700 dark:text-slate-300 hover:border-purple-400'
                                )}
                              >
                                <span className="font-bold flex items-center gap-1">
                                  <Users className="h-3.5 w-3.5 text-sky-300" /> Read Rate %
                                </span>
                                <span className="text-[10px] opacity-80 mt-0.5">Opens/Attention</span>
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-purple-950 dark:text-purple-200 block mb-2">
                              Evaluation Window
                            </label>
                            <div className="grid grid-cols-4 gap-1.5">
                              {[2, 4, 8, 24].map((hours) => (
                                <button
                                  key={hours}
                                  type="button"
                                  onClick={() => setAbEvaluationHours(hours)}
                                  className={cx(
                                    'py-2 px-1 rounded-xl border text-xs font-semibold transition-all text-center',
                                    abEvaluationHours === hours
                                      ? 'border-purple-600 bg-purple-600 text-white shadow-xs'
                                      : 'border-purple-200 bg-white dark:bg-ink-800 text-slate-700 dark:text-slate-300 hover:border-purple-400'
                                  )}
                                >
                                  {hours}h
                                </button>
                              ))}
                            </div>
                            <p className="text-[10px] text-purple-700/70 dark:text-purple-300/70 mt-1 flex items-center gap-1">
                              <Clock className="h-3 w-3" /> Auto-evaluates {abEvaluationHours}h after initial sample dispatch.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Standard Template Select (When A/B test is OFF) */}
                  {!isAbTest && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-semibold text-primary-c">Select Approved Meta Template *</label>
                          <button
                            type="button"
                            onClick={handleSyncTemplates}
                            disabled={syncingTemplates}
                            title="Sync live templates from Meta & clean removed DB templates"
                            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border border-base-c text-xs font-semibold text-secondary-c hover:bg-subtle-c hover:text-primary-c transition-all disabled:opacity-50"
                          >
                            <RefreshCw className={cx('h-3 w-3', syncingTemplates && 'animate-spin text-indigo-500')} />
                            <span>{syncingTemplates ? 'Syncing…' : 'Sync Meta'}</span>
                          </button>
                        </div>
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
                  )}

                  {/* A/B Variant Selection Tabs (When A/B test is ON) */}
                  {isAbTest && (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between border-b border-base-c pb-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => { setActiveVariantTab('A'); setPreviewVariant('A'); }}
                            className={cx(
                              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all',
                              activeVariantTab === 'A'
                                ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-600/30'
                                : 'bg-subtle-c text-secondary-c hover:text-primary-c'
                            )}
                          >
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px]">A</span>
                            <span>Variant A (Control)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => { setActiveVariantTab('B'); setPreviewVariant('B'); }}
                            className={cx(
                              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all',
                              activeVariantTab === 'B'
                                ? 'bg-purple-600 text-white shadow-xs ring-2 ring-purple-600/30'
                                : 'bg-subtle-c text-secondary-c hover:text-primary-c'
                            )}
                          >
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px]">B</span>
                            <span>Variant B (Challenger)</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={handleSyncTemplates}
                          disabled={syncingTemplates}
                          title="Sync live templates from Meta"
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-base-c text-xs font-semibold text-secondary-c hover:bg-subtle-c hover:text-primary-c transition-all disabled:opacity-50"
                        >
                          <RefreshCw className={cx('h-3 w-3', syncingTemplates && 'animate-spin text-purple-500')} />
                          <span>Sync Meta</span>
                        </button>
                      </div>

                      {/* Variant A Panel */}
                      {activeVariantTab === 'A' && (
                        <div className="space-y-4 animate-slide-up">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                Variant A Meta Template *
                              </label>
                              {selectedVariantATemplate && (
                                <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                                  {selectedVariantATemplate.status || 'APPROVED'}
                                </span>
                              )}
                            </div>
                            <select
                              value={variantA.templateName || templateName}
                              onChange={(e) => {
                                const newTmpl = e.target.value;
                                setVariantA((prev) => ({ ...prev, templateName: newTmpl }));
                              }}
                              className="w-full rounded-xl border border-indigo-300 dark:border-indigo-800 bg-subtle-c px-4 py-2.5 text-sm text-primary-c focus:bg-card-c focus:ring-2 focus:ring-indigo-500/50 outline-none cursor-pointer appearance-none transition-all"
                              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236366f1'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em' }}
                            >
                              {activeTemplates.map((t: WhatsAppTemplateDto) => (
                                <option key={t.name} value={t.name}>
                                  {t.name} ({t.category} - {t.language})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Variant A Variables */}
                          {detectedVariablesVariantA.length > 0 && (
                            <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/20 p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-indigo-900 dark:text-indigo-200">Variant A Variables</label>
                                <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-100 dark:bg-indigo-900/50 px-2 py-0.5 rounded">
                                  {detectedVariablesVariantA.length} variable(s)
                                </span>
                              </div>
                              <div className="grid gap-2.5">
                                {detectedVariablesVariantA.map((v) => (
                                  <div key={v} className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 w-14 bg-white dark:bg-ink-800 border border-indigo-200 dark:border-indigo-800 py-1.5 rounded-lg text-center shrink-0">
                                      {v}
                                    </span>
                                    <input
                                      value={variantA.variableMap[v] || ''}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setVariantA((prev) => ({
                                          ...prev,
                                          variableMap: { ...prev.variableMap, [v]: val },
                                        }));
                                      }}
                                      placeholder="e.g. {{contact.name}} or Custom Value"
                                      className="w-full rounded-lg border border-base-c bg-white dark:bg-ink-800 px-3 py-1.5 text-xs text-primary-c focus:ring-1 focus:ring-indigo-500 outline-none"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Variant B Panel */}
                      {activeVariantTab === 'B' && (
                        <div className="space-y-4 animate-slide-up">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                                Variant B Meta Template *
                              </label>
                              {selectedVariantBTemplate && (
                                <span className="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                                  {selectedVariantBTemplate.status || 'APPROVED'}
                                </span>
                              )}
                            </div>
                            <select
                              value={variantB.templateName || templateName}
                              onChange={(e) => {
                                const newTmpl = e.target.value;
                                setVariantB((prev) => ({ ...prev, templateName: newTmpl }));
                              }}
                              className="w-full rounded-xl border border-purple-300 dark:border-purple-800 bg-subtle-c px-4 py-2.5 text-sm text-primary-c focus:bg-card-c focus:ring-2 focus:ring-purple-500/50 outline-none cursor-pointer appearance-none transition-all"
                              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239333ea'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em' }}
                            >
                              {activeTemplates.map((t: WhatsAppTemplateDto) => (
                                <option key={t.name} value={t.name}>
                                  {t.name} ({t.category} - {t.language})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Variant B Variables */}
                          {detectedVariablesVariantB.length > 0 && (
                            <div className="rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/30 dark:bg-purple-950/20 p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-purple-900 dark:text-purple-200">Variant B Variables</label>
                                <span className="text-[10px] font-mono font-bold text-purple-600 bg-purple-100 dark:bg-purple-900/50 px-2 py-0.5 rounded">
                                  {detectedVariablesVariantB.length} variable(s)
                                </span>
                              </div>
                              <div className="grid gap-2.5">
                                {detectedVariablesVariantB.map((v) => (
                                  <div key={v} className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400 w-14 bg-white dark:bg-ink-800 border border-purple-200 dark:border-purple-800 py-1.5 rounded-lg text-center shrink-0">
                                      {v}
                                    </span>
                                    <input
                                      value={variantB.variableMap[v] || ''}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setVariantB((prev) => ({
                                          ...prev,
                                          variableMap: { ...prev.variableMap, [v]: val },
                                        }));
                                      }}
                                      placeholder="e.g. {{contact.name}} or Custom Value"
                                      className="w-full rounded-lg border border-base-c bg-white dark:bg-ink-800 px-3 py-1.5 text-xs text-primary-c focus:ring-1 focus:ring-purple-500 outline-none"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Section: Audience */}
            <section className="flex gap-4 sm:gap-5">
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                <Users className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-primary-c">Target Audience</h3>
                    <p className="text-sm text-secondary-c mt-1">Select who should receive this broadcast.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 dark:bg-ink-800 px-3 py-1 text-xs font-bold text-primary-c">
                      Reach: ~{targetCount}
                    </span>
                    {isAbTest && (
                      <span className="rounded-full bg-purple-500/10 border border-purple-500/20 px-3 py-1 text-xs font-bold text-purple-600 dark:text-purple-400">
                        Holdout: ~{abCalculations.holdout}
                      </span>
                    )}
                  </div>
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
            <section className="flex gap-4 sm:gap-5 pb-20">
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
                <Send className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-5">
                <div>
                  <h3 className="text-base font-bold text-primary-c">Personalization & Delivery</h3>
                  <p className="text-sm text-secondary-c mt-1">Configure variable parameters and schedule message dispatch.</p>
                </div>
                
                <div className="space-y-4">
                  {/* Standard Variable Mapping (only when A/B test is OFF) */}
                  {!isAbTest && detectedVariables.length > 0 && (
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
                          scheduleType === 'IMMEDIATE' ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950/20 dark:text-primary-300" : "border-base-c hover:bg-slate-50 dark:hover:bg-ink-800"
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
                          scheduleType === 'SCHEDULED' ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950/20 dark:text-primary-300" : "border-base-c hover:bg-slate-50 dark:hover:bg-ink-800"
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
          <div className="flex items-center justify-between mb-6 self-start w-full">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-emerald-600" />
              <h4 className="text-sm font-bold text-primary-c">Live WhatsApp Preview</h4>
            </div>

            {/* Variant Switcher for Preview (When A/B Test is ON) */}
            {isAbTest && (
              <div className="flex items-center gap-1 bg-white dark:bg-ink-900 border border-base-c p-1 rounded-xl shadow-xs">
                <button
                  type="button"
                  onClick={() => setPreviewVariant('A')}
                  className={cx(
                    'px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all',
                    previewVariant === 'A'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-secondary-c hover:text-primary-c'
                  )}
                >
                  Variant A
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewVariant('B')}
                  className={cx(
                    'px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all',
                    previewVariant === 'B'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-secondary-c hover:text-primary-c'
                  )}
                >
                  Variant B
                </button>
              </div>
            )}
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
                  <div className="font-bold text-sm leading-tight flex items-center gap-1.5">
                    <span>Business Account</span>
                    {isAbTest && (
                      <span className={cx(
                        'text-[9px] font-bold px-1.5 py-0.2 rounded',
                        previewVariant === 'A' ? 'bg-indigo-500 text-white' : 'bg-purple-500 text-white'
                      )}>
                        Var {previewVariant}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-white/80 opacity-90 truncate max-w-[150px]">
                    {previewTemplate?.name || 'Meta Template'}
                  </div>
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

                    {previewTemplate?.footerText && (
                      <div className="flex items-end justify-between gap-4 px-1 pt-1 border-t border-slate-100 mt-2">
                        <p className="text-[11px] text-slate-500 truncate flex-1 pt-1">
                          {previewTemplate.footerText}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 pt-0.5 pr-1">
                      <span>13:08</span>
                      <span className="font-bold text-sky-500 text-[9px]">✓✓</span>
                    </div>
                  </div>

                  {previewTemplate?.buttons && previewTemplate.buttons.length > 0 && (
                    <div className="border-t border-slate-100 bg-slate-50/50 rounded-b-lg overflow-hidden divide-y divide-slate-100">
                      {previewTemplate.buttons.map((btn: Record<string, unknown>, idx: number) => (
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
            {isAbTest 
              ? `Currently previewing ${previewVariant === 'A' ? 'Variant A' : 'Variant B'} template and variables.`
              : 'Preview illustrates how this message appears on iOS devices.'}
          </p>
        </div>
      </div>
    </div>
  );
}
