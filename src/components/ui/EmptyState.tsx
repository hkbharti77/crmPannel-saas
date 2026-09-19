import type { ReactNode } from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { cx } from '@/lib/types';

export interface EmptyStateProps {
  icon?: LucideIcon | ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
    variant?: 'primary' | 'secondary' | 'outline';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  compact?: boolean;
  className?: string;
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  compact = false,
  className,
  children,
}: EmptyStateProps) {
  const isComponentIcon = typeof Icon === 'function' || (typeof Icon === 'object' && Icon !== null && '$$typeof' in Icon);

  return (
    <div
      className={cx(
        'flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/20',
        compact ? 'p-6 sm:p-8' : 'p-8 sm:p-12',
        className
      )}
    >
      {/* Icon with soft gradient ring */}
      <div
        className={cx(
          'flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500/10 via-primary-500/5 to-transparent text-primary-500 ring-1 ring-primary-500/20 shadow-sm',
          compact ? 'h-11 w-11 mb-3' : 'h-14 w-14 mb-4'
        )}
      >
        {isComponentIcon ? (
          // @ts-expect-error React component instantiation for icon
          <Icon className={compact ? 'h-5 w-5' : 'h-7 w-7'} />
        ) : (
          (Icon as ReactNode)
        )}
      </div>

      {/* Title */}
      <h3
        className={cx(
          'font-semibold text-slate-800 dark:text-slate-100 tracking-tight',
          compact ? 'text-sm' : 'text-base sm:text-lg'
        )}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          className={cx(
            'text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed',
            compact ? 'text-xs' : 'text-sm'
          )}
        >
          {description}
        </p>
      )}

      {/* Optional Children */}
      {children && <div className="mt-4 w-full max-w-md">{children}</div>}

      {/* Action Buttons */}
      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
          {action && (
            <button
              type="button"
              onClick={action.onClick}
              className={cx(
                'inline-flex items-center gap-2 font-medium rounded-xl transition-all shadow-sm active:scale-[0.98]',
                compact ? 'px-3.5 py-1.5 text-xs' : 'px-4 py-2 text-sm',
                action.variant === 'secondary'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                  : action.variant === 'outline'
                  ? 'border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  : 'bg-primary-600 hover:bg-primary-500 text-white shadow-primary-500/20'
              )}
            >
              {action.icon && <action.icon className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />}
              {action.label}
            </button>
          )}

          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className={cx(
                'font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors',
                compact ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1.5'
              )}
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
