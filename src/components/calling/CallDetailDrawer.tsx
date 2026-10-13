import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GlassCard, Badge } from '@/components/ui/primitives';
import {
  X,
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
  Calendar,
  AlertTriangle,
  Bot,
  User,
  Zap,
  Activity,
  Copy,
  Check,
  Loader2,
  FileText,
  Volume2,
  AlertCircle,
} from 'lucide-react';
import {
  fetchWhatsAppCallDetail,
  fetchWhatsAppCallTurns,
  fetchWhatsAppCallRecording,
  formatCallDuration,
  getCallStateLabel,
  type WhatsAppCallDetailDTO,
  type WhatsAppCallTurnDTO,
  type WhatsAppCallRecordingDTO,
} from '@/lib/whatsappCallingApi';
import { CallRecordingPlayer } from './CallRecordingPlayer';

interface CallDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  callId: string | null;
}

export function CallDetailDrawer({ isOpen, onClose, callId }: CallDetailDrawerProps) {
  const [detail, setDetail] = useState<WhatsAppCallDetailDTO | null>(null);
  const [turns, setTurns] = useState<WhatsAppCallTurnDTO[]>([]);
  const [recording, setRecording] = useState<WhatsAppCallRecordingDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingRecording, setLoadingRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [copiedCallId, setCopiedCallId] = useState(false);

  // Body scroll locking and Escape key dismissal
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Fetch call details and turns
  useEffect(() => {
    if (!isOpen || !callId) {
      setDetail(null);
      setTurns([]);
      setRecording(null);
      setError(null);
      setRecordingError(null);
      return;
    }

    setLoading(true);
    setLoadingRecording(true);
    setError(null);
    setRecordingError(null);

    Promise.all([
      fetchWhatsAppCallDetail(callId),
      fetchWhatsAppCallTurns(callId, 0, 100),
      fetchWhatsAppCallRecording(callId),
    ])
      .then(([detailRes, turnsRes, recordingRes]) => {
        if (detailRes.error) {
          setError(detailRes.error);
        } else {
          setDetail(detailRes.data || null);
        }

        if (turnsRes.data?.content) {
          // Sort turns chronologically
          const sorted = [...turnsRes.data.content].sort(
            (a, b) => a.turnNumber - b.turnNumber
          );
          setTurns(sorted);
        }

        if (recordingRes.error) {
          setRecordingError(recordingRes.error);
        } else {
          setRecording(recordingRes.data || null);
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to retrieve call details');
      })
      .finally(() => {
        setLoading(false);
        setLoadingRecording(false);
      });
  }, [isOpen, callId]);

  if (!isOpen) return null;

  const handleCopyTranscript = () => {
    if (!turns.length) return;
    const text = turns
      .map(
        (t) =>
          `[${t.speaker === 'ASSISTANT' ? 'AI Voice Agent' : 'Customer'}] (${t.timestamp || ''}): ${
            t.transcript
          }`
      )
      .join('\n\n');
    navigator.clipboard.writeText(text);
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2000);
  };

  const handleCopyCallId = () => {
    if (!callId) return;
    navigator.clipboard.writeText(callId);
    setCopiedCallId(true);
    setTimeout(() => setCopiedCallId(false), 2000);
  };

  const isOutbound =
    detail?.direction === 'BUSINESS_INITIATED' || detail?.direction === 'OUTBOUND';

  const drawerContent = (
    <>
      {/* Viewport Backdrop with click-to-dismiss */}
      <div
        className="fixed inset-0 z-40 bg-slate-950/60 dark:bg-black/70 backdrop-blur-sm transition-opacity duration-200 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
        data-testid="call-detail-backdrop"
      />

      {/* Right-Side Drawer Container */}
      <div
        className="fixed inset-0 z-50 pointer-events-none flex justify-end overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="call-session-title"
      >
        <div
          className="pointer-events-auto w-full sm:max-w-xl md:max-w-2xl h-full flex flex-col bg-card-c border-l border-base-c shadow-soft-2xl animate-in slide-in-from-right duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Header */}
          <div className="flex items-center justify-between border-b border-base-c px-4 py-3 sm:px-6 sm:py-4 bg-subtle-c/40 shrink-0 gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  isOutbound
                    ? 'bg-primary-500/10 text-primary-500'
                    : 'bg-emerald-500/10 text-emerald-500'
                }`}
              >
                {isOutbound ? (
                  <PhoneOutgoing className="h-5 w-5" />
                ) : (
                  <PhoneIncoming className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 id="call-session-title" className="text-sm font-bold text-primary-c truncate">
                    Call Session Details
                  </h3>
                  {detail && (
                    <Badge
                      variant={
                        detail.state === 'ACTIVE'
                          ? 'success'
                          : detail.state === 'TERMINATED' || detail.state === 'ENDED'
                          ? 'neutral'
                          : detail.state === 'RINGING'
                          ? 'primary'
                          : 'danger'
                      }
                    >
                      {detail.state === 'ACTIVE' && (
                        <span className="relative flex h-2 w-2 mr-1 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                      )}
                      {getCallStateLabel(detail.state)}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 text-muted-c min-w-0">
                  <span className="text-[11px] font-medium shrink-0">ID:</span>
                  <span
                    className="font-mono text-[11px] text-secondary-c truncate max-w-[170px] sm:max-w-[260px] md:max-w-[340px] select-all cursor-default"
                    title={callId || ''}
                  >
                    {callId}
                  </span>
                  {callId && (
                    <button
                      type="button"
                      onClick={handleCopyCallId}
                      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-muted-c hover:text-primary-c hover:bg-subtle-c transition-colors shrink-0 cursor-pointer"
                      title={copiedCallId ? 'Copied ID' : 'Copy Call ID'}
                      aria-label="Copy Call ID"
                    >
                      {copiedCallId ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-500" />
                          <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span className="text-[10px] font-medium hidden sm:inline">Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-muted-c hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-800 transition-colors shrink-0 cursor-pointer"
              aria-label="Close call details drawer"
              title="Close (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
            {loading ? (
              <div className="flex min-h-[40vh] flex-col items-center justify-center p-6 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                <p className="mt-3 text-xs font-semibold text-muted-c">Loading call session and transcript...</p>
              </div>
            ) : error ? (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-6 text-center space-y-2">
                <AlertCircle className="h-8 w-8 text-rose-500 mx-auto" />
                <h4 className="text-sm font-bold text-primary-c">Unable to Load Call</h4>
                <p className="text-xs text-secondary-c max-w-sm mx-auto">{error}</p>
              </div>
            ) : detail ? (
              <>
                {/* Overview Metric Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                  <div className="rounded-xl border border-base-c bg-subtle-c/50 p-3 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-c flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Duration
                    </span>
                    <p className="font-mono text-sm font-bold text-primary-c">
                      {formatCallDuration(detail.durationSeconds)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-base-c bg-subtle-c/50 p-3 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-c flex items-center gap-1">
                      <Activity className="h-3 w-3" /> Direction
                    </span>
                    <p className="text-xs font-bold text-primary-c">
                      {isOutbound ? 'Outbound AI' : 'Inbound User'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-base-c bg-subtle-c/50 p-3 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-c flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Started
                    </span>
                    <p className="text-xs font-semibold text-primary-c truncate">
                      {detail.startedAt
                        ? new Date(detail.startedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'N/A'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-base-c bg-subtle-c/50 p-3 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-c flex items-center gap-1">
                      <Zap className="h-3 w-3" /> Codec
                    </span>
                    <p className="text-xs font-semibold text-primary-c uppercase truncate">
                      {detail.codec || 'Opus 48kHz'}
                    </p>
                  </div>
                </div>

                {/* Call Endpoints Information */}
                <GlassCard className="p-4 space-y-3">
                  <h4 className="text-xs font-bold text-primary-c uppercase tracking-wider">
                    Call Endpoints
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
                    <div className="rounded-lg bg-card-c border border-base-c p-2.5 space-y-1">
                      <span className="text-[11px] text-muted-c font-semibold">Caller (From)</span>
                      <p className="font-mono font-bold text-primary-c break-all">{detail.fromWaId}</p>
                    </div>
                    <div className="rounded-lg bg-card-c border border-base-c p-2.5 space-y-1">
                      <span className="text-[11px] text-muted-c font-semibold">Recipient (To)</span>
                      <p className="font-mono font-bold text-primary-c break-all">{detail.toWaId}</p>
                      {detail.contactName && (
                        <p className="text-[11px] text-primary-500 font-semibold truncate">
                          {detail.contactName}
                        </p>
                      )}
                    </div>
                  </div>
                </GlassCard>

                {/* Error or Termination Diagnostics (if any) */}
                {(detail.metaErrorCode || detail.terminationReason || detail.failureStage) && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Diagnostics & Termination Reason</span>
                    </div>
                    <div className="text-xs text-secondary-c space-y-1">
                      {detail.terminationReason && (
                        <p>
                          <span className="font-semibold text-primary-c">Reason:</span>{' '}
                          {detail.terminationReason}
                        </p>
                      )}
                      {detail.failureStage && (
                        <p>
                          <span className="font-semibold text-primary-c">Failure Stage:</span>{' '}
                          {detail.failureStage}
                        </p>
                      )}
                      {detail.metaErrorCode && (
                        <p>
                          <span className="font-semibold text-primary-c">Meta Code:</span>{' '}
                          <code className="px-1 py-0.5 rounded bg-amber-500/10 font-mono text-amber-700 dark:text-amber-300">
                            {detail.metaErrorCode}
                          </code>
                          {detail.metaErrorTitle ? ` — ${detail.metaErrorTitle}` : ''}
                        </p>
                      )}
                      {detail.metaErrorMessage && (
                        <p className="text-[11px] text-muted-c mt-1">{detail.metaErrorMessage}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* WhatsApp Call Recording Playback */}
                <div className="space-y-2">
                  <CallRecordingPlayer
                    recording={recording}
                    loading={loadingRecording}
                    error={recordingError}
                    fallbackDuration={detail.recordingDurationSeconds || detail.durationSeconds}
                  />
                </div>

                {/* Conversation Transcript Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-primary-500 shrink-0" />
                      <h4 className="text-xs font-bold text-primary-c uppercase tracking-wider truncate">
                        Conversation Transcript ({turns.length} turns)
                      </h4>
                    </div>
                    {turns.length > 0 && (
                      <button
                        type="button"
                        onClick={handleCopyTranscript}
                        className="flex items-center gap-1.5 rounded-lg border border-base-c bg-card-c px-2.5 py-1 text-xs font-medium text-secondary-c hover:text-primary-c transition-colors shrink-0 cursor-pointer"
                      >
                        {copiedTranscript ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-500" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy Transcript</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {turns.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-base-c p-8 text-center space-y-2">
                      <Volume2 className="h-8 w-8 text-muted-c mx-auto" />
                      <p className="text-xs font-semibold text-primary-c">No conversation turns recorded</p>
                      <p className="text-[11px] text-muted-c max-w-xs mx-auto">
                        This call ended before audio dialogue occurred, or the call was declined by the callee.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {turns.map((turn) => {
                        const isAi = turn.speaker === 'ASSISTANT';
                        return (
                          <div
                            key={turn.turnId || turn.turnNumber}
                            className={`flex gap-3 ${isAi ? 'flex-row' : 'flex-row-reverse'}`}
                          >
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-xs ${
                                isAi
                                  ? 'bg-primary-500 text-white'
                                  : 'bg-slate-700 text-white'
                              }`}
                            >
                              {isAi ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                            </div>

                            <div
                              className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-3.5 space-y-1.5 shadow-xs ${
                                isAi
                                  ? 'bg-primary-500/10 border border-primary-500/20 text-primary-c'
                                  : 'bg-subtle-c border border-base-c text-primary-c'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-4 text-[10px] text-muted-c font-semibold">
                                <span>{isAi ? 'AI Voice Agent' : 'Customer'}</span>
                                <span>
                                  {turn.timestamp
                                    ? new Date(turn.timestamp).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                      })
                                    : `#${turn.turnNumber}`}
                                </span>
                              </div>

                              <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">
                                {turn.transcript}
                              </p>

                              {/* Latency & Quality Chips */}
                              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                {turn.ttfaMs != null && (
                                  <span className="rounded bg-card-c border border-base-c px-1.5 py-0.5 text-[9px] font-mono text-muted-c">
                                    TTFA: {turn.ttfaMs}ms
                                  </span>
                                )}
                                {turn.llmLatencyMs != null && (
                                  <span className="rounded bg-card-c border border-base-c px-1.5 py-0.5 text-[9px] font-mono text-muted-c">
                                    LLM: {turn.llmLatencyMs}ms
                                  </span>
                                )}
                                {turn.wasInterrupted && (
                                  <span className="rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 text-[9px] font-semibold">
                                    Barge-in
                                  </span>
                                )}
                                {turn.detectedLanguage && (
                                  <span className="rounded bg-card-c border border-base-c px-1.5 py-0.5 text-[9px] font-mono text-muted-c uppercase">
                                    {turn.detectedLanguage}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );

  if (typeof document === 'undefined') {
    return drawerContent;
  }

  return createPortal(drawerContent, document.body);
}

