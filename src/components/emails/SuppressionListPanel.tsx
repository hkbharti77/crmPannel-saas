import { useState, useEffect, useMemo } from 'react';
import {
  fetchEmailSuppressions,
  addEmailSuppression,
  deleteEmailSuppression,
  EmailSuppressionDTO,
  SuppressionReason,
} from '@/lib/emailsApi';
import { GlassCard } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import {
  ShieldAlert,
  Search,
  Plus,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  X,
  Mail,
  Filter,
} from 'lucide-react';

const REASON_BADGE_META: Record<SuppressionReason, { label: string; color: string }> = {
  UNSUBSCRIBED: { label: 'Unsubscribed', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300' },
  HARD_BOUNCE: { label: 'Hard Bounce', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300' },
  SOFT_BOUNCE: { label: 'Soft Bounce', color: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-300' },
  COMPLAINT: { label: 'Spam Complaint', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300' },
  MANUAL: { label: 'Manual Addition', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300' },
  INVALID: { label: 'Invalid Address', color: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300 border-slate-300' },
};

export function SuppressionListPanel() {
  const [suppressions, setSuppressions] = useState<EmailSuppressionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [reasonFilter, setReasonFilter] = useState<string>('ALL');

  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newReason, setNewReason] = useState<SuppressionReason>('MANUAL');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);

  const showToast = (msg: string, isError = false) => {
    setToast({ message: msg, isError });
    setTimeout(() => setToast(null), 4000);
  };

  const loadSuppressions = async () => {
    setLoading(true);
    setError(null);
    const res = await fetchEmailSuppressions();
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else if (res.data) {
      setSuppressions(res.data);
    }
  };

  useEffect(() => {
    loadSuppressions();
  }, []);

  const handleAddSuppression = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setSubmitting(true);
    const res = await addEmailSuppression(newEmail.trim(), newReason);
    setSubmitting(false);

    if (res.error) {
      showToast(res.error, true);
    } else {
      showToast(`Added ${newEmail.trim()} to tenant suppression list.`);
      setNewEmail('');
      setShowAddModal(false);
      loadSuppressions();
    }
  };

  const handleDeleteSuppression = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to remove "${email}" from the suppression list?`)) return;

    const res = await deleteEmailSuppression(id);
    if (res.error) {
      showToast(res.error, true);
    } else {
      showToast(`Removed "${email}" from suppression list.`);
      setSuppressions((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const filteredSuppressions = useMemo(() => {
    return suppressions.filter((s) => {
      const matchSearch = !search || s.email.toLowerCase().includes(search.toLowerCase());
      const matchReason = reasonFilter === 'ALL' || s.reason === reasonFilter;
      return matchSearch && matchReason;
    });
  }, [suppressions, search, reasonFilter]);

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Toast */}
      {toast && (
        <div
          className={cx(
            'fixed top-5 right-5 z-50 flex items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-semibold shadow-2xl border transition-all animate-in slide-in-from-top-4 duration-300',
            toast.isError
              ? 'bg-rose-950 text-rose-200 border-rose-800/80 shadow-rose-950/40'
              : 'bg-emerald-950 text-emerald-200 border-emerald-800/80 shadow-emerald-950/40'
          )}
        >
          {toast.isError ? (
            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
          ) : (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          )}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-xs opacity-60 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card-c p-3.5 rounded-2xl border border-base-c shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-c" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search suppressed email addresses..."
            className="w-full pl-10 pr-8 py-2 bg-transparent text-xs text-primary-c focus:outline-none placeholder:text-muted-c font-medium"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-c hover:text-primary-c">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-c shrink-0" />
            <select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              className="rounded-xl border border-base-c bg-card-c px-3 py-1.5 text-xs text-secondary-c focus:border-indigo-500 focus:outline-none"
            >
              <option value="ALL">All Reasons ({suppressions.length})</option>
              <option value="UNSUBSCRIBED">Unsubscribed</option>
              <option value="HARD_BOUNCE">Hard Bounce</option>
              <option value="SOFT_BOUNCE">Soft Bounce</option>
              <option value="COMPLAINT">Spam Complaint</option>
              <option value="MANUAL">Manual</option>
            </select>
          </div>

          <button
            onClick={loadSuppressions}
            className="p-2 rounded-xl border border-base-c bg-white dark:bg-ink-850 text-muted-c hover:text-primary-c hover:bg-slate-50 transition-all cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={cx('h-4 w-4', loading ? 'animate-spin' : '')} />
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 px-4 py-2 text-xs font-bold text-white shadow-soft transition-all duration-200 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Suppressed Email</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 rounded-2xl flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-xs font-bold">{error}</p>
        </div>
      )}

      {/* Suppressed List Table */}
      <GlassCard className="overflow-hidden p-0 border-base-c shadow-xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent mb-3" />
            <p className="font-bold text-xs text-primary-c">Loading tenant suppression list...</p>
          </div>
        ) : filteredSuppressions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="h-16 w-16 rounded-3xl bg-slate-100 dark:bg-ink-850 flex items-center justify-center mb-4">
              <ShieldAlert className="h-8 w-8 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-base font-bold text-primary-c">No suppressed contacts found</h3>
            <p className="text-xs text-secondary-c mt-1 max-w-sm">
              {search
                ? 'No suppressed contacts match your search query.'
                : 'Your tenant suppression list is empty. Suppressed emails (opt-outs, bounces, complaints) will automatically appear here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-base-c bg-slate-50/50 dark:bg-ink-900/50 text-[10px] font-extrabold uppercase tracking-wider text-muted-c">
                  <th className="py-3.5 px-6">Suppressed Email Address</th>
                  <th className="py-3.5 px-4">Suppression Reason</th>
                  <th className="py-3.5 px-4">Date Added</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-c/60 text-xs font-medium text-secondary-c">
                {filteredSuppressions.map((item) => {
                  const badge = REASON_BADGE_META[item.reason] || REASON_BADGE_META.MANUAL;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-ink-850/50 transition-colors group">
                      <td className="py-3.5 px-6 font-bold text-primary-c flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                          <Mail className="h-4 w-4" />
                        </div>
                        <span className="font-mono text-xs">{item.email}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={cx('inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider border', badge.color)}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-muted-c font-mono text-[11px]">
                        {item.createdAt ? new Date(item.createdAt).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={() => handleDeleteSuppression(item.id, item.email)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-rose-500/20 text-rose-600 hover:bg-rose-500/10 transition-colors text-xs font-bold cursor-pointer"
                          title="Remove from suppression list (Unsuppress)"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Unsuppress</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4" onClick={() => setShowAddModal(false)}>
          <div
            className="w-full max-w-md rounded-2xl border border-base-c bg-card-c p-6 shadow-2xl animate-in zoom-in-95 duration-150 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-base-c pb-3">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <ShieldAlert className="h-5 w-5" />
                <h3 className="text-base font-bold text-primary-c">Add Suppressed Email</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-muted-c hover:text-primary-c">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddSuppression} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-secondary-c">Target Email Address *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="contact@company.com"
                  className="w-full rounded-xl border border-base-c bg-slate-50 dark:bg-ink-900 px-3.5 py-2 text-xs text-primary-c outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-secondary-c">Suppression Reason</label>
                <select
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value as SuppressionReason)}
                  className="w-full rounded-xl border border-base-c bg-slate-50 dark:bg-ink-900 px-3.5 py-2 text-xs text-primary-c outline-none focus:border-rose-500 font-bold"
                >
                  <option value="MANUAL">Manual Addition</option>
                  <option value="UNSUBSCRIBED">Unsubscribed</option>
                  <option value="HARD_BOUNCE">Hard Bounce</option>
                  <option value="COMPLAINT">Spam Complaint</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-base-c">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-base-c bg-white dark:bg-ink-850 px-4 py-2 text-xs font-bold text-secondary-c hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newEmail.trim()}
                  className="rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-5 py-2 text-xs font-bold text-white shadow-soft hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add to Suppression List'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
