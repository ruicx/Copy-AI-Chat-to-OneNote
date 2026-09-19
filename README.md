# Copy AI Chat to OneNote

[中文文档](./README_zh.md)

A Tampermonkey userscript that copies AI chat conversations — from **ChatGPT,
Gemini, Claude, DeepSeek, Kimi, Doubao** — to the clipboard so that pasting into
**OneNote** (UWP / desktop 2016 / web) preserves formatting: heading
hierarchy, tables, code blocks, lists, bold/italic. Instead of collapsing into
plain text, the conversation keeps its structure.

## Why this exists

AI platforms' built-in copy buttons output Markdown or framework-laden HTML.
OneNote's paste often prefers the plain-text slot, so tables flatten, headings
lose their level, and code blocks lose their styling. This script writes
**both `text/html` and `text/plain`** to the clipboard in one
`ClipboardItem` payload, with the HTML deliberately shaped to what OneNote
reliably preserves on paste.

## How it works

1. **DOM → Markdown** — `live page DOM` → `clean Markdown` (`converter.js`)
2. **Markdown → OneNote HTML** — Marked renders + OneNote post-processing (`renderer.js`)
3. **ClipboardItem write** — writes `text/html` + `text/plain` together (`clipboard.js`) → paste into OneNote keeps headings / tables / code / lists

- **Why convert to Markdown first, then re-render:** AI pages emit rendered
  HTML full of framework classes, inline styles, nested wrappers, copy
  buttons, syntax-highlight spans, and Angular/Lit custom elements. Normalising
  through Markdown washes that all away and keeps output consistent across
  platforms.
- **Why `ClipboardItem` with two formats:** OneNote sometimes prefers
  `text/plain` and flattens structure. Writing `text/html` (structure) +
  `text/plain` (fallback) makes OneNote parse the HTML.

See [`AGENTS.md`](./AGENTS.md) for the full architecture and the invariants
that keep paste fidelity working.

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) (Chrome / Edge /
   Firefox) or [Violentmonkey](https://violentmonkey.github.io/).
2. Click one of the install links below — the script manager will open an
   install dialog automatically:

   | Source | Link |
   |--------|------|
   | jsDelivr (faster in mainland China, no VPN) | **[install](https://cdn.jsdelivr.net/gh/ruicx/Copy-AI-Chat-to-OneNote@main/ai-chat-copy.user.js)** |
   | GitHub raw | **[install](https://raw.githubusercontent.com/ruicx/Copy-AI-Chat-to-OneNote/main/ai-chat-copy.user.js)** |

   > If neither link works, you can also copy the raw
   > [`ai-chat-copy.user.js`](./ai-chat-copy.user.js) and paste it into a new
   > Tampermonkey script manually.
3. Open any supported AI platform. A floating 📋 button appears at the
   bottom-right, and copy buttons appear in each message's native toolbar.

> After updating the script, re-click the same link to pull the latest version.

## Use

Three copy modes (the toolbar buttons match each platform's own button styling):

- **Whole conversation** — click the floating 📋 button. Toast says
  "Copied N messages". Paste into OneNote with `Ctrl+V`.
- **Single message** — hover a message, click the **clipboard** icon in its
  toolbar ("Copy this message to OneNote").
- **One turn** (user question + the assistant replies that follow, up to the
  next user question) — click the **clipboard-document** icon
  ("Copy this turn to OneNote"). Only shown on toolbars that have it.

> UI strings are bilingual: `zh-*` locales show Chinese, every other locale
> shows English (e.g. Chinese users see "复制本条到 OneNote" / "已复制 N 条消息").

**Images** become a `🖼️ [Image N: short caption]` placeholder in the pasted
text (Chinese locales: `🖼️ [图片 N：…]`). OneNote refuses `data:`-URL images
in pasted HTML (it shows a link + a security prompt instead of the bitmap),
and there's no way to carry a real bitmap alongside the formatted text in one
clipboard payload. The placeholder
tells you which image to grab — Gemini's own per-image copy button covers
this, or you can paste the image in afterwards.

**OneNote paste tip:** use the default `Ctrl+V` ("keep source formatting").

### Syntax highlighting in code blocks

Code blocks keep their **syntax colours** when pasted into OneNote — keywords,
strings, comments, numbers, etc. are each tinted. This works on **every**
supported platform (the highlighting is rendered by the script itself via
highlight.js, not borrowed from the page), with a curated set of common
languages:

`javascript / typescript` (incl. aliases `js`, `ts`), `python` (`py`),
`bash` (`sh`, `shell`), `cpp` (`c`, `c++`), `java`, `go`, `rust`, `sql`,
`json`, `xml` (`html`), `markdown`, `css`.

Code in an **unrecognised** language (or no language given) pastes as plain
monospace text — no colours, but the content is intact.

> Why colours survive OneNote: OneNote keeps inline `style="color:…"` but
> discards CSS classes and `<style>` blocks. The script rewrites every
> highlight token to an inline colour and drops the class, so the palette
> travels with the code.

### Custom code font (settings)

Prefer your own monospace font (e.g. `Maple Mono NF CN`, `JetBrains Mono`,
`Cascadia Code`)? Set it once:

1. **Hover** the floating 📋 button — a **⚙ gear** appears to its left.
2. **Click the gear** and type the font name (exactly as installed on your
   system), e.g. `Maple Mono NF CN`.
3. From the next copy on, code blocks use your font first, with
   `Consolas → Courier New → monospace` as the fallback if it's missing.

Clear the input (leave it empty) to reset to the default Consolas. The choice
is saved in `localStorage` and persists across sessions.

> The font must be installed on the **machine where you paste into OneNote**
> (OneNote renders with the local system's fonts; it won't download a font).
> As long as it's installed there, it takes effect.

## Supported platforms

| Platform | Status | Notes |
|----------|--------|-------|
| ChatGPT | ✅ Calibrated | `[data-message-author-role]` + `.markdown`. Native toolbar injection (default styling path). |
| Gemini | ✅ Calibrated | `<user-query>` / `<model-response>` custom elements, `<code-block>`, image-in-`<button>`, cloned `<gem-icon-button>` toolbar buttons matching Material styling. |
| Claude | ⚠️ Heuristic fallback | `[data-testid="user-message"]` + `[class*="prose"]`. Calibrate before relying on it. |
| DeepSeek | ✅ Calibrated | `.ds-message` turns + `.ds-markdown` content. Native toolbar injection (cloned `ds-button` beside the site's own copy button). KaTeX-annotation math and `md-code-block` code fences handled in the converter. |
| Kimi | ✅ Calibrated | `.segment-user` / `.segment-assistant` turns. Native toolbar injection (cloned `simple-button` / `icon-button` beside the site's copy button). `div.paragraph` / `segment-code` / `markdown-table` handled in the converter; math is decompiled from the KaTeX render tree back to LaTeX and pasted as native OneNote equations. |
| Doubao | ⚠️ Heuristic fallback | `[class*="message-item"]`. Calibrate before relying on it. |

> Selectors on Claude / Doubao are heuristic fallbacks. The
> first time you use them, confirm the selectors with DevTools — see
> [`docs/selector-notes.md`](./docs/selector-notes.md).

## Develop

```bash
npm install          # marked, esbuild, linkedom
npm test             # full automated suite (190 tests)
npm run build        # regenerate ai-chat-copy.user.js (LF line endings)
```

> **Never edit `ai-chat-copy.user.js` directly** — it's a build output. Change
> `src/`, then `npm run build`.

### Test layers

| Layer | Covers | Automated |
|-------|--------|:---------:|
| 1 | Converter + renderer + pipeline unit tests (linkedom) | ✅ |
| 2 | Adapter selectors (fixture-page regression) | ✅ |
| 3 | Clipboard multi-format write | Semi-manual (real browser) |
| 4 | OneNote end-to-end fidelity | Manual — matrix in [`test/onenote-verify.md`](./test/onenote-verify.md) |

Layers 1–2 cover ~80% of the logic and run before you ever open OneNote.
Layer 4 is the final fidelity check across the three OneNote versions.

### Project layout

```
ai-chat-copy.user.js     build output (the shipped userscript)
src/
  index.js               entry: pick adapter, mount UI, Trusted Types policy
  converter.js           ① DOM → Markdown (core)
  renderer.js            ② Markdown → OneNote-friendly HTML
  pipeline.js            orchestration: messages → {html, text}
  clipboard.js           ③ ClipboardItem write + fallback
  ui.js                  FAB, per-message buttons, toast (Shadow DOM)
  platforms/             one adapter per AI site
test/
  converter.test.js, renderer.test.js, pipeline.test.js
  adapter-{chatgpt,gemini}.test.js
  fixtures/*.html        saved page snapshots for regression
  onenote-verify.md      manual verification matrix + diagnostic page
docs/selector-notes.md   per-platform selectors + recalibration workflow
```

See [`AGENTS.md`](./AGENTS.md) for the adapter contract, the critical
invariants, and Gemini-specific notes.

## Troubleshooting

- **Paste is empty after copy** — the browser may have blocked the clipboard.
  Make sure the script header is `@grant none`, and paste **immediately** after
  clicking (clipboard writes have a timeout).
- **Gemini / Claude / etc. selector broke (buttons present but no message
  extracted)** — these platforms' DOM is obfuscated and changes often. Follow
  [`docs/selector-notes.md`](./docs/selector-notes.md): confirm selectors in
  DevTools, update `src/platforms/*.js`, refresh the fixture, run `npm test`.
- **OneNote desktop 2016 flattens tables to plain text** — a known issue. First
  confirm `text/html` is being written (use the diagnostic page in
  `test/onenote-verify.md`); the RTF fallback documented there is the
  contingency.
- **Copying mid-stream** — the script doesn't block this. Wait for the AI to
  finish before copying.

## License

MIT
