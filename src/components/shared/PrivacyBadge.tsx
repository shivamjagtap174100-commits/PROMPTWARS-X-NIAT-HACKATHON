import { ShieldCheck } from 'lucide-react';

export function ShieldLogo({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <ShieldCheck
      className={`${className} text-[#FBFAF6] dark:text-[#111713]`}
      strokeWidth={1.9}
      aria-hidden="true"
    />
  );
}

export function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#173D30] dark:bg-[#A3C1A5]">
        <ShieldLogo className="h-5 w-5" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-display text-[15px] font-bold tracking-[-0.02em] text-[var(--pg-text-primary)]">
          Privacy<span className="text-[#173D30] dark:text-[#A3C1A5]">Guard</span>
        </span>
        {!compact && (
          <span className="hidden rounded border border-[var(--pg-border)] bg-[var(--pg-surface-secondary)] px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--pg-text-secondary)] sm:inline-block">
            Swiss Ed.
          </span>
        )}
      </div>
    </div>
  );
}

export function LocalProcessingBadge({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-lg border border-[var(--pg-border)] bg-[var(--pg-surface)] px-2.5 py-1 text-xs font-medium text-[var(--pg-text-secondary)]"
      aria-label="Local processing active: Your documents remain inside your browser"
    >
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#367A55] dark:bg-[#A3C1A5]"
      />
      <span className="font-mono text-[11px] text-[var(--pg-text-primary)]">
        {compact ? 'Browser-local' : 'Browser-local RAM · 0 uploads'}
      </span>
    </div>
  );
}
