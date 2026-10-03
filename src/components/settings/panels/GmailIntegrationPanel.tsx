import { useState, useEffect } from 'react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import {
  Mail, Loader2, CheckCircle2, AlertCircle, LogOut,
  Send, ExternalLink, ShieldCheck, Sparkles, Inbox, RefreshCw
} from 'lucide-react';
import { PanelHeader, SectionCard } from './_shared';
import {
  fetchGoogleIntegrationStatus,
  fetchGoogleAuthUrl,
  disconnectGoogleIntegration,
  sendGmailEmail,
  fetchGmailStatus
} from '@/lib/integrationsApi';

/* ─── Gmail Workspace Integration Panel ─── */
export function GmailIntegrationPanel({ embedded = false }: { embedded?: boolean } = {}) {
  const [connected, setConnected] = useState(false);
  const [senderEmail, setSenderEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Test Email State
  const [testTo, setTestTo] = useState('');
  const [testSubject, setTestSubject] = useState('Greetings from GyanVaniAi Connect CRM');
  const [testBody, setTestBody] = useState('<p>Hello! This is a test email sent directly through connected <strong>Gmail Workspace API</strong> from GyanVaniAi Connect CRM.</p><p>All replies will automatically land in your Gmail inbox.</p>');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ messageId: string; threadId: string; sentAt: string } | null>(null);

  useEffect(() => {
    // Check URL parameters for OAuth redirect notifications
    const params = new URLSearchParams(window.location.search);
    const connectedFeature = params.get('connected');
    const statusParam = params.get('status');
    const errorParam = params.get('error') || params.get('googleError');

    if (connectedFeature === 'gmail') {
      if (statusParam === 'partial') {
        setMessage('Gmail connected with limited permissions. Some email sending features may be constrained.');
      } else {
        setMessage('Gmail account connected successfully! You can now send emails to CRM leads directly from your Gmail.');
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (errorParam) {
      setError(`Gmail authorization failed: ${decodeURIComponent(errorParam)}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    checkStatus();
  }, []);

  const checkStatus = async () => {
    setLoading(true);
    const res = await fetchGmailStatus();
    setLoading(false);
    if (res.data) {
      setConnected(res.data.connected);
      if (res.data.email) {
        setSenderEmail(res.data.email);
        if (!testTo) setTestTo(res.data.email);
      }
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    const res = await fetchGoogleAuthUrl('GMAIL');
    setConnecting(false);

    if (res.error) {
      setError(`Failed to initiate Gmail OAuth: ${res.error}`);
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
    const res = await disconnectGoogleIntegration('GMAIL');
    setDisconnecting(false);

    if (res.error) {
      setError(`Failed to disconnect: ${res.error}`);
    } else {
      setConnected(false);
      setMessage('Gmail account disconnected successfully.');
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTo.trim() || !testSubject.trim()) {
      setError('Please provide recipient email and subject for the test email');
      return;
    }

    setSendingTest(true);
    setError(null);
    setTestResult(null);

    const res = await sendGmailEmail({
      to: testTo.trim(),
      subject: testSubject.trim(),
      bodyHtml: testBody,
    });

    setSendingTest(false);

    if (res.error) {
      setError(res.error);
    } else if (res.data) {
      setTestResult(res.data);
      setMessage('Test email sent successfully via Gmail API!');
    }
  };

  if (loading) {
    return (
      <SectionCard>
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-7 w-7 animate-spin text-primary-500" />
          <p className="mt-3 text-xs text-muted-c">Checking Gmail integration status…</p>
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-5">
      <SectionCard>
        {!embedded && (
          <PanelHeader
            title="Gmail Integration"
            desc="Send emails to leads, prospects, and clients directly from your connected Google Workspace or personal Gmail account"
            icon={<Mail className="h-5 w-5 text-red-500" />}
          />
        )}

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
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-primary-c">Google Gmail</h3>
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
                    ? `Connected as ${senderEmail || 'authorized account'}. Emails sent from CRM will use your authentic Gmail sender identity.`
                    : 'Authorize GyanVaniAi CRM to send personalized emails from your Gmail account without going to spam.'}
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
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 px-5 py-2.5 text-xs font-bold text-white shadow-soft transition-all cursor-pointer disabled:opacity-50"
                >
                  {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  <span>Connect Gmail</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <div className="rounded-xl border border-base-c bg-slate-50/50 dark:bg-ink-900/40 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-primary-c mb-1">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>High Deliverability</span>
            </div>
            <p className="text-[11px] text-secondary-c leading-relaxed">
              Emails originate directly from Google's high-reputation servers, bypassing bulk spam filters.
            </p>
          </div>
          <div className="rounded-xl border border-base-c bg-slate-50/50 dark:bg-ink-900/40 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-primary-c mb-1">
              <Inbox className="h-4 w-4 text-blue-500" />
              <span>In-Inbox Replies</span>
            </div>
            <p className="text-[11px] text-secondary-c leading-relaxed">
              When clients reply, messages appear directly in your primary Gmail inbox on web & mobile.
            </p>
          </div>
          <div className="rounded-xl border border-base-c bg-slate-50/50 dark:bg-ink-900/40 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-primary-c mb-1">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Lead Sync & Audit</span>
            </div>
            <p className="text-[11px] text-secondary-c leading-relaxed">
              Every dispatched message is tracked with Google Message ID and logged against the CRM lead.
            </p>
          </div>
        </div>

        {/* Interactive Email Test / Compose Sandbox (Only when connected) */}
        {connected ? (
          <div className="rounded-2xl border border-base-c bg-card-c p-6">
            <div className="flex items-center justify-between border-b border-base-c pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-primary-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary-c">
                  Send Test Email via Gmail API
                </h4>
              </div>
              <span className="text-[11px] text-muted-c">Interactive Sandbox</span>
            </div>

            <form onSubmit={handleSendTestEmail} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-secondary-c mb-1">To (Recipient)</label>
                  <input
                    type="email"
                    required
                    value={testTo}
                    onChange={(e) => setTestTo(e.target.value)}
                    placeholder="client@example.com"
                    className="form-input w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-secondary-c mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={testSubject}
                    onChange={(e) => setTestSubject(e.target.value)}
                    placeholder="Subject line"
                    className="form-input w-full text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-secondary-c mb-1">HTML Message Body</label>
                <textarea
                  rows={4}
                  required
                  value={testBody}
                  onChange={(e) => setTestBody(e.target.value)}
                  className="form-input w-full text-xs font-mono"
                  placeholder="<p>Write HTML or plain text here...</p>"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-[11px] text-muted-c flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Sent via <code>POST /api/v1/integrations/google/gmail/send</code></span>
                </div>
                <button
                  type="submit"
                  disabled={sendingTest}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-accent px-5 py-2.5 text-xs font-bold text-white shadow-soft transition-all hover:shadow-glow-blue cursor-pointer disabled:opacity-50"
                >
                  {sendingTest ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  <span>Send Test Email</span>
                </button>
              </div>
            </form>

            {/* Test result output */}
            {testResult && (
              <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs animate-slide-down">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold mb-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Email Dispatched via Gmail API!</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 font-mono text-[11px] text-secondary-c">
                  <div><strong>Message ID:</strong> {testResult.messageId}</div>
                  <div><strong>Thread ID:</strong> {testResult.threadId}</div>
                  <div><strong>Sent At:</strong> {new Date(testResult.sentAt).toLocaleTimeString()}</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-base-c bg-slate-50/50 dark:bg-ink-900/30 p-8 text-center">
            <Mail className="h-10 w-10 text-muted-c mx-auto mb-3 opacity-60" />
            <h4 className="text-sm font-bold text-primary-c">Connect Gmail to unlock in-app emailing</h4>
            <p className="mt-1 text-xs text-secondary-c max-w-md mx-auto">
              Once connected, you can compose and send emails directly from lead cards, follow-up queues, and pipeline views.
            </p>
            <button
              type="button"
              onClick={handleConnect}
              disabled={connecting}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-soft transition-all cursor-pointer"
            >
              {connecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
              <span>Connect Gmail Now</span>
            </button>
          </div>
        )}
      </SectionCard>

      {/* Disconnect Confirmation Modal */}
      <ConfirmModal
        open={disconnectModalOpen}
        title="Disconnect Gmail?"
        message="Are you sure you want to disconnect your Gmail account? You will not be able to send emails directly through Gmail from the CRM until you reconnect."
        confirmLabel="Disconnect"
        variant="danger"
        onConfirm={confirmDisconnect}
        onCancel={() => setDisconnectModalOpen(false)}
      />
    </div>
  );
}
