<script lang="ts">
  import { onMount } from 'svelte';
  import { DEFAULT_SETTINGS, clampSettings } from '../types.ts';
  import type { Settings } from '../types.ts';
  import { applyTheme } from '../lib/theme.ts';
  import { unlockTab } from '../lib/rules.ts';
  import { extractDomain, generateChallenge } from '../utils.ts';

  // Only http(s) targets are safe to navigate to — guard against a crafted
  // URL (e.g. javascript:) executing in the extension's origin.
  function safeUrl(raw: string): string {
    try {
      const parsed = new URL(raw);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed.href;
      }
    } catch {
      // fall through
    }
    return 'about:blank';
  }

  // The block rule passes the blocked URL in the hash
  const originalUrl = safeUrl(window.location.hash.slice(1));
  const domain = extractDomain(originalUrl);

  let settings = $state<Settings>();
  let challenge = $state('');
  let timeLeft = $state(0);
  let inputValue = $state('');

  let unlockEnabled = $derived(
    settings?.unlockMethod === 'timer'
      ? timeLeft <= 0
      : inputValue === challenge,
  );

  let challengeBox: HTMLDivElement | undefined = $state();
  let textareaEl: HTMLTextAreaElement | undefined = $state();

  onMount(async () => {
    const result = await chrome.storage.sync.get('settings');
    const loaded = clampSettings({
      ...DEFAULT_SETTINGS,
      ...((result['settings'] as Partial<Settings> | undefined) ?? {}),
    });
    applyTheme(loaded.theme);
    timeLeft = loaded.timerDuration;
    if (loaded.unlockMethod === 'typing') {
      challenge = generateChallenge(loaded.typingLength);
    }
    settings = loaded;
  });

  // Count down only while the page is visible, so the wait can't be sat out
  // in a background tab.
  $effect(() => {
    if (settings?.unlockMethod !== 'timer') return;
    const interval = setInterval(() => {
      if (!document.hidden && timeLeft > 0) timeLeft--;
    }, 1000);
    return () => clearInterval(interval);
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

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (unlockEnabled) void doUnlock();
    }
  }

  async function doUnlock() {
    const tab = await chrome.tabs.getCurrent();
    if (tab?.id !== undefined && domain) await unlockTab(tab.id, domain);
    // Replace, so Back from the site doesn't land on the block page again
    window.location.replace(originalUrl);
  }
</script>

<main>
  {#if settings}
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
          onkeydown={onKeydown}
          autocomplete="off"
          autocapitalize="off"
          spellcheck={false}
          placeholder="Type here..."
        ></textarea>
      {/if}
      <button class="btn" disabled={!unlockEnabled} onclick={doUnlock}
        >Continue</button
      >
    </div>
  {/if}
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
