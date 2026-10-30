# Distraction Guard

A Chrome extension that adds intentional friction to distracting websites. Instead of blocking sites outright, it makes you pause — either by waiting out a countdown timer or typing a random sequence of words before the page loads.

## Features

- **Domain-level blocking** — block an entire domain (e.g. `reddit.com`) from the popup
- **Blocked before loading** — Chrome redirects to the challenge before the site gets a single request
- **Two unlock modes** — wait out a timer, or type a word challenge. The timer only runs while its tab is visible.
- **Dark mode** — follows system preference by default, overridable in settings
- **Tab-level unlocks** — unlocking one tab doesn't affect others; leaving the site re-locks the tab
- **Synced storage** — blocked list and settings sync across Chrome devices

## Development

**Prerequisites:** Node.js 20.19+ (CI uses Node 24)

```bash
npm install
npm run build
```

The extension is built into `dist/`. To load it in Chrome:

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `dist/` folder

## Stack

- [Svelte 5](https://svelte.dev) — popup and options UI
- [TypeScript](https://www.typescriptlang.org) — throughout
- [Vite](https://vitejs.dev) + [vite-plugin-web-extension](https://vite-plugin-web-extension.aklinker1.io) — build
- [Sass](https://sass-lang.com) — styling with CSS custom properties for theming

## Contributing

Keep this README up to date — when you change features, setup steps, or the stack, update the relevant section in the same change so it doesn't go stale. (Architecture and developer-facing notes live in `CLAUDE.md`.)
