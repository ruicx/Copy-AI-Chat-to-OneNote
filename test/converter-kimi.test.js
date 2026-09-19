import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseHTML } from 'linkedom';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = readFileSync(join(__dirname, 'fixtures/kimi-sample.html'), 'utf8');

const { document } = parseHTML(fixture);
globalThis.document = document;

const { htmlToMd } = await import('../src/converter.js');

// The first assistant answer (formats tour); math lives in the second one.
const answers = [...document.querySelectorAll('.segment-assistant')].map(seg =>
  [...seg.querySelectorAll('.markdown')].find(
    m => !m.closest('.thinking-container, .toolcall-flow'),
  ),
);
const md1 = () => htmlToMd(answers[0], {});
const md2 = () => htmlToMd(answers[1], {});

test('Kimi div.paragraph does not fuse consecutive paragraphs', () => {
  const md = md1();
  // Each paragraph gets its own line block; the intro and the body copy stay
  // separate instead of running together.
  assert.match(md, /^好的！下面这条消息专门设计用来测试各种格式类型/m);
  assert.match(md, /^这是一段普通正文。接着测试/m);
  assert.match(md, /无序列表：\n\n- 苹果/);
  assert.doesNotMatch(md, /删除线。，以及\n?一级标题/);
});

test('Kimi nested lists survive with indentation', () => {
  const md = md1();
  assert.match(md, /- 苹果\n- 香蕉\n  - 香蕉子项（二级嵌套）\n    - 三级嵌套项目\n- 橘子/);
  assert.match(md, /1\. 第一步\n2\. 第二步\n  1\. 子步骤 A\n  2\. 子步骤 B\n3\. 第三步/);
});

test('Kimi task list keeps the literal [x]/[ ] markers', () => {
  const md = md1();
  assert.match(md, /- \[x\] 已完成事项\n- \[ \] 未完成事项\n- \[ \] 另一个待办/);
});

test('Kimi segment-code → clean fenced code with language', () => {
  const md = md1();
  assert.match(md, /```javascript\n\/\/ Tampermonkey 脚本示例/);
  assert.match(md, /```python\ndef hello\(name: str\) -> str:/);
  // The header bar (language label + 复制 button) must not leak.
  assert.doesNotMatch(md, /JavaScript 复制|Python 复制/);
  assert.doesNotMatch(md, /```复制/);
});

test('Kimi markdown-table → GFM table, header bar dropped', () => {
  const md = md1();
  assert.match(md, /\| 功能 \| 支持状态 \| 备注 \|/);
  assert.match(md, /\| 标题 \| ✅ \| H1–H3 \|/);
  assert.match(md, /\| 数学公式 \| ❌ \| 暂未支持 \|/);
  assert.doesNotMatch(md, /表格\s+复制/);
});

test('Kimi headings, quotes, links and hr convert as usual', () => {
  const md = md1();
  assert.match(md, /^# 一级标题：OneNote 格式测试文档$/m);
  assert.match(md, /^### 三级标题：引用块$/m);
  assert.match(md, /^> 这是单行引用。$/m);
  assert.match(md, /\[Kimi 官网\]\(https:\/\/www\.moonshot\.cn\/\)/);
  assert.match(md, /\n---\n/);
});

test('Kimi math degrades to linearized glyphs (no fake LaTeX)', () => {
  const md = md2();
  // Inline math stays inline within the sentence.
  assert.match(md, /质能方程 E=mc2 是行内公式的典型例子/);
  // Display math lands on its own line.
  assert.match(md, /^a2\+b2=c2$/m);
  // Must NOT be wrapped in $…$ — the glyphs are not LaTeX and the math
  // renderer would mangle them.
  assert.doesNotMatch(md, /\$E=mc2\$/);
  assert.doesNotMatch(md, /\$\$a2\+b2=c2\$\$/);
});
