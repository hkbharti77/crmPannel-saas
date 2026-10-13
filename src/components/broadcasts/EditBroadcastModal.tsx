import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/primitives';
import {
  type WhatsAppTemplateDto,
  updateCampaign,
  type UpdateCampaignPayload,
} from '@/lib/broadcastsApi';
import { type Broadcast } from './broadcastData';
import { X, Calendar, Clock, Sparkles, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface EditBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  broadcast: Broadcast | null;
  templates: WhatsAppTemplateDto[];
  onUpdated: () => void;
}

export function EditBroadcastModal({
  isOpen,
  onClose,
  broadcast,
  templates,
  onUpdated,
}: EditBroadcastModalProps) {
  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (broadcast) {
      setName(broadcast.title || '');
      setTemplateId(broadcast.template || '');
      // Format scheduledAt to datetime-local string if present
      if (broadcast.scheduledAt) {
        try {
          const date = new Date(broadcast.scheduledAt);
          const localIso = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
          setScheduledAt(localIso);
        } catch {
          setScheduledAt('');
        }
      } else {
        setScheduledAt('');
      }
      setError(null);
      setSuccess(false);
    }
  }, [broadcast, isOpen]);

  if (!isOpen || !broadcast) return null;

  const isScheduled = broadcast.status?.toLowerCase() === 'scheduled';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!name.trim()) {
      setError('Campaign name is required.');
      return;
    }

    const payload: UpdateCampaignPayload = {
      name: name.trim(),
    };

    if (templateId) {
      payload.templateId = templateId;
    }

    if (isScheduled && scheduledAt) {
      const scheduledDate = new Date(scheduledAt);
      const minFutureTime = new Date(Date.now() + 60 * 1000);
      if (scheduledDate <= minFutureTime) {
        setError('Scheduled execution time must be at least 1 minute in the future.');
        return;
      }
      payload.scheduledAt = scheduledDate.toISOString();
    }

    setLoading(true);
    const res = await updateCampaign(broadcast.id, payload);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(true);
      setTimeout(() => {
        onUpdated();
        onClose();
      }, 700);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <GlassCard className="relative w-full max-w-lg p-6 bg-card-c border-base-c shadow-2xl rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-base-c">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-primary-c">
                {isScheduled ? 'Reschedule & Edit Campaign' : 'Edit Draft Campaign'}
              </h3>
              <p className="text-xs text-secondary-c">
                Update parameters and Quartz distributed job schedule
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-c hover:text-primary-c hover:bg-slate-100 dark:hover:bg-ink-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Campaign updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Campaign Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-c">
              Campaign Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Diwali Premium Offer Broadcast"
              className="w-full rounded-xl border border-base-c bg-subtle-c px-3.5 py-2 text-xs text-primary-c placeholder:text-muted-c focus:border-primary-500 focus:outline-none"
              required
            />
          </div>

          {/* WhatsApp Template Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-c">
              WhatsApp Message Template
            </label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="w-full rounded-xl border border-base-c bg-subtle-c px-3 py-2 text-xs text-primary-c focus:border-primary-500 focus:outline-none"
            >
              <option value="">Keep current template ({broadcast.template})</option>
              {templates
                .filter((t) => (t.status || '').toUpperCase() === 'APPROVED')
                .map((t) => (
                  <option key={t.id || t.name} value={t.id || t.name}>
                    {t.name} ({t.category} - {t.language})
                  </option>
                ))}
            </select>
          </div>

          {/* Schedule Date & Time (for scheduled campaigns) */}
          {isScheduled && (
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-c">
                <Clock className="h-3.5 w-3.5 text-emerald-500" />
                Reschedule Execution Time
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full rounded-xl border border-base-c bg-subtle-c px-3.5 py-2 text-xs text-primary-c focus:border-primary-500 focus:outline-none"
                required={isScheduled}
              />
              <p className="text-[11px] text-muted-c flex items-center gap-1">
                <Calendar className="h-3 w-3 text-emerald-500" />
                Modifying the time will atomically reschedule the Quartz distributed trigger.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-base-c">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-base-c bg-card-c px-4 py-2 text-xs font-bold text-secondary-c hover:text-primary-c transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-4 py-2 text-xs font-bold text-white shadow-soft transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
