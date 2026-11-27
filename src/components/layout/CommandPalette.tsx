import {
  ArrowRight,
  Copy,
  Database,
  Download,
  Files,
  FileText,
  FileUp,
  History,
  Lock,
  LogOut,
  Moon,
  Play,
  ScanSearch,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  Trash2,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import type { AppRoute, RedactionMode, ThemeMode } from '../../types/privacy';
import { SAMPLE_PRESETS } from '../../utils/sampleData';

export interface CommandItem {
  id: string;
  group: 'Navigation' | 'Workspace & Scan' | 'Exports & Controls' | 'Preferences';
  label: string;
  hint?: string;
  icon: LucideIcon;
  action: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  theme: ThemeMode;
  onNavigate: (route: AppRoute) => void;
  onChangeMode: (mode: RedactionMode) => void;
  onLoadSampleData: () => void;
  onLoadSamplePreset: (presetId: string) => void;
  onTriggerUpload: () => void;
  onStartScan: () => void;
  onCopySanitized: () => Promise<boolean>;
  onDownloadTxt: () => boolean;
  onDownloadCsv: () => boolean;
  onClearDocument: () => void;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}

export function CommandPalette({
  open,
  onClose,
  theme,
  onNavigate,
  onChangeMode,
  onLoadSampleData,
  onLoadSamplePreset,
  onTriggerUpload,
  onStartScan,
  onCopySanitized,
  onDownloadTxt,
  onDownloadCsv,
  onClearDocument,
  onToggleTheme,
  onOpenSettings,
  onLogout,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = useMemo<CommandItem[]>(() => {
    const goAndClose = (route: AppRoute) => () => {
      onNavigate(route);
      onClose();
    };

    const runAndClose = (fn: () => void) => () => {
      fn();
      onClose();
    };

    return [
      {
        id: 'nav-workspace',
        group: 'Navigation',
        label: 'Open Workspace',
        hint: '/workspace',
        icon: ScanSearch,
        action: goAndClose('/workspace'),
      },
      {
        id: 'nav-overview',
        group: 'Navigation',
        label: 'Open Overview',
        hint: '/',
        icon: ShieldCheck,
        action: goAndClose('/'),
      },
      {
        id: 'nav-documents',
        group: 'Navigation',
        label: 'Open Documents & Session Library',
        hint: '/documents',
        icon: Files,
        action: goAndClose('/documents'),
      },
      {
        id: 'nav-audit',
        group: 'Navigation',
        label: 'Open Audit Trail',
        hint: '/audit-trail',
        icon: History,
        action: goAndClose('/audit-trail'),
      },
      {
        id: 'nav-privacy',
        group: 'Navigation',
        label: 'Open Privacy Centre',
        hint: '/privacy-centre',
        icon: Lock,
        action: goAndClose('/privacy-centre'),
      },
      {
        id: 'nav-docs',
        group: 'Navigation',
        label: 'Open Documentation & Rules',
        hint: '/documentation',
        icon: FileText,
        action: goAndClose('/documentation'),
      },
      {
        id: 'action-upload',
        group: 'Workspace & Scan',
        label: 'Upload Document (.txt / .csv)',
        hint: 'Local',
        icon: FileUp,
        action: runAndClose(onTriggerUpload),
      },
      {
        id: 'action-load-sample',
        group: 'Workspace & Scan',
        label: 'Load Sample',
        hint: '6 PII classes',
        icon: Database,
        action: runAndClose(() => {
          onLoadSampleData();
          onNavigate('/workspace');
        }),
      },
      {
        id: 'action-start-scan',
        group: 'Workspace & Scan',
        label: 'Start Scan',
        hint: 'Rescan',
        icon: Play,
        action: runAndClose(() => {
          onNavigate('/workspace');
          onStartScan();
        }),
      },
      {
        id: 'mode-full',
        group: 'Workspace & Scan',
        label: 'Mode: Full Mask',
        hint: 'Alt+1',
        icon: Lock,
        action: runAndClose(() => {
          onNavigate('/workspace');
          onChangeMode('FULL_MASK');
        }),
      },
      {
        id: 'mode-partial',
        group: 'Workspace & Scan',
        label: 'Mode: Partial Mask',
        hint: 'Alt+2',
        icon: Lock,
        action: runAndClose(() => {
          onNavigate('/workspace');
          onChangeMode('PARTIAL_MASK');
        }),
      },
      {
        id: 'mode-pseudonym',
        group: 'Workspace & Scan',
        label: 'Mode: Consistent Pseudonymization',
        hint: 'Alt+3',
        icon: Lock,
        action: runAndClose(() => {
          onNavigate('/workspace');
          onChangeMode('PSEUDONYM');
        }),
      },
      ...SAMPLE_PRESETS.map((preset) => ({
        id: `sample-${preset.id}`,
        group: 'Workspace & Scan' as const,
        label: `Load preset: ${preset.label}`,
        hint: preset.fileKind.toUpperCase(),
        icon: Database,
        action: runAndClose(() => {
          onLoadSamplePreset(preset.id);
          onNavigate('/workspace');
        }),
      })),
      {
        id: 'export-copy',
        group: 'Exports & Controls',
        label: 'Copy sanitized output to clipboard',
        hint: 'Alt+Shift+C',
        icon: Copy,
        action: runAndClose(() => void onCopySanitized()),
      },
      {
        id: 'export-txt',
        group: 'Exports & Controls',
        label: 'Download sanitized TXT',
        hint: '.txt',
        icon: Download,
        action: runAndClose(() => void onDownloadTxt()),
      },
      {
        id: 'export-csv',
        group: 'Exports & Controls',
        label: 'Download sanitized CSV',
        hint: '.csv',
        icon: Download,
        action: runAndClose(() => void onDownloadCsv()),
      },
      {
        id: 'clear-doc',
        group: 'Exports & Controls',
        label: 'Clear workspace & reset pseudonym counters',
        icon: Trash2,
        action: runAndClose(onClearDocument),
      },
      {
        id: 'toggle-theme',
        group: 'Preferences',
        label: 'Toggle Theme',
        hint: theme === 'light' ? 'Dark' : 'Light',
        icon: theme === 'light' ? Moon : Sun,
        action: runAndClose(onToggleTheme),
      },
      {
        id: 'open-settings',
        group: 'Preferences',
        label: 'Open engine & CSV settings',
        icon: Settings,
        action: runAndClose(onOpenSettings),
      },
      {
        id: 'logout-session',
        group: 'Preferences',
        label: 'Logout (reset session lock)',
        icon: LogOut,
        action: runAndClose(onLogout),
      },
    ];
  }, [
    theme,
    onNavigate,
    onClose,
    onChangeMode,
    onLoadSampleData,
    onLoadSamplePreset,
    onTriggerUpload,
    onStartScan,
    onCopySanitized,
    onDownloadTxt,
    onDownloadCsv,
    onClearDocument,
    onToggleTheme,
    onOpenSettings,
    onLogout,
  ]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.group.toLowerCase().includes(q) ||
        (cmd.hint && cmd.hint.toLowerCase().includes(q))
    );
  }, [commands, query]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setSelectedIndex(0);
      return;
    }
    const timer = setTimeout(() => inputRef.current?.focus(), 0);
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!open) return null;

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex((prev) => (filtered.length > 0 ? (prev + 1) % filtered.length : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex((prev) =>
        filtered.length > 0 ? (prev - 1 + filtered.length) % filtered.length : 0
      );
    } else if (event.key === 'Enter' && filtered[selectedIndex]) {
      event.preventDefault();
      filtered[selectedIndex].action();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/45 px-4 pt-20 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="pg-shadow-modal pg-enter w-full max-w-xl overflow-hidden rounded-[10px] border border-[var(--pg-border)] bg-[var(--pg-surface)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-[var(--pg-border)] px-4 py-3">
          <Search
            className="h-4 w-4 shrink-0 text-[var(--pg-text-muted)]"
            strokeWidth={1.85}
            aria-hidden="true"
          />
          <label htmlFor="command-palette-search" className="sr-only">
            Search PrivacyGuard commands
          </label>
          <input
            ref={inputRef}
            id="command-palette-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Open Workspace, Upload Document, Load Sample, Toggle Theme..."
            className="w-full bg-transparent text-sm text-[var(--pg-text-primary)] placeholder-[var(--pg-text-muted)] focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close command palette"
            className="rounded-md p-1 text-[var(--pg-text-muted)] hover:text-[var(--pg-text-primary)]"
          >
            <X className="h-4 w-4" strokeWidth={1.85} aria-hidden="true" />
          </button>
        </div>

        <div className="max-h-80 divide-y divide-[var(--pg-border)]/50 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-[var(--pg-text-secondary)]">
              No matching commands found.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-xs transition-colors ${
                    isSelected
                      ? 'bg-[#173D30] text-[#FBFAF6] dark:bg-[#A3C1A5] dark:text-[#111713]'
                      : 'text-[var(--pg-text-primary)] hover:bg-[var(--pg-surface-secondary)]/60'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={1.85} aria-hidden="true" />
                    <div className="min-w-0">
                      <span className="font-display font-medium">{item.label}</span>
                      <span
                        className={`ml-2 font-mono text-[10px] ${
                          isSelected
                            ? 'text-[#DDE6DA] dark:text-[#173D30]'
                            : 'text-[var(--pg-text-muted)]'
                        }`}
                      >
                        {item.group}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {item.hint && (
                      <kbd
                        className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${
                          isSelected
                            ? 'border-white/25 bg-white/10 text-[#FBFAF6] dark:border-black/20 dark:bg-black/10 dark:text-[#111713]'
                            : 'border-[var(--pg-border)] bg-[var(--pg-bg)] text-[var(--pg-text-muted)]'
                        }`}
                      >
                        {item.hint}
                      </kbd>
                    )}
                    <ArrowRight
                      className="h-4 w-4 opacity-60"
                      strokeWidth={1.85}
                      aria-hidden="true"
                    />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
