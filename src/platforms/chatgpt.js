/**
 * chatgpt.js — ChatGPT adapter.
 *
 * Verified DOM (2025):
 *   <div data-message-author-role="user" data-message-id="...">
 *   <div data-message-author-role="assistant" data-message-id="...">
 *      <div class="markdown prose ..."> ...rendered content... </div>
 *   User messages: .whitespace-pre-wrap holds the text.
 *
 * Primary selector [data-message-author-role] is stable; content nodes use
 * layered fallbacks (.markdown / [class*="markdown"] / last child div).
 */
import { queryAll } from './base.js';

const ROLE_ATTR = 'data-message-author-role';

function messageTurns() {
  return queryAll([`[${ROLE_ATTR}]`]).filter(el => {
    const r = el.getAttribute(ROLE_ATTR);
    return r === 'user' || r === 'assistant';
  });
}

function contentOf(turn) {
  const role = turn.getAttribute(ROLE_ATTR);
  // Assistant: the .markdown node holds rendered content.
  let content =
    turn.querySelector('.markdown') ||
    turn.querySelector('[class*="markdown"]') ||
    turn.querySelector('.whitespace-pre-wrap');
  // Fallback: the last child div usually wraps the body.
  if (!content) {
    const divs = turn.querySelectorAll(':scope > div');
    content = divs[divs.length - 1] || turn;
  }
  return { role, content };
}

export default {
  host: ['chatgpt.com', 'chat.openai.com'],
  name: 'ChatGPT',
  getMessageElements() {
    return messageTurns();
  },
  getRole(el) {
    const r = el?.getAttribute?.(ROLE_ATTR);
    return r === 'user' ? 'user' : 'assistant';
  },
  getMessages() {
    return messageTurns().map(turn => {
      const { role, content } = contentOf(turn);
      return { role, el: content };
    });
  },

  /**
   * ChatGPT renders its own action toolbar under each message, containing
   * native buttons like 复制回复 / 喜欢. We inject our own buttons INTO these
   * toolbars so they match the site's look exactly.
   *
   * Located via the stable data-testid="copy-turn-action-button" (the toolbar
   * is that button's parent), with aria-label / role=group as fallbacks.
   * Role is decided by whether the toolbar has an "编辑消息" button (user-only).
   *
   * Returns one entry per message toolbar: { toolbar, content, role }.
   */
  getNativeToolbars() {
    const out = [];
    // Primary: find ChatGPT's own copy buttons and take their parent toolbar.
    let copyBtns = queryAll(['[data-testid="copy-turn-action-button"]']);
    // Fallback: aria-label-based if the testid ever changes.
    if (!copyBtns.length) {
      copyBtns = queryAll([
        '[aria-label="复制回复"]', '[aria-label="复制消息"]',
        '[aria-label="Copy response"]', '[aria-label="Copy message"]',
      ]);
    }

    const seen = new Set();
    for (const btn of copyBtns) {
      const toolbar = btn.parentElement;
      if (!toolbar || seen.has(toolbar)) continue;
      seen.add(toolbar);

      // User messages have an edit button in their toolbar; assistant don't.
      const hasEdit = !!toolbar.querySelector(
        '[aria-label="编辑消息"], [aria-label="Edit message"], [data-testid="edit-message-action-button"]'
      );
      const role = hasEdit ? 'user' : 'assistant';

      // The toolbar lives at a variable depth relative to the message content,
      // so walk UP until we find the rendered content node.
      const content = findContentAncestor(toolbar);
      if (content) out.push({ toolbar, content, role });
    }
    return out;;
  },
};

/** Walk up from a toolbar element until we hit an ancestor containing the
 *  rendered message content (.markdown / .whitespace-pre-wrap). Searches
 *  several levels so it survives ChatGPT's nested wrapper refactors. */
function findContentAncestor(toolbar) {
  let node = toolbar;
  for (let depth = 0; depth < 8 && node; depth++) {
    node = node.parentElement;
    if (!node) break;
    const content =
      node.querySelector('.markdown') ||
      node.querySelector('[class*="markdown"]') ||
      node.querySelector('.whitespace-pre-wrap');
    if (content) return content;
  }
  return null;
}
