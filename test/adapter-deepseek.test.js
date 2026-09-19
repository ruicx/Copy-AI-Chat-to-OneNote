import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseHTML } from 'linkedom';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = readFileSync(join(__dirname, 'fixtures/deepseek-sample.html'), 'utf8');

// Load the adapter in a linkedom-backed "document" holding the DeepSeek fixture.
const { document } = parseHTML(fixture);
globalThis.document = document;

const adapter = (await import('../src/platforms/deepseek.js')).default;

test('adapter name and host', () => {
  assert.equal(adapter.name, 'DeepSeek');
  assert.ok(adapter.host.includes('chat.deepseek.com'));
});

test('adapter finds both turns (.ds-message)', () => {
  const els = adapter.getMessageElements();
  assert.equal(els.length, 2);
});

test('adapter distinguishes user vs assistant via content markers', () => {
  const msgs = adapter.getMessages();
  assert.equal(msgs.length, 2);
  assert.equal(msgs[0].role, 'user');
  assert.equal(msgs[1].role, 'assistant');
});

test('adapter resolves content nodes (.ds-collapsible-text / .ds-markdown)', () => {
  const msgs = adapter.getMessages();
  assert.match(msgs[0].el.getAttribute('class'), /ds-collapsible-text/);
  assert.match(msgs[1].el.getAttribute('class'), /ds-markdown/);
  // And the resolved content actually carries the turn's text.
  assert.match(msgs[0].el.textContent, /油猴脚本/);
  assert.match(msgs[1].el.textContent, /OneNote 富文本/);
});

test('getNativeToolbars finds both action bars', () => {
  const bars = adapter.getNativeToolbars();
  assert.equal(bars.length, 2);
  const userBar = bars.find(b => b.role === 'user');
  const asstBar = bars.find(b => b.role === 'assistant');
  assert.ok(userBar && asstBar);
  // Toolbar is the .ds-flex that directly holds the native ds-buttons.
  assert.match(asstBar.toolbar.getAttribute('class') || '', /ds-flex/);
  assert.equal(asstBar.toolbar.querySelectorAll('[role="button"].ds-button').length, 6);
  assert.equal(userBar.toolbar.querySelectorAll('[role="button"].ds-button').length, 2);
});

test('toolbar buttons exclude code-block banner buttons inside .ds-message', () => {
  // The code-block banners inside the assistant message carry ds-buttons of
  // their own (复制/下载). They must never be mistaken for the action bar.
  const bars = adapter.getNativeToolbars();
  const asstBar = bars.find(b => b.role === 'assistant');
  // The toolbar is NOT inside the message and holds no banner content.
  assert.equal(asstBar.toolbar.querySelector('.md-code-block'), null);
  assert.ok(!asstBar.toolbar.contains(asstBar.content));
});

test('insertAfter anchors on the native copy button (both roles)', () => {
  const bars = adapter.getNativeToolbars();
  for (const bar of bars) {
    assert.ok(bar.insertAfter, `${bar.role} bar has an insertAfter anchor`);
    // The anchor is the native copy ds-button (copy-icon path signature)…
    const d = bar.insertAfter.querySelector('svg path')?.getAttribute('d') || '';
    assert.match(d, /^M6\.14929 4\.02032/);
    // …is a DIRECT child of the toolbar (afterend lands in the right slot)…
    assert.equal(bar.insertAfter.parentElement, bar.toolbar);
    // …and sits FIRST in the bar (before our injected buttons would go).
    assert.equal(bar.toolbar.querySelector('[role="button"].ds-button'), bar.insertAfter);
  }
});

test('makeNativeButton clones a ds-button and swaps in our clipboard svg', () => {
  const bars = adapter.getNativeToolbars();
  const asstBar = bars.find(b => b.role === 'assistant');
  const btn = adapter.makeNativeButton(asstBar.toolbar, '复制本条到 OneNote', false);
  // Inherits the native ds-button classes (visual match).
  assert.match(btn.getAttribute('class'), /ds-button/);
  assert.match(btn.getAttribute('class'), /ds-button--icon/);
  // Our heroicons clipboard svg replaced the native glyph.
  const svg = btn.querySelector('svg');
  assert.ok(svg, 'has an svg');
  assert.equal(svg.getAttribute('viewBox'), '0 0 24 24');
  assert.equal(svg.getAttribute('stroke'), 'currentColor');
  assert.equal(svg.getAttribute('width'), '16');
  // No native copy path remains anywhere in the clone.
  const d = btn.querySelector('svg path')?.getAttribute('d') || '';
  assert.doesNotMatch(d, /^M6\.14929/);
  // aria-label carries our title.
  assert.equal(btn.getAttribute('aria-label'), '复制本条到 OneNote');
  // The double (copy-turn) variant uses the document icon — one path, not two.
  const turn = adapter.makeNativeButton(asstBar.toolbar, '复制本轮', true);
  assert.ok(turn.querySelector('svg path').getAttribute('d').length > 100);
});

test('injected buttons actually land next to the native copy button', () => {
  // Simulate ui.js's attach(): insert our cloned button after the anchor.
  const bars = adapter.getNativeToolbars();
  const asstBar = bars.find(b => b.role === 'assistant');
  const btn = adapter.makeNativeButton(asstBar.toolbar, 'x', false);
  asstBar.insertAfter.insertAdjacentElement('afterend', btn);
  const kids = [...asstBar.toolbar.children];
  assert.equal(kids[0], asstBar.insertAfter);
  assert.equal(kids[1], btn,
    'our button is the 2nd child, right after the native copy button');
});
