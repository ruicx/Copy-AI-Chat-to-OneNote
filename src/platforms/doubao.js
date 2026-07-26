/**
 * doubao.js — 豆包 (doubao.com) adapter.
 *
 * Doubao renders markdown within message bubbles; selectors are layered.
 * ⚠️ Calibrate against test/fixtures/doubao-sample.html before shipping.
 */
import { queryAll, queryFirst } from './base.js';

function root() {
  return queryFirst(['[class*="chat"]', 'main', 'body']);
}

function allTurns() {
  return queryAll(
    ['[class*="message-item"]', '[class*="bubble"]', '[class*="receive"]', '[class*="row"]'],
    root(),
  );
}

export default {
  host: ['www.doubao.com', 'doubao.com'],
  name: '豆包',

  getMessageElements() {
    return allTurns();
  },

  getRole(el) {
    const hint = el.className || '';
    if (/user|self|send/i.test(hint)) return 'user';
    return 'assistant';
  },

  getMessages() {
    return allTurns().map(el => {
      const role = this.getRole(el);
      const content =
        el.querySelector('[class*="markdown"]') ||
        el.querySelector('[class*="content"]') ||
        el;
      return { role, el: content };
    });
  },
};
