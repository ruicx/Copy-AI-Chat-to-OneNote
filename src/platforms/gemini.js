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

  getMessageElements() {
    return turns(document);
  },

  getRole(el) {
    return roleOf(el);
  },

  getMessages() {
    return turns(document).map(turn => ({ role: roleOf(turn), el: contentOf(turn) }));
  },
};
