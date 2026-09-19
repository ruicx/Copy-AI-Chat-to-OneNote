import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseHTML } from 'linkedom';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = readFileSync(join(__dirname, 'fixtures/kimi-sample.html'), 'utf8');

// Load the adapter in a linkedom-backed "document" holding the Kimi fixture.
const { document } = parseHTML(fixture);
globalThis.document = document;

const adapter = (await import('../src/platforms/kimi.js')).default;
const { t } = await import('../src/i18n.js');

test('adapter name and hosts (www.kimi.com + legacy moonshot)', () => {
  assert.equal(adapter.name, 'Kimi');
  assert.ok(adapter.host.includes('www.kimi.com'));
  assert.ok(adapter.host.includes('kimi.moonshot.cn'));
});

test('adapter finds all four turns (segments)', () => {
  assert.equal(adapter.getMessageElements().length, 4);
});

test('adapter distinguishes user vs assistant via segment classes', () => {
  const msgs = adapter.getMessages();
  assert.deepEqual(msgs.map(m => m.role), ['user', 'assistant', 'user', 'assistant']);
});

test('assistant content excludes the thinking/toolcall markdown', () => {
  const msgs = adapter.getMessages();
  // The user content is the plain-text span.
  assert.match(msgs[0].el.getAttribute('class'), /user-content__text/);
  assert.match(msgs[0].el.textContent, /tampermonkey/);
  // The assistant content is the ANSWER .markdown, not the reasoning one
  // inside .thinking-container / .toolcall-flow.
  assert.match(msgs[1].el.getAttribute('class'), /markdown/);
  assert.match(msgs[1].el.textContent, /OneNote 格式测试文档/);
  assert.doesNotMatch(msgs[1].el.textContent, /The user wants/);
  // Second answer carries the math test content.
  assert.match(msgs[3].el.textContent, /数学公式测试/);
  assert.doesNotMatch(msgs[3].el.textContent, /Kimi should/);
});

test('getNativeToolbars finds all four action bars', () => {
  const bars = adapter.getNativeToolbars();
  assert.equal(bars.length, 4);
  const userBars = bars.filter(b => b.role === 'user');
  const asstBars = bars.filter(b => b.role === 'assistant');
  assert.equal(userBars.length, 2);
  assert.equal(asstBars.length, 2);
  // User bar holds the native trio (simple-buttons); assistant bar holds the
  // copy icon-button.
  assert.equal(userBars[0].toolbar.querySelectorAll('.simple-button').length, 3);
  assert.ok(asstBars[0].toolbar.querySelector('.icon-button svg[name="Copy"]'));
});

test('insertAfter anchors on the native Copy button (both roles)', () => {
  const bars = adapter.getNativeToolbars();
  for (const bar of bars) {
    assert.ok(bar.insertAfter, `${bar.role} bar has an insertAfter anchor`);
    // The anchor is the site's button element (simple-button in the user
    // bar, icon-button in the assistant bar) wrapping the Copy svg.
    assert.match(bar.insertAfter.getAttribute('class'), /simple-button|icon-button/);
    const svg = bar.insertAfter.querySelector('svg');
    assert.equal(svg.getAttribute('name'), 'Copy');
    // The anchor sits inside the toolbar we insert into.
    assert.ok(bar.toolbar.contains(bar.insertAfter));
  }
  // User bar order: Edit, Copy, Share — our button lands between Copy and Share.
  const userBar = bars.find(b => b.role === 'user');
  const kids = [...userBar.toolbar.children];
  assert.equal(kids.indexOf(userBar.insertAfter), 1);
});

test('makeNativeButton clones the native button and swaps in our clipboard svg', () => {
  const bars = adapter.getNativeToolbars();
  const asstBar = bars.find(b => b.role === 'assistant');
  const btn = adapter.makeNativeButton(asstBar.toolbar, '复制本条到 OneNote', false);
  // Inherits the native component classes AND the Vue scoped-CSS ids.
  assert.match(btn.getAttribute('class'), /icon-button/);
  assert.ok([...btn.attributes].some(a => /^data-v-/.test(a.name)),
    'keeps data-v-* scoped style attributes');
  // Our heroicons clipboard svg replaced the iconify glyph.
  const svg = btn.querySelector('svg');
  assert.ok(svg, 'has an svg');
  assert.equal(svg.getAttribute('viewBox'), '0 0 24 24');
  assert.equal(svg.getAttribute('stroke'), 'currentColor');
  assert.equal(svg.getAttribute('width'), '16');
  assert.equal(svg.getAttribute('name'), null, 'iconify name attr is gone');
  assert.match(svg.getAttribute('class'), /iconify/);
  assert.equal(btn.getAttribute('aria-label'), '复制本条到 OneNote');
  // The user bar clones the .simple-button flavour and relabels the pill
  // span (cloning the FIRST button would inherit "编辑" — the bug this
  // guards against).
  const userBar = bars.find(b => b.role === 'user');
  const ubtn = adapter.makeNativeButton(userBar.toolbar, 'x', true);
  assert.match(ubtn.getAttribute('class'), /simple-button/);
  assert.equal(ubtn.querySelector('span').textContent, t('pillTurn'));
  const ubtnSingle = adapter.makeNativeButton(userBar.toolbar, 'x', false);
  assert.equal(ubtnSingle.querySelector('span').textContent, t('pillOne'));
  assert.ok(ubtn.querySelector('svg path').getAttribute('d').length > 100,
    'turn variant carries the clipboard-document path');
});

test('injected buttons land right after the native copy button', () => {
  const bars = adapter.getNativeToolbars();
  const asstBar = bars.find(b => b.role === 'assistant');
  const btn = adapter.makeNativeButton(asstBar.toolbar, 'x', false);
  asstBar.insertAfter.insertAdjacentElement('afterend', btn);
  const kids = [...asstBar.toolbar.children];
  assert.equal(kids[0], asstBar.insertAfter);
  assert.equal(kids[1], btn);
});
