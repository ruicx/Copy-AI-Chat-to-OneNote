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
// NOTE: <button> is intentionally NOT here. Gemini wraps AI-generated content
// images in <button class="image-button"> (so clicking opens the lightbox),
// and dropping the button would discard the image. We flatten <button>
// instead (see the default switch case) so its children survive while the
// button itself contributes nothing — action toolbar buttons only contain
// <svg> (already dropped) and icon text, so flattening them is harmless.
const DROP_TAGS = new Set([
  'script', 'style', 'svg', 'noscript', 'template',
  'input', 'select', 'textarea',
]);

// Class fragments that mark an element as visually-hidden accessibility chrome
// (screen-reader-only labels, skip links, etc.). These carry NO visible
// content — they exist for assistive tech — so their text must NOT leak into
// the converted output. Real example: Gemini prefixes every user query with
// <span class="cdk-visually-hidden screen-reader-user-query-label">你说</span>
// which is the spoken prompt cue, and without this filter it showed up as a
// spurious "你说" prefix on every copied user message.
const VISUALLY_HIDDEN_CLASS = /(^|\s)(cdk-visually-hidden|sr-only|visually-hidden|screen-reader-text|screen-reader)(\s|$)/i;

function isVisuallyHidden(node) {
  const cls = node.getAttribute && (node.getAttribute('class') || '');
  return !!cls && VISUALLY_HIDDEN_CLASS.test(cls);
}

/** Is this <blockquote> a Gemini-style image caption (styling, not a real
 *  quotation)? Gemini wraps each AI image's "图像描述：" paragraph in a
 *  <blockquote> purely for visual grouping. We detect two signals:
 *    1. The blockquote's previous element sibling is an image-related element
 *       (<single-image>, <generated-image>, <img>, .image-container, …).
 *    2. Its first <p>/<div> starts with a bold caption label: "图像描述" /
 *       "Image description" / "图片说明" / "Description".
 *  Either signal counts. Real quotes (neither signal) are left untouched so
 *  they still render as proper quote blocks in OneNote. */
const IMAGE_ELEMENT_TAGS = new Set([
  'img', 'single-image', 'generated-image', 'image-container',
  'image-button', 'response-element', 'figure',
]);
const CAPTION_LABEL_RE = /^(图像描述|图片描述|图片说明|图像说明|Image description|Image Description|Description|Caption|说明|描述)[:：]/;

function prevElementSibling(node) {
  let s = node.previousSibling;
  while (s && s.nodeType !== 1) s = s.previousSibling; // skip text/comments
  return s;
}

function isImageCaptionBlock(node) {
  // Signal 1: previous element sibling is an image-related element (walk past
  // wrapper divs that Gemini nests around the image).
  let prev = prevElementSibling(node);
  for (let depth = 0; depth < 4 && prev; depth++) {
    const tag = prev.tagName.toLowerCase();
    if (IMAGE_ELEMENT_TAGS.has(tag)) return true;
    if (prev.querySelector && prev.querySelector('img, single-image, generated-image')) {
      return true;
    }
    prev = prevElementSibling(prev);
  }
  // Signal 2: first <p>/<div> child begins with a bold caption label.
  const firstPara = node.querySelector('p, div');
  if (firstPara) {
    const lead = firstPara.querySelector('b, strong');
    if (lead && CAPTION_LABEL_RE.test((lead.textContent || '').trim())) return true;
  }
  return false;
}

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

/** Should this <img> be treated as decorative/UI noise and dropped?
 *  Catches the avatars, sparkle icons, and empty placeholders that AI sites
 *  sprinkle around (Gemini especially), while keeping real content images
 *  (which have a substantial data: URL or a real http(s) src). */
function isNoiseImage(img) {
  const src = (img.getAttribute('src') || '').trim();
  const cls = img.getAttribute('class') || '';
  // Empty / placeholder data URLs (Gemini uses `data:,` for icon stubs).
  if (/^data:,$/i.test(src)) return true;
  // Known decorative / avatar class fragments (Gemini, ChatGPT UI). These are
  // strong signals regardless of alt text (avatars carry alt="个人资料图片"
  // but are still UI chrome, not message content).
  if (/(^|\s)(mavatar-image|sparkle-image|profile|avatar|icon)(\s|$)/i.test(cls)) {
    return true;
  }
  // Inline SVG avatars (Gemini ships profile pics as data:image/svg+xml).
  // Real content photos are jpeg/png/webp, so SVG data URLs are decoration.
  if (/^data:image\/svg\+xml/i.test(src)) return true;
  return false;
}

/** Turn an <img> alt string into a short, human label for the placeholder.
 *  Gemini sets alt to the FULL generation prompt (often a whole paragraph)
 *  plus a trailing "，AI 生成" / ", AI generated" marker — useless as a label.
 *  We strip the marker, take the first clause, and cap the length so the
 *  placeholder stays a tidy one-liner. */
function cleanImageAlt(alt) {
  let s = (alt || '').trim();
  if (!s) return '';
  // Strip trailing AI-generated markers in any language/separator combo.
  s = s.replace(/[,，]?\s*(AI\s*(generated|生成)|generated\s*by\s*AI)\s*$/i, '');
  // Take the first clause (up to the first sentence/clause break) only.
  const firstClause = s.split(/[.,;。；！\n]/)[0];
  s = firstClause.trim();
  // Cap length; append ellipsis if truncated.
  const MAX = 30;
  if (s.length > MAX) s = s.slice(0, MAX).trimEnd() + '…';
  return s;
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

  // Visually-hidden accessibility chrome (screen-reader labels, etc.) —
  // carries no visible content, must not leak into the output.
  if (isVisuallyHidden(node)) return '';

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
      const alt = (node.getAttribute('alt') || '').trim();
      if (!src) return '';
      // Drop favicon/source-citation icons that AI sites (notably ChatGPT)
      // embed inside citation links. These render as tiny garbage images in
      // OneNote and add no information.
      if (isFaviconIcon(src)) return '';
      // Drop avatars, decorative sparkle icons, and empty placeholders.
      if (isNoiseImage(node)) return '';
      // OneNote refuses to render images from pasted HTML whose src is a
      // data: URL — it treats them as suspicious links and shows a security
      // prompt instead of the picture. There's no way to carry a real bitmap
      // alongside the formatted text in one clipboard payload either, so we
      // emit an inline placeholder instead and let the user paste the image
      // themselves (Gemini's own per-image copy button covers this).
      // Number images sequentially across the document so the placeholder
      // tells the user which image to grab ([图片 1], [图片 2], …). Trim the
      // alt to a short label — Gemini's alt is the full generation prompt.
      if (typeof ctx.imgSeq !== 'number') ctx.imgSeq = 0;
      ctx.imgSeq += 1;
      const shortAlt = cleanImageAlt(alt);
      const label = shortAlt ? `图片 ${ctx.imgSeq}：${shortAlt}` : `图片 ${ctx.imgSeq}`;
      // Block-level: trailing blank line so the placeholder sits on its own
      // line in the rendered output (otherwise it runs into the next paragraph).
      return `🖼️ [${label}]\n\n`;
    }

    case 'blockquote': {
      // Most <blockquote> in AI replies are REAL quotations (model quoting a
      // source, the user's own example) and must keep their Markdown "> quote"
      // form so OneNote renders them as proper indented quote blocks. But
      // Gemini ALSO wraps every AI-generated image's description in a fake
      // <blockquote> (caption styling, not a quotation) — flattening only
      // those avoids the stray indent the user saw, while leaving real quotes
      // intact. Detection: the blockquote sits right after an image element,
      // OR its first child is a bold caption label like "图像描述：" /
      // "Image description".
      const inner = childrenToMd(node, ctx).trim();
      if (!inner) return '';
      if (isImageCaptionBlock(node)) {
        return `${inner}\n\n`;
      }
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

    case 'code-block': {
      // Gemini renders code in a <code-block> Angular custom element, NOT a
      // plain <pre>. Its DOM is roughly:
      //   <code-block>
      //     <div class="code-block">
      //       <div class="code-block-decoration header-formatted ...">
      //         <span>JavaScript</span>          ← language label
      //         <div class="buttons">…copy/download…</div>
      //       </div>
      //       <pre><code class="code-container formatted" data-test-id="code-content">
      //         <span class="hljs-keyword">…</span> …   ← syntax-highlight spans
      //       </code></pre>
      //     </div>
      //   </code-block>
      // If we let this fall through to the default case, the header label,
      // the copy/download button text, and the code all get flattened into
      // inline text — which corrupts the whole message (the language label
      // fuses with the opening fence, button labels leak in, and the fence
      // never closes so everything after gets swallowed). Treat it like <pre>.
      const pre = node.querySelector('pre');
      const codeEl = node.querySelector('code');
      const source = codeEl || pre || node;
      const raw = source.textContent.replace(/\n$/, '');
      // Language: prefer an explicit class on <code>; otherwise read the label
      // span in the header decoration (Gemini puts "JavaScript" there).
      let lang = '';
      if (codeEl) {
        const m = (codeEl.className || '').match(/language-([\w-]+)/);
        if (m) lang = m[1];
      }
      if (!lang) {
        const header = node.querySelector('.code-block-decoration, .header-formatted');
        if (header) {
          const label = (header.querySelector('span')?.textContent || '').trim();
          if (label && !/[\s<>]/.test(label)) lang = label;
        }
      }
      return '```' + lang + '\n' + raw + '\n```\n\n';
    }

    case 'table':
      return tableToMd(node, ctx);

    case 'div': case 'section': case 'article': case 'main':
    case 'header': case 'footer': case 'aside': case 'figure':
      return childrenToMd(node, ctx);

    case 'button': {
      // Gemini wraps AI-generated content images in <button class="image-button">
      // (so clicking opens the lightbox). We must keep the image inside. But
      // action toolbars also use <button> for Copy/Edit/Download, whose text
      // is pure UI noise. Rule: if the button holds any <img> or block-level
      // content element, flatten it (keep children); otherwise drop it.
      const hasContent =
        node.querySelector('img, p, div, pre, code-block, table, ul, ol, blockquote, figure');
      return hasContent ? childrenToMd(node, ctx) : '';
    }

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
 * @param {object} [ctx]  optional shared context. Pass the same object across
 *        multiple calls so state that should span the whole conversion — e.g.
 *        the per-image sequence counter — keeps incrementing instead of
 *        restarting per message.
 * @returns {string}
 */
export function htmlToMd(input, ctx) {
  if (input == null) return '';
  if (typeof input === 'string') {
    if (input.trim() === '') return '';
    input = parseHTMLToFragment(input);
  }
  const raw = childrenToMd(input, ctx || {});
  // Source-DOM whitespace leaks into the output in two forms:
  //   1. leading spaces on content lines (block elements carry their
  //      pretty-print indentation as whitespace text nodes) — 4+ leading
  //      spaces turns a line into a Markdown code block → indented in OneNote.
  //   2. whitespace-only lines between blocks — these become <p>   </p>
  //      paragraphs that OneNote renders as blank-but-indented spacers.
  // Both come from the same source (Gemini nests content many <div> levels
  // deep), so we clean them together: strip leading whitespace from content
  // lines EXCEPT genuine list-item indentation (2-space steps + list marker),
  // and blank out whitespace-only lines.
  const deIndented = raw.replace(/^[ \t]+(\S.*?)?[ \t]*$/gm, (line, content) => {
    // Whitespace-only line → empty line.
    if (!content) return '';
    // Keep valid list indentation: 2/4/6… spaces + marker.
    if (/^([ ]{2})+([-*+] |\d+\. )/.test(line)) return line;
    return content;
  });
  // Collapse 3+ newlines to exactly 2, and trim the whole thing.
  return deIndented.replace(/\n{3,}/g, '\n\n').replace(/^\s+|\s+$/g, '');
}
