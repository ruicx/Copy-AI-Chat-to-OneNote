/**
 * renderer.js — Markdown → OneNote-friendly HTML
 *
 * Stage 2 of the pipeline. Takes clean Markdown (from converter.js) and emits
 * HTML aligned with what OneNote reliably preserves on paste:
 *   - code blocks become <div> with bg/monospace (OneNote drops <pre> semantics)
 *   - tables carry a border="1" attribute (style border is ignored)
 *   - headings get OneNote's signature dark-blue color
 *
 * Reference: https://learn.microsoft.com/en-us/graph/onenote-input-output-html
 */
import { Marked } from 'marked';

const ON_HEADING_COLOR = '#1e4e79';
const CODE_BG = '#f6f8fa';
const CODE_FONT = "Consolas,'Courier New',monospace";

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
      // we render a styled div with an optional language label.
      code({ text, lang }) {
        const language = (lang || '').trim();
        const label = language
          ? `<div style="font-family:${CODE_FONT};font-size:10pt;color:#6a737d;padding:2px 8px 0 8px">${escapeHtml(language)}</div>`
          : '';
        const body = `<pre style="margin:0;padding:8px;white-space:pre-wrap;word-break:break-word;font-family:${CODE_FONT};font-size:10pt">${codeBodyToHtml(text)}</pre>`;
        return `<div style="background-color:${CODE_BG};border:1px solid #e1e4e8;border-radius:4px;margin:8px 0;overflow-x:auto">${label}${body}</div>`;
      },
    },
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
 * Turn raw code-block text into HTML that survives OneNote paste.
 *
 * OneNote's clipboard paste path drops <pre> semantics AND ignores the
 * `white-space` CSS property (it's not in the supported-styles list, see
 * https://learn.microsoft.com/en-us/graph/onenote-input-output-html), so a
 * `    return 1` line pastes as `return 1` — code indentation collapses.
 *
 * The fix: escape special chars first, then encode each line's LEADING run
 * of spaces as &nbsp; (which OneNote keeps verbatim). We only encode leading
 * spaces — intra-line alignment is rare in source and &nbsp; there would
 * block word-wrap. Tabs in source are left as-is; real-world indented code
 * from these AI sites uses spaces.
 */
function codeBodyToHtml(text) {
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
