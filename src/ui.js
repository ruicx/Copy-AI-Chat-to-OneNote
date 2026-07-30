/**
 * ui.js — floating action button, per-message copy buttons, toast.
 *
 * All UI lives inside a Shadow DOM so AI-platform styles never leak in or out.
 * Buttons call into the pipeline + clipboard; copy is always triggered from a
 * user click (required for clipboard write).
 */
import { renderMessage, renderConversation, renderTurn, findTurnIndex } from './pipeline.js';
import { copyForOneNote } from './clipboard.js';
import { t } from './i18n.js';
import { CODE_FONT_KEY } from './renderer.js';

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

  /* Settings (gear) button — a child of the FAB, positioned just outside the
     FAB's left edge. Because it is absolutely positioned within the (fixed)
     FAB, it automatically follows the FAB when the FAB is dragged — no extra
     position-sync logic needed. It only appears on FAB hover so it never
     crowds the page at rest. */
  .fab.settings {
    position: absolute; top: 7px; right: 100%; margin-right: 6px;
    width: 38px; height: 38px; border-radius: 50%;
    background: #2563eb; color: #fff; border: none; cursor: pointer;
    font-size: 18px; display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 14px rgba(0,0,0,.28); user-select: none;
    opacity: 0; pointer-events: none;
    transform: translateX(6px) scale(.9);
    transition: opacity .12s ease, transform .12s ease, background .12s ease;
  }
  .fab.settings:hover { background: #1d4ed8; }
  .fab:hover .fab.settings,
  .fab.settings:hover {
    opacity: 1; pointer-events: auto;
    transform: translateX(0) scale(1);
  }
  .fab.dragging .fab.settings { opacity: 0 !important; pointer-events: none; }

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
    toast(shadow, t('toastConversation', { n: messages.length }));
  } catch (err) {
    console.error('[ai-copy] copy failed', err);
    toast(shadow, t('toastFail', { err: (err && err.message || err) }), 3000);
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
 * Read the current custom code font from localStorage (may be absent).
 * Reads defensively — localStorage can throw when sandboxed.
 */
function readCodeFont() {
  try { return (localStorage.getItem(CODE_FONT_KEY) || '').trim(); } catch (_) { return ''; }
}

/**
 * Open the code-font prompt. Called from the gear button inside the FAB.
 * - Cancel (null)  → no-op.
 * - Empty string   → clear the setting, toast "reset to default".
 * - Anything else  → store it, toast "saved".
 */
function promptCodeFont(shadow) {
  const current = readCodeFont();
  let value;
  try {
    value = prompt(t('settingsCodeFontPrompt'), current);
  } catch (_) {
    toast(shadow, t('toastFail', { err: 'prompt blocked' }), 2200);
    return;
  }
  // prompt() returns null when the user clicks Cancel — treat as no change.
  if (value === null) return;
  const trimmed = value.trim();
  try {
    if (trimmed) {
      localStorage.setItem(CODE_FONT_KEY, trimmed);
      toast(shadow, t('settingsCodeFontSaved', { font: trimmed }));
    } else {
      localStorage.removeItem(CODE_FONT_KEY);
      toast(shadow, t('settingsCodeFontReset'));
    }
  } catch (err) {
    toast(shadow, t('toastFail', { err: (err && err.message || err) }), 3000);
  }
}

/**
 * Mount the floating action button. Clicking copies the whole conversation;
 * dragging moves it (position is remembered across page loads). A gear button
 * nested inside the FAB opens the code-font setting (revealed on hover).
 * @param {object} adapter  platform adapter with getMessages()
 */
export function mountFloatingButton(adapter) {
  const shadow = createShadowRoot();
  const fab = document.createElement('button');
  fab.className = 'fab';
  fab.title = t('fabTitle');
  fab.textContent = '📋';
  fab.addEventListener('click', async () => {
    const messages = adapter.getMessages();
    if (!messages.length) {
      toast(shadow, t('toastNoMessages'), 2200);
      return;
    }
    fab.disabled = true;
    try {
      await doCopy(shadow, adapter, messages);
    } finally {
      fab.disabled = false;
    }
  });

  // Gear button — child of the FAB so it follows on drag; opens code-font prompt.
  const gear = document.createElement('button');
  gear.className = 'fab settings';
  gear.type = 'button';
  gear.title = t('settingsTitle');
  gear.setAttribute('aria-label', t('settingsTitle'));
  gear.textContent = '⚙';
  gear.addEventListener('click', (e) => {
    // Don't let the click bubble up to the FAB (which would trigger a copy).
    e.preventDefault();
    e.stopPropagation();
    promptCodeFont(shadow);
  });
  fab.appendChild(gear);

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
      toast(hostShadow, t('toastFail', { err: (err && err.message || err) }), 3000);
    }
  }

  /** Copy the whole turn starting at the message whose content corresponds
   *  to el. Use findTurnIndex (DOM-containment fallback) instead of strict ===
   *  because the per-message UI element and getMessages().el are found via
   *  different DOM paths and aren't always the identical node. */
  async function copyTurn(contentEl, label) {
    try {
      const messages = adapter.getMessages();
      const start = findTurnIndex(messages, contentEl);
      if (start < 0) throw new Error(t('errNotFound'));
      const { html, text } = renderTurn(messages, start);
      await copyForOneNote(html, text);
      toast(hostShadow, label);
    } catch (err) {
      toast(hostShadow, t('toastFail', { err: (err && err.message || err) }), 3000);
    }
  }

  if (typeof adapter.getNativeToolbars === 'function') {
    mountNativeToolbarButtons(adapter, hostShadow, copyOne, copyTurn);
  } else {
    mountOverlayButtons(adapter, hostShadow, copyOne, copyTurn);
  }
}

/**
 * Path A: inject into the site's native action toolbar. We CLONE an existing
 * native button from the toolbar (rather than hard-coding site-specific
 * classes) so the injected buttons pick up the site's exact look on every
 * platform — ChatGPT, Gemini, etc. — without per-site CSS knowledge.
 *
 * `adapter.makeNativeButton?(title, double)` lets a platform override the
 * button factory entirely (e.g. Gemini, whose buttons live inside Angular
 * <gem-icon-button> wrappers that a plain clone won't reproduce). If absent,
 * we fall back to cloning the first <button> already in the toolbar.
 */
function mountNativeToolbarButtons(adapter, hostShadow, copyOne, copyTurn) {
  // --- Shared body-level tooltip -----------------------------------------
  // Action toolbars may carry opacity:0 until the whole message is hovered
  // (ChatGPT does this), and CSS opacity is multiplicative down the tree — so
  // a tooltip placed *inside* a button becomes invisible too. We keep a single
  // tooltip at document.body level and position it near the hovered button.
  // The default look matches ChatGPT's dark, semibold tooltip. A platform can
  // override via adapter.tooltipStyle (e.g. Gemini's Material tooltip is
  // regular-weight and appears above the button).
  const tipStyle = adapter.tooltipStyle || {};
  const tipFontWeight = tipStyle.fontWeight || '600';
  const tipFont = tipStyle.fontFamily ||
    '-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,Arial,sans-serif';
  const tipAbove = tipStyle.position === 'above';

  function ensureSharedTip() {
    let tip = document.getElementById('aicopy-shared-tip');
    if (tip) return tip;
    tip = document.createElement('div');
    tip.id = 'aicopy-shared-tip';
    tip.style.cssText =
      'position:fixed;background:#0d0d0d;color:#ffffff;font-size:12px;' +
      `line-height:16px;font-weight:${tipFontWeight};padding:5px 9px;border-radius:6px;` +
      'white-space:nowrap;opacity:0;pointer-events:none;z-index:2147483647;' +
      `transition:opacity .1s ease;font-family:${tipFont};` +
      'box-shadow:0 2px 8px rgba(0,0,0,.18)';
    document.body.appendChild(tip);
    return tip;
  }
  function showTip(tip, anchor, text) {
    tip.textContent = text;
    const r = anchor.getBoundingClientRect();
    // Place above (Gemini) or below (ChatGPT) the button; clamp to viewport.
    tip.style.left = Math.max(4, Math.min(r.left + r.width / 2, window.innerWidth - 4)) + 'px';
    tip.style.top = tipAbove
      ? (r.top - 8) + 'px'
      : (r.bottom + 8) + 'px';
    tip.style.transform = tipAbove
      ? 'translateX(-50%) translateY(-100%)'
      : 'translateX(-50%)';
    tip.style.opacity = '1';
  }
  function hideTip(tip) { tip.style.opacity = '0'; }

  // Heroicons (outline, 24x24). Single-message: clipboard with clip.
  // Whole-turn: clipboard + document, visually distinct so the two buttons
  // are easy to tell apart. Colour via stroke="currentColor" so the icon
  // matches whatever the surrounding native button uses.
  const svgAttrs = 'xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" ' +
    'viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  const CLIPBOARD_SVG = `<svg ${svgAttrs}><path d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"/></svg>`;
  const CLIPBOARD_DOC_SVG = `<svg ${svgAttrs}><path d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 0 0-9-9Z"/></svg>`;

  const sharedTip = ensureSharedTip();

  /** Clone a native button from the toolbar to inherit the site's styling,
   *  then swap in our icon + wire tooltip + click. This is what makes the
   *  injected button visually indistinguishable from the site's own. */
  function makeNativeButton(toolbar, title, double) {
    let btn;
    if (typeof adapter.makeNativeButton === 'function') {
      // Platform-specific factory (e.g. Gemini wraps buttons in custom elements).
      btn = adapter.makeNativeButton(toolbar, title, double);
    } else {
      // Generic fallback: clone the first real <button> in this toolbar.
      const template = toolbar.querySelector('button');
      btn = template ? template.cloneNode(false) : document.createElement('button');
      btn.type = 'button';
      btn.removeAttribute('aria-label');
      btn.removeAttribute('data-test-id');
      btn.removeAttribute('id');
      btn.textContent = '';
      const iconWrap = document.createElement('span');
      iconWrap.style.display = 'flex';
      iconWrap.style.alignItems = 'center';
      iconWrap.style.justifyContent = 'center';
      iconWrap.innerHTML = double ? CLIPBOARD_DOC_SVG : CLIPBOARD_SVG;
      btn.appendChild(iconWrap);
    }
    btn.setAttribute('aria-label', title);
    btn.addEventListener('mouseenter', () => showTip(sharedTip, btn, title));
    btn.addEventListener('mouseleave', () => hideTip(sharedTip));
    btn.addEventListener('focus', () => showTip(sharedTip, btn, title));
    btn.addEventListener('blur', () => hideTip(sharedTip));
    return btn;
  }

  const attach = ({ toolbar, content, role, insertAfter }) => {
    if (toolbar.dataset.aiCopyBound) return;
    toolbar.dataset.aiCopyBound = '1';

    // Place a button in the toolbar. If the adapter gave an `insertAfter`
    // anchor (Gemini), drop the button right after it so it sits beside the
    // site's own copy button (left side) rather than being appended to the
    // end (right side, past the menu). Otherwise append to the end (ChatGPT).
    // The anchor may be nested inside a wrapper element (Gemini's copy button
    // lives in a <copy-button> custom element); insertAdjacentElement handles
    // that correctly — it inserts at the anchor's sibling position, which is
    // where we want it regardless of wrapper depth.
    const place = (btn) => {
      if (insertAfter && toolbar.contains(insertAfter)) {
        insertAfter.insertAdjacentElement('afterend', btn);
      } else {
        toolbar.appendChild(btn);
      }
    };

    const singleBtn = makeNativeButton(toolbar, t('btnCopyOne'), false);
    singleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      copyOne(role, content, t('toastOne'));
    });
    place(singleBtn);

    if (role === 'user') {
      const turnBtn = makeNativeButton(toolbar, t('btnCopyTurn'), true);
      turnBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        copyTurn(content, t('toastTurn'));
      });
      place(turnBtn);
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

    const singleBtn = makeOverlayButton(t('overlayOne'));
    singleBtn.style.right = '4px';
    singleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      copyOne(role, el, t('toastOne'));
    });

    const buttons = [singleBtn];
    if (role === 'user') {
      const turnBtn = makeOverlayButton(t('overlayTurn'));
      turnBtn.style.right = '70px';
      turnBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        copyTurn(el, t('toastTurn'));
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
