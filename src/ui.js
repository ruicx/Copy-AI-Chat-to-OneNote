/**
 * ui.js — floating action button, per-message copy buttons, toast.
 *
 * All UI lives inside a Shadow DOM so AI-platform styles never leak in or out.
 * Buttons call into the pipeline + clipboard; copy is always triggered from a
 * user click (required for clipboard write).
 */
import { renderMessage, renderConversation, renderTurn } from './pipeline.js';
import { copyForOneNote } from './clipboard.js';

const STYLES = `
  :host { all: initial; }
  .fab {
    position: fixed; right: 24px; bottom: 24px; z-index: 2147483647;
    width: 52px; height: 52px; border-radius: 50%;
    background: #2563eb; color: #fff; border: none; cursor: pointer;
    font-size: 22px; box-shadow: 0 4px 14px rgba(0,0,0,.28);
    display: flex; align-items: center; justify-content: center;
    transition: transform .12s ease, background .12s ease;
    user-select: none; touch-action: none;
  }
  .fab:hover { background: #1d4ed8; transform: scale(1.06); }
  .fab:active { transform: scale(.96); }
  .fab[disabled] { opacity: .55; cursor: not-allowed; }
  .fab.dragging { transition: none; cursor: grabbing; opacity: .9; }

  .copy-btn {
    background: transparent; border: 1px solid #d1d5db; border-radius: 6px;
    padding: 2px 8px; font-size: 12px; color: #374151; cursor: pointer;
    opacity: 0; transition: opacity .12s ease;
  }
  .copy-btn:hover { background: #f3f4f6; }

  .toast {
    position: fixed; left: 50%; bottom: 40px; transform: translateX(-50%);
    z-index: 2147483647; background: #111827; color: #fff;
    padding: 10px 18px; border-radius: 8px; font-size: 14px;
    box-shadow: 0 6px 20px rgba(0,0,0,.3); opacity: 0;
    transition: opacity .2s ease, transform .2s ease; pointer-events: none;
  }
  .toast.show { opacity: 1; transform: translateX(-50%) translateY(-4px); }
`;

function createShadowRoot() {
  const host = document.createElement('div');
  host.id = 'ai-copy-host';
  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = STYLES;
  shadow.appendChild(style);
  document.documentElement.appendChild(host);
  return shadow;
}

function toast(shadow, message, ms = 1800) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  shadow.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 250);
  }, ms);
}

async function doCopy(shadow, adapter, messages) {
  try {
    const { html, text } = renderConversation(messages);
    await copyForOneNote(html, text);
    toast(shadow, `✓ 已复制 ${messages.length} 条消息，可粘贴到 OneNote`);
  } catch (err) {
    console.error('[ai-copy] copy failed', err);
    toast(shadow, '✗ 复制失败：' + (err && err.message || err), 3000);
  }
}

const FAB_POSITION_KEY = 'ai-copy-fab-position';
const DRAG_THRESHOLD = 5; // px moved before a press counts as a drag, not a click

/** Restore saved FAB position (clamped to viewport) from localStorage. */
function applySavedPosition(fab) {
  try {
    const saved = JSON.parse(localStorage.getItem(FAB_POSITION_KEY) || '');
    if (!saved || typeof saved.x !== 'number' || typeof saved.y !== 'number') return;
    const x = Math.min(Math.max(saved.x, 0), window.innerWidth - fab.offsetWidth);
    const y = Math.min(Math.max(saved.y, 0), window.innerHeight - fab.offsetHeight);
    fab.style.left = x + 'px';
    fab.style.top = y + 'px';
    fab.style.right = 'auto';
    fab.style.bottom = 'auto';
  } catch (_) { /* no saved position */ }
}

/** Wire up drag-to-move; a press that barely moves still fires as a click. */
function makeDraggable(fab) {
  let startX = 0, startY = 0, originX = 0, originY = 0;
  let dragging = false, moved = false;

  const onDown = (e) => {
    const pt = e.touches ? e.touches[0] : e;
    startX = pt.clientX;
    startY = pt.clientY;
    const rect = fab.getBoundingClientRect();
    originX = rect.left;
    originY = rect.top;
    dragging = true;
    moved = false;
    if (e.cancelable) e.preventDefault();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
  };
  const onMove = (e) => {
    if (!dragging) return;
    const pt = e.touches ? e.touches[0] : e;
    const dx = pt.clientX - startX;
    const dy = pt.clientY - startY;
    if (!moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    if (!moved) {
      moved = true;
      fab.classList.add('dragging');
    }
    const x = Math.min(Math.max(originX + dx, 0), window.innerWidth - fab.offsetWidth);
    const y = Math.min(Math.max(originY + dy, 0), window.innerHeight - fab.offsetHeight);
    fab.style.left = x + 'px';
    fab.style.top = y + 'px';
    fab.style.right = 'auto';
    fab.style.bottom = 'auto';
    if (e.cancelable) e.preventDefault();
  };
  const onUp = () => {
    dragging = false;
    fab.classList.remove('dragging');
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
    window.removeEventListener('touchmove', onMove);
    window.removeEventListener('touchend', onUp);
    if (moved) {
      const rect = fab.getBoundingClientRect();
      try {
        localStorage.setItem(FAB_POSITION_KEY, JSON.stringify({ x: rect.left, y: rect.top }));
      } catch (_) { /* storage may be blocked */ }
    }
  };

  fab.addEventListener('mousedown', onDown);
  fab.addEventListener('touchstart', onDown, { passive: false });

  // Suppress the click that follows a drag so we don't trigger a copy.
  fab.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); } },
    true);
}

/**
 * Mount the floating action button. Clicking copies the whole conversation;
 * dragging moves it (position is remembered across page loads).
 * @param {object} adapter  platform adapter with getMessages()
 */
export function mountFloatingButton(adapter) {
  const shadow = createShadowRoot();
  const fab = document.createElement('button');
  fab.className = 'fab';
  fab.title = '复制整段对话到 OneNote（拖动可移动位置）';
  fab.textContent = '📋';
  fab.addEventListener('click', async () => {
    const messages = adapter.getMessages();
    if (!messages.length) {
      toast(shadow, '未检测到对话消息', 2200);
      return;
    }
    fab.disabled = true;
    try {
      await doCopy(shadow, adapter, messages);
    } finally {
      fab.disabled = false;
    }
  });
  shadow.appendChild(fab);
  applySavedPosition(fab);
  makeDraggable(fab);
}

/**
 * Inject copy buttons. Two paths:
 *  - If the adapter exposes getNativeToolbars() (e.g. ChatGPT), inject buttons
 *    INTO the site's own action toolbar, cloning a native button so they match
 *    the site's look exactly.
 *  - Otherwise, fall back to overlay buttons positioned on each message.
 * @param {object} adapter  platform adapter
 */
export function mountPerMessageButtons(adapter) {
  const shadow = document.shadowRoots ? null : createShadowRoot();
  const hostShadow = shadow || document.getElementById('ai-copy-host').shadowRoot;

  /** Copy a single message element. */
  async function copyOne(role, el, label) {
    try {
      const { html, text } = renderMessage({ role, el });
      await copyForOneNote(html, text);
      toast(hostShadow, label);
    } catch (err) {
      toast(hostShadow, '✗ 复制失败：' + (err && err.message || err), 3000);
    }
  }

  /** Copy the whole turn starting at the message whose content === el. */
  async function copyTurn(contentEl, label) {
    try {
      const messages = adapter.getMessages();
      const start = messages.findIndex(m => m.el === contentEl);
      if (start < 0) throw new Error('未找到该消息');
      const { html, text } = renderTurn(messages, start);
      await copyForOneNote(html, text);
      toast(hostShadow, label);
    } catch (err) {
      toast(hostShadow, '✗ 复制失败：' + (err && err.message || err), 3000);
    }
  }

  if (typeof adapter.getNativeToolbars === 'function') {
    mountNativeToolbarButtons(adapter, hostShadow, copyOne, copyTurn);
  } else {
    mountOverlayButtons(adapter, hostShadow, copyOne, copyTurn);
  }
}

/**
 * Path A: inject into the site's native action toolbar, cloning a native
 * button's class so the new buttons are visually indistinguishable.
 */
function mountNativeToolbarButtons(adapter, hostShadow, copyOne, copyTurn) {
  const NATIVE_BTN_CLASS = 'text-token-text-secondary hover:bg-token-surface-hover rounded-lg';
  const SPAN_CLASS = 'flex items-center justify-center touch:w-10 h-8 w-8';

  // --- Shared body-level tooltip -----------------------------------------
  // ChatGPT's action toolbars carry opacity:0 until the whole message is
  // hovered, and CSS opacity is multiplicative down the tree — so a tooltip
  // placed *inside* a button becomes invisible too. We keep a single tooltip
  // at document.body level and position it under the hovered button instead.
  function ensureSharedTip() {
    let tip = document.getElementById('aicopy-shared-tip');
    if (tip) return tip;
    tip = document.createElement('div');
    tip.id = 'aicopy-shared-tip';
    tip.style.cssText =
      'position:fixed;background:#0d0d0d;color:#ffffff;font-size:12px;' +
      'line-height:16px;font-weight:600;padding:5px 9px;border-radius:6px;' +
      'white-space:nowrap;opacity:0;pointer-events:none;z-index:2147483647;' +
      'transition:opacity .1s ease;font-family:-apple-system-body,ui-sans-serif,' +
      '-apple-system,system-ui,"Segoe UI",Helvetica,Arial,sans-serif;' +
      'box-shadow:0 2px 8px rgba(0,0,0,.18)';
    document.body.appendChild(tip);
    return tip;
  }
  function showTip(tip, anchor, text) {
    tip.textContent = text;
    const r = anchor.getBoundingClientRect();
    // Place below the button, horizontally centered; clamp to viewport.
    tip.style.left = Math.max(4, Math.min(r.left + r.width / 2, window.innerWidth - 4)) + 'px';
    tip.style.top = (r.bottom + 8) + 'px';
    tip.style.transform = 'translateX(-50%)';
    tip.style.opacity = '1';
  }
  function hideTip(tip) { tip.style.opacity = '0'; }

  // Heroicons (outline, 24x24) — normalised to render at 20x20 to match
  // ChatGPT's icon button sizing. Both inherit colour via stroke="currentColor".
  // Single-message: clipboard with clip. Whole-turn: clipboard + document,
  // visually distinct so the two buttons are easy to tell apart.
  const svgAttrs = 'xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" ' +
    'viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  const CLIPBOARD_SVG = `<svg ${svgAttrs}><path d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"/></svg>`;
  const CLIPBOARD_DOC_SVG = `<svg ${svgAttrs}><path d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 0 0-9-9Z"/></svg>`;

  /** Build a button matching ChatGPT's native action-button markup.
   *  `double=true` → clipboard+document icon (whole turn);
   *  `double=false` → plain clipboard icon (single message).
   *  Tooltip is a body-level floater (created once, reused) so it is NOT a
   *  child of the toolbar — ChatGPT's toolbar carries opacity:0 which would
   *  make any child tooltip invisible. We position it under the button on hover. */
  const sharedTip = ensureSharedTip();

  function makeNativeButton(title, double) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = NATIVE_BTN_CLASS;
    btn.setAttribute('aria-label', title);
    btn.setAttribute('data-state', 'closed');
    const span = document.createElement('span');
    span.className = SPAN_CLASS;
    span.innerHTML = double ? CLIPBOARD_DOC_SVG : CLIPBOARD_SVG;
    btn.appendChild(span);

    btn.addEventListener('mouseenter', () => showTip(sharedTip, btn, title));
    btn.addEventListener('mouseleave', () => hideTip(sharedTip));
    btn.addEventListener('focus', () => showTip(sharedTip, btn, title));
    btn.addEventListener('blur', () => hideTip(sharedTip));
    return btn;
  }

  const attach = ({ toolbar, content, role }) => {
    if (toolbar.dataset.aiCopyBound) return;
    toolbar.dataset.aiCopyBound = '1';

    const singleBtn = makeNativeButton('复制本条到 OneNote', false);
    singleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      copyOne(role, content, '✓ 已复制该消息');
    });
    toolbar.appendChild(singleBtn);

    if (role === 'user') {
      const turnBtn = makeNativeButton('复制本轮到 OneNote', true);
      turnBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        copyTurn(content, '✓ 已复制本轮对话');
      });
      toolbar.appendChild(turnBtn);
    }
  };

  const scan = () => adapter.getNativeToolbars().forEach(attach);
  scan();
  const obs = new MutationObserver(() => scan());
  obs.observe(document.body, { childList: true, subtree: true });
}

/**
 * Path B (fallback): overlay hover buttons on each message element.
 */
function mountOverlayButtons(adapter, hostShadow, copyOne, copyTurn) {
  const attachTo = (el, indexInList) => {
    if (el.dataset.aiCopyBound) return;
    el.dataset.aiCopyBound = '1';
    el.style.position = getComputedStyle(el).position === 'static' ? 'relative' : '';
    const role = adapter.getRole ? adapter.getRole(el) : 'assistant';

    const singleBtn = makeOverlayButton('📋 本条');
    singleBtn.style.right = '4px';
    singleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      copyOne(role, el, '✓ 已复制该消息');
    });

    const buttons = [singleBtn];
    if (role === 'user') {
      const turnBtn = makeOverlayButton('📋 本轮');
      turnBtn.style.right = '70px';
      turnBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        copyTurn(el, '✓ 已复制本轮对话');
      });
      buttons.push(turnBtn);
    }

    for (const b of buttons) {
      b.style.opacity = '0';
      el.appendChild(b);
    }
    el.addEventListener('mouseenter', () => buttons.forEach(b => (b.style.opacity = '1')));
    el.addEventListener('mouseleave', () => buttons.forEach(b => (b.style.opacity = '0')));
  };

  const scan = () => (adapter.getMessageElements?.() || []).forEach(attachTo);
  scan();
  const obs = new MutationObserver(() => scan());
  obs.observe(document.body, { childList: true, subtree: true });
}

/** Build an overlay copy button (fallback path). */
function makeOverlayButton(label) {
  const btn = document.createElement('button');
  btn.className = 'copy-btn';
  btn.textContent = label;
  btn.style.position = 'absolute';
  btn.style.top = '4px';
  btn.style.zIndex = '10';
  return btn;
}
