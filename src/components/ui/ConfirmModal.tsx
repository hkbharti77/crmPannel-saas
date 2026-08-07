import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { cx } from '@/lib/types';

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title = 'Confirm Action',
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel}>
      <div
        className="w-full max-w-md rounded-2xl border border-base-c bg-card-c p-6 shadow-2xl animate-scale-up space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={cx(
              "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
              variant === 'danger' && "bg-rose-500/15 text-rose-500 border border-rose-500/30",
              variant === 'warning' && "bg-amber-500/15 text-amber-500 border border-amber-500/30",
              variant === 'primary' && "bg-primary-500/15 text-primary-500 border border-primary-500/30"
            )}>
              {variant === 'danger' ? <Trash2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-primary-c">{title}</h3>
              <p className="text-xs text-secondary-c mt-0.5">{message}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-c hover:bg-slate-500/10 hover:text-primary-c transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-base-c">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-base-c px-4 py-2 text-xs font-bold text-muted-c hover:bg-slate-500/10 hover:text-primary-c transition-all"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cx(
              "flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:opacity-90 disabled:opacity-50",
              variant === 'danger' && "bg-rose-600 hover:bg-rose-700",
              variant === 'warning' && "bg-amber-600 hover:bg-amber-700",
              variant === 'primary' && "bg-primary-600 hover:bg-primary-700"
            )}
          >
            {loading && <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
