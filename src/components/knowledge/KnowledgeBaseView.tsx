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
import { Globe, Compass, Play, XCircle, ExternalLink, ShieldCheck, PieChart } from 'lucide-react';
import { InspectChunksModal } from './InspectChunksModal';
import {
  fetchTenantQuotas, submitCrawlJob, fetchCrawlJob, cancelCrawlJob, reindexDocument,
  type TenantRagQuotaDto, type CrawlJobDto
} from '@/lib/knowledgeBaseApi';

interface RagDocumentDto {
  documentId: string;
  name: string;
  totalChunks: number;
  embeddingSize: number;
  vectorModel: string;
}

interface PersonaDto {
  aiPersonaPrompt: string;
  aiEmailSentimentPrompt?: string;
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

export interface VoiceModelOption {
  id: string;
  name: string;
  gender: 'female' | 'male';
  style: string;
  badge?: string;
}

const VOICE_MODELS: readonly VoiceModelOption[] = [
  // ── Female Voices (Sarvam Bulbul V4 Flash) ──
  { id: 'simran_enhi_customer',     name: 'Simran',         gender: 'female', style: 'Warm & Professional (Hinglish Support)', badge: 'Default' },
  { id: 'simran_hi_assistant',      name: 'Simran (Hindi)', gender: 'female', style: 'Formal & Polite Assistant (Hindi)' },
  { id: 'ishita_enhi_customer',     name: 'Ishita',         gender: 'female', style: 'Soft & Empathetic (Hinglish/Eng)' },
  { id: 'ritu_hi_customer',         name: 'Ritu',           gender: 'female', style: 'Clear & Expressive (Hindi/Eng)' },
  { id: 'sanchita_hi_assistant',    name: 'Sanchita',       gender: 'female', style: 'Reassuring Helpdesk (Hindi/Eng)' },
  { id: 'neha_en_customer',         name: 'Neha',           gender: 'female', style: 'Direct Corporate Support (English)' },
  { id: 'roopa_hi_conversational',  name: 'Roopa',          gender: 'female', style: 'Friendly & Casual Chat (Hindi)' },
  { id: 'shalini_enhi_customer',    name: 'Shalini',        gender: 'female', style: 'Empathetic Customer Care (Hinglish)' },
  { id: 'aura-2-thalia-en',         name: 'Thalia (Deepgram)', gender: 'female', style: 'Ultra-Fast <90ms (Global English)', badge: 'Aura-2' },

  // ── Male Voices (Sarvam Bulbul V4 Flash) ──
  { id: 'shubh_enhi_customer',         name: 'Shubh',   gender: 'male', style: 'Confident & Friendly Support', badge: 'Popular' },
  { id: 'rahul_hi_conversational',     name: 'Rahul',   gender: 'male', style: 'Deep & Professional (Hindi/Eng)' },
  { id: 'aditya_hi_conversational',    name: 'Aditya',  gender: 'male', style: 'Energetic & Confident Sales (Hindi/Eng)' },
  { id: 'ratan_hi_customer_expressive',name: 'Ratan',   gender: 'male', style: 'Articulate & Trustworthy Desk (Hindi/Eng)' },
  { id: 'sunny_enhi_customer',         name: 'Sunny',   gender: 'male', style: 'Modern & Upbeat Telephony (Hinglish)' },
  { id: 'amit_hi_conversational',      name: 'Amit',    gender: 'male', style: 'Friendly & Casual Advisor (Hindi)' },
  { id: 'dev_en_conversational',       name: 'Dev',     gender: 'male', style: 'Smooth Corporate Executive (English)' },
  { id: 'rohan_en_recovery',           name: 'Rohan',   gender: 'male', style: 'Calm & Reassuring Guidance (English)' },
  { id: 'aura-2-apollo-en',            name: 'Apollo (Deepgram)', gender: 'male', style: 'Ultra-Fast <90ms (Global English)', badge: 'Aura-2' },
] as const;

type VoiceModelId = string;

const MAX_PERSONA_CHARS = 4000;

export function KnowledgeBaseView() {
  const [activeTab, setActiveTab] = useState<'persona' | 'rag' | 'crawler' | 'faq'>('persona');
  const [documents, setDocuments] = useState<RagDocumentDto[]>([]);
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [_planLocked, setPlanLocked] = useState(false);

  // ── Chunk Inspection Modal State ──
  const [inspectModal, setInspectModal] = useState<{
    isOpen: boolean;
    docId: string;
    docName: string;
  }>({ isOpen: false, docId: '', docName: '' });

  // ── Staged Re-indexing State ──
  const [reindexingDocId, setReindexingDocId] = useState<string | null>(null);

  // ── Web Crawler & Sitemap State ──
  const [quotas, setQuotas] = useState<TenantRagQuotaDto | null>(null);
  const [crawlUrl, setCrawlUrl] = useState('');
  const [crawlType, setCrawlType] = useState<'SINGLE_PAGE' | 'RECURSIVE_CRAWL' | 'SITEMAP_INDEX'>('SINGLE_PAGE');
  const [crawlSubmitting, setCrawlSubmitting] = useState(false);
  const [activeCrawlJob, setActiveCrawlJob] = useState<CrawlJobDto | null>(null);
  const [crawlError, setCrawlError] = useState<string | null>(null);
  const [crawlMessage, setCrawlMessage] = useState<string | null>(null);

  // ── AI Persona State ──
  const [personaPrompt, setPersonaPrompt] = useState('');
  const [savedPersona, setSavedPersona] = useState('');
  const [emailSentimentPrompt, setEmailSentimentPrompt] = useState('');
  const [savedEmailSentimentPrompt, setSavedEmailSentimentPrompt] = useState('');
  const [personaUpdatedAt, setPersonaUpdatedAt] = useState<string | null>(null);
  const [personaUpdatedBy, setPersonaUpdatedBy] = useState<string | null>(null);
  const [personaLoading, setPersonaLoading] = useState(true);
  const [personaSaving, setPersonaSaving] = useState(false);
  const [personaToast, setPersonaToast] = useState<string | null>(null);
  const [personaError, setPersonaError] = useState<string | null>(null);

  // ── Voice Assistant Persona State ──
  const [voiceAssistantName, setVoiceAssistantName] = useState('Simran');
  const [savedVoiceAssistantName, setSavedVoiceAssistantName] = useState('Simran');
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

  const handleSelectVoiceModel = (v: (typeof VOICE_MODELS)[number]) => {
    setTtsVoiceId(v.id as VoiceModelId);

    // Auto-harmonize assistant name and prompt greetings if current name matches a standard voice or default
    const isStandardName =
      !voiceAssistantName ||
      VOICE_MODELS.some((m) => m.name.toLowerCase() === voiceAssistantName.trim().toLowerCase()) ||
      voiceAssistantName.toLowerCase() === 'assistant' ||
      voiceAssistantName.toLowerCase() === 'priya';

    if (isStandardName) {
      setVoiceAssistantName(v.name);
      if (voicePersonaPrompt) {
        const harmonized = voicePersonaPrompt
          .replace(
            /\b(I['’]m|I\s+am|my\s+name\s+is|myself|this\s+is)\s+(?:Priya|Simran|Riya|Ananya|Aryan|Rahul|Rohan|Amit|Assistant)\b/gi,
            `$1 ${v.name}`
          )
          .replace(
            /\b(You\s+are|You['’]re)\s+(?:Priya|Simran|Riya|Ananya|Aryan|Rahul|Rohan|Amit|Assistant)\b/gi,
            `$1 ${v.name}`
          );
        setVoicePersonaPrompt(harmonized);
      }
    }
  };

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
      const emailVal = res.data.aiEmailSentimentPrompt || '';
      setPersonaPrompt(val);
      setSavedPersona(val);
      setEmailSentimentPrompt(emailVal);
      setSavedEmailSentimentPrompt(emailVal);
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
      const voiceId = (res.data.ttsVoiceId as VoiceModelId) || 'simran';
      const name = res.data.assistantName || (voiceId.charAt(0).toUpperCase() + voiceId.slice(1));
      const greeting = res.data.greetingText || 'Hello! How can I help you today?';
      const prompt = res.data.personaPrompt || '';
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

  const loadQuotas = useCallback(async () => {
    const res = await fetchTenantQuotas();
    if (res.data) {
      setQuotas(res.data);
    }
  }, []);

  // Poll active crawl job
  useEffect(() => {
    if (!activeCrawlJob) return;
    const isRunning = activeCrawlJob.status === 'QUEUED' || activeCrawlJob.status === 'CRAWLING' || activeCrawlJob.status === 'RETRYING';
    if (!isRunning) return;

    const interval = setInterval(async () => {
      const res = await fetchCrawlJob(activeCrawlJob.id);
      if (res.data) {
        setActiveCrawlJob(res.data);
        if (res.data.status === 'COMPLETED' || res.data.status === 'PARTIAL_SUCCESS') {
          loadDocuments(true);
          loadQuotas();
          setCrawlMessage(`Crawl completed! ${res.data.pagesCrawled} pages crawled, ${res.data.totalChunks} chunks generated.`);
          setTimeout(() => setCrawlMessage(null), 5000);
        } else if (res.data.status === 'FAILED') {
          loadQuotas();
          setCrawlError(res.data.errorMessage || 'Crawl job failed.');
        }
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [activeCrawlJob, loadDocuments, loadQuotas]);

  const handleStartCrawl = async () => {
    if (!crawlUrl.trim()) {
      setCrawlError('URL is required.');
      return;
    }
    setCrawlSubmitting(true);
    setCrawlError(null);
    setCrawlMessage(null);
    try {
      const res = await submitCrawlJob(crawlUrl.trim(), crawlType);
      if (res.data) {
        setCrawlMessage('Crawl job submitted and running in background...');
        setActiveCrawlJob({
          id: res.data.jobId,
          sourceUrl: res.data.sourceUrl,
          crawlType: res.data.crawlType,
          status: 'QUEUED',
          pagesDiscovered: 1,
          pagesCrawled: 0,
          pagesFailed: 0,
          totalChunks: 0,
          createdAt: new Date().toISOString(),
        });
        loadQuotas();
      } else if (res.error) {
        setCrawlError(res.error);
      }
    } catch (e: any) {
      setCrawlError(e.message || 'Failed to submit crawl job');
    } finally {
      setCrawlSubmitting(false);
    }
  };

  const handleCancelCrawl = async () => {
    if (!activeCrawlJob) return;
    try {
      await cancelCrawlJob(activeCrawlJob.id);
      setActiveCrawlJob(prev => prev ? { ...prev, status: 'CANCELLED' } : null);
      loadQuotas();
      setCrawlMessage('Crawl job cancelled.');
      setTimeout(() => setCrawlMessage(null), 3000);
    } catch (e: any) {
      setCrawlError(e.message || 'Failed to cancel crawl job');
    }
  };

  const handleReindex = async (docId: string) => {
    setReindexingDocId(docId);
    setError(null);
    setMessage(null);
    try {
      const res = await reindexDocument(docId);
      if (res.data) {
        setMessage(`Document reindexed successfully! Swapped to v${res.data.activeVersion} (${res.data.totalChunks} chunks).`);
        loadDocuments(true);
        setTimeout(() => setMessage(null), 4000);
      } else if (res.error) {
        setError(`Re-indexing failed: ${res.error}`);
      }
    } catch (e: any) {
      setError(`Re-indexing error: ${e.message}`);
    } finally {
      setReindexingDocId(null);
    }
  };

  useEffect(() => {
    Promise.all([
      fetchSubscriptionStatus(),
      loadPersona(),
      loadVoicePersona(),
      loadDocuments(),
      loadFaqs(),
      loadQuotas(),
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
    const v = VOICE_MODELS.find(m => m.id === ttsVoiceId || (ttsVoiceId === 'simran' && m.id === 'simran_enhi_customer'));
    return v ? `${v.name} (${v.gender === 'female' ? '♀' : '♂'})` : 'Simran (♀)';
  }, [ttsVoiceId]);

  const filteredDocuments = useMemo(() => {
    if (!docSearchQuery) return documents;
    return documents.filter(doc => (doc.name || '').toLowerCase().includes(docSearchQuery.toLowerCase()));
  }, [documents, docSearchQuery]);

  // Save Persona Handler
  const handleSavePersona = async () => {
    if (personaPrompt.length > MAX_PERSONA_CHARS || emailSentimentPrompt.length > MAX_PERSONA_CHARS) {
      setPersonaError(`Persona prompts exceed maximum character limit of ${MAX_PERSONA_CHARS} characters.`);
      return;
    }

    setPersonaSaving(true);
    setPersonaError(null);
    setPersonaToast(null);

    const res = await apiFetch<PersonaDto>('/api/v1/settings/ai/persona', {
      method: 'PUT',
      body: JSON.stringify({ aiPersonaPrompt: personaPrompt, aiEmailSentimentPrompt: emailSentimentPrompt }),
    });

    setPersonaSaving(false);
    if (!res.error) {
      setSavedPersona(personaPrompt);
      setSavedEmailSentimentPrompt(emailSentimentPrompt);
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

    const maxMb = quotas?.maxFileSizeMb || 20;
    if (file.size > maxMb * 1024 * 1024) {
      setError(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds your plan's maximum limit of ${maxMb}MB.`);
      return;
    }

    const maxDocs = quotas?.maxDocumentsLimit ?? 25;
    const currentDocs = quotas?.activeDocumentsCount ?? documents.length;
    if (currentDocs >= maxDocs) {
      setError(`Document limit reached (${currentDocs}/${maxDocs} documents). Please delete an older document or upgrade your subscription.`);
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
                loadQuotas();
              } else if (statusData.status !== 'PROCESSING') {
                isDone = true;
                setUploading(false);
                setMessage(`Document "${file.name}" uploaded and indexed successfully!`);
                loadDocuments(true);
                loadQuotas();
                setTimeout(() => setMessage(null), 4000);
              }
            } else {
              // Status endpoint error, fallback to reloading list
              isDone = true;
              setUploading(false);
              loadDocuments(true);
              loadQuotas();
            }
          }
        } else {
          // Synchronous fallback
          setUploading(false);
          setMessage(`Document "${file.name}" uploaded successfully!`);
          loadDocuments(true);
          loadQuotas();
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
      loadQuotas();
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

  const personaDirty = personaPrompt !== savedPersona || emailSentimentPrompt !== savedEmailSentimentPrompt;
  const charsRemaining = MAX_PERSONA_CHARS - personaPrompt.length;
  const sentimentCharsRemaining = MAX_PERSONA_CHARS - emailSentimentPrompt.length;

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
          { id: 'crawler', label: 'Web Crawler & Sitemap', icon: <Globe className="h-4 w-4 text-purple-500" /> },
          { id: 'faq', label: 'Structured Q&A Knowledge', icon: <HelpCircle className="h-4 w-4" /> }
        ]}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as 'persona' | 'rag' | 'crawler' | 'faq')}
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

            <div className="pt-2">
               <h3 className="text-sm font-bold text-primary-c flex items-center gap-2 mb-2">
                 <Brain className="h-4 w-4 text-emerald-600" />
                 Email Sentiment Analysis Prompt
               </h3>
               <p className="text-xs text-muted-c mb-3">
                 Configure how the AI classifies incoming email replies (e.g., Good, Neutral, Poor).
               </p>
               <div className="relative">
                 {personaLoading ? (
                   <div className="flex items-center justify-center py-8 border border-base-c/80 rounded-xl bg-slate-50 dark:bg-ink-950">
                     <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                   </div>
                 ) : (
                   <>
                     <textarea
                       rows={4}
                       value={emailSentimentPrompt}
                       onChange={(e) => setEmailSentimentPrompt(e.target.value)}
                       placeholder="e.g. Analyze the sentiment of the following customer email reply and classify it strictly as GOOD, NEUTRAL, or POOR."
                       className="w-full rounded-xl border border-base-c/80 bg-slate-50/50 p-4 text-xs text-primary-c focus:border-emerald-500 focus:bg-card-c focus:outline-none dark:bg-ink-950 font-mono leading-relaxed"
                     />
                     <div className="mt-2 flex items-center justify-end text-[11px]">
                       <span className={cx('font-semibold tabular-nums', sentimentCharsRemaining < 200 ? 'text-amber-600 font-bold' : 'text-muted-c')}>
                         {sentimentCharsRemaining.toLocaleString()} / {MAX_PERSONA_CHARS.toLocaleString()} chars remaining
                       </span>
                     </div>
                   </>
                 )}
               </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between border-t border-base-c/80 pt-4">
              <button
                onClick={() => { setPersonaPrompt(savedPersona); setEmailSentimentPrompt(savedEmailSentimentPrompt); }}
                disabled={!personaDirty || personaSaving}
                className="flex items-center gap-1.5 rounded-xl border border-base-c/80 bg-card-c px-3.5 py-2 text-xs font-semibold text-primary-c hover:bg-slate-100 dark:hover:bg-ink-800 disabled:opacity-40 transition-all"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Revert Changes
              </button>

              <button
                onClick={handleSavePersona}
                disabled={!personaDirty || personaSaving || charsRemaining < 0 || sentimentCharsRemaining < 0}
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
                <span>Deepgram Nova-3 + Sarvam V4 Flash</span>
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
                      <span className="font-medium">Deepgram Nova-3 + Sarvam Bulbul V4 Flash &bull; &lt;100ms HD</span>
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
                    <span className="ml-auto text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">Sarvam Bulbul V4 Flash &bull; &lt;250ms HD</span>
                  </div>

                  {/* Female voices */}
                  <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-pink-500">
                    <span>♀</span> Female Voices
                  </p>
                  <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {VOICE_MODELS.filter(v => v.gender === 'female').map((v) => {
                      const isSelected = ttsVoiceId === v.id || (v.id === 'simran_enhi_customer' && (!ttsVoiceId || ttsVoiceId === 'simran'));
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => handleSelectVoiceModel(v)}
                          className={cx(
                            'relative flex flex-col gap-1 rounded-xl border p-3 text-left transition-all',
                            isSelected
                              ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-400/30'
                              : 'border-base-c bg-card-c hover:border-indigo-300 hover:bg-indigo-500/5'
                          )}
                        >
                          {isSelected && (
                            <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500">
                              <Check className="h-2.5 w-2.5 text-white" />
                            </span>
                          )}
                          <div className="flex items-center gap-1.5 pr-4">
                            <span className="text-xs font-bold text-primary-c">{v.name}</span>
                            {v.badge && (
                              <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                {v.badge}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] leading-tight text-muted-c">{v.style}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Male voices */}
                  <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-sky-500">
                    <span>♂</span> Male Voices
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {VOICE_MODELS.filter(v => v.gender === 'male').map((v) => {
                      const isSelected = ttsVoiceId === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => handleSelectVoiceModel(v)}
                          className={cx(
                            'relative flex flex-col gap-1 rounded-xl border p-3 text-left transition-all',
                            isSelected
                              ? 'border-sky-500 bg-sky-500/10 ring-2 ring-sky-400/30'
                              : 'border-base-c bg-card-c hover:border-sky-300 hover:bg-sky-500/5'
                          )}
                        >
                          {isSelected && (
                            <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-sky-500">
                              <Check className="h-2.5 w-2.5 text-white" />
                            </span>
                          )}
                          <div className="flex items-center gap-1.5 pr-4">
                            <span className="text-xs font-bold text-primary-c">{v.name}</span>
                            {v.badge && (
                              <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                                {v.badge}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] leading-tight text-muted-c">{v.style}</span>
                        </button>
                      );
                    })}
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

          {/* Document Quota & Budget Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-base-c bg-card-c p-4 shadow-xs">
              <div className="flex items-center justify-between text-muted-c text-xs font-semibold">
                <span>Active Documents</span>
                <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-xl font-black text-primary-c">
                  {quotas?.activeDocumentsCount ?? documents.length} / {quotas?.maxDocumentsLimit ?? 25}
                </span>
                <span className={cx(
                  'text-[11px] font-bold',
                  (quotas?.activeDocumentsCount ?? documents.length) >= (quotas?.maxDocumentsLimit ?? 25)
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-indigo-600 dark:text-indigo-400'
                )}>
                  {Math.max(0, (quotas?.maxDocumentsLimit ?? 25) - (quotas?.activeDocumentsCount ?? documents.length))} slots left
                </span>
              </div>
              <div className="mt-2 w-full bg-slate-100 dark:bg-ink-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (((quotas?.activeDocumentsCount ?? documents.length)) / (quotas?.maxDocumentsLimit ?? 25)) * 100)}%`
                  }}
                />
              </div>
              <p className="mt-2 text-[10px] text-muted-c">
                Plan Limit: {quotas?.planId || 'GROWTH'} ({quotas?.maxDocumentsLimit ?? 25} max files)
              </p>
            </div>

            <div className="rounded-2xl border border-base-c bg-card-c p-4 shadow-xs">
              <div className="flex items-center justify-between text-muted-c text-xs font-semibold">
                <span>Monthly Chunks Budget</span>
                <Database className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-xl font-black text-primary-c">
                  {quotas ? quotas.monthlyChunksConsumed : 0} / {quotas ? quotas.monthlyChunkLimit : 2500}
                </span>
                <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
                  {quotas ? Math.max(0, quotas.monthlyChunkLimit - quotas.monthlyChunksConsumed) : 2500} available
                </span>
              </div>
              <div className="mt-2 w-full bg-slate-100 dark:bg-ink-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-purple-600 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, quotas ? (quotas.monthlyChunksConsumed / quotas.monthlyChunkLimit) * 100 : 0)}%`
                  }}
                />
              </div>
              <p className="mt-2 text-[10px] text-muted-c">Shared across File Ingestion &amp; Web Crawler</p>
            </div>

            <div className="rounded-2xl border border-base-c bg-card-c p-4 shadow-xs">
              <div className="flex items-center justify-between text-muted-c text-xs font-semibold">
                <span>Upload Allowance</span>
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="mt-2 space-y-1 text-[11px] text-muted-c">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="h-3 w-3" /> Max File Size: {quotas?.maxFileSizeMb ?? 20} MB
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="h-3 w-3" /> 8 Supported Formats (PDF/DOCX/TXT/etc)
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="h-3 w-3" /> Vector Model: MiniLM-L6-v2 (384d)
                </div>
              </div>
            </div>
          </div>

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
              Drag &amp; drop PDF, DOCX, TXT, CSV, Excel, HTML, or JSON files (max {quotas?.maxFileSizeMb ?? 20}MB). Text is automatically split into 384-dim Float32 vector embeddings.
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

            {Boolean(quotas?.maxDocumentsLimit && (quotas.activeDocumentsCount ?? documents.length) >= quotas.maxDocumentsLimit) && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Active document limit ({quotas?.maxDocumentsLimit}/{quotas?.maxDocumentsLimit}) reached. Please delete an older document or upgrade your subscription.</span>
              </div>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || Boolean(quotas?.maxDocumentsLimit && (quotas.activeDocumentsCount ?? documents.length) >= quotas.maxDocumentsLimit)}
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
                      const docDisplayName = doc.name || 'Untitled Document';
                      const ext = docDisplayName.includes('.') ? docDisplayName.split('.').pop()?.toUpperCase() || 'FILE' : 'DOC';
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
                            <span className="truncate max-w-sm">{docDisplayName}</span>
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
                                onClick={() => setInspectModal({ isOpen: true, docId: doc.documentId, docName: docDisplayName })}
                                className="rounded-lg border border-base-c/80 p-1.5 text-muted-c hover:text-purple-600 hover:bg-purple-500/10 transition-all shadow-2xs"
                                title="Inspect & Edit Individual Chunks"
                              >
                                <Layers className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleReindex(doc.documentId)}
                                disabled={reindexingDocId === doc.documentId}
                                className="rounded-lg border border-base-c/80 p-1.5 text-muted-c hover:text-indigo-600 hover:bg-indigo-500/10 transition-all shadow-2xs disabled:opacity-40"
                                title="Non-Destructive Staged Re-Index"
                              >
                                <RefreshCw className={cx('h-3.5 w-3.5', reindexingDocId === doc.documentId && 'animate-spin text-purple-600')} />
                              </button>
                              <button
                                onClick={() => handleDownloadDocument(doc.documentId, docDisplayName)}
                                className="rounded-lg border border-base-c/80 p-1.5 text-muted-c hover:text-indigo-600 hover:bg-indigo-500/10 transition-all shadow-2xs"
                                title="Download document text"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteModal({ isOpen: true, docId: doc.documentId, docName: docDisplayName })}
                                className="rounded-lg border border-base-c/80 p-1.5 text-muted-c hover:text-rose-600 hover:bg-rose-500/10 transition-all shadow-2xs"
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

      {/* ── TAB 3: WEB CRAWLER & SITEMAP INGESTION ── */}
      {activeTab === 'crawler' && (
        <div className="space-y-5 animate-fade-in">
          {crawlMessage && (
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{crawlMessage}</span>
            </div>
          )}

          {crawlError && (
            <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs font-semibold text-rose-700 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{crawlError}</span>
            </div>
          )}

          {/* Quota & Security Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-base-c bg-card-c p-4 shadow-xs">
              <div className="flex items-center justify-between text-muted-c text-xs font-semibold">
                <span>Daily Web Pages Quota</span>
                <Globe className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-xl font-black text-primary-c">
                  {quotas ? quotas.dailyPagesConsumed : 0} / {quotas ? quotas.dailyPageLimit : 50}
                </span>
                <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
                  {quotas ? Math.max(0, quotas.dailyPageLimit - quotas.dailyPagesConsumed) : 50} available
                </span>
              </div>
              <div className="mt-2 w-full bg-slate-100 dark:bg-ink-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-purple-600 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, quotas ? (quotas.dailyPagesConsumed / quotas.dailyPageLimit) * 100 : 0)}%`
                  }}
                />
              </div>
              <p className="mt-2 text-[10px] text-muted-c">Resets daily at midnight ({quotas?.timezone || 'UTC'})</p>
            </div>

            <div className="rounded-2xl border border-base-c bg-card-c p-4 shadow-xs">
              <div className="flex items-center justify-between text-muted-c text-xs font-semibold">
                <span>Monthly Chunks Budget</span>
                <Database className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-xl font-black text-primary-c">
                  {quotas ? quotas.monthlyChunksConsumed : 0} / {quotas ? quotas.monthlyChunkLimit : 2500}
                </span>
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                  {quotas ? Math.max(0, quotas.monthlyChunkLimit - quotas.monthlyChunksConsumed) : 2500} available
                </span>
              </div>
              <div className="mt-2 w-full bg-slate-100 dark:bg-ink-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, quotas ? (quotas.monthlyChunksConsumed / quotas.monthlyChunkLimit) * 100 : 0)}%`
                  }}
                />
              </div>
              <p className="mt-2 text-[10px] text-muted-c">Embedding vector calculation capacity</p>
            </div>

            <div className="rounded-2xl border border-base-c bg-card-c p-4 shadow-xs">
              <div className="flex items-center justify-between text-muted-c text-xs font-semibold">
                <span>Enterprise Guardrails</span>
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="mt-2 space-y-1 text-[11px] text-muted-c">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="h-3 w-3" /> Pinning DNS Resolver (Anti-SSRF)
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="h-3 w-3" /> Safe XML Decompression Bomb Guard
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="h-3 w-3" /> Monotonic 500ms Domain Politeness
                </div>
              </div>
            </div>
          </div>

          {/* Crawler Configuration Form */}
          <div className="rounded-2xl border border-base-c bg-card-c p-6 shadow-xs space-y-5">
            <div>
              <h3 className="text-sm font-bold text-primary-c flex items-center gap-2">
                <Globe className="h-4 w-4 text-purple-600" />
                Automated Web Crawler &amp; Sitemap Ingestion
              </h3>
              <p className="text-xs text-muted-c mt-0.5">
                Ingest live documentation, marketing websites, or complete XML sitemaps directly into your vector knowledge base.
              </p>
            </div>

            {/* URL Input */}
            <div>
              <label className="block text-xs font-semibold text-primary-c mb-1.5">
                Target Website or Sitemap URL
              </label>
              <div className="relative">
                <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-c" />
                <input
                  type="url"
                  value={crawlUrl}
                  onChange={(e) => setCrawlUrl(e.target.value)}
                  placeholder="https://example.com or https://example.com/sitemap.xml"
                  className="w-full rounded-xl border border-base-c bg-slate-50/50 dark:bg-ink-950/60 pl-9 pr-4 py-2.5 text-xs text-primary-c placeholder:text-muted-c focus:border-purple-500 focus:outline-none transition-colors"
                />
              </div>
              <p className="mt-1 text-[11px] text-muted-c">
                Only public HTTPS/HTTP endpoints on ports 80 and 443 are allowed. Private IP subnets and cloud metadata are strictly blocked.
              </p>
            </div>

            {/* Ingestion Mode Radio Cards */}
            <div>
              <label className="block text-xs font-semibold text-primary-c mb-2">
                Crawl Scope &amp; Discovery Strategy
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setCrawlType('SINGLE_PAGE')}
                  className={cx(
                    'p-3.5 rounded-xl border text-left transition-all',
                    crawlType === 'SINGLE_PAGE'
                      ? 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-400/20'
                      : 'border-base-c bg-card-c hover:border-purple-300'
                  )}
                >
                  <span className="text-xs font-bold text-primary-c block">Single Page</span>
                  <span className="text-[11px] text-muted-c mt-1 block">
                    Crawl only the exact URL entered without following outbound links. (1 page budget)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setCrawlType('RECURSIVE_CRAWL')}
                  className={cx(
                    'p-3.5 rounded-xl border text-left transition-all',
                    crawlType === 'RECURSIVE_CRAWL'
                      ? 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-400/20'
                      : 'border-base-c bg-card-c hover:border-purple-300'
                  )}
                >
                  <span className="text-xs font-bold text-primary-c block">Recursive Crawler</span>
                  <span className="text-[11px] text-muted-c mt-1 block">
                    Follow same-domain child &lt;a href&gt; links up to 50 pages maximum.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setCrawlType('SITEMAP_INDEX')}
                  className={cx(
                    'p-3.5 rounded-xl border text-left transition-all',
                    crawlType === 'SITEMAP_INDEX'
                      ? 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-400/20'
                      : 'border-base-c bg-card-c hover:border-purple-300'
                  )}
                >
                  <span className="text-xs font-bold text-primary-c block">Sitemap XML Parser</span>
                  <span className="text-[11px] text-muted-c mt-1 block">
                    Auto-parse &lt;urlset&gt; or &lt;sitemapindex&gt; (supporting .xml and .xml.gz).
                  </span>
                </button>
              </div>
            </div>

            {/* Pre-crawl Estimator Bar */}
            <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-muted-c">
                <Compass className="h-4 w-4 text-purple-600 shrink-0" />
                <span>
                  Budget Reservation:{' '}
                  <strong className="text-primary-c">
                    {crawlType === 'SINGLE_PAGE' ? '1 page (~10 chunks)' : 'Up to 50 pages (~500 chunks)'}
                  </strong>
                </span>
              </div>
              <button
                type="button"
                onClick={handleStartCrawl}
                disabled={crawlSubmitting || !crawlUrl.trim() || (activeCrawlJob && (activeCrawlJob.status === 'QUEUED' || activeCrawlJob.status === 'CRAWLING'))}
                className="flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 px-5 py-2 text-xs font-bold text-white shadow-soft transition-all disabled:opacity-40"
              >
                {crawlSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Start Ingestion
              </button>
            </div>
          </div>

          {/* Active / Recent Crawl Job Monitor */}
          {activeCrawlJob && (
            <div className="rounded-2xl border border-base-c bg-card-c p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-primary-c truncate max-w-md">
                      {activeCrawlJob.sourceUrl}
                    </h4>
                    <p className="text-[11px] text-muted-c">
                      Scope: {activeCrawlJob.crawlType} &bull; Started {new Date(activeCrawlJob.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={cx(
                    'rounded-full px-2.5 py-0.5 text-[10px] font-bold border flex items-center gap-1',
                    activeCrawlJob.status === 'CRAWLING' || activeCrawlJob.status === 'QUEUED'
                      ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      : activeCrawlJob.status === 'COMPLETED'
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      : activeCrawlJob.status === 'PARTIAL_SUCCESS'
                      ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
                      : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                  )}>
                    {(activeCrawlJob.status === 'CRAWLING' || activeCrawlJob.status === 'QUEUED') && (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    )}
                    {activeCrawlJob.status}
                  </span>

                  {(activeCrawlJob.status === 'CRAWLING' || activeCrawlJob.status === 'QUEUED') && (
                    <button
                      onClick={handleCancelCrawl}
                      className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-500/20 transition-colors"
                    >
                      Cancel Crawl
                    </button>
                  )}
                </div>
              </div>

              {/* Progress metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="rounded-xl border border-base-c/60 bg-slate-50/50 dark:bg-ink-950/40 p-3">
                  <span className="text-[10px] font-semibold text-muted-c block">Pages Discovered</span>
                  <span className="text-lg font-black text-primary-c mt-0.5 block">{activeCrawlJob.pagesDiscovered}</span>
                </div>
                <div className="rounded-xl border border-base-c/60 bg-slate-50/50 dark:bg-ink-950/40 p-3">
                  <span className="text-[10px] font-semibold text-muted-c block">Pages Crawled</span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">{activeCrawlJob.pagesCrawled}</span>
                </div>
                <div className="rounded-xl border border-base-c/60 bg-slate-50/50 dark:bg-ink-950/40 p-3">
                  <span className="text-[10px] font-semibold text-muted-c block">Pages Failed</span>
                  <span className="text-lg font-black text-rose-600 dark:text-rose-400 mt-0.5 block">{activeCrawlJob.pagesFailed}</span>
                </div>
                <div className="rounded-xl border border-base-c/60 bg-slate-50/50 dark:bg-ink-950/40 p-3">
                  <span className="text-[10px] font-semibold text-muted-c block">Vector Chunks Created</span>
                  <span className="text-lg font-black text-purple-600 dark:text-purple-400 mt-0.5 block">{activeCrawlJob.totalChunks}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 dark:bg-ink-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-purple-600 h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.round((activeCrawlJob.pagesCrawled / Math.max(1, activeCrawlJob.pagesDiscovered)) * 100))}%`
                  }}
                />
              </div>

              {/* Partial failures summary */}
              {activeCrawlJob.partialFailuresJson && activeCrawlJob.partialFailuresJson !== '[]' && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-xs space-y-1">
                  <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" /> Partial URL Failures Recorded
                  </span>
                  <p className="text-[11px] text-muted-c">
                    Some URLs could not be scraped (404, connection timeout) and were skipped while preserving successful pages.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: FAQ KNOWLEDGE BASE ── */}
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

      {/* Chunk Inspection & Editing Modal */}
      <InspectChunksModal
        isOpen={inspectModal.isOpen}
        docId={inspectModal.docId}
        docName={inspectModal.docName}
        onClose={() => setInspectModal({ isOpen: false, docId: '', docName: '' })}
        onChunksChanged={() => loadDocuments(true)}
      />
    </div>
  );
}
