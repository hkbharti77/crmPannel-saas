import React, { useState, useRef, useEffect } from 'react';
import { GlassCard, Badge } from '@/components/ui/primitives';
import {
  Play,
  Pause,
  Download,
  RotateCcw,
  Volume2,
  VolumeX,
  FileAudio,
  Loader2,
  AlertCircle,
  Clock,
  HardDrive,
} from 'lucide-react';
import { formatCallDuration, type WhatsAppCallRecordingDTO } from '@/lib/whatsappCallingApi';

interface CallRecordingPlayerProps {
  recording: WhatsAppCallRecordingDTO | null;
  loading?: boolean;
  error?: string | null;
  fallbackDuration?: number | null;
}

export function CallRecordingPlayer({
  recording,
  loading = false,
  error = null,
  fallbackDuration = null,
}: CallRecordingPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [isSeeking, setIsSeeking] = useState(false);

  useEffect(() => {
    // Reset player on recording change
    setIsPlaying(false);
    setCurrentTime(0);
    setPlaybackError(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (recording?.durationSeconds) {
      setDuration(recording.durationSeconds);
    } else if (fallbackDuration) {
      setDuration(fallbackDuration);
    } else {
      setDuration(0);
    }
  }, [recording?.playbackUrl, recording?.callId, fallbackDuration]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      setPlaybackError(null);
      audioRef.current.play().catch((err) => {
        setPlaybackError(err.message || 'Unable to play audio stream');
        setIsPlaying(false);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (!isSeeking && audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && audioRef.current.duration && !isNaN(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleSpeedChange = () => {
    const rates = [1, 1.25, 1.5, 2];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const handleRestart = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
    audioRef.current.play().catch(() => {});
    setIsPlaying(true);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes || bytes <= 0) return null;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  };

  if (loading) {
    return (
      <GlassCard className="p-4 flex items-center justify-center gap-3 text-muted-c text-xs">
        <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
        <span>Loading call recording metadata...</span>
      </GlassCard>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 flex items-center gap-3 text-xs text-rose-600 dark:text-rose-400">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>Recording unavailable: {error}</span>
      </div>
    );
  }

  if (
    !recording ||
    recording.status === 'NOT_AVAILABLE' ||
    (!recording.available && recording.status !== 'PROCESSING')
  ) {
    return (
      <div className="rounded-xl border border-base-c bg-subtle-c/40 p-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5 text-muted-c">
          <FileAudio className="h-4 w-4" />
          <span>No audio recording available for this call session</span>
        </div>
        <span className="text-[10px] uppercase font-mono tracking-wider text-muted-c bg-card-c border border-base-c px-2 py-0.5 rounded">
          Unavailable
        </span>
      </div>
    );
  }

  if (recording.status === 'PROCESSING') {
    return (
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center gap-3 text-xs text-amber-600 dark:text-amber-400">
        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
        <div className="flex-1">
          <p className="font-semibold">Call Recording In Progress</p>
          <p className="text-[11px] text-muted-c mt-0.5">
            The audio is currently being processed and synced to Cloudinary. It will appear here once ready.
          </p>
        </div>
        <Badge variant="warning">Processing</Badge>
      </div>
    );
  }

  if (recording.status === 'FAILED') {
    return (
      <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 flex items-center gap-3 text-xs text-rose-600 dark:text-rose-400">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <div className="flex-1">
          <p className="font-semibold">Recording Upload Failed</p>
          <p className="text-[11px] text-muted-c mt-0.5">
            {recording.errorMessage || 'Cloudinary storage failed or the audio media timed out.'}
          </p>
        </div>
        <Badge variant="danger">Failed</Badge>
      </div>
    );
  }

  const audioSource = recording.playbackUrl || recording.signedDirectUrl;
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <GlassCard className="p-4 space-y-3.5 border border-primary-500/20 bg-gradient-to-br from-card-c via-card-c to-primary-500/5 shadow-soft-lg">
      <audio
        ref={audioRef}
        src={audioSource || undefined}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={() => {
          setPlaybackError('Failed to stream audio recording. Range request or HMAC token may have expired.');
          setIsPlaying(false);
        }}
      />

      {/* Header with Title and Badges */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-500/10 text-primary-500">
            <FileAudio className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-primary-c">WhatsApp Call Recording</h4>
            <p className="text-[10px] text-muted-c">Cloudinary MP3 • Secure Authorized Playback</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {recording.format && (
            <span className="rounded bg-card-c border border-base-c px-2 py-0.5 text-[10px] font-mono font-semibold uppercase text-secondary-c">
              {recording.format}
            </span>
          )}
          {formatFileSize(recording.sizeBytes) && (
            <span className="rounded bg-card-c border border-base-c px-2 py-0.5 text-[10px] font-mono text-muted-c flex items-center gap-1">
              <HardDrive className="h-2.5 w-2.5" />
              {formatFileSize(recording.sizeBytes)}
            </span>
          )}
          <Badge variant="success">Available</Badge>
        </div>
      </div>

      {playbackError && (
        <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-2.5 flex items-center gap-2 text-[11px] text-rose-500">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{playbackError}</span>
        </div>
      )}

      {/* Audio Wave / Scrubber Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="relative w-full flex items-center">
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            onMouseDown={() => setIsSeeking(true)}
            onMouseUp={() => setIsSeeking(false)}
            onTouchStart={() => setIsSeeking(true)}
            onTouchEnd={() => setIsSeeking(false)}
            aria-label="Seek call recording"
            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-200 dark:bg-slate-700 accent-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            style={{
              background: `linear-gradient(to right, rgb(59 130 246) ${progressPercent}%, rgb(203 213 225) ${progressPercent}%)`,
            }}
          />
        </div>

        <div className="flex items-center justify-between font-mono text-[11px] text-muted-c">
          <span>{formatCallDuration(Math.floor(currentTime))}</span>
          <span>{formatCallDuration(Math.floor(duration))}</span>
        </div>
      </div>

      {/* Control Buttons Bar */}
      <div className="flex items-center justify-between pt-1 border-t border-base-c/60">
        <div className="flex items-center gap-2">
          {/* Play / Pause Primary Button */}
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause call recording' : 'Play call recording'}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500 hover:bg-primary-600 text-white shadow-soft-sm transition-transform active:scale-95 cursor-pointer"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </button>

          {/* Restart from 0 Button */}
          <button
            type="button"
            onClick={handleRestart}
            title="Restart playback"
            aria-label="Restart playback"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-base-c bg-card-c text-secondary-c hover:text-primary-c hover:bg-subtle-c transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          {/* Playback Speed Toggle */}
          <button
            type="button"
            onClick={handleSpeedChange}
            title="Toggle playback speed"
            className="h-8 px-2.5 rounded-lg border border-base-c bg-card-c font-mono text-xs font-semibold text-secondary-c hover:text-primary-c hover:bg-subtle-c transition-colors cursor-pointer"
          >
            {playbackRate}x
          </button>

          {/* Mute Toggle */}
          <button
            type="button"
            onClick={toggleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-base-c bg-card-c text-secondary-c hover:text-primary-c hover:bg-subtle-c transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="h-3.5 w-3.5 text-rose-500" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Secure Download Button */}
        {recording.downloadUrl && (
          <a
            href={recording.downloadUrl}
            download={`whatsapp_call_${recording.callId}.mp3`}
            target="_blank"
            rel="noopener noreferrer"
            title="Download MP3 recording securely"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-base-c bg-card-c text-xs font-semibold text-secondary-c hover:text-primary-c hover:bg-subtle-c hover:border-primary-500/40 transition-colors shadow-xs cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-primary-500" />
            <span>Download MP3</span>
          </a>
        )}
      </div>
    </GlassCard>
  );
}
