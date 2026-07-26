/**
 * ui.js — floating action button, per-message copy buttons, toast.
 *
 * All UI lives inside a Shadow DOM so AI-platform styles never leak in or out.
 * Buttons call into the pipeline + clipboard; copy is always triggered from a
 * user click (required for clipboard write).
 */
import { renderMessage, renderConversation } from './pipeline.js';
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
 * Inject a copy button next to each message. Uses a MutationObserver so newly
 * streamed messages get a button automatically.
 * @param {object} adapter  platform adapter with getMessageElements() / getRole()
 */
export function mountPerMessageButtons(adapter) {
  const shadow = document.shadowRoots ? null : createShadowRoot();
  const hostShadow = shadow || document.getElementById('ai-copy-host').shadowRoot;

  const attachTo = (el) => {
    if (el.dataset.aiCopyBound) return;
    el.dataset.aiCopyBound = '1';
    el.style.position = getComputedStyle(el).position === 'static' ? 'relative' : '';
    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.textContent = '📋 复制';
    btn.style.position = 'absolute';
    btn.style.top = '4px';
    btn.style.right = '4px';
    btn.style.zIndex = '10';
    btn.style.opacity = '0';
    el.addEventListener('mouseenter', () => (btn.style.opacity = '1'));
    el.addEventListener('mouseleave', () => (btn.style.opacity = '0'));
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const role = adapter.getRole ? adapter.getRole(el) : 'assistant';
      try {
        const { html, text } = renderMessage({ role, el });
        await copyForOneNote(html, text);
        toast(hostShadow, '✓ 已复制该消息');
      } catch (err) {
        toast(hostShadow, '✗ 复制失败：' + (err && err.message || err), 3000);
      }
    });
    el.appendChild(btn);
  };

  const scan = () => {
    (adapter.getMessageElements?.() || []).forEach(attachTo);
  };
  scan();
  const obs = new MutationObserver(() => scan());
  obs.observe(document.body, { childList: true, subtree: true });
}
