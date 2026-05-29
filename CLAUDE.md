# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Keep this file current.** When you change commands, architecture, the storage model, conventions, or anything else documented here, update this file in the same change so it doesn't drift. Update `README.md` too when user-facing behavior, features, or setup steps change.

## Commands

```bash
npm run build          # tsc typecheck + vite build → dist/ (loadable unpacked extension)
npm run dev            # vite dev server
npm test               # vitest run (one-shot)
npm run test:watch     # vitest watch mode
npx vitest run src/__tests__/utils.test.ts   # run a single test file
npm run typecheck      # tsc --noEmit
npm run lint           # eslint .
npm run format:check   # prettier --check (CI gate; run `npm run format` to fix)
```

CI (`.github/workflows/ci.yml`) runs, in order: `format:check`, `lint`, `typecheck`, `test`. All four must pass — match this locally before pushing.

`prebuild` runs `scripts/generate-icons.mjs` (sharp) to regenerate PNG icons before every build.

## Architecture

A Manifest V3 Chrome extension that adds friction (countdown timer or word-typing challenge) before distracting sites load. There are **two independent blocking paths** that share the same unlock logic and storage:

1. **Pre-navigation redirect (primary)** — `src/background/worker.ts` listens on `chrome.webNavigation.onBeforeNavigate` (top frame only) and, if the target domain is blocked and the tab isn't unlocked, redirects the tab to `block.html` _before the target page loads_. The challenge UI is the Svelte app in `src/block/`. The original URL, domain, and tabId are passed as query params; on success `block.html` navigates back to the original URL.
2. **Content-script overlay (fallback)** — `src/content/overlay.ts` runs at `document_start` on `<all_urls>`. It hides the page, checks blocked/unlocked state, and if needed injects a full-screen overlay built with raw DOM/HTML strings (not Svelte — it must run inline in the page). Covers in-page navigations the webNavigation hook doesn't catch.

Because there are two paths, **challenge UI and styling are duplicated**: the block page uses Svelte + SCSS (`src/styles/_vars.scss` CSS custom properties), while the overlay uses an inline `OVERLAY_CSS` template string with its own `--dg-*` variables. Changes to challenge behavior or theming usually need to be made in **both** places to stay consistent.

### Unlock state model

Unlocks are **per-tab and per-domain**, stored in `chrome.storage.session` under `tabUnlocks` (`{ [tabId]: domain }`). Session storage clears when the browser closes, so unlocks don't persist across restarts. Navigating a tab to a different domain clears that tab's unlock. The worker is the single owner of this state; the block page and overlay request/set it via `chrome.runtime.sendMessage` with `PAGE_LOAD` and `ADD_UNLOCKED` message types. Note `block.html` has no `sender.tab`, so it passes `tabId` explicitly in the message.

### Storage layout

- `chrome.storage.sync` — `domains: string[]` (blocked list) and `settings: Settings`. Synced across the user's Chrome devices; seeded on install in the worker's `onInstalled` handler.
- `chrome.storage.session` — `tabUnlocks` (see above).

Domain matching is a suffix match: a domain is blocked if it equals an entry or ends with `.<entry>` (so `reddit.com` blocks `www.reddit.com`). This lives in the shared `isBlocked(domain, list)` helper in `src/utils.ts` — used by both blocking paths, so change it once. `extractDomain` (same file) strips the `www.` prefix. Out-of-range settings are normalized by `clampSettings` (`src/types.ts`) at every read site.

### Entry points

`manifest.json` is the source of truth wiring it together: background `worker.ts`, content `overlay.ts`, action popup (`src/popup/`), and `options_ui` (`src/options/`). `vite-plugin-web-extension` reads the manifest to discover entry points; `block.html` is not referenced by the manifest so it's declared via `additionalInputs` in `vite.config.ts`.

`src/types.ts` holds `Settings` and `DEFAULT_SETTINGS` — the shared shape across all surfaces. Always spread `{ ...DEFAULT_SETTINGS, ...loaded }` when reading settings so new fields have defaults.

## Testing

Vitest with jsdom. `src/__tests__/setup.ts` installs a global `chrome` mock backed by in-memory sync/session stores — call `resetStorage()` between tests. `overlay.ts` and `words.ts` are excluded from coverage. The Svelte UIs (popup/options/block) are not unit-tested; logic lives in `worker.ts`, `utils.ts`, and `lib/` where it's testable.

## Conventions

- TypeScript is strict with `noUnusedLocals`/`noUnusedParameters` and `verbatimModuleSyntax` — use `import type` for type-only imports. Relative imports include the `.ts` extension (`allowImportingTsExtensions`).
- Svelte 5 runes (`$state`, `$effect`, `$derived`) — not the legacy reactive syntax.
- Bracket-notation access for index signatures (`result['domains']`, `dataset['theme']`) is required by the strict config.
