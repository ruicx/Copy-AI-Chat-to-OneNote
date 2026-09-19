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
const chatgptTextFixture = readFileSync(join(__dirname, 'fixtures/chatgpt-text.html'), 'utf8');
const geminiTextFixture = readFileSync(join(__dirname, 'fixtures/gemini-text.html'), 'utf8');

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

test('ChatGPT: a blossom React mounts later (sidebar collapse) is swapped even with the stale hidden original present', () => {
  // Regression from a saved collapsed-sidebar page (38bd709d): the swap ran
  // while expanded (wordmark clone present), then collapsing re-rendered the
  // tiny-bar and React mounted a FRESH blossom there — while the old hidden
  // original survived inside the still-mounted expanded sidebar. The
  // single-slot lookup pinned on the ORIG_ATTR original and the fresh blossom
  // showed the site logo forever.
  const doc = parse(chatgptFixture);
  applyLogo(doc, CHATGPT_HOST, 'kimi');

  const oldOrig = doc.querySelector('use[href="#blossom"]').closest('svg');
  assert.equal(oldOrig.style.display, 'none', 'precondition: old blossom hidden');
  // React re-creates the collapsed rail with a fresh, visible blossom.
  const fresh = oldOrig.cloneNode(true);
  fresh.removeAttribute('data-ai-copy-orig');
  fresh.removeAttribute('style');
  const rail = doc.createElement('nav');
  rail.id = 'stage-sidebar-tiny-bar';
  rail.appendChild(fresh);
  doc.body.appendChild(rail);

  applyLogo(doc, CHATGPT_HOST, 'kimi');

  assert.equal(fresh.style.display, 'none', 'fresh blossom must be hidden');
  assert.equal(fresh.getAttribute('data-ai-copy-orig'), '1');
  assert.equal(fresh.nextElementSibling.getAttribute('data-ai-copy-logo'), 'kimi',
    'brand clone sits beside the fresh blossom');
  assert.equal(doc.querySelectorAll('svg[data-ai-copy-logo]').length, 2,
    'each blossom instance carries its own clone');
});

test('ChatGPT: every blossom instance in the document is swapped', () => {
  // The collapsed rail, the expanded sidebar, and the mobile slideover header
  // can each carry their own blossom — all must get the treatment.
  const doc = parse(chatgptFixture);
  const blossomSvg = doc.querySelector('use[href="#blossom"]').closest('svg');
  blossomSvg.parentElement.appendChild(blossomSvg.cloneNode(true));

  applyLogo(doc, CHATGPT_HOST, 'kimi');

  const svgs = [...doc.querySelectorAll('use[href="#blossom"]')].map((u) => u.closest('svg'));
  assert.equal(svgs.length, 2);
  for (const svg of svgs) {
    assert.equal(svg.style.display, 'none', 'instance hidden');
    assert.equal(svg.nextElementSibling.getAttribute('data-ai-copy-logo'), 'kimi',
      'clone beside each instance');
  }
  assert.equal(doc.querySelectorAll('svg[data-ai-copy-logo]').length, 2);
});

test('ChatGPT: orphaned brand clones (original removed by React) are cleaned up', () => {
  const doc = parse(chatgptFixture);
  applyLogo(doc, CHATGPT_HOST, 'kimi');
  // React removes the hidden original but leaves our clone behind.
  doc.querySelector('use[href="#blossom"]').closest('svg').remove();
  applyLogo(doc, CHATGPT_HOST, 'kimi');
  assert.equal(doc.querySelectorAll('svg[data-ai-copy-logo]').length, 0,
    'clone without its original is dropped');
});

test('ChatGPT: fallback finds the logo via the open-sidebar button if the symbol is renamed', () => {
  const doc = parse(chatgptFixture);
  // Simulate a future ChatGPT build renaming the mark: no #blossom refs left.
  for (const use of doc.querySelectorAll('use[href="#blossom"]')) use.setAttribute('href', '#openai-mark');
  for (const sym of doc.querySelectorAll('symbol#blossom')) sym.id = 'openai-mark';
  const btn = doc.querySelector('button[aria-label="打开侧边栏"]');
  btn.setAttribute('aria-controls', 'stage-slideover-sidebar');

  applyLogo(doc, CHATGPT_HOST, 'kimi');

  const svg = btn.querySelector('svg');
  assert.equal(svg.style.display, 'none', 'fallback hid the button\'s primary icon');
  assert.equal(svg.getAttribute('data-ai-copy-orig'), '1');
  assert.equal(svg.nextElementSibling.getAttribute('data-ai-copy-logo'), 'kimi');
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

test('ChatGPT: composer placeholder + thread disclaimer follow the brand name', () => {
  const doc = parse(chatgptTextFixture);
  applyLogo(doc, CHATGPT_HOST, 'kimi');

  // Placeholder: attribute swapped in place (feeds the site's
  // content:attr(data-placeholder) rules), and any real text inside the p
  // rewritten. Under linkedom there is no computed style, so no override
  // <style> is injected here (the pseudo-detection path has its own stub
  // test below).
  const [pAttrOnly, pWithText] = doc.querySelectorAll('p[data-placeholder]');
  assert.equal(pAttrOnly.getAttribute('data-placeholder'), '问问 Kimi');
  assert.equal(pWithText.getAttribute('data-placeholder'), '问问 Kimi');
  assert.equal(pWithText.textContent, '问问 Kimi', 'real placeholder text rewritten');

  // Disclaimer: the text node inside the pill is rewritten in place.
  const box = doc.querySelector('[data-testid="thread-disclaimer"]');
  assert.equal(box.textContent.trim(), 'Kimi 也可能会犯错。请核查重要信息。');

  // Nothing else carrying the name may be touched: the sr-only turn label,
  // the conversation body, and the aria-labels stay exactly as the site has
  // them (the display:none fallback textarea's placeholder too).
  assert.equal(doc.querySelector('h4.sr-only').textContent, 'ChatGPT 说：');
  assert.equal(doc.querySelector('.markdown p').textContent, 'ChatGPT 是一个对话式 AI。');
  assert.equal(doc.querySelector('#prompt-textarea').getAttribute('aria-label'), '与 ChatGPT 聊天');
  assert.equal(doc.querySelector('textarea[name="prompt-textarea"]').getAttribute('placeholder'), '问问 ChatGPT');
});

test('ChatGPT: the content-override targets only the pseudo the site renders', () => {
  const doc = parse(chatgptTextFixture);
  // Current build (c2e1db12): the placeholder renders via ::after under the
  // .default-browser scope; ::before belongs to the .firefox variant and is
  // inert on Chrome. Simulate the browser's computed style.
  globalThis.getComputedStyle = (el, pseudo) =>
    ({ content: pseudo === '::after' ? '"问问 ChatGPT"' : 'none' });
  try {
    applyLogo(doc, CHATGPT_HOST, 'kimi');
  } finally {
    delete globalThis.getComputedStyle;
  }

  const style = doc.querySelector('style[data-ai-copy-text]');
  assert.ok(style, 'override style injected');
  // Keyed on the ORIGINAL attribute value: the rule keeps hitting whenever
  // ProseMirror's placeholder decoration resets the attribute.
  assert.match(style.textContent,
    /\[data-placeholder="问问 ChatGPT"\]::after\{content:"问问 Kimi"!important\}/);
  assert.doesNotMatch(style.textContent, /::before/, 'no ::before rule: the site renders ::after only');

  // Re-brand rewrites the rule from the remembered original.
  globalThis.getComputedStyle = (el, pseudo) =>
    ({ content: pseudo === '::after' ? '"问问 ChatGPT"' : 'none' });
  try {
    applyLogo(doc, CHATGPT_HOST, 'deepseek');
  } finally {
    delete globalThis.getComputedStyle;
  }
  assert.match(doc.querySelector('style[data-ai-copy-text]').textContent,
    /\[data-placeholder="问问 ChatGPT"\]::after\{content:"问问 DeepSeek"!important\}/);
});

test('ChatGPT: the override rule self-disables once the placeholder is gone', () => {
  const doc = parse(chatgptTextFixture);
  applyLogo(doc, CHATGPT_HOST, 'kimi');
  const p = doc.querySelector('p[data-placeholder]');
  // The user typed: ProseMirror drops data-placeholder (and the p's emptiness).
  p.removeAttribute('data-placeholder');
  applyLogo(doc, CHATGPT_HOST, 'kimi');
  // The rule is keyed on [data-placeholder=…], so it matches nothing — no
  // stale decoration on typed text.
  const style = doc.querySelector('style[data-ai-copy-text]');
  assert.ok(!style || !style.textContent.includes('::after'),
    'no override left without a placeholder');
});

test('ChatGPT: text swap is idempotent and re-brandable in place', () => {
  const doc = parse(chatgptTextFixture);
  applyLogo(doc, CHATGPT_HOST, 'kimi');
  const box = doc.querySelector('[data-testid="thread-disclaimer"]');

  applyLogo(doc, CHATGPT_HOST, 'kimi');
  assert.equal(box.textContent.trim(), 'Kimi 也可能会犯错。请核查重要信息。', 'disclaimer settles');
  assert.equal(doc.querySelector('p[data-placeholder]').getAttribute('data-placeholder'),
    '问问 Kimi', 'placeholder settles');

  applyLogo(doc, CHATGPT_HOST, 'deepseek');
  assert.equal(box.textContent.trim(), 'DeepSeek 也可能会犯错。请核查重要信息。', 're-brand from the remembered original');
  assert.equal(doc.querySelector('p[data-placeholder]').getAttribute('data-placeholder'),
    '问问 DeepSeek', 'placeholder re-branded from the remembered original');
  assert.equal([...doc.querySelectorAll('p[data-placeholder]')][1].textContent, '问问 DeepSeek');
});

test('ChatGPT: a re-rendered disclaimer (fresh text node with the site copy) is re-swapped', () => {
  const doc = parse(chatgptTextFixture);
  applyLogo(doc, CHATGPT_HOST, 'kimi');
  const inner = doc.querySelector('[data-testid="thread-disclaimer"] .text-caption-regular');
  // React re-render: the old div (and its swapped text node) is replaced by a
  // fresh div carrying the site's original copy from React's state.
  inner.firstElementChild.remove();
  const fresh = doc.createElement('div');
  fresh.textContent = 'ChatGPT 也可能会犯错。请核查重要信息。';
  inner.appendChild(fresh);

  applyLogo(doc, CHATGPT_HOST, 'kimi');
  assert.equal(doc.querySelector('[data-testid="thread-disclaimer"]').textContent.trim(),
    'Kimi 也可能会犯错。请核查重要信息。');
});

test('ChatGPT: a re-rendered placeholder (ProseMirror reset) is re-swapped', () => {
  const doc = parse(chatgptTextFixture);
  applyLogo(doc, CHATGPT_HOST, 'kimi');
  const pm = doc.querySelector('#prompt-textarea');
  // ProseMirror re-render: a fresh p with the site's original copy.
  pm.querySelector('p[data-placeholder]').remove();
  const fresh = doc.createElement('p');
  fresh.className = 'placeholder';
  fresh.setAttribute('data-placeholder', '问问 ChatGPT');
  fresh.textContent = '问问 ChatGPT';
  pm.appendChild(fresh);

  applyLogo(doc, CHATGPT_HOST, 'kimi');
  assert.equal(fresh.getAttribute('data-placeholder'), '问问 Kimi', 'attribute re-swapped');
  assert.equal(fresh.textContent, '问问 Kimi', 'text re-swapped');
});

test('ChatGPT: the disclaimer swap is locale-agnostic (en copy works too)', () => {
  const doc = parse(chatgptTextFixture);
  doc.querySelector('[data-testid="thread-disclaimer"] .text-caption-regular')
    .textContent = 'ChatGPT can make mistakes. Check for important info.';

  applyLogo(doc, CHATGPT_HOST, 'kimi');
  assert.equal(doc.querySelector('[data-testid="thread-disclaimer"]').textContent.trim(),
    'Kimi can make mistakes. Check for important info.');
});

test('ChatGPT: restoreLogos puts the placeholder + disclaimer back', () => {
  const doc = parse(chatgptTextFixture);
  applyLogo(doc, CHATGPT_HOST, 'deepseek');
  globalThis.getComputedStyle = (el, pseudo) =>
    ({ content: pseudo === '::after' ? '"问问 ChatGPT"' : 'none' });
  try {
    applyLogo(doc, CHATGPT_HOST, 'kimi');
    restoreLogos(doc);
  } finally {
    delete globalThis.getComputedStyle;
  }

  assert.equal(doc.querySelector('style[data-ai-copy-text]'), null, 'override style removed');
  assert.equal(doc.querySelector('[data-testid="thread-disclaimer"]').textContent.trim(),
    'ChatGPT 也可能会犯错。请核查重要信息。', 'disclaimer restored');
  const [pAttrOnly, pWithText] = doc.querySelectorAll('p[data-placeholder]');
  assert.equal(pAttrOnly.getAttribute('data-placeholder'), '问问 ChatGPT', 'attr-only variant restored');
  assert.equal(pWithText.getAttribute('data-placeholder'), '问问 ChatGPT', 'text variant attribute restored');
  assert.equal(pWithText.textContent, '问问 ChatGPT', 'text variant real text restored');

  applyLogo(doc, CHATGPT_HOST, 'kimi');
  assert.equal(doc.querySelector('p[data-placeholder]').getAttribute('data-placeholder'),
    '问问 Kimi', 're-applies after restore');
});

test('ChatGPT text swap: other hosts are a no-op', () => {
  const doc = parse(chatgptTextFixture);
  applyLogo(doc, 'gemini.google.com', 'kimi');
  applyLogo(doc, 'kimi.moonshot.cn', 'deepseek');
  const p = doc.querySelector('p[data-placeholder]');
  assert.equal(p.getAttribute('data-placeholder'), '问问 ChatGPT');
  assert.match(doc.querySelector('[data-testid="thread-disclaimer"]').textContent.trim(), /^ChatGPT/);
});

test('Gemini: composer placeholder + hallucination disclaimer follow the brand name', () => {
  const doc = parse(geminiTextFixture);
  applyLogo(doc, GEMINI_HOST, 'kimi');

  // Placeholder: the Quill editor's data-placeholder is swapped in place
  // (feeds the site's content:attr(data-placeholder) rules on BOTH the
  // visible ::before and the hidden ::after).
  const editor = doc.querySelector('.ql-editor[data-placeholder]');
  assert.equal(editor.getAttribute('data-placeholder'), '问问 Kimi');

  // Disclaimer: the text node inside <hallucination-disclaimer> rewritten.
  const box = doc.querySelector('hallucination-disclaimer');
  assert.equal(box.textContent.trim(), 'Kimi 是一款 AI 工具，其回答未必正确无误。');

  // Nothing else carrying the name may be touched: the conversation body
  // and the aria-labels stay exactly as the site has them, and a
  // placeholder without the site name is not swapped.
  assert.equal(doc.querySelector('.markdown p').textContent, 'Gemini 是 Google 推出的 AI 模型。');
  assert.equal(editor.getAttribute('aria-label'), '为 Gemini 输入提示');
  assert.equal(doc.querySelector('input[data-placeholder]').getAttribute('data-placeholder'), '搜索对话');
});

test('Gemini: text swap is idempotent and re-brandable in place', () => {
  const doc = parse(geminiTextFixture);
  applyLogo(doc, GEMINI_HOST, 'kimi');
  const editor = doc.querySelector('.ql-editor[data-placeholder]');
  const box = doc.querySelector('hallucination-disclaimer');

  applyLogo(doc, GEMINI_HOST, 'kimi');
  assert.equal(editor.getAttribute('data-placeholder'), '问问 Kimi', 'placeholder settles');
  assert.equal(box.textContent.trim(), 'Kimi 是一款 AI 工具，其回答未必正确无误。', 'disclaimer settles');

  applyLogo(doc, GEMINI_HOST, 'deepseek');
  assert.equal(editor.getAttribute('data-placeholder'), '问问 DeepSeek', 'placeholder re-branded');
  assert.equal(box.textContent.trim(), 'DeepSeek 是一款 AI 工具，其回答未必正确无误。', 'disclaimer re-branded');
});

test('Gemini: the content-override covers the rendered pseudo-elements', () => {
  const doc = parse(geminiTextFixture);
  // Gemini renders the placeholder through ::before (visible) AND ::after
  // (a visibility:hidden measurement hack) — both computed as live.
  globalThis.getComputedStyle = (el, pseudo) =>
    ({ content: pseudo === '::before' || pseudo === '::after' ? '"问问 Gemini"' : 'none' });
  try {
    applyLogo(doc, GEMINI_HOST, 'kimi');
  } finally {
    delete globalThis.getComputedStyle;
  }

  const style = doc.querySelector('style[data-ai-copy-text]');
  assert.ok(style, 'override style injected');
  assert.match(style.textContent,
    /\[data-placeholder="问问 Gemini"\]::before\{content:"问问 Kimi"!important\}/);
  assert.match(style.textContent,
    /\[data-placeholder="问问 Gemini"\]::after\{content:"问问 Kimi"!important\}/);
  // The placeholder without the site name gets no rule.
  assert.doesNotMatch(style.textContent, /搜索/);
});

test('Gemini: restoreLogos puts the placeholder + disclaimer back', () => {
  const doc = parse(geminiTextFixture);
  applyLogo(doc, GEMINI_HOST, 'deepseek');
  restoreLogos(doc);

  assert.equal(doc.querySelector('.ql-editor[data-placeholder]').getAttribute('data-placeholder'),
    '问问 Gemini', 'placeholder restored');
  assert.equal(doc.querySelector('hallucination-disclaimer').textContent.trim(),
    'Gemini 是一款 AI 工具，其回答未必正确无误。', 'disclaimer restored');
  assert.equal(doc.querySelector('style[data-ai-copy-text]'), null, 'override style removed');

  applyLogo(doc, GEMINI_HOST, 'kimi');
  assert.equal(doc.querySelector('.ql-editor[data-placeholder]').getAttribute('data-placeholder'),
    '问问 Kimi', 're-applies after restore');
});

test('ChatGPT: one failing step does not block the others', () => {
  const doc = parse(chatgptTextFixture);
  // Simulate a live-DOM exception in the disclaimer step (e.g. React raced
  // our write); the placeholder step must still have been applied.
  const qsa = doc.querySelectorAll.bind(doc);
  doc.querySelectorAll = (sel) => {
    if (String(sel).includes('thread-disclaimer')) throw new TypeError('boom');
    return qsa(sel);
  };
  try {
    applyLogo(doc, CHATGPT_HOST, 'kimi');
  } finally {
    delete doc.querySelectorAll;
  }
  assert.equal(doc.querySelector('p[data-placeholder]').getAttribute('data-placeholder'),
    '问问 Kimi', 'placeholder swapped despite the disclaimer step throwing');
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
