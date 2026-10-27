import React from 'react';
import { Trash2, Send, Loader2, AlertCircle } from 'lucide-react';
import { cx } from '@/lib/types';

interface VoiceNoteRecorderProps {
  isRecording: boolean;
  formattedTime: string;
  audioLevel: number;
  error: string | null;
  isSending: boolean;
  onCancel: () => void;
  onSend: () => void;
  theme?: 'whatsapp-dark' | 'whatsapp-light' | 'glass';
}

export const VoiceNoteRecorder: React.FC<VoiceNoteRecorderProps> = ({
  isRecording,
  formattedTime,
  audioLevel,
  error,
  isSending,
  onCancel,
  onSend,
  theme = 'whatsapp-dark',
}) => {
  // Generate dynamic waveform heights based on audioLevel
  const barCount = 20;
  const waveformBars = Array.from({ length: barCount }, (_, i) => {
    // Generate organic undulating bar heights responsive to live audio level
    const base = 4;
    const wave = Math.sin((i / barCount) * Math.PI) * (audioLevel * 24);
    const height = Math.max(4, Math.min(28, base + wave + (Math.random() * 4 * audioLevel)));
    return height;
  });

  const getContainerStyle = () => {
    if (theme === 'whatsapp-dark') return 'bg-[#2a3942] border-[#005c4b]/40 text-[#e9edef]';
    if (theme === 'whatsapp-light') return 'bg-[#ffffff] border-emerald-500/30 text-[#111b21]';
    return 'bg-card-c/90 border-base-c text-primary-c backdrop-blur-md';
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-danger-500/10 border border-danger-500/30 px-3 py-1.5 text-xs text-danger-600 dark:text-danger-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            onClick={onCancel}
            className="text-[11px] underline font-semibold hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      <div
        className={cx(
          'flex items-center justify-between gap-3 rounded-2xl border px-4 py-2.5 shadow-sm transition-all animate-slide-down',
          getContainerStyle()
        )}
      >
        {/* Left: Discard / Cancel button */}
        <button
          onClick={onCancel}
          disabled={isSending}
          className="grid h-8 w-8 place-items-center rounded-full text-danger-500 hover:bg-danger-500/15 transition-all active:scale-90"
          title="Discard voice note"
          aria-label="Discard voice note"
        >
          <Trash2 className="h-4.5 w-4.5" />
        </button>

        {/* Center: Pulsing red dot, timer, and animated waveform */}
        <div className="flex flex-1 items-center gap-3 overflow-hidden">
          <div className="flex items-center gap-2 shrink-0">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
            </span>
            <span className="font-mono text-xs font-bold tracking-wider">
              {formattedTime}
            </span>
          </div>

          {/* Waveform bars */}
          <div className="flex flex-1 items-center justify-center gap-1 h-7 px-2 overflow-hidden">
            {waveformBars.map((h, idx) => (
              <span
                key={idx}
                className={cx(
                  'w-1 rounded-full transition-all duration-75',
                  isRecording ? 'bg-emerald-500' : 'bg-slate-400'
                )}
                style={{
                  height: `${h}px`,
                  opacity: Math.max(0.3, audioLevel * 1.5),
                }}
              />
            ))}
          </div>
        </div>

        {/* Right: Send Voice Note button */}
        <button
          onClick={onSend}
          disabled={isSending}
          className={cx(
            'grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white shadow-md transition-all',
            isSending
              ? 'bg-emerald-700 cursor-wait opacity-80'
              : 'bg-emerald-600 hover:bg-emerald-700 hover:scale-105 active:scale-95 shadow-emerald-500/25'
          )}
          title="Send WhatsApp Voice Note"
          aria-label="Send WhatsApp Voice Note"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
};
