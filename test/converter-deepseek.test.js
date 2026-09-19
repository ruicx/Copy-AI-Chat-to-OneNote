import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseHTML } from 'linkedom';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = readFileSync(join(__dirname, 'fixtures/deepseek-sample.html'), 'utf8');

const { document } = parseHTML(fixture);
globalThis.document = document;

const { htmlToMd } = await import('../src/converter.js');

const asstMd = document.querySelector('.ds-markdown.ds-assistant-message-main-content');
const full = () => htmlToMd(asstMd, {});

test('DeepSeek md-code-block → clean fenced code with the banner language', () => {
  const md = full();
  // The javascript block: banner label becomes fence info, Prism token spans
  // flatten to plain code, and NO banner chrome (复制/下载) leaks.
  assert.match(md, /```javascript\n\/\/ 油猴脚本示例\nfunction convertToRichText\(html\) \{/);
  assert.doesNotMatch(md, /复制下载/);
  assert.doesNotMatch(md, /```复制/); // label must not fuse onto the opening fence
  // The python block likewise.
  assert.match(md, /```python\ndef hello\(name\):/);
});

test('DeepSeek inline math (bare span.katex) → $…$ from the KaTeX annotation', () => {
  const md = full();
  assert.match(md, /质能方程 \$E = mc\^2\$/);
  assert.match(md, /勾股定理 \$a\^2 \+ b\^2 = c\^2\$/);
  // The rendered glyph soup (MathML text + HTML text concatenated) must not leak.
  assert.doesNotMatch(md, /E=mc2/);
});

test('DeepSeek display math (span.katex-display.ds-markdown-math) → $$…$$', () => {
  const md = full();
  assert.match(md, /\$\$\\int_\{-\\infty\}\^\{\\infty\} e\^\{-x\^2\} \\, dx = \\sqrt\{\\pi\}\$\$/);
  // Multi-line environments keep their newlines (LaTeX is
  // whitespace-insensitive) — assert the fence and rows, not the line layout.
  assert.match(md, /\$\$\\begin\{pmatrix\}\s*a & b \\\\\s*c & d\s*\\end\{pmatrix\}/);
  assert.match(md, /\\end\{pmatrix\}\$\$/);
});

test('DeepSeek task list keeps the □/☑ checkbox glyphs', () => {
  const md = full();
  assert.match(md, /□\s+未完成任务/);
  assert.match(md, /☑\s+已完成任务/);
  assert.match(md, /□\s+另一个未完成任务/);
});

test('DeepSeek real blockquote → > quote lines (not flattened)', () => {
  const md = full();
  assert.match(md, /^> 这是一段引用文字。/m);
  assert.match(md, /^> 引用可以有多行。/m);
  assert.match(md, /^> 引用里也可以有\*\*加粗\*\*和`代码`。/m);
});

test('DeepSeek table in .ds-scroll-area → GFM table with all cells', () => {
  const md = full();
  assert.match(md, /\| 功能 \| 状态 \| 备注 \|/);
  assert.match(md, /\| 表格 \| 支持 \| 需测试合并单元格 \|/);
});

test('DeepSeek nested lists survive with their formatting', () => {
  const md = full();
  assert.match(md, /1\. 第一步：打开 OneNote/);
  assert.match(md, /3\. 第三步：检查格式/);
  assert.match(md, /- 第二项：包含\*\*加粗\*\*和`代码`/);
  assert.match(md, /  - 嵌套子项 A/);
});

test('hr + trailing paragraph intact (no fence corruption around them)', () => {
  const md = full();
  assert.match(md, /---/);
  assert.match(md, /最后一段收尾文字/);
});
