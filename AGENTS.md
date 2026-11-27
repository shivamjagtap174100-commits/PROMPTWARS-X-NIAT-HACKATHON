# PRIVACYGUARD Engineering Guidelines

- **100% Client-Side Processing:** Never transmit document content, uploaded files, raw PII values, or pseudonym mappings to external servers, APIs, analytics, or storage.
- **Separation of Concerns:** Keep all PII detection, validation, pseudonymization, CSV parsing, and diff computation strictly inside `src/engine/` and `src/workers/`, decoupled from React presentation components in `src/components/`.
- **Safe Rendering & Logging:** Render entity highlights exclusively via React text nodes/spans (never `dangerouslySetInnerHTML`). Never log sensitive values or original-to-placeholder mappings in console or audit logs.
- **Design System:** Follow the Swiss Minimalist + Editorial Hybrid Light/Dark palette (`#F4F3EF` light / `#111713` dark, Forest `#244C38`, Emerald `#327A55`, `Manrope`, `IBM Plex Mono`).
- **Verification:** Always keep the Vitest & React Testing Library suite (`npm test`), TypeScript check (`npm run typecheck`), and production build (`npm run build`) passing.
