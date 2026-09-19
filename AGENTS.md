# AGENTS.md

Guidance for AI coding agents (and humans) working in this repo. Read this
before changing anything. It captures the architecture, the invariants that
must not be broken, and the workflow that keeps the build green.

## What this project is

A Tampermonkey userscript (`ai-chat-copy.user.js`) that copies AI chat
conversations (ChatGPT / Gemini / Claude / DeepSeek / Kimi / 豆包) to the
clipboard so that pasting into **OneNote** (UWP / desktop 2016 / web)
preserves formatting — heading hierarchy, tables, code blocks, **math
equations (native OneNote equations)**, lists, bold/italic — instead of
collapsing to plain text.

The shipped artifact is a single self-contained `.user.js`. Source lives in
`src/` and is bundled with esbuild (`build.mjs`).

## Architecture (the one diagram to hold in your head)

```
live page DOM ─▶ [① converter: DOM→Markdown] ─▶ clean Markdown
              ─▶ [② renderer: Marked + OneNote post-processing] ─▶ OneNote HTML
              ─▶ [③ clipboard: ClipboardItem {text/html, text/plain}]
```

**Why two stages (DOM → MD → HTML) and not DOM → HTML directly:** AI pages emit
rendered HTML full of framework classes, inline styles, nested wrappers, copy
buttons, syntax-highlight spans, and Angular/Lit custom elements. Going through
Markdown normalises all of that away so the output is clean and identical
across platforms. Do not "optimise" by short-circuiting this pipeline.

## File map

| Path | Role |
|------|------|
| `ai-chat-copy.user.js` | **Build output.** The shipped userscript. Do not hand-edit — regenerate with `npm run build`. |
| `src/index.js` | Userscript entry: pick adapter by host, install Trusted Types default policy, mount UI. |
| `src/converter.js` | **Stage 1.** `htmlToMd(input, ctx)` — recursive DOM→Markdown. The core file; most format logic lives here. |
| `src/renderer.js` | **Stage 2.** `mdToOneNoteHtml(md)` — Marked + post-processing into OneNote-friendly HTML (styled `<div>` for code, `border="1"` on tables, OneNote heading style). Also registers highlight.js languages and renders syntax-highlighted code blocks with inline colors (see invariant #5), and renders math (`$…$`/`$$…$$`) to Presentation MathML via Temml (see invariant #10). |
| `src/pipeline.js` | Orchestration: `renderMessage`, `renderConversation`, `renderTurn`, `findTurnIndex`. Adds role badges + dividers at the HTML layer. |
| `src/clipboard.js` | **Stage 3.** `copyForOneNote(html, text)` — `ClipboardItem` write with `execCommand` fallback. |
| `src/i18n.js` | Bilingual string table (zh/en) + `t(key, vars)`. Locale detected once from `navigator.language` (`zh*` → zh, else en). |
| `src/ui.js` | FAB (with a hover-revealed tool cluster: gear = code font, swatch = site logo), per-message buttons, native-toolbar injection, toast. All in a Shadow DOM. |
| `src/logo.js` | Optional brand disguise (`ai-copy-logo` setting): replaces Gemini's sparkle `<img>` / ChatGPT's blossom + wordmark with the Kimi or DeepSeek mark (embedded simple-icons paths, self-contained), and renames the composer placeholder + disclaimer pill on BOTH hosts to the brand name. Unset = zero DOM writes. Runs at boot + a debounced MutationObserver + a settle-based `setInterval` safety net (SPA re-renders; swaps EVERY logo instance, not just the first). |
| `src/platforms/base.js` | Adapter contract + `queryFirst` / `queryAll` fallback helpers. |
| `src/platforms/*.js` | One adapter per platform. ChatGPT, Gemini, DeepSeek & Kimi are calibrated; the rest are heuristic fallbacks. |
| `test/` | Node `node:test` suite. Converter/renderer/pipeline run via linkedom; adapters run against `test/fixtures/*.html`. |

## Adapter contract (`src/platforms/base.js`)

Each platform adapter exports a default object:

```js
{
  host: string | string[],         // hostname(s) this adapter handles
  name: string,                    // human-readable
  getMessageElements(): Element[], // each message bubble (for per-msg UI)
  getRole(el): 'user' | 'assistant',
  getMessages(): { role, el }[],   // full conversation, DOM order

  // Optional — native toolbar injection (ChatGPT, Gemini implement this):
  getNativeToolbars(): { toolbar, content, role, insertAfter? }[],

  // Optional — per-platform native button factory (Gemini implements this):
  makeNativeButton(toolbar, title, double): Element,

  // Optional — per-platform tooltip style (Gemini implements this):
  tooltipStyle: { position, fontWeight, fontFamily },
}
```

If a platform omits the optional hooks, `ui.js` falls back to:
clone-an-existing-button, default below/semibold tooltip, and an overlay button
per message. **Keep that fallback path intact** — it is what ChatGPT relies on
and what uncalibrated platforms fall back to.

## Settings & localStorage keys

The FAB carries a hover-revealed **tool cluster** (child elements, so they
follow the FAB on drag without separate position-sync): a **gear button**
opening a `prompt()` for the code-block monospace font — the value is read
back by `getCodeFont()` in `src/renderer.js` and placed first in the
code-block `font-family` stack (Consolas/Courier/monospace as fallback) —
and a **swatch button** opening a `prompt()` for the site-logo swap
(`kimi` / `deepseek` / empty = restore default; applied immediately via
`applyLogoSwap()` in `src/logo.js`, re-applied on SPA re-renders by a
debounced MutationObserver). Three keys live in `localStorage`:

- `ai-copy-fab-position` — `{x,y}` of the FAB, saved on drag (`src/ui.js`).
- `ai-copy-code-font` — user font name; empty/absent → default Consolas
  (`src/ui.js` writes it, `src/renderer.js` reads it).
- `ai-copy-logo` — `'kimi'` | `'deepseek'`; absent/empty = feature fully
  inert, the host page is untouched (`src/ui.js` writes it via
  `promptLogoChoice`, `src/logo.js` reads and applies it).

## Critical invariants (do not break these)

1. **Never edit `ai-chat-copy.user.js` directly.** Change source in `src/`,
   then `npm run build`. The build enforces LF line endings (Windows CRLF
   breaks some Tampermonkey checks).
2. **`@grant none`.** The script uses page-native APIs (`navigator.clipboard`,
   `ClipboardItem`). Do not switch to `GM_setClipboard` — it cannot write
   `text/html` + `text/plain` in one payload, which is the whole reason
   OneNote paste works.
3. **Clipboard write must stay inside the click call stack.** Browsers reject
   `navigator.clipboard.write` without a user activation. Never move it into a
   `setTimeout` / `requestAnimationFrame` / promise microtask detached from the
   gesture.
4. **Two-stage pipeline.** See architecture above. Don't short-circuit.
5. **OneNote HTML constraints** (renderer must keep producing these — they are
   why paste fidelity works, per
   [OneNote input/output HTML docs](https://learn.microsoft.com/en-us/graph/onenote-input-output-html)):
   - Code blocks: styled `<div>` with bg + monospace, **not** bare `<pre><code>`
     (OneNote drops `<pre>` semantics). Since v0.2.0 the body is also
     **syntax-highlighted** via highlight.js (`lib/core` + a curated set of
     languages, registered in `src/renderer.js`). hljs emits class-based
     tokens (`class="hljs-keyword"`), but OneNote keeps neither class names
     nor `<style>` blocks — so `rewriteClassesToInlineColor()` rewrites each
     token to **inline `style="color:…"`** from the `TOKEN_COLORS` table (a
     GitHub-light palette chosen for legibility on the `#f6f8fa` background)
     and **strips the class**. Unregistered/unknown languages fall back to
     plain escaped text — identical to pre-highlighting behaviour, zero
     regression. The converter (`src/converter.js`) is **not** involved; the
     language comes straight from the Markdown fence info and flows through
     hljs's own alias table (`js`→javascript, `py`→python, `sh`→bash, …).
   - Tables: `border="1"` **attribute** (style border is ignored), no
     rowspan/colspan.
   - Headings: OneNote's exact inline style (`color:#1e4e79` + its font-size/margin)
     so paste maps to real heading styles.
6. **Trusted Types.** `src/index.js` installs a permissive default policy so
   innerHTML works on Gemini (which enforces Trusted Types). Keep that policy
   install wrapped in try/catch — it can only be created once per document.
7. **`findTurnIndex` uses DOM-containment fallback, not strict `===`.**
   Adapters expose message elements via two different DOM paths that don't
   always return the exact same node. Don't "simplify" it back to strict
   equality — the "copy turn" feature (复制本轮 / "Copy this turn") will break.
8. **All user-facing strings go through `t()`** (src/i18n.js). Every toast,
   button title, the role badge, and the image placeholder must be looked up
   via `t(key, vars)` — never hardcoded. The table has exactly two locales,
   zh and en; `zh*` navigator languages resolve to zh, everything else to en.
   When adding a string, add it to BOTH columns or the en fallback path will
   render the key literally. Test files that assert on a specific locale's
   output must `setLocale()` first (Node has no `navigator.language`, so the
   default is en — and `node:test` shares the module-level cache across files).
9. **Image handling = placeholder, not `data:` URL.** OneNote refuses `data:`
   images in pasted HTML (security prompt + link shown instead of the bitmap).
   The converter emits `🖼️ [Image N: shortAlt]` placeholders (zh: `🖼️ [图片 N：…]`)
   numbered via a shared `ctx.imgSeq` across the whole conversation. Real quotes must stay as
   `> ` blocks — `isImageCaptionBlock()` discriminates Gemini image-caption
   blockquotes from real quotations; don't flatten all blockquotes.
10. **Math = embedded Presentation MathML, not KaTeX's HTML+CSS render.** This
    is the same constraint that drives inline-coloured code highlighting
    (invariant #5): OneNote's paste path **drops class names and `<style>`
    blocks**, so KaTeX's `.katex`/`.katex-html` render tree (classes + inline
    styles + KaTeX web fonts) would collapse to meaningless plain text on paste.
    But OneNote's HTML parser **extracts `<math>...</math>` blocks and hands
    them to its MathML importer**, which converts them to **native Office Math
    (OMML) equations** (see the [MathML support doc](https://learn.microsoft.com/en-us/office/math/mathml);
    it accepts Presentation MathML). So:
    - **Converter** reads the raw LaTeX from the source and emits `$…$` (inline)
      / `$$…$$` (block). For Gemini that source is the `data-math` attribute on
      `<span class="math-inline">` / `<div class="math-block">` — **not** the
      rendered `.katex` tree. The `.katex` subtree is dropped entirely.
    - **Renderer** registers `$`/`$$` as `marked` extensions and renders them
      with Temml (`temml.renderToString(tex, {displayMode, throwOnError:false})`),
      which outputs a bare `<math>…</math>` (no KaTeX-style span wrapper).
      `throwOnError:false` means bad LaTeX degrades to a literal fallback, never
      an exception that would abort the whole copy.
    - Because math is a marked extension, a `$` **inside a fenced code block**
      is never mistaken for math (marked tokenises the fence first).
    Do not "optimise" by switching to KaTeX HTML rendering or by reading the
    visible `.katex` text — both break the paste.

## Gemini-specific notes (the fiddly platform)

Gemini is Angular/Lit with obfuscated, frequently-changing class names and
custom elements. The adapter is calibrated against a real saved page; it is the
most fragile part of the codebase. Key things:

- Turns are `<user-query>` / `<model-response>` custom elements. Content sits
  in `.query-text` (user) and `.markdown.markdown-main-panel` (assistant).
- Code renders in a `<code-block>` custom element, **not** `<pre>`. The
  converter has a dedicated `case 'code-block'` — if you delete it, code blocks
  corrupt (the language label fuses with the opening fence and swallows the
  rest of the message).
- Numbered "step list" (步骤列表) renders in a `<sequence>` custom element,
  **not** `<ol>`. Each step is a plain sibling `<div class="sequence-event">`
  (not `<li>`) with the number in `.sequence-event-marker`, the title in
  `.sequence-event-title`, an optional `.sequence-event-subtitle`, and the
  prose in `.sequence-event-description` (often wrapped in
  `<structured-node-sequence><structured-text><p>`, and may hold a nested
  `<structured-list><ul><li>`). The converter has a dedicated
  `case 'sequence'` → `sequenceToMd()` — if you delete it, every step's
  number+title+subtitle+prose get mashed onto a single line and all the line
  breaks between steps vanish. Each step's subtitle is also duplicated as a
  hidden `<span class="only-show-to-message-actions" style="display:none>`
  (Gemini's own export hook); `sequenceToMd` drops it by class so the subtitle
  doesn't appear twice (`isVisuallyHidden()` won't catch it — it matches
  Gemini's hidden-marker *classes*, not `display:none`).
- Math renders in `<span class="math-inline">` (inline) / `<div class="math-block">`
  (block), each carrying the raw LaTeX in a `data-math` attribute and wrapping a
  `.katex` / `.katex-display` HTML+CSS render subtree. The converter detects
  these **by class** in `mathDataAttribute()` (intercepted before the
  `span`/`div` cases, since they're ordinary span/div — a `case 'math-inline'`
  in the switch would never fire) and reads `data-math`; the `.katex` subtree is
  dropped. See invariant #10.
- Images are wrapped in `<button class="image-button">`. `<button>` is
  intentionally **not** in `DROP_TAGS`; the converter keeps the button's
  children when it holds an `<img>`/block content (image-button), keeps its
  text label as its own block when it carries real text (ChatGPT 2026 rich
  cards render their 课程官网/公开视频 link pills as `<button>`), and drops
  it when nothing convertible remains (icon-only action buttons — the svg is
  dropped, so nothing is left).
- The native toolbar buttons are cloned from Gemini's own `<gem-icon-button>`
  and its `<mat-icon>` (a lumino font ligature) is **replaced** with a heroicons
  SVG `<span>`. Capture `getComputedStyle(matIcon).fontSize` **before** the
  replacement — after the node is gone, `1em` re-resolves to the button's
  font-size and the icon renders at the wrong size.
- AI toolbar button placement anchors on `btn.closest('copy-button')` (the
  wrapper, a direct child of the toolbar), guarded by
  `toolbar.contains(insertAfter)`. User toolbar appends at the **end** (no
  `insertAfter`) so it doesn't land between 复制提示 and 修改提示.
- `tooltipStyle.position` is `'below'` (Gemini's own tooltips pop down).
- The logo-swap setting (`src/logo.js`) targets the top-left mark via
  `img.sparkle-image` inside `<side-nav-sparkle-button>` (src swapped to a
  data-URI SVG — the site's CSS keeps it sized 22×22, and the embedded SVG
  carries its own `prefers-color-scheme: dark` fill flip, since an `<img>`
  can't inherit page colors) and the "Gemini" wordmark
  (`.gemini-sidenav-text` in the same `<a>`, hide + clone). Angular may
  re-create these or toggle `.expanded` on sidebar expand — the debounced
  MutationObserver (childList + class/style attributes) re-syncs.
- *Text disguise (same setting):* the composer placeholder ("问问 Gemini")
  and the disclaimer pill follow the brand name too. The composer is Quill:
  `<div class="ql-editor ql-blank" data-placeholder="…">` inside
  `<rich-textarea>`, visible copy rendered by
  `rich-textarea .ql-editor.ql-blank:before{content:attr(data-placeholder)}`
  plus a visibility:hidden `::after` on the same attribute (measurement
  hack). Same treatment as ChatGPT's placeholder (see swapBrandTexts):
  mutate the attribute + rewrite any real text inside + inject a
  `content:"…"` override keyed on the ORIGINAL value for the pseudo(s)
  `getComputedStyle` shows rendering. The disclaimer is a plain Angular
  text node inside the `<hallucination-disclaimer>` custom element (present
  only in some page states). Never touched: conversation body, aria-labels
  ("为 Gemini 输入提示"), and `data-placeholder`s without the site name.
  Fixture: `test/fixtures/gemini-text.html` (4533d54c / 11f1b52d).

When Gemini ships a UI refresh and selectors break: see
[`docs/selector-notes.md`](./docs/selector-notes.md) for the recalibration
workflow (DevTools → update adapter → save fixture → update test → `npm test`).

## DeepSeek-specific notes (calibrated 2026-09)

Calibrated against a saved live page; fixture
`test/fixtures/deepseek-sample.html` (extracted from a "对话格式测试内容"
conversation; code bodies truncated, decorative svg paths shortened,
`.katex-html` stubbed, our capture-time overlay-button artifacts stripped).

- Turns are `div.ds-message` nodes inside a `ds-virtual-list` (messages
  mount/unmount on scroll — the ui.js MutationObserver rescan handles fresh
  bars; keyed mounts mean a bound bar never switches content). User/assistant
  WRAPPER classes are obfuscated per build, so roles are detected via content
  markers: assistant content root is
  `.ds-markdown.ds-assistant-message-main-content`, user content is plain text
  in `.ds-collapsible-text`.
- Native action bars: a `.ds-flex` holding `[role=button].ds-button` icon
  buttons — assistant: [copy][regenerate][like][dislike][share][more]; user:
  [copy][edit]. The bar is a SIBLING of `.ds-message`; the FIRST `.ds-button`
  in every bar is DeepSeek's own copy button (16px svg path starting
  `M6.14929 4.02032…` — used as the `insertAfter` anchor for both roles, with
  first-button fallback if the icon changes). `makeNativeButton` clones a
  `.ds-button` from that bar and swaps the `<svg>` inside `.ds-icon` for our
  16px heroicons clipboard. Note: the code-block banners INSIDE the message
  also carry ds-buttons (复制/下载) — `actionBarOf()` filters out anything
  contained by `.ds-message`.
- Code blocks: `div.md-code-block` (ordinary div — intercept, not a switch
  case) = `.md-code-block-banner` (FIRST span = language label; 复制/下载
  buttons follow) above a bare `<pre>` with **no `<code>` child** and Prism
  `token …` spans. Converter: `isDeepSeekCodeBlock()` /
  `deepseekCodeBlockToMd()` — without it the banner text leaks in front of an
  unlabeled fence ("javascript复制下载" + ```).
- Math: KaTeX with **no `data-math` attribute and (for inline math) no
  site class at all** — inline is a bare `<span class="katex">`, display is
  `<span class="katex-display ds-markdown-math">`. The raw LaTeX lives in
  KaTeX's hidden MathML twin:
  `<annotation encoding="application/x-tex">`. Converter:
  `katexAnnotationTex()` intercepts the KaTeX ROOT span (class `katex` /
  `katex-display`, explicitly excluding `katex-html`/`katex-mathml`), reads
  the annotation, and emits `$…$`/`$$…$$`. This also backstops Gemini's
  fallback path (nested `.katex` inside a wrapper whose `data-math` went
  missing). Flattening the `.katex-html` subtree instead mashes glyphs into
  garbage ("E=mc2E = mc^2E=mc2") — don't.
- Tables: DeepSeek's served HTML omits `</th>`/`</td>` closing tags. Real
  browsers auto-close them so the LIVE DOM is a well-formed table — but
  linkedom does NOT, so the fixture rewrites the test table to the
  browser-parsed form before parsing (see the comment in the fixture).
- Task lists: `li.ds-markdown-task-list-item` carries the checkbox as a
  literal glyph span (`span.ds-markdown-task-checkbox` → "□ " / "☑ "). The
  glyph is kept as text (checked/unchecked state survives into OneNote); no
  converter special-casing.
- Untouched/unsupported: `ds-markdown-cite` markers (none observed in the
  calibration page), R1 thinking blocks (no fixture), search-result cards.

## Kimi-specific notes (calibrated 2026-09)

Kimi's web app moved to **www.kimi.com** (the adapter keeps
`kimi.moonshot.cn` for older installs). Calibrated against a saved live page;
fixture `test/fixtures/kimi-sample.html` (extracted from an "OneNote测试"
conversation; code bodies truncated, all but one inline/display math wrapper
removed). Kimi is a Vue/Nuxt app — cloned buttons must KEEP their `data-v-…`
scoped-CSS attributes or the styles won't apply.

- Turns are `div.segment.segment-user` / `div.segment.segment-assistant`.
  User content is plain text (`span.user-content__text`); assistant content is
  the `.markdown` that is NOT inside `.thinking-container`/`.toolcall-flow`
  (those hold the reasoning and tool-call rollups, which also contain their
  own `.markdown` — taking the first `.markdown` naively copies the thinking).
  NOTE: `turns()` must use a comma-union `querySelectorAll`, NOT base.js
  `queryAll` (a fallback list — first match wins would drop the assistant
  segments).
- Native action bars: user [Edit][Copy][Share] as `.simple-button`s; assistant
  [Copy] (+ more behind hover) as `.icon-button`s — two different button
  components. Both wrap an iconified `<svg name="IconName">`; the anchor is
  the button wrapping `svg[name="Copy"]` (both roles). `makeNativeButton`
  clones the bar's own button and swaps the svg, preserving its class.
- Converter intercepts (Kimi section in `src/converter.js`):
  - `div.paragraph` — paragraphs are DIVs, not `<p>`; left generic they fuse
    onto one line.
  - `div.segment-code` — header bar (`.segment-code-lang` label + 复制
    button) above `.syntax-highlighter > pre.language-… > code`. The
    `language-` class exists on BOTH pre and code.
  - `div.markdown-table` — a header bar ("表格 复制") plus a REAL `<table>`
    inside `.table-container`; only the header must be dropped.
  - `span.katex-wrapper` math — KaTeX with output:'html' ONLY: no MathML
    twin, no `annotation`, no `data-math` — the raw LaTeX is unrecoverable
    from the DOM. Honest degradation: keep the linearized glyphs as text,
    own line for display (`math-display`). Do NOT emit `$…$` (the glyphs
    are not LaTeX; Temml would mangle them).
- Task lists come through as literal `[x] ` / `[ ] ` text in the li — kept
  as-is, which marked's GFM then renders as ☑/☐ (same as real task syntax).
- Untouched/unsupported: search-result cards (`okc-cards-container`),
  mermaid diagrams, chat-entry UI chrome.

## ChatGPT-specific note

ChatGPT's adapter has **no** `tooltipStyle` / `makeNativeButton` — it uses the
default clone-button path and default below/semibold tooltip. The standing
constraint from the maintainer is: **changes for other platforms must not
affect ChatGPT's UI.** When touching the Gemini path in `ui.js` or
`platforms/`, verify ChatGPT still goes through the default branch (i.e. your
code is gated on `adapter.tooltipStyle` / `adapter.makeNativeButton` existing).

The one deliberate exception is the **logo-swap setting** (`src/logo.js`),
which is opt-in for ChatGPT too: with `ai-copy-logo` unset it writes NOTHING
to the page. ChatGPT is React-managed — never mutate or remove React-owned
nodes there (a changed child list can make the reconciler throw
`NotFoundError`). `swapChatGPT` therefore only sets `style.display` on the
site's blossom `<svg>` (found via `use[href="#blossom"]`) and
`.header-wordmark`, and inserts our own clones (same classes, brand content,
`data-ai-copy-logo` marker) beside them; originals keep a
`data-ai-copy-orig` marker so `restoreLogos()` can unhide them. Application
is settle-based — zero DOM writes once the swap is in place — so the
MutationObserver never re-triggers itself. **Every blossom/wordmark instance
in the document is swapped** (not just the first): ChatGPT keeps the expanded
sidebar, the collapsed rail, and mobile variants mounted side by side, and a
single-slot lookup pinned to the first hidden original left a freshly
mounted blossom (sidebar collapse re-creates the rail) showing the site logo
forever (saved-page regression 38bd709d). Because the debounced observer can
react late or be starved by page churn, a settle-based `setInterval`
re-apply (~1.5s) acts as a safety net: it writes nothing once settled. If
both `use[href*=#blossom]` and `symbol#blossom` lookups miss (a future build
renames the mark), the fallback swaps the first svg inside
`button[aria-controls="stage-slideover-sidebar"]` — the sidebar container id
is not localized, the aria-label is. The swap itself is silent (the
diagnostic per-apply `[ai-copy] logo → …` log was removed in v0.4.3); boot
still logs `[ai-copy] active on <site> v<version>` (version is a build.mjs
esbuild define) so a stale Tampermonkey install is easy to spot.

**ChatGPT 2026 UI notes:**
- *Logo swap:* the expanded sidebar header has no icon element — the 主页
  link holds only an (empty) `.header-wordmark` span, so the text-only clone
  matches the native look; the maintainer deliberately wants NO icon inlined
  there. The `#blossom` svg exists solely inside the collapsed rail's
  "打开侧边栏" button (invisible while the sidebar is expanded). Fixture:
  `test/fixtures/chatgpt-logo.html`.
- *Text disguise (same setting):* the two visible "ChatGPT" text slots follow
  the brand name — the composer placeholder and the thread disclaimer pill
  (`[data-testid=thread-disclaimer]`, swapped as an in-place React text-node
  rewrite, locale-agnostic via a name-contains guard). The placeholder's
  visible copy is rendered through a PSEUDO-ELEMENT reading
  `data-placeholder`, and WHICH pseudo changed across builds (old pages:
  unscoped `.placeholder:before{content:attr(data-placeholder)}`; current:
  `.wcDTda_prosemirror-parent.default-browser .placeholder:after` via
  `--tw-content:attr(...)`, Firefox a `:before` variant). So three
  complementary in-place writes, never a blind CSS injection (injecting
  `::before` on the current build double-rendered "问问 Kimi问问 ChatGPT",
  regression screenshot 2026-09): (1) mutate the `data-placeholder`
  attribute; (2) rewrite any real text inside the p; (3) inject a
  `content:"…"` override rule keyed on the placeholder's ORIGINAL attribute
  value, injected ONLY for the pseudo-element(s) `getComputedStyle` shows
  are actually rendering. Keying on the original value is what survives
  ProseMirror's placeholder decoration resetting the attribute between
  settle passes (live regression 2026-09: an attr swap alone never stuck);
  the rule keeps hitting in every attribute state and self-disables while
  typing, when the p loses the attribute. Deliberately untouched: the
  conversation body (copy output must stay byte-exact), the sr-only
  "ChatGPT 说：" turn labels, aria-labels, and the display:none fallback
  `<textarea placeholder=…>`. Regression fixtures:
  `test/fixtures/chatgpt-text.html` (carries both placeholder variants; the
  pseudo-override path is tested with a getComputedStyle stub).
- *Apply isolation:* every independent step of `swapChatGPT` (blossom loop,
  wordmark loop, placeholder, disclaimer) runs in its own try/catch behind
  detached-node guards (`isConnected`, `ensureClone`'s parent check) — React
  can detach a scanned node between our scan and our write, and one step's
  exception used to kill the whole pass, so a slot mounted later never got
  swapped. Failures are recorded silently and surfaced by the opt-in
  `window.__aiCopyLogoDebug()` console hook (version, choice, current
  placeholder values, style injected, observer/interval active, lastError).
- *FAB host:* `createShadowRoot()` in `src/ui.js` appends the host under
  `<body>`, never `<html>` — a stray div directly under `<html>` gets wiped
  by the site's cleanup passes some time after boot, which made the FAB
  disappear entirely (per-message buttons survive because they live inside
  the message tree). `keepHostAttached()` re-appends the host if anything
  detaches it.
- *Rich cards (recommendation cards):* assistant messages can embed
  component-library divs (`data-d-component="box|row|badge|title|text|
  caption|popover-trigger"`, obfuscated classes like `oIb9lq_Box`) laid out
  as a **two-column row: thumbnail image column + text column**. All of
  these flatten inline, and the card's title is an `<h2>` wrapping a
  one-item `<ol start="N">` (the visible "1./2./…" numbering — `start` must
  be honored or every card renumbers to "1."). Two converter behaviours
  exist because of these cards: **block-level emissions guarantee a fresh
  line** (`withFreshLine()` in `src/converter.js` — blocks that follow
  inline-flattened divs/spans must not fuse onto the same line, e.g.
  `重点推荐 · 机器人方向## 2. Stanford CS234…` or `CS 224R+1学习资源`), and
  **text-bearing `<button>`s keep their label as a block** (the
  课程官网/公开视频 pills). Regression: convert a saved card page and check
  that badge/heading/label/button lines are all separate.

### ChatGPT code blocks: the CodeMirror widget (2026 UI)

ChatGPT no longer renders code as `<pre><code class="language-…">`. Each block
(assistant AND user messages) is a component div marked
`data-client-defined-widget="code_block"` (mirrored by
`data-d-component="code_block"`) whose **sticky header — icon `<svg>` +
language label as plain text + a copy `<button>` (aria-label only, no text) —
sits ABOVE** a CodeMirror `<pre class="cm-content"><code>…</code></pre>` that
carries **no `language-` class**. These are ordinary divs, so a switch case can
never fire; the converter intercepts them upstream
(`isCodeBlockWidget()` / `codeBlockWidgetToMd()` in `src/converter.js` — same
pattern as the Gemini math intercept). Without the intercept the outer div
flattens and the header label fuses onto the opening fence (the label glued
directly in front of the `` ` `` marks, e.g. `` dockerfile```FROM … ``) — the
exact regression to watch for if this breaks again. Language recovery is
clone-and-strip: remove `pre`/`button`/`svg` from a
clone; the remaining trimmed text is the label, used as fence info only if it
matches `/^[\w+#.-]{1,24}$/` (labels arrive capitalized, e.g. `PowerShell`;
`highlightToHtml` lowercases before the hljs lookup). Regression fixtures:
`test/fixtures/chatgpt-codeblock.html` (also documents that the assistant
content root is now `.puik-root not-prose not-markdown` — the adapter's
`[class*="markdown"]` substring fallback resolves to it; `.markdown` is gone).

## Build & test

```bash
npm install        # marked, esbuild, linkedom
npm test           # full suite (node:test) — must stay green
npm run build      # regenerate ai-chat-copy.user.js (enforces LF)
```

Test layers (by automation level):

1. **Converter + renderer + pipeline unit tests** — fully automated, run under
   linkedom. ~80% of the logic lives here. These must pass before touching
   OneNote.
2. **Adapter selector tests** — run against `test/fixtures/*.html` snapshots.
   This is the regression net for platform UI changes.
3. **Clipboard write** — semi-manual (needs a real browser + user gesture).
   Diagnostic page in [`test/onenote-verify.md`](./test/onenote-verify.md).
4. **OneNote end-to-end fidelity** — manual, three OneNote versions. Matrix in
   `test/onenote-verify.md`.

When adding converter behaviour, add a converter test first (TDD). When
recalibrating a platform, save a fixture and add an adapter test.

## Commit / PR conventions

- Build before committing if `src/` changed: `npm run build`, then commit both.
- Run `npm test` before pushing — 189 tests should all pass.
- Keep the userscript header version in `build.mjs` in sync with
  `package.json` if you bump versions.
