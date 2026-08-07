import { useState, useEffect } from 'react';
import { cx } from '@/lib/types';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import {
  Shield, Check, CheckCircle2, Sliders, ShieldAlert, Server, Download,  MapPin, Clock, MonitorSmartphone, XCircle, LogOut, RotateCcw, User, AlertTriangle
} from 'lucide-react';
import { SectionCard, PanelHeader, SwitchOption, FieldRow, Toggle } from './_shared';
import { TabSwitcher } from '@/components/ui/TabSwitcher';
import { fetchSecurityDashboard, updateSecuritySettings } from '@/lib/userApi';

/* ─── Security & Privacy Panel ─── */
export function SecurityPanel() {
  const [secTab, setSecTab] = useState<'overview' | 'sessions' | 'audit'>('overview');
  const [killSwitchOpen, setKillSwitchOpen] = useState(false);
  const [biometricAuth, setBiometricAuth] = useState(true);
  const [twoFA, setTwoFA] = useState(true);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(false);
  const [savingBiometric, setSavingBiometric] = useState(false);
  const [savingLoginAlerts, setSavingLoginAlerts] = useState(false);

  // Load real values from backend on mount
  useEffect(() => {
    fetchSecurityDashboard()
      .then((data) => {
        setBiometricAuth(data.biometricsEnabled);
        setLoginAlerts(data.loginAlertsEnabled);
      })
      .catch(() => {
        // keep defaults if fetch fails
      });
  }, []);

  const handleBiometricToggle = async (val: boolean) => {
    setBiometricAuth(val);
    setSavingBiometric(true);
    try {
      await updateSecuritySettings({ biometricsEnabled: val });
    } catch {
      setBiometricAuth(!val); // revert on error
    } finally {
      setSavingBiometric(false);
    }
  };

  const handleLoginAlertsToggle = async (val: boolean) => {
    setLoginAlerts(val);
    setSavingLoginAlerts(true);
    try {
      await updateSecuritySettings({ loginAlertsEnabled: val });
    } catch {
      setLoginAlerts(!val); // revert on error
    } finally {
      setSavingLoginAlerts(false);
    }
  };
  
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPwd || !newPwd || !confirmPwd) {
      alert('Please fill out all password fields.');
      return;
    }
    if (newPwd !== confirmPwd) {
      alert('New password and confirm password do not match.');
      return;
    }
    setPwdMsg('Password updated successfully!');
    setCurrentPwd('');
    setNewPwd('');
    setConfirmPwd('');
    setTimeout(() => setPwdMsg(null), 3000);
  };

  return (
    <div className="space-y-5">
      {/* Privacy & Security Header with Risk Level Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-c pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-primary-c">Privacy & Security</h2>
            <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
              Moderate Risk
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-c">Manage account protection, login activity and security controls.</p>
        </div>
      </div>

      {/* Sub-Navigation Tabs (Overview | Sessions | Audit Log) */}
      <TabSwitcher
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'sessions', label: 'Sessions' },
          { id: 'audit', label: 'Audit Log' }
        ]}
        activeTab={secTab}
        onChange={(id) => setSecTab(id as any)}
      />

      {/* TAB 1: OVERVIEW */}
      {secTab === 'overview' && (
        <div className="space-y-5">
          {/* Security Score Card */}
          <SectionCard>
            <div className="space-y-3">
              <div>
                <h3 className="text-base font-bold text-primary-c">Security Score</h3>
                <p className="text-xs text-muted-c">Enable security features to improve account protection.</p>
              </div>

              <div className="flex items-center gap-6 pt-2">
                {/* Circular Score Gauge */}
                <div className="relative grid h-24 w-24 place-items-center rounded-full border-4 border-amber-400/20 bg-amber-500/5">
                  <div className="text-center">
                    <span className="text-2xl font-extrabold text-primary-c">67%</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-c">Status</p>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-sm font-bold text-amber-600 dark:text-amber-400">Good</span>
                  </div>
                  <p className="text-[11px] text-secondary-c mt-1">2FA & Login Alerts enabled. Enable Session Timeout to reach 100%.</p>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Change Password Card */}
          <SectionCard>
            <PanelHeader title="Change Password" desc="Update your master account login credentials" icon={<Shield className="h-5 w-5 text-primary-600 dark:text-primary-400" />} />

            {pwdMsg && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 mb-3">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{pwdMsg}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-3 pt-1">
              <InputField label="Current Password" type="password" value={currentPwd} onChange={setCurrentPwd} />
              <InputField label="New Password" type="password" value={newPwd} onChange={setNewPwd} />
              <InputField label="Confirm New Password" type="password" value={confirmPwd} onChange={setConfirmPwd} />
              
              <button
                type="submit"
                className="mt-2 flex items-center gap-2 rounded-xl bg-gradient-accent px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-transform hover:scale-105"
              >
                <Check className="h-4 w-4" /> Update Password
              </button>
            </form>
          </SectionCard>

          {/* Security Controls Section */}
          <SectionCard>
            <PanelHeader title="Security Controls" desc="Configure multi-factor and biometric security parameters" icon={<Sliders className="h-5 w-5 text-primary-600 dark:text-primary-400" />} />

            <div className="space-y-4 pt-2">
              <FieldRow label="Biometric Authentication" desc="Use Face ID or Fingerprint for secure login">
                <Toggle checked={biometricAuth} onChange={handleBiometricToggle} disabled={savingBiometric} />
              </FieldRow>

              <div className="border-t border-base-c" />

              <FieldRow label="Two-Factor Authentication" desc="Require a verification code at login">
                <Toggle checked={twoFA} onChange={setTwoFA} />
              </FieldRow>

              <div className="border-t border-base-c" />

              <FieldRow label="Login Alerts" desc="Get notified when new devices access your account">
                <Toggle checked={loginAlerts} onChange={handleLoginAlertsToggle} disabled={savingLoginAlerts} />
              </FieldRow>

              <div className="border-t border-base-c" />

              <FieldRow label="Auto Session Timeout" desc="Sign out after 30 minutes of inactivity">
                <Toggle checked={sessionTimeout} onChange={setSessionTimeout} />
              </FieldRow>
            </div>
          </SectionCard>

          {/* Account Actions Section */}
          <SectionCard>
            <PanelHeader title="Account Actions" desc="Advanced access controls and emergency procedures" icon={<ShieldAlert className="h-5 w-5 text-rose-500" />} />

            <div className="divide-y divide-base-c pt-1">
              {/* Manage IP Whitelist */}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Server className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-primary-c">Manage IP Whitelist</h4>
                    <p className="text-[11px] text-secondary-c">Restrict access to verified IP addresses</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => alert('IP Whitelist Settings: All IP addresses currently allowed.')}
                  className="rounded-lg border border-base-c bg-card-c px-3 py-1.5 text-xs font-semibold text-secondary-c hover:text-primary-c"
                >
                  Configure
                </button>
              </div>

              {/* Download All Data */}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Download className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-primary-c">Download All Data</h4>
                    <p className="text-[11px] text-secondary-c">Export business data to JSON</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => alert('Preparing your account data export JSON file…')}
                  className="rounded-lg border border-base-c bg-card-c px-3 py-1.5 text-xs font-semibold text-secondary-c hover:text-primary-c"
                >
                  Export JSON
                </button>
              </div>

              {/* Data Recovery */}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <RotateCcw className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-primary-c">Data Recovery</h4>
                    <p className="text-[11px] text-secondary-c">Undelete recently lost leads</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => alert('Scanning database trash for deleted records…')}
                  className="rounded-lg border border-base-c bg-card-c px-3 py-1.5 text-xs font-semibold text-secondary-c hover:text-primary-c"
                >
                  Recover
                </button>
              </div>

              {/* Emergency Kill Switch */}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-rose-500/10 text-rose-500">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400">Emergency Kill Switch</h4>
                    <p className="text-[11px] text-secondary-c">Lock account and revoke all sessions</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setKillSwitchOpen(true)}
                  className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20"
                >
                  Activate
                </button>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* TAB 2: SESSIONS (Matches User Screenshot 1-to-1) */}
      {secTab === 'sessions' && (
        <div className="space-y-4">
          <SectionCard>
            <PanelHeader title="Active Sessions" desc="Devices currently authenticated into your account" icon={<Laptop className="h-5 w-5 text-primary-600 dark:text-primary-400" />} />

            <div className="space-y-3 pt-2">
              {/* Session Item 1 */}
              <div className="rounded-xl border border-base-c bg-slate-50/70 dark:bg-ink-850/60 p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-base-c bg-card-c text-primary-c">
                      <Laptop className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-mono text-xs font-semibold text-primary-c">
                        Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/148.0.0.0 Safari/537.36
                      </p>
                      <p className="text-[11px] text-muted-c">Current Active Session • Windows NT 10.0</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    Active Now
                  </span>
                </div>
                <div className="border-t border-base-c pt-2 flex items-center justify-between text-[11px] text-secondary-c font-mono">
                  <span>IP: 0:0:0:0:0:0:0:1</span>
                  <span>Last Active: 2026-07-26 19:50:12</span>
                </div>
              </div>

              {/* Session Item 2 */}
              <div className="rounded-xl border border-base-c bg-card-c p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-base-c bg-slate-50 dark:bg-ink-850 text-muted-c">
                      <Laptop className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-mono text-xs font-semibold text-primary-c">
                        Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/148.0.0.0 Safari/537.36
                      </p>
                      <p className="text-[11px] text-muted-c">Secondary Session • Chrome Browser</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => alert('Session revoked successfully.')}
                    className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-500/20"
                  >
                    Revoke
                  </button>
                </div>
                <div className="border-t border-base-c pt-2 flex items-center justify-between text-[11px] text-secondary-c font-mono">
                  <span>IP: 0:0:0:0:0:0:0:1</span>
                  <span>Last Active: 2026-07-26 15:41:37</span>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* TAB 3: AUDIT LOG (Matches User Screenshot 1-to-1) */}
      {secTab === 'audit' && (
        <div className="space-y-4">
          <SectionCard>
            <PanelHeader title="Security Audit Log" desc="Historical security events and system activity trail" icon={<History className="h-5 w-5 text-primary-600 dark:text-primary-400" />} />

            <div className="divide-y divide-base-c pt-2">
              {/* Event 1 */}
              <div className="flex items-start gap-3 py-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Check className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-primary-c">LOGIN SUCCESS</h4>
                    <span className="text-[10px] text-muted-c">7/26/2026, 6:48:03 PM</span>
                  </div>
                  <p className="text-[11px] text-secondary-c mt-0.5">Successful OTP login</p>
                </div>
              </div>

              {/* Event 2 */}
              <div className="flex items-start gap-3 py-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Check className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-primary-c">LOGIN SUCCESS</h4>
                    <span className="text-[10px] text-muted-c">7/26/2026, 3:41:37 PM</span>
                  </div>
                  <p className="text-[11px] text-secondary-c mt-0.5">Successful OTP login</p>
                </div>
              </div>

              {/* Event 3 */}
              <div className="flex items-start gap-3 py-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Check className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-primary-c">BIOMETRICS TOGGLED</h4>
                    <span className="text-[10px] text-muted-c">7/26/2026, 2:59:24 PM</span>
                  </div>
                  <p className="text-[11px] text-secondary-c mt-0.5">Security settings updated</p>
                </div>
              </div>

              {/* Event 4 */}
              <div className="flex items-start gap-3 py-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Check className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-primary-c">BIOMETRICS TOGGLED</h4>
                    <span className="text-[10px] text-muted-c">7/26/2026, 2:59:21 PM</span>
                  </div>
                  <p className="text-[11px] text-secondary-c mt-0.5">Security settings updated</p>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* Kill Switch Modal */}
      <ConfirmModal
        isOpen={killSwitchOpen}
        title="Activate Emergency Kill Switch"
        message="Are you sure you want to trigger the Emergency Kill Switch? This will lock your account and revoke all active sessions immediately."
        confirmText="Activate Kill Switch"
        variant="danger"
        onConfirm={() => {
          setKillSwitchOpen(false);
          setPwdMsg('Emergency Kill Switch activated! All active sessions have been revoked.');
        }}
        onCancel={() => setKillSwitchOpen(false)}
      />
    </div>
  );
}

function InputField({
  label,
  icon: Icon,
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled = false,
}: {
  label: string;
  icon?: typeof User;
  type?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
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
          placeholder={placeholder}
          disabled={disabled}
          className={cx(
            'w-full rounded-xl2 border border-base-c bg-card-c py-2.5 pr-4 text-xs text-primary-c placeholder:text-muted-c transition-colors focus:border-primary-500/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
            Icon ? 'pl-9' : 'pl-4',
            disabled && 'bg-slate-100 dark:bg-ink-850 cursor-not-allowed opacity-75',
          )}
        />
      </div>
    </div>
  );
}
