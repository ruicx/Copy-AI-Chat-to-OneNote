/**
 * logo.js — optional site-logo swap (the "logo setting").
 *
 * A cosmetic setting in the same spirit as the code-font setting: when set,
 * the host page's top-left brand mark on Gemini / ChatGPT is replaced with
 * the Kimi or DeepSeek logo (and ChatGPT's wordmark text follows). When
 * unset — the default — the page is left completely untouched (zero DOM
 * writes), so nothing changes for anyone who never opens the setting.
 *
 * Brand marks are single-path 24x24 vectors from simple-icons, embedded as
 * string constants so the userscript stays self-contained (no network).
 *
 * Per-platform notes (calibrated against saved pages; see
 * test/fixtures/gemini-logo.html and chatgpt-logo.html):
 * - Gemini: the top-left mark is <img class="sparkle-image">, sized by the
 *   site's own CSS (22x22), with the "Gemini" wordmark as a sibling span
 *   (.gemini-sidenav-text). The img's src is swapped to a data:image/svg+xml
 *   URI (the site keeps controlling the size; an <img> can't inherit page
 *   colors, so the embedded SVG carries its own prefers-color-scheme media
 *   query for dark sidebars). The wordmark gets the hide + clone treatment.
 * - ChatGPT: the blossom lives in <svg><symbol id="blossom">…</symbol><use
 *   href="#blossom"/></svg> next to a .header-wordmark ("ChatGPT") — both
 *   owned by React. We NEVER mutate or remove React's nodes (a changed child
 *   list can make its reconciler throw); instead the original is hidden via
 *   style.display and our own clone (same classes, brand content) is
 *   inserted beside it — the same append-into-the-page pattern the copy
 *   buttons already use. Kimi uses fill="currentColor" so it recolors
 *   exactly like the blossom did. BOTH kinds of slot are swapped for EVERY
 *   instance in the document: ChatGPT keeps its expanded sidebar, its
 *   collapsed rail, and mobile variants mounted side by side, and React
 *   re-creates whichever subtree on expand/collapse.
 *
 * SPA re-renders: Gemini/ChatGPT rebuild or re-class their DOM while
 * navigating (React even deletes our inserted clones on re-render), so a
 * debounced MutationObserver (childList + class/style attributes) re-syncs
 * the swap — including re-inserting clones the site wiped. Because a
 * debounced observer can react late (or never, under constant page churn),
 * a settle-based setInterval re-apply acts as a safety net: it writes
 * NOTHING once the swap is in place, so it is free and cannot loop.
 * Originals are remembered so clearing the setting restores the page
 * without a reload.
 */
import { t } from './i18n.js';

export const LOGO_KEY = 'ai-copy-logo';
const SWAP_ATTR = 'data-ai-copy-logo';     // on our inserted clone / Gemini img
const ORIG_ATTR = 'data-ai-copy-orig';     // on the hidden ChatGPT original

// simple-icons path data, viewBox="0 0 24 24".
const KIMI_PATH = 'M21.765.351C22.998.351 24 1.353 24 2.586S22.998 4.82 21.765 4.82h-1.974c-.15 0-.26-.12-.26-.26V2.586A2.237 2.237 0 0 1 21.765.35M9.41 13.388l8.447-8.377c.16-.16.07-.471-.14-.471h-4.55s-.1.02-.14.06l-9.099 9.029c-.14.14-.35.02-.35-.21V4.81c0-.15-.1-.27-.221-.27H.22c-.12 0-.22.12-.22.27v18.57c0 .15.1.27.22.27h3.137c.12 0 .22-.12.22-.27v-3.79c0-.08.03-.16.08-.21l2.826-2.796c.07-.07.16-.08.241-.03l7.546 5.551a8.9 8.9 0 0 0 4.018 1.493c.12.01.23-.11.23-.27V19.76c0-.14-.08-.25-.19-.26a5.8 5.8 0 0 1-2.355-.942l-6.533-4.73c-.14-.09-.15-.32-.03-.441';
const DEEPSEEK_PATH = 'M23.748 4.651c-.254-.124-.364.113-.512.233-.051.04-.094.09-.137.137-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.155-.708-.311-.955-.65-.172-.24-.219-.509-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.094.172.187.129.323-.082.28-.18.553-.266.833-.055.179-.137.218-.328.14a5.5 5.5 0 0 1-1.737-1.179c-.857-.828-1.631-1.743-2.597-2.46a12 12 0 0 0-.689-.47c-.985-.957.13-1.743.387-1.836.27-.098.094-.433-.778-.428-.872.003-1.67.295-2.687.685a3 3 0 0 1-.465.136 9.6 9.6 0 0 0-2.883-.101c-1.885.21-3.39 1.1-4.497 2.622C.082 8.776-.231 10.854.152 13.02c.403 2.284 1.568 4.175 3.36 5.653 1.857 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.132-.284 4.994-1.86.47.234.962.328 1.78.398.629.058 1.235-.031 1.705-.129.735-.155.684-.836.418-.961-2.155-1.004-1.682-.595-2.112-.926 1.095-1.295 2.768-3.598 3.284-6.733.05-.346.115-.834.108-1.114-.004-.171.035-.238.23-.257a4.2 4.2 0 0 0 1.545-.475c1.397-.763 1.96-2.016 2.093-3.517.02-.23-.004-.467-.247-.588M11.58 18.168c-2.088-1.642-3.101-2.183-3.52-2.16-.39.024-.32.472-.234.763.09.288.207.487.371.74.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.168-1.361-.801-2.5-1.86-3.301-3.306-.775-1.393-1.225-2.888-1.299-4.482-.02-.385.094-.522.477-.592a4.7 4.7 0 0 1 1.53-.038c2.131.311 3.946 1.264 5.467 2.774.868.86 1.525 1.887 2.202 2.89.72 1.066 1.494 2.082 2.48 2.915.348.291.626.513.892.677-.802.09-2.14.109-3.055-.615zm1.001-6.44a.306.306 0 0 1 .415-.287.3.3 0 0 1 .113.074.3.3 0 0 1 .086.214c0 .17-.136.307-.308.307a.303.303 0 0 1-.306-.307m3.11 1.596c-.2.081-.4.151-.591.16a1.25 1.25 0 0 1-.798-.254c-.274-.23-.47-.358-.551-.758a1.7 1.7 0 0 1 .015-.588c.07-.327-.007-.537-.238-.727-.188-.156-.426-.199-.689-.199a.6.6 0 0 1-.254-.078.253.253 0 0 1-.114-.358 1 1 0 0 1 .192-.21c.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.392.451.462.576.685.915.176.264.336.536.446.848.066.194-.02.353-.25.45';

const DEEPSEEK_BLUE = '#5786FE';
const KIMI_DARK = '#111111';   // near-black on light sidebars
const KIMI_LIGHT = '#f3f4f6';  // off-white on dark sidebars

/** Serialize a path to a data:image/svg+xml URI for use as an <img> src.
 *  `darkFill`, when given, flips the fill under prefers-color-scheme: dark —
 *  inside an SVG-as-image currentColor can't reach us, so the media query is
 *  the only way to adapt to the page's theme. */
function svgDataUri(path, fill, darkFill) {
  const style = darkFill
    ? `<style>@media (prefers-color-scheme:dark){path{fill:${darkFill}}}</style>`
    : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${style}` +
    `<path fill="${fill}" d="${path}"/></svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

export const BRANDS = {
  kimi: {
    name: 'Kimi',
    path: KIMI_PATH,
    inlineFill: 'currentColor',
    imgUri: svgDataUri(KIMI_PATH, KIMI_DARK, KIMI_LIGHT),
  },
  deepseek: {
    name: 'DeepSeek',
    path: DEEPSEEK_PATH,
    inlineFill: DEEPSEEK_BLUE,
    imgUri: svgDataUri(DEEPSEEK_PATH, DEEPSEEK_BLUE),
  },
};

// Pre-swap snapshots so clearLogoSetting() can put the page back as it was.
const originals = new WeakMap();
function rememberOriginal(el, snapshot) {
  if (!originals.has(el)) originals.set(el, snapshot);
}

function swapGemini(doc, choice, brand) {
  // The sparkle <img>: swap its src in place — the site's CSS keeps it
  // sized (22x22), and the data URI carries its own dark-mode fill flip.
  const img = doc.querySelector('img.sparkle-image');
  if (img && img.getAttribute(SWAP_ATTR) !== choice) {
    rememberOriginal(img, { src: img.getAttribute('src') || '' });
    img.setAttribute('src', brand.imgUri);
    img.setAttribute(SWAP_ATTR, choice);
  }
  // The "Gemini" wordmark next to it (a sibling span inside the sparkle
  // button's <a>) — same hide + clone dance as ChatGPT: Angular owns the
  // span, we never mutate its content.
  const wmClone = doc.querySelector(`.gemini-sidenav-text[${SWAP_ATTR}]`);
  const wordmark = findOriginal(
    doc, '.side-nav-sparkle-button .gemini-sidenav-text', (el) => el);
  if (wordmark) ensureClone(doc, wordmark, wmClone, choice, brand);
  else if (wmClone) wmClone.remove();
}

/** (Re)write a clone's content for the chosen brand: an SVG clone gets a
 *  <path> with the brand mark, an HTML clone gets the brand name as text. */
function rewriteClone(clone, choice, brand) {
  if (clone.localName === 'svg') {
    while (clone.firstChild) clone.firstChild.remove();
    const path = clone.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', brand.path);
    path.setAttribute('fill', brand.inlineFill);
    clone.appendChild(path);
  } else {
    clone.textContent = brand.name;
  }
  clone.setAttribute(SWAP_ATTR, choice);
}

/** Build our own standalone clone of a site node. Cloning keeps the site's
 *  classes (sizing/theme); the hidden-original marker is dropped and the
 *  clone is made visible (cloneNode would otherwise copy the original's
 *  style="display:none", hiding our clone too) so restoreLogos can tell our
 *  clones apart from the site's nodes. */
function brandClone(orig, choice, brand) {
  const clone = orig.cloneNode(false);
  clone.removeAttribute(ORIG_ATTR);
  clone.style.display = '';
  rewriteClone(clone, choice, brand);
  return clone;
}

/** Find the site's original node for a brand slot: prefer the one we hid
 *  earlier (ORIG_ATTR), else a fresh, not-yet-hidden one. Our own clones
 *  carry SWAP_ATTR and never match. */
function findOriginal(doc, selector, pick) {
  const els = [...doc.querySelectorAll(selector)]
    .map(pick)
    .filter((el) => el && !el.hasAttribute(SWAP_ATTR));
  return els.find((el) => el.hasAttribute(ORIG_ATTR)) ||
         els.find((el) => el.style.display !== 'none');
}

/** Make sure a hidden original has our clone right after it, carrying the
 *  chosen brand. Handles every state the page can be in:
 *  - fresh visible original             → hide it, insert a clone;
 *  - original hidden, clone gone        → re-insert (React deletes unknown
 *                                         siblings when it re-renders);
 *  - clone adjacent, site re-classed
 *    the original (e.g. sidebar expand) → re-clone with the new classes;
 *  - clone adjacent, brand switched     → rewrite the clone in place;
 *  - everything already correct         → write nothing (settle, so the
 *                                         MutationObserver never loops). */
function ensureClone(doc, orig, existingClone, choice, brand) {
  if (!orig.hasAttribute(ORIG_ATTR)) {
    rememberOriginal(orig, { display: orig.style.display || '' });
    orig.style.display = 'none';
    orig.setAttribute(ORIG_ATTR, '1');
  }
  if (existingClone && orig.nextElementSibling === existingClone) {
    if (existingClone.getAttribute('class') !== orig.getAttribute('class')) {
      // The site toggled classes on the original (e.g. Gemini sidebar
      // expand) — mirror them with a fresh clone.
      existingClone.remove();
      orig.insertAdjacentElement('afterend', brandClone(orig, choice, brand));
    } else if (existingClone.getAttribute(SWAP_ATTR) !== choice) {
      rewriteClone(existingClone, choice, brand);
    }
    return;
  }
  if (existingClone) existingClone.remove(); // orphaned by a site re-render
  orig.insertAdjacentElement('afterend', brandClone(orig, choice, brand));
}

/** Every SVG that renders ChatGPT's blossom mark. Two lookups (the <use> ref
 *  and the <symbol> definition) deduped into one set; if BOTH miss — e.g.
 *  ChatGPT renames the symbol in a future build — fall back to the first svg
 *  inside the open-sidebar button (`aria-controls` points at the sidebar
 *  container id, which is not localized): that button's primary icon IS the
 *  site logo. */
function blossomSvgs(doc) {
  const found = new Set();
  for (const use of doc.querySelectorAll('use[href*="#blossom"]')) {
    const svg = use.closest('svg');
    if (svg) found.add(svg);
  }
  for (const sym of doc.querySelectorAll('symbol#blossom')) {
    const svg = sym.closest('svg');
    if (svg) found.add(svg);
  }
  if (!found.size) {
    for (const btn of doc.querySelectorAll('button[aria-controls="stage-slideover-sidebar"]')) {
      const svg = btn.querySelector('svg');
      if (svg) found.add(svg);
    }
  }
  return [...found];
}

function swapChatGPT(doc, choice, brand) {
  // Blossom mark: swap EVERY instance currently in the document — the
  // collapsed rail's "打开侧边栏" button, the expanded sidebar's copy, the
  // mobile slideover header, however many exist right now. React re-creates
  // these subtrees on sidebar expand/collapse while the old hidden original
  // can survive inside the other (still-mounted) sidebar variant; a
  // single-slot lookup pinned to the first hidden original left a freshly
  // mounted blossom showing the site logo forever (saved-page regression
  // 38bd709d: collapsed rail showed the OpenAI mark after the swap).
  for (const svg of blossomSvgs(doc)) {
    if (svg.hasAttribute(SWAP_ATTR)) continue;
    ensureClone(doc, svg, adjacentClone(svg), choice, brand);
  }
  removeOrphanClones(doc, `svg[${SWAP_ATTR}]`);

  // Wordmark ("ChatGPT"): same all-instances dance; clones share the class,
  // so originals are the ones without SWAP_ATTR.
  for (const wm of [...doc.querySelectorAll('.header-wordmark')]) {
    if (wm.hasAttribute(SWAP_ATTR)) continue;
    ensureClone(doc, wm, adjacentClone(wm), choice, brand);
  }
  removeOrphanClones(doc, `.header-wordmark[${SWAP_ATTR}]`);
}

/** Our clone for `orig`, if it is already the element right after it. */
function adjacentClone(orig) {
  const sib = orig.nextElementSibling;
  return sib && sib.hasAttribute(SWAP_ATTR) ? sib : null;
}

/** Drop clones whose hidden original is gone (React removed the subtree the
 *  original lived in but left our clone behind, e.g. on a re-mount). */
function removeOrphanClones(doc, cloneSelector) {
  for (const clone of [...doc.querySelectorAll(cloneSelector)]) {
    const prev = clone.previousElementSibling;
    if (!prev || !prev.hasAttribute(ORIG_ATTR)) clone.remove();
  }
}

/** Core swap for one document + hostname. Exported for tests; the live path
 *  is applyLogoSwap() below. Hosts mirror the adapters' host lists. */
export function applyLogo(doc, hostname, choice) {
  const brand = BRANDS[choice];
  if (!brand) return;
  const host = (hostname || '').toLowerCase();
  const on = (h) => host === h || host.endsWith('.' + h);
  if (on('gemini.google.com')) swapGemini(doc, choice, brand);
  else if (on('chatgpt.com') || on('chat.openai.com')) swapChatGPT(doc, choice, brand);
}

/** Read the validated logo setting ('' = default). Defensive like the other
 *  localStorage reads — storage can throw when sandboxed. */
export function readLogoSetting() {
  try {
    const v = (localStorage.getItem(LOGO_KEY) || '').trim().toLowerCase();
    return BRANDS[v] ? v : '';
  } catch (_) { return ''; }
}

// --- Live-page plumbing (observer + prompt) --------------------------------

let observer = null;
let debounceTimer = 0;
let resyncTimer = 0;
// Safety-net cadence for the settle-based re-apply (see ensureObserver).
const RESYNC_MS = 1500;

function ensureObserver() {
  if (observer || typeof MutationObserver === 'undefined' || !document.body) return;
  observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(applyLogoSwap, 200);
  });
  // childList + class/style attributes: Gemini toggles its wordmark's
  // `.expanded` class on sidebar expand (Angular), React re-renders churn
  // child lists. Our writes stay outside the filter or settle to no-ops,
  // so the observer never loops on itself.
  observer.observe(document.body, {
    childList: true, subtree: true,
    attributes: true, attributeFilter: ['class', 'style'],
  });
  // Safety net: React can re-create a logo subtree (ChatGPT sidebar
  // collapse/expand re-mounts the collapsed rail) at any moment, and a
  // debounced observer can react late or never if page churn keeps
  // postponing it. applyLogo is settle-based — it writes NOTHING once the
  // swap is in place — so a slow periodic re-apply is free and cannot loop;
  // it just guarantees convergence shortly after any re-render.
  if (typeof setInterval === 'function' && !resyncTimer) {
    resyncTimer = setInterval(applyLogoSwap, RESYNC_MS);
  }
}

function stopObserver() {
  if (observer) { observer.disconnect(); observer = null; }
  if (resyncTimer) { clearInterval(resyncTimer); resyncTimer = 0; }
  clearTimeout(debounceTimer);
}

/** Apply the current setting to the live page (no-op when unset). */
export function applyLogoSwap() {
  const choice = readLogoSetting();
  if (!choice) return;
  ensureObserver();
  applyLogo(document, typeof location !== 'undefined' ? location.hostname : '', choice);
}

/** Undo any swap and restore the original marks (DOM only). Three kinds of
 *  touched nodes: hidden originals (ChatGPT), our inserted clones (ChatGPT),
 *  and the in-place swapped Gemini <img>. */
export function restoreLogos(doc) {
  doc.querySelectorAll(`[${SWAP_ATTR}], [${ORIG_ATTR}]`).forEach((el) => {
    const orig = originals.get(el);
    if (el.hasAttribute(ORIG_ATTR)) {
      // Hidden site original — unhide it.
      el.style.display = (orig && orig.display) || '';
      el.removeAttribute(ORIG_ATTR);
      originals.delete(el);
    } else if (orig && orig.src !== undefined) {
      // Gemini <img> swapped in place — put its original src back.
      el.setAttribute('src', orig.src);
      el.removeAttribute(SWAP_ATTR);
      originals.delete(el);
    } else {
      // Our inserted clone — React never knew about it; safe to drop.
      el.remove();
    }
  });
}

/** Full reset on the live page: stop watching and restore the marks. */
export function clearLogoSetting(doc = document) {
  stopObserver();
  restoreLogos(doc);
}

/**
 * Open the logo-swap prompt. Called from the logo button inside the FAB.
 * `toastFn` is ui.js's toast (passed in to avoid an import cycle).
 * - Cancel (null)  → no-op.
 * - Empty string   → clear the setting, restore the page, toast "reset".
 * - kimi/deepseek  → store it, apply immediately, toast "saved".
 * - Anything else  → toast "invalid", no change.
 */
export function promptLogoChoice(shadow, toastFn) {
  const current = readLogoSetting();
  let value;
  try {
    value = prompt(t('settingsLogoPrompt'), current);
  } catch (_) {
    toastFn(shadow, t('toastFail', { err: 'prompt blocked' }), 2200);
    return;
  }
  // prompt() returns null when the user clicks Cancel — treat as no change.
  if (value === null) return;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    try { localStorage.removeItem(LOGO_KEY); } catch (_) { /* storage blocked */ }
    clearLogoSetting();
    toastFn(shadow, t('settingsLogoReset'));
    return;
  }
  if (!BRANDS[trimmed]) {
    toastFn(shadow, t('settingsLogoInvalid'), 2200);
    return;
  }
  try {
    localStorage.setItem(LOGO_KEY, trimmed);
    applyLogoSwap();
    toastFn(shadow, t('settingsLogoSaved', { name: BRANDS[trimmed].name }));
  } catch (err) {
    toastFn(shadow, t('toastFail', { err: (err && err.message || err) }), 3000);
  }
}
