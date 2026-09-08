import { useState, useEffect } from 'react';
import { cx } from '@/lib/types';
import {
  FormInput, MessageSquare, CheckCircle, AlertCircle, Save, Loader2,
  ChevronUp, ChevronDown, Plus, Trash2, Sliders, FileText, Calendar, ShoppingBag,
  Sparkles, Wand2, Zap, Target
} from 'lucide-react';
import { PanelHeader, Toggle, SectionCard } from './_shared';
import {
  fetchFlowFields, saveFlowFields, fetchFlowGreeting, saveFlowGreeting,
  fetchFlowIntent, saveFlowIntent,
  type FlowFieldConfig, type FormFlowType,
} from '@/lib/flowFieldsApi';

const FLOW_TYPES: { id: FormFlowType; label: string; icon: typeof FileText; desc: string }[] = [
  { id: 'lead', label: 'Lead Collection Form', icon: FileText, desc: 'Customize lead capture questions and qualification fields.' },
  { id: 'appointment', label: 'Appointment Form', icon: Calendar, desc: 'Fields asked when a lead schedules an appointment slot.' },
  { id: 'booking', label: 'Service Booking Form', icon: ShoppingBag, desc: 'Fields asked when a customer orders a catalog service.' },
];

export function FormFieldsPanel() {
  const [activeFlow, setActiveFlow] = useState<FormFlowType>('lead');
  const [fields, setFields] = useState<FlowFieldConfig[]>([]);
  const [greeting, setGreeting] = useState('');
  const [intentDescription, setIntentDescription] = useState('');
  const [triggerExamplesText, setTriggerExamplesText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // New Field Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newType, setNewType] = useState('TEXT');
  const [newOptions, setNewOptions] = useState('');

  const [rawOptionsMap, setRawOptionsMap] = useState<Record<string, string>>({});

  useEffect(() => {
    loadFlowData(activeFlow);
  }, [activeFlow]);

  const loadFlowData = async (flowType: FormFlowType) => {
    setLoading(true);
    setMessage(null);
    setError(null);
    const [fieldsRes, greetingRes, intentRes] = await Promise.all([
      fetchFlowFields(flowType),
      fetchFlowGreeting(flowType),
      fetchFlowIntent(flowType),
    ]);
    setLoading(false);

    if (fieldsRes.data) {
      const sorted = [...fieldsRes.data].sort((a, b) => a.order - b.order);
      setFields(sorted);
    } else if (fieldsRes.error) {
      setError(`Failed to fetch fields: ${fieldsRes.error}`);
    }

    if (greetingRes.data) {
      setGreeting(greetingRes.data.greetingMessage || '');
    }

    if (intentRes.data) {
      setIntentDescription(intentRes.data.intentDescription || '');
      setTriggerExamplesText((intentRes.data.triggerExamples || []).join('\n'));
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);

    // Update orders sequentially based on array index
    const orderedFields = fields.map((f, i) => ({ ...f, order: i + 1 }));
    const triggerExamplesArray = triggerExamplesText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const fieldsRes = await saveFlowFields(activeFlow, orderedFields);
    const greetingRes = await saveFlowGreeting(activeFlow, greeting);
    const intentRes = await saveFlowIntent(activeFlow, intentDescription, triggerExamplesArray);
    setSaving(false);

    if (!fieldsRes.error && !greetingRes.error && !intentRes.error) {
      setMessage('Form fields & AI intent routing configuration saved successfully!');
      setTimeout(() => setMessage(null), 3000);
      loadFlowData(activeFlow);
    } else {
      setError(`Save failed: ${fieldsRes.error || greetingRes.error || intentRes.error}`);
    }
  };

  const moveField = (index: number, dir: -1 | 1) => {
    const newIdx = index + dir;
    if (newIdx < 0 || newIdx >= fields.length) return;
    const next = [...fields];
    [next[index], next[newIdx]] = [next[newIdx], next[index]];
    setFields(next);
  };

  const updateField = (index: number, patch: Partial<FlowFieldConfig>) => {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };

  const handleAddField = () => {
    if (!newLabel.trim()) return;
    const baseKey = newKey.trim() || newLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const generatedKey = baseKey ? `${baseKey}_${Date.now().toString().slice(-4)}` : `field_${Date.now()}`;
    const parsedOptions = newOptions.split(',').map((s) => s.trim()).filter(Boolean);
    const newField: FlowFieldConfig = {
      key: generatedKey,
      label: newLabel.trim(),
      fieldType: newType,
      options: parsedOptions.length > 0 ? parsedOptions : undefined,
      enabled: true,
      required: false,
      order: fields.length + 1,
    };
    setFields((prev) => [...prev, newField]);
    setNewLabel('');
    setNewKey('');
    setNewOptions('');
    setShowAddModal(false);
  };

  const removeField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  const activeFlowMeta = FLOW_TYPES.find((f) => f.id === activeFlow)!;

  return (
    <div className="space-y-4">
      {/* Toast Feedback */}
      {message && (
        <div className="flex items-center gap-2 rounded-xl2 border border-success-500/20 bg-success-500/10 px-4 py-3 text-sm font-medium text-success-700 dark:text-success-400">
          <CheckCircle className="h-4 w-4 shrink-0" /> {message}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl2 border border-danger-500/20 bg-danger-500/10 px-4 py-3 text-sm font-medium text-danger-700 dark:text-danger-400">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <SectionCard>
        <PanelHeader
          title="Form Fields Builder"
          desc="Configure step-by-step questions and lead collection forms across your WhatsApp and Web Chat flows."
          icon={<FormInput className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
        />

        {/* Form Type Selector Tabs */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
          {FLOW_TYPES.map((ft) => {
            const Icon = ft.icon;
            const isSelected = activeFlow === ft.id;
            return (
              <button
                key={ft.id}
                onClick={() => setActiveFlow(ft.id)}
                className={cx(
                  'flex flex-col items-start p-4 rounded-xl2 border-2 text-left transition-all',
                  isSelected
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-sm'
                    : 'border-base-c bg-card-c text-secondary-c hover:border-emerald-500/20',
                )}
              >
                <div className="flex items-center gap-2 font-bold text-sm mb-1">
                  <Icon className="h-4 w-4" /> {ft.label}
                </div>
                <p className="text-[11px] text-muted-c line-clamp-2">{ft.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
            <span className="ml-2 text-sm text-secondary-c">Loading {activeFlowMeta.label} fields…</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* AI Voice & Chatbot Intent Routing Activation Section */}
            <div className="rounded-2xl border border-indigo-200/80 bg-slate-50/80 p-5 dark:border-indigo-900/50 dark:bg-slate-900/50 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-600 text-white shadow-xs">
                    <Target className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      AI Voice & Chatbot Intent Activation
                      <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">({activeFlowMeta.label})</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Configure dynamic database prompts & trigger phrases for AI voice orchestrator and chatbot intent matching.
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-indigo-100 px-3 py-1 text-[11px] font-bold text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  DB Dynamic Tool
                </span>
              </div>

              {/* Intent Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Intent Description for LLM Tool Selector
                </label>
                <textarea
                  value={intentDescription}
                  onChange={(e) => setIntentDescription(e.target.value)}
                  rows={2}
                  maxLength={1000}
                  placeholder={`e.g. Trigger this tool when the customer expresses interest in ${activeFlowMeta.label.toLowerCase()}, asking for details, scheduling, or booking.`}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white leading-relaxed placeholder:text-slate-400"
                />
                <div className="flex items-center justify-between text-[11px] pt-0.5">
                  <p className="text-slate-500 dark:text-slate-400">
                    The AI Voice orchestrator uses this description to dynamically select this form flow during calls.
                  </p>
                  <span className="font-mono font-medium text-slate-400 tabular-nums">
                    {intentDescription.length.toLocaleString()} / 1,000
                  </span>
                </div>
              </div>

              {/* Trigger Examples */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Trigger Examples / Sample User Utterances (One phrase per line)
                </label>
                <textarea
                  value={triggerExamplesText}
                  onChange={(e) => setTriggerExamplesText(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  placeholder={`I want to ${activeFlow === 'appointment' ? 'book an appointment' : activeFlow === 'booking' ? 'order a service' : 'request a callback'}\nCan I schedule a consultation?\nIs someone available to assist me?`}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-sans text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white leading-relaxed placeholder:text-slate-400"
                />
                <div className="flex items-center justify-between text-[11px] pt-0.5">
                  <p className="text-slate-500 dark:text-slate-400">
                    Enter one example phrase per line to train LLM intent classification accuracy across Voice & WhatsApp channels.
                  </p>
                  <span className="font-mono font-medium text-slate-400 tabular-nums">
                    {triggerExamplesText.length.toLocaleString()} / 2,000
                  </span>
                </div>
              </div>
            </div>

            {/* Flow Greeting Message */}
            <div className="rounded-xl2 border border-base-c bg-card-c/50 p-4 space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold text-primary-c">
                <MessageSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                {activeFlowMeta.label} Initial Greeting
              </label>
              <textarea
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                rows={3}
                placeholder={`e.g. 👋 Hello {{contact.firstName}}! Thank you for reaching out. Let us gather a few details to assist you.`}
                className="form-input resize-none"
              />
              <p className="text-[11px] text-muted-c">
                Use <code className="rounded bg-slate-100 px-1 dark:bg-ink-800">{'{{contact.firstName}}'}</code> for first name or <code className="rounded bg-slate-100 px-1 dark:bg-ink-800">{'{{contact.name}}'}</code> for full name. Greeting is sent first before any questions.
              </p>
            </div>

            {/* Field Configurations List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-c">Form Questions ({fields.length})</span>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-dashed border-emerald-500/40 bg-emerald-500/5 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Field
                </button>
              </div>

              {fields.length === 0 ? (
                <div className="rounded-xl2 border border-dashed border-base-c p-8 text-center text-xs text-muted-c">
                  No fields configured for this form flow yet. Click <strong>Add Field</strong> to get started!
                </div>
              ) : (
                <div className="space-y-3">
                  {fields.map((field, idx) => (
                    <div
                      key={field.key || idx}
                      className={cx(
                        'rounded-xl2 border p-4 shadow-sm transition-all space-y-3',
                        field.enabled ? 'border-base-c bg-card-c' : 'border-base-c/50 bg-slate-50/50 opacity-60 dark:bg-ink-900/30',
                      )}
                    >
                      {/* Top Header Row */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col">
                            <button
                              onClick={() => moveField(idx, -1)}
                              disabled={idx === 0}
                              className="text-muted-c hover:text-primary-c disabled:opacity-30"
                            >
                              <ChevronUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => moveField(idx, 1)}
                              disabled={idx === fields.length - 1}
                              className="text-muted-c hover:text-primary-c disabled:opacity-30"
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <span className="grid h-6 w-6 place-items-center rounded-lg bg-emerald-500/10 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                            {idx + 1}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-secondary-c dark:bg-ink-800">
                            {field.fieldType || 'TEXT'}
                          </span>
                          <span className="text-[11px] font-mono text-muted-c">key: {field.key}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-secondary-c">Required</span>
                            <Toggle checked={field.required} onChange={(v) => updateField(idx, { required: v })} />
                          </div>
                          <div className="flex items-center gap-1.5 border-l border-base-c pl-3">
                            <span className="text-[11px] font-semibold text-secondary-c">Enabled</span>
                            <Toggle checked={field.enabled} onChange={(v) => updateField(idx, { enabled: v })} />
                          </div>
                          <button
                            onClick={() => removeField(idx)}
                            className="text-danger-500 hover:bg-danger-500/10 p-1 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Label Input & Field Type */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-[11px] font-semibold text-secondary-c">Question Label</label>
                          <input
                            value={field.label}
                            onChange={(e) => updateField(idx, { label: e.target.value })}
                            placeholder="Field Question Label"
                            className="form-input"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-secondary-c">Field Type</label>
                          <select
                            value={field.fieldType || 'TEXT'}
                            onChange={(e) => updateField(idx, { fieldType: e.target.value })}
                            className="form-input"
                          >
                            <option value="TEXT">Short Text</option>
                            <option value="DROPDOWN">Dropdown Menu</option>
                            <option value="SELECT">Multiple Choice</option>
                            <option value="PHONE">Phone Number</option>
                            <option value="EMAIL">Email Address</option>
                            <option value="DATE">Date Picker</option>
                            <option value="TIME">Time Slot</option>
                            <option value="TEXTAREA">Long Paragraph</option>
                          </select>
                        </div>
                      </div>

                      {/* Options Input for Dropdown / Select / Choice fields */}
                      {['DROPDOWN', 'SELECT', 'RADIO', 'MULTIPLE_CHOICE'].includes((field.fieldType || '').toUpperCase()) && (
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                              <Sliders className="h-3.5 w-3.5" /> Dropdown Options (comma-separated)
                            </label>
                            <span className="text-[10px] text-muted-c">Type choices separated by commas</span>
                          </div>
                          <input
                            value={
                              rawOptionsMap[field.key || idx] !== undefined
                                ? rawOptionsMap[field.key || idx]
                                : (field.options || []).join(', ')
                            }
                            onChange={(e) => {
                              const rawVal = e.target.value;
                              const fieldId = field.key || String(idx);
                              setRawOptionsMap((prev) => ({ ...prev, [fieldId]: rawVal }));
                              const parsed = rawVal.split(',').map((s) => s.trim()).filter(Boolean);
                              updateField(idx, { options: parsed });
                            }}
                            onBlur={() => {
                              const fieldId = field.key || String(idx);
                              if (field.options) {
                                setRawOptionsMap((prev) => ({ ...prev, [fieldId]: field.options!.join(', ') }));
                              }
                            }}
                            placeholder="e.g. Online, Offline  OR  High, Medium, Low"
                            className="form-input bg-white dark:bg-ink-900 border-emerald-500/30 focus:border-emerald-500"
                          />
                          {field.options && field.options.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {field.options.map((opt, i) => (
                                <span key={i} className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                                  Choice {i + 1}: {opt}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-base-c">
              <button
                onClick={handleSaveAll}
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl2 bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Form Configuration
              </button>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Add Custom Field Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-base-c bg-card-c p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-primary-c">Add New Form Field</h3>

            <div>
              <label className="mb-1 block text-xs font-semibold text-secondary-c">Question Label *</label>
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. What is your requirement urgency?"
                className="form-input"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-secondary-c">Field Key (Optional)</label>
              <input
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="e.g. urgency"
                className="form-input"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-secondary-c">Field Type</label>
              <select value={newType} onChange={(e) => setNewType(e.target.value)} className="form-input">
                <option value="TEXT">Short Text</option>
                <option value="DROPDOWN">Dropdown Menu</option>
                <option value="SELECT">Multiple Choice</option>
                <option value="PHONE">Phone Number</option>
                <option value="EMAIL">Email Address</option>
                <option value="DATE">Date Picker</option>
                <option value="TIME">Time Slot</option>
                <option value="TEXTAREA">Long Paragraph</option>
              </select>
            </div>

            {['DROPDOWN', 'SELECT', 'RADIO', 'MULTIPLE_CHOICE'].includes(newType.toUpperCase()) && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Dropdown Options (comma-separated) *
                </label>
                <input
                  value={newOptions}
                  onChange={(e) => setNewOptions(e.target.value)}
                  placeholder="e.g. High, Medium, Low, Urgent"
                  className="form-input border-emerald-500/30"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg border border-base-c px-4 py-2 text-xs font-medium text-secondary-c"
              >
                Cancel
              </button>
              <button
                onClick={handleAddField}
                disabled={!newLabel.trim()}
                className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                Add Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
