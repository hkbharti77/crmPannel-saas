import { useState } from 'react';
import { GlassCard, Avatar, Badge } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import { useTheme } from '@/context/ThemeContext';
import {
  Settings,
  User,
  Palette,
  Bell,
  Plug,
  Users,
  CreditCard,
  Shield,
  Check,
  Sun,
  Moon,
  Mail,
  MessageSquare,
  Phone,
  Calendar,
  Zap,
  Webhook,
  Smartphone,
  Globe,
  Lock,
  Save,
  Plus,
  Trash2,
  Star,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

type SettingsTab = 'profile' | 'appearance' | 'notifications' | 'integrations' | 'team' | 'billing';

const TABS: { id: SettingsTab; label: string; icon: typeof User }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'billing', label: 'Billing', icon: CreditCard },
];

export function SettingsView() {
  const [tab, setTab] = useState<SettingsTab>('profile');

  return (
    <div className="mx-auto max-w-5xl p-4 lg:p-6">
      <div className="mb-5">
        <h2 className="text-xl font-bold tracking-tight text-primary-c">Settings</h2>
        <p className="mt-0.5 text-sm text-secondary-c">Manage your account, preferences, and integrations.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[200px_1fr]">
        {/* Tab sidebar */}
        <div className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cx(
                  'flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  active
                    ? 'bg-gradient-accent-soft text-primary-600 dark:text-primary-300'
                    : 'text-secondary-c hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-850',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="min-w-0">
          {tab === 'profile' && <ProfileTab />}
          {tab === 'appearance' && <AppearanceTab />}
          {tab === 'notifications' && <NotificationsTab />}
          {tab === 'integrations' && <IntegrationsTab />}
          {tab === 'team' && <TeamTab />}
          {tab === 'billing' && <BillingTab />}
        </div>
      </div>
    </div>
  );
}

/* ─── Profile Tab ─── */
function ProfileTab() {
  const [name, setName] = useState('Arjun Kapoor');
  const [email, setEmail] = useState('arjun@metrorealty.com');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [role, setRole] = useState('Tenant Admin');
  const [bio, setBio] = useState('Senior real estate agent specializing in residential properties across Mumbai metro. 8+ years of experience.');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-4">
      {/* Avatar section */}
      <GlassCard className="p-5">
        <h3 className="mb-4 text-sm font-semibold text-primary-c">Profile Photo</h3>
        <div className="flex items-center gap-4">
          <Avatar name={name} size={72} />
          <div className="space-y-2">
            <button className="rounded-lg bg-gradient-accent px-3 py-1.5 text-xs font-semibold text-white transition-transform hover:scale-105">
              Upload New
            </button>
            <p className="text-[11px] text-muted-c">JPG or PNG, max 2MB</p>
          </div>
        </div>
      </GlassCard>

      {/* Personal info */}
      <GlassCard className="p-5">
        <h3 className="mb-4 text-sm font-semibold text-primary-c">Personal Information</h3>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Field label="Full Name">
            <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" />
          </Field>
          <Field label="Email">
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="form-input" />
          </Field>
          <Field label="Phone">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="form-input" />
          </Field>
          <Field label="Role">
            <select value={role} onChange={(e) => setRole(e.target.value)} className="form-input">
              <option>Tenant Admin</option>
              <option>Sales Agent</option>
              <option>Property Advisor</option>
              <option>Field Executive</option>
              <option>Manager</option>
            </select>
          </Field>
        </div>
        <Field label="Bio" className="mt-3.5">
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="form-input resize-none" />
        </Field>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button className="rounded-lg border border-base-c px-4 py-2 text-xs font-medium text-secondary-c hover:text-primary-c">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-accent px-4 py-2 text-xs font-semibold text-white transition-transform hover:scale-105"
          >
            {saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </GlassCard>

      {/* Security */}
      <GlassCard className="p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-primary-c">
          <Shield className="h-4 w-4 text-muted-c" /> Security
        </h3>
        <div className="space-y-3">
          <SecurityRow icon={Lock} title="Change Password" desc="Last changed 3 months ago" actionLabel="Update" />
          <SecurityRow icon={Smartphone} title="Two-Factor Authentication" desc="Add an extra layer of security" actionLabel="Enable" badge="Recommended" />
          <SecurityRow icon={Globe} title="Active Sessions" desc="2 devices currently logged in" actionLabel="Manage" />
        </div>
      </GlassCard>
    </div>
  );
}

function SecurityRow({ icon: Icon, title, desc, actionLabel, badge }: { icon: typeof Lock; title: string; desc: string; actionLabel: string; badge?: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-base-c p-3">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 dark:bg-ink-850">
          <Icon className="h-4 w-4 text-secondary-c" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-primary-c">{title}</p>
            {badge && <span className="rounded-full bg-warning-100 px-1.5 py-0.5 text-[9px] font-bold text-warning-700 dark:bg-warning-500/15 dark:text-warning-300">{badge}</span>}
          </div>
          <p className="text-[11px] text-muted-c">{desc}</p>
        </div>
      </div>
      <button className="rounded-lg border border-base-c px-3 py-1.5 text-xs font-medium text-secondary-c transition-colors hover:text-primary-c">
        {actionLabel}
      </button>
    </div>
  );
}

/* ─── Appearance Tab ─── */
function AppearanceTab() {
  const { theme, setTheme } = useTheme();
  const [accentColor, setAccentColor] = useState('blue');

  const accents = [
    { id: 'blue', label: 'Ocean Blue', color: '#2563EB' },
    { id: 'emerald', label: 'Emerald', color: '#10B981' },
    { id: 'amber', label: 'Amber', color: '#F59E0B' },
    { id: 'rose', label: 'Rose', color: '#F43F5E' },
    { id: 'cyan', label: 'Cyan', color: '#06B6D4' },
    { id: 'violet', label: 'Violet', color: '#7C3AED' },
  ];

  return (
    <div className="space-y-4">
      <GlassCard className="p-5">
        <h3 className="mb-4 text-sm font-semibold text-primary-c">Theme</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <ThemeOption
            active={theme === 'light'}
            onClick={() => setTheme('light')}
            icon={Sun}
            label="Light"
            preview="light"
          />
          <ThemeOption
            active={theme === 'dark'}
            onClick={() => setTheme('dark')}
            icon={Moon}
            label="Dark"
            preview="dark"
          />
        </div>
        <p className="mt-3 text-[11px] text-muted-c">Theme preference is saved to your browser and synced across sessions.</p>
      </GlassCard>

      <GlassCard className="p-5">
        <h3 className="mb-4 text-sm font-semibold text-primary-c">Accent Color</h3>
        <div className="flex flex-wrap gap-3">
          {accents.map((a) => (
            <button
              key={a.id}
              onClick={() => setAccentColor(a.id)}
              className={cx(
                'flex items-center gap-2 rounded-lg border-2 px-3 py-2 transition-all',
                accentColor === a.id ? 'border-current shadow-soft' : 'border-base-c hover:border-primary-500/30',
              )}
              style={accentColor === a.id ? { color: a.color } : undefined}
            >
              <span className="h-5 w-5 rounded-full" style={{ backgroundColor: a.color }} />
              <span className="text-xs font-medium text-primary-c">{a.label}</span>
              {accentColor === a.id && <Check className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <h3 className="mb-4 text-sm font-semibold text-primary-c">Layout Density</h3>
        <div className="grid grid-cols-3 gap-3">
          {['Compact', 'Comfortable', 'Spacious'].map((d, i) => (
            <button
              key={d}
              className={cx(
                'rounded-lg border-2 p-3 text-center transition-all',
                i === 1 ? 'border-primary-500 bg-primary-500/5 shadow-soft' : 'border-base-c hover:border-primary-500/30',
              )}
            >
              <div className="mx-auto mb-2 space-y-1" style={{ scale: i === 0 ? '0.8' : i === 2 ? '1.1' : '1' }}>
                <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-ink-800" />
                <div className="h-1.5 w-3/4 rounded-full bg-slate-200 dark:bg-ink-800" />
                <div className="h-1.5 w-5/6 rounded-full bg-slate-200 dark:bg-ink-800" />
              </div>
              <span className={cx('text-xs font-medium', i === 1 ? 'text-primary-c' : 'text-secondary-c')}>{d}</span>
            </button>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

function ThemeOption({ active, onClick, icon: Icon, label, preview }: { active: boolean; onClick: () => void; icon: typeof Sun; label: string; preview: string }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'rounded-xl2 border-2 p-3 transition-all',
        active ? 'border-primary-500 shadow-soft' : 'border-base-c hover:border-primary-500/30',
      )}
    >
      <div className={cx(
        'mb-3 grid h-20 place-items-center rounded-lg',
        preview === 'light' ? 'bg-slate-100' : 'bg-ink-900',
      )}>
        <div className={cx('flex w-3/4 flex-col gap-1.5')}>
          <div className={cx('h-2 rounded-full', preview === 'light' ? 'bg-slate-300' : 'bg-ink-700')} style={{ width: '60%' }} />
          <div className={cx('h-2 rounded-full', preview === 'light' ? 'bg-slate-200' : 'bg-ink-800')} />
          <div className={cx('h-2 rounded-full', preview === 'light' ? 'bg-slate-200' : 'bg-ink-800')} style={{ width: '80%' }} />
        </div>
      </div>
      <div className="flex items-center justify-center gap-2">
        <Icon className="h-4 w-4 text-secondary-c" />
        <span className={cx('text-xs font-semibold', active ? 'text-primary-c' : 'text-secondary-c')}>{label}</span>
        {active && <Check className="h-3.5 w-3.5 text-primary-500" />}
      </div>
    </button>
  );
}

/* ─── Notifications Tab ─── */
function NotificationsTab() {
  const [prefs, setPrefs] = useState({
    newLeadEmail: true,
    newLeadPush: true,
    newLeadWhatsApp: false,
    leadAssigned: true,
    appointmentReminder: true,
    ticketUpdate: true,
    dailyDigest: false,
    weeklyReport: true,
    marketingTips: false,
  });

  const toggle = (key: keyof typeof prefs) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const groups: { title: string; icon: typeof Bell; items: { key: keyof typeof prefs; label: string; desc: string; channels: string[] }[] }[] = [
    {
      title: 'Leads',
      icon: User,
      items: [
        { key: 'newLeadEmail', label: 'New Lead Created', desc: 'When a new lead is added to the system', channels: ['Email', 'Push', 'WhatsApp'] },
        { key: 'leadAssigned', label: 'Lead Assigned to You', desc: 'When a lead is assigned to your account', channels: ['Email', 'Push'] },
      ],
    },
    {
      title: 'Appointments',
      icon: Calendar,
      items: [
        { key: 'appointmentReminder', label: 'Appointment Reminders', desc: '30 minutes before scheduled appointments', channels: ['Push', 'WhatsApp'] },
      ],
    },
    {
      title: 'Support',
      icon: MessageSquare,
      items: [
        { key: 'ticketUpdate', label: 'Ticket Updates', desc: 'When a ticket you reported gets a reply', channels: ['Email', 'Push'] },
      ],
    },
    {
      title: 'Reports',
      icon: TrendingUp,
      items: [
        { key: 'dailyDigest', label: 'Daily Digest', desc: 'Summary of activities each morning', channels: ['Email'] },
        { key: 'weeklyReport', label: 'Weekly Performance Report', desc: 'Your sales metrics every Monday', channels: ['Email'] },
        { key: 'marketingTips', label: 'AI Marketing Tips', desc: 'Occasional tips to improve conversions', channels: ['Email'] },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const GIcon = group.icon;
        return (
          <GlassCard key={group.title} className="p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-primary-c">
              <GIcon className="h-4 w-4 text-muted-c" /> {group.title}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => (
                <div key={item.key} className="flex items-center justify-between rounded-lg py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-primary-c">{item.label}</p>
                    <p className="text-[11px] text-muted-c">{item.desc}</p>
                    <div className="mt-1 flex gap-1">
                      {item.channels.map((ch) => (
                        <span key={ch} className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-muted-c dark:bg-ink-850">
                          {ch}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Toggle on={prefs[item.key]} onClick={() => toggle(item.key)} />
                </div>
              ))}
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors',
        on ? 'bg-gradient-accent' : 'bg-slate-200 dark:bg-ink-800',
      )}
    >
      <span
        className={cx(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
          on ? 'translate-x-5' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}

/* ─── Integrations Tab ─── */
function IntegrationsTab() {
  const [integrations, setIntegrations] = useState([
    { id: 'whatsapp', name: 'WhatsApp Business', icon: MessageSquare, desc: 'Send and receive messages via WhatsApp', connected: true, color: '#25D366' },
    { id: 'gmail', name: 'Gmail', icon: Mail, desc: 'Sync emails and send campaigns', connected: true, color: '#EA4335' },
    { id: 'calendar', name: 'Google Calendar', icon: Calendar, desc: 'Sync appointments and reminders', connected: true, color: '#4285F4' },
    { id: 'twilio', name: 'Twilio SMS', icon: Phone, desc: 'Send SMS notifications to leads', connected: false, color: '#F22F46' },
    { id: 'zapier', name: 'Zapier', icon: Zap, desc: 'Connect with 5,000+ apps', connected: false, color: '#FF4A00' },
    { id: 'webhook', name: 'Custom Webhooks', icon: Webhook, desc: 'Receive real-time event notifications', connected: false, color: '#6366F1' },
  ]);

  const toggleConn = (id: string) =>
    setIntegrations((prev) => prev.map((i) => (i.id === id ? { ...i, connected: !i.connected } : i)));

  return (
    <div className="space-y-4">
      <GlassCard className="flex items-center gap-3 bg-gradient-accent-soft p-4">
        <Sparkles className="h-5 w-5 shrink-0 text-secondary-600 dark:text-secondary-400" />
        <p className="text-xs text-secondary-c">
          <span className="font-semibold text-primary-c">AI Insight:</span> Teams with 3+ active integrations see 40% faster lead response times.
        </p>
      </GlassCard>

      <div className="grid gap-3 sm:grid-cols-2">
        {integrations.map((int) => {
          const Icon = int.icon;
          return (
            <GlassCard key={int.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl2" style={{ backgroundColor: `${int.color}15` }}>
                    <Icon className="h-5 w-5" style={{ color: int.color }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-semibold text-primary-c">{int.name}</h4>
                      {int.connected && (
                        <span className="flex items-center gap-0.5 rounded-full bg-success-100 px-1.5 py-0.5 text-[9px] font-bold text-success-700 dark:bg-success-500/15 dark:text-success-300">
                          <Check className="h-2.5 w-2.5" /> Connected
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-c">{int.desc}</p>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => toggleConn(int.id)}
                  className={cx(
                    'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                    int.connected
                      ? 'border border-base-c text-secondary-c hover:text-danger-600 dark:hover:text-danger-400'
                      : 'bg-gradient-accent text-white hover:scale-105',
                  )}
                >
                  {int.connected ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Team Tab ─── */
function TeamTab() {
  const [members] = useState([
    { name: 'Arjun Kapoor', email: 'arjun@metrorealty.com', role: 'Tenant Admin', status: 'active', avatar: 'AK' },
    { name: 'Priya Sharma', email: 'priya@metrorealty.com', role: 'Sales Agent', status: 'active', avatar: 'PS' },
    { name: 'Sneha Patel', email: 'sneha@metrorealty.com', role: 'Property Advisor', status: 'active', avatar: 'SP' },
    { name: 'Rahul Verma', email: 'rahul@metrorealty.com', role: 'Field Executive', status: 'invited', avatar: 'RV' },
    { name: 'Karan Mehta', email: 'karan@metrorealty.com', role: 'Sales Agent', status: 'active', avatar: 'KM' },
  ]);

  const roleColors: Record<string, string> = {
    'Tenant Admin': 'bg-gradient-accent text-white',
    'Sales Agent': 'bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300',
    'Property Advisor': 'bg-secondary-500/15 text-secondary-700 dark:text-secondary-300',
    'Field Executive': 'bg-warning-100 text-warning-700 dark:bg-warning-500/15 dark:text-warning-300',
  };

  return (
    <div className="space-y-4">
      <GlassCard className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-primary-c">Team Members</h3>
            <p className="text-[11px] text-muted-c">{members.length} members · {members.filter((m) => m.status === 'active').length} active</p>
          </div>
          <button className="flex items-center gap-1.5 rounded-lg bg-gradient-accent px-3 py-2 text-xs font-semibold text-white transition-transform hover:scale-105">
            <Plus className="h-3.5 w-3.5" /> Invite Member
          </button>
        </div>

        <div className="space-y-2">
          {members.map((m) => (
            <div key={m.email} className="flex items-center gap-3 rounded-lg border border-base-c p-3">
              <Avatar name={m.name} size={36} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-primary-c">{m.name}</p>
                  {m.status === 'invited' && (
                    <span className="rounded-full bg-warning-100 px-1.5 py-0.5 text-[9px] font-bold text-warning-700 dark:bg-warning-500/15 dark:text-warning-300">
                      INVITED
                    </span>
                  )}
                </div>
                <p className="truncate text-[11px] text-muted-c">{m.email}</p>
              </div>
              <span className={cx('hidden rounded-full px-2 py-0.5 text-[10px] font-semibold sm:block', roleColors[m.role] ?? 'bg-slate-100 text-slate-600')}>
                {m.role}
              </span>
              <button className="grid h-8 w-8 place-items-center rounded-lg text-muted-c transition-colors hover:bg-slate-100 hover:text-danger-500 dark:hover:bg-ink-850">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <h3 className="mb-3 text-sm font-semibold text-primary-c">Roles & Permissions</h3>
        <div className="space-y-2">
          {[
            { role: 'Tenant Admin', perms: ['Full access', 'Manage team', 'Manage billing', 'All data'] },
            { role: 'Manager', perms: ['View all leads', 'Assign leads', 'View reports'] },
            { role: 'Sales Agent', perms: ['View assigned leads', 'Update pipeline', 'Send emails'] },
            { role: 'Field Executive', perms: ['View assigned visits', 'Update status'] },
          ].map((r) => (
            <div key={r.role} className="rounded-lg border border-base-c p-3">
              <p className="text-sm font-semibold text-primary-c">{r.role}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {r.perms.map((p) => (
                  <span key={p} className="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-secondary-c dark:bg-ink-850">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

/* ─── Billing Tab ─── */
function BillingTab() {
  const [plan] = useState({
    name: 'Growth',
    price: 4999,
    period: 'month',
    renewalDate: 'Aug 22, 2026',
    seats: 5,
    seatsUsed: 5,
  });

  const usage = [
    { label: 'Leads', used: 291, total: 1000, color: '#2563EB' },
    { label: 'Email Sends', used: 1850, total: 5000, color: '#7C3AED' },
    { label: 'WhatsApp Messages', used: 620, total: 2000, color: '#10B981' },
    { label: 'Storage', used: 4.2, total: 10, unit: 'GB', color: '#F59E0B' },
  ];

  const invoices = [
    { id: 'INV-2026-007', date: 'Jul 22, 2026', amount: 4999, status: 'paid' },
    { id: 'INV-2026-006', date: 'Jun 22, 2026', amount: 4999, status: 'paid' },
    { id: 'INV-2026-005', date: 'May 22, 2026', amount: 4999, status: 'paid' },
  ];

  return (
    <div className="space-y-4">
      {/* Current plan */}
      <GlassCard className="overflow-hidden p-0">
        <div className="bg-gradient-accent p-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-white/70">Current Plan</p>
              <h3 className="mt-1 text-xl font-bold">{plan.name} Plan</h3>
              <p className="mt-1 text-sm text-white/80">{plan.seats} seats · ₹{plan.price.toLocaleString()}/{plan.period}</p>
            </div>
            <button className="rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm transition-colors hover:bg-white/30">
              Upgrade Plan
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 p-4 text-xs text-secondary-c">
          <Calendar className="h-3.5 w-3.5 text-muted-c" />
          Next renewal: <span className="font-semibold text-primary-c">{plan.renewalDate}</span>
        </div>
      </GlassCard>

      {/* Usage */}
      <GlassCard className="p-5">
        <h3 className="mb-4 text-sm font-semibold text-primary-c">Usage This Month</h3>
        <div className="space-y-4">
          {usage.map((u) => {
            const pct = Math.round((u.used / u.total) * 100);
            const unit = 'unit' in u ? u.unit : '';
            return (
              <div key={u.label}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-medium text-secondary-c">{u.label}</span>
                  <span className="text-muted-c">
                    {u.used.toLocaleString()}{unit && ' ' + unit} / {u.total.toLocaleString()}{unit && ' ' + unit}
                    <span className={cx('ml-1.5 font-semibold', pct > 80 ? 'text-danger-600 dark:text-danger-400' : 'text-primary-c')}>{pct}%</span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-ink-850">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: u.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Invoices */}
      <GlassCard className="p-5">
        <h3 className="mb-4 text-sm font-semibold text-primary-c">Billing History</h3>
        <div className="space-y-2">
          {invoices.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between rounded-lg border border-base-c p-3">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 dark:bg-ink-850">
                  <CreditCard className="h-4 w-4 text-muted-c" />
                </div>
                <div>
                  <p className="text-sm font-medium text-primary-c">{inv.id}</p>
                  <p className="text-[11px] text-muted-c">{inv.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 rounded-full bg-success-100 px-2 py-0.5 text-[10px] font-bold text-success-700 dark:bg-success-500/15 dark:text-success-300">
                  <Check className="h-2.5 w-2.5" /> PAID
                </span>
                <span className="text-sm font-semibold text-primary-c">₹{inv.amount.toLocaleString()}</span>
                <button className="text-xs font-medium text-primary-600 hover:underline dark:text-primary-400">PDF</button>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

/* ─── Shared ─── */
function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-medium text-secondary-c">{label}</label>
      {children}
    </div>
  );
}
