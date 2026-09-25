import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Sparkles, CheckCircle2, Loader2, Copy, Check,
  Trash2, Edit3, ArrowLeft, RefreshCw, Send, Smartphone,
  FileText, Calendar, Layers, HelpCircle, Eye, Globe, LifeBuoy,
  Search, Filter, ShieldCheck, ChevronRight, MessageSquare, AlertCircle,
  X, CheckCheck
} from 'lucide-react';
import {
  fetchWhatsAppFlows,
  fetchFlowTemplates,
  saveFlowDraft,
  updateFlowDraft,
  publishWhatsAppFlow,
  duplicateWhatsAppFlow,
  archiveWhatsAppFlow,
  fetchFlowSubmissions,
  fetchFlowsRoutingConfig,
  saveFlowsRoutingConfig,
  fetchWebFlowsRoutingConfig,
  saveWebFlowsRoutingConfig,
  fetchMasterFields,
  syncMetaFlows,
  generateFlowWithAi,
  WhatsAppFlowItem,
  FlowTemplateItem,
  FlowFieldItem,
  FlowCategoryType,
  FlowsRoutingConfig,
  WebFlowsRoutingConfig
} from '@/lib/whatsappFlowsApi';
import { MetaFlowStudio } from './flows/MetaFlowStudio';
import { GlassCard } from '@/components/ui/primitives';
import { useWebSocket } from '@/hooks/useWebSocket';
import { cx } from '@/lib/types';
import { useNavigate } from 'react-router-dom';

export function WhatsAppFlowsPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'flows' | 'routing'>('flows');
  const [routingChannel, setRoutingChannel] = useState<'whatsapp' | 'web'>('whatsapp');
  const [flows, setFlows] = useState<WhatsAppFlowItem[]>([]);
  const [templates, setTemplates] = useState<FlowTemplateItem[]>([]);
  const [routingConfig, setRoutingConfig] = useState<FlowsRoutingConfig>({
    appointments: { enabled: true, mode: 'CHATBOT', ctaText: 'Book Doctor', promptText: 'Tap below to schedule a doctor consultation:' },
    bookings: { enabled: true, mode: 'CHATBOT', ctaText: 'Book Salon Slot', promptText: 'Tap below to reserve your salon & spa slot:' },
    leadGen: { enabled: true, mode: 'CHATBOT', ctaText: 'Get Quote', promptText: 'Please submit your requirements:' },
    feedback: { enabled: true, mode: 'CHATBOT', ctaText: 'Rate Service', promptText: 'Please share your valuable feedback:' },
  });
  const [webRoutingConfig, setWebRoutingConfig] = useState<WebFlowsRoutingConfig>({
    appointments: { enabled: true, mode: 'WEB_FLOW', ctaText: '📅 Book Appointment', promptText: 'Schedule your appointment in seconds:' },
    bookings: { enabled: true, mode: 'WEB_FLOW', ctaText: '🔖 Reserve Slot', promptText: 'Reserve your booking slot:' },
    leadGen: { enabled: true, mode: 'WEB_FLOW', ctaText: '🎯 Get a Quote', promptText: 'Submit your requirements:' },
    feedback: { enabled: true, mode: 'WEB_FLOW', ctaText: '⭐ Rate Service', promptText: 'Share your feedback:' },
    support: { enabled: true, mode: 'WEB_FLOW', ctaText: '🎫 Support Ticket', promptText: 'Contact customer support:' },
  });
  const [savingRouting, setSavingRouting] = useState(false);
  const [savingWebRouting, setSavingWebRouting] = useState(false);
  const [syncingMeta, setSyncingMeta] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Studio / Builder Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editingFlowId, setEditingFlowId] = useState<string | null>(null);
  const [flowName, setFlowName] = useState('');
  const [flowCategory, setFlowCategory] = useState<FlowCategoryType>('LEAD_GENERATION');
  const [fields, setFields] = useState<FlowFieldItem[]>([]);
  const [confirmationMessage, setConfirmationMessage] = useState('Thank you! We have received your submission.');
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);

  // Archive Confirmation Modal
  const [flowToArchive, setFlowToArchive] = useState<WhatsAppFlowItem | null>(null);

  // AI Generator Modal
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingAi, setGeneratingAi] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Listen for real-time WebSocket updates
  useWebSocket((msg: any) => {
    if (msg.type === 'FLOW_STATUS_UPDATE') {
      setFlows(prev => prev.map(f => {
        if (f.id === msg.flowId) {
          return {
            ...f,
            status: msg.status,
            metaFlowId: msg.metaFlowId,
            publishedRevision: f.publishedRevision ? {
              ...f.publishedRevision,
              metaFlowId: msg.metaFlowId
            } : f.publishedRevision
          } as WhatsAppFlowItem;
        }
        return f;
      }));

      if (msg.status === 'PUBLISHED') {
        showToast(`✅ Flow "${msg.name}" published successfully!`);
      } else if (msg.status === 'PUBLISH_FAILED') {
        showToast(`❌ Flow "${msg.name}" failed to publish: ${msg.error || 'Unknown error'}`);
      }
    }
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [flowsRes, templatesRes, routingRes, webRoutingRes] = await Promise.all([
        fetchWhatsAppFlows(),
        fetchFlowTemplates(),
        fetchFlowsRoutingConfig(),
        fetchWebFlowsRoutingConfig(),
      ]);
      if (flowsRes.data) setFlows(flowsRes.data);
      if (templatesRes.data) setTemplates(templatesRes.data);
      if (routingRes) setRoutingConfig(routingRes);
      if (webRoutingRes) setWebRoutingConfig(webRoutingRes);
    } catch (err) {
      console.error('Failed to load flows data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRouting = async () => {
    setSavingRouting(true);
    try {
      await saveFlowsRoutingConfig(routingConfig);
      showToast('WhatsApp Flow Routing saved successfully! ✅');
    } catch (err: any) {
      showToast(err.message || 'Failed to save routing configuration');
    } finally {
      setSavingRouting(false);
    }
  };

  const handleSaveWebRouting = async () => {
    setSavingWebRouting(true);
    try {
      await saveWebFlowsRoutingConfig(webRoutingConfig);
      showToast('Website Chatbot Web Flow Routing saved successfully! ✅');
    } catch (err: any) {
      showToast(err.message || 'Failed to save website routing configuration');
    } finally {
      setSavingWebRouting(false);
    }
  };

  const handleSyncMeta = async () => {
    setSyncingMeta(true);
    try {
      const res = await syncMetaFlows();
      if (res.data) {
        showToast(res.data.message || 'Flows synced with Meta! ✅');
      } else if (res.error) {
        showToast(res.error);
      }
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to sync with Meta');
    } finally {
      setSyncingMeta(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopyMetaId = (metaId: string) => {
    navigator.clipboard.writeText(metaId);
    setCopiedId(metaId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStartNewFlow = () => {
    setEditingFlowId(null);
    setFlowName('Customer Feedback Form');
    setFlowCategory('SURVEY');
    setFields([
      { name: 'full_name', label: 'Your Full Name', type: 'TEXT', required: true },
      { name: 'email', label: 'Email Address', type: 'EMAIL', required: true },
      { name: 'phone_number', label: 'Phone Number', type: 'PHONE', required: true },
      { name: 'rating', label: 'Rate Your Experience', type: 'SELECT', required: true, options: ['⭐⭐⭐⭐⭐ Excellent', '⭐⭐⭐⭐ Good', '⭐⭐⭐ Average', '⭐ Poor'] },
      { name: 'feedback_notes', label: 'Your Comments', type: 'TEXTAREA', required: false },
    ]);
    setConfirmationMessage('Thank you! We have received your valuable feedback.');
    setIsEditing(true);
  };

  const handleApplyTemplate = (tpl: FlowTemplateItem) => {
    setEditingFlowId(null);
    const cleanName = tpl.name.replace(/^[^\w\s]+\s*/, '').trim();
    setFlowName(cleanName || tpl.name);
    setFlowCategory(tpl.category);
    setFields(JSON.parse(JSON.stringify(tpl.fields)));
    setConfirmationMessage(tpl.confirmationMessage);
    setShowTemplatesModal(false);
    setIsEditing(true);
    showToast(`Template applied: ${cleanName || tpl.name}`);
  };

  const handleEditFlow = (flow: WhatsAppFlowItem) => {
    setEditingFlowId(flow.id);
    setFlowName(flow.name);
    setFlowCategory(flow.category);
    if (flow.publishedRevision?.fieldsConfigJson) {
      try {
        setFields(JSON.parse(flow.publishedRevision.fieldsConfigJson));
      } catch {
        setFields([]);
      }
      setConfirmationMessage(flow.publishedRevision.confirmationMessage || 'Thank you! We have received your submission.');
    } else {
      setFields([
        { name: 'full_name', label: 'Full Name', type: 'TEXT', required: true }
      ]);
      setConfirmationMessage('Thank you! We have received your submission.');
    }
    setIsEditing(true);
  };

  const handleLoadFromMasterFields = async (category: string) => {
    try {
      const res = await fetchMasterFields(category);
      if (res && res.data && res.data.length > 0) {
        const mappedFields: FlowFieldItem[] = res.data
          .filter(f => f.enabled !== false)
          .map(f => {
            let ft: FlowFieldItem['type'] = 'TEXT';
            const rawType = (f.fieldType || '').toUpperCase();
            if (rawType === 'EMAIL') ft = 'EMAIL';
            else if (rawType === 'PHONE') ft = 'PHONE';
            else if (rawType === 'NUMBER') ft = 'NUMBER';
            else if (rawType === 'DATE') ft = 'DATE';
            else if (rawType === 'DROPDOWN' || rawType === 'SELECT') ft = 'SELECT';
            else if (rawType === 'RADIO') ft = 'RADIO';
            else if (rawType === 'TEXTAREA') ft = 'TEXTAREA';

            return {
              name: f.key,
              label: f.label || f.key,
              type: ft,
              required: f.required !== false,
              options: f.options && f.options.length > 0 ? f.options : (ft === 'SELECT' ? ['Option 1', 'Option 2'] : undefined)
            };
          });

        if (mappedFields.length > 0) {
          setFields(mappedFields);
          showToast(`✨ Loaded ${mappedFields.length} master CRM fields for ${category}!`);
          return;
        }
      }
    } catch (e) {
      console.error('Failed to load master fields', e);
      showToast('Could not load master fields.');
    }
  };

  const handleSaveStudioDraft = async (data: {
    name: string;
    category: FlowCategoryType;
    fields: FlowFieldItem[];
    confirmationMessage: string;
    flowJson: string;
  }) => {
    if (!data.name.trim()) {
      showToast('Please enter a Flow name');
      return;
    }
    setActionLoading('draft');
    try {
      if (editingFlowId) {
        await updateFlowDraft(editingFlowId, {
          name: data.name,
          category: data.category,
          fieldsConfig: data.fields,
          confirmationMessage: data.confirmationMessage,
        });
        showToast('Flow draft updated successfully! ✅');
      } else {
        const res = await saveFlowDraft({
          name: data.name,
          category: data.category,
          fieldsConfig: data.fields,
          confirmationMessage: data.confirmationMessage,
        });
        if (res.data) setEditingFlowId(res.data.id);
        showToast('New Flow draft saved successfully! ✅');
      }
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save draft');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePublish = async (flowIdToPublish?: string) => {
    const targetId = flowIdToPublish || editingFlowId;
    if (!targetId) {
      if (!flowName.trim()) {
        showToast('Please enter a Flow name');
        return;
      }
      setActionLoading('publish');
      try {
        const draftRes = await saveFlowDraft({
          name: flowName,
          category: flowCategory,
          fieldsConfig: fields,
          confirmationMessage,
        });
        if (draftRes.data) {
          await publishWhatsAppFlow(draftRes.data.id);
          showToast('🚀 Flow queued for publishing on Meta Cloud API!');
          setIsEditing(false);
          await loadData();
        }
      } catch (err: any) {
        showToast(err.message || 'Failed to publish');
      } finally {
        setActionLoading(null);
      }
      return;
    }

    setActionLoading(targetId);
    try {
      if (isEditing) {
        await updateFlowDraft(targetId, {
          name: flowName,
          category: flowCategory,
          fieldsConfig: fields,
          confirmationMessage,
        });
      }
      await publishWhatsAppFlow(targetId);
      showToast('🚀 Flow queued for publishing on Meta Cloud API!');
      if (isEditing) setIsEditing(false);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to publish');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDuplicate = async (id: string) => {
    setActionLoading(`dup_${id}`);
    try {
      await duplicateWhatsAppFlow(id);
      showToast('Flow duplicated successfully!');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to duplicate flow');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmArchive = async () => {
    if (!flowToArchive) return;
    const id = flowToArchive.id;
    setActionLoading(`arc_${id}`);
    try {
      await archiveWhatsAppFlow(id);
      showToast('Flow archived successfully.');
      setFlowToArchive(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to archive flow');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewSubmissions = (flow: WhatsAppFlowItem) => {
    navigate(`/settings/whatsapp-flows/${flow.id}/responses`);
  };

  const handleGenerateAi = async () => {
    if (!aiPrompt.trim()) return;
    setGeneratingAi(true);
    try {
      const res = await generateFlowWithAi(aiPrompt);
      if (res.error) {
        throw new Error(res.error);
      }
      if (res.data?.draft) {
        const draft = res.data.draft;
        setFlowName(draft.name || 'AI Generated Flow');
        setFlowCategory('OTHER');
        setFields(draft.fields || []);
        setShowAiModal(false);
        setAiPrompt('');
        setIsEditing(true);
        setEditingFlowId(null);
        showToast('✨ Flow generated from AI successfully!');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to generate flow with AI');
    } finally {
      setGeneratingAi(false);
    }
  };

  // Filtered flows computation
  const filteredFlows = useMemo(() => {
    return flows.filter(flow => {
      const matchesSearch = !searchQuery.trim() ||
        flow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (flow.metaFlowId && flow.metaFlowId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        flow.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = categoryFilter === 'ALL' || flow.category === categoryFilter;
      const matchesStatus = statusFilter === 'ALL' || flow.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [flows, searchQuery, categoryFilter, statusFilter]);

  // Executive KPI stats
  const stats = useMemo(() => {
    const total = flows.length;
    const published = flows.filter(f => f.status === 'PUBLISHED').length;
    const drafts = flows.filter(f => f.status === 'DRAFT' || f.status === 'PUBLISHING').length;
    const activeRouting = (
      (routingConfig.appointments?.mode === 'NATIVE_FLOW' ? 1 : 0) +
      (routingConfig.bookings?.mode === 'NATIVE_FLOW' ? 1 : 0) +
      (routingConfig.leadGen?.mode === 'NATIVE_FLOW' ? 1 : 0) +
      (routingConfig.feedback?.mode === 'NATIVE_FLOW' ? 1 : 0) +
      (webRoutingConfig.appointments?.mode === 'WEB_FLOW' ? 1 : 0) +
      (webRoutingConfig.bookings?.mode === 'WEB_FLOW' ? 1 : 0) +
      (webRoutingConfig.leadGen?.mode === 'WEB_FLOW' ? 1 : 0) +
      (webRoutingConfig.feedback?.mode === 'WEB_FLOW' ? 1 : 0) +
      (webRoutingConfig.support?.mode === 'WEB_FLOW' ? 1 : 0)
    );
    return { total, published, drafts, activeRouting };
  }, [flows, routingConfig, webRoutingConfig]);

  const getCategoryMeta = (category: FlowCategoryType) => {
    switch (category) {
      case 'APPOINTMENT_BOOKING':
        return { label: 'Appointment', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25', icon: Calendar };
      case 'LEAD_GENERATION':
        return { label: 'Lead Gen', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25', icon: FileText };
      case 'CUSTOMER_SUPPORT':
        return { label: 'Support', color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/25', icon: HelpCircle };
      case 'SURVEY':
        return { label: 'Feedback', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25', icon: LifeBuoy };
      default:
        return { label: 'Custom', color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/25', icon: Layers };
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-card-c text-primary-c rounded-xl shadow-soft-lg border border-base-c animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-muted-c hover:text-primary-c ml-1">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* ─── MAIN DASHBOARD OR META STUDIO ─── */}
      {!isEditing ? (
        <div className="space-y-4">
          {/* Header & Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-base-c">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-primary-c leading-none">WhatsApp In-App Flows</h3>
                  <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 rounded-md">
                    Meta Cloud API v21.0
                  </span>
                </div>
                <p className="text-xs text-secondary-c mt-1">
                  Build and deploy native, multi-screen forms directly inside WhatsApp chats.
                </p>
              </div>
            </div>

            {/* Action Buttons Toolbar */}
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
              <button
                onClick={handleSyncMeta}
                disabled={syncingMeta || loading}
                className="flex items-center gap-1.5 px-3 py-1.5 surface hover:bg-subtle-c text-primary-c text-xs font-semibold rounded-lg border-base-c shadow-xs transition disabled:opacity-50"
                title="Sync existing Flows from Meta WhatsApp Business Manager"
              >
                <RefreshCw className={cx('w-3.5 h-3.5 text-emerald-600', syncingMeta && 'animate-spin')} />
                <span>{syncingMeta ? 'Syncing…' : 'Sync Meta'}</span>
              </button>

              <button
                onClick={() => setShowTemplatesModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 surface hover:bg-subtle-c text-primary-c text-xs font-semibold rounded-lg border-base-c shadow-xs transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Templates</span>
              </button>

              <button
                onClick={handleStartNewFlow}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-soft transition-transform active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Flow</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="surface p-3 rounded-xl border-base-c shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-c">Total Flows</p>
                <p className="text-lg font-extrabold text-primary-c mt-0.5">{stats.total}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-primary-500/10 text-primary-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>

            <div className="surface p-3 rounded-xl border-base-c shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-c">Live on WhatsApp</p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{stats.published}</p>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>

            <div className="surface p-3 rounded-xl border-base-c shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-c">Drafts</p>
                <p className="text-lg font-extrabold text-primary-c mt-0.5">{stats.drafts}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Edit3 className="w-4 h-4" />
              </div>
            </div>

            <div className="surface p-3 rounded-xl border-base-c shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-c">Bot Automations</p>
                <p className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">{stats.activeRouting}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Sub-Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-base-c pb-2">
            <button
              onClick={() => setActiveTab('flows')}
              className={cx(
                'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all',
                activeTab === 'flows'
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'text-secondary-c hover:text-primary-c hover:bg-subtle-c'
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Flows Directory ({flows.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('routing')}
              className={cx(
                'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all',
                activeTab === 'routing'
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'text-secondary-c hover:text-primary-c hover:bg-subtle-c'
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>⚡ Bot Automation & Routing</span>
            </button>
          </div>

          {/* TAB 1: FLOWS DIRECTORY */}
          {activeTab === 'flows' && (
            <div className="space-y-4">
              {/* Search & Filter Strip */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 text-muted-c absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search flows by name or Meta ID…"
                    className="w-full pl-8 pr-3 py-1.5 surface text-xs text-primary-c rounded-lg border-base-c focus:outline-none focus:border-primary-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-c hover:text-primary-c"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                  {(['ALL', 'PUBLISHED', 'DRAFT'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={cx(
                        'px-2.5 py-1 text-[11px] font-semibold rounded-lg transition',
                        statusFilter === st
                          ? 'surface font-bold text-primary-c border border-base-c shadow-xs'
                          : 'text-muted-c hover:text-primary-c'
                      )}
                    >
                      {st === 'ALL' ? 'All' : st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid or Empty States */}
              {loading ? (
                <div className="surface p-12 rounded-xl border-base-c text-center">
                  <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-secondary-c">Loading WhatsApp Flows from Meta API…</p>
                </div>
              ) : flows.length === 0 ? (
                <div className="surface p-10 rounded-xl border-base-c text-center max-w-lg mx-auto">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-primary-c">No WhatsApp Flows Yet</h4>
                  <p className="text-xs text-secondary-c mt-1 leading-relaxed">
                    Create native, multi-screen forms that customers can fill out seamlessly inside WhatsApp.
                  </p>
                  <div className="flex items-center justify-center gap-2.5 mt-5">
                    <button
                      onClick={() => setShowTemplatesModal(true)}
                      className="px-3.5 py-1.5 surface text-xs font-semibold text-primary-c rounded-lg border-base-c hover:bg-subtle-c shadow-xs"
                    >
                      Browse Templates
                    </button>
                    <button
                      onClick={handleStartNewFlow}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-xs"
                    >
                      Create from Scratch
                    </button>
                  </div>
                </div>
              ) : filteredFlows.length === 0 ? (
                <div className="surface p-8 rounded-xl border-base-c text-center">
                  <p className="text-xs text-muted-c">No flows match your search criteria.</p>
                  <button
                    onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); }}
                    className="mt-2 text-xs font-semibold text-primary-600 hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                /* Flow Cards Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {filteredFlows.map((flow) => {
                    const catMeta = getCategoryMeta(flow.category);
                    const CatIcon = catMeta.icon;

                    let fieldsCount = 0;
                    if (flow.publishedRevision?.fieldsConfigJson) {
                      try {
                        fieldsCount = JSON.parse(flow.publishedRevision.fieldsConfigJson).length;
                      } catch {
                        fieldsCount = 0;
                      }
                    }

                    return (
                      <div
                        key={flow.id}
                        className="surface group flex flex-col justify-between p-4 rounded-xl border-base-c shadow-xs hover:border-emerald-500/40 hover:shadow-soft transition-all"
                      >
                        <div className="space-y-3">
                          {/* Category Tag + Status Badge */}
                          <div className="flex items-center justify-between gap-2">
                            <span className={cx('inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded border', catMeta.color)}>
                              <CatIcon className="w-3 h-3" />
                              <span>{catMeta.label}</span>
                            </span>

                            {flow.status === 'PUBLISHED' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/25">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                PUBLISHED
                              </span>
                            )}
                            {flow.status === 'DRAFT' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/10 text-amber-600 border border-amber-500/25">
                                DRAFT
                              </span>
                            )}
                            {flow.status === 'PUBLISHING' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded bg-blue-500/10 text-blue-600 border border-blue-500/25">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                PUBLISHING
                              </span>
                            )}
                            {flow.status === 'PUBLISH_FAILED' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded bg-rose-500/10 text-rose-600 border border-rose-500/25">
                                FAILED
                              </span>
                            )}
                          </div>

                          {/* Flow Title */}
                          <h4 className="text-sm font-bold text-primary-c group-hover:text-emerald-600 transition truncate">
                            {flow.name}
                          </h4>

                          {/* Meta ID Row */}
                          {flow.metaFlowId ? (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center justify-between px-2.5 py-1.5 bg-subtle-c rounded-lg border border-base-c text-[11px]">
                                <span className="font-mono text-muted-c text-[10px] font-bold">Meta ID:</span>
                                <span className="font-mono font-semibold text-primary-c truncate max-w-[170px]">
                                  {flow.metaFlowId}
                                </span>
                                <button
                                  onClick={() => handleCopyMetaId(flow.metaFlowId!)}
                                  className="text-muted-c hover:text-primary-c ml-1 p-0.5"
                                  title="Copy Meta Flow ID"
                                >
                                  {copiedId === flow.metaFlowId ? (
                                    <Check className="w-3 h-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="px-2.5 py-1.5 bg-subtle-c rounded-lg border border-dashed border-base-c text-[10px] text-muted-c">
                              Meta ID: Not yet assigned
                            </div>
                          )}

                          {/* Quick Stats: Submissions & Fields */}
                          <div className="flex items-center justify-between text-[11px] pt-1 text-muted-c">
                            <button
                              onClick={() => handleViewSubmissions(flow)}
                              className="font-semibold text-primary-600 hover:underline flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View Responses</span>
                            </button>
                            {fieldsCount > 0 && <span>{fieldsCount} fields</span>}
                          </div>
                        </div>

                        {/* Card Actions Footer */}
                        <div className="mt-4 pt-2.5 border-t border-base-c flex items-center justify-between gap-1.5">
                          <button
                            onClick={() => handleEditFlow(flow)}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 surface hover:bg-subtle-c text-primary-c text-xs font-semibold rounded-lg border-base-c shadow-xs transition"
                          >
                            <Edit3 className="w-3 h-3 text-muted-c" />
                            <span>Edit in Studio</span>
                          </button>

                          <button
                            onClick={() => handleDuplicate(flow.id)}
                            disabled={actionLoading === `dup_${flow.id}`}
                            className="p-1.5 surface hover:bg-subtle-c text-muted-c hover:text-primary-c rounded-lg border-base-c shadow-xs transition"
                            title="Duplicate"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setFlowToArchive(flow)}
                            disabled={actionLoading === `arc_${flow.id}`}
                            className="p-1.5 surface hover:bg-rose-500/10 text-muted-c hover:text-rose-500 rounded-lg border-base-c shadow-xs transition"
                            title="Archive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {flow.status !== 'PUBLISHED' && (
                            <button
                              onClick={() => handlePublish(flow.id)}
                              disabled={actionLoading === flow.id}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-xs transition"
                              title="Publish to Meta WhatsApp"
                            >
                              {actionLoading === flow.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Send className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BOT AUTOMATION & ROUTING */}
          {activeTab === 'routing' && (
            <div className="space-y-4">
              {/* Channel Selector */}
              <div className="flex items-center justify-between p-3 surface rounded-xl border-base-c shadow-xs">
                <div>
                  <h4 className="text-xs font-bold text-primary-c">Interactive Flow Trigger Routing</h4>
                  <p className="text-[11px] text-muted-c">Choose whether bot topics trigger native forms or step-by-step chat prompts.</p>
                </div>
                <div className="flex items-center gap-1 bg-subtle-c p-1 rounded-lg border border-base-c">
                  <button
                    onClick={() => setRoutingChannel('whatsapp')}
                    className={cx(
                      'px-3 py-1 rounded text-xs font-bold transition',
                      routingChannel === 'whatsapp' ? 'bg-emerald-600 text-white shadow-xs' : 'text-secondary-c hover:text-primary-c'
                    )}
                  >
                    🟢 WhatsApp Bot
                  </button>
                  <button
                    onClick={() => setRoutingChannel('web')}
                    className={cx(
                      'px-3 py-1 rounded text-xs font-bold transition',
                      routingChannel === 'web' ? 'bg-indigo-600 text-white shadow-xs' : 'text-secondary-c hover:text-primary-c'
                    )}
                  >
                    🌐 Website Chatbot
                  </button>
                </div>
              </div>

              {/* WhatsApp Bot Routing Channel */}
              {routingChannel === 'whatsapp' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Appointments */}
                    <div className="surface p-4 rounded-xl border-base-c space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-primary-c">Appointments & Consultations</h5>
                            <p className="text-[10px] text-muted-c">Trigger: 'appointment', 'doctor', 'schedule'</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 p-1 bg-subtle-c rounded-lg border border-base-c">
                        <button
                          type="button"
                          onClick={() => setRoutingConfig(prev => ({ ...prev, appointments: { ...prev.appointments, mode: 'CHATBOT' } }))}
                          className={cx('py-1.5 px-2 rounded text-xs font-semibold transition', routingConfig.appointments.mode === 'CHATBOT' ? 'surface text-primary-c shadow-xs font-bold' : 'text-muted-c')}
                        >
                          💬 Chatbot
                        </button>
                        <button
                          type="button"
                          onClick={() => setRoutingConfig(prev => ({ ...prev, appointments: { ...prev.appointments, mode: 'NATIVE_FLOW' } }))}
                          className={cx('py-1.5 px-2 rounded text-xs font-semibold transition', routingConfig.appointments.mode === 'NATIVE_FLOW' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'text-muted-c')}
                        >
                          ⚡ WhatsApp Flow
                        </button>
                      </div>

                      {routingConfig.appointments.mode === 'NATIVE_FLOW' && (
                        <div className="space-y-2 pt-1">
                          <select
                            value={routingConfig.appointments.metaFlowId || ''}
                            onChange={(e) => {
                              const sel = flows.find(f => f.metaFlowId === e.target.value);
                              setRoutingConfig(prev => ({ ...prev, appointments: { ...prev.appointments, metaFlowId: e.target.value, flowId: sel?.id } }));
                            }}
                            className="w-full px-2.5 py-1.5 surface border-base-c rounded-lg text-xs text-primary-c"
                          >
                            <option value="">-- Choose Published Flow --</option>
                            {flows.filter(f => f.status === 'PUBLISHED' && f.metaFlowId).map(f => (
                              <option key={f.id} value={f.metaFlowId}>{f.name} ({f.metaFlowId})</option>
                            ))}
                          </select>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={routingConfig.appointments.ctaText || ''}
                              onChange={(e) => setRoutingConfig(prev => ({ ...prev, appointments: { ...prev.appointments, ctaText: e.target.value } }))}
                              placeholder="Button CTA Text"
                              className="px-2.5 py-1.5 surface border-base-c rounded-lg text-xs"
                            />
                            <input
                              type="text"
                              value={routingConfig.appointments.promptText || ''}
                              onChange={(e) => setRoutingConfig(prev => ({ ...prev, appointments: { ...prev.appointments, promptText: e.target.value } }))}
                              placeholder="Prompt Message"
                              className="px-2.5 py-1.5 surface border-base-c rounded-lg text-xs"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bookings */}
                    <div className="surface p-4 rounded-xl border-base-c space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-blue-500/10 text-blue-600 rounded-lg">
                            <Layers className="w-4 h-4" />
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-primary-c">Reservations & Bookings</h5>
                            <p className="text-[10px] text-muted-c">Trigger: 'booking', 'reserve', 'slot'</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 p-1 bg-subtle-c rounded-lg border border-base-c">
                        <button
                          type="button"
                          onClick={() => setRoutingConfig(prev => ({ ...prev, bookings: { ...prev.bookings, mode: 'CHATBOT' } }))}
                          className={cx('py-1.5 px-2 rounded text-xs font-semibold transition', routingConfig.bookings.mode === 'CHATBOT' ? 'surface text-primary-c shadow-xs font-bold' : 'text-muted-c')}
                        >
                          💬 Chatbot
                        </button>
                        <button
                          type="button"
                          onClick={() => setRoutingConfig(prev => ({ ...prev, bookings: { ...prev.bookings, mode: 'NATIVE_FLOW' } }))}
                          className={cx('py-1.5 px-2 rounded text-xs font-semibold transition', routingConfig.bookings.mode === 'NATIVE_FLOW' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'text-muted-c')}
                        >
                          ⚡ WhatsApp Flow
                        </button>
                      </div>

                      {routingConfig.bookings.mode === 'NATIVE_FLOW' && (
                        <div className="space-y-2 pt-1">
                          <select
                            value={routingConfig.bookings.metaFlowId || ''}
                            onChange={(e) => {
                              const sel = flows.find(f => f.metaFlowId === e.target.value);
                              setRoutingConfig(prev => ({ ...prev, bookings: { ...prev.bookings, metaFlowId: e.target.value, flowId: sel?.id } }));
                            }}
                            className="w-full px-2.5 py-1.5 surface border-base-c rounded-lg text-xs text-primary-c"
                          >
                            <option value="">-- Choose Published Flow --</option>
                            {flows.filter(f => f.status === 'PUBLISHED' && f.metaFlowId).map(f => (
                              <option key={f.id} value={f.metaFlowId}>{f.name} ({f.metaFlowId})</option>
                            ))}
                          </select>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={routingConfig.bookings.ctaText || ''}
                              onChange={(e) => setRoutingConfig(prev => ({ ...prev, bookings: { ...prev.bookings, ctaText: e.target.value } }))}
                              placeholder="Button CTA Text"
                              className="px-2.5 py-1.5 surface border-base-c rounded-lg text-xs"
                            />
                            <input
                              type="text"
                              value={routingConfig.bookings.promptText || ''}
                              onChange={(e) => setRoutingConfig(prev => ({ ...prev, bookings: { ...prev.bookings, promptText: e.target.value } }))}
                              placeholder="Prompt Message"
                              className="px-2.5 py-1.5 surface border-base-c rounded-lg text-xs"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleSaveRouting}
                      disabled={savingRouting}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-soft transition disabled:opacity-60"
                    >
                      {savingRouting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Save WhatsApp Routing</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Web Routing Channel */}
              {routingChannel === 'web' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Appointments */}
                    <div className="surface p-4 rounded-xl border-base-c space-y-3 shadow-xs">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <h5 className="text-xs font-bold text-primary-c">Website Appointments</h5>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 p-1 bg-subtle-c rounded-lg border border-base-c">
                        <button
                          type="button"
                          onClick={() => setWebRoutingConfig(prev => ({ ...prev, appointments: { ...prev.appointments, mode: 'CHATBOT' } }))}
                          className={cx('py-1.5 px-2 rounded text-xs font-semibold transition', webRoutingConfig.appointments?.mode === 'CHATBOT' ? 'surface text-primary-c shadow-xs font-bold' : 'text-muted-c')}
                        >
                          💬 Chatbot
                        </button>
                        <button
                          type="button"
                          onClick={() => setWebRoutingConfig(prev => ({ ...prev, appointments: { ...prev.appointments, mode: 'WEB_FLOW' } }))}
                          className={cx('py-1.5 px-2 rounded text-xs font-semibold transition', webRoutingConfig.appointments?.mode === 'WEB_FLOW' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'text-muted-c')}
                        >
                          ✨ Web Modal
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <input
                          type="text"
                          value={webRoutingConfig.appointments?.ctaText || ''}
                          onChange={(e) => setWebRoutingConfig(prev => ({ ...prev, appointments: { ...prev.appointments, ctaText: e.target.value } }))}
                          placeholder="Button Label"
                          className="px-2.5 py-1.5 surface border-base-c rounded-lg text-xs"
                        />
                        <input
                          type="text"
                          value={webRoutingConfig.appointments?.promptText || ''}
                          onChange={(e) => setWebRoutingConfig(prev => ({ ...prev, appointments: { ...prev.appointments, promptText: e.target.value } }))}
                          placeholder="Prompt Text"
                          className="px-2.5 py-1.5 surface border-base-c rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    {/* Bookings */}
                    <div className="surface p-4 rounded-xl border-base-c space-y-3 shadow-xs">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-500/10 text-blue-600 rounded-lg">
                          <Layers className="w-4 h-4" />
                        </div>
                        <h5 className="text-xs font-bold text-primary-c">Website Reservations</h5>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 p-1 bg-subtle-c rounded-lg border border-base-c">
                        <button
                          type="button"
                          onClick={() => setWebRoutingConfig(prev => ({ ...prev, bookings: { ...prev.bookings, mode: 'CHATBOT' } }))}
                          className={cx('py-1.5 px-2 rounded text-xs font-semibold transition', webRoutingConfig.bookings?.mode === 'CHATBOT' ? 'surface text-primary-c shadow-xs font-bold' : 'text-muted-c')}
                        >
                          💬 Chatbot
                        </button>
                        <button
                          type="button"
                          onClick={() => setWebRoutingConfig(prev => ({ ...prev, bookings: { ...prev.bookings, mode: 'WEB_FLOW' } }))}
                          className={cx('py-1.5 px-2 rounded text-xs font-semibold transition', webRoutingConfig.bookings?.mode === 'WEB_FLOW' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'text-muted-c')}
                        >
                          ✨ Web Modal
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <input
                          type="text"
                          value={webRoutingConfig.bookings?.ctaText || ''}
                          onChange={(e) => setWebRoutingConfig(prev => ({ ...prev, bookings: { ...prev.bookings, ctaText: e.target.value } }))}
                          placeholder="Button Label"
                          className="px-2.5 py-1.5 surface border-base-c rounded-lg text-xs"
                        />
                        <input
                          type="text"
                          value={webRoutingConfig.bookings?.promptText || ''}
                          onChange={(e) => setWebRoutingConfig(prev => ({ ...prev, bookings: { ...prev.bookings, promptText: e.target.value } }))}
                          placeholder="Prompt Text"
                          className="px-2.5 py-1.5 surface border-base-c rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleSaveWebRouting}
                      disabled={savingWebRouting}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-soft transition disabled:opacity-60"
                    >
                      {savingWebRouting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Save Website Routing</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ─── ENTERPRISE META FLOW STUDIO (EDITING MODE) ─── */
        <MetaFlowStudio
          flowId={editingFlowId}
          initialName={flowName}
          initialCategory={flowCategory}
          initialFields={fields}
          initialConfirmationMessage={confirmationMessage}
          onSaveDraft={handleSaveStudioDraft}
          onPublish={handlePublish}
          onBack={() => setIsEditing(false)}
          onLoadMasterFields={handleLoadFromMasterFields}
          onOpenAiModal={() => setShowAiModal(true)}
          actionLoading={actionLoading}
          showToast={showToast}
        />
      )}

      {/* ─── TEMPLATES MODAL ─── */}
      {showTemplatesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl surface rounded-xl border-base-c shadow-soft-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-base-c pb-3">
              <h4 className="text-sm font-bold text-primary-c flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" /> WhatsApp Flow Templates
              </h4>
              <button onClick={() => setShowTemplatesModal(false)} className="text-muted-c hover:text-primary-c">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
              {templates.map((tpl) => (
                <div key={tpl.id} className="p-3 bg-subtle-c rounded-lg border border-base-c flex flex-col justify-between space-y-2">
                  <div>
                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-500/10 text-emerald-600">
                      {tpl.category.replace('_', ' ')}
                    </span>
                    <h5 className="text-xs font-bold text-primary-c mt-1.5">{tpl.name}</h5>
                    <p className="text-[11px] text-muted-c mt-0.5">{tpl.description}</p>
                  </div>
                  <button
                    onClick={() => handleApplyTemplate(tpl)}
                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded shadow-xs"
                  >
                    Use Template
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── ARCHIVE MODAL ─── */}
      {flowToArchive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm surface rounded-xl border-base-c shadow-soft-lg p-5 space-y-3">
            <div className="flex items-center gap-2 text-rose-600">
              <Trash2 className="w-5 h-5" />
              <h4 className="text-sm font-bold text-primary-c">Archive Flow</h4>
            </div>
            <p className="text-xs text-secondary-c">
              Archive <strong className="text-primary-c">"{flowToArchive.name}"</strong>? It will stop receiving new submissions.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-base-c">
              <button
                type="button"
                onClick={() => setFlowToArchive(null)}
                className="px-3 py-1.5 surface text-xs font-semibold text-secondary-c rounded-lg border-base-c"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmArchive}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow-xs"
              >
                Archive Flow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── AI GENERATOR MODAL ─── */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-card-c rounded-2xl border border-base-c shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-base-c pb-3">
              <h4 className="text-sm font-bold text-primary-c flex items-center gap-2">
                <span className="text-lg">✨</span> Generate WhatsApp Flow with AI
              </h4>
              <button onClick={() => setShowAiModal(false)} className="text-muted-c hover:text-primary-c">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-secondary-c leading-relaxed">
                Describe the flow you want to create. The AI will automatically structure the screens, fields, validation, and layout.
              </p>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. Create a 2-step patient consultation booking form asking for patient name, symptoms, appointment date, and time slot preference..."
                className="w-full h-32 p-3 text-sm surface border-base-c text-primary-c rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                disabled={generatingAi}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-base-c">
              <button
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 text-xs font-semibold text-secondary-c hover:text-primary-c transition"
                disabled={generatingAi}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateAi}
                disabled={generatingAi || !aiPrompt.trim()}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-2"
              >
                {generatingAi ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <span>Generate Flow</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
