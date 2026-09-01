import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cx } from '@/lib/types';
import { Badge } from '@/components/ui/primitives';
import {
  Brain, LifeBuoy,
  Upload, FileText, Trash2, Plus, Check,
  Server, Database, Cpu, HardDrive, Activity, RefreshCw,
  MessageSquare,
  ChevronUp, ChevronDown, Settings, Tag as TagIcon, MessageCircle, Sliders,
  ArrowUp, ArrowDown, User, AtSign, CheckCircle2, RotateCcw, Save, Loader2, AlertCircle,
  X, Send, Sparkles, Wand2, Zap,
  Mic, Volume2, Radio
} from 'lucide-react';
import { PanelHeader, FieldRow, Toggle, SectionCard, StatPill } from './_shared';
import { apiFetch } from '@/lib/api';
import { fetchTickets, createTicket, type TicketDTO } from '@/lib/ticketsApi';

/* ─── Persona Template Presets ─── */
const PERSONA_TEMPLATES = [
  {
    label: '🏠 Real Estate Agent',
    prompt: 'You are a professional and knowledgeable real estate assistant. Speak with authority about properties, pricing, amenities, and locations. Use a warm but professional tone. Always highlight key selling points and create a sense of urgency when appropriate.',
  },
  {
    label: '💼 Business Consultant',
    prompt: 'You are a polished business consultant. Be concise, data-driven, and solution-oriented. Use professional language and structure your responses clearly with actionable next steps.',
  },
  {
    label: '🏥 Healthcare Guide',
    prompt: 'You are a caring and empathetic healthcare support assistant. Speak in a reassuring tone. Always recommend consulting a medical professional for specific health concerns. Prioritize patient comfort and clarity.',
  },
  {
    label: '🛒 E-Commerce Support',
    prompt: 'You are a friendly and efficient e-commerce support assistant. Help customers with orders, returns, and product questions. Be upbeat, solution-focused, and always aim to resolve issues quickly.',
  },
];

/* ─── Voice Persona Template Presets (English Only) ─── */
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
    label: '🚀 Direct Sales Specialist (Aryan)',
    prompt: 'You are Aryan, an energetic sales concierge. Keep phone conversations engaging in fluent English, highlight top services in one sentence, and prompt callers to take the next step.',
  },
];

const MAX_PERSONA_CHARS = 4000;

/* ─── Knowledge Base ─── */
export function KnowledgeBasePanel() {
  const [docs, setDocs] = useState([
    { id: 'd1', name: 'Property_Brochure_2026.pdf', size: '2.4 MB', status: 'trained', chunks: 142 },
    { id: 'd2', name: 'Pricing_Sheet.xlsx', size: '480 KB', status: 'trained', chunks: 38 },
    { id: 'd3', name: 'FAQ_Document.docx', size: '1.1 MB', status: 'processing', chunks: 0 },
  ]);
  const [botEnabled, setBotEnabled] = useState(true);
  const [autoReply, setAutoReply] = useState(true);
  const [fallbackHuman, setFallbackHuman] = useState(true);

  // ── AI Persona State ──
  const [personaPrompt, setPersonaPrompt] = useState('');
  const [savedPersona, setSavedPersona] = useState('');
  const [personaUpdatedAt, setPersonaUpdatedAt] = useState<string | null>(null);
  const [personaLoading, setPersonaLoading] = useState(true);
  const [personaSaving, setPersonaSaving] = useState(false);
  const [personaToast, setPersonaToast] = useState<string | null>(null);
  const [personaError, setPersonaError] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  const personaDirty = personaPrompt !== savedPersona;
  const charCount = personaPrompt.length;
  const charOverLimit = charCount > MAX_PERSONA_CHARS;

  // ── Voice Assistant Persona State ──
  const [voiceAssistantName, setVoiceAssistantName] = useState('Priya');
  const [savedVoiceAssistantName, setSavedVoiceAssistantName] = useState('Priya');
  const [voicePersonaPrompt, setVoicePersonaPrompt] = useState('');
  const [savedVoicePersonaPrompt, setSavedVoicePersonaPrompt] = useState('');
  const [voiceLoading, setVoiceLoading] = useState(true);
  const [voiceSaving, setVoiceSaving] = useState(false);
  const [voiceToast, setVoiceToast] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [showVoiceTemplates, setShowVoiceTemplates] = useState(false);

  const voiceDirty = voiceAssistantName !== savedVoiceAssistantName || voicePersonaPrompt !== savedVoicePersonaPrompt;
  const voiceCharOverLimit = voicePersonaPrompt.length > MAX_PERSONA_CHARS;

  // ── Load Persona on Mount ──
  useEffect(() => {
    loadPersona();
    loadVoicePersona();
  }, []);

  const loadPersona = async () => {
    setPersonaLoading(true);
    const res = await apiFetch<{ aiPersonaPrompt: string | null; aiPersonaUpdatedAt: string | null }>('/api/v1/settings/ai/persona');
    if (res.data) {
      const prompt = res.data.aiPersonaPrompt || '';
      setPersonaPrompt(prompt);
      setSavedPersona(prompt);
      setPersonaUpdatedAt(res.data.aiPersonaUpdatedAt || null);
    }
    setPersonaLoading(false);
  };

  const loadVoicePersona = async () => {
    setVoiceLoading(true);
    const res = await apiFetch<{ voicePersonaPrompt: string | null; voiceAssistantName: string | null }>('/api/v1/settings/ai/voice-persona');
    if (res.data) {
      const name = res.data.voiceAssistantName || 'Priya';
      const prompt = res.data.voicePersonaPrompt || '';
      setVoiceAssistantName(name);
      setSavedVoiceAssistantName(name);
      setVoicePersonaPrompt(prompt);
      setSavedVoicePersonaPrompt(prompt);
    }
    setVoiceLoading(false);
  };

  const savePersona = async () => {
    if (charOverLimit) return;
    setPersonaSaving(true);
    setPersonaError(null);
    const res = await apiFetch<{ aiPersonaUpdatedAt?: string }>('/api/v1/settings/ai/persona', {
      method: 'PUT',
      body: JSON.stringify({ aiPersonaPrompt: personaPrompt }),
    });
    setPersonaSaving(false);
    if (res.error) {
      setPersonaError(res.error);
      setTimeout(() => setPersonaError(null), 4000);
    } else {
      setSavedPersona(personaPrompt);
      setPersonaUpdatedAt(res.data?.aiPersonaUpdatedAt || new Date().toISOString());
      setPersonaToast('AI Persona saved successfully!');
      setTimeout(() => setPersonaToast(null), 3000);
    }
  };

  const saveVoicePersona = async () => {
    if (voiceCharOverLimit) return;
    setVoiceSaving(true);
    setVoiceError(null);
    const res = await apiFetch('/api/v1/settings/ai/voice-persona', {
      method: 'PUT',
      body: JSON.stringify({
        voiceAssistantName,
        voicePersonaPrompt,
      }),
    });
    setVoiceSaving(false);
    if (res.error) {
      setVoiceError(res.error);
      setTimeout(() => setVoiceError(null), 4000);
    } else {
      setSavedVoiceAssistantName(voiceAssistantName);
      setSavedVoicePersonaPrompt(voicePersonaPrompt);
      setVoiceToast('Voice Assistant Persona saved successfully!');
      setTimeout(() => setVoiceToast(null), 3000);
    }
  };

  const statusMeta: Record<string, { label: string; variant: 'success' | 'warning' }> = {
    trained: { label: 'Trained', variant: 'success' },
    processing: { label: 'Processing', variant: 'warning' },
  };

  return (
    <div className="space-y-4">
      {/* ─── AI Persona Section ─── */}
      <SectionCard>
        <PanelHeader title="AI Persona" desc="Customize the tone, style, and behavior of your AI assistant" icon={<Sparkles className="h-5 w-5 text-primary-600 dark:text-primary-400" />} />

        {/* Toast / Error */}
        {personaToast && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-3">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> {personaToast}
          </div>
        )}
        {personaError && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-xs font-medium text-rose-700 dark:text-rose-400 mb-3">
            <AlertCircle className="h-4 w-4 shrink-0" /> {personaError}
          </div>
        )}

        {personaLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
            <span className="ml-2 text-xs text-muted-c">Loading AI persona…</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Helpful info */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 dark:border-blue-800/50 dark:bg-blue-950/20 p-3.5">
              <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                <strong>How it works:</strong> Your AI persona is layered <em>on top of</em> the base system prompt — it customizes tone and style but <strong>cannot override</strong> the core safety rules, RAG constraints, or factual grounding.
              </p>
            </div>

            {/* Template Presets */}
            <div>
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
              >
                <Wand2 className="h-3.5 w-3.5" />
                {showTemplates ? 'Hide Templates' : 'Choose from Templates'}
                {showTemplates ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>

              {showTemplates && (
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {PERSONA_TEMPLATES.map((t) => (
                    <button
                      key={t.label}
                      onClick={() => { setPersonaPrompt(t.prompt); setShowTemplates(false); }}
                      className="rounded-xl border border-base-c bg-card-c p-3 text-left hover:border-primary-500/40 hover:bg-primary-50/30 dark:hover:bg-primary-950/20 transition-all"
                    >
                      <span className="text-xs font-bold text-primary-c">{t.label}</span>
                      <p className="mt-1 text-[11px] text-muted-c line-clamp-2">{t.prompt}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Textarea */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-secondary-c">
                System Persona Instructions
              </label>
              <textarea
                value={personaPrompt}
                onChange={(e) => setPersonaPrompt(e.target.value)}
                rows={6}
                placeholder="e.g. You are a professional and knowledgeable luxury real estate assistant for Luxe Estates. Speak with authority about properties, pricing, amenities, and locations. Use a warm but professional tone..."
                className={cx(
                  'w-full rounded-xl border bg-white p-3.5 text-xs text-primary-c leading-relaxed focus:outline-none transition-colors dark:bg-slate-950',
                  charOverLimit
                    ? 'border-rose-400 focus:border-rose-500'
                    : 'border-base-c focus:border-primary-500'
                )}
              />
              <div className="mt-1 flex items-center justify-between">
                <p className="text-[11px] text-muted-c">
                  {personaPrompt.trim() ? 'Custom persona active' : 'Using default system persona'}
                </p>
                <span className={cx(
                  'text-[11px] font-medium tabular-nums',
                  charOverLimit ? 'text-rose-500' : 'text-muted-c'
                )}>
                  {charCount.toLocaleString()} / {MAX_PERSONA_CHARS.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Audit info */}
            {personaUpdatedAt && (
              <p className="text-[10px] text-muted-c">
                Last updated: {new Date(personaUpdatedAt).toLocaleString()}
              </p>
            )}

            {/* Save / Reset */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => { setPersonaPrompt(savedPersona); }}
                disabled={!personaDirty}
                className="flex items-center gap-1.5 rounded-xl border border-base-c bg-white px-4 py-2 text-xs font-semibold text-secondary-c hover:bg-slate-50 disabled:opacity-40 dark:bg-slate-900 dark:hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
              <button
                onClick={savePersona}
                disabled={!personaDirty || charOverLimit || personaSaving}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-accent px-5 py-2 text-xs font-bold text-white hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-sm"
              >
                {personaSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save Persona
              </button>
            </div>
          </div>
        )}
      </SectionCard>

      {/* ─── Voice Assistant Persona Section ─── */}
      <SectionCard>
        <div className="flex items-start justify-between">
          <PanelHeader
            title="Voice Assistant Persona & Voice Engine"
            desc="Configure your voice assistant's name, spoken persona, and cadence for phone and web voice calls"
            icon={<Mic className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
          />
          <div className="flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50/70 px-3 py-1 text-[11px] font-semibold text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300">
            <Radio className="h-3 w-3 animate-pulse text-indigo-500" />
            <span>Deepgram Nova-2 + Aura</span>
          </div>
        </div>

        {/* Toast / Error */}
        {voiceToast && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-3">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> {voiceToast}
          </div>
        )}
        {voiceError && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-xs font-medium text-rose-700 dark:text-rose-400 mb-3">
            <AlertCircle className="h-4 w-4 shrink-0" /> {voiceError}
          </div>
        )}

        {voiceLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
            <span className="ml-2 text-xs text-muted-c">Loading Voice Assistant settings…</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Voice info alert */}
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3.5 dark:border-indigo-800/50 dark:bg-indigo-950/20">
              <p className="text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed">
                <strong>Spoken Cadence Rule:</strong> Voice assistants speak in <strong>1 to 2 short sentences</strong> (under 35 words) in clear, natural spoken English so callers enjoy a fast, professional voice experience.
              </p>
            </div>

            {/* Assistant Name Input */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-secondary-c">
                  Voice Assistant Name
                </label>
                <input
                  type="text"
                  value={voiceAssistantName}
                  onChange={(e) => setVoiceAssistantName(e.target.value)}
                  placeholder="e.g. Priya, Riya, Ananya"
                  maxLength={50}
                  className="w-full rounded-xl border border-base-c bg-white p-2.5 text-xs text-primary-c focus:border-indigo-500 focus:outline-none dark:bg-slate-950"
                />
                <p className="mt-1 text-[11px] text-muted-c">
                  The bot will introduce itself with this name during calls.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-secondary-c">
                  Speech Engine & Voice Model
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-base-c bg-slate-50/60 p-2.5 text-xs text-secondary-c dark:bg-slate-900/50">
                  <Volume2 className="h-4 w-4 text-indigo-500 shrink-0" />
                  <span className="font-medium">Deepgram Aura (Asteria/Priya) &bull; 24kHz HD</span>
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
                      className="rounded-xl border border-base-c bg-card-c p-3 text-left hover:border-indigo-500/40 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all"
                    >
                      <span className="text-xs font-bold text-primary-c">{t.label}</span>
                      <p className="mt-1 text-[11px] text-muted-c line-clamp-2">{t.prompt}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Voice Persona Instructions Textarea */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-secondary-c">
                Voice Spoken Instructions & Persona
              </label>
              <textarea
                value={voicePersonaPrompt}
                onChange={(e) => setVoicePersonaPrompt(e.target.value)}
                rows={4}
                placeholder="e.g. You are Priya, speaking warmly as the front-desk assistant of our business. Greet customers with 'Haan ji' or 'Hello', keep answers under 25 words, and politely ask how you can help them book..."
                className={cx(
                  'w-full rounded-xl border bg-white p-3.5 text-xs text-primary-c leading-relaxed focus:outline-none transition-colors dark:bg-slate-950',
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
                  voiceCharOverLimit ? 'text-rose-500' : 'text-muted-c'
                )}>
                  {voicePersonaPrompt.length.toLocaleString()} / {MAX_PERSONA_CHARS.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Save / Reset */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setVoiceAssistantName(savedVoiceAssistantName);
                  setVoicePersonaPrompt(savedVoicePersonaPrompt);
                }}
                disabled={!voiceDirty}
                className="flex items-center gap-1.5 rounded-xl border border-base-c bg-white px-4 py-2 text-xs font-semibold text-secondary-c hover:bg-slate-50 disabled:opacity-40 dark:bg-slate-900 dark:hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
              <button
                type="button"
                onClick={saveVoicePersona}
                disabled={!voiceDirty || voiceCharOverLimit || voiceSaving}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-sm"
              >
                {voiceSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save Voice Persona
              </button>
            </div>
          </div>
        )}
      </SectionCard>

      {/* ─── Knowledge Base Section (unchanged) ─── */}
      <SectionCard>
        <PanelHeader title="Knowledge Base" desc="Upload documents to train your RAG bot" icon={<Brain className="h-5 w-5 text-primary-600 dark:text-primary-400" />} />

        {/* Bot toggles */}
        <div className="mb-4 space-y-3 rounded-xl2 border border-base-c p-4">
          <FieldRow label="Enable AI Bot" desc="Let the bot answer customer questions automatically">
            <Toggle checked={botEnabled} onChange={setBotEnabled} />
          </FieldRow>
          <div className="border-t border-base-c" />
          <FieldRow label="Auto-Reply on WhatsApp" desc="Bot replies instantly when a lead messages">
            <Toggle checked={autoReply} onChange={setAutoReply} />
          </FieldRow>
          <div className="border-t border-base-c" />
          <FieldRow label="Fallback to Human Agent" desc="Hand off to a human when the bot can't answer">
            <Toggle checked={fallbackHuman} onChange={setFallbackHuman} />
          </FieldRow>
        </div>

        {/* Upload zone */}
        <div className="rounded-xl2 border-2 border-dashed border-base-c p-6 text-center transition-colors hover:border-primary-500/30">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary-500/10">
            <Upload className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <p className="mt-3 text-sm font-semibold text-primary-c">Drop documents here or click to upload</p>
          <p className="text-xs text-muted-c">PDF, DOCX, TXT, XLSX — max 10MB each</p>
          <button className="mt-3 rounded-lg bg-gradient-accent px-4 py-2 text-xs font-semibold text-white hover:scale-105">
            Choose Files
          </button>
        </div>

        {/* Document list */}
        <div className="mt-4 space-y-2">
          {docs.map((d) => {
            const meta = statusMeta[d.status];
            return (
              <div key={d.id} className="flex items-center gap-3 rounded-xl2 border border-base-c p-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-500/10">
                  <FileText className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-primary-c">{d.name}</p>
                  <p className="text-xs text-muted-c">{d.size} · {d.chunks > 0 ? `${d.chunks} chunks` : 'indexing…'}</p>
                </div>
                <Badge variant={meta.variant}>{meta.label}</Badge>
                <button onClick={() => setDocs((prev) => prev.filter((x) => x.id !== d.id))} className="grid h-7 w-7 place-items-center rounded-lg text-muted-c hover:bg-danger-500/10 hover:text-danger-600">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <StatPill label="Documents" value={String(docs.length)} color="bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300" />
          <StatPill label="Total Chunks" value={String(docs.reduce((s, d) => s + d.chunks, 0))} color="bg-secondary-100 text-secondary-700 dark:bg-secondary-500/15 dark:text-secondary-300" />
          <StatPill label="Status" value="Ready" color="bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-300" />
        </div>
      </SectionCard>
    </div>
  );
}


interface FlowFieldItem {
  key: string;
  label: string;
  enabled: boolean;
  required: boolean;
  order: number;
  fieldType: string;
}

export function SupportCategoriesPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Accordion Expand/Collapse States
  const [openBasic, setOpenBasic] = useState(true);
  const [openCategories, setOpenCategories] = useState(true);
  const [openFlowFields, setOpenFlowFields] = useState(true);
  const [openAdvanced, setOpenAdvanced] = useState(true);

  // 1. Basic Configuration
  const [formTitle, setFormTitle] = useState('Get Support');
  const [formDescription, setFormDescription] = useState("Need help? Submit your request and we'll get back to you soon.");
  const [whatsappIntro, setWhatsappIntro] = useState('Welcome to our Support channel! Please provide a few details so we can assist you better.');
  const [successMessage, setSuccessMessage] = useState("Thank you for contacting support! We've received your request and will get back to you shortly.");
  const [phoneRequired, setPhoneRequired] = useState(false);
  const [categoryRequired, setCategoryRequired] = useState(false);
  const [enabled, setEnabled] = useState(true);

  // 2. Support Categories
  const [categories, setCategories] = useState<string[]>([
    'Project Query', 'Revision Request', 'Delivery Query', 'Pricing'
  ]);
  const [newCatInput, setNewCatInput] = useState('');

  // 3. WhatsApp Flow Fields
  const [flowFields, setFlowFields] = useState<FlowFieldItem[]>([
    { key: 'NAME', fieldType: 'TEXT', label: 'What is your name?', enabled: true, required: true, order: 0 },
    { key: 'EMAIL', fieldType: 'EMAIL', label: 'Please provide your email address so our support team can reach you:', enabled: true, required: true, order: 1 },
    { key: 'CATEGORY', fieldType: 'SELECT', label: 'Select a support category:', enabled: true, required: true, order: 2 },
    { key: 'MESSAGE', fieldType: 'TEXTAREA', label: 'Please describe your query or issue:', enabled: true, required: true, order: 3 },
  ]);

  // 4. Advanced Settings
  const [primaryColor, setPrimaryColor] = useState('#667eea');
  const [logoUrl, setLogoUrl] = useState('');
  const [rateLimitEnabled, setRateLimitEnabled] = useState(true);
  const [duplicateDetectionEnabled, setDuplicateDetectionEnabled] = useState(true);
  const [defaultPriority, setDefaultPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');

  useEffect(() => {
    loadData();
  }, []);

  const toast = (msg: string, isErr = false) => {
    if (isErr) { setError(msg); setToastMessage(null); }
    else { setToastMessage(msg); setError(null); }
    setTimeout(() => { setToastMessage(null); setError(null); }, 3500);
  };

  const loadData = async () => {
    setLoading(true);
    // Fetch Support Form Config
    const configRes = await apiFetch<Record<string, any>>('/api/v1/support-form-config');
    if (configRes.data) {
      const d = configRes.data;
      if (d.formTitle) setFormTitle(d.formTitle);
      if (d.formDescription) setFormDescription(d.formDescription);
      if (d.successMessage) setSuccessMessage(d.successMessage);
      setPhoneRequired(!!d.phoneRequired);
      setCategoryRequired(!!d.categoryRequired);
      setEnabled(d.enabled !== false);
      if (Array.isArray(d.categories)) setCategories(d.categories);
      else if (typeof d.categories === 'string' && d.categories.trim()) {
        setCategories(d.categories.split(',').map((s: string) => s.trim()));
      }
      if (d.primaryColor) setPrimaryColor(d.primaryColor);
      if (d.logoUrl) setLogoUrl(d.logoUrl);
      if (d.rateLimitEnabled !== undefined) setRateLimitEnabled(!!d.rateLimitEnabled);
      if (d.duplicateDetectionEnabled !== undefined) setDuplicateDetectionEnabled(!!d.duplicateDetectionEnabled);
      if (d.defaultPriority) setDefaultPriority(d.defaultPriority);
    }

    // Fetch WhatsApp Greeting
    const greetingRes = await apiFetch<Record<string, any>>('/api/v1/flow-config/greeting?flowType=SUPPORT');
    if (greetingRes.data?.greetingMessage) {
      setWhatsappIntro(greetingRes.data.greetingMessage);
    }

    // Fetch Flow Fields
    const fieldsRes = await apiFetch('/api/v1/flow-config/fields?flowType=SUPPORT');
    if (fieldsRes.data && Array.isArray(fieldsRes.data) && fieldsRes.data.length > 0) {
      setFlowFields(fieldsRes.data);
    }

    setLoading(false);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    // 1. Save Support Form Config
    const configPayload = {
      formTitle,
      formDescription,
      successMessage,
      phoneRequired,
      categoryRequired,
      enabled,
      categories,
      primaryColor,
      logoUrl,
      rateLimitEnabled,
      duplicateDetectionEnabled,
      defaultPriority,
    };
    const configRes = await apiFetch('/api/v1/support-form-config', {
      method: 'PUT',
      body: JSON.stringify(configPayload),
    });

    // 2. Save WhatsApp Greeting
    await apiFetch('/api/v1/flow-config/greeting?flowType=SUPPORT', {
      method: 'POST',
      body: JSON.stringify({ greetingMessage: whatsappIntro }),
    });

    // 3. Save Flow Fields
    await apiFetch('/api/v1/flow-config/fields?flowType=SUPPORT', {
      method: 'POST',
      body: JSON.stringify(flowFields),
    });

    setSaving(false);
    if (!configRes.error) {
      toast('Support Configuration saved successfully!');
    } else {
      toast(`Save failed: ${configRes.error}`, true);
    }
  };

  const handleAddCategory = () => {
    if (!newCatInput.trim()) return;
    if (!categories.includes(newCatInput.trim())) {
      setCategories([...categories, newCatInput.trim()]);
    }
    setNewCatInput('');
  };

  const handleDeleteCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const applyTemplate = (templateItems: string[]) => {
    setCategories(templateItems);
  };

  const moveField = (index: number, direction: -1 | 1) => {
    const newIdx = index + direction;
    if (newIdx < 0 || newIdx >= flowFields.length) return;
    const updated = [...flowFields];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;
    setFlowFields(updated.map((f, i) => ({ ...f, order: i })));
  };

  const updateField = (index: number, field: keyof FlowFieldItem, val: unknown) => {
    setFlowFields(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  if (loading) {
    return (
      <SectionCard>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          <span className="ml-2 text-sm text-slate-500">Loading Support Categories &amp; Form Config...</span>
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {toastMessage}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-700 dark:text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Support Categories</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Customize support categories for WhatsApp and web support forms.
        </p>
      </div>

      {/* ─── 1. Basic Configuration ─── */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-sm">
        <button
          onClick={() => setOpenBasic(!openBasic)}
          className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-emerald-600" />
            <span className="text-base font-bold text-slate-900 dark:text-white">Basic Configuration</span>
          </div>
          {openBasic ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
        </button>

        {openBasic && (
          <div className="border-t border-slate-100 dark:border-slate-800 p-5 space-y-5">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Form Title</label>
              <input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Get Support"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Form Description</label>
              <input
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Need help? Submit your request and we'll get back to you soon."
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                WhatsApp Intro/Greeting Message (Optional)
              </label>
              <textarea
                value={whatsappIntro}
                onChange={(e) => setWhatsappIntro(e.target.value)}
                rows={3}
                placeholder="Welcome to our Support channel! Please provide a few details so we can assist you better."
                className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
              <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                This message will be sent to the user right before the first question of the WhatsApp support flow.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Success Message</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-emerald-600 font-bold text-xs">
                  <Check className="h-4 w-4 text-emerald-600" />
                </span>
                <input
                  value={successMessage}
                  onChange={(e) => setSuccessMessage(e.target.value)}
                  placeholder="Thank you for contacting support! We've received your request and will get back to you shortly."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="pt-2 space-y-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between py-1">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Require Phone Number</span>
                <Toggle checked={phoneRequired} onChange={setPhoneRequired} />
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Require Category Selection</span>
                <Toggle checked={categoryRequired} onChange={setCategoryRequired} />
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Enable Support Form</span>
                <Toggle checked={enabled} onChange={setEnabled} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── 2. Support Categories ─── */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-sm">
        <button
          onClick={() => setOpenCategories(!openCategories)}
          className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <TagIcon className="h-5 w-5 text-emerald-600" />
            <span className="text-base font-bold text-slate-900 dark:text-white">Support Categories</span>
          </div>
          {openCategories ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
        </button>

        {openCategories && (
          <div className="border-t border-slate-100 dark:border-slate-800 p-5 space-y-6">
            {/* Quick Templates */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Quick Templates</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Apply category templates relevant to your business type:</p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <button
                  onClick={() => applyTemplate(['Project Query', 'Revision Request', 'Delivery Query', 'Pricing'])}
                  className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                >
                  💼 General Business
                </button>
                <button
                  onClick={() => applyTemplate(['Technical Issue', 'Billing & Payment', 'Account Problem', 'General Query'])}
                  className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-100 transition-colors"
                >
                  💻 Technology
                </button>
                <button
                  onClick={() => applyTemplate(['Appointment Query', 'Treatment Details', 'Billing & Insurance', 'Emergency'])}
                  className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-100 transition-colors"
                >
                  🏥 Healthcare
                </button>
              </div>
            </div>

            {/* Current Categories */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Current Categories</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">These categories appear in WhatsApp and web support forms:</p>

              <div className="mt-3 space-y-2.5">
                {categories.map((cat, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      value={cat}
                      onChange={(e) => {
                        const updated = [...categories];
                        updated[idx] = e.target.value;
                        setCategories(updated);
                      }}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                    <button
                      onClick={() => handleDeleteCategory(idx)}
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add category input */}
              <div className="mt-4 flex items-center gap-2">
                <input
                  value={newCatInput}
                  onChange={(e) => setNewCatInput(e.target.value)}
                  placeholder="New Category Name (e.g. Refund Request)"
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddCategory(); }}
                />
                <button
                  onClick={handleAddCategory}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── 3. WhatsApp Flow Fields ─── */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-sm">
        <button
          onClick={() => setOpenFlowFields(!openFlowFields)}
          className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <MessageCircle className="h-5 w-5 text-emerald-600" />
            <span className="text-base font-bold text-slate-900 dark:text-white">WhatsApp Flow Fields</span>
          </div>
          {openFlowFields ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
        </button>

        {openFlowFields && (
          <div className="border-t border-slate-100 dark:border-slate-800 p-5 space-y-5">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Customize Support Chat Flow</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Enable, reorder, and rename the questions asked during WhatsApp support conversation.
              </p>
            </div>

            <div className="space-y-4">
              {flowFields.map((field, idx) => (
                <div key={field.key || idx} className="rounded-xl border border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-emerald-700 text-white px-2 py-0.5 text-[10px] font-bold">
                        {field.key}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {field.fieldType}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">ENABLED</span>
                      <Toggle
                        checked={field.enabled}
                        onChange={(val) => updateField(idx, 'enabled', val)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-500 dark:text-slate-400">Question / Label</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-slate-400">
                        {field.key === 'NAME' ? <User className="h-4 w-4" /> : field.key === 'EMAIL' ? <AtSign className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                      </span>
                      <input
                        value={field.label}
                        onChange={(e) => updateField(idx, 'label', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Required:</span>
                      <Toggle
                        checked={field.required}
                        onChange={(val) => updateField(idx, 'required', val)}
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveField(idx, -1)}
                        disabled={idx === 0}
                        className="grid h-7 w-7 place-items-center rounded border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => moveField(idx, 1)}
                        disabled={idx === flowFields.length - 1}
                        className="grid h-7 w-7 place-items-center rounded border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── 4. Advanced Settings ─── */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-sm">
        <button
          onClick={() => setOpenAdvanced(!openAdvanced)}
          className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Sliders className="h-5 w-5 text-emerald-600" />
            <span className="text-base font-bold text-slate-900 dark:text-white">Advanced Settings</span>
          </div>
          {openAdvanced ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
        </button>

        {openAdvanced && (
          <div className="border-t border-slate-100 dark:border-slate-800 p-5 space-y-5">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Primary Color (Hex)</label>
              <input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="#667eea"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Logo URL (Optional)</label>
              <input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="Logo URL (Optional)"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between py-1">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Enable Rate Limiting</span>
                <Toggle checked={rateLimitEnabled} onChange={setRateLimitEnabled} />
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Enable Duplicate Detection</span>
                <Toggle checked={duplicateDetectionEnabled} onChange={setDuplicateDetectionEnabled} />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-600 dark:text-slate-300">Default Priority</label>
              <div className="flex items-center gap-2">
                {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).map((p) => {
                  const active = defaultPriority === p;
                  return (
                    <button
                      key={p}
                      onClick={() => setDefaultPriority(p)}
                      className={cx(
                        'flex items-center gap-1 rounded-full px-4 py-1.5 text-xs font-bold transition-all border',
                        active
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      )}
                    >
                      {active && <Check className="h-3.5 w-3.5" />}
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Bottom Save / Reset Bar ─── */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={loadData}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-rose-500 bg-white py-3 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:bg-slate-900 dark:hover:bg-rose-950/30 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-700 py-3 text-xs font-bold text-white shadow-md transition-all disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Configuration
        </button>
      </div>
    </div>
  );
}

/* ─── System Health ─── */
export function SystemHealthPanel() {
  const services = [
    { name: 'API Gateway', status: 'operational', latency: '42ms', uptime: '99.98%' },
    { name: 'WhatsApp Cloud API', status: 'operational', latency: '128ms', uptime: '99.95%' },
    { name: 'PostgreSQL Database', status: 'operational', latency: '8ms', uptime: '99.99%' },
    { name: 'AI / RAG Engine', status: 'operational', latency: '340ms', uptime: '99.92%' },
    { name: 'Email Service', status: 'degraded', latency: '820ms', uptime: '98.40%' },
    { name: 'Webhook Processor', status: 'operational', latency: '15ms', uptime: '99.97%' },
  ];

  const statusMeta: Record<string, { label: string; dot: string; color: string }> = {
    operational: { label: 'Operational', dot: 'bg-success-500', color: 'bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-300' },
    degraded: { label: 'Degraded', dot: 'bg-warning-500', color: 'bg-warning-100 text-warning-700 dark:bg-warning-500/15 dark:text-warning-300' },
    down: { label: 'Down', dot: 'bg-danger-500', color: 'bg-danger-100 text-danger-700 dark:bg-danger-500/15 dark:text-danger-300' },
  };

  return (
    <div className="space-y-4">
      <SectionCard>
        <PanelHeader title="System Health" desc="Backend telemetry & service status" icon={<Zap className="h-5 w-5 text-primary-600 dark:text-primary-400" />} />

        <div className="flex items-center justify-between rounded-xl2 bg-gradient-accent-soft p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl2 bg-success-500/15">
              <Activity className="h-5 w-5 text-success-600 dark:text-success-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-primary-c">All Systems Operational</p>
              <p className="text-xs text-muted-c">Last checked 2 minutes ago</p>
            </div>
          </div>
          <button className="flex items-center gap-1.5 rounded-lg border border-base-c bg-card-c px-3 py-2 text-xs font-medium text-secondary-c hover:text-primary-c">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <HealthStat icon={Server} label="API Latency" value="42ms" />
          <HealthStat icon={Cpu} label="CPU Usage" value="34%" />
          <HealthStat icon={HardDrive} label="Storage" value="61%" />
          <HealthStat icon={Database} label="DB Queries" value="1.2K/s" />
        </div>
      </SectionCard>

      <SectionCard>
        <h4 className="text-sm font-semibold text-primary-c">Service Status</h4>
        <div className="mt-3 space-y-2">
          {services.map((s) => {
            const meta = statusMeta[s.status];
            return (
              <div key={s.name} className="flex items-center gap-3 rounded-xl2 border border-base-c p-3">
                <span className={cx('h-2.5 w-2.5 shrink-0 rounded-full', meta.dot)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-primary-c">{s.name}</p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-xs font-medium text-secondary-c">{s.latency}</p>
                  <p className="text-[10px] text-muted-c">{s.uptime} uptime</p>
                </div>
                <Badge variant={s.status === 'operational' ? 'success' : 'warning'}>{meta.label}</Badge>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}

function HealthStat({ icon: Icon, label, value }: { icon: typeof Server; label: string; value: string }) {
  return (
    <div className="rounded-xl2 border border-base-c p-3">
      <Icon className="h-4 w-4 text-muted-c" />
      <p className="mt-2 text-lg font-bold text-primary-c tabular-nums">{value}</p>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-c">{label}</p>
    </div>
  );
}

/* ─── Need Help / Support Tickets ─── */
export function NeedHelpPanel() {
  const [tickets, setTickets] = useState<TicketDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modal Form State
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    loadTickets();
  }, []);

  const toast = (msg: string, isErr = false) => {
    if (isErr) { setError(msg); setToastMsg(null); }
    else { setToastMsg(msg); setError(null); }
    setTimeout(() => { setToastMsg(null); setError(null); }, 3500);
  };

  const loadTickets = async () => {
    setLoading(true);
    const res = await fetchTickets();
    setLoading(false);
    if (res.data) {
      setTickets(res.data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast('Subject and Description are required', true);
      return;
    }

    setSubmitting(true);
    const res = await createTicket({
      subject: subject.trim(),
      description: description.trim(),
    });
    setSubmitting(false);

    if (res.data) {
      toast('Support ticket submitted successfully!');
      setSubject('');
      setDescription('');
      setShowModal(false);
      loadTickets();
    } else {
      toast(res.error || 'Failed to submit ticket', true);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return new Date().toLocaleDateString('en-US');
    try {
      const d = new Date(dateStr);
      return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast feedback */}
      {toastMsg && (
        <div className="flex items-center gap-2 rounded-xl2 border border-success-500/20 bg-success-500/10 px-4 py-3 text-sm font-medium text-success-700 dark:text-success-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {toastMsg}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl2 border border-danger-500/20 bg-danger-500/10 px-4 py-3 text-sm font-medium text-danger-700 dark:text-danger-400">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <SectionCard>
        <div className="flex items-center justify-between">
          <PanelHeader
            title="Support Tickets"
            desc="View your support request history or create a new ticket"
            icon={<LifeBuoy className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
          />
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-accent px-4 py-2 text-xs font-semibold text-white transition-transform hover:scale-105 shadow-soft"
          >
            <Plus className="h-3.5 w-3.5" /> New Ticket
          </button>
        </div>

        {/* Tickets List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
            <span className="ml-2 text-sm text-secondary-c">Loading support tickets...</span>
          </div>
        ) : tickets.length === 0 ? (
          <div className="rounded-xl2 border border-base-c p-8 text-center bg-slate-50/50 dark:bg-ink-850/50">
            <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-primary-500/10">
              <LifeBuoy className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <p className="mt-3 text-sm font-semibold text-primary-c">No Support Tickets Yet</p>
            <p className="text-xs text-muted-c mt-1">
              Need assistance? Click &quot;New Ticket&quot; to contact our platform support team.
            </p>
          </div>
        ) : (
          <div className="space-y-3 mt-2">
            {tickets.map((t) => {
              const statusUpper = (t.status || 'OPEN').toUpperCase();
              const commentsCount = t.comments?.length || 0;
              const badgeVariant: 'warning' | 'success' | 'danger' | 'default' =
                statusUpper === 'OPEN' || statusUpper === 'NEW'
                  ? 'warning'
                  : statusUpper === 'RESOLVED' || statusUpper === 'CLOSED'
                  ? 'success'
                  : 'danger';

              return (
                <div
                  key={t.id}
                  className="rounded-xl2 border border-base-c bg-card-c p-4 space-y-2 hover:border-primary-500/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm font-semibold text-primary-c">{t.subject || 'Support Ticket'}</p>
                    <Badge variant={badgeVariant}>{statusUpper}</Badge>
                  </div>

                  {t.description && (
                    <p className="text-xs text-secondary-c line-clamp-2 leading-relaxed">
                      {t.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between border-t border-base-c pt-2.5 text-[11px] text-muted-c">
                    <span>{formatDate(t.createdAt)}</span>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {commentsCount > 0 && <span className="font-semibold text-secondary-c">{commentsCount}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* New Ticket Modal */}
      {showModal && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin rounded-xl2 border border-base-c bg-card-c p-6 shadow-soft-lg space-y-4 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-primary-c">Need Help?</h4>
                <p className="text-xs text-muted-c mt-0.5">
                  Describe your issue below and our platform support team will review it.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="grid h-7 w-7 place-items-center rounded-lg text-muted-c hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 pt-1">
              <div>
                <label className="mb-1 block text-xs font-medium text-secondary-c">Subject</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject"
                  required
                  className="form-input"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-secondary-c">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description"
                  rows={4}
                  required
                  className="form-input resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-base-c px-4 py-2 text-xs font-medium text-secondary-c hover:text-primary-c transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 rounded-lg bg-gradient-accent px-4 py-2 text-xs font-semibold text-white transition-transform hover:scale-105 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  <span>Submit</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

