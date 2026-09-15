import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { cx } from '@/lib/types';
import {
  Brain, Upload, Trash2, Download, AlertCircle, Loader2,
  FileText, Sparkles, CheckCircle2,
  Wand2, Save, RotateCcw, HelpCircle, Clock, User, RefreshCw,
  Mic, Volume2, ChevronDown, ChevronUp, Radio, Check,
  Zap, Database, BarChart3, Layers,
  ArrowUpRight, Search, FileCode, CheckCircle
} from 'lucide-react';
import { TabSwitcher } from '@/components/ui/TabSwitcher';
import { apiFetch } from '@/lib/api';
import { fetchSubscriptionStatus } from '@/lib/billingApi';
import { fetchFaqs, type FaqItemDto } from '@/lib/faqApi';
import { FaqManagementView } from './FaqManagementView';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { fetchVoiceConfig, saveVoiceConfig } from '@/lib/flowFieldsApi';

interface RagDocumentDto {
  documentId: string;
  name: string;
  totalChunks: number;
  embeddingSize: number;
  vectorModel: string;
}

interface PersonaDto {
  aiPersonaPrompt: string;
  updatedAt?: string;
  updatedBy?: string;
}

const PERSONA_TEMPLATES = [
  {
    label: '🏠 Real Estate Specialist',
    prompt: 'You are a professional real estate assistant for GyanVaniAi Connect. Speak with authority regarding property listings, pricing, market trends, amenities, and scheduling site visits. Use a warm, persuasive, and professional tone. Highlight key selling points and encourage leads to book a property tour.',
  },
  {
    label: '💼 Enterprise B2B Advisor',
    prompt: 'You are an executive B2B enterprise consultant. Speak in a concise, data-driven, and consultative manner. Help business leaders understand ROI, feature capabilities, workflow automation, and custom integrations. Always offer clear next steps and meeting booking links.',
  },
  {
    label: '🏥 Healthcare & Wellness Guide',
    prompt: 'You are an empathetic healthcare and wellness assistant. Speak with reassurance, clarity, and care. Assist patients with service inquiries, booking consultations, and general operational information. Always include a disclaimer to consult a licensed medical professional for clinical guidance.',
  },
  {
    label: '🛒 E-Commerce Support',
    prompt: 'You are a friendly and energetic e-commerce support concierge. Help shoppers find products, answer shipping and return questions, provide discount codes, and track package deliveries with an upbeat, helpful attitude.',
  },
  {
    label: '⚡ SaaS Technical Concierge',
    prompt: 'You are a technical SaaS product advisor. Help users troubleshoot API keys, integration setup, webhooks, user permissions, and billing questions. Use clear step-by-step instructions and code snippets when helpful.',
  },
];

const VOICE_PERSONA_TEMPLATES = [
  {
    name: 'Priya',
    label: '🎙️ Warm Receptionist (Priya)',
    prompt: 'You are Priya, a polite and warm voice assistant. Speak naturally in concise 1-2 sentences in clear spoken English. Greet callers warmly, understand their inquiry, and guide them to book an appointment or consultation.',
  },
  {
    name: 'Riya',
    label: '💼 Corporate Booking Desk (Riya)',
    prompt: 'You are Riya, an executive voice assistant for our business. Keep spoken English responses strictly under 25 words. Ask for caller name and service interest, then schedule their discussion.',
  },
  {
    name: 'Ananya',
    label: '🏥 Healthcare Coordinator (Ananya)',
    prompt: 'You are Ananya, a reassuring and empathetic clinic voice guide. Reassure patients warmly in clear spoken English, answer clinic hours and service questions briefly, and guide them to book a visit.',
  },
  {
    name: 'Aryan',
    label: '⚡ Direct Sales Specialist (Aryan)',
    prompt: 'You are Aryan, an energetic sales concierge. Keep phone conversations engaging in fluent English, highlight top services in one sentence, and prompt callers to take the next step.',
  },
];

const VOICE_MODELS = [
  // Female
  { id: 'simran',  name: 'Simran',  gender: 'female', style: 'Warm & Professional (Hindi/Eng)' },
  { id: 'priya',   name: 'Priya',   gender: 'female', style: 'Soft & Friendly (Marathi/Eng)' },
  { id: 'neha',    name: 'Neha',    gender: 'female', style: 'Clear & Direct (Gujarati/Eng)' },
  // Male
  { id: 'rahul',   name: 'Rahul',   gender: 'male',   style: 'Deep & Confident (Hindi/Eng)' },
  { id: 'rohan',   name: 'Rohan',   gender: 'male',   style: 'Smooth & Neutral (Bengali/Eng)' },
  { id: 'amit',    name: 'Amit',    gender: 'male',   style: 'Friendly & Casual' },
] as const;

type VoiceModelId = typeof VOICE_MODELS[number]['id'];

const MAX_PERSONA_CHARS = 4000;

export function KnowledgeBaseView() {
  const [activeTab, setActiveTab] = useState<'persona' | 'rag' | 'faq'>('persona');
  const [documents, setDocuments] = useState<RagDocumentDto[]>([]);
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [_planLocked, setPlanLocked] = useState(false);

  // ── AI Persona State ──
  const [personaPrompt, setPersonaPrompt] = useState('');
  const [savedPersona, setSavedPersona] = useState('');
  const [personaUpdatedAt, setPersonaUpdatedAt] = useState<string | null>(null);
  const [personaUpdatedBy, setPersonaUpdatedBy] = useState<string | null>(null);
  const [personaLoading, setPersonaLoading] = useState(true);
  const [personaSaving, setPersonaSaving] = useState(false);
  const [personaToast, setPersonaToast] = useState<string | null>(null);
  const [personaError, setPersonaError] = useState<string | null>(null);

  // ── Voice Assistant Persona State ──
  const [voiceAssistantName, setVoiceAssistantName] = useState('Priya');
  const [savedVoiceAssistantName, setSavedVoiceAssistantName] = useState('Priya');
  const [voiceGreetingText, setVoiceGreetingText] = useState('Hello! How can I help you today?');
  const [savedVoiceGreetingText, setSavedVoiceGreetingText] = useState('Hello! How can I help you today?');
  const [voicePersonaPrompt, setVoicePersonaPrompt] = useState('');
  const [savedVoicePersonaPrompt, setSavedVoicePersonaPrompt] = useState('');
  const [ttsVoiceId, setTtsVoiceId] = useState<VoiceModelId>('simran');
  const [savedTtsVoiceId, setSavedTtsVoiceId] = useState<VoiceModelId>('simran');
  const [voiceLoading, setVoiceLoading] = useState(true);
  const [voiceSaving, setVoiceSaving] = useState(false);
  const [voiceToast, setVoiceToast] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [showVoiceTemplates, setShowVoiceTemplates] = useState(false);

  const voiceDirty =
    voiceAssistantName !== savedVoiceAssistantName ||
    voiceGreetingText !== savedVoiceGreetingText ||
    voicePersonaPrompt !== savedVoicePersonaPrompt ||
    ttsVoiceId !== savedTtsVoiceId;
  const voiceCharOverLimit = voicePersonaPrompt.length > MAX_PERSONA_CHARS;

  // Status & Notifications
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load AI Persona from backend
  const loadPersona = useCallback(async () => {
    setPersonaLoading(true);
    setPersonaError(null);
    const res = await apiFetch<PersonaDto>(`/api/v1/settings/ai/persona?t=${Date.now()}`);
    setPersonaLoading(false);
    if (res.data) {
      const val = res.data.aiPersonaPrompt || '';
      setPersonaPrompt(val);
      setSavedPersona(val);
      setPersonaUpdatedAt(res.data.updatedAt || null);
      setPersonaUpdatedBy(res.data.updatedBy || null);
    } else if (res.error) {
      setPersonaError(res.error);
    }
  }, []);

  // Load Voice Persona from backend
  const loadVoicePersona = useCallback(async () => {
    setVoiceLoading(true);
    setVoiceError(null);
    const res = await fetchVoiceConfig();
    setVoiceLoading(false);
    if (res.data) {
      const name = res.data.assistantName || 'Priya';
      const greeting = res.data.greetingText || 'Hello! How can I help you today?';
      const prompt = res.data.personaPrompt || '';
      const voiceId = (res.data.ttsVoiceId as VoiceModelId) || 'simran';
      setVoiceAssistantName(name);
      setSavedVoiceAssistantName(name);
      setVoiceGreetingText(greeting);
      setSavedVoiceGreetingText(greeting);
      setVoicePersonaPrompt(prompt);
      setSavedVoicePersonaPrompt(prompt);
      setTtsVoiceId(voiceId);
      setSavedTtsVoiceId(voiceId);
    } else if (res.error) {
      setVoiceError(res.error);
    }
  }, []);

  const loadDocuments = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const res = await apiFetch<RagDocumentDto[]>('/api/v1/rag/documents');
    if (!silent) setLoading(false);
    if (res.data) {
      setDocuments(res.data);
    }
  }, []);

  // ── FAQ State & Stats ──
  const [faqs, setFaqs] = useState<FaqItemDto[]>([]);

  const loadFaqs = useCallback(async () => {
    const res = await fetchFaqs();
    if (res.data) {
      setFaqs(res.data);
    }
  }, []);

  const faqStats = useMemo(() => {
    const activeCount = faqs.filter(f => f.isActive !== false).length;
    const totalHits = faqs.reduce((acc, f) => acc + (f.hitCount || 0), 0);
    const highHitCount = faqs.filter(f => (f.hitCount || 0) > 5).length;
    const categories = Array.from(new Set(['General', ...faqs.map(f => f.category || 'General')]));
    return { activeCount, totalHits, highHitCount, totalCategories: categories.length };
  }, [faqs]);

  useEffect(() => {
    Promise.all([
      fetchSubscriptionStatus(),
      loadPersona(),
      loadVoicePersona(),
      loadDocuments(),
      loadFaqs(),
    ]).then(([subRes]) => {
      if (subRes.data) {
        const isPaidPlan = subRes.data.planId === 'PRO' || subRes.data.planId === 'ENTERPRISE';
        const hasFeature = subRes.data.limits?.hasRagLlm !== false;
        setPlanLocked(!(isPaidPlan || hasFeature));
      }
    });
  }, [loadPersona, loadVoicePersona, loadDocuments, loadFaqs]);

  // Calculated Stats
  const totalChunks = useMemo(() => {
    return documents.reduce((sum, doc) => sum + (doc.totalChunks || 0), 0);
  }, [documents]);

  const activeVoiceName = useMemo(() => {
    const v = VOICE_MODELS.find(m => m.id === ttsVoiceId);
    return v ? `${v.name} (${v.gender === 'female' ? '♀' : '♂'})` : 'Simran (♀)';
  }, [ttsVoiceId]);

  const filteredDocuments = useMemo(() => {
    if (!docSearchQuery) return documents;
    return documents.filter(doc => doc.name.toLowerCase().includes(docSearchQuery.toLowerCase()));
  }, [documents, docSearchQuery]);

  // Save Persona Handler
  const handleSavePersona = async () => {
    if (personaPrompt.length > MAX_PERSONA_CHARS) {
      setPersonaError(`Persona prompt exceeds maximum character limit of ${MAX_PERSONA_CHARS} characters.`);
      return;
    }

    setPersonaSaving(true);
    setPersonaError(null);
    setPersonaToast(null);

    const res = await apiFetch<PersonaDto>('/api/v1/settings/ai/persona', {
      method: 'PUT',
      body: JSON.stringify({ aiPersonaPrompt: personaPrompt }),
    });

    setPersonaSaving(false);
    if (!res.error) {
      setSavedPersona(personaPrompt);
      setPersonaToast('AI Persona prompt saved successfully! Future AI responses will reflect this tone.');
      if (res.data?.updatedAt) setPersonaUpdatedAt(res.data.updatedAt);
      if (res.data?.updatedBy) setPersonaUpdatedBy(res.data.updatedBy);
      setTimeout(() => setPersonaToast(null), 4000);
    } else {
      setPersonaError(res.error);
    }
  };

  const handleSaveVoicePersona = async () => {
    if (voicePersonaPrompt.length > MAX_PERSONA_CHARS) {
      setVoiceError(`Voice persona prompt exceeds maximum character limit of ${MAX_PERSONA_CHARS} characters.`);
      return;
    }

    setVoiceSaving(true);
    setVoiceError(null);
    setVoiceToast(null);

    const res = await saveVoiceConfig({
      assistantName: voiceAssistantName,
      greetingText: voiceGreetingText,
      personaPrompt: voicePersonaPrompt,
      ttsVoiceId,
    });

    setVoiceSaving(false);
    if (!res.error) {
      if (res.data) {
        setSavedVoiceAssistantName(res.data.assistantName);
        setSavedVoiceGreetingText(res.data.greetingText);
        setSavedVoicePersonaPrompt(res.data.personaPrompt);
        const vid = (res.data.ttsVoiceId as VoiceModelId) || 'simran';
        setTtsVoiceId(vid);
        setSavedTtsVoiceId(vid);
      }
      setVoiceToast('Voice Assistant Persona saved successfully!');
      setTimeout(() => setVoiceToast(null), 4000);
    } else {
      setVoiceError(res.error);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setError('File size exceeds maximum limit of 20MB.');
      return;
    }

    setUploading(true);
    setMessage(null);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('crmlite_token') || '';
      const tenantId = localStorage.getItem('crmlite_tenant_id') || '';
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';

      const res = await fetch(`${baseUrl}/api/v1/rag/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          ...(tenantId ? { 'X-Tenant-ID': tenantId } : {}),
        },
        body: formData,
      });

      if (res.ok) {
        let docId: string | null = null;
        try {
          const body = await res.json();
          docId = body.documentId;
        } catch {
          // Fallback if not JSON
        }

        if (docId) {
          let isDone = false;
          while (!isDone) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const statusRes = await fetch(`${baseUrl}/api/v1/rag/status/${docId}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                ...(tenantId ? { 'X-Tenant-ID': tenantId } : {}),
              }
            });

            if (statusRes.ok) {
              const statusData = await statusRes.json();
              if (statusData.status === 'FAILED' || statusData.error) {
                isDone = true;
                setUploading(false);
                const code = statusData.errorCode ? ` [${statusData.errorCode}]` : '';
                setError(`Processing failed${code}: ${statusData.error || 'Unknown error'}`);
              } else if (statusData.status !== 'PROCESSING') {
                isDone = true;
                setUploading(false);
                setMessage(`Document "${file.name}" uploaded and indexed successfully!`);
                loadDocuments(true);
                setTimeout(() => setMessage(null), 4000);
              }
            } else {
              // Status endpoint error, fallback to reloading list
              isDone = true;
              setUploading(false);
              loadDocuments(true);
            }
          }
        } else {
          // Synchronous fallback
          setUploading(false);
          setMessage(`Document "${file.name}" uploaded successfully!`);
          loadDocuments(true);
          setTimeout(() => setMessage(null), 4000);
        }
      } else {
        setUploading(false);
        try {
          const errBody = await res.json();
          const code = errBody.errorCode ? ` [${errBody.errorCode}]` : '';
          setError(`Upload failed${code}: ${errBody.error || errBody.message || res.statusText}`);
        } catch {
          const errText = await res.text();
          setError(`Upload failed: ${errText}`);
        }
      }
    } catch (err: unknown) {
      setUploading(false);
      setError(`Network error: ${(err as Error).message}`);
    }
  };

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    docId: string;
    docName: string;
  }>({ isOpen: false, docId: '', docName: '' });

  const confirmDeleteDocument = async () => {
    const { docId, docName } = deleteModal;
    setDeleteModal({ isOpen: false, docId: '', docName: '' });
    if (!docId) return;

    const res = await apiFetch(`/api/v1/rag/documents/${docId}`, {
      method: 'DELETE',
    });

    if (!res.error) {
      setMessage(`Document "${docName}" deleted from RAG vector store.`);
      loadDocuments();
      setTimeout(() => setMessage(null), 4000);
    } else {
      setError(`Delete error: ${res.error}`);
    }
  };

  const handleDownloadDocument = async (docId: string, docName?: string) => {
    const token = localStorage.getItem('crmlite_token') || '';
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    try {
      const response = await fetch(`${baseUrl}/api/v1/rag/documents/${docId}/download`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = docName ? (docName.endsWith('.txt') ? docName : `${docName}.txt`) : `document_${docId}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.warn('Blob download failed, falling back to direct window open:', err);
      window.open(`${baseUrl}/api/v1/rag/documents/${docId}/download?access_token=${token}`, '_blank');
    }
  };

  const personaDirty = personaPrompt !== savedPersona;
  const charsRemaining = MAX_PERSONA_CHARS - personaPrompt.length;

  return (
    <div className="mx-auto max-w-7xl p-3 sm:p-6 lg:p-8 space-y-6">
      {/* Top Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-base-c/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-soft">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-primary-c tracking-tight">
                AI Knowledge Base &amp; RAG Analytics
              </h1>
              <p className="text-xs text-muted-c">
                Configure your tenant AI brand persona, trained document vector embeddings, and voice bot capabilities.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => { loadPersona(); loadVoicePersona(); loadDocuments(); }}
            className="flex items-center gap-1.5 rounded-xl border border-base-c/80 bg-card-c px-3.5 py-2 text-xs font-semibold text-primary-c hover:bg-slate-100 dark:hover:bg-ink-800 transition-all shadow-xs"
          >
            <RefreshCw className={cx('h-3.5 w-3.5 text-muted-c', (loading || personaLoading || voiceLoading) && 'animate-spin')} />
            Sync Knowledge
          </button>
        </div>
      </div>

      {/* ── STATS & ANALYTICS CARDS (Persistent Across All Tabs) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total FAQs */}
        <div className="relative overflow-hidden rounded-2xl border border-base-c/80 bg-card-c p-4 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between text-muted-c text-xs font-semibold">
            <span>Total FAQs</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <HelpCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-primary-c tabular-nums">{faqs.length}</span>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              {faqStats.activeCount} Active
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-c">Indexed in fast-path vector search</p>
        </div>

        {/* Card 2: RAG Documents & Chunks */}
        <div className="relative overflow-hidden rounded-2xl border border-base-c/80 bg-card-c p-4 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between text-muted-c text-xs font-semibold">
            <span>RAG Documents &amp; Chunks</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-primary-c tabular-nums">{documents.length} Docs</span>
            <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
              {totalChunks} Chunks
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-c">Quantized MiniLM-L6-v2 vector store</p>
        </div>

        {/* Card 3: Total Match Hits */}
        <div className="relative overflow-hidden rounded-2xl border border-base-c/80 bg-card-c p-4 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between text-muted-c text-xs font-semibold">
            <span>Total Match Hits</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-primary-c tabular-nums">{faqStats.totalHits}</span>
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center">
              <ArrowUpRight className="h-3 w-3" /> Zero API Cost
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-c">≥85% vector similarity fast-path</p>
        </div>

        {/* Card 4: Voice Engine & Categories */}
        <div className="relative overflow-hidden rounded-2xl border border-base-c/80 bg-card-c p-4 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between text-muted-c text-xs font-semibold">
            <span>Voice Engine &amp; Categories</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Mic className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-lg font-black text-primary-c truncate max-w-[140px]">{voiceAssistantName}</span>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
              {faqStats.totalCategories} Categories
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-c truncate">
            {activeVoiceName} · Deepgram &amp; Sarvam
          </p>
        </div>
      </div>

      {/* Enterprise Tab Bar */}
      <TabSwitcher
        tabs={[
          { id: 'persona', label: 'AI Persona & Voice Engine', icon: <Brain className="h-4 w-4" /> },
          { id: 'rag', label: `Document Embeddings (${documents.length})`, icon: <FileText className="h-4 w-4 text-indigo-500" /> },
          { id: 'faq', label: 'Structured Q&A Knowledge', icon: <HelpCircle className="h-4 w-4" /> }
        ]}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as 'persona' | 'rag' | 'faq')}
        className="w-full justify-between [&>button]:flex-1 bg-slate-100/80 dark:bg-ink-900/60 p-1 rounded-xl"
      />

      {/* ── TAB 1: AI PERSONA & VOICE ── */}
      {activeTab === 'persona' && (
        <div className="space-y-5 animate-fade-in">
          {personaToast && (
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{personaToast}</span>
            </div>
          )}

          {personaError && (
            <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs font-semibold text-rose-700 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{personaError}</span>
            </div>
          )}

          {/* Architecture Banner */}
          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white shadow-soft">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-extrabold text-primary-c">
                  Layered Enterprise System Prompt Architecture
                </h3>
                <p className="text-[11px] text-muted-c leading-relaxed">
                  Your core AI behavior follows strict safety guidelines. The tenant persona below instructs the AI on brand voice, specific business policies, tone, and greetings while preserving strict system safety rules.
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                  <span className="rounded-md bg-card-c px-2 py-0.5 text-primary-c border border-base-c">1. Base Safety System Prompt</span>
                  <span className="text-muted-c">→</span>
                  <span className="rounded-md bg-purple-600 text-white px-2 py-0.5 shadow-xs">2. Tenant Persona (Custom Below)</span>
                  <span className="text-muted-c">→</span>
                  <span className="rounded-md bg-card-c px-2 py-0.5 text-primary-c border border-base-c">3. RAG Knowledge Embeddings</span>
                  <span className="text-muted-c">→</span>
                  <span className="rounded-md bg-card-c px-2 py-0.5 text-primary-c border border-base-c">4. User Query</span>
                </div>
              </div>
            </div>
          </div>

          {/* Persona Editor Card */}
          <div className="rounded-2xl border border-base-c/80 bg-card-c p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-primary-c flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-purple-600" />
                  Custom AI Brand Persona &amp; Tone Instructions
                </h3>
                <p className="text-xs text-muted-c">
                  Write detailed instructions defining how the AI should introduce itself, answer questions, and handle leads.
                </p>
              </div>

              {/* Industry Preset Selector Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-muted-c">Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  {PERSONA_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPersonaPrompt(tmpl.prompt)}
                      className="rounded-lg border border-base-c/80 bg-slate-100/60 dark:bg-ink-850 px-2.5 py-1 text-[11px] font-semibold text-primary-c hover:border-purple-500 hover:bg-purple-500/10 transition-all"
                      title="Apply preset prompt"
                    >
                      {tmpl.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Textarea */}
            <div className="relative">
              {personaLoading ? (
                <div className="flex items-center justify-center py-16 border border-base-c/80 rounded-xl bg-slate-50 dark:bg-ink-950">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                  <span className="ml-2 text-xs text-muted-c">Loading AI Persona configuration...</span>
                </div>
              ) : (
                <>
                  <textarea
                    rows={8}
                    value={personaPrompt}
                    onChange={(e) => setPersonaPrompt(e.target.value)}
                    placeholder="e.g. You are a knowledgeable assistant for GyanVaniAi Connect. Always maintain a warm, helpful, and professional tone. Highlight pricing details and urge leads to schedule a live product demo..."
                    className="w-full rounded-xl border border-base-c/80 bg-slate-50/50 p-4 text-xs text-primary-c focus:border-purple-500 focus:bg-card-c focus:outline-none dark:bg-ink-950 font-mono leading-relaxed"
                  />
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-3 text-muted-c">
                      {personaUpdatedAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Updated: {new Date(personaUpdatedAt).toLocaleString()}
                        </span>
                      )}
                      {personaUpdatedBy && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" /> By User #{personaUpdatedBy}
                        </span>
                      )}
                    </div>
                    <span className={cx('font-semibold tabular-nums', charsRemaining < 200 ? 'text-amber-600 font-bold' : 'text-muted-c')}>
                      {charsRemaining.toLocaleString()} / {MAX_PERSONA_CHARS.toLocaleString()} chars remaining
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between border-t border-base-c/80 pt-4">
              <button
                onClick={() => setPersonaPrompt(savedPersona)}
                disabled={!personaDirty || personaSaving}
                className="flex items-center gap-1.5 rounded-xl border border-base-c/80 bg-card-c px-3.5 py-2 text-xs font-semibold text-primary-c hover:bg-slate-100 dark:hover:bg-ink-800 disabled:opacity-40 transition-all"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Revert Changes
              </button>

              <button
                onClick={handleSavePersona}
                disabled={!personaDirty || personaSaving || charsRemaining < 0}
                className="flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 px-5 py-2 text-xs font-bold text-white shadow-soft disabled:opacity-40 transition-all"
              >
                {personaSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Text Persona
              </button>
            </div>
          </div>

          {/* ─── Voice Assistant Persona Section ─── */}
          <div className="rounded-2xl border border-base-c/80 bg-card-c p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-primary-c flex items-center gap-2">
                  <Mic className="h-4 w-4 text-indigo-600" />
                  Voice Assistant Persona &amp; Voice Engine
                </h3>
                <p className="text-xs text-muted-c">
                  Configure your voice assistant's name, spoken persona, and cadence for voice calls.
                </p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                <Radio className="h-3 w-3 animate-pulse text-indigo-500" />
                <span>Deepgram + Sarvam HD</span>
              </div>
            </div>

            {voiceToast && (
              <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{voiceToast}</span>
              </div>
            )}

            {voiceError && (
              <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs font-semibold text-rose-700 dark:text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{voiceError}</span>
              </div>
            )}

            {voiceLoading ? (
              <div className="flex items-center justify-center py-12 border border-base-c/80 rounded-xl bg-slate-50 dark:bg-ink-950">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                <span className="ml-2 text-xs text-muted-c">Loading Voice Assistant settings...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Voice info alert */}
                <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3.5">
                  <p className="text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed">
                    <strong>Spoken Cadence Rule:</strong> Voice assistants speak in <strong>1 to 2 short sentences</strong> (under 35 words) in clear, natural spoken language so callers enjoy a fast, professional voice experience.
                  </p>
                </div>

                {/* Assistant Name Input */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-primary-c">
                      Voice Assistant Name
                    </label>
                    <input
                      type="text"
                      value={voiceAssistantName}
                      onChange={(e) => setVoiceAssistantName(e.target.value)}
                      placeholder="e.g. Priya, Riya, Ananya"
                      maxLength={50}
                      className="w-full rounded-xl border border-base-c bg-card-c p-2.5 text-xs text-primary-c focus:border-indigo-500 focus:outline-none"
                    />
                    <p className="mt-1 text-[11px] text-muted-c">
                      The bot will introduce itself with this name during calls.
                    </p>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-primary-c">
                      Speech Engine &amp; Voice Model
                    </label>
                    <div className="flex items-center gap-2 rounded-xl border border-base-c bg-slate-50/60 dark:bg-ink-900/50 p-2.5 text-xs text-primary-c">
                      <Volume2 className="h-4 w-4 text-indigo-500 shrink-0" />
                      <span className="font-medium">Deepgram Nova-2 + Sarvam AI &bull; 24kHz HD</span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-c">
                      High-speed enterprise STT/TTS with sub-second latency.
                    </p>
                  </div>
                </div>

                {/* Voice Templates */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowVoiceTemplates(!showVoiceTemplates)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <Wand2 className="h-3.5 w-3.5" />
                    {showVoiceTemplates ? 'Hide Voice Templates' : 'Choose from Voice Persona Templates'}
                    {showVoiceTemplates ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>

                  {showVoiceTemplates && (
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {VOICE_PERSONA_TEMPLATES.map((t) => (
                        <button
                          key={t.label}
                          type="button"
                          onClick={() => {
                            setVoiceAssistantName(t.name);
                            setVoicePersonaPrompt(t.prompt);
                            setShowVoiceTemplates(false);
                          }}
                          className="rounded-xl border border-base-c bg-slate-50/70 p-3 text-left hover:border-indigo-500/40 hover:bg-indigo-500/10 dark:bg-ink-900 transition-all"
                        >
                          <span className="text-xs font-bold text-primary-c">{t.label}</span>
                          <p className="mt-1 text-[11px] text-muted-c line-clamp-2">{t.prompt}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* ─── Voice Model Picker (Male / Female) ─── */}
                <div className="pt-2">
                  <div className="mb-2 flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-indigo-500" />
                    <span className="text-xs font-semibold text-primary-c">Voice Model</span>
                    <span className="ml-auto text-[11px] text-muted-c">Sarvam AI · Multilingual HD</span>
                  </div>

                  {/* Female voices */}
                  <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-pink-500">
                    <span>♀</span> Female Voices
                  </p>
                  <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                    {VOICE_MODELS.filter(v => v.gender === 'female').map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setTtsVoiceId(v.id as VoiceModelId)}
                        className={cx(
                          'relative flex flex-col gap-1 rounded-xl border p-3 text-left transition-all',
                          ttsVoiceId === v.id
                            ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-400/30'
                            : 'border-base-c bg-card-c hover:border-indigo-300 hover:bg-indigo-500/5'
                        )}
                      >
                        {ttsVoiceId === v.id && (
                          <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500">
                            <Check className="h-2.5 w-2.5 text-white" />
                          </span>
                        )}
                        <span className="text-sm font-bold text-primary-c">{v.name}</span>
                        <span className="text-[10px] leading-tight text-muted-c">{v.style}</span>
                      </button>
                    ))}
                  </div>

                  {/* Male voices */}
                  <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-sky-500">
                    <span>♂</span> Male Voices
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {VOICE_MODELS.filter(v => v.gender === 'male').map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setTtsVoiceId(v.id as VoiceModelId)}
                        className={cx(
                          'relative flex flex-col gap-1 rounded-xl border p-3 text-left transition-all',
                          ttsVoiceId === v.id
                            ? 'border-sky-500 bg-sky-500/10 ring-2 ring-sky-400/30'
                            : 'border-base-c bg-card-c hover:border-sky-300 hover:bg-sky-500/5'
                        )}
                      >
                        {ttsVoiceId === v.id && (
                          <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-sky-500">
                            <Check className="h-2.5 w-2.5 text-white" />
                          </span>
                        )}
                        <span className="text-sm font-bold text-primary-c">{v.name}</span>
                        <span className="text-[10px] leading-tight text-muted-c">{v.style}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Voice Persona Instructions Textarea */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-primary-c">
                    Voice Spoken Instructions &amp; Persona
                  </label>
                  <textarea
                    value={voicePersonaPrompt}
                    onChange={(e) => setVoicePersonaPrompt(e.target.value)}
                    rows={4}
                    placeholder="e.g. You are Priya, speaking warmly as the front-desk assistant of our business. Greet customers with 'Haan ji' or 'Hello', keep answers under 25 words, and politely ask how you can help them book..."
                    className={cx(
                      'w-full rounded-xl border bg-card-c p-3.5 text-xs text-primary-c leading-relaxed focus:outline-none transition-colors',
                      voiceCharOverLimit
                        ? 'border-rose-400 focus:border-rose-500'
                        : 'border-base-c focus:border-indigo-500'
                    )}
                  />
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-[11px] text-muted-c">
                      {voicePersonaPrompt.trim() ? 'Custom voice persona active' : 'Using default spoken receptionist persona'}
                    </p>
                    <span className={cx(
                      'text-[11px] font-medium tabular-nums',
                      voiceCharOverLimit ? 'text-rose-500 font-bold' : 'text-muted-c'
                    )}>
                      {voicePersonaPrompt.length.toLocaleString()} / {MAX_PERSONA_CHARS.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="flex items-center justify-between border-t border-base-c/80 pt-4">
                  <button
                    onClick={() => {
                      setVoiceAssistantName(savedVoiceAssistantName);
                      setVoicePersonaPrompt(savedVoicePersonaPrompt);
                    }}
                    disabled={!voiceDirty || voiceSaving}
                    className="flex items-center gap-1.5 rounded-xl border border-base-c bg-card-c px-3.5 py-2 text-xs font-semibold text-primary-c hover:bg-slate-100 dark:hover:bg-ink-800 disabled:opacity-40 transition-all"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Revert Changes
                  </button>

                  <button
                    onClick={handleSaveVoicePersona}
                    disabled={!voiceDirty || voiceSaving || voiceCharOverLimit}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2 text-xs font-bold text-white shadow-soft disabled:opacity-40 transition-all"
                  >
                    {voiceSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Voice Persona
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: DOCUMENT EMBEDDINGS (RAG) ── */}
      {activeTab === 'rag' && (
        <div className="space-y-5 animate-fade-in">
          {message && (
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs font-semibold text-rose-700 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Upload Drop Zone Card */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
            }}
            className={cx(
              'flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition-all',
              dragOver
                ? 'border-indigo-500 bg-indigo-500/10 scale-[1.005]'
                : 'border-base-c/80 bg-card-c/90 shadow-xs'
            )}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              accept=".pdf,.txt,.docx,.csv,.md,.xlsx,.xls,.html,.htm,.json"
              className="hidden"
            />
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-soft mb-3">
              {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
            </div>
            <h3 className="text-base font-bold text-primary-c">
              {uploading ? 'Processing & Parsing Document Embeddings…' : 'Upload Vector Knowledge Document'}
            </h3>
            <p className="mt-1 text-xs text-muted-c max-w-md leading-relaxed">
              Drag &amp; drop PDF, DOCX, TXT, CSV, Excel, HTML, or JSON files (max 20MB). Text is automatically split into 384-dim Float32 vector embeddings.
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-[10px] font-bold">
              <span className="rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 border border-indigo-500/20">PDF</span>
              <span className="rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 border border-blue-500/20">DOCX</span>
              <span className="rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-0.5 border border-purple-500/20">TXT</span>
              <span className="rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 border border-emerald-500/20">CSV</span>
              <span className="rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 border border-amber-500/20">MD</span>
              <span className="rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 px-2 py-0.5 border border-teal-500/20">XLSX</span>
              <span className="rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2 py-0.5 border border-orange-500/20">HTML</span>
              <span className="rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 px-2 py-0.5 border border-cyan-500/20">JSON</span>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="mt-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-xs font-bold text-white shadow-soft transition-all disabled:opacity-50 btn-tactile"
            >
              Select Document from Computer
            </button>
          </div>

          {/* RAG Vector Documents Table Container */}
          <div className="rounded-2xl border border-base-c/80 bg-card-c overflow-hidden shadow-xs space-y-0">
            {/* Header & Search Bar */}
            <div className="p-4 border-b border-base-c/80 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-100/50 dark:bg-ink-950/40">
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-indigo-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary-c">
                  Trained Vector Documents ({documents.length})
                </h3>
                <span className="rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 text-[10px] font-bold">
                  MiniLM-L6-v2 · 384 Dim
                </span>
              </div>

              {/* Search documents */}
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-c" />
                <input
                  type="text"
                  value={docSearchQuery}
                  onChange={(e) => setDocSearchQuery(e.target.value)}
                  placeholder="Filter documents by name..."
                  className="w-full rounded-xl border border-base-c/80 bg-card-c pl-9 pr-3 py-1.5 text-xs text-primary-c placeholder:text-muted-c focus:border-indigo-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {(loading || uploading) ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                <span className="ml-2 text-xs text-muted-c">
                  {uploading ? 'Processing & indexing document embeddings...' : 'Fetching RAG document list...'}
                </span>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="py-16 text-center text-xs text-muted-c space-y-2">
                <FileText className="mx-auto h-10 w-10 text-muted-c/40" />
                <p className="font-bold text-primary-c">No vector documents found</p>
                <p className="text-[11px] text-muted-c max-w-xs mx-auto">
                  {docSearchQuery ? 'No document matched your filter query.' : 'Upload a PDF, TXT or DOCX document above to train your AI.'}
                </p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-base-c/80 bg-slate-100/60 dark:bg-ink-950/60 text-[11px] font-bold text-muted-c uppercase tracking-wider">
                      <th className="py-3.5 px-4 min-w-[220px]">Document Name</th>
                      <th className="py-3.5 px-4 w-32">Format</th>
                      <th className="py-3.5 px-4 w-36">Vector Chunks</th>
                      <th className="py-3.5 px-4 w-40">Embedding Model</th>
                      <th className="py-3.5 px-4 w-28">Status</th>
                      <th className="py-3.5 px-4 text-right w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-base-c/70">
                    {filteredDocuments.map((doc) => {
                      const ext = doc.name.split('.').pop()?.toUpperCase() || 'FILE';
                      const extColor =
                        ext === 'PDF' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' :
                        ext === 'DOCX' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' :
                        ext === 'CSV' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                        'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';

                      return (
                        <tr key={doc.documentId} className="hover:bg-slate-100/50 dark:hover:bg-ink-850/40 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-primary-c flex items-center gap-2.5">
                            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                              <FileText className="h-4 w-4" />
                            </div>
                            <span className="truncate max-w-sm">{doc.name}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={cx('inline-block rounded-md px-2 py-0.5 text-[10px] font-bold border', extColor)}>
                              {ext}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-semibold text-purple-600 dark:text-purple-400">
                            <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[11px]">
                              {doc.totalChunks} chunks
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-muted-c text-[11px]">
                            {doc.vectorModel || 'MiniLM-L6-v2'} ({doc.embeddingSize || 384}d)
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold">
                              <CheckCircle className="h-3 w-3" /> Indexed
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleDownloadDocument(doc.documentId, doc.name)}
                                className="rounded-lg border border-base-c/80 p-1.5 text-muted-c hover:text-indigo-600 hover:bg-indigo-500/10 transition-all"
                                title="Download document"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteModal({ isOpen: true, docId: doc.documentId, docName: doc.name })}
                                className="rounded-lg border border-base-c/80 p-1.5 text-muted-c hover:text-rose-600 hover:bg-rose-500/10 transition-all"
                                title="Delete vector document"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: FAQ KNOWLEDGE BASE ── */}
      {activeTab === 'faq' && (
        <div className="pt-2 animate-fade-in">
          <FaqManagementView />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete Vector Document"
        message={`Are you sure you want to remove "${deleteModal.docName}" from your RAG vector database?`}
        confirmText="Delete Document"
        variant="danger"
        onConfirm={confirmDeleteDocument}
        onCancel={() => setDeleteModal({ isOpen: false, docId: '', docName: '' })}
      />
    </div>
  );
}
