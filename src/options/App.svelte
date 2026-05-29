<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { DEFAULT_SETTINGS, clampSettings } from '../types.ts';
  import type { UnlockMethod, Theme } from '../types.ts';
  import { applyTheme, watchSystemTheme } from '../lib/theme.ts';

  let unlockMethod = $state<UnlockMethod>('timer');
  let timerDuration = $state(30);
  let typingLength = $state(15);
  let theme = $state<Theme>('system');
  let saved = $state(false);

  let stopWatchingTheme: (() => void) | null = null;

  function watchTheme(value: Theme) {
    // Tear down any previous watcher so listeners don't accumulate
    stopWatchingTheme?.();
    stopWatchingTheme =
      value === 'system' ? watchSystemTheme(() => applyTheme('system')) : null;
  }

  async function load() {
    const result = await chrome.storage.sync.get('settings');
    const settings = clampSettings({
      ...DEFAULT_SETTINGS,
      ...(result['settings'] ?? {}),
    });
    unlockMethod = settings.unlockMethod;
    timerDuration = settings.timerDuration;
    typingLength = settings.typingLength;
    theme = settings.theme;
    applyTheme(settings.theme);
    watchTheme(settings.theme);
  }

  function setTheme(value: Theme) {
    theme = value;
    applyTheme(value);
    watchTheme(value);
  }

  async function save() {
    const clamped = clampSettings({
      unlockMethod,
      timerDuration,
      typingLength,
      theme,
    });
    timerDuration = clamped.timerDuration;
    typingLength = clamped.typingLength;

    await chrome.storage.sync.set({ settings: clamped });

    saved = true;
    setTimeout(() => (saved = false), 2000);
  }

  onMount(load);
  onDestroy(() => stopWatchingTheme?.());
</script>

<div class="page">
  <div class="container">
    <h1>Settings</h1>
    <p class="subtitle">Configure how Distraction Guard works.</p>

    <section class="card">
      <h2>Unlock method</h2>

      <label class="option" class:selected={unlockMethod === 'timer'}>
        <input
          type="radio"
          name="method"
          value="timer"
          bind:group={unlockMethod}
        />
        <div class="radio-dot"></div>
        <div class="option-body">
          <span class="option-name">Wait it out</span>
          <span class="option-desc"
            >A countdown timer expires before you can proceed.</span
          >
        </div>
      </label>

      <label class="option" class:selected={unlockMethod === 'typing'}>
        <input
          type="radio"
          name="method"
          value="typing"
          bind:group={unlockMethod}
        />
        <div class="radio-dot"></div>
        <div class="option-body">
          <span class="option-name">Type a challenge</span>
          <span class="option-desc"
            >Type a random sequence of words to proceed.</span
          >
        </div>
      </label>
    </section>

    <section class="card">
      <h2>Parameters</h2>

      <div class="field">
        <div class="field-label">
          <span class="field-name">Timer duration</span>
          <span class="field-desc">Seconds to wait (10 – 300)</span>
        </div>
        <input
          type="number"
          class="field-input"
          min="10"
          max="300"
          bind:value={timerDuration}
          disabled={unlockMethod !== 'timer'}
        />
      </div>

      <div class="field">
        <div class="field-label">
          <span class="field-name">Word count</span>
          <span class="field-desc">Words to type (10 – 50)</span>
        </div>
        <input
          type="number"
          class="field-input"
          min="10"
          max="50"
          bind:value={typingLength}
          disabled={unlockMethod !== 'typing'}
        />
      </div>
    </section>

    <section class="card">
      <h2>Appearance</h2>
      <div class="field" style="padding-top: 4px; padding-bottom: 4px;">
        <div class="field-label">
          <span class="field-name">Theme</span>
          <span class="field-desc">Controls the color scheme</span>
        </div>
        <div class="theme-toggle">
          <button
            class="theme-btn"
            class:active={theme === 'system'}
            onclick={() => setTheme('system')}>System</button
          >
          <button
            class="theme-btn"
            class:active={theme === 'light'}
            onclick={() => setTheme('light')}>Light</button
          >
          <button
            class="theme-btn"
            class:active={theme === 'dark'}
            onclick={() => setTheme('dark')}>Dark</button
          >
        </div>
      </div>
    </section>

    <div class="save-row">
      <button class="save-btn" onclick={() => void save()}>Save settings</button
      >
      <span class="toast" class:visible={saved}>Saved</span>
    </div>
  </div>
</div>

<style lang="scss">
  @use '../styles/vars' as *;

  :global(*) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :global(body) {
    font-family: $font;
    background: var(--bg-2);
    color: var(--text);
    min-height: 100vh;
  }

  .page {
    display: flex;
    justify-content: center;
    padding: 64px 24px 80px;
  }

  .container {
    width: 100%;
    max-width: 460px;
  }

  h1 {
    font-size: 24px;
    font-weight: 700;
    letter-spacing: -0.03em;
    margin-bottom: 6px;
  }

  .subtitle {
    font-size: 14px;
    color: var(--text-2);
    margin-bottom: 36px;
  }

  .card {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: $radius-lg;
    padding: 24px;
    margin-bottom: 14px;

    h2 {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: var(--text-3);
      margin-bottom: 18px;
    }
  }

  .option {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 13px 0;
    cursor: pointer;

    &:not(:last-child) {
      border-bottom: 1px solid var(--border);
    }

    input[type='radio'] {
      display: none;
    }

    .radio-dot {
      width: 17px;
      height: 17px;
      border-radius: 50%;
      border: 1.5px solid var(--border-2);
      flex-shrink: 0;
      margin-top: 2px;
      transition:
        border-color $transition,
        background $transition;
      position: relative;

      &::after {
        content: '';
        position: absolute;
        inset: 3px;
        border-radius: 50%;
        background: var(--bg);
        transition: background $transition;
      }
    }

    &.selected .radio-dot {
      border-color: var(--accent);
      background: var(--accent);
      &::after {
        background: var(--accent-fg);
      }
    }
  }

  .option-body {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .option-name {
    font-size: 14px;
    font-weight: 500;
  }
  .option-desc {
    font-size: 13px;
    color: var(--text-2);
  }

  .field {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 13px 0;

    &:not(:last-child) {
      border-bottom: 1px solid var(--border);
    }
  }

  .field-label {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .field-name {
    font-size: 14px;
    font-weight: 500;
  }
  .field-desc {
    font-size: 13px;
    color: var(--text-2);
  }

  .field-input {
    width: 76px;
    padding: 8px 10px;
    font-size: 14px;
    font-family: $font;
    border: 1.5px solid var(--border);
    border-radius: $radius-sm;
    outline: none;
    text-align: center;
    color: var(--text);
    background: var(--bg);
    transition:
      border-color $transition,
      opacity $transition;

    &:focus {
      border-color: var(--accent);
    }
    &:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }
  }

  .theme-toggle {
    display: flex;
    gap: 4px;
    background: var(--bg-3);
    border-radius: $radius-md;
    padding: 3px;
  }

  .theme-btn {
    padding: 6px 12px;
    font-size: 13px;
    font-weight: 500;
    font-family: $font;
    border: none;
    border-radius: 7px;
    cursor: pointer;
    background: transparent;
    color: var(--text-2);
    transition:
      background $transition,
      color $transition;

    &:hover {
      color: var(--text);
    }

    &.active {
      background: var(--bg);
      color: var(--text);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
    }
  }

  .save-row {
    position: relative;
    margin-top: 14px;
  }

  .save-btn {
    display: block;
    width: 100%;
    padding: 13px;
    background: var(--accent);
    color: var(--accent-fg);
    border: none;
    border-radius: $radius-md;
    font-size: 14px;
    font-weight: 500;
    font-family: $font;
    cursor: pointer;
    transition: opacity $transition;

    &:hover {
      opacity: 0.7;
    }
  }

  .toast {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    right: 0;
    text-align: center;
    font-size: 13px;
    color: var(--text-3);
    opacity: 0;
    transition: opacity 0.3s ease;

    &.visible {
      opacity: 1;
    }
  }
</style>
