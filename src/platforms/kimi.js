/**
 * kimi.js — Kimi (www.kimi.com, formerly kimi.moonshot.cn) adapter.
 *
 * Calibrated against a saved live page (test/fixtures/kimi-sample.html,
 * extracted 2026-09). Structure:
 *
 *   div.segment.segment-user / div.segment.segment-assistant   ← one turn
 *     user:      .user-content > span.user-content__text (plain text)
 *     assistant: .segment-container
 *       .segment-content
 *         .segment-content-box
 *           .toolcall-rollup
 *             .toolcall-rollup__part > .toolcall-flow …   ← thinking + tool
 *                 calls, holding ANOTHER .markdown — must be excluded
 *             .toolcall-rollup__part > .markdown-container > .markdown ← answer
 *         .segment-assistant-actions > .segment-assistant-actions-content
 *             > .simple-button (svg[name=Copy])            ← native action bar
 *       (user: .segment-user-action-row > .segment-user-actions
 *             > .simple-button ×3 [Edit, Copy, Share_a])
 *
 * Markdown internals (div.paragraph, div.segment-code, div.markdown-table,
 * span.katex-wrapper) are handled in the converter — see the Kimi section in
 * src/converter.js.
 */
import { t } from '../i18n.js';

function turns() {
  // Comma = union in DOCUMENT ORDER (user/assistant alternate as written).
  // Do NOT use base.js queryAll here — that is a fallback list (first
  // selector with matches wins) and would drop the assistant segments.
  return [...document.querySelectorAll('.segment-user, .segment-assistant')];
}

function roleOf(seg) {
  return /(^|\s)segment-user(\s|$)/.test(seg.getAttribute('class') || '')
    ? 'user'
    : 'assistant';
}

function contentOf(seg) {
  if (roleOf(seg) === 'user') {
    return (
      seg.querySelector('.user-content__text') ||
      seg.querySelector('.user-content') ||
      seg
    );
  }
  // The answer is the first .markdown NOT inside the thinking / tool-call
  // rollup (that one holds the reasoning, not the reply).
  const md = [...seg.querySelectorAll('.markdown')].find(
    m => !m.closest('.thinking-container, .toolcall-flow'),
  );
  return md || seg.querySelector('.markdown') || seg;
}

/** The native copy button inside a Kimi action bar: the site's button
 *  element (.simple-button in the user bar, .icon-button in the assistant
 *  bar) wrapping an iconified svg with name="Copy". undefined → ui.js
 *  appends at the end instead. */
function nativeCopyButton(bar) {
  const svg = bar.querySelector('svg[name="Copy"]');
  if (!svg) return undefined;
  return svg.closest('.simple-button, .icon-button') || svg.parentElement;
}

export default {
  // 2026: Kimi's web app moved to www.kimi.com; kimi.moonshot.cn kept for
  // older installs / redirects.
  host: ['www.kimi.com', 'kimi.moonshot.cn'],
  name: 'Kimi',

  getMessageElements() {
    return turns();
  },

  getRole(el) {
    return roleOf(el);
  },

  getMessages() {
    return turns().map(seg => ({ role: roleOf(seg), el: contentOf(seg) }));
  },

  /**
   * Kimi renders a native action bar per turn: assistant [Copy] (+ refresh/
   * like/dislike/share behind the hover menu), user [Edit] [Copy] [Share].
   * Our buttons go INTO the bar, right after the native Copy button (both
   * roles), so they sit beside the site's own 复制.
   */
  getNativeToolbars() {
    const out = [];
    for (const seg of turns()) {
      const role = roleOf(seg);
      const bar =
        role === 'user'
          ? seg.querySelector('.segment-user-actions')
          : seg.querySelector('.segment-assistant-actions-content') ||
            seg.querySelector('.segment-assistant-actions');
      if (!bar) continue;
      out.push({
        toolbar: bar,
        content: contentOf(seg),
        role,
        insertAfter: nativeCopyButton(bar),
      });
    }
    return out;
  },

  /**
   * Build a button that matches Kimi's native action-button markup so the
   * injected buttons blend into the bar. Kimi has two button components —
   * the user bar uses <div class="simple-button size-small">, the assistant
   * bar <div class="icon-button" style="width:…">; both wrap an iconified
   *   <svg class="iconify …" width="16" height="16" name="Icon"><path…/></svg>
   * and the user-bar buttons ALSO carry a text <span> label (编辑/复制/分享).
   *
   * We clone the site's own COPY button from THIS bar (keeping the Vue
   * data-v-… scoped-CSS ids and sizing so styling matches), swap its iconify
   * svg for our heroicons clipboard, and — when the bar shows labels — set
   * the span to our short pill text. Cloning the FIRST button instead would
   * inherit "编辑" (the first user-bar button is Edit), which read as a
   * second Edit control in the bar.
   */
  makeNativeButton(toolbar, title, double) {
    const template =
      nativeCopyButton(toolbar) ||
      toolbar.querySelector('.simple-button, .icon-button');
    if (template) {
      const clone = template.cloneNode(true);
      // Drop copied identity so our title is authoritative.
      clone.removeAttribute('title');
      clone.removeAttribute('aria-label');
      const oldSvg = clone.querySelector('svg');
      const single = 'M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184';
      const doc = 'M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 0 0-9-9Z';
      if (oldSvg) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        for (const [k, v] of Object.entries({
          class: oldSvg.getAttribute('class') || 'iconify',
          xmlns: 'http://www.w3.org/2000/svg',
          width: '16', height: '16', fill: 'none',
          viewBox: '0 0 24 24', stroke: 'currentColor',
          'stroke-width': '1.5', 'stroke-linecap': 'round',
          'stroke-linejoin': 'round', 'aria-hidden': 'true',
        })) svg.setAttribute(k, v);
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', double ? doc : single);
        svg.appendChild(path);
        oldSvg.replaceWith(svg);
      }
      // Icon+text bars: relabel the pill (the clone came from the native
      // copy button, so the span would otherwise just say 复制 again).
      const label = [...clone.children].find(
        c => c.tagName === 'SPAN' && !/\biconify\b/.test(c.getAttribute('class') || ''),
      );
      if (label) label.textContent = t(double ? 'pillTurn' : 'pillOne');
      clone.setAttribute('aria-label', title);
      return clone;
    }
    // Fallback: a plain button if the bar had no clonable button.
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'simple-button size-small';
    btn.setAttribute('aria-label', title);
    btn.textContent = title;
    return btn;
  },
};
