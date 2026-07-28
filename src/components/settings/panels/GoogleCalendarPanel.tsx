import { useState, useEffect } from 'react';
import { cx } from '@/lib/types';
import { Globe, Loader2, CheckCircle2, AlertCircle, LogOut, ExternalLink, Calendar, Video } from 'lucide-react';
import { PanelHeader, SectionCard } from './_shared';
import { fetchGoogleIntegrationStatus, fetchGoogleAuthUrl, disconnectGoogleAccount } from '@/lib/integrationsApi';

/* ─── Google Calendar & Meet Integration Panel ─── */
export function GoogleCalendarPanel() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check URL parameters for OAuth redirect notifications
    const params = new URLSearchParams(window.location.search);
    if (params.get('googleConnected') === 'true') {
      setMessage('Google Workspace account connected successfully! Automatic Google Meet link generation is now active.');
      // Clean query params from URL without reload
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('googleError')) {
      setError(`Google authorization failed: ${params.get('googleError')}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Fetch integration status from Spring Boot backend API
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setLoading(true);
    const res = await fetchGoogleIntegrationStatus();
    setLoading(false);
    if (res.data) {
      setConnected(res.data.connected);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    const res = await fetchGoogleAuthUrl();
    setConnecting(false);

    if (res.error) {
      setError(`Failed to initiate Google OAuth: ${res.error}`);
    } else if (res.data?.url) {
      // Redirect user to Google OAuth consent page
      window.location.href = res.data.url;
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Google account? Automatic Google Meet generation for new appointments will be paused.')) {
      return;
    }

    setDisconnecting(true);
    setError(null);
    const res = await disconnectGoogleAccount();
    setDisconnecting(false);

    if (res.error) {
      setError(`Failed to disconnect: ${res.error}`);
    } else {
      setConnected(false);
      setMessage('Google account disconnected successfully.');
      setTimeout(() => setMessage(null), 4000);
    }
  };

  if (loading) {
    return (
      <SectionCard>
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-7 w-7 animate-spin text-primary-500" />
          <p className="mt-3 text-xs text-muted-c">Checking Google Workspace integration status from backend database…</p>
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-5">
      <SectionCard>
        <PanelHeader
          title="Google Calendar & Meet"
          desc="Link Google account for online meeting automation and instant video link generation"
          icon={<Globe className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
        />

        {message && (
          <div className="flex items-center gap-2 rounded-xl border border-success-500/20 bg-success-500/10 p-3 text-xs text-success-600 dark:text-success-400 mb-4">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-danger-500/20 bg-danger-500/10 p-3 text-xs text-danger-600 dark:text-danger-400 mb-4">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="rounded-xl border border-base-c bg-slate-50/70 dark:bg-ink-850/60 p-5 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-primary-c">Google Workspace Integration</h4>
                {connected ? (
                  <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    Connected ✓
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-200 dark:bg-ink-800 px-2.5 py-0.5 text-[10px] font-semibold text-muted-c">
                    Not Connected
                  </span>
                )}
              </div>
              <p className="text-xs text-secondary-c">
                Sync appointments and generate Google Meet video links automatically for scheduled customer sessions.
              </p>
            </div>

            {connected ? (
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 disabled:opacity-50 transition-all"
              >
                {disconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                <span>Disconnect Account</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnect}
                disabled={connecting}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-accent px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-transform hover:scale-105 disabled:opacity-50"
              >
                {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                <span>Connect Google Account</span>
              </button>
            )}
          </div>

          {/* Feature Highlights */}
          <div className="grid gap-3 pt-3 sm:grid-cols-2 border-t border-base-c">
            <div className="flex items-start gap-2.5 rounded-lg border border-base-c bg-card-c p-3 text-xs">
              <Calendar className="h-4 w-4 text-primary-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-primary-c">Calendar Event Sync</p>
                <p className="text-[11px] text-muted-c">Automatically creates Google Calendar events when appointments are booked.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-lg border border-base-c bg-card-c p-3 text-xs">
              <Video className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-primary-c">Instant Google Meet Links</p>
                <p className="text-[11px] text-muted-c">Generates and emails direct Google Meet meeting URLs to customers.</p>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
