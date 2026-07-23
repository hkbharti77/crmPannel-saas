import type { ReactNode } from 'react';
import { cx } from '@/lib/types';

export function Logo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl2 bg-gradient-accent shadow-glow-blue">
        <div className="absolute inset-0 rounded-xl2 bg-gradient-accent opacity-60 blur-md" />
        <svg
          viewBox="0 0 24 24"
          className="relative h-5 w-5 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2a4 4 0 0 1 4 4v1a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V6a4 4 0 0 1 4-4Z" />
          <path d="M5 12a7 7 0 0 0 14 0" />
          <path d="M12 19v3" />
        </svg>
      </div>
      {!collapsed && (
        <div className="flex flex-col leading-none">
          <span className="text-[15px] font-bold tracking-tight text-primary-c">
            CRMLite
          </span>
          <span className="text-[11px] font-medium text-muted-c">
            GyanVaniAi Connect
          </span>
        </div>
      )}
    </div>
  );
}

export function GlassCard({
  children,
  className,
  hover = false,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cx(
        'glass rounded-xl2 shadow-soft',
        hover &&
          'transition-all duration-300 hover:shadow-soft-lg hover:-translate-y-0.5 cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  variant = 'neutral',
  className,
}: {
  children: ReactNode;
  variant?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'gradient';
  className?: string;
}) {
  const variants: Record<string, string> = {
    neutral:
      'bg-slate-100 text-slate-600 dark:bg-ink-800 dark:text-slate-300',
    primary:
      'bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300',
    success:
      'bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-300',
    warning:
      'bg-warning-100 text-warning-700 dark:bg-warning-500/15 dark:text-warning-300',
    danger:
      'bg-danger-100 text-danger-700 dark:bg-danger-500/15 dark:text-danger-300',
    gradient:
      'bg-gradient-accent text-white',
  };
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Avatar({
  name,
  src,
  size = 36,
  className,
}: {
  name: string;
  src?: string;
  size?: number;
  className?: string;
}) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div
      className={cx('relative shrink-0 overflow-hidden rounded-full', className)}
      style={{ width: size, height: size }}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="grid h-full w-full place-items-center bg-gradient-accent text-white font-semibold"
          style={{ fontSize: size * 0.38 }}
        >
          {initials}
        </div>
      )}
    </div>
  );
}

export function IconButton({
  children,
  onClick,
  label,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cx(
        'grid h-9 w-9 place-items-center rounded-lg text-secondary-c transition-colors hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-800 dark:hover:text-white',
        className,
      )}
    >
      {children}
    </button>
  );
}
