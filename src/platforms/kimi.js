/**
 * kimi.js — Kimi (kimi.moonshot.cn) adapter.
 *
 * Kimi renders assistant turns in .markdown or [class*="bubble"] blocks.
 * ⚠️ Calibrate against test/fixtures/kimi-sample.html before shipping.
 */
import { queryAll, queryFirst } from './base.js';

function root() {
  return queryFirst(['[class*="chat"]', 'main', 'body']);
}

function allTurns() {
  return queryAll(['[class*="bubble"]', '[class*="message-item"]', '[class*="row"]'], root());
}

export default {
  host: ['kimi.moonshot.cn'],
  name: 'Kimi',

  getMessageElements() {
    return allTurns();
  },

  getRole(el) {
    const hint = el.className || '';
    if (/user|self|query/i.test(hint)) return 'user';
    return 'assistant';
  },

  getMessages() {
    return allTurns().map(el => {
      const role = this.getRole(el);
      const content = el.querySelector('.markdown') || el.querySelector('[class*="markdown"]') || el;
      return { role, el: content };
    });
  },
};
