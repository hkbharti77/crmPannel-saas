import { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Edit3, Loader2, Sparkles } from 'lucide-react';
import { GlassCard } from '@/components/ui/primitives';
import { SmsTemplate } from '@/types/sms';
import { fetchSmsTemplates, saveSmsTemplate, deleteSmsTemplate } from '@/lib/smsApi';

const SYSTEM_VARIABLES = [
  { key: 'lead_name', label: 'Lead Name' },
  { key: 'first_name', label: 'First Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'booking_time', label: 'Booking Time' },
  { key: 'ticket_id', label: 'Ticket ID' },
  { key: 'company_name', label: 'Company' },
];

export function SmsTemplatesPanel() {
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SmsTemplate | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'TRANSACTIONAL' | 'PROMOTIONAL' | 'OTP'>('TRANSACTIONAL');
  const [dltEntityId, setDltEntityId] = useState('');
  const [dltTemplateId, setDltTemplateId] = useState('');
  const [senderId, setSenderId] = useState('');

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSmsTemplates();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Failed to load SMS templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleOpenAdd = () => {
    setEditingTemplate(null);
    setTitle('');
    setContent('');
    setCategory('TRANSACTIONAL');
    setDltEntityId('');
    setDltTemplateId('');
    setSenderId('');
    setModalOpen(true);
  };

  const handleEdit = (tmpl: SmsTemplate) => {
    setEditingTemplate(tmpl);
    setTitle(tmpl.title);
    setContent(tmpl.content);
    setCategory(tmpl.category || 'TRANSACTIONAL');
    setDltEntityId(tmpl.dltEntityId || '');
    setDltTemplateId(tmpl.dltTemplateId || '');
    setSenderId(tmpl.senderId || '');
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this SMS template?')) return;
    try {
      await deleteSmsTemplate(id);
      loadTemplates();
    } catch (err: unknown) {
      alert((err as Error)?.message || 'Failed to delete template');
    }
  };

  const handleSave = async () => {
    if (!title || !content) return;
    setSaving(true);
    try {
      await saveSmsTemplate({
        id: editingTemplate?.id,
        title,
        content,
        category,
        dltEntityId,
        dltTemplateId,
        senderId,
      });
      setModalOpen(false);
      loadTemplates();
    } catch (err: unknown) {
      alert((err as Error)?.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const insertVariable = (varKey: string) => {
    setContent((prev) => prev + `{${varKey}}`);
  };

  // Character calculation
  const charLength = content.length;
  const isUnicode = /[^\x00-\x7F]/.test(content);
  const maxPerSegment = isUnicode ? 70 : 160;
  const segments = Math.max(1, Math.ceil(charLength / maxPerSegment));

  return (
    <div className="space-y-6">
      {/* Sub-header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-base-c pb-5">
        <div>
          <h2 className="text-lg font-bold text-primary-c flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-500" />
            Approved SMS Templates & DLT Registration
          </h2>
          <p className="text-xs text-secondary-c mt-0.5">
            Create approved transactional and promotional SMS templates with India DLT compliance IDs and dynamic placeholders.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Create Template
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium">
          {error}
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-base-c rounded-2xl bg-card-c/50">
          <FileText className="h-10 w-10 text-muted-c mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-primary-c">No SMS Templates Created Yet</h3>
          <p className="text-xs text-secondary-c mt-1 max-w-sm mx-auto">
            Click "Create Template" to add your first template with variable placeholders and DLT template IDs.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tmpl) => (
            <GlassCard
              key={tmpl.id}
              className="p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    {tmpl.category}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(tmpl)}
                      className="p-1.5 rounded-lg text-muted-c hover:text-indigo-500 hover:bg-base-c transition-colors"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => tmpl.id && handleDelete(tmpl.id)}
                      className="p-1.5 rounded-lg text-muted-c hover:text-rose-500 hover:bg-base-c transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <h4 className="text-base font-bold text-primary-c mb-2">{tmpl.title}</h4>
                <p className="text-xs text-secondary-c bg-base-c/60 border border-base-c p-3 rounded-xl font-mono whitespace-pre-wrap mb-4">
                  {tmpl.content}
                </p>

                {tmpl.dltTemplateId && (
                  <div className="space-y-1 text-[11px] text-muted-c bg-base-c/40 p-2.5 rounded-lg border border-base-c">
                    <div>DLT Template ID: <span className="font-mono text-primary-c font-semibold">{tmpl.dltTemplateId}</span></div>
                    {tmpl.dltEntityId && (
                      <div>DLT Entity ID: <span className="font-mono text-primary-c font-semibold">{tmpl.dltEntityId}</span></div>
                    )}
                  </div>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card-c border border-base-c rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-primary-c flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-500" />
              {editingTemplate ? 'Edit SMS Template' : 'Create SMS Template'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-primary-c mb-1">Template Title:</label>
                <input
                  type="text"
                  placeholder="e.g. Appointment Confirmation SMS"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-base-c border border-base-c text-sm text-primary-c focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-primary-c mb-1">Category:</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-base-c border border-base-c text-sm text-primary-c focus:outline-none focus:border-indigo-500"
                >
                  <option value="TRANSACTIONAL">TRANSACTIONAL</option>
                  <option value="PROMOTIONAL">PROMOTIONAL</option>
                  <option value="OTP">OTP</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-primary-c">Insert Variable:</label>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {SYSTEM_VARIABLES.map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => insertVariable(v.key)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-semibold text-[11px] transition-colors"
                    >
                      +{v.label}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={4}
                  placeholder="Hello {lead_name}, your ticket #{ticket_id} is updated."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-base-c border border-base-c text-sm text-primary-c focus:outline-none focus:border-indigo-500 font-mono"
                />

                <div className="flex items-center justify-between text-[11px] text-muted-c mt-1 font-mono">
                  <span>{charLength} chars ({segments} segment{segments > 1 ? 's' : ''}, {isUnicode ? 'Unicode' : 'GSM-7'})</span>
                  <span>Max {maxPerSegment} chars/seg</span>
                </div>
              </div>

              <div className="pt-2 border-t border-base-c space-y-3">
                <p className="font-bold text-primary-c flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  India DLT Registration Metadata (Optional)
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-secondary-c mb-1">DLT Template ID:</label>
                    <input
                      type="text"
                      placeholder="e.g. 140716..."
                      value={dltTemplateId}
                      onChange={(e) => setDltTemplateId(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-base-c border border-base-c text-xs font-mono text-primary-c"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-secondary-c mb-1">DLT Entity ID:</label>
                    <input
                      type="text"
                      placeholder="e.g. 110123..."
                      value={dltEntityId}
                      onChange={(e) => setDltEntityId(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-base-c border border-base-c text-xs font-mono text-primary-c"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-base-c">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-secondary-c hover:text-primary-c"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !title || !content}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
