<script lang="ts">
  import { onMount } from 'svelte';
  import { DEFAULT_SETTINGS } from '../types.ts';
  import { applyTheme, watchSystemTheme } from '../lib/theme.ts';

  let domains = $state<string[]>([]);
  let inputValue = $state('');
  let inputEl = $state<HTMLInputElement | null>(null);

  async function loadAll() {
    const result = await chrome.storage.sync.get(['domains', 'settings']);
    domains = (result['domains'] as string[] | undefined) ?? [];
    const settings = { ...DEFAULT_SETTINGS, ...(result['settings'] ?? {}) };
    applyTheme(settings.theme);
    if (settings.theme === 'system') {
      watchSystemTheme(() => applyTheme('system'));
    }
  }

  async function saveDomains(next: string[]) {
    await chrome.storage.sync.set({ domains: next });
    domains = next;
  }

  function normalizeDomain(raw: string): string {
    return raw
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .trim();
  }

  async function add() {
    const domain = normalizeDomain(inputValue);
    if (!domain || domains.includes(domain)) {
      inputValue = '';
      return;
    }
    await saveDomains([...domains, domain]);
    inputValue = '';
    inputEl?.focus();
  }

  async function remove(domain: string) {
    await saveDomains(domains.filter((d) => d !== domain));
  }

  onMount(loadAll);
</script>

<div class="popup">
  <header>
    <span class="wordmark">Distraction Guard</span>
    <button class="icon-btn" onclick={() => chrome.runtime.openOptionsPage()} title="Settings">
      <svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 0 1-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 0 1 .947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 0 1 2.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 0 1 2.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 0 1 .947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 0 1-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 0 1-2.287-.947ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
      </svg>
    </button>
  </header>

  <div class="add-row">
    <input
      bind:this={inputEl}
      bind:value={inputValue}
      type="text"
      placeholder="reddit.com"
      autocomplete="off"
      autocorrect="off"
      spellcheck="false"
      onkeydown={(e) => { if (e.key === 'Enter') void add(); }}
    />
    <button class="block-btn" onclick={() => void add()}>Block</button>
  </div>

  <div class="divider"></div>

  <div class="list">
    {#if domains.length === 0}
      <p class="empty">No sites blocked yet.</p>
    {:else}
      {#each domains as domain (domain)}
        <div class="item">
          <span class="domain">{domain}</span>
          <button class="remove-btn" onclick={() => void remove(domain)} title="Remove">✕</button>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style lang="scss">
  @use '../styles/vars' as *;

  :global(*) { box-sizing: border-box; margin: 0; padding: 0; }
  :global(body) { background: var(--bg); }

  .popup {
    width: 300px;
    font-family: $font;
    color: var(--text);
    background: var(--bg);
    display: flex;
    flex-direction: column;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 16px 14px;
  }

  .wordmark {
    font-size: 13px;
    font-weight: 600;
    letter-spacing: -0.01em;
  }

  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-3);
    padding: 4px;
    border-radius: $radius-sm;
    transition: color $transition, background $transition;

    &:hover {
      color: var(--text);
      background: var(--bg-3);
    }
  }

  .add-row {
    display: flex;
    gap: 8px;
    padding: 0 12px 14px;

    input {
      flex: 1;
      padding: 8px 11px;
      font-size: 13px;
      font-family: $font;
      border: 1.5px solid var(--border);
      border-radius: $radius-sm;
      outline: none;
      color: var(--text);
      background: var(--bg);
      transition: border-color $transition;

      &::placeholder { color: var(--text-3); }
      &:focus { border-color: var(--accent); }
    }
  }

  .block-btn {
    padding: 8px 14px;
    background: var(--accent);
    color: var(--accent-fg);
    border: none;
    border-radius: $radius-sm;
    font-size: 13px;
    font-weight: 500;
    font-family: $font;
    cursor: pointer;
    white-space: nowrap;
    transition: opacity $transition;

    &:hover { opacity: 0.7; }
  }

  .divider {
    height: 1px;
    background: var(--border);
    margin: 0 12px;
  }

  .list {
    padding: 6px 0;
    max-height: 260px;
    overflow-y: auto;
  }

  .empty {
    padding: 20px 16px;
    font-size: 13px;
    color: var(--text-3);
    text-align: center;
  }

  .item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 9px 12px;
    border-radius: $radius-sm;
    margin: 0 4px;
    transition: background $transition;

    &:hover { background: var(--bg-2); }
  }

  .domain {
    font-size: 13px;
    color: var(--text);
  }

  .remove-btn {
    background: none;
    border: none;
    color: var(--text-3);
    cursor: pointer;
    font-size: 12px;
    padding: 3px 5px;
    border-radius: 4px;
    font-family: $font;
    line-height: 1;
    transition: color $transition, background $transition;

    &:hover {
      color: var(--red);
      background: var(--red-soft);
    }
  }
</style>
