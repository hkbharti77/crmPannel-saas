import { useState, useEffect, useRef, useCallback } from 'react';
import { cx } from '@/lib/types';
import {
  Brain, Upload, Trash2, Download, Check, AlertCircle, Loader2,
  FileText, Sparkles, Bot, RefreshCw, Layers, CheckCircle2, ShieldAlert, File, Info,
  Wand2, Save, RotateCcw, HelpCircle, MessageSquare, Tag, Sliders, CheckCircle, Clock, User
} from 'lucide-react';
import { TabSwitcher } from '@/components/ui/TabSwitcher';
import { apiFetch } from '@/lib/api';
import { fetchSubscriptionStatus } from '@/lib/billingApi';
import { FaqManagementView } from './FaqManagementView';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

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

const MAX_PERSONA_CHARS = 4000;

export function KnowledgeBaseView() {
  const [activeTab, setActiveTab] = useState<'persona' | 'rag' | 'faq'>('persona');
  const [documents, setDocuments] = useState<RagDocumentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [trainingText, setTrainingText] = useState('');
  const [training, setTraining] = useState(false);

  // ── AI Persona State ──
  const [personaPrompt, setPersonaPrompt] = useState('');
  const [savedPersona, setSavedPersona] = useState('');
  const [personaUpdatedAt, setPersonaUpdatedAt] = useState<string | null>(null);
  const [personaUpdatedBy, setPersonaUpdatedBy] = useState<string | null>(null);
  const [personaLoading, setPersonaLoading] = useState(true);
  const [personaSaving, setPersonaSaving] = useState(false);
  const [personaToast, setPersonaToast] = useState<string | null>(null);
  const [personaError, setPersonaError] = useState<string | null>(null);

  // Status & Notifications
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [planLocked, setPlanLocked] = useState(false);

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

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch<RagDocumentDto[]>('/api/v1/rag/documents');
    setLoading(false);
    if (res.data) {
      setDocuments(res.data);
    }
  }, []);

  useEffect(() => {
    Promise.all([
      fetchSubscriptionStatus(),
      loadPersona(),
      loadDocuments(),
    ]).then(([subRes]) => {
      if (subRes.data) {
        const isPaidPlan = subRes.data.planId === 'PRO' || subRes.data.planId === 'ENTERPRISE';
        const hasFeature = subRes.data.limits?.hasRagLlm !== false;
        setPlanLocked(!(isPaidPlan || hasFeature));
      }
    });
  }, [loadPersona, loadDocuments]);

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

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds maximum limit of 10MB.');
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

      const res = await fetch('http://localhost:8080/api/v1/rag/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          ...(tenantId ? { 'X-Tenant-ID': tenantId } : {}),
        },
        body: formData,
      });

      setUploading(false);
      if (res.ok) {
        setMessage(`Document "${file.name}" uploaded successfully! RAG vector embeddings generated.`);
        loadDocuments();
        setTimeout(() => setMessage(null), 4000);
      } else {
        const errText = await res.text();
        setError(`Upload failed: ${errText}`);
      }
    } catch (err: any) {
      setUploading(false);
      setError(`Network error: ${err.message}`);
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

  const handleDownloadDocument = (docId: string) => {
    const token = localStorage.getItem('crmlite_token') || '';
    window.open(`http://localhost:8080/api/v1/rag/documents/${docId}/download?access_token=${token}`, '_blank');
  };

  const personaDirty = personaPrompt !== savedPersona;
  const charsRemaining = MAX_PERSONA_CHARS - personaPrompt.length;

  return (
    <div className="mx-auto max-w-6xl p-4 lg:p-8 space-y-6">
      {/* Top Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              AI Persona &amp; Knowledge Base
            </h1>
            <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 px-2.5 py-0.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
              Enterprise RAG Engine
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Define your dynamic tenant AI persona, upload vector PDF policy documents, and manage instant FAQ knowledge.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => { loadPersona(); loadDocuments(); }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-xs"
          >
            <RefreshCw className={cx('h-3.5 w-3.5 text-slate-400', (loading || personaLoading) && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </div>

      {/* Enterprise Tab Bar */}
      <TabSwitcher
        tabs={[
          { id: 'persona', label: 'AI Persona & Tone Rules', icon: <Brain className="h-4 w-4" /> },
          { id: 'rag', label: `Document Embeddings (${documents.length})`, icon: <FileText className="h-4 w-4" /> },
          { id: 'faq', label: 'Structured Q&A', icon: <HelpCircle className="h-4 w-4" /> }
        ]}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as 'persona' | 'rag' | 'faq')}
        className="w-full justify-between [&>button]:flex-1"
      />
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
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 dark:border-indigo-950/60 dark:bg-indigo-950/30 p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white shadow-xs">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-extrabold text-indigo-900 dark:text-indigo-200">
                  Layered Enterprise System Prompt Architecture
                </h3>
                <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80 leading-relaxed">
                  Your core AI behavior follows strict safety guidelines. The tenant persona below instructs the AI on brand voice, specific business policies, tone, and greetings while preserving strict system rules.
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                  <span className="rounded-md bg-white/80 dark:bg-indigo-900/80 px-2 py-0.5 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">1. Base Safety System Prompt</span>
                  <span className="text-indigo-400">→</span>
                  <span className="rounded-md bg-purple-600 text-white px-2 py-0.5 shadow-xs">2. Tenant Persona (Custom Below)</span>
                  <span className="text-indigo-400">→</span>
                  <span className="rounded-md bg-white/80 dark:bg-indigo-900/80 px-2 py-0.5 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">3. RAG Knowledge Embeddings</span>
                  <span className="text-indigo-400">→</span>
                  <span className="rounded-md bg-white/80 dark:bg-indigo-900/80 px-2 py-0.5 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">4. User Query</span>
                </div>
              </div>
            </div>
          </div>

          {/* Persona Editor Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-purple-600" />
                  Custom AI Brand Persona &amp; Tone Instructions
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Write detailed instructions defining how the AI should introduce itself, answer questions, and handle leads.
                </p>
              </div>

              {/* Industry Preset Selector Button */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  {PERSONA_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPersonaPrompt(tmpl.prompt)}
                      className="rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-all"
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
                <div className="flex items-center justify-center py-16 border border-slate-200 rounded-xl bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                  <span className="ml-2 text-xs text-slate-500">Loading AI Persona configuration...</span>
                </div>
              ) : (
                <>
                  <textarea
                    rows={8}
                    value={personaPrompt}
                    onChange={(e) => setPersonaPrompt(e.target.value)}
                    placeholder="e.g. You are a knowledgeable assistant for GyanVaniAi Connect. Always maintain a warm, helpful, and professional tone. Highlight pricing details and urge leads to schedule a live product demo..."
                    className="w-full rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 text-xs text-slate-800 focus:border-purple-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-purple-400 font-mono leading-relaxed"
                  />
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-3 text-slate-400">
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
                    <span className={cx('font-semibold tabular-nums', charsRemaining < 200 ? 'text-amber-600 font-bold' : 'text-slate-400')}>
                      {charsRemaining.toLocaleString()} / {MAX_PERSONA_CHARS.toLocaleString()} chars remaining
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
              <button
                onClick={() => setPersonaPrompt(savedPersona)}
                disabled={!personaDirty || personaSaving}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-40 transition-all"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Revert Changes
              </button>

              <button
                onClick={handleSavePersona}
                disabled={!personaDirty || personaSaving || charsRemaining < 0}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:from-indigo-700 hover:to-purple-700 disabled:opacity-40 transition-all"
              >
                {personaSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Persona Configuration
              </button>
            </div>
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

          {/* Upload Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
            }}
            className={cx(
              'flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all',
              dragOver
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                : 'border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900'
            )}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              accept=".pdf,.txt,.docx,.csv,.md"
              className="hidden"
            />
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
            </div>
            <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
              {uploading ? 'Processing document embeddings…' : 'Upload Vector Knowledge Document'}
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-md">
              Drag &amp; drop PDF, DOCX, TXT, or CSV files (max 10MB). Text is parsed into vector chunks automatically.
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              Browse Local File
            </button>
          </div>

          {/* RAG Documents Table */}
          <div className="rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Trained Vector Embeddings ({documents.length})
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">Model: Quantized MiniLM-L6-v2</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                <span className="ml-2 text-xs text-slate-500">Fetching document list...</span>
              </div>
            ) : documents.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No vector documents uploaded yet. Upload a PDF or TXT file above.
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/80 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-950/40 text-[11px] font-bold text-slate-500">
                      <th className="px-4 py-3">Document Name</th>
                      <th className="px-4 py-3">Vector Chunks</th>
                      <th className="px-4 py-3">Embedding Dim</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {documents.map((doc) => (
                      <tr key={doc.documentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-indigo-500 shrink-0" />
                          {doc.name}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                          {doc.totalChunks} chunks
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-500">
                          {doc.embeddingSize || 384} float32
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            onClick={() => handleDownloadDocument(doc.documentId)}
                            className="p-1 text-slate-400 hover:text-indigo-600"
                            title="Download document"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ isOpen: true, docId: doc.documentId, docName: doc.name })}
                            className="p-1 text-slate-400 hover:text-rose-600"
                            title="Delete vector document"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
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
