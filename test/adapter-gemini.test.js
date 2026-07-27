import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseHTML } from 'linkedom';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = readFileSync(join(__dirname, 'fixtures/gemini-toolbar.html'), 'utf8');

// Load the adapter in a linkedom-backed "document" holding the toolbar fixture.
const { document } = parseHTML(fixture);
globalThis.document = document;

const adapter = (await import('../src/platforms/gemini.js')).default;

test('adapter name and host', () => {
  assert.equal(adapter.name, 'Gemini');
  assert.ok(adapter.host.includes('gemini.google.com'));
});

test('adapter finds both turns (user-query + model-response)', () => {
  const els = adapter.getMessageElements();
  assert.equal(els.length, 2);
});

test('adapter distinguishes user vs assistant', () => {
  const msgs = adapter.getMessages();
  assert.equal(msgs.length, 2);
  assert.equal(msgs[0].role, 'user');
  assert.equal(msgs[1].role, 'assistant');
});

test('adapter resolves content nodes (.query-text / .markdown)', () => {
  const msgs = adapter.getMessages();
  assert.match(msgs[0].el.className, /query-text/);
  assert.match(msgs[1].el.className, /markdown/);
});

test('getNativeToolbars finds the model-response action row', () => {
  const bars = adapter.getNativeToolbars();
  // One model toolbar (copy-button) + one user toolbar (prompt-copy-button).
  assert.equal(bars.length, 2);
  const modelBar = bars.find(b => b.role === 'assistant');
  assert.ok(modelBar, 'has assistant toolbar');
  // Toolbar is the buttons-container-v2 (where buttons get appended).
  assert.match(modelBar.toolbar.className, /buttons-container-v2/);
  // Content resolves to the .markdown node of the model-response.
  assert.match(modelBar.content.className, /markdown/);
});

test('AI toolbar anchors insertAfter at the <copy-button> wrapper (left-side placement)', () => {
  // The AI toolbar's direct children are wrapper elements:
  //   <thumb-up-button> <thumb-down-button> <copy-button> <div menu-group> …
  // Gemini's copy gem-icon-button (data-test-id=copy-button) lives INSIDE the
  // <copy-button> wrapper. Our anchor must be that WRAPPER (a direct child of
  // the toolbar) so insertAfter places us BETWEEN copy-button and the
  // menu-group — NOT appended past the menu-group on the right, and NOT
  // nested inside the copy-button wrapper.
  const bars = adapter.getNativeToolbars();
  const modelBar = bars.find(b => b.role === 'assistant');
  assert.ok(modelBar.insertAfter, 'AI toolbar has insertAfter anchor');
  // The anchor is the <copy-button> wrapper element...
  assert.equal(modelBar.insertAfter.tagName.toLowerCase(), 'copy-button');
  // ...which is a DIRECT child of the toolbar (so afterend lands in the right slot).
  assert.equal(modelBar.insertAfter.parentElement, modelBar.toolbar);
  // ...and it CONTAINS Gemini's copy gem-icon-button.
  assert.ok(modelBar.insertAfter.querySelector('[data-test-id="copy-button"]'),
    'anchor wraps the native copy button');
});

test('user toolbar appends at the END (no insertAfter, lands after 修改提示)', () => {
  // The user toolbar is a flat row (复制提示, 修改提示, …) with no right-side
  // menu group. Appending at the end is correct; anchoring on the copy button
  // would wrongly land BETWEEN 复制提示 and 修改提示.
  const bars = adapter.getNativeToolbars();
  const userBar = bars.find(b => b.role === 'user');
  assert.ok(!userBar.insertAfter, 'user toolbar must NOT anchor insertAfter');
});

test('adapter configures Material-style tooltip (below, regular weight)', () => {
  // Gemini's own tooltips pop BELOW the button with regular-weight text; our
  // tooltip must match so it doesn't look out of place.
  assert.equal(adapter.tooltipStyle.position, 'below');
  assert.equal(adapter.tooltipStyle.fontWeight, '400');
});

test('getNativeToolbars finds the user-prompt action row', () => {
  const bars = adapter.getNativeToolbars();
  const userBar = bars.find(b => b.role === 'user');
  assert.ok(userBar, 'has user toolbar');
  assert.match(userBar.toolbar.className, /luminous-actions-container/);
  assert.match(userBar.content.className, /query-text/);
});

test('makeNativeButton clones a gem-icon-button and swaps in our SVG', () => {
  const bars = adapter.getNativeToolbars();
  const modelBar = bars.find(b => b.role === 'assistant');
  const btn = adapter.makeNativeButton(modelBar.toolbar, '复制本条到 OneNote', false);
  // The cloned node keeps the gem-icon-button wrapper (Gemini's structure).
  const tag = btn.tagName.toLowerCase();
  assert.ok(tag === 'gem-icon-button' || tag === 'button',
    'returns a gem-icon-button (or fallback button): ' + tag);
  // aria-label is set to our title.
  const label = btn.getAttribute('arialabel') ||
    btn.querySelector('button')?.getAttribute('aria-label') || '';
  assert.match(label, /复制本条到 OneNote/);
  // Our heroicons SVG replaced the mat-icon ligature — the lumino <mat-icon>
  // (which would draw Gemini's own icon via its font) must be GONE, and our
  // SVG must be present.
  assert.ok(btn.querySelector('svg path'), 'has the heroicons SVG');
  assert.ok(!btn.querySelector('mat-icon'), 'mat-icon ligature removed');
  assert.ok(!btn.querySelector('.lumi-symbols'), 'no lumino font class left');
});

test('makeNativeButton for the turn (double icon) uses the clipboard+document path', () => {
  const bars = adapter.getNativeToolbars();
  const userBar = bars.find(b => b.role === 'user');
  const btn = adapter.makeNativeButton(userBar.toolbar, '复制本轮到 OneNote', true);
  const label = btn.getAttribute('arialabel') ||
    btn.querySelector('button')?.getAttribute('aria-label') || '';
  assert.match(label, /复制本轮到 OneNote/);
  assert.ok(btn.querySelector('svg path'), 'has the heroicons SVG');
});
