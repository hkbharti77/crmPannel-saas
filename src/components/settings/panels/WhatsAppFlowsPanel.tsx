import { useState, useEffect } from 'react';
import {
  Plus, Sparkles, CheckCircle2, Loader2, Copy, Check,
  Trash2, Edit3, ArrowLeft, RefreshCw, Send, Smartphone,
  FileText, Calendar, Layers, HelpCircle, Eye, Globe, LifeBuoy
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
  WhatsAppFlowItem,
  FlowTemplateItem,
  FlowFieldItem,
  FlowCategoryType,
  FlowsRoutingConfig,
  WebFlowsRoutingConfig
} from '@/lib/whatsappFlowsApi';

export function WhatsAppFlowsPanel() {
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

  // Builder Mode
  const [isEditing, setIsEditing] = useState(false);
  const [editingFlowId, setEditingFlowId] = useState<string | null>(null);
  const [flowName, setFlowName] = useState('');
  const [flowCategory, setFlowCategory] = useState<FlowCategoryType>('LEAD_GENERATION');
  const [fields, setFields] = useState<FlowFieldItem[]>([]);
  const [confirmationMessage, setConfirmationMessage] = useState('Thank you! We have received your submission.');
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);

  // Submissions Modal
  const [selectedFlowForSubmissions, setSelectedFlowForSubmissions] = useState<WhatsAppFlowItem | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Archive Confirmation Modal
  const [flowToArchive, setFlowToArchive] = useState<WhatsAppFlowItem | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Auto-poll flows every 2.5 seconds while any flow is in PUBLISHING status
  useEffect(() => {
    const hasPublishing = flows.some((f) => f.status === 'PUBLISHING');
    if (!hasPublishing) return;

    const interval = setInterval(async () => {
      try {
        const flowsRes = await fetchWhatsAppFlows();
        if (flowsRes.data) {
          setFlows(flowsRes.data);
        }
      } catch (e) {
        console.error('Polling flows failed:', e);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [flows]);

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
    setFlowName('My WhatsApp Form');
    setFlowCategory('LEAD_GENERATION');
    setFields([
      { name: 'full_name', label: 'Your Full Name', type: 'TEXT', required: true },
      { name: 'email', label: 'Email Address', type: 'EMAIL', required: true },
      { name: 'phone_number', label: 'Phone Number', type: 'PHONE', required: true },
    ]);
    setConfirmationMessage('Thank you! We have received your submission.');
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
    showToast(`Template applied: ${cleanName || tpl.name}. You can customize fields and name below.`);
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

  // Pre-configured master CRM fields directly aligned with master-fields.json
  const CRM_MASTER_FIELDS: { key: string; label: string; type: FlowFieldItem['type']; options?: string[]; required?: boolean; category: string }[] = [
    { key: 'name', label: 'Full Name', type: 'TEXT', required: true, category: 'Basic' },
    { key: 'phone', label: 'Contact Phone Number', type: 'PHONE', required: true, category: 'Basic' },
    { key: 'email', label: 'Email Address', type: 'EMAIL', required: false, category: 'Basic' },
    { key: 'service_category', label: 'Service Category / Treatment', type: 'SELECT', required: true, options: ['Consultation', 'Installation/Setup', 'Repair/Maintenance', 'Other'], category: 'Details' },
    { key: 'preferred_date', label: 'Preferred Date', type: 'DATE', required: true, category: 'Scheduling' },
    { key: 'time_slot', label: 'Preferred Time Slot', type: 'SELECT', required: true, options: ['Morning (9am–12pm)', 'Afternoon (12–4pm)', 'Evening (4pm–8pm)'], category: 'Scheduling' },
    { key: 'budget', label: 'Estimated Budget', type: 'SELECT', required: false, options: ['Under ₹50,000', '₹50,000 - ₹2,00,000', '₹2,00,000 - ₹10,00,000', '₹10,00,000+'], category: 'Qualification' },
    { key: 'city', label: 'City / Location', type: 'TEXT', required: false, category: 'Location' },
    { key: 'address', label: 'Full Address', type: 'TEXTAREA', required: false, category: 'Location' },
    { key: 'pincode', label: 'Pincode / Zip Code', type: 'NUMBER', required: false, category: 'Location' },
    { key: 'urgency', label: 'Requirement Urgency', type: 'SELECT', required: false, options: ['Immediate', 'Within a week', 'Within a month', 'Just browsing'], category: 'Qualification' },
    { key: 'source', label: 'How did you hear about us?', type: 'SELECT', required: false, options: ['Google/Search', 'Social Media', 'Friend/Referral', 'Advertisement'], category: 'Marketing' },
    { key: 'specific_requirement', label: 'Specific Requirement / Notes', type: 'TEXTAREA', required: false, category: 'Details' },
  ];

  const [loadingMasterFields, setLoadingMasterFields] = useState(false);

  const handleLoadFromMasterFields = async (category: string) => {
    setLoadingMasterFields(true);
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
      // Fallback to pre-configured master fields
      const defaults = CRM_MASTER_FIELDS.slice(0, 5).map(f => ({
        name: f.key,
        label: f.label,
        type: f.type,
        required: f.required ?? true,
        options: f.options
      }));
      setFields(defaults);
      showToast('Loaded default CRM master fields.');
    } catch (e) {
      console.error('Failed to load master fields', e);
      showToast('Could not load master fields.');
    } finally {
      setLoadingMasterFields(false);
    }
  };

  const handleAddMasterField = (masterField: typeof CRM_MASTER_FIELDS[0]) => {
    if (fields.some(f => f.name === masterField.key)) {
      showToast(`Field "${masterField.label}" is already added.`);
      return;
    }
    const newField: FlowFieldItem = {
      name: masterField.key,
      label: masterField.label,
      type: masterField.type,
      required: masterField.required ?? true,
      options: masterField.options ? [...masterField.options] : undefined,
    };
    setFields([...fields, newField]);
    showToast(`Added CRM Master Field: ${masterField.label}`);
  };

  const handleAddField = (type: FlowFieldItem['type']) => {
    const id = Date.now().toString().slice(-4);
    const newField: FlowFieldItem = {
      name: `field_${id}`,
      label: `New ${type.charAt(0) + type.slice(1).toLowerCase()} Field`,
      type,
      required: true,
      options: (type === 'SELECT' || type === 'RADIO') ? ['Option 1', 'Option 2', 'Option 3'] : undefined,
    };
    setFields([...fields, newField]);
  };

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, idx) => idx !== index));
  };

  const handleFieldChange = (index: number, key: keyof FlowFieldItem, value: any) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], [key]: value };
    setFields(updated);
  };

  const handleSaveDraft = async () => {
    if (!flowName.trim()) {
      showToast('Please enter a Flow name');
      return;
    }
    setActionLoading('draft');
    try {
      if (editingFlowId) {
        await updateFlowDraft(editingFlowId, {
          name: flowName,
          category: flowCategory,
          fieldsConfig: fields,
          confirmationMessage,
        });
        showToast('Flow draft updated successfully!');
      } else {
        const res = await saveFlowDraft({
          name: flowName,
          category: flowCategory,
          fieldsConfig: fields,
          confirmationMessage,
        });
        if (res.data) setEditingFlowId(res.data.id);
        showToast('New Flow draft saved successfully!');
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
      // Save first
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
          showToast('🚀 Flow queued for publishing on Meta!');
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
      showToast('🚀 Flow queued for publishing on Meta!');
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

  const handleOpenSubmissions = async (flow: WhatsAppFlowItem) => {
    setSelectedFlowForSubmissions(flow);
    setLoadingSubmissions(true);
    try {
      const res = await fetchFlowSubmissions(flow.id);
      if (res.data) setSubmissions(res.data);
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Main Flows Dashboard */}
      {!isEditing ? (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-50/80 via-white to-indigo-50/80 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 rounded-full">
                  Meta Native Engine
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Graph API v21.0</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">WhatsApp Flows (In-App Forms)</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
                Build native, full-screen forms that open directly inside WhatsApp. Capture leads, appointments, and feedback with 0 external websites.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSyncMeta}
                disabled={syncingMeta || loading}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition shadow-sm"
                title="Import and sync Flows directly from Meta WhatsApp Manager"
              >
                <RefreshCw className={`w-4 h-4 text-emerald-600 dark:text-emerald-400 ${syncingMeta ? 'animate-spin' : ''}`} />
                {syncingMeta ? 'Syncing...' : 'Sync from Meta'}
              </button>
              <button
                onClick={loadData}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition shadow-sm"
                title="Refresh Flows"
              >
                <RefreshCw className={`w-4 h-4 text-slate-500 dark:text-slate-300 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => setShowTemplatesModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition shadow-sm"
              >
                <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                Templates
              </button>
              <button
                onClick={handleStartNewFlow}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-950/20 transition"
              >
                <Plus className="w-4 h-4" />
                Create Flow
              </button>
            </div>
          </div>

          {/* Sub-Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <button
              onClick={() => setActiveTab('flows')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeTab === 'flows'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`}
            >
              <Layers className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              My Published Flows ({flows.length})
            </button>

            <button
              onClick={() => setActiveTab('routing')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeTab === 'routing'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              ⚡ Bot Automation & Flow Routing
            </button>
          </div>

          {/* TAB 1: FLOWS GRID */}
          {activeTab === 'flows' && (
            <>
              {loading ? (
                <div className="flex flex-col items-center justify-center p-16 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">Loading WhatsApp Flows...</p>
                </div>
              ) : flows.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                    <Layers className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No WhatsApp Flows Created Yet</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                    Create appointment booking, lead generation, or feedback forms that customers can fill out seamlessly inside WhatsApp.
                  </p>
                  <div className="flex items-center justify-center gap-3 mt-6">
                    <button
                      onClick={() => setShowTemplatesModal(true)}
                      className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 transition shadow-sm"
                    >
                      Browse Templates
                    </button>
                    <button
                      onClick={handleStartNewFlow}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-sm font-medium text-white rounded-xl shadow transition"
                    >
                      Create from Scratch
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
              {flows.map((flow) => (
                <div
                  key={flow.id}
                  className="group flex flex-col justify-between p-5 bg-white dark:bg-slate-900/90 hover:bg-slate-50/50 dark:hover:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700/80 shadow-sm hover:shadow-md transition duration-200"
                >
                  <div className="space-y-3.5">
                    {/* Top Row: Category Badge + Status Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 shrink-0">
                        {flow.category.replace('_', ' ')}
                      </span>

                      {/* Status Badge */}
                      {flow.status === 'PUBLISHED' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold tracking-wide rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
                          PUBLISHED
                        </span>
                      )}
                      {flow.status === 'DRAFT' && (
                        <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-bold tracking-wide rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 shrink-0">
                          DRAFT
                        </span>
                      )}
                      {flow.status === 'PUBLISHING' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold tracking-wide rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 shrink-0">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          PUBLISHING...
                        </span>
                      )}
                      {flow.status === 'PUBLISH_FAILED' && (
                        <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-bold tracking-wide rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 shrink-0">
                          FAILED
                        </span>
                      )}
                    </div>

                    {/* Flow Title (Consistent 2-line height) */}
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition leading-snug min-h-[2.75rem] flex items-center">
                      {flow.name}
                    </h3>

                    {/* Meta Flow ID Card */}
                    {flow.metaFlowId && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800/90 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Meta Flow ID</span>
                          <button
                            onClick={() => handleCopyMetaId(flow.metaFlowId!)}
                            className="flex items-center gap-1 px-2 py-0.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md text-[11px] font-medium transition border border-slate-200 dark:border-slate-700/60 shadow-sm"
                            title="Copy Meta Flow ID"
                          >
                            {copiedId === flow.metaFlowId ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="text-xs text-slate-800 dark:text-slate-200 font-mono font-semibold tracking-wide break-all">
                          {flow.metaFlowId}
                        </div>
                      </div>
                    )}

                    {flow.lastSyncError && (
                      <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/40">
                        ⚠️ {flow.lastSyncError}
                      </p>
                    )}
                  </div>

                  {/* Bottom Actions */}
                  <div className="mt-5 pt-3.5 border-t border-slate-200 dark:border-slate-800/80">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <button
                          onClick={() => handleEditFlow(flow)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700/80 transition"
                          title="Edit Form"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                          <span className="truncate">Edit</span>
                        </button>

                        <button
                          onClick={() => handleOpenSubmissions(flow)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700/80 transition"
                          title="View Responses"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                          <span className="truncate">Responses</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleDuplicate(flow.id)}
                          disabled={actionLoading === `dup_${flow.id}`}
                          className="p-2 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700/50 transition"
                          title="Duplicate Flow"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setFlowToArchive(flow)}
                          disabled={actionLoading === `arc_${flow.id}`}
                          className="p-2 bg-slate-50 dark:bg-slate-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl border border-slate-200 dark:border-slate-700/50 transition"
                          title="Delete / Archive Flow"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {flow.status !== 'PUBLISHED' && (
                      <button
                        onClick={() => handlePublish(flow.id)}
                        disabled={actionLoading === flow.id}
                        className="w-full mt-2.5 flex items-center justify-center gap-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition"
                      >
                        {actionLoading === flow.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        Publish Flow
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          </>
          )}

          {/* TAB 2: ENTERPRISE AUTOMATION & FLOW ROUTING */}
          {activeTab === 'routing' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Channel Selector Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl border border-slate-800 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-500/30">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Dual-Channel Bot Flow Automation</h4>
                    <p className="text-xs text-indigo-200/80 mt-0.5">
                      Configure interactive flow and chatbot experiences for WhatsApp and your Website Chat Widget.
                    </p>
                  </div>
                </div>

                {/* Channel Switcher */}
                <div className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setRoutingChannel('whatsapp')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
                      routingChannel === 'whatsapp'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    🟢 WhatsApp Bot
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoutingChannel('web')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
                      routingChannel === 'web'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    🌐 Website Chatbot
                  </button>
                </div>
              </div>

              {/* ─────────────────────────────────────────────────────────────
                  CHANNEL 1: WHATSAPP BOT ROUTING
                  ───────────────────────────────────────────────────────────── */}
              {routingChannel === 'whatsapp' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-900 dark:text-emerald-200">
                    💡 <strong>WhatsApp Routing Engine:</strong> Switch between <strong className="underline">Native WhatsApp Flow</strong> (Meta In-App Form) and <strong className="underline">Step-by-Step Chatbot</strong> for incoming WhatsApp messages.
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 1. APPOINTMENTS */}
                    <div className="p-5 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                      <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                        <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Appointments & Consultations</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">Triggered by 'appointment', 'consultation', 'doctor', 'schedule'</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Processing Mode</label>
                        <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => setRoutingConfig(prev => ({ ...prev, appointments: { ...prev.appointments, mode: 'CHATBOT' } }))}
                            className={`py-2 px-3 rounded-lg text-xs font-semibold transition ${
                              routingConfig.appointments.mode === 'CHATBOT'
                                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-transparent shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                          >
                            💬 Step-by-Step Chatbot
                          </button>
                          <button
                            type="button"
                            onClick={() => setRoutingConfig(prev => ({ ...prev, appointments: { ...prev.appointments, mode: 'NATIVE_FLOW' } }))}
                            className={`py-2 px-3 rounded-lg text-xs font-semibold transition ${
                              routingConfig.appointments.mode === 'NATIVE_FLOW'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                          >
                            ⚡ Native WhatsApp Flow
                          </button>
                        </div>
                      </div>

                      {routingConfig.appointments.mode === 'NATIVE_FLOW' && (
                        <div className="space-y-3 pt-2 animate-in fade-in duration-150">
                          <div>
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Select Published Flow</label>
                            <select
                              value={routingConfig.appointments.metaFlowId || ''}
                              onChange={(e) => {
                                const selected = flows.find(f => f.metaFlowId === e.target.value);
                                setRoutingConfig(prev => ({
                                  ...prev,
                                  appointments: {
                                    ...prev.appointments,
                                    metaFlowId: e.target.value,
                                    flowId: selected?.id
                                  }
                                }));
                              }}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium focus:ring-1 focus:ring-emerald-500"
                            >
                              <option value="">-- Choose a Published Flow --</option>
                              {flows.filter(f => f.status === 'PUBLISHED' && f.metaFlowId).map(f => (
                                <option key={f.id} value={f.metaFlowId}>
                                  {f.name} (Meta ID: {f.metaFlowId})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Button CTA Text</label>
                              <input
                                type="text"
                                value={routingConfig.appointments.ctaText || ''}
                                onChange={(e) => setRoutingConfig(prev => ({ ...prev, appointments: { ...prev.appointments, ctaText: e.target.value } }))}
                                placeholder="e.g. Book Appointment"
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Prompt Message</label>
                              <input
                                type="text"
                                value={routingConfig.appointments.promptText || ''}
                                onChange={(e) => setRoutingConfig(prev => ({ ...prev, appointments: { ...prev.appointments, promptText: e.target.value } }))}
                                placeholder="e.g. Tap below to book:"
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 2. BOOKINGS */}
                    <div className="p-5 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                      <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                        <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-500/20">
                          <Layers className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Reservations & Bookings</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">Triggered by 'booking', 'reserve', 'slot', 'table', 'service'</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Processing Mode</label>
                        <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => setRoutingConfig(prev => ({ ...prev, bookings: { ...prev.bookings, mode: 'CHATBOT' } }))}
                            className={`py-2 px-3 rounded-lg text-xs font-semibold transition ${
                              routingConfig.bookings.mode === 'CHATBOT'
                                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-transparent shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                          >
                            💬 Step-by-Step Chatbot
                          </button>
                          <button
                            type="button"
                            onClick={() => setRoutingConfig(prev => ({ ...prev, bookings: { ...prev.bookings, mode: 'NATIVE_FLOW' } }))}
                            className={`py-2 px-3 rounded-lg text-xs font-semibold transition ${
                              routingConfig.bookings.mode === 'NATIVE_FLOW'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                          >
                            ⚡ Native WhatsApp Flow
                          </button>
                        </div>
                      </div>

                      {routingConfig.bookings.mode === 'NATIVE_FLOW' && (
                        <div className="space-y-3 pt-2 animate-in fade-in duration-150">
                          <div>
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Select Published Flow</label>
                            <select
                              value={routingConfig.bookings.metaFlowId || ''}
                              onChange={(e) => {
                                const selected = flows.find(f => f.metaFlowId === e.target.value);
                                setRoutingConfig(prev => ({
                                  ...prev,
                                  bookings: {
                                    ...prev.bookings,
                                    metaFlowId: e.target.value,
                                    flowId: selected?.id
                                  }
                                }));
                              }}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium focus:ring-1 focus:ring-emerald-500"
                            >
                              <option value="">-- Choose a Published Flow --</option>
                              {flows.filter(f => f.status === 'PUBLISHED' && f.metaFlowId).map(f => (
                                <option key={f.id} value={f.metaFlowId}>
                                  {f.name} (Meta ID: {f.metaFlowId})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Button CTA Text</label>
                              <input
                                type="text"
                                value={routingConfig.bookings.ctaText || ''}
                                onChange={(e) => setRoutingConfig(prev => ({ ...prev, bookings: { ...prev.bookings, ctaText: e.target.value } }))}
                                placeholder="e.g. Reserve Slot"
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Prompt Message</label>
                              <input
                                type="text"
                                value={routingConfig.bookings.promptText || ''}
                                onChange={(e) => setRoutingConfig(prev => ({ ...prev, bookings: { ...prev.bookings, promptText: e.target.value } }))}
                                placeholder="e.g. Tap below to reserve:"
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 3. SALES LEADS */}
                    <div className="p-5 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                      <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                        <div className="p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/20">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Sales Leads & Inquiries</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">Triggered by 'quote', 'pricing', 'inquiry', 'contact'</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Processing Mode</label>
                        <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => setRoutingConfig(prev => ({ ...prev, leadGen: { ...prev.leadGen, mode: 'CHATBOT' } }))}
                            className={`py-2 px-3 rounded-lg text-xs font-semibold transition ${
                              routingConfig.leadGen.mode === 'CHATBOT'
                                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-transparent shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                          >
                            💬 Step-by-Step Chatbot
                          </button>
                          <button
                            type="button"
                            onClick={() => setRoutingConfig(prev => ({ ...prev, leadGen: { ...prev.leadGen, mode: 'NATIVE_FLOW' } }))}
                            className={`py-2 px-3 rounded-lg text-xs font-semibold transition ${
                              routingConfig.leadGen.mode === 'NATIVE_FLOW'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                          >
                            ⚡ Native WhatsApp Flow
                          </button>
                        </div>
                      </div>

                      {routingConfig.leadGen.mode === 'NATIVE_FLOW' && (
                        <div className="space-y-3 pt-2 animate-in fade-in duration-150">
                          <div>
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Select Published Flow</label>
                            <select
                              value={routingConfig.leadGen.metaFlowId || ''}
                              onChange={(e) => {
                                const selected = flows.find(f => f.metaFlowId === e.target.value);
                                setRoutingConfig(prev => ({
                                  ...prev,
                                  leadGen: {
                                    ...prev.leadGen,
                                    metaFlowId: e.target.value,
                                    flowId: selected?.id
                                  }
                                }));
                              }}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium focus:ring-1 focus:ring-emerald-500"
                            >
                              <option value="">-- Choose a Published Flow --</option>
                              {flows.filter(f => f.status === 'PUBLISHED' && f.metaFlowId).map(f => (
                                <option key={f.id} value={f.metaFlowId}>
                                  {f.name} (Meta ID: {f.metaFlowId})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Button CTA Text</label>
                              <input
                                type="text"
                                value={routingConfig.leadGen.ctaText || ''}
                                onChange={(e) => setRoutingConfig(prev => ({ ...prev, leadGen: { ...prev.leadGen, ctaText: e.target.value } }))}
                                placeholder="e.g. Get a Quote"
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Prompt Message</label>
                              <input
                                type="text"
                                value={routingConfig.leadGen.promptText || ''}
                                onChange={(e) => setRoutingConfig(prev => ({ ...prev, leadGen: { ...prev.leadGen, promptText: e.target.value } }))}
                                placeholder="e.g. Please fill your requirements:"
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 4. FEEDBACK */}
                    <div className="p-5 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                      <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                        <div className="p-2.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-500/20">
                          <HelpCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Customer Feedback & Surveys</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">Triggered by 'feedback', 'review', 'rating', 'survey'</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Processing Mode</label>
                        <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => setRoutingConfig(prev => ({ ...prev, feedback: { ...prev.feedback, mode: 'CHATBOT' } }))}
                            className={`py-2 px-3 rounded-lg text-xs font-semibold transition ${
                              routingConfig.feedback.mode === 'CHATBOT'
                                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-transparent shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                          >
                            💬 Step-by-Step Chatbot
                          </button>
                          <button
                            type="button"
                            onClick={() => setRoutingConfig(prev => ({ ...prev, feedback: { ...prev.feedback, mode: 'NATIVE_FLOW' } }))}
                            className={`py-2 px-3 rounded-lg text-xs font-semibold transition ${
                              routingConfig.feedback.mode === 'NATIVE_FLOW'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                          >
                            ⚡ Native WhatsApp Flow
                          </button>
                        </div>
                      </div>

                      {routingConfig.feedback.mode === 'NATIVE_FLOW' && (
                        <div className="space-y-3 pt-2 animate-in fade-in duration-150">
                          <div>
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Select Published Flow</label>
                            <select
                              value={routingConfig.feedback.metaFlowId || ''}
                              onChange={(e) => {
                                const selected = flows.find(f => f.metaFlowId === e.target.value);
                                setRoutingConfig(prev => ({
                                  ...prev,
                                  feedback: {
                                    ...prev.feedback,
                                    metaFlowId: e.target.value,
                                    flowId: selected?.id
                                  }
                                }));
                              }}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium focus:ring-1 focus:ring-emerald-500"
                            >
                              <option value="">-- Choose a Published Flow --</option>
                              {flows.filter(f => f.status === 'PUBLISHED' && f.metaFlowId).map(f => (
                                <option key={f.id} value={f.metaFlowId}>
                                  {f.name} (Meta ID: {f.metaFlowId})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Button CTA Text</label>
                              <input
                                type="text"
                                value={routingConfig.feedback.ctaText || ''}
                                onChange={(e) => setRoutingConfig(prev => ({ ...prev, feedback: { ...prev.feedback, ctaText: e.target.value } }))}
                                placeholder="e.g. Give Feedback"
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Prompt Message</label>
                              <input
                                type="text"
                                value={routingConfig.feedback.promptText || ''}
                                onChange={(e) => setRoutingConfig(prev => ({ ...prev, feedback: { ...prev.feedback, promptText: e.target.value } }))}
                                placeholder="e.g. How was your experience?"
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* WhatsApp Save Bar */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <button
                      onClick={handleSaveRouting}
                      disabled={savingRouting}
                      className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-950/20 transition"
                    >
                      {savingRouting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving WhatsApp Routing...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Save WhatsApp Flow Routing
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  CHANNEL 2: WEBSITE CHATBOT "WEB FLOW" ROUTING
                  ───────────────────────────────────────────────────────────── */}
              {routingChannel === 'web' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="p-4 bg-indigo-50/80 dark:bg-indigo-950/20 rounded-xl border border-indigo-200 dark:border-indigo-800/40 text-xs text-indigo-900 dark:text-indigo-200">
                    ✨ <strong>Website Chatbot Web Flow Engine:</strong> Choose whether the web widget asks questions <strong className="underline">Step-by-Step in Chat</strong> or opens the <strong className="underline">Interactive In-Chat Form Modal (Web Flow)</strong> with 1-to-1 WhatsApp parity.
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 1. WEB APPOINTMENTS */}
                    <div className="p-5 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                      <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                        <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Appointments & Consultations</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">Doctor, salon, clinic, and consultant scheduling</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Widget Processing Mode</label>
                        <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => setWebRoutingConfig(prev => ({ ...prev, appointments: { ...prev.appointments, mode: 'CHATBOT' } }))}
                            className={`py-2 px-3 rounded-lg text-xs font-semibold transition ${
                              webRoutingConfig.appointments?.mode === 'CHATBOT'
                                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-transparent shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                          >
                            💬 Step-by-Step Chatbot
                          </button>
                          <button
                            type="button"
                            onClick={() => setWebRoutingConfig(prev => ({ ...prev, appointments: { ...prev.appointments, mode: 'WEB_FLOW' } }))}
                            className={`py-2 px-3 rounded-lg text-xs font-semibold transition ${
                              webRoutingConfig.appointments?.mode === 'WEB_FLOW'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                          >
                            ✨ Interactive Web Flow Modal
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Button Label</label>
                          <input
                            type="text"
                            value={webRoutingConfig.appointments?.ctaText || ''}
                            onChange={(e) => setWebRoutingConfig(prev => ({ ...prev, appointments: { ...prev.appointments, ctaText: e.target.value } }))}
                            placeholder="e.g. 📅 Book Appointment"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">CTA Description</label>
                          <input
                            type="text"
                            value={webRoutingConfig.appointments?.promptText || ''}
                            onChange={(e) => setWebRoutingConfig(prev => ({ ...prev, appointments: { ...prev.appointments, promptText: e.target.value } }))}
                            placeholder="e.g. Pick your doctor & slot:"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 2. WEB BOOKINGS */}
                    <div className="p-5 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                      <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                        <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-500/20">
                          <Layers className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Reservations & Bookings</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">Events, spa, photography, classes, and table reservations</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Widget Processing Mode</label>
                        <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => setWebRoutingConfig(prev => ({ ...prev, bookings: { ...prev.bookings, mode: 'CHATBOT' } }))}
                            className={`py-2 px-3 rounded-lg text-xs font-semibold transition ${
                              webRoutingConfig.bookings?.mode === 'CHATBOT'
                                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-transparent shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                          >
                            💬 Step-by-Step Chatbot
                          </button>
                          <button
                            type="button"
                            onClick={() => setWebRoutingConfig(prev => ({ ...prev, bookings: { ...prev.bookings, mode: 'WEB_FLOW' } }))}
                            className={`py-2 px-3 rounded-lg text-xs font-semibold transition ${
                              webRoutingConfig.bookings?.mode === 'WEB_FLOW'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                          >
                            ✨ Interactive Web Flow Modal
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Button Label</label>
                          <input
                            type="text"
                            value={webRoutingConfig.bookings?.ctaText || ''}
                            onChange={(e) => setWebRoutingConfig(prev => ({ ...prev, bookings: { ...prev.bookings, ctaText: e.target.value } }))}
                            placeholder="e.g. 🔖 Reserve Slot"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">CTA Description</label>
                          <input
                            type="text"
                            value={webRoutingConfig.bookings?.promptText || ''}
                            onChange={(e) => setWebRoutingConfig(prev => ({ ...prev, bookings: { ...prev.bookings, promptText: e.target.value } }))}
                            placeholder="e.g. Reserve your package slot:"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 3. WEB LEADS */}
                    <div className="p-5 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                      <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                        <div className="p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/20">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Sales Leads & Quotes</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">Custom quotes, requirement inquiries, and catalog enquiries</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Widget Processing Mode</label>
                        <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => setWebRoutingConfig(prev => ({ ...prev, leadGen: { ...prev.leadGen, mode: 'CHATBOT' } }))}
                            className={`py-2 px-3 rounded-lg text-xs font-semibold transition ${
                              webRoutingConfig.leadGen?.mode === 'CHATBOT'
                                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-transparent shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                          >
                            💬 Step-by-Step Chatbot
                          </button>
                          <button
                            type="button"
                            onClick={() => setWebRoutingConfig(prev => ({ ...prev, leadGen: { ...prev.leadGen, mode: 'WEB_FLOW' } }))}
                            className={`py-2 px-3 rounded-lg text-xs font-semibold transition ${
                              webRoutingConfig.leadGen?.mode === 'WEB_FLOW'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                          >
                            ✨ Interactive Web Flow Modal
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Button Label</label>
                          <input
                            type="text"
                            value={webRoutingConfig.leadGen?.ctaText || ''}
                            onChange={(e) => setWebRoutingConfig(prev => ({ ...prev, leadGen: { ...prev.leadGen, ctaText: e.target.value } }))}
                            placeholder="e.g. 🎯 Get a Quote"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">CTA Description</label>
                          <input
                            type="text"
                            value={webRoutingConfig.leadGen?.promptText || ''}
                            onChange={(e) => setWebRoutingConfig(prev => ({ ...prev, leadGen: { ...prev.leadGen, promptText: e.target.value } }))}
                            placeholder="e.g. Tell us your requirements:"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 4. WEB SUPPORT */}
                    <div className="p-5 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                      <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                        <div className="p-2.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-500/20">
                          <LifeBuoy className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Customer Support Tickets</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">Technical help, billing inquiries, and customer grievances</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Widget Processing Mode</label>
                        <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => setWebRoutingConfig(prev => ({ ...prev, support: { ...prev.support, mode: 'CHATBOT' } }))}
                            className={`py-2 px-3 rounded-lg text-xs font-semibold transition ${
                              webRoutingConfig.support?.mode === 'CHATBOT'
                                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-transparent shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                          >
                            💬 Step-by-Step Chatbot
                          </button>
                          <button
                            type="button"
                            onClick={() => setWebRoutingConfig(prev => ({ ...prev, support: { ...prev.support, mode: 'WEB_FLOW' } }))}
                            className={`py-2 px-3 rounded-lg text-xs font-semibold transition ${
                              webRoutingConfig.support?.mode === 'WEB_FLOW'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                          >
                            ✨ Interactive Web Flow Modal
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Button Label</label>
                          <input
                            type="text"
                            value={webRoutingConfig.support?.ctaText || ''}
                            onChange={(e) => setWebRoutingConfig(prev => ({ ...prev, support: { ...prev.support, ctaText: e.target.value } }))}
                            placeholder="e.g. 🎫 Open Support Ticket"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">CTA Description</label>
                          <input
                            type="text"
                            value={webRoutingConfig.support?.promptText || ''}
                            onChange={(e) => setWebRoutingConfig(prev => ({ ...prev, support: { ...prev.support, promptText: e.target.value } }))}
                            placeholder="e.g. Log your issue with our team:"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Website Save Bar */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <button
                      onClick={handleSaveWebRouting}
                      disabled={savingWebRouting}
                      className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-950/20 transition"
                    >
                      {savingWebRouting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving Website Routing...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Save Website Web Flow Routing
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Visual Form Builder Mode */
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Builder Top Bar */}
          <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsEditing(false)}
                className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingFlowId ? 'Edit WhatsApp Flow' : 'Create New WhatsApp Flow'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Design your native in-app WhatsApp form screens and fields</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveDraft}
                disabled={actionLoading === 'draft'}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition"
              >
                {actionLoading === 'draft' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Draft'}
              </button>
              <button
                onClick={() => handlePublish()}
                disabled={actionLoading === 'publish'}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-950/20 transition"
              >
                {actionLoading === 'publish' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Publish to WhatsApp
              </button>
            </div>
          </div>

          {/* Builder Content: Left Settings & Right Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Form Fields & Settings (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Basic Info */}
              <div className="p-5 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Flow Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-400 block mb-1.5">Flow Name</label>
                    <input
                      type="text"
                      value={flowName}
                      onChange={(e) => setFlowName(e.target.value)}
                      placeholder="e.g. Clinic Appointment Booking"
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-400 block mb-1.5">Business Category</label>
                    <select
                      value={flowCategory}
                      onChange={(e) => setFlowCategory(e.target.value as FlowCategoryType)}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="APPOINTMENT_BOOKING">📅 Appointment Booking</option>
                      <option value="LEAD_GENERATION">🎯 Lead Generation</option>
                      <option value="CUSTOMER_SUPPORT">🎫 Customer Support</option>
                      <option value="SURVEY">⭐ Feedback & Survey</option>
                      <option value="OTHER">📋 Other Form</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Form Fields Editor */}
              <div className="p-5 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                {/* Master CRM Template Loader Bar */}
                <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/40 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-950 dark:text-emerald-200">
                      Sync from CRM Master Fields (master-fields.json):
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      disabled={loadingMasterFields}
                      onClick={() => handleLoadFromMasterFields('appointment')}
                      className="px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-emerald-100 dark:hover:bg-emerald-950 text-slate-800 dark:text-slate-200 text-[11px] font-semibold rounded-lg border border-emerald-300 dark:border-emerald-700/60 shadow-xs transition"
                    >
                      📅 Appointment Fields
                    </button>
                    <button
                      type="button"
                      disabled={loadingMasterFields}
                      onClick={() => handleLoadFromMasterFields('booking')}
                      className="px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-blue-100 dark:hover:bg-blue-950 text-slate-800 dark:text-slate-200 text-[11px] font-semibold rounded-lg border border-blue-300 dark:border-blue-700/60 shadow-xs transition"
                    >
                      🔖 Booking Fields
                    </button>
                    <button
                      type="button"
                      disabled={loadingMasterFields}
                      onClick={() => handleLoadFromMasterFields('lead')}
                      className="px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-amber-100 dark:hover:bg-amber-950 text-slate-800 dark:text-slate-200 text-[11px] font-semibold rounded-lg border border-amber-300 dark:border-amber-700/60 shadow-xs transition"
                    >
                      🎯 Lead Gen Fields
                    </button>
                    <button
                      type="button"
                      disabled={loadingMasterFields}
                      onClick={() => handleLoadFromMasterFields('support')}
                      className="px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-purple-100 dark:hover:bg-purple-950 text-slate-800 dark:text-slate-200 text-[11px] font-semibold rounded-lg border border-purple-300 dark:border-purple-700/60 shadow-xs transition"
                    >
                      🎫 Support Fields
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Form Fields ({fields.length})
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      onChange={(e) => {
                        const targetKey = e.target.value;
                        if (!targetKey) return;
                        const match = CRM_MASTER_FIELDS.find(f => f.key === targetKey);
                        if (match) handleAddMasterField(match);
                        e.target.value = '';
                      }}
                      className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 rounded-lg text-xs font-semibold focus:outline-none"
                    >
                      <option value="">✨ + Add from CRM Master Fields</option>
                      {CRM_MASTER_FIELDS.map(mf => (
                        <option key={mf.key} value={mf.key}>
                          {mf.label} ({mf.key})
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => handleAddField('TEXT')}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 rounded-lg transition border border-slate-200 dark:border-slate-700"
                    >
                      + Custom Text
                    </button>
                    <button
                      onClick={() => handleAddField('DATE')}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 rounded-lg transition border border-slate-200 dark:border-slate-700"
                    >
                      + Custom Date
                    </button>
                    <button
                      onClick={() => handleAddField('SELECT')}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 rounded-lg transition border border-slate-200 dark:border-slate-700"
                    >
                      + Dropdown
                    </button>
                    <button
                      onClick={() => handleAddField('TEXTAREA')}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 rounded-lg transition border border-slate-200 dark:border-slate-700"
                    >
                      + Textarea
                    </button>
                  </div>
                </div>

                <div className="space-y-3 mt-3">
                  {fields.map((field, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800/90 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-400 rounded">
                            {field.type}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">{field.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => handleFieldChange(idx, 'required', e.target.checked)}
                              className="rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-0"
                            />
                            Required
                          </label>
                          <button
                            onClick={() => handleRemoveField(idx)}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500 rounded transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-medium text-slate-700 dark:text-slate-400 block mb-1">Field Label</label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => handleFieldChange(idx, 'label', e.target.value)}
                            className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-slate-700 dark:text-slate-400 block mb-1">Payload Variable</label>
                          <input
                            type="text"
                            value={field.name}
                            onChange={(e) => handleFieldChange(idx, 'name', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                            className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-emerald-700 dark:text-emerald-300 font-mono placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      {(field.type === 'SELECT' || field.type === 'RADIO') && (
                        <div>
                          <label className="text-[11px] font-medium text-slate-700 dark:text-slate-400 block mb-1">
                            Options (comma-separated)
                          </label>
                          <input
                            type="text"
                            value={field.options?.join(', ') || ''}
                            onChange={(e) =>
                              handleFieldChange(
                                idx,
                                'options',
                                e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                              )
                            }
                            placeholder="e.g. 10:00 AM, 02:00 PM, 05:00 PM"
                            className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirmation Message */}
              <div className="p-5 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Automated WhatsApp Confirmation
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This message is sent automatically to the customer on WhatsApp as soon as they submit the form.
                </p>
                <textarea
                  value={confirmationMessage}
                  onChange={(e) => setConfirmationMessage(e.target.value)}
                  rows={3}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  placeholder="Thank you! We have received your booking request."
                />
              </div>
            </div>

            {/* Right Column: WhatsApp Live Screen Preview (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="sticky top-6 w-full max-w-[340px] bg-slate-950 p-4 rounded-[40px] border-4 border-slate-800 shadow-2xl space-y-4">
                {/* Phone Notch */}
                <div className="w-28 h-4 bg-slate-800 rounded-full mx-auto"></div>

                {/* WhatsApp Screen Frame */}
                <div className="bg-[#0b141a] rounded-[28px] p-4 text-slate-100 min-h-[480px] flex flex-col justify-between border border-slate-800/80">
                  {/* WhatsApp Form Header */}
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-semibold text-emerald-400">
                      <span>{flowName || 'Form Title'}</span>
                      <span className="text-[10px] text-slate-400">WhatsApp Flow</span>
                    </div>

                    {/* Form Fields Preview */}
                    <div className="mt-4 space-y-3 text-xs">
                      {fields.map((f, i) => (
                        <div key={i} className="space-y-1">
                          <label className="text-[11px] font-medium text-slate-300 block">
                            {f.label} {f.required && <span className="text-rose-400">*</span>}
                          </label>
                          {f.type === 'SELECT' || f.type === 'RADIO' ? (
                            <div className="p-2 bg-[#1f2c34] rounded-lg border border-slate-700 text-slate-300 flex items-center justify-between">
                              <span>Select an option...</span>
                              <span className="text-[10px] text-slate-500">▼</span>
                            </div>
                          ) : f.type === 'DATE' ? (
                            <div className="p-2 bg-[#1f2c34] rounded-lg border border-slate-700 text-slate-300 flex items-center justify-between">
                              <span>YYYY-MM-DD</span>
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                          ) : f.type === 'TEXTAREA' ? (
                            <div className="p-2 bg-[#1f2c34] rounded-lg border border-slate-700 text-slate-500 h-12">
                              Enter notes...
                            </div>
                          ) : (
                            <div className="p-2 bg-[#1f2c34] rounded-lg border border-slate-700 text-slate-500">
                              Enter {f.label}...
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 mt-6 border-t border-slate-800">
                    <button
                      disabled
                      className="w-full py-2.5 bg-[#00a884] text-slate-950 font-bold rounded-xl text-xs shadow"
                    >
                      Submit Form
                    </button>
                    <p className="text-[9px] text-center text-slate-500 mt-2">
                      Secured by Meta WhatsApp Cloud API
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pre-Built Templates Modal */}
      {showTemplatesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                  Pre-Built WhatsApp Flow Templates
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  1-Click templates optimized for high conversion on WhatsApp
                </p>
              </div>
              <button
                onClick={() => setShowTemplatesModal(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-1">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="p-4 bg-slate-50 dark:bg-slate-950/70 hover:bg-slate-100/80 dark:hover:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800/90 hover:border-emerald-500/50 transition flex flex-col justify-between"
                >
                  <div>
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-transparent">
                      {tpl.category.replace('_', ' ')}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-2">{tpl.name}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{tpl.description}</p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {tpl.fields.map((f, fi) => (
                        <span key={fi} className="px-1.5 py-0.5 bg-white dark:bg-slate-900 text-[10px] text-slate-600 dark:text-slate-400 rounded border border-slate-200 dark:border-slate-800">
                          {f.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleApplyTemplate(tpl)}
                    className="w-full mt-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow transition"
                  >
                    Use This Template
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Submissions Modal */}
      {selectedFlowForSubmissions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Form Responses: {selectedFlowForSubmissions.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Live responses captured from WhatsApp customers
                </p>
              </div>
              <button
                onClick={() => setSelectedFlowForSubmissions(null)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            {loadingSubmissions ? (
              <div className="p-12 text-center">
                <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-500 dark:text-slate-400">Loading form responses...</p>
              </div>
            ) : submissions.length === 0 ? (
              <div className="p-10 text-center text-slate-500 dark:text-slate-400 text-sm">
                No customer responses recorded for this Flow yet.
              </div>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto space-y-3">
                {submissions.map((sub, sidx) => (
                  <div key={sidx} className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                    <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-300">
                      <span>📱 {sub.customerPhone || 'Unknown Phone'}</span>
                      <span className="text-slate-500 font-mono text-[11px]">
                        {new Date(sub.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <pre className="p-2.5 bg-slate-100 dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 font-mono rounded-lg overflow-x-auto text-[11px] border border-slate-200 dark:border-slate-800">
                      {sub.normalizedDataJson || sub.rawResponseJson}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom Archive Confirmation Modal */}
      {flowToArchive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Archive WhatsApp Flow</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Deactivate flow and stop submissions</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to archive <strong className="text-slate-900 dark:text-white">"{flowToArchive.name}"</strong>? It will no longer receive new submissions on WhatsApp.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setFlowToArchive(null)}
                disabled={actionLoading === `arc_${flowToArchive.id}`}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition border border-slate-200 dark:border-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmArchive}
                disabled={actionLoading === `arc_${flowToArchive.id}`}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-950/20 transition"
              >
                {actionLoading === `arc_${flowToArchive.id}` ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Archiving...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Archive Flow
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
