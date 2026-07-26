/**
 * base.js — adapter contract and shared helpers.
 *
 * Each platform adapter implements this interface:
 *   host:    string        hostname this adapter handles
 *   name:    string        human-readable platform name
 *   getMessages():         {role, el}[]   full conversation
 *   getMessageElements():  Element[]      each message bubble (for per-msg UI)
 *   getRole(el):           'user' | 'assistant'
 *
 * Selectors on AI sites are obfuscated and change frequently. Adapters use
 * layered fallbacks and are covered by fixture regression tests (test/fixtures).
 */

/** Pick the first selector that matches anything in the document. */
export function queryFirst(selectorList, root = document) {
  for (const sel of selectorList) {
    try {
      const el = root.querySelector(sel);
      if (el) return el;
    } catch (_) { /* invalid selector, skip */ }
  }
  return null;
}

/** Query all matching elements across a list of fallback selectors. */
export function queryAll(selectorList, root = document) {
  for (const sel of selectorList) {
    try {
      const els = root.querySelectorAll(sel);
      if (els.length) return Array.from(els);
    } catch (_) { /* skip */ }
  }
  return [];
}
