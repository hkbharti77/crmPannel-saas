import type { ReactNode } from 'react';
import { GlassCard } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import { Check } from 'lucide-react';

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

export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cx(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors',
        checked ? 'bg-gradient-accent' : 'bg-slate-300 dark:bg-ink-700',
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

export function SaveBar({ onSave }: { onSave: () => void }) {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-base-c pt-4">
      <button className="rounded-lg border border-base-c px-4 py-2 text-xs font-medium text-secondary-c transition-colors hover:text-primary-c">
        Cancel
      </button>
      <button
        onClick={onSave}
        className="flex items-center gap-1.5 rounded-lg bg-gradient-accent px-4 py-2 text-xs font-semibold text-white transition-transform hover:scale-105"
      >
        Save Changes
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
