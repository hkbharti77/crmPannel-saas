import { useState, useEffect } from 'react';
import { cx } from '@/lib/types';
import { Mail, Check, Loader2, AlertCircle, CheckCircle2, Type, FileText, Palette, Image } from 'lucide-react';
import { PanelHeader, SaveBar, SectionCard } from './_shared';
import { fetchCurrentUserProfile, updateCurrentUserProfile } from '@/lib/userApi';
import { BroadcastFilterConfigPanel } from './BroadcastFilterConfigPanel';

const PRESET_COLORS = ['#2563EB', '#0EA5E9', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4'];

export function EmailBrandingPanel() {
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#2563EB');
  const [emailHeaderText, setEmailHeaderText] = useState('');
  const [emailFooterText, setEmailFooterText] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchCurrentUserProfile().then((res) => {
      setLoading(false);
      if (res.data) {
        setLogoUrl(res.data.logoUrl || '');
        setPrimaryColor(res.data.primaryColor || '#2563EB');
        setEmailHeaderText(res.data.emailHeaderText || '');
        setEmailFooterText(res.data.emailFooterText || '');
        setBusinessName(res.data.businessName || '');
        setAddress(res.data.address || '');
      }
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);

    const res = await updateCurrentUserProfile({
      logoUrl: logoUrl.trim(),
      primaryColor,
      emailHeaderText: emailHeaderText.trim(),
      emailFooterText: emailFooterText.trim(),
    });

    setSaving(false);
    if (res.error) {
      setError(`Failed to save email branding: ${res.error}`);
    } else {
      setMessage('Email branding saved successfully! All outgoing emails will now use your custom branding.');
      setTimeout(() => setMessage(null), 5000);
    }
  };

  if (loading) {
    return (
      <SectionCard>
        <div className="flex items-center justify-center gap-2 py-16 text-muted-c">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading email branding settings…</span>
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-5">
      {/* Status Messages */}
      {message && (
        <div className="flex items-center gap-2 rounded-xl2 border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {message}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl2 border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Logo & Color Section */}
      <SectionCard>
        <PanelHeader
          title="Email Brand Identity"
          desc="Customize logo and colors that appear in all outgoing transactional & marketing emails"
          icon={<Mail className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
        />

        {/* Logo URL */}
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-secondary-c">
              <Image className="h-3.5 w-3.5" /> Business Logo URL
            </label>
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl2 border border-base-c bg-white p-1">
                  <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              ) : (
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl2 bg-gradient-accent">
                  <span className="text-lg font-bold text-white">{businessName?.substring(0, 2).toUpperCase() || 'BZ'}</span>
                </div>
              )}
              <input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://yourdomain.com/logo.png"
                className="form-input flex-1"
              />
            </div>
            <p className="mt-1 text-[10px] text-muted-c">Paste a publicly accessible URL to your logo (PNG/SVG, max 200×60px recommended)</p>
          </div>

          {/* Primary Color */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-secondary-c">
              <Palette className="h-3.5 w-3.5" /> Email Primary Color (CTA Buttons)
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setPrimaryColor(c)}
                  className={cx(
                    'grid h-8 w-8 place-items-center rounded-lg ring-2 ring-offset-2 ring-offset-card-c transition-all',
                    primaryColor === c ? 'ring-primary-500' : 'ring-transparent hover:ring-base-c',
                  )}
                  style={{ backgroundColor: c }}
                >
                  {primaryColor === c && <Check className="h-4 w-4 text-white" />}
                </button>
              ))}
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-8 w-8 cursor-pointer rounded-lg border border-base-c bg-transparent p-0"
              />
              <span className="ml-2 rounded-md bg-slate-100 px-2 py-1 text-xs font-mono text-secondary-c dark:bg-ink-800">{primaryColor}</span>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Header & Footer Text Section */}
      <SectionCard>
        <PanelHeader
          title="Custom Email Content"
          desc="Add a custom header tagline and footer message to all your outgoing emails"
          icon={<Type className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
        />

        <div className="space-y-4">
          {/* Header Text */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-secondary-c">
              <FileText className="h-3.5 w-3.5" /> Email Header Tagline
            </label>
            <input
              value={emailHeaderText}
              onChange={(e) => setEmailHeaderText(e.target.value)}
              placeholder="e.g. Your Trusted Partner in Real Estate"
              className="form-input"
              maxLength={200}
            />
            <p className="mt-1 text-[10px] text-muted-c">
              {emailHeaderText.length}/200 characters — Appears right below the logo in every email
            </p>
          </div>

          {/* Footer Text */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-secondary-c">
              <FileText className="h-3.5 w-3.5" /> Email Footer Message
            </label>
            <textarea
              value={emailFooterText}
              onChange={(e) => setEmailFooterText(e.target.value)}
              placeholder="e.g. Thank you for choosing ABC Corp. Visit us at www.example.com for more info."
              rows={3}
              className="form-input resize-none"
              maxLength={500}
            />
            <p className="mt-1 text-[10px] text-muted-c">
              {emailFooterText.length}/500 characters — Appears in the email footer above copyright
            </p>
          </div>
        </div>
      </SectionCard>

      {/* Live Preview Section */}
      <SectionCard>
        <PanelHeader
          title="Live Preview"
          desc="See how your email will look to your customers"
          icon={<Mail className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
        />

        <div className="rounded-xl2 border border-base-c bg-slate-50 p-4 dark:bg-ink-850/60">
          {/* Preview Header */}
          <div className="rounded-t-lg border border-slate-200 bg-white px-6 py-4 text-center dark:border-ink-700 dark:bg-ink-800">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="mx-auto h-10 max-w-[150px] object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              <span className="text-lg font-bold text-primary-c">{businessName || 'Your Business Name'}</span>
            )}
            {emailHeaderText && (
              <>
                <hr className="my-2 border-slate-100 dark:border-ink-700" />
                <p className="text-xs italic text-muted-c">{emailHeaderText}</p>
              </>
            )}
          </div>

          {/* Preview Body */}
          <div className="border-x border-slate-200 bg-white px-6 py-6 dark:border-ink-700 dark:bg-ink-800">
            <p className="text-sm text-secondary-c">
              Hi John, this is a preview of how your emails will look to your end-customers...
            </p>
            <div className="mt-4 text-center">
              <button
                className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-transform hover:scale-105"
                style={{ backgroundColor: primaryColor }}
              >
                View Appointment →
              </button>
            </div>
          </div>

          {/* Preview Footer */}
          <div className="rounded-b-lg border border-slate-200 bg-slate-50 px-6 py-3 text-center dark:border-ink-700 dark:bg-ink-850/80">
            {emailFooterText && (
              <p className="mb-2 text-[11px] text-secondary-c">{emailFooterText}</p>
            )}
            <p className="text-[10px] text-muted-c">
              © 2026 {businessName || 'Your Business'}. All rights reserved.
            </p>
            {address && (
              <p className="text-[10px] text-muted-c">{address}</p>
            )}
            <p className="mt-2 text-[9px] text-slate-400">⚡ Powered by <strong>GyanVaniAi</strong></p>
          </div>
        </div>
      </SectionCard>

      {/* Broadcast Upload CSV Filter Configuration Embedded */}
      <BroadcastFilterConfigPanel />

      {/* Save */}
      <SectionCard>
        <SaveBar onSave={handleSave} saving={saving} />
      </SectionCard>
    </div>
  );
}
