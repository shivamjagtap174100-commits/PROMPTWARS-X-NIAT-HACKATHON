# PRIVACYGUARD

> **"Your data. Your privacy. Your control."**
> Browser-native PII detection, validation, and data sanitization platform built for the PromptWars × NIAT Pune Coding Challenge.

## Overview

**PRIVACYGUARD** enables teams and individuals to paste raw text logs, resumes, support tickets, or clinical notes—or upload `.txt` and `.csv` files—and automatically **detect → classify → validate → redact → compare → export** sensitive PII **100% locally inside the browser**.

No document text, uploaded file, or sensitive token ever leaves the client device.

---

## Core Capabilities

- **Six-Category PII Detection Engine**
  - **Email:** Structural RFC validation rejecting malformed candidates.
  - **Phone:** Indian mobile (`+91` and `[6-9]XXXXXXXXX`) and international formats while rejecting arbitrary numeric sequences.
  - **IP Address:** Strict IPv4 octet (`0–255`) validation and IPv6 full/compressed/IPv4-mapped structure validation.
  - **Indian PAN:** Exact `ABCDE1234F` pattern classification.
  - **Aadhaar Format:** 12-digit space/hyphen/plain format detection (format validation only; no external UIDAI lookup).
  - **Credit Card:** Dedicated ISO/IEC 7812 **Luhn algorithm** validator ensuring invalid 16-digit sequences are rejected.
- **Three Redaction Modes**
  - **Mode 01 — Full Mask:** `[REDACTED]`
  - **Mode 02 — Partial Mask:** Category-aware context preservation (e.g., `sh***@example.com`, `XXXXXX3210`, `XXXXX1234F`, `XXXX-XXXX-XXXX-1111`).
  - **Mode 03 — Consistent Pseudonymization:** Deterministic session-scoped placeholders (`USER_01`, `PHONE_01`, `IP_01`, `PAN_01`, `AADHAAR_01`, `CARD_01`) with separate category counters, automatic reset on clear, and strict exclusion from audit exports.
- **Side-by-Side Before / After Diff:** Real positional highlighting via safe React text nodes (zero HTML injection), preserved line breaks, and synchronized scroll option.
- **Entity Inspector & Exclusions:** Inspect individual matches, view validation & source metadata, filter by category, and exclude/restore individual occurrences with live recalculation.
- **RFC 4180 CSV & TXT File Pipeline:** Drag-and-drop or file picker with extension/size validation, quoted field & embedded comma support, header preservation, and local Blob downloads.
- **Off-Main-Thread Performance:** Debounced live processing plus automatic Web Worker offloading for larger documents (`>25,000` chars or `>400` CSV rows).
- **Privacy-Safe Audit & Genuine Processing Log:** Records counts, timestamps, mode, duration, and export status without storing or logging any sensitive values.

---

## Architecture

```text
src/
├── components/
│   ├── layout/        # HeaderNav, HeroSection, SettingsPanel
│   ├── editor/        # SourceEditorPane, SanitizedOutputPane
│   ├── detection/     # EntityInspector, DetectionOverview
│   ├── redaction/     # RedactionModeSelector
│   ├── comparison/    # BeforeAfterDiff
│   ├── analytics/     # PrivacyAuditPanel
│   ├── activity/      # ProcessingLogPanel
│   └── shared/        # DocumentationSection, PrivacyBadge, StatusBanner
├── engine/
│   ├── validators/    # luhn.ts, ip.ts, indianIds.ts, emailPhone.ts
│   ├── detectors/     # email, phone, ip, pan, aadhaar, creditCard, detectAll
│   ├── redaction/     # pseudonymManager.ts, masking.ts, redactDocument.ts
│   ├── comparison/    # diffSegments.ts
│   ├── parsing/       # fileValidation.ts, csvParser.ts
│   └── pipeline.ts    # processTextDocument, processCsvDocument
├── workers/           # sanitization.worker.ts & workerClient.ts
├── hooks/             # useDebouncedValue, useTheme, useSanitizationSession
├── types/             # Strongly-typed privacy & pipeline contracts
├── utils/             # download.ts, format.ts, sampleData.ts
├── styles/            # Swiss editorial Light/Dark theme & gradients
└── tests/             # Vitest + React Testing Library test suite
```

---

## Google Services Privacy Evaluation

PrivacyGuard keeps its complete detection, validation, pseudonymization, comparison, and file export pipeline **100% independent of Google services**. Document content, uploaded files, and PII are never transmitted to Gemini, Cloud Storage, Firebase, or Analytics. Static Google Fonts (`Manrope`, `IBM Plex Mono`) may be loaded as style assets with zero document data flow, and the entire engine operates seamlessly offline.

---

## Local Development & Verification

```bash
npm install
npm test
npm run typecheck
npm run build
npm run dev
```

*(On Windows PowerShell environments with script restrictions, invoke `npm.cmd` instead of `npm`.)*
