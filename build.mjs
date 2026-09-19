/**
 * build.mjs — bundle src/ into a single self-contained .user.js
 *
 * esbuild inlines marked (and our modules) so the final script has no external
 * runtime dependency — more reliable than relying on @require CDNs. The
 * UserScript header is prepended so Tampermonkey recognises the file.
 *
 * Output is written with LF line endings: esbuild produces LF internally, and
 * we write via an explicit buffer to avoid Windows text-mode fs re-introducing
 * CRLF, which some editors / Tampermonkey checks handle less reliably.
 */
import * as esbuild from 'esbuild';
import { writeFileSync } from 'node:fs';

const USERSCRIPT_HEADER = `// ==UserScript==
// @name         AI 对话一键复制到 OneNote
// @namespace    https://github.com/ruicx/Copy-AI-Chat-to-OneNote
// @version      0.5.8
// @description  Copy AI Chat (ChatGPT/Gemini/Claude/DeepSeek/Kimi/Doubao) content to OneNote with a single click. Support Markdown, code blocks, and images. Copy the entire conversation or just the latest message. Compatible with Tampermonkey and Violentmonkey.
// @author       ruicx
// @match        https://gemini.google.com/*
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @match        https://claude.ai/*
// @match        https://chat.deepseek.com/*
// @match        https://kimi.moonshot.cn/*
// @match        https://www.kimi.com/*
// @match        https://www.doubao.com/chat/*
// @grant        none
// @run-at       document-idle
// @license      MIT
// ==/UserScript==
`;

const result = await esbuild.build({
  entryPoints: ['src/index.js'],
  bundle: true,
  minify: false,
  format: 'iife',
  banner: { js: USERSCRIPT_HEADER },
  target: ['chrome110', 'firefox115'],
  legalComments: 'none',
  define: { __AI_COPY_VERSION__: JSON.stringify('0.5.4') },
  write: false,
});

let code = result.outputFiles[0].text;
// Enforce LF: strip any CR characters.
code = code.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
writeFileSync('ai-chat-copy.user.js', code, 'utf8');

console.log('✓ built ai-chat-copy.user.js (LF line endings)');
