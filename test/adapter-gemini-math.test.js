import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseHTML } from 'linkedom';

// End-to-end check for math support: load a minimal-but-faithful slice of a
// real saved Gemini page (a model-response with one inline + one block
// formula) and run the full DOM→Markdown pipeline through it.
//
// NOTE on run-order: the Gemini adapter reads `globalThis.document` to resolve
// message elements, and the converter's DOM parser is a module-level singleton
// shared across test files (see AGENTS.md invariant #8). This file sets BOTH
// to point at the math fixture before importing the adapter/converter, so it is
// self-contained regardless of which test file runs first.

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = readFileSync(join(__dirname, 'fixtures/gemini-math.html'), 'utf8');

// Inject linkedom as the DOM backend, then point globalThis.document at the
// math fixture so the adapter's querySelector calls resolve against it.
const { document } = parseHTML(fixture);
globalThis.document = document;

const adapter = (await import('../src/platforms/gemini.js')).default;
const { htmlToMd, setNodeDomParser } = await import('../src/converter.js');
setNodeDomParser((html) => {
  const { document: d } = parseHTML(`<body>${html}</body>`);
  return d.querySelector('body');
});

test('math fixture: adapter finds the model-response turn', () => {
  const els = adapter.getMessageElements();
  assert.equal(els.length, 1, 'one model-response turn');
});

test('math fixture: adapter resolves the .markdown content node', () => {
  const msgs = adapter.getMessages();
  assert.equal(msgs.length, 1);
  assert.equal(msgs[0].role, 'assistant');
  assert.match(msgs[0].el.className, /markdown/);
});

test('math fixture: converter emits $...$ for inline and $$...$$ for block', () => {
  const md = htmlToMd(fixture);
  // Two inline formulas → two $...$ spans, LaTeX sourced from `data-math`.
  assert.match(md, /\$E = mc\^2\$/, 'inline E=mc^2: ' + md);
  assert.match(md, /\$\\sum_\{i=1\}\^\{n\} i = \\frac\{n\(n\+1\)\}\{2\}\$/, 'inline sum: ' + md);
  // One block formula → $$...$$ as its own paragraph.
  assert.match(md, /\$\$\\oint_C \\mathbf\{F\} \\cdot d\\mathbf\{r\}[^\n]*\$\$/, 'block integral: ' + md);
  // Surrounding prose survives and stays outside the math spans.
  assert.match(md, /这是行内公式/);
  assert.match(md, /块级公式之后的内容/);
  // The KaTeX render subtree must NOT leak: no class names, no rendered glyph
  // text (the lone ∑ / ∮ KaTeX emits as the visible character must be gone,
  // because we dropped the whole .katex tree in favour of the LaTeX source).
  assert.doesNotMatch(md, /katex/, 'katex classes leaked: ' + md);
});
