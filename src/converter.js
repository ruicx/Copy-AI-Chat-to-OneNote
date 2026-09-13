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
import { t } from './i18n.js';

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

// --- Gemini math elements -------------------------------------------------
// Gemini renders each formula as an ordinary <span>/<div> carrying a
// `math-inline` / `math-block` CLASS plus a `data-math` attribute with the raw
// LaTeX source, wrapping a KaTeX HTML+CSS render subtree (.katex / .katex-html
// / .katex-display). Because these are span/div elements (NOT custom tag
// names), they would otherwise hit the `span`/`div` cases and be flattened —
// mashing the rendered glyphs into meaningless text. We detect them by class
// upstream and read the LaTeX from `data-math`; the rendered .katex subtree is
// dropped. See nodeToMd() for the intercept.
const MATH_INLINE_CLASS = /(^|\s)math-inline(\s|$)/;
const MATH_BLOCK_CLASS = /(^|\s)math-block(\s|$)/;

/** If `node` is a Gemini math element with a usable `data-math`, return the
 *  trimmed LaTeX; otherwise return '' (so the caller falls back to flattening
 *  the visible .katex content instead of silently discarding it). */
function mathDataAttribute(node) {
  if (!node.getAttribute) return '';
  // ChatGPT carries the original TeX on the outer role=math wrapper.
  // Reading its rendered KaTeX descendants loses fractions and superscripts.
  const source = node.getAttribute('data-math-source');
  if (source && source.trim()) return source.trim();
  const cls = node.getAttribute('class') || '';
  if (!MATH_INLINE_CLASS.test(cls) && !MATH_BLOCK_CLASS.test(cls)) return '';
  return (node.getAttribute('data-math') || '').trim();
}

/** 'block' for display math, 'inline' for inline math, '' for non-math. */
function mathElementKind(node) {
  if (node.getAttribute && node.hasAttribute('data-math-source')) {
    return node.querySelector('.katex-display') ? 'block' : 'inline';
  }
  const cls = (node.getAttribute && node.getAttribute('class')) || '';
  if (MATH_BLOCK_CLASS.test(cls)) return 'block';
  if (MATH_INLINE_CLASS.test(cls)) return 'inline';
  return '';
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

  // Gemini math: a <span class="math-inline"> / <div class="math-block">
  // wrapping a KaTeX render subtree, with the raw LaTeX in `data-math`.
  // Detect by CLASS, not tagName — these are ordinary span/div elements, so
  // the dedicated case below in the switch would never match. Intercept here
  // (before the INLINE table / switch), read the LaTeX, drop the .katex render.
  const mathTex = mathDataAttribute(node);
  if (mathTex) {
    // Block math (math-block) → own paragraph; inline math → inline span.
    // mathElementKind returns 'block' / 'inline' / '' (the latter when this
    // isn't actually a Gemini math element, though mathDataAttribute already
    // guarantees it is).
    return mathElementKind(node) === 'block'
      ? `\n\n$$${mathTex}$$\n\n`
      : `$${mathTex}$`;
  }

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
      const label = shortAlt
        ? t('imageTag', { n: ctx.imgSeq, alt: shortAlt })
        : t('imageTagNoAlt', { n: ctx.imgSeq });
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

    case 'sequence': {
      // Gemini renders a numbered "step list" (步骤列表) as an Angular custom
      // element — NOT an <ol>. Each step is a plain sibling
      // <div class="sequence-event"> (NOT <li>), with NO newline/separator
      // between steps. Inside each step:
      //   <div class="sequence-event-marker">1</div>      ← the number as text
      //   <div class="sequence-event-title">…</div>       ← step title
      //   <div class="sequence-event-subtitle">…</div>    ← optional subtitle
      //   <div class="sequence-event-description">…</div> ← prose (often wrapped
      //     in <structured-node-sequence><structured-text><p>…</p>, and may hold
      //     a nested <structured-list><ul><li>…).
      // Without this case the whole thing falls through to the default
      // childrenToMd flattening: the marker digit, title, subtitle, and prose
      // of EVERY step get mashed onto a single line → line breaks lost (the
      // bug this fixes). We rebuild a real ordered list, one step per line.
      return sequenceToMd(node, ctx);
    }

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

    // NOTE: Gemini math (math-inline / math-block) is handled UPSTREAM by the
    // mathDataAttribute() check before the INLINE table / this switch. Gemini
    // renders math as ordinary <span>/<div> elements with a CLASS (not a custom
    // tag name), so they would never reach a dedicated `case` here — they'd
    // fall into `case 'span'` / `case 'div'` and get flattened. The upstream
    // intercept is what reads `data-math` and emits `$...$` / `$$...$$`.

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
    // Only this item's checkbox counts; a nested task belongs to its own li.
    const checkbox = Array.from(li.querySelectorAll('input[type="checkbox"]'))
      .find(input => input.closest('li') === li);
    const task = checkbox
      ? `[${typeof checkbox.checked === 'boolean' ? (checkbox.checked ? 'x' : ' ') : (checkbox.hasAttribute('checked') ? 'x' : ' ')}] `
      : '';
    lines.push(`${marker}${task}${text}`);

    // Indent each nested list item by 2 spaces.
    for (const sub of subLists) {
      for (const subLine of sub.split('\n')) {
        lines.push('  ' + subLine);
      }
    }
  }
  return lines.join('\n') + '\n\n';
}

// Class fragments identifying Gemini export-hook chrome inside a step.
// Gemini duplicates each step's subtitle as a hidden
// <span class="only-show-to-message-actions" style="display:none>…</span>
// purely for its own copy/export button. It carries no visible content (and
// is a verbatim repeat of the real subtitle, often with a trailing "。").
// The visually-hidden check by class above does NOT catch it (it relies on
// Gemini's own hidden-marker class, not display:none), so we drop it here by
// class to avoid the subtitle appearing twice in the output.
const SEQUENCE_EXPORT_HOOK_CLASS = /(^|\s)only-show-to-message-actions(\s|$)/;

function sequenceToMd(node, ctx) {
  const events = node.classList && node.classList.contains('sequence-event')
    ? [node]                                       // single step passed directly
    : Array.from(node.querySelectorAll('.sequence-event'));
  if (!events.length) {
    // No step rows — degrade to flattening rather than emitting nothing.
    return childrenToMd(node, ctx);
  }

  const lines = [];
  let i = 1;
  for (const ev of events) {
    const marker = `${i}. `;
    i++;

    // --- Gather the step's title / subtitle / description, skipping the
    //     marker number (we generate our own) and the hidden export-hook span.
    let title = '';
    let subtitle = '';
    let descriptionMd = '';

    const titleEl = ev.querySelector('.sequence-event-title');
    if (titleEl) title = childrenToMd(titleEl, ctx).trim();

    const subtitleEl = ev.querySelector('.sequence-event-subtitle');
    if (subtitleEl) subtitle = childrenToMd(subtitleEl, ctx).trim();

    const descEl = ev.querySelector('.sequence-event-description');
    if (descEl) {
      // Walk the description's children ourselves so we can DROP the hidden
      // export-hook span by class (querySelector(':scope > ...') is fiddly
      // across linkedom/native, so iterate childNodes).
      let desc = '';
      for (const child of descEl.childNodes) {
        if (child.nodeType === 1 && SEQUENCE_EXPORT_HOOK_CLASS.test(child.getAttribute('class') || '')) {
          continue;
        }
        desc += nodeToMd(child, ctx);
      }
      descriptionMd = desc.trim();
    }

    // --- Compose the step's first line: bold title, optional (subtitle).
    let head = title ? `**${title}**` : '';
    if (subtitle) head += head ? `（${subtitle}）` : subtitle;
    // (en locale uses different parens, but the subtitle text itself is
    // already localized by Gemini; we just wrap it. The visual is identical.)

    // --- Compose the rest: description prose + any nested list, each
    //     subsequent block indented under the marker so it belongs to this
    //     step (3 spaces aligns under "1. "). One blank line separates the
    //     head from the description so marked renders it as a multi-line
    //     list item rather than joining them with a space.
    const itemLines = [];
    if (head) itemLines.push(`${marker}${head}`);
    if (descriptionMd) {
      for (const dl of descriptionMd.split('\n')) {
        itemLines.push('   ' + dl);
      }
    }
    if (!itemLines.length) continue;          // empty step → skip
    if (!head) itemLines[0] = `${marker}${itemLines[0].trimStart()}`;
    lines.push(...itemLines);
  }

  return lines.length ? lines.join('\n') + '\n\n' : '';
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
  //
  // CRITICAL: this pass must NOT touch lines INSIDE a fenced code block
  // (```...```) — those leading spaces are real source-code indentation that
  // must survive into OneNote. We walk line-by-line tracking fence state.
  const lines = raw.split('\n');
  let inFence = false;
  const out = [];
  for (const line of lines) {
    if (inFence) {
      // Inside a fenced code block: only a column-0 ``` closes it. Every
      // other line — indented, blank, or even a stray indented ``` — is
      // source content and must be preserved verbatim.
      if (/^```/.test(line)) inFence = false;
      out.push(line);
      continue;
    }
    // Outside any code block. The converter emits fence markers at column 0,
    // but whitespace text nodes between block elements can leak leading spaces
    // onto an OPENING fence line (e.g. "    ```JavaScript"). Recognize such
    // lines and normalize them back to column 0.
    if (/^[ \t]*```/.test(line)) {
      inFence = true;
      out.push(line.replace(/^[ \t]+/, ''));
      continue;
    }
    // Outside code blocks: apply the original de-indent rules.
    const m = line.match(/^[ \t]+(\S.*?)?[ \t]*$/);
    if (!m) {              // no leading whitespace → leave as-is
      out.push(line);
      continue;
    }
    if (!m[1]) {           // whitespace-only line → blank it
      out.push('');
      continue;
    }
    if (/^([ ]{2})+([-*+] |\d+\. )/.test(line)) {  // genuine list indent → keep
      out.push(line);
      continue;
    }
    out.push(m[1]);        // strip pretty-print leading whitespace
  }
  const deIndented = out.join('\n');
  // Collapse 3+ newlines to exactly 2, and trim the whole thing.
  return deIndented.replace(/\n{3,}/g, '\n\n').replace(/^\s+|\s+$/g, '');
}
