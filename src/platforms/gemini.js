/**
 * gemini.js — Google Gemini adapter.
 *
 * Calibrated against a real saved page. Gemini uses Angular custom elements:
 *   <user-query> ... <div class="query-text gds-body-l"> ... </user-query>
 *   <model-response> ... <div class="model-response-text ...">
 *       <message-content><div class="markdown markdown-main-panel ...">
 *   </model-response>
 *
 * Turns are the <user-query> / <model-response> custom elements; content is
 * the .query-text / .markdown node nested inside.
 */
import { queryAll, queryFirst } from './base.js';

function turns(root) {
  // querySelectorAll with a compound selector returns elements in document
  // order, so user-query / model-response naturally alternate as they were
  // written — no manual merge+sort needed.
  const merged = [...root.querySelectorAll('user-query, model-response')];
  if (merged.length) return merged;
  // Legacy fallback.
  return [...root.querySelectorAll('[class*="conversation-turn"]')];
}

function contentOf(turn) {
  const tag = turn.tagName.toLowerCase();
  if (tag === 'user-query') {
    return turn.querySelector('.query-text') || turn;
  }
  if (tag === 'model-response') {
    // Prefer the rendered markdown panel; fall back to the structured container.
    return (
      turn.querySelector('.markdown') ||
      turn.querySelector('.model-response-text') ||
      turn
    );
  }
  // Legacy fallback.
  return (
    turn.querySelector('.query-text') ||
    turn.querySelector('.markdown') ||
    turn
  );
}

function roleOf(turn) {
  const tag = turn.tagName.toLowerCase();
  if (tag === 'user-query') return 'user';
  if (tag === 'model-response') return 'assistant';
  // Heuristic for legacy DOM.
  const hint = turn.className || '';
  return /query|user/i.test(hint) ? 'user' : 'assistant';
}

export default {
  host: ['gemini.google.com'],
  name: 'Gemini',

  // Gemini's Material tooltips appear BELOW the button and use regular-weight
  // text (its own copy/like buttons behave the same). Match that so our
  // tooltip doesn't look out of place next to Gemini's. (ChatGPT also shows
  // below but uses semibold — see the default in ui.js.)
  tooltipStyle: {
    position: 'below',
    fontWeight: '400',
    fontFamily: '"Google Sans",Roboto,-apple-system-body,ui-sans-serif,system-ui,"Segoe UI",Helvetica,Arial,sans-serif',
  },

  getMessageElements() {
    return turns(document);
  },

  getRole(el) {
    return roleOf(el);
  },

  getMessages() {
    return turns(document).map(turn => ({ role: roleOf(turn), el: contentOf(turn) }));
  },

  /**
   * Gemini renders its own action toolbar under each message:
   *   - model responses: <div class="actions-container-v2">
   *       <div class="buttons-container-v2">
   *         <thumb-up-button>…</thumb-up-button>
   *         <thumb-down-button>…</thumb-down-button>
   *         <copy-button><gem-icon-button data-test-id="copy-button">…</copy-button>
   *         <div> (more menu: copy-image, more-options) </div>
   *       </div>
   *     </div>
   *   - user prompts: <div class="luminous-actions-container">
   *       <gem-icon-button data-test-id="prompt-copy-button">…
   * The injected "copy to OneNote" buttons go INTO buttons-container-v2 /
   * luminous-actions-container so they sit beside Gemini's own buttons.
   * `content` resolves to the .query-text / .markdown node of the enclosing
   * turn (matches what getMessages() returns, so copyTurn's findTurnIndex works).
   */
  getNativeToolbars() {
    const out = [];
    // Model-response toolbars: anchor on the copy button, take its toolbar row.
    const modelCopyBtns = queryAll(['[data-test-id="copy-button"]']);
    for (const btn of modelCopyBtns) {
      const row = btn.closest('.buttons-container-v2') ||
                  btn.closest('.actions-container-v2') ||
                  btn.parentElement;
      const turn = btn.closest('model-response');
      const content = turn ? contentOf(turn) : null;
      // The AI toolbar's direct children are wrapper elements:
      //   <thumb-up-button> <thumb-down-button> <copy-button> <div menu-group> …
      // Gemini's copy <gem-icon-button> (data-test-id=copy-button) lives INSIDE
      // the <copy-button> wrapper. We want our buttons between <copy-button>
      // and the menu-group, so the anchor must be that WRAPPER (a direct child
      // of the toolbar), not the nested gem-icon-button. Climb out to it.
      const anchor = btn.closest('copy-button') || btn;
      if (row && content) out.push({ toolbar: row, content, role: 'assistant', insertAfter: anchor });
    }
    // User-prompt toolbars: anchor on the prompt copy button.
    const promptCopyBtns = queryAll(['[data-test-id="prompt-copy-button"]']);
    for (const btn of promptCopyBtns) {
      const row = btn.closest('.luminous-actions-container') ||
                  btn.parentElement?.parentElement ||
                  btn.parentElement;
      const turn = btn.closest('user-query');
      const content = turn ? contentOf(turn) : null;
      // The user toolbar is a flat row (复制提示, 修改提示, …) with no right-side
      // menu group, so append at the END — do NOT anchor on the copy button
      // or we'd land between 复制提示 and 修改提示.
      if (row && content) out.push({ toolbar: row, content, role: 'user' });
    }
    return out;
  },

  /**
   * Build a button that matches Gemini's native action-button markup so the
   * injected buttons blend into the toolbar. Gemini wraps each icon button in
   * an Angular <gem-icon-button> custom element:
   *   <gem-icon-button ... class="gem-button gem-button-type-on-surface ...">
   *     <button class="mdc-icon-button mat-mdc-icon-button ...">
   *       <mat-icon class="...lumi-symbols...">icon_name</mat-icon>
   *     </button>
   *   </gem-icon-button>
   * We clone an existing <gem-icon-button> from the toolbar (preserving all
   * the Material classes), then replace its <mat-icon> ligature with our
   * heroicons SVG. Cloning is what makes the result pixel-match Gemini's own
   * buttons; hard-coding the classes would break every Gemini UI refresh.
   */
  makeNativeButton(toolbar, title, double) {
    // Find an existing gem-icon-button to use as the styling template. Prefer
    // one that is NOT a menu trigger (those carry extra overlay behaviour).
    const template = toolbar.querySelector(
      'gem-icon-button:not([gemmenutrigger])') ||
      toolbar.querySelector('gem-icon-button');
    if (template) {
      const clone = template.cloneNode(true);
      // Drop the copied aria-label / tooltip so our title is authoritative.
      clone.removeAttribute('arialabel');
      clone.removeAttribute('gemtooltip');
      clone.removeAttribute('data-test-id');
      // Replace Gemini's <mat-icon> (a lumino font ligature) with our
      // heroicons SVG. The lumino system renders its icon via a special
      // font-family + the fonticon/data-mat-icon-name attributes; just
      // clearing the text isn't enough — Angular's icon directive can
      // re-inject it, and the font classes still draw on top of our SVG.
      // So we REPLACE the <mat-icon> node with a fresh <span> that carries
      // only our SVG. We must capture mat-icon's computed font-size FIRST
      // (that's what lm-icon-m sets and what sizes Gemini's icons); once the
      // node is gone, 1em would resolve to the button's font-size instead and
      // the icon would render at the wrong size.
      const matIcon = clone.querySelector('mat-icon');
      if (matIcon) {
        let iconSize = '20px';
        try {
          const fs = getComputedStyle(matIcon).fontSize;
          if (fs) iconSize = fs;
        } catch (_) { /* getComputedStyle unavailable (Node tests) — keep default */ }
        const iconBox = document.createElement('span');
        iconBox.className = 'aicopy-gem-icon';
        // Inline style so we don't depend on any Gemini class that could
        // pull in the lumino font. Use the captured pixel size (NOT 1em,
        // which would re-resolve to the wrong value after mat-icon is gone).
        iconBox.style.cssText =
          `display:inline-flex;align-items:center;justify-content:center;` +
          `width:${iconSize};height:${iconSize};line-height:1`;
        const svgAttrs = 'xmlns="http://www.w3.org/2000/svg" fill="none" ' +
          'viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" ' +
          'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ' +
          `style="width:${iconSize};height:${iconSize};display:block"`;
        const single = 'M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184';
        const doc = 'M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 0 0-9-9Z';
        const d = double ? doc : single;
        iconBox.innerHTML = `<svg ${svgAttrs}><path d="${d}"/></svg>`;
        matIcon.replaceWith(iconBox);
        // Point the inner <button>'s aria-label at our title (the gem-icon-button
        // wrapper carries the tooltip; the inner button carries the label).
        const innerBtn = clone.querySelector('button');
        if (innerBtn) innerBtn.setAttribute('aria-label', title);
        clone.setAttribute('arialabel', title);
        clone.setAttribute('gemtooltip', title);
        return clone;
      }
    }
    // Fallback: a plain Material-styled button if no template was found.
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mdc-icon-button mat-mdc-icon-button mat-mdc-button-base';
    btn.setAttribute('aria-label', title);
    const svgAttrs = 'xmlns="http://www.w3.org/2000/svg" width="20" height="20" ' +
      'fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
    btn.innerHTML = `<svg ${svgAttrs}><path d="${double
      ? 'M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25'
      : 'M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184'}"/></svg>`;
    return btn;
  },
};
