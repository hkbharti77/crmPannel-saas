import React, { useState, useEffect, useCallback } from 'react';
import {
  X, Layers, Edit3, Trash2, Save, RotateCcw, AlertCircle, CheckCircle2,
  ChevronLeft, ChevronRight, Loader2, Sparkles, Database
} from 'lucide-react';
import {
  fetchDocumentChunks, updateChunkContent, deleteChunk,
  type DocumentChunkDto, type PaginatedChunksDto
} from '@/lib/knowledgeBaseApi';

interface InspectChunksModalProps {
  isOpen: boolean;
  docId: string;
  docName: string;
  onClose: () => void;
  onChunksChanged?: () => void;
}

export function InspectChunksModal({
  isOpen,
  docId,
  docName,
  onClose,
  onChunksChanged
}: InspectChunksModalProps) {
  const [chunks, setChunks] = useState<DocumentChunkDto[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Inline editing state
  const [editingChunkId, setEditingChunkId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [savingChunkId, setSavingChunkId] = useState<string | null>(null);
  const [deletingChunkId, setDeletingChunkId] = useState<string | null>(null);

  const loadChunks = useCallback(async (page: number = 0) => {
    if (!docId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDocumentChunks(docId, page, 10);
      if (res.data) {
        setChunks(res.data.chunks || []);
        setTotalElements(res.data.totalElements || 0);
        setTotalPages(Math.max(1, res.data.totalPages || 1));
        setCurrentPage(res.data.currentPage || 0);
      } else if (res.error) {
        setError(res.error);
      }
    } catch (e: any) {
      setError(e.message || 'Failed loading document chunks');
    } finally {
      setLoading(false);
    }
  }, [docId]);

  useEffect(() => {
    if (isOpen && docId) {
      setCurrentPage(0);
      setEditingChunkId(null);
      loadChunks(0);
    }
  }, [isOpen, docId, loadChunks]);

  if (!isOpen) return null;

  const handleStartEdit = (chunk: DocumentChunkDto) => {
    setEditingChunkId(chunk.id);
    setEditingText(chunk.content);
  };

  const handleCancelEdit = () => {
    setEditingChunkId(null);
    setEditingText('');
  };

  const handleSaveEdit = async (chunkId: string) => {
    if (!editingText.trim()) {
      setError('Chunk text cannot be empty');
      return;
    }
    setSavingChunkId(chunkId);
    setError(null);
    try {
      const res = await updateChunkContent(chunkId, editingText.trim());
      if (res.data) {
        setToast('Chunk updated & re-embedded with 384d vector');
        setEditingChunkId(null);
        await loadChunks(currentPage);
        if (onChunksChanged) onChunksChanged();
        setTimeout(() => setToast(null), 3500);
      } else if (res.error) {
        setError(res.error);
      }
    } catch (e: any) {
      setError(e.message || 'Failed updating chunk');
    } finally {
      setSavingChunkId(null);
    }
  };

  const handleDeleteChunk = async (chunkId: string) => {
    if (totalElements <= 1) {
      setError('Cannot delete the only chunk of an active document. Delete the document instead.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this chunk? Vector retrieval will immediately exclude this text.')) {
      return;
    }
    setDeletingChunkId(chunkId);
    setError(null);
    try {
      const res = await deleteChunk(chunkId);
      if (res.data) {
        setToast('Chunk deleted successfully');
        await loadChunks(currentPage);
        if (onChunksChanged) onChunksChanged();
        setTimeout(() => setToast(null), 3000);
      } else if (res.error) {
        setError(res.error);
      }
    } catch (e: any) {
      setError(e.message || 'Failed deleting chunk');
    } finally {
      setDeletingChunkId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="flex flex-col w-full max-w-4xl max-h-[90vh] rounded-2xl border border-base-c bg-card-c shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-base-c px-6 py-4 bg-slate-50 dark:bg-ink-950/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Layers className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-primary-c truncate flex items-center gap-2">
                <span>Inspect &amp; Edit Chunks</span>
                <span className="rounded-md bg-purple-500/10 px-2 py-0.5 text-[11px] font-semibold text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  {totalElements} Chunks
                </span>
              </h2>
              <p className="text-xs text-muted-c truncate">
                Document: <span className="font-semibold text-primary-c">{docName}</span> &bull; 384-dim MiniLM-L6-v2 Embeddings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-base-c p-2 text-muted-c hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Notifications */}
        {toast && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{toast}</span>
          </div>
        )}

        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-semibold text-rose-700 dark:text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Chunks List Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-c">
              <Loader2 className="h-7 w-7 animate-spin text-purple-600 mb-2" />
              <p className="text-xs">Loading document vector chunks...</p>
            </div>
          ) : chunks.length === 0 ? (
            <div className="py-16 text-center text-xs text-muted-c">
              <Database className="mx-auto h-10 w-10 text-muted-c/40 mb-2" />
              <p className="font-semibold text-primary-c">No active chunks found</p>
            </div>
          ) : (
            chunks.map((chunk) => {
              const isEditing = editingChunkId === chunk.id;
              const isSaving = savingChunkId === chunk.id;
              const isDeleting = deletingChunkId === chunk.id;
              const approxTokens = Math.round(chunk.content.length / 4);

              return (
                <div
                  key={chunk.id}
                  className="rounded-xl border border-base-c bg-slate-50/50 dark:bg-ink-900/40 p-4 transition-all hover:border-purple-500/30"
                >
                  {/* Chunk Metadata Bar */}
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-base-c/60 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded text-[11px]">
                        Chunk #{chunk.chunkIndex}
                      </span>
                      <span className="font-mono text-[10px] text-muted-c">
                        v{chunk.version} &bull; Active
                      </span>
                      <span className="text-[10px] text-muted-c font-medium">
                        ~{approxTokens} tokens ({chunk.content.length} chars)
                      </span>
                    </div>

                    {!isEditing && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartEdit(chunk)}
                          className="flex items-center gap-1 rounded-lg border border-base-c bg-card-c px-2.5 py-1 text-[11px] font-semibold text-primary-c hover:border-purple-400 hover:text-purple-600 transition-colors shadow-2xs"
                        >
                          <Edit3 className="h-3 w-3" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteChunk(chunk.id)}
                          disabled={isDeleting}
                          className="flex items-center gap-1 rounded-lg border border-base-c bg-card-c px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-500/10 transition-colors shadow-2xs disabled:opacity-40"
                        >
                          {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Chunk Content Body */}
                  {isEditing ? (
                    <div className="space-y-3">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        rows={6}
                        className="w-full rounded-xl border border-purple-500/50 bg-card-c p-3 font-mono text-xs text-primary-c focus:outline-none focus:ring-2 focus:ring-purple-500/30 leading-relaxed"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                          className="flex items-center gap-1.5 rounded-xl border border-base-c bg-card-c px-3 py-1.5 text-xs font-semibold text-primary-c hover:bg-slate-100 dark:hover:bg-ink-800 transition-colors"
                        >
                          <RotateCcw className="h-3.5 w-3.5" /> Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(chunk.id)}
                          disabled={isSaving}
                          className="flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 px-4 py-1.5 text-xs font-bold text-white shadow-soft transition-colors disabled:opacity-50"
                        >
                          {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                          Save &amp; Re-Embed
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-card-c/80 p-3 font-mono text-xs text-primary-c/90 leading-relaxed whitespace-pre-wrap select-text border border-base-c/40 max-h-48 overflow-y-auto">
                      {chunk.content}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Pagination Footer */}
        <div className="flex items-center justify-between border-t border-base-c px-6 py-3.5 bg-slate-50 dark:bg-ink-950/60 text-xs">
          <span className="text-muted-c font-medium">
            Page <span className="font-bold text-primary-c">{currentPage + 1}</span> of{' '}
            <span className="font-bold text-primary-c">{totalPages}</span> ({totalElements} total chunks)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (currentPage > 0) {
                  loadChunks(currentPage - 1);
                }
              }}
              disabled={currentPage <= 0 || loading}
              className="flex items-center gap-1 rounded-xl border border-base-c bg-card-c px-3 py-1.5 font-semibold text-primary-c hover:bg-slate-100 dark:hover:bg-ink-800 disabled:opacity-40 transition-colors shadow-2xs"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </button>
            <button
              onClick={() => {
                if (currentPage < totalPages - 1) {
                  loadChunks(currentPage + 1);
                }
              }}
              disabled={currentPage >= totalPages - 1 || loading}
              className="flex items-center gap-1 rounded-xl border border-base-c bg-card-c px-3 py-1.5 font-semibold text-primary-c hover:bg-slate-100 dark:hover:bg-ink-800 disabled:opacity-40 transition-colors shadow-2xs"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
