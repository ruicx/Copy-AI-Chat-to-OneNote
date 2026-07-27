// ==UserScript==
// @name         AI 对话一键复制到 OneNote
// @namespace    https://github.com/xie-rc/gemini_copy
// @version      0.1.0
// @description  复制 AI 对话（ChatGPT/Gemini/Claude/DeepSeek/Kimi/豆包）到剪贴板，粘贴 OneNote 时保留标题层级/表格/列表/代码块等格式
// @author       xie-rc
// @match        https://gemini.google.com/*
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @match        https://claude.ai/*
// @match        https://chat.deepseek.com/*
// @match        https://kimi.moonshot.cn/*
// @match        https://www.doubao.com/chat/*
// @grant        none
// @run-at       document-idle
// @license      MIT
// ==/UserScript==

(() => {
  // src/platforms/base.js
  function queryFirst(selectorList, root4 = document) {
    for (const sel of selectorList) {
      try {
        const el = root4.querySelector(sel);
        if (el) return el;
      } catch (_) {
      }
    }
    return null;
  }
  function queryAll(selectorList, root4 = document) {
    for (const sel of selectorList) {
      try {
        const els = root4.querySelectorAll(sel);
        if (els.length) return Array.from(els);
      } catch (_) {
      }
    }
    return [];
  }

  // src/platforms/chatgpt.js
  var ROLE_ATTR = "data-message-author-role";
  function messageTurns() {
    return queryAll([`[${ROLE_ATTR}]`]).filter((el) => {
      const r = el.getAttribute(ROLE_ATTR);
      return r === "user" || r === "assistant";
    });
  }
  function contentOf(turn) {
    const role = turn.getAttribute(ROLE_ATTR);
    let content = turn.querySelector(".markdown") || turn.querySelector('[class*="markdown"]') || turn.querySelector(".whitespace-pre-wrap");
    if (!content) {
      const divs = turn.querySelectorAll(":scope > div");
      content = divs[divs.length - 1] || turn;
    }
    return { role, content };
  }
  var chatgpt_default = {
    host: ["chatgpt.com", "chat.openai.com"],
    name: "ChatGPT",
    getMessageElements() {
      return messageTurns();
    },
    getRole(el) {
      const r = el?.getAttribute?.(ROLE_ATTR);
      return r === "user" ? "user" : "assistant";
    },
    getMessages() {
      return messageTurns().map((turn) => {
        const { role, content } = contentOf(turn);
        return { role, el: content };
      });
    },
    /**
     * ChatGPT renders its own action toolbar under each message, containing
     * native buttons like 复制回复 / 喜欢. We inject our own buttons INTO these
     * toolbars so they match the site's look exactly.
     *
     * Located via the stable data-testid="copy-turn-action-button" (the toolbar
     * is that button's parent), with aria-label / role=group as fallbacks.
     * Role is decided by whether the toolbar has an "编辑消息" button (user-only).
     *
     * Returns one entry per message toolbar: { toolbar, content, role }.
     */
    getNativeToolbars() {
      const out = [];
      let copyBtns = queryAll(['[data-testid="copy-turn-action-button"]']);
      if (!copyBtns.length) {
        copyBtns = queryAll([
          '[aria-label="\u590D\u5236\u56DE\u590D"]',
          '[aria-label="\u590D\u5236\u6D88\u606F"]',
          '[aria-label="Copy response"]',
          '[aria-label="Copy message"]'
        ]);
      }
      const seen = /* @__PURE__ */ new Set();
      for (const btn of copyBtns) {
        const toolbar = btn.parentElement;
        if (!toolbar || seen.has(toolbar)) continue;
        seen.add(toolbar);
        const hasEdit = !!toolbar.querySelector(
          '[aria-label="\u7F16\u8F91\u6D88\u606F"], [aria-label="Edit message"], [data-testid="edit-message-action-button"]'
        );
        const role = hasEdit ? "user" : "assistant";
        const content = findContentAncestor(toolbar);
        if (content) out.push({ toolbar, content, role });
      }
      return out;
      ;
    }
  };
  function findContentAncestor(toolbar) {
    let node = toolbar;
    for (let depth = 0; depth < 8 && node; depth++) {
      node = node.parentElement;
      if (!node) break;
      const content = node.querySelector(".markdown") || node.querySelector('[class*="markdown"]') || node.querySelector(".whitespace-pre-wrap");
      if (content) return content;
    }
    return null;
  }

  // src/platforms/gemini.js
  function turns(root4) {
    const merged = [...root4.querySelectorAll("user-query, model-response")];
    if (merged.length) return merged;
    return [...root4.querySelectorAll('[class*="conversation-turn"]')];
  }
  function contentOf2(turn) {
    const tag2 = turn.tagName.toLowerCase();
    if (tag2 === "user-query") {
      return turn.querySelector(".query-text") || turn;
    }
    if (tag2 === "model-response") {
      return turn.querySelector(".markdown") || turn.querySelector(".model-response-text") || turn;
    }
    return turn.querySelector(".query-text") || turn.querySelector(".markdown") || turn;
  }
  function roleOf(turn) {
    const tag2 = turn.tagName.toLowerCase();
    if (tag2 === "user-query") return "user";
    if (tag2 === "model-response") return "assistant";
    const hint = turn.className || "";
    return /query|user/i.test(hint) ? "user" : "assistant";
  }
  var gemini_default = {
    host: ["gemini.google.com"],
    name: "Gemini",
    getMessageElements() {
      return turns(document);
    },
    getRole(el) {
      return roleOf(el);
    },
    getMessages() {
      return turns(document).map((turn) => ({ role: roleOf(turn), el: contentOf2(turn) }));
    }
  };

  // src/platforms/claude.js
  function turns2() {
    const userMsgs = queryAll(['[data-testid="user-message"]']);
    const assistantMsgs = queryAll([
      '[class*="prose"]',
      ".font-claude-message",
      'div[data-testid][class*="message"]'
    ]).filter((el) => !el.closest('[data-testid="user-message"]'));
    return { userMsgs, assistantMsgs };
  }
  var claude_default = {
    host: ["claude.ai"],
    name: "Claude",
    getMessageElements() {
      const { userMsgs, assistantMsgs } = turns2();
      return [...userMsgs, ...assistantMsgs];
    },
    getRole(el) {
      return el.closest('[data-testid="user-message"]') || el.matches?.('[data-testid="user-message"]') ? "user" : "assistant";
    },
    getMessages() {
      const { userMsgs, assistantMsgs } = turns2();
      return [
        ...userMsgs.map((el) => ({ role: "user", el })),
        ...assistantMsgs.map((el) => ({ role: "assistant", el }))
      ];
    }
  };

  // src/platforms/deepseek.js
  function root() {
    return queryFirst(['[class*="chat-content"]', "main", "body"]);
  }
  function allTurns() {
    return queryAll(
      ['[class*="message"]', '[class*="bubble"]', '[class*="row"]'],
      root()
    );
  }
  var deepseek_default = {
    host: ["chat.deepseek.com"],
    name: "DeepSeek",
    getMessageElements() {
      return allTurns();
    },
    getRole(el) {
      const hint = (el.className || "") + " " + (el.getAttribute("data-role") || "");
      if (/user|question/i.test(hint)) return "user";
      return "assistant";
    },
    getMessages() {
      return allTurns().map((el) => {
        const role = this.getRole(el);
        const content = el.querySelector(".ds-markdown") || el.querySelector('[class*="markdown"]') || el;
        return { role, el: content };
      });
    }
  };

  // src/platforms/kimi.js
  function root2() {
    return queryFirst(['[class*="chat"]', "main", "body"]);
  }
  function allTurns2() {
    return queryAll(['[class*="bubble"]', '[class*="message-item"]', '[class*="row"]'], root2());
  }
  var kimi_default = {
    host: ["kimi.moonshot.cn"],
    name: "Kimi",
    getMessageElements() {
      return allTurns2();
    },
    getRole(el) {
      const hint = el.className || "";
      if (/user|self|query/i.test(hint)) return "user";
      return "assistant";
    },
    getMessages() {
      return allTurns2().map((el) => {
        const role = this.getRole(el);
        const content = el.querySelector(".markdown") || el.querySelector('[class*="markdown"]') || el;
        return { role, el: content };
      });
    }
  };

  // src/platforms/doubao.js
  function root3() {
    return queryFirst(['[class*="chat"]', "main", "body"]);
  }
  function allTurns3() {
    return queryAll(
      ['[class*="message-item"]', '[class*="bubble"]', '[class*="receive"]', '[class*="row"]'],
      root3()
    );
  }
  var doubao_default = {
    host: ["www.doubao.com", "doubao.com"],
    name: "\u8C46\u5305",
    getMessageElements() {
      return allTurns3();
    },
    getRole(el) {
      const hint = el.className || "";
      if (/user|self|send/i.test(hint)) return "user";
      return "assistant";
    },
    getMessages() {
      return allTurns3().map((el) => {
        const role = this.getRole(el);
        const content = el.querySelector('[class*="markdown"]') || el.querySelector('[class*="content"]') || el;
        return { role, el: content };
      });
    }
  };

  // src/converter.js
  var nodeDomParse = null;
  function parseHTMLToFragment(html2) {
    if (typeof DOMParser !== "undefined") {
      const doc = new DOMParser().parseFromString(`<body>${html2}</body>`, "text/html");
      return doc.body;
    }
    if (nodeDomParse) return nodeDomParse(html2);
    throw new Error("No HTML parser available (need DOMParser or linkedom).");
  }
  var INLINE = {
    strong: "**",
    b: "**",
    em: "*",
    i: "*",
    code: "`"
  };
  var DROP_TAGS = /* @__PURE__ */ new Set([
    "script",
    "style",
    "svg",
    "noscript",
    "template",
    "input",
    "select",
    "textarea"
  ]);
  var VISUALLY_HIDDEN_CLASS = /(^|\s)(cdk-visually-hidden|sr-only|visually-hidden|screen-reader-text|screen-reader)(\s|$)/i;
  function isVisuallyHidden(node) {
    const cls = node.getAttribute && (node.getAttribute("class") || "");
    return !!cls && VISUALLY_HIDDEN_CLASS.test(cls);
  }
  var IMAGE_ELEMENT_TAGS = /* @__PURE__ */ new Set([
    "img",
    "single-image",
    "generated-image",
    "image-container",
    "image-button",
    "response-element",
    "figure"
  ]);
  var CAPTION_LABEL_RE = /^(图像描述|图片描述|图片说明|图像说明|Image description|Image Description|Description|Caption|说明|描述)[:：]/;
  function prevElementSibling(node) {
    let s = node.previousSibling;
    while (s && s.nodeType !== 1) s = s.previousSibling;
    return s;
  }
  function isImageCaptionBlock(node) {
    let prev = prevElementSibling(node);
    for (let depth = 0; depth < 4 && prev; depth++) {
      const tag2 = prev.tagName.toLowerCase();
      if (IMAGE_ELEMENT_TAGS.has(tag2)) return true;
      if (prev.querySelector && prev.querySelector("img, single-image, generated-image")) {
        return true;
      }
      prev = prevElementSibling(prev);
    }
    const firstPara = node.querySelector("p, div");
    if (firstPara) {
      const lead = firstPara.querySelector("b, strong");
      if (lead && CAPTION_LABEL_RE.test((lead.textContent || "").trim())) return true;
    }
    return false;
  }
  function isFaviconIcon(src) {
    return /\/s2\/favicons?/.test(src) || // Google favicon service (ChatGPT citations)
    /favicon(s)?\?/i.test(src) || // generic favicon endpoint
    /\/favicon\.(ico|png|svg)/i.test(src);
  }
  function isNoiseImage(img) {
    const src = (img.getAttribute("src") || "").trim();
    const cls = img.getAttribute("class") || "";
    if (/^data:,$/i.test(src)) return true;
    if (/(^|\s)(mavatar-image|sparkle-image|profile|avatar|icon)(\s|$)/i.test(cls)) {
      return true;
    }
    if (/^data:image\/svg\+xml/i.test(src)) return true;
    return false;
  }
  function cleanImageAlt(alt) {
    let s = (alt || "").trim();
    if (!s) return "";
    s = s.replace(/[,，]?\s*(AI\s*(generated|生成)|generated\s*by\s*AI)\s*$/i, "");
    const firstClause = s.split(/[.,;。；！\n]/)[0];
    s = firstClause.trim();
    const MAX = 30;
    if (s.length > MAX) s = s.slice(0, MAX).trimEnd() + "\u2026";
    return s;
  }
  function escapeTableCell(text) {
    return String(text).replace(/\r\n/g, "\n").replace(/\n/g, " ").replace(/\|/g, "\\|").trim();
  }
  function nodeToMd(node, ctx) {
    if (!node) return "";
    const nt = node.nodeType;
    if (nt === 3 || nt === 4) {
      return node.textContent;
    }
    if (nt !== 1) return "";
    const tag2 = node.tagName.toLowerCase();
    if (DROP_TAGS.has(tag2)) return "";
    if (isVisuallyHidden(node)) return "";
    if (tag2 in INLINE) {
      const inner = childrenToMd(node, ctx);
      const wrap = INLINE[tag2];
      if (!inner.trim()) return "";
      return `${wrap}${inner}${wrap}`;
    }
    switch (tag2) {
      case "h1":
      case "h2":
      case "h3":
      case "h4":
      case "h5":
      case "h6": {
        const level = Number(tag2[1]);
        const inner = childrenToMd(node, ctx).trim();
        return `${"#".repeat(level)} ${inner}

`;
      }
      case "p": {
        const inner = childrenToMd(node, ctx).trim();
        return inner ? `${inner}

` : "";
      }
      case "br":
        return "  \n";
      case "hr":
        return "---\n\n";
      case "a": {
        const href = node.getAttribute("href") || "";
        const text = childrenToMd(node, ctx).trim() || href;
        return href ? `[${text}](${href})` : text;
      }
      case "img": {
        const src = node.getAttribute("src") || "";
        const alt = (node.getAttribute("alt") || "").trim();
        if (!src) return "";
        if (isFaviconIcon(src)) return "";
        if (isNoiseImage(node)) return "";
        if (typeof ctx.imgSeq !== "number") ctx.imgSeq = 0;
        ctx.imgSeq += 1;
        const shortAlt = cleanImageAlt(alt);
        const label = shortAlt ? `\u56FE\u7247 ${ctx.imgSeq}\uFF1A${shortAlt}` : `\u56FE\u7247 ${ctx.imgSeq}`;
        return `\u{1F5BC}\uFE0F [${label}]

`;
      }
      case "blockquote": {
        const inner = childrenToMd(node, ctx).trim();
        if (!inner) return "";
        if (isImageCaptionBlock(node)) {
          return `${inner}

`;
        }
        const quoted = inner.split("\n").map((l) => l ? `> ${l}` : ">").join("\n");
        return `${quoted}

`;
      }
      case "ul":
        return listToMd(node, ctx, false);
      case "ol":
        return listToMd(node, ctx, true);
      case "pre": {
        const codeEl = node.querySelector("code");
        const raw = (codeEl || node).textContent.replace(/\n$/, "");
        let lang = "";
        if (codeEl) {
          const cls = codeEl.className || "";
          const m = cls.match(/language-([\w-]+)/);
          if (m) lang = m[1];
        }
        return "```" + lang + "\n" + raw + "\n```\n\n";
      }
      case "code-block": {
        const pre = node.querySelector("pre");
        const codeEl = node.querySelector("code");
        const source = codeEl || pre || node;
        const raw = source.textContent.replace(/\n$/, "");
        let lang = "";
        if (codeEl) {
          const m = (codeEl.className || "").match(/language-([\w-]+)/);
          if (m) lang = m[1];
        }
        if (!lang) {
          const header = node.querySelector(".code-block-decoration, .header-formatted");
          if (header) {
            const label = (header.querySelector("span")?.textContent || "").trim();
            if (label && !/[\s<>]/.test(label)) lang = label;
          }
        }
        return "```" + lang + "\n" + raw + "\n```\n\n";
      }
      case "table":
        return tableToMd(node, ctx);
      case "div":
      case "section":
      case "article":
      case "main":
      case "header":
      case "footer":
      case "aside":
      case "figure":
        return childrenToMd(node, ctx);
      case "button": {
        const hasContent = node.querySelector("img, p, div, pre, code-block, table, ul, ol, blockquote, figure");
        return hasContent ? childrenToMd(node, ctx) : "";
      }
      case "span":
      case "u":
      case "sup":
      case "sub":
      case "mark":
      case "small":
        return childrenToMd(node, ctx);
      case "li":
        return childrenToMd(node, ctx);
      default:
        return childrenToMd(node, ctx);
    }
  }
  function childrenToMd(node, ctx) {
    let out = "";
    for (const child of node.childNodes) {
      out += nodeToMd(child, ctx);
    }
    return out;
  }
  function listToMd(node, ctx, ordered) {
    const lines = [];
    let i = 1;
    for (const li of node.children) {
      if (li.tagName.toLowerCase() !== "li") continue;
      const marker = ordered ? `${i}. ` : "- ";
      i++;
      let textParts = [];
      const subLists = [];
      for (const child of li.childNodes) {
        const tag2 = child.nodeType === 1 ? child.tagName.toLowerCase() : "";
        if (tag2 === "ul" || tag2 === "ol") {
          subLists.push(listToMd(child, ctx, tag2 === "ol").replace(/\n+$/g, ""));
        } else {
          const piece = nodeToMd(child, ctx);
          if (piece) textParts.push(piece);
        }
      }
      const text = textParts.join("").replace(/\n+/g, " ").trim();
      lines.push(`${marker}${text}`);
      for (const sub of subLists) {
        for (const subLine of sub.split("\n")) {
          lines.push("  " + subLine);
        }
      }
    }
    return lines.join("\n") + "\n\n";
  }
  function tableToMd(node, ctx) {
    const rows = [];
    for (const tr of node.querySelectorAll("tr")) {
      const cells = [];
      for (const cell of tr.children) {
        const t = cell.tagName.toLowerCase();
        if (t !== "td" && t !== "th") continue;
        cells.push(escapeTableCell(childrenToMd(cell, ctx)));
      }
      if (cells.length) rows.push(cells);
    }
    if (!rows.length) return "";
    const cols = Math.max(...rows.map((r) => r.length));
    const norm = rows.map((r) => {
      while (r.length < cols) r.push("");
      return r;
    });
    const header = norm[0];
    const body = norm.slice(1);
    const sep = header.map(() => "---");
    const lines = [
      `| ${header.join(" | ")} |`,
      `| ${sep.join(" | ")} |`,
      ...body.map((r) => `| ${r.join(" | ")} |`)
    ];
    return lines.join("\n") + "\n\n";
  }
  function htmlToMd(input, ctx) {
    if (input == null) return "";
    if (typeof input === "string") {
      if (input.trim() === "") return "";
      input = parseHTMLToFragment(input);
    }
    const raw = childrenToMd(input, ctx || {});
    const deIndented = raw.replace(/^[ \t]+(\S.*?)?[ \t]*$/gm, (line, content) => {
      if (!content) return "";
      if (/^([ ]{2})+([-*+] |\d+\. )/.test(line)) return line;
      return content;
    });
    return deIndented.replace(/\n{3,}/g, "\n\n").replace(/^\s+|\s+$/g, "");
  }

  // node_modules/marked/lib/marked.esm.js
  function _getDefaults() {
    return {
      async: false,
      breaks: false,
      extensions: null,
      gfm: true,
      hooks: null,
      pedantic: false,
      renderer: null,
      silent: false,
      tokenizer: null,
      walkTokens: null
    };
  }
  var _defaults = _getDefaults();
  function changeDefaults(newDefaults) {
    _defaults = newDefaults;
  }
  var escapeTest = /[&<>"']/;
  var escapeReplace = new RegExp(escapeTest.source, "g");
  var escapeTestNoEncode = /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/;
  var escapeReplaceNoEncode = new RegExp(escapeTestNoEncode.source, "g");
  var escapeReplacements = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  };
  var getEscapeReplacement = (ch) => escapeReplacements[ch];
  function escape$1(html2, encode) {
    if (encode) {
      if (escapeTest.test(html2)) {
        return html2.replace(escapeReplace, getEscapeReplacement);
      }
    } else {
      if (escapeTestNoEncode.test(html2)) {
        return html2.replace(escapeReplaceNoEncode, getEscapeReplacement);
      }
    }
    return html2;
  }
  var caret = /(^|[^\[])\^/g;
  function edit(regex, opt) {
    let source = typeof regex === "string" ? regex : regex.source;
    opt = opt || "";
    const obj = {
      replace: (name, val) => {
        let valSource = typeof val === "string" ? val : val.source;
        valSource = valSource.replace(caret, "$1");
        source = source.replace(name, valSource);
        return obj;
      },
      getRegex: () => {
        return new RegExp(source, opt);
      }
    };
    return obj;
  }
  function cleanUrl(href) {
    try {
      href = encodeURI(href).replace(/%25/g, "%");
    } catch {
      return null;
    }
    return href;
  }
  var noopTest = { exec: () => null };
  function splitCells(tableRow, count) {
    const row = tableRow.replace(/\|/g, (match, offset, str) => {
      let escaped = false;
      let curr = offset;
      while (--curr >= 0 && str[curr] === "\\")
        escaped = !escaped;
      if (escaped) {
        return "|";
      } else {
        return " |";
      }
    }), cells = row.split(/ \|/);
    let i = 0;
    if (!cells[0].trim()) {
      cells.shift();
    }
    if (cells.length > 0 && !cells[cells.length - 1].trim()) {
      cells.pop();
    }
    if (count) {
      if (cells.length > count) {
        cells.splice(count);
      } else {
        while (cells.length < count)
          cells.push("");
      }
    }
    for (; i < cells.length; i++) {
      cells[i] = cells[i].trim().replace(/\\\|/g, "|");
    }
    return cells;
  }
  function rtrim(str, c, invert) {
    const l = str.length;
    if (l === 0) {
      return "";
    }
    let suffLen = 0;
    while (suffLen < l) {
      const currChar = str.charAt(l - suffLen - 1);
      if (currChar === c && !invert) {
        suffLen++;
      } else if (currChar !== c && invert) {
        suffLen++;
      } else {
        break;
      }
    }
    return str.slice(0, l - suffLen);
  }
  function findClosingBracket(str, b) {
    if (str.indexOf(b[1]) === -1) {
      return -1;
    }
    let level = 0;
    for (let i = 0; i < str.length; i++) {
      if (str[i] === "\\") {
        i++;
      } else if (str[i] === b[0]) {
        level++;
      } else if (str[i] === b[1]) {
        level--;
        if (level < 0) {
          return i;
        }
      }
    }
    return -1;
  }
  function outputLink(cap, link2, raw, lexer2) {
    const href = link2.href;
    const title = link2.title ? escape$1(link2.title) : null;
    const text = cap[1].replace(/\\([\[\]])/g, "$1");
    if (cap[0].charAt(0) !== "!") {
      lexer2.state.inLink = true;
      const token = {
        type: "link",
        raw,
        href,
        title,
        text,
        tokens: lexer2.inlineTokens(text)
      };
      lexer2.state.inLink = false;
      return token;
    }
    return {
      type: "image",
      raw,
      href,
      title,
      text: escape$1(text)
    };
  }
  function indentCodeCompensation(raw, text) {
    const matchIndentToCode = raw.match(/^(\s+)(?:```)/);
    if (matchIndentToCode === null) {
      return text;
    }
    const indentToCode = matchIndentToCode[1];
    return text.split("\n").map((node) => {
      const matchIndentInNode = node.match(/^\s+/);
      if (matchIndentInNode === null) {
        return node;
      }
      const [indentInNode] = matchIndentInNode;
      if (indentInNode.length >= indentToCode.length) {
        return node.slice(indentToCode.length);
      }
      return node;
    }).join("\n");
  }
  var _Tokenizer = class {
    options;
    rules;
    // set by the lexer
    lexer;
    // set by the lexer
    constructor(options2) {
      this.options = options2 || _defaults;
    }
    space(src) {
      const cap = this.rules.block.newline.exec(src);
      if (cap && cap[0].length > 0) {
        return {
          type: "space",
          raw: cap[0]
        };
      }
    }
    code(src) {
      const cap = this.rules.block.code.exec(src);
      if (cap) {
        const text = cap[0].replace(/^(?: {1,4}| {0,3}\t)/gm, "");
        return {
          type: "code",
          raw: cap[0],
          codeBlockStyle: "indented",
          text: !this.options.pedantic ? rtrim(text, "\n") : text
        };
      }
    }
    fences(src) {
      const cap = this.rules.block.fences.exec(src);
      if (cap) {
        const raw = cap[0];
        const text = indentCodeCompensation(raw, cap[3] || "");
        return {
          type: "code",
          raw,
          lang: cap[2] ? cap[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : cap[2],
          text
        };
      }
    }
    heading(src) {
      const cap = this.rules.block.heading.exec(src);
      if (cap) {
        let text = cap[2].trim();
        if (/#$/.test(text)) {
          const trimmed = rtrim(text, "#");
          if (this.options.pedantic) {
            text = trimmed.trim();
          } else if (!trimmed || / $/.test(trimmed)) {
            text = trimmed.trim();
          }
        }
        return {
          type: "heading",
          raw: cap[0],
          depth: cap[1].length,
          text,
          tokens: this.lexer.inline(text)
        };
      }
    }
    hr(src) {
      const cap = this.rules.block.hr.exec(src);
      if (cap) {
        return {
          type: "hr",
          raw: rtrim(cap[0], "\n")
        };
      }
    }
    blockquote(src) {
      const cap = this.rules.block.blockquote.exec(src);
      if (cap) {
        let lines = rtrim(cap[0], "\n").split("\n");
        let raw = "";
        let text = "";
        const tokens = [];
        while (lines.length > 0) {
          let inBlockquote = false;
          const currentLines = [];
          let i;
          for (i = 0; i < lines.length; i++) {
            if (/^ {0,3}>/.test(lines[i])) {
              currentLines.push(lines[i]);
              inBlockquote = true;
            } else if (!inBlockquote) {
              currentLines.push(lines[i]);
            } else {
              break;
            }
          }
          lines = lines.slice(i);
          const currentRaw = currentLines.join("\n");
          const currentText = currentRaw.replace(/\n {0,3}((?:=+|-+) *)(?=\n|$)/g, "\n    $1").replace(/^ {0,3}>[ \t]?/gm, "");
          raw = raw ? `${raw}
${currentRaw}` : currentRaw;
          text = text ? `${text}
${currentText}` : currentText;
          const top = this.lexer.state.top;
          this.lexer.state.top = true;
          this.lexer.blockTokens(currentText, tokens, true);
          this.lexer.state.top = top;
          if (lines.length === 0) {
            break;
          }
          const lastToken = tokens[tokens.length - 1];
          if (lastToken?.type === "code") {
            break;
          } else if (lastToken?.type === "blockquote") {
            const oldToken = lastToken;
            const newText = oldToken.raw + "\n" + lines.join("\n");
            const newToken = this.blockquote(newText);
            tokens[tokens.length - 1] = newToken;
            raw = raw.substring(0, raw.length - oldToken.raw.length) + newToken.raw;
            text = text.substring(0, text.length - oldToken.text.length) + newToken.text;
            break;
          } else if (lastToken?.type === "list") {
            const oldToken = lastToken;
            const newText = oldToken.raw + "\n" + lines.join("\n");
            const newToken = this.list(newText);
            tokens[tokens.length - 1] = newToken;
            raw = raw.substring(0, raw.length - lastToken.raw.length) + newToken.raw;
            text = text.substring(0, text.length - oldToken.raw.length) + newToken.raw;
            lines = newText.substring(tokens[tokens.length - 1].raw.length).split("\n");
            continue;
          }
        }
        return {
          type: "blockquote",
          raw,
          tokens,
          text
        };
      }
    }
    list(src) {
      let cap = this.rules.block.list.exec(src);
      if (cap) {
        let bull = cap[1].trim();
        const isordered = bull.length > 1;
        const list2 = {
          type: "list",
          raw: "",
          ordered: isordered,
          start: isordered ? +bull.slice(0, -1) : "",
          loose: false,
          items: []
        };
        bull = isordered ? `\\d{1,9}\\${bull.slice(-1)}` : `\\${bull}`;
        if (this.options.pedantic) {
          bull = isordered ? bull : "[*+-]";
        }
        const itemRegex = new RegExp(`^( {0,3}${bull})((?:[	 ][^\\n]*)?(?:\\n|$))`);
        let endsWithBlankLine = false;
        while (src) {
          let endEarly = false;
          let raw = "";
          let itemContents = "";
          if (!(cap = itemRegex.exec(src))) {
            break;
          }
          if (this.rules.block.hr.test(src)) {
            break;
          }
          raw = cap[0];
          src = src.substring(raw.length);
          let line = cap[2].split("\n", 1)[0].replace(/^\t+/, (t) => " ".repeat(3 * t.length));
          let nextLine = src.split("\n", 1)[0];
          let blankLine = !line.trim();
          let indent = 0;
          if (this.options.pedantic) {
            indent = 2;
            itemContents = line.trimStart();
          } else if (blankLine) {
            indent = cap[1].length + 1;
          } else {
            indent = cap[2].search(/[^ ]/);
            indent = indent > 4 ? 1 : indent;
            itemContents = line.slice(indent);
            indent += cap[1].length;
          }
          if (blankLine && /^[ \t]*$/.test(nextLine)) {
            raw += nextLine + "\n";
            src = src.substring(nextLine.length + 1);
            endEarly = true;
          }
          if (!endEarly) {
            const nextBulletRegex = new RegExp(`^ {0,${Math.min(3, indent - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`);
            const hrRegex = new RegExp(`^ {0,${Math.min(3, indent - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`);
            const fencesBeginRegex = new RegExp(`^ {0,${Math.min(3, indent - 1)}}(?:\`\`\`|~~~)`);
            const headingBeginRegex = new RegExp(`^ {0,${Math.min(3, indent - 1)}}#`);
            const htmlBeginRegex = new RegExp(`^ {0,${Math.min(3, indent - 1)}}<(?:[a-z].*>|!--)`, "i");
            while (src) {
              const rawLine = src.split("\n", 1)[0];
              let nextLineWithoutTabs;
              nextLine = rawLine;
              if (this.options.pedantic) {
                nextLine = nextLine.replace(/^ {1,4}(?=( {4})*[^ ])/g, "  ");
                nextLineWithoutTabs = nextLine;
              } else {
                nextLineWithoutTabs = nextLine.replace(/\t/g, "    ");
              }
              if (fencesBeginRegex.test(nextLine)) {
                break;
              }
              if (headingBeginRegex.test(nextLine)) {
                break;
              }
              if (htmlBeginRegex.test(nextLine)) {
                break;
              }
              if (nextBulletRegex.test(nextLine)) {
                break;
              }
              if (hrRegex.test(nextLine)) {
                break;
              }
              if (nextLineWithoutTabs.search(/[^ ]/) >= indent || !nextLine.trim()) {
                itemContents += "\n" + nextLineWithoutTabs.slice(indent);
              } else {
                if (blankLine) {
                  break;
                }
                if (line.replace(/\t/g, "    ").search(/[^ ]/) >= 4) {
                  break;
                }
                if (fencesBeginRegex.test(line)) {
                  break;
                }
                if (headingBeginRegex.test(line)) {
                  break;
                }
                if (hrRegex.test(line)) {
                  break;
                }
                itemContents += "\n" + nextLine;
              }
              if (!blankLine && !nextLine.trim()) {
                blankLine = true;
              }
              raw += rawLine + "\n";
              src = src.substring(rawLine.length + 1);
              line = nextLineWithoutTabs.slice(indent);
            }
          }
          if (!list2.loose) {
            if (endsWithBlankLine) {
              list2.loose = true;
            } else if (/\n[ \t]*\n[ \t]*$/.test(raw)) {
              endsWithBlankLine = true;
            }
          }
          let istask = null;
          let ischecked;
          if (this.options.gfm) {
            istask = /^\[[ xX]\] /.exec(itemContents);
            if (istask) {
              ischecked = istask[0] !== "[ ] ";
              itemContents = itemContents.replace(/^\[[ xX]\] +/, "");
            }
          }
          list2.items.push({
            type: "list_item",
            raw,
            task: !!istask,
            checked: ischecked,
            loose: false,
            text: itemContents,
            tokens: []
          });
          list2.raw += raw;
        }
        list2.items[list2.items.length - 1].raw = list2.items[list2.items.length - 1].raw.trimEnd();
        list2.items[list2.items.length - 1].text = list2.items[list2.items.length - 1].text.trimEnd();
        list2.raw = list2.raw.trimEnd();
        for (let i = 0; i < list2.items.length; i++) {
          this.lexer.state.top = false;
          list2.items[i].tokens = this.lexer.blockTokens(list2.items[i].text, []);
          if (!list2.loose) {
            const spacers = list2.items[i].tokens.filter((t) => t.type === "space");
            const hasMultipleLineBreaks = spacers.length > 0 && spacers.some((t) => /\n.*\n/.test(t.raw));
            list2.loose = hasMultipleLineBreaks;
          }
        }
        if (list2.loose) {
          for (let i = 0; i < list2.items.length; i++) {
            list2.items[i].loose = true;
          }
        }
        return list2;
      }
    }
    html(src) {
      const cap = this.rules.block.html.exec(src);
      if (cap) {
        const token = {
          type: "html",
          block: true,
          raw: cap[0],
          pre: cap[1] === "pre" || cap[1] === "script" || cap[1] === "style",
          text: cap[0]
        };
        return token;
      }
    }
    def(src) {
      const cap = this.rules.block.def.exec(src);
      if (cap) {
        const tag2 = cap[1].toLowerCase().replace(/\s+/g, " ");
        const href = cap[2] ? cap[2].replace(/^<(.*)>$/, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "";
        const title = cap[3] ? cap[3].substring(1, cap[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : cap[3];
        return {
          type: "def",
          tag: tag2,
          raw: cap[0],
          href,
          title
        };
      }
    }
    table(src) {
      const cap = this.rules.block.table.exec(src);
      if (!cap) {
        return;
      }
      if (!/[:|]/.test(cap[2])) {
        return;
      }
      const headers = splitCells(cap[1]);
      const aligns = cap[2].replace(/^\||\| *$/g, "").split("|");
      const rows = cap[3] && cap[3].trim() ? cap[3].replace(/\n[ \t]*$/, "").split("\n") : [];
      const item = {
        type: "table",
        raw: cap[0],
        header: [],
        align: [],
        rows: []
      };
      if (headers.length !== aligns.length) {
        return;
      }
      for (const align of aligns) {
        if (/^ *-+: *$/.test(align)) {
          item.align.push("right");
        } else if (/^ *:-+: *$/.test(align)) {
          item.align.push("center");
        } else if (/^ *:-+ *$/.test(align)) {
          item.align.push("left");
        } else {
          item.align.push(null);
        }
      }
      for (let i = 0; i < headers.length; i++) {
        item.header.push({
          text: headers[i],
          tokens: this.lexer.inline(headers[i]),
          header: true,
          align: item.align[i]
        });
      }
      for (const row of rows) {
        item.rows.push(splitCells(row, item.header.length).map((cell, i) => {
          return {
            text: cell,
            tokens: this.lexer.inline(cell),
            header: false,
            align: item.align[i]
          };
        }));
      }
      return item;
    }
    lheading(src) {
      const cap = this.rules.block.lheading.exec(src);
      if (cap) {
        return {
          type: "heading",
          raw: cap[0],
          depth: cap[2].charAt(0) === "=" ? 1 : 2,
          text: cap[1],
          tokens: this.lexer.inline(cap[1])
        };
      }
    }
    paragraph(src) {
      const cap = this.rules.block.paragraph.exec(src);
      if (cap) {
        const text = cap[1].charAt(cap[1].length - 1) === "\n" ? cap[1].slice(0, -1) : cap[1];
        return {
          type: "paragraph",
          raw: cap[0],
          text,
          tokens: this.lexer.inline(text)
        };
      }
    }
    text(src) {
      const cap = this.rules.block.text.exec(src);
      if (cap) {
        return {
          type: "text",
          raw: cap[0],
          text: cap[0],
          tokens: this.lexer.inline(cap[0])
        };
      }
    }
    escape(src) {
      const cap = this.rules.inline.escape.exec(src);
      if (cap) {
        return {
          type: "escape",
          raw: cap[0],
          text: escape$1(cap[1])
        };
      }
    }
    tag(src) {
      const cap = this.rules.inline.tag.exec(src);
      if (cap) {
        if (!this.lexer.state.inLink && /^<a /i.test(cap[0])) {
          this.lexer.state.inLink = true;
        } else if (this.lexer.state.inLink && /^<\/a>/i.test(cap[0])) {
          this.lexer.state.inLink = false;
        }
        if (!this.lexer.state.inRawBlock && /^<(pre|code|kbd|script)(\s|>)/i.test(cap[0])) {
          this.lexer.state.inRawBlock = true;
        } else if (this.lexer.state.inRawBlock && /^<\/(pre|code|kbd|script)(\s|>)/i.test(cap[0])) {
          this.lexer.state.inRawBlock = false;
        }
        return {
          type: "html",
          raw: cap[0],
          inLink: this.lexer.state.inLink,
          inRawBlock: this.lexer.state.inRawBlock,
          block: false,
          text: cap[0]
        };
      }
    }
    link(src) {
      const cap = this.rules.inline.link.exec(src);
      if (cap) {
        const trimmedUrl = cap[2].trim();
        if (!this.options.pedantic && /^</.test(trimmedUrl)) {
          if (!/>$/.test(trimmedUrl)) {
            return;
          }
          const rtrimSlash = rtrim(trimmedUrl.slice(0, -1), "\\");
          if ((trimmedUrl.length - rtrimSlash.length) % 2 === 0) {
            return;
          }
        } else {
          const lastParenIndex = findClosingBracket(cap[2], "()");
          if (lastParenIndex > -1) {
            const start = cap[0].indexOf("!") === 0 ? 5 : 4;
            const linkLen = start + cap[1].length + lastParenIndex;
            cap[2] = cap[2].substring(0, lastParenIndex);
            cap[0] = cap[0].substring(0, linkLen).trim();
            cap[3] = "";
          }
        }
        let href = cap[2];
        let title = "";
        if (this.options.pedantic) {
          const link2 = /^([^'"]*[^\s])\s+(['"])(.*)\2/.exec(href);
          if (link2) {
            href = link2[1];
            title = link2[3];
          }
        } else {
          title = cap[3] ? cap[3].slice(1, -1) : "";
        }
        href = href.trim();
        if (/^</.test(href)) {
          if (this.options.pedantic && !/>$/.test(trimmedUrl)) {
            href = href.slice(1);
          } else {
            href = href.slice(1, -1);
          }
        }
        return outputLink(cap, {
          href: href ? href.replace(this.rules.inline.anyPunctuation, "$1") : href,
          title: title ? title.replace(this.rules.inline.anyPunctuation, "$1") : title
        }, cap[0], this.lexer);
      }
    }
    reflink(src, links) {
      let cap;
      if ((cap = this.rules.inline.reflink.exec(src)) || (cap = this.rules.inline.nolink.exec(src))) {
        const linkString = (cap[2] || cap[1]).replace(/\s+/g, " ");
        const link2 = links[linkString.toLowerCase()];
        if (!link2) {
          const text = cap[0].charAt(0);
          return {
            type: "text",
            raw: text,
            text
          };
        }
        return outputLink(cap, link2, cap[0], this.lexer);
      }
    }
    emStrong(src, maskedSrc, prevChar = "") {
      let match = this.rules.inline.emStrongLDelim.exec(src);
      if (!match)
        return;
      if (match[3] && prevChar.match(/[\p{L}\p{N}]/u))
        return;
      const nextChar = match[1] || match[2] || "";
      if (!nextChar || !prevChar || this.rules.inline.punctuation.exec(prevChar)) {
        const lLength = [...match[0]].length - 1;
        let rDelim, rLength, delimTotal = lLength, midDelimTotal = 0;
        const endReg = match[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
        endReg.lastIndex = 0;
        maskedSrc = maskedSrc.slice(-1 * src.length + lLength);
        while ((match = endReg.exec(maskedSrc)) != null) {
          rDelim = match[1] || match[2] || match[3] || match[4] || match[5] || match[6];
          if (!rDelim)
            continue;
          rLength = [...rDelim].length;
          if (match[3] || match[4]) {
            delimTotal += rLength;
            continue;
          } else if (match[5] || match[6]) {
            if (lLength % 3 && !((lLength + rLength) % 3)) {
              midDelimTotal += rLength;
              continue;
            }
          }
          delimTotal -= rLength;
          if (delimTotal > 0)
            continue;
          rLength = Math.min(rLength, rLength + delimTotal + midDelimTotal);
          const lastCharLength = [...match[0]][0].length;
          const raw = src.slice(0, lLength + match.index + lastCharLength + rLength);
          if (Math.min(lLength, rLength) % 2) {
            const text2 = raw.slice(1, -1);
            return {
              type: "em",
              raw,
              text: text2,
              tokens: this.lexer.inlineTokens(text2)
            };
          }
          const text = raw.slice(2, -2);
          return {
            type: "strong",
            raw,
            text,
            tokens: this.lexer.inlineTokens(text)
          };
        }
      }
    }
    codespan(src) {
      const cap = this.rules.inline.code.exec(src);
      if (cap) {
        let text = cap[2].replace(/\n/g, " ");
        const hasNonSpaceChars = /[^ ]/.test(text);
        const hasSpaceCharsOnBothEnds = /^ /.test(text) && / $/.test(text);
        if (hasNonSpaceChars && hasSpaceCharsOnBothEnds) {
          text = text.substring(1, text.length - 1);
        }
        text = escape$1(text, true);
        return {
          type: "codespan",
          raw: cap[0],
          text
        };
      }
    }
    br(src) {
      const cap = this.rules.inline.br.exec(src);
      if (cap) {
        return {
          type: "br",
          raw: cap[0]
        };
      }
    }
    del(src) {
      const cap = this.rules.inline.del.exec(src);
      if (cap) {
        return {
          type: "del",
          raw: cap[0],
          text: cap[2],
          tokens: this.lexer.inlineTokens(cap[2])
        };
      }
    }
    autolink(src) {
      const cap = this.rules.inline.autolink.exec(src);
      if (cap) {
        let text, href;
        if (cap[2] === "@") {
          text = escape$1(cap[1]);
          href = "mailto:" + text;
        } else {
          text = escape$1(cap[1]);
          href = text;
        }
        return {
          type: "link",
          raw: cap[0],
          text,
          href,
          tokens: [
            {
              type: "text",
              raw: text,
              text
            }
          ]
        };
      }
    }
    url(src) {
      let cap;
      if (cap = this.rules.inline.url.exec(src)) {
        let text, href;
        if (cap[2] === "@") {
          text = escape$1(cap[0]);
          href = "mailto:" + text;
        } else {
          let prevCapZero;
          do {
            prevCapZero = cap[0];
            cap[0] = this.rules.inline._backpedal.exec(cap[0])?.[0] ?? "";
          } while (prevCapZero !== cap[0]);
          text = escape$1(cap[0]);
          if (cap[1] === "www.") {
            href = "http://" + cap[0];
          } else {
            href = cap[0];
          }
        }
        return {
          type: "link",
          raw: cap[0],
          text,
          href,
          tokens: [
            {
              type: "text",
              raw: text,
              text
            }
          ]
        };
      }
    }
    inlineText(src) {
      const cap = this.rules.inline.text.exec(src);
      if (cap) {
        let text;
        if (this.lexer.state.inRawBlock) {
          text = cap[0];
        } else {
          text = escape$1(cap[0]);
        }
        return {
          type: "text",
          raw: cap[0],
          text
        };
      }
    }
  };
  var newline = /^(?:[ \t]*(?:\n|$))+/;
  var blockCode = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/;
  var fences = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/;
  var hr = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/;
  var heading = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/;
  var bullet = /(?:[*+-]|\d{1,9}[.)])/;
  var lheading = edit(/^(?!bull |blockCode|fences|blockquote|heading|html)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html))+?)\n {0,3}(=+|-+) *(?:\n+|$)/).replace(/bull/g, bullet).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).getRegex();
  var _paragraph = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/;
  var blockText = /^[^\n]+/;
  var _blockLabel = /(?!\s*\])(?:\\.|[^\[\]\\])+/;
  var def = edit(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", _blockLabel).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex();
  var list = edit(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, bullet).getRegex();
  var _tag = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul";
  var _comment = /<!--(?:-?>|[\s\S]*?(?:-->|$))/;
  var html = edit("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))", "i").replace("comment", _comment).replace("tag", _tag).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex();
  var paragraph = edit(_paragraph).replace("hr", hr).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", _tag).getRegex();
  var blockquote = edit(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", paragraph).getRegex();
  var blockNormal = {
    blockquote,
    code: blockCode,
    def,
    fences,
    heading,
    hr,
    html,
    lheading,
    list,
    newline,
    paragraph,
    table: noopTest,
    text: blockText
  };
  var gfmTable = edit("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", hr).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", _tag).getRegex();
  var blockGfm = {
    ...blockNormal,
    table: gfmTable,
    paragraph: edit(_paragraph).replace("hr", hr).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", gfmTable).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", _tag).getRegex()
  };
  var blockPedantic = {
    ...blockNormal,
    html: edit(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", _comment).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
    def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
    heading: /^(#{1,6})(.*)(?:\n+|$)/,
    fences: noopTest,
    // fences not supported
    lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
    paragraph: edit(_paragraph).replace("hr", hr).replace("heading", " *#{1,6} *[^\n]").replace("lheading", lheading).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
  };
  var escape = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/;
  var inlineCode = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/;
  var br = /^( {2,}|\\)\n(?!\s*$)/;
  var inlineText = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/;
  var _punctuation = "\\p{P}\\p{S}";
  var punctuation = edit(/^((?![*_])[\spunctuation])/, "u").replace(/punctuation/g, _punctuation).getRegex();
  var blockSkip = /\[[^[\]]*?\]\((?:\\.|[^\\\(\)]|\((?:\\.|[^\\\(\)])*\))*\)|`[^`]*?`|<[^<>]*?>/g;
  var emStrongLDelim = edit(/^(?:\*+(?:((?!\*)[punct])|[^\s*]))|^_+(?:((?!_)[punct])|([^\s_]))/, "u").replace(/punct/g, _punctuation).getRegex();
  var emStrongRDelimAst = edit("^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)[punct](\\*+)(?=[\\s]|$)|[^punct\\s](\\*+)(?!\\*)(?=[punct\\s]|$)|(?!\\*)[punct\\s](\\*+)(?=[^punct\\s])|[\\s](\\*+)(?!\\*)(?=[punct])|(?!\\*)[punct](\\*+)(?!\\*)(?=[punct])|[^punct\\s](\\*+)(?=[^punct\\s])", "gu").replace(/punct/g, _punctuation).getRegex();
  var emStrongRDelimUnd = edit("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)[punct](_+)(?=[\\s]|$)|[^punct\\s](_+)(?!_)(?=[punct\\s]|$)|(?!_)[punct\\s](_+)(?=[^punct\\s])|[\\s](_+)(?!_)(?=[punct])|(?!_)[punct](_+)(?!_)(?=[punct])", "gu").replace(/punct/g, _punctuation).getRegex();
  var anyPunctuation = edit(/\\([punct])/, "gu").replace(/punct/g, _punctuation).getRegex();
  var autolink = edit(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex();
  var _inlineComment = edit(_comment).replace("(?:-->|$)", "-->").getRegex();
  var tag = edit("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", _inlineComment).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex();
  var _inlineLabel = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/;
  var link = edit(/^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/).replace("label", _inlineLabel).replace("href", /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex();
  var reflink = edit(/^!?\[(label)\]\[(ref)\]/).replace("label", _inlineLabel).replace("ref", _blockLabel).getRegex();
  var nolink = edit(/^!?\[(ref)\](?:\[\])?/).replace("ref", _blockLabel).getRegex();
  var reflinkSearch = edit("reflink|nolink(?!\\()", "g").replace("reflink", reflink).replace("nolink", nolink).getRegex();
  var inlineNormal = {
    _backpedal: noopTest,
    // only used for GFM url
    anyPunctuation,
    autolink,
    blockSkip,
    br,
    code: inlineCode,
    del: noopTest,
    emStrongLDelim,
    emStrongRDelimAst,
    emStrongRDelimUnd,
    escape,
    link,
    nolink,
    punctuation,
    reflink,
    reflinkSearch,
    tag,
    text: inlineText,
    url: noopTest
  };
  var inlinePedantic = {
    ...inlineNormal,
    link: edit(/^!?\[(label)\]\((.*?)\)/).replace("label", _inlineLabel).getRegex(),
    reflink: edit(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", _inlineLabel).getRegex()
  };
  var inlineGfm = {
    ...inlineNormal,
    escape: edit(escape).replace("])", "~|])").getRegex(),
    url: edit(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i").replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
    _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
    del: /^(~~?)(?=[^\s~])((?:\\.|[^\\])*?(?:\\.|[^\s~\\]))\1(?=[^~]|$)/,
    text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
  };
  var inlineBreaks = {
    ...inlineGfm,
    br: edit(br).replace("{2,}", "*").getRegex(),
    text: edit(inlineGfm.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
  };
  var block = {
    normal: blockNormal,
    gfm: blockGfm,
    pedantic: blockPedantic
  };
  var inline = {
    normal: inlineNormal,
    gfm: inlineGfm,
    breaks: inlineBreaks,
    pedantic: inlinePedantic
  };
  var _Lexer = class __Lexer {
    tokens;
    options;
    state;
    tokenizer;
    inlineQueue;
    constructor(options2) {
      this.tokens = [];
      this.tokens.links = /* @__PURE__ */ Object.create(null);
      this.options = options2 || _defaults;
      this.options.tokenizer = this.options.tokenizer || new _Tokenizer();
      this.tokenizer = this.options.tokenizer;
      this.tokenizer.options = this.options;
      this.tokenizer.lexer = this;
      this.inlineQueue = [];
      this.state = {
        inLink: false,
        inRawBlock: false,
        top: true
      };
      const rules = {
        block: block.normal,
        inline: inline.normal
      };
      if (this.options.pedantic) {
        rules.block = block.pedantic;
        rules.inline = inline.pedantic;
      } else if (this.options.gfm) {
        rules.block = block.gfm;
        if (this.options.breaks) {
          rules.inline = inline.breaks;
        } else {
          rules.inline = inline.gfm;
        }
      }
      this.tokenizer.rules = rules;
    }
    /**
     * Expose Rules
     */
    static get rules() {
      return {
        block,
        inline
      };
    }
    /**
     * Static Lex Method
     */
    static lex(src, options2) {
      const lexer2 = new __Lexer(options2);
      return lexer2.lex(src);
    }
    /**
     * Static Lex Inline Method
     */
    static lexInline(src, options2) {
      const lexer2 = new __Lexer(options2);
      return lexer2.inlineTokens(src);
    }
    /**
     * Preprocessing
     */
    lex(src) {
      src = src.replace(/\r\n|\r/g, "\n");
      this.blockTokens(src, this.tokens);
      for (let i = 0; i < this.inlineQueue.length; i++) {
        const next = this.inlineQueue[i];
        this.inlineTokens(next.src, next.tokens);
      }
      this.inlineQueue = [];
      return this.tokens;
    }
    blockTokens(src, tokens = [], lastParagraphClipped = false) {
      if (this.options.pedantic) {
        src = src.replace(/\t/g, "    ").replace(/^ +$/gm, "");
      }
      let token;
      let lastToken;
      let cutSrc;
      while (src) {
        if (this.options.extensions && this.options.extensions.block && this.options.extensions.block.some((extTokenizer) => {
          if (token = extTokenizer.call({ lexer: this }, src, tokens)) {
            src = src.substring(token.raw.length);
            tokens.push(token);
            return true;
          }
          return false;
        })) {
          continue;
        }
        if (token = this.tokenizer.space(src)) {
          src = src.substring(token.raw.length);
          if (token.raw.length === 1 && tokens.length > 0) {
            tokens[tokens.length - 1].raw += "\n";
          } else {
            tokens.push(token);
          }
          continue;
        }
        if (token = this.tokenizer.code(src)) {
          src = src.substring(token.raw.length);
          lastToken = tokens[tokens.length - 1];
          if (lastToken && (lastToken.type === "paragraph" || lastToken.type === "text")) {
            lastToken.raw += "\n" + token.raw;
            lastToken.text += "\n" + token.text;
            this.inlineQueue[this.inlineQueue.length - 1].src = lastToken.text;
          } else {
            tokens.push(token);
          }
          continue;
        }
        if (token = this.tokenizer.fences(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        if (token = this.tokenizer.heading(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        if (token = this.tokenizer.hr(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        if (token = this.tokenizer.blockquote(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        if (token = this.tokenizer.list(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        if (token = this.tokenizer.html(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        if (token = this.tokenizer.def(src)) {
          src = src.substring(token.raw.length);
          lastToken = tokens[tokens.length - 1];
          if (lastToken && (lastToken.type === "paragraph" || lastToken.type === "text")) {
            lastToken.raw += "\n" + token.raw;
            lastToken.text += "\n" + token.raw;
            this.inlineQueue[this.inlineQueue.length - 1].src = lastToken.text;
          } else if (!this.tokens.links[token.tag]) {
            this.tokens.links[token.tag] = {
              href: token.href,
              title: token.title
            };
          }
          continue;
        }
        if (token = this.tokenizer.table(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        if (token = this.tokenizer.lheading(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        cutSrc = src;
        if (this.options.extensions && this.options.extensions.startBlock) {
          let startIndex = Infinity;
          const tempSrc = src.slice(1);
          let tempStart;
          this.options.extensions.startBlock.forEach((getStartIndex) => {
            tempStart = getStartIndex.call({ lexer: this }, tempSrc);
            if (typeof tempStart === "number" && tempStart >= 0) {
              startIndex = Math.min(startIndex, tempStart);
            }
          });
          if (startIndex < Infinity && startIndex >= 0) {
            cutSrc = src.substring(0, startIndex + 1);
          }
        }
        if (this.state.top && (token = this.tokenizer.paragraph(cutSrc))) {
          lastToken = tokens[tokens.length - 1];
          if (lastParagraphClipped && lastToken?.type === "paragraph") {
            lastToken.raw += "\n" + token.raw;
            lastToken.text += "\n" + token.text;
            this.inlineQueue.pop();
            this.inlineQueue[this.inlineQueue.length - 1].src = lastToken.text;
          } else {
            tokens.push(token);
          }
          lastParagraphClipped = cutSrc.length !== src.length;
          src = src.substring(token.raw.length);
          continue;
        }
        if (token = this.tokenizer.text(src)) {
          src = src.substring(token.raw.length);
          lastToken = tokens[tokens.length - 1];
          if (lastToken && lastToken.type === "text") {
            lastToken.raw += "\n" + token.raw;
            lastToken.text += "\n" + token.text;
            this.inlineQueue.pop();
            this.inlineQueue[this.inlineQueue.length - 1].src = lastToken.text;
          } else {
            tokens.push(token);
          }
          continue;
        }
        if (src) {
          const errMsg = "Infinite loop on byte: " + src.charCodeAt(0);
          if (this.options.silent) {
            console.error(errMsg);
            break;
          } else {
            throw new Error(errMsg);
          }
        }
      }
      this.state.top = true;
      return tokens;
    }
    inline(src, tokens = []) {
      this.inlineQueue.push({ src, tokens });
      return tokens;
    }
    /**
     * Lexing/Compiling
     */
    inlineTokens(src, tokens = []) {
      let token, lastToken, cutSrc;
      let maskedSrc = src;
      let match;
      let keepPrevChar, prevChar;
      if (this.tokens.links) {
        const links = Object.keys(this.tokens.links);
        if (links.length > 0) {
          while ((match = this.tokenizer.rules.inline.reflinkSearch.exec(maskedSrc)) != null) {
            if (links.includes(match[0].slice(match[0].lastIndexOf("[") + 1, -1))) {
              maskedSrc = maskedSrc.slice(0, match.index) + "[" + "a".repeat(match[0].length - 2) + "]" + maskedSrc.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex);
            }
          }
        }
      }
      while ((match = this.tokenizer.rules.inline.blockSkip.exec(maskedSrc)) != null) {
        maskedSrc = maskedSrc.slice(0, match.index) + "[" + "a".repeat(match[0].length - 2) + "]" + maskedSrc.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
      }
      while ((match = this.tokenizer.rules.inline.anyPunctuation.exec(maskedSrc)) != null) {
        maskedSrc = maskedSrc.slice(0, match.index) + "++" + maskedSrc.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
      }
      while (src) {
        if (!keepPrevChar) {
          prevChar = "";
        }
        keepPrevChar = false;
        if (this.options.extensions && this.options.extensions.inline && this.options.extensions.inline.some((extTokenizer) => {
          if (token = extTokenizer.call({ lexer: this }, src, tokens)) {
            src = src.substring(token.raw.length);
            tokens.push(token);
            return true;
          }
          return false;
        })) {
          continue;
        }
        if (token = this.tokenizer.escape(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        if (token = this.tokenizer.tag(src)) {
          src = src.substring(token.raw.length);
          lastToken = tokens[tokens.length - 1];
          if (lastToken && token.type === "text" && lastToken.type === "text") {
            lastToken.raw += token.raw;
            lastToken.text += token.text;
          } else {
            tokens.push(token);
          }
          continue;
        }
        if (token = this.tokenizer.link(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        if (token = this.tokenizer.reflink(src, this.tokens.links)) {
          src = src.substring(token.raw.length);
          lastToken = tokens[tokens.length - 1];
          if (lastToken && token.type === "text" && lastToken.type === "text") {
            lastToken.raw += token.raw;
            lastToken.text += token.text;
          } else {
            tokens.push(token);
          }
          continue;
        }
        if (token = this.tokenizer.emStrong(src, maskedSrc, prevChar)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        if (token = this.tokenizer.codespan(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        if (token = this.tokenizer.br(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        if (token = this.tokenizer.del(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        if (token = this.tokenizer.autolink(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        if (!this.state.inLink && (token = this.tokenizer.url(src))) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        cutSrc = src;
        if (this.options.extensions && this.options.extensions.startInline) {
          let startIndex = Infinity;
          const tempSrc = src.slice(1);
          let tempStart;
          this.options.extensions.startInline.forEach((getStartIndex) => {
            tempStart = getStartIndex.call({ lexer: this }, tempSrc);
            if (typeof tempStart === "number" && tempStart >= 0) {
              startIndex = Math.min(startIndex, tempStart);
            }
          });
          if (startIndex < Infinity && startIndex >= 0) {
            cutSrc = src.substring(0, startIndex + 1);
          }
        }
        if (token = this.tokenizer.inlineText(cutSrc)) {
          src = src.substring(token.raw.length);
          if (token.raw.slice(-1) !== "_") {
            prevChar = token.raw.slice(-1);
          }
          keepPrevChar = true;
          lastToken = tokens[tokens.length - 1];
          if (lastToken && lastToken.type === "text") {
            lastToken.raw += token.raw;
            lastToken.text += token.text;
          } else {
            tokens.push(token);
          }
          continue;
        }
        if (src) {
          const errMsg = "Infinite loop on byte: " + src.charCodeAt(0);
          if (this.options.silent) {
            console.error(errMsg);
            break;
          } else {
            throw new Error(errMsg);
          }
        }
      }
      return tokens;
    }
  };
  var _Renderer = class {
    options;
    parser;
    // set by the parser
    constructor(options2) {
      this.options = options2 || _defaults;
    }
    space(token) {
      return "";
    }
    code({ text, lang, escaped }) {
      const langString = (lang || "").match(/^\S*/)?.[0];
      const code = text.replace(/\n$/, "") + "\n";
      if (!langString) {
        return "<pre><code>" + (escaped ? code : escape$1(code, true)) + "</code></pre>\n";
      }
      return '<pre><code class="language-' + escape$1(langString) + '">' + (escaped ? code : escape$1(code, true)) + "</code></pre>\n";
    }
    blockquote({ tokens }) {
      const body = this.parser.parse(tokens);
      return `<blockquote>
${body}</blockquote>
`;
    }
    html({ text }) {
      return text;
    }
    heading({ tokens, depth }) {
      return `<h${depth}>${this.parser.parseInline(tokens)}</h${depth}>
`;
    }
    hr(token) {
      return "<hr>\n";
    }
    list(token) {
      const ordered = token.ordered;
      const start = token.start;
      let body = "";
      for (let j = 0; j < token.items.length; j++) {
        const item = token.items[j];
        body += this.listitem(item);
      }
      const type = ordered ? "ol" : "ul";
      const startAttr = ordered && start !== 1 ? ' start="' + start + '"' : "";
      return "<" + type + startAttr + ">\n" + body + "</" + type + ">\n";
    }
    listitem(item) {
      let itemBody = "";
      if (item.task) {
        const checkbox = this.checkbox({ checked: !!item.checked });
        if (item.loose) {
          if (item.tokens.length > 0 && item.tokens[0].type === "paragraph") {
            item.tokens[0].text = checkbox + " " + item.tokens[0].text;
            if (item.tokens[0].tokens && item.tokens[0].tokens.length > 0 && item.tokens[0].tokens[0].type === "text") {
              item.tokens[0].tokens[0].text = checkbox + " " + item.tokens[0].tokens[0].text;
            }
          } else {
            item.tokens.unshift({
              type: "text",
              raw: checkbox + " ",
              text: checkbox + " "
            });
          }
        } else {
          itemBody += checkbox + " ";
        }
      }
      itemBody += this.parser.parse(item.tokens, !!item.loose);
      return `<li>${itemBody}</li>
`;
    }
    checkbox({ checked }) {
      return "<input " + (checked ? 'checked="" ' : "") + 'disabled="" type="checkbox">';
    }
    paragraph({ tokens }) {
      return `<p>${this.parser.parseInline(tokens)}</p>
`;
    }
    table(token) {
      let header = "";
      let cell = "";
      for (let j = 0; j < token.header.length; j++) {
        cell += this.tablecell(token.header[j]);
      }
      header += this.tablerow({ text: cell });
      let body = "";
      for (let j = 0; j < token.rows.length; j++) {
        const row = token.rows[j];
        cell = "";
        for (let k = 0; k < row.length; k++) {
          cell += this.tablecell(row[k]);
        }
        body += this.tablerow({ text: cell });
      }
      if (body)
        body = `<tbody>${body}</tbody>`;
      return "<table>\n<thead>\n" + header + "</thead>\n" + body + "</table>\n";
    }
    tablerow({ text }) {
      return `<tr>
${text}</tr>
`;
    }
    tablecell(token) {
      const content = this.parser.parseInline(token.tokens);
      const type = token.header ? "th" : "td";
      const tag2 = token.align ? `<${type} align="${token.align}">` : `<${type}>`;
      return tag2 + content + `</${type}>
`;
    }
    /**
     * span level renderer
     */
    strong({ tokens }) {
      return `<strong>${this.parser.parseInline(tokens)}</strong>`;
    }
    em({ tokens }) {
      return `<em>${this.parser.parseInline(tokens)}</em>`;
    }
    codespan({ text }) {
      return `<code>${text}</code>`;
    }
    br(token) {
      return "<br>";
    }
    del({ tokens }) {
      return `<del>${this.parser.parseInline(tokens)}</del>`;
    }
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const cleanHref = cleanUrl(href);
      if (cleanHref === null) {
        return text;
      }
      href = cleanHref;
      let out = '<a href="' + href + '"';
      if (title) {
        out += ' title="' + title + '"';
      }
      out += ">" + text + "</a>";
      return out;
    }
    image({ href, title, text }) {
      const cleanHref = cleanUrl(href);
      if (cleanHref === null) {
        return text;
      }
      href = cleanHref;
      let out = `<img src="${href}" alt="${text}"`;
      if (title) {
        out += ` title="${title}"`;
      }
      out += ">";
      return out;
    }
    text(token) {
      return "tokens" in token && token.tokens ? this.parser.parseInline(token.tokens) : token.text;
    }
  };
  var _TextRenderer = class {
    // no need for block level renderers
    strong({ text }) {
      return text;
    }
    em({ text }) {
      return text;
    }
    codespan({ text }) {
      return text;
    }
    del({ text }) {
      return text;
    }
    html({ text }) {
      return text;
    }
    text({ text }) {
      return text;
    }
    link({ text }) {
      return "" + text;
    }
    image({ text }) {
      return "" + text;
    }
    br() {
      return "";
    }
  };
  var _Parser = class __Parser {
    options;
    renderer;
    textRenderer;
    constructor(options2) {
      this.options = options2 || _defaults;
      this.options.renderer = this.options.renderer || new _Renderer();
      this.renderer = this.options.renderer;
      this.renderer.options = this.options;
      this.renderer.parser = this;
      this.textRenderer = new _TextRenderer();
    }
    /**
     * Static Parse Method
     */
    static parse(tokens, options2) {
      const parser2 = new __Parser(options2);
      return parser2.parse(tokens);
    }
    /**
     * Static Parse Inline Method
     */
    static parseInline(tokens, options2) {
      const parser2 = new __Parser(options2);
      return parser2.parseInline(tokens);
    }
    /**
     * Parse Loop
     */
    parse(tokens, top = true) {
      let out = "";
      for (let i = 0; i < tokens.length; i++) {
        const anyToken = tokens[i];
        if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[anyToken.type]) {
          const genericToken = anyToken;
          const ret = this.options.extensions.renderers[genericToken.type].call({ parser: this }, genericToken);
          if (ret !== false || !["space", "hr", "heading", "code", "table", "blockquote", "list", "html", "paragraph", "text"].includes(genericToken.type)) {
            out += ret || "";
            continue;
          }
        }
        const token = anyToken;
        switch (token.type) {
          case "space": {
            out += this.renderer.space(token);
            continue;
          }
          case "hr": {
            out += this.renderer.hr(token);
            continue;
          }
          case "heading": {
            out += this.renderer.heading(token);
            continue;
          }
          case "code": {
            out += this.renderer.code(token);
            continue;
          }
          case "table": {
            out += this.renderer.table(token);
            continue;
          }
          case "blockquote": {
            out += this.renderer.blockquote(token);
            continue;
          }
          case "list": {
            out += this.renderer.list(token);
            continue;
          }
          case "html": {
            out += this.renderer.html(token);
            continue;
          }
          case "paragraph": {
            out += this.renderer.paragraph(token);
            continue;
          }
          case "text": {
            let textToken = token;
            let body = this.renderer.text(textToken);
            while (i + 1 < tokens.length && tokens[i + 1].type === "text") {
              textToken = tokens[++i];
              body += "\n" + this.renderer.text(textToken);
            }
            if (top) {
              out += this.renderer.paragraph({
                type: "paragraph",
                raw: body,
                text: body,
                tokens: [{ type: "text", raw: body, text: body }]
              });
            } else {
              out += body;
            }
            continue;
          }
          default: {
            const errMsg = 'Token with "' + token.type + '" type was not found.';
            if (this.options.silent) {
              console.error(errMsg);
              return "";
            } else {
              throw new Error(errMsg);
            }
          }
        }
      }
      return out;
    }
    /**
     * Parse Inline Tokens
     */
    parseInline(tokens, renderer) {
      renderer = renderer || this.renderer;
      let out = "";
      for (let i = 0; i < tokens.length; i++) {
        const anyToken = tokens[i];
        if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[anyToken.type]) {
          const ret = this.options.extensions.renderers[anyToken.type].call({ parser: this }, anyToken);
          if (ret !== false || !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(anyToken.type)) {
            out += ret || "";
            continue;
          }
        }
        const token = anyToken;
        switch (token.type) {
          case "escape": {
            out += renderer.text(token);
            break;
          }
          case "html": {
            out += renderer.html(token);
            break;
          }
          case "link": {
            out += renderer.link(token);
            break;
          }
          case "image": {
            out += renderer.image(token);
            break;
          }
          case "strong": {
            out += renderer.strong(token);
            break;
          }
          case "em": {
            out += renderer.em(token);
            break;
          }
          case "codespan": {
            out += renderer.codespan(token);
            break;
          }
          case "br": {
            out += renderer.br(token);
            break;
          }
          case "del": {
            out += renderer.del(token);
            break;
          }
          case "text": {
            out += renderer.text(token);
            break;
          }
          default: {
            const errMsg = 'Token with "' + token.type + '" type was not found.';
            if (this.options.silent) {
              console.error(errMsg);
              return "";
            } else {
              throw new Error(errMsg);
            }
          }
        }
      }
      return out;
    }
  };
  var _Hooks = class {
    options;
    block;
    constructor(options2) {
      this.options = options2 || _defaults;
    }
    static passThroughHooks = /* @__PURE__ */ new Set([
      "preprocess",
      "postprocess",
      "processAllTokens"
    ]);
    /**
     * Process markdown before marked
     */
    preprocess(markdown) {
      return markdown;
    }
    /**
     * Process HTML after marked is finished
     */
    postprocess(html2) {
      return html2;
    }
    /**
     * Process all tokens before walk tokens
     */
    processAllTokens(tokens) {
      return tokens;
    }
    /**
     * Provide function to tokenize markdown
     */
    provideLexer() {
      return this.block ? _Lexer.lex : _Lexer.lexInline;
    }
    /**
     * Provide function to parse tokens
     */
    provideParser() {
      return this.block ? _Parser.parse : _Parser.parseInline;
    }
  };
  var Marked = class {
    defaults = _getDefaults();
    options = this.setOptions;
    parse = this.parseMarkdown(true);
    parseInline = this.parseMarkdown(false);
    Parser = _Parser;
    Renderer = _Renderer;
    TextRenderer = _TextRenderer;
    Lexer = _Lexer;
    Tokenizer = _Tokenizer;
    Hooks = _Hooks;
    constructor(...args) {
      this.use(...args);
    }
    /**
     * Run callback for every token
     */
    walkTokens(tokens, callback) {
      let values = [];
      for (const token of tokens) {
        values = values.concat(callback.call(this, token));
        switch (token.type) {
          case "table": {
            const tableToken = token;
            for (const cell of tableToken.header) {
              values = values.concat(this.walkTokens(cell.tokens, callback));
            }
            for (const row of tableToken.rows) {
              for (const cell of row) {
                values = values.concat(this.walkTokens(cell.tokens, callback));
              }
            }
            break;
          }
          case "list": {
            const listToken = token;
            values = values.concat(this.walkTokens(listToken.items, callback));
            break;
          }
          default: {
            const genericToken = token;
            if (this.defaults.extensions?.childTokens?.[genericToken.type]) {
              this.defaults.extensions.childTokens[genericToken.type].forEach((childTokens) => {
                const tokens2 = genericToken[childTokens].flat(Infinity);
                values = values.concat(this.walkTokens(tokens2, callback));
              });
            } else if (genericToken.tokens) {
              values = values.concat(this.walkTokens(genericToken.tokens, callback));
            }
          }
        }
      }
      return values;
    }
    use(...args) {
      const extensions = this.defaults.extensions || { renderers: {}, childTokens: {} };
      args.forEach((pack) => {
        const opts = { ...pack };
        opts.async = this.defaults.async || opts.async || false;
        if (pack.extensions) {
          pack.extensions.forEach((ext) => {
            if (!ext.name) {
              throw new Error("extension name required");
            }
            if ("renderer" in ext) {
              const prevRenderer = extensions.renderers[ext.name];
              if (prevRenderer) {
                extensions.renderers[ext.name] = function(...args2) {
                  let ret = ext.renderer.apply(this, args2);
                  if (ret === false) {
                    ret = prevRenderer.apply(this, args2);
                  }
                  return ret;
                };
              } else {
                extensions.renderers[ext.name] = ext.renderer;
              }
            }
            if ("tokenizer" in ext) {
              if (!ext.level || ext.level !== "block" && ext.level !== "inline") {
                throw new Error("extension level must be 'block' or 'inline'");
              }
              const extLevel = extensions[ext.level];
              if (extLevel) {
                extLevel.unshift(ext.tokenizer);
              } else {
                extensions[ext.level] = [ext.tokenizer];
              }
              if (ext.start) {
                if (ext.level === "block") {
                  if (extensions.startBlock) {
                    extensions.startBlock.push(ext.start);
                  } else {
                    extensions.startBlock = [ext.start];
                  }
                } else if (ext.level === "inline") {
                  if (extensions.startInline) {
                    extensions.startInline.push(ext.start);
                  } else {
                    extensions.startInline = [ext.start];
                  }
                }
              }
            }
            if ("childTokens" in ext && ext.childTokens) {
              extensions.childTokens[ext.name] = ext.childTokens;
            }
          });
          opts.extensions = extensions;
        }
        if (pack.renderer) {
          const renderer = this.defaults.renderer || new _Renderer(this.defaults);
          for (const prop in pack.renderer) {
            if (!(prop in renderer)) {
              throw new Error(`renderer '${prop}' does not exist`);
            }
            if (["options", "parser"].includes(prop)) {
              continue;
            }
            const rendererProp = prop;
            const rendererFunc = pack.renderer[rendererProp];
            const prevRenderer = renderer[rendererProp];
            renderer[rendererProp] = (...args2) => {
              let ret = rendererFunc.apply(renderer, args2);
              if (ret === false) {
                ret = prevRenderer.apply(renderer, args2);
              }
              return ret || "";
            };
          }
          opts.renderer = renderer;
        }
        if (pack.tokenizer) {
          const tokenizer = this.defaults.tokenizer || new _Tokenizer(this.defaults);
          for (const prop in pack.tokenizer) {
            if (!(prop in tokenizer)) {
              throw new Error(`tokenizer '${prop}' does not exist`);
            }
            if (["options", "rules", "lexer"].includes(prop)) {
              continue;
            }
            const tokenizerProp = prop;
            const tokenizerFunc = pack.tokenizer[tokenizerProp];
            const prevTokenizer = tokenizer[tokenizerProp];
            tokenizer[tokenizerProp] = (...args2) => {
              let ret = tokenizerFunc.apply(tokenizer, args2);
              if (ret === false) {
                ret = prevTokenizer.apply(tokenizer, args2);
              }
              return ret;
            };
          }
          opts.tokenizer = tokenizer;
        }
        if (pack.hooks) {
          const hooks = this.defaults.hooks || new _Hooks();
          for (const prop in pack.hooks) {
            if (!(prop in hooks)) {
              throw new Error(`hook '${prop}' does not exist`);
            }
            if (["options", "block"].includes(prop)) {
              continue;
            }
            const hooksProp = prop;
            const hooksFunc = pack.hooks[hooksProp];
            const prevHook = hooks[hooksProp];
            if (_Hooks.passThroughHooks.has(prop)) {
              hooks[hooksProp] = (arg) => {
                if (this.defaults.async) {
                  return Promise.resolve(hooksFunc.call(hooks, arg)).then((ret2) => {
                    return prevHook.call(hooks, ret2);
                  });
                }
                const ret = hooksFunc.call(hooks, arg);
                return prevHook.call(hooks, ret);
              };
            } else {
              hooks[hooksProp] = (...args2) => {
                let ret = hooksFunc.apply(hooks, args2);
                if (ret === false) {
                  ret = prevHook.apply(hooks, args2);
                }
                return ret;
              };
            }
          }
          opts.hooks = hooks;
        }
        if (pack.walkTokens) {
          const walkTokens2 = this.defaults.walkTokens;
          const packWalktokens = pack.walkTokens;
          opts.walkTokens = function(token) {
            let values = [];
            values.push(packWalktokens.call(this, token));
            if (walkTokens2) {
              values = values.concat(walkTokens2.call(this, token));
            }
            return values;
          };
        }
        this.defaults = { ...this.defaults, ...opts };
      });
      return this;
    }
    setOptions(opt) {
      this.defaults = { ...this.defaults, ...opt };
      return this;
    }
    lexer(src, options2) {
      return _Lexer.lex(src, options2 ?? this.defaults);
    }
    parser(tokens, options2) {
      return _Parser.parse(tokens, options2 ?? this.defaults);
    }
    parseMarkdown(blockType) {
      const parse = (src, options2) => {
        const origOpt = { ...options2 };
        const opt = { ...this.defaults, ...origOpt };
        const throwError = this.onError(!!opt.silent, !!opt.async);
        if (this.defaults.async === true && origOpt.async === false) {
          return throwError(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));
        }
        if (typeof src === "undefined" || src === null) {
          return throwError(new Error("marked(): input parameter is undefined or null"));
        }
        if (typeof src !== "string") {
          return throwError(new Error("marked(): input parameter is of type " + Object.prototype.toString.call(src) + ", string expected"));
        }
        if (opt.hooks) {
          opt.hooks.options = opt;
          opt.hooks.block = blockType;
        }
        const lexer2 = opt.hooks ? opt.hooks.provideLexer() : blockType ? _Lexer.lex : _Lexer.lexInline;
        const parser2 = opt.hooks ? opt.hooks.provideParser() : blockType ? _Parser.parse : _Parser.parseInline;
        if (opt.async) {
          return Promise.resolve(opt.hooks ? opt.hooks.preprocess(src) : src).then((src2) => lexer2(src2, opt)).then((tokens) => opt.hooks ? opt.hooks.processAllTokens(tokens) : tokens).then((tokens) => opt.walkTokens ? Promise.all(this.walkTokens(tokens, opt.walkTokens)).then(() => tokens) : tokens).then((tokens) => parser2(tokens, opt)).then((html2) => opt.hooks ? opt.hooks.postprocess(html2) : html2).catch(throwError);
        }
        try {
          if (opt.hooks) {
            src = opt.hooks.preprocess(src);
          }
          let tokens = lexer2(src, opt);
          if (opt.hooks) {
            tokens = opt.hooks.processAllTokens(tokens);
          }
          if (opt.walkTokens) {
            this.walkTokens(tokens, opt.walkTokens);
          }
          let html2 = parser2(tokens, opt);
          if (opt.hooks) {
            html2 = opt.hooks.postprocess(html2);
          }
          return html2;
        } catch (e) {
          return throwError(e);
        }
      };
      return parse;
    }
    onError(silent, async) {
      return (e) => {
        e.message += "\nPlease report this to https://github.com/markedjs/marked.";
        if (silent) {
          const msg = "<p>An error occurred:</p><pre>" + escape$1(e.message + "", true) + "</pre>";
          if (async) {
            return Promise.resolve(msg);
          }
          return msg;
        }
        if (async) {
          return Promise.reject(e);
        }
        throw e;
      };
    }
  };
  var markedInstance = new Marked();
  function marked(src, opt) {
    return markedInstance.parse(src, opt);
  }
  marked.options = marked.setOptions = function(options2) {
    markedInstance.setOptions(options2);
    marked.defaults = markedInstance.defaults;
    changeDefaults(marked.defaults);
    return marked;
  };
  marked.getDefaults = _getDefaults;
  marked.defaults = _defaults;
  marked.use = function(...args) {
    markedInstance.use(...args);
    marked.defaults = markedInstance.defaults;
    changeDefaults(marked.defaults);
    return marked;
  };
  marked.walkTokens = function(tokens, callback) {
    return markedInstance.walkTokens(tokens, callback);
  };
  marked.parseInline = markedInstance.parseInline;
  marked.Parser = _Parser;
  marked.parser = _Parser.parse;
  marked.Renderer = _Renderer;
  marked.TextRenderer = _TextRenderer;
  marked.Lexer = _Lexer;
  marked.lexer = _Lexer.lex;
  marked.Tokenizer = _Tokenizer;
  marked.Hooks = _Hooks;
  marked.parse = marked;
  var options = marked.options;
  var setOptions = marked.setOptions;
  var use = marked.use;
  var walkTokens = marked.walkTokens;
  var parseInline = marked.parseInline;
  var parser = _Parser.parse;
  var lexer = _Lexer.lex;

  // src/renderer.js
  var ON_HEADING_COLOR = "#1e4e79";
  var CODE_BG = "#f6f8fa";
  var CODE_FONT = "Consolas,'Courier New',monospace";
  var HEADING_FONT_SIZE = { 1: "20pt", 2: "16pt", 3: "14pt", 4: "12pt", 5: "11.5pt", 6: "11pt" };
  var HEADING_MARGIN = "margin-top:11pt;margin-bottom:11pt";
  function headingStyle(depth) {
    return `font-size:${HEADING_FONT_SIZE[depth]};color:${ON_HEADING_COLOR};${HEADING_MARGIN}`;
  }
  function buildMarked() {
    const marked2 = new Marked({ gfm: true, breaks: false });
    marked2.use({
      renderer: {
        // Headings → emit the exact inline style OneNote uses for its built-in
        // heading styles, so paste maps them to real heading styles.
        heading({ tokens, depth }) {
          const text = this.parser.parseInline(tokens);
          return `<h${depth} style="${headingStyle(depth)}">${text}</h${depth}>
`;
        },
        // Code block → OneNote-friendly div. OneNote does not preserve <pre>;
        // we render a styled div with an optional language label.
        code({ text, lang }) {
          const language = (lang || "").trim();
          const label = language ? `<div style="font-family:${CODE_FONT};font-size:10pt;color:#6a737d;padding:2px 8px 0 8px">${escapeHtml(language)}</div>` : "";
          const body = `<pre style="margin:0;padding:8px;white-space:pre-wrap;word-break:break-word;font-family:${CODE_FONT};font-size:10pt">${escapeHtml(text)}</pre>`;
          return `<div style="background-color:${CODE_BG};border:1px solid #e1e4e8;border-radius:4px;margin:8px 0;overflow-x:auto">${label}${body}</div>`;
        }
      }
    });
    return marked2;
  }
  var _marked = buildMarked();
  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function postProcess(html2) {
    return html2.replace(/<table(?![^>]*\sborder=)/g, '<table border="1"');
  }
  function mdToOneNoteHtml(md) {
    if (!md || !md.trim()) return "";
    const raw = _marked.parse(md, { async: false });
    return postProcess(String(raw));
  }

  // src/pipeline.js
  var BADGE_STYLES = {
    user: "background-color:#2563eb;color:#ffffff;font-size:11pt;font-weight:bold",
    assistant: "background-color:#0d9488;color:#ffffff;font-size:11pt;font-weight:bold"
  };
  var BADGE_LABEL = { user: "\u{1F9D1} \u7528\u6237", assistant: "\u{1F916} AI" };
  function htmlToPlainText(html2) {
    let root4;
    if (typeof DOMParser !== "undefined") {
      root4 = new DOMParser().parseFromString(html2, "text/html").body;
    } else {
      root4 = document.createElement("div");
      root4.innerHTML = html2;
    }
    root4.querySelectorAll("p,div,li,tr,h1,h2,h3,h4,h5,h6").forEach((el) => {
      el.append("\n");
    });
    return (root4.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
  }
  function roleBadge(role) {
    const style = BADGE_STYLES[role] || BADGE_STYLES.assistant;
    const label = BADGE_LABEL[role] || BADGE_LABEL.assistant;
    return `<p style="${style}">${label}</p>`;
  }
  function frameMessageHtml(role, bodyHtml) {
    return `${roleBadge(role)}
<p>&nbsp;</p>
${bodyHtml}`;
  }
  function renderMessage(msg) {
    const md = htmlToMd(msg.el);
    const bodyHtml = mdToOneNoteHtml(md);
    const html2 = frameMessageHtml(msg.role, bodyHtml);
    return { html: html2, text: htmlToPlainText(html2), md };
  }
  function renderConversation(messages) {
    const html2 = renderMessagesHtml(messages);
    return { html: html2, text: htmlToPlainText(html2) };
  }
  function findTurnIndex(messages, el) {
    if (!el) return -1;
    let idx = messages.findIndex((m) => m.el === el);
    if (idx >= 0) return idx;
    return messages.findIndex((m) => m.el && (m.el.contains(el) || el.contains(m.el)));
  }
  function renderTurn(messages, startIndex) {
    const msgs = messages.slice(startIndex);
    const turn = [];
    for (let i = 0; i < msgs.length; i++) {
      if (i === 0) {
        turn.push(msgs[i]);
        continue;
      }
      if (msgs[i].role === "user") break;
      turn.push(msgs[i]);
    }
    const html2 = renderMessagesHtml(turn);
    return { html: html2, text: htmlToPlainText(html2), nextIndex: startIndex + turn.length };
  }
  function renderMessagesHtml(messages) {
    const DIVIDER = '<hr style="border:none;border-top:2px solid #d1d5db;margin:16px 0">';
    const ctx = {};
    const parts = messages.map((m) => {
      const md = htmlToMd(m.el, ctx);
      const bodyHtml = mdToOneNoteHtml(md);
      return frameMessageHtml(m.role, bodyHtml);
    });
    return parts.join(`
${DIVIDER}
`);
  }

  // src/clipboard.js
  async function copyRichText(html2, text) {
    if (typeof ClipboardItem === "undefined") {
      throw new Error("ClipboardItem is not supported in this browser.");
    }
    const item = new ClipboardItem({
      "text/html": new Blob([html2], { type: "text/html" }),
      "text/plain": new Blob([text || html2], { type: "text/plain" })
    });
    await navigator.clipboard.write([item]);
  }
  async function copyRichTextFallback(html2, text) {
    const holder = document.createElement("div");
    holder.setAttribute("contenteditable", "true");
    holder.style.position = "fixed";
    holder.style.top = "-9999px";
    holder.innerHTML = html2;
    document.body.appendChild(holder);
    try {
      const range = document.createRange();
      range.selectNodeContents(holder);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      const ok = document.execCommand("copy");
      sel.removeAllRanges();
      if (!ok) throw new Error("execCommand copy failed");
    } finally {
      holder.remove();
    }
  }
  async function copyForOneNote(html2, text) {
    try {
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        await copyRichText(html2, text);
        return { method: "clipboard-item" };
      }
    } catch (err) {
      console.warn("[ai-copy] ClipboardItem write failed, falling back:", err);
    }
    await copyRichTextFallback(html2, text);
    return { method: "execcommand" };
  }

  // src/ui.js
  var STYLES = `
  :host { all: initial; }
  .fab {
    position: fixed; right: 24px; bottom: 24px; z-index: 2147483647;
    width: 52px; height: 52px; border-radius: 50%;
    background: #2563eb; color: #fff; border: none; cursor: pointer;
    font-size: 22px; box-shadow: 0 4px 14px rgba(0,0,0,.28);
    display: flex; align-items: center; justify-content: center;
    transition: transform .12s ease, background .12s ease;
    user-select: none; touch-action: none;
  }
  .fab:hover { background: #1d4ed8; transform: scale(1.06); }
  .fab:active { transform: scale(.96); }
  .fab[disabled] { opacity: .55; cursor: not-allowed; }
  .fab.dragging { transition: none; cursor: grabbing; opacity: .9; }

  .copy-btn {
    background: transparent; border: 1px solid #d1d5db; border-radius: 6px;
    padding: 2px 8px; font-size: 12px; color: #374151; cursor: pointer;
    opacity: 0; transition: opacity .12s ease;
  }
  .copy-btn:hover { background: #f3f4f6; }

  .toast {
    position: fixed; left: 50%; bottom: 40px; transform: translateX(-50%);
    z-index: 2147483647; background: #111827; color: #fff;
    padding: 10px 18px; border-radius: 8px; font-size: 14px;
    box-shadow: 0 6px 20px rgba(0,0,0,.3); opacity: 0;
    transition: opacity .2s ease, transform .2s ease; pointer-events: none;
  }
  .toast.show { opacity: 1; transform: translateX(-50%) translateY(-4px); }
`;
  function createShadowRoot() {
    const host = document.createElement("div");
    host.id = "ai-copy-host";
    const shadow = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = STYLES;
    shadow.appendChild(style);
    document.documentElement.appendChild(host);
    return shadow;
  }
  function toast(shadow, message, ms = 1800) {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = message;
    shadow.appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => el.remove(), 250);
    }, ms);
  }
  async function doCopy(shadow, adapter, messages) {
    try {
      const { html: html2, text } = renderConversation(messages);
      await copyForOneNote(html2, text);
      toast(shadow, `\u2713 \u5DF2\u590D\u5236 ${messages.length} \u6761\u6D88\u606F\uFF0C\u53EF\u7C98\u8D34\u5230 OneNote`);
    } catch (err) {
      console.error("[ai-copy] copy failed", err);
      toast(shadow, "\u2717 \u590D\u5236\u5931\u8D25\uFF1A" + (err && err.message || err), 3e3);
    }
  }
  var FAB_POSITION_KEY = "ai-copy-fab-position";
  var DRAG_THRESHOLD = 5;
  function applySavedPosition(fab) {
    try {
      const saved = JSON.parse(localStorage.getItem(FAB_POSITION_KEY) || "");
      if (!saved || typeof saved.x !== "number" || typeof saved.y !== "number") return;
      const x = Math.min(Math.max(saved.x, 0), window.innerWidth - fab.offsetWidth);
      const y = Math.min(Math.max(saved.y, 0), window.innerHeight - fab.offsetHeight);
      fab.style.left = x + "px";
      fab.style.top = y + "px";
      fab.style.right = "auto";
      fab.style.bottom = "auto";
    } catch (_) {
    }
  }
  function makeDraggable(fab) {
    let startX = 0, startY = 0, originX = 0, originY = 0;
    let dragging = false, moved = false;
    const onDown = (e) => {
      const pt = e.touches ? e.touches[0] : e;
      startX = pt.clientX;
      startY = pt.clientY;
      const rect = fab.getBoundingClientRect();
      originX = rect.left;
      originY = rect.top;
      dragging = true;
      moved = false;
      if (e.cancelable) e.preventDefault();
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
      window.addEventListener("touchmove", onMove, { passive: false });
      window.addEventListener("touchend", onUp);
    };
    const onMove = (e) => {
      if (!dragging) return;
      const pt = e.touches ? e.touches[0] : e;
      const dx = pt.clientX - startX;
      const dy = pt.clientY - startY;
      if (!moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      if (!moved) {
        moved = true;
        fab.classList.add("dragging");
      }
      const x = Math.min(Math.max(originX + dx, 0), window.innerWidth - fab.offsetWidth);
      const y = Math.min(Math.max(originY + dy, 0), window.innerHeight - fab.offsetHeight);
      fab.style.left = x + "px";
      fab.style.top = y + "px";
      fab.style.right = "auto";
      fab.style.bottom = "auto";
      if (e.cancelable) e.preventDefault();
    };
    const onUp = () => {
      dragging = false;
      fab.classList.remove("dragging");
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
      if (moved) {
        const rect = fab.getBoundingClientRect();
        try {
          localStorage.setItem(FAB_POSITION_KEY, JSON.stringify({ x: rect.left, y: rect.top }));
        } catch (_) {
        }
      }
    };
    fab.addEventListener("mousedown", onDown);
    fab.addEventListener("touchstart", onDown, { passive: false });
    fab.addEventListener(
      "click",
      (e) => {
        if (moved) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      true
    );
  }
  function mountFloatingButton(adapter) {
    const shadow = createShadowRoot();
    const fab = document.createElement("button");
    fab.className = "fab";
    fab.title = "\u590D\u5236\u6574\u6BB5\u5BF9\u8BDD\u5230 OneNote\uFF08\u62D6\u52A8\u53EF\u79FB\u52A8\u4F4D\u7F6E\uFF09";
    fab.textContent = "\u{1F4CB}";
    fab.addEventListener("click", async () => {
      const messages = adapter.getMessages();
      if (!messages.length) {
        toast(shadow, "\u672A\u68C0\u6D4B\u5230\u5BF9\u8BDD\u6D88\u606F", 2200);
        return;
      }
      fab.disabled = true;
      try {
        await doCopy(shadow, adapter, messages);
      } finally {
        fab.disabled = false;
      }
    });
    shadow.appendChild(fab);
    applySavedPosition(fab);
    makeDraggable(fab);
  }
  function mountPerMessageButtons(adapter) {
    const shadow = document.shadowRoots ? null : createShadowRoot();
    const hostShadow = shadow || document.getElementById("ai-copy-host").shadowRoot;
    async function copyOne(role, el, label) {
      try {
        const { html: html2, text } = renderMessage({ role, el });
        await copyForOneNote(html2, text);
        toast(hostShadow, label);
      } catch (err) {
        toast(hostShadow, "\u2717 \u590D\u5236\u5931\u8D25\uFF1A" + (err && err.message || err), 3e3);
      }
    }
    async function copyTurn(contentEl, label) {
      try {
        const messages = adapter.getMessages();
        const start = findTurnIndex(messages, contentEl);
        if (start < 0) throw new Error("\u672A\u627E\u5230\u8BE5\u6D88\u606F");
        const { html: html2, text } = renderTurn(messages, start);
        await copyForOneNote(html2, text);
        toast(hostShadow, label);
      } catch (err) {
        toast(hostShadow, "\u2717 \u590D\u5236\u5931\u8D25\uFF1A" + (err && err.message || err), 3e3);
      }
    }
    if (typeof adapter.getNativeToolbars === "function") {
      mountNativeToolbarButtons(adapter, hostShadow, copyOne, copyTurn);
    } else {
      mountOverlayButtons(adapter, hostShadow, copyOne, copyTurn);
    }
  }
  function mountNativeToolbarButtons(adapter, hostShadow, copyOne, copyTurn) {
    const NATIVE_BTN_CLASS = "text-token-text-secondary hover:bg-token-surface-hover rounded-lg";
    const SPAN_CLASS = "flex items-center justify-center touch:w-10 h-8 w-8";
    function ensureSharedTip() {
      let tip = document.getElementById("aicopy-shared-tip");
      if (tip) return tip;
      tip = document.createElement("div");
      tip.id = "aicopy-shared-tip";
      tip.style.cssText = 'position:fixed;background:#0d0d0d;color:#ffffff;font-size:12px;line-height:16px;font-weight:600;padding:5px 9px;border-radius:6px;white-space:nowrap;opacity:0;pointer-events:none;z-index:2147483647;transition:opacity .1s ease;font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,Arial,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.18)';
      document.body.appendChild(tip);
      return tip;
    }
    function showTip(tip, anchor, text) {
      tip.textContent = text;
      const r = anchor.getBoundingClientRect();
      tip.style.left = Math.max(4, Math.min(r.left + r.width / 2, window.innerWidth - 4)) + "px";
      tip.style.top = r.bottom + 8 + "px";
      tip.style.transform = "translateX(-50%)";
      tip.style.opacity = "1";
    }
    function hideTip(tip) {
      tip.style.opacity = "0";
    }
    const svgAttrs = 'xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
    const CLIPBOARD_SVG = `<svg ${svgAttrs}><path d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"/></svg>`;
    const CLIPBOARD_DOC_SVG = `<svg ${svgAttrs}><path d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 0 0-9-9Z"/></svg>`;
    const sharedTip = ensureSharedTip();
    function makeNativeButton(title, double) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = NATIVE_BTN_CLASS;
      btn.setAttribute("aria-label", title);
      btn.setAttribute("data-state", "closed");
      const span = document.createElement("span");
      span.className = SPAN_CLASS;
      span.innerHTML = double ? CLIPBOARD_DOC_SVG : CLIPBOARD_SVG;
      btn.appendChild(span);
      btn.addEventListener("mouseenter", () => showTip(sharedTip, btn, title));
      btn.addEventListener("mouseleave", () => hideTip(sharedTip));
      btn.addEventListener("focus", () => showTip(sharedTip, btn, title));
      btn.addEventListener("blur", () => hideTip(sharedTip));
      return btn;
    }
    const attach = ({ toolbar, content, role }) => {
      if (toolbar.dataset.aiCopyBound) return;
      toolbar.dataset.aiCopyBound = "1";
      const singleBtn = makeNativeButton("\u590D\u5236\u672C\u6761\u5230 OneNote", false);
      singleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        copyOne(role, content, "\u2713 \u5DF2\u590D\u5236\u8BE5\u6D88\u606F");
      });
      toolbar.appendChild(singleBtn);
      if (role === "user") {
        const turnBtn = makeNativeButton("\u590D\u5236\u672C\u8F6E\u5230 OneNote", true);
        turnBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          copyTurn(content, "\u2713 \u5DF2\u590D\u5236\u672C\u8F6E\u5BF9\u8BDD");
        });
        toolbar.appendChild(turnBtn);
      }
    };
    const scan = () => adapter.getNativeToolbars().forEach(attach);
    scan();
    const obs = new MutationObserver(() => scan());
    obs.observe(document.body, { childList: true, subtree: true });
  }
  function mountOverlayButtons(adapter, hostShadow, copyOne, copyTurn) {
    const attachTo = (el, indexInList) => {
      if (el.dataset.aiCopyBound) return;
      el.dataset.aiCopyBound = "1";
      el.style.position = getComputedStyle(el).position === "static" ? "relative" : "";
      const role = adapter.getRole ? adapter.getRole(el) : "assistant";
      const singleBtn = makeOverlayButton("\u{1F4CB} \u672C\u6761");
      singleBtn.style.right = "4px";
      singleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        copyOne(role, el, "\u2713 \u5DF2\u590D\u5236\u8BE5\u6D88\u606F");
      });
      const buttons = [singleBtn];
      if (role === "user") {
        const turnBtn = makeOverlayButton("\u{1F4CB} \u672C\u8F6E");
        turnBtn.style.right = "70px";
        turnBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          copyTurn(el, "\u2713 \u5DF2\u590D\u5236\u672C\u8F6E\u5BF9\u8BDD");
        });
        buttons.push(turnBtn);
      }
      for (const b of buttons) {
        b.style.opacity = "0";
        el.appendChild(b);
      }
      el.addEventListener("mouseenter", () => buttons.forEach((b) => b.style.opacity = "1"));
      el.addEventListener("mouseleave", () => buttons.forEach((b) => b.style.opacity = "0"));
    };
    const scan = () => (adapter.getMessageElements?.() || []).forEach(attachTo);
    scan();
    const obs = new MutationObserver(() => scan());
    obs.observe(document.body, { childList: true, subtree: true });
  }
  function makeOverlayButton(label) {
    const btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.textContent = label;
    btn.style.position = "absolute";
    btn.style.top = "4px";
    btn.style.zIndex = "10";
    return btn;
  }

  // src/index.js
  var ADAPTERS = [chatgpt_default, gemini_default, claude_default, deepseek_default, kimi_default, doubao_default];
  if (window.trustedTypes && window.trustedTypes.createPolicy) {
    try {
      window.trustedTypes.createPolicy("default", { createHTML: (s) => s });
    } catch (_) {
    }
  }
  function pickAdapter() {
    return ADAPTERS.find((a) => [].concat(a.host).some((h) => location.hostname === h || location.hostname.endsWith("." + h)));
  }
  var booted = false;
  function boot() {
    if (booted) return;
    const adapter = pickAdapter();
    if (!adapter) return;
    booted = true;
    console.log(`[ai-copy] active on ${adapter.name}`);
    mountFloatingButton(adapter);
    mountPerMessageButtons(adapter);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
