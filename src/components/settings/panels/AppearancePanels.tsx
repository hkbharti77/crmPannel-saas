import { useState, useEffect } from 'react';
import { cx } from '@/lib/types';
import { useTheme } from '@/context/ThemeContext';
import { Badge } from '@/components/ui/primitives';
import { Paintbrush, Moon, Bell, Sun, Check, Upload, Smartphone } from 'lucide-react';
import { fetchSubscriptionStatus } from '@/lib/billingApi';
import { fetchCurrentUserProfile, updateCurrentUserProfile, uploadWidgetIcon } from '@/lib/userApi';
import { PanelHeader, FieldRow, Toggle, SaveBar, SectionCard, PlanLockBanner } from './_shared';

/* ─── Custom Branding ─── */
export function CustomBrandingPanel() {
  const [botName, setBotName] = useState('GyanVaniAi Assistant');
  const [primaryColor, setPrimaryColor] = useState('#2563EB');
  const [secondaryColor, setSecondaryColor] = useState('#1E293B');
  const [accentColor, setAccentColor] = useState('#7C3AED');
  const [welcomeMsg, setWelcomeMsg] = useState('Hello! How can I help you today?');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [widgetIconUrl, setWidgetIconUrl] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [uploadingWidgetIcon, setUploadingWidgetIcon] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptionStatus().then((res) => {
      if (res.data) {
        if (!res.data.limits.hasCustomWidget || res.data.planId === 'FREE') {
          setIsLocked(true);
        } else {
          setIsLocked(false);
        }
      }
    });

    fetchCurrentUserProfile().then((res) => {
      if (res.data) {
        if (res.data.businessName) setBotName(res.data.businessName);
        if (res.data.primaryColor) setPrimaryColor(res.data.primaryColor);
        if (res.data.secondaryColor) setSecondaryColor(res.data.secondaryColor);
        if (res.data.logoUrl) setLogoUrl(res.data.logoUrl);
        if (res.data.widgetIconUrl) setWidgetIconUrl(res.data.widgetIconUrl);
      }
    });
  }, []);

  const handleWidgetIconSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    // Strict client-side check for PNG format
    if (file.type !== 'image/png' && !file.name.toLowerCase().endsWith('.png')) {
      setErrorMsg('❌ Only PNG image format (.png) is supported for the widget icon.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('❌ Widget icon file size must not exceed 2MB.');
      return;
    }

    setUploadingWidgetIcon(true);
    const res = await uploadWidgetIcon(file);
    setUploadingWidgetIcon(false);

    if (res.error) {
      setErrorMsg(`❌ ${res.error}`);
    } else if (res.data) {
      setWidgetIconUrl(res.data.widgetIconUrl);
      setSuccessMsg('✅ Widget PNG icon uploaded and saved successfully!');
      setTimeout(() => setSuccessMsg(null), 3500);
    }
  };

  const PRESET_COLORS = ['#2563EB', '#0EA5E9', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

const getFullImageUrl = (url: string | null) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

  return (
    <SectionCard>
      <PanelHeader title="Custom Branding" desc="Customize your company logo, widget icon (PNG format only), and theme colors" icon={<Paintbrush className="h-5 w-5 text-primary-600 dark:text-primary-400" />} />

      {isLocked && (
        <PlanLockBanner featureName="Custom Bot Branding & White-Labeling" requiredPlan="PRO" />
      )}

      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300">
          {successMsg}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Company Logo Upload */}
        <div className="flex items-center gap-4 rounded-xl2 border border-base-c p-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl2 bg-gradient-accent">
            {logoUrl ? (
              <img 
                src={getFullImageUrl(logoUrl)} 
                alt="" 
                className="h-full w-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} 
              />
            ) : (
              <span className="text-lg font-bold text-white">GV</span>
            )}
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-primary-c">Company Header Logo</p>
            <p className="text-[11px] text-muted-c">Used for website headers & emails</p>
          </div>
        </div>

        {/* Dedicated PNG Widget Icon Upload */}
        <div className="flex items-center gap-4 rounded-xl2 border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-emerald-500/30 bg-card-c shadow-sm">
            {widgetIconUrl ? (
              <img 
                src={getFullImageUrl(widgetIconUrl)} 
                alt="" 
                className="h-full w-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <Smartphone className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-primary-c">Widget Launcher Icon <Badge variant="success" className="ml-1 text-[10px]">PNG Only</Badge></p>
            <p className="text-[11px] text-muted-c">Uploaded PNG image displayed on website chatbot launcher</p>
          </div>
          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-card-c px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/30">
            <Upload className="h-3.5 w-3.5" />
            {uploadingWidgetIcon ? 'Uploading...' : 'Upload PNG'}
            <input type="file" accept="image/png" onChange={handleWidgetIconSelect} className="hidden" disabled={uploadingWidgetIcon} />
          </label>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-secondary-c">Bot / Business Name</label>
          <input value={botName} onChange={(e) => setBotName(e.target.value)} className="form-input" />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-secondary-c">Primary Color</label>
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
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-secondary-c">Accent Color</label>
          <div className="flex flex-wrap items-center gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setAccentColor(c)}
                className={cx(
                  'grid h-8 w-8 place-items-center rounded-lg ring-2 ring-offset-2 ring-offset-card-c transition-all',
                  accentColor === c ? 'ring-secondary-500' : 'ring-transparent hover:ring-base-c',
                )}
                style={{ backgroundColor: c }}
              >
                {accentColor === c && <Check className="h-4 w-4 text-white" />}
              </button>
            ))}
            <input
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="h-8 w-8 cursor-pointer rounded-lg border border-base-c bg-transparent p-0"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-secondary-c">Welcome Message</label>
          <textarea value={welcomeMsg} onChange={(e) => setWelcomeMsg(e.target.value)} rows={2} className="form-input resize-none" />
        </div>
      </div>

      {/* Preview */}
      <div className="mt-4 rounded-xl2 border border-base-c bg-slate-50 p-4 dark:bg-ink-850/60">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-c">Preview</p>
        <div className="flex items-start gap-2.5">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white" style={{ backgroundColor: primaryColor }}>
            <span className="text-xs font-bold">GV</span>
          </div>
          <div className="rounded-xl2 rounded-tl-sm px-3 py-2 text-sm text-white" style={{ backgroundColor: primaryColor }}>
            {welcomeMsg}
          </div>
        </div>
      </div>

      <div className="mt-5"><SaveBar onSave={() => {}} /></div>
    </SectionCard>
  );
}

/* ─── Dark Mode ─── */
export function DarkModePanel() {
  const { theme, setTheme } = useTheme();

  return (
    <SectionCard>
      <PanelHeader title="Dark Mode" desc="Toggle between light and dark theme" icon={<Moon className="h-5 w-5 text-primary-600 dark:text-primary-400" />} />

      <div className="grid gap-3 sm:grid-cols-2">
        <ThemeCard
          active={theme === 'light'}
          onClick={() => setTheme('light')}
          title="Light"
          desc="Bright background, ideal for daytime"
          icon={<Sun className="h-5 w-5" />}
          preview="bg-white border-slate-200"
          textPreview="text-slate-900"
        />
        <ThemeCard
          active={theme === 'dark'}
          onClick={() => setTheme('dark')}
          title="Dark"
          desc="Reduced glare, easier on the eyes at night"
          icon={<Moon className="h-5 w-5" />}
          preview="bg-ink-900 border-ink-700"
          textPreview="text-white"
        />
      </div>

      <div className="mt-4 rounded-xl2 bg-slate-50 p-4 text-xs text-secondary-c dark:bg-ink-850/60">
        <p className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-muted-c" />
          Your theme preference is saved automatically and syncs across this device.
        </p>
      </div>
    </SectionCard>
  );
}

function ThemeCard({
  active, onClick, title, desc, icon, preview, textPreview,
}: {
  active: boolean; onClick: () => void; title: string; desc: string; icon: React.ReactNode; preview: string; textPreview: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'rounded-xl2 border-2 p-4 text-left transition-all',
        active ? 'border-primary-500/40 bg-primary-500/5' : 'border-base-c hover:border-primary-500/20',
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-primary-c">{icon}</span>
          <span className="text-sm font-bold text-primary-c">{title}</span>
        </div>
        {active && <Badge variant="gradient">Active</Badge>}
      </div>
      <div className={cx('mt-3 rounded-lg border p-3', preview)}>
        <div className={cx('h-2 w-20 rounded-full', textPreview, 'opacity-80')} style={{ backgroundColor: 'currentColor' }} />
        <div className={cx('mt-1.5 h-2 w-32 rounded-full', textPreview, 'opacity-40')} style={{ backgroundColor: 'currentColor' }} />
      </div>
      <p className="mt-3 text-xs text-muted-c">{desc}</p>
    </button>
  );
}

/* ─── Notifications ─── */
export function NotificationsPanel() {
  const [prefs, setPrefs] = useState({
    newLead: true,
    newMessage: true,
    appointmentReminder: true,
    dealWon: true,
    dealLost: false,
    dailyDigest: true,
    weeklyReport: true,
    productUpdates: false,
    securityAlerts: true,
  });

  const toggle = (key: keyof typeof prefs) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const GROUPS: { section: string; items: { key: keyof typeof prefs; label: string; desc: string }[] }[] = [
    {
      section: 'Lead & Deal Activity',
      items: [
        { key: 'newLead', label: 'New Lead Created', desc: 'When a new lead is added to the pipeline' },
        { key: 'newMessage', label: 'New Message Received', desc: 'When a customer sends a WhatsApp or email message' },
        { key: 'dealWon', label: 'Deal Won', desc: 'When a lead moves to the Won stage' },
        { key: 'dealLost', label: 'Deal Lost', desc: 'When a lead moves to the Lost stage' },
      ],
    },
    {
      section: 'Schedule',
      items: [
        { key: 'appointmentReminder', label: 'Appointment Reminders', desc: '15 minutes before scheduled appointments' },
      ],
    },
    {
      section: 'Reports & Digests',
      items: [
        { key: 'dailyDigest', label: 'Daily Digest', desc: 'A summary of activity each morning at 9 AM' },
        { key: 'weeklyReport', label: 'Weekly Performance Report', desc: 'Every Monday with last week\'s metrics' },
      ],
    },
    {
      section: 'System',
      items: [
        { key: 'productUpdates', label: 'Product Updates', desc: 'New features and improvements' },
        { key: 'securityAlerts', label: 'Security Alerts', desc: 'Suspicious activity on your account' },
      ],
    },
  ];

  return (
    <SectionCard>
      <PanelHeader title="Enable Notifications" desc="Choose what updates you want to receive" icon={<Bell className="h-5 w-5 text-primary-600 dark:text-primary-400" />} />

      <div className="space-y-5">
        {GROUPS.map((g) => (
          <div key={g.section}>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-c">{g.section}</p>
            <div className="space-y-3">
              {g.items.map((item) => (
                <FieldRow key={item.key} label={item.label} desc={item.desc}>
                  <Toggle checked={prefs[item.key]} onChange={() => toggle(item.key)} />
                </FieldRow>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5"><SaveBar onSave={() => {}} /></div>
    </SectionCard>
  );
}
