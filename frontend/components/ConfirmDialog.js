'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText, cancelText, variant }) {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (open && confirmRef.current) {
      confirmRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="card-apple relative p-8 max-w-sm w-full shadow-2xl text-center animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex items-center justify-center cursor-pointer"
          aria-label="Cancel"
        >
          <X className="w-5 h-5" />
        </button>

        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
          variant === 'danger'
            ? 'bg-accent-red/10 text-accent-red'
            : 'bg-primary/10 text-primary'
        }`}>
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {variant === 'danger' ? (
              <>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </>
            ) : (
              <>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </>
            )}
          </svg>
        </div>

        <h3
          id="confirm-dialog-title"
          className="text-lg font-bold text-slate-900 dark:text-white mb-2"
        >
          {title || 'Confirm Action'}
        </h3>
        <p className="text-sm text-slate-500 dark:text-dark-mute mb-6 leading-relaxed">
          {message || 'Are you sure?'}
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            className="btn-secondary px-6 py-2.5 text-xs font-bold cursor-pointer"
          >
            {cancelText || 'Cancel'}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className={`px-6 py-2.5 text-xs font-bold rounded-xl shadow-lg cursor-pointer transition-all active:scale-95 ${
              variant === 'danger'
                ? '!bg-accent-red hover:!bg-red-600 text-white shadow-accent-red/20'
                : 'btn-primary'
            }`}
          >
            {confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
