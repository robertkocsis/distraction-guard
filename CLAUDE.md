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
npm run typecheck      # tsc + svelte-check (tsc alone skips .svelte files)
npm run lint           # eslint .
npm run format:check   # prettier --check (CI gate; run `npm run format` to fix)
```

CI (`.github/workflows/ci.yml`) runs, in order: `format:check`, `lint`, `typecheck`, `test`. All four must pass — match this locally before pushing.

Use npm 11+ (`npx npm@11 install`) when changing dependencies: npm 10.9 crashes resolving the lockfile (`Cannot read properties of null (reading 'edgesOut')`, triggered by jsdom's optional `canvas` peer). `npm ci` from the existing lockfile works on either.

`prebuild` runs `scripts/generate-icons.mjs` (sharp) to regenerate PNG icons before every build.

## Architecture

A Manifest V3 Chrome extension that adds friction (countdown timer or word-typing challenge) before distracting sites load. Blocking is done entirely with **`declarativeNetRequest` rules** (`src/lib/rules.ts`), so Chrome redirects a blocked navigation to `block.html` before any request reaches the site — there is no content script.

- **Block rule** — a single dynamic rule (id `1`, priority 1) redirects `main_frame` requests whose host is in the blocked list (`requestDomains`) to `src/block/block.html#<original URL>` via `regexSubstitution` (`\0` = the whole URL). Dynamic rules persist across restarts; `worker.ts` rebuilds the rule on `onInstalled` and whenever `domains` changes in `chrome.storage.sync`. Redirecting to an extension page requires `block.html` in `web_accessible_resources` and host permissions (`<all_urls>`).
- **Block page** — the Svelte app in `src/block/` reads the original URL from `location.hash`, shows the challenge, then unlocks the tab and `location.replace`s back to the URL (replace, so Back skips the block page). The timer only counts down while `document.hidden` is false, so it can't be waited out in a background tab.

### Unlock state model

Unlocks are **per-tab and per-domain** and live only as **session rules** — there is no separate storage. Unlocking adds an `allow` rule (priority 2, outranks the block rule) with `id` = `tabId`, `tabIds: [tabId]` and `requestDomains: [domain]`, so a tab holds at most one unlock and it covers that domain's subdomains. Session rules clear when the browser closes. The block page creates the rule itself (`unlockTab`, tab id from `chrome.tabs.getCurrent()`); the worker removes it when the tab commits a top-frame navigation outside the unlocked domain (`webNavigation.onCommitted` → `handleNavigation`) or closes (`tabs.onRemoved`).

### Storage layout

- `chrome.storage.sync` — `domains: string[]` (blocked list) and `settings: Settings`. Synced across the user's Chrome devices. Nothing is seeded on install (every reader falls back to `[]` / `DEFAULT_SETTINGS`), so a fresh install can't overwrite a list that hasn't synced down yet.

Domain matching is a suffix match: a domain is blocked if it equals an entry or ends with `.<entry>` (so `reddit.com` blocks `www.reddit.com`). Chrome's `requestDomains` does this for blocking; `isBlocked(domain, list)` in `src/utils.ts` mirrors it for the re-lock check. `extractDomain` (same file) strips the `www.` prefix. `normalizeDomain` turns user input into a bare lowercase, punycoded hostname (or `''`); the popup uses it on input and `syncBlockRule` re-applies it, because a single invalid `requestDomains` entry makes Chrome reject the whole rule. Out-of-range settings are normalized by `clampSettings` (`src/types.ts`) at every read site.

### Entry points

`manifest.json` is the source of truth wiring it together: background `worker.ts`, action popup (`src/popup/`), and `options_ui` (`src/options/`). `vite-plugin-web-extension` reads the manifest to discover entry points; `block.html` is only referenced from `web_accessible_resources`, so it's also declared via `additionalInputs` in `vite.config.ts`.

`src/types.ts` holds `Settings` and `DEFAULT_SETTINGS` — the shared shape across all surfaces. Always spread `{ ...DEFAULT_SETTINGS, ...loaded }` when reading settings so new fields have defaults.

## Testing

Vitest with jsdom. `src/__tests__/setup.ts` installs a global `chrome` mock backed by in-memory `storage.sync` and dynamic/session `declarativeNetRequest` rule stores — call `resetStorage()` between tests; `getDynamicRules()`/`getSessionRules()` expose the rules for assertions. `words.ts` is excluded from coverage. `worker.ts` is listener wiring only and the Svelte UIs (popup/options/block) are not unit-tested; logic lives in `utils.ts` and `lib/` where it's testable.

## Conventions

- TypeScript is strict with `noUnusedLocals`/`noUnusedParameters` and `verbatimModuleSyntax` — use `import type` for type-only imports. Relative imports include the `.ts` extension (`allowImportingTsExtensions`).
- Svelte 5 runes (`$state`, `$effect`, `$derived`) — not the legacy reactive syntax.
- Bracket-notation access for index signatures (`result['domains']`, `dataset['theme']`) is required by the strict config.
