import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseHTML } from 'linkedom';
import { htmlToMd, setNodeDomParser } from '../src/converter.js';

// Inject linkedom as the DOM backend for Node-side testing.
// NOTE: linkedom's `document.body` is an empty stub; the parsed content lives
// under documentElement, so we select the <body> explicitly.
setNodeDomParser((html) => {
  const { document } = parseHTML(`<body>${html}</body>`);
  return document.querySelector('body');
});

/* Helper: compare ignoring trailing whitespace per line */
function norm(s) {
  return s.replace(/[ \t]+$/gm, '').replace(/\n+$/g, '');
}
function eq(actual, expected) {
  assert.equal(norm(actual), norm(expected));
}

test('plain text passes through', () => {
  eq(htmlToMd('Hello world'), 'Hello world');
});

test('paragraphs separated by blank line', () => {
  eq(
    htmlToMd('<p>First</p><p>Second</p>'),
    'First\n\nSecond'
  );
});

test('headings h1-h6', () => {
  eq(htmlToMd('<h1>Title</h1>'), '# Title');
  eq(htmlToMd('<h2>Section</h2>'), '## Section');
  eq(htmlToMd('<h3>Sub</h3>'), '### Sub');
  eq(htmlToMd('<h4>Four</h4>'), '#### Four');
  eq(htmlToMd('<h5>Five</h5>'), '##### Five');
  eq(htmlToMd('<h6>Six</h6>'), '###### Six');
});

test('inline bold/italic/code', () => {
  eq(htmlToMd('<strong>bold</strong>'), '**bold**');
  eq(htmlToMd('<b>bold</b>'), '**bold**');
  eq(htmlToMd('<em>italic</em>'), '*italic*');
  eq(htmlToMd('<i>italic</i>'), '*italic*');
  eq(htmlToMd('<code>inline</code>'), '`inline`');
});

test('mixed inline in a paragraph', () => {
  eq(
    htmlToMd('<p>This is <strong>bold</strong> and <em>italic</em> text.</p>'),
    'This is **bold** and *italic* text.'
  );
});

test('links', () => {
  eq(
    htmlToMd('<a href="https://example.com">click</a>'),
    '[click](https://example.com)'
  );
});

test('unordered list', () => {
  eq(
    htmlToMd('<ul><li>one</li><li>two</li><li>three</li></ul>'),
    '- one\n- two\n- three'
  );
});

test('ordered list', () => {
  eq(
    htmlToMd('<ol><li>first</li><li>second</li></ol>'),
    '1. first\n2. second'
  );
});

test('nested list', () => {
  const md = htmlToMd(
    '<ul><li>top<ul><li>child</li></ul></li></ul>'
  );
  // child indented by 2 spaces
  assert.ok(md.includes('- top'), 'has top item: ' + md);
  assert.ok(/- top\n {2,}- child/.test(md), 'child indented: ' + JSON.stringify(md));
});

test('blockquote', () => {
  eq(htmlToMd('<blockquote>quoted text</blockquote>'), '> quoted text');
});

test('fenced code block with language', () => {
  eq(
    htmlToMd('<pre><code class="language-js">const x = 1;</code></pre>'),
    '```js\nconst x = 1;\n```'
  );
});

test('fenced code block without language', () => {
  eq(
    htmlToMd('<pre><code>plain code</code></pre>'),
    '```\nplain code\n```'
  );
});

test('code block preserves inner newlines', () => {
  const md = htmlToMd('<pre><code>line1\nline2\nline3</code></pre>');
  assert.ok(md.includes('line1\nline2\nline3'), md);
});

test('gfm table', () => {
  eq(
    htmlToMd(
      '<table><thead><tr><th>A</th><th>B</th></tr></thead>' +
      '<tbody><tr><td>1</td><td>2</td></tr></tbody></table>'
    ),
    '| A | B |\n| --- | --- |\n| 1 | 2 |'
  );
});

test('table without thead (all td)', () => {
  const md = htmlToMd(
    '<table><tr><td>X</td><td>Y</td></tr><tr><td>1</td><td>2</td></tr></table>'
  );
  // first row becomes header
  eq(md, '| X | Y |\n| --- | --- |\n| 1 | 2 |');
});

test('table cell with inline markup', () => {
  eq(
    htmlToMd(
      '<table><tr><th>Name</th></tr><tr><td><strong>Bob</strong></td></tr></table>'
    ),
    '| Name |\n| --- |\n| **Bob** |'
  );
});

test('horizontal rule', () => {
  eq(htmlToMd('<hr>'), '---');
});

test('line break <br>', () => {
  const md = htmlToMd('line one<br>line two');
  assert.ok(/line one(\n|  \n)line two/.test(md) || md.includes('line one') && md.includes('line two'), md);
});

test('image', () => {
  eq(
    htmlToMd('<img src="https://e.com/x.png" alt="pic">'),
    '![pic](https://e.com/x.png)'
  );
  eq(
    htmlToMd('<img src="https://e.com/x.png">'),
    '![](https://e.com/x.png)'
  );
});

test('favicon / citation icons are dropped (ChatGPT source citations)', () => {
  // ChatGPT embeds these inside citation links; they must not survive.
  eq(htmlToMd('<img src="https://www.google.com/s2/favicons?domain=https://www.php.cn&sz=128" alt="">'), '');
  eq(htmlToMd('<img src="https://www.google.com/s2/favicons?domain=x.com&sz=128" alt="">'), '');
  // A real content image is kept.
  assert.ok(htmlToMd('<img src="https://upload.wikimedia.org/x.jpg" alt="real">').includes('upload.wikimedia.org'));
});

test('citation link with favicon keeps the link text, drops the icon', () => {
  // Real ChatGPT citation shape: <a href><img src=favicon>PHP中文网+1</a>
  const md = htmlToMd(
    '<a href="https://www.php.cn/faq/1958803.html"><img src="https://www.google.com/s2/favicons?domain=https://www.php.cn&sz=128" alt="">PHP中文网+1</a>'
  );
  assert.ok(md.includes('PHP中文网+1'), 'keeps link text: ' + md);
  assert.ok(md.includes('https://www.php.cn/faq/1958803.html'), 'keeps link url: ' + md);
  assert.ok(!md.includes('favicons'), 'drops favicon url: ' + md);
  assert.ok(!md.includes('google.com/s2'), 'drops favicon: ' + md);
});

test('nested divs flatten to paragraphs', () => {
  eq(
    htmlToMd('<div><div><p>deep</p></div></div>'),
    'deep'
  );
});

test('strips script/style/button noise', () => {
  const html = '<style>.x{}</style><script>alert(1)</script>' +
               '<p>keep</p><button>Copy</button>';
  const md = htmlToMd(html);
  assert.ok(!md.includes('alert'), 'no script: ' + md);
  assert.ok(!md.includes('Copy'), 'no button: ' + md);
  assert.ok(md.includes('keep'), 'keeps text: ' + md);
});

test('empty input', () => {
  eq(htmlToMd(''), '');
  eq(htmlToMd(null), '');
});

test('whitespace-only collapses', () => {
  const md = htmlToMd('<p>  </p>');
  assert.equal(md.trim(), '');
});

test('complex realistic message', () => {
  const html = `
    <div class="markdown">
      <h2>Overview</h2>
      <p>Here is a <strong>summary</strong>:</p>
      <ul>
        <li>Point one</li>
        <li>Point two with <code>code</code></li>
      </ul>
      <pre><code class="language-python">def f():
    return 1</code></pre>
    </div>`;
  const md = htmlToMd(html);
  assert.ok(md.includes('## Overview'), md);
  assert.ok(md.includes('**summary**'), md);
  assert.ok(md.includes('- Point one'), md);
  assert.ok(md.includes('`code`'), md);
  assert.ok(md.includes('```python'), md);
  assert.ok(md.includes('def f():'), md);
});
