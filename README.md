# Distraction Guard

A Chrome extension that adds intentional friction to distracting websites. Instead of blocking sites outright, it makes you pause — either by waiting out a countdown timer or typing a random sequence of words before the page loads.

## Features

- **Domain-level blocking** — block an entire domain (e.g. `reddit.com`) from the popup
- **Blocked before loading** — Chrome redirects to the challenge before the site gets a single request
- **Two unlock modes** — wait out a timer, or type a word challenge. The timer only runs while its tab is visible.
- **Dark mode** — follows system preference by default, overridable in settings
- **Tab-level unlocks** — unlocking one tab doesn't affect others; leaving the site re-locks the tab
- **Synced storage** — blocked list and settings sync across Chrome devices

## Install

1. Download `distraction-guard-<version>.zip` from the [latest release](https://github.com/robertkocsis/distraction-guard/releases/latest) and unzip it somewhere permanent (Chrome loads it from that folder, so don't delete it)
2. Open `chrome://extensions` and enable **Developer mode**
3. Click **Load unpacked** and select the unzipped folder

To update, unzip the new release over the same folder and click the reload icon on the extension's card.

## Development

**Prerequisites:** Node.js 20.19+ (CI uses Node 24)

```bash
npm install
npm run build    # one-off build into dist/
npm run dev      # rebuild dist/ on every change
```

Load `dist/` with **Load unpacked** as above. After a rebuild, click the reload icon on the extension's card.

### Releasing

Bump `version` in `manifest.json`, commit, then push a matching tag:

```bash
git tag v1.1.0
git push origin v1.1.0
```

GitHub Actions builds the extension and publishes a release with the zip attached.

## Stack

- [Svelte 5](https://svelte.dev) — popup and options UI
- [TypeScript](https://www.typescriptlang.org) — throughout
- [Vite](https://vitejs.dev) — build (plain multi-entry config, no extension plugin)
- [Sass](https://sass-lang.com) — styling with CSS custom properties for theming

## Contributing

Keep this README up to date — when you change features, setup steps, or the stack, update the relevant section in the same change so it doesn't go stale. (Architecture and developer-facing notes live in `CLAUDE.md`.)
