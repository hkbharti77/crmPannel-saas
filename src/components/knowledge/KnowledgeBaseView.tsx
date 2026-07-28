import { useState, useEffect, useRef } from 'react';
import { cx } from '@/lib/types';
import {
  Brain, Upload, Trash2, Download, Check, AlertCircle, Loader2,
  FileText, Sparkles, Bot, RefreshCw, Layers, CheckCircle2, ShieldAlert, File, Info,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { fetchSubscriptionStatus } from '@/lib/billingApi';

interface RagDocumentDto {
  documentId: string;
  name: string;
  totalChunks: number;
  embeddingSize: number;
  vectorModel: string;
}

export function KnowledgeBaseView() {
  const [documents, setDocuments] = useState<RagDocumentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [trainingText, setTrainingText] = useState('');
  const [training, setTraining] = useState(false);

  // Bot Toggles State
  const [botEnabled, setBotEnabled] = useState(true);
  const [autoReply, setAutoReply] = useState(true);
  const [humanFallback, setHumanFallback] = useState(true);

  // Status & Notifications
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [planLocked, setPlanLocked] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check subscription plan & load documents
    Promise.all([
      fetchSubscriptionStatus(),
      loadDocuments(),
    ]).then(([subRes]) => {
      if (subRes.data) {
        const isPaidPlan = subRes.data.planId === 'PRO' || subRes.data.planId === 'ENTERPRISE';
        const hasFeature = subRes.data.limits?.hasRagLlm !== false;
        if (isPaidPlan || hasFeature) {
          setPlanLocked(false);
        } else {
          setPlanLocked(true);
        }
      }
    });
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    const res = await apiFetch<RagDocumentDto[]>('/api/v1/rag/documents');
    setLoading(false);
    if (res.data) {
      setDocuments(res.data);
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

  const handleTextTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainingText.trim()) return;

    setTraining(true);
    setMessage(null);
    setError(null);

    const res = await apiFetch('/api/v1/knowledge-base/train', {
      method: 'POST',
      body: JSON.stringify({ content: trainingText.trim() }),
    });

    setTraining(false);
    if (!res.error) {
      setMessage('Text knowledge trained successfully in background vector database!');
      setTrainingText('');
      loadDocuments();
      setTimeout(() => setMessage(null), 4000);
    } else {
      setError(`Training failed: ${res.error}`);
    }
  };

  const handleDeleteDocument = async (docId: string, docName: string) => {
    if (!confirm(`Are you sure you want to delete "${docName}" from AI Knowledge Base?`)) {
      return;
    }

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

  return (
    <div className="mx-auto max-w-5xl p-4 lg:p-6 space-y-6">
      {/* Header Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-base-c pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-primary-c">Knowledge Base</h2>
            <span className="rounded-full bg-primary-500/15 border border-primary-500/30 px-2.5 py-0.5 text-[10px] font-bold text-primary-600 dark:text-primary-400">
              RAG AI Engine (Quantized MiniLM)
            </span>
          </div>
          <p className="mt-0.5 text-xs text-secondary-c">
            Upload company policy documents & FAQs to train your custom RAG AI Bot for automated customer inquiry responses.
          </p>
        </div>

        <button
          onClick={loadDocuments}
          className="flex items-center gap-1.5 rounded-xl border border-base-c bg-card-c px-3 py-2 text-xs font-semibold text-secondary-c hover:text-primary-c"
        >
          <RefreshCw className={cx('h-3.5 w-3.5', loading && 'animate-spin')} />
          <span>Refresh Vectors</span>
        </button>
      </div>

      {planLocked && (
        <div className="rounded-xl2 border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0 text-amber-500" />
            <span>Custom RAG LLM Bot Training requires a <strong>PRO</strong> or <strong>ENTERPRISE</strong> plan. Upgrade your plan to activate full AI responses.</span>
          </div>
          <button
            onClick={() => window.location.hash = '#billing'}
            className="rounded-lg bg-gradient-accent px-3 py-1.5 text-xs font-bold text-white shadow-sm shrink-0"
          >
            Upgrade Plan
          </button>
        </div>
      )}

      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-success-500/20 bg-success-500/10 p-3 text-xs text-success-600 dark:text-success-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-danger-500/20 bg-danger-500/10 p-3 text-xs text-danger-600 dark:text-danger-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Bot Automation Toggles Card */}
      <div className="rounded-xl2 border border-base-c bg-card-c p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-primary-c">AI Bot Control & Auto-Reply Rules</h3>
            <p className="text-xs text-secondary-c">Configure automated AI response behaviors on live WhatsApp messages.</p>
          </div>
        </div>

        <div className="divide-y divide-base-c">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-xs font-bold text-primary-c">Enable AI Bot</p>
              <p className="text-[11px] text-muted-c">Let the RAG bot answer incoming lead questions automatically.</p>
            </div>
            <input
              type="checkbox"
              checked={botEnabled}
              onChange={(e) => setBotEnabled(e.target.checked)}
              className="h-5 w-10 rounded-full bg-slate-200 accent-primary-600 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-xs font-bold text-primary-c">Auto-Reply on WhatsApp</p>
              <p className="text-[11px] text-muted-c">Bot replies instantly when a customer sends a message.</p>
            </div>
            <input
              type="checkbox"
              checked={autoReply}
              onChange={(e) => setAutoReply(e.target.checked)}
              className="h-5 w-10 rounded-full bg-slate-200 accent-primary-600 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-xs font-bold text-primary-c">Fallback to Human Agent</p>
              <p className="text-[11px] text-muted-c">Hand off to a live agent when the AI confidence score is below threshold.</p>
            </div>
            <input
              type="checkbox"
              checked={humanFallback}
              onChange={(e) => setHumanFallback(e.target.checked)}
              className="h-5 w-10 rounded-full bg-slate-200 accent-primary-600 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Drag & Drop Document Ingestion Card */}
      <div className="rounded-xl2 border border-base-c bg-card-c p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-primary-c">Document Ingestion (RAG Vector Training)</h3>
          <span className="text-xs text-muted-c">PDF, DOCX, TXT, XLSX — max 10MB</span>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files?.[0]) {
              handleFileUpload(e.dataTransfer.files[0]);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={cx(
            'flex flex-col items-center justify-center rounded-xl2 border-2 border-dashed p-8 text-center cursor-pointer transition-all',
            dragOver
              ? 'border-primary-500 bg-primary-500/10'
              : 'border-base-c bg-slate-50/50 dark:bg-ink-850/50 hover:border-primary-500/50 hover:bg-card-c',
          )}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
            }}
            accept=".pdf,.docx,.txt,.xlsx"
            className="hidden"
          />

          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-500/10 text-primary-600 dark:text-primary-400 mb-3">
            {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
          </div>

          <p className="text-xs font-bold text-primary-c">
            {uploading ? 'Processing & Ingesting Vectors...' : 'Drop documents here or click to upload'}
          </p>
          <p className="mt-1 text-[11px] text-muted-c">
            Supported formats: PDF, DOCX, TXT, XLSX (max 10MB each)
          </p>
        </div>
      </div>

      {/* Manual Text Training Box */}
      <div className="rounded-xl2 border border-base-c bg-card-c p-5 space-y-3 shadow-sm">
        <h3 className="text-base font-bold text-primary-c">Quick Text Knowledge Trainer</h3>
        <p className="text-xs text-secondary-c">Paste raw text, product details, FAQs, or policies directly to train the AI instantly.</p>

        <form onSubmit={handleTextTraining} className="space-y-3">
          <textarea
            rows={4}
            value={trainingText}
            onChange={(e) => setTrainingText(e.target.value)}
            placeholder="e.g. Our business working hours are Mon-Fri 9 AM to 6 PM. Refund policy allows 30-day money back guarantee..."
            className="w-full rounded-xl2 border border-base-c bg-card-c p-3 text-xs text-primary-c focus:border-primary-500/50 focus:outline-none scrollbar-thin"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={training || !trainingText.trim()}
              className="flex items-center gap-2 rounded-xl bg-gradient-accent px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-transform hover:scale-105 disabled:opacity-50"
            >
              {training ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              <span>Train AI with Text</span>
            </button>
          </div>
        </form>
      </div>

      {/* Ingested Documents List Table */}
      <div className="rounded-xl2 border border-base-c bg-card-c p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary-500" />
            <h3 className="text-base font-bold text-primary-c">Ingested Vector Documents</h3>
          </div>
          <span className="rounded-full bg-slate-100 dark:bg-ink-800 px-2.5 py-0.5 text-xs font-bold text-secondary-c">
            {documents.length} Files Ingested
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
          </div>
        ) : documents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-base-c p-8 text-center text-xs text-muted-c">
            No documents ingested yet. Upload PDF/DOCX/TXT files above to build your RAG knowledge base.
          </div>
        ) : (
          <div className="divide-y divide-base-c border border-base-c rounded-xl overflow-hidden">
            {documents.map((doc) => (
              <div key={doc.documentId} className="flex items-center justify-between p-3.5 hover:bg-slate-50/50 dark:hover:bg-ink-850/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-primary-c">{doc.name}</h4>
                    <p className="text-[10px] font-mono text-muted-c">
                      {doc.totalChunks} Chunks • Vector Dim: {doc.embeddingSize}d • Model: {doc.vectorModel}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadDocument(doc.documentId)}
                    title="Download extracted text chunks"
                    className="grid h-8 w-8 place-items-center rounded-lg border border-base-c text-muted-c hover:text-primary-c hover:bg-card-c"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteDocument(doc.documentId, doc.name)}
                    title="Delete document"
                    className="grid h-8 w-8 place-items-center rounded-lg border border-rose-500/30 text-rose-500 hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
