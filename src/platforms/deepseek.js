/**
 * deepseek.js — DeepSeek (chat.deepseek.com) adapter.
 *
 * DeepSeek renders markdown in a .ds-markdown block within each turn; turns
 * alternate user/assistant. Class names are layered with fallbacks.
 * ⚠️ Calibrate against test/fixtures/deepseek-sample.html before shipping.
 */
import { queryAll, queryFirst } from './base.js';

function root() {
  return queryFirst(['[class*="chat-content"]', 'main', 'body']);
}

function allTurns() {
  return queryAll(
    ['[class*="message"]', '[class*="bubble"]', '[class*="row"]'],
    root(),
  );
}

export default {
  host: ['chat.deepseek.com'],
  name: 'DeepSeek',

  getMessageElements() {
    return allTurns();
  },

  getRole(el) {
    const hint = (el.className || '') + ' ' + (el.getAttribute('data-role') || '');
    if (/user|question/i.test(hint)) return 'user';
    return 'assistant';
  },

  getMessages() {
    return allTurns().map(el => {
      const role = this.getRole(el);
      const content =
        el.querySelector('.ds-markdown') ||
        el.querySelector('[class*="markdown"]') ||
        el;
      return { role, el: content };
    });
  },
};
