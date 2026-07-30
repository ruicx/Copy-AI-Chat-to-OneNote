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
  // Code content preserved (tokens are now wrapped in highlight spans, so
  // check the pieces rather than the literal "const x = 1" substring).
  assert.match(h, /const/);
  assert.match(h, /x = /);
  assert.match(h, /1/);
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
  // print(1) is now syntax-highlighted, so the tokens sit inside color spans;
  // assert the pieces survive rather than the literal "print(1)" substring.
  assert.match(h, /print/);
  assert.match(h, /\(/);
  assert.match(h, />1</);
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
  // so code indentation survives. The body is syntax-highlighted (python is a
  // registered language), so `return`/`f` sit inside <span> wrappers; the
  // leading-space encoding still has to reach the indented line.
  const h = mdToOneNoteHtml('```python\ndef f():\n    return 1\n```');
  const preBody = h.match(/<pre[^>]*>([\s\S]*?)<\/pre>/)[1];
  // 4-space indent on the body line survives as 4 non-breaking spaces,
  // immediately before the highlighted `return` token.
  assert.ok(preBody.includes('&nbsp;&nbsp;&nbsp;&nbsp;<span'),
    '4-space indent encoded as &nbsp; before the highlighted token: ' + preBody);
  // The 0-indent line is NOT prefixed with &nbsp;.
  assert.match(preBody, /(^|\n)<span/);
  // The code text still survives inside the highlight spans.
  assert.match(preBody, /return/);
  assert.match(preBody, /1/);
});

test('registered language produces inline-coloured syntax spans', () => {
  // highlight.js returns class-based tokens; OneNote keeps inline
  // style="color:..." but drops classes. The renderer must rewrite token
  // classes to inline colors AND strip the class attribute entirely.
  const h = mdToOneNoteHtml('```js\nconst x = 1;\n```');
  // keyword (const) and number (1) are both mapped token scopes.
  assert.match(h, /color:#d73a49/i, 'keyword coloured: ' + h);   // const
  assert.match(h, /color:#005cc5/i, 'number coloured: ' + h);    // 1
  // No hljs class must leak — OneNote would not colour it.
  assert.doesNotMatch(h, /class="hljs/, 'no hljs class leaked: ' + h);
});

test('unregistered language falls back to plain escaped text', () => {
  // A language highlight.js doesn't know must not throw — it renders as plain
  // (escaped) text, identical to pre-highlighting behaviour (zero regression).
  const h = mdToOneNoteHtml('```brainfuck\n+++<[>]\n```');
  assert.doesNotMatch(h, /<span style="color:/, 'no colour spans for unknown lang: ' + h);
  assert.match(h, /\+\+\+/, 'content preserved: ' + h);
  // Special chars are still HTML-escaped.
  assert.match(h, /&lt;\[&gt;\]/, 'special chars escaped: ' + h);
});

test('custom code font from localStorage leads the font-family stack', () => {
  // The user-configured font (set via the gear button) must come FIRST in the
  // font-family stack so it wins when installed, with Consolas as fallback.
  // Node has no localStorage by default, so stub a minimal one for this test.
  const store = {};
  const origLS = globalThis.localStorage;
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    },
  });
  try {
    store['ai-copy-code-font'] = 'Maple Mono NF CN';
    const h = mdToOneNoteHtml('```\nx\n```');
    assert.match(h, /font-family:'Maple Mono NF CN',Consolas,'Courier New',monospace/);
    // The custom font must precede the Consolas fallback.
    const stack = h.match(/font-family:([^;"]*)/)[1];
    assert.ok(stack.indexOf('Maple Mono NF CN') < stack.indexOf('Consolas'),
      'custom font precedes Consolas: ' + stack);

    // Clearing the setting restores the default stack (no custom font).
    delete store['ai-copy-code-font'];
    const h2 = mdToOneNoteHtml('```\nx\n```');
    assert.doesNotMatch(h2, /Maple Mono/);
    assert.match(h2, /font-family:Consolas,'Courier New',monospace/);
  } finally {
    // Restore (or remove) so other tests aren't affected.
    if (origLS === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = origLS;
  }
});

test('block math ($$...$$) renders to Presentation MathML', () => {
  // OneNote converts embedded <math>...</math> blocks to native equations on
  // paste (see Microsoft's MathML support doc). The renderer must emit a real
  // <math> element — NOT KaTeX's HTML+CSS render, which OneNote would collapse
  // to plain text (it drops classes and <style>).
  const h = mdToOneNoteHtml('$$\\frac{n(n+1)}{2}$$');
  assert.match(h, /<math[^>]*>/, 'emits a <math> element: ' + h);
  assert.match(h, /<mfrac>/, 'contains a fraction element: ' + h);
  // Block math should carry display="block" (display-mode equation).
  assert.match(h, /display="block"/, 'block math is display-mode: ' + h);
});

test('inline math ($...$) renders to inline MathML', () => {
  const h = mdToOneNoteHtml('energy is $E = mc^2$ today');
  assert.match(h, /<math[^>]*>/, 'emits a <math> element: ' + h);
  assert.match(h, /msup/, 'contains a superscript (the ^2): ' + h);
  // Inline math must NOT be display-mode.
  assert.doesNotMatch(h, /display="block"/, 'inline math is not display-mode: ' + h);
  // Surrounding text survives on the same line (stays inside the paragraph).
  assert.match(h, /energy is/);
  assert.match(h, /today/);
});

test('$ inside a fenced code block is NOT converted to math', () => {
  // A `$` that is literal code must survive untouched. Because math is
  // registered as a marked extension, marked tokenises the code fence first and
  // the inline tokenizer never sees its contents — so this should "just work".
  const h = mdToOneNoteHtml('```js\nconst price = "$5";\n```');
  assert.doesNotMatch(h, /<math/, 'no math element for code-fence $: ' + h);
  assert.match(h, /\$5/, 'the literal $5 survives in the code body');
});

test('bare currency $5 in text is not turned into math', () => {
  // A lone `$` with no closing `$` must not open a math span.
  const h = mdToOneNoteHtml('costs $5 today');
  assert.doesNotMatch(h, /<math/, 'no math element for bare $5: ' + h);
  assert.match(h, /\$5/);
});
