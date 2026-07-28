import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mdToOneNoteHtml } from '../src/renderer.js';

function render(md) {
  return mdToOneNoteHtml(md).replace(/\s+/g, ' ').trim();
}

test('renders heading with full OneNote heading style (size + color + margin)', () => {
  const h2 = mdToOneNoteHtml('## Section');
  // Must carry font-size + color + margin so OneNote maps it to a true heading style
  assert.match(h2, /<h2[^>]*style="[^"]*font-size:16pt/);
  assert.match(h2, /color:#1e4e79/i);
  assert.match(h2, /margin-top:11pt;margin-bottom:11pt/);
  assert.match(h2, /<h2[^>]*>Section<\/h2>/);
});

test('heading depth 1..6 each gets its own size', () => {
  const sizes = { 1: '20pt', 2: '16pt', 3: '14pt', 4: '12pt', 5: '11.5pt', 6: '11pt' };
  for (let d = 1; d <= 6; d++) {
    const h = mdToOneNoteHtml('#'.repeat(d) + ' T');
    assert.match(h, new RegExp(`font-size:${sizes[d]}`), `depth ${d} size`);
    assert.match(h, new RegExp(`<h${d}[^>]*>`), `depth ${d} tag`);
  }
});

test('table gets border attribute (not style border)', () => {
  const md = '| A | B |\n| --- | --- |\n| 1 | 2 |';
  const h = mdToOneNoteHtml(md);
  assert.match(h, /<table[^>]*border="1"/, 'has border attribute');
  assert.doesNotMatch(h, /<table[^>]*style="[^"]*border[^"]*"/, 'no border in style');
});

test('table cells survive', () => {
  const md = '| A | B |\n| --- | --- |\n| 1 | 2 |';
  const h = mdToOneNoteHtml(md);
  assert.match(h, /<th[^>]*>A<\/th>/);
  assert.match(h, /<td[^>]*>1<\/td>/);
});

test('code block becomes div with bg + monospace (no <pre> wrapper leak)', () => {
  const h = mdToOneNoteHtml('```js\nconst x = 1;\n```');
  // Must NOT be a bare <pre><code>...</code></pre>
  assert.doesNotMatch(h, /<pre><code/);
  // Must contain the OneNote-friendly wrapper
  assert.match(h, /background-color:\s*#f6f8fa/i);
  assert.match(h, /font-family:[^;"]*Consolas/i);
  // Language label present
  assert.match(h, /js/i);
  // Code content preserved
  assert.match(h, /const x = 1/);
});

test('code block without language', () => {
  const h = mdToOneNoteHtml('```\nplain\n```');
  assert.match(h, /background-color:\s*#f6f8fa/i);
  assert.match(h, /plain/);
});

test('inline bold/italic/code/links preserved', () => {
  const h = render('**b** *i* `c` [l](http://e.com)');
  assert.match(h, /<strong>b<\/strong>/);
  assert.match(h, /<em>i<\/em>/);
  assert.match(h, /<code>c<\/code>/);
  assert.match(h, /<a href="http:\/\/e\.com">l<\/a>/);
});

test('ordered and unordered lists', () => {
  const ul = render('- a\n- b');
  assert.match(ul, /<ul>\s*<li>a<\/li>\s*<li>b<\/li>\s*<\/ul>/);
  const ol = render('1. a\n2. b');
  assert.match(ol, /<ol>\s*<li>a<\/li>\s*<li>b<\/li>\s*<\/ol>/);
});

test('blockquote', () => {
  const h = render('> quoted');
  assert.match(h, /<blockquote[^>]*>[\s\S]*quoted[\s\S]*<\/blockquote>/);
});

test('horizontal rule', () => {
  const h = render('---');
  assert.match(h, /<hr/);
});

test('image', () => {
  const h = render('![alt](http://e.com/x.png)');
  assert.match(h, /<img src="http:\/\/e\.com\/x\.png" alt="alt"/);
});

test('paragraph wraps loose text', () => {
  const h = render('Just text');
  assert.match(h, /<p>Just text<\/p>/);
});

test('nested headings + list + code end-to-end', () => {
  const md = '## Overview\n\n- one\n- two\n\n```python\nprint(1)\n```';
  const h = mdToOneNoteHtml(md);
  assert.match(h, /<h2[^>]*>Overview<\/h2>/);
  assert.match(h, /<li>one<\/li>/);
  assert.match(h, /background-color:\s*#f6f8fa/i);
  assert.match(h, /print\(1\)/);
});

test('escapes table-breaking is not needed (converter guarantees clean md)', () => {
  // ensure renderer does not crash on empty input
  assert.equal(mdToOneNoteHtml('').trim(), '');
});

test('html entities in code are escaped', () => {
  const h = mdToOneNoteHtml('```\n<a>b & c</a>\n```');
  // angle brackets inside code must be escaped so they don't break OneNote
  assert.ok(!/<a>b/i.test(h.replace(/<div[^>]*code[^>]*>/, '')) || h.includes('&lt;a&gt;'), h);
  assert.match(h, /&lt;a&gt;/);
});

test('code-block leading spaces are encoded as &nbsp; (OneNote drops <pre>)', () => {
  // OneNote's paste path ignores `white-space` CSS and drops <pre> semantics,
  // so leading spaces would collapse to nothing on paste. The renderer must
  // encode each line's leading spaces as &nbsp; (which OneNote keeps verbatim)
  // so code indentation survives.
  const h = mdToOneNoteHtml('```python\ndef f():\n    return 1\n```');
  const preBody = h.match(/<pre[^>]*>([\s\S]*?)<\/pre>/)[1];
  // 4-space indent on the body line survives as 4 non-breaking spaces.
  assert.ok(preBody.includes('&nbsp;&nbsp;&nbsp;&nbsp;return 1'),
    '4-space indent encoded as &nbsp;: ' + preBody);
  // The 0-indent line is NOT prefixed with &nbsp;.
  assert.match(preBody, /(^|\n)def f\(\):/);
  // Still keeps escaping for any code special chars.
  assert.match(preBody, /return 1/);
});
