import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// Source path of the background worker as written in manifest.json, and where
// the built worker lands in dist/ (the copied manifest points here instead).
const WORKER_SRC = 'src/background/worker.ts';
const WORKER_OUT = 'src/background/worker.js';

/** Copies manifest.json into the build, pointing the worker at its built .js. */
function manifest(): Plugin {
  return {
    name: 'manifest',
    buildStart() {
      this.addWatchFile('manifest.json');
    },
    generateBundle() {
      const json = readFileSync('manifest.json', 'utf8');
      if (!json.includes(WORKER_SRC)) {
        this.error(`manifest.json no longer references ${WORKER_SRC}`);
      }
      this.emitFile({
        type: 'asset',
        fileName: 'manifest.json',
        source: json.replace(WORKER_SRC, WORKER_OUT),
      });
    },
  };
}

export default defineConfig({
  plugins: [svelte(), manifest()],
  build: {
    // Vite's modulepreload polyfill touches `document`, which doesn't exist in
    // the service worker if it ends up in a chunk the worker imports.
    modulePreload: false,
    rolldownOptions: {
      input: {
        popup: 'src/popup/popup.html',
        options: 'src/options/options.html',
        block: 'src/block/block.html',
        worker: WORKER_SRC,
      },
      output: {
        entryFileNames: (chunk) =>
          chunk.name === 'worker' ? WORKER_OUT : '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name][extname]',
      },
    },
  },
});
