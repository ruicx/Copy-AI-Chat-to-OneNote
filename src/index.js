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
import { applyLogoSwap } from './logo.js';

const ADAPTERS = [chatgpt, gemini, claude, deepseek, kimi, doubao];

// Some AI sites (notably Gemini) enforce a Trusted Types policy that rejects
// raw innerHTML assignment on the live document. Install a permissive default
// policy so our DOM building (and any code we run alongside) works there.
// Wrapped in try/catch: a default policy can only be created once per document.
if (window.trustedTypes && window.trustedTypes.createPolicy) {
  try {
    window.trustedTypes.createPolicy('default', { createHTML: (s) => s });
  } catch (_) { /* default policy already installed */ }
}

function pickAdapter() {
  return ADAPTERS.find(a => [].concat(a.host).some(h => location.hostname === h || location.hostname.endsWith('.' + h)));
}

let booted = false;
function boot() {
  if (booted) return;
  const adapter = pickAdapter();
  if (!adapter) return; // unsupported site: do nothing
  booted = true;
  // The version in the log lets the user verify the installed build is the
  // one they think it is (Tampermonkey keeps stale installs silently).
  // __AI_COPY_VERSION__ is a build.mjs esbuild define; "dev" when unbundled.
  const version = typeof __AI_COPY_VERSION__ === 'string' ? __AI_COPY_VERSION__ : 'dev';
  console.log(`[ai-copy] active on ${adapter.name} v${version}`);
  mountFloatingButton(adapter);
  mountPerMessageButtons(adapter);
  applyLogoSwap(); // no-op unless the logo setting is non-empty
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
