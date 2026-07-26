import { useState } from 'react';
import { cx } from '@/lib/types';
import { useTheme } from '@/context/ThemeContext';
import { Badge } from '@/components/ui/primitives';
import { Paintbrush, Moon, Bell, Sun, Check, Upload, Smartphone } from 'lucide-react';
import { PanelHeader, FieldRow, Toggle, SaveBar, SectionCard } from './_shared';

/* ─── Custom Branding ─── */
export function CustomBrandingPanel() {
  const [botName, setBotName] = useState('GyanVaniAi Assistant');
  const [primaryColor, setPrimaryColor] = useState('#2563EB');
  const [accentColor, setAccentColor] = useState('#7C3AED');
  const [welcomeMsg, setWelcomeMsg] = useState('Hello! How can I help you find your dream property today?');

  const PRESET_COLORS = ['#2563EB', '#0EA5E9', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

  return (
    <SectionCard>
      <PanelHeader title="Custom Branding" desc="Customize your bot logo, colors, and welcome message" icon={<Paintbrush className="h-5 w-5 text-primary-600 dark:text-primary-400" />} />

      {/* Logo upload */}
      <div className="flex items-center gap-4 rounded-xl2 border border-base-c p-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl2 bg-gradient-accent">
          <span className="text-xl font-bold text-white">GV</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-primary-c">Bot Logo</p>
          <p className="text-xs text-muted-c">PNG or SVG, max 1MB, 256×256 recommended</p>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg border border-base-c px-3 py-2 text-xs font-medium text-secondary-c hover:text-primary-c">
          <Upload className="h-3.5 w-3.5" /> Upload
        </button>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-secondary-c">Bot Name</label>
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
