/**
 * converter.js — DOM → Markdown
 *
 * Recursively walks a DOM node and emits clean GitHub-Flavored Markdown.
 * Designed to run both in-browser (native DOM) and under Node test (linkedom),
 * so the pure conversion logic is environment-agnostic.
 *
 * The output is intentionally normalized so it can be re-rendered by Marked
 * into OneNote-friendly HTML in the next pipeline stage.
 */

// --- DOM parser bootstrap -------------------------------------------------
// In the browser, use the native DOMParser. In Node tests, linkedom is injected
// via `setNodeDomParser` (async dynamic import kept out of the hot path).
let nodeDomParse = null;

/** @internal Allow Node test harness to inject a linkedom-based parser. */
export function setNodeDomParser(fn) {
  nodeDomParse = fn;
}

function parseHTMLToFragment(html) {
  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
    return doc.body;
  }
  if (nodeDomParse) return nodeDomParse(html);
  // No DOM available at all — return an empty body-like node.
  throw new Error('No HTML parser available (need DOMParser or linkedom).');
}

// --- inline element handlers ----------------------------------------------
const INLINE = {
  strong: '**', b: '**',
  em: '*', i: '*',
  code: '`',
};

// Tags we drop entirely (content discarded), common noise on AI pages.
const DROP_TAGS = new Set([
  'script', 'style', 'button', 'svg', 'noscript', 'template',
  'input', 'select', 'textarea',
]);

// Inline-level tags whose content should be flattened inline (no block break).
const INLINE_TAGS = new Set([
  'a', 'span', 'strong', 'b', 'em', 'i', 'code', 'u',
  'sup', 'sub', 'mark', 'small', 'br', 'img',
]);

// --- helpers ---------------------------------------------------------------
// Favicon / source-citation icon URLs that AI sites embed inside citation
// links. They render as tiny garbage in OneNote and carry no information.
function isFaviconIcon(src) {
  return (
    /\/s2\/favicons?/.test(src) ||      // Google favicon service (ChatGPT citations)
    /favicon(s)?\?/i.test(src) ||        // generic favicon endpoint
    /\/favicon\.(ico|png|svg)/i.test(src)
  );
}

function escapeTableCell(text) {
  // Pipes and newlines must not break GFM table structure.
  return String(text)
    .replace(/\r\n/g, '\n')
    .replace(/\n/g, ' ')
    .replace(/\|/g, '\\|')
    .trim();
}

function stripTrailingNL(s) {
  return s.replace(/\s+$/, '');
}

// --- core recursive converter ---------------------------------------------
function nodeToMd(node, ctx) {
  if (!node) return '';

  const nt = node.nodeType;
  // Text node
  if (nt === 3 || nt === 4) { // TEXT_NODE or CDATA
    // Collapse runs of whitespace per Markdown conventions, but preserve
    // meaningful spaces inside inline contexts.
    return node.textContent;
  }
  // Comments, doctype, etc.
  if (nt !== 1) return ''; // ELEMENT_NODE only

  const tag = node.tagName.toLowerCase();

  // Dropped noise tags
  if (DROP_TAGS.has(tag)) return '';

  // Inline elements
  if (tag in INLINE) {
    const inner = childrenToMd(node, ctx);
    const wrap = INLINE[tag];
    if (!inner.trim()) return ''; // avoid empty ** **
    return `${wrap}${inner}${wrap}`;
  }

  switch (tag) {
    case 'h1': case 'h2': case 'h3':
    case 'h4': case 'h5': case 'h6': {
      const level = Number(tag[1]);
      const inner = childrenToMd(node, ctx).trim();
      return `${'#'.repeat(level)} ${inner}\n\n`;
    }

    case 'p': {
      const inner = childrenToMd(node, ctx).trim();
      return inner ? `${inner}\n\n` : '';
    }

    case 'br':
      return '  \n';

    case 'hr':
      return '---\n\n';

    case 'a': {
      const href = node.getAttribute('href') || '';
      const text = childrenToMd(node, ctx).trim() || href;
      return href ? `[${text}](${href})` : text;
    }

    case 'img': {
      const src = node.getAttribute('src') || '';
      const alt = node.getAttribute('alt') || '';
      if (!src) return '';
      // Drop favicon/source-citation icons that AI sites (notably ChatGPT)
      // embed inside citation links. These render as tiny garbage images in
      // OneNote and add no information.
      if (isFaviconIcon(src)) return '';
      return `![${alt}](${src})`;
    }

    case 'blockquote': {
      const inner = childrenToMd(node, ctx).trim();
      if (!inner) return '';
      const quoted = inner.split('\n').map(l => l ? `> ${l}` : '>').join('\n');
      return `${quoted}\n\n`;
    }

    case 'ul':
      return listToMd(node, ctx, false);
    case 'ol':
      return listToMd(node, ctx, true);

    case 'pre': {
      // <pre><code ...> or bare <pre>
      const codeEl = node.querySelector('code');
      const raw = (codeEl || node).textContent.replace(/\n$/, '');
      let lang = '';
      if (codeEl) {
        const cls = codeEl.className || '';
        const m = cls.match(/language-([\w-]+)/);
        if (m) lang = m[1];
      }
      return '```' + lang + '\n' + raw + '\n```\n\n';
    }

    case 'table':
      return tableToMd(node, ctx);

    case 'div': case 'section': case 'article': case 'main':
    case 'header': case 'footer': case 'aside': case 'figure':
      return childrenToMd(node, ctx);

    case 'span': case 'u': case 'sup': case 'sub': case 'mark': case 'small':
      return childrenToMd(node, ctx);

    case 'li': // handled inside list
      return childrenToMd(node, ctx);

    default:
      return childrenToMd(node, ctx);
  }
}

function childrenToMd(node, ctx) {
  let out = '';
  for (const child of node.childNodes) {
    out += nodeToMd(child, ctx);
  }
  return out;
}

function listToMd(node, ctx, ordered) {
  const lines = [];
  let i = 1;
  for (const li of node.children) {
    if (li.tagName.toLowerCase() !== 'li') continue;
    const marker = ordered ? `${i}. ` : '- ';
    i++;

    // Split the li's children into inline/text parts vs nested lists.
    let textParts = [];
    const subLists = [];
    for (const child of li.childNodes) {
      const tag = child.nodeType === 1 ? child.tagName.toLowerCase() : '';
      if (tag === 'ul' || tag === 'ol') {
        subLists.push(listToMd(child, ctx, tag === 'ol').replace(/\n+$/g, ''));
      } else {
        const piece = nodeToMd(child, ctx);
        if (piece) textParts.push(piece);
      }
    }
    const text = textParts.join('').replace(/\n+/g, ' ').trim();
    lines.push(`${marker}${text}`);

    // Indent each nested list item by 2 spaces.
    for (const sub of subLists) {
      for (const subLine of sub.split('\n')) {
        lines.push('  ' + subLine);
      }
    }
  }
  return lines.join('\n') + '\n\n';
}

function tableToMd(node, ctx) {
  const rows = [];
  for (const tr of node.querySelectorAll('tr')) {
    const cells = [];
    for (const cell of tr.children) {
      const t = cell.tagName.toLowerCase();
      if (t !== 'td' && t !== 'th') continue;
      cells.push(escapeTableCell(childrenToMd(cell, ctx)));
    }
    if (cells.length) rows.push(cells);
  }
  if (!rows.length) return '';

  const cols = Math.max(...rows.map(r => r.length));
  // Pad rows to equal width
  const norm = rows.map(r => {
    while (r.length < cols) r.push('');
    return r;
  });
  // First row is the header
  const header = norm[0];
  const body = norm.slice(1);
  const sep = header.map(() => '---');
  const lines = [
    `| ${header.join(' | ')} |`,
    `| ${sep.join(' | ')} |`,
    ...body.map(r => `| ${r.join(' | ')} |`),
  ];
  return lines.join('\n') + '\n\n';
}

// --- public API ------------------------------------------------------------
/**
 * Convert an HTML string or a DOM node into clean Markdown.
 * @param {string|Node} input
 * @returns {string}
 */
export function htmlToMd(input) {
  if (input == null) return '';
  if (typeof input === 'string') {
    if (input.trim() === '') return '';
    input = parseHTMLToFragment(input);
  }
  const raw = childrenToMd(input, {});
  // Collapse 3+ newlines to exactly 2, and trim the whole thing.
  return raw.replace(/\n{3,}/g, '\n\n').replace(/^\s+|\s+$/g, '');
}
