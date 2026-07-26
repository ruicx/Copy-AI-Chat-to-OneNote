import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseHTML } from 'linkedom';
import { htmlToMd, setNodeDomParser } from '../src/converter.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = readFileSync(join(__dirname, 'fixtures/chatgpt-sample.html'), 'utf8');

// Inject linkedom as the DOM backend for converter (when given a string).
setNodeDomParser((html) => {
  const { document } = parseHTML(`<body>${html}</body>`);
  return document.querySelector('body');
});

// Load the adapter in a linkedom-backed "document".
const { document } = parseHTML(fixture);
globalThis.document = document;

const adapter = (await import('../src/platforms/chatgpt.js')).default;

test('adapter finds all 4 turns', () => {
  const els = adapter.getMessageElements();
  assert.equal(els.length, 4);
});

test('adapter distinguishes user vs assistant', () => {
  const msgs = adapter.getMessages();
  assert.equal(msgs.length, 4);
  assert.equal(msgs[0].role, 'user');
  assert.equal(msgs[1].role, 'assistant');
  assert.equal(msgs[2].role, 'user');
  assert.equal(msgs[3].role, 'assistant');
});

test('getRole reports correct role per element', () => {
  const els = adapter.getMessageElements();
  assert.equal(adapter.getRole(els[0]), 'user');
  assert.equal(adapter.getRole(els[1]), 'assistant');
});

test('assistant content is the .markdown node', () => {
  const msgs = adapter.getMessages();
  const a1 = msgs[1].el;
  assert.ok(a1.classList.contains('markdown'), 'should be the .markdown node');
  assert.ok(a1.querySelector('h2'), 'contains the heading');
});

test('user content is the .whitespace-pre-wrap node', () => {
  const msgs = adapter.getMessages();
  const u1 = msgs[0].el;
  assert.ok(u1.classList.contains('whitespace-pre-wrap'));
  assert.match(u1.textContent, /列表推导式/);
});

test('end-to-end: assistant turn converts to clean markdown', () => {
  const msgs = adapter.getMessages();
  const md = htmlToMd(msgs[1].el);
  assert.match(md, /## 什么是列表推导式/);
  assert.match(md, /\*\*一行\*\*/);
  assert.match(md, /```python/);
  assert.match(md, /squares = \[x\*x for x in range\(10\)\]/);
  assert.match(md, /\| 写法 \| 行数 \| 可读性 \|/);
  assert.match(md, /- 适合简单变换/);
  assert.match(md, /> 简单即美。/);
  assert.match(md, /\[官方文档\]\(https:\/\/docs\.python\.org/);
});

test('end-to-end: conversation has 4 framed messages', () => {
  const msgs = adapter.getMessages();
  const md = msgs.map(m => `[${m.role}] ${htmlToMd(m.el).slice(0, 20)}`).join('\n');
  assert.match(md, /\[user\]/);
  assert.match(md, /\[assistant\]/);
  assert.equal((md.match(/\[user\]/g) || []).length, 2);
  assert.equal((md.match(/\[assistant\]/g) || []).length, 2);
});
