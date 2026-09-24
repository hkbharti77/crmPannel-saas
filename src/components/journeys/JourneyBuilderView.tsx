import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Play,
  Plus,
  Zap,
  MessageSquare,
  Mail,
  Send,
  Clock,
  GitBranch,
  CheckCircle2,
  AlertCircle,
  Upload,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Settings,
  Trash2,
  Copy,
  Filter,
  Eye,
  FileSpreadsheet,
  ArrowRight,
  Layers,
  Database,
  Check,
  X,
  Search,
  SlidersHorizontal,
  Workflow,
  ShieldAlert,
  BarChart3,
  Bot,
  Terminal,
  Maximize2,
  Minimize2,
  Lock,
  Calendar,
  UserCheck,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/primitives';
import { TabSwitcher } from '@/components/ui/TabSwitcher';
import {
  fetchJourneys,
  createJourney,
  fetchJourneyVersions,
  createJourneyVersion,
  publishJourneyVersion,
  type CustomerJourney,
  type CustomerJourneyVersion,
} from '@/lib/journeyApi';
import { BulkUploadModal } from '@/components/contacts/BulkUploadModal';

export interface WorkflowNode {
  id: string;
  type: 'TRIGGER' | 'CONSENT_GUARD' | 'ACTION_WHATSAPP' | 'ACTION_EMAIL' | 'ACTION_SMS' | 'WAIT' | 'CONDITION';
  name: string;
  description?: string;
  config?: {
    templateId?: string;
    message?: string;
    delayValue?: number;
    delayUnit?: 'MINUTES' | 'HOURS' | 'DAYS';
    conditionExpr?: string;
    consentFallback?: 'SKIP_NODE' | 'CANCEL_RUN';
    channel?: 'WHATSAPP' | 'EMAIL' | 'SMS';
  };
}

export const JourneyBuilderView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'journeys' | 'builder'>('journeys');
  const [journeys, setJourneys] = useState<CustomerJourney[]>([]);
  const [selectedJourney, setSelectedJourney] = useState<CustomerJourney | null>(null);
  const [versions, setVersions] = useState<CustomerJourneyVersion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterTrigger, setFilterTrigger] = useState<string>('ALL');

  // Modals state
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // New Journey Form State
  const [newJourneyName, setNewJourneyName] = useState('');
  const [newJourneyDesc, setNewJourneyDesc] = useState('');
  const [newJourneyTrigger, setNewJourneyTrigger] = useState('EVENT_LEAD_CREATED');
  const [newJourneyReentry, setNewJourneyReentry] = useState('ONE_ACTIVE_PER_CONTACT');
  const [selectedTemplatePreset, setSelectedTemplatePreset] = useState<string>('WELCOME_SEQUENCE');

  // Visual Canvas Editor State
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('node_trigger');
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Workflow nodes for visual editor
  const [nodes, setNodes] = useState<WorkflowNode[]>([
    {
      id: 'node_trigger',
      type: 'TRIGGER',
      name: 'Trigger: New Lead Created',
      description: 'Fired automatically when a lead enters system via API, Form or Import',
      config: { conditionExpr: 'event == "LEAD_CREATED"' },
    },
    {
      id: 'node_consent',
      type: 'CONSENT_GUARD',
      name: 'Channel Consent Guard',
      description: 'Verifies per-channel contact preferences (WhatsApp, Email, SMS)',
      config: { consentFallback: 'SKIP_NODE' },
    },
    {
      id: 'node_whatsapp',
      type: 'ACTION_WHATSAPP',
      name: 'Send WhatsApp Welcome',
      description: 'Meta WhatsApp Business Template message with quick reply button',
      config: {
        channel: 'WHATSAPP',
        templateId: 'welcome_onboarding_v1',
        message: 'Hello {{contact.name}}! Welcome to GyanVani CRM. How can we assist you today?',
      },
    },
    {
      id: 'node_wait',
      type: 'WAIT',
      name: 'Wait 2 Hours',
      description: 'Holds execution until wait timer expires or event fires',
      config: { delayValue: 2, delayUnit: 'HOURS' },
    },
    {
      id: 'node_condition',
      type: 'CONDITION',
      name: 'Condition: User Replied?',
      description: 'Evaluates engagement history & response telemetry',
      config: { conditionExpr: 'contact.has_replied == true' },
    },
    {
      id: 'node_email',
      type: 'ACTION_EMAIL',
      name: 'Send Follow-up Email',
      description: 'Transactional HTML email with custom product catalog preview',
      config: {
        channel: 'EMAIL',
        templateId: 'followup_nurture_email',
        message: 'Here is your requested product overview and pricing calculator.',
      },
    },
  ]);

  useEffect(() => {
    loadJourneys();
  }, []);

  const loadJourneys = async () => {
    setLoading(true);
    try {
      const data = await fetchJourneys();
      setJourneys(data);
    } catch (err) {
      console.error('Failed to load customer journeys:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJourney = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newJourney = await createJourney({
        name: newJourneyName,
        description: newJourneyDesc,
        triggerEvent: newJourneyTrigger,
        reentryMode: newJourneyReentry,
      });

      if (!newJourney || !newJourney.id) {
        console.error('Failed to create journey: invalid journey ID received', newJourney);
        return;
      }

      const initialDefinition = JSON.stringify({
        nodes: nodes,
        edges: nodes.slice(0, -1).map((n, idx) => ({ source: n.id, target: nodes[idx + 1].id })),
      });

      const ver = await createJourneyVersion(newJourney.id, initialDefinition);
      if (ver && ver.id) {
        await publishJourneyVersion(newJourney.id, ver.id);
      }

      setIsCreateModalOpen(false);
      setNewJourneyName('');
      setNewJourneyDesc('');
      loadJourneys();
      handleSelectJourney(newJourney);
    } catch (err) {
      console.error('Failed to create journey:', err);
    }
  };

  const handleSelectJourney = async (journey: CustomerJourney) => {
    setSelectedJourney(journey);
    setActiveTab('builder');
    try {
      const verData = await fetchJourneyVersions(journey.id);
      setVersions(verData);
    } catch (err) {
      console.error('Failed to load journey versions:', err);
    }
  };

  const handleAddNode = (type: WorkflowNode['type']) => {
    const id = `node_${Date.now().toString().slice(-4)}`;
    let newNode: WorkflowNode = {
      id,
      type,
      name:
        type === 'ACTION_WHATSAPP'
          ? 'Send WhatsApp Dispatch'
          : type === 'ACTION_EMAIL'
          ? 'Send Email Campaign'
          : type === 'ACTION_SMS'
          ? 'Send SMS Alert'
          : type === 'WAIT'
          ? 'Wait Duration'
          : type === 'CONDITION'
          ? 'Condition Check'
          : 'Channel Consent Guard',
      description: 'Custom step node configuration',
      config: {
        delayValue: 1,
        delayUnit: 'HOURS',
        consentFallback: 'SKIP_NODE',
      },
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(id);
  };

  const handleDeleteNode = (id: string) => {
    if (nodes.length <= 1) return;
    setNodes((prev) => prev.filter((n) => n.id !== id));
    if (selectedNodeId === id) {
      setSelectedNodeId(nodes[0]?.id || null);
    }
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  const filteredJourneys = journeys.filter((j) => {
    const matchesSearch =
      j.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (j.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTrigger = filterTrigger === 'ALL' || j.triggerEvent === filterTrigger;
    return matchesSearch && matchesTrigger;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 text-primary-c">
      {/* Top Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-base-c">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary-500/20 bg-primary-500/10 text-xs font-semibold text-primary-600 dark:text-primary-400 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Multi-Tenant Enterprise Workflow Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-primary-c flex items-center gap-3">
            Customer Journeys & Automation
          </h1>
          <p className="text-xs sm:text-sm text-secondary-c mt-1 leading-relaxed max-w-3xl">
            Build event-driven omnichannel sequences combining WhatsApp, Email, and SMS with transactional outbox guarantees, channel consent guards, and stable operation idempotency keys.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsBulkUploadOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-base-c bg-card-c px-4 py-2.5 text-xs font-semibold text-primary-c shadow-sm hover:bg-subtle-c transition-all active:scale-95"
          >
            <Upload className="w-4 h-4 text-emerald-500" />
            <span>Bulk Contacts Ingestion</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-accent px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-primary-500/20 hover:scale-[1.02] transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Journey</span>
          </button>
        </div>
      </div>

      {/* Stats Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4 space-y-2 border border-base-c bg-card-c shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-c">Active Journeys</span>
            <div className="p-2 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400">
              <Workflow className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-primary-c">{journeys.length}</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
            </span>
          </div>
          <p className="text-[11px] text-muted-c">Automated lead & booking triggers</p>
        </GlassCard>

        <GlassCard className="p-4 space-y-2 border border-base-c bg-card-c shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-c">Outbox Telemetry Executions</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-primary-c">14,290</span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">99.8% Success</span>
          </div>
          <p className="text-[11px] text-muted-c">Transactional 3-level deduplicated dispatches</p>
        </GlassCard>

        <GlassCard className="p-4 space-y-2 border border-base-c bg-card-c shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-c">Omnichannel Dispatch Share</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">WA 58%</span>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-500/10 px-2 py-0.5 rounded">Email 28%</span>
            <span className="text-xs font-bold text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded">SMS 14%</span>
          </div>
          <p className="text-[11px] text-muted-c">Meta WA + SMTP + DLT Verified SMS</p>
        </GlassCard>

        <GlassCard className="p-4 space-y-2 border border-base-c bg-card-c shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-c">Channel Consent Guard</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-primary-c">100% Granular</span>
            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">Opt-Out Safe</span>
          </div>
          <p className="text-[11px] text-muted-c">Skips channel without killing journey runs</p>
        </GlassCard>
      </div>

      {/* Tab Controls */}
      <TabSwitcher
        tabs={[
          { id: 'journeys', label: `Active Automation Journeys (${journeys.length})` },
          { id: 'builder', label: selectedJourney ? `Visual Builder: ${selectedJourney.name}` : 'Visual Canvas Builder' },
        ]}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as any)}
      />

      {/* TAB 1: JOURNEYS LIST DIRECTORY */}
      {activeTab === 'journeys' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl border border-base-c bg-card-c shadow-soft">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-c" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search journey name or objective..."
                className="form-input pl-9 pr-3 py-1.5 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-muted-c shrink-0" />
              <select
                value={filterTrigger}
                onChange={(e) => setFilterTrigger(e.target.value)}
                className="form-input text-xs py-1.5 min-w-[180px]"
              >
                <option value="ALL">All Trigger Events</option>
                <option value="EVENT_LEAD_CREATED">New Lead Created</option>
                <option value="EVENT_APPOINTMENT_CREATED">Appointment Booked</option>
                <option value="EVENT_BOOKING_CONFIRMED">Service Booking Confirmed</option>
                <option value="EVENT_BULK_UPLOAD">Bulk Contacts Ingestion</option>
              </select>
            </div>
          </div>

          {/* Journeys Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full text-center py-16 text-muted-c">
                <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-2 text-primary-500" />
                <p className="text-xs font-semibold">Loading enterprise automation journeys…</p>
              </div>
            ) : filteredJourneys.length === 0 ? (
              <GlassCard className="col-span-full p-12 text-center space-y-4 border border-base-c bg-card-c">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center border border-primary-500/20">
                  <Workflow className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primary-c">No Automation Journeys Found</h3>
                  <p className="text-xs text-secondary-c mt-1 max-w-md mx-auto">
                    Create automated multi-channel sequences for new leads, appointment reminders, or bulk uploaded contact lists.
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-accent px-5 py-2.5 text-xs font-bold text-white shadow-md hover:scale-105 transition-all"
                >
                  <Plus className="w-4 h-4" /> Create First Journey
                </button>
              </GlassCard>
            ) : (
              filteredJourneys.map((j) => (
                <GlassCard
                  key={j.id}
                  onClick={() => handleSelectJourney(j)}
                  className="p-5 space-y-4 cursor-pointer border border-base-c bg-card-c shadow-soft hover:shadow-soft-lg hover:border-primary-500/40 transition-all group relative overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary-500/10 to-indigo-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 group-hover:scale-110 transition-transform">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-primary-c text-sm group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                          {j.name}
                        </h4>
                        <span className="text-[11px] font-mono text-muted-c block mt-0.5">{j.triggerEvent}</span>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        j.status === 'PUBLISHED'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
                      }`}
                    >
                      {j.status === 'PUBLISHED' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                      {j.status}
                    </span>
                  </div>

                  {j.description && <p className="text-xs text-secondary-c line-clamp-2 leading-relaxed">{j.description}</p>}

                  <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-c">
                    <span className="px-2 py-0.5 rounded-md bg-subtle-c font-mono border border-base-c">
                      Re-entry: {j.reentryMode}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-subtle-c font-mono border border-base-c">
                      Immutable v1
                    </span>
                  </div>

                  <div className="pt-3 border-t border-base-c flex items-center justify-between text-xs">
                    <span className="text-muted-c text-[11px]">Click to inspect workflow canvas</span>
                    <span className="text-primary-600 dark:text-primary-400 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      Open Canvas <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </GlassCard>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: VISUAL CANVAS BUILDER */}
      {activeTab === 'builder' && (
        <div className="space-y-4">
          {/* Builder Top Action Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl border border-base-c bg-card-c shadow-soft">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-accent text-white shadow-md">
                <Workflow className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-primary-c">
                    {selectedJourney ? selectedJourney.name : 'Lead Onboarding & Nurture Journey'}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold uppercase">
                    PUBLISHED v1.0
                  </span>
                </div>
                <p className="text-xs text-muted-c mt-0.5">
                  Trigger: {selectedJourney ? selectedJourney.triggerEvent : 'EVENT_LEAD_CREATED'} • Stable Idempotency Enforcement Active
                </p>
              </div>
            </div>

            {/* Canvas Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-subtle-c p-1 rounded-xl border border-base-c text-xs font-semibold mr-2">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(70, z - 10))}
                  className="px-2 py-1 rounded hover:bg-card-c text-secondary-c hover:text-primary-c"
                  title="Zoom Out"
                >
                  -
                </button>
                <span className="px-2 font-mono text-[11px]">{zoomLevel}%</span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}
                  className="px-2 py-1 rounded hover:bg-card-c text-secondary-c hover:text-primary-c"
                  title="Zoom In"
                >
                  +
                </button>
              </div>

              <button
                onClick={() => setIsInspectorOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                  isInspectorOpen
                    ? 'border-primary-500/40 bg-primary-500/10 text-primary-600 dark:text-primary-400'
                    : 'border-base-c bg-card-c text-secondary-c'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Node Inspector</span>
              </button>

              <button
                onClick={() => handleAddNode('ACTION_WHATSAPP')}
                className="flex items-center gap-1.5 rounded-xl border border-base-c bg-card-c px-3 py-1.5 text-xs font-semibold text-primary-c hover:bg-subtle-c shadow-sm active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-500" />
                <span>Add Step</span>
              </button>

              <button className="flex items-center gap-1.5 rounded-xl bg-gradient-accent px-4 py-1.5 text-xs font-bold text-white shadow-md hover:scale-105 active:scale-95">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Publish Version</span>
              </button>
            </div>
          </div>

          {/* Canvas Main Area */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Visual Canvas Visualizer */}
            <div className={`${isInspectorOpen ? 'lg:col-span-8' : 'lg:col-span-12'} transition-all`}>
              <GlassCard className="p-8 min-h-[600px] border border-base-c bg-card-c shadow-soft rounded-2xl relative overflow-hidden flex flex-col items-center justify-start">
                {/* Background Grid Pattern */}
                <div
                  className="absolute inset-0 opacity-[0.04] dark:opacity-[0.08] pointer-events-none"
                  style={{
                    backgroundImage: `radial-gradient(#3b82f6 1px, transparent 1px)`,
                    backgroundSize: '24px 24px',
                  }}
                />

                {/* Palette Quick Add Bar */}
                <div className="relative z-10 mb-8 flex flex-wrap items-center justify-center gap-2 bg-subtle-c/80 backdrop-blur p-2 rounded-2xl border border-base-c shadow-sm">
                  <span className="text-[11px] font-bold text-muted-c px-2 uppercase tracking-wider">Quick Insert:</span>
                  <button
                    onClick={() => handleAddNode('CONSENT_GUARD')}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-card-c border border-base-c text-xs font-semibold text-purple-600 dark:text-purple-400 hover:border-purple-500/40 transition-all shadow-xs"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> Consent Guard
                  </button>
                  <button
                    onClick={() => handleAddNode('ACTION_WHATSAPP')}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-card-c border border-base-c text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:border-emerald-500/40 transition-all shadow-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                  </button>
                  <button
                    onClick={() => handleAddNode('ACTION_EMAIL')}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-card-c border border-base-c text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:border-indigo-500/40 transition-all shadow-xs"
                  >
                    <Mail className="w-3.5 h-3.5" /> Email
                  </button>
                  <button
                    onClick={() => handleAddNode('ACTION_SMS')}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-card-c border border-base-c text-xs font-semibold text-blue-600 dark:text-blue-400 hover:border-blue-500/40 transition-all shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" /> SMS
                  </button>
                  <button
                    onClick={() => handleAddNode('WAIT')}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-card-c border border-base-c text-xs font-semibold text-amber-600 dark:text-amber-400 hover:border-amber-500/40 transition-all shadow-xs"
                  >
                    <Clock className="w-3.5 h-3.5" /> Delay Wait
                  </button>
                  <button
                    onClick={() => handleAddNode('CONDITION')}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-card-c border border-base-c text-xs font-semibold text-rose-600 dark:text-rose-400 hover:border-rose-500/40 transition-all shadow-xs"
                  >
                    <GitBranch className="w-3.5 h-3.5" /> Condition
                  </button>
                </div>

                {/* Workflow Nodes Flowchart Stack */}
                <div
                  className="relative z-10 flex flex-col items-center gap-6 w-full max-w-xl py-4 transition-transform origin-top"
                  style={{ transform: `scale(${zoomLevel / 100})` }}
                >
                  {nodes.map((node, index) => {
                    const isSelected = node.id === selectedNodeId;

                    return (
                      <React.Fragment key={node.id}>
                        {/* Node Box */}
                        <div
                          onClick={() => setSelectedNodeId(node.id)}
                          className={`w-full rounded-2xl border p-4 transition-all cursor-pointer shadow-soft relative group ${
                            isSelected
                              ? 'border-primary-500 bg-card-c ring-2 ring-primary-500/30 shadow-soft-lg scale-[1.02]'
                              : 'border-base-c bg-card-c hover:border-primary-500/40 hover:bg-subtle-c/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              {/* Node Type Icon */}
                              <div
                                className={`p-2.5 rounded-xl shrink-0 border ${
                                  node.type === 'TRIGGER'
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                    : node.type === 'CONSENT_GUARD'
                                    ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                                    : node.type === 'ACTION_WHATSAPP'
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                    : node.type === 'ACTION_EMAIL'
                                    ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                                    : node.type === 'ACTION_SMS'
                                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                                    : node.type === 'WAIT'
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                }`}
                              >
                                {node.type === 'TRIGGER' && <Zap className="w-5 h-5" />}
                                {node.type === 'CONSENT_GUARD' && <ShieldCheck className="w-5 h-5" />}
                                {node.type === 'ACTION_WHATSAPP' && <MessageSquare className="w-5 h-5" />}
                                {node.type === 'ACTION_EMAIL' && <Mail className="w-5 h-5" />}
                                {node.type === 'ACTION_SMS' && <Send className="w-5 h-5" />}
                                {node.type === 'WAIT' && <Clock className="w-5 h-5" />}
                                {node.type === 'CONDITION' && <GitBranch className="w-5 h-5" />}
                              </div>

                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-sm text-primary-c">{node.name}</h4>
                                  <span className="text-[9px] font-extrabold font-mono uppercase px-1.5 py-0.5 rounded bg-subtle-c border border-base-c text-muted-c">
                                    {node.type}
                                  </span>
                                </div>
                                <p className="text-xs text-secondary-c mt-0.5 leading-tight">
                                  {node.description}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              {nodes.length > 1 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteNode(node.id);
                                  }}
                                  className="p-1 text-muted-c hover:text-rose-500 rounded hover:bg-subtle-c transition-colors"
                                  title="Remove node"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Node Configuration Preview */}
                          {node.config && (
                            <div className="mt-3 pt-3 border-t border-base-c flex flex-wrap items-center justify-between text-[11px] font-mono text-muted-c">
                              {node.config.templateId && (
                                <span className="truncate max-w-[200px]">Template: {node.config.templateId}</span>
                              )}
                              {node.config.delayValue && (
                                <span>Delay: {node.config.delayValue} {node.config.delayUnit}</span>
                              )}
                              {node.config.consentFallback && (
                                <span className="text-purple-600 dark:text-purple-400 font-semibold">
                                  Guard: {node.config.consentFallback}
                                </span>
                              )}
                              <span className="text-primary-600 dark:text-primary-400 font-sans font-semibold">
                                Idempotency: Stable
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Connector Down Arrow with Add Step Drop Indicator */}
                        {index < nodes.length - 1 && (
                          <div className="flex flex-col items-center py-1 group/line cursor-pointer">
                            <div className="h-6 w-0.5 bg-gradient-to-b from-primary-500/40 to-indigo-500/40 group-hover/line:bg-primary-500 transition-colors" />
                            <div className="p-1 rounded-full border border-base-c bg-card-c text-primary-500 shadow-xs group-hover/line:scale-110 transition-transform">
                              <Plus className="w-3 h-3" />
                            </div>
                            <div className="h-2 w-0.5 bg-indigo-500/40" />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </GlassCard>
            </div>

            {/* Right Node Inspector Drawer */}
            {isInspectorOpen && selectedNode && (
              <div className="lg:col-span-4 space-y-4">
                <GlassCard className="p-5 border border-base-c bg-card-c shadow-soft rounded-2xl space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-base-c">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-primary-500" />
                      <h3 className="font-bold text-sm text-primary-c">Node Inspector</h3>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-subtle-c text-muted-c border border-base-c">
                      {selectedNode.id}
                    </span>
                  </div>

                  {/* Form Inputs */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-secondary-c block mb-1">Step Label</label>
                      <input
                        type="text"
                        value={selectedNode.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNodes((prev) =>
                            prev.map((n) => (n.id === selectedNode.id ? { ...n, name: val } : n))
                          );
                        }}
                        className="form-input text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-secondary-c block mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={selectedNode.description || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNodes((prev) =>
                            prev.map((n) => (n.id === selectedNode.id ? { ...n, description: val } : n))
                          );
                        }}
                        className="form-input text-xs"
                      />
                    </div>

                    {/* Step Type Specific Options */}
                    {selectedNode.type.startsWith('ACTION_') && (
                      <div className="space-y-3 p-3 rounded-xl bg-subtle-c border border-base-c">
                        <h4 className="text-xs font-bold text-primary-c flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-primary-500" /> Channel Outbound Payload
                        </h4>
                        <div>
                          <label className="text-[11px] text-muted-c block mb-1">Message Template ID</label>
                          <input
                            type="text"
                            value={selectedNode.config?.templateId || 'welcome_v1'}
                            onChange={(e) => {
                              const val = e.target.value;
                              setNodes((prev) =>
                                prev.map((n) =>
                                  n.id === selectedNode.id
                                    ? { ...n, config: { ...n.config, templateId: val } }
                                    : n
                                )
                              );
                            }}
                            className="form-input text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-muted-c block mb-1">Message Body Template</label>
                          <textarea
                            rows={3}
                            value={
                              selectedNode.config?.message ||
                              'Hello {{contact.name}}, thank you for reaching out to GyanVani CRM!'
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              setNodes((prev) =>
                                prev.map((n) =>
                                  n.id === selectedNode.id
                                    ? { ...n, config: { ...n.config, message: val } }
                                    : n
                                )
                              );
                            }}
                            className="form-input text-xs font-mono"
                          />
                        </div>
                      </div>
                    )}

                    {selectedNode.type === 'WAIT' && (
                      <div className="space-y-3 p-3 rounded-xl bg-subtle-c border border-base-c">
                        <h4 className="text-xs font-bold text-primary-c flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-500" /> Wait Duration Timer
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] text-muted-c block mb-1">Duration</label>
                            <input
                              type="number"
                              value={selectedNode.config?.delayValue || 2}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 1;
                                setNodes((prev) =>
                                  prev.map((n) =>
                                    n.id === selectedNode.id
                                      ? { ...n, config: { ...n.config, delayValue: val } }
                                      : n
                                  )
                                );
                              }}
                              className="form-input text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-muted-c block mb-1">Unit</label>
                            <select
                              value={selectedNode.config?.delayUnit || 'HOURS'}
                              onChange={(e) => {
                                const val = e.target.value as any;
                                setNodes((prev) =>
                                  prev.map((n) =>
                                    n.id === selectedNode.id
                                      ? { ...n, config: { ...n.config, delayUnit: val } }
                                      : n
                                  )
                                );
                              }}
                              className="form-input text-xs"
                            >
                              <option value="MINUTES">Minutes</option>
                              <option value="HOURS">Hours</option>
                              <option value="DAYS">Days</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedNode.type === 'CONSENT_GUARD' && (
                      <div className="space-y-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-900 dark:text-purple-300">
                        <h4 className="text-xs font-bold flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-500" /> Channel Opt-Out Fallback Behavior
                        </h4>
                        <p className="text-[11px] text-secondary-c leading-relaxed">
                          If contact is opted-out on a channel, what should happen to this step?
                        </p>
                        <select
                          value={selectedNode.config?.consentFallback || 'SKIP_NODE'}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            setNodes((prev) =>
                              prev.map((n) =>
                                n.id === selectedNode.id
                                  ? { ...n, config: { ...n.config, consentFallback: val } }
                                  : n
                              )
                            );
                          }}
                          className="form-input text-xs"
                        >
                          <option value="SKIP_NODE">SKIP_NODE (Mark skipped & proceed to next node)</option>
                          <option value="CANCEL_RUN">CANCEL_RUN (Strictly terminate entire run)</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Operational Security Info */}
                  <div className="pt-3 border-t border-base-c text-[11px] space-y-1 text-muted-c font-mono">
                    <p>Idempotency Key: <span className="text-emerald-600">STABLE_OP_KEY</span></p>
                    <p>Execution Table: <span className="text-primary-600">journey_node_executions</span></p>
                  </div>
                </GlassCard>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE JOURNEY MODAL */}
      {isCreateModalOpen &&
        createPortal(
          <>
            <div
              className="fixed inset-0 top-0 right-0 bottom-0 left-0 w-screen h-screen z-[9998] bg-slate-950/65 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
              onClick={() => setIsCreateModalOpen(false)}
              aria-hidden="true"
            />
            <div className="fixed inset-0 top-0 right-0 bottom-0 left-0 w-screen h-screen z-[9999] pointer-events-none flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
              <GlassCard className="pointer-events-auto relative w-full max-w-xl bg-card-c border border-base-c shadow-2xl rounded-2xl overflow-hidden p-6 space-y-5 animate-in zoom-in-95">
                <div className="flex items-center justify-between pb-4 border-b border-base-c">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-accent text-white shadow-md">
                      <Workflow className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-primary-c">Create Automation Journey</h3>
                      <p className="text-xs text-muted-c">Configure event trigger and re-entry constraints</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    className="p-1 text-muted-c hover:text-primary-c rounded-lg hover:bg-subtle-c transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateJourney} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-secondary-c block mb-1">Journey Name</label>
                    <input
                      type="text"
                      required
                      value={newJourneyName}
                      onChange={(e) => setNewJourneyName(e.target.value)}
                      className="form-input text-xs"
                      placeholder="e.g. Lead Onboarding & Follow-Up Sequence"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-secondary-c block mb-1">Objective / Description</label>
                    <textarea
                      rows={2}
                      value={newJourneyDesc}
                      onChange={(e) => setNewJourneyDesc(e.target.value)}
                      className="form-input text-xs"
                      placeholder="Automates WhatsApp welcome and follow-up emails for new inbound leads"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-secondary-c block mb-1">Trigger Event</label>
                      <select
                        value={newJourneyTrigger}
                        onChange={(e) => setNewJourneyTrigger(e.target.value)}
                        className="form-input text-xs"
                      >
                        <option value="EVENT_LEAD_CREATED">🎯 New Lead Created</option>
                        <option value="EVENT_APPOINTMENT_CREATED">📅 Appointment Booked</option>
                        <option value="EVENT_BOOKING_CONFIRMED">🛒 Service Booking Confirmed</option>
                        <option value="EVENT_BULK_UPLOAD">📁 Bulk Contacts Ingested</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-secondary-c block mb-1">Re-entry Policy</label>
                      <select
                        value={newJourneyReentry}
                        onChange={(e) => setNewJourneyReentry(e.target.value)}
                        className="form-input text-xs"
                      >
                        <option value="ONE_ACTIVE_PER_CONTACT">One Active Run Per Contact</option>
                        <option value="ONCE_EVER">Execute Once Ever Per Contact</option>
                        <option value="ALLOW_MULTIPLE">Allow Multiple Concurrent Runs</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-base-c flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="px-4 py-2 text-xs font-semibold text-secondary-c hover:text-primary-c transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-2 rounded-xl bg-gradient-accent px-5 py-2 text-xs font-bold text-white shadow-md hover:scale-105 transition-all"
                    >
                      <Plus className="w-4 h-4" /> Create & Open Canvas
                    </button>
                  </div>
                </form>
              </GlassCard>
            </div>
          </>,
          document.body
        )}

      {/* BULK UPLOAD MODAL */}
      <BulkUploadModal
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        onSuccess={loadJourneys}
      />
    </div>
  );
};
