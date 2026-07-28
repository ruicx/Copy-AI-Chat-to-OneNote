import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseHTML } from 'linkedom';
import { readFileSync } from 'node:fs';
import { htmlToMd, setNodeDomParser } from '../src/converter.js';
import { setLocale } from '../src/i18n.js';

// Pin locale to zh so the image-placeholder assertions (🖼️ [图片 …]) hold.
// Node has no navigator.language, so getLocale() would otherwise default to
// 'en' and produce "Image …". The en path is covered in i18n.test.js.
setLocale('zh');

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

test('real blockquote stays a Markdown quote (preserves indentation in OneNote)', () => {
  // A genuine quotation (model quoting a source, user's own example) must keep
  // its "> quote" form so OneNote renders it as a proper indented quote block.
  eq(htmlToMd('<blockquote>quoted text</blockquote>'), '> quoted text');
  // Multi-paragraph real quotes keep the marker on every line.
  const md = htmlToMd('<blockquote><p>line one</p><p>line two</p></blockquote>');
  assert.match(md, /^> line one$/m);
  assert.match(md, /^> line two$/m);
});

test('Gemini image-description blockquote is flattened (not a real quote)', () => {
  // Gemini wraps each AI image's description in a <blockquote> for caption
  // STYLING — it sits right after the image. Rendering that as "> quote"
  // made OneNote indent the description (looked like a stray indent). It
  // must flatten to plain text instead. Two detection signals:
  // (a) previous sibling is an image element, (b) first <p> starts with a
  // bold "图像描述：" / "Image description:" label.
  const bySibling = htmlToMd(
    '<single-image><img src="data:image/png;base64,AAAA"></single-image>' +
    '<blockquote><p>这是图片的描述文字。</p></blockquote>'
  );
  assert.match(bySibling, /这是图片的描述文字。/);
  assert.doesNotMatch(bySibling, /^>/m, 'caption-by-sibling must not be a quote: ' + bySibling);

  const byLabel = htmlToMd(
    '<blockquote><p><b>图像描述：</b> 这是一张截图。</p></blockquote>'
  );
  assert.match(byLabel, /这是一张截图/);
  assert.doesNotMatch(byLabel, /^>/m, 'caption-by-label must not be a quote: ' + byLabel);
  // English label works too.
  assert.doesNotMatch(
    htmlToMd('<blockquote><p><strong>Image description:</strong> a shot.</p></blockquote>'),
    /^>/m
  );
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

test('Gemini <code-block> custom element converts to a fenced block', () => {
  // Real Gemini DOM: language label in a bare <span> in the header
  // decoration, plus copy/download buttons whose aria-labels must NOT leak.
  // Before the fix, this fell through to the default case and fused
  // "JavaScript" + the fence + leaked button text, corrupting the message.
  const md = htmlToMd(`
    <code-block>
      <div class="code-block">
        <div class="code-block-decoration header-formatted">
          <span>JavaScript</span>
          <div class="buttons">
            <gem-icon-button arialabel="下载代码"><button aria-label="下载代码"></button></gem-icon-button>
            <gem-icon-button arialabel="复制代码"><button aria-label="复制代码"></button></gem-icon-button>
          </div>
        </div>
        <pre><code class="code-container formatted" data-test-id="code-content"><span class="hljs-keyword">const</span> x = <span class="hljs-number">1</span>;</code></pre>
      </div>
    </code-block>
  `);
  // Language label is captured as the fence info, not as body text.
  assert.ok(md.startsWith('```JavaScript'), md);
  // Code content survives (highlight spans flattened to text).
  assert.match(md, /const x = 1;/);
  // Button labels and the bare "JavaScript" string do NOT leak into the body.
  assert.doesNotMatch(md, /下载代码/);
  assert.doesNotMatch(md, /复制代码/);
  // Fence closes properly.
  assert.equal((md.match(/```/g) || []).length, 2);
});

test('Gemini <code-block> from saved-page fixture (regression)', () => {
  // End-to-end check against a minimal slice of a real saved Gemini page,
  // including trailing content that MUST stay outside the code block.
  const html = readFileSync(
    new URL('./fixtures/gemini-codeblock.html', import.meta.url), 'utf8');
  const md = htmlToMd(html);
  // Exactly one fenced block, properly opened and closed.
  assert.equal((md.match(/```/g) || []).length, 2, md);
  // Trailing paragraph is NOT swallowed into the code block.
  assert.match(md, /代码块之后的内容/);
  // Language label captured, not leaked into the body.
  assert.match(md, /```JavaScript/);
  assert.doesNotMatch(md, /下载代码|复制代码/);
});

test('code-block indentation is preserved (Gemini and <pre> paths)', () => {
  // The leading-whitespace cleanup pass in htmlToMd strips pretty-print
  // indentation leaked by Gemini's nested <div> wrappers. It must NOT touch
  // lines INSIDE a fenced code block — real source-code indentation has to
  // survive, or pasted code collapses to column 0 in OneNote. Cover both the
  // Gemini <code-block> custom element and the generic <pre><code> path.
  const indentedBody =
    'function foo() {\n' +
    '  if (true) {\n' +
    '    return 1;\n' +
    '  }\n' +
    '}';

  // Gemini <code-block> custom element.
  const geminiMd = htmlToMd(`
    <code-block>
      <div class="code-block">
        <div class="code-block-decoration header-formatted"><span>JavaScript</span></div>
        <pre><code class="code-container formatted" data-test-id="code-content">${indentedBody}</code></pre>
      </div>
    </code-block>
  `);
  assert.ok(geminiMd.includes('  if (true) {'), 'gemini 2-space indent kept: ' + geminiMd);
  assert.ok(geminiMd.includes('    return 1;'), 'gemini 4-space indent kept: ' + geminiMd);

  // Generic <pre><code> path (ChatGPT / Claude / others).
  const preMd = htmlToMd(
    `<pre><code class="language-python">def f():\n    return 1</code></pre>`);
  assert.ok(preMd.includes('    return 1'), '<pre> 4-space indent kept: ' + preMd);
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

test('image becomes a numbered placeholder (OneNote cannot render pasted images)', () => {
  // OneNote refuses data: URLs in pasted HTML and there's no way to carry a
  // bitmap alongside formatted text, so every kept image becomes an inline
  // 🖼️ placeholder. Sequential numbering tells the user which image to grab.
  eq(
    htmlToMd('<img src="https://e.com/x.png" alt="pic">'),
    '🖼️ [图片 1：pic]'
  );
  eq(
    htmlToMd('<img src="https://e.com/x.png">'),
    '🖼️ [图片 1]'
  );
});

test('Gemini generation-prompt alt is trimmed to a short label', () => {
  // Gemini sets <img alt> to the FULL generation prompt (a paragraph) plus a
  // trailing "，AI 生成" / ", AI generated" marker. As a placeholder label that
  // is a wall of text. cleanImageAlt strips the marker and takes the first
  // clause, capped at ~30 chars.
  const longAlt = 'A detailed close-up screenshot of a browser dev tools window, AI generated';
  const md = htmlToMd(`<img src="data:image/png;base64,AAAA" alt="${longAlt}">`);
  assert.match(md, /🖼️ \[图片 1：[^]*\]/);
  // The full prompt must NOT leak through.
  assert.doesNotMatch(md, /AI generated/i);
  assert.doesNotMatch(md, /browser dev tools window/);
  // Plain "，AI 生成" marker-only alt collapses to a bare number.
  eq(htmlToMd('<img src="data:image/png;base64,AAAA" alt="，AI 生成">'), '🖼️ [图片 1]');
  eq(htmlToMd('<img src="data:image/png;base64,AAAA" alt=", AI generated">'), '🖼️ [图片 1]');
});

test('source-DOM indentation does not indent output lines (the code-block bug)', () => {
  // Gemini nests content in <div class="image-container"><div class="overlay">
  //   <button class="image-button"><img ...></button></div></div> and the DOM
  // carries that pretty-print indentation as whitespace text nodes. Without
  // stripping it, the image placeholder line ended up with 4+ leading spaces
  // → Markdown treated it as a code block → OneNote rendered it indented.
  // After the fix, content lines start at column 0 AND whitespace-only lines
  // are blanked (they otherwise became <p>   </p> spacers in OneNote).
  const md = htmlToMd(`
    <div class="image-container">
      <div class="overlay-container">
        <button class="image-button">
          <img class="image animate loaded" alt="a pic"
               src="data:image/png;base64,AAAA">
        </button>
      </div>
    </div>
    <p>图片下面的内容</p>
  `);
  // No content line carries leading whitespace (whitespace-only lines are
  // fine — they're blank), and no line is whitespace-only-but-non-empty.
  for (const line of md.split('\n')) {
    if (line.trim()) {
      assert.equal(line, line.replace(/^[ \t]+/, ''),
        'content line has leading whitespace: ' + JSON.stringify(line));
    } else {
      assert.equal(line, '', 'whitespace-only line should be blank: ' + JSON.stringify(line));
    }
  }
  // The placeholder AND the following content both land at column 0.
  const placeholderLine = md.split('\n').find(l => l.includes('🖼️'));
  const afterLine = md.split('\n').find(l => l.includes('图片下面的内容'));
  assert.ok(placeholderLine && !/^[ \t]/.test(placeholderLine), 'placeholder at col 0');
  assert.ok(afterLine && !/^[ \t]/.test(afterLine), 'content after image at col 0');
});

test('Gemini screen-reader label "你说" is dropped (accessibility chrome)', () => {
  // Every Gemini user query begins with a visually-hidden span that screen
  // readers announce as the user's turn cue:
  //   <span class="cdk-visually-hidden screen-reader-user-query-label">你说</span>
  // It's invisible on screen but its text leaked into every copied user
  // message as a spurious "你说" prefix. The visually-hidden filter drops it.
  const md = htmlToMd(
    '<div class="query-text">' +
    '<span class="cdk-visually-hidden screen-reader-user-query-label">你说</span>' +
    '<p>有没有办法保留标题格式？</p>' +
    '</div>');
  assert.match(md, /有没有办法保留标题格式/);
  assert.doesNotMatch(md, /你说/, 'screen-reader label must not leak: ' + md);
  // Other common visually-hidden class spellings are filtered too.
  for (const cls of ['sr-only', 'visually-hidden', 'screen-reader-text']) {
    assert.equal(htmlToMd(`<span class="${cls}">hidden</span>visible`), 'visible');
  }
});

test('nested list indentation is preserved when stripping source whitespace', () => {
  // The whitespace-strip must not eat REAL list indentation (2-space steps
  // before a list marker). Nested items stay indented, top items at col 0.
  const md = htmlToMd('<ul><li>top<ul><li>nested</li></ul></li></ul>');
  const lines = md.split('\n');
  assert.ok(lines[0].startsWith('- top'), 'top at col 0');
  assert.ok(lines[1].startsWith('  - nested'), 'nested indented 2 spaces: ' + lines[1]);
});

test('image placeholders number sequentially across the document', () => {
  const md = htmlToMd(
    '<p>before</p>' +
    '<img src="https://e.com/a.png" alt="first">' +
    '<p>middle</p>' +
    '<img src="https://e.com/b.png">' +
    '<img src="https://e.com/c.png" alt="third">'
  );
  assert.match(md, /🖼️ \[图片 1：first\]/);
  assert.match(md, /🖼️ \[图片 2\]/);
  assert.match(md, /🖼️ \[图片 3：third\]/);
  // No raw image markdown leaks through.
  assert.doesNotMatch(md, /!\[/);
  assert.doesNotMatch(md, /e\.com/);
});

test('favicon / citation icons are dropped (ChatGPT source citations)', () => {
  // ChatGPT embeds these inside citation links; they must not survive.
  eq(htmlToMd('<img src="https://www.google.com/s2/favicons?domain=https://www.php.cn&sz=128" alt="">'), '');
  eq(htmlToMd('<img src="https://www.google.com/s2/favicons?domain=x.com&sz=128" alt="">'), '');
  // A real content image is not dropped (it becomes a placeholder), and its
  // raw URL is not leaked into the output.
  const md = htmlToMd('<img src="https://upload.wikimedia.org/x.jpg" alt="real">');
  assert.match(md, /🖼️ \[图片 1：real\]/);
  assert.doesNotMatch(md, /upload\.wikimedia\.org/);
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

test('Gemini content image inside <button> becomes a placeholder (the image-button bug)', () => {
  // Real Gemini DOM: AI-generated images are wrapped in
  // <button class="image-button"> so clicking opens the lightbox. Before the
  // fix, <button> was dropped entirely, taking the image with it. Now the
  // image is recognised and emitted as a numbered placeholder (OneNote can't
  // render pasted images, but the user can paste the image themselves).
  const md = htmlToMd(`
    <p>这是回答里的一张图片：</p>
    <div class="image-container">
      <button class="image-button">
        <img class="image animate loaded" alt="，AI 生成"
             src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==">
      </button>
    </div>
    <p>图片之后的正文。</p>
  `);
  // Image becomes a numbered placeholder. The "，AI 生成" alt is a bare marker
  // with no real description, so it collapses to a bare number — NOT a data URL.
  assert.match(md, /🖼️ \[图片 1\]/);
  assert.doesNotMatch(md, /data:image/);
  // Surrounding text is intact and in order.
  assert.match(md, /这是回答里的一张图片/);
  assert.match(md, /图片之后的正文/);
});

test('Gemini decorative / avatar images are dropped', () => {
  // Empty data:, placeholders (Gemini icon stubs).
  assert.equal(htmlToMd('<img src="data:," alt="">'), '');
  // Avatar profile pics (Gemini ships as inline SVG data URLs).
  assert.equal(
    htmlToMd('<img src="data:image/svg+xml,<svg></svg>" alt="个人资料图片">'),
    ''
  );
  // Class-based noise: sparkle decoration, mavatar.
  assert.equal(
    htmlToMd('<img class="sparkle-image" src="data:image/png;base64,AAAA" alt="">'),
    ''
  );
  assert.equal(
    htmlToMd('<img class="mavatar-image" src="data:image/png;base64,AAAA" alt="">'),
    ''
  );
});

test('Gemini image fixture end-to-end (real saved-page slice)', () => {
  const html = readFileSync(
    new URL('./fixtures/gemini-image.html', import.meta.url), 'utf8');
  const md = htmlToMd(html);
  // Alt "一张流程图，展示从 DOM 到 OneNote 的转换流程，AI 生成" →
  // strip the "，AI 生成" marker, take the first clause, cap at ~30 chars.
  assert.match(md, /🖼️ \[图片 1：一张流程图/);
  assert.doesNotMatch(md, /AI 生成/);
  assert.doesNotMatch(md, /data:image/);
  assert.match(md, /这是回答里的一张图片/);
  assert.match(md, /图片之后的正文/);
});

test('Gemini image description in <blockquote> is NOT indented', () => {
  // Real Gemini DOM: the AI image is followed by its description wrapped in
  // <blockquote><p><b>图像描述：</b> ...</p></blockquote>. Converting that to
  // a Markdown "> quote" made OneNote indent the description (looked like a
  // stray indent in the transcript). The blockquote must flatten so the
  // description text stays flush with the surrounding message.
  const md = htmlToMd(`
    <p>这是回答里的一张图片：</p>
    <single-image><img class="image" alt="a pic" src="data:image/png;base64,AAAA"></single-image>
    <blockquote data-path-to-node="10">
      <p><strong>图像描述：</strong> 这是一张截图。</p>
      <p>第二段描述。</p>
    </blockquote>
    <p>图片之后的正文。</p>
  `);
  // Description text survives...
  assert.match(md, /图像描述/);
  assert.match(md, /这是一张截图/);
  assert.match(md, /第二段描述/);
  // ...but as plain text, NOT as a Markdown quote (which would indent in OneNote).
  assert.doesNotMatch(md, /^>/m, 'no quote markers: ' + md);
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
  // Indented body line must keep its 4-space indent (the code-block bug).
  assert.ok(md.includes('    return 1'), 'code indent preserved: ' + md);
});
