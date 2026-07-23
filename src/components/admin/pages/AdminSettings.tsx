import { useState } from 'react';
import { GlassCard, Badge } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import {
  Settings, Globe, Shield, Bell, Mail, CreditCard, Save, Check,
  Server, Lock, Smartphone, AlertCircle, Sparkles,
} from 'lucide-react';

type SettingsTab = 'platform' | 'security' | 'notifications' | 'features' | 'danger';

const TABS: { id: SettingsTab; label: string; icon: typeof Globe }[] = [
  { id: 'platform', label: 'Platform', icon: Globe },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'features', label: 'Features', icon: Sparkles },
  { id: 'danger', label: 'Danger Zone', icon: AlertCircle },
];

export function AdminSettings() {
  const [tab, setTab] = useState<SettingsTab>('platform');

  return (
    <div className="mx-auto max-w-4xl p-4 lg:p-6">
      <div className="mb-5">
        <h2 className="text-xl font-bold tracking-tight text-primary-c">Platform Settings</h2>
        <p className="mt-0.5 text-sm text-secondary-c">Configure global platform behavior and policies.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[180px_1fr]">
        <div className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className={cx('flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all', active ? 'bg-gradient-to-br from-rose-500/10 to-orange-500/10 text-rose-600 dark:text-rose-400' : 'text-secondary-c hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-850')}>
                <Icon className="h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap">{t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="min-w-0">
          {tab === 'platform' && <PlatformTab />}
          {tab === 'security' && <SecurityTab />}
          {tab === 'notifications' && <NotificationsTab />}
          {tab === 'features' && <FeaturesTab />}
          {tab === 'danger' && <DangerTab />}
        </div>
      </div>
    </div>
  );
}

function SaveButton() {
  const [saved, setSaved] = useState(false);
  return (
    <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }} className="flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 px-4 py-2 text-xs font-semibold text-white transition-transform hover:scale-105">
      {saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
      {saved ? 'Saved!' : 'Save Changes'}
    </button>
  );
}

function PlatformTab() {
  const [name, setName] = useState('CRMLite');
  const [url, setUrl] = useState('https://app.crmlite.io');
  const [supportEmail, setSupportEmail] = useState('support@crmlite.io');
  const [defaultPlan, setDefaultPlan] = useState('starter');
  const [trialDays, setTrialDays] = useState('14');
  const [maxLeadsStarter, setMaxLeadsStarter] = useState('500');

  return (
    <div className="space-y-4">
      <GlassCard className="p-5">
        <h3 className="mb-4 text-sm font-semibold text-primary-c">General Configuration</h3>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Field label="Platform Name"><input value={name} onChange={(e) => setName(e.target.value)} className="form-input" /></Field>
          <Field label="Platform URL"><input value={url} onChange={(e) => setUrl(e.target.value)} className="form-input" /></Field>
          <Field label="Support Email"><input value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} className="form-input" /></Field>
          <Field label="Default Plan for New Tenants"><select value={defaultPlan} onChange={(e) => setDefaultPlan(e.target.value)} className="form-input"><option value="starter">Starter</option><option value="growth">Growth</option></select></Field>
          <Field label="Trial Period (days)"><input value={trialDays} onChange={(e) => setTrialDays(e.target.value)} className="form-input" /></Field>
          <Field label="Max Leads (Starter Plan)"><input value={maxLeadsStarter} onChange={(e) => setMaxLeadsStarter(e.target.value)} className="form-input" /></Field>
        </div>
        <div className="mt-4 flex justify-end"><SaveButton /></div>
      </GlassCard>

      <GlassCard className="p-5">
        <h3 className="mb-4 text-sm font-semibold text-primary-c">Available Regions</h3>
        <div className="flex flex-wrap gap-2">
          {['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Chennai', 'Hyderabad', 'Goa', 'Kolkata', 'Ahmedabad'].map((r) => (
            <span key={r} className="rounded-full border border-base-c bg-card-c px-3 py-1.5 text-xs font-medium text-secondary-c">{r}</span>
          ))}
          <button className="rounded-full border border-dashed border-base-c px-3 py-1.5 text-xs text-muted-c hover:border-primary-500/40 hover:text-primary-c">+ Add Region</button>
        </div>
      </GlassCard>
    </div>
  );
}

function SecurityTab() {
  const [enforce2FA, setEnforce2FA] = useState(false);
  const [passwordPolicy, setPasswordPolicy] = useState('strict');
  const [sessionTimeout, setSessionTimeout] = useState('30');

  return (
    <div className="space-y-4">
      <GlassCard className="p-5">
        <h3 className="mb-4 text-sm font-semibold text-primary-c">Authentication & Access</h3>
        <div className="space-y-3">
          <ToggleRow icon={Smartphone} title="Enforce 2FA for All Admins" desc="Require two-factor authentication for all admin accounts" on={enforce2FA} onClick={() => setEnforce2FA(!enforce2FA)} />
          <div className="rounded-lg border border-base-c p-3">
            <p className="flex items-center gap-2 text-sm font-medium text-primary-c"><Lock className="h-4 w-4 text-muted-c" /> Password Policy</p>
            <div className="mt-2 flex gap-1.5">
              {['lenient', 'standard', 'strict'].map((p) => (
                <button key={p} onClick={() => setPasswordPolicy(p)} className={cx('flex-1 rounded-lg py-2 text-[11px] font-bold capitalize transition-all', passwordPolicy === p ? 'bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-soft' : 'border border-base-c text-muted-c hover:text-primary-c')}>{p}</button>
              ))}
            </div>
          </div>
          <Field label="Session Timeout (minutes)"><input value={sessionTimeout} onChange={(e) => setSessionTimeout(e.target.value)} className="form-input" /></Field>
        </div>
        <div className="mt-4 flex justify-end"><SaveButton /></div>
      </GlassCard>

      <GlassCard className="p-5">
        <h3 className="mb-3 text-sm font-semibold text-primary-c">IP Whitelist</h3>
        <div className="space-y-2">
          {['103.21.45.10', '103.21.45.11', '103.21.45.12'].map((ip) => (
            <div key={ip} className="flex items-center justify-between rounded-lg border border-base-c p-2.5">
              <span className="text-xs font-mono text-primary-c">{ip}</span>
              <button className="text-[11px] font-medium text-danger-500 hover:underline">Remove</button>
            </div>
          ))}
          <button className="w-full rounded-lg border border-dashed border-base-c py-2 text-xs text-muted-c hover:border-primary-500/40 hover:text-primary-c">+ Add IP Address</button>
        </div>
      </GlassCard>
    </div>
  );
}

function NotificationsTab() {
  const [prefs, setPrefs] = useState({ newTenant: true, tenantSuspended: true, paymentFailed: true, ticketUrgent: true, systemAlert: true, weeklyDigest: true });
  const toggle = (k: keyof typeof prefs) => setPrefs((p) => ({ ...p, [k]: !p[k] }));

  const items = [
    { key: 'newTenant' as const, label: 'New Tenant Signup', desc: 'When a new tenant creates an account' },
    { key: 'tenantSuspended' as const, label: 'Tenant Suspended', desc: 'When a tenant is auto-suspended for non-payment' },
    { key: 'paymentFailed' as const, label: 'Payment Failed', desc: 'When a subscription payment fails' },
    { key: 'ticketUrgent' as const, label: 'Urgent Ticket Created', desc: 'When a URGENT priority ticket is submitted' },
    { key: 'systemAlert' as const, label: 'System Health Alert', desc: 'When a service becomes degraded or goes down' },
    { key: 'weeklyDigest' as const, label: 'Weekly Digest', desc: 'Platform summary every Monday morning' },
  ];

  return (
    <GlassCard className="p-5">
      <h3 className="mb-4 text-sm font-semibold text-primary-c">Admin Email Notifications</h3>
      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between rounded-lg py-2.5">
            <div><p className="text-sm font-medium text-primary-c">{item.label}</p><p className="text-[11px] text-muted-c">{item.desc}</p></div>
            <button onClick={() => toggle(item.key)} className={cx('relative h-6 w-11 shrink-0 rounded-full transition-colors', prefs[item.key] ? 'bg-gradient-to-br from-rose-500 to-orange-500' : 'bg-slate-200 dark:bg-ink-800')}>
              <span className={cx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform', prefs[item.key] ? 'translate-x-5' : 'translate-x-0.5')} />
            </button>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function FeaturesTab() {
  const [features, setFeatures] = useState({ whatsapp: true, emailCampaigns: true, aiSuggestions: true, calendarSync: true, leadScoring: true, customDomains: false, apiAccess: true, sso: false });
  const toggle = (k: keyof typeof features) => setFeatures((f) => ({ ...f, [k]: !f[k] }));

  const items = [
    { key: 'whatsapp' as const, label: 'WhatsApp Integration', desc: 'Allow tenants to connect WhatsApp Business' },
    { key: 'emailCampaigns' as const, label: 'Email Campaigns', desc: 'Bulk email sending capability' },
    { key: 'aiSuggestions' as const, label: 'AI Reply Suggestions', desc: 'AI-powered message suggestions in chatroom' },
    { key: 'calendarSync' as const, label: 'Calendar Sync', desc: 'Google Calendar integration for appointments' },
    { key: 'leadScoring' as const, label: 'AI Lead Scoring', desc: 'Automatic lead quality scoring' },
    { key: 'customDomains' as const, label: 'Custom Domains', desc: 'Allow tenants to use their own domain (Enterprise only)' },
    { key: 'apiAccess' as const, label: 'API Access', desc: 'REST API for tenants to integrate with external tools' },
    { key: 'sso' as const, label: 'SSO (SAML/OAuth)', desc: 'Single sign-on for enterprise tenants' },
  ];

  return (
    <GlassCard className="p-5">
      <h3 className="mb-4 text-sm font-semibold text-primary-c">Platform Feature Flags</h3>
      <p className="mb-4 text-[11px] text-muted-c">Globally enable or disable features. Changes affect all tenants.</p>
      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between rounded-lg py-2.5">
            <div><p className="text-sm font-medium text-primary-c">{item.label}</p><p className="text-[11px] text-muted-c">{item.desc}</p></div>
            <button onClick={() => toggle(item.key)} className={cx('relative h-6 w-11 shrink-0 rounded-full transition-colors', features[item.key] ? 'bg-success-500' : 'bg-slate-200 dark:bg-ink-800')}>
              <span className={cx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform', features[item.key] ? 'translate-x-5' : 'translate-x-0.5')} />
            </button>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function DangerTab() {
  return (
    <div className="space-y-4">
      <GlassCard className="border-danger-500/20 p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-danger-600 dark:text-danger-400"><AlertCircle className="h-4 w-4" /> Danger Zone</h3>
        <div className="space-y-3">
          <DangerRow title="Purge Inactive Tenants" desc="Permanently delete all tenants inactive for 90+ days" actionLabel="Purge" />
          <DangerRow title="Reset All Trial Timers" desc="Extend all active trials by 7 days" actionLabel="Extend" />
          <DangerRow title="Platform Maintenance Mode" desc="Temporarily disable access for all non-admin users" actionLabel="Enable" />
          <DangerRow title="Delete All Audit Logs" desc="Permanently clear all audit entries older than 90 days" actionLabel="Clear" />
        </div>
      </GlassCard>
    </div>
  );
}

function DangerRow({ title, desc, actionLabel }: { title: string; desc: string; actionLabel: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-danger-500/20 bg-danger-500/5 p-3">
      <div><p className="text-sm font-medium text-primary-c">{title}</p><p className="text-[11px] text-secondary-c">{desc}</p></div>
      <button className="rounded-lg border border-danger-500/30 px-3 py-1.5 text-xs font-semibold text-danger-600 transition-colors hover:bg-danger-500 hover:text-white dark:text-danger-400">{actionLabel}</button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1.5 block text-xs font-medium text-secondary-c">{label}</label>{children}</div>;
}

function ToggleRow({ icon: Icon, title, desc, on, onClick }: { icon: typeof Shield; title: string; desc: string; on: boolean; onClick: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-base-c p-3">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 dark:bg-ink-850"><Icon className="h-4 w-4 text-secondary-c" /></div>
        <div><p className="text-sm font-medium text-primary-c">{title}</p><p className="text-[11px] text-muted-c">{desc}</p></div>
      </div>
      <button onClick={onClick} className={cx('relative h-6 w-11 shrink-0 rounded-full transition-colors', on ? 'bg-gradient-to-br from-rose-500 to-orange-500' : 'bg-slate-200 dark:bg-ink-800')}>
        <span className={cx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform', on ? 'translate-x-5' : 'translate-x-0.5')} />
      </button>
    </div>
  );
}
