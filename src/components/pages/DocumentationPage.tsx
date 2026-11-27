import { ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { useState } from 'react';
import type { AppRoute, EnabledCategoriesMap, EntityCategory } from '../../types/privacy';
import { DetectionRuleExplorer } from '../detection/DetectionRuleExplorer';
import { BrandLockup } from '../shared/PrivacyBadge';

interface DocumentationPageProps {
  onNavigate: (route: AppRoute) => void;
  enabledCategories: EnabledCategoriesMap;
  onToggleCategory: (category: EntityCategory) => void;
}

const DOC_SECTIONS = [
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'supported-categories', label: 'Supported PII Categories' },
  { id: 'detection-rules', label: 'Detection Rules' },
  { id: 'redaction-modes', label: 'Redaction Modes' },
  { id: 'supported-formats', label: 'Supported File Formats' },
  { id: 'security-architecture', label: 'Security Architecture' },
  { id: 'privacy-limitations', label: 'Privacy Limitations' },
  { id: 'faq', label: 'Frequently Asked Questions' },
];

const CATEGORY_SPECS = [
  {
    name: 'Email Addresses',
    rule: 'RFC-aligned local@domain.tld pattern excluding malformed fragments without valid host TLDs.',
    example: 'shivam@example.com → [REDACTED] / sh***@example.com / USER_01',
  },
  {
    name: 'Indian & Intl Phone Numbers',
    rule: 'Matches +91, 0-prefixed, hyphen/space-grouped Indian mobiles (6–9 prefix) plus international E.164 formats while ignoring arbitrary numeric IDs and dates.',
    example: '+91 98765 43210 → [REDACTED] / +91 XXXXX 43210 / PHONE_01',
  },
  {
    name: 'IPv4 & IPv6 Addresses',
    rule: 'Strict 0–255 octet parsing for IPv4 (even at sentence punctuation or with :port) plus full, compressed (::), and IPv4-mapped IPv6 addresses.',
    example: '192.168.1.45 → [REDACTED] / 192.168.XXX.XXX / IP_01',
  },
  {
    name: 'Indian PAN Format',
    rule: 'Exact 10-character structural format [A-Z]{5}[0-9]{4}[A-Z] with context/word boundaries.',
    example: 'ABCDE1234F → [REDACTED] / XXXXX1234F / PAN_01',
  },
  {
    name: 'Aadhaar-Like Numbers',
    rule: 'Detects 12-digit numeric groups in XXXX XXXX XXXX or XXXX-XXXX-XXXX spacing (format detection only).',
    example: '2345 6789 0123 → [REDACTED] / XXXX XXXX 0123 / AADHAAR_01',
  },
  {
    name: 'Payment Card Numbers (Luhn)',
    rule: 'Matches 13–19 digit sequences and requires valid ISO/IEC 7812 Luhn mod-10 checksum verification.',
    example: '4111-1111-1111-1111 → [REDACTED] / XXXX-XXXX-XXXX-1111 / CARD_01',
  },
];

const FAQS = [
  {
    q: 'Are uploaded CSV or TXT files ever sent to an API for scanning?',
    a: 'No. Files are read directly inside browser RAM via the Web File API and processed either on the main JS thread or an internal Web Worker. Zero upload endpoints exist.',
  },
  {
    q: 'Does PrivacyGuard verify Aadhaar numbers against UIDAI or PAN against NSDL?',
    a: 'No. Because external lookups would leak sensitive identifiers and require API credentials, PAN and Aadhaar checks strictly validate offline structural formats only.',
  },
  {
    q: 'How are CSV columns with quoted commas handled during sanitization?',
    a: 'A custom RFC 4180 state-machine parser parses quoted fields, preserves row headers (optional toggle in Settings), sanitizes individual cell payloads, and re-serializes clean escaped CSV output.',
  },
  {
    q: 'Where are pseudonym counters stored across page reloads?',
    a: 'Pseudonym counters (USER_01, PHONE_01, etc.) stay exclusively in volatile session memory and reset cleanly on Clear or tab close so original values cannot be correlated later.',
  },
];

export function DocumentationPage({
  onNavigate,
  enabledCategories,
  onToggleCategory,
}: DocumentationPageProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  return (
    <div className="pg-enter">
      <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--pg-border)] pb-6">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#173D30] dark:text-[#A3C1A5]">
              Documentation · Technical Specification
            </p>
            <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-[var(--pg-text-primary)]">
              PrivacyGuard reference manual
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--pg-text-secondary)]">
              Detection rules, interactive rule sandbox, redaction modes, RFC 4180 CSV behavior,
              security guarantees, and known limitations.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('/workspace')}
            className="pg-action-primary inline-flex h-10 items-center gap-2 rounded-lg px-4 font-display text-xs font-semibold"
          >
            <FileText className="h-5 w-5" strokeWidth={1.85} aria-hidden="true" />
            <span>Open Workspace</span>
          </button>
        </div>

        {/* 12-Col Sticky Documentation Grid */}
        <div className="mt-10 grid gap-10 lg:grid-cols-12">
          {/* Left Sticky Navigation Rail */}
          <aside className="lg:col-span-3">
            <nav
              aria-label="Documentation sections"
              className="sticky top-20 rounded-[10px] border border-[var(--pg-border)] bg-[var(--pg-surface)] p-4"
            >
              <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--pg-text-muted)]">
                Contents
              </p>
              <ul className="space-y-1">
                {DOC_SECTIONS.map((sec, idx) => (
                  <li key={sec.id}>
                    <a
                      href={`#${sec.id}`}
                      className="flex items-center gap-2 rounded-md px-2.5 py-1.5 font-display text-xs font-medium text-[var(--pg-text-secondary)] transition-colors hover:bg-[var(--pg-bg)] hover:text-[var(--pg-text-primary)]"
                    >
                      <span className="font-mono text-[10px] text-[var(--pg-text-muted)]">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span>{sec.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Editorial Technical Content */}
          <div className="space-y-12 lg:col-span-9">
            <section id="getting-started" className="scroll-mt-24 space-y-3">
              <h2 className="font-display text-xl font-semibold text-[var(--pg-text-primary)]">
                01. Getting Started
              </h2>
              <p className="text-sm leading-relaxed text-[var(--pg-text-secondary)]">
                Open <strong>Workspace</strong>, paste unstructured logs or drop a local{' '}
                <code>.txt</code> or <code>.csv</code> file into the Original Document pane, or press{' '}
                <kbd className="rounded border border-[var(--pg-border)] bg-[var(--pg-surface)] px-1.5 py-0.5 font-mono text-xs">
                  Ctrl+K
                </kbd>{' '}
                to open the Command Palette from anywhere.
              </p>
              <pre className="overflow-x-auto rounded-lg border border-[var(--pg-border)] bg-[var(--pg-surface)] p-4 font-mono text-xs leading-relaxed text-[var(--pg-text-primary)]">
                {`Keyboard Shortcuts:
  Ctrl/Cmd + K       Open Command Palette
  Alt + Shift + C    Copy Sanitized Output to Clipboard
  Alt + 1            Switch to Full Mask ([REDACTED])
  Alt + 2            Switch to Partial Mask (sh***@example.com)
  Alt + 3            Switch to Consistent Pseudonymization (USER_01)
  Alt + 4            Switch to Replace Label ([EMAIL_ADDRESS])
  Alt + 5            Switch to Remove (delete PII cleanly)
  Ctrl/Cmd+Shift+L   Launch interactive Support Ticket pseudonym demo`}
              </pre>
            </section>

            <section
              id="supported-categories"
              className="scroll-mt-24 space-y-5 border-t border-[var(--pg-border)] pt-8"
            >
              <h2 className="font-display text-xl font-semibold text-[var(--pg-text-primary)]">
                02. Supported PII Categories &amp; 03. Detection Rules
              </h2>
              <div
                id="detection-rules"
                className="divide-y divide-[var(--pg-border)] rounded-[10px] border border-[var(--pg-border)] bg-[var(--pg-surface)]"
              >
                {CATEGORY_SPECS.map((spec) => (
                  <div key={spec.name} className="grid gap-3 p-5 sm:grid-cols-12">
                    <div className="font-display text-sm font-semibold text-[var(--pg-text-primary)] sm:col-span-4">
                      {spec.name}
                    </div>
                    <div className="space-y-1.5 sm:col-span-8">
                      <p className="text-xs leading-relaxed text-[var(--pg-text-secondary)]">
                        {spec.rule}
                      </p>
                      <code className="block rounded border border-[var(--pg-border)] bg-[var(--pg-bg)] px-2.5 py-1 font-mono text-[11px] text-[#173D30] dark:text-[#A3C1A5]">
                        {spec.example}
                      </code>
                    </div>
                  </div>
                ))}
              </div>

              {/* Embedded Interactive Detection Rule Explorer */}
              <DetectionRuleExplorer
                enabledCategories={enabledCategories}
                onToggleCategory={onToggleCategory}
              />
            </section>

            <section
              id="redaction-modes"
              className="scroll-mt-24 space-y-3 border-t border-[var(--pg-border)] pt-8"
            >
              <h2 className="font-display text-xl font-semibold text-[var(--pg-text-primary)]">
                04. Five Professional Redaction Modes
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-[10px] border border-[var(--pg-border)] bg-[var(--pg-surface)] p-4">
                  <p className="font-mono text-[11px] text-[#173D30] dark:text-[#A3C1A5]">Mode 01</p>
                  <h3 className="mt-1 font-display text-sm font-semibold text-[var(--pg-text-primary)]">
                    Full Mask
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--pg-text-secondary)]">
                    Replaces every detected token uniformly with <code>[REDACTED]</code>. Maximum
                    obscurity when sharing externally.
                  </p>
                </div>

                <div className="rounded-[10px] border border-[var(--pg-border)] bg-[var(--pg-surface)] p-4">
                  <p className="font-mono text-[11px] text-[#173D30] dark:text-[#A3C1A5]">Mode 02</p>
                  <h3 className="mt-1 font-display text-sm font-semibold text-[var(--pg-text-primary)]">
                    Partial Mask
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--pg-text-secondary)]">
                    Preserves minimal trailing digits or host suffixes (
                    <code>XXXX-XXXX-XXXX-1111</code>, <code>sh***@example.com</code>) for triage.
                  </p>
                </div>

                <div className="rounded-[10px] border border-[var(--pg-border)] bg-[var(--pg-surface)] p-4">
                  <p className="font-mono text-[11px] text-[#173D30] dark:text-[#A3C1A5]">Mode 03</p>
                  <h3 className="mt-1 font-display text-sm font-semibold text-[var(--pg-text-primary)]">
                    Replace Label
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--pg-text-secondary)]">
                    Replaces matches with semantic tags (<code>[EMAIL_ADDRESS]</code>,{' '}
                    <code>[PHONE_NUMBER]</code>) customizable in the Custom Rules tab.
                  </p>
                </div>

                <div className="rounded-[10px] border border-[var(--pg-border)] bg-[var(--pg-surface)] p-4">
                  <p className="font-mono text-[11px] text-[#173D30] dark:text-[#A3C1A5]">Mode 04</p>
                  <h3 className="mt-1 font-display text-sm font-semibold text-[var(--pg-text-primary)]">
                    Remove
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--pg-text-secondary)]">
                    Strips matched entities directly while tightening inline spaces and preserving
                    punctuation and line breaks.
                  </p>
                </div>

                <div className="rounded-[10px] border border-[var(--pg-border)] bg-[var(--pg-surface)] p-4">
                  <p className="font-mono text-[11px] text-[#173D30] dark:text-[#A3C1A5]">Mode 05</p>
                  <h3 className="mt-1 font-display text-sm font-semibold text-[var(--pg-text-primary)]">
                    Consistent Pseudonymization
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--pg-text-secondary)]">
                    Assigns deterministic placeholders (<code>USER_01</code>, <code>PERSON_01</code>,{' '}
                    <code>FIN_01</code>) so repeated references stay correlatable safely.
                  </p>
                </div>
              </div>
            </section>

            <section
              id="supported-formats"
              className="scroll-mt-24 space-y-3 border-t border-[var(--pg-border)] pt-8"
            >
              <h2 className="font-display text-xl font-semibold text-[var(--pg-text-primary)]">
                05. Supported File Formats
              </h2>
              <p className="text-sm leading-relaxed text-[var(--pg-text-secondary)]">
                Accepts plain-text logs (<code>.txt</code>) and structured comma-separated tables (
                <code>.csv</code>) across both single-file workspace inspection and sequential Batch
                Sanitizer uploads on the Documents page. Rejects unsupported binary extensions and
                null-byte streams before scanning.
              </p>
            </section>

            <section
              id="security-architecture"
              className="scroll-mt-24 space-y-3 border-t border-[var(--pg-border)] pt-8"
            >
              <h2 className="font-display text-xl font-semibold text-[var(--pg-text-primary)]">
                06. Security Architecture
              </h2>
              <p className="text-sm leading-relaxed text-[var(--pg-text-secondary)]">
                All detection and redaction modules inside <code>src/engine/</code> and{' '}
                <code>src/workers/</code> remain strictly decoupled from presentation components. No
                analytics or cloud inference SDKs exist, and highlighted segments render strictly via
                React text nodes without <code>dangerouslySetInnerHTML</code>.
              </p>
            </section>

            <section
              id="privacy-limitations"
              className="scroll-mt-24 space-y-3 border-t border-[var(--pg-border)] pt-8"
            >
              <h2 className="font-display text-xl font-semibold text-[var(--pg-text-primary)]">
                07. Privacy Limitations
              </h2>
              <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-[var(--pg-text-secondary)]">
                <li>
                  Unstructured prose names (outside email local parts or quoted columns) are not
                  stripped probabilistically without a local NLP model.
                </li>
                <li>
                  PAN and Aadhaar detectors perform structural format matching only — never live
                  registry verification against NSDL or UIDAI.
                </li>
                <li>
                  When online, browsers fetch the Google Fonts CSS stylesheets (Manrope, Inter, IBM
                  Plex Mono); self-hosting font assets eliminates external stylesheet requests.
                </li>
              </ul>
            </section>

            <section
              id="faq"
              className="scroll-mt-24 space-y-4 border-t border-[var(--pg-border)] pt-8"
            >
              <h2 className="font-display text-xl font-semibold text-[var(--pg-text-primary)]">
                08. Frequently Asked Questions
              </h2>
              <div className="divide-y divide-[var(--pg-border)] rounded-[10px] border border-[var(--pg-border)] bg-[var(--pg-surface)]">
                {FAQS.map((item, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div key={item.q}>
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-display text-sm font-semibold text-[var(--pg-text-primary)] hover:bg-[var(--pg-bg)]/50"
                      >
                        <span>{item.q}</span>
                        {isOpen ? (
                          <ChevronDown
                            className="h-4 w-4 shrink-0 text-[var(--pg-text-muted)]"
                            strokeWidth={1.85}
                          />
                        ) : (
                          <ChevronRight
                            className="h-4 w-4 shrink-0 text-[var(--pg-text-muted)]"
                            strokeWidth={1.85}
                          />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-4 text-xs leading-relaxed text-[var(--pg-text-secondary)]">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>

      <footer className="mt-12 border-t border-[var(--pg-border)] py-7">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <BrandLockup compact />
          <p className="font-mono text-xs text-[var(--pg-text-secondary)]">
            PrivacyGuard Documentation · Swiss Editorial Edition
          </p>
        </div>
      </footer>
    </div>
  );
}
