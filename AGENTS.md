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
| `src/ui.js` | FAB (with a hover-revealed gear button for settings), per-message buttons, native-toolbar injection, toast. All in a Shadow DOM. |
| `src/platforms/base.js` | Adapter contract + `queryFirst` / `queryAll` fallback helpers. |
| `src/platforms/*.js` | One adapter per platform. ChatGPT & Gemini are calibrated; the rest are heuristic fallbacks. |
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

The FAB carries a hover-revealed **gear button** (a child element, so it
follows the FAB on drag without separate position-sync). Clicking it opens a
`prompt()` for the code-block monospace font; the value is read back by
`getCodeFont()` in `src/renderer.js` and placed first in the code-block
`font-family` stack (Consolas/Courier/monospace as fallback). Two keys live in
`localStorage`:

- `ai-copy-fab-position` — `{x,y}` of the FAB, saved on drag (`src/ui.js`).
- `ai-copy-code-font` — user font name; empty/absent → default Consolas
  (`src/ui.js` writes it, `src/renderer.js` reads it).

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
- Math renders in `<span class="math-inline">` (inline) / `<div class="math-block">`
  (block), each carrying the raw LaTeX in a `data-math` attribute and wrapping a
  `.katex` / `.katex-display` HTML+CSS render subtree. The converter detects
  these **by class** in `mathDataAttribute()` (intercepted before the
  `span`/`div` cases, since they're ordinary span/div — a `case 'math-inline'`
  in the switch would never fire) and reads `data-math`; the `.katex` subtree is
  dropped. See invariant #10.
- Images are wrapped in `<button class="image-button">`. `<button>` is
  intentionally **not** in `DROP_TAGS`; the converter flattens it only when it
  contains content, and drops it otherwise.
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

When Gemini ships a UI refresh and selectors break: see
[`docs/selector-notes.md`](./docs/selector-notes.md) for the recalibration
workflow (DevTools → update adapter → save fixture → update test → `npm test`).

## ChatGPT-specific note

ChatGPT's adapter has **no** `tooltipStyle` / `makeNativeButton` — it uses the
default clone-button path and default below/semibold tooltip. The standing
constraint from the maintainer is: **changes for other platforms must not
affect ChatGPT's UI.** When touching the Gemini path in `ui.js` or
`platforms/`, verify ChatGPT still goes through the default branch (i.e. your
code is gated on `adapter.tooltipStyle` / `adapter.makeNativeButton` existing).

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
- Run `npm test` before pushing — 105 tests should all pass.
- Keep the userscript header version in `build.mjs` in sync with
  `package.json` if you bump versions.
