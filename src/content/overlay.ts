import { DEFAULT_SETTINGS } from '../types.ts';
import type { Settings, Theme } from '../types.ts';
import { extractDomain, generateChallenge, escape } from '../utils.ts';

const OVERLAY_CSS = `
  #dg-overlay {
    --dg-bg:        #ffffff;
    --dg-bg-2:      #f5f5f5;
    --dg-text:      #111111;
    --dg-text-2:    #999999;
    --dg-accent:    #111111;
    --dg-accent-fg: #ffffff;
    --dg-border:    #e5e5e5;
  }
  @media (prefers-color-scheme: dark) {
    #dg-overlay:not([data-theme='light']) {
      --dg-bg:        #111111;
      --dg-bg-2:      #1e1e1e;
      --dg-text:      #efefef;
      --dg-text-2:    #666666;
      --dg-accent:    #efefef;
      --dg-accent-fg: #111111;
      --dg-border:    #2c2c2c;
    }
  }
  #dg-overlay[data-theme='dark'] {
    --dg-bg:        #111111;
    --dg-bg-2:      #1e1e1e;
    --dg-text:      #efefef;
    --dg-text-2:    #666666;
    --dg-accent:    #efefef;
    --dg-accent-fg: #111111;
    --dg-border:    #2c2c2c;
  }
  #dg-overlay {
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    background: var(--dg-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: var(--dg-text);
  }
  #dg-overlay * { box-sizing: border-box; margin: 0; padding: 0; }
  #dg-overlay .dg-card {
    width: 100%;
    max-width: 560px;
    padding: 48px 40px;
    text-align: center;
  }
  #dg-overlay .dg-domain {
    font-size: 12px;
    color: var(--dg-text-2);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 12px;
  }
  #dg-overlay .dg-title {
    font-size: 22px;
    font-weight: 600;
    letter-spacing: -0.02em;
    margin-bottom: 36px;
  }
  #dg-overlay .dg-count {
    font-size: 72px;
    font-weight: 700;
    letter-spacing: -0.04em;
    font-variant-numeric: tabular-nums;
    line-height: 1;
    margin-bottom: 6px;
  }
  #dg-overlay .dg-count-label {
    font-size: 13px;
    color: var(--dg-text-2);
    margin-bottom: 32px;
  }
  #dg-overlay .dg-challenge-box {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 20px;
    font-weight: 500;
    line-height: 1.6;
    word-spacing: 0.15em;
    background: var(--dg-bg-2);
    border-radius: 10px;
    padding: 20px 24px;
    margin-bottom: 20px;
    user-select: none;
    white-space: normal;
    word-break: break-word;
  }
  #dg-overlay .dg-textarea {
    width: 100%;
    padding: 20px 24px;
    font-size: 20px;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-weight: 500;
    line-height: 1.6;
    word-spacing: 0.15em;
    border: 1.5px solid var(--dg-border);
    border-radius: 10px;
    outline: none;
    margin-bottom: 16px;
    transition: border-color 0.15s;
    background: var(--dg-bg);
    color: var(--dg-text);
    resize: none;
    overflow: hidden;
    box-sizing: border-box;
  }
  #dg-overlay .dg-textarea:focus { border-color: var(--dg-accent); }
  #dg-overlay .dg-textarea.dg-error { border-color: #ef4444; }
  #dg-overlay .dg-btn {
    display: inline-block;
    padding: 12px 28px;
    background: var(--dg-accent);
    color: var(--dg-accent-fg);
    border: none;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    transition: opacity 0.15s;
    width: 100%;
    line-height: normal;
    height: 42px;
  }
  #dg-overlay .dg-btn:disabled { opacity: 0.25; cursor: not-allowed; }
  #dg-overlay .dg-btn:not(:disabled):hover { opacity: 0.75; }
`;

function renderTimer(domain: string, duration: number): string {
  return `
    <div class="dg-card">
      <div class="dg-domain">${escape(domain)}</div>
      <div class="dg-title">Intentional pause</div>
      <div class="dg-count" id="dg-count">${duration}</div>
      <div class="dg-count-label">seconds remaining</div>
      <button class="dg-btn" id="dg-btn" disabled>Continue</button>
    </div>
  `;
}

function renderTyping(domain: string, challenge: string): string {
  return `
    <div class="dg-card">
      <div class="dg-domain">${escape(domain)}</div>
      <div class="dg-title">Type this to continue</div>
      <div class="dg-challenge-box" id="dg-challenge">${escape(challenge)}</div>
      <textarea class="dg-textarea" id="dg-input" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="Type here..."></textarea>
      <button class="dg-btn" id="dg-btn" disabled>Continue</button>
    </div>
  `;
}

function unlock(domain: string): void {
  void chrome.runtime.sendMessage({ type: 'ADD_UNLOCKED', domain });
  document.getElementById('dg-overlay')?.remove();
  document.getElementById('dg-hide')?.remove();
  document.getElementById('dg-style')?.remove();
}

function startTimer(duration: number, domain: string): void {
  let remaining = duration;
  const countEl = document.getElementById('dg-count')!;
  const btn = document.getElementById('dg-btn') as HTMLButtonElement;

  btn.addEventListener('click', () => unlock(domain));

  const interval = setInterval(() => {
    remaining--;
    countEl.textContent = String(remaining);
    if (remaining <= 0) {
      clearInterval(interval);
      btn.disabled = false;
    }
  }, 1000);
}

function setupTyping(challenge: string, domain: string): void {
  const textarea = document.getElementById('dg-input') as HTMLTextAreaElement;
  const challengeBox = document.getElementById(
    'dg-challenge',
  ) as HTMLDivElement;
  const btn = document.getElementById('dg-btn') as HTMLButtonElement;

  btn.addEventListener('click', () => unlock(domain));

  textarea.addEventListener('input', () => {
    textarea.classList.remove('dg-error');
    btn.disabled = textarea.value !== challenge;
  });

  // Prevent newlines — challenge words are space-separated
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!btn.disabled) unlock(domain);
    }
  });

  requestAnimationFrame(() => {
    // Match textarea height to the challenge box so they look like a pair
    textarea.style.height = `${challengeBox.offsetHeight}px`;
    textarea.focus();
  });
}

async function init(): Promise<void> {
  // Immediately hide page content before async work
  const hideStyle = document.createElement('style');
  hideStyle.id = 'dg-hide';
  hideStyle.textContent = 'body{visibility:hidden!important}';
  document.documentElement.appendChild(hideStyle);

  const currentDomain = extractDomain(window.location.href);
  if (!currentDomain) {
    hideStyle.remove();
    return;
  }

  const [syncResult, { unlocked }] = await Promise.all([
    chrome.storage.sync.get(['domains', 'settings']),
    chrome.runtime.sendMessage({
      type: 'PAGE_LOAD',
      domain: currentDomain,
    }) as Promise<{ unlocked: boolean }>,
  ]);
  const domains: string[] =
    (syncResult['domains'] as string[] | undefined) ?? [];
  const settings: Settings = {
    ...DEFAULT_SETTINGS,
    ...(syncResult['settings'] ?? {}),
  };
  const theme: Theme = settings.theme ?? 'system';

  const isBlocked = domains.some(
    (d) => currentDomain === d || currentDomain.endsWith(`.${d}`),
  );

  if (!isBlocked || unlocked) {
    hideStyle.remove();
    return;
  }

  // Inject overlay styles
  const style = document.createElement('style');
  style.id = 'dg-style';
  style.textContent = OVERLAY_CSS;
  document.documentElement.appendChild(style);

  // Build and inject overlay
  const overlay = document.createElement('div');
  overlay.id = 'dg-overlay';
  if (theme !== 'system') overlay.dataset['theme'] = theme;

  if (settings.unlockMethod === 'timer') {
    overlay.innerHTML = renderTimer(currentDomain, settings.timerDuration);
    document.documentElement.appendChild(overlay);
    startTimer(settings.timerDuration, currentDomain);
  } else {
    const challenge = generateChallenge(settings.typingLength);
    overlay.innerHTML = renderTyping(currentDomain, challenge);
    document.documentElement.appendChild(overlay);
    setupTyping(challenge, currentDomain);
  }
}

init();
