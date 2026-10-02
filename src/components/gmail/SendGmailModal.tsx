import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import {
  Mail, X, Send, Loader2, AlertCircle, CheckCircle2,
  ChevronDown, ChevronUp, ShieldCheck, Sparkles
} from 'lucide-react';
import { sendGmailEmail, fetchGmailStatus, fetchGoogleAuthUrl } from '@/lib/integrationsApi';

interface SendGmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTo?: string;
  defaultSubject?: string;
  leadId?: string;
  onSent?: (result: { messageId: string; threadId: string }) => void;
}

export function SendGmailModal({
  isOpen,
  onClose,
  defaultTo = '',
  defaultSubject = '',
  leadId,
  onSent,
}: SendGmailModalProps) {
  const [to, setTo] = useState(defaultTo);
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [showCcBcc, setShowCcBcc] = useState(false);

  const [connected, setConnected] = useState<boolean | null>(null);
  const [senderEmail, setSenderEmail] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTo(defaultTo);
      setSubject(defaultSubject);
      setError(null);
      setSuccessMsg(null);
      checkConnection();
    }
  }, [isOpen, defaultTo, defaultSubject]);

  const checkConnection = async () => {
    setCheckingAuth(true);
    const res = await fetchGmailStatus();
    setCheckingAuth(false);
    if (res.data) {
      setConnected(res.data.connected);
      setSenderEmail(res.data.email || null);
    } else {
      setConnected(false);
    }
  };

  const handleConnectGmail = async () => {
    setConnecting(true);
    setError(null);
    const res = await fetchGoogleAuthUrl('GMAIL');
    setConnecting(false);
    if (res.data?.url) {
      window.location.href = res.data.url;
    } else {
      setError(res.error || 'Failed to initiate Gmail authorization');
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to.trim() || !subject.trim() || !body.trim()) {
      setError('Please fill in recipient, subject, and message body.');
      return;
    }

    setSending(true);
    setError(null);

    // Format newlines as HTML paragraphs if user writes plain text
    const formattedHtml = body.includes('<') && body.includes('>')
      ? body
      : body.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('');

    const res = await sendGmailEmail({
      to: to.trim(),
      subject: subject.trim(),
      bodyHtml: formattedHtml,
      cc: cc.trim() || undefined,
      bcc: bcc.trim() || undefined,
      crmResourceId: leadId,
    });

    setSending(false);

    if (res.error) {
      setError(res.error);
    } else if (res.data) {
      setSuccessMsg('Email dispatched successfully via Gmail!');
      onSent?.({ messageId: res.data.messageId, threadId: res.data.threadId });
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div
        className="relative w-full max-w-xl rounded-2xl bg-card-c border border-base-c p-6 shadow-2xl animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-base-c pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-primary-c">Send Email via Gmail</h3>
              <p className="text-[11px] text-muted-c">
                {senderEmail ? `Sending as ${senderEmail}` : 'Connected Google Workspace account'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-secondary-c hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Loading check */}
        {checkingAuth ? (
          <div className="py-12 flex flex-col items-center justify-center text-xs text-muted-c">
            <Loader2 className="h-6 w-6 animate-spin text-primary-500 mb-2" />
            <span>Checking Gmail connection...</span>
          </div>
        ) : !connected ? (
          /* Not connected state */
          <div className="py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500 mx-auto mb-3">
              <Mail className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-primary-c">Gmail is not connected yet</h4>
            <p className="text-xs text-secondary-c max-w-sm mx-auto mt-1 mb-5">
              Connect your Gmail account to send high-deliverability emails directly from your verified address.
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-base-c px-4 py-2 text-xs font-semibold text-secondary-c hover:text-primary-c"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConnectGmail}
                disabled={connecting}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-2 text-xs font-bold text-white shadow-soft transition-all"
              >
                {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                <span>Authorize Gmail</span>
              </button>
            </div>
          </div>
        ) : (
          /* Compose Form */
          <form onSubmit={handleSend} className="space-y-3.5">
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-danger-500/20 bg-danger-500/10 p-3 text-xs text-danger-600 dark:text-danger-400 animate-slide-down">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2 rounded-xl border border-success-500/20 bg-success-500/10 p-3 text-xs text-success-600 dark:text-success-400 animate-slide-down">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-secondary-c">To</label>
                <button
                  type="button"
                  onClick={() => setShowCcBcc(!showCcBcc)}
                  className="text-[11px] font-medium text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                >
                  {showCcBcc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  <span>{showCcBcc ? 'Hide CC/BCC' : 'Add CC/BCC'}</span>
                </button>
              </div>
              <input
                type="email"
                required
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="recipient@example.com"
                className="form-input w-full text-xs"
              />
            </div>

            {showCcBcc && (
              <div className="grid grid-cols-2 gap-3 animate-slide-down">
                <div>
                  <label className="block text-xs font-semibold text-secondary-c mb-1">CC</label>
                  <input
                    type="text"
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    placeholder="cc@example.com"
                    className="form-input w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-secondary-c mb-1">BCC</label>
                  <input
                    type="text"
                    value={bcc}
                    onChange={(e) => setBcc(e.target.value)}
                    placeholder="bcc@example.com"
                    className="form-input w-full text-xs"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-secondary-c mb-1">Subject</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Regarding your inquiry"
                className="form-input w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondary-c mb-1">Message</label>
              <textarea
                rows={6}
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Type your message here..."
                className="form-input w-full text-xs"
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-base-c">
              <div className="flex items-center gap-1 text-[11px] text-muted-c">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span>Sends via Gmail API</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-base-c px-4 py-2 text-xs font-semibold text-secondary-c hover:text-primary-c"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-accent px-5 py-2 text-xs font-bold text-white shadow-soft transition-all hover:shadow-glow-blue disabled:opacity-50"
                >
                  {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  <span>Send Email</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
