import type { ReactNode } from 'react';
import { GlassCard } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import { Check, Loader2, Lock, Sparkles, ArrowRight } from 'lucide-react';

export function PanelHeader({ title, desc, icon }: { title: string; desc: string; icon: ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl2 bg-gradient-accent-soft">
        {icon}
      </div>
      <div>
        <h3 className="text-base font-bold text-primary-c">{title}</h3>
        <p className="text-xs text-secondary-c">{desc}</p>
      </div>
    </div>
  );
}

export function FieldRow({
  label,
  desc,
  children,
}: {
  label: string;
  desc?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-primary-c">{label}</p>
        {desc && <p className="text-xs text-muted-c">{desc}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={cx(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors btn-tactile',
        checked ? 'bg-gradient-accent' : 'bg-slate-300 dark:bg-ink-700',
        disabled && 'opacity-60 cursor-not-allowed',
      )}
    >
      <span
        className={cx(
          'absolute top-0.5 grid h-5 w-5 place-items-center rounded-full bg-white shadow-soft transition-all',
          checked ? 'left-[22px]' : 'left-0.5',
        )}
      >
        {checked && <Check className="h-3 w-3 text-primary-600" />}
      </span>
    </button>
  );
}

export function SaveBar({ onSave, saving = false }: { onSave: () => void; saving?: boolean }) {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-base-c pt-4">
      <button type="button" className="rounded-lg border border-base-c px-4 py-2 text-xs font-medium text-secondary-c transition-colors hover:text-primary-c btn-tactile">
        Cancel
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-1.5 rounded-lg bg-gradient-accent px-4 py-2 text-xs font-semibold text-white transition-transform hover:scale-105 disabled:opacity-50 btn-tactile"
      >
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        <span>{saving ? 'Saving…' : 'Save Changes'}</span>
      </button>
    </div>
  );
}

export function SectionCard({ children }: { children: ReactNode }) {
  return <GlassCard className="p-5 lg:p-6">{children}</GlassCard>;
}

export function StatPill({ label, value, color = 'bg-slate-100 text-slate-600 dark:bg-ink-800 dark:text-slate-300' }: { label: string; value: string; color?: string }) {
  return (
    <div className={cx('rounded-lg px-3 py-2 text-center', color)}>
      <p className="text-lg font-bold tabular-nums">{value}</p>
      <p className="text-[10px] font-medium uppercase tracking-wider">{label}</p>
    </div>
  );
}

export function PlanLockBanner({
  featureName,
  requiredPlan = 'PRO',
  onUpgrade,
}: {
  featureName: string;
  requiredPlan?: 'PRO' | 'ENTERPRISE';
  onUpgrade?: () => void;
}) {
  return (
    <div className="rounded-xl2 border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-5 shadow-sm mb-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-primary-c">{featureName} is Locked</h4>
              <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase">
                {requiredPlan} PLAN FEATURE
              </span>
            </div>
            <p className="text-xs text-secondary-c mt-1">
              Your current workspace plan does not include {featureName}. Upgrade to the {requiredPlan} plan to unlock full customization and API capabilities.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (onUpgrade) onUpgrade();
            else window.dispatchEvent(new CustomEvent('switchSettingsTab', { detail: 'billing' }));
          }}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-accent px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-transform hover:scale-105 shrink-0 btn-tactile"
        >
          <Sparkles className="h-4 w-4" />
          <span>Upgrade to {requiredPlan}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
