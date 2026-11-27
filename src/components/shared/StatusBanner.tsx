import { AlertCircle, X } from 'lucide-react';

interface StatusBannerProps {
  message: string | null;
  onDismiss: () => void;
}

export function StatusBanner({ message, onDismiss }: StatusBannerProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex items-start justify-between gap-3 rounded-lg border border-[#B64B43]/35 bg-[#B64B43]/8 px-4 py-3 text-sm text-[#7A2721] dark:border-[#DF7B73]/35 dark:bg-[#B64B43]/16 dark:text-[#F6C8C4]"
    >
      <div className="flex items-start gap-2.5">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.85} aria-hidden="true" />
        <span>{message}</span>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss error notification"
        className="rounded-md p-1 transition-colors hover:bg-black/8 dark:hover:bg-white/10"
      >
        <X className="h-4 w-4" strokeWidth={1.85} aria-hidden="true" />
      </button>
    </div>
  );
}
