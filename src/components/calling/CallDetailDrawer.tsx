import React, { useState, useEffect } from 'react';
import { GlassCard, Badge, Avatar } from '@/components/ui/primitives';
import {
  X,
  Phone,
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
  Hash,
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

  const isOutbound =
    detail?.direction === 'BUSINESS_INITIATED' || detail?.direction === 'OUTBOUND';

  return (
    <div className="fixed inset-0 z-[120] flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-2xl h-full flex flex-col bg-card-c border-l border-base-c shadow-soft-2xl animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-base-c px-6 py-4 bg-subtle-c/40 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
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
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-primary-c">Call Session Details</h3>
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
                    {getCallStateLabel(detail.state)}
                  </Badge>
                )}
              </div>
              <p className="font-mono text-[11px] text-muted-c">ID: {callId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-c hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                  <p className="text-xs font-semibold text-primary-c">
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
                  <p className="text-xs font-semibold text-primary-c uppercase">
                    {detail.codec || 'Opus 48kHz'}
                  </p>
                </div>
              </div>

              {/* Call Parties Information */}
              <GlassCard className="p-4 space-y-3">
                <h4 className="text-xs font-bold text-primary-c uppercase tracking-wider">
                  Call Endpoints
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="rounded-lg bg-card-c border border-base-c p-2.5 space-y-1">
                    <span className="text-[11px] text-muted-c font-semibold">Caller (From)</span>
                    <p className="font-mono font-bold text-primary-c">{detail.fromWaId}</p>
                  </div>
                  <div className="rounded-lg bg-card-c border border-base-c p-2.5 space-y-1">
                    <span className="text-[11px] text-muted-c font-semibold">Recipient (To)</span>
                    <p className="font-mono font-bold text-primary-c">{detail.toWaId}</p>
                    {detail.contactName && (
                      <p className="text-[11px] text-primary-500 font-semibold">
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary-500" />
                    <h4 className="text-xs font-bold text-primary-c uppercase tracking-wider">
                      Conversation Transcript ({turns.length} turns)
                    </h4>
                  </div>
                  {turns.length > 0 && (
                    <button
                      onClick={handleCopyTranscript}
                      className="flex items-center gap-1.5 rounded-lg border border-base-c bg-card-c px-2.5 py-1 text-xs font-medium text-secondary-c hover:text-primary-c transition-colors cursor-pointer"
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
                            className={`max-w-[80%] rounded-2xl p-3.5 space-y-1.5 shadow-xs ${
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

                            <p className="text-xs leading-relaxed whitespace-pre-wrap">
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
  );
}
