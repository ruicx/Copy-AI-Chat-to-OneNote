/**
 * deepseek.js — DeepSeek (chat.deepseek.com) adapter.
 *
 * Calibrated against a saved live page (see test/fixtures/deepseek-sample.html,
 * extracted 2026-09). Structure:
 *
 *   div.ds-virtual-list …                       ← virtualized conversation
 *     div (wrapper, obfuscated classes)         ← one turn
 *       div.ds-message                          ← the turn content
 *         user:      .fbb737a4 > .ds-collapsible-text (plain text)
 *         assistant: .ds-markdown.ds-assistant-message-main-content
 *       [action bar: a .ds-flex holding [role=button].ds-button icon buttons
 *        — assistant: sibling .ds-flex chain; user: nested under sibling divs.
 *        The FIRST .ds-button in every bar is DeepSeek's own copy button
 *        (16px svg path starting M6.14929 4.02032…).]
 *
 * The user/assistant wrappers carry obfuscated per-build classes, so turns are
 * found via the stable .ds-message class and roles via content markers.
 *
 * Code blocks (.md-code-block) and math (KaTeX annotation) are handled in the
 * converter — see isDeepSeekCodeBlock() / katexAnnotationTex() there.
 */
import { queryAll } from './base.js';

/** DeepSeek's copy glyph: two overlapping rounded squares (16×16). Used to
 *  anchor our injected buttons next to the native copy button; falls back to
 *  the bar's first button if the icon ever changes. */
const COPY_ICON_PATH = /^M6\.14929 4\.02032/;

function turns() {
  return queryAll(['.ds-message']);
}

function roleOf(msg) {
  // The assistant content root carries a dedicated class; user messages render
  // plain text in a collapsible (no .ds-markdown at all). The final check is a
  // tiebreaker for user-input-as-markdown builds.
  if (msg.querySelector('.ds-assistant-message-main-content')) return 'assistant';
  if (msg.querySelector('.ds-collapsible-text')) return 'user';
  return msg.querySelector('.ds-markdown') ? 'assistant' : 'user';
}

function contentOf(msg) {
  return (
    msg.querySelector('.ds-markdown.ds-assistant-message-main-content') ||
    msg.querySelector('.ds-markdown') ||
    msg.querySelector('.ds-collapsible-text') ||
    msg
  );
}

/**
 * Find the turn's native action bar and its copy button. The bar holds the
 * site's own ds-button icon buttons; buttons INSIDE .ds-message (code-block
 * banner 复制/下载 buttons are ds-buttons too) must be excluded — the bar is
 * a sibling of .ds-message, not part of it.
 */
function actionBarOf(msg) {
  const wrap = msg.parentElement;
  if (!wrap) return null;
  const btns = [...wrap.querySelectorAll('[role="button"].ds-button, button.ds-button')]
    .filter(b => !msg.contains(b));
  if (!btns.length) return null;
  // Insert into the .ds-flex that DIRECTLY holds the buttons (the assistant
  // bar nests an inner .ds-flex inside an outer one; inserting into the inner
  // one keeps our buttons on the same row, with the same gap).
  const bar = btns[0].closest('.ds-flex') || btns[0].parentElement;
  const copyBtn =
    btns.find(b => {
      const d = b.querySelector('svg path')?.getAttribute('d') || '';
      return COPY_ICON_PATH.test(d);
    }) || btns[0];
  return { bar, copyBtn };
}

export default {
  host: ['chat.deepseek.com'],
  name: 'DeepSeek',

  getMessageElements() {
    return turns();
  },

  getRole(el) {
    return roleOf(el);
  },

  getMessages() {
    return turns().map(msg => ({ role: roleOf(msg), el: contentOf(msg) }));
  },

  /**
   * DeepSeek renders a native action bar under each turn:
   *   - assistant: [copy] [regenerate] [like] [dislike] [share] [more]
   *   - user:      [copy] [edit]
   * Our buttons go INTO that bar, right after the native copy button (both
   * roles), so they sit beside the site's own 复制 on the same row.
   */
  getNativeToolbars() {
    const out = [];
    for (const msg of turns()) {
      const bar = actionBarOf(msg);
      if (!bar) continue;
      out.push({
        toolbar: bar.bar,
        content: contentOf(msg),
        role: roleOf(msg),
        insertAfter: bar.copyBtn,
      });
    }
    return out;
  },

  /**
   * Build a button that matches DeepSeek's native action-button markup so the
   * injected buttons blend into the bar. DeepSeek wraps each icon button as:
   *   <div role="button" class="ds-button ds-button--iconLabelTertiary
   *        ds-button--icon ds-button--capsule ds-button--xs …" tabindex="0">
   *     <div class="ds-button__background"></div>
   *     <div class="ds-button__icon ds-button__icon--last-child">
   *       <div class="ds-cross-fade"><div class="ds-icon" style="font-size:inherit">
   *         <svg width="16" height="16" …/>
   *       </div></div>
   *     </div>
   *   </div>
   * We clone an existing .ds-button from THIS toolbar (preserving all ds-*
   * classes so hover/focus styling matches) and swap its <svg> for our
   * heroicons clipboard, sized to DeepSeek's 16px icons.
   */
  makeNativeButton(toolbar, title, double) {
    const template =
      toolbar.querySelector('[role="button"].ds-button, button.ds-button');
    if (template) {
      const clone = template.cloneNode(true);
      // Drop copied identity so our title is authoritative.
      clone.removeAttribute('aria-label');
      clone.removeAttribute('id');
      clone.removeAttribute('data-testid');
      // Swap the site's icon for ours. DeepSeek's ds-icon CSS sizes icons via
      // font-size; explicit width/height keeps our svg stable regardless.
      const iconHost = clone.querySelector('.ds-icon') || clone;
      const svgAttrs = 'xmlns="http://www.w3.org/2000/svg" width="16" ' +
        'height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" ' +
        'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" ' +
        'aria-hidden="true"';
      const single = 'M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184';
      const doc = 'M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 0 0-9-9Z';
      iconHost.innerHTML = `<svg ${svgAttrs}><path d="${double ? doc : single}"/></svg>`;
      clone.setAttribute('aria-label', title);
      return clone;
    }
    // Fallback: a plain button if the bar had no clonable ds-button.
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ds-button';
    btn.setAttribute('aria-label', title);
    btn.textContent = title;
    return btn;
  },
};
