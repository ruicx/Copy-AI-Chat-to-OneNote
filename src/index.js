/**
 * index.js — userscript entry point.
 *
 * Detects the current AI platform, picks its adapter, and mounts the UI
 * (floating whole-conversation button + per-message copy buttons).
 * Runs only after DOM is ready; guards against double-init.
 */
import chatgpt from './platforms/chatgpt.js';
import gemini from './platforms/gemini.js';
import claude from './platforms/claude.js';
import deepseek from './platforms/deepseek.js';
import kimi from './platforms/kimi.js';
import doubao from './platforms/doubao.js';
import { mountFloatingButton, mountPerMessageButtons } from './ui.js';

const ADAPTERS = [chatgpt, gemini, claude, deepseek, kimi, doubao];

function pickAdapter() {
  return ADAPTERS.find(a => [].concat(a.host).some(h => location.hostname === h || location.hostname.endsWith('.' + h)));
}

let booted = false;
function boot() {
  if (booted) return;
  const adapter = pickAdapter();
  if (!adapter) return; // unsupported site: do nothing
  booted = true;
  console.log(`[ai-copy] active on ${adapter.name}`);
  mountFloatingButton(adapter);
  mountPerMessageButtons(adapter);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
