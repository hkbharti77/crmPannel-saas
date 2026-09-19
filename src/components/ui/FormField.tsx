import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cx } from '@/lib/types';

export interface FormFieldProps {
  label?: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  success?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
  maxLength?: number;
  currentLength?: number;
}

export function FormField({
  label,
  required,
  optional,
  error,
  success,
  hint,
  className,
  children,
  maxLength,
  currentLength,
}: FormFieldProps) {
  return (
    <div className={cx('space-y-1.5', className)}>
      {/* Label and Info */}
      {(label || maxLength !== undefined) && (
        <div className="flex items-center justify-between gap-2">
          {label && (
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
              {label}
              {required && <span className="text-rose-500 font-bold">*</span>}
              {optional && (
                <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">
                  (optional)
                </span>
              )}
            </label>
          )}

          {maxLength !== undefined && currentLength !== undefined && (
            <CharacterCount current={currentLength} max={maxLength} />
          )}
        </div>
      )}

      {/* Input / Control slot */}
      <div className="relative">{children}</div>

      {/* Bottom Feedback / Helper */}
      {(error || success || hint) && (
        <div className="flex items-start gap-1.5 pt-0.5 text-xs transition-all">
          {error ? (
            <>
              <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
              <span className="text-rose-500 font-medium leading-tight">{error}</span>
            </>
          ) : success ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-emerald-500 font-medium leading-tight">{success}</span>
            </>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 leading-tight">{hint}</span>
          )}
        </div>
      )}
    </div>
  );
}

export function CharacterCount({ current, max }: { current: number; max: number }) {
  const percent = (current / max) * 100;
  const isOver = current > max;
  const isNear = percent >= 85 && !isOver;

  return (
    <span
      className={cx(
        'text-[11px] font-medium tracking-tight',
        isOver
          ? 'text-rose-500 font-bold'
          : isNear
          ? 'text-amber-500'
          : 'text-slate-400 dark:text-slate-500'
      )}
    >
      {current}/{max}
    </span>
  );
}
