import { useState, useEffect } from 'react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import {
  CheckSquare, Loader2, CheckCircle2, AlertCircle, LogOut,
  Plus, Calendar, ShieldCheck, Clock, Check, ListTodo
} from 'lucide-react';
import { PanelHeader, SectionCard } from './_shared';
import {
  fetchTasksStatus,
  listGoogleTasks,
  createGoogleTask,
  completeGoogleTask,
  fetchGoogleAuthUrl,
  disconnectGoogleIntegration,
  GoogleTaskItem
} from '@/lib/integrationsApi';

/* ─── Google Tasks & Reminders Panel ─── */
export function GoogleTasksPanel() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Tasks state
  const [tasks, setTasks] = useState<GoogleTaskItem[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newDue, setNewDue] = useState('');
  const [creating, setCreating] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connectedFeature = params.get('connected');
    const statusParam = params.get('status');
    const errorParam = params.get('error') || params.get('googleError');

    if (connectedFeature === 'tasks') {
      if (statusParam === 'partial') {
        setMessage('Google Tasks connected with partial permissions.');
      } else {
        setMessage('Google Tasks connected successfully! CRM reminders and follow-up tasks are now linked.');
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (errorParam) {
      setError(`Google Tasks authorization failed: ${decodeURIComponent(errorParam)}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    checkStatus();
  }, []);

  const checkStatus = async () => {
    setLoading(true);
    const res = await fetchTasksStatus();
    setLoading(false);
    if (res.data) {
      setConnected(res.data.connected);
      if (res.data.connected) {
        loadTasks();
      }
    }
  };

  const loadTasks = async () => {
    setLoadingTasks(true);
    const res = await listGoogleTasks(20);
    setLoadingTasks(false);
    if (res.data) {
      setTasks(res.data);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    const res = await fetchGoogleAuthUrl('TASKS');
    setConnecting(false);

    if (res.error) {
      setError(`Failed to initiate Tasks OAuth: ${res.error}`);
    } else if (res.data?.url) {
      window.location.href = res.data.url;
    }
  };

  const handleDisconnect = () => {
    setDisconnectModalOpen(true);
  };

  const confirmDisconnect = async () => {
    setDisconnectModalOpen(false);
    setDisconnecting(true);
    setError(null);
    const res = await disconnectGoogleIntegration('TASKS');
    setDisconnecting(false);

    if (res.error) {
      setError(`Failed to disconnect: ${res.error}`);
    } else {
      setConnected(false);
      setTasks([]);
      setMessage('Google Tasks disconnected successfully.');
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setCreating(true);
    setError(null);

    const res = await createGoogleTask({
      title: newTitle.trim(),
      notes: newNotes.trim() || undefined,
      dueDateTime: newDue ? new Date(newDue).toISOString() : undefined,
    });

    setCreating(false);

    if (res.error) {
      setError(res.error);
    } else {
      setNewTitle('');
      setNewNotes('');
      setNewDue('');
      setMessage('Task created in Google Tasks successfully!');
      loadTasks();
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    setCompletingId(taskId);
    const res = await completeGoogleTask(taskId);
    setCompletingId(null);

    if (res.error) {
      setError(res.error);
    } else {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setMessage('Task marked as completed!');
    }
  };

  if (loading) {
    return (
      <SectionCard>
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-7 w-7 animate-spin text-primary-500" />
          <p className="mt-3 text-xs text-muted-c">Checking Google Tasks integration status…</p>
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-5">
      <SectionCard>
        <PanelHeader
          title="Google Tasks & Reminders Sync"
          desc="Sync lead follow-ups, CRM reminders, and inspection action items directly to your Google Tasks app"
          icon={<CheckSquare className="h-5 w-5 text-amber-500" />}
        />

        {message && (
          <div className="flex items-center gap-2 rounded-xl border border-success-500/20 bg-success-500/10 p-3 text-xs text-success-600 dark:text-success-400 mb-4 animate-slide-down">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-danger-500/20 bg-danger-500/10 p-3 text-xs text-danger-600 dark:text-danger-400 mb-4 animate-slide-down">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Status Card */}
        <div className="rounded-2xl border border-base-c bg-card-c p-5 mb-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <CheckSquare className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-primary-c">Google Tasks API</h3>
                  {connected ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      CONNECTED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2.5 py-0.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 border border-slate-500/20">
                      NOT CONNECTED
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-secondary-c max-w-xl leading-relaxed">
                  {connected
                    ? 'Connected. Lead follow-ups and site visit reminders can now be pushed directly to your Google Tasks app.'
                    : 'Link your Google Tasks account to keep all daily real estate follow-ups synchronized on mobile and web.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-center">
              {connected ? (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="inline-flex items-center gap-2 rounded-xl border border-danger-500/30 bg-danger-500/10 hover:bg-danger-500/20 px-4 py-2 text-xs font-semibold text-danger-600 dark:text-danger-400 transition-all cursor-pointer disabled:opacity-50"
                >
                  {disconnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
                  <span>Disconnect</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={connecting}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-soft transition-all cursor-pointer disabled:opacity-50"
                >
                  {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckSquare className="h-4 w-4" />}
                  <span>Connect Google Tasks</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {connected ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Quick Task Creation Form */}
            <div className="rounded-2xl border border-base-c bg-card-c p-5 shadow-xs">
              <div className="flex items-center gap-2 border-b border-base-c pb-3 mb-4">
                <Plus className="h-4 w-4 text-primary-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary-c">
                  Create Task in Google Tasks
                </h4>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-secondary-c mb-1">Task Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Call Rahul Sharma regarding 3BHK visit"
                    className="form-input w-full text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-secondary-c mb-1">Due Date & Time (Optional)</label>
                  <input
                    type="datetime-local"
                    value={newDue}
                    onChange={(e) => setNewDue(e.target.value)}
                    className="form-input w-full text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-secondary-c mb-1">Notes / Description (Optional)</label>
                  <textarea
                    rows={3}
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="Budget 1.2 Cr, preferred floor 5-10..."
                    className="form-input w-full text-xs"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={creating}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-accent py-2.5 text-xs font-bold text-white shadow-soft transition-all hover:shadow-glow-blue disabled:opacity-50 cursor-pointer"
                  >
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    <span>Add Task to Google</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Active Google Tasks List */}
            <div className="rounded-2xl border border-base-c bg-card-c p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-base-c pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <ListTodo className="h-4 w-4 text-amber-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary-c">
                    Active Tasks in Google
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={loadTasks}
                  disabled={loadingTasks}
                  className="text-[11px] font-medium text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Refresh
                </button>
              </div>

              {loadingTasks ? (
                <div className="py-12 flex flex-col items-center justify-center text-xs text-muted-c">
                  <Loader2 className="h-5 w-5 animate-spin text-primary-500 mb-2" />
                  <span>Loading tasks from Google...</span>
                </div>
              ) : tasks.length === 0 ? (
                <div className="py-12 text-center text-xs text-secondary-c">
                  <CheckSquare className="h-8 w-8 text-muted-c mx-auto mb-2 opacity-50" />
                  <p>No active tasks found in your Google Tasks default list.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start justify-between gap-3 p-3 rounded-xl border border-base-c bg-slate-50/50 dark:bg-ink-900/40 hover:bg-slate-100/50 dark:hover:bg-ink-900/80 transition-all text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-primary-c truncate">{task.title}</p>
                        {task.notes && <p className="text-[11px] text-secondary-c mt-0.5 line-clamp-1">{task.notes}</p>}
                        {task.due && (
                          <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                            <Clock className="h-3 w-3" />
                            <span>Due: {new Date(task.due).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCompleteTask(task.id)}
                        disabled={completingId === task.id}
                        title="Mark as completed"
                        className="p-1.5 rounded-lg border border-base-c text-secondary-c hover:text-emerald-500 hover:border-emerald-500/40 transition-colors shrink-0"
                      >
                        {completingId === task.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-base-c bg-slate-50/50 dark:bg-ink-900/30 p-8 text-center">
            <CheckSquare className="h-10 w-10 text-muted-c mx-auto mb-3 opacity-60" />
            <h4 className="text-sm font-bold text-primary-c">Connect Google Tasks to sync reminders</h4>
            <p className="mt-1 text-xs text-secondary-c max-w-md mx-auto">
              Stay organized on the go with real-time sync between your CRM reminders and Google Tasks on your Android or iPhone.
            </p>
            <button
              type="button"
              onClick={handleConnect}
              disabled={connecting}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-2.5 text-xs font-bold text-white shadow-soft transition-all cursor-pointer"
            >
              {connecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckSquare className="h-3.5 w-3.5" />}
              <span>Connect Google Tasks Now</span>
            </button>
          </div>
        )}
      </SectionCard>

      {/* Disconnect Confirmation Modal */}
      <ConfirmModal
        isOpen={disconnectModalOpen}
        title="Disconnect Google Tasks?"
        message="Are you sure you want to disconnect Google Tasks? Tasks already created in Google will remain preserved in your Google account."
        confirmText="Disconnect"
        variant="danger"
        onConfirm={confirmDisconnect}
        onCancel={() => setDisconnectModalOpen(false)}
      />
    </div>
  );
}
