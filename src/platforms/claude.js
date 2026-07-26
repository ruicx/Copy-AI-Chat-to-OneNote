/**
 * claude.js — Claude (claude.ai) adapter.
 *
 * Observed structure: each turn is a [data-testid="user-message"] or a
 * response block whose content sits under [class*="prose"] / font-claude-message.
 * Layered fallbacks since class names shift.
 */
import { queryAll } from './base.js';

function turns() {
  // User turns have a stable test id; assistant turns are the prose blocks.
  const userMsgs = queryAll(['[data-testid="user-message"]']);
  const assistantMsgs = queryAll([
    '[class*="prose"]',
    '.font-claude-message',
    'div[data-testid][class*="message"]',
  ]).filter(el => !el.closest('[data-testid="user-message"]'));
  return { userMsgs, assistantMsgs };
}

export default {
  host: ['claude.ai'],
  name: 'Claude',

  getMessageElements() {
    const { userMsgs, assistantMsgs } = turns();
    return [...userMsgs, ...assistantMsgs];
  },

  getRole(el) {
    return el.closest('[data-testid="user-message"]') || el.matches?.('[data-testid="user-message"]')
      ? 'user'
      : 'assistant';
  },

  getMessages() {
    const { userMsgs, assistantMsgs } = turns();
    return [
      ...userMsgs.map(el => ({ role: 'user', el })),
      ...assistantMsgs.map(el => ({ role: 'assistant', el })),
    ];
  },
};
