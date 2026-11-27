import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import type { ToastNotification } from '../../types/privacy';

interface ToastViewportProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
}

export function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        const Icon =
          toast.tone === 'error'
            ? AlertCircle
            : toast.tone === 'success'
              ? CheckCircle2
              : Info;

        const iconColor =
          toast.tone === 'error'
            ? 'text-[#B64B43] dark:text-[#DF7B73]'
            : toast.tone === 'success'
              ? 'text-[#367A55] dark:text-[#A3C1A5]'
              : 'text-[var(--pg-text-secondary)]';

        return (
          <div
            key={toast.id}
            role="status"
            className="pg-shadow-modal pg-enter pointer-events-auto flex items-start gap-3 rounded-lg border border-[var(--pg-border)] bg-[var(--pg-surface)] p-3.5 text-[var(--pg-text-primary)]"
          >
            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconColor}`} strokeWidth={1.85} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="font-display text-xs font-semibold">{toast.title}</p>
              {toast.detail && (
                <p className="mt-0.5 text-xs text-[var(--pg-text-secondary)]">{toast.detail}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              className="rounded-md p-1 text-[var(--pg-text-muted)] transition-colors hover:text-[var(--pg-text-primary)]"
            >
              <X className="h-4 w-4" strokeWidth={1.85} aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
