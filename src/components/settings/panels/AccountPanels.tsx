import { useState } from 'react';
import { cx } from '@/lib/types';
import { Avatar, Badge } from '@/components/ui/primitives';
import {
  User, Shield, Globe, Users, CreditCard,
  Check, Mail, Phone, MapPin, Calendar, Plus, Trash2, Zap, Crown, X,
} from 'lucide-react';
import { PanelHeader, FieldRow, Toggle, SaveBar, SectionCard, StatPill } from './_shared';

/* ─── Account Profile ─── */
export function AccountProfilePanel() {
  const [name, setName] = useState('Arjun Kapoor');
  const [email, setEmail] = useState('arjun.kapoor@crmlite.io');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [company, setCompany] = useState('GyanVaniAi Connect');
  const [city, setCity] = useState('Hyderabad');
  const [bio, setBio] = useState('Senior Real Estate Agent specializing in luxury properties across Hyderabad and Mumbai.');

  return (
    <SectionCard>
      <PanelHeader title="Account Profile" desc="Manage your personal account details" icon={<User className="h-5 w-5 text-primary-600 dark:text-primary-400" />} />

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <Avatar name={name} size={80} />
        <div>
          <button className="rounded-lg bg-gradient-accent px-3 py-2 text-xs font-semibold text-white transition-transform hover:scale-105">
            Change Photo
          </button>
          <p className="mt-1.5 text-[11px] text-muted-c">JPG or PNG, max 2MB</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <InputField label="Full Name" icon={User} value={name} onChange={setName} />
        <InputField label="Email" icon={Mail} value={email} onChange={setEmail} />
        <InputField label="Phone" icon={Phone} value={phone} onChange={setPhone} />
        <InputField label="Company" value={company} onChange={setCompany} />
        <InputField label="City" icon={MapPin} value={city} onChange={setCity} />
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-xs font-medium text-secondary-c">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          className="form-input resize-none"
        />
      </div>

      <div className="mt-5">
        <SaveBar onSave={() => {}} />
      </div>
    </SectionCard>
  );
}

/* ─── Security & Privacy ─── */
export function SecurityPanel() {
  const [twoFA, setTwoFA] = useState(true);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  return (
    <div className="space-y-4">
      <SectionCard>
        <PanelHeader title="Security & Privacy" desc="Password and authentication settings" icon={<Shield className="h-5 w-5 text-primary-600 dark:text-primary-400" />} />

        <div className="rounded-xl2 border border-base-c bg-slate-50 p-4 dark:bg-ink-850/60">
          <h4 className="text-sm font-semibold text-primary-c">Change Password</h4>
          <div className="mt-3 space-y-3">
            <InputField label="Current Password" type="password" value={currentPwd} onChange={setCurrentPwd} />
            <InputField label="New Password" type="password" value={newPwd} onChange={setNewPwd} />
            <InputField label="Confirm New Password" type="password" value={confirmPwd} onChange={setConfirmPwd} />
          </div>
          <button className="mt-3 flex items-center gap-1.5 rounded-lg bg-gradient-accent px-4 py-2 text-xs font-semibold text-white transition-transform hover:scale-105">
            <Check className="h-3.5 w-3.5" /> Update Password
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <FieldRow label="Two-Factor Authentication" desc="Require a verification code at login">
            <Toggle checked={twoFA} onChange={setTwoFA} />
          </FieldRow>
          <div className="border-t border-base-c" />
          <FieldRow label="Login Alerts" desc="Email me about suspicious sign-ins">
            <Toggle checked={loginAlerts} onChange={setLoginAlerts} />
          </FieldRow>
          <div className="border-t border-base-c" />
          <FieldRow label="Auto Session Timeout" desc="Sign out after 30 minutes of inactivity">
            <Toggle checked={sessionTimeout} onChange={setSessionTimeout} />
          </FieldRow>
        </div>
      </SectionCard>

      <SectionCard>
        <h4 className="text-sm font-semibold text-primary-c">Active Sessions</h4>
        <div className="mt-3 space-y-2">
          {[
            { device: 'Chrome on Windows', loc: 'Hyderabad, IN', time: 'Active now', current: true },
            { device: 'Safari on iPhone', loc: 'Mumbai, IN', time: '2 hours ago', current: false },
          ].map((s) => (
            <div key={s.device} className="flex items-center justify-between rounded-xl2 border border-base-c p-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-primary-c">{s.device}</p>
                  {s.current && <Badge variant="success">Current</Badge>}
                </div>
                <p className="text-xs text-muted-c">{s.loc} · {s.time}</p>
              </div>
              {!s.current && (
                <button className="text-xs font-medium text-danger-600 hover:underline dark:text-danger-400">Revoke</button>
              )}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

/* ─── Google Calendar & Meet ─── */
export function GoogleCalendarPanel() {
  const [connected, setConnected] = useState(false);

  return (
    <SectionCard>
      <PanelHeader title="Google Calendar & Meet" desc="Link Google account for online meetings" icon={<Globe className="h-5 w-5 text-primary-600 dark:text-primary-400" />} />

      <div className={cx(
        'rounded-xl2 border-2 border-dashed p-6 text-center transition-colors',
        connected ? 'border-success-500/40 bg-success-500/5' : 'border-base-c',
      )}>
        {connected ? (
          <>
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-success-500/15">
              <Check className="h-6 w-6 text-success-600 dark:text-success-400" />
            </div>
            <p className="mt-3 text-sm font-semibold text-primary-c">Google account connected</p>
            <p className="text-xs text-muted-c">arjun.kapoor@crmlite.io</p>
            <button
              onClick={() => setConnected(false)}
              className="mt-3 rounded-lg border border-base-c px-4 py-2 text-xs font-medium text-secondary-c hover:text-danger-600"
            >
              Disconnect
            </button>
          </>
        ) : (
          <>
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary-500/10">
              <Globe className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <p className="mt-3 text-sm font-semibold text-primary-c">Connect your Google account</p>
            <p className="text-xs text-muted-c">Sync calendar events and create Google Meet links for appointments</p>
            <button
              onClick={() => setConnected(true)}
              className="mt-3 rounded-lg bg-gradient-accent px-4 py-2 text-xs font-semibold text-white transition-transform hover:scale-105"
            >
              Connect Google
            </button>
          </>
        )}
      </div>

      {connected && (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <StatPill label="Synced Events" value="42" color="bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300" />
          <StatPill label="Meet Links" value="18" color="bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-300" />
          <StatPill label="Last Sync" value="5m" color="bg-secondary-100 text-secondary-700 dark:bg-secondary-500/15 dark:text-secondary-300" />
        </div>
      )}
    </SectionCard>
  );
}

/* ─── Staff Management ─── */
export function StaffManagementPanel() {
  const [staff, setStaff] = useState([
    { id: 's1', name: 'Priya Sharma', email: 'priya@crmlite.io', role: 'Team Lead', status: 'active' },
    { id: 's2', name: 'Sneha Patel', email: 'sneha@crmlite.io', role: 'Senior Agent', status: 'active' },
    { id: 's3', name: 'Rahul Verma', email: 'rahul@crmlite.io', role: 'Agent', status: 'invited' },
  ]);
  const [showInvite, setShowInvite] = useState(false);

  const removeStaff = (id: string) => setStaff((s) => s.filter((m) => m.id !== id));

  return (
    <SectionCard>
      <PanelHeader title="Staff Management" desc="Invite and manage team members" icon={<Users className="h-5 w-5 text-primary-600 dark:text-primary-400" />} />

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-secondary-c">{staff.length} team members</p>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-accent px-3 py-2 text-xs font-semibold text-white transition-transform hover:scale-105"
        >
          <Plus className="h-3.5 w-3.5" /> Invite Member
        </button>
      </div>

      <div className="space-y-2">
        {staff.map((m) => (
          <div key={m.id} className="flex items-center gap-3 rounded-xl2 border border-base-c p-3">
            <Avatar name={m.name} size={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-primary-c">{m.name}</p>
              <p className="truncate text-xs text-muted-c">{m.email}</p>
            </div>
            <Badge variant={m.role === 'Team Lead' ? 'gradient' : 'neutral'}>{m.role}</Badge>
            {m.status === 'invited' ? (
              <Badge variant="warning">Invited</Badge>
            ) : (
              <Badge variant="success">Active</Badge>
            )}
            <button
              onClick={() => removeStaff(m.id)}
              className="grid h-7 w-7 place-items-center rounded-lg text-muted-c hover:bg-danger-500/10 hover:text-danger-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setShowInvite(false)}>
          <div className="w-full max-w-md rounded-xl2 border border-base-c bg-card-c p-5 shadow-soft-lg animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-sm font-bold text-primary-c">Invite Team Member</h4>
              <button onClick={() => setShowInvite(false)} className="grid h-7 w-7 place-items-center rounded-lg text-muted-c hover:bg-slate-100 dark:hover:bg-ink-800">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <input className="form-input" placeholder="Full name" />
              <input className="form-input" placeholder="Email address" />
              <select className="form-input" defaultValue="Agent">
                <option>Team Lead</option>
                <option>Senior Agent</option>
                <option>Agent</option>
                <option>Junior Agent</option>
              </select>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowInvite(false)} className="rounded-lg border border-base-c px-4 py-2 text-xs font-medium text-secondary-c">Cancel</button>
              <button onClick={() => setShowInvite(false)} className="rounded-lg bg-gradient-accent px-4 py-2 text-xs font-semibold text-white">Send Invite</button>
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

/* ─── Subscription & Billing ─── */
export function BillingPanel() {
  const [plan] = useState('Growth');
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');

  const PLANS = [
    { name: 'Starter', price: { monthly: 0, yearly: 0 }, features: ['1,000 conversations/mo', '2 agents', 'Basic analytics'], current: false },
    { name: 'Growth', price: { monthly: 2499, yearly: 24990 }, features: ['10,000 conversations/mo', '10 agents', 'AI assistant', 'WhatsApp API'], current: true },
    { name: 'Enterprise', price: { monthly: 7999, yearly: 79990 }, features: ['Unlimited conversations', 'Unlimited agents', 'Custom integrations', 'Priority support'], current: false },
  ];

  return (
    <div className="space-y-4">
      <SectionCard>
        <PanelHeader title="Subscription & Billing" desc="Manage your plan and payment methods" icon={<CreditCard className="h-5 w-5 text-primary-600 dark:text-primary-400" />} />

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl2 bg-gradient-accent-soft p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl2 bg-gradient-accent">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-primary-c">Current Plan: {plan}</p>
              <p className="text-xs text-muted-c">Renews on Aug 12, 2026</p>
            </div>
          </div>
          <div className="flex rounded-lg border border-base-c bg-card-c p-0.5">
            {(['monthly', 'yearly'] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCycle(c)}
                className={cx(
                  'rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                  cycle === c ? 'bg-gradient-accent text-white' : 'text-secondary-c',
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={cx(
                'rounded-xl2 border-2 p-4 transition-all',
                p.current ? 'border-primary-500/40 bg-primary-500/5' : 'border-base-c hover:border-primary-500/20',
              )}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-primary-c">{p.name}</p>
                {p.current && <Badge variant="gradient">Current</Badge>}
              </div>
              <p className="mt-2 text-2xl font-bold text-primary-c">
                ₹{p.price[cycle].toLocaleString()}
                <span className="text-xs font-normal text-muted-c">/{cycle === 'monthly' ? 'mo' : 'yr'}</span>
              </p>
              <ul className="mt-3 space-y-1.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-secondary-c">
                    <Check className="h-3 w-3 shrink-0 text-success-500" /> {f}
                  </li>
                ))}
              </ul>
              {!p.current && (
                <button className={cx(
                  'mt-3 w-full rounded-lg py-2 text-xs font-semibold transition-all',
                  p.name === 'Starter' ? 'border border-base-c text-secondary-c hover:text-primary-c' : 'bg-gradient-accent text-white hover:scale-105',
                )}>
                  {p.name === 'Starter' ? 'Downgrade' : 'Upgrade'}
                </button>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard>
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-primary-c">Usage This Cycle</h4>
          <span className="text-xs text-muted-c">Resets Aug 12</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <UsageBar label="Conversations" used={6842} total={10000} />
          <UsageBar label="AI Tokens" used={482000} total={1000000} />
          <UsageBar label="Agents" used={6} total={10} />
        </div>
      </SectionCard>

      <SectionCard>
        <h4 className="text-sm font-semibold text-primary-c">Payment Method</h4>
        <div className="mt-3 flex items-center gap-3 rounded-xl2 border border-base-c p-3">
          <div className="grid h-9 w-12 place-items-center rounded-lg bg-secondary-500/10">
            <CreditCard className="h-4 w-4 text-secondary-600 dark:text-secondary-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-primary-c">•••• •••• •••• 4242</p>
            <p className="text-xs text-muted-c">Expires 09/28</p>
          </div>
          <button className="text-xs font-medium text-primary-600 hover:underline dark:text-primary-400">Update</button>
        </div>
      </SectionCard>
    </div>
  );
}

/* ─── Shared input field ─── */
function InputField({
  label,
  icon: Icon,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  icon?: typeof User;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-secondary-c">{label}</label>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-c" />}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cx('form-input', Icon && 'pl-9')}
        />
      </div>
    </div>
  );
}

function UsageBar({ label, used, total }: { label: string; used: number; total: number }) {
  const pct = Math.round((used / total) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-secondary-c">{label}</span>
        <span className="font-semibold text-primary-c tabular-nums">{pct}%</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-ink-800">
        <div className={cx('h-full rounded-full transition-all duration-700', pct > 80 ? 'bg-danger-500' : 'bg-gradient-accent')} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-[10px] text-muted-c tabular-nums">{used.toLocaleString()} / {total.toLocaleString()}</p>
    </div>
  );
}
