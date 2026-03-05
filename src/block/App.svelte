<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { DEFAULT_SETTINGS } from '../types.ts';
  import type { Settings } from '../types.ts';
  import { applyTheme, watchSystemTheme } from '../lib/theme.ts';
  import { generateChallenge } from '../utils.ts';

  const params = new URLSearchParams(window.location.search);
  const originalUrl = params.get('url') ?? '';
  const domain = params.get('domain') ?? '';
  const tabId = params.get('tabId') ?? '';

  let settings = $state<Settings>(DEFAULT_SETTINGS);
  let challenge = $state('');
  let timeLeft = $state(0);
  let inputValue = $state('');
  let unlockEnabled = $state(false);

  let challengeBox: HTMLDivElement | undefined = $state();
  let textareaEl: HTMLTextAreaElement | undefined = $state();

  let stopWatchingTheme: (() => void) | null = null;
  let timerInterval: ReturnType<typeof setInterval> | null = null;

  onMount(async () => {
    const result = await chrome.storage.sync.get(['settings']);
    const loaded: Settings = {
      ...DEFAULT_SETTINGS,
      ...((result['settings'] as Partial<Settings> | undefined) ?? {}),
    };
    settings = loaded;
    applyTheme(loaded.theme);
    stopWatchingTheme = watchSystemTheme(() => applyTheme(loaded.theme));

    if (loaded.unlockMethod === 'typing') {
      challenge = generateChallenge(loaded.typingLength);
    } else {
      timeLeft = loaded.timerDuration;
      timerInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
          clearInterval(timerInterval!);
          timerInterval = null;
          unlockEnabled = true;
        }
      }, 1000);
    }
  });

  onDestroy(() => {
    stopWatchingTheme?.();
    if (timerInterval) clearInterval(timerInterval);
  });

  $effect(() => {
    if (challengeBox && textareaEl && challenge) {
      requestAnimationFrame(() => {
        if (textareaEl && challengeBox) {
          textareaEl.style.height = `${challengeBox.offsetHeight}px`;
          textareaEl.focus();
        }
      });
    }
  });

  function onInput() {
    unlockEnabled = inputValue === challenge;
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (unlockEnabled) void doUnlock();
    }
  }

  async function doUnlock() {
    await chrome.runtime.sendMessage({ type: 'ADD_UNLOCKED', domain, tabId });
    window.location.href = originalUrl;
  }
</script>

<main>
  <div class="card">
    <div class="domain">{domain}</div>
    <h1 class="title">
      {settings.unlockMethod === 'timer'
        ? 'Intentional pause'
        : 'Type this to continue'}
    </h1>
    {#if settings.unlockMethod === 'timer'}
      <div class="count">{timeLeft}</div>
      <div class="count-label">seconds remaining</div>
    {:else}
      <div class="challenge-box" bind:this={challengeBox}>{challenge}</div>
      <textarea
        class="typing-input"
        bind:this={textareaEl}
        bind:value={inputValue}
        oninput={onInput}
        onkeydown={onKeydown}
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        spellcheck={false}
        placeholder="Type here..."
      ></textarea>
    {/if}
    <button class="btn" disabled={!unlockEnabled} onclick={doUnlock}
      >Continue</button
    >
  </div>
</main>

<style lang="scss">
  @use '../styles/vars' as *;

  :global(*, *::before, *::after) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :global(body) {
    background: var(--bg);
    color: var(--text);
    font-family: $font;
  }

  main {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .card {
    width: 100%;
    max-width: 560px;
    padding: 48px 40px;
    text-align: center;
  }

  .domain {
    font-size: 12px;
    color: var(--text-3);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 12px;
  }

  .title {
    font-size: 22px;
    font-weight: 600;
    letter-spacing: -0.02em;
    margin-bottom: 36px;
  }

  .count {
    font-size: 72px;
    font-weight: 700;
    letter-spacing: -0.04em;
    font-variant-numeric: tabular-nums;
    line-height: 1;
    margin-bottom: 6px;
  }

  .count-label {
    font-size: 13px;
    color: var(--text-2);
    margin-bottom: 32px;
  }

  .challenge-box {
    font-size: 20px;
    font-weight: 500;
    line-height: 1.6;
    word-spacing: 0.15em;
    background: var(--bg-2);
    border-radius: $radius-md;
    padding: 20px 24px;
    margin-bottom: 20px;
    user-select: none;
    word-break: break-word;
  }

  .typing-input {
    width: 100%;
    padding: 20px 24px;
    font-size: 20px;
    font-family: $font;
    font-weight: 500;
    line-height: 1.6;
    word-spacing: 0.15em;
    border: 1.5px solid var(--border);
    border-radius: $radius-md;
    outline: none;
    margin-bottom: 16px;
    transition: border-color $transition;
    background: var(--bg);
    color: var(--text);
    resize: none;
    overflow: hidden;

    &:focus {
      border-color: var(--accent);
    }
  }

  .btn {
    display: block;
    width: 100%;
    padding: 12px 28px;
    background: var(--accent);
    color: var(--accent-fg);
    border: none;
    border-radius: $radius-md;
    font-size: 15px;
    font-weight: 500;
    font-family: $font;
    cursor: pointer;
    transition: opacity $transition;
    height: 42px;

    &:disabled {
      opacity: 0.25;
      cursor: not-allowed;
    }

    &:not(:disabled):hover {
      opacity: 0.75;
    }
  }
</style>
