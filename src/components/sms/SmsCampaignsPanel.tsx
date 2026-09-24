import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Plus, Loader2, Play } from 'lucide-react';
import { GlassCard } from '@/components/ui/primitives';
import { SmsCampaign, SmsTemplate, MaskedSmsProvider } from '@/types/sms';
import { fetchSmsCampaigns, createSmsCampaign, triggerSmsCampaign, fetchSmsTemplates, fetchSmsProviders } from '@/lib/smsApi';

export function SmsCampaignsPanel() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<SmsCampaign[]>([]);
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [providers, setProviders] = useState<MaskedSmsProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [rawPhoneList, setRawPhoneList] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [cData, tData, pData] = await Promise.all([
        fetchSmsCampaigns(),
        fetchSmsTemplates(),
        fetchSmsProviders(),
      ]);
      setCampaigns(Array.isArray(cData) ? cData : []);
      setTemplates(Array.isArray(tData) ? tData : []);
      setProviders(Array.isArray(pData) ? pData : []);
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCampaign = async () => {
    if (!name || !rawPhoneList) return;
    setCreating(true);

    const phones = rawPhoneList
      .split(/[\n,;]+/)
      .map((p) => p.trim())
      .filter((p) => p.length >= 5);

    try {
      await createSmsCampaign({
        name,
        templateId: selectedTemplateId || undefined,
        providerId: selectedProviderId || undefined,
        phoneNumbers: phones,
      });
      setModalOpen(false);
      setName('');
      setRawPhoneList('');
      loadData();
    } catch (err: unknown) {
      alert((err as Error)?.message || 'Failed to create campaign');
    } finally {
      setCreating(false);
    }
  };

  const handleTriggerCampaign = async (id: string) => {
    setTriggeringId(id);
    try {
      await triggerSmsCampaign(id);
      loadData();
    } catch (err: unknown) {
      alert((err as Error)?.message || 'Failed to trigger campaign');
    } finally {
      setTriggeringId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Sub-header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-base-c pb-5">
        <div>
          <h2 className="text-lg font-bold text-primary-c flex items-center gap-2">
            <Send className="h-5 w-5 text-indigo-500" />
            Active SMS Broadcast Campaigns
          </h2>
          <p className="text-xs text-secondary-c mt-0.5">
            Dispatch bulk SMS broadcasts with rate-limiting, DND suppression filtering, and real-time delivery metrics.
          </p>
        </div>
        <button
          onClick={() => navigate('/sms/create')}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all self-start sm:self-auto hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          New SMS Broadcast
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
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-base-c rounded-2xl bg-card-c/50">
          <Send className="h-10 w-10 text-muted-c mx-auto mb-3" />
          <h3 className="text-sm font-bold text-primary-c">No SMS Campaigns Created Yet</h3>
          <p className="text-xs text-secondary-c mt-1 max-w-sm mx-auto">
            Launch your first outbound SMS broadcast campaign and start tracking delivery analytics.
          </p>
          <button
            onClick={() => navigate('/sms/create')}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-4 py-2 text-xs font-bold text-white shadow-md transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create First SMS Campaign</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((c) => (
            <GlassCard
              key={c.id}
              className="p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase border ${
                      c.status === 'COMPLETED'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : c.status === 'PROCESSING'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 animate-pulse'
                        : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                    }`}
                  >
                    {c.status}
                  </span>
                  <span className="text-[11px] text-muted-c">
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}
                  </span>
                </div>

                <h4 className="text-base font-bold text-primary-c mb-2">{c.name}</h4>

                <div className="grid grid-cols-3 gap-2 bg-base-c/40 border border-base-c p-3 rounded-xl text-center text-xs mb-4">
                  <div>
                    <span className="block text-[10px] text-muted-c uppercase font-bold">Total</span>
                    <span className="font-bold text-primary-c mt-0.5 block">{c.totalRecipients || 0}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold">Delivered</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">{c.deliveredCount || 0}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-rose-500 uppercase font-bold">Failed</span>
                    <span className="font-bold text-rose-500 mt-0.5 block">{c.failedCount || 0}</span>
                  </div>
                </div>
              </div>

              {c.status === 'DRAFT' && c.id && (
                <button
                  onClick={() => handleTriggerCampaign(c.id!)}
                  disabled={triggeringId === c.id}
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  {triggeringId === c.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 fill-white" />
                  )}
                  Launch Campaign
                </button>
              )}
            </GlassCard>
          ))}
        </div>
      )}

      {/* New Campaign Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card-c border border-base-c rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-primary-c flex items-center gap-2">
              <Send className="h-5 w-5 text-indigo-500" />
              Create New SMS Campaign
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-primary-c mb-1">Campaign Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Festive Offer SMS Broadcast"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-base-c border border-base-c text-sm text-primary-c focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-primary-c mb-1">Select DLT Template (Optional):</label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-base-c border border-base-c text-sm text-primary-c focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Custom / Direct SMS --</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-primary-c mb-1">
                  Recipient Mobile Numbers (one per line or comma-separated):
                </label>
                <textarea
                  rows={4}
                  placeholder="+919876543210&#10;+919876543211"
                  value={rawPhoneList}
                  onChange={(e) => setRawPhoneList(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-base-c border border-base-c text-sm text-primary-c focus:outline-none focus:border-indigo-500 font-mono"
                />
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
                onClick={handleCreateCampaign}
                disabled={creating || !name || !rawPhoneList}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
              >
                {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Draft Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
