import type { ReactNode } from 'react';
import { cx } from '@/lib/types';

export function Logo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center">
        <img src="https://www.gyanvaniai.online/logo.webp" alt="Logo" className="h-full w-full object-contain" />
      </div>
      {!collapsed && (
        <div className="flex flex-col justify-center">
          <span className="text-[15px] font-extrabold tracking-tight text-primary-c leading-tight">
            GyanVaniAi
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary-500/80 leading-none mt-[2px]">
            Connect
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
  size = 40,
  className,
}: {
  name: string;
  src?: string;
  size?: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const sizePx = typeof size === 'number' ? size : {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 56,
  }[size] || 40;

  const initials = name
    ? name
        .split(' ')
        .filter(Boolean)
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <div
      className={cx('relative shrink-0 overflow-hidden rounded-full shadow-xs', className)}
      style={{
        width: `${sizePx}px`,
        height: `${sizePx}px`,
        minWidth: `${sizePx}px`,
        minHeight: `${sizePx}px`,
      }}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          className="grid h-full w-full place-items-center bg-gradient-accent text-white font-bold leading-none select-none"
          style={{ fontSize: `${Math.max(10, Math.round(sizePx * 0.38))}px` }}
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

export function Toast({ message, onClose, isError = false }: { message: string; onClose: () => void; isError?: boolean }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-card-c text-primary-c rounded-xl shadow-soft-lg border border-base-c animate-in fade-in slide-in-from-bottom-4">
      {isError ? (
        <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
      ) : (
        <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      )}
      <span className="text-xs font-semibold">{message}</span>
      <button onClick={onClose} className="text-muted-c hover:text-primary-c ml-1">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
    </div>
  );
}

import { createPortal } from 'react-dom';

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  if (!isOpen) return null;
  return createPortal(
    <>
      <div 
        className="fixed inset-0 top-0 right-0 bottom-0 left-0 w-screen h-screen z-[9998] bg-slate-950/65 backdrop-blur-md transition-opacity animate-in fade-in duration-200" 
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-0 top-0 right-0 bottom-0 left-0 w-screen h-screen z-[9999] pointer-events-none flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <div className={cx("pointer-events-auto relative bg-card-c border border-base-c rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95", className)}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-base-c">
            <h3 className="text-base font-semibold text-primary-c">{title}</h3>
            <button onClick={onClose} className="p-1 text-muted-c hover:text-primary-c rounded-md transition-colors hover:bg-base-c cursor-pointer">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          <div className="p-6 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  if (!isOpen) return null;
  return createPortal(
    <>
      <div 
        className="fixed inset-0 top-0 right-0 bottom-0 left-0 w-screen h-screen z-[9998] bg-slate-950/65 backdrop-blur-md transition-opacity animate-in fade-in duration-200" 
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-0 top-0 right-0 bottom-0 left-0 w-screen h-screen z-[9999] pointer-events-none overflow-hidden flex justify-end">
        <div className={cx(
          "pointer-events-auto relative flex flex-col w-full sm:w-[480px] h-full bg-card-c border-l border-base-c shadow-2xl animate-in slide-in-from-right duration-300",
          className
        )}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-base-c bg-slate-50/50 dark:bg-ink-850 shrink-0">
            <h3 className="text-base font-semibold text-primary-c">{title}</h3>
            <button onClick={onClose} className="p-1.5 text-muted-c hover:text-primary-c rounded-md transition-colors hover:bg-base-c cursor-pointer">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {children}
          </div>
          {footer && (
            <div className="px-6 py-4 border-t border-base-c bg-slate-50/80 dark:bg-ink-850 flex items-center justify-end gap-3 shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}

