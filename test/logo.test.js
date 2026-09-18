import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseHTML } from 'linkedom';
import { LOGO_KEY, BRANDS, applyLogo, restoreLogos, readLogoSetting } from '../src/logo.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const geminiFixture = readFileSync(join(__dirname, 'fixtures/gemini-logo.html'), 'utf8');
const chatgptFixture = readFileSync(join(__dirname, 'fixtures/chatgpt-logo.html'), 'utf8');

// Minimal localStorage shim so readLogoSetting can be exercised in Node.
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const parse = (html) => parseHTML(html).document;
const GEMINI_HOST = 'gemini.google.com';
const CHATGPT_HOST = 'chatgpt.com';

const geminiImg = (doc) => doc.querySelector('img.sparkle-image');

test('LOGO_KEY and brand table', () => {
  assert.equal(LOGO_KEY, 'ai-copy-logo');
  assert.equal(BRANDS.kimi.name, 'Kimi');
  assert.equal(BRANDS.deepseek.name, 'DeepSeek');
});

test('readLogoSetting trims, lowercases, and validates against the allowlist', () => {
  store.delete(LOGO_KEY);
  assert.equal(readLogoSetting(), '');
  store.set(LOGO_KEY, 'kimi');
  assert.equal(readLogoSetting(), 'kimi');
  store.set(LOGO_KEY, '  DeepSeek ');
  assert.equal(readLogoSetting(), 'deepseek');
  store.set(LOGO_KEY, 'claude');
  assert.equal(readLogoSetting(), '');
  store.delete(LOGO_KEY);
});

test('Gemini: kimi replaces the sparkle img with a data-URI SVG', () => {
  const doc = parse(geminiFixture);
  const img = geminiImg(doc);
  const originalSrc = img.getAttribute('src');

  applyLogo(doc, GEMINI_HOST, 'kimi');

  const src = img.getAttribute('src');
  assert.match(src, /^data:image\/svg\+xml/);
  const decoded = decodeURIComponent(src.replace(/^data:image\/svg\+xml[^,]*,/, ''));
  assert.match(decoded, /<svg[^>]*viewBox="0 0 24 24"/);
  assert.match(decoded, new RegExp(BRANDS.kimi.path.slice(0, 20)));
  assert.equal(img.getAttribute('data-ai-copy-logo'), 'kimi');
  assert.notEqual(src, originalSrc);
});

test('Gemini: deepseek replaces the sparkle img with the whale in brand color', () => {
  const doc = parse(geminiFixture);
  applyLogo(doc, GEMINI_HOST, 'deepseek');
  const src = geminiImg(doc).getAttribute('src');
  const decoded = decodeURIComponent(src.replace(/^data:image\/svg\+xml[^,]*,/, ''));
  assert.match(decoded, new RegExp(BRANDS.deepseek.path.slice(0, 20)));
  assert.ok(decoded.includes(BRANDS.deepseek.inlineFill));
});

test('Gemini: the "Gemini" wordmark is hidden and a brand clone sits beside it', () => {
  const doc = parse(geminiFixture);
  applyLogo(doc, GEMINI_HOST, 'kimi');

  const origWm = doc.querySelector('.side-nav-sparkle-button .gemini-sidenav-text');
  assert.equal(origWm.style.display, 'none', 'site wordmark hidden, content untouched');
  assert.equal(origWm.textContent, ' Gemini');
  assert.equal(origWm.getAttribute('data-ai-copy-orig'), '1');

  const cloneWm = doc.querySelector('.gemini-sidenav-text[data-ai-copy-logo]');
  assert.ok(cloneWm, 'wordmark clone inserted');
  assert.equal(cloneWm.textContent, 'Kimi');
  assert.match(cloneWm.getAttribute('class'), /gemini-sidenav-text/);
  assert.equal(cloneWm.style.display, '', 'clone must be visible');
});

test('Gemini: re-applying after the site wipes the clone re-inserts it', () => {
  const doc = parse(geminiFixture);
  applyLogo(doc, GEMINI_HOST, 'deepseek');
  doc.querySelector('.gemini-sidenav-text[data-ai-copy-logo]').remove();
  applyLogo(doc, GEMINI_HOST, 'deepseek');
  const cloneWm = doc.querySelector('.gemini-sidenav-text[data-ai-copy-logo]');
  assert.ok(cloneWm, 'clone re-inserted');
  assert.equal(cloneWm.textContent, 'DeepSeek');
});

test('Gemini: site re-classing the wordmark re-clones with the new classes', () => {
  const doc = parse(geminiFixture);
  applyLogo(doc, GEMINI_HOST, 'kimi');
  // Sidebar collapsed then re-expanded: Angular flips the class list.
  const origWm = doc.querySelector('.side-nav-sparkle-button .gemini-sidenav-text');
  origWm.className = 'gemini-sidenav-text gds-title-l-emphasized';
  applyLogo(doc, GEMINI_HOST, 'kimi');
  origWm.className = 'gemini-sidenav-text gds-title-l-emphasized expanded';
  applyLogo(doc, GEMINI_HOST, 'kimi');
  const cloneWm = doc.querySelector('.gemini-sidenav-text[data-ai-copy-logo]');
  assert.match(cloneWm.getAttribute('class'), /expanded/, 'clone mirrors new classes');
  assert.equal(doc.querySelectorAll('.gemini-sidenav-text[data-ai-copy-logo]').length, 1);
});

test('Gemini: re-applying the same choice is idempotent', () => {
  const doc = parse(geminiFixture);
  applyLogo(doc, GEMINI_HOST, 'kimi');
  const src = geminiImg(doc).getAttribute('src');
  applyLogo(doc, GEMINI_HOST, 'kimi');
  assert.equal(geminiImg(doc).getAttribute('src'), src);
});

test('ChatGPT: original is hidden (never mutated) and a brand clone sits beside it', () => {
  const doc = parse(chatgptFixture);
  applyLogo(doc, CHATGPT_HOST, 'deepseek');

  // The site's own svg: content untouched, merely hidden.
  const origSvg = doc.querySelector('use[href="#blossom"]').closest('svg');
  assert.ok(origSvg.querySelector('symbol#blossom'), 'symbol must survive untouched');
  assert.equal(origSvg.style.display, 'none');
  assert.equal(origSvg.getAttribute('data-ai-copy-orig'), '1');
  assert.equal(origSvg.getAttribute('data-ai-copy-logo'), null);

  // Our clone: same classes, brand path, marked as ours.
  const clone = doc.querySelector('svg[data-ai-copy-logo]');
  assert.ok(clone, 'brand clone inserted');
  assert.match(clone.getAttribute('class'), /icon/);
  const path = clone.querySelector('path');
  assert.match(path.getAttribute('d'), new RegExp(BRANDS.deepseek.path.slice(0, 20)));
  assert.equal(path.getAttribute('fill'), BRANDS.deepseek.inlineFill);
  assert.equal(clone.getAttribute('data-ai-copy-logo'), 'deepseek');

  // Wordmark: original hidden with text intact; clone carries the brand name.
  const origWordmark = [...doc.querySelectorAll('.header-wordmark')]
    .find((el) => el.hasAttribute('data-ai-copy-orig'));
  assert.equal(origWordmark.textContent, 'ChatGPT');
  assert.equal(origWordmark.style.display, 'none');
  const cloneWordmark = doc.querySelector('.header-wordmark[data-ai-copy-logo]');
  assert.equal(cloneWordmark.textContent, 'DeepSeek');
});

test('ChatGPT: kimi clone uses currentColor so it follows the theme', () => {
  const doc = parse(chatgptFixture);
  applyLogo(doc, CHATGPT_HOST, 'kimi');
  const path = doc.querySelector('svg[data-ai-copy-logo] path');
  assert.equal(path.getAttribute('fill'), 'currentColor');
  assert.equal(doc.querySelector('.header-wordmark[data-ai-copy-logo]').textContent, 'Kimi');
});

test('ChatGPT: re-applying is idempotent (no duplicate clones)', () => {
  const doc = parse(chatgptFixture);
  applyLogo(doc, CHATGPT_HOST, 'deepseek');
  applyLogo(doc, CHATGPT_HOST, 'deepseek');
  assert.equal(doc.querySelectorAll('svg[data-ai-copy-logo]').length, 1);
  assert.equal(doc.querySelectorAll('.header-wordmark[data-ai-copy-logo]').length, 1);
});

test('ChatGPT: re-applying after React wipes the clones re-inserts them', () => {
  const doc = parse(chatgptFixture);
  applyLogo(doc, CHATGPT_HOST, 'deepseek');
  // React re-render deletes our inserted clones but leaves the hidden
  // originals (with their inline display:none) untouched.
  doc.querySelectorAll('[data-ai-copy-logo]').forEach((el) => el.remove());
  applyLogo(doc, CHATGPT_HOST, 'deepseek');
  const clone = doc.querySelector('svg[data-ai-copy-logo]');
  assert.ok(clone, 'svg clone re-inserted');
  assert.equal(clone.querySelector('path').getAttribute('fill'), BRANDS.deepseek.inlineFill);
  const cloneWm = doc.querySelector('.header-wordmark[data-ai-copy-logo]');
  assert.ok(cloneWm, 'wordmark clone re-inserted');
  assert.equal(cloneWm.textContent, 'DeepSeek');
  assert.equal(doc.querySelectorAll('.header-wordmark[data-ai-copy-logo]').length, 1);
});

test('ChatGPT: switching brand re-swaps the clones in place', () => {
  const doc = parse(chatgptFixture);
  applyLogo(doc, CHATGPT_HOST, 'kimi');
  applyLogo(doc, CHATGPT_HOST, 'deepseek');
  assert.equal(doc.querySelectorAll('svg[data-ai-copy-logo]').length, 1);
  const clone = doc.querySelector('svg[data-ai-copy-logo]');
  assert.equal(clone.getAttribute('data-ai-copy-logo'), 'deepseek');
  assert.equal(clone.querySelector('path').getAttribute('fill'), BRANDS.deepseek.inlineFill);
  assert.equal(doc.querySelector('.header-wordmark[data-ai-copy-logo]').textContent, 'DeepSeek');
});

test('unsupported host is a no-op', () => {
  const doc = parse(geminiFixture);
  const srcBefore = geminiImg(doc).getAttribute('src');
  applyLogo(doc, 'chat.deepseek.com', 'kimi');
  assert.equal(geminiImg(doc).getAttribute('src'), srcBefore);
  assert.equal(geminiImg(doc).getAttribute('data-ai-copy-logo'), null);

  const doc2 = parse(chatgptFixture);
  applyLogo(doc2, 'kimi.moonshot.cn', 'deepseek');
  assert.ok(doc2.querySelector('use[href="#blossom"]'), 'blossom untouched');
  assert.equal(doc2.querySelector('.header-wordmark').textContent, 'ChatGPT');
});

test('unknown choice is ignored', () => {
  const doc = parse(geminiFixture);
  const srcBefore = geminiImg(doc).getAttribute('src');
  applyLogo(doc, GEMINI_HOST, 'claude');
  assert.equal(geminiImg(doc).getAttribute('src'), srcBefore);
});

test('restoreLogos restores the original sparkle, blossom, and wordmark', () => {
  const gdoc = parse(geminiFixture);
  const cdoc = parse(chatgptFixture);
  const gsrc = geminiImg(gdoc).getAttribute('src');

  applyLogo(gdoc, GEMINI_HOST, 'deepseek');
  applyLogo(cdoc, CHATGPT_HOST, 'kimi');
  assert.match(geminiImg(gdoc).getAttribute('src'), /^data:image\/svg\+xml/);

  restoreLogos(gdoc);
  restoreLogos(cdoc);

  assert.equal(geminiImg(gdoc).getAttribute('src'), gsrc);
  assert.equal(geminiImg(gdoc).getAttribute('data-ai-copy-logo'), null);
  assert.equal(gdoc.querySelector('.gemini-sidenav-text[data-ai-copy-logo]'), null, 'gemini wordmark clone removed');
  const geminiWm = [...gdoc.querySelectorAll('.gemini-sidenav-text')]
    .find((el) => !el.hasAttribute('data-ai-copy-logo'));
  assert.equal(geminiWm.style.display, '', 'gemini wordmark visible again');
  assert.equal(geminiWm.textContent, ' Gemini');

  // ChatGPT: clones gone, originals visible and untouched again.
  assert.equal(cdoc.querySelector('svg[data-ai-copy-logo]'), null, 'clone removed');
  assert.equal(cdoc.querySelector('.header-wordmark[data-ai-copy-logo]'), null, 'wordmark clone removed');
  const svg = cdoc.querySelector('use[href="#blossom"]').closest('svg');
  assert.ok(svg.querySelector('symbol#blossom'), 'original symbol survived');
  assert.equal(svg.style.display, '', 'original visible again');
  assert.equal(svg.getAttribute('data-ai-copy-orig'), null);
  const wordmark = [...cdoc.querySelectorAll('.header-wordmark')]
    .find((el) => !el.hasAttribute('data-ai-copy-logo'));
  assert.equal(wordmark.style.display, '');
  assert.equal(wordmark.textContent, 'ChatGPT');
});

test('resetLogos is safe when nothing was swapped', () => {
  const doc = parse(geminiFixture);
  restoreLogos(doc);
  assert.ok(geminiImg(doc));
});
