import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cx } from '@/lib/types';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /**
   * Additional classes for the backdrop container (e.g. for positioning).
   * Defaults to center alignment.
   */
  className?: string;
  /**
   * Additional classes for the background styling.
   * Defaults to dark translucent with blur.
   */
  backdropClassName?: string;
  closeOnEsc?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  children,
  className = "items-center justify-center",
  backdropClassName = "bg-black/60 backdrop-blur-sm p-4",
  closeOnEsc = true,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEsc, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className={cx(
        "fixed inset-0 z-[100] flex animate-fade-in",
        backdropClassName,
        className
      )}
      onClick={onClose}
    >
      {children}
    </div>,
    document.body
  );
}
