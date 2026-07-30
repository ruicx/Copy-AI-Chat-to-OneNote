/**
 * renderer.js — Markdown → OneNote-friendly HTML
 *
 * Stage 2 of the pipeline. Takes clean Markdown (from converter.js) and emits
 * HTML aligned with what OneNote reliably preserves on paste:
 *   - code blocks become <div> with bg/monospace (OneNote drops <pre> semantics)
 *     and get syntax highlighting via highlight.js; because OneNote keeps
 *     neither class names nor <style> blocks, token classes are rewritten
 *     to inline style="color:..." against a bundled light palette.
 *   - math formulas ($...$ / $$...$$) become Presentation MathML via Temml.
 *     OneNote's HTML paste path extracts `<math>...</math>` blocks and converts
 *     them to NATIVE Office Math (OMML) equations (see
 *     https://learn.microsoft.com/en-us/office/math/mathml). This is why we emit
 *     MathML rather than KaTeX's HTML+CSS render: OneNote keeps the `<math>`
 *     markup but drops classes/`<style>`, so a CSS-rendered formula would
 *     collapse to plain text (the same constraint that drives the inline-color
 *     code-highlight trick above).
 *   - tables carry a border="1" attribute (style border is ignored)
 *   - headings get OneNote's signature dark-blue color
 *
 * Reference: https://learn.microsoft.com/en-us/graph/onenote-input-output-html
 */
import { Marked } from 'marked';
import temml from 'temml';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import bash from 'highlight.js/lib/languages/bash';
import cpp from 'highlight.js/lib/languages/cpp';
import java from 'highlight.js/lib/languages/java';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import sql from 'highlight.js/lib/languages/sql';
import json from 'highlight.js/lib/languages/json';
import xml from 'highlight.js/lib/languages/xml';
import markdownLang from 'highlight.js/lib/languages/markdown';
import css from 'highlight.js/lib/languages/css';

// Register a curated set of common languages. hljs carries its own alias
// table (js/javascript, py/python, sh/bash, html/xml, ts/typescript, c/cpp…),
// so callers can pass any alias and it resolves here. Languages not in this
// set fall back to plain text — same behaviour as before highlighting existed.
[
  ['javascript', javascript], ['typescript', typescript], ['python', python],
  ['bash', bash], ['cpp', cpp], ['java', java], ['go', go], ['rust', rust],
  ['sql', sql], ['json', json], ['xml', xml], ['markdown', markdownLang],
  ['css', css],
].forEach(([name, def]) => hljs.registerLanguage(name, def));

const ON_HEADING_COLOR = '#1e4e79';
const CODE_BG = '#f6f8fa';

/** localStorage key holding the user's custom code font name (may be absent). */
export const CODE_FONT_KEY = 'ai-copy-code-font';
const CODE_FONT_FALLBACK = "Consolas,'Courier New',monospace";

/**
 * Build the font-family stack for code blocks. A user-configured font (stored
 * in localStorage, set via the gear button) is placed FIRST so it wins when
 * installed, with Consolas/Courier/monospace as the fallback chain so a
 * missing font never collapses to a proportional face. Reads defensively —
 * localStorage can throw in private mode or when sandboxed.
 */
function getCodeFont() {
  let user = '';
  try { user = (localStorage.getItem(CODE_FONT_KEY) || '').trim(); } catch (_) { /* storage blocked */ }
  if (!user) return CODE_FONT_FALLBACK;
  // Escape any single quotes inside the family name for the CSS string.
  const safe = user.replace(/'/g, "\\'");
  return `'${safe}',${CODE_FONT_FALLBACK}`;
}

// OneNote's own heading style, reverse-engineered from its output HTML
// (https://learn.microsoft.com/en-us/graph/onenote-input-output-html):
//   <h1 style="font-size:16pt;color:#1e4e79;margin-top:11pt;margin-bottom:11pt">
// Reproducing the exact font-size + margins is what makes OneNote recognise
// the line as a true heading style (so it lands in the page outline / nav),
// rather than just coloured bold text.
const HEADING_FONT_SIZE = { 1: '20pt', 2: '16pt', 3: '14pt', 4: '12pt', 5: '11.5pt', 6: '11pt' };
const HEADING_MARGIN = 'margin-top:11pt;margin-bottom:11pt';

function headingStyle(depth) {
  return `font-size:${HEADING_FONT_SIZE[depth]};color:${ON_HEADING_COLOR};${HEADING_MARGIN}`;
}

function buildMarked() {
  const marked = new Marked({ gfm: true, breaks: false });

  marked.use({
    renderer: {
      // Headings → emit the exact inline style OneNote uses for its built-in
      // heading styles, so paste maps them to real heading styles.
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens);
        return `<h${depth} style="${headingStyle(depth)}">${text}</h${depth}>\n`;
      },
      // Code block → OneNote-friendly div. OneNote does not preserve <pre>;
      // we render a styled div with an optional language label. When the
      // language is registered, the body is syntax-highlighted (hljs), with
      // token classes rewritten to inline color styles (see highlightToHtml).
      code({ text, lang }) {
        const language = (lang || '').trim();
        const font = getCodeFont();
        const label = language
          ? `<div style="font-family:${font};font-size:10pt;color:#6a737d;padding:2px 8px 0 8px">${escapeHtml(language)}</div>`
          : '';
        const body = `<pre style="margin:0;padding:8px;white-space:pre-wrap;word-break:break-word;font-family:${font};font-size:10pt">${codeBodyToHtml(text, language)}</pre>`;
        return `<div style="background-color:${CODE_BG};border:1px solid #e1e4e8;border-radius:4px;margin:8px 0;overflow-x:auto">${label}${body}</div>`;
      },
    },
    // Math support. The converter emits `$...$` (inline) and `$$...$$` (block).
    // We register these as marked extensions so they are tokenised by marked
    // itself — which means a `$` INSIDE a fenced code block is never mistaken
    // for math (marked has already classified that text as a code token before
    // the inline tokenizer runs). Each token is rendered to Presentation MathML
    // via Temml; OneNote converts embedded `<math>` to native equations on paste.
    extensions: [
      {
        name: 'blockMath',
        level: 'block',
        start(src) { return src.indexOf('$$'); },
        tokenizer(src) {
          // A column-0 `$$...$$` block. `[\s\S]+?` allows multi-line display
          // equations; the non-greedy match stops at the first closing `$$`.
          const m = /^\$\$([\s\S]+?)\$\$(?:\n|$)/.exec(src);
          if (m) {
            const tex = m[1];
            return { type: 'blockMath', raw: '$$' + tex + '$$', tex };
          }
        },
        renderer({ tex }) { return renderMath(tex, true); },
      },
      {
        name: 'inlineMath',
        level: 'inline',
        start(src) { return src.indexOf('$'); },
        tokenizer(src) {
          // `$...$` on a single line. A literal `\$` inside is allowed via the
          // `\\\$` alternation; newlines and bare `$` never appear in the
          // content. The non-empty check rejects a stray `$$`.
          const m = /^\$((?:\\\$|[^\$\n])+?)\$/.exec(src);
          if (m && m[1].trim()) {
            const tex = m[1];
            return { type: 'inlineMath', raw: '$' + tex + '$', tex };
          }
        },
        renderer({ tex }) { return renderMath(tex, false); },
      },
    ],
  });

  return marked;
}

const _marked = buildMarked();

/** Escape HTML special characters in code content. */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Render a LaTeX fragment to Presentation MathML for embedding in the OneNote
 * HTML payload.
 *
 * OneNote's clipboard paste path does NOT understand KaTeX's HTML+CSS render
 * (it drops class names and <style> blocks — the same constraint that forces
 * us to inline colors for code highlighting). But its HTML parser DOES extract
 * `<math>...</math>` blocks and hand them to its MathML importer, which
 * converts them into native Office Math (OMML) equations (see
 * https://learn.microsoft.com/en-us/office/math/mathml). Temml produces exactly
 * that — Presentation MathML wrapped in a bare `<math>` element, no KaTeX-style
 * span wrapper. We embed it verbatim.
 *
 * `throwOnError:false` makes Temml emit a literal fallback (it never throws for
 * bad LaTeX); the surrounding try/catch is belt-and-braces against a Temml bug
 * and degrades to escaped text so a single malformed formula can never abort
 * the whole copy.
 */
function renderMath(tex, displayMode) {
  try {
    const mathml = temml.renderToString(tex, { displayMode, throwOnError: false });
    // Temml sometimes emits an <annotation> with the original TeX source.
    // OneNote ignores annotation children anyway, so drop it to keep the
    // payload small. (If absent this replace is a no-op.)
    return mathml.replace(/<annotation[\s\S]*?<\/annotation>/g, '') + '\n';
  } catch (_) {
    // Last-resort fallback: show the raw LaTeX as inline code so the user at
    // least sees what the formula was, instead of nothing.
    return '<code>' + escapeHtml(tex) + '</code>';
  }
}

// highlight.js token scope → inline color. Values are the GitHub light theme,
// chosen for legibility against the CODE_BG (#f6f8fa) light-grey background.
// OneNote keeps inline style="color:..." but drops class names entirely, so we
// map each hljs class to a hex color and strip the class. Unmapped scopes
// (e.g. tag names) get no span styling and inherit the default code color —
// matching how hljs themes leave plain text uncoloured.
const TOKEN_COLORS = {
  keyword: '#d73a49', 'selector-tag': '#d73a49', 'selector-id': '#d73a49',
  'selector-class': '#d73a49', built_in: '#005cc5', builtin: '#005cc5',
  type: '#005cc5', 'class-builtin': '#005cc5', literal: '#005cc5',
  number: '#005cc5', symbol: '#005cc5', bullet: '#005cc5', link: '#032f62',
  string: '#032f62', 'meta-string': '#032f62', regexp: '#032f62',
  comment: '#6a737d', quote: '#6a737d', doctag: '#6a737d',
  title: '#6f42c1', 'title.function_': '#6f42c1', 'title.class_': '#6f42c1',
  section: '#6f42c1', 'function.title': '#6f42c1', 'class.title': '#6f42c1',
  attr: '#005cc5', attribute: '#005cc5', 'template-variable': '#e36209',
  variable: '#e36209', 'meta': '#6a737d', operator: '#005cc5',
  'property': '#005cc5', 'params': '#24292e',
};

/**
 * Highlight a code string into an HTML fragment with INLINE colors.
 *
 * highlight.js returns markup whose tokens carry class names (e.g.
 * `<span class="hljs-keyword">`). OneNote's paste path preserves inline
 * `style="color:..."` but discards class selectors and <style> blocks, so we
 * rewrite each token's classes to an inline color and drop the class attr.
 * A span may carry several space-separated classes; we use the first one that
 * has a mapping (hljs orders them outermost→innermost, so the first mapped is
 * the most significant scope).
 *
 * If the language is unknown or highlighting throws, fall back to plain
 * escaped text — identical to pre-highlighting behaviour (zero regression).
 */
function highlightToHtml(code, lang) {
  const language = (lang || '').trim().toLowerCase();
  if (!language || !hljs.getLanguage(language)) return escapeHtml(code);
  try {
    const { value } = hljs.highlight(code, { language });
    return rewriteClassesToInlineColor(value);
  } catch (_) {
    return escapeHtml(code);
  }
}

/** Rewrite hljs `class="hljs-…"` spans to inline `style="color:…"`; drop the class. */
function rewriteClassesToInlineColor(html) {
  return html.replace(/<span class="([^"]*)">/g, (whole, classes) => {
    // hljs emits space-separated classes, each prefixed with `hljs-`
    // (e.g. `hljs-title hljs-function_`). Strip the prefix before lookup.
    const tokens = classes.split(/\s+/).map((c) => c.replace(/^hljs-/, ''));
    const matched = tokens.find((tok) => Object.prototype.hasOwnProperty.call(TOKEN_COLORS, tok));
    if (!matched) return '<span>'; // no mapping → unstyled span (keeps grouping, drops class)
    return `<span style="color:${TOKEN_COLORS[matched]}">`;
  });
}

/**
 * Turn raw code-block text into HTML that survives OneNote paste, optionally
 * syntax-highlighted.
 *
 * OneNote's clipboard paste path drops <pre> semantics AND ignores the
 * `white-space` CSS property (it's not in the supported-styles list, see
 * https://learn.microsoft.com/en-us/graph/onenote-input-output-html), so a
 * `    return 1` line pastes as `return 1` — code indentation collapses.
 *
 * The fix: encode each line's LEADING run of spaces as &nbsp; (which OneNote
 * keeps verbatim). We only encode leading spaces — intra-line alignment is
 * rare in source and &nbsp; there would block word-wrap. Tabs are left as-is;
 * real-world indented code from these AI sites uses spaces.
 *
 * When `lang` is a registered highlight.js language, the body is first run
 * through highlightToHtml (which already HTML-escapes the text). Leading-space
 * encoding then operates per-line but SKIPS lines that begin with a tag char
 * (`<`), because a highlighted line typically starts with `<span …>` and has
 * no literal leading spaces to preserve — running the regex there would only
 * corrupt the markup. Plain-text lines (starting with a space or other char)
 * are encoded exactly as before. For unregistered/empty languages the whole
 * body is escaped first, then encoded line-by-line as before.
 */
function codeBodyToHtml(text, lang) {
  if (lang && hljs.getLanguage(lang)) {
    const highlighted = highlightToHtml(text, lang);
    // Encode leading spaces, but only on lines that are plain text (don't
    // start with a tag). Highlighted indented code keeps its indentation as
    // literal spaces inside the text content, which still need encoding.
    return highlighted.replace(/^.*$/gm, (line) =>
      line.startsWith('<')
        ? line
        : line.replace(/^( +)/, (lead) => '&nbsp;'.repeat(lead.length)));
  }
  return escapeHtml(text).replace(/^.*$/gm, (line) =>
    line.replace(/^( +)/, (lead) => '&nbsp;'.repeat(lead.length)));
}

/**
 * Post-process Marked output into OneNote-friendly HTML.
 * - Add border="1" attribute to every <table> (OneNote ignores style border).
 *
 * (Heading styling is handled directly in the heading renderer above to match
 * OneNote's built-in heading style exactly, so no heading post-processing here.)
 */
function postProcess(html) {
  return html
    // <table> → <table border="1">  (only if border attribute absent)
    .replace(/<table(?![^>]*\sborder=)/g, '<table border="1"');
}

export function mdToOneNoteHtml(md) {
  if (!md || !md.trim()) return '';
  const raw = _marked.parse(md, { async: false });
  return postProcess(String(raw));
}
