import { useState, useEffect } from 'react';
import { cx } from '@/lib/types';
import {
  MousePointerClick, Save, Loader2, CheckCircle, AlertCircle,
  Plus, Trash2, Link as LinkIcon, Check, AlertCircle as RedDot,
} from 'lucide-react';
import { PanelHeader, SectionCard } from './_shared';
import { apiFetch } from '@/lib/api';

interface ButtonItem {
  id: string;
  label: string;
  linkType: 'lead' | 'appointment' | 'catalog';
}

interface FlowSectionConfig {
  enabled: boolean;
  message?: string;
  buttons: ButtonItem[];
}

interface WhatsAppConfigData {
  guardrailMessageAbuse?: string;
  guardrailMessageGibberish?: string;
  flowCancelMenuJson?: string;
  flowCompletionMenuJson?: string;
  aiResponseMenuJson?: string;
}

const DEFAULT_ABUSE = "We're unable to respond to inappropriate or abusive messages.\n\nPlease keep your messages respectful and choose an option from the menu below or ask a business-related question. We're happy to assist you.";
const DEFAULT_GIBBERISH = "Sorry, we couldn't understand your message.\n\nPlease rephrase your question in simple language or choose an option from the menu below. We're here to help.";

const DEFAULT_CANCEL_MSG = "Your form has been terminated.";
const DEFAULT_COMPLETE_MSG = "Thank you for contacting support! We've received your request and will get back to you shortly.";

const DEFAULT_BUTTONS: ButtonItem[] = [
  { id: 'btn_1', label: 'Enquire Now', linkType: 'lead' },
  { id: 'btn_2', label: 'Book Appointment', linkType: 'appointment' },
  { id: 'btn_3', label: 'Our Services', linkType: 'catalog' },
];

const LINK_LABELS: Record<'lead' | 'appointment' | 'catalog', string> = {
  lead: 'Lead Form Linked',
  appointment: 'Appointment Form Linked',
  catalog: 'Catalog Linked',
};

const makeId = () => `btn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

export function FlowCTAPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [abuseMsg, setAbuseMsg] = useState(DEFAULT_ABUSE);
  const [gibberishMsg, setGibberishMsg] = useState(DEFAULT_GIBBERISH);

  const [cancelConfig, setCancelConfig] = useState<FlowSectionConfig>({
    enabled: true,
    message: DEFAULT_CANCEL_MSG,
    buttons: [...DEFAULT_BUTTONS],
  });

  const [completeConfig, setCompleteConfig] = useState<FlowSectionConfig>({
    enabled: true,
    message: DEFAULT_COMPLETE_MSG,
    buttons: [...DEFAULT_BUTTONS],
  });

  const [aiConfig, setAiConfig] = useState<FlowSectionConfig>({
    enabled: true,
    buttons: [...DEFAULT_BUTTONS],
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const toast = (msg: string, isErr = false) => {
    if (isErr) { setError(msg); setToastMessage(null); }
    else { setToastMessage(msg); setError(null); }
    setTimeout(() => { setToastMessage(null); setError(null); }, 3500);
  };

  const loadConfig = async () => {
    setLoading(true);
    const res = await apiFetch<WhatsAppConfigData>('/api/v1/whatsapp-config');
    setLoading(false);

    if (res.data) {
      if (res.data.guardrailMessageAbuse) setAbuseMsg(res.data.guardrailMessageAbuse);
      if (res.data.guardrailMessageGibberish) setGibberishMsg(res.data.guardrailMessageGibberish);

      // Cancel Flow
      if (res.data.flowCancelMenuJson) {
        try {
          const parsed = JSON.parse(res.data.flowCancelMenuJson);
          if (Array.isArray(parsed)) {
            setCancelConfig({ enabled: true, message: DEFAULT_CANCEL_MSG, buttons: parsed });
          } else {
            setCancelConfig({
              enabled: parsed.enabled ?? true,
              message: parsed.message ?? DEFAULT_CANCEL_MSG,
              buttons: parsed.buttons ?? [...DEFAULT_BUTTONS],
            });
          }
        } catch { /* ignore */ }
      }

      // Complete Flow
      if (res.data.flowCompletionMenuJson) {
        try {
          const parsed = JSON.parse(res.data.flowCompletionMenuJson);
          if (Array.isArray(parsed)) {
            setCompleteConfig({ enabled: true, message: DEFAULT_COMPLETE_MSG, buttons: parsed });
          } else {
            setCompleteConfig({
              enabled: parsed.enabled ?? true,
              message: parsed.message ?? DEFAULT_COMPLETE_MSG,
              buttons: parsed.buttons ?? [...DEFAULT_BUTTONS],
            });
          }
        } catch { /* ignore */ }
      }

      // AI Response
      if (res.data.aiResponseMenuJson) {
        try {
          const parsed = JSON.parse(res.data.aiResponseMenuJson);
          if (Array.isArray(parsed)) {
            setAiConfig({ enabled: true, buttons: parsed });
          } else {
            setAiConfig({
              enabled: parsed.enabled ?? true,
              buttons: parsed.buttons ?? [...DEFAULT_BUTTONS],
            });
          }
        } catch { /* ignore */ }
      }
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    const payload = {
      guardrailMessageAbuse: abuseMsg,
      guardrailMessageGibberish: gibberishMsg,
      flowCancelMenuJson: JSON.stringify(cancelConfig),
      flowCompletionMenuJson: JSON.stringify(completeConfig),
      aiResponseMenuJson: JSON.stringify(aiConfig),
    };

    const res = await apiFetch('/api/v1/whatsapp-config', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setSaving(false);

    if (!res.error) {
      toast('Configuration saved successfully!');
    } else {
      toast(`Save failed: ${res.error}`, true);
    }
  };

  // Helper button mutators
  const updateButton = (
    section: 'cancel' | 'complete' | 'ai',
    idx: number,
    field: 'label' | 'linkType',
    val: any
  ) => {
    const setter = section === 'cancel' ? setCancelConfig : section === 'complete' ? setCompleteConfig : setAiConfig;
    setter((prev) => {
      const nextBtns = [...prev.buttons];
      nextBtns[idx] = { ...nextBtns[idx], [field]: val };
      return { ...prev, buttons: nextBtns };
    });
  };

  const deleteButton = (section: 'cancel' | 'complete' | 'ai', idx: number) => {
    const setter = section === 'cancel' ? setCancelConfig : section === 'complete' ? setCompleteConfig : setAiConfig;
    setter((prev) => ({
      ...prev,
      buttons: prev.buttons.filter((_, i) => i !== idx),
    }));
  };

  const addButton = (section: 'cancel' | 'complete' | 'ai') => {
    const setter = section === 'cancel' ? setCancelConfig : section === 'complete' ? setCompleteConfig : setAiConfig;
    setter((prev) => {
      if (prev.buttons.length >= 3) return prev;
      const types: ('lead' | 'appointment' | 'catalog')[] = ['lead', 'appointment', 'catalog'];
      const nextType = types[prev.buttons.length % 3];
      return {
        ...prev,
        buttons: [...prev.buttons, { id: makeId(), label: 'New Action', linkType: nextType }],
      };
    });
  };

  const cycleLinkType = (section: 'cancel' | 'complete' | 'ai', idx: number, current: 'lead' | 'appointment' | 'catalog') => {
    const order: ('lead' | 'appointment' | 'catalog')[] = ['lead', 'appointment', 'catalog'];
    const nextIdx = (order.indexOf(current) + 1) % order.length;
    updateButton(section, idx, 'linkType', order[nextIdx]);
  };

  if (loading) {
    return (
      <SectionCard>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
          <span className="ml-2 text-sm text-secondary-c">Loading Flow CTA Buttons...</span>
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-12">
      {/* Header Toast Messages */}
      {toastMessage && (
        <div className="flex items-center gap-2 rounded-xl2 border border-success-500/20 bg-success-500/10 px-4 py-3 text-sm font-medium text-success-700 dark:text-success-400">
          <CheckCircle className="h-4 w-4 shrink-0" /> {toastMessage}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl2 border border-danger-500/20 bg-danger-500/10 px-4 py-3 text-sm font-medium text-danger-700 dark:text-danger-400">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Main Card Container */}
      <div className="space-y-6">

        {/* ─── 1. AI Fallback / Guardrail Messages ─── */}
        <SectionCard>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">AI Fallback / Guardrail Messages</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              These messages are sent inside the Main Menu when the AI blocks abusive or gibberish text.
            </p>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Abuse Fallback Message
              </label>
              <textarea
                value={abuseMsg}
                onChange={(e) => setAbuseMsg(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Gibberish Fallback Message
              </label>
              <textarea
                value={gibberishMsg}
                onChange={(e) => setGibberishMsg(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </SectionCard>

        {/* ─── 2. Cancel Flow Buttons ─── */}
        <SectionCard>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Cancel Flow Buttons</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Buttons shown when a user types &quot;cancel&quot; to stop an active form.
              </p>
            </div>
            {/* Toggle switch */}
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={cancelConfig.enabled}
                onChange={(e) => setCancelConfig({ ...cancelConfig, enabled: e.target.checked })}
                className="peer sr-only"
              />
              <div className="h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-600 peer-checked:after:translate-x-full peer-focus:outline-none dark:bg-slate-700" />
            </label>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Message Text
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 top-3 text-rose-500 font-bold text-xs">🔴</span>
                <textarea
                  value={cancelConfig.message || ''}
                  onChange={(e) => setCancelConfig({ ...cancelConfig, message: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-8 pr-3 text-xs font-medium text-slate-800 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Buttons list */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Buttons (Max 3)</span>
                {cancelConfig.buttons.length < 3 && (
                  <button
                    onClick={() => addButton('cancel')}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Button
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {cancelConfig.buttons.map((btn, idx) => (
                  <div key={btn.id || idx} className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <input
                        value={btn.label}
                        onChange={(e) => updateButton('cancel', idx, 'label', e.target.value)}
                        placeholder="Button text"
                        className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                      <button
                        onClick={() => deleteButton('cancel', idx)}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => cycleLinkType('cancel', idx, btn.linkType)}
                      className="w-full flex items-center justify-center gap-1.5 rounded-full bg-amber-500 hover:bg-amber-600 py-2 px-4 text-xs font-bold text-white shadow-sm transition-colors"
                    >
                      <LinkIcon className="h-3.5 w-3.5" />
                      {LINK_LABELS[btn.linkType]}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ─── 3. Complete Flow Buttons ─── */}
        <SectionCard>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Complete Flow Buttons</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Buttons shown when a user successfully submits a form.
              </p>
            </div>
            {/* Toggle switch */}
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={completeConfig.enabled}
                onChange={(e) => setCompleteConfig({ ...completeConfig, enabled: e.target.checked })}
                className="peer sr-only"
              />
              <div className="h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-600 peer-checked:after:translate-x-full peer-focus:outline-none dark:bg-slate-700" />
            </label>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Message Text
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 top-3 text-emerald-600 font-bold text-xs">
                  <Check className="h-4 w-4 text-emerald-600" />
                </span>
                <textarea
                  value={completeConfig.message || ''}
                  onChange={(e) => setCompleteConfig({ ...completeConfig, message: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs font-medium text-slate-800 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Buttons list */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Buttons (Max 3)</span>
                {completeConfig.buttons.length < 3 && (
                  <button
                    onClick={() => addButton('complete')}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Button
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {completeConfig.buttons.map((btn, idx) => (
                  <div key={btn.id || idx} className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <input
                        value={btn.label}
                        onChange={(e) => updateButton('complete', idx, 'label', e.target.value)}
                        placeholder="Button text"
                        className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                      <button
                        onClick={() => deleteButton('complete', idx)}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => cycleLinkType('complete', idx, btn.linkType)}
                      className="w-full flex items-center justify-center gap-1.5 rounded-full bg-amber-500 hover:bg-amber-600 py-2 px-4 text-xs font-bold text-white shadow-sm transition-colors"
                    >
                      <LinkIcon className="h-3.5 w-3.5" />
                      {LINK_LABELS[btn.linkType]}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ─── 4. AI Response Buttons ─── */}
        <SectionCard>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">AI Response Buttons</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Buttons attached to every AI conversation message. If disabled, AI will reply with plain text.
              </p>
            </div>
            {/* Toggle switch */}
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={aiConfig.enabled}
                onChange={(e) => setAiConfig({ ...aiConfig, enabled: e.target.checked })}
                className="peer sr-only"
              />
              <div className="h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-600 peer-checked:after:translate-x-full peer-focus:outline-none dark:bg-slate-700" />
            </label>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Buttons (Max 3)</span>
              {aiConfig.buttons.length < 3 && (
                <button
                  onClick={() => addButton('ai')}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Button
                </button>
              )}
            </div>

            <div className="space-y-3">
              {aiConfig.buttons.map((btn, idx) => (
                <div key={btn.id || idx} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <input
                      value={btn.label}
                      onChange={(e) => updateButton('ai', idx, 'label', e.target.value)}
                      placeholder="Button text"
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                    <button
                      onClick={() => deleteButton('ai', idx)}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => cycleLinkType('ai', idx, btn.linkType)}
                    className="w-full flex items-center justify-center gap-1.5 rounded-full bg-amber-500 hover:bg-amber-600 py-2 px-4 text-xs font-bold text-white shadow-sm transition-colors"
                  >
                    <LinkIcon className="h-3.5 w-3.5" />
                    {LINK_LABELS[btn.linkType]}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* ─── Bottom Save Button ─── */}
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-accent py-3.5 text-sm font-bold text-white shadow-soft transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Configuration
        </button>

      </div>
    </div>
  );
}
