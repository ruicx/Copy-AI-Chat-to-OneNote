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
};
