/**
 * gemini.js — Google Gemini adapter.
 *
 * Gemini's DOM uses obfuscated, frequently-changing class names (Angular/Lit).
 * No stable public selectors exist, so this adapter uses layered heuristics:
 *   - conversation container: [chat-history] / main [role="main"] fallback
 *   - turns: elements with data-test-id*="conversation-turn" or class*="turn"
 *   - within a turn, query vs response distinguished by content structure
 *
 * ⚠️ Selectors here are best-effort and MUST be calibrated against a real
 * saved page (test/fixtures/gemini-sample.html) before shipping. See
 * docs/selector-notes.md for the calibration record.
 */
import { queryFirst, queryAll } from './base.js';

function conversationRoot() {
  return (
    queryFirst(['[data-test-id="conversation"]', 'chat-history', 'main[role="main"]']) ||
    document.querySelector('main') || document.body
  );
}

function turns(root) {
  return queryAll(
    [
      '[data-test-id^="conversation-turn"]',
      '[class*="conversation-turn"]',
      'model-response',
      'user-query',
    ],
    root,
  );
}

export default {
  host: ['gemini.google.com'],
  name: 'Gemini',

  getMessageElements() {
    return turns(conversationRoot());
  },

  getRole(el) {
    // Heuristics: anything matching user-query / containing the prompt textarea
    // ancestor is a user turn; otherwise assistant.
    const hint = el.getAttribute('data-test-id') || el.className || '';
    if (/user-query|user-query|query-text/i.test(hint)) return 'user';
    if (/model-response|response-container|model-response-text/i.test(hint)) return 'assistant';
    return 'assistant';
  },

  getMessages() {
    const root = conversationRoot();
    return turns(root).map(el => {
      const role = this.getRole(el);
      // Prefer the known content node names when present.
      const content =
        el.querySelector('message-content') ||
        el.querySelector('[class*="model-response-text"]') ||
        el.querySelector('[class*="query-text"]') ||
        el;
      return { role, el: content };
    });
  },
};
