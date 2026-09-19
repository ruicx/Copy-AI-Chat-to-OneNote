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

test('ChatGPT saved-page math uses raw source and preserves display mode', () => {
  // Normalize CRLF: git autocrlf may check the fixture out with Windows line
  // endings, which would otherwise leak into data-math-source and the assert.
  const html = readFileSync(new URL('./fixtures/chatgpt-math.html', import.meta.url), 'utf8')
    .replace(/\r\n/g, '\n');
  const root = parseHTML(`<body>${html}</body>`).document.querySelector('body');
  const sources = [...root.querySelectorAll('[data-math-source]')];
  assert.equal(sources.length, 2);
  assert.equal(htmlToMd(root), `$${sources[0].getAttribute('data-math-source')}$\n\n$$${sources[1].getAttribute('data-math-source')}$$`);
});

test('task lists preserve checked state through Markdown and OneNote HTML', async () => {
  const { mdToOneNoteHtml } = await import('../src/renderer.js');
  const md = htmlToMd('<ul><li><p><input type="checkbox" checked disabled> Done <strong>task</strong></p></li><li><p><input type="checkbox" disabled> Pending</p></li></ul>');
  assert.equal(md, '- [x] Done **task**\n- [ ] Pending');
  const html = mdToOneNoteHtml(md);
  assert.match(html, /☑ Done <strong>task<\/strong>/);
  assert.match(html, /☐ Pending/);
  assert.doesNotMatch(html, /<input|<ul|<li/);
});

test('ChatGPT multiline display math renders as a native equation payload', async () => {
  const { mdToOneNoteHtml } = await import('../src/renderer.js');
  const tex = '\\begin{aligned}\nx &= 1 \\\\\ny &= 2\n\\end{aligned}';
  const root = parseHTML('<body><span role="math" data-math-source=""><span class="katex-display">visual noise</span></span></body>').document.querySelector('body');
  root.firstElementChild.setAttribute('data-math-source', tex);
  const md = htmlToMd(root);
  assert.equal(md, `$$${tex}$$`);
  const html = mdToOneNoteHtml(md);
  assert.match(html, /<math[^>]*display="block"/);
  assert.match(html, /<mtable/);
  assert.doesNotMatch(html, /visual noise/);
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

test('ChatGPT code_block widget (CodeMirror) converts to a fenced block', () => {
  // 2026 ChatGPT UI: each code block is a component div
  // [data-client-defined-widget=code_block] whose sticky header (icon svg +
  // language label + copy button) sits ABOVE a <pre class="cm-content">, and
  // the <code> carries NO language- class anymore. Before the fix the outer
  // div flattened and the header label fused onto the opening fence
  // ("dockerfile```FROM …") while the fence itself lost its language.
  const md = htmlToMd(`
    <div data-client-defined-widget="code_block" data-d-component="code_block">
      <div class="sticky">
        <div class="flex justify-between">
          <div class="flex items-center"><svg aria-hidden="true"></svg>PowerShell</div>
          <div><button aria-label="复制"><svg aria-hidden="true"></svg></button></div>
        </div>
      </div>
      <div id="code-block-viewer"><pre class="cm-content"><code><span>docker build -t .</span></code></pre></div>
    </div>
  `);
  // Language label becomes the fence info, not body text.
  assert.ok(md.startsWith('```PowerShell'), md);
  assert.match(md, /docker build -t \./);
  // Copy-button chrome does not leak.
  assert.doesNotMatch(md, /复制/);
  // Fence opens and closes exactly once.
  assert.equal((md.match(/```/g) || []).length, 2, md);
});

test('ChatGPT code_block widget from saved-page fixture (regression)', () => {
  // End-to-end over a faithful slice of the saved 2026 chatgpt.com page:
  // two blocks (PowerShell with backtick line-continuations + dockerfile)
  // with prose between and after them.
  const html = readFileSync(
    new URL('./fixtures/chatgpt-codeblock.html', import.meta.url), 'utf8');
  const md = htmlToMd(html);
  // Both labels captured as fence info.
  assert.match(md, /```PowerShell\n/);
  assert.match(md, /```dockerfile\n/);
  // Exactly one open+close pair per block (the code body's backtick line
  // continuations are single backticks — they must not read as fences).
  assert.equal((md.match(/```/g) || []).length, 4, md);
  // The reported bug: label fused in front of the fence.
  assert.doesNotMatch(md, /dockerfile```|PowerShell```/);
  // Button chrome does not leak.
  assert.doesNotMatch(md, /复制/);
  // Continuation-line indentation inside the fence survives.
  assert.match(md, /  --build-arg HTTPS_PROXY=http:\/\/host\.docker\.internal:7890 `/);
  // Trailing prose after the last block is not swallowed.
  assert.match(md, /代码块之后的内容/);
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

test('Gemini <sequence> step list → ordered list (each step on its own line)', () => {
  // Regression for the "step list loses line breaks" bug. Gemini renders
  // numbered steps as a <sequence> Angular custom element whose steps are
  // plain <div class="sequence-event"> siblings (NOT <li>), with no newline
  // between them. Before the fix the converter flattened them into one line:
  //   "1创建缓存文件夹推荐使用纯英文路径...在 D 盘...2打开环境变量设置..."
  // The CORE assertion: each numbered step MUST land on its own line.
  const md = htmlToMd(`
    <sequence>
      <div class="sequence-container">
        <div class="sequence-event">
          <div class="sequence-event-marker-container">
            <div class="sequence-event-marker">1</div>
          </div>
          <div class="sequence-event-content">
            <div>
              <div class="sequence-event-title">创建缓存文件夹</div>
              <div class="sequence-event-subtitle">推荐使用纯英文路径</div>
            </div>
            <div class="sequence-event-description">
              <span class="only-show-to-message-actions" style="display:none">推荐使用纯英文路径。</span>
              <structured-node-sequence><structured-text>
                <p>在 D 盘创建一个文件夹，例如：<code>D:\\uv_cache</code>。</p>
              </structured-text></structured-node-sequence>
            </div>
          </div>
        </div>
        <div class="sequence-event">
          <div class="sequence-event-marker-container">
            <div class="sequence-event-marker">2</div>
          </div>
          <div class="sequence-event-content">
            <div>
              <div class="sequence-event-title">打开环境变量设置</div>
            </div>
            <div class="sequence-event-description">
              <structured-node-sequence><structured-text>
                <p>按下 <code>Win</code> 键，搜索"环境变量"。</p>
              </structured-text></structured-node-sequence>
            </div>
          </div>
        </div>
      </div>
    </sequence>
  `);
  const lines = md.split('\n');
  // Step 1 and step 2 are on separate lines (the bug glued them together).
  assert.ok(/^1\. /.test(lines[0]), 'step 1 on its own line: ' + md);
  assert.ok(lines.some(l => /^2\. /.test(l)), 'step 2 on its own line: ' + md);
  // The marker digit is NOT glued onto the title (no "1创建...").
  assert.doesNotMatch(md, /1创建/, 'marker not glued to title: ' + md);
  // Title is bolded; subtitle follows in parens.
  assert.match(md, /\*\*创建缓存文件夹\*\*/);
  assert.match(md, /推荐使用纯英文路径/);
  // The HIDDEN duplicate subtitle (display:none export hook) must NOT leak
  // twice — it should appear at most once (as the real subtitle), never as
  // the trailing "。" form.
  assert.doesNotMatch(md, /推荐使用纯英文路径。/, 'hidden export span leaked: ' + md);
  // Prose of each step survives and keeps its inline code.
  assert.match(md, /`D:\\uv_cache`/);
  assert.match(md, /`Win`/);
});

test('Gemini <sequence> with nested sub-list indents it under the step', () => {
  // A step's description can contain a real nested <ul> (wrapped in
  // <structured-list>...). It must render as an indented bullet list that
  // belongs to that step, not be lost or flattened.
  const md = htmlToMd(`
    <sequence>
      <div class="sequence-container">
        <div class="sequence-event">
          <div class="sequence-event-marker-container">
            <div class="sequence-event-marker">1</div>
          </div>
          <div class="sequence-event-content">
            <div><div class="sequence-event-title">新建用户变量</div></div>
            <div class="sequence-event-description">
              <structured-node-sequence>
                <structured-text><p>点击"新建"。</p></structured-text>
                <structured-list>
                  <ul>
                    <li><structured-node-sequence><structured-text>
                      <p><b>变量名：</b> 输入 <code>UV_CACHE_DIR</code></p>
                    </structured-text></structured-node-sequence></li>
                    <li><structured-node-sequence><structured-text>
                      <p><b>变量值：</b> 输入 <code>D:\\uv_cache</code></p>
                    </structured-text></structured-node-sequence></li>
                  </ul>
                </structured-list>
              </structured-node-sequence>
            </div>
          </div>
        </div>
      </div>
    </sequence>
  `);
  // The nested bullets survive and are indented under step 1.
  assert.match(md, /- \*\*变量名：\*\* 输入 `UV_CACHE_DIR`/, 'nested bullet 1: ' + md);
  assert.match(md, /- \*\*变量值：\*\* 输入 `D:\\uv_cache`/, 'nested bullet 2: ' + md);
});

test('Gemini <sequence> from saved-page fixture (regression)', () => {
  // End-to-end check against a minimal slice of a real saved Gemini page,
  // including trailing content that MUST stay outside the step list.
  const html = readFileSync(
    new URL('./fixtures/gemini-sequence.html', import.meta.url), 'utf8');
  const md = htmlToMd(html);
  // Three numbered steps, each on its own line.
  assert.match(md, /^1\. /m, 'step 1 marker: ' + md);
  assert.match(md, /^2\. /m, 'step 2 marker: ' + md);
  assert.match(md, /^3\. /m, 'step 3 marker: ' + md);
  // No glue between the marker and the title.
  assert.doesNotMatch(md, /[123]创建|[123]打开|[123]新建/, 'marker glued to title: ' + md);
  // Titles are bolded.
  assert.match(md, /\*\*创建缓存文件夹\*\*/);
  // Trailing paragraph is NOT swallowed into the step list.
  assert.match(md, /步骤列表之后的内容/);
  // The hidden export-hook spans do not leak their duplicate text.
  assert.equal((md.match(/推荐使用纯英文路径/g) || []).length, 1, 'subtitle leaked twice: ' + md);
});

test('Gemini <math-inline> converts to $...$ and drops the katex render', () => {
  // Real Gemini DOM: a <span class="math-inline" data-math="..."> wrapping a
  // .katex render subtree (classes + inline styles + KaTeX glyph text). We must
  // read `data-math` and emit `$...$`, NOT flatten the .katex tree — flattening
  // mashes the rendered glyphs into meaningless text ("E = mc 2").
  const md = htmlToMd(
    '<span class="math-inline" data-math="E = mc^2">' +
    '<span class="katex"><span class="katex-html" aria-hidden="true">' +
    '<span class="base"><span class="mord mathnormal">E</span>' +
    '<span class="mrel">=</span><span class="mord mathnormal">m</span>' +
    '<span class="mord"><span class="mord mathnormal">c</span>' +
    '<span class="msupsub"><span class="vlist-t"><span class="vlist-r">' +
    '<span class="vlist"><span>2</span></span></span></span></span></span>' +
    '</span></span></span>');
  assert.equal(md, '$E = mc^2$');
  // The flattened katex render text must NOT leak into the output.
  assert.doesNotMatch(md, /katex/);
});

test('Gemini <math-block> converts to $$...$$ as its own paragraph', () => {
  // Real Gemini DOM: a <div class="math-block" data-math="..."> wrapping a
  // .katex-display render subtree. Emitted as a display equation (own block).
  // We wrap it in a preceding + trailing paragraph so the block-separation
  // (blank line before and after the $$...$$) is observable — a standalone
  // math-block at the very start/end of a message has its surrounding newlines
  // trimmed by htmlToMd's final trim(), which is expected.
  const md = htmlToMd(
    '<p>Before the formula.</p>' +
    '<div class="math-block" data-math="\\oint_C \\mathbf{F} \\cdot d\\mathbf{r}">' +
    '<span class="katex-display"><span class="katex"><span class="katex-html">' +
    '<span class="base"><span class="mop">∮</span><span class="msupsub">C</span></span>' +
    '</span></span></span></div>' +
    '<p>After the formula.</p>');
  assert.match(md, /\$\$\\oint_C \\mathbf\{F\} \\cdot d\\mathbf\{r\}\$\$/);
  // Blank line before AND after → it's a standalone block, not inline.
  assert.match(md, /\n\n\$\$/);
  assert.match(md, /\$\$\n\n/);
  // The katex render text must not leak.
  assert.doesNotMatch(md, /katex/);
});

test('math element without data-math falls back to flattening (no content loss)', () => {
  // If Gemini ever ships a math element without data-math (malformed DOM, older
  // version), we must NOT silently discard the visible content. Fall back to the
  // default flatten behaviour so the rendered text still shows up.
  const md = htmlToMd(
    '<span class="math-inline"><span class="katex">x + y</span></span>');
  assert.equal(md, 'x + y');
});

test('math-inline / math-block inside a paragraph stay correctly scoped', () => {
  // Inline math embedded in flowing text must stay inline (no surrounding blank
  // lines), and a following block math becomes its own paragraph.
  const md = htmlToMd(
    '<p>能量公式 <span class="math-inline" data-math="E = mc^2"></span> 很有名。</p>');
  assert.match(md, /\$E = mc\^2\$/);
  assert.doesNotMatch(md, /\n\n\$E/, 'inline math must not be split onto its own block');
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

test('strips script/style and icon-only button noise', () => {
  // Action-toolbar buttons are icon-only (svg is dropped, nothing left), so
  // they vanish. A button with real text inside message content is content
  // itself (ChatGPT 2026 rich-card pill buttons) and is kept — see the
  // dedicated button test below.
  const html = '<style>.x{}</style><script>alert(1)</script>' +
               '<p>keep</p><button aria-label="复制"><svg><path/></svg></button>';
  const md = htmlToMd(html);
  assert.ok(!md.includes('alert'), 'no script: ' + md);
  assert.ok(!md.includes('复制'), 'no icon-only button: ' + md);
  assert.ok(md.includes('keep'), 'keeps text: ' + md);
});

test('ChatGPT rich card: blocks that follow inline-flattened divs start on a fresh line', () => {
  // Regression from a saved chatgpt.com page: the 2026 UI renders
  // recommendation cards as data-d-component divs (badge / popover chip /
  // caption are all inline-flattened), and every block after them fused onto
  // the same line: "重点推荐 · 机器人方向## 2. Stanford CS234…" and
  // "CS 224R+1学习资源". Block-level emissions must guarantee a fresh line.
  const md = htmlToMd(
    '<div data-d-component="box">' +
      '<div data-d-component="badge">重点推荐 · 机器人方向</div>' +
      '<h2><ol start="2" data-d-marker="number"><li><p>Stanford CS234 — Reinforcement Learning</p></li></ol></h2>' +
      '<p>Chelsea Finn · 2026 Winter</p>' +
      '<div data-d-component="popover-trigger"><span>CS 224R</span><span>+1</span></div>' +
      '<p>学习资源</p>' +
    '</div>');
  eq(md, [
    '重点推荐 · 机器人方向',
    '',
    '## 2. Stanford CS234 — Reinforcement Learning',
    '',
    'Chelsea Finn · 2026 Winter',
    '',
    'CS 224R+1', // the two chip spans fuse inline — tolerated (cosmetic only)
    '',
    '学习资源',
  ].join('\n'));
});

test('ordered lists honor the start attribute', () => {
  eq(htmlToMd('<ol start="3"><li>三</li><li>四</li></ol>'), '3. 三\n4. 四');
  eq(htmlToMd('<ol><li>一</li></ol>'), '1. 一');
});

test('text-bearing buttons keep their label as a block; icon-only buttons stay dropped', () => {
  eq(
    htmlToMd('<p>学习资源</p><div>' +
      '<button><span>课程官网 </span><svg><path/></svg></button>' +
      '<button><span>公开视频</span><svg><path/></svg></button>' +
    '</div>'),
    '学习资源\n\n课程官网\n\n公开视频',
  );
  eq(htmlToMd('<div><button aria-label="复制"><svg><path/></svg></button></div>'), '');
  // Screen-reader-only labels don't make an icon-only button text-bearing.
  eq(htmlToMd('<div><button><span class="sr-only">复制</span><svg><path/></svg></button></div>'), '');
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
