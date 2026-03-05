# Distraction Guard

A Chrome extension that adds intentional friction to distracting websites. Instead of blocking sites outright, it makes you pause — either by waiting out a countdown timer or typing a random sequence of words before the page loads.

## Features

- **Domain-level blocking** — block an entire domain (e.g. `reddit.com`) from the popup
- **Two unlock modes** — wait out a timer, or type a word challenge
- **Dark mode** — follows system preference by default, overridable in settings
- **Synced storage** — blocked list and settings sync across Chrome devices

## Development

**Prerequisites:** Node.js 18+

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
