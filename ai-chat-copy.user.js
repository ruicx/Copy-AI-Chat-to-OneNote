// ==UserScript==
// @name         AI 对话一键复制到 OneNote
// @namespace    https://github.com/ruicx/Copy-AI-Chat-to-OneNote
// @version      0.5.5
// @description  Copy AI Chat (ChatGPT/Gemini/Claude/DeepSeek/Kimi/Doubao) content to OneNote with a single click. Support Markdown, code blocks, and images. Copy the entire conversation or just the latest message. Compatible with Tampermonkey and Violentmonkey.
// @author       ruicx
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
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // node_modules/highlight.js/lib/core.js
  var require_core = __commonJS({
    "node_modules/highlight.js/lib/core.js"(exports, module) {
      function deepFreeze(obj) {
        if (obj instanceof Map) {
          obj.clear = obj.delete = obj.set = function() {
            throw new Error("map is read-only");
          };
        } else if (obj instanceof Set) {
          obj.add = obj.clear = obj.delete = function() {
            throw new Error("set is read-only");
          };
        }
        Object.freeze(obj);
        Object.getOwnPropertyNames(obj).forEach((name) => {
          const prop = obj[name];
          const type = typeof prop;
          if ((type === "object" || type === "function") && !Object.isFrozen(prop)) {
            deepFreeze(prop);
          }
        });
        return obj;
      }
      var Response = class {
        /**
         * @param {CompiledMode} mode
         */
        constructor(mode) {
          if (mode.data === void 0) mode.data = {};
          this.data = mode.data;
          this.isMatchIgnored = false;
        }
        ignoreMatch() {
          this.isMatchIgnored = true;
        }
      };
      function escapeHTML(value) {
        return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
      }
      function inherit$1(original, ...objects) {
        const result = /* @__PURE__ */ Object.create(null);
        for (const key in original) {
          result[key] = original[key];
        }
        objects.forEach(function(obj) {
          for (const key in obj) {
            result[key] = obj[key];
          }
        });
        return (
          /** @type {T} */
          result
        );
      }
      var SPAN_CLOSE = "</span>";
      var emitsWrappingTags = (node) => {
        return !!node.scope;
      };
      var scopeToCSSClass = (name, { prefix }) => {
        if (name.startsWith("language:")) {
          return name.replace("language:", "language-");
        }
        if (name.includes(".")) {
          const pieces = name.split(".");
          return [
            `${prefix}${pieces.shift()}`,
            ...pieces.map((x, i) => `${x}${"_".repeat(i + 1)}`)
          ].join(" ");
        }
        return `${prefix}${name}`;
      };
      var HTMLRenderer = class {
        /**
         * Creates a new HTMLRenderer
         *
         * @param {Tree} parseTree - the parse tree (must support `walk` API)
         * @param {{classPrefix: string}} options
         */
        constructor(parseTree2, options2) {
          this.buffer = "";
          this.classPrefix = options2.classPrefix;
          parseTree2.walk(this);
        }
        /**
         * Adds texts to the output stream
         *
         * @param {string} text */
        addText(text2) {
          this.buffer += escapeHTML(text2);
        }
        /**
         * Adds a node open to the output stream (if needed)
         *
         * @param {Node} node */
        openNode(node) {
          if (!emitsWrappingTags(node)) return;
          const className = scopeToCSSClass(
            node.scope,
            { prefix: this.classPrefix }
          );
          this.span(className);
        }
        /**
         * Adds a node close to the output stream (if needed)
         *
         * @param {Node} node */
        closeNode(node) {
          if (!emitsWrappingTags(node)) return;
          this.buffer += SPAN_CLOSE;
        }
        /**
         * returns the accumulated buffer
        */
        value() {
          return this.buffer;
        }
        // helpers
        /**
         * Builds a span element
         *
         * @param {string} className */
        span(className) {
          this.buffer += `<span class="${className}">`;
        }
      };
      var newNode = (opts = {}) => {
        const result = { children: [] };
        Object.assign(result, opts);
        return result;
      };
      var TokenTree = class _TokenTree {
        constructor() {
          this.rootNode = newNode();
          this.stack = [this.rootNode];
        }
        get top() {
          return this.stack[this.stack.length - 1];
        }
        get root() {
          return this.rootNode;
        }
        /** @param {Node} node */
        add(node) {
          this.top.children.push(node);
        }
        /** @param {string} scope */
        openNode(scope) {
          const node = newNode({ scope });
          this.add(node);
          this.stack.push(node);
        }
        closeNode() {
          if (this.stack.length > 1) {
            return this.stack.pop();
          }
          return void 0;
        }
        closeAllNodes() {
          while (this.closeNode()) ;
        }
        toJSON() {
          return JSON.stringify(this.rootNode, null, 4);
        }
        /**
         * @typedef { import("./html_renderer").Renderer } Renderer
         * @param {Renderer} builder
         */
        walk(builder) {
          return this.constructor._walk(builder, this.rootNode);
        }
        /**
         * @param {Renderer} builder
         * @param {Node} node
         */
        static _walk(builder, node) {
          if (typeof node === "string") {
            builder.addText(node);
          } else if (node.children) {
            builder.openNode(node);
            node.children.forEach((child) => this._walk(builder, child));
            builder.closeNode(node);
          }
          return builder;
        }
        /**
         * @param {Node} node
         */
        static _collapse(node) {
          if (typeof node === "string") return;
          if (!node.children) return;
          if (node.children.every((el) => typeof el === "string")) {
            node.children = [node.children.join("")];
          } else {
            node.children.forEach((child) => {
              _TokenTree._collapse(child);
            });
          }
        }
      };
      var TokenTreeEmitter = class extends TokenTree {
        /**
         * @param {*} options
         */
        constructor(options2) {
          super();
          this.options = options2;
        }
        /**
         * @param {string} text
         */
        addText(text2) {
          if (text2 === "") {
            return;
          }
          this.add(text2);
        }
        /** @param {string} scope */
        startScope(scope) {
          this.openNode(scope);
        }
        endScope() {
          this.closeNode();
        }
        /**
         * @param {Emitter & {root: DataNode}} emitter
         * @param {string} name
         */
        __addSublanguage(emitter, name) {
          const node = emitter.root;
          if (name) node.scope = `language:${name}`;
          this.add(node);
        }
        toHTML() {
          const renderer = new HTMLRenderer(this, this.options);
          return renderer.value();
        }
        finalize() {
          this.closeAllNodes();
          return true;
        }
      };
      function source(re) {
        if (!re) return null;
        if (typeof re === "string") return re;
        return re.source;
      }
      function lookahead(re) {
        return concat("(?=", re, ")");
      }
      function anyNumberOfTimes(re) {
        return concat("(?:", re, ")*");
      }
      function optional(re) {
        return concat("(?:", re, ")?");
      }
      function concat(...args) {
        const joined = args.map((x) => source(x)).join("");
        return joined;
      }
      function stripOptionsFromArgs(args) {
        const opts = args[args.length - 1];
        if (typeof opts === "object" && opts.constructor === Object) {
          args.splice(args.length - 1, 1);
          return opts;
        } else {
          return {};
        }
      }
      function either(...args) {
        const opts = stripOptionsFromArgs(args);
        const joined = "(" + (opts.capture ? "" : "?:") + args.map((x) => source(x)).join("|") + ")";
        return joined;
      }
      function countMatchGroups(re) {
        return new RegExp(re.toString() + "|").exec("").length - 1;
      }
      function startsWith(re, lexeme) {
        const match = re && re.exec(lexeme);
        return match && match.index === 0;
      }
      var BACKREF_RE = /\[(?:[^\\\]]|\\.)*\]|\(\??|\\([1-9][0-9]*)|\\./;
      function _rewriteBackreferences(regexps, { joinWith }) {
        let numCaptures = 0;
        return regexps.map((regex) => {
          numCaptures += 1;
          const offset2 = numCaptures;
          let re = source(regex);
          let out = "";
          while (re.length > 0) {
            const match = BACKREF_RE.exec(re);
            if (!match) {
              out += re;
              break;
            }
            out += re.substring(0, match.index);
            re = re.substring(match.index + match[0].length);
            if (match[0][0] === "\\" && match[1]) {
              out += "\\" + String(Number(match[1]) + offset2);
            } else {
              out += match[0];
              if (match[0] === "(") {
                numCaptures++;
              }
            }
          }
          return out;
        }).map((re) => `(${re})`).join(joinWith);
      }
      var MATCH_NOTHING_RE = /\b\B/;
      var IDENT_RE3 = "[a-zA-Z]\\w*";
      var UNDERSCORE_IDENT_RE = "[a-zA-Z_]\\w*";
      var NUMBER_RE = "\\b\\d+(\\.\\d+)?";
      var C_NUMBER_RE = "(-?)(\\b0[xX][a-fA-F0-9]+|(\\b\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)";
      var BINARY_NUMBER_RE = "\\b(0b[01]+)";
      var RE_STARTERS_RE = "!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|-|-=|/=|/|:|;|<<|<<=|<=|<|===|==|=|>>>=|>>=|>=|>>>|>>|>|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~";
      var SHEBANG = (opts = {}) => {
        const beginShebang = /^#![ ]*\//;
        if (opts.binary) {
          opts.begin = concat(
            beginShebang,
            /.*\b/,
            opts.binary,
            /\b.*/
          );
        }
        return inherit$1({
          scope: "meta",
          begin: beginShebang,
          end: /$/,
          relevance: 0,
          /** @type {ModeCallback} */
          "on:begin": (m, resp) => {
            if (m.index !== 0) resp.ignoreMatch();
          }
        }, opts);
      };
      var BACKSLASH_ESCAPE = {
        begin: "\\\\[\\s\\S]",
        relevance: 0
      };
      var APOS_STRING_MODE = {
        scope: "string",
        begin: "'",
        end: "'",
        illegal: "\\n",
        contains: [BACKSLASH_ESCAPE]
      };
      var QUOTE_STRING_MODE = {
        scope: "string",
        begin: '"',
        end: '"',
        illegal: "\\n",
        contains: [BACKSLASH_ESCAPE]
      };
      var PHRASAL_WORDS_MODE = {
        begin: /\b(a|an|the|are|I'm|isn't|don't|doesn't|won't|but|just|should|pretty|simply|enough|gonna|going|wtf|so|such|will|you|your|they|like|more)\b/
      };
      var COMMENT = function(begin, end, modeOptions = {}) {
        const mode = inherit$1(
          {
            scope: "comment",
            begin,
            end,
            contains: []
          },
          modeOptions
        );
        mode.contains.push({
          scope: "doctag",
          // hack to avoid the space from being included. the space is necessary to
          // match here to prevent the plain text rule below from gobbling up doctags
          begin: "[ ]*(?=(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):)",
          end: /(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):/,
          excludeBegin: true,
          relevance: 0
        });
        const ENGLISH_WORD = either(
          // list of common 1 and 2 letter words in English
          "I",
          "a",
          "is",
          "so",
          "us",
          "to",
          "at",
          "if",
          "in",
          "it",
          "on",
          // note: this is not an exhaustive list of contractions, just popular ones
          /[A-Za-z]+['](d|ve|re|ll|t|s|n)/,
          // contractions - can't we'd they're let's, etc
          /[A-Za-z]+[-][a-z]+/,
          // `no-way`, etc.
          /[A-Za-z][a-z]{2,}/
          // allow capitalized words at beginning of sentences
        );
        mode.contains.push(
          {
            // TODO: how to include ", (, ) without breaking grammars that use these for
            // comment delimiters?
            // begin: /[ ]+([()"]?([A-Za-z'-]{3,}|is|a|I|so|us|[tT][oO]|at|if|in|it|on)[.]?[()":]?([.][ ]|[ ]|\))){3}/
            // ---
            // this tries to find sequences of 3 english words in a row (without any
            // "programming" type syntax) this gives us a strong signal that we've
            // TRULY found a comment - vs perhaps scanning with the wrong language.
            // It's possible to find something that LOOKS like the start of the
            // comment - but then if there is no readable text - good chance it is a
            // false match and not a comment.
            //
            // for a visual example please see:
            // https://github.com/highlightjs/highlight.js/issues/2827
            begin: concat(
              /[ ]+/,
              // necessary to prevent us gobbling up doctags like /* @author Bob Mcgill */
              "(",
              ENGLISH_WORD,
              /[.]?[:]?([.][ ]|[ ])/,
              "){3}"
            )
            // look for 3 words in a row
          }
        );
        return mode;
      };
      var C_LINE_COMMENT_MODE = COMMENT("//", "$");
      var C_BLOCK_COMMENT_MODE = COMMENT("/\\*", "\\*/");
      var HASH_COMMENT_MODE = COMMENT("#", "$");
      var NUMBER_MODE = {
        scope: "number",
        begin: NUMBER_RE,
        relevance: 0
      };
      var C_NUMBER_MODE = {
        scope: "number",
        begin: C_NUMBER_RE,
        relevance: 0
      };
      var BINARY_NUMBER_MODE = {
        scope: "number",
        begin: BINARY_NUMBER_RE,
        relevance: 0
      };
      var REGEXP_MODE = {
        scope: "regexp",
        begin: /\/(?=[^/\n]*\/)/,
        end: /\/[gimuy]*/,
        contains: [
          BACKSLASH_ESCAPE,
          {
            begin: /\[/,
            end: /\]/,
            relevance: 0,
            contains: [BACKSLASH_ESCAPE]
          }
        ]
      };
      var TITLE_MODE = {
        scope: "title",
        begin: IDENT_RE3,
        relevance: 0
      };
      var UNDERSCORE_TITLE_MODE = {
        scope: "title",
        begin: UNDERSCORE_IDENT_RE,
        relevance: 0
      };
      var METHOD_GUARD = {
        // excludes method names from keyword processing
        begin: "\\.\\s*" + UNDERSCORE_IDENT_RE,
        relevance: 0
      };
      var END_SAME_AS_BEGIN = function(mode) {
        return Object.assign(
          mode,
          {
            /** @type {ModeCallback} */
            "on:begin": (m, resp) => {
              resp.data._beginMatch = m[1];
            },
            /** @type {ModeCallback} */
            "on:end": (m, resp) => {
              if (resp.data._beginMatch !== m[1]) resp.ignoreMatch();
            }
          }
        );
      };
      var MODES2 = /* @__PURE__ */ Object.freeze({
        __proto__: null,
        APOS_STRING_MODE,
        BACKSLASH_ESCAPE,
        BINARY_NUMBER_MODE,
        BINARY_NUMBER_RE,
        COMMENT,
        C_BLOCK_COMMENT_MODE,
        C_LINE_COMMENT_MODE,
        C_NUMBER_MODE,
        C_NUMBER_RE,
        END_SAME_AS_BEGIN,
        HASH_COMMENT_MODE,
        IDENT_RE: IDENT_RE3,
        MATCH_NOTHING_RE,
        METHOD_GUARD,
        NUMBER_MODE,
        NUMBER_RE,
        PHRASAL_WORDS_MODE,
        QUOTE_STRING_MODE,
        REGEXP_MODE,
        RE_STARTERS_RE,
        SHEBANG,
        TITLE_MODE,
        UNDERSCORE_IDENT_RE,
        UNDERSCORE_TITLE_MODE
      });
      function skipIfHasPrecedingDot(match, response) {
        const before = match.input[match.index - 1];
        if (before === ".") {
          response.ignoreMatch();
        }
      }
      function scopeClassName(mode, _parent) {
        if (mode.className !== void 0) {
          mode.scope = mode.className;
          delete mode.className;
        }
      }
      function beginKeywords(mode, parent) {
        if (!parent) return;
        if (!mode.beginKeywords) return;
        mode.begin = "\\b(" + mode.beginKeywords.split(" ").join("|") + ")(?!\\.)(?=\\b|\\s)";
        mode.__beforeBegin = skipIfHasPrecedingDot;
        mode.keywords = mode.keywords || mode.beginKeywords;
        delete mode.beginKeywords;
        if (mode.relevance === void 0) mode.relevance = 0;
      }
      function compileIllegal(mode, _parent) {
        if (!Array.isArray(mode.illegal)) return;
        mode.illegal = either(...mode.illegal);
      }
      function compileMatch(mode, _parent) {
        if (!mode.match) return;
        if (mode.begin || mode.end) throw new Error("begin & end are not supported with match");
        mode.begin = mode.match;
        delete mode.match;
      }
      function compileRelevance(mode, _parent) {
        if (mode.relevance === void 0) mode.relevance = 1;
      }
      var beforeMatchExt = (mode, parent) => {
        if (!mode.beforeMatch) return;
        if (mode.starts) throw new Error("beforeMatch cannot be used with starts");
        const originalMode = Object.assign({}, mode);
        Object.keys(mode).forEach((key) => {
          delete mode[key];
        });
        mode.keywords = originalMode.keywords;
        mode.begin = concat(originalMode.beforeMatch, lookahead(originalMode.begin));
        mode.starts = {
          relevance: 0,
          contains: [
            Object.assign(originalMode, { endsParent: true })
          ]
        };
        mode.relevance = 0;
        delete originalMode.beforeMatch;
      };
      var COMMON_KEYWORDS = [
        "of",
        "and",
        "for",
        "in",
        "not",
        "or",
        "if",
        "then",
        "parent",
        // common variable name
        "list",
        // common variable name
        "value"
        // common variable name
      ];
      var DEFAULT_KEYWORD_SCOPE = "keyword";
      function compileKeywords(rawKeywords, caseInsensitive, scopeName = DEFAULT_KEYWORD_SCOPE) {
        const compiledKeywords = /* @__PURE__ */ Object.create(null);
        if (typeof rawKeywords === "string") {
          compileList(scopeName, rawKeywords.split(" "));
        } else if (Array.isArray(rawKeywords)) {
          compileList(scopeName, rawKeywords);
        } else {
          Object.keys(rawKeywords).forEach(function(scopeName2) {
            Object.assign(
              compiledKeywords,
              compileKeywords(rawKeywords[scopeName2], caseInsensitive, scopeName2)
            );
          });
        }
        return compiledKeywords;
        function compileList(scopeName2, keywordList) {
          if (caseInsensitive) {
            keywordList = keywordList.map((x) => x.toLowerCase());
          }
          keywordList.forEach(function(keyword) {
            const pair = keyword.split("|");
            compiledKeywords[pair[0]] = [scopeName2, scoreForKeyword(pair[0], pair[1])];
          });
        }
      }
      function scoreForKeyword(keyword, providedScore) {
        if (providedScore) {
          return Number(providedScore);
        }
        return commonKeyword(keyword) ? 0 : 1;
      }
      function commonKeyword(keyword) {
        return COMMON_KEYWORDS.includes(keyword.toLowerCase());
      }
      var seenDeprecations = {};
      var error = (message) => {
        console.error(message);
      };
      var warn = (message, ...args) => {
        console.log(`WARN: ${message}`, ...args);
      };
      var deprecated = (version3, message) => {
        if (seenDeprecations[`${version3}/${message}`]) return;
        console.log(`Deprecated as of ${version3}. ${message}`);
        seenDeprecations[`${version3}/${message}`] = true;
      };
      var MultiClassError = new Error();
      function remapScopeNames(mode, regexes, { key }) {
        let offset2 = 0;
        const scopeNames = mode[key];
        const emit = {};
        const positions = {};
        for (let i = 1; i <= regexes.length; i++) {
          positions[i + offset2] = scopeNames[i];
          emit[i + offset2] = true;
          offset2 += countMatchGroups(regexes[i - 1]);
        }
        mode[key] = positions;
        mode[key]._emit = emit;
        mode[key]._multi = true;
      }
      function beginMultiClass(mode) {
        if (!Array.isArray(mode.begin)) return;
        if (mode.skip || mode.excludeBegin || mode.returnBegin) {
          error("skip, excludeBegin, returnBegin not compatible with beginScope: {}");
          throw MultiClassError;
        }
        if (typeof mode.beginScope !== "object" || mode.beginScope === null) {
          error("beginScope must be object");
          throw MultiClassError;
        }
        remapScopeNames(mode, mode.begin, { key: "beginScope" });
        mode.begin = _rewriteBackreferences(mode.begin, { joinWith: "" });
      }
      function endMultiClass(mode) {
        if (!Array.isArray(mode.end)) return;
        if (mode.skip || mode.excludeEnd || mode.returnEnd) {
          error("skip, excludeEnd, returnEnd not compatible with endScope: {}");
          throw MultiClassError;
        }
        if (typeof mode.endScope !== "object" || mode.endScope === null) {
          error("endScope must be object");
          throw MultiClassError;
        }
        remapScopeNames(mode, mode.end, { key: "endScope" });
        mode.end = _rewriteBackreferences(mode.end, { joinWith: "" });
      }
      function scopeSugar(mode) {
        if (mode.scope && typeof mode.scope === "object" && mode.scope !== null) {
          mode.beginScope = mode.scope;
          delete mode.scope;
        }
      }
      function MultiClass(mode) {
        scopeSugar(mode);
        if (typeof mode.beginScope === "string") {
          mode.beginScope = { _wrap: mode.beginScope };
        }
        if (typeof mode.endScope === "string") {
          mode.endScope = { _wrap: mode.endScope };
        }
        beginMultiClass(mode);
        endMultiClass(mode);
      }
      function compileLanguage(language) {
        function langRe(value, global) {
          return new RegExp(
            source(value),
            "m" + (language.case_insensitive ? "i" : "") + (language.unicodeRegex ? "u" : "") + (global ? "g" : "")
          );
        }
        class MultiRegex {
          constructor() {
            this.matchIndexes = {};
            this.regexes = [];
            this.matchAt = 1;
            this.position = 0;
          }
          // @ts-ignore
          addRule(re, opts) {
            opts.position = this.position++;
            this.matchIndexes[this.matchAt] = opts;
            this.regexes.push([opts, re]);
            this.matchAt += countMatchGroups(re) + 1;
          }
          compile() {
            if (this.regexes.length === 0) {
              this.exec = () => null;
            }
            const terminators = this.regexes.map((el) => el[1]);
            this.matcherRe = langRe(_rewriteBackreferences(terminators, { joinWith: "|" }), true);
            this.lastIndex = 0;
          }
          /** @param {string} s */
          exec(s) {
            this.matcherRe.lastIndex = this.lastIndex;
            const match = this.matcherRe.exec(s);
            if (!match) {
              return null;
            }
            const i = match.findIndex((el, i2) => i2 > 0 && el !== void 0);
            const matchData = this.matchIndexes[i];
            match.splice(0, i);
            return Object.assign(match, matchData);
          }
        }
        class ResumableMultiRegex {
          constructor() {
            this.rules = [];
            this.multiRegexes = [];
            this.count = 0;
            this.lastIndex = 0;
            this.regexIndex = 0;
          }
          // @ts-ignore
          getMatcher(index) {
            if (this.multiRegexes[index]) return this.multiRegexes[index];
            const matcher = new MultiRegex();
            this.rules.slice(index).forEach(([re, opts]) => matcher.addRule(re, opts));
            matcher.compile();
            this.multiRegexes[index] = matcher;
            return matcher;
          }
          resumingScanAtSamePosition() {
            return this.regexIndex !== 0;
          }
          considerAll() {
            this.regexIndex = 0;
          }
          // @ts-ignore
          addRule(re, opts) {
            this.rules.push([re, opts]);
            if (opts.type === "begin") this.count++;
          }
          /** @param {string} s */
          exec(s) {
            const m = this.getMatcher(this.regexIndex);
            m.lastIndex = this.lastIndex;
            let result = m.exec(s);
            if (this.resumingScanAtSamePosition()) {
              if (result && result.index === this.lastIndex) ;
              else {
                const m2 = this.getMatcher(0);
                m2.lastIndex = this.lastIndex + 1;
                result = m2.exec(s);
              }
            }
            if (result) {
              this.regexIndex += result.position + 1;
              if (this.regexIndex === this.count) {
                this.considerAll();
              }
            }
            return result;
          }
        }
        function buildModeRegex(mode) {
          const mm = new ResumableMultiRegex();
          mode.contains.forEach((term) => mm.addRule(term.begin, { rule: term, type: "begin" }));
          if (mode.terminatorEnd) {
            mm.addRule(mode.terminatorEnd, { type: "end" });
          }
          if (mode.illegal) {
            mm.addRule(mode.illegal, { type: "illegal" });
          }
          return mm;
        }
        function compileMode(mode, parent) {
          const cmode = (
            /** @type CompiledMode */
            mode
          );
          if (mode.isCompiled) return cmode;
          [
            scopeClassName,
            // do this early so compiler extensions generally don't have to worry about
            // the distinction between match/begin
            compileMatch,
            MultiClass,
            beforeMatchExt
          ].forEach((ext) => ext(mode, parent));
          language.compilerExtensions.forEach((ext) => ext(mode, parent));
          mode.__beforeBegin = null;
          [
            beginKeywords,
            // do this later so compiler extensions that come earlier have access to the
            // raw array if they wanted to perhaps manipulate it, etc.
            compileIllegal,
            // default to 1 relevance if not specified
            compileRelevance
          ].forEach((ext) => ext(mode, parent));
          mode.isCompiled = true;
          let keywordPattern = null;
          if (typeof mode.keywords === "object" && mode.keywords.$pattern) {
            mode.keywords = Object.assign({}, mode.keywords);
            keywordPattern = mode.keywords.$pattern;
            delete mode.keywords.$pattern;
          }
          keywordPattern = keywordPattern || /\w+/;
          if (mode.keywords) {
            mode.keywords = compileKeywords(mode.keywords, language.case_insensitive);
          }
          cmode.keywordPatternRe = langRe(keywordPattern, true);
          if (parent) {
            if (!mode.begin) mode.begin = /\B|\b/;
            cmode.beginRe = langRe(cmode.begin);
            if (!mode.end && !mode.endsWithParent) mode.end = /\B|\b/;
            if (mode.end) cmode.endRe = langRe(cmode.end);
            cmode.terminatorEnd = source(cmode.end) || "";
            if (mode.endsWithParent && parent.terminatorEnd) {
              cmode.terminatorEnd += (mode.end ? "|" : "") + parent.terminatorEnd;
            }
          }
          if (mode.illegal) cmode.illegalRe = langRe(
            /** @type {RegExp | string} */
            mode.illegal
          );
          if (!mode.contains) mode.contains = [];
          mode.contains = [].concat(...mode.contains.map(function(c2) {
            return expandOrCloneMode(c2 === "self" ? mode : c2);
          }));
          mode.contains.forEach(function(c2) {
            compileMode(
              /** @type Mode */
              c2,
              cmode
            );
          });
          if (mode.starts) {
            compileMode(mode.starts, parent);
          }
          cmode.matcher = buildModeRegex(cmode);
          return cmode;
        }
        if (!language.compilerExtensions) language.compilerExtensions = [];
        if (language.contains && language.contains.includes("self")) {
          throw new Error("ERR: contains `self` is not supported at the top-level of a language.  See documentation.");
        }
        language.classNameAliases = inherit$1(language.classNameAliases || {});
        return compileMode(
          /** @type Mode */
          language
        );
      }
      function dependencyOnParent(mode) {
        if (!mode) return false;
        return mode.endsWithParent || dependencyOnParent(mode.starts);
      }
      function expandOrCloneMode(mode) {
        if (mode.variants && !mode.cachedVariants) {
          mode.cachedVariants = mode.variants.map(function(variant) {
            return inherit$1(mode, { variants: null }, variant);
          });
        }
        if (mode.cachedVariants) {
          return mode.cachedVariants;
        }
        if (dependencyOnParent(mode)) {
          return inherit$1(mode, { starts: mode.starts ? inherit$1(mode.starts) : null });
        }
        if (Object.isFrozen(mode)) {
          return inherit$1(mode);
        }
        return mode;
      }
      var version2 = "11.11.1";
      var HTMLInjectionError = class extends Error {
        constructor(reason, html2) {
          super(reason);
          this.name = "HTMLInjectionError";
          this.html = html2;
        }
      };
      var escape3 = escapeHTML;
      var inherit = inherit$1;
      var NO_MATCH = Symbol("nomatch");
      var MAX_KEYWORD_HITS = 7;
      var HLJS = function(hljs) {
        const languages = /* @__PURE__ */ Object.create(null);
        const aliases = /* @__PURE__ */ Object.create(null);
        const plugins = [];
        let SAFE_MODE = true;
        const LANGUAGE_NOT_FOUND = "Could not find the language '{}', did you forget to load/include a language module?";
        const PLAINTEXT_LANGUAGE = { disableAutodetect: true, name: "Plain text", contains: [] };
        let options2 = {
          ignoreUnescapedHTML: false,
          throwUnescapedHTML: false,
          noHighlightRe: /^(no-?highlight)$/i,
          languageDetectRe: /\blang(?:uage)?-([\w-]+)\b/i,
          classPrefix: "hljs-",
          cssSelector: "pre code",
          languages: null,
          // beta configuration options, subject to change, welcome to discuss
          // https://github.com/highlightjs/highlight.js/issues/1086
          __emitter: TokenTreeEmitter
        };
        function shouldNotHighlight(languageName) {
          return options2.noHighlightRe.test(languageName);
        }
        function blockLanguage(block2) {
          let classes = block2.className + " ";
          classes += block2.parentNode ? block2.parentNode.className : "";
          const match = options2.languageDetectRe.exec(classes);
          if (match) {
            const language = getLanguage(match[1]);
            if (!language) {
              warn(LANGUAGE_NOT_FOUND.replace("{}", match[1]));
              warn("Falling back to no-highlight mode for this block.", block2);
            }
            return language ? match[1] : "no-highlight";
          }
          return classes.split(/\s+/).find((_class) => shouldNotHighlight(_class) || getLanguage(_class));
        }
        function highlight2(codeOrLanguageName, optionsOrCode, ignoreIllegals) {
          let code = "";
          let languageName = "";
          if (typeof optionsOrCode === "object") {
            code = codeOrLanguageName;
            ignoreIllegals = optionsOrCode.ignoreIllegals;
            languageName = optionsOrCode.language;
          } else {
            deprecated("10.7.0", "highlight(lang, code, ...args) has been deprecated.");
            deprecated("10.7.0", "Please use highlight(code, options) instead.\nhttps://github.com/highlightjs/highlight.js/issues/2277");
            languageName = codeOrLanguageName;
            code = optionsOrCode;
          }
          if (ignoreIllegals === void 0) {
            ignoreIllegals = true;
          }
          const context = {
            code,
            language: languageName
          };
          fire("before:highlight", context);
          const result = context.result ? context.result : _highlight(context.language, context.code, ignoreIllegals);
          result.code = context.code;
          fire("after:highlight", result);
          return result;
        }
        function _highlight(languageName, codeToHighlight, ignoreIllegals, continuation) {
          const keywordHits = /* @__PURE__ */ Object.create(null);
          function keywordData(mode, matchText) {
            return mode.keywords[matchText];
          }
          function processKeywords() {
            if (!top.keywords) {
              emitter.addText(modeBuffer);
              return;
            }
            let lastIndex = 0;
            top.keywordPatternRe.lastIndex = 0;
            let match = top.keywordPatternRe.exec(modeBuffer);
            let buf = "";
            while (match) {
              buf += modeBuffer.substring(lastIndex, match.index);
              const word = language.case_insensitive ? match[0].toLowerCase() : match[0];
              const data = keywordData(top, word);
              if (data) {
                const [kind, keywordRelevance] = data;
                emitter.addText(buf);
                buf = "";
                keywordHits[word] = (keywordHits[word] || 0) + 1;
                if (keywordHits[word] <= MAX_KEYWORD_HITS) relevance += keywordRelevance;
                if (kind.startsWith("_")) {
                  buf += match[0];
                } else {
                  const cssClass = language.classNameAliases[kind] || kind;
                  emitKeyword(match[0], cssClass);
                }
              } else {
                buf += match[0];
              }
              lastIndex = top.keywordPatternRe.lastIndex;
              match = top.keywordPatternRe.exec(modeBuffer);
            }
            buf += modeBuffer.substring(lastIndex);
            emitter.addText(buf);
          }
          function processSubLanguage() {
            if (modeBuffer === "") return;
            let result2 = null;
            if (typeof top.subLanguage === "string") {
              if (!languages[top.subLanguage]) {
                emitter.addText(modeBuffer);
                return;
              }
              result2 = _highlight(top.subLanguage, modeBuffer, true, continuations[top.subLanguage]);
              continuations[top.subLanguage] = /** @type {CompiledMode} */
              result2._top;
            } else {
              result2 = highlightAuto(modeBuffer, top.subLanguage.length ? top.subLanguage : null);
            }
            if (top.relevance > 0) {
              relevance += result2.relevance;
            }
            emitter.__addSublanguage(result2._emitter, result2.language);
          }
          function processBuffer() {
            if (top.subLanguage != null) {
              processSubLanguage();
            } else {
              processKeywords();
            }
            modeBuffer = "";
          }
          function emitKeyword(keyword, scope) {
            if (keyword === "") return;
            emitter.startScope(scope);
            emitter.addText(keyword);
            emitter.endScope();
          }
          function emitMultiClass(scope, match) {
            let i = 1;
            const max = match.length - 1;
            while (i <= max) {
              if (!scope._emit[i]) {
                i++;
                continue;
              }
              const klass = language.classNameAliases[scope[i]] || scope[i];
              const text2 = match[i];
              if (klass) {
                emitKeyword(text2, klass);
              } else {
                modeBuffer = text2;
                processKeywords();
                modeBuffer = "";
              }
              i++;
            }
          }
          function startNewMode(mode, match) {
            if (mode.scope && typeof mode.scope === "string") {
              emitter.openNode(language.classNameAliases[mode.scope] || mode.scope);
            }
            if (mode.beginScope) {
              if (mode.beginScope._wrap) {
                emitKeyword(modeBuffer, language.classNameAliases[mode.beginScope._wrap] || mode.beginScope._wrap);
                modeBuffer = "";
              } else if (mode.beginScope._multi) {
                emitMultiClass(mode.beginScope, match);
                modeBuffer = "";
              }
            }
            top = Object.create(mode, { parent: { value: top } });
            return top;
          }
          function endOfMode(mode, match, matchPlusRemainder) {
            let matched = startsWith(mode.endRe, matchPlusRemainder);
            if (matched) {
              if (mode["on:end"]) {
                const resp = new Response(mode);
                mode["on:end"](match, resp);
                if (resp.isMatchIgnored) matched = false;
              }
              if (matched) {
                while (mode.endsParent && mode.parent) {
                  mode = mode.parent;
                }
                return mode;
              }
            }
            if (mode.endsWithParent) {
              return endOfMode(mode.parent, match, matchPlusRemainder);
            }
          }
          function doIgnore(lexeme) {
            if (top.matcher.regexIndex === 0) {
              modeBuffer += lexeme[0];
              return 1;
            } else {
              resumeScanAtSamePosition = true;
              return 0;
            }
          }
          function doBeginMatch(match) {
            const lexeme = match[0];
            const newMode = match.rule;
            const resp = new Response(newMode);
            const beforeCallbacks = [newMode.__beforeBegin, newMode["on:begin"]];
            for (const cb of beforeCallbacks) {
              if (!cb) continue;
              cb(match, resp);
              if (resp.isMatchIgnored) return doIgnore(lexeme);
            }
            if (newMode.skip) {
              modeBuffer += lexeme;
            } else {
              if (newMode.excludeBegin) {
                modeBuffer += lexeme;
              }
              processBuffer();
              if (!newMode.returnBegin && !newMode.excludeBegin) {
                modeBuffer = lexeme;
              }
            }
            startNewMode(newMode, match);
            return newMode.returnBegin ? 0 : lexeme.length;
          }
          function doEndMatch(match) {
            const lexeme = match[0];
            const matchPlusRemainder = codeToHighlight.substring(match.index);
            const endMode = endOfMode(top, match, matchPlusRemainder);
            if (!endMode) {
              return NO_MATCH;
            }
            const origin = top;
            if (top.endScope && top.endScope._wrap) {
              processBuffer();
              emitKeyword(lexeme, top.endScope._wrap);
            } else if (top.endScope && top.endScope._multi) {
              processBuffer();
              emitMultiClass(top.endScope, match);
            } else if (origin.skip) {
              modeBuffer += lexeme;
            } else {
              if (!(origin.returnEnd || origin.excludeEnd)) {
                modeBuffer += lexeme;
              }
              processBuffer();
              if (origin.excludeEnd) {
                modeBuffer = lexeme;
              }
            }
            do {
              if (top.scope) {
                emitter.closeNode();
              }
              if (!top.skip && !top.subLanguage) {
                relevance += top.relevance;
              }
              top = top.parent;
            } while (top !== endMode.parent);
            if (endMode.starts) {
              startNewMode(endMode.starts, match);
            }
            return origin.returnEnd ? 0 : lexeme.length;
          }
          function processContinuations() {
            const list2 = [];
            for (let current = top; current !== language; current = current.parent) {
              if (current.scope) {
                list2.unshift(current.scope);
              }
            }
            list2.forEach((item) => emitter.openNode(item));
          }
          let lastMatch = {};
          function processLexeme(textBeforeMatch, match) {
            const lexeme = match && match[0];
            modeBuffer += textBeforeMatch;
            if (lexeme == null) {
              processBuffer();
              return 0;
            }
            if (lastMatch.type === "begin" && match.type === "end" && lastMatch.index === match.index && lexeme === "") {
              modeBuffer += codeToHighlight.slice(match.index, match.index + 1);
              if (!SAFE_MODE) {
                const err = new Error(`0 width match regex (${languageName})`);
                err.languageName = languageName;
                err.badRule = lastMatch.rule;
                throw err;
              }
              return 1;
            }
            lastMatch = match;
            if (match.type === "begin") {
              return doBeginMatch(match);
            } else if (match.type === "illegal" && !ignoreIllegals) {
              const err = new Error('Illegal lexeme "' + lexeme + '" for mode "' + (top.scope || "<unnamed>") + '"');
              err.mode = top;
              throw err;
            } else if (match.type === "end") {
              const processed = doEndMatch(match);
              if (processed !== NO_MATCH) {
                return processed;
              }
            }
            if (match.type === "illegal" && lexeme === "") {
              modeBuffer += "\n";
              return 1;
            }
            if (iterations > 1e5 && iterations > match.index * 3) {
              const err = new Error("potential infinite loop, way more iterations than matches");
              throw err;
            }
            modeBuffer += lexeme;
            return lexeme.length;
          }
          const language = getLanguage(languageName);
          if (!language) {
            error(LANGUAGE_NOT_FOUND.replace("{}", languageName));
            throw new Error('Unknown language: "' + languageName + '"');
          }
          const md = compileLanguage(language);
          let result = "";
          let top = continuation || md;
          const continuations = {};
          const emitter = new options2.__emitter(options2);
          processContinuations();
          let modeBuffer = "";
          let relevance = 0;
          let index = 0;
          let iterations = 0;
          let resumeScanAtSamePosition = false;
          try {
            if (!language.__emitTokens) {
              top.matcher.considerAll();
              for (; ; ) {
                iterations++;
                if (resumeScanAtSamePosition) {
                  resumeScanAtSamePosition = false;
                } else {
                  top.matcher.considerAll();
                }
                top.matcher.lastIndex = index;
                const match = top.matcher.exec(codeToHighlight);
                if (!match) break;
                const beforeMatch = codeToHighlight.substring(index, match.index);
                const processedCount = processLexeme(beforeMatch, match);
                index = match.index + processedCount;
              }
              processLexeme(codeToHighlight.substring(index));
            } else {
              language.__emitTokens(codeToHighlight, emitter);
            }
            emitter.finalize();
            result = emitter.toHTML();
            return {
              language: languageName,
              value: result,
              relevance,
              illegal: false,
              _emitter: emitter,
              _top: top
            };
          } catch (err) {
            if (err.message && err.message.includes("Illegal")) {
              return {
                language: languageName,
                value: escape3(codeToHighlight),
                illegal: true,
                relevance: 0,
                _illegalBy: {
                  message: err.message,
                  index,
                  context: codeToHighlight.slice(index - 100, index + 100),
                  mode: err.mode,
                  resultSoFar: result
                },
                _emitter: emitter
              };
            } else if (SAFE_MODE) {
              return {
                language: languageName,
                value: escape3(codeToHighlight),
                illegal: false,
                relevance: 0,
                errorRaised: err,
                _emitter: emitter,
                _top: top
              };
            } else {
              throw err;
            }
          }
        }
        function justTextHighlightResult(code) {
          const result = {
            value: escape3(code),
            illegal: false,
            relevance: 0,
            _top: PLAINTEXT_LANGUAGE,
            _emitter: new options2.__emitter(options2)
          };
          result._emitter.addText(code);
          return result;
        }
        function highlightAuto(code, languageSubset) {
          languageSubset = languageSubset || options2.languages || Object.keys(languages);
          const plaintext = justTextHighlightResult(code);
          const results = languageSubset.filter(getLanguage).filter(autoDetection).map(
            (name) => _highlight(name, code, false)
          );
          results.unshift(plaintext);
          const sorted = results.sort((a, b) => {
            if (a.relevance !== b.relevance) return b.relevance - a.relevance;
            if (a.language && b.language) {
              if (getLanguage(a.language).supersetOf === b.language) {
                return 1;
              } else if (getLanguage(b.language).supersetOf === a.language) {
                return -1;
              }
            }
            return 0;
          });
          const [best, secondBest] = sorted;
          const result = best;
          result.secondBest = secondBest;
          return result;
        }
        function updateClassName(element, currentLang, resultLang) {
          const language = currentLang && aliases[currentLang] || resultLang;
          element.classList.add("hljs");
          element.classList.add(`language-${language}`);
        }
        function highlightElement(element) {
          let node = null;
          const language = blockLanguage(element);
          if (shouldNotHighlight(language)) return;
          fire(
            "before:highlightElement",
            { el: element, language }
          );
          if (element.dataset.highlighted) {
            console.log("Element previously highlighted. To highlight again, first unset `dataset.highlighted`.", element);
            return;
          }
          if (element.children.length > 0) {
            if (!options2.ignoreUnescapedHTML) {
              console.warn("One of your code blocks includes unescaped HTML. This is a potentially serious security risk.");
              console.warn("https://github.com/highlightjs/highlight.js/wiki/security");
              console.warn("The element with unescaped HTML:");
              console.warn(element);
            }
            if (options2.throwUnescapedHTML) {
              const err = new HTMLInjectionError(
                "One of your code blocks includes unescaped HTML.",
                element.innerHTML
              );
              throw err;
            }
          }
          node = element;
          const text2 = node.textContent;
          const result = language ? highlight2(text2, { language, ignoreIllegals: true }) : highlightAuto(text2);
          element.innerHTML = result.value;
          element.dataset.highlighted = "yes";
          updateClassName(element, language, result.language);
          element.result = {
            language: result.language,
            // TODO: remove with version 11.0
            re: result.relevance,
            relevance: result.relevance
          };
          if (result.secondBest) {
            element.secondBest = {
              language: result.secondBest.language,
              relevance: result.secondBest.relevance
            };
          }
          fire("after:highlightElement", { el: element, result, text: text2 });
        }
        function configure(userOptions) {
          options2 = inherit(options2, userOptions);
        }
        const initHighlighting = () => {
          highlightAll();
          deprecated("10.6.0", "initHighlighting() deprecated.  Use highlightAll() now.");
        };
        function initHighlightingOnLoad() {
          highlightAll();
          deprecated("10.6.0", "initHighlightingOnLoad() deprecated.  Use highlightAll() now.");
        }
        let wantsHighlight = false;
        function highlightAll() {
          function boot2() {
            highlightAll();
          }
          if (document.readyState === "loading") {
            if (!wantsHighlight) {
              window.addEventListener("DOMContentLoaded", boot2, false);
            }
            wantsHighlight = true;
            return;
          }
          const blocks = document.querySelectorAll(options2.cssSelector);
          blocks.forEach(highlightElement);
        }
        function registerLanguage(languageName, languageDefinition) {
          let lang = null;
          try {
            lang = languageDefinition(hljs);
          } catch (error$1) {
            error("Language definition for '{}' could not be registered.".replace("{}", languageName));
            if (!SAFE_MODE) {
              throw error$1;
            } else {
              error(error$1);
            }
            lang = PLAINTEXT_LANGUAGE;
          }
          if (!lang.name) lang.name = languageName;
          languages[languageName] = lang;
          lang.rawDefinition = languageDefinition.bind(null, hljs);
          if (lang.aliases) {
            registerAliases(lang.aliases, { languageName });
          }
        }
        function unregisterLanguage(languageName) {
          delete languages[languageName];
          for (const alias of Object.keys(aliases)) {
            if (aliases[alias] === languageName) {
              delete aliases[alias];
            }
          }
        }
        function listLanguages() {
          return Object.keys(languages);
        }
        function getLanguage(name) {
          name = (name || "").toLowerCase();
          return languages[name] || languages[aliases[name]];
        }
        function registerAliases(aliasList, { languageName }) {
          if (typeof aliasList === "string") {
            aliasList = [aliasList];
          }
          aliasList.forEach((alias) => {
            aliases[alias.toLowerCase()] = languageName;
          });
        }
        function autoDetection(name) {
          const lang = getLanguage(name);
          return lang && !lang.disableAutodetect;
        }
        function upgradePluginAPI(plugin) {
          if (plugin["before:highlightBlock"] && !plugin["before:highlightElement"]) {
            plugin["before:highlightElement"] = (data) => {
              plugin["before:highlightBlock"](
                Object.assign({ block: data.el }, data)
              );
            };
          }
          if (plugin["after:highlightBlock"] && !plugin["after:highlightElement"]) {
            plugin["after:highlightElement"] = (data) => {
              plugin["after:highlightBlock"](
                Object.assign({ block: data.el }, data)
              );
            };
          }
        }
        function addPlugin(plugin) {
          upgradePluginAPI(plugin);
          plugins.push(plugin);
        }
        function removePlugin(plugin) {
          const index = plugins.indexOf(plugin);
          if (index !== -1) {
            plugins.splice(index, 1);
          }
        }
        function fire(event, args) {
          const cb = event;
          plugins.forEach(function(plugin) {
            if (plugin[cb]) {
              plugin[cb](args);
            }
          });
        }
        function deprecateHighlightBlock(el) {
          deprecated("10.7.0", "highlightBlock will be removed entirely in v12.0");
          deprecated("10.7.0", "Please use highlightElement now.");
          return highlightElement(el);
        }
        Object.assign(hljs, {
          highlight: highlight2,
          highlightAuto,
          highlightAll,
          highlightElement,
          // TODO: Remove with v12 API
          highlightBlock: deprecateHighlightBlock,
          configure,
          initHighlighting,
          initHighlightingOnLoad,
          registerLanguage,
          unregisterLanguage,
          listLanguages,
          getLanguage,
          registerAliases,
          autoDetection,
          inherit,
          addPlugin,
          removePlugin
        });
        hljs.debugMode = function() {
          SAFE_MODE = false;
        };
        hljs.safeMode = function() {
          SAFE_MODE = true;
        };
        hljs.versionString = version2;
        hljs.regex = {
          concat,
          lookahead,
          either,
          optional,
          anyNumberOfTimes
        };
        for (const key in MODES2) {
          if (typeof MODES2[key] === "object") {
            deepFreeze(MODES2[key]);
          }
        }
        Object.assign(hljs, MODES2);
        return hljs;
      };
      var highlight = HLJS({});
      highlight.newInstance = () => HLJS({});
      module.exports = highlight;
      highlight.HighlightJS = highlight;
      highlight.default = highlight;
    }
  });

  // src/platforms/base.js
  function queryFirst(selectorList, root3 = document) {
    for (const sel of selectorList) {
      try {
        const el = root3.querySelector(sel);
        if (el) return el;
      } catch (_) {
      }
    }
    return null;
  }
  function queryAll(selectorList, root3 = document) {
    for (const sel of selectorList) {
      try {
        const els = root3.querySelectorAll(sel);
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
  function turns(root3) {
    const merged = [...root3.querySelectorAll("user-query, model-response")];
    if (merged.length) return merged;
    return [...root3.querySelectorAll('[class*="conversation-turn"]')];
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
    // Gemini's Material tooltips appear BELOW the button and use regular-weight
    // text (its own copy/like buttons behave the same). Match that so our
    // tooltip doesn't look out of place next to Gemini's. (ChatGPT also shows
    // below but uses semibold — see the default in ui.js.)
    tooltipStyle: {
      position: "below",
      fontWeight: "400",
      fontFamily: '"Google Sans",Roboto,-apple-system-body,ui-sans-serif,system-ui,"Segoe UI",Helvetica,Arial,sans-serif'
    },
    getMessageElements() {
      return turns(document);
    },
    getRole(el) {
      return roleOf(el);
    },
    getMessages() {
      return turns(document).map((turn) => ({ role: roleOf(turn), el: contentOf2(turn) }));
    },
    /**
     * Gemini renders its own action toolbar under each message:
     *   - model responses: <div class="actions-container-v2">
     *       <div class="buttons-container-v2">
     *         <thumb-up-button>…</thumb-up-button>
     *         <thumb-down-button>…</thumb-down-button>
     *         <copy-button><gem-icon-button data-test-id="copy-button">…</copy-button>
     *         <div> (more menu: copy-image, more-options) </div>
     *       </div>
     *     </div>
     *   - user prompts: <div class="luminous-actions-container">
     *       <gem-icon-button data-test-id="prompt-copy-button">…
     * The injected "copy to OneNote" buttons go INTO buttons-container-v2 /
     * luminous-actions-container so they sit beside Gemini's own buttons.
     * `content` resolves to the .query-text / .markdown node of the enclosing
     * turn (matches what getMessages() returns, so copyTurn's findTurnIndex works).
     */
    getNativeToolbars() {
      const out = [];
      const modelCopyBtns = queryAll(['[data-test-id="copy-button"]']);
      for (const btn of modelCopyBtns) {
        const row = btn.closest(".buttons-container-v2") || btn.closest(".actions-container-v2") || btn.parentElement;
        const turn = btn.closest("model-response");
        const content = turn ? contentOf2(turn) : null;
        const anchor = btn.closest("copy-button") || btn;
        if (row && content) out.push({ toolbar: row, content, role: "assistant", insertAfter: anchor });
      }
      const promptCopyBtns = queryAll(['[data-test-id="prompt-copy-button"]']);
      for (const btn of promptCopyBtns) {
        const row = btn.closest(".luminous-actions-container") || btn.parentElement?.parentElement || btn.parentElement;
        const turn = btn.closest("user-query");
        const content = turn ? contentOf2(turn) : null;
        if (row && content) out.push({ toolbar: row, content, role: "user" });
      }
      return out;
    },
    /**
     * Build a button that matches Gemini's native action-button markup so the
     * injected buttons blend into the toolbar. Gemini wraps each icon button in
     * an Angular <gem-icon-button> custom element:
     *   <gem-icon-button ... class="gem-button gem-button-type-on-surface ...">
     *     <button class="mdc-icon-button mat-mdc-icon-button ...">
     *       <mat-icon class="...lumi-symbols...">icon_name</mat-icon>
     *     </button>
     *   </gem-icon-button>
     * We clone an existing <gem-icon-button> from the toolbar (preserving all
     * the Material classes), then replace its <mat-icon> ligature with our
     * heroicons SVG. Cloning is what makes the result pixel-match Gemini's own
     * buttons; hard-coding the classes would break every Gemini UI refresh.
     */
    makeNativeButton(toolbar, title, double) {
      const template = toolbar.querySelector(
        "gem-icon-button:not([gemmenutrigger])"
      ) || toolbar.querySelector("gem-icon-button");
      if (template) {
        const clone = template.cloneNode(true);
        clone.removeAttribute("arialabel");
        clone.removeAttribute("gemtooltip");
        clone.removeAttribute("data-test-id");
        const matIcon = clone.querySelector("mat-icon");
        if (matIcon) {
          let iconSize = "20px";
          try {
            const fs = getComputedStyle(matIcon).fontSize;
            if (fs) iconSize = fs;
          } catch (_) {
          }
          const iconBox = document.createElement("span");
          iconBox.className = "aicopy-gem-icon";
          iconBox.style.cssText = `display:inline-flex;align-items:center;justify-content:center;width:${iconSize};height:${iconSize};line-height:1`;
          const svgAttrs2 = `xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:${iconSize};height:${iconSize};display:block"`;
          const single = "M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184";
          const doc = "M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 0 0-9-9Z";
          const d = double ? doc : single;
          iconBox.innerHTML = `<svg ${svgAttrs2}><path d="${d}"/></svg>`;
          matIcon.replaceWith(iconBox);
          const innerBtn = clone.querySelector("button");
          if (innerBtn) innerBtn.setAttribute("aria-label", title);
          clone.setAttribute("arialabel", title);
          clone.setAttribute("gemtooltip", title);
          return clone;
        }
      }
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mdc-icon-button mat-mdc-icon-button mat-mdc-button-base";
      btn.setAttribute("aria-label", title);
      const svgAttrs = 'xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
      btn.innerHTML = `<svg ${svgAttrs}><path d="${double ? "M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25" : "M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"}"/></svg>`;
      return btn;
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
  var COPY_ICON_PATH = /^M6\.14929 4\.02032/;
  function turns3() {
    return queryAll([".ds-message"]);
  }
  function roleOf2(msg) {
    if (msg.querySelector(".ds-assistant-message-main-content")) return "assistant";
    if (msg.querySelector(".ds-collapsible-text")) return "user";
    return msg.querySelector(".ds-markdown") ? "assistant" : "user";
  }
  function contentOf3(msg) {
    return msg.querySelector(".ds-markdown.ds-assistant-message-main-content") || msg.querySelector(".ds-markdown") || msg.querySelector(".ds-collapsible-text") || msg;
  }
  function actionBarOf(msg) {
    const wrap = msg.parentElement;
    if (!wrap) return null;
    const btns = [...wrap.querySelectorAll('[role="button"].ds-button, button.ds-button')].filter((b) => !msg.contains(b));
    if (!btns.length) return null;
    const bar = btns[0].closest(".ds-flex") || btns[0].parentElement;
    const copyBtn = btns.find((b) => {
      const d = b.querySelector("svg path")?.getAttribute("d") || "";
      return COPY_ICON_PATH.test(d);
    }) || btns[0];
    return { bar, copyBtn };
  }
  var deepseek_default = {
    host: ["chat.deepseek.com"],
    name: "DeepSeek",
    getMessageElements() {
      return turns3();
    },
    getRole(el) {
      return roleOf2(el);
    },
    getMessages() {
      return turns3().map((msg) => ({ role: roleOf2(msg), el: contentOf3(msg) }));
    },
    /**
     * DeepSeek renders a native action bar under each turn:
     *   - assistant: [copy] [regenerate] [like] [dislike] [share] [more]
     *   - user:      [copy] [edit]
     * Our buttons go INTO that bar, right after the native copy button (both
     * roles), so they sit beside the site's own 复制 on the same row.
     */
    getNativeToolbars() {
      const out = [];
      for (const msg of turns3()) {
        const bar = actionBarOf(msg);
        if (!bar) continue;
        out.push({
          toolbar: bar.bar,
          content: contentOf3(msg),
          role: roleOf2(msg),
          insertAfter: bar.copyBtn
        });
      }
      return out;
    },
    /**
     * Build a button that matches DeepSeek's native action-button markup so the
     * injected buttons blend into the bar. DeepSeek wraps each icon button as:
     *   <div role="button" class="ds-button ds-button--iconLabelTertiary
     *        ds-button--icon ds-button--capsule ds-button--xs …" tabindex="0">
     *     <div class="ds-button__background"></div>
     *     <div class="ds-button__icon ds-button__icon--last-child">
     *       <div class="ds-cross-fade"><div class="ds-icon" style="font-size:inherit">
     *         <svg width="16" height="16" …/>
     *       </div></div>
     *     </div>
     *   </div>
     * We clone an existing .ds-button from THIS toolbar (preserving all ds-*
     * classes so hover/focus styling matches) and swap its <svg> for our
     * heroicons clipboard, sized to DeepSeek's 16px icons.
     */
    makeNativeButton(toolbar, title, double) {
      const template = toolbar.querySelector('[role="button"].ds-button, button.ds-button');
      if (template) {
        const clone = template.cloneNode(true);
        clone.removeAttribute("aria-label");
        clone.removeAttribute("id");
        clone.removeAttribute("data-testid");
        const iconHost = clone.querySelector(".ds-icon") || clone;
        const svgAttrs = 'xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
        const single = "M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184";
        const doc = "M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 0 0-9-9Z";
        iconHost.innerHTML = `<svg ${svgAttrs}><path d="${double ? doc : single}"/></svg>`;
        clone.setAttribute("aria-label", title);
        return clone;
      }
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ds-button";
      btn.setAttribute("aria-label", title);
      btn.textContent = title;
      return btn;
    }
  };

  // src/platforms/kimi.js
  function root() {
    return queryFirst(['[class*="chat"]', "main", "body"]);
  }
  function allTurns() {
    return queryAll(['[class*="bubble"]', '[class*="message-item"]', '[class*="row"]'], root());
  }
  var kimi_default = {
    host: ["kimi.moonshot.cn"],
    name: "Kimi",
    getMessageElements() {
      return allTurns();
    },
    getRole(el) {
      const hint = el.className || "";
      if (/user|self|query/i.test(hint)) return "user";
      return "assistant";
    },
    getMessages() {
      return allTurns().map((el) => {
        const role = this.getRole(el);
        const content = el.querySelector(".markdown") || el.querySelector('[class*="markdown"]') || el;
        return { role, el: content };
      });
    }
  };

  // src/platforms/doubao.js
  function root2() {
    return queryFirst(['[class*="chat"]', "main", "body"]);
  }
  function allTurns2() {
    return queryAll(
      ['[class*="message-item"]', '[class*="bubble"]', '[class*="receive"]', '[class*="row"]'],
      root2()
    );
  }
  var doubao_default = {
    host: ["www.doubao.com", "doubao.com"],
    name: "\u8C46\u5305",
    getMessageElements() {
      return allTurns2();
    },
    getRole(el) {
      const hint = el.className || "";
      if (/user|self|send/i.test(hint)) return "user";
      return "assistant";
    },
    getMessages() {
      return allTurns2().map((el) => {
        const role = this.getRole(el);
        const content = el.querySelector('[class*="markdown"]') || el.querySelector('[class*="content"]') || el;
        return { role, el: content };
      });
    }
  };

  // src/i18n.js
  var _locale = null;
  function getLocale() {
    if (_locale) return _locale;
    if (typeof navigator !== "undefined") {
      const lang = (navigator.language || navigator.userLanguage || "").toLowerCase();
      if (lang.startsWith("zh")) return _locale = "zh";
    }
    return _locale = "en";
  }
  var STRINGS = {
    // Toast shown after copying the whole conversation. {n} → message count.
    toastConversation: {
      zh: "\u2713 \u5DF2\u590D\u5236 {n} \u6761\u6D88\u606F\uFF0C\u53EF\u7C98\u8D34\u5230 OneNote",
      en: "\u2713 Copied {n} messages \u2014 paste into OneNote"
    },
    // Toast shown after copying a single message.
    toastOne: {
      zh: "\u2713 \u5DF2\u590D\u5236\u8BE5\u6D88\u606F",
      en: "\u2713 Message copied"
    },
    // Toast shown after copying one turn (question + its answers).
    toastTurn: {
      zh: "\u2713 \u5DF2\u590D\u5236\u672C\u8F6E\u5BF9\u8BDD",
      en: "\u2713 Turn copied"
    },
    // Toast shown when a copy fails. {err} → the error message.
    toastFail: {
      zh: "\u2717 \u590D\u5236\u5931\u8D25\uFF1A{err}",
      en: "\u2717 Copy failed: {err}"
    },
    // Title for the single-message copy button.
    btnCopyOne: {
      zh: "\u590D\u5236\u672C\u6761\u5230 OneNote",
      en: "Copy this message to OneNote"
    },
    // Title for the copy-turn button (clipboard-document icon).
    btnCopyTurn: {
      zh: "\u590D\u5236\u672C\u8F6E\u5230 OneNote",
      en: "Copy this turn to OneNote"
    },
    // Floating action button tooltip. The "(drag to move)" hint.
    fabTitle: {
      zh: "\u590D\u5236\u6574\u6BB5\u5BF9\u8BDD\u5230 OneNote\uFF08\u62D6\u52A8\u53EF\u79FB\u52A8\u4F4D\u7F6E\uFF09",
      en: "Copy whole conversation to OneNote (drag to move)"
    },
    // Overlay (fallback) single-message button label.
    overlayOne: {
      zh: "\u{1F4CB} \u672C\u6761",
      en: "\u{1F4CB} This"
    },
    // Overlay (fallback) copy-turn button label.
    overlayTurn: {
      zh: "\u{1F4CB} \u672C\u8F6E",
      en: "\u{1F4CB} Turn"
    },
    // Role-badge labels prepended to each pasted message.
    badgeUser: {
      zh: "\u{1F9D1} \u7528\u6237",
      en: "\u{1F9D1} You"
    },
    badgeAssistant: {
      zh: "\u{1F916} AI",
      en: "\u{1F916} AI"
    },
    // Image-placeholder tag. {n} → image number, {alt} → short caption (may be empty).
    imageTag: {
      zh: "\u56FE\u7247 {n}\uFF1A{alt}",
      en: "Image {n}: {alt}"
    },
    // Image-placeholder tag when there is no caption.
    imageTagNoAlt: {
      zh: "\u56FE\u7247 {n}",
      en: "Image {n}"
    },
    // Toast shown when no messages were found to copy.
    toastNoMessages: {
      zh: "\u672A\u68C0\u6D4B\u5230\u5BF9\u8BDD\u6D88\u606F",
      en: "No conversation messages found"
    },
    // Error thrown when a per-message button can't map its element to a turn.
    errNotFound: {
      zh: "\u672A\u627E\u5230\u8BE5\u6D88\u606F",
      en: "Message not found"
    },
    // Settings (gear) button tooltip.
    settingsTitle: {
      zh: "\u8BBE\u7F6E",
      en: "Settings"
    },
    // Prompt asking the user for the code-block monospace font.
    // {default} → the current fallback font name (kept for future use).
    settingsCodeFontPrompt: {
      zh: "\u8BF7\u8F93\u5165\u4EE3\u7801\u5757\u7B49\u5BBD\u5B57\u4F53\u540D\uFF08\u7559\u7A7A\u6062\u590D\u9ED8\u8BA4 Consolas\uFF09\uFF1A",
      en: "Enter the monospace font for code blocks (leave empty for default Consolas):"
    },
    // Toast after saving a custom code font. {font} → the font name the user typed.
    settingsCodeFontSaved: {
      zh: "\u2713 \u4EE3\u7801\u5B57\u4F53\u5DF2\u4FDD\u5B58\uFF1A{font}",
      en: "\u2713 Code font saved: {font}"
    },
    // Toast after clearing the custom font back to the default.
    settingsCodeFontReset: {
      zh: "\u2713 \u4EE3\u7801\u5B57\u4F53\u5DF2\u6062\u590D\u9ED8\u8BA4",
      en: "\u2713 Code font reset to default"
    },
    // Logo-swap button tooltip (next to the gear on the FAB).
    settingsLogoTitle: {
      zh: "\u5207\u6362\u7AD9\u70B9 Logo\uFF08Kimi / DeepSeek\uFF09",
      en: "Swap site logo (Kimi / DeepSeek)"
    },
    // Prompt asking which brand the top-left site logo should become.
    settingsLogoPrompt: {
      zh: "\u5207\u6362\u5DE6\u4E0A\u89D2\u7AD9\u70B9 Logo \u2014\u2014 \u8F93\u5165 kimi \u6216 deepseek\uFF08\u7559\u7A7A\u6062\u590D\u9ED8\u8BA4\uFF09\uFF1A",
      en: "Swap the top-left site logo \u2014 enter kimi or deepseek (leave empty to restore default):"
    },
    // Toast after switching the site logo. {name} → the chosen brand name.
    settingsLogoSaved: {
      zh: "\u2713 Logo \u5DF2\u5207\u6362\u4E3A {name}",
      en: "\u2713 Logo switched to {name}"
    },
    // Toast after clearing the logo back to the site's own.
    settingsLogoReset: {
      zh: "\u2713 Logo \u5DF2\u6062\u590D\u9ED8\u8BA4",
      en: "\u2713 Logo restored to default"
    },
    // Toast when the prompt input is not one of the known brands.
    settingsLogoInvalid: {
      zh: "\u2717 \u65E0\u6CD5\u8BC6\u522B\u7684 Logo\uFF0C\u53EF\u9009\uFF1Akimi\u3001deepseek",
      en: "\u2717 Unknown logo \u2014 choose kimi or deepseek"
    }
  };
  function t(key, vars) {
    const entry = STRINGS[key];
    if (!entry) return key;
    const locale = getLocale();
    let s = entry[locale] != null ? entry[locale] : entry.en;
    if (vars) {
      for (const k of Object.keys(vars)) {
        s = s.replaceAll(`{${k}}`, vars[k]);
      }
    }
    return s;
  }

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
  var MATH_INLINE_CLASS = /(^|\s)math-inline(\s|$)/;
  var MATH_BLOCK_CLASS = /(^|\s)math-block(\s|$)/;
  function mathDataAttribute(node) {
    if (!node.getAttribute) return "";
    const source = node.getAttribute("data-math-source");
    if (source && source.trim()) return source.trim();
    const cls = node.getAttribute("class") || "";
    if (!MATH_INLINE_CLASS.test(cls) && !MATH_BLOCK_CLASS.test(cls)) return "";
    return (node.getAttribute("data-math") || "").trim();
  }
  function mathElementKind(node) {
    if (node.getAttribute && node.hasAttribute("data-math-source")) {
      return node.querySelector(".katex-display") ? "block" : "inline";
    }
    const cls = node.getAttribute && node.getAttribute("class") || "";
    if (MATH_BLOCK_CLASS.test(cls)) return "block";
    if (MATH_INLINE_CLASS.test(cls)) return "inline";
    return "";
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
  function escapeTableCell(text2) {
    return String(text2).replace(/\r\n/g, "\n").replace(/\n/g, " ").replace(/\|/g, "\\|").trim();
  }
  function withFreshLine(md) {
    return md ? "\n\n" + md : md;
  }
  var CODE_BLOCK_WIDGET_ATTRS = ["data-client-defined-widget", "data-d-component"];
  function isCodeBlockWidget(node) {
    if (!node.getAttribute) return false;
    for (const attr of CODE_BLOCK_WIDGET_ATTRS) {
      if (node.getAttribute(attr) === "code_block") return true;
    }
    return false;
  }
  function codeBlockWidgetToMd(node) {
    const pre = node.querySelector("pre");
    const codeEl = node.querySelector("code");
    const source = codeEl || pre || node;
    const raw = source.textContent.replace(/\n$/, "");
    let lang = "";
    if (codeEl) {
      const m = (codeEl.className || "").match(/language-([\w-]+)/);
      if (m) lang = m[1];
    }
    if (!lang && (pre || codeEl)) {
      const clone = node.cloneNode(true);
      for (const el of clone.querySelectorAll("pre, button, svg")) el.remove();
      const label = (clone.textContent || "").replace(/\s+/g, " ").trim();
      if (/^[\w+#.-]{1,24}$/.test(label)) lang = label;
    }
    return withFreshLine("```" + lang + "\n" + raw + "\n```\n\n");
  }
  var DEEPSEEK_CODE_BLOCK_CLASS = /(^|\s)md-code-block(\s|$)/;
  function isDeepSeekCodeBlock(node) {
    if (!node.getAttribute) return false;
    return DEEPSEEK_CODE_BLOCK_CLASS.test(node.getAttribute("class") || "");
  }
  function deepseekCodeBlockToMd(node) {
    const pre = node.querySelector("pre");
    const raw = ((pre || node).textContent || "").replace(/\n$/, "");
    let lang = "";
    const banner = node.querySelector(".md-code-block-banner");
    if (banner) {
      const label = (banner.querySelector("span")?.textContent || "").trim();
      if (/^[\w+#.-]{1,24}$/.test(label)) lang = label;
    }
    return withFreshLine("```" + lang + "\n" + raw + "\n```\n\n");
  }
  function katexAnnotationTex(node) {
    const cls = node.getAttribute && node.getAttribute("class") || "";
    if (!/(^|\s)katex(-display)?(\s|$)/.test(cls)) return null;
    if (/(^|\s)katex-(html|mathml)(\s|$)/.test(cls)) return null;
    const ann = node.querySelector('annotation[encoding="application/x-tex"]');
    const tex = ann && ann.textContent.trim();
    if (!tex) return null;
    const parentCls = node.parentElement && node.parentElement.getAttribute("class") || "";
    const display = /(^|\s)katex-display(\s|$)/.test(cls) || /(^|\s)katex-display(\s|$)/.test(parentCls);
    return { tex, display };
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
    const mathTex = mathDataAttribute(node);
    if (mathTex) {
      return mathElementKind(node) === "block" ? withFreshLine(`$$${mathTex}$$

`) : `$${mathTex}$`;
    }
    if (isCodeBlockWidget(node)) return codeBlockWidgetToMd(node);
    if (isDeepSeekCodeBlock(node)) return deepseekCodeBlockToMd(node);
    const katex = katexAnnotationTex(node);
    if (katex) {
      return katex.display ? withFreshLine(`$$${katex.tex}$$

`) : `$${katex.tex}$`;
    }
    if (tag2 in INLINE) {
      const inner2 = childrenToMd(node, ctx);
      const wrap = INLINE[tag2];
      if (!inner2.trim()) return "";
      return `${wrap}${inner2}${wrap}`;
    }
    switch (tag2) {
      case "h1":
      case "h2":
      case "h3":
      case "h4":
      case "h5":
      case "h6": {
        const level = Number(tag2[1]);
        const inner2 = childrenToMd(node, ctx).trim();
        return withFreshLine(`${"#".repeat(level)} ${inner2}

`);
      }
      case "p": {
        const inner2 = childrenToMd(node, ctx).trim();
        return inner2 ? withFreshLine(`${inner2}

`) : "";
      }
      case "br":
        return "  \n";
      case "hr":
        return withFreshLine("---\n\n");
      case "a": {
        const href = node.getAttribute("href") || "";
        const text2 = childrenToMd(node, ctx).trim() || href;
        return href ? `[${text2}](${href})` : text2;
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
        const label = shortAlt ? t("imageTag", { n: ctx.imgSeq, alt: shortAlt }) : t("imageTagNoAlt", { n: ctx.imgSeq });
        return withFreshLine(`\u{1F5BC}\uFE0F [${label}]

`);
      }
      case "blockquote": {
        const inner2 = childrenToMd(node, ctx).trim();
        if (!inner2) return "";
        if (isImageCaptionBlock(node)) {
          return withFreshLine(`${inner2}

`);
        }
        const quoted = inner2.split("\n").map((l) => l ? `> ${l}` : ">").join("\n");
        return withFreshLine(`${quoted}

`);
      }
      case "ul":
        return withFreshLine(listToMd(node, ctx, false));
      case "ol":
        return withFreshLine(listToMd(node, ctx, true));
      case "sequence": {
        return withFreshLine(sequenceToMd(node, ctx));
      }
      case "pre": {
        const codeEl = node.querySelector("code");
        const raw = (codeEl || node).textContent.replace(/\n$/, "");
        let lang = "";
        if (codeEl) {
          const cls = codeEl.className || "";
          const m = cls.match(/language-([\w-]+)/);
          if (m) lang = m[1];
        }
        return withFreshLine("```" + lang + "\n" + raw + "\n```\n\n");
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
        return withFreshLine("```" + lang + "\n" + raw + "\n```\n\n");
      }
      // NOTE: Gemini math (math-inline / math-block) is handled UPSTREAM by the
      // mathDataAttribute() check before the INLINE table / this switch. Gemini
      // renders math as ordinary <span>/<div> elements with a CLASS (not a custom
      // tag name), so they would never reach a dedicated `case` here — they'd
      // fall into `case 'span'` / `case 'div'` and get flattened. The upstream
      // intercept is what reads `data-math` and emits `$...$` / `$$...$$`.
      case "table":
        return withFreshLine(tableToMd(node, ctx));
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
        if (hasContent) return childrenToMd(node, ctx);
        const inner2 = childrenToMd(node, ctx).trim();
        return inner2 ? withFreshLine(`${inner2}

`) : "";
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
    if (ordered) {
      const start = parseInt(node.getAttribute("start") || "", 10);
      if (Number.isInteger(start) && start > 0) i = start;
    }
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
      const text2 = textParts.join("").replace(/\n+/g, " ").trim();
      const checkbox = Array.from(li.querySelectorAll('input[type="checkbox"]')).find((input) => input.closest("li") === li);
      const task = checkbox ? `[${typeof checkbox.checked === "boolean" ? checkbox.checked ? "x" : " " : checkbox.hasAttribute("checked") ? "x" : " "}] ` : "";
      lines.push(`${marker}${task}${text2}`);
      for (const sub of subLists) {
        for (const subLine of sub.split("\n")) {
          lines.push("  " + subLine);
        }
      }
    }
    return lines.join("\n") + "\n\n";
  }
  var SEQUENCE_EXPORT_HOOK_CLASS = /(^|\s)only-show-to-message-actions(\s|$)/;
  function sequenceToMd(node, ctx) {
    const events = node.classList && node.classList.contains("sequence-event") ? [node] : Array.from(node.querySelectorAll(".sequence-event"));
    if (!events.length) {
      return childrenToMd(node, ctx);
    }
    const lines = [];
    let i = 1;
    for (const ev of events) {
      const marker = `${i}. `;
      i++;
      let title = "";
      let subtitle = "";
      let descriptionMd = "";
      const titleEl = ev.querySelector(".sequence-event-title");
      if (titleEl) title = childrenToMd(titleEl, ctx).trim();
      const subtitleEl = ev.querySelector(".sequence-event-subtitle");
      if (subtitleEl) subtitle = childrenToMd(subtitleEl, ctx).trim();
      const descEl = ev.querySelector(".sequence-event-description");
      if (descEl) {
        let desc = "";
        for (const child of descEl.childNodes) {
          if (child.nodeType === 1 && SEQUENCE_EXPORT_HOOK_CLASS.test(child.getAttribute("class") || "")) {
            continue;
          }
          desc += nodeToMd(child, ctx);
        }
        descriptionMd = desc.trim();
      }
      let head = title ? `**${title}**` : "";
      if (subtitle) head += head ? `\uFF08${subtitle}\uFF09` : subtitle;
      const itemLines = [];
      if (head) itemLines.push(`${marker}${head}`);
      if (descriptionMd) {
        for (const dl of descriptionMd.split("\n")) {
          itemLines.push("   " + dl);
        }
      }
      if (!itemLines.length) continue;
      if (!head) itemLines[0] = `${marker}${itemLines[0].trimStart()}`;
      lines.push(...itemLines);
    }
    return lines.length ? lines.join("\n") + "\n\n" : "";
  }
  function tableToMd(node, ctx) {
    const rows = [];
    for (const tr of node.querySelectorAll("tr")) {
      const cells = [];
      for (const cell of tr.children) {
        const t2 = cell.tagName.toLowerCase();
        if (t2 !== "td" && t2 !== "th") continue;
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
    const lines = raw.split("\n");
    let inFence = false;
    const out = [];
    for (const line of lines) {
      if (inFence) {
        if (/^```/.test(line)) inFence = false;
        out.push(line);
        continue;
      }
      if (/^[ \t]*```/.test(line)) {
        inFence = true;
        out.push(line.replace(/^[ \t]+/, ""));
        continue;
      }
      const m = line.match(/^[ \t]+(\S.*?)?[ \t]*$/);
      if (!m) {
        out.push(line);
        continue;
      }
      if (!m[1]) {
        out.push("");
        continue;
      }
      if (/^([ ]{2})+([-*+] |\d+\. )/.test(line)) {
        out.push(line);
        continue;
      }
      out.push(m[1]);
    }
    const deIndented = out.join("\n");
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
    const row = tableRow.replace(/\|/g, (match, offset2, str) => {
      let escaped = false;
      let curr = offset2;
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
  function rtrim(str, c2, invert) {
    const l = str.length;
    if (l === 0) {
      return "";
    }
    let suffLen = 0;
    while (suffLen < l) {
      const currChar = str.charAt(l - suffLen - 1);
      if (currChar === c2 && !invert) {
        suffLen++;
      } else if (currChar !== c2 && invert) {
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
    const text2 = cap[1].replace(/\\([\[\]])/g, "$1");
    if (cap[0].charAt(0) !== "!") {
      lexer2.state.inLink = true;
      const token = {
        type: "link",
        raw,
        href,
        title,
        text: text2,
        tokens: lexer2.inlineTokens(text2)
      };
      lexer2.state.inLink = false;
      return token;
    }
    return {
      type: "image",
      raw,
      href,
      title,
      text: escape$1(text2)
    };
  }
  function indentCodeCompensation(raw, text2) {
    const matchIndentToCode = raw.match(/^(\s+)(?:```)/);
    if (matchIndentToCode === null) {
      return text2;
    }
    const indentToCode = matchIndentToCode[1];
    return text2.split("\n").map((node) => {
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
        const text2 = cap[0].replace(/^(?: {1,4}| {0,3}\t)/gm, "");
        return {
          type: "code",
          raw: cap[0],
          codeBlockStyle: "indented",
          text: !this.options.pedantic ? rtrim(text2, "\n") : text2
        };
      }
    }
    fences(src) {
      const cap = this.rules.block.fences.exec(src);
      if (cap) {
        const raw = cap[0];
        const text2 = indentCodeCompensation(raw, cap[3] || "");
        return {
          type: "code",
          raw,
          lang: cap[2] ? cap[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : cap[2],
          text: text2
        };
      }
    }
    heading(src) {
      const cap = this.rules.block.heading.exec(src);
      if (cap) {
        let text2 = cap[2].trim();
        if (/#$/.test(text2)) {
          const trimmed = rtrim(text2, "#");
          if (this.options.pedantic) {
            text2 = trimmed.trim();
          } else if (!trimmed || / $/.test(trimmed)) {
            text2 = trimmed.trim();
          }
        }
        return {
          type: "heading",
          raw: cap[0],
          depth: cap[1].length,
          text: text2,
          tokens: this.lexer.inline(text2)
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
        let text2 = "";
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
          text2 = text2 ? `${text2}
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
            text2 = text2.substring(0, text2.length - oldToken.text.length) + newToken.text;
            break;
          } else if (lastToken?.type === "list") {
            const oldToken = lastToken;
            const newText = oldToken.raw + "\n" + lines.join("\n");
            const newToken = this.list(newText);
            tokens[tokens.length - 1] = newToken;
            raw = raw.substring(0, raw.length - lastToken.raw.length) + newToken.raw;
            text2 = text2.substring(0, text2.length - oldToken.raw.length) + newToken.raw;
            lines = newText.substring(tokens[tokens.length - 1].raw.length).split("\n");
            continue;
          }
        }
        return {
          type: "blockquote",
          raw,
          tokens,
          text: text2
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
          let line = cap[2].split("\n", 1)[0].replace(/^\t+/, (t2) => " ".repeat(3 * t2.length));
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
            const spacers = list2.items[i].tokens.filter((t2) => t2.type === "space");
            const hasMultipleLineBreaks = spacers.length > 0 && spacers.some((t2) => /\n.*\n/.test(t2.raw));
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
        const text2 = cap[1].charAt(cap[1].length - 1) === "\n" ? cap[1].slice(0, -1) : cap[1];
        return {
          type: "paragraph",
          raw: cap[0],
          text: text2,
          tokens: this.lexer.inline(text2)
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
          const text2 = cap[0].charAt(0);
          return {
            type: "text",
            raw: text2,
            text: text2
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
            const text3 = raw.slice(1, -1);
            return {
              type: "em",
              raw,
              text: text3,
              tokens: this.lexer.inlineTokens(text3)
            };
          }
          const text2 = raw.slice(2, -2);
          return {
            type: "strong",
            raw,
            text: text2,
            tokens: this.lexer.inlineTokens(text2)
          };
        }
      }
    }
    codespan(src) {
      const cap = this.rules.inline.code.exec(src);
      if (cap) {
        let text2 = cap[2].replace(/\n/g, " ");
        const hasNonSpaceChars = /[^ ]/.test(text2);
        const hasSpaceCharsOnBothEnds = /^ /.test(text2) && / $/.test(text2);
        if (hasNonSpaceChars && hasSpaceCharsOnBothEnds) {
          text2 = text2.substring(1, text2.length - 1);
        }
        text2 = escape$1(text2, true);
        return {
          type: "codespan",
          raw: cap[0],
          text: text2
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
        let text2, href;
        if (cap[2] === "@") {
          text2 = escape$1(cap[1]);
          href = "mailto:" + text2;
        } else {
          text2 = escape$1(cap[1]);
          href = text2;
        }
        return {
          type: "link",
          raw: cap[0],
          text: text2,
          href,
          tokens: [
            {
              type: "text",
              raw: text2,
              text: text2
            }
          ]
        };
      }
    }
    url(src) {
      let cap;
      if (cap = this.rules.inline.url.exec(src)) {
        let text2, href;
        if (cap[2] === "@") {
          text2 = escape$1(cap[0]);
          href = "mailto:" + text2;
        } else {
          let prevCapZero;
          do {
            prevCapZero = cap[0];
            cap[0] = this.rules.inline._backpedal.exec(cap[0])?.[0] ?? "";
          } while (prevCapZero !== cap[0]);
          text2 = escape$1(cap[0]);
          if (cap[1] === "www.") {
            href = "http://" + cap[0];
          } else {
            href = cap[0];
          }
        }
        return {
          type: "link",
          raw: cap[0],
          text: text2,
          href,
          tokens: [
            {
              type: "text",
              raw: text2,
              text: text2
            }
          ]
        };
      }
    }
    inlineText(src) {
      const cap = this.rules.inline.text.exec(src);
      if (cap) {
        let text2;
        if (this.lexer.state.inRawBlock) {
          text2 = cap[0];
        } else {
          text2 = escape$1(cap[0]);
        }
        return {
          type: "text",
          raw: cap[0],
          text: text2
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
    code({ text: text2, lang, escaped }) {
      const langString = (lang || "").match(/^\S*/)?.[0];
      const code = text2.replace(/\n$/, "") + "\n";
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
    html({ text: text2 }) {
      return text2;
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
    tablerow({ text: text2 }) {
      return `<tr>
${text2}</tr>
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
    codespan({ text: text2 }) {
      return `<code>${text2}</code>`;
    }
    br(token) {
      return "<br>";
    }
    del({ tokens }) {
      return `<del>${this.parser.parseInline(tokens)}</del>`;
    }
    link({ href, title, tokens }) {
      const text2 = this.parser.parseInline(tokens);
      const cleanHref = cleanUrl(href);
      if (cleanHref === null) {
        return text2;
      }
      href = cleanHref;
      let out = '<a href="' + href + '"';
      if (title) {
        out += ' title="' + title + '"';
      }
      out += ">" + text2 + "</a>";
      return out;
    }
    image({ href, title, text: text2 }) {
      const cleanHref = cleanUrl(href);
      if (cleanHref === null) {
        return text2;
      }
      href = cleanHref;
      let out = `<img src="${href}" alt="${text2}"`;
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
    strong({ text: text2 }) {
      return text2;
    }
    em({ text: text2 }) {
      return text2;
    }
    codespan({ text: text2 }) {
      return text2;
    }
    del({ text: text2 }) {
      return text2;
    }
    html({ text: text2 }) {
      return text2;
    }
    text({ text: text2 }) {
      return text2;
    }
    link({ text: text2 }) {
      return "" + text2;
    }
    image({ text: text2 }) {
      return "" + text2;
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
    preprocess(markdown2) {
      return markdown2;
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

  // node_modules/temml/dist/temml.mjs
  var ParseError = class _ParseError {
    constructor(message, token) {
      let error = " " + message;
      let start;
      const loc = token && token.loc;
      if (loc && loc.start <= loc.end) {
        const input = loc.lexer.input;
        start = loc.start;
        const end = loc.end;
        if (start === input.length) {
          error += " at end of input: ";
        } else {
          error += " at position " + (start + 1) + ": \n";
        }
        const underlined = input.slice(start, end).replace(/[^]/g, "$&\u0332");
        let left;
        if (start > 15) {
          left = "\u2026" + input.slice(start - 15, start);
        } else {
          left = input.slice(0, start);
        }
        let right;
        if (end + 15 < input.length) {
          right = input.slice(end, end + 15) + "\u2026";
        } else {
          right = input.slice(end);
        }
        error += left + underlined + right;
      }
      const self = new Error(error);
      self.name = "ParseError";
      self.__proto__ = _ParseError.prototype;
      self.position = start;
      return self;
    }
  };
  ParseError.prototype.__proto__ = Error.prototype;
  var deflt = function(setting, defaultIfUndefined) {
    return setting === void 0 ? defaultIfUndefined : setting;
  };
  var uppercase = /([A-Z])/g;
  var hyphenate = function(str) {
    return str.replace(uppercase, "-$1").toLowerCase();
  };
  var ESCAPE_LOOKUP = {
    "&": "&amp;",
    ">": "&gt;",
    "<": "&lt;",
    '"': "&quot;",
    "'": "&#x27;"
  };
  var ESCAPE_REGEX = /[&><"']/g;
  function escape2(text2) {
    return String(text2).replace(ESCAPE_REGEX, (match) => ESCAPE_LOOKUP[match]);
  }
  var getBaseElem = function(group) {
    if (group.type === "ordgroup") {
      if (group.body.length === 1) {
        return getBaseElem(group.body[0]);
      } else {
        return group;
      }
    } else if (group.type === "color") {
      if (group.body.length === 1) {
        return getBaseElem(group.body[0]);
      } else {
        return group;
      }
    } else if (group.type === "font") {
      return getBaseElem(group.body);
    } else {
      return group;
    }
  };
  var isCharacterBox = function(group) {
    const baseElem = getBaseElem(group);
    return baseElem.type === "mathord" || baseElem.type === "textord" || baseElem.type === "atom";
  };
  var assert = function(value) {
    if (!value) {
      throw new Error("Expected non-null, but got " + String(value));
    }
    return value;
  };
  var protocolFromUrl = function(url) {
    const protocol = /^[\x00-\x20]*([^\\/#?]*?)(:|&#0*58|&#x0*3a|&colon)/i.exec(url);
    if (!protocol) {
      return "_relative";
    }
    if (protocol[2] !== ":") {
      return null;
    }
    if (!/^[a-zA-Z][a-zA-Z0-9+\-.]*$/.test(protocol[1])) {
      return null;
    }
    return protocol[1].toLowerCase();
  };
  var round = function(n) {
    return +n.toFixed(4);
  };
  var smalls = "aceg\u0131\u0237mnopqrsuvwxyz\u03B1\u03B3\u03B5\u03B7\u03B9\u03BA\u03BC\u03BD\u03BF\u03C0\u03C1\u03C2\u03C3\u03C4\u03C5\u03C7\u03C9\u03D5\u{1D41A}\u{1D41C}\u{1D41E}\u{1D420}\u{1D426}\u{1D427}\u{1D428}\u{1D429}\u{1D42A}\u{1D42B}\u{1D42C}\u{1D42E}\u{1D42F}\u{1D430}\u{1D431}\u{1D432}\u{1D433}";
  var Settings = class {
    constructor(options2) {
      options2 = options2 || {};
      this.displayMode = deflt(options2.displayMode, false);
      this.annotate = deflt(options2.annotate, false);
      this.leqno = deflt(options2.leqno, false);
      this.throwOnError = deflt(options2.throwOnError, false);
      this.errorColor = deflt(options2.errorColor, "#b22222");
      this.macros = options2.macros || {};
      this.wrap = deflt(options2.wrap, "none");
      this.xml = deflt(options2.xml, false);
      this.colorIsTextColor = deflt(options2.colorIsTextColor, false);
      this.strict = deflt(options2.strict, false);
      this.trust = deflt(options2.trust, false);
      this.maxSize = options2.maxSize === void 0 ? [Infinity, Infinity] : Array.isArray(options2.maxSize) ? options2.maxSize : [Infinity, Infinity];
      this.maxExpand = Math.max(0, deflt(options2.maxExpand, 1e3));
      this.wrapDelimiterPairs = true;
    }
    /**
     * Check whether to test potentially dangerous input, and return
     * `true` (trusted) or `false` (untrusted).  The sole argument `context`
     * should be an object with `command` field specifying the relevant LaTeX
     * command (as a string starting with `\`), and any other arguments, etc.
     * If `context` has a `url` field, a `protocol` field will automatically
     * get added by this function (changing the specified object).
     */
    isTrusted(context) {
      if (context.url && !context.protocol) {
        const protocol = protocolFromUrl(context.url);
        if (protocol == null) {
          return false;
        }
        context.protocol = protocol;
      }
      const trust = typeof this.trust === "function" ? this.trust(context) : this.trust;
      return Boolean(trust);
    }
  };
  var _functions = {};
  var _mathmlGroupBuilders = {};
  function defineFunction({
    type,
    names,
    props,
    handler,
    mathmlBuilder: mathmlBuilder2
  }) {
    const data = {
      type,
      numArgs: props.numArgs,
      argTypes: props.argTypes,
      allowedInArgument: !!props.allowedInArgument,
      allowedInText: !!props.allowedInText,
      allowedInMath: props.allowedInMath === void 0 ? true : props.allowedInMath,
      numOptionalArgs: props.numOptionalArgs || 0,
      infix: !!props.infix,
      primitive: !!props.primitive,
      handler
    };
    for (let i = 0; i < names.length; ++i) {
      _functions[names[i]] = data;
    }
    if (type) {
      if (mathmlBuilder2) {
        _mathmlGroupBuilders[type] = mathmlBuilder2;
      }
    }
  }
  function defineFunctionBuilders({ type, mathmlBuilder: mathmlBuilder2 }) {
    defineFunction({
      type,
      names: [],
      props: { numArgs: 0 },
      handler() {
        throw new Error("Should never be called.");
      },
      mathmlBuilder: mathmlBuilder2
    });
  }
  var normalizeArgument = function(arg) {
    return arg.type === "ordgroup" && arg.body.length === 1 ? arg.body[0] : arg;
  };
  var ordargument = function(arg) {
    return arg.type === "ordgroup" ? arg.body : [arg];
  };
  var DocumentFragment = class {
    constructor(children) {
      this.children = children;
      this.classes = [];
      this.style = {};
    }
    hasClass(className) {
      return this.classes.includes(className);
    }
    /** Convert the fragment into a node. */
    toNode() {
      const frag = document.createDocumentFragment();
      for (let i = 0; i < this.children.length; i++) {
        frag.appendChild(this.children[i].toNode());
      }
      return frag;
    }
    /** Convert the fragment into HTML markup. */
    toMarkup() {
      let markup = "";
      for (let i = 0; i < this.children.length; i++) {
        markup += this.children[i].toMarkup();
      }
      return markup;
    }
    /**
     * Converts the math node into a string, similar to innerText. Applies to
     * MathDomNode's only.
     */
    toText() {
      const toText = (child) => child.toText();
      return this.children.map(toText).join("");
    }
  };
  var createClass = function(classes) {
    return classes.filter((cls) => cls).join(" ");
  };
  var initNode = function(classes, style) {
    this.classes = classes || [];
    this.attributes = {};
    this.style = style || {};
  };
  var toNode = function(tagName) {
    const node = document.createElement(tagName);
    node.className = createClass(this.classes);
    for (const style in this.style) {
      if (Object.prototype.hasOwnProperty.call(this.style, style)) {
        node.style[style] = this.style[style];
      }
    }
    for (const attr in this.attributes) {
      if (Object.prototype.hasOwnProperty.call(this.attributes, attr)) {
        node.setAttribute(attr, this.attributes[attr]);
      }
    }
    for (let i = 0; i < this.children.length; i++) {
      node.appendChild(this.children[i].toNode());
    }
    return node;
  };
  var toMarkup = function(tagName) {
    let markup = `<${tagName}`;
    if (this.classes.length) {
      markup += ` class="${escape2(createClass(this.classes))}"`;
    }
    let styles = "";
    for (const style in this.style) {
      if (Object.prototype.hasOwnProperty.call(this.style, style)) {
        styles += `${hyphenate(style)}:${this.style[style]};`;
      }
    }
    if (styles) {
      markup += ` style="${styles}"`;
    }
    for (const attr in this.attributes) {
      if (Object.prototype.hasOwnProperty.call(this.attributes, attr)) {
        markup += ` ${attr}="${escape2(this.attributes[attr])}"`;
      }
    }
    markup += ">";
    for (let i = 0; i < this.children.length; i++) {
      markup += this.children[i].toMarkup();
    }
    markup += `</${tagName}>`;
    return markup;
  };
  var Span = class {
    constructor(classes, children, style) {
      initNode.call(this, classes, style);
      this.children = children || [];
    }
    setAttribute(attribute, value) {
      this.attributes[attribute] = value;
    }
    toNode() {
      return toNode.call(this, "span");
    }
    toMarkup() {
      return toMarkup.call(this, "span");
    }
  };
  var TextNode$1 = class TextNode {
    constructor(text2) {
      this.text = text2;
    }
    toNode() {
      return document.createTextNode(this.text);
    }
    toMarkup() {
      return escape2(this.text);
    }
  };
  var AnchorNode = class {
    constructor(href, classes, children) {
      this.href = href;
      this.classes = classes;
      this.children = children || [];
    }
    toNode() {
      const node = document.createElement("a");
      node.setAttribute("href", this.href);
      if (this.classes.length > 0) {
        node.className = createClass(this.classes);
      }
      for (let i = 0; i < this.children.length; i++) {
        node.appendChild(this.children[i].toNode());
      }
      return node;
    }
    toMarkup() {
      let markup = `<a href='${escape2(this.href)}'`;
      if (this.classes.length > 0) {
        markup += ` class="${escape2(createClass(this.classes))}"`;
      }
      markup += ">";
      for (let i = 0; i < this.children.length; i++) {
        markup += this.children[i].toMarkup();
      }
      markup += "</a>";
      return markup;
    }
  };
  var Img = class {
    constructor(src, alt, style) {
      this.alt = alt;
      this.src = src;
      this.classes = ["mord"];
      this.style = style;
    }
    hasClass(className) {
      return this.classes.includes(className);
    }
    toNode() {
      const node = document.createElement("img");
      node.src = this.src;
      node.alt = this.alt;
      node.className = "mord";
      for (const style in this.style) {
        if (Object.prototype.hasOwnProperty.call(this.style, style)) {
          node.style[style] = this.style[style];
        }
      }
      return node;
    }
    toMarkup() {
      let markup = `<img src='${this.src}' alt='${this.alt}'`;
      let styles = "";
      for (const style in this.style) {
        if (Object.prototype.hasOwnProperty.call(this.style, style)) {
          styles += `${hyphenate(style)}:${this.style[style]};`;
        }
      }
      if (styles) {
        markup += ` style="${escape2(styles)}"`;
      }
      markup += ">";
      return markup;
    }
  };
  function newDocumentFragment(children) {
    return new DocumentFragment(children);
  }
  var MathNode = class {
    constructor(type, children, classes, style) {
      this.type = type;
      this.attributes = {};
      this.children = children || [];
      this.classes = classes || [];
      this.style = style || {};
      this.label = "";
    }
    /**
     * Sets an attribute on a MathML node. MathML depends on attributes to convey a
     * semantic content, so this is used heavily.
     */
    setAttribute(name, value) {
      this.attributes[name] = value;
    }
    /**
     * Gets an attribute on a MathML node.
     */
    getAttribute(name) {
      return this.attributes[name];
    }
    setLabel(value) {
      this.label = value;
    }
    /**
     * Converts the math node into a MathML-namespaced DOM element.
     */
    toNode() {
      const node = document.createElementNS("http://www.w3.org/1998/Math/MathML", this.type);
      for (const attr in this.attributes) {
        if (Object.prototype.hasOwnProperty.call(this.attributes, attr)) {
          node.setAttribute(attr, this.attributes[attr]);
        }
      }
      if (this.classes.length > 0) {
        node.className = createClass(this.classes);
      }
      for (const style in this.style) {
        if (Object.prototype.hasOwnProperty.call(this.style, style)) {
          node.style[style] = this.style[style];
        }
      }
      for (let i = 0; i < this.children.length; i++) {
        node.appendChild(this.children[i].toNode());
      }
      return node;
    }
    /**
     * Converts the math node into an HTML markup string.
     */
    toMarkup() {
      let markup = "<" + this.type;
      for (const attr in this.attributes) {
        if (Object.prototype.hasOwnProperty.call(this.attributes, attr)) {
          markup += " " + attr + '="';
          markup += escape2(this.attributes[attr]);
          markup += '"';
        }
      }
      if (this.classes.length > 0) {
        markup += ` class="${escape2(createClass(this.classes))}"`;
      }
      let styles = "";
      for (const style in this.style) {
        if (Object.prototype.hasOwnProperty.call(this.style, style)) {
          styles += `${hyphenate(style)}:${this.style[style]};`;
        }
      }
      if (styles) {
        markup += ` style="${styles}"`;
      }
      markup += ">";
      for (let i = 0; i < this.children.length; i++) {
        markup += this.children[i].toMarkup();
      }
      markup += "</" + this.type + ">";
      return markup;
    }
    /**
     * Converts the math node into a string, similar to innerText, but escaped.
     */
    toText() {
      return this.children.map((child) => child.toText()).join("");
    }
  };
  var TextNode2 = class {
    constructor(text2) {
      this.text = text2;
    }
    /**
     * Converts the text node into a DOM text node.
     */
    toNode() {
      return document.createTextNode(this.text);
    }
    /**
     * Converts the text node into escaped HTML markup
     * (representing the text itself).
     */
    toMarkup() {
      return escape2(this.toText());
    }
    /**
     * Converts the text node into a string
     * (representing the text itself).
     */
    toText() {
      return this.text;
    }
  };
  var wrapWithMstyle = (expression) => {
    let node;
    if (expression.length === 1 && expression[0].type === "mrow") {
      node = expression.pop();
      node.type = "mstyle";
    } else {
      node = new MathNode("mstyle", expression);
    }
    return node;
  };
  var estimatedWidth = (node) => {
    let width = 0;
    if (node.body && Array.isArray(node.body)) {
      for (const item of node.body) {
        width += estimatedWidth(item);
      }
    } else if (node.body) {
      width += estimatedWidth(node.body);
    } else if (node.type === "supsub") {
      width += estimatedWidth(node.base);
      if (node.sub) {
        width += 0.7 * estimatedWidth(node.sub);
      }
      if (node.sup) {
        width += 0.7 * estimatedWidth(node.sup);
      }
    } else if (node.type === "mathord" || node.type === "textord") {
      for (const ch of node.text.split("")) {
        const codePoint = ch.codePointAt(0);
        if (96 < codePoint && codePoint < 123 || 944 < codePoint && codePoint < 970) {
          width += 0.56;
        } else if (47 < codePoint && codePoint < 58) {
          width += 0.5;
        } else {
          width += 0.92;
        }
      }
    } else {
      width += 1;
    }
    return width;
  };
  var stretchyCodePoint = {
    widehat: "^",
    widecheck: "\u02C7",
    widetilde: "~",
    wideparen: "\u23DC",
    // \u23dc
    utilde: "~",
    overleftarrow: "\u2190",
    underleftarrow: "\u2190",
    xleftarrow: "\u2190",
    overrightarrow: "\u2192",
    underrightarrow: "\u2192",
    xrightarrow: "\u2192",
    underbrace: "\u23DF",
    overbrace: "\u23DE",
    overbracket: "\u23B4",
    underbracket: "\u23B5",
    overgroup: "\u23E0",
    overparen: "\u23DC",
    undergroup: "\u23E1",
    underparen: "\u23DD",
    overleftrightarrow: "\u2194",
    underleftrightarrow: "\u2194",
    xleftrightarrow: "\u2194",
    Overrightarrow: "\u21D2",
    xRightarrow: "\u21D2",
    overleftharpoon: "\u21BC",
    xleftharpoonup: "\u21BC",
    overrightharpoon: "\u21C0",
    xrightharpoonup: "\u21C0",
    xLeftarrow: "\u21D0",
    xLeftrightarrow: "\u21D4",
    xhookleftarrow: "\u21A9",
    xhookrightarrow: "\u21AA",
    xmapsto: "\u21A6",
    xrightharpoondown: "\u21C1",
    xleftharpoondown: "\u21BD",
    xtwoheadleftarrow: "\u219E",
    xtwoheadrightarrow: "\u21A0",
    xlongequal: "=",
    xrightleftarrows: "\u21C4",
    xtofrom: "\u21C4",
    xleftrightharpoons: "\u21CB",
    xrightleftharpoons: "\u21CC",
    yields: "\u2192",
    yieldsLeft: "\u2190",
    mesomerism: "\u2194",
    longrightharpoonup: "\u21C0",
    longleftharpoondown: "\u21BD",
    eqrightharpoonup: "\u21C0",
    eqleftharpoondown: "\u21BD",
    "\\cdrightarrow": "\u2192",
    "\\cdleftarrow": "\u2190",
    "\\cdlongequal": "=",
    yieldsLeftRight: "\u21C4",
    chemequilibrium: "\u21CC"
  };
  var mathMLnode = function(label) {
    const child = new TextNode2(stretchyCodePoint[label.slice(1)]);
    const node = new MathNode("mo", [child]);
    node.setAttribute("stretchy", "true");
    return node;
  };
  var crookedWides = ["\\widetilde", "\\widehat", "\\widecheck", "\\utilde"];
  var accentNode = (group) => {
    const mo = mathMLnode(group.label);
    if (crookedWides.includes(group.label)) {
      const width = estimatedWidth(group.base);
      if (1 < width && width < 1.6) {
        mo.classes.push("tml-crooked-2");
      } else if (1.6 <= width && width < 2.5) {
        mo.classes.push("tml-crooked-3");
      } else if (2.5 <= width) {
        mo.classes.push("tml-crooked-4");
      }
    }
    return mo;
  };
  var ATOMS = {
    bin: 1,
    close: 1,
    inner: 1,
    open: 1,
    punct: 1,
    rel: 1
  };
  var NON_ATOMS = {
    "accent-token": 1,
    mathord: 1,
    "op-token": 1,
    spacing: 1,
    textord: 1
  };
  var symbols = {
    math: {},
    text: {}
  };
  function defineSymbol(mode, group, replace, name, acceptUnicodeChar) {
    symbols[mode][name] = { group, replace };
    if (acceptUnicodeChar && replace) {
      symbols[mode][replace] = symbols[mode][name];
    }
  }
  var math = "math";
  var text = "text";
  var accent = "accent-token";
  var bin = "bin";
  var close = "close";
  var inner = "inner";
  var mathord = "mathord";
  var op = "op-token";
  var open = "open";
  var punct = "punct";
  var rel = "rel";
  var spacing = "spacing";
  var textord = "textord";
  defineSymbol(math, rel, "\u2261", "\\equiv", true);
  defineSymbol(math, rel, "\u227A", "\\prec", true);
  defineSymbol(math, rel, "\u227B", "\\succ", true);
  defineSymbol(math, rel, "\u223C", "\\sim", true);
  defineSymbol(math, rel, "\u27C2", "\\perp", true);
  defineSymbol(math, rel, "\u2AAF", "\\preceq", true);
  defineSymbol(math, rel, "\u2AB0", "\\succeq", true);
  defineSymbol(math, rel, "\u2243", "\\simeq", true);
  defineSymbol(math, rel, "\u224C", "\\backcong", true);
  defineSymbol(math, rel, "|", "\\mid", true);
  defineSymbol(math, rel, "\u226A", "\\ll", true);
  defineSymbol(math, rel, "\u226B", "\\gg", true);
  defineSymbol(math, rel, "\u224D", "\\asymp", true);
  defineSymbol(math, rel, "\u2225", "\\parallel");
  defineSymbol(math, rel, "\u2323", "\\smile", true);
  defineSymbol(math, rel, "\u2291", "\\sqsubseteq", true);
  defineSymbol(math, rel, "\u2292", "\\sqsupseteq", true);
  defineSymbol(math, rel, "\u2250", "\\doteq", true);
  defineSymbol(math, rel, "\u2322", "\\frown", true);
  defineSymbol(math, rel, "\u220B", "\\ni", true);
  defineSymbol(math, rel, "\u220C", "\\notni", true);
  defineSymbol(math, rel, "\u221D", "\\propto", true);
  defineSymbol(math, rel, "\u22A2", "\\vdash", true);
  defineSymbol(math, rel, "\u22A3", "\\dashv", true);
  defineSymbol(math, rel, "\u220B", "\\owns");
  defineSymbol(math, rel, "\u2258", "\\arceq", true);
  defineSymbol(math, rel, "\u2259", "\\wedgeq", true);
  defineSymbol(math, rel, "\u225A", "\\veeeq", true);
  defineSymbol(math, rel, "\u225B", "\\stareq", true);
  defineSymbol(math, rel, "\u225D", "\\eqdef", true);
  defineSymbol(math, rel, "\u225E", "\\measeq", true);
  defineSymbol(math, rel, "\u225F", "\\questeq", true);
  defineSymbol(math, rel, "\u2260", "\\ne", true);
  defineSymbol(math, rel, "\u2260", "\\neq");
  defineSymbol(math, rel, "\u2A75", "\\eqeq", true);
  defineSymbol(math, rel, "\u2A76", "\\eqeqeq", true);
  defineSymbol(math, rel, "\u2237", "\\dblcolon", true);
  defineSymbol(math, rel, "\u2254", "\\coloneqq", true);
  defineSymbol(math, rel, "\u2255", "\\eqqcolon", true);
  defineSymbol(math, rel, "\u2239", "\\eqcolon", true);
  defineSymbol(math, rel, "\u2A74", "\\Coloneqq", true);
  defineSymbol(math, punct, ".", "\\ldotp");
  defineSymbol(math, punct, "\xB7", "\\cdotp");
  defineSymbol(math, textord, "#", "\\#");
  defineSymbol(text, textord, "#", "\\#");
  defineSymbol(math, textord, "&", "\\&");
  defineSymbol(text, textord, "&", "\\&");
  defineSymbol(math, textord, "\u2135", "\\aleph", true);
  defineSymbol(math, textord, "\u2200", "\\forall", true);
  defineSymbol(math, textord, "\u210F", "\\hbar", true);
  defineSymbol(math, textord, "\u2203", "\\exists", true);
  defineSymbol(math, open, "\u2207", "\\nabla", true);
  defineSymbol(math, textord, "\u266D", "\\flat", true);
  defineSymbol(math, textord, "\u2113", "\\ell", true);
  defineSymbol(math, textord, "\u266E", "\\natural", true);
  defineSymbol(math, textord, "\u212B", "\\Angstrom", true);
  defineSymbol(text, textord, "\u212B", "\\Angstrom", true);
  defineSymbol(math, textord, "\u2663", "\\clubsuit", true);
  defineSymbol(math, textord, "\u2667", "\\varclubsuit", true);
  defineSymbol(math, textord, "\u2118", "\\wp", true);
  defineSymbol(math, textord, "\u266F", "\\sharp", true);
  defineSymbol(math, textord, "\u2662", "\\diamondsuit", true);
  defineSymbol(math, textord, "\u2666", "\\vardiamondsuit", true);
  defineSymbol(math, textord, "\u211C", "\\Re", true);
  defineSymbol(math, textord, "\u2661", "\\heartsuit", true);
  defineSymbol(math, textord, "\u2665", "\\varheartsuit", true);
  defineSymbol(math, textord, "\u2111", "\\Im", true);
  defineSymbol(math, textord, "\u2660", "\\spadesuit", true);
  defineSymbol(math, textord, "\u2664", "\\varspadesuit", true);
  defineSymbol(math, textord, "\u2640", "\\female", true);
  defineSymbol(math, textord, "\u2642", "\\male", true);
  defineSymbol(math, textord, "\xA7", "\\S", true);
  defineSymbol(text, textord, "\xA7", "\\S");
  defineSymbol(math, textord, "\xB6", "\\P", true);
  defineSymbol(text, textord, "\xB6", "\\P");
  defineSymbol(text, textord, "\u263A", "\\smiley", true);
  defineSymbol(math, textord, "\u263A", "\\smiley", true);
  defineSymbol(math, textord, "\u2020", "\\dag");
  defineSymbol(text, textord, "\u2020", "\\dag");
  defineSymbol(text, textord, "\u2020", "\\textdagger");
  defineSymbol(math, textord, "\u2021", "\\ddag");
  defineSymbol(text, textord, "\u2021", "\\ddag");
  defineSymbol(text, textord, "\u2021", "\\textdaggerdbl");
  defineSymbol(math, close, "\u23B1", "\\rmoustache", true);
  defineSymbol(math, open, "\u23B0", "\\lmoustache", true);
  defineSymbol(math, close, "\u27EF", "\\rgroup", true);
  defineSymbol(math, open, "\u27EE", "\\lgroup", true);
  defineSymbol(math, bin, "\u2213", "\\mp", true);
  defineSymbol(math, bin, "\u2296", "\\ominus", true);
  defineSymbol(math, bin, "\u228E", "\\uplus", true);
  defineSymbol(math, bin, "\u2293", "\\sqcap", true);
  defineSymbol(math, bin, "\u2217", "\\ast");
  defineSymbol(math, bin, "\u2294", "\\sqcup", true);
  defineSymbol(math, bin, "\u25EF", "\\bigcirc", true);
  defineSymbol(math, bin, "\u2219", "\\bullet", true);
  defineSymbol(math, bin, "\u2021", "\\ddagger");
  defineSymbol(math, bin, "\u2240", "\\wr", true);
  defineSymbol(math, bin, "\u2A3F", "\\amalg");
  defineSymbol(math, bin, "&", "\\And");
  defineSymbol(math, bin, "\u2AFD", "\\sslash", true);
  defineSymbol(math, rel, "\u27F5", "\\longleftarrow", true);
  defineSymbol(math, rel, "\u21D0", "\\Leftarrow", true);
  defineSymbol(math, rel, "\u27F8", "\\Longleftarrow", true);
  defineSymbol(math, rel, "\u27F6", "\\longrightarrow", true);
  defineSymbol(math, rel, "\u21D2", "\\Rightarrow", true);
  defineSymbol(math, rel, "\u27F9", "\\Longrightarrow", true);
  defineSymbol(math, rel, "\u2194", "\\leftrightarrow", true);
  defineSymbol(math, rel, "\u27F7", "\\longleftrightarrow", true);
  defineSymbol(math, rel, "\u21D4", "\\Leftrightarrow", true);
  defineSymbol(math, rel, "\u27FA", "\\Longleftrightarrow", true);
  defineSymbol(math, rel, "\u21A4", "\\mapsfrom", true);
  defineSymbol(math, rel, "\u21A6", "\\mapsto", true);
  defineSymbol(math, rel, "\u27FC", "\\longmapsto", true);
  defineSymbol(math, rel, "\u2197", "\\nearrow", true);
  defineSymbol(math, rel, "\u21A9", "\\hookleftarrow", true);
  defineSymbol(math, rel, "\u21AA", "\\hookrightarrow", true);
  defineSymbol(math, rel, "\u2198", "\\searrow", true);
  defineSymbol(math, rel, "\u21BC", "\\leftharpoonup", true);
  defineSymbol(math, rel, "\u21C0", "\\rightharpoonup", true);
  defineSymbol(math, rel, "\u2199", "\\swarrow", true);
  defineSymbol(math, rel, "\u21BD", "\\leftharpoondown", true);
  defineSymbol(math, rel, "\u21C1", "\\rightharpoondown", true);
  defineSymbol(math, rel, "\u2196", "\\nwarrow", true);
  defineSymbol(math, rel, "\u21CC", "\\rightleftharpoons", true);
  defineSymbol(math, mathord, "\u21AF", "\\lightning", true);
  defineSymbol(math, mathord, "\u220E", "\\QED", true);
  defineSymbol(math, mathord, "\u2030", "\\permil", true);
  defineSymbol(text, textord, "\u2030", "\\permil");
  defineSymbol(math, mathord, "\u2609", "\\astrosun", true);
  defineSymbol(math, mathord, "\u263C", "\\sun", true);
  defineSymbol(math, mathord, "\u263E", "\\leftmoon", true);
  defineSymbol(math, mathord, "\u263D", "\\rightmoon", true);
  defineSymbol(math, mathord, "\u2295", "\\Earth");
  defineSymbol(math, rel, "\u226E", "\\nless", true);
  defineSymbol(math, rel, "\u2A87", "\\lneq", true);
  defineSymbol(math, rel, "\u2268", "\\lneqq", true);
  defineSymbol(math, rel, "\u2268\uFE00", "\\lvertneqq");
  defineSymbol(math, rel, "\u22E6", "\\lnsim", true);
  defineSymbol(math, rel, "\u2A89", "\\lnapprox", true);
  defineSymbol(math, rel, "\u2280", "\\nprec", true);
  defineSymbol(math, rel, "\u22E0", "\\npreceq", true);
  defineSymbol(math, rel, "\u22E8", "\\precnsim", true);
  defineSymbol(math, rel, "\u2AB9", "\\precnapprox", true);
  defineSymbol(math, rel, "\u2241", "\\nsim", true);
  defineSymbol(math, rel, "\u2224", "\\nmid", true);
  defineSymbol(math, rel, "\u2224", "\\nshortmid");
  defineSymbol(math, rel, "\u22AC", "\\nvdash", true);
  defineSymbol(math, rel, "\u22AD", "\\nvDash", true);
  defineSymbol(math, rel, "\u22EA", "\\ntriangleleft");
  defineSymbol(math, rel, "\u22EC", "\\ntrianglelefteq", true);
  defineSymbol(math, rel, "\u2284", "\\nsubset", true);
  defineSymbol(math, rel, "\u2285", "\\nsupset", true);
  defineSymbol(math, rel, "\u228A", "\\subsetneq", true);
  defineSymbol(math, rel, "\u228A\uFE00", "\\varsubsetneq");
  defineSymbol(math, rel, "\u2ACB", "\\subsetneqq", true);
  defineSymbol(math, rel, "\u2ACB\uFE00", "\\varsubsetneqq");
  defineSymbol(math, rel, "\u226F", "\\ngtr", true);
  defineSymbol(math, rel, "\u2A88", "\\gneq", true);
  defineSymbol(math, rel, "\u2269", "\\gneqq", true);
  defineSymbol(math, rel, "\u2269\uFE00", "\\gvertneqq");
  defineSymbol(math, rel, "\u22E7", "\\gnsim", true);
  defineSymbol(math, rel, "\u2A8A", "\\gnapprox", true);
  defineSymbol(math, rel, "\u2281", "\\nsucc", true);
  defineSymbol(math, rel, "\u22E1", "\\nsucceq", true);
  defineSymbol(math, rel, "\u22E9", "\\succnsim", true);
  defineSymbol(math, rel, "\u2ABA", "\\succnapprox", true);
  defineSymbol(math, rel, "\u2246", "\\ncong", true);
  defineSymbol(math, rel, "\u2226", "\\nparallel", true);
  defineSymbol(math, rel, "\u2226", "\\nshortparallel");
  defineSymbol(math, rel, "\u22AF", "\\nVDash", true);
  defineSymbol(math, rel, "\u22EB", "\\ntriangleright");
  defineSymbol(math, rel, "\u22ED", "\\ntrianglerighteq", true);
  defineSymbol(math, rel, "\u228B", "\\supsetneq", true);
  defineSymbol(math, rel, "\u228B", "\\varsupsetneq");
  defineSymbol(math, rel, "\u2ACC", "\\supsetneqq", true);
  defineSymbol(math, rel, "\u2ACC\uFE00", "\\varsupsetneqq");
  defineSymbol(math, rel, "\u22AE", "\\nVdash", true);
  defineSymbol(math, rel, "\u2AB5", "\\precneqq", true);
  defineSymbol(math, rel, "\u2AB6", "\\succneqq", true);
  defineSymbol(math, bin, "\u22B4", "\\unlhd");
  defineSymbol(math, bin, "\u22B5", "\\unrhd");
  defineSymbol(math, rel, "\u219A", "\\nleftarrow", true);
  defineSymbol(math, rel, "\u219B", "\\nrightarrow", true);
  defineSymbol(math, rel, "\u21CD", "\\nLeftarrow", true);
  defineSymbol(math, rel, "\u21CF", "\\nRightarrow", true);
  defineSymbol(math, rel, "\u21AE", "\\nleftrightarrow", true);
  defineSymbol(math, rel, "\u21CE", "\\nLeftrightarrow", true);
  defineSymbol(math, rel, "\u25B3", "\\vartriangle");
  defineSymbol(math, textord, "\u210F", "\\hslash");
  defineSymbol(math, textord, "\u25BD", "\\triangledown");
  defineSymbol(math, textord, "\u25CA", "\\lozenge");
  defineSymbol(math, textord, "\u24C8", "\\circledS");
  defineSymbol(math, textord, "\xAE", "\\circledR", true);
  defineSymbol(text, textord, "\xAE", "\\circledR");
  defineSymbol(text, textord, "\xAE", "\\textregistered");
  defineSymbol(math, textord, "\u2221", "\\measuredangle", true);
  defineSymbol(math, textord, "\u2204", "\\nexists");
  defineSymbol(math, textord, "\u2127", "\\mho");
  defineSymbol(math, textord, "\u2132", "\\Finv", true);
  defineSymbol(math, textord, "\u2141", "\\Game", true);
  defineSymbol(math, textord, "\u2035", "\\backprime");
  defineSymbol(math, textord, "\u2036", "\\backdprime");
  defineSymbol(math, textord, "\u2037", "\\backtrprime");
  defineSymbol(math, textord, "\u25B2", "\\blacktriangle");
  defineSymbol(math, textord, "\u25BC", "\\blacktriangledown");
  defineSymbol(math, textord, "\u25A0", "\\blacksquare");
  defineSymbol(math, textord, "\u29EB", "\\blacklozenge");
  defineSymbol(math, textord, "\u2605", "\\bigstar");
  defineSymbol(math, textord, "\u2222", "\\sphericalangle", true);
  defineSymbol(math, textord, "\u2201", "\\complement", true);
  defineSymbol(math, textord, "\u2571", "\\diagup");
  defineSymbol(math, textord, "\u2572", "\\diagdown");
  defineSymbol(math, textord, "\u25A1", "\\square");
  defineSymbol(math, textord, "\u25A1", "\\Box");
  defineSymbol(math, textord, "\u25CA", "\\Diamond");
  defineSymbol(math, textord, "\xA5", "\\yen", true);
  defineSymbol(text, textord, "\xA5", "\\yen", true);
  defineSymbol(math, textord, "\u2713", "\\checkmark", true);
  defineSymbol(text, textord, "\u2713", "\\checkmark");
  defineSymbol(math, textord, "\u2717", "\\ballotx", true);
  defineSymbol(text, textord, "\u2717", "\\ballotx");
  defineSymbol(text, textord, "\u2022", "\\textbullet");
  defineSymbol(math, textord, "\u2136", "\\beth", true);
  defineSymbol(math, textord, "\u2138", "\\daleth", true);
  defineSymbol(math, textord, "\u2137", "\\gimel", true);
  defineSymbol(math, textord, "\u03DD", "\\digamma", true);
  defineSymbol(math, textord, "\u03F0", "\\varkappa");
  defineSymbol(math, open, "\u231C", "\\ulcorner", true);
  defineSymbol(math, close, "\u231D", "\\urcorner", true);
  defineSymbol(math, open, "\u231E", "\\llcorner", true);
  defineSymbol(math, close, "\u231F", "\\lrcorner", true);
  defineSymbol(math, rel, "\u2266", "\\leqq", true);
  defineSymbol(math, rel, "\u2A7D", "\\leqslant", true);
  defineSymbol(math, rel, "\u2A95", "\\eqslantless", true);
  defineSymbol(math, rel, "\u2272", "\\lesssim", true);
  defineSymbol(math, rel, "\u2A85", "\\lessapprox", true);
  defineSymbol(math, rel, "\u224A", "\\approxeq", true);
  defineSymbol(math, bin, "\u22D6", "\\lessdot");
  defineSymbol(math, rel, "\u22D8", "\\lll", true);
  defineSymbol(math, rel, "\u2276", "\\lessgtr", true);
  defineSymbol(math, rel, "\u22DA", "\\lesseqgtr", true);
  defineSymbol(math, rel, "\u2A8B", "\\lesseqqgtr", true);
  defineSymbol(math, rel, "\u2251", "\\doteqdot");
  defineSymbol(math, rel, "\u2253", "\\risingdotseq", true);
  defineSymbol(math, rel, "\u2252", "\\fallingdotseq", true);
  defineSymbol(math, rel, "\u223D", "\\backsim", true);
  defineSymbol(math, rel, "\u22CD", "\\backsimeq", true);
  defineSymbol(math, rel, "\u2AC5", "\\subseteqq", true);
  defineSymbol(math, rel, "\u22D0", "\\Subset", true);
  defineSymbol(math, rel, "\u228F", "\\sqsubset", true);
  defineSymbol(math, rel, "\u227C", "\\preccurlyeq", true);
  defineSymbol(math, rel, "\u22DE", "\\curlyeqprec", true);
  defineSymbol(math, rel, "\u227E", "\\precsim", true);
  defineSymbol(math, rel, "\u2AB7", "\\precapprox", true);
  defineSymbol(math, rel, "\u22B2", "\\vartriangleleft");
  defineSymbol(math, rel, "\u22B4", "\\trianglelefteq");
  defineSymbol(math, rel, "\u22A8", "\\vDash", true);
  defineSymbol(math, rel, "\u22AB", "\\VDash", true);
  defineSymbol(math, rel, "\u22AA", "\\Vvdash", true);
  defineSymbol(math, rel, "\u2323", "\\smallsmile");
  defineSymbol(math, rel, "\u2322", "\\smallfrown");
  defineSymbol(math, rel, "\u224F", "\\bumpeq", true);
  defineSymbol(math, rel, "\u224E", "\\Bumpeq", true);
  defineSymbol(math, rel, "\u2267", "\\geqq", true);
  defineSymbol(math, rel, "\u2A7E", "\\geqslant", true);
  defineSymbol(math, rel, "\u2A96", "\\eqslantgtr", true);
  defineSymbol(math, rel, "\u2273", "\\gtrsim", true);
  defineSymbol(math, rel, "\u2A86", "\\gtrapprox", true);
  defineSymbol(math, bin, "\u22D7", "\\gtrdot");
  defineSymbol(math, rel, "\u22D9", "\\ggg", true);
  defineSymbol(math, rel, "\u2277", "\\gtrless", true);
  defineSymbol(math, rel, "\u22DB", "\\gtreqless", true);
  defineSymbol(math, rel, "\u2A8C", "\\gtreqqless", true);
  defineSymbol(math, rel, "\u2256", "\\eqcirc", true);
  defineSymbol(math, rel, "\u2257", "\\circeq", true);
  defineSymbol(math, rel, "\u225C", "\\triangleq", true);
  defineSymbol(math, rel, "\u223C", "\\thicksim");
  defineSymbol(math, rel, "\u2248", "\\thickapprox");
  defineSymbol(math, rel, "\u2AC6", "\\supseteqq", true);
  defineSymbol(math, rel, "\u22D1", "\\Supset", true);
  defineSymbol(math, rel, "\u2290", "\\sqsupset", true);
  defineSymbol(math, rel, "\u227D", "\\succcurlyeq", true);
  defineSymbol(math, rel, "\u22DF", "\\curlyeqsucc", true);
  defineSymbol(math, rel, "\u227F", "\\succsim", true);
  defineSymbol(math, rel, "\u2AB8", "\\succapprox", true);
  defineSymbol(math, rel, "\u22B3", "\\vartriangleright");
  defineSymbol(math, rel, "\u22B5", "\\trianglerighteq");
  defineSymbol(math, rel, "\u22A9", "\\Vdash", true);
  defineSymbol(math, rel, "\u2223", "\\shortmid");
  defineSymbol(math, rel, "\u2225", "\\shortparallel");
  defineSymbol(math, rel, "\u226C", "\\between", true);
  defineSymbol(math, rel, "\u22D4", "\\pitchfork", true);
  defineSymbol(math, rel, "\u221D", "\\varpropto");
  defineSymbol(math, rel, "\u25C0", "\\blacktriangleleft");
  defineSymbol(math, rel, "\u2234", "\\therefore", true);
  defineSymbol(math, rel, "\u220D", "\\backepsilon");
  defineSymbol(math, rel, "\u25B6", "\\blacktriangleright");
  defineSymbol(math, rel, "\u2235", "\\because", true);
  defineSymbol(math, rel, "\u22D8", "\\llless");
  defineSymbol(math, rel, "\u22D9", "\\gggtr");
  defineSymbol(math, bin, "\u22B2", "\\lhd");
  defineSymbol(math, bin, "\u22B3", "\\rhd");
  defineSymbol(math, rel, "\u2242", "\\eqsim", true);
  defineSymbol(math, rel, "\u2251", "\\Doteq", true);
  defineSymbol(math, rel, "\u297D", "\\strictif", true);
  defineSymbol(math, rel, "\u297C", "\\strictfi", true);
  defineSymbol(math, bin, "\u2214", "\\dotplus", true);
  defineSymbol(math, bin, "\u2216", "\\smallsetminus");
  defineSymbol(math, bin, "\u22D2", "\\Cap", true);
  defineSymbol(math, bin, "\u22D3", "\\Cup", true);
  defineSymbol(math, bin, "\u2A5E", "\\doublebarwedge", true);
  defineSymbol(math, bin, "\u229F", "\\boxminus", true);
  defineSymbol(math, bin, "\u229E", "\\boxplus", true);
  defineSymbol(math, bin, "\u29C4", "\\boxslash", true);
  defineSymbol(math, bin, "\u22C7", "\\divideontimes", true);
  defineSymbol(math, bin, "\u22C9", "\\ltimes", true);
  defineSymbol(math, bin, "\u22CA", "\\rtimes", true);
  defineSymbol(math, bin, "\u22CB", "\\leftthreetimes", true);
  defineSymbol(math, bin, "\u22CC", "\\rightthreetimes", true);
  defineSymbol(math, bin, "\u22CF", "\\curlywedge", true);
  defineSymbol(math, bin, "\u22CE", "\\curlyvee", true);
  defineSymbol(math, bin, "\u229D", "\\circleddash", true);
  defineSymbol(math, bin, "\u229B", "\\circledast", true);
  defineSymbol(math, bin, "\u22BA", "\\intercal", true);
  defineSymbol(math, bin, "\u22D2", "\\doublecap");
  defineSymbol(math, bin, "\u22D3", "\\doublecup");
  defineSymbol(math, bin, "\u22A0", "\\boxtimes", true);
  defineSymbol(math, bin, "\u22C8", "\\bowtie", true);
  defineSymbol(math, bin, "\u22C8", "\\Join");
  defineSymbol(math, bin, "\u27D5", "\\leftouterjoin", true);
  defineSymbol(math, bin, "\u27D6", "\\rightouterjoin", true);
  defineSymbol(math, bin, "\u27D7", "\\fullouterjoin", true);
  defineSymbol(math, bin, "\u2238", "\\dotminus", true);
  defineSymbol(math, bin, "\u27D1", "\\wedgedot", true);
  defineSymbol(math, bin, "\u27C7", "\\veedot", true);
  defineSymbol(math, bin, "\u2A62", "\\doublebarvee", true);
  defineSymbol(math, bin, "\u2A63", "\\veedoublebar", true);
  defineSymbol(math, bin, "\u2A5F", "\\wedgebar", true);
  defineSymbol(math, bin, "\u2A60", "\\wedgedoublebar", true);
  defineSymbol(math, bin, "\u2A54", "\\Vee", true);
  defineSymbol(math, bin, "\u2A53", "\\Wedge", true);
  defineSymbol(math, bin, "\u2A43", "\\barcap", true);
  defineSymbol(math, bin, "\u2A42", "\\barcup", true);
  defineSymbol(math, bin, "\u2A48", "\\capbarcup", true);
  defineSymbol(math, bin, "\u2A40", "\\capdot", true);
  defineSymbol(math, bin, "\u2A47", "\\capovercup", true);
  defineSymbol(math, bin, "\u2A46", "\\cupovercap", true);
  defineSymbol(math, bin, "\u2A4D", "\\closedvarcap", true);
  defineSymbol(math, bin, "\u2A4C", "\\closedvarcup", true);
  defineSymbol(math, bin, "\u2A2A", "\\minusdot", true);
  defineSymbol(math, bin, "\u2A2B", "\\minusfdots", true);
  defineSymbol(math, bin, "\u2A2C", "\\minusrdots", true);
  defineSymbol(math, bin, "\u22BB", "\\Xor", true);
  defineSymbol(math, bin, "\u22BC", "\\Nand", true);
  defineSymbol(math, bin, "\u22BD", "\\Nor", true);
  defineSymbol(math, bin, "\u22BD", "\\barvee");
  defineSymbol(math, bin, "\u2AF4", "\\interleave", true);
  defineSymbol(math, bin, "\u29E2", "\\shuffle", true);
  defineSymbol(math, bin, "\u2AF6", "\\threedotcolon", true);
  defineSymbol(math, bin, "\u2982", "\\typecolon", true);
  defineSymbol(math, bin, "\u223E", "\\invlazys", true);
  defineSymbol(math, bin, "\u2A4B", "\\twocaps", true);
  defineSymbol(math, bin, "\u2A4A", "\\twocups", true);
  defineSymbol(math, bin, "\u2A4E", "\\Sqcap", true);
  defineSymbol(math, bin, "\u2A4F", "\\Sqcup", true);
  defineSymbol(math, bin, "\u2A56", "\\veeonvee", true);
  defineSymbol(math, bin, "\u2A55", "\\wedgeonwedge", true);
  defineSymbol(math, bin, "\u29D7", "\\blackhourglass", true);
  defineSymbol(math, bin, "\u29C6", "\\boxast", true);
  defineSymbol(math, bin, "\u29C8", "\\boxbox", true);
  defineSymbol(math, bin, "\u29C7", "\\boxcircle", true);
  defineSymbol(math, bin, "\u229C", "\\circledequal", true);
  defineSymbol(math, bin, "\u29B7", "\\circledparallel", true);
  defineSymbol(math, bin, "\u29B6", "\\circledvert", true);
  defineSymbol(math, bin, "\u29B5", "\\circlehbar", true);
  defineSymbol(math, bin, "\u27E1", "\\concavediamond", true);
  defineSymbol(math, bin, "\u27E2", "\\concavediamondtickleft", true);
  defineSymbol(math, bin, "\u27E3", "\\concavediamondtickright", true);
  defineSymbol(math, bin, "\u22C4", "\\diamond", true);
  defineSymbol(math, bin, "\u29D6", "\\hourglass", true);
  defineSymbol(math, bin, "\u27E0", "\\lozengeminus", true);
  defineSymbol(math, bin, "\u233D", "\\obar", true);
  defineSymbol(math, bin, "\u29B8", "\\obslash", true);
  defineSymbol(math, bin, "\u2A38", "\\odiv", true);
  defineSymbol(math, bin, "\u29C1", "\\ogreaterthan", true);
  defineSymbol(math, bin, "\u29C0", "\\olessthan", true);
  defineSymbol(math, bin, "\u29B9", "\\operp", true);
  defineSymbol(math, bin, "\u2A37", "\\Otimes", true);
  defineSymbol(math, bin, "\u2A36", "\\otimeshat", true);
  defineSymbol(math, bin, "\u22C6", "\\star", true);
  defineSymbol(math, bin, "\u25B3", "\\triangle", true);
  defineSymbol(math, bin, "\u2A3A", "\\triangleminus", true);
  defineSymbol(math, bin, "\u2A39", "\\triangleplus", true);
  defineSymbol(math, bin, "\u2A3B", "\\triangletimes", true);
  defineSymbol(math, bin, "\u27E4", "\\whitesquaretickleft", true);
  defineSymbol(math, bin, "\u27E5", "\\whitesquaretickright", true);
  defineSymbol(math, bin, "\u2A33", "\\smashtimes", true);
  defineSymbol(math, rel, "\u21E2", "\\dashrightarrow", true);
  defineSymbol(math, rel, "\u21E0", "\\dashleftarrow", true);
  defineSymbol(math, rel, "\u21C7", "\\leftleftarrows", true);
  defineSymbol(math, rel, "\u21C6", "\\leftrightarrows", true);
  defineSymbol(math, rel, "\u21DA", "\\Lleftarrow", true);
  defineSymbol(math, rel, "\u219E", "\\twoheadleftarrow", true);
  defineSymbol(math, rel, "\u21A2", "\\leftarrowtail", true);
  defineSymbol(math, rel, "\u21AB", "\\looparrowleft", true);
  defineSymbol(math, rel, "\u21CB", "\\leftrightharpoons", true);
  defineSymbol(math, rel, "\u21B6", "\\curvearrowleft", true);
  defineSymbol(math, rel, "\u21BA", "\\circlearrowleft", true);
  defineSymbol(math, rel, "\u21B0", "\\Lsh", true);
  defineSymbol(math, rel, "\u21C8", "\\upuparrows", true);
  defineSymbol(math, rel, "\u21BF", "\\upharpoonleft", true);
  defineSymbol(math, rel, "\u21C3", "\\downharpoonleft", true);
  defineSymbol(math, rel, "\u22B6", "\\origof", true);
  defineSymbol(math, rel, "\u22B7", "\\imageof", true);
  defineSymbol(math, rel, "\u22B8", "\\multimap", true);
  defineSymbol(math, rel, "\u21AD", "\\leftrightsquigarrow", true);
  defineSymbol(math, rel, "\u21C9", "\\rightrightarrows", true);
  defineSymbol(math, rel, "\u21C4", "\\rightleftarrows", true);
  defineSymbol(math, rel, "\u21A0", "\\twoheadrightarrow", true);
  defineSymbol(math, rel, "\u21A3", "\\rightarrowtail", true);
  defineSymbol(math, rel, "\u21AC", "\\looparrowright", true);
  defineSymbol(math, rel, "\u21B7", "\\curvearrowright", true);
  defineSymbol(math, rel, "\u21BB", "\\circlearrowright", true);
  defineSymbol(math, rel, "\u21B1", "\\Rsh", true);
  defineSymbol(math, rel, "\u21CA", "\\downdownarrows", true);
  defineSymbol(math, rel, "\u21BE", "\\upharpoonright", true);
  defineSymbol(math, rel, "\u21C2", "\\downharpoonright", true);
  defineSymbol(math, rel, "\u21DD", "\\rightsquigarrow", true);
  defineSymbol(math, rel, "\u21DD", "\\leadsto");
  defineSymbol(math, rel, "\u21DB", "\\Rrightarrow", true);
  defineSymbol(math, rel, "\u21BE", "\\restriction");
  defineSymbol(math, textord, "\u2018", "`");
  defineSymbol(math, textord, "$", "\\$");
  defineSymbol(text, textord, "$", "\\$");
  defineSymbol(text, textord, "$", "\\textdollar");
  defineSymbol(math, textord, "\xA2", "\\cent");
  defineSymbol(text, textord, "\xA2", "\\cent");
  defineSymbol(math, textord, "%", "\\%");
  defineSymbol(text, textord, "%", "\\%");
  defineSymbol(math, textord, "_", "\\_");
  defineSymbol(text, textord, "_", "\\_");
  defineSymbol(text, textord, "_", "\\textunderscore");
  defineSymbol(text, textord, "\u2423", "\\textvisiblespace", true);
  defineSymbol(math, textord, "\u2220", "\\angle", true);
  defineSymbol(math, textord, "\u221E", "\\infty", true);
  defineSymbol(math, textord, "\u2032", "\\prime");
  defineSymbol(math, textord, "\u2033", "\\dprime");
  defineSymbol(math, textord, "\u2034", "\\trprime");
  defineSymbol(math, textord, "\u2057", "\\qprime");
  defineSymbol(math, textord, "\u25B3", "\\triangle");
  defineSymbol(text, textord, "\u0391", "\\Alpha", true);
  defineSymbol(text, textord, "\u0392", "\\Beta", true);
  defineSymbol(text, textord, "\u0393", "\\Gamma", true);
  defineSymbol(text, textord, "\u0394", "\\Delta", true);
  defineSymbol(text, textord, "\u0395", "\\Epsilon", true);
  defineSymbol(text, textord, "\u0396", "\\Zeta", true);
  defineSymbol(text, textord, "\u0397", "\\Eta", true);
  defineSymbol(text, textord, "\u0398", "\\Theta", true);
  defineSymbol(text, textord, "\u0399", "\\Iota", true);
  defineSymbol(text, textord, "\u039A", "\\Kappa", true);
  defineSymbol(text, textord, "\u039B", "\\Lambda", true);
  defineSymbol(text, textord, "\u039C", "\\Mu", true);
  defineSymbol(text, textord, "\u039D", "\\Nu", true);
  defineSymbol(text, textord, "\u039E", "\\Xi", true);
  defineSymbol(text, textord, "\u039F", "\\Omicron", true);
  defineSymbol(text, textord, "\u03A0", "\\Pi", true);
  defineSymbol(text, textord, "\u03A1", "\\Rho", true);
  defineSymbol(text, textord, "\u03A3", "\\Sigma", true);
  defineSymbol(text, textord, "\u03A4", "\\Tau", true);
  defineSymbol(text, textord, "\u03A5", "\\Upsilon", true);
  defineSymbol(text, textord, "\u03A6", "\\Phi", true);
  defineSymbol(text, textord, "\u03A7", "\\Chi", true);
  defineSymbol(text, textord, "\u03A8", "\\Psi", true);
  defineSymbol(text, textord, "\u03A9", "\\Omega", true);
  defineSymbol(math, mathord, "\u0391", "\\Alpha", true);
  defineSymbol(math, mathord, "\u0392", "\\Beta", true);
  defineSymbol(math, mathord, "\u0393", "\\Gamma", true);
  defineSymbol(math, mathord, "\u0394", "\\Delta", true);
  defineSymbol(math, mathord, "\u0395", "\\Epsilon", true);
  defineSymbol(math, mathord, "\u0396", "\\Zeta", true);
  defineSymbol(math, mathord, "\u0397", "\\Eta", true);
  defineSymbol(math, mathord, "\u0398", "\\Theta", true);
  defineSymbol(math, mathord, "\u0399", "\\Iota", true);
  defineSymbol(math, mathord, "\u039A", "\\Kappa", true);
  defineSymbol(math, mathord, "\u039B", "\\Lambda", true);
  defineSymbol(math, mathord, "\u039C", "\\Mu", true);
  defineSymbol(math, mathord, "\u039D", "\\Nu", true);
  defineSymbol(math, mathord, "\u039E", "\\Xi", true);
  defineSymbol(math, mathord, "\u039F", "\\Omicron", true);
  defineSymbol(math, mathord, "\u03A0", "\\Pi", true);
  defineSymbol(math, mathord, "\u03A1", "\\Rho", true);
  defineSymbol(math, mathord, "\u03A3", "\\Sigma", true);
  defineSymbol(math, mathord, "\u03A4", "\\Tau", true);
  defineSymbol(math, mathord, "\u03A5", "\\Upsilon", true);
  defineSymbol(math, mathord, "\u03A6", "\\Phi", true);
  defineSymbol(math, mathord, "\u03A7", "\\Chi", true);
  defineSymbol(math, mathord, "\u03A8", "\\Psi", true);
  defineSymbol(math, mathord, "\u03A9", "\\Omega", true);
  defineSymbol(math, open, "\xAC", "\\neg", true);
  defineSymbol(math, open, "\xAC", "\\lnot");
  defineSymbol(math, textord, "\u22A4", "\\top");
  defineSymbol(math, textord, "\u22A5", "\\bot");
  defineSymbol(math, textord, "\u2205", "\\emptyset");
  defineSymbol(math, textord, "\u2300", "\\varnothing");
  defineSymbol(math, mathord, "\u03B1", "\\alpha", true);
  defineSymbol(math, mathord, "\u03B2", "\\beta", true);
  defineSymbol(math, mathord, "\u03B3", "\\gamma", true);
  defineSymbol(math, mathord, "\u03B4", "\\delta", true);
  defineSymbol(math, mathord, "\u03F5", "\\epsilon", true);
  defineSymbol(math, mathord, "\u03B6", "\\zeta", true);
  defineSymbol(math, mathord, "\u03B7", "\\eta", true);
  defineSymbol(math, mathord, "\u03B8", "\\theta", true);
  defineSymbol(math, mathord, "\u03B9", "\\iota", true);
  defineSymbol(math, mathord, "\u03BA", "\\kappa", true);
  defineSymbol(math, mathord, "\u03BB", "\\lambda", true);
  defineSymbol(math, mathord, "\u03BC", "\\mu", true);
  defineSymbol(math, mathord, "\u03BD", "\\nu", true);
  defineSymbol(math, mathord, "\u03BE", "\\xi", true);
  defineSymbol(math, mathord, "\u03BF", "\\omicron", true);
  defineSymbol(math, mathord, "\u03C0", "\\pi", true);
  defineSymbol(math, mathord, "\u03C1", "\\rho", true);
  defineSymbol(math, mathord, "\u03C3", "\\sigma", true);
  defineSymbol(math, mathord, "\u03C4", "\\tau", true);
  defineSymbol(math, mathord, "\u03C5", "\\upsilon", true);
  defineSymbol(math, mathord, "\u03D5", "\\phi", true);
  defineSymbol(math, mathord, "\u03C7", "\\chi", true);
  defineSymbol(math, mathord, "\u03C8", "\\psi", true);
  defineSymbol(math, mathord, "\u03C9", "\\omega", true);
  defineSymbol(math, mathord, "\u03B5", "\\varepsilon", true);
  defineSymbol(math, mathord, "\u03D1", "\\vartheta", true);
  defineSymbol(math, mathord, "\u03D6", "\\varpi", true);
  defineSymbol(math, mathord, "\u03F1", "\\varrho", true);
  defineSymbol(math, mathord, "\u03C2", "\\varsigma", true);
  defineSymbol(math, mathord, "\u03C6", "\\varphi", true);
  defineSymbol(math, mathord, "\u03D8", "\\Coppa", true);
  defineSymbol(math, mathord, "\u03D9", "\\coppa", true);
  defineSymbol(math, mathord, "\u03D9", "\\varcoppa", true);
  defineSymbol(math, mathord, "\u03DE", "\\Koppa", true);
  defineSymbol(math, mathord, "\u03DF", "\\koppa", true);
  defineSymbol(math, mathord, "\u03E0", "\\Sampi", true);
  defineSymbol(math, mathord, "\u03E1", "\\sampi", true);
  defineSymbol(math, mathord, "\u03DA", "\\Stigma", true);
  defineSymbol(math, mathord, "\u03DB", "\\stigma", true);
  defineSymbol(math, mathord, "\u2AEB", "\\Bot");
  defineSymbol(math, textord, "\xF0", "\\eth", true);
  defineSymbol(text, textord, "\xF0", "\xF0");
  defineSymbol(math, textord, "\xC5", "\\AA");
  defineSymbol(text, textord, "\xC5", "\\AA", true);
  defineSymbol(math, textord, "\xC6", "\\AE", true);
  defineSymbol(text, textord, "\xC6", "\\AE", true);
  defineSymbol(math, textord, "\xD0", "\\DH", true);
  defineSymbol(text, textord, "\xD0", "\\DH", true);
  defineSymbol(math, textord, "\xDE", "\\TH", true);
  defineSymbol(text, textord, "\xDE", "\\TH", true);
  defineSymbol(math, textord, "\xDF", "\\ss", true);
  defineSymbol(text, textord, "\xDF", "\\ss", true);
  defineSymbol(math, textord, "\xE5", "\\aa");
  defineSymbol(text, textord, "\xE5", "\\aa", true);
  defineSymbol(math, textord, "\xE6", "\\ae", true);
  defineSymbol(text, textord, "\xE6", "\\ae", true);
  defineSymbol(math, textord, "\xF0", "\\dh");
  defineSymbol(text, textord, "\xF0", "\\dh", true);
  defineSymbol(math, textord, "\xFE", "\\th", true);
  defineSymbol(text, textord, "\xFE", "\\th", true);
  defineSymbol(math, textord, "\u0110", "\\DJ", true);
  defineSymbol(text, textord, "\u0110", "\\DJ", true);
  defineSymbol(math, textord, "\u0111", "\\dj", true);
  defineSymbol(text, textord, "\u0111", "\\dj", true);
  defineSymbol(math, textord, "\u0141", "\\L", true);
  defineSymbol(text, textord, "\u0141", "\\L", true);
  defineSymbol(math, textord, "\u0141", "\\l", true);
  defineSymbol(text, textord, "\u0141", "\\l", true);
  defineSymbol(math, textord, "\u014A", "\\NG", true);
  defineSymbol(text, textord, "\u014A", "\\NG", true);
  defineSymbol(math, textord, "\u014B", "\\ng", true);
  defineSymbol(text, textord, "\u014B", "\\ng", true);
  defineSymbol(math, textord, "\u0152", "\\OE", true);
  defineSymbol(text, textord, "\u0152", "\\OE", true);
  defineSymbol(math, textord, "\u0153", "\\oe", true);
  defineSymbol(text, textord, "\u0153", "\\oe", true);
  defineSymbol(math, bin, "\u2217", "\u2217", true);
  defineSymbol(math, bin, "+", "+");
  defineSymbol(math, bin, "\u2217", "*");
  defineSymbol(math, bin, "\u2044", "/", true);
  defineSymbol(math, bin, "\u2044", "\u2044");
  defineSymbol(math, bin, "\u2212", "-", true);
  defineSymbol(math, bin, "\u22C5", "\\cdot", true);
  defineSymbol(math, bin, "\u2218", "\\circ", true);
  defineSymbol(math, bin, "\xF7", "\\div", true);
  defineSymbol(math, bin, "\xB1", "\\pm", true);
  defineSymbol(math, bin, "\xD7", "\\times", true);
  defineSymbol(math, bin, "\u2229", "\\cap", true);
  defineSymbol(math, bin, "\u222A", "\\cup", true);
  defineSymbol(math, bin, "\u2216", "\\setminus", true);
  defineSymbol(math, bin, "\u2227", "\\land");
  defineSymbol(math, bin, "\u2228", "\\lor");
  defineSymbol(math, bin, "\u2227", "\\wedge", true);
  defineSymbol(math, bin, "\u2228", "\\vee", true);
  defineSymbol(math, open, "\u27E6", "\\llbracket", true);
  defineSymbol(math, close, "\u27E7", "\\rrbracket", true);
  defineSymbol(math, open, "\u27E8", "\\langle", true);
  defineSymbol(math, open, "\u27EA", "\\lAngle", true);
  defineSymbol(math, open, "\u2989", "\\llangle", true);
  defineSymbol(math, open, "|", "\\lvert");
  defineSymbol(math, open, "\u2016", "\\lVert", true);
  defineSymbol(math, textord, "!", "\\oc");
  defineSymbol(math, textord, "?", "\\wn");
  defineSymbol(math, textord, "\u2193", "\\shpos");
  defineSymbol(math, textord, "\u2195", "\\shift");
  defineSymbol(math, textord, "\u2191", "\\shneg");
  defineSymbol(math, close, "?", "?");
  defineSymbol(math, close, "!", "!");
  defineSymbol(math, close, "\u203C", "\u203C");
  defineSymbol(math, close, "\u27E9", "\\rangle", true);
  defineSymbol(math, close, "\u27EB", "\\rAngle", true);
  defineSymbol(math, close, "\u298A", "\\rrangle", true);
  defineSymbol(math, close, "|", "\\rvert");
  defineSymbol(math, close, "\u2016", "\\rVert");
  defineSymbol(math, open, "\u2983", "\\lBrace", true);
  defineSymbol(math, close, "\u2984", "\\rBrace", true);
  defineSymbol(math, rel, "=", "\\equal", true);
  defineSymbol(math, rel, ":", ":");
  defineSymbol(math, rel, "\u2248", "\\approx", true);
  defineSymbol(math, rel, "\u2245", "\\cong", true);
  defineSymbol(math, rel, "\u2265", "\\ge");
  defineSymbol(math, rel, "\u2265", "\\geq", true);
  defineSymbol(math, rel, "\u2190", "\\gets");
  defineSymbol(math, rel, ">", "\\gt", true);
  defineSymbol(math, rel, "\u2208", "\\in", true);
  defineSymbol(math, rel, "\u2209", "\\notin", true);
  defineSymbol(math, rel, "\uE020", "\\@not");
  defineSymbol(math, rel, "\u2282", "\\subset", true);
  defineSymbol(math, rel, "\u2283", "\\supset", true);
  defineSymbol(math, rel, "\u2286", "\\subseteq", true);
  defineSymbol(math, rel, "\u2287", "\\supseteq", true);
  defineSymbol(math, rel, "\u2288", "\\nsubseteq", true);
  defineSymbol(math, rel, "\u2288", "\\nsubseteqq");
  defineSymbol(math, rel, "\u2289", "\\nsupseteq", true);
  defineSymbol(math, rel, "\u2289", "\\nsupseteqq");
  defineSymbol(math, rel, "\u22A8", "\\models");
  defineSymbol(math, rel, "\u2190", "\\leftarrow", true);
  defineSymbol(math, rel, "\u2264", "\\le");
  defineSymbol(math, rel, "\u2264", "\\leq", true);
  defineSymbol(math, rel, "<", "\\lt", true);
  defineSymbol(math, rel, "\u2192", "\\rightarrow", true);
  defineSymbol(math, rel, "\u2192", "\\to");
  defineSymbol(math, rel, "\u2271", "\\ngeq", true);
  defineSymbol(math, rel, "\u2271", "\\ngeqq");
  defineSymbol(math, rel, "\u2271", "\\ngeqslant");
  defineSymbol(math, rel, "\u2270", "\\nleq", true);
  defineSymbol(math, rel, "\u2270", "\\nleqq");
  defineSymbol(math, rel, "\u2270", "\\nleqslant");
  defineSymbol(math, rel, "\u2AEB", "\\Perp", true);
  defineSymbol(math, spacing, "\xA0", "\\ ");
  defineSymbol(math, spacing, "\xA0", "\\space");
  defineSymbol(math, spacing, "\xA0", "\\nobreakspace");
  defineSymbol(text, spacing, "\xA0", "\\ ");
  defineSymbol(text, spacing, "\xA0", " ");
  defineSymbol(text, spacing, "\xA0", "\\space");
  defineSymbol(text, spacing, "\xA0", "\\nobreakspace");
  defineSymbol(math, spacing, null, "\\nobreak");
  defineSymbol(math, spacing, null, "\\allowbreak");
  defineSymbol(math, punct, ",", ",");
  defineSymbol(text, punct, ":", ":");
  defineSymbol(math, punct, ";", ";");
  defineSymbol(math, bin, "\u22BC", "\\barwedge");
  defineSymbol(math, bin, "\u22BB", "\\veebar");
  defineSymbol(math, bin, "\u2299", "\\odot", true);
  defineSymbol(math, bin, "\u2295\uFE0E", "\\oplus");
  defineSymbol(math, bin, "\u2297", "\\otimes", true);
  defineSymbol(math, textord, "\u2202", "\\partial", true);
  defineSymbol(math, bin, "\u2298", "\\oslash", true);
  defineSymbol(math, bin, "\u229A", "\\circledcirc", true);
  defineSymbol(math, bin, "\u22A1", "\\boxdot", true);
  defineSymbol(math, bin, "\u25B3", "\\bigtriangleup");
  defineSymbol(math, bin, "\u25BD", "\\bigtriangledown");
  defineSymbol(math, bin, "\u2020", "\\dagger");
  defineSymbol(math, bin, "\u22C4", "\\diamond");
  defineSymbol(math, bin, "\u25C3", "\\triangleleft");
  defineSymbol(math, bin, "\u25B9", "\\triangleright");
  defineSymbol(math, open, "{", "\\{");
  defineSymbol(text, textord, "{", "\\{");
  defineSymbol(text, textord, "{", "\\textbraceleft");
  defineSymbol(math, close, "}", "\\}");
  defineSymbol(text, textord, "}", "\\}");
  defineSymbol(text, textord, "}", "\\textbraceright");
  defineSymbol(math, open, "{", "\\lbrace");
  defineSymbol(math, close, "}", "\\rbrace");
  defineSymbol(math, open, "[", "\\lbrack", true);
  defineSymbol(text, textord, "[", "\\lbrack", true);
  defineSymbol(math, close, "]", "\\rbrack", true);
  defineSymbol(text, textord, "]", "\\rbrack", true);
  defineSymbol(math, open, "(", "\\lparen", true);
  defineSymbol(math, close, ")", "\\rparen", true);
  defineSymbol(math, open, "\u2987", "\\llparenthesis", true);
  defineSymbol(math, close, "\u2988", "\\rrparenthesis", true);
  defineSymbol(text, textord, "<", "\\textless", true);
  defineSymbol(text, textord, ">", "\\textgreater", true);
  defineSymbol(math, open, "\u230A", "\\lfloor", true);
  defineSymbol(math, close, "\u230B", "\\rfloor", true);
  defineSymbol(math, open, "\u2308", "\\lceil", true);
  defineSymbol(math, close, "\u2309", "\\rceil", true);
  defineSymbol(math, textord, "\\", "\\backslash");
  defineSymbol(math, textord, "|", "|");
  defineSymbol(math, textord, "|", "\\vert");
  defineSymbol(text, textord, "|", "\\textbar", true);
  defineSymbol(math, textord, "\u2016", "\\|");
  defineSymbol(math, textord, "\u2016", "\\Vert");
  defineSymbol(text, textord, "\u2016", "\\textbardbl");
  defineSymbol(text, textord, "~", "\\textasciitilde");
  defineSymbol(text, textord, "\\", "\\textbackslash");
  defineSymbol(text, textord, "^", "\\textasciicircum");
  defineSymbol(math, rel, "\u2191", "\\uparrow", true);
  defineSymbol(math, rel, "\u21D1", "\\Uparrow", true);
  defineSymbol(math, rel, "\u2193", "\\downarrow", true);
  defineSymbol(math, rel, "\u21D3", "\\Downarrow", true);
  defineSymbol(math, rel, "\u2195", "\\updownarrow", true);
  defineSymbol(math, rel, "\u21D5", "\\Updownarrow", true);
  defineSymbol(math, op, "\u2210", "\\coprod");
  defineSymbol(math, op, "\u22C1", "\\bigvee");
  defineSymbol(math, op, "\u22C0", "\\bigwedge");
  defineSymbol(math, op, "\u2A04", "\\biguplus");
  defineSymbol(math, op, "\u2A04", "\\bigcupplus");
  defineSymbol(math, op, "\u2A03", "\\bigcupdot");
  defineSymbol(math, op, "\u2A07", "\\bigdoublevee");
  defineSymbol(math, op, "\u2A08", "\\bigdoublewedge");
  defineSymbol(math, op, "\u22C2", "\\bigcap");
  defineSymbol(math, op, "\u22C3", "\\bigcup");
  defineSymbol(math, op, "\u222B", "\\int");
  defineSymbol(math, op, "\u222B", "\\intop");
  defineSymbol(math, op, "\u222C", "\\iint");
  defineSymbol(math, op, "\u222D", "\\iiint");
  defineSymbol(math, op, "\u220F", "\\prod");
  defineSymbol(math, op, "\u2211", "\\sum");
  defineSymbol(math, op, "\u2A02", "\\bigotimes");
  defineSymbol(math, op, "\u2A01", "\\bigoplus");
  defineSymbol(math, op, "\u2A00", "\\bigodot");
  defineSymbol(math, op, "\u2A09", "\\bigtimes");
  defineSymbol(math, op, "\u222E", "\\oint");
  defineSymbol(math, op, "\u222F", "\\oiint");
  defineSymbol(math, op, "\u2230", "\\oiiint");
  defineSymbol(math, op, "\u2231", "\\intclockwise");
  defineSymbol(math, op, "\u2232", "\\varointclockwise");
  defineSymbol(math, op, "\u2A0C", "\\iiiint");
  defineSymbol(math, op, "\u2A0D", "\\intbar");
  defineSymbol(math, op, "\u2A0E", "\\intBar");
  defineSymbol(math, op, "\u2A0F", "\\fint");
  defineSymbol(math, op, "\u2A12", "\\rppolint");
  defineSymbol(math, op, "\u2A13", "\\scpolint");
  defineSymbol(math, op, "\u2A15", "\\pointint");
  defineSymbol(math, op, "\u2A16", "\\sqint");
  defineSymbol(math, op, "\u2A17", "\\intlarhk");
  defineSymbol(math, op, "\u2A18", "\\intx");
  defineSymbol(math, op, "\u2A19", "\\intcap");
  defineSymbol(math, op, "\u2A1A", "\\intcup");
  defineSymbol(math, op, "\u2A05", "\\bigsqcap");
  defineSymbol(math, op, "\u2A06", "\\bigsqcup");
  defineSymbol(math, op, "\u222B", "\\smallint");
  defineSymbol(text, inner, "\u2026", "\\textellipsis");
  defineSymbol(math, inner, "\u2026", "\\mathellipsis");
  defineSymbol(text, inner, "\u2026", "\\ldots", true);
  defineSymbol(math, inner, "\u2026", "\\ldots", true);
  defineSymbol(math, inner, "\u22F0", "\\iddots", true);
  defineSymbol(math, inner, "\u22EF", "\\@cdots", true);
  defineSymbol(math, inner, "\u22F1", "\\ddots", true);
  defineSymbol(math, textord, "\u22EE", "\\varvdots");
  defineSymbol(text, textord, "\u22EE", "\\varvdots");
  defineSymbol(math, accent, "\xB4", "\\acute");
  defineSymbol(math, accent, "`", "\\grave");
  defineSymbol(math, accent, "\xA8", "\\ddot");
  defineSymbol(math, accent, "\u2026", "\\dddot");
  defineSymbol(math, accent, "\u2026.", "\\ddddot");
  defineSymbol(math, accent, "~", "\\tilde");
  defineSymbol(math, accent, "\u203E", "\\bar");
  defineSymbol(math, accent, "\u02D8", "\\breve");
  defineSymbol(math, accent, "\u02C7", "\\check");
  defineSymbol(math, accent, "^", "\\hat");
  defineSymbol(math, accent, "\u2192", "\\vec");
  defineSymbol(math, accent, "\u02D9", "\\dot");
  defineSymbol(math, accent, "\u02DA", "\\mathring");
  defineSymbol(math, mathord, "\u0131", "\\imath", true);
  defineSymbol(math, mathord, "\u0237", "\\jmath", true);
  defineSymbol(math, textord, "\u0131", "\u0131");
  defineSymbol(math, textord, "\u0237", "\u0237");
  defineSymbol(text, textord, "\u0131", "\\i", true);
  defineSymbol(text, textord, "\u0237", "\\j", true);
  defineSymbol(text, textord, "\xF8", "\\o", true);
  defineSymbol(math, mathord, "\xF8", "\\o", true);
  defineSymbol(text, textord, "\xD8", "\\O", true);
  defineSymbol(math, mathord, "\xD8", "\\O", true);
  defineSymbol(text, accent, "\u02CA", "\\'");
  defineSymbol(text, accent, "\u02CB", "\\`");
  defineSymbol(text, accent, "\u02C6", "\\^");
  defineSymbol(text, accent, "~", "\\~");
  defineSymbol(text, accent, "\u02C9", "\\=");
  defineSymbol(text, accent, "\u02D8", "\\u");
  defineSymbol(text, accent, "\u02D9", "\\.");
  defineSymbol(text, accent, "\xB8", "\\c");
  defineSymbol(text, accent, "\u02DA", "\\r");
  defineSymbol(text, accent, "\u02C7", "\\v");
  defineSymbol(text, accent, "\xA8", '\\"');
  defineSymbol(text, accent, "\u02DD", "\\H");
  defineSymbol(math, accent, "\u02CA", "\\'");
  defineSymbol(math, accent, "\u02CB", "\\`");
  defineSymbol(math, accent, "\u02C6", "\\^");
  defineSymbol(math, accent, "~", "\\~");
  defineSymbol(math, accent, "\u02C9", "\\=");
  defineSymbol(math, accent, "\u02D8", "\\u");
  defineSymbol(math, accent, "\u02D9", "\\.");
  defineSymbol(math, accent, "\xB8", "\\c");
  defineSymbol(math, accent, "\u02DA", "\\r");
  defineSymbol(math, accent, "\u02C7", "\\v");
  defineSymbol(math, accent, "\xA8", '\\"');
  defineSymbol(math, accent, "\u02DD", "\\H");
  var ligatures = {
    "--": true,
    "---": true,
    "``": true,
    "''": true
  };
  defineSymbol(text, textord, "\u2013", "--", true);
  defineSymbol(text, textord, "\u2013", "\\textendash");
  defineSymbol(text, textord, "\u2014", "---", true);
  defineSymbol(text, textord, "\u2014", "\\textemdash");
  defineSymbol(text, textord, "\u2018", "`", true);
  defineSymbol(text, textord, "\u2018", "\\textquoteleft");
  defineSymbol(text, textord, "\u2019", "'", true);
  defineSymbol(text, textord, "\u2019", "\\textquoteright");
  defineSymbol(text, textord, "\u201C", "``", true);
  defineSymbol(text, textord, "\u201C", "\\textquotedblleft");
  defineSymbol(text, textord, "\u201D", "''", true);
  defineSymbol(text, textord, "\u201D", "\\textquotedblright");
  defineSymbol(math, textord, "\xB0", "\\degree", true);
  defineSymbol(text, textord, "\xB0", "\\degree");
  defineSymbol(text, textord, "\xB0", "\\textdegree", true);
  defineSymbol(math, textord, "\xA3", "\\pounds");
  defineSymbol(math, textord, "\xA3", "\\mathsterling", true);
  defineSymbol(text, textord, "\xA3", "\\pounds");
  defineSymbol(text, textord, "\xA3", "\\textsterling", true);
  defineSymbol(math, textord, "\u2720", "\\maltese");
  defineSymbol(text, textord, "\u2720", "\\maltese");
  defineSymbol(math, textord, "\u20AC", "\\euro", true);
  defineSymbol(text, textord, "\u20AC", "\\euro", true);
  defineSymbol(text, textord, "\u20AC", "\\texteuro");
  defineSymbol(math, textord, "\xA9", "\\copyright", true);
  defineSymbol(text, textord, "\xA9", "\\textcopyright");
  defineSymbol(math, textord, "\u2300", "\\diameter", true);
  defineSymbol(text, textord, "\u2300", "\\diameter");
  defineSymbol(math, textord, "\u{1D6E4}", "\\varGamma");
  defineSymbol(math, textord, "\u{1D6E5}", "\\varDelta");
  defineSymbol(math, textord, "\u{1D6E9}", "\\varTheta");
  defineSymbol(math, textord, "\u{1D6EC}", "\\varLambda");
  defineSymbol(math, textord, "\u{1D6EF}", "\\varXi");
  defineSymbol(math, textord, "\u{1D6F1}", "\\varPi");
  defineSymbol(math, textord, "\u{1D6F4}", "\\varSigma");
  defineSymbol(math, textord, "\u{1D6F6}", "\\varUpsilon");
  defineSymbol(math, textord, "\u{1D6F7}", "\\varPhi");
  defineSymbol(math, textord, "\u{1D6F9}", "\\varPsi");
  defineSymbol(math, textord, "\u{1D6FA}", "\\varOmega");
  defineSymbol(text, textord, "\u{1D6E4}", "\\varGamma");
  defineSymbol(text, textord, "\u{1D6E5}", "\\varDelta");
  defineSymbol(text, textord, "\u{1D6E9}", "\\varTheta");
  defineSymbol(text, textord, "\u{1D6EC}", "\\varLambda");
  defineSymbol(text, textord, "\u{1D6EF}", "\\varXi");
  defineSymbol(text, textord, "\u{1D6F1}", "\\varPi");
  defineSymbol(text, textord, "\u{1D6F4}", "\\varSigma");
  defineSymbol(text, textord, "\u{1D6F6}", "\\varUpsilon");
  defineSymbol(text, textord, "\u{1D6F7}", "\\varPhi");
  defineSymbol(text, textord, "\u{1D6F9}", "\\varPsi");
  defineSymbol(text, textord, "\u{1D6FA}", "\\varOmega");
  var mathTextSymbols = '0123456789/@."';
  for (let i = 0; i < mathTextSymbols.length; i++) {
    const ch = mathTextSymbols.charAt(i);
    defineSymbol(math, textord, ch, ch);
  }
  var textSymbols = '0123456789!@*()-=+";:?/.,';
  for (let i = 0; i < textSymbols.length; i++) {
    const ch = textSymbols.charAt(i);
    defineSymbol(text, textord, ch, ch);
  }
  var letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  for (let i = 0; i < letters.length; i++) {
    const ch = letters.charAt(i);
    defineSymbol(math, mathord, ch, ch);
    defineSymbol(text, textord, ch, ch);
  }
  var narrow = "\xC7\xD0\xDE\xE7\xFE\u2102\u210D\u2115\u2119\u211A\u211D\u2124\u210E\u210F\u210A\u210B\u210C\u2110\u2111\u2112\u2113\u2118\u211B\u211C\u212C\u2130\u2131\u2133\u212D\u2128";
  for (let i = 0; i < narrow.length; i++) {
    const ch = narrow.charAt(i);
    defineSymbol(math, mathord, ch, ch);
    defineSymbol(text, textord, ch, ch);
  }
  var wideChar = "";
  for (let i = 0; i < letters.length; i++) {
    wideChar = String.fromCharCode(55349, 56320 + i);
    defineSymbol(math, mathord, wideChar, wideChar);
    defineSymbol(text, textord, wideChar, wideChar);
    wideChar = String.fromCharCode(55349, 56372 + i);
    defineSymbol(math, mathord, wideChar, wideChar);
    defineSymbol(text, textord, wideChar, wideChar);
    wideChar = String.fromCharCode(55349, 56424 + i);
    defineSymbol(math, mathord, wideChar, wideChar);
    defineSymbol(text, textord, wideChar, wideChar);
    wideChar = String.fromCharCode(55349, 56580 + i);
    defineSymbol(math, mathord, wideChar, wideChar);
    defineSymbol(text, textord, wideChar, wideChar);
    wideChar = String.fromCharCode(55349, 56736 + i);
    defineSymbol(math, mathord, wideChar, wideChar);
    defineSymbol(text, textord, wideChar, wideChar);
    wideChar = String.fromCharCode(55349, 56788 + i);
    defineSymbol(math, mathord, wideChar, wideChar);
    defineSymbol(text, textord, wideChar, wideChar);
    wideChar = String.fromCharCode(55349, 56840 + i);
    defineSymbol(math, mathord, wideChar, wideChar);
    defineSymbol(text, textord, wideChar, wideChar);
    wideChar = String.fromCharCode(55349, 56944 + i);
    defineSymbol(math, mathord, wideChar, wideChar);
    defineSymbol(text, textord, wideChar, wideChar);
    wideChar = String.fromCharCode(55349, 56632 + i);
    defineSymbol(math, mathord, wideChar, wideChar);
    defineSymbol(text, textord, wideChar, wideChar);
    const ch = letters.charAt(i);
    wideChar = String.fromCharCode(55349, 56476 + i);
    defineSymbol(math, mathord, ch, wideChar);
    defineSymbol(text, textord, ch, wideChar);
  }
  for (let i = 0; i < 10; i++) {
    wideChar = String.fromCharCode(55349, 57294 + i);
    defineSymbol(math, mathord, wideChar, wideChar);
    defineSymbol(text, textord, wideChar, wideChar);
    wideChar = String.fromCharCode(55349, 57314 + i);
    defineSymbol(math, mathord, wideChar, wideChar);
    defineSymbol(text, textord, wideChar, wideChar);
    wideChar = String.fromCharCode(55349, 57324 + i);
    defineSymbol(math, mathord, wideChar, wideChar);
    defineSymbol(text, textord, wideChar, wideChar);
    wideChar = String.fromCharCode(55349, 57334 + i);
    defineSymbol(math, mathord, wideChar, wideChar);
    defineSymbol(text, textord, wideChar, wideChar);
  }
  function setLineBreaks(expression, wrapMode, isDisplayMode) {
    const mtrs = [];
    let mrows = [];
    let block2 = [];
    let numTopLevelEquals = 0;
    let i = 0;
    while (i < expression.length) {
      while (expression[i] instanceof DocumentFragment) {
        expression.splice(i, 1, ...expression[i].children);
      }
      const node = expression[i];
      if (node.attributes && node.attributes.linebreak && node.attributes.linebreak === "newline") {
        if (block2.length > 0) {
          mrows.push(new MathNode("mrow", block2));
        }
        mrows.push(node);
        block2 = [];
        const mtd = new MathNode("mtd", mrows);
        mtd.style.textAlign = "left";
        mtrs.push(new MathNode("mtr", [mtd]));
        mrows = [];
        i += 1;
        continue;
      }
      block2.push(node);
      if (node.type && node.type === "mo" && node.children.length === 1 && !(node.attributes.form && node.attributes.form === "prefix") && // unary operators
      !Object.prototype.hasOwnProperty.call(node.attributes, "movablelimits")) {
        const ch = node.children[0].text;
        if (wrapMode === "=" && ch === "=") {
          numTopLevelEquals += 1;
          if (numTopLevelEquals > 1) {
            block2.pop();
            const element = new MathNode("mrow", block2);
            mrows.push(element);
            block2 = [node];
          }
        } else if (wrapMode === "tex") {
          const next = i < expression.length - 1 ? expression[i + 1] : null;
          let glueIsFreeOfNobreak = true;
          if (!(next && next.type === "mtext" && next.attributes.linebreak && next.attributes.linebreak === "nobreak")) {
            for (let j = i + 1; j < expression.length; j++) {
              const nd = expression[j];
              if (nd.type && nd.type === "mspace" && !(nd.attributes.linebreak && nd.attributes.linebreak === "newline")) {
                block2.push(nd);
                i += 1;
                if (nd.attributes && nd.attributes.linebreak && nd.attributes.linebreak === "nobreak") {
                  glueIsFreeOfNobreak = false;
                }
              } else {
                break;
              }
            }
          }
          if (glueIsFreeOfNobreak) {
            const element = new MathNode("mrow", block2);
            mrows.push(element);
            block2 = [];
          }
        }
      }
      i += 1;
    }
    if (block2.length > 0) {
      const element = new MathNode("mrow", block2);
      mrows.push(element);
    }
    if (mtrs.length > 0) {
      const mtd = new MathNode("mtd", mrows);
      mtd.style.textAlign = "left";
      const mtr = new MathNode("mtr", [mtd]);
      mtrs.push(mtr);
      const mtable = new MathNode("mtable", mtrs);
      if (!isDisplayMode) {
        mtable.setAttribute("columnalign", "left");
        mtable.setAttribute("rowspacing", "0em");
      }
      return mtable;
    }
    return newDocumentFragment(mrows);
  }
  var makeText = function(text2, mode, style) {
    if (symbols[mode][text2] && symbols[mode][text2].replace && text2.charCodeAt(0) !== 55349 && !(Object.prototype.hasOwnProperty.call(ligatures, text2) && style && (style.fontFamily && style.fontFamily.slice(4, 6) === "tt" || style.font && style.font.slice(4, 6) === "tt"))) {
      text2 = symbols[mode][text2].replace;
    }
    return new TextNode2(text2);
  };
  var copyChar = (newRow, child) => {
    if (newRow.children.length === 0 || newRow.children[newRow.children.length - 1].type !== "mtext") {
      const mtext = new MathNode(
        "mtext",
        [new TextNode2(child.children[0].text)]
      );
      newRow.children.push(mtext);
    } else {
      newRow.children[newRow.children.length - 1].children[0].text += child.children[0].text;
    }
  };
  var consolidateText = (mrow) => {
    if (mrow.type !== "mrow" && mrow.type !== "mstyle") {
      return mrow;
    }
    if (mrow.children.length === 0) {
      return mrow;
    }
    const newRow = new MathNode("mrow");
    for (let i = 0; i < mrow.children.length; i++) {
      const child = mrow.children[i];
      if (child.type === "mtext" && Object.keys(child.attributes).length === 0) {
        copyChar(newRow, child);
      } else if (child.type === "mrow") {
        let canConsolidate = true;
        for (let j = 0; j < child.children.length; j++) {
          const grandChild = child.children[j];
          if (grandChild.type !== "mtext" || Object.keys(child.attributes).length !== 0) {
            canConsolidate = false;
            break;
          }
        }
        if (canConsolidate) {
          for (let j = 0; j < child.children.length; j++) {
            const grandChild = child.children[j];
            copyChar(newRow, grandChild);
          }
        } else {
          newRow.children.push(child);
        }
      } else {
        newRow.children.push(child);
      }
    }
    for (let i = 0; i < newRow.children.length; i++) {
      if (newRow.children[i].type === "mtext") {
        const mtext = newRow.children[i];
        if (mtext.children[0].text.charAt(0) === " ") {
          mtext.children[0].text = "\xA0" + mtext.children[0].text.slice(1);
        }
        const L = mtext.children[0].text.length;
        if (L > 0 && mtext.children[0].text.charAt(L - 1) === " ") {
          mtext.children[0].text = mtext.children[0].text.slice(0, -1) + "\xA0";
        }
        for (const [key, value] of Object.entries(mrow.attributes)) {
          mtext.attributes[key] = value;
        }
      }
    }
    if (newRow.children.length === 1 && newRow.children[0].type === "mtext") {
      return newRow.children[0];
    } else {
      return newRow;
    }
  };
  var makeRow = function(body, semisimple = false) {
    if (body.length === 1 && !(body[0] instanceof DocumentFragment)) {
      return body[0];
    } else if (!semisimple) {
      if (body[0] instanceof MathNode && body[0].type === "mo" && !body[0].attributes.fence) {
        body[0].attributes.lspace = "0em";
        body[0].attributes.rspace = "0em";
      }
      const end = body.length - 1;
      if (body[end] instanceof MathNode && body[end].type === "mo" && !body[end].attributes.fence) {
        body[end].attributes.lspace = "0em";
        body[end].attributes.rspace = "0em";
      }
    }
    return new MathNode("mrow", body);
  };
  function isNumberPunctuation(group) {
    if (!group) {
      return false;
    }
    if (group.type === "mi" && group.children.length === 1) {
      const child = group.children[0];
      return child instanceof TextNode2 && child.text === ".";
    } else if (group.type === "mtext" && group.children.length === 1) {
      const child = group.children[0];
      return child instanceof TextNode2 && child.text === "\u2008";
    } else if (group.type === "mo" && group.children.length === 1 && group.getAttribute("separator") === "true" && group.getAttribute("lspace") === "0em" && group.getAttribute("rspace") === "0em") {
      const child = group.children[0];
      return child instanceof TextNode2 && child.text === ",";
    } else {
      return false;
    }
  }
  var isComma = (expression, i) => {
    const node = expression[i];
    const followingNode = expression[i + 1];
    return node.type === "atom" && node.text === "," && // Don't consolidate if there is a space after the comma.
    node.loc && followingNode.loc && node.loc.end === followingNode.loc.start;
  };
  var isRel = (item) => {
    return item.type === "atom" && item.family === "rel" || item.type === "mclass" && item.mclass === "mrel";
  };
  var buildExpression = function(expression, style, semisimple = false) {
    if (!semisimple && expression.length === 1) {
      const group = buildGroup$1(expression[0], style);
      if (group instanceof MathNode && group.type === "mo") {
        group.setAttribute("lspace", "0em");
        group.setAttribute("rspace", "0em");
      }
      return [group];
    }
    const groups = [];
    const groupArray = [];
    let lastGroup;
    for (let i = 0; i < expression.length; i++) {
      groupArray.push(buildGroup$1(expression[i], style));
    }
    for (let i = 0; i < groupArray.length; i++) {
      const group = groupArray[i];
      if (i < expression.length - 1 && isRel(expression[i]) && isRel(expression[i + 1])) {
        group.setAttribute("rspace", "0em");
      }
      if (i > 0 && isRel(expression[i]) && isRel(expression[i - 1])) {
        group.setAttribute("lspace", "0em");
      }
      if (group.type === "mn" && lastGroup && lastGroup.type === "mn") {
        lastGroup.children.push(...group.children);
        continue;
      } else if (isNumberPunctuation(group) && lastGroup && lastGroup.type === "mn") {
        lastGroup.children.push(...group.children);
        continue;
      } else if (lastGroup && lastGroup.type === "mn" && i < groupArray.length - 1 && groupArray[i + 1].type === "mn" && isComma(expression, i)) {
        lastGroup.children.push(...group.children);
        continue;
      } else if (group.type === "mn" && isNumberPunctuation(lastGroup)) {
        group.children = [...lastGroup.children, ...group.children];
        groups.pop();
      } else if ((group.type === "msup" || group.type === "msub") && group.children.length >= 1 && lastGroup && (lastGroup.type === "mn" || isNumberPunctuation(lastGroup))) {
        const base = group.children[0];
        if (base instanceof MathNode && base.type === "mn" && lastGroup) {
          base.children = [...lastGroup.children, ...base.children];
          groups.pop();
        }
      }
      groups.push(group);
      lastGroup = group;
    }
    return groups;
  };
  var buildExpressionRow = function(expression, style, semisimple = false) {
    return makeRow(buildExpression(expression, style, semisimple), semisimple);
  };
  var buildGroup$1 = function(group, style) {
    if (!group) {
      return new MathNode("mrow");
    }
    if (_mathmlGroupBuilders[group.type]) {
      const result = _mathmlGroupBuilders[group.type](group, style);
      return result;
    } else {
      throw new ParseError("Got group of unknown type: '" + group.type + "'");
    }
  };
  var glue$1 = (_) => {
    return new MathNode("mtd", [], [], { padding: "0", width: "50%" });
  };
  var labelContainers = ["mrow", "mtd", "mtable", "mtr"];
  var getLabel = (parent) => {
    for (const node of parent.children) {
      if (node.type && labelContainers.includes(node.type)) {
        if (node.classes && node.classes[0] === "tml-label") {
          const label = node.label;
          return label;
        } else {
          const label = getLabel(node);
          if (label) {
            return label;
          }
        }
      } else if (!node.type) {
        const label = getLabel(node);
        if (label) {
          return label;
        }
      }
    }
  };
  var taggedExpression = (expression, tag2, style, leqno) => {
    tag2 = buildExpressionRow(tag2[0].body, style);
    tag2 = consolidateText(tag2);
    tag2.classes.push("tml-tag");
    const label = getLabel(expression);
    expression = new MathNode("mtd", [expression]);
    const rowArray = [glue$1(), expression, glue$1()];
    rowArray[leqno ? 0 : 2].children.push(tag2);
    const mtr = new MathNode("mtr", rowArray, ["tml-tageqn"]);
    if (label) {
      mtr.setAttribute("id", label);
    }
    const table = new MathNode("mtable", [mtr]);
    table.style.width = "100%";
    table.setAttribute("displaystyle", "true");
    return table;
  };
  function buildMathML(tree, texExpression, style, settings) {
    let tag2 = null;
    if (tree.length === 1 && tree[0].type === "tag") {
      tag2 = tree[0].tag;
      tree = tree[0].body;
    }
    const expression = buildExpression(tree, style);
    if (expression.length === 1 && expression[0] instanceof AnchorNode) {
      return expression[0];
    }
    const wrap = settings.displayMode || settings.annotate ? "none" : settings.wrap;
    const n1 = expression.length === 0 ? null : expression[0];
    let wrapper = expression.length === 1 && tag2 === null && n1 instanceof MathNode ? expression[0] : setLineBreaks(expression, wrap, settings.displayMode);
    if (tag2) {
      wrapper = taggedExpression(wrapper, tag2, style, settings.leqno);
    }
    if (settings.annotate) {
      const annotation = new MathNode(
        "annotation",
        [new TextNode2(texExpression)]
      );
      annotation.setAttribute("encoding", "application/x-tex");
      wrapper = new MathNode("semantics", [wrapper, annotation]);
    }
    const math2 = new MathNode("math", [wrapper]);
    if (settings.xml) {
      math2.setAttribute("xmlns", "http://www.w3.org/1998/Math/MathML");
    }
    if (settings.displayMode) {
      math2.setAttribute("display", "block");
      math2.style.display = "block math";
      math2.classes = ["tml-display"];
    }
    return math2;
  }
  var smallNudge = "DHKLUcegorsuvxyz\u03A0\u03A5\u03A8\u03B1\u03B4\u03B7\u03B9\u03BC\u03BD\u03BF\u03C4\u03C5\u03C7\u03F5";
  var mediumNudge = "BCEGIMNOPQRSTXZlpqtw\u0393\u0398\u039E\u03A3\u03A6\u03A9\u03B2\u03B5\u03B6\u03B8\u03BE\u03C1\u03C2\u03C6\u03C8\u03D1\u03D5\u03F1";
  var largeNudge = "AFJdf\u0394\u039B";
  var mathmlBuilder$a = (group, style) => {
    const accentNode$1 = group.isStretchy ? accentNode(group) : new MathNode("mo", [makeText(group.label, group.mode)]);
    if (!group.isStretchy) {
      accentNode$1.setAttribute("stretchy", "false");
    }
    if (group.label !== "\\vec") {
      accentNode$1.style.mathDepth = "0";
    }
    const tag2 = group.label === "\\c" ? "munder" : "mover";
    const needsWbkVertShift = needsWebkitVerticalShift.has(group.label);
    if (tag2 === "mover" && group.mode === "math" && !group.isStretchy && group.base.text && group.base.text.length === 1) {
      const text2 = group.base.text;
      const isVec = group.label === "\\vec";
      const vecPostfix = isVec === "\\vec" ? "-vec" : "";
      if (isVec) {
        accentNode$1.classes.push("tml-vec");
      }
      const wbkPostfix = isVec ? "-vec" : needsWbkVertShift ? "-acc" : "";
      if (smallNudge.indexOf(text2) > -1) {
        accentNode$1.classes.push(`chr-sml${vecPostfix}`);
        accentNode$1.classes.push(`wbk-sml${wbkPostfix}`);
      } else if (mediumNudge.indexOf(text2) > -1) {
        accentNode$1.classes.push(`chr-med${vecPostfix}`);
        accentNode$1.classes.push(`wbk-med${wbkPostfix}`);
      } else if (largeNudge.indexOf(text2) > -1) {
        accentNode$1.classes.push(`chr-lrg${vecPostfix}`);
        accentNode$1.classes.push(`wbk-lrg${wbkPostfix}`);
      } else if (isVec) {
        accentNode$1.classes.push(`wbk-vec`);
      } else if (needsWbkVertShift) {
        accentNode$1.classes.push(`wbk-acc`);
      }
    } else if (needsWbkVertShift) {
      accentNode$1.classes.push("wbk-acc");
    }
    const node = new MathNode(tag2, [buildGroup$1(group.base, style), accentNode$1]);
    return node;
  };
  var nonStretchyAccents = /* @__PURE__ */ new Set([
    "\\acute",
    "\\check",
    "\\grave",
    "\\ddot",
    "\\dddot",
    "\\ddddot",
    "\\tilde",
    "\\bar",
    "\\breve",
    "\\check",
    "\\hat",
    "\\vec",
    "\\dot",
    "\\mathring"
  ]);
  var needsWebkitVerticalShift = /* @__PURE__ */ new Set([
    "\\acute",
    "\\bar",
    "\\breve",
    "\\check",
    "\\dot",
    "\\ddot",
    "\\grave",
    "\\hat",
    "\\mathring",
    "\\`",
    "\\'",
    "\\^",
    "\\=",
    "\\u",
    "\\.",
    '\\"',
    "\\r",
    "\\H",
    "\\v"
  ]);
  var combiningChar = {
    "\\`": "\u0300",
    "\\'": "\u0301",
    "\\^": "\u0302",
    "\\~": "\u0303",
    "\\=": "\u0304",
    "\\u": "\u0306",
    "\\.": "\u0307",
    '\\"': "\u0308",
    "\\r": "\u030A",
    "\\H": "\u030B",
    "\\v": "\u030C",
    "\\c": "\u0327"
  };
  defineFunction({
    type: "accent",
    names: [
      "\\acute",
      "\\grave",
      "\\ddot",
      "\\dddot",
      "\\ddddot",
      "\\tilde",
      "\\bar",
      "\\breve",
      "\\check",
      "\\hat",
      "\\vec",
      "\\dot",
      "\\mathring",
      "\\overparen",
      "\\widecheck",
      "\\widehat",
      "\\wideparen",
      "\\widetilde",
      "\\overrightarrow",
      "\\overleftarrow",
      "\\Overrightarrow",
      "\\overleftrightarrow",
      "\\overgroup",
      "\\overleftharpoon",
      "\\overrightharpoon"
    ],
    props: {
      numArgs: 1
    },
    handler: (context, args) => {
      const base = normalizeArgument(args[0]);
      const isStretchy = !nonStretchyAccents.has(context.funcName);
      return {
        type: "accent",
        mode: context.parser.mode,
        label: context.funcName,
        isStretchy,
        base
      };
    },
    mathmlBuilder: mathmlBuilder$a
  });
  defineFunction({
    type: "accent",
    names: ["\\'", "\\`", "\\^", "\\~", "\\=", "\\c", "\\u", "\\.", '\\"', "\\r", "\\H", "\\v"],
    props: {
      numArgs: 1,
      allowedInText: true,
      allowedInMath: true,
      argTypes: ["primitive"]
    },
    handler: (context, args) => {
      const base = normalizeArgument(args[0]);
      const mode = context.parser.mode;
      if (mode === "math" && context.parser.settings.strict) {
        console.log(`Temml parse error: Command ${context.funcName} is invalid in math mode.`);
      }
      if (mode === "text" && base.text && base.text.length === 1 && context.funcName in combiningChar && smalls.indexOf(base.text) > -1) {
        return {
          type: "textord",
          mode: "text",
          text: base.text + combiningChar[context.funcName]
        };
      } else if (context.funcName === "\\c" && mode === "text" && base.text && base.text.length === 1) {
        return { type: "textord", mode: "text", text: base.text + "\u0327" };
      } else {
        return {
          type: "accent",
          mode,
          label: context.funcName,
          isStretchy: false,
          base
        };
      }
    },
    mathmlBuilder: mathmlBuilder$a
  });
  defineFunction({
    type: "accentUnder",
    names: [
      "\\underleftarrow",
      "\\underrightarrow",
      "\\underleftrightarrow",
      "\\undergroup",
      "\\underparen",
      "\\utilde"
    ],
    props: {
      numArgs: 1
    },
    handler: ({ parser: parser2, funcName }, args) => {
      const base = args[0];
      return {
        type: "accentUnder",
        mode: parser2.mode,
        label: funcName,
        base
      };
    },
    mathmlBuilder: (group, style) => {
      const accentNode$1 = accentNode(group);
      accentNode$1.style["math-depth"] = 0;
      const node = new MathNode("munder", [
        buildGroup$1(group.base, style),
        accentNode$1
      ]);
      return node;
    }
  });
  var ptPerUnit = {
    // Convert to CSS (Postscipt) points, not TeX points
    // https://en.wikibooks.org/wiki/LaTeX/Lengths and
    // https://tex.stackexchange.com/a/8263
    pt: 800 / 803,
    // convert TeX point to CSS (Postscript) point
    pc: 12 * 800 / 803,
    // pica
    dd: 1238 / 1157 * 800 / 803,
    // didot
    cc: 14856 / 1157 * 800 / 803,
    // cicero (12 didot)
    nd: 685 / 642 * 800 / 803,
    // new didot
    nc: 1370 / 107 * 800 / 803,
    // new cicero (12 new didot)
    sp: 1 / 65536 * 800 / 803,
    // scaled point (TeX's internal smallest unit)
    mm: 25.4 / 72,
    cm: 2.54 / 72,
    in: 1 / 72,
    px: 96 / 72
  };
  var validUnits = [
    "em",
    "ex",
    "mu",
    "pt",
    "mm",
    "cm",
    "in",
    "px",
    "bp",
    "pc",
    "dd",
    "cc",
    "nd",
    "nc",
    "sp"
  ];
  var validUnit = function(unit) {
    if (typeof unit !== "string") {
      unit = unit.unit;
    }
    return validUnits.indexOf(unit) > -1;
  };
  var emScale = (styleLevel) => {
    const scriptLevel2 = Math.max(styleLevel - 1, 0);
    return [1, 0.7, 0.5][scriptLevel2];
  };
  var calculateSize = function(sizeValue, style) {
    let number = sizeValue.number;
    if (style.maxSize[0] < 0 && number > 0) {
      return { number: 0, unit: "em" };
    }
    const unit = sizeValue.unit;
    switch (unit) {
      case "mm":
      case "cm":
      case "in":
      case "px": {
        const numInCssPts = number * ptPerUnit[unit];
        if (numInCssPts > style.maxSize[1]) {
          return { number: style.maxSize[1], unit: "pt" };
        }
        return { number, unit };
      }
      case "em":
      case "ex": {
        if (unit === "ex") {
          number *= 0.431;
        }
        number = Math.min(number / emScale(style.level), style.maxSize[0]);
        return { number: round(number), unit: "em" };
      }
      case "bp": {
        if (number > style.maxSize[1]) {
          number = style.maxSize[1];
        }
        return { number, unit: "pt" };
      }
      case "pt":
      case "pc":
      case "dd":
      case "cc":
      case "nd":
      case "nc":
      case "sp": {
        number = Math.min(number * ptPerUnit[unit], style.maxSize[1]);
        return { number: round(number), unit: "pt" };
      }
      case "mu": {
        number = Math.min(number / 18, style.maxSize[0]);
        return { number: round(number), unit: "em" };
      }
      default:
        throw new ParseError("Invalid unit: '" + unit + "'");
    }
  };
  var padding = (width) => {
    const node = new MathNode("mspace");
    node.setAttribute("width", width + "em");
    return node;
  };
  var paddedNode = (group, lspace = 0.3, rspace = 0, mustSmash = false) => {
    if (group == null && rspace === 0) {
      return padding(lspace);
    }
    const row = group ? [group] : [];
    if (lspace !== 0) {
      row.unshift(padding(lspace));
    }
    if (rspace > 0) {
      row.push(padding(rspace));
    }
    if (mustSmash) {
      const mpadded = new MathNode("mpadded", row);
      mpadded.setAttribute("height", "0.1px");
      return mpadded;
    } else {
      return new MathNode("mrow", row);
    }
  };
  var labelSize = (size, scriptLevel2) => Number(size) / emScale(scriptLevel2);
  var munderoverNode = (fName, body, below, style) => {
    const arrowNode = mathMLnode(fName);
    const isEq = fName.slice(1, 3) === "eq";
    const minWidth = fName.charAt(1) === "x" ? "1.75" : fName.slice(2, 4) === "cd" ? "3.0" : isEq ? "1.0" : "2.0";
    arrowNode.setAttribute("lspace", "0");
    arrowNode.setAttribute("rspace", isEq ? "0.5em" : "0");
    const labelStyle = style.withLevel(style.level < 2 ? 2 : 3);
    const minArrowWidth = labelSize(minWidth, labelStyle.level);
    const dummyWidth = labelSize(minWidth, 3);
    const emptyLabel = paddedNode(null, minArrowWidth.toFixed(4), 0);
    const dummyNode = paddedNode(null, dummyWidth.toFixed(4), 0);
    const space = labelSize(isEq ? 0 : 0.3, labelStyle.level).toFixed(4);
    let upperNode;
    let lowerNode;
    const gotUpper = body && body.body && // \hphantom        visible content
    (body.body.body || body.body.length > 0);
    if (gotUpper) {
      let label = buildGroup$1(body, labelStyle);
      const mustSmash = fName === "\\\\cdrightarrow" || fName === "\\\\cdleftarrow";
      label = paddedNode(label, space, space, mustSmash);
      upperNode = new MathNode("mover", [label, dummyNode]);
    }
    const gotLower = below && below.body && (below.body.body || below.body.length > 0);
    if (gotLower) {
      let label = buildGroup$1(below, labelStyle);
      label = paddedNode(label, space, space);
      lowerNode = new MathNode("munder", [label, dummyNode]);
    }
    let node;
    if (!gotUpper && !gotLower) {
      node = new MathNode("mover", [arrowNode, emptyLabel]);
    } else if (gotUpper && gotLower) {
      node = new MathNode("munderover", [arrowNode, lowerNode, upperNode]);
    } else if (gotUpper) {
      node = new MathNode("mover", [arrowNode, upperNode]);
    } else {
      node = new MathNode("munder", [arrowNode, lowerNode]);
    }
    if (minWidth === "3.0") {
      node.style.height = "1em";
    }
    node.setAttribute("accent", "false");
    return node;
  };
  defineFunction({
    type: "xArrow",
    names: [
      "\\xleftarrow",
      "\\xrightarrow",
      "\\xLeftarrow",
      "\\xRightarrow",
      "\\xleftrightarrow",
      "\\xLeftrightarrow",
      "\\xhookleftarrow",
      "\\xhookrightarrow",
      "\\xmapsto",
      "\\xrightharpoondown",
      "\\xrightharpoonup",
      "\\xleftharpoondown",
      "\\xleftharpoonup",
      "\\xlongequal",
      "\\xtwoheadrightarrow",
      "\\xtwoheadleftarrow",
      "\\xtofrom",
      // expfeil
      "\\xleftrightharpoons",
      // mathtools
      "\\xrightleftharpoons",
      // mathtools
      // The next 7 functions are here only to support mhchem
      "\\yields",
      "\\yieldsLeft",
      "\\mesomerism",
      "\\longrightharpoonup",
      "\\longleftharpoondown",
      "\\yieldsLeftRight",
      "\\chemequilibrium",
      // The next 3 functions are here only to support the {CD} environment.
      "\\\\cdrightarrow",
      "\\\\cdleftarrow",
      "\\\\cdlongequal"
    ],
    props: {
      numArgs: 1,
      numOptionalArgs: 1
    },
    handler({ parser: parser2, funcName }, args, optArgs) {
      return {
        type: "xArrow",
        mode: parser2.mode,
        name: funcName,
        body: args[0],
        below: optArgs[0]
      };
    },
    mathmlBuilder(group, style) {
      const node = munderoverNode(group.name, group.body, group.below, style);
      const row = [node];
      row.unshift(padding(0.2778));
      row.push(padding(0.2778));
      return new MathNode("mrow", row);
    }
  });
  var arrowComponent = {
    "\\equilibriumRight": ["\\longrightharpoonup", "\\eqleftharpoondown"],
    "\\equilibriumLeft": ["\\eqrightharpoonup", "\\longleftharpoondown"]
  };
  defineFunction({
    type: "stackedArrow",
    names: [
      "\\equilibriumRight",
      "\\equilibriumLeft"
    ],
    props: {
      numArgs: 1,
      numOptionalArgs: 1
    },
    handler({ parser: parser2, funcName }, args, optArgs) {
      const lowerArrowBody = args[0] ? {
        type: "hphantom",
        mode: parser2.mode,
        body: args[0]
      } : null;
      const upperArrowBelow = optArgs[0] ? {
        type: "hphantom",
        mode: parser2.mode,
        body: optArgs[0]
      } : null;
      return {
        type: "stackedArrow",
        mode: parser2.mode,
        name: funcName,
        body: args[0],
        upperArrowBelow,
        lowerArrowBody,
        below: optArgs[0]
      };
    },
    mathmlBuilder(group, style) {
      const topLabel = arrowComponent[group.name][0];
      const botLabel = arrowComponent[group.name][1];
      const topArrow = munderoverNode(topLabel, group.body, group.upperArrowBelow, style);
      const botArrow = munderoverNode(botLabel, group.lowerArrowBody, group.below, style);
      let wrapper;
      const raiseNode = new MathNode("mpadded", [topArrow]);
      raiseNode.setAttribute("voffset", "0.3em");
      raiseNode.setAttribute("height", "+0.3em");
      raiseNode.setAttribute("depth", "-0.3em");
      if (group.name === "\\equilibriumLeft") {
        const botNode = new MathNode("mpadded", [botArrow]);
        botNode.setAttribute("width", "0.5em");
        wrapper = new MathNode(
          "mpadded",
          [padding(0.2778), botNode, raiseNode, padding(0.2778)]
        );
      } else {
        raiseNode.setAttribute("width", group.name === "\\equilibriumRight" ? "0.5em" : "0");
        wrapper = new MathNode(
          "mpadded",
          [padding(0.2778), raiseNode, botArrow, padding(0.2778)]
        );
      }
      wrapper.setAttribute("voffset", "-0.18em");
      wrapper.setAttribute("height", "-0.18em");
      wrapper.setAttribute("depth", "+0.18em");
      return wrapper;
    }
  });
  var _environments = {};
  function defineEnvironment({ type, names, props, handler, mathmlBuilder: mathmlBuilder2 }) {
    const data = {
      type,
      numArgs: props.numArgs || 0,
      allowedInText: false,
      numOptionalArgs: 0,
      handler
    };
    for (let i = 0; i < names.length; ++i) {
      _environments[names[i]] = data;
    }
    if (mathmlBuilder2) {
      _mathmlGroupBuilders[type] = mathmlBuilder2;
    }
  }
  function assertNodeType(node, type) {
    if (!node || node.type !== type) {
      throw new Error(
        `Expected node of type ${type}, but got ` + (node ? `node of type ${node.type}` : String(node))
      );
    }
    return node;
  }
  function assertSymbolNodeType(node) {
    const typedNode = checkSymbolNodeType(node);
    if (!typedNode) {
      throw new Error(
        `Expected node of symbol group type, but got ` + (node ? `node of type ${node.type}` : String(node))
      );
    }
    return typedNode;
  }
  function checkSymbolNodeType(node) {
    if (node && (node.type === "atom" || node.type === "delimiter" || Object.prototype.hasOwnProperty.call(NON_ATOMS, node.type))) {
      return node;
    }
    return null;
  }
  var cdArrowFunctionName = {
    ">": "\\\\cdrightarrow",
    "<": "\\\\cdleftarrow",
    "=": "\\\\cdlongequal",
    A: "\\uparrow",
    V: "\\downarrow",
    "|": "\\Vert",
    ".": "no arrow"
  };
  var newCell = () => {
    return { type: "styling", body: [], mode: "math", scriptLevel: "display" };
  };
  var isStartOfArrow = (node) => {
    return node.type === "textord" && node.text === "@";
  };
  var isLabelEnd = (node, endChar) => {
    return (node.type === "mathord" || node.type === "atom") && node.text === endChar;
  };
  function cdArrow(arrowChar, labels, parser2) {
    const funcName = cdArrowFunctionName[arrowChar];
    switch (funcName) {
      case "\\\\cdrightarrow":
      case "\\\\cdleftarrow":
        return parser2.callFunction(funcName, [labels[0]], [labels[1]]);
      case "\\uparrow":
      case "\\downarrow": {
        const leftLabel = parser2.callFunction("\\\\cdleft", [labels[0]], []);
        const bareArrow = {
          type: "atom",
          text: funcName,
          mode: "math",
          family: "rel"
        };
        const sizedArrow = parser2.callFunction("\\Big", [bareArrow], []);
        const rightLabel = parser2.callFunction("\\\\cdright", [labels[1]], []);
        const arrowGroup = {
          type: "ordgroup",
          mode: "math",
          body: [leftLabel, sizedArrow, rightLabel],
          semisimple: true
        };
        return parser2.callFunction("\\\\cdparent", [arrowGroup], []);
      }
      case "\\\\cdlongequal":
        return parser2.callFunction("\\\\cdlongequal", [], []);
      case "\\Vert": {
        const arrow = { type: "textord", text: "\\Vert", mode: "math" };
        return parser2.callFunction("\\Big", [arrow], []);
      }
      default:
        return { type: "textord", text: " ", mode: "math" };
    }
  }
  function parseCD(parser2) {
    const parsedRows = [];
    parser2.gullet.beginGroup();
    parser2.gullet.macros.set("\\cr", "\\\\\\relax");
    parser2.gullet.beginGroup();
    while (true) {
      parsedRows.push(parser2.parseExpression(false, "\\\\"));
      parser2.gullet.endGroup();
      parser2.gullet.beginGroup();
      const next = parser2.fetch().text;
      if (next === "&" || next === "\\\\") {
        parser2.consume();
      } else if (next === "\\end") {
        if (parsedRows[parsedRows.length - 1].length === 0) {
          parsedRows.pop();
        }
        break;
      } else {
        throw new ParseError("Expected \\\\ or \\cr or \\end", parser2.nextToken);
      }
    }
    let row = [];
    const body = [row];
    for (let i = 0; i < parsedRows.length; i++) {
      const rowNodes = parsedRows[i];
      let cell = newCell();
      for (let j = 0; j < rowNodes.length; j++) {
        if (!isStartOfArrow(rowNodes[j])) {
          cell.body.push(rowNodes[j]);
        } else {
          row.push(cell);
          j += 1;
          const arrowChar = assertSymbolNodeType(rowNodes[j]).text;
          const labels = new Array(2);
          labels[0] = { type: "ordgroup", mode: "math", body: [] };
          labels[1] = { type: "ordgroup", mode: "math", body: [] };
          if ("=|.".indexOf(arrowChar) > -1) ;
          else if ("<>AV".indexOf(arrowChar) > -1) {
            for (let labelNum = 0; labelNum < 2; labelNum++) {
              let inLabel = true;
              for (let k = j + 1; k < rowNodes.length; k++) {
                if (isLabelEnd(rowNodes[k], arrowChar)) {
                  inLabel = false;
                  j = k;
                  break;
                }
                if (isStartOfArrow(rowNodes[k])) {
                  throw new ParseError(
                    "Missing a " + arrowChar + " character to complete a CD arrow.",
                    rowNodes[k]
                  );
                }
                labels[labelNum].body.push(rowNodes[k]);
              }
              if (inLabel) {
                throw new ParseError(
                  "Missing a " + arrowChar + " character to complete a CD arrow.",
                  rowNodes[j]
                );
              }
            }
          } else {
            throw new ParseError(`Expected one of "<>AV=|." after @.`);
          }
          const arrow = cdArrow(arrowChar, labels, parser2);
          row.push(arrow);
          cell = newCell();
        }
      }
      if (i % 2 === 0) {
        row.push(cell);
      } else {
        row.shift();
      }
      row = [];
      body.push(row);
    }
    body.pop();
    parser2.gullet.endGroup();
    parser2.gullet.endGroup();
    return {
      type: "array",
      mode: "math",
      body,
      tags: null,
      labels: new Array(body.length + 1).fill(""),
      envClasses: ["jot", "cd"],
      cols: [],
      hLinesBeforeRow: new Array(body.length + 1).fill([])
    };
  }
  defineFunction({
    type: "cdlabel",
    names: ["\\\\cdleft", "\\\\cdright"],
    props: {
      numArgs: 1
    },
    handler({ parser: parser2, funcName }, args) {
      return {
        type: "cdlabel",
        mode: parser2.mode,
        side: funcName.slice(4),
        label: args[0]
      };
    },
    mathmlBuilder(group, style) {
      if (group.label.body.length === 0) {
        return new MathNode("mrow", style);
      }
      const mrow = buildGroup$1(group.label, style);
      if (group.side === "left") {
        mrow.classes.push("tml-shift-left");
      }
      const mtd = new MathNode("mtd", [mrow]);
      mtd.style.padding = "0";
      const mtr = new MathNode("mtr", [mtd]);
      const mtable = new MathNode("mtable", [mtr]);
      const label = new MathNode("mpadded", [mtable]);
      label.setAttribute("width", "0.1px");
      label.setAttribute("displaystyle", "false");
      label.setAttribute("scriptlevel", "1");
      return label;
    }
  });
  defineFunction({
    type: "cdlabelparent",
    names: ["\\\\cdparent"],
    props: {
      numArgs: 1
    },
    handler({ parser: parser2 }, args) {
      return {
        type: "cdlabelparent",
        mode: parser2.mode,
        fragment: args[0]
      };
    },
    mathmlBuilder(group, style) {
      return new MathNode("mrow", [buildGroup$1(group.fragment, style)]);
    }
  });
  var ordGroup = (body) => {
    return {
      "type": "ordgroup",
      "mode": "math",
      "body": body,
      "semisimple": true
    };
  };
  var phantom = (body, type) => {
    return {
      "type": type,
      "mode": "math",
      "body": ordGroup(body)
    };
  };
  var bordermatrixParseTree = (matrix, delimiters2) => {
    const body = matrix.body;
    body[0].shift();
    const leftColumnBody = new Array(body.length - 1).fill().map(() => []);
    for (let i = 1; i < body.length; i++) {
      leftColumnBody[i - 1].push(body[i].shift());
      const phantomBody = [];
      for (let j = 0; j < body[i].length; j++) {
        phantomBody.push(body[i][j]);
      }
      leftColumnBody[i - 1].push(phantom(phantomBody, "vphantom"));
    }
    const topRowBody = new Array(body.length).fill().map(() => []);
    for (let j = 0; j < body[0].length; j++) {
      topRowBody[0].push(body[0][j]);
    }
    for (let i = 1; i < body.length; i++) {
      for (let j = 0; j < body[0].length; j++) {
        topRowBody[i].push(phantom(body[i][j].body, "hphantom"));
      }
    }
    for (let j = 0; j < body[0].length; j++) {
      body[0][j] = phantom(body[0][j].body, "hphantom");
    }
    const leftColumn = {
      type: "array",
      mode: "math",
      body: leftColumnBody,
      cols: [{ type: "align", align: "c" }],
      rowGaps: new Array(leftColumnBody.length - 1).fill(null),
      hLinesBeforeRow: new Array(leftColumnBody.length + 1).fill().map(() => []),
      envClasses: [],
      scriptLevel: "text",
      arraystretch: 1,
      labels: new Array(leftColumnBody.length).fill(""),
      arraycolsep: { "number": 0.04, unit: "em" }
    };
    const topRow = {
      type: "array",
      mode: "math",
      body: topRowBody,
      cols: new Array(topRowBody.length).fill({ type: "align", align: "c" }),
      rowGaps: new Array(topRowBody.length - 1).fill(null),
      hLinesBeforeRow: new Array(topRowBody.length + 1).fill().map(() => []),
      envClasses: [],
      scriptLevel: "text",
      arraystretch: 1,
      labels: new Array(topRowBody.length).fill(""),
      arraycolsep: null
    };
    const topWrapper = {
      type: "styling",
      mode: "math",
      scriptLevel: "text",
      // Must set this explicitly.
      body: [topRow]
      // Default level is "script".
    };
    const container = {
      type: "leftright",
      mode: "math",
      body: [matrix],
      left: delimiters2 ? delimiters2[0] : "(",
      right: delimiters2 ? delimiters2[1] : ")",
      rightColor: void 0
    };
    const base = {
      type: "op",
      // The base of a TeX \overset
      mode: "math",
      limits: true,
      alwaysHandleSupSub: true,
      parentIsSupSub: true,
      symbol: false,
      suppressBaseShift: true,
      body: [container]
    };
    const mover = {
      type: "supsub",
      // We're using the MathML equivalent
      mode: "math",
      // of TeX \overset.
      stack: true,
      base,
      // That keeps the {pmatrix} aligned with
      sup: topWrapper,
      // the math centerline.
      sub: null
    };
    return ordGroup([leftColumn, mover]);
  };
  var SourceLocation = class _SourceLocation {
    constructor(lexer2, start, end) {
      this.lexer = lexer2;
      this.start = start;
      this.end = end;
    }
    /**
     * Merges two `SourceLocation`s from location providers, given they are
     * provided in order of appearance.
     * - Returns the first one's location if only the first is provided.
     * - Returns a merged range of the first and the last if both are provided
     *   and their lexers match.
     * - Otherwise, returns null.
     */
    static range(first, second) {
      if (!second) {
        return first && first.loc;
      } else if (!first || !first.loc || !second.loc || first.loc.lexer !== second.loc.lexer) {
        return null;
      } else {
        return new _SourceLocation(first.loc.lexer, first.loc.start, second.loc.end);
      }
    }
  };
  var Token = class _Token {
    constructor(text2, loc) {
      this.text = text2;
      this.loc = loc;
    }
    /**
     * Given a pair of tokens (this and endToken), compute a `Token` encompassing
     * the whole input range enclosed by these two.
     */
    range(endToken, text2) {
      return new _Token(text2, SourceLocation.range(this, endToken));
    }
  };
  var StyleLevel = {
    DISPLAY: 0,
    TEXT: 1,
    SCRIPT: 2,
    SCRIPTSCRIPT: 3
  };
  var _macros = {};
  function defineMacro(name, body) {
    _macros[name] = body;
  }
  var macros = _macros;
  defineMacro("\\noexpand", function(context) {
    const t2 = context.popToken();
    if (context.isExpandable(t2.text)) {
      t2.noexpand = true;
      t2.treatAsRelax = true;
    }
    return { tokens: [t2], numArgs: 0 };
  });
  defineMacro("\\expandafter", function(context) {
    const t2 = context.popToken();
    context.expandOnce(true);
    return { tokens: [t2], numArgs: 0 };
  });
  defineMacro("\\@firstoftwo", function(context) {
    const args = context.consumeArgs(2);
    return { tokens: args[0], numArgs: 0 };
  });
  defineMacro("\\@secondoftwo", function(context) {
    const args = context.consumeArgs(2);
    return { tokens: args[1], numArgs: 0 };
  });
  defineMacro("\\@ifnextchar", function(context) {
    const args = context.consumeArgs(3);
    context.consumeSpaces();
    const nextToken = context.future();
    if (args[0].length === 1 && args[0][0].text === nextToken.text) {
      return { tokens: args[1], numArgs: 0 };
    } else {
      return { tokens: args[2], numArgs: 0 };
    }
  });
  defineMacro("\\@ifstar", "\\@ifnextchar *{\\@firstoftwo{#1}}");
  defineMacro("\\TextOrMath", function(context) {
    const args = context.consumeArgs(2);
    if (context.mode === "text") {
      return { tokens: args[0], numArgs: 0 };
    } else {
      return { tokens: args[1], numArgs: 0 };
    }
  });
  var stringFromArg = (arg) => {
    let str = "";
    for (let i = arg.length - 1; i > -1; i--) {
      str += arg[i].text;
    }
    return str;
  };
  var digitToNumber = {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    a: 10,
    A: 10,
    b: 11,
    B: 11,
    c: 12,
    C: 12,
    d: 13,
    D: 13,
    e: 14,
    E: 14,
    f: 15,
    F: 15
  };
  var nextCharNumber = (context) => {
    const numStr = context.future().text;
    if (numStr === "EOF") {
      return [null, ""];
    }
    return [digitToNumber[numStr.charAt(0)], numStr];
  };
  var appendCharNumbers = (number, numStr, base) => {
    for (let i = 1; i < numStr.length; i++) {
      const digit = digitToNumber[numStr.charAt(i)];
      number *= base;
      number += digit;
    }
    return number;
  };
  defineMacro("\\char", function(context) {
    let token = context.popToken();
    let base;
    let number = "";
    if (token.text === "'") {
      base = 8;
      token = context.popToken();
    } else if (token.text === '"') {
      base = 16;
      token = context.popToken();
    } else if (token.text === "`") {
      token = context.popToken();
      if (token.text[0] === "\\") {
        number = token.text.charCodeAt(1);
      } else if (token.text === "EOF") {
        throw new ParseError("\\char` missing argument");
      } else {
        number = token.text.charCodeAt(0);
      }
    } else {
      base = 10;
    }
    if (base) {
      let numStr = token.text;
      number = digitToNumber[numStr.charAt(0)];
      if (number == null || number >= base) {
        throw new ParseError(`Invalid base-${base} digit ${token.text}`);
      }
      number = appendCharNumbers(number, numStr, base);
      let digit;
      [digit, numStr] = nextCharNumber(context);
      while (digit != null && digit < base) {
        number *= base;
        number += digit;
        number = appendCharNumbers(number, numStr, base);
        context.popToken();
        [digit, numStr] = nextCharNumber(context);
      }
    }
    return `\\@char{${number}}`;
  });
  function recreateArgStr(context) {
    const tokens = context.consumeArgs(1)[0];
    let str = "";
    let expectedLoc = tokens[tokens.length - 1].loc.start;
    for (let i = tokens.length - 1; i >= 0; i--) {
      const actualLoc = tokens[i].loc.start;
      if (actualLoc > expectedLoc) {
        str += " ";
        expectedLoc = actualLoc;
      }
      str += tokens[i].text;
      expectedLoc += tokens[i].text.length;
    }
    return str;
  }
  defineMacro("\\surd", "\\sqrt{\\vphantom{|}}");
  defineMacro("\u2295", "\\oplus");
  defineMacro("\\long", "");
  defineMacro("\\bgroup", "{");
  defineMacro("\\egroup", "}");
  defineMacro("~", "\\nobreakspace");
  defineMacro("\\lq", "`");
  defineMacro("\\rq", "'");
  defineMacro("\\aa", "\\r a");
  defineMacro("\\Bbbk", "\\Bbb{k}");
  defineMacro("\\mathstrut", "\\vphantom{(}");
  defineMacro("\\underbar", "\\underline{\\text{#1}}");
  defineMacro("\\vdots", "{\\varvdots\\rule{0pt}{15pt}}");
  defineMacro("\u22EE", "\\vdots");
  defineMacro("\\arraystretch", "1");
  defineMacro("\\arraycolsep", "6pt");
  defineMacro("\\substack", "\\begin{subarray}{c}#1\\end{subarray}");
  defineMacro("\\iff", "\\DOTSB\\;\\Longleftrightarrow\\;");
  defineMacro("\\implies", "\\DOTSB\\;\\Longrightarrow\\;");
  defineMacro("\\impliedby", "\\DOTSB\\;\\Longleftarrow\\;");
  var dotsByToken = {
    ",": "\\dotsc",
    "\\not": "\\dotsb",
    // \keybin@ checks for the following:
    "+": "\\dotsb",
    "=": "\\dotsb",
    "<": "\\dotsb",
    ">": "\\dotsb",
    "-": "\\dotsb",
    "*": "\\dotsb",
    ":": "\\dotsb",
    // Symbols whose definition starts with \DOTSB:
    "\\DOTSB": "\\dotsb",
    "\\coprod": "\\dotsb",
    "\\bigvee": "\\dotsb",
    "\\bigwedge": "\\dotsb",
    "\\biguplus": "\\dotsb",
    "\\bigcap": "\\dotsb",
    "\\bigcup": "\\dotsb",
    "\\prod": "\\dotsb",
    "\\sum": "\\dotsb",
    "\\bigotimes": "\\dotsb",
    "\\bigoplus": "\\dotsb",
    "\\bigodot": "\\dotsb",
    "\\bigsqcap": "\\dotsb",
    "\\bigsqcup": "\\dotsb",
    "\\bigtimes": "\\dotsb",
    "\\And": "\\dotsb",
    "\\longrightarrow": "\\dotsb",
    "\\Longrightarrow": "\\dotsb",
    "\\longleftarrow": "\\dotsb",
    "\\Longleftarrow": "\\dotsb",
    "\\longleftrightarrow": "\\dotsb",
    "\\Longleftrightarrow": "\\dotsb",
    "\\mapsto": "\\dotsb",
    "\\longmapsto": "\\dotsb",
    "\\hookrightarrow": "\\dotsb",
    "\\doteq": "\\dotsb",
    // Symbols whose definition starts with \mathbin:
    "\\mathbin": "\\dotsb",
    // Symbols whose definition starts with \mathrel:
    "\\mathrel": "\\dotsb",
    "\\relbar": "\\dotsb",
    "\\Relbar": "\\dotsb",
    "\\xrightarrow": "\\dotsb",
    "\\xleftarrow": "\\dotsb",
    // Symbols whose definition starts with \DOTSI:
    "\\DOTSI": "\\dotsi",
    "\\int": "\\dotsi",
    "\\oint": "\\dotsi",
    "\\iint": "\\dotsi",
    "\\iiint": "\\dotsi",
    "\\iiiint": "\\dotsi",
    // Symbols whose definition starts with \DOTSX:
    "\\DOTSX": "\\dotsx"
  };
  defineMacro("\\dots", function(context) {
    let thedots = "\\dotso";
    const next = context.expandAfterFuture().text;
    if (next in dotsByToken) {
      thedots = dotsByToken[next];
    } else if (next.slice(0, 4) === "\\not") {
      thedots = "\\dotsb";
    } else if (next in symbols.math) {
      if (["bin", "rel"].includes(symbols.math[next].group)) {
        thedots = "\\dotsb";
      }
    }
    return thedots;
  });
  var spaceAfterDots = {
    // \rightdelim@ checks for the following:
    ")": true,
    "]": true,
    "\\rbrack": true,
    "\\}": true,
    "\\rbrace": true,
    "\\rangle": true,
    "\\rceil": true,
    "\\rfloor": true,
    "\\rgroup": true,
    "\\rmoustache": true,
    "\\right": true,
    "\\bigr": true,
    "\\biggr": true,
    "\\Bigr": true,
    "\\Biggr": true,
    // \extra@ also tests for the following:
    $: true,
    // \extrap@ checks for the following:
    ";": true,
    ".": true,
    ",": true
  };
  defineMacro("\\dotso", function(context) {
    const next = context.future().text;
    if (next in spaceAfterDots) {
      return "\\ldots\\,";
    } else {
      return "\\ldots";
    }
  });
  defineMacro("\\dotsc", function(context) {
    const next = context.future().text;
    if (next in spaceAfterDots && next !== ",") {
      return "\\ldots\\,";
    } else {
      return "\\ldots";
    }
  });
  defineMacro("\\cdots", function(context) {
    const next = context.future().text;
    if (next in spaceAfterDots) {
      return "\\@cdots\\,";
    } else {
      return "\\@cdots";
    }
  });
  defineMacro("\\dotsb", "\\cdots");
  defineMacro("\\dotsm", "\\cdots");
  defineMacro("\\dotsi", "\\!\\cdots");
  defineMacro("\\idotsint", "\\int\\!\\cdots\\!\\int");
  defineMacro("\\dotsx", "\\ldots\\,");
  defineMacro("\\DOTSI", "\\relax");
  defineMacro("\\DOTSB", "\\relax");
  defineMacro("\\DOTSX", "\\relax");
  defineMacro("\\tmspace", "\\TextOrMath{\\kern#1#3}{\\mskip#1#2}\\relax");
  defineMacro("\\,", "{\\tmspace+{3mu}{.1667em}}");
  defineMacro("\\thinspace", "\\,");
  defineMacro("\\>", "\\mskip{4mu}");
  defineMacro("\\:", "{\\tmspace+{4mu}{.2222em}}");
  defineMacro("\\medspace", "\\:");
  defineMacro("\\;", "{\\tmspace+{5mu}{.2777em}}");
  defineMacro("\\thickspace", "\\;");
  defineMacro("\\!", "{\\tmspace-{3mu}{.1667em}}");
  defineMacro("\\negthinspace", "\\!");
  defineMacro("\\negmedspace", "{\\tmspace-{4mu}{.2222em}}");
  defineMacro("\\negthickspace", "{\\tmspace-{5mu}{.277em}}");
  defineMacro("\\enspace", "\\kern.5em ");
  defineMacro("\\enskip", "\\hskip.5em\\relax");
  defineMacro("\\quad", "\\hskip1em\\relax");
  defineMacro("\\qquad", "\\hskip2em\\relax");
  defineMacro("\\AA", "\\TextOrMath{\\Angstrom}{\\mathring{A}}\\relax");
  defineMacro("\\tag", "\\@ifstar\\tag@literal\\tag@paren");
  defineMacro("\\tag@paren", "\\tag@literal{({#1})}");
  defineMacro("\\tag@literal", (context) => {
    if (context.macros.get("\\df@tag")) {
      throw new ParseError("Multiple \\tag");
    }
    return "\\gdef\\df@tag{\\text{#1}}";
  });
  defineMacro("\\notag", "\\nonumber");
  defineMacro("\\nonumber", "\\gdef\\@eqnsw{0}");
  defineMacro("\\bmod", "\\mathbin{\\text{mod}}");
  defineMacro(
    "\\pod",
    "\\allowbreak\\mathchoice{\\mkern18mu}{\\mkern8mu}{\\mkern8mu}{\\mkern8mu}(#1)"
  );
  defineMacro("\\pmod", "\\pod{{\\rm mod}\\mkern6mu#1}");
  defineMacro(
    "\\mod",
    "\\allowbreak\\mathchoice{\\mkern18mu}{\\mkern12mu}{\\mkern12mu}{\\mkern12mu}{\\rm mod}\\,\\,#1"
  );
  defineMacro("\\newline", "\\\\\\relax");
  defineMacro("\\TeX", "\\textrm{T}\\kern-.1667em\\raisebox{-.5ex}{E}\\kern-.125em\\textrm{X}");
  defineMacro(
    "\\LaTeX",
    "\\textrm{L}\\kern-.35em\\raisebox{0.2em}{\\scriptstyle A}\\kern-.15em\\TeX"
  );
  defineMacro(
    "\\Temml",
    // eslint-disable-next-line max-len
    "\\textrm{T}\\kern-0.2em\\lower{0.2em}{\\textrm{E}}\\kern-0.08em{\\textrm{M}\\kern-0.08em\\raise{0.2em}\\textrm{M}\\kern-0.08em\\textrm{L}}"
  );
  defineMacro("\\hspace", "\\@ifstar\\@hspacer\\@hspace");
  defineMacro("\\@hspace", "\\hskip #1\\relax");
  defineMacro("\\@hspacer", "\\rule{0pt}{0pt}\\hskip #1\\relax");
  defineMacro("\\colon", `\\mathpunct{\\char"3a}`);
  defineMacro("\\prescript", "\\pres@cript{_{#1}^{#2}}{}{#3}");
  defineMacro("\\ordinarycolon", `\\char"3a`);
  defineMacro("\\vcentcolon", "\\mathrel{\\raisebox{0.035em}{\\ordinarycolon}}");
  defineMacro("\\coloneq", '\\mathrel{\\raisebox{0.035em}{\\ordinarycolon}\\char"2212}');
  defineMacro("\\Coloneq", '\\mathrel{\\char"2237\\char"2212}');
  defineMacro("\\Eqqcolon", '\\mathrel{\\char"3d\\char"2237}');
  defineMacro("\\Eqcolon", '\\mathrel{\\char"2212\\char"2237}');
  defineMacro("\\colonapprox", '\\mathrel{\\raisebox{0.035em}{\\ordinarycolon}\\char"2248}');
  defineMacro("\\Colonapprox", '\\mathrel{\\char"2237\\char"2248}');
  defineMacro("\\colonsim", '\\mathrel{\\raisebox{0.035em}{\\ordinarycolon}\\char"223c}');
  defineMacro("\\Colonsim", '\\mathrel{\\raisebox{0.035em}{\\ordinarycolon}\\char"223c}');
  defineMacro("\\ratio", "\\vcentcolon");
  defineMacro("\\coloncolon", "\\dblcolon");
  defineMacro("\\colonequals", "\\coloneqq");
  defineMacro("\\coloncolonequals", "\\Coloneqq");
  defineMacro("\\equalscolon", "\\eqqcolon");
  defineMacro("\\equalscoloncolon", "\\Eqqcolon");
  defineMacro("\\colonminus", "\\coloneq");
  defineMacro("\\coloncolonminus", "\\Coloneq");
  defineMacro("\\minuscolon", "\\eqcolon");
  defineMacro("\\minuscoloncolon", "\\Eqcolon");
  defineMacro("\\coloncolonapprox", "\\Colonapprox");
  defineMacro("\\coloncolonsim", "\\Colonsim");
  defineMacro("\\notni", "\\mathrel{\\char`\u220C}");
  defineMacro("\\limsup", "\\DOTSB\\operatorname*{lim\\,sup}");
  defineMacro("\\liminf", "\\DOTSB\\operatorname*{lim\\,inf}");
  defineMacro("\\injlim", "\\DOTSB\\operatorname*{inj\\,lim}");
  defineMacro("\\projlim", "\\DOTSB\\operatorname*{proj\\,lim}");
  defineMacro("\\varlimsup", "\\DOTSB\\operatorname*{\\overline{\\text{lim}}}");
  defineMacro("\\varliminf", "\\DOTSB\\operatorname*{\\underline{\\text{lim}}}");
  defineMacro("\\varinjlim", "\\DOTSB\\operatorname*{\\underrightarrow{\\text{lim}}}");
  defineMacro("\\varprojlim", "\\DOTSB\\operatorname*{\\underleftarrow{\\text{lim}}}");
  defineMacro("\\centerdot", "{\\medspace\\rule{0.167em}{0.189em}\\medspace}");
  defineMacro("\\argmin", "\\DOTSB\\operatorname*{arg\\,min}");
  defineMacro("\\argmax", "\\DOTSB\\operatorname*{arg\\,max}");
  defineMacro("\\plim", "\\DOTSB\\operatorname*{plim}");
  defineMacro("\\leftmodels", "\\mathop{\\reflectbox{$\\models$}}");
  defineMacro("\\bra", "\\mathinner{\\langle{#1}|}");
  defineMacro("\\ket", "\\mathinner{|{#1}\\rangle}");
  defineMacro("\\braket", "\\mathinner{\\langle{#1}\\rangle}");
  defineMacro("\\Bra", "\\left\\langle#1\\right|");
  defineMacro("\\Ket", "\\left|#1\\right\\rangle");
  var replaceVert = (argStr, match) => {
    const ch = match[0] === "|" ? "\\vert" : "\\Vert";
    const replaceStr = `}\\,\\middle${ch}\\,{`;
    return argStr.slice(0, match.index) + replaceStr + argStr.slice(match.index + match[0].length);
  };
  defineMacro("\\Braket", function(context) {
    let argStr = recreateArgStr(context);
    const regEx = /\|\||\||\\\|/g;
    let match;
    while ((match = regEx.exec(argStr)) !== null) {
      argStr = replaceVert(argStr, match);
    }
    return "\\left\\langle{" + argStr + "}\\right\\rangle";
  });
  defineMacro("\\Set", function(context) {
    let argStr = recreateArgStr(context);
    const match = /\|\||\||\\\|/.exec(argStr);
    if (match) {
      argStr = replaceVert(argStr, match);
    }
    return "\\left\\{\\:{" + argStr + "}\\:\\right\\}";
  });
  defineMacro("\\set", function(context) {
    const argStr = recreateArgStr(context);
    return "\\{{" + argStr.replace(/\|/, "}\\mid{") + "}\\}";
  });
  defineMacro("\\angln", "{\\angl n}");
  defineMacro("\\odv", "\\@ifstar\\odv@next\\odv@numerator");
  defineMacro("\\odv@numerator", "\\frac{\\mathrm{d}#1}{\\mathrm{d}#2}");
  defineMacro("\\odv@next", "\\frac{\\mathrm{d}}{\\mathrm{d}#2}#1");
  defineMacro("\\pdv", "\\@ifstar\\pdv@next\\pdv@numerator");
  var pdvHelper = (args) => {
    const numerator = args[0][0].text;
    const denoms = stringFromArg(args[1]).split(",");
    const power = String(denoms.length);
    const numOp = power === "1" ? "\\partial" : `\\partial^${power}`;
    let denominator = "";
    denoms.map((e) => {
      denominator += "\\partial " + e.trim() + "\\,";
    });
    return [numerator, numOp, denominator.replace(/\\,$/, "")];
  };
  defineMacro("\\pdv@numerator", function(context) {
    const [numerator, numOp, denominator] = pdvHelper(context.consumeArgs(2));
    return `\\frac{${numOp} ${numerator}}{${denominator}}`;
  });
  defineMacro("\\pdv@next", function(context) {
    const [numerator, numOp, denominator] = pdvHelper(context.consumeArgs(2));
    return `\\frac{${numOp}}{${denominator}} ${numerator}`;
  });
  defineMacro("\\upalpha", "\\up@greek{\\alpha}");
  defineMacro("\\upbeta", "\\up@greek{\\beta}");
  defineMacro("\\upgamma", "\\up@greek{\\gamma}");
  defineMacro("\\updelta", "\\up@greek{\\delta}");
  defineMacro("\\upepsilon", "\\up@greek{\\epsilon}");
  defineMacro("\\upzeta", "\\up@greek{\\zeta}");
  defineMacro("\\upeta", "\\up@greek{\\eta}");
  defineMacro("\\uptheta", "\\up@greek{\\theta}");
  defineMacro("\\upiota", "\\up@greek{\\iota}");
  defineMacro("\\upkappa", "\\up@greek{\\kappa}");
  defineMacro("\\uplambda", "\\up@greek{\\lambda}");
  defineMacro("\\upmu", "\\up@greek{\\mu}");
  defineMacro("\\upnu", "\\up@greek{\\nu}");
  defineMacro("\\upxi", "\\up@greek{\\xi}");
  defineMacro("\\upomicron", "\\up@greek{\\omicron}");
  defineMacro("\\uppi", "\\up@greek{\\pi}");
  defineMacro("\\upalpha", "\\up@greek{\\alpha}");
  defineMacro("\\uprho", "\\up@greek{\\rho}");
  defineMacro("\\upsigma", "\\up@greek{\\sigma}");
  defineMacro("\\uptau", "\\up@greek{\\tau}");
  defineMacro("\\upupsilon", "\\up@greek{\\upsilon}");
  defineMacro("\\upphi", "\\up@greek{\\phi}");
  defineMacro("\\upchi", "\\up@greek{\\chi}");
  defineMacro("\\uppsi", "\\up@greek{\\psi}");
  defineMacro("\\upomega", "\\up@greek{\\omega}");
  defineMacro("\\invamp", '\\mathbin{\\char"214b}');
  defineMacro("\\parr", '\\mathbin{\\char"214b}');
  defineMacro("\\upand", '\\mathbin{\\char"214b}');
  defineMacro("\\with", '\\mathbin{\\char"26}');
  defineMacro("\\multimapinv", '\\mathrel{\\char"27dc}');
  defineMacro("\\multimapboth", '\\mathrel{\\char"29df}');
  defineMacro("\\scoh", '{\\mkern5mu\\char"2322\\mkern5mu}');
  defineMacro("\\sincoh", '{\\mkern5mu\\char"2323\\mkern5mu}');
  defineMacro("\\coh", `{\\mkern5mu\\rule{}{0.7em}\\mathrlap{\\smash{\\raise2mu{\\char"2322}}}
{\\smash{\\lower4mu{\\char"2323}}}\\mkern5mu}`);
  defineMacro("\\incoh", `{\\mkern5mu\\rule{}{0.7em}\\mathrlap{\\smash{\\raise2mu{\\char"2323}}}
{\\smash{\\lower4mu{\\char"2322}}}\\mkern5mu}`);
  defineMacro("\\standardstate", "\\text{\\tiny\\char`\u29B5}");
  defineMacro("\\ce", function(context) {
    return chemParse(context.consumeArgs(1)[0], "ce");
  });
  defineMacro("\\pu", function(context) {
    return chemParse(context.consumeArgs(1)[0], "pu");
  });
  defineMacro("\\uniDash", `{\\rule{0.672em}{0.06em}}`);
  defineMacro("\\triDash", `{\\rule{0.15em}{0.06em}\\kern2mu\\rule{0.15em}{0.06em}\\kern2mu\\rule{0.15em}{0.06em}}`);
  defineMacro("\\tripleDash", `\\kern0.075em\\raise0.25em{\\triDash}\\kern0.075em`);
  defineMacro("\\tripleDashOverLine", `\\kern0.075em\\mathrlap{\\raise0.125em{\\uniDash}}\\raise0.34em{\\triDash}\\kern0.075em`);
  defineMacro("\\tripleDashOverDoubleLine", `\\kern0.075em\\mathrlap{\\mathrlap{\\raise0.48em{\\triDash}}\\raise0.27em{\\uniDash}}{\\raise0.05em{\\uniDash}}\\kern0.075em`);
  defineMacro("\\tripleDashBetweenDoubleLine", `\\kern0.075em\\mathrlap{\\mathrlap{\\raise0.48em{\\uniDash}}\\raise0.27em{\\triDash}}{\\raise0.05em{\\uniDash}}\\kern0.075em`);
  var chemParse = function(tokens, stateMachine) {
    var str = "";
    var expectedLoc = tokens.length && tokens[tokens.length - 1].loc.start;
    for (var i = tokens.length - 1; i >= 0; i--) {
      if (tokens[i].loc.start > expectedLoc) {
        str += " ";
        expectedLoc = tokens[i].loc.start;
      }
      str += tokens[i].text;
      expectedLoc += tokens[i].text.length;
    }
    var tex = texify.go(mhchemParser.go(str, stateMachine));
    return tex;
  };
  var mhchemParser = {
    //
    // Parses mchem \ce syntax
    //
    // Call like
    //   go("H2O");
    //
    go: function(input, stateMachine) {
      if (!input) {
        return [];
      }
      if (stateMachine === void 0) {
        stateMachine = "ce";
      }
      var state = "0";
      var buffer = {};
      buffer["parenthesisLevel"] = 0;
      input = input.replace(/\n/g, " ");
      input = input.replace(/[\u2212\u2013\u2014\u2010]/g, "-");
      input = input.replace(/[\u2026]/g, "...");
      var lastInput;
      var watchdog = 10;
      var output = [];
      while (true) {
        if (lastInput !== input) {
          watchdog = 10;
          lastInput = input;
        } else {
          watchdog--;
        }
        var machine = mhchemParser.stateMachines[stateMachine];
        var t2 = machine.transitions[state] || machine.transitions["*"];
        iterateTransitions:
          for (var i = 0; i < t2.length; i++) {
            var matches = mhchemParser.patterns.match_(t2[i].pattern, input);
            if (matches) {
              var task = t2[i].task;
              for (var iA = 0; iA < task.action_.length; iA++) {
                var o;
                if (machine.actions[task.action_[iA].type_]) {
                  o = machine.actions[task.action_[iA].type_](buffer, matches.match_, task.action_[iA].option);
                } else if (mhchemParser.actions[task.action_[iA].type_]) {
                  o = mhchemParser.actions[task.action_[iA].type_](buffer, matches.match_, task.action_[iA].option);
                } else {
                  throw ["MhchemBugA", "mhchem bug A. Please report. (" + task.action_[iA].type_ + ")"];
                }
                mhchemParser.concatArray(output, o);
              }
              state = task.nextState || state;
              if (input.length > 0) {
                if (!task.revisit) {
                  input = matches.remainder;
                }
                if (!task.toContinue) {
                  break iterateTransitions;
                }
              } else {
                return output;
              }
            }
          }
        if (watchdog <= 0) {
          throw ["MhchemBugU", "mhchem bug U. Please report."];
        }
      }
    },
    concatArray: function(a, b) {
      if (b) {
        if (Array.isArray(b)) {
          for (var iB = 0; iB < b.length; iB++) {
            a.push(b[iB]);
          }
        } else {
          a.push(b);
        }
      }
    },
    patterns: {
      //
      // Matching patterns
      // either regexps or function that return null or {match_:"a", remainder:"bc"}
      //
      patterns: {
        // property names must not look like integers ("2") for correct property traversal order, later on
        "empty": /^$/,
        "else": /^./,
        "else2": /^./,
        "space": /^\s/,
        "space A": /^\s(?=[A-Z\\$])/,
        "space$": /^\s$/,
        "a-z": /^[a-z]/,
        "x": /^x/,
        "x$": /^x$/,
        "i$": /^i$/,
        "letters": /^(?:[a-zA-Z\u03B1-\u03C9\u0391-\u03A9?@]|(?:\\(?:alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|omicron|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega)(?:\s+|\{\}|(?![a-zA-Z]))))+/,
        "\\greek": /^\\(?:alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|omicron|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega)(?:\s+|\{\}|(?![a-zA-Z]))/,
        "one lowercase latin letter $": /^(?:([a-z])(?:$|[^a-zA-Z]))$/,
        "$one lowercase latin letter$ $": /^\$(?:([a-z])(?:$|[^a-zA-Z]))\$$/,
        "one lowercase greek letter $": /^(?:\$?[\u03B1-\u03C9]\$?|\$?\\(?:alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|omicron|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega)\s*\$?)(?:\s+|\{\}|(?![a-zA-Z]))$/,
        "digits": /^[0-9]+/,
        "-9.,9": /^[+\-]?(?:[0-9]+(?:[,.][0-9]+)?|[0-9]*(?:\.[0-9]+))/,
        "-9.,9 no missing 0": /^[+\-]?[0-9]+(?:[.,][0-9]+)?/,
        "(-)(9.,9)(e)(99)": function(input) {
          var m = input.match(/^(\+\-|\+\/\-|\+|\-|\\pm\s?)?([0-9]+(?:[,.][0-9]+)?|[0-9]*(?:\.[0-9]+))?(\((?:[0-9]+(?:[,.][0-9]+)?|[0-9]*(?:\.[0-9]+))\))?(?:([eE]|\s*(\*|x|\\times|\u00D7)\s*10\^)([+\-]?[0-9]+|\{[+\-]?[0-9]+\}))?/);
          if (m && m[0]) {
            return { match_: m.splice(1), remainder: input.substr(m[0].length) };
          }
          return null;
        },
        "(-)(9)^(-9)": function(input) {
          var m = input.match(/^(\+\-|\+\/\-|\+|\-|\\pm\s?)?([0-9]+(?:[,.][0-9]+)?|[0-9]*(?:\.[0-9]+)?)\^([+\-]?[0-9]+|\{[+\-]?[0-9]+\})/);
          if (m && m[0]) {
            return { match_: m.splice(1), remainder: input.substr(m[0].length) };
          }
          return null;
        },
        "state of aggregation $": function(input) {
          var a = mhchemParser.patterns.findObserveGroups(input, "", /^\([a-z]{1,3}(?=[\),])/, ")", "");
          if (a && a.remainder.match(/^($|[\s,;\)\]\}])/)) {
            return a;
          }
          var m = input.match(/^(?:\((?:\\ca\s?)?\$[amothc]\$\))/);
          if (m) {
            return { match_: m[0], remainder: input.substr(m[0].length) };
          }
          return null;
        },
        "_{(state of aggregation)}$": /^_\{(\([a-z]{1,3}\))\}/,
        "{[(": /^(?:\\\{|\[|\()/,
        ")]}": /^(?:\)|\]|\\\})/,
        ", ": /^[,;]\s*/,
        ",": /^[,;]/,
        ".": /^[.]/,
        ". ": /^([.\u22C5\u00B7\u2022])\s*/,
        "...": /^\.\.\.(?=$|[^.])/,
        "* ": /^([*])\s*/,
        "^{(...)}": function(input) {
          return mhchemParser.patterns.findObserveGroups(input, "^{", "", "", "}");
        },
        "^($...$)": function(input) {
          return mhchemParser.patterns.findObserveGroups(input, "^", "$", "$", "");
        },
        "^a": /^\^([0-9]+|[^\\_])/,
        "^\\x{}{}": function(input) {
          return mhchemParser.patterns.findObserveGroups(input, "^", /^\\[a-zA-Z]+\{/, "}", "", "", "{", "}", "", true);
        },
        "^\\x{}": function(input) {
          return mhchemParser.patterns.findObserveGroups(input, "^", /^\\[a-zA-Z]+\{/, "}", "");
        },
        "^\\x": /^\^(\\[a-zA-Z]+)\s*/,
        "^(-1)": /^\^(-?\d+)/,
        "'": /^'/,
        "_{(...)}": function(input) {
          return mhchemParser.patterns.findObserveGroups(input, "_{", "", "", "}");
        },
        "_($...$)": function(input) {
          return mhchemParser.patterns.findObserveGroups(input, "_", "$", "$", "");
        },
        "_9": /^_([+\-]?[0-9]+|[^\\])/,
        "_\\x{}{}": function(input) {
          return mhchemParser.patterns.findObserveGroups(input, "_", /^\\[a-zA-Z]+\{/, "}", "", "", "{", "}", "", true);
        },
        "_\\x{}": function(input) {
          return mhchemParser.patterns.findObserveGroups(input, "_", /^\\[a-zA-Z]+\{/, "}", "");
        },
        "_\\x": /^_(\\[a-zA-Z]+)\s*/,
        "^_": /^(?:\^(?=_)|\_(?=\^)|[\^_]$)/,
        "{}": /^\{\}/,
        "{...}": function(input) {
          return mhchemParser.patterns.findObserveGroups(input, "", "{", "}", "");
        },
        "{(...)}": function(input) {
          return mhchemParser.patterns.findObserveGroups(input, "{", "", "", "}");
        },
        "$...$": function(input) {
          return mhchemParser.patterns.findObserveGroups(input, "", "$", "$", "");
        },
        "${(...)}$": function(input) {
          return mhchemParser.patterns.findObserveGroups(input, "${", "", "", "}$");
        },
        "$(...)$": function(input) {
          return mhchemParser.patterns.findObserveGroups(input, "$", "", "", "$");
        },
        "=<>": /^[=<>]/,
        "#": /^[#\u2261]/,
        "+": /^\+/,
        "-$": /^-(?=[\s_},;\]/]|$|\([a-z]+\))/,
        // -space -, -; -] -/ -$ -state-of-aggregation
        "-9": /^-(?=[0-9])/,
        "- orbital overlap": /^-(?=(?:[spd]|sp)(?:$|[\s,;\)\]\}]))/,
        "-": /^-/,
        "pm-operator": /^(?:\\pm|\$\\pm\$|\+-|\+\/-)/,
        "operator": /^(?:\+|(?:[\-=<>]|<<|>>|\\approx|\$\\approx\$)(?=\s|$|-?[0-9]))/,
        "arrowUpDown": /^(?:v|\(v\)|\^|\(\^\))(?=$|[\s,;\)\]\}])/,
        "\\bond{(...)}": function(input) {
          return mhchemParser.patterns.findObserveGroups(input, "\\bond{", "", "", "}");
        },
        "->": /^(?:<->|<-->|->|<-|<=>>|<<=>|<=>|[\u2192\u27F6\u21CC])/,
        "CMT": /^[CMT](?=\[)/,
        "[(...)]": function(input) {
          return mhchemParser.patterns.findObserveGroups(input, "[", "", "", "]");
        },
        "1st-level escape": /^(&|\\\\|\\hline)\s*/,
        "\\,": /^(?:\\[,\ ;:])/,
        // \\x - but output no space before
        "\\x{}{}": function(input) {
          return mhchemParser.patterns.findObserveGroups(input, "", /^\\[a-zA-Z]+\{/, "}", "", "", "{", "}", "", true);
        },
        "\\x{}": function(input) {
          return mhchemParser.patterns.findObserveGroups(input, "", /^\\[a-zA-Z]+\{/, "}", "");
        },
        "\\ca": /^\\ca(?:\s+|(?![a-zA-Z]))/,
        "\\x": /^(?:\\[a-zA-Z]+\s*|\\[_&{}%])/,
        "orbital": /^(?:[0-9]{1,2}[spdfgh]|[0-9]{0,2}sp)(?=$|[^a-zA-Z])/,
        // only those with numbers in front, because the others will be formatted correctly anyway
        "others": /^[\/~|]/,
        "\\frac{(...)}": function(input) {
          return mhchemParser.patterns.findObserveGroups(input, "\\frac{", "", "", "}", "{", "", "", "}");
        },
        "\\overset{(...)}": function(input) {
          return mhchemParser.patterns.findObserveGroups(input, "\\overset{", "", "", "}", "{", "", "", "}");
        },
        "\\underset{(...)}": function(input) {
          return mhchemParser.patterns.findObserveGroups(input, "\\underset{", "", "", "}", "{", "", "", "}");
        },
        "\\underbrace{(...)}": function(input) {
          return mhchemParser.patterns.findObserveGroups(input, "\\underbrace{", "", "", "}_", "{", "", "", "}");
        },
        "\\color{(...)}0": function(input) {
          return mhchemParser.patterns.findObserveGroups(input, "\\color{", "", "", "}");
        },
        "\\color{(...)}{(...)}1": function(input) {
          return mhchemParser.patterns.findObserveGroups(input, "\\color{", "", "", "}", "{", "", "", "}");
        },
        "\\color(...){(...)}2": function(input) {
          return mhchemParser.patterns.findObserveGroups(input, "\\color", "\\", "", /^(?=\{)/, "{", "", "", "}");
        },
        "\\ce{(...)}": function(input) {
          return mhchemParser.patterns.findObserveGroups(input, "\\ce{", "", "", "}");
        },
        "oxidation$": /^(?:[+-][IVX]+|\\pm\s*0|\$\\pm\$\s*0)$/,
        "d-oxidation$": /^(?:[+-]?\s?[IVX]+|\\pm\s*0|\$\\pm\$\s*0)$/,
        // 0 could be oxidation or charge
        "roman numeral": /^[IVX]+/,
        "1/2$": /^[+\-]?(?:[0-9]+|\$[a-z]\$|[a-z])\/[0-9]+(?:\$[a-z]\$|[a-z])?$/,
        "amount": function(input) {
          var match;
          match = input.match(/^(?:(?:(?:\([+\-]?[0-9]+\/[0-9]+\)|[+\-]?(?:[0-9]+|\$[a-z]\$|[a-z])\/[0-9]+|[+\-]?[0-9]+[.,][0-9]+|[+\-]?\.[0-9]+|[+\-]?[0-9]+)(?:[a-z](?=\s*[A-Z]))?)|[+\-]?[a-z](?=\s*[A-Z])|\+(?!\s))/);
          if (match) {
            return { match_: match[0], remainder: input.substr(match[0].length) };
          }
          var a = mhchemParser.patterns.findObserveGroups(input, "", "$", "$", "");
          if (a) {
            match = a.match_.match(/^\$(?:\(?[+\-]?(?:[0-9]*[a-z]?[+\-])?[0-9]*[a-z](?:[+\-][0-9]*[a-z]?)?\)?|\+|-)\$$/);
            if (match) {
              return { match_: match[0], remainder: input.substr(match[0].length) };
            }
          }
          return null;
        },
        "amount2": function(input) {
          return this["amount"](input);
        },
        "(KV letters),": /^(?:[A-Z][a-z]{0,2}|i)(?=,)/,
        "formula$": function(input) {
          if (input.match(/^\([a-z]+\)$/)) {
            return null;
          }
          var match = input.match(/^(?:[a-z]|(?:[0-9\ \+\-\,\.\(\)]+[a-z])+[0-9\ \+\-\,\.\(\)]*|(?:[a-z][0-9\ \+\-\,\.\(\)]+)+[a-z]?)$/);
          if (match) {
            return { match_: match[0], remainder: input.substr(match[0].length) };
          }
          return null;
        },
        "uprightEntities": /^(?:pH|pOH|pC|pK|iPr|iBu)(?=$|[^a-zA-Z])/,
        "/": /^\s*(\/)\s*/,
        "//": /^\s*(\/\/)\s*/,
        "*": /^\s*[*.]\s*/
      },
      findObserveGroups: function(input, begExcl, begIncl, endIncl, endExcl, beg2Excl, beg2Incl, end2Incl, end2Excl, combine) {
        var _match = function(input2, pattern) {
          if (typeof pattern === "string") {
            if (input2.indexOf(pattern) !== 0) {
              return null;
            }
            return pattern;
          } else {
            var match2 = input2.match(pattern);
            if (!match2) {
              return null;
            }
            return match2[0];
          }
        };
        var _findObserveGroups = function(input2, i, endChars) {
          var braces = 0;
          while (i < input2.length) {
            var a = input2.charAt(i);
            var match2 = _match(input2.substr(i), endChars);
            if (match2 !== null && braces === 0) {
              return { endMatchBegin: i, endMatchEnd: i + match2.length };
            } else if (a === "{") {
              braces++;
            } else if (a === "}") {
              if (braces === 0) {
                throw ["ExtraCloseMissingOpen", "Extra close brace or missing open brace"];
              } else {
                braces--;
              }
            }
            i++;
          }
          if (braces > 0) {
            return null;
          }
          return null;
        };
        var match = _match(input, begExcl);
        if (match === null) {
          return null;
        }
        input = input.substr(match.length);
        match = _match(input, begIncl);
        if (match === null) {
          return null;
        }
        var e = _findObserveGroups(input, match.length, endIncl || endExcl);
        if (e === null) {
          return null;
        }
        var match1 = input.substring(0, endIncl ? e.endMatchEnd : e.endMatchBegin);
        if (!(beg2Excl || beg2Incl)) {
          return {
            match_: match1,
            remainder: input.substr(e.endMatchEnd)
          };
        } else {
          var group2 = this.findObserveGroups(input.substr(e.endMatchEnd), beg2Excl, beg2Incl, end2Incl, end2Excl);
          if (group2 === null) {
            return null;
          }
          var matchRet = [match1, group2.match_];
          return {
            match_: combine ? matchRet.join("") : matchRet,
            remainder: group2.remainder
          };
        }
      },
      //
      // Matching function
      // e.g. match("a", input) will look for the regexp called "a" and see if it matches
      // returns null or {match_:"a", remainder:"bc"}
      //
      match_: function(m, input) {
        var pattern = mhchemParser.patterns.patterns[m];
        if (pattern === void 0) {
          throw ["MhchemBugP", "mhchem bug P. Please report. (" + m + ")"];
        } else if (typeof pattern === "function") {
          return mhchemParser.patterns.patterns[m](input);
        } else {
          var match = input.match(pattern);
          if (match) {
            var mm;
            if (match[2]) {
              mm = [match[1], match[2]];
            } else if (match[1]) {
              mm = match[1];
            } else {
              mm = match[0];
            }
            return { match_: mm, remainder: input.substr(match[0].length) };
          }
          return null;
        }
      }
    },
    //
    // Generic state machine actions
    //
    actions: {
      "a=": function(buffer, m) {
        buffer.a = (buffer.a || "") + m;
      },
      "b=": function(buffer, m) {
        buffer.b = (buffer.b || "") + m;
      },
      "p=": function(buffer, m) {
        buffer.p = (buffer.p || "") + m;
      },
      "o=": function(buffer, m) {
        buffer.o = (buffer.o || "") + m;
      },
      "q=": function(buffer, m) {
        buffer.q = (buffer.q || "") + m;
      },
      "d=": function(buffer, m) {
        buffer.d = (buffer.d || "") + m;
      },
      "rm=": function(buffer, m) {
        buffer.rm = (buffer.rm || "") + m;
      },
      "text=": function(buffer, m) {
        buffer.text_ = (buffer.text_ || "") + m;
      },
      "insert": function(buffer, m, a) {
        return { type_: a };
      },
      "insert+p1": function(buffer, m, a) {
        return { type_: a, p1: m };
      },
      "insert+p1+p2": function(buffer, m, a) {
        return { type_: a, p1: m[0], p2: m[1] };
      },
      "copy": function(buffer, m) {
        return m;
      },
      "rm": function(buffer, m) {
        return { type_: "rm", p1: m || "" };
      },
      "text": function(buffer, m) {
        return mhchemParser.go(m, "text");
      },
      "{text}": function(buffer, m) {
        var ret = ["{"];
        mhchemParser.concatArray(ret, mhchemParser.go(m, "text"));
        ret.push("}");
        return ret;
      },
      "tex-math": function(buffer, m) {
        return mhchemParser.go(m, "tex-math");
      },
      "tex-math tight": function(buffer, m) {
        return mhchemParser.go(m, "tex-math tight");
      },
      "bond": function(buffer, m, k) {
        return { type_: "bond", kind_: k || m };
      },
      "color0-output": function(buffer, m) {
        return { type_: "color0", color: m[0] };
      },
      "ce": function(buffer, m) {
        return mhchemParser.go(m);
      },
      "1/2": function(buffer, m) {
        var ret = [];
        if (m.match(/^[+\-]/)) {
          ret.push(m.substr(0, 1));
          m = m.substr(1);
        }
        var n = m.match(/^([0-9]+|\$[a-z]\$|[a-z])\/([0-9]+)(\$[a-z]\$|[a-z])?$/);
        n[1] = n[1].replace(/\$/g, "");
        ret.push({ type_: "frac", p1: n[1], p2: n[2] });
        if (n[3]) {
          n[3] = n[3].replace(/\$/g, "");
          ret.push({ type_: "tex-math", p1: n[3] });
        }
        return ret;
      },
      "9,9": function(buffer, m) {
        return mhchemParser.go(m, "9,9");
      }
    },
    //
    // createTransitions
    // convert  { 'letter': { 'state': { action_: 'output' } } }  to  { 'state' => [ { pattern: 'letter', task: { action_: [{type_: 'output'}] } } ] }
    // with expansion of 'a|b' to 'a' and 'b' (at 2 places)
    //
    createTransitions: function(o) {
      var pattern, state;
      var stateArray;
      var i;
      var transitions = {};
      for (pattern in o) {
        for (state in o[pattern]) {
          stateArray = state.split("|");
          o[pattern][state].stateArray = stateArray;
          for (i = 0; i < stateArray.length; i++) {
            transitions[stateArray[i]] = [];
          }
        }
      }
      for (pattern in o) {
        for (state in o[pattern]) {
          stateArray = o[pattern][state].stateArray || [];
          for (i = 0; i < stateArray.length; i++) {
            var p = o[pattern][state];
            if (p.action_) {
              p.action_ = [].concat(p.action_);
              for (var k = 0; k < p.action_.length; k++) {
                if (typeof p.action_[k] === "string") {
                  p.action_[k] = { type_: p.action_[k] };
                }
              }
            } else {
              p.action_ = [];
            }
            var patternArray = pattern.split("|");
            for (var j = 0; j < patternArray.length; j++) {
              if (stateArray[i] === "*") {
                for (var t2 in transitions) {
                  transitions[t2].push({ pattern: patternArray[j], task: p });
                }
              } else {
                transitions[stateArray[i]].push({ pattern: patternArray[j], task: p });
              }
            }
          }
        }
      }
      return transitions;
    },
    stateMachines: {}
  };
  mhchemParser.stateMachines = {
    //
    // \ce state machines
    //
    //#region ce
    "ce": {
      // main parser
      transitions: mhchemParser.createTransitions({
        "empty": {
          "*": { action_: "output" }
        },
        "else": {
          "0|1|2": { action_: "beginsWithBond=false", revisit: true, toContinue: true }
        },
        "oxidation$": {
          "0": { action_: "oxidation-output" }
        },
        "CMT": {
          "r": { action_: "rdt=", nextState: "rt" },
          "rd": { action_: "rqt=", nextState: "rdt" }
        },
        "arrowUpDown": {
          "0|1|2|as": { action_: ["sb=false", "output", "operator"], nextState: "1" }
        },
        "uprightEntities": {
          "0|1|2": { action_: ["o=", "output"], nextState: "1" }
        },
        "orbital": {
          "0|1|2|3": { action_: "o=", nextState: "o" }
        },
        "->": {
          "0|1|2|3": { action_: "r=", nextState: "r" },
          "a|as": { action_: ["output", "r="], nextState: "r" },
          "*": { action_: ["output", "r="], nextState: "r" }
        },
        "+": {
          "o": { action_: "d= kv", nextState: "d" },
          "d|D": { action_: "d=", nextState: "d" },
          "q": { action_: "d=", nextState: "qd" },
          "qd|qD": { action_: "d=", nextState: "qd" },
          "dq": { action_: ["output", "d="], nextState: "d" },
          "3": { action_: ["sb=false", "output", "operator"], nextState: "0" }
        },
        "amount": {
          "0|2": { action_: "a=", nextState: "a" }
        },
        "pm-operator": {
          "0|1|2|a|as": { action_: ["sb=false", "output", { type_: "operator", option: "\\pm" }], nextState: "0" }
        },
        "operator": {
          "0|1|2|a|as": { action_: ["sb=false", "output", "operator"], nextState: "0" }
        },
        "-$": {
          "o|q": { action_: ["charge or bond", "output"], nextState: "qd" },
          "d": { action_: "d=", nextState: "d" },
          "D": { action_: ["output", { type_: "bond", option: "-" }], nextState: "3" },
          "q": { action_: "d=", nextState: "qd" },
          "qd": { action_: "d=", nextState: "qd" },
          "qD|dq": { action_: ["output", { type_: "bond", option: "-" }], nextState: "3" }
        },
        "-9": {
          "3|o": { action_: ["output", { type_: "insert", option: "hyphen" }], nextState: "3" }
        },
        "- orbital overlap": {
          "o": { action_: ["output", { type_: "insert", option: "hyphen" }], nextState: "2" },
          "d": { action_: ["output", { type_: "insert", option: "hyphen" }], nextState: "2" }
        },
        "-": {
          "0|1|2": { action_: [{ type_: "output", option: 1 }, "beginsWithBond=true", { type_: "bond", option: "-" }], nextState: "3" },
          "3": { action_: { type_: "bond", option: "-" } },
          "a": { action_: ["output", { type_: "insert", option: "hyphen" }], nextState: "2" },
          "as": { action_: [{ type_: "output", option: 2 }, { type_: "bond", option: "-" }], nextState: "3" },
          "b": { action_: "b=" },
          "o": { action_: { type_: "- after o/d", option: false }, nextState: "2" },
          "q": { action_: { type_: "- after o/d", option: false }, nextState: "2" },
          "d|qd|dq": { action_: { type_: "- after o/d", option: true }, nextState: "2" },
          "D|qD|p": { action_: ["output", { type_: "bond", option: "-" }], nextState: "3" }
        },
        "amount2": {
          "1|3": { action_: "a=", nextState: "a" }
        },
        "letters": {
          "0|1|2|3|a|as|b|p|bp|o": { action_: "o=", nextState: "o" },
          "q|dq": { action_: ["output", "o="], nextState: "o" },
          "d|D|qd|qD": { action_: "o after d", nextState: "o" }
        },
        "digits": {
          "o": { action_: "q=", nextState: "q" },
          "d|D": { action_: "q=", nextState: "dq" },
          "q": { action_: ["output", "o="], nextState: "o" },
          "a": { action_: "o=", nextState: "o" }
        },
        "space A": {
          "b|p|bp": {}
        },
        "space": {
          "a": { nextState: "as" },
          "0": { action_: "sb=false" },
          "1|2": { action_: "sb=true" },
          "r|rt|rd|rdt|rdq": { action_: "output", nextState: "0" },
          "*": { action_: ["output", "sb=true"], nextState: "1" }
        },
        "1st-level escape": {
          "1|2": { action_: ["output", { type_: "insert+p1", option: "1st-level escape" }] },
          "*": { action_: ["output", { type_: "insert+p1", option: "1st-level escape" }], nextState: "0" }
        },
        "[(...)]": {
          "r|rt": { action_: "rd=", nextState: "rd" },
          "rd|rdt": { action_: "rq=", nextState: "rdq" }
        },
        "...": {
          "o|d|D|dq|qd|qD": { action_: ["output", { type_: "bond", option: "..." }], nextState: "3" },
          "*": { action_: [{ type_: "output", option: 1 }, { type_: "insert", option: "ellipsis" }], nextState: "1" }
        },
        ". |* ": {
          "*": { action_: ["output", { type_: "insert", option: "addition compound" }], nextState: "1" }
        },
        "state of aggregation $": {
          "*": { action_: ["output", "state of aggregation"], nextState: "1" }
        },
        "{[(": {
          "a|as|o": { action_: ["o=", "output", "parenthesisLevel++"], nextState: "2" },
          "0|1|2|3": { action_: ["o=", "output", "parenthesisLevel++"], nextState: "2" },
          "*": { action_: ["output", "o=", "output", "parenthesisLevel++"], nextState: "2" }
        },
        ")]}": {
          "0|1|2|3|b|p|bp|o": { action_: ["o=", "parenthesisLevel--"], nextState: "o" },
          "a|as|d|D|q|qd|qD|dq": { action_: ["output", "o=", "parenthesisLevel--"], nextState: "o" }
        },
        ", ": {
          "*": { action_: ["output", "comma"], nextState: "0" }
        },
        "^_": {
          // ^ and _ without a sensible argument
          "*": {}
        },
        "^{(...)}|^($...$)": {
          "0|1|2|as": { action_: "b=", nextState: "b" },
          "p": { action_: "b=", nextState: "bp" },
          "3|o": { action_: "d= kv", nextState: "D" },
          "q": { action_: "d=", nextState: "qD" },
          "d|D|qd|qD|dq": { action_: ["output", "d="], nextState: "D" }
        },
        "^a|^\\x{}{}|^\\x{}|^\\x|'": {
          "0|1|2|as": { action_: "b=", nextState: "b" },
          "p": { action_: "b=", nextState: "bp" },
          "3|o": { action_: "d= kv", nextState: "d" },
          "q": { action_: "d=", nextState: "qd" },
          "d|qd|D|qD": { action_: "d=" },
          "dq": { action_: ["output", "d="], nextState: "d" }
        },
        "_{(state of aggregation)}$": {
          "d|D|q|qd|qD|dq": { action_: ["output", "q="], nextState: "q" }
        },
        "_{(...)}|_($...$)|_9|_\\x{}{}|_\\x{}|_\\x": {
          "0|1|2|as": { action_: "p=", nextState: "p" },
          "b": { action_: "p=", nextState: "bp" },
          "3|o": { action_: "q=", nextState: "q" },
          "d|D": { action_: "q=", nextState: "dq" },
          "q|qd|qD|dq": { action_: ["output", "q="], nextState: "q" }
        },
        "=<>": {
          "0|1|2|3|a|as|o|q|d|D|qd|qD|dq": { action_: [{ type_: "output", option: 2 }, "bond"], nextState: "3" }
        },
        "#": {
          "0|1|2|3|a|as|o": { action_: [{ type_: "output", option: 2 }, { type_: "bond", option: "#" }], nextState: "3" }
        },
        "{}": {
          "*": { action_: { type_: "output", option: 1 }, nextState: "1" }
        },
        "{...}": {
          "0|1|2|3|a|as|b|p|bp": { action_: "o=", nextState: "o" },
          "o|d|D|q|qd|qD|dq": { action_: ["output", "o="], nextState: "o" }
        },
        "$...$": {
          "a": { action_: "a=" },
          // 2$n$
          "0|1|2|3|as|b|p|bp|o": { action_: "o=", nextState: "o" },
          // not 'amount'
          "as|o": { action_: "o=" },
          "q|d|D|qd|qD|dq": { action_: ["output", "o="], nextState: "o" }
        },
        "\\bond{(...)}": {
          "*": { action_: [{ type_: "output", option: 2 }, "bond"], nextState: "3" }
        },
        "\\frac{(...)}": {
          "*": { action_: [{ type_: "output", option: 1 }, "frac-output"], nextState: "3" }
        },
        "\\overset{(...)}": {
          "*": { action_: [{ type_: "output", option: 2 }, "overset-output"], nextState: "3" }
        },
        "\\underset{(...)}": {
          "*": { action_: [{ type_: "output", option: 2 }, "underset-output"], nextState: "3" }
        },
        "\\underbrace{(...)}": {
          "*": { action_: [{ type_: "output", option: 2 }, "underbrace-output"], nextState: "3" }
        },
        "\\color{(...)}{(...)}1|\\color(...){(...)}2": {
          "*": { action_: [{ type_: "output", option: 2 }, "color-output"], nextState: "3" }
        },
        "\\color{(...)}0": {
          "*": { action_: [{ type_: "output", option: 2 }, "color0-output"] }
        },
        "\\ce{(...)}": {
          "*": { action_: [{ type_: "output", option: 2 }, "ce"], nextState: "3" }
        },
        "\\,": {
          "*": { action_: [{ type_: "output", option: 1 }, "copy"], nextState: "1" }
        },
        "\\x{}{}|\\x{}|\\x": {
          "0|1|2|3|a|as|b|p|bp|o|c0": { action_: ["o=", "output"], nextState: "3" },
          "*": { action_: ["output", "o=", "output"], nextState: "3" }
        },
        "others": {
          "*": { action_: [{ type_: "output", option: 1 }, "copy"], nextState: "3" }
        },
        "else2": {
          "a": { action_: "a to o", nextState: "o", revisit: true },
          "as": { action_: ["output", "sb=true"], nextState: "1", revisit: true },
          "r|rt|rd|rdt|rdq": { action_: ["output"], nextState: "0", revisit: true },
          "*": { action_: ["output", "copy"], nextState: "3" }
        }
      }),
      actions: {
        "o after d": function(buffer, m) {
          var ret;
          if ((buffer.d || "").match(/^[0-9]+$/)) {
            var tmp = buffer.d;
            buffer.d = void 0;
            ret = this["output"](buffer);
            buffer.b = tmp;
          } else {
            ret = this["output"](buffer);
          }
          mhchemParser.actions["o="](buffer, m);
          return ret;
        },
        "d= kv": function(buffer, m) {
          buffer.d = m;
          buffer.dType = "kv";
        },
        "charge or bond": function(buffer, m) {
          if (buffer["beginsWithBond"]) {
            var ret = [];
            mhchemParser.concatArray(ret, this["output"](buffer));
            mhchemParser.concatArray(ret, mhchemParser.actions["bond"](buffer, m, "-"));
            return ret;
          } else {
            buffer.d = m;
          }
        },
        "- after o/d": function(buffer, m, isAfterD) {
          var c1 = mhchemParser.patterns.match_("orbital", buffer.o || "");
          var c2 = mhchemParser.patterns.match_("one lowercase greek letter $", buffer.o || "");
          var c3 = mhchemParser.patterns.match_("one lowercase latin letter $", buffer.o || "");
          var c4 = mhchemParser.patterns.match_("$one lowercase latin letter$ $", buffer.o || "");
          var hyphenFollows = m === "-" && (c1 && c1.remainder === "" || c2 || c3 || c4);
          if (hyphenFollows && !buffer.a && !buffer.b && !buffer.p && !buffer.d && !buffer.q && !c1 && c3) {
            buffer.o = "$" + buffer.o + "$";
          }
          var ret = [];
          if (hyphenFollows) {
            mhchemParser.concatArray(ret, this["output"](buffer));
            ret.push({ type_: "hyphen" });
          } else {
            c1 = mhchemParser.patterns.match_("digits", buffer.d || "");
            if (isAfterD && c1 && c1.remainder === "") {
              mhchemParser.concatArray(ret, mhchemParser.actions["d="](buffer, m));
              mhchemParser.concatArray(ret, this["output"](buffer));
            } else {
              mhchemParser.concatArray(ret, this["output"](buffer));
              mhchemParser.concatArray(ret, mhchemParser.actions["bond"](buffer, m, "-"));
            }
          }
          return ret;
        },
        "a to o": function(buffer) {
          buffer.o = buffer.a;
          buffer.a = void 0;
        },
        "sb=true": function(buffer) {
          buffer.sb = true;
        },
        "sb=false": function(buffer) {
          buffer.sb = false;
        },
        "beginsWithBond=true": function(buffer) {
          buffer["beginsWithBond"] = true;
        },
        "beginsWithBond=false": function(buffer) {
          buffer["beginsWithBond"] = false;
        },
        "parenthesisLevel++": function(buffer) {
          buffer["parenthesisLevel"]++;
        },
        "parenthesisLevel--": function(buffer) {
          buffer["parenthesisLevel"]--;
        },
        "state of aggregation": function(buffer, m) {
          return { type_: "state of aggregation", p1: mhchemParser.go(m, "o") };
        },
        "comma": function(buffer, m) {
          var a = m.replace(/\s*$/, "");
          var withSpace = a !== m;
          if (withSpace && buffer["parenthesisLevel"] === 0) {
            return { type_: "comma enumeration L", p1: a };
          } else {
            return { type_: "comma enumeration M", p1: a };
          }
        },
        "output": function(buffer, m, entityFollows) {
          var ret;
          if (!buffer.r) {
            ret = [];
            if (!buffer.a && !buffer.b && !buffer.p && !buffer.o && !buffer.q && !buffer.d && !entityFollows) {
            } else {
              if (buffer.sb) {
                ret.push({ type_: "entitySkip" });
              }
              if (!buffer.o && !buffer.q && !buffer.d && !buffer.b && !buffer.p && entityFollows !== 2) {
                buffer.o = buffer.a;
                buffer.a = void 0;
              } else if (!buffer.o && !buffer.q && !buffer.d && (buffer.b || buffer.p)) {
                buffer.o = buffer.a;
                buffer.d = buffer.b;
                buffer.q = buffer.p;
                buffer.a = buffer.b = buffer.p = void 0;
              } else {
                if (buffer.o && buffer.dType === "kv" && mhchemParser.patterns.match_("d-oxidation$", buffer.d || "")) {
                  buffer.dType = "oxidation";
                } else if (buffer.o && buffer.dType === "kv" && !buffer.q) {
                  buffer.dType = void 0;
                }
              }
              ret.push({
                type_: "chemfive",
                a: mhchemParser.go(buffer.a, "a"),
                b: mhchemParser.go(buffer.b, "bd"),
                p: mhchemParser.go(buffer.p, "pq"),
                o: mhchemParser.go(buffer.o, "o"),
                q: mhchemParser.go(buffer.q, "pq"),
                d: mhchemParser.go(buffer.d, buffer.dType === "oxidation" ? "oxidation" : "bd"),
                dType: buffer.dType
              });
            }
          } else {
            var rd;
            if (buffer.rdt === "M") {
              rd = mhchemParser.go(buffer.rd, "tex-math");
            } else if (buffer.rdt === "T") {
              rd = [{ type_: "text", p1: buffer.rd || "" }];
            } else {
              rd = mhchemParser.go(buffer.rd);
            }
            var rq;
            if (buffer.rqt === "M") {
              rq = mhchemParser.go(buffer.rq, "tex-math");
            } else if (buffer.rqt === "T") {
              rq = [{ type_: "text", p1: buffer.rq || "" }];
            } else {
              rq = mhchemParser.go(buffer.rq);
            }
            ret = {
              type_: "arrow",
              r: buffer.r,
              rd,
              rq
            };
          }
          for (var p in buffer) {
            if (p !== "parenthesisLevel" && p !== "beginsWithBond") {
              delete buffer[p];
            }
          }
          return ret;
        },
        "oxidation-output": function(buffer, m) {
          var ret = ["{"];
          mhchemParser.concatArray(ret, mhchemParser.go(m, "oxidation"));
          ret.push("}");
          return ret;
        },
        "frac-output": function(buffer, m) {
          return { type_: "frac-ce", p1: mhchemParser.go(m[0]), p2: mhchemParser.go(m[1]) };
        },
        "overset-output": function(buffer, m) {
          return { type_: "overset", p1: mhchemParser.go(m[0]), p2: mhchemParser.go(m[1]) };
        },
        "underset-output": function(buffer, m) {
          return { type_: "underset", p1: mhchemParser.go(m[0]), p2: mhchemParser.go(m[1]) };
        },
        "underbrace-output": function(buffer, m) {
          return { type_: "underbrace", p1: mhchemParser.go(m[0]), p2: mhchemParser.go(m[1]) };
        },
        "color-output": function(buffer, m) {
          return { type_: "color", color1: m[0], color2: mhchemParser.go(m[1]) };
        },
        "r=": function(buffer, m) {
          buffer.r = m;
        },
        "rdt=": function(buffer, m) {
          buffer.rdt = m;
        },
        "rd=": function(buffer, m) {
          buffer.rd = m;
        },
        "rqt=": function(buffer, m) {
          buffer.rqt = m;
        },
        "rq=": function(buffer, m) {
          buffer.rq = m;
        },
        "operator": function(buffer, m, p1) {
          return { type_: "operator", kind_: p1 || m };
        }
      }
    },
    "a": {
      transitions: mhchemParser.createTransitions({
        "empty": {
          "*": {}
        },
        "1/2$": {
          "0": { action_: "1/2" }
        },
        "else": {
          "0": { nextState: "1", revisit: true }
        },
        "$(...)$": {
          "*": { action_: "tex-math tight", nextState: "1" }
        },
        ",": {
          "*": { action_: { type_: "insert", option: "commaDecimal" } }
        },
        "else2": {
          "*": { action_: "copy" }
        }
      }),
      actions: {}
    },
    "o": {
      transitions: mhchemParser.createTransitions({
        "empty": {
          "*": {}
        },
        "1/2$": {
          "0": { action_: "1/2" }
        },
        "else": {
          "0": { nextState: "1", revisit: true }
        },
        "letters": {
          "*": { action_: "rm" }
        },
        "\\ca": {
          "*": { action_: { type_: "insert", option: "circa" } }
        },
        "\\x{}{}|\\x{}|\\x": {
          "*": { action_: "copy" }
        },
        "${(...)}$|$(...)$": {
          "*": { action_: "tex-math" }
        },
        "{(...)}": {
          "*": { action_: "{text}" }
        },
        "else2": {
          "*": { action_: "copy" }
        }
      }),
      actions: {}
    },
    "text": {
      transitions: mhchemParser.createTransitions({
        "empty": {
          "*": { action_: "output" }
        },
        "{...}": {
          "*": { action_: "text=" }
        },
        "${(...)}$|$(...)$": {
          "*": { action_: "tex-math" }
        },
        "\\greek": {
          "*": { action_: ["output", "rm"] }
        },
        "\\,|\\x{}{}|\\x{}|\\x": {
          "*": { action_: ["output", "copy"] }
        },
        "else": {
          "*": { action_: "text=" }
        }
      }),
      actions: {
        "output": function(buffer) {
          if (buffer.text_) {
            var ret = { type_: "text", p1: buffer.text_ };
            for (var p in buffer) {
              delete buffer[p];
            }
            return ret;
          }
        }
      }
    },
    "pq": {
      transitions: mhchemParser.createTransitions({
        "empty": {
          "*": {}
        },
        "state of aggregation $": {
          "*": { action_: "state of aggregation" }
        },
        "i$": {
          "0": { nextState: "!f", revisit: true }
        },
        "(KV letters),": {
          "0": { action_: "rm", nextState: "0" }
        },
        "formula$": {
          "0": { nextState: "f", revisit: true }
        },
        "1/2$": {
          "0": { action_: "1/2" }
        },
        "else": {
          "0": { nextState: "!f", revisit: true }
        },
        "${(...)}$|$(...)$": {
          "*": { action_: "tex-math" }
        },
        "{(...)}": {
          "*": { action_: "text" }
        },
        "a-z": {
          "f": { action_: "tex-math" }
        },
        "letters": {
          "*": { action_: "rm" }
        },
        "-9.,9": {
          "*": { action_: "9,9" }
        },
        ",": {
          "*": { action_: { type_: "insert+p1", option: "comma enumeration S" } }
        },
        "\\color{(...)}{(...)}1|\\color(...){(...)}2": {
          "*": { action_: "color-output" }
        },
        "\\color{(...)}0": {
          "*": { action_: "color0-output" }
        },
        "\\ce{(...)}": {
          "*": { action_: "ce" }
        },
        "\\,|\\x{}{}|\\x{}|\\x": {
          "*": { action_: "copy" }
        },
        "else2": {
          "*": { action_: "copy" }
        }
      }),
      actions: {
        "state of aggregation": function(buffer, m) {
          return { type_: "state of aggregation subscript", p1: mhchemParser.go(m, "o") };
        },
        "color-output": function(buffer, m) {
          return { type_: "color", color1: m[0], color2: mhchemParser.go(m[1], "pq") };
        }
      }
    },
    "bd": {
      transitions: mhchemParser.createTransitions({
        "empty": {
          "*": {}
        },
        "x$": {
          "0": { nextState: "!f", revisit: true }
        },
        "formula$": {
          "0": { nextState: "f", revisit: true }
        },
        "else": {
          "0": { nextState: "!f", revisit: true }
        },
        "-9.,9 no missing 0": {
          "*": { action_: "9,9" }
        },
        ".": {
          "*": { action_: { type_: "insert", option: "electron dot" } }
        },
        "a-z": {
          "f": { action_: "tex-math" }
        },
        "x": {
          "*": { action_: { type_: "insert", option: "KV x" } }
        },
        "letters": {
          "*": { action_: "rm" }
        },
        "'": {
          "*": { action_: { type_: "insert", option: "prime" } }
        },
        "${(...)}$|$(...)$": {
          "*": { action_: "tex-math" }
        },
        "{(...)}": {
          "*": { action_: "text" }
        },
        "\\color{(...)}{(...)}1|\\color(...){(...)}2": {
          "*": { action_: "color-output" }
        },
        "\\color{(...)}0": {
          "*": { action_: "color0-output" }
        },
        "\\ce{(...)}": {
          "*": { action_: "ce" }
        },
        "\\,|\\x{}{}|\\x{}|\\x": {
          "*": { action_: "copy" }
        },
        "else2": {
          "*": { action_: "copy" }
        }
      }),
      actions: {
        "color-output": function(buffer, m) {
          return { type_: "color", color1: m[0], color2: mhchemParser.go(m[1], "bd") };
        }
      }
    },
    "oxidation": {
      transitions: mhchemParser.createTransitions({
        "empty": {
          "*": {}
        },
        "roman numeral": {
          "*": { action_: "roman-numeral" }
        },
        "${(...)}$|$(...)$": {
          "*": { action_: "tex-math" }
        },
        "else": {
          "*": { action_: "copy" }
        }
      }),
      actions: {
        "roman-numeral": function(buffer, m) {
          return { type_: "roman numeral", p1: m || "" };
        }
      }
    },
    "tex-math": {
      transitions: mhchemParser.createTransitions({
        "empty": {
          "*": { action_: "output" }
        },
        "\\ce{(...)}": {
          "*": { action_: ["output", "ce"] }
        },
        "{...}|\\,|\\x{}{}|\\x{}|\\x": {
          "*": { action_: "o=" }
        },
        "else": {
          "*": { action_: "o=" }
        }
      }),
      actions: {
        "output": function(buffer) {
          if (buffer.o) {
            var ret = { type_: "tex-math", p1: buffer.o };
            for (var p in buffer) {
              delete buffer[p];
            }
            return ret;
          }
        }
      }
    },
    "tex-math tight": {
      transitions: mhchemParser.createTransitions({
        "empty": {
          "*": { action_: "output" }
        },
        "\\ce{(...)}": {
          "*": { action_: ["output", "ce"] }
        },
        "{...}|\\,|\\x{}{}|\\x{}|\\x": {
          "*": { action_: "o=" }
        },
        "-|+": {
          "*": { action_: "tight operator" }
        },
        "else": {
          "*": { action_: "o=" }
        }
      }),
      actions: {
        "tight operator": function(buffer, m) {
          buffer.o = (buffer.o || "") + "{" + m + "}";
        },
        "output": function(buffer) {
          if (buffer.o) {
            var ret = { type_: "tex-math", p1: buffer.o };
            for (var p in buffer) {
              delete buffer[p];
            }
            return ret;
          }
        }
      }
    },
    "9,9": {
      transitions: mhchemParser.createTransitions({
        "empty": {
          "*": {}
        },
        ",": {
          "*": { action_: "comma" }
        },
        "else": {
          "*": { action_: "copy" }
        }
      }),
      actions: {
        "comma": function() {
          return { type_: "commaDecimal" };
        }
      }
    },
    //#endregion
    //
    // \pu state machines
    //
    //#region pu
    "pu": {
      transitions: mhchemParser.createTransitions({
        "empty": {
          "*": { action_: "output" }
        },
        "space$": {
          "*": { action_: ["output", "space"] }
        },
        "{[(|)]}": {
          "0|a": { action_: "copy" }
        },
        "(-)(9)^(-9)": {
          "0": { action_: "number^", nextState: "a" }
        },
        "(-)(9.,9)(e)(99)": {
          "0": { action_: "enumber", nextState: "a" }
        },
        "space": {
          "0|a": {}
        },
        "pm-operator": {
          "0|a": { action_: { type_: "operator", option: "\\pm" }, nextState: "0" }
        },
        "operator": {
          "0|a": { action_: "copy", nextState: "0" }
        },
        "//": {
          "d": { action_: "o=", nextState: "/" }
        },
        "/": {
          "d": { action_: "o=", nextState: "/" }
        },
        "{...}|else": {
          "0|d": { action_: "d=", nextState: "d" },
          "a": { action_: ["space", "d="], nextState: "d" },
          "/|q": { action_: "q=", nextState: "q" }
        }
      }),
      actions: {
        "enumber": function(buffer, m) {
          var ret = [];
          if (m[0] === "+-" || m[0] === "+/-") {
            ret.push("\\pm ");
          } else if (m[0]) {
            ret.push(m[0]);
          }
          if (m[1]) {
            mhchemParser.concatArray(ret, mhchemParser.go(m[1], "pu-9,9"));
            if (m[2]) {
              if (m[2].match(/[,.]/)) {
                mhchemParser.concatArray(ret, mhchemParser.go(m[2], "pu-9,9"));
              } else {
                ret.push(m[2]);
              }
            }
            m[3] = m[4] || m[3];
            if (m[3]) {
              m[3] = m[3].trim();
              if (m[3] === "e" || m[3].substr(0, 1) === "*") {
                ret.push({ type_: "cdot" });
              } else {
                ret.push({ type_: "times" });
              }
            }
          }
          if (m[3]) {
            ret.push("10^{" + m[5] + "}");
          }
          return ret;
        },
        "number^": function(buffer, m) {
          var ret = [];
          if (m[0] === "+-" || m[0] === "+/-") {
            ret.push("\\pm ");
          } else if (m[0]) {
            ret.push(m[0]);
          }
          mhchemParser.concatArray(ret, mhchemParser.go(m[1], "pu-9,9"));
          ret.push("^{" + m[2] + "}");
          return ret;
        },
        "operator": function(buffer, m, p1) {
          return { type_: "operator", kind_: p1 || m };
        },
        "space": function() {
          return { type_: "pu-space-1" };
        },
        "output": function(buffer) {
          var ret;
          var md = mhchemParser.patterns.match_("{(...)}", buffer.d || "");
          if (md && md.remainder === "") {
            buffer.d = md.match_;
          }
          var mq = mhchemParser.patterns.match_("{(...)}", buffer.q || "");
          if (mq && mq.remainder === "") {
            buffer.q = mq.match_;
          }
          if (buffer.d) {
            buffer.d = buffer.d.replace(/\u00B0C|\^oC|\^{o}C/g, "{}^{\\circ}C");
            buffer.d = buffer.d.replace(/\u00B0F|\^oF|\^{o}F/g, "{}^{\\circ}F");
          }
          if (buffer.q) {
            buffer.q = buffer.q.replace(/\u00B0C|\^oC|\^{o}C/g, "{}^{\\circ}C");
            buffer.q = buffer.q.replace(/\u00B0F|\^oF|\^{o}F/g, "{}^{\\circ}F");
            var b5 = {
              d: mhchemParser.go(buffer.d, "pu"),
              q: mhchemParser.go(buffer.q, "pu")
            };
            if (buffer.o === "//") {
              ret = { type_: "pu-frac", p1: b5.d, p2: b5.q };
            } else {
              ret = b5.d;
              if (b5.d.length > 1 || b5.q.length > 1) {
                ret.push({ type_: " / " });
              } else {
                ret.push({ type_: "/" });
              }
              mhchemParser.concatArray(ret, b5.q);
            }
          } else {
            ret = mhchemParser.go(buffer.d, "pu-2");
          }
          for (var p in buffer) {
            delete buffer[p];
          }
          return ret;
        }
      }
    },
    "pu-2": {
      transitions: mhchemParser.createTransitions({
        "empty": {
          "*": { action_: "output" }
        },
        "*": {
          "*": { action_: ["output", "cdot"], nextState: "0" }
        },
        "\\x": {
          "*": { action_: "rm=" }
        },
        "space": {
          "*": { action_: ["output", "space"], nextState: "0" }
        },
        "^{(...)}|^(-1)": {
          "1": { action_: "^(-1)" }
        },
        "-9.,9": {
          "0": { action_: "rm=", nextState: "0" },
          "1": { action_: "^(-1)", nextState: "0" }
        },
        "{...}|else": {
          "*": { action_: "rm=", nextState: "1" }
        }
      }),
      actions: {
        "cdot": function() {
          return { type_: "tight cdot" };
        },
        "^(-1)": function(buffer, m) {
          buffer.rm += "^{" + m + "}";
        },
        "space": function() {
          return { type_: "pu-space-2" };
        },
        "output": function(buffer) {
          var ret = [];
          if (buffer.rm) {
            var mrm = mhchemParser.patterns.match_("{(...)}", buffer.rm || "");
            if (mrm && mrm.remainder === "") {
              ret = mhchemParser.go(mrm.match_, "pu");
            } else {
              ret = { type_: "rm", p1: buffer.rm };
            }
          }
          for (var p in buffer) {
            delete buffer[p];
          }
          return ret;
        }
      }
    },
    "pu-9,9": {
      transitions: mhchemParser.createTransitions({
        "empty": {
          "0": { action_: "output-0" },
          "o": { action_: "output-o" }
        },
        ",": {
          "0": { action_: ["output-0", "comma"], nextState: "o" }
        },
        ".": {
          "0": { action_: ["output-0", "copy"], nextState: "o" }
        },
        "else": {
          "*": { action_: "text=" }
        }
      }),
      actions: {
        "comma": function() {
          return { type_: "commaDecimal" };
        },
        "output-0": function(buffer) {
          var ret = [];
          buffer.text_ = buffer.text_ || "";
          if (buffer.text_.length > 4) {
            var a = buffer.text_.length % 3;
            if (a === 0) {
              a = 3;
            }
            for (var i = buffer.text_.length - 3; i > 0; i -= 3) {
              ret.push(buffer.text_.substr(i, 3));
              ret.push({ type_: "1000 separator" });
            }
            ret.push(buffer.text_.substr(0, a));
            ret.reverse();
          } else {
            ret.push(buffer.text_);
          }
          for (var p in buffer) {
            delete buffer[p];
          }
          return ret;
        },
        "output-o": function(buffer) {
          var ret = [];
          buffer.text_ = buffer.text_ || "";
          if (buffer.text_.length > 4) {
            var a = buffer.text_.length - 3;
            for (var i = 0; i < a; i += 3) {
              ret.push(buffer.text_.substr(i, 3));
              ret.push({ type_: "1000 separator" });
            }
            ret.push(buffer.text_.substr(i));
          } else {
            ret.push(buffer.text_);
          }
          for (var p in buffer) {
            delete buffer[p];
          }
          return ret;
        }
      }
    }
    //#endregion
  };
  var texify = {
    go: function(input, isInner) {
      if (!input) {
        return "";
      }
      var res = "";
      var cee = false;
      for (var i = 0; i < input.length; i++) {
        var inputi = input[i];
        if (typeof inputi === "string") {
          res += inputi;
        } else {
          res += texify._go2(inputi);
          if (inputi.type_ === "1st-level escape") {
            cee = true;
          }
        }
      }
      if (!isInner && !cee && res) {
        res = "{" + res + "}";
      }
      return res;
    },
    _goInner: function(input) {
      if (!input) {
        return input;
      }
      return texify.go(input, true);
    },
    _go2: function(buf) {
      var res;
      switch (buf.type_) {
        case "chemfive":
          res = "";
          var b5 = {
            a: texify._goInner(buf.a),
            b: texify._goInner(buf.b),
            p: texify._goInner(buf.p),
            o: texify._goInner(buf.o),
            q: texify._goInner(buf.q),
            d: texify._goInner(buf.d)
          };
          if (b5.a) {
            if (b5.a.match(/^[+\-]/)) {
              b5.a = "{" + b5.a + "}";
            }
            res += b5.a + "\\,";
          }
          if (b5.b || b5.p) {
            res += "{\\vphantom{X}}";
            res += "^{\\hphantom{" + (b5.b || "") + "}}_{\\hphantom{" + (b5.p || "") + "}}";
            res += "{\\vphantom{X}}";
            res += "^{\\vphantom{2}\\mathllap{" + (b5.b || "") + "}}";
            res += "_{\\vphantom{2}\\mathllap{" + (b5.p || "") + "}}";
          }
          if (b5.o) {
            if (b5.o.match(/^[+\-]/)) {
              b5.o = "{" + b5.o + "}";
            }
            res += b5.o;
          }
          if (buf.dType === "kv") {
            if (b5.d || b5.q) {
              res += "{\\vphantom{X}}";
            }
            if (b5.d) {
              res += "^{" + b5.d + "}";
            }
            if (b5.q) {
              res += "_{" + b5.q + "}";
            }
          } else if (buf.dType === "oxidation") {
            if (b5.d) {
              res += "{\\vphantom{X}}";
              res += "^{" + b5.d + "}";
            }
            if (b5.q) {
              res += "{{}}";
              res += "_{" + b5.q + "}";
            }
          } else {
            if (b5.q) {
              res += "{{}}";
              res += "_{" + b5.q + "}";
            }
            if (b5.d) {
              res += "{{}}";
              res += "^{" + b5.d + "}";
            }
          }
          break;
        case "rm":
          res = "\\mathrm{" + buf.p1 + "}";
          break;
        case "text":
          if (buf.p1.match(/[\^_]/)) {
            buf.p1 = buf.p1.replace(" ", "~").replace("-", "\\text{-}");
            res = "\\mathrm{" + buf.p1 + "}";
          } else {
            res = "\\text{" + buf.p1 + "}";
          }
          break;
        case "roman numeral":
          res = "\\mathrm{" + buf.p1 + "}";
          break;
        case "state of aggregation":
          res = "\\mskip2mu " + texify._goInner(buf.p1);
          break;
        case "state of aggregation subscript":
          res = "\\mskip1mu " + texify._goInner(buf.p1);
          break;
        case "bond":
          res = texify._getBond(buf.kind_);
          if (!res) {
            throw ["MhchemErrorBond", "mhchem Error. Unknown bond type (" + buf.kind_ + ")"];
          }
          break;
        case "frac":
          var c2 = "\\frac{" + buf.p1 + "}{" + buf.p2 + "}";
          res = "\\mathchoice{\\textstyle" + c2 + "}{" + c2 + "}{" + c2 + "}{" + c2 + "}";
          break;
        case "pu-frac":
          var d = "\\frac{" + texify._goInner(buf.p1) + "}{" + texify._goInner(buf.p2) + "}";
          res = "\\mathchoice{\\textstyle" + d + "}{" + d + "}{" + d + "}{" + d + "}";
          break;
        case "tex-math":
          res = buf.p1 + " ";
          break;
        case "frac-ce":
          res = "\\frac{" + texify._goInner(buf.p1) + "}{" + texify._goInner(buf.p2) + "}";
          break;
        case "overset":
          res = "\\overset{" + texify._goInner(buf.p1) + "}{" + texify._goInner(buf.p2) + "}";
          break;
        case "underset":
          res = "\\underset{" + texify._goInner(buf.p1) + "}{" + texify._goInner(buf.p2) + "}";
          break;
        case "underbrace":
          res = "\\underbrace{" + texify._goInner(buf.p1) + "}_{" + texify._goInner(buf.p2) + "}";
          break;
        case "color":
          res = "{\\color{" + buf.color1 + "}{" + texify._goInner(buf.color2) + "}}";
          break;
        case "color0":
          res = "\\color{" + buf.color + "}";
          break;
        case "arrow":
          var b6 = {
            rd: texify._goInner(buf.rd),
            rq: texify._goInner(buf.rq)
          };
          var arrow = texify._getArrow(buf.r);
          if (b6.rq) {
            arrow += "[{\\rm " + b6.rq + "}]";
          }
          if (b6.rd) {
            arrow += "{\\rm " + b6.rd + "}";
          } else {
            arrow += "{}";
          }
          res = arrow;
          break;
        case "operator":
          res = texify._getOperator(buf.kind_);
          break;
        case "1st-level escape":
          res = buf.p1 + " ";
          break;
        case "space":
          res = " ";
          break;
        case "entitySkip":
          res = "~";
          break;
        case "pu-space-1":
          res = "~";
          break;
        case "pu-space-2":
          res = "\\mkern3mu ";
          break;
        case "1000 separator":
          res = "\\mkern2mu ";
          break;
        case "commaDecimal":
          res = "{,}";
          break;
        case "comma enumeration L":
          res = "{" + buf.p1 + "}\\mkern6mu ";
          break;
        case "comma enumeration M":
          res = "{" + buf.p1 + "}\\mkern3mu ";
          break;
        case "comma enumeration S":
          res = "{" + buf.p1 + "}\\mkern1mu ";
          break;
        case "hyphen":
          res = "\\text{-}";
          break;
        case "addition compound":
          res = "\\,{\\cdot}\\,";
          break;
        case "electron dot":
          res = "\\mkern1mu \\text{\\textbullet}\\mkern1mu ";
          break;
        case "KV x":
          res = "{\\times}";
          break;
        case "prime":
          res = "\\prime ";
          break;
        case "cdot":
          res = "\\cdot ";
          break;
        case "tight cdot":
          res = "\\mkern1mu{\\cdot}\\mkern1mu ";
          break;
        case "times":
          res = "\\times ";
          break;
        case "circa":
          res = "{\\sim}";
          break;
        case "^":
          res = "uparrow";
          break;
        case "v":
          res = "downarrow";
          break;
        case "ellipsis":
          res = "\\ldots ";
          break;
        case "/":
          res = "/";
          break;
        case " / ":
          res = "\\,/\\,";
          break;
        default:
          assertNever(buf);
          throw ["MhchemBugT", "mhchem bug T. Please report."];
      }
      assertString(res);
      return res;
    },
    _getArrow: function(a) {
      switch (a) {
        case "->":
          return "\\yields";
        case "\u2192":
          return "\\yields";
        case "\u27F6":
          return "\\yields";
        case "<-":
          return "\\yieldsLeft";
        case "<->":
          return "\\mesomerism";
        case "<-->":
          return "\\yieldsLeftRight";
        case "<=>":
          return "\\chemequilibrium";
        case "\u21CC":
          return "\\chemequilibrium";
        case "<=>>":
          return "\\equilibriumRight";
        case "<<=>":
          return "\\equilibriumLeft";
        default:
          assertNever(a);
          throw ["MhchemBugT", "mhchem bug T. Please report."];
      }
    },
    _getBond: function(a) {
      switch (a) {
        case "-":
          return "{-}";
        case "1":
          return "{-}";
        case "=":
          return "{=}";
        case "2":
          return "{=}";
        case "#":
          return "{\\equiv}";
        case "3":
          return "{\\equiv}";
        case "~":
          return "{\\tripleDash}";
        case "~-":
          return "{\\tripleDashOverLine}";
        case "~=":
          return "{\\tripleDashOverDoubleLine}";
        case "~--":
          return "{\\tripleDashOverDoubleLine}";
        case "-~-":
          return "{\\tripleDashBetweenDoubleLine}";
        case "...":
          return "{{\\cdot}{\\cdot}{\\cdot}}";
        case "....":
          return "{{\\cdot}{\\cdot}{\\cdot}{\\cdot}}";
        case "->":
          return "{\\rightarrow}";
        case "<-":
          return "{\\leftarrow}";
        case "<":
          return "{<}";
        case ">":
          return "{>}";
        default:
          assertNever(a);
          throw ["MhchemBugT", "mhchem bug T. Please report."];
      }
    },
    _getOperator: function(a) {
      switch (a) {
        case "+":
          return " {}+{} ";
        case "-":
          return " {}-{} ";
        case "=":
          return " {}={} ";
        case "<":
          return " {}<{} ";
        case ">":
          return " {}>{} ";
        case "<<":
          return " {}\\ll{} ";
        case ">>":
          return " {}\\gg{} ";
        case "\\pm":
          return " {}\\pm{} ";
        case "\\approx":
          return " {}\\approx{} ";
        case "$\\approx$":
          return " {}\\approx{} ";
        case "v":
          return " \\downarrow{} ";
        case "(v)":
          return " \\downarrow{} ";
        case "^":
          return " \\uparrow{} ";
        case "(^)":
          return " \\uparrow{} ";
        default:
          assertNever(a);
          throw ["MhchemBugT", "mhchem bug T. Please report."];
      }
    }
  };
  function assertNever(a) {
  }
  function assertString(a) {
  }
  defineMacro("\\darr", "\\downarrow");
  defineMacro("\\dArr", "\\Downarrow");
  defineMacro("\\Darr", "\\Downarrow");
  defineMacro("\\lang", "\\langle");
  defineMacro("\\rang", "\\rangle");
  defineMacro("\\uarr", "\\uparrow");
  defineMacro("\\uArr", "\\Uparrow");
  defineMacro("\\Uarr", "\\Uparrow");
  defineMacro("\\N", "\\mathbb{N}");
  defineMacro("\\R", "\\mathbb{R}");
  defineMacro("\\Z", "\\mathbb{Z}");
  defineMacro("\\alef", "\\aleph");
  defineMacro("\\alefsym", "\\aleph");
  defineMacro("\\bull", "\\bullet");
  defineMacro("\\clubs", "\\clubsuit");
  defineMacro("\\cnums", "\\mathbb{C}");
  defineMacro("\\Complex", "\\mathbb{C}");
  defineMacro("\\Dagger", "\\ddagger");
  defineMacro("\\diamonds", "\\diamondsuit");
  defineMacro("\\empty", "\\emptyset");
  defineMacro("\\exist", "\\exists");
  defineMacro("\\harr", "\\leftrightarrow");
  defineMacro("\\hArr", "\\Leftrightarrow");
  defineMacro("\\Harr", "\\Leftrightarrow");
  defineMacro("\\hearts", "\\heartsuit");
  defineMacro("\\image", "\\Im");
  defineMacro("\\infin", "\\infty");
  defineMacro("\\isin", "\\in");
  defineMacro("\\larr", "\\leftarrow");
  defineMacro("\\lArr", "\\Leftarrow");
  defineMacro("\\Larr", "\\Leftarrow");
  defineMacro("\\lrarr", "\\leftrightarrow");
  defineMacro("\\lrArr", "\\Leftrightarrow");
  defineMacro("\\Lrarr", "\\Leftrightarrow");
  defineMacro("\\natnums", "\\mathbb{N}");
  defineMacro("\\plusmn", "\\pm");
  defineMacro("\\rarr", "\\rightarrow");
  defineMacro("\\rArr", "\\Rightarrow");
  defineMacro("\\Rarr", "\\Rightarrow");
  defineMacro("\\real", "\\Re");
  defineMacro("\\reals", "\\mathbb{R}");
  defineMacro("\\Reals", "\\mathbb{R}");
  defineMacro("\\sdot", "\\cdot");
  defineMacro("\\sect", "\\S");
  defineMacro("\\spades", "\\spadesuit");
  defineMacro("\\sub", "\\subset");
  defineMacro("\\sube", "\\subseteq");
  defineMacro("\\supe", "\\supseteq");
  defineMacro("\\thetasym", "\\vartheta");
  defineMacro("\\weierp", "\\wp");
  defineMacro("\\quantity", "{\\left\\{ #1 \\right\\}}");
  defineMacro("\\qty", "{\\left\\{ #1 \\right\\}}");
  defineMacro("\\pqty", "{\\left( #1 \\right)}");
  defineMacro("\\bqty", "{\\left[ #1 \\right]}");
  defineMacro("\\vqty", "{\\left\\vert #1 \\right\\vert}");
  defineMacro("\\Bqty", "{\\left\\{ #1 \\right\\}}");
  defineMacro("\\absolutevalue", "{\\left\\vert #1 \\right\\vert}");
  defineMacro("\\abs", "{\\left\\vert #1 \\right\\vert}");
  defineMacro("\\norm", "{\\left\\Vert #1 \\right\\Vert}");
  defineMacro("\\evaluated", "{\\left.#1 \\right\\vert}");
  defineMacro("\\eval", "{\\left.#1 \\right\\vert}");
  defineMacro("\\order", "{\\mathcal{O} \\left( #1 \\right)}");
  defineMacro("\\commutator", "{\\left[ #1 , #2 \\right]}");
  defineMacro("\\comm", "{\\left[ #1 , #2 \\right]}");
  defineMacro("\\anticommutator", "{\\left\\{ #1 , #2 \\right\\}}");
  defineMacro("\\acomm", "{\\left\\{ #1 , #2 \\right\\}}");
  defineMacro("\\poissonbracket", "{\\left\\{ #1 , #2 \\right\\}}");
  defineMacro("\\pb", "{\\left\\{ #1 , #2 \\right\\}}");
  defineMacro("\\vectorbold", "{\\boldsymbol{ #1 }}");
  defineMacro("\\vb", "{\\boldsymbol{ #1 }}");
  defineMacro("\\vectorarrow", "{\\vec{\\boldsymbol{ #1 }}}");
  defineMacro("\\va", "{\\vec{\\boldsymbol{ #1 }}}");
  defineMacro("\\vectorunit", "{{\\boldsymbol{\\hat{ #1 }}}}");
  defineMacro("\\vu", "{{\\boldsymbol{\\hat{ #1 }}}}");
  defineMacro("\\dotproduct", "\\mathbin{\\boldsymbol\\cdot}");
  defineMacro("\\vdot", "{\\boldsymbol\\cdot}");
  defineMacro("\\crossproduct", "\\mathbin{\\boldsymbol\\times}");
  defineMacro("\\cross", "\\mathbin{\\boldsymbol\\times}");
  defineMacro("\\cp", "\\mathbin{\\boldsymbol\\times}");
  defineMacro("\\gradient", "{\\boldsymbol\\nabla}");
  defineMacro("\\grad", "{\\boldsymbol\\nabla}");
  defineMacro("\\divergence", "{\\grad\\vdot}");
  defineMacro("\\curl", "{\\grad\\cross}");
  defineMacro("\\laplacian", "\\nabla^2");
  defineMacro("\\tr", "{\\operatorname{tr}}");
  defineMacro("\\Tr", "{\\operatorname{Tr}}");
  defineMacro("\\rank", "{\\operatorname{rank}}");
  defineMacro("\\erf", "{\\operatorname{erf}}");
  defineMacro("\\Res", "{\\operatorname{Res}}");
  defineMacro("\\principalvalue", "{\\mathcal{P}}");
  defineMacro("\\pv", "{\\mathcal{P}}");
  defineMacro("\\PV", "{\\operatorname{P.V.}}");
  defineMacro("\\qqtext", "{\\quad\\text{ #1 }\\quad}");
  defineMacro("\\qq", "{\\quad\\text{ #1 }\\quad}");
  defineMacro("\\qcomma", "{\\text{,}\\quad}");
  defineMacro("\\qc", "{\\text{,}\\quad}");
  defineMacro("\\qcc", "{\\quad\\text{c.c.}\\quad}");
  defineMacro("\\qif", "{\\quad\\text{if}\\quad}");
  defineMacro("\\qthen", "{\\quad\\text{then}\\quad}");
  defineMacro("\\qelse", "{\\quad\\text{else}\\quad}");
  defineMacro("\\qotherwise", "{\\quad\\text{otherwise}\\quad}");
  defineMacro("\\qunless", "{\\quad\\text{unless}\\quad}");
  defineMacro("\\qgiven", "{\\quad\\text{given}\\quad}");
  defineMacro("\\qusing", "{\\quad\\text{using}\\quad}");
  defineMacro("\\qassume", "{\\quad\\text{assume}\\quad}");
  defineMacro("\\qsince", "{\\quad\\text{since}\\quad}");
  defineMacro("\\qlet", "{\\quad\\text{let}\\quad}");
  defineMacro("\\qfor", "{\\quad\\text{for}\\quad}");
  defineMacro("\\qall", "{\\quad\\text{all}\\quad}");
  defineMacro("\\qeven", "{\\quad\\text{even}\\quad}");
  defineMacro("\\qodd", "{\\quad\\text{odd}\\quad}");
  defineMacro("\\qinteger", "{\\quad\\text{integer}\\quad}");
  defineMacro("\\qand", "{\\quad\\text{and}\\quad}");
  defineMacro("\\qor", "{\\quad\\text{or}\\quad}");
  defineMacro("\\qas", "{\\quad\\text{as}\\quad}");
  defineMacro("\\qin", "{\\quad\\text{in}\\quad}");
  defineMacro("\\differential", "{\\text{d}}");
  defineMacro("\\dd", "{\\text{d}}");
  defineMacro("\\derivative", "{\\frac{\\text{d}{ #1 }}{\\text{d}{ #2 }}}");
  defineMacro("\\dv", "{\\frac{\\text{d}{ #1 }}{\\text{d}{ #2 }}}");
  defineMacro("\\partialderivative", "{\\frac{\\partial{ #1 }}{\\partial{ #2 }}}");
  defineMacro("\\variation", "{\\delta}");
  defineMacro("\\var", "{\\delta}");
  defineMacro("\\functionalderivative", "{\\frac{\\delta{ #1 }}{\\delta{ #2 }}}");
  defineMacro("\\fdv", "{\\frac{\\delta{ #1 }}{\\delta{ #2 }}}");
  defineMacro("\\innerproduct", "{\\left\\langle {#1} \\mid { #2} \\right\\rangle}");
  defineMacro(
    "\\outerproduct",
    "{\\left\\vert { #1 } \\right\\rangle\\left\\langle { #2} \\right\\vert}"
  );
  defineMacro(
    "\\dyad",
    "{\\left\\vert { #1 } \\right\\rangle\\left\\langle { #2} \\right\\vert}"
  );
  defineMacro(
    "\\ketbra",
    "{\\left\\vert { #1 } \\right\\rangle\\left\\langle { #2} \\right\\vert}"
  );
  defineMacro(
    "\\op",
    "{\\left\\vert { #1 } \\right\\rangle\\left\\langle { #2} \\right\\vert}"
  );
  defineMacro("\\expectationvalue", "{\\left\\langle {#1 } \\right\\rangle}");
  defineMacro("\\expval", "{\\left\\langle {#1 } \\right\\rangle}");
  defineMacro("\\ev", "{\\left\\langle {#1 } \\right\\rangle}");
  defineMacro(
    "\\matrixelement",
    "{\\left\\langle{ #1 }\\right\\vert{ #2 }\\left\\vert{#3}\\right\\rangle}"
  );
  defineMacro(
    "\\matrixel",
    "{\\left\\langle{ #1 }\\right\\vert{ #2 }\\left\\vert{#3}\\right\\rangle}"
  );
  defineMacro(
    "\\mel",
    "{\\left\\langle{ #1 }\\right\\vert{ #2 }\\left\\vert{#3}\\right\\rangle}"
  );
  function getHLines(parser2) {
    const hlineInfo = [];
    parser2.consumeSpaces();
    let nxt = parser2.fetch().text;
    if (nxt === "\\relax") {
      parser2.consume();
      parser2.consumeSpaces();
      nxt = parser2.fetch().text;
    }
    while (nxt === "\\hline" || nxt === "\\hdashline") {
      parser2.consume();
      hlineInfo.push(nxt === "\\hdashline");
      parser2.consumeSpaces();
      nxt = parser2.fetch().text;
    }
    return hlineInfo;
  }
  var validateAmsEnvironmentContext = (context) => {
    const settings = context.parser.settings;
    if (!settings.displayMode) {
      throw new ParseError(`{${context.envName}} can be used only in display mode.`);
    }
  };
  var sizeRegEx$1 = /([-+]?) *(\d+(?:\.\d*)?|\.\d+) *([a-z]{2})/;
  var arrayGaps = (macros2) => {
    let arraystretch = macros2.get("\\arraystretch");
    if (typeof arraystretch !== "string") {
      arraystretch = stringFromArg(arraystretch.tokens);
    }
    arraystretch = isNaN(arraystretch) ? null : Number(arraystretch);
    let arraycolsepStr = macros2.get("\\arraycolsep");
    if (typeof arraycolsepStr !== "string") {
      arraycolsepStr = stringFromArg(arraycolsepStr.tokens);
    }
    const match = sizeRegEx$1.exec(arraycolsepStr);
    const arraycolsep = match ? { number: +(match[1] + match[2]), unit: match[3] } : null;
    return [arraystretch, arraycolsep];
  };
  var checkCellForLabels = (cell) => {
    let rowLabel = "";
    for (let i = 0; i < cell.length; i++) {
      if (cell[i].type === "label") {
        if (rowLabel) {
          throw new ParseError("Multiple \\labels in one row");
        }
        rowLabel = cell[i].string;
      }
    }
    return rowLabel;
  };
  function getAutoTag(name) {
    if (name.indexOf("ed") === -1) {
      return name.indexOf("*") === -1;
    }
  }
  function parseArray(parser2, {
    cols,
    // [{ type: string , align: l|c|r|null }]
    envClasses,
    // align(ed|at|edat) | array | cases | cd | small | multline
    autoTag,
    // boolean
    singleRow,
    // boolean
    emptySingleRow,
    // boolean
    maxNumCols,
    // number
    leqno,
    // boolean
    arraystretch,
    // number  | null
    arraycolsep
    // size value | null
  }, scriptLevel2) {
    const endToken = envClasses && envClasses.includes("bordermatrix") ? "}" : "\\end";
    parser2.gullet.beginGroup();
    if (!singleRow) {
      parser2.gullet.macros.set("\\cr", "\\\\\\relax");
    }
    parser2.gullet.beginGroup();
    let row = [];
    const body = [row];
    const rowGaps = [];
    const labels = [];
    const hLinesBeforeRow = [];
    const tags = autoTag != null ? [] : void 0;
    function beginRow() {
      if (autoTag) {
        parser2.gullet.macros.set("\\@eqnsw", "1", true);
      }
    }
    function endRow() {
      if (tags) {
        if (parser2.gullet.macros.get("\\df@tag")) {
          tags.push(parser2.subparse([new Token("\\df@tag")]));
          parser2.gullet.macros.set("\\df@tag", void 0, true);
        } else {
          tags.push(Boolean(autoTag) && parser2.gullet.macros.get("\\@eqnsw") === "1");
        }
      }
    }
    beginRow();
    hLinesBeforeRow.push(getHLines(parser2));
    while (true) {
      let cell = parser2.parseExpression(false, singleRow ? "\\end" : "\\\\");
      parser2.gullet.endGroup();
      parser2.gullet.beginGroup();
      cell = {
        type: "ordgroup",
        mode: parser2.mode,
        body: cell,
        semisimple: true
      };
      row.push(cell);
      const next = parser2.fetch().text;
      if (next === "&") {
        if (maxNumCols && row.length === maxNumCols) {
          if (envClasses.includes("array")) {
            if (parser2.settings.strict) {
              throw new ParseError(
                "Too few columns specified in the {array} column argument.",
                parser2.nextToken
              );
            }
          } else if (maxNumCols === 2) {
            throw new ParseError(
              "The split environment accepts no more than two columns",
              parser2.nextToken
            );
          } else {
            throw new ParseError(
              "The equation environment accepts only one column",
              parser2.nextToken
            );
          }
        }
        parser2.consume();
      } else if (next === endToken) {
        endRow();
        if (row.length === 1 && cell.body.length === 0 && (body.length > 1 || !emptySingleRow)) {
          body.pop();
        }
        labels.push(checkCellForLabels(cell.body));
        if (hLinesBeforeRow.length < body.length + 1) {
          hLinesBeforeRow.push([]);
        }
        break;
      } else if (next === "\\\\") {
        parser2.consume();
        let size;
        if (parser2.gullet.future().text !== " ") {
          size = parser2.parseSizeGroup(true);
        }
        rowGaps.push(size ? size.value : null);
        endRow();
        labels.push(checkCellForLabels(cell.body));
        hLinesBeforeRow.push(getHLines(parser2));
        row = [];
        body.push(row);
        beginRow();
      } else {
        throw new ParseError("Expected & or \\\\ or \\cr or " + endToken, parser2.nextToken);
      }
    }
    parser2.gullet.endGroup();
    parser2.gullet.endGroup();
    return {
      type: "array",
      mode: parser2.mode,
      body,
      cols,
      rowGaps,
      hLinesBeforeRow,
      envClasses,
      autoTag,
      scriptLevel: scriptLevel2,
      tags,
      labels,
      leqno,
      arraystretch,
      arraycolsep
    };
  }
  function dCellStyle(envName) {
    return envName.slice(0, 1) === "d" ? "display" : "text";
  }
  var alignMap = {
    c: "center ",
    l: "left ",
    r: "right "
  };
  var glue = (group) => {
    const glueNode = new MathNode("mtd", []);
    glueNode.style = { padding: "0", width: "50%" };
    if (group.envClasses.includes("multline")) {
      glueNode.style.width = "7.5%";
    }
    return glueNode;
  };
  var mathmlBuilder$9 = function(group, style) {
    const tbl = [];
    const numRows = group.body.length;
    const hlines = group.hLinesBeforeRow;
    const tagIsPresent = group.tags && group.tags.some((tag2) => tag2);
    for (let i = 0; i < numRows; i++) {
      const rw = group.body[i];
      const row = [];
      const cellLevel = group.scriptLevel === "text" ? StyleLevel.TEXT : group.scriptLevel === "script" ? StyleLevel.SCRIPT : StyleLevel.DISPLAY;
      for (let j = 0; j < rw.length; j++) {
        const mtd = new MathNode(
          "mtd",
          [buildGroup$1(rw[j], style.withLevel(cellLevel))]
        );
        if (group.envClasses.includes("multline")) {
          const align = i === 0 ? "left" : i === numRows - 1 ? "right" : "center";
          if (align !== "center") {
            mtd.classes.push("tml-" + align);
          }
        }
        row.push(mtd);
      }
      const numColumns = group.body[0].length;
      for (let k = 0; k < numColumns - rw.length; k++) {
        row.push(new MathNode("mtd", [], [], style));
      }
      if (tagIsPresent) {
        const tag2 = group.tags[i];
        let tagElement;
        if (tag2 === true) {
          tagElement = new MathNode("mtext", [new Span(["tml-eqn"])]);
        } else if (tag2 === false) {
          tagElement = new MathNode("mtext", [], []);
        } else {
          tagElement = buildExpressionRow(tag2[0].body, style.withLevel(cellLevel), true);
          tagElement = consolidateText(tagElement);
          tagElement.classes = ["tml-tag"];
        }
        if (tagElement) {
          row.unshift(glue(group));
          row.push(glue(group));
          if (group.leqno) {
            row[0].children.push(tagElement);
          } else {
            row[row.length - 1].children.push(tagElement);
          }
        }
      }
      const mtr = new MathNode("mtr", row, []);
      const label = group.labels.shift();
      if (label && group.tags && group.tags[i]) {
        mtr.setAttribute("id", label);
        if (Array.isArray(group.tags[i])) {
          mtr.classes.push("tml-tageqn");
        }
      }
      if (i === 0 && hlines[0].length > 0) {
        if (hlines[0].length === 2) {
          mtr.children.forEach((cell) => {
            cell.style.borderTop = "0.15em double";
          });
        } else {
          mtr.children.forEach((cell) => {
            cell.style.borderTop = hlines[0][0] ? "0.06em dashed" : "0.06em solid";
          });
        }
      }
      if (hlines[i + 1].length > 0) {
        if (hlines[i + 1].length === 2) {
          mtr.children.forEach((cell) => {
            cell.style.borderBottom = "0.15em double";
          });
        } else {
          mtr.children.forEach((cell) => {
            cell.style.borderBottom = hlines[i + 1][0] ? "0.06em dashed" : "0.06em solid";
          });
        }
      }
      let mustSquashRow = true;
      for (let j = 0; j < mtr.children.length; j++) {
        const child = mtr.children[j].children[0];
        if (!(child && child.type === "mpadded" && child.attributes.height === "0px")) {
          mustSquashRow = false;
          break;
        }
      }
      if (mustSquashRow) {
        mtr.classes.push("ff-squash");
        for (let j = 0; j < mtr.children.length; j++) {
          mtr.children[j].style.paddingTop = "0";
          mtr.children[j].style.paddingBottom = "0";
        }
      }
      tbl.push(mtr);
    }
    if (group.arraystretch && group.arraystretch !== 1) {
      const pad = String(1.4 * group.arraystretch - 0.8) + "ex";
      for (let i = 0; i < tbl.length; i++) {
        for (let j = 0; j < tbl[i].children.length; j++) {
          tbl[i].children[j].style.paddingTop = pad;
          tbl[i].children[j].style.paddingBottom = pad;
        }
      }
    }
    let sidePadding;
    let sidePadUnit;
    if (group.envClasses.length > 0) {
      sidePadding = group.envClasses.includes("abut") ? "0" : group.envClasses.includes("cases") ? "0" : group.envClasses.includes("small") ? "0.1389" : group.envClasses.includes("cd") ? "0.25" : "0.4";
      sidePadUnit = "em";
    }
    if (group.arraycolsep) {
      const arraySidePad = calculateSize(group.arraycolsep, style);
      sidePadding = arraySidePad.number.toFixed(4);
      sidePadUnit = arraySidePad.unit;
    }
    if (sidePadding) {
      const numCols = tbl.length === 0 ? 0 : tbl[0].children.length;
      const sidePad = (j, hand) => {
        if (j === 0 && hand === 0) {
          return "0";
        }
        if (j === numCols - 1 && hand === 1) {
          return "0";
        }
        if (group.envClasses[0] !== "align") {
          return sidePadding;
        }
        if (hand === 1) {
          return "0";
        }
        if (tagIsPresent) {
          return j % 2 ? "1" : "0";
        } else {
          return j % 2 ? "0" : "1";
        }
      };
      for (let i = 0; i < tbl.length; i++) {
        for (let j = 0; j < tbl[i].children.length; j++) {
          tbl[i].children[j].style.paddingLeft = `${sidePad(j, 0)}${sidePadUnit}`;
          tbl[i].children[j].style.paddingRight = `${sidePad(j, 1)}${sidePadUnit}`;
        }
      }
    }
    if (group.envClasses.length === 0) {
      for (let i = 0; i < tbl.length; i++) {
        tbl[i].children[0].style.paddingLeft = "0em";
        if (tbl[i].children.length === tbl[0].children.length) {
          tbl[i].children[tbl[i].children.length - 1].style.paddingRight = "0em";
        }
      }
    }
    if (group.envClasses.length > 0) {
      const align = group.envClasses.includes("align") || group.envClasses.includes("alignat");
      for (let i = 0; i < tbl.length; i++) {
        const row = tbl[i];
        if (align) {
          for (let j = 0; j < row.children.length; j++) {
            row.children[j].classes = ["tml-" + (j % 2 ? "left" : "right")];
          }
          if (tagIsPresent) {
            const k = group.leqno ? 0 : row.children.length - 1;
            row.children[k].classes = [];
          }
        }
        if (row.children.length > 1 && group.envClasses.includes("cases")) {
          row.children[1].style.paddingLeft = "1em";
        }
        if (group.envClasses.includes("cases") || group.envClasses.includes("subarray")) {
          for (const cell of row.children) {
            cell.classes.push("tml-left");
          }
        }
      }
    }
    let table = new MathNode("mtable", tbl);
    if (group.envClasses.length > 0) {
      if (group.envClasses.includes("jot")) {
        table.classes.push("tml-jot");
      } else if (group.envClasses.includes("small")) {
        table.classes.push("tml-small");
      }
    }
    if (group.scriptLevel === "display") {
      table.setAttribute("displaystyle", "true");
    }
    if (group.autoTag || group.envClasses.includes("multline")) {
      table.style.width = "100%";
    }
    if (group.cols && group.cols.length > 0) {
      const cols = group.cols;
      let prevTypeWasAlign = false;
      let iStart = 0;
      let iEnd = cols.length;
      while (cols[iStart].type === "separator") {
        iStart += 1;
      }
      while (cols[iEnd - 1].type === "separator") {
        iEnd -= 1;
      }
      if (cols[0].type === "separator") {
        const sep = cols[1].type === "separator" ? "0.15em double" : cols[0].separator === "|" ? "0.06em solid " : "0.06em dashed ";
        for (const row of table.children) {
          row.children[0].style.borderLeft = sep;
        }
      }
      let iCol = tagIsPresent ? 0 : -1;
      for (let i = iStart; i < iEnd; i++) {
        if (cols[i].type === "align") {
          const colAlign = alignMap[cols[i].align];
          iCol += 1;
          for (const row of table.children) {
            if (colAlign.trim() !== "center" && iCol < row.children.length) {
              row.children[iCol].classes = ["tml-" + colAlign.trim()];
            }
          }
          prevTypeWasAlign = true;
        } else if (cols[i].type === "separator") {
          if (prevTypeWasAlign) {
            const sep = cols[i + 1].type === "separator" ? "0.15em double" : cols[i].separator === "|" ? "0.06em solid" : "0.06em dashed";
            for (const row of table.children) {
              if (iCol < row.children.length) {
                row.children[iCol].style.borderRight = sep;
              }
            }
          }
          prevTypeWasAlign = false;
        }
      }
      if (cols[cols.length - 1].type === "separator") {
        const sep = cols[cols.length - 2].type === "separator" ? "0.15em double" : cols[cols.length - 1].separator === "|" ? "0.06em solid" : "0.06em dashed";
        for (const row of table.children) {
          row.children[row.children.length - 1].style.borderRight = sep;
          row.children[row.children.length - 1].style.paddingRight = "0.4em";
        }
      }
    }
    if (group.envClasses.includes("small")) {
      table = new MathNode("mstyle", [table]);
      table.setAttribute("scriptlevel", "1");
    }
    return table;
  };
  var alignedHandler = function(context, args) {
    if (context.envName.indexOf("ed") === -1) {
      validateAmsEnvironmentContext(context);
    }
    const isSplit = context.envName === "split";
    const cols = [];
    const res = parseArray(
      context.parser,
      {
        cols,
        emptySingleRow: true,
        autoTag: isSplit ? void 0 : getAutoTag(context.envName),
        envClasses: ["abut", "jot"],
        // set row spacing & provisional column spacing
        maxNumCols: context.envName === "split" ? 2 : void 0,
        leqno: context.parser.settings.leqno
      },
      "display"
    );
    let numMaths;
    let numCols = 0;
    const isAlignedAt = context.envName.indexOf("at") > -1;
    if (args[0] && isAlignedAt) {
      let arg0 = "";
      for (let i = 0; i < args[0].body.length; i++) {
        const textord2 = assertNodeType(args[0].body[i], "textord");
        arg0 += textord2.text;
      }
      if (isNaN(arg0)) {
        throw new ParseError("The alignat enviroment requires a numeric first argument.");
      }
      numMaths = Number(arg0);
      numCols = numMaths * 2;
    }
    res.body.forEach(function(row) {
      if (isAlignedAt) {
        const curMaths = row.length / 2;
        if (numMaths < curMaths) {
          throw new ParseError(
            `Too many math in a row: expected ${numMaths}, but got ${curMaths}`,
            row[0]
          );
        }
      } else if (numCols < row.length) {
        numCols = row.length;
      }
    });
    for (let i = 0; i < numCols; ++i) {
      let align = "r";
      if (i % 2 === 1) {
        align = "l";
      }
      cols[i] = {
        type: "align",
        align
      };
    }
    if (context.envName === "split") ;
    else if (isAlignedAt) {
      res.envClasses.push("alignat");
    } else {
      res.envClasses[0] = "align";
    }
    return res;
  };
  defineEnvironment({
    type: "array",
    names: ["array", "darray"],
    props: {
      numArgs: 1
    },
    handler(context, args) {
      const symNode = checkSymbolNodeType(args[0]);
      const colalign = symNode ? [args[0]] : assertNodeType(args[0], "ordgroup").body;
      const cols = colalign.map(function(nde) {
        const node = assertSymbolNodeType(nde);
        const ca = node.text;
        if ("lcr".indexOf(ca) !== -1) {
          return {
            type: "align",
            align: ca
          };
        } else if (ca === "|") {
          return {
            type: "separator",
            separator: "|"
          };
        } else if (ca === ":") {
          return {
            type: "separator",
            separator: ":"
          };
        }
        throw new ParseError("Unknown column alignment: " + ca, nde);
      });
      const [arraystretch, arraycolsep] = arrayGaps(context.parser.gullet.macros);
      const res = {
        cols,
        envClasses: ["array"],
        maxNumCols: cols.length,
        arraystretch,
        arraycolsep
      };
      return parseArray(context.parser, res, dCellStyle(context.envName));
    },
    mathmlBuilder: mathmlBuilder$9
  });
  defineEnvironment({
    type: "array",
    names: [
      "matrix",
      "pmatrix",
      "bmatrix",
      "Bmatrix",
      "vmatrix",
      "Vmatrix",
      "matrix*",
      "pmatrix*",
      "bmatrix*",
      "Bmatrix*",
      "vmatrix*",
      "Vmatrix*"
    ],
    props: {
      numArgs: 0
    },
    handler(context) {
      const delimiters2 = {
        matrix: null,
        pmatrix: ["(", ")"],
        bmatrix: ["[", "]"],
        Bmatrix: ["\\{", "\\}"],
        vmatrix: ["|", "|"],
        Vmatrix: ["\\Vert", "\\Vert"]
      }[context.envName.replace("*", "")];
      let colAlign = "c";
      const payload = {
        envClasses: [],
        cols: []
      };
      if (context.envName.charAt(context.envName.length - 1) === "*") {
        const parser2 = context.parser;
        parser2.consumeSpaces();
        if (parser2.fetch().text === "[") {
          parser2.consume();
          parser2.consumeSpaces();
          colAlign = parser2.fetch().text;
          if ("lcr".indexOf(colAlign) === -1) {
            throw new ParseError("Expected l or c or r", parser2.nextToken);
          }
          parser2.consume();
          parser2.consumeSpaces();
          parser2.expect("]");
          parser2.consume();
          payload.cols = [];
        }
      }
      const res = parseArray(context.parser, payload, "text");
      res.cols = res.body.length > 0 ? new Array(res.body[0].length).fill({ type: "align", align: colAlign }) : [];
      const [arraystretch, arraycolsep] = arrayGaps(context.parser.gullet.macros);
      res.arraystretch = arraystretch;
      if (arraycolsep && !(arraycolsep === 6 && arraycolsep === "pt")) {
        res.arraycolsep = arraycolsep;
      }
      return delimiters2 ? {
        type: "leftright",
        mode: context.mode,
        body: [res],
        left: delimiters2[0],
        right: delimiters2[1],
        rightColor: void 0
        // \right uninfluenced by \color in array
      } : res;
    },
    mathmlBuilder: mathmlBuilder$9
  });
  defineEnvironment({
    type: "array",
    names: ["bordermatrix"],
    props: {
      numArgs: 0
    },
    handler(context) {
      const payload = { cols: [], envClasses: ["bordermatrix"] };
      const res = parseArray(context.parser, payload, "text");
      res.cols = res.body.length > 0 ? new Array(res.body[0].length).fill({ type: "align", align: "c" }) : [];
      res.envClasses = [];
      res.arraystretch = 1;
      if (context.envName === "matrix") {
        return res;
      }
      return bordermatrixParseTree(res, context.delimiters);
    },
    mathmlBuilder: mathmlBuilder$9
  });
  defineEnvironment({
    type: "array",
    names: ["smallmatrix"],
    props: {
      numArgs: 0
    },
    handler(context) {
      const payload = { envClasses: ["small"] };
      const res = parseArray(context.parser, payload, "script");
      return res;
    },
    mathmlBuilder: mathmlBuilder$9
  });
  defineEnvironment({
    type: "array",
    names: ["subarray"],
    props: {
      numArgs: 1
    },
    handler(context, args) {
      const symNode = checkSymbolNodeType(args[0]);
      const colalign = symNode ? [args[0]] : assertNodeType(args[0], "ordgroup").body;
      const cols = colalign.map(function(nde) {
        const node = assertSymbolNodeType(nde);
        const ca = node.text;
        if ("lc".indexOf(ca) !== -1) {
          return {
            type: "align",
            align: ca
          };
        }
        throw new ParseError("Unknown column alignment: " + ca, nde);
      });
      if (cols.length > 1) {
        throw new ParseError("{subarray} can contain only one column");
      }
      let res = {
        cols,
        envClasses: ["small"]
      };
      res = parseArray(context.parser, res, "script");
      if (res.body.length > 0 && res.body[0].length > 1) {
        throw new ParseError("{subarray} can contain only one column");
      }
      return res;
    },
    mathmlBuilder: mathmlBuilder$9
  });
  defineEnvironment({
    type: "array",
    names: ["cases", "dcases", "rcases", "drcases"],
    props: {
      numArgs: 0
    },
    handler(context) {
      const payload = {
        cols: [],
        envClasses: ["cases"]
      };
      const res = parseArray(context.parser, payload, dCellStyle(context.envName));
      return {
        type: "leftright",
        mode: context.mode,
        body: [res],
        left: context.envName.indexOf("r") > -1 ? "." : "\\{",
        right: context.envName.indexOf("r") > -1 ? "\\}" : ".",
        rightColor: void 0
      };
    },
    mathmlBuilder: mathmlBuilder$9
  });
  defineEnvironment({
    type: "array",
    names: ["align", "align*", "aligned", "split"],
    props: {
      numArgs: 0
    },
    handler: alignedHandler,
    mathmlBuilder: mathmlBuilder$9
  });
  defineEnvironment({
    type: "array",
    names: ["alignat", "alignat*", "alignedat"],
    props: {
      numArgs: 1
    },
    handler: alignedHandler,
    mathmlBuilder: mathmlBuilder$9
  });
  defineEnvironment({
    type: "array",
    names: ["gathered", "gather", "gather*"],
    props: {
      numArgs: 0
    },
    handler(context) {
      if (context.envName !== "gathered") {
        validateAmsEnvironmentContext(context);
      }
      const res = {
        cols: [],
        envClasses: ["abut", "jot"],
        autoTag: getAutoTag(context.envName),
        emptySingleRow: true,
        leqno: context.parser.settings.leqno
      };
      return parseArray(context.parser, res, "display");
    },
    mathmlBuilder: mathmlBuilder$9
  });
  defineEnvironment({
    type: "array",
    names: ["equation", "equation*"],
    props: {
      numArgs: 0
    },
    handler(context) {
      validateAmsEnvironmentContext(context);
      const res = {
        autoTag: getAutoTag(context.envName),
        emptySingleRow: true,
        singleRow: true,
        maxNumCols: 1,
        envClasses: ["align"],
        leqno: context.parser.settings.leqno
      };
      return parseArray(context.parser, res, "display");
    },
    mathmlBuilder: mathmlBuilder$9
  });
  defineEnvironment({
    type: "array",
    names: ["multline", "multline*"],
    props: {
      numArgs: 0
    },
    handler(context) {
      validateAmsEnvironmentContext(context);
      const res = {
        autoTag: context.envName === "multline",
        maxNumCols: 1,
        envClasses: ["jot", "multline"],
        leqno: context.parser.settings.leqno
      };
      return parseArray(context.parser, res, "display");
    },
    mathmlBuilder: mathmlBuilder$9
  });
  defineEnvironment({
    type: "array",
    names: ["CD"],
    props: {
      numArgs: 0
    },
    handler(context) {
      validateAmsEnvironmentContext(context);
      return parseCD(context.parser);
    },
    mathmlBuilder: mathmlBuilder$9
  });
  defineFunction({
    type: "text",
    // Doesn't matter what this is.
    names: ["\\hline", "\\hdashline"],
    props: {
      numArgs: 0,
      allowedInText: true,
      allowedInMath: true
    },
    handler(context, args) {
      throw new ParseError(`${context.funcName} valid only within array environment`);
    }
  });
  var environments = _environments;
  defineFunction({
    type: "bordermatrix",
    names: ["\\bordermatrix", "\\matrix"],
    props: {
      numArgs: 0,
      numOptionalArgs: 1
    },
    handler: ({ parser: parser2, funcName }, args, optArgs) => {
      let delimiters2 = ["(", ")"];
      if (funcName === "\\bordermatrix" && optArgs[0] && optArgs[0].body) {
        const body = optArgs[0].body;
        if (body.length === 1 && body[0].type === "delimiter") {
          delimiters2 = [body[0].left, body[0].right];
        }
      }
      parser2.consumeSpaces();
      parser2.consume();
      const env = environments["bordermatrix"];
      const context = {
        mode: parser2.mode,
        envName: funcName.slice(1),
        delimiters: delimiters2,
        parser: parser2
      };
      const result = env.handler(context);
      parser2.expect("}", true);
      return result;
    }
  });
  defineFunction({
    type: "cancelto",
    names: ["\\cancelto"],
    props: {
      numArgs: 2
    },
    handler({ parser: parser2 }, args) {
      const to = args[0];
      const body = args[1];
      return {
        type: "cancelto",
        mode: parser2.mode,
        body,
        to,
        isCharacterBox: isCharacterBox(body)
      };
    },
    mathmlBuilder(group, style) {
      const fromNode = new MathNode(
        "mrow",
        [buildGroup$1(group.body, style)],
        ["ff-narrow"]
        // A zero-width mrow.
      );
      const phantom2 = new MathNode("mphantom", [buildGroup$1(group.body, style)]);
      const arrow = new MathNode("mrow", [phantom2], ["tml-cancelto"]);
      arrow.style.color = style.color;
      if (group.isCharacterBox && smalls.indexOf(group.body.body[0].text) > -1) {
        arrow.style.left = "0.1em";
        arrow.style.width = "90%";
      }
      const node = new MathNode("mrow", [fromNode, arrow], ["menclose"]);
      if (!group.isCharacterBox || /[f∫∑]/.test(group.body.body[0].text)) {
        phantom2.style.paddingRight = "0.2em";
      } else {
        phantom2.style.padding = "0.5ex 0.1em 0 0";
        const strut = new MathNode("mspace", []);
        strut.setAttribute("height", "0.85em");
        fromNode.children.push(strut);
      }
      let dummyNode;
      if (group.isCharacterBox) {
        dummyNode = new MathNode("mspace", []);
        dummyNode.setAttribute("height", "1em");
      } else {
        const inner2 = buildGroup$1(group.body, style);
        const zeroWidthNode = new MathNode("mpadded", [inner2]);
        zeroWidthNode.setAttribute("width", "0.1px");
        dummyNode = new MathNode("mphantom", [zeroWidthNode]);
      }
      const toNode2 = buildGroup$1(group.to, style);
      toNode2.style.color = style.color;
      const zeroWidthToNode = new MathNode("mpadded", [toNode2]);
      if (!group.isCharacterBox || /[f∫∑]/.test(group.body.body[0].text)) {
        const w = new MathNode("mspace", []);
        w.setAttribute("width", "0.2em");
        zeroWidthToNode.children.unshift(w);
      }
      zeroWidthToNode.setAttribute("width", "0.1px");
      const mover = new MathNode("mover", [dummyNode, zeroWidthToNode]);
      const nudgeLeft = new MathNode("mrow", [], ["ff-nudge-left"]);
      return newDocumentFragment([makeRow([node, mover]), nudgeLeft]);
    }
  });
  defineFunction({
    type: "textord",
    names: ["\\@char"],
    props: {
      numArgs: 1,
      allowedInText: true
    },
    handler({ parser: parser2, token }, args) {
      const arg = assertNodeType(args[0], "ordgroup");
      const group = arg.body;
      let number = "";
      for (let i = 0; i < group.length; i++) {
        const node = assertNodeType(group[i], "textord");
        number += node.text;
      }
      const code = parseInt(number);
      if (isNaN(code)) {
        throw new ParseError(`\\@char has non-numeric argument ${number}`, token);
      }
      return {
        type: "textord",
        mode: parser2.mode,
        text: String.fromCodePoint(code)
      };
    }
  });
  var htmlRegEx = /^(#[a-f0-9]{3}|#?[a-f0-9]{6})$/i;
  var htmlOrNameRegEx = /^(#[a-f0-9]{3}|#?[a-f0-9]{6}|[a-z]+)$/i;
  var RGBregEx = /^ *\d{1,3} *(?:, *\d{1,3} *){2}$/;
  var rgbRegEx = /^ *[10](?:\.\d*)? *(?:, *[10](?:\.\d*)? *){2}$/;
  var xcolorHtmlRegEx = /^[a-f0-9]{6}$/i;
  var toHex = (num) => {
    let str = num.toString(16);
    if (str.length === 1) {
      str = "0" + str;
    }
    return str;
  };
  var xcolors = JSON.parse(`{
  "Apricot": "#ffb484",
  "Aquamarine": "#08b4bc",
  "Bittersweet": "#c84c14",
  "blue": "#0000FF",
  "Blue": "#303494",
  "BlueGreen": "#08b4bc",
  "BlueViolet": "#503c94",
  "BrickRed": "#b8341c",
  "brown": "#BF8040",
  "Brown": "#802404",
  "BurntOrange": "#f8941c",
  "CadetBlue": "#78749c",
  "CarnationPink": "#f884b4",
  "Cerulean": "#08a4e4",
  "CornflowerBlue": "#40ace4",
  "cyan": "#00FFFF",
  "Cyan": "#08acec",
  "Dandelion": "#ffbc44",
  "darkgray": "#404040",
  "DarkOrchid": "#a8548c",
  "Emerald": "#08ac9c",
  "ForestGreen": "#089c54",
  "Fuchsia": "#90348c",
  "Goldenrod": "#ffdc44",
  "gray": "#808080",
  "Gray": "#98949c",
  "green": "#00FF00",
  "Green": "#08a44c",
  "GreenYellow": "#e0e474",
  "JungleGreen": "#08ac9c",
  "Lavender": "#f89cc4",
  "lightgray": "#c0c0c0",
  "lime": "#BFFF00",
  "LimeGreen": "#90c43c",
  "magenta": "#FF00FF",
  "Magenta": "#f0048c",
  "Mahogany": "#b0341c",
  "Maroon": "#b03434",
  "Melon": "#f89c7c",
  "MidnightBlue": "#086494",
  "Mulberry": "#b03c94",
  "NavyBlue": "#086cbc",
  "olive": "#7F7F00",
  "OliveGreen": "#407c34",
  "orange": "#FF8000",
  "Orange": "#f8843c",
  "OrangeRed": "#f0145c",
  "Orchid": "#b074ac",
  "Peach": "#f8945c",
  "Periwinkle": "#8074bc",
  "PineGreen": "#088c74",
  "pink": "#ff7f7f",
  "Plum": "#98248c",
  "ProcessBlue": "#08b4ec",
  "purple": "#BF0040",
  "Purple": "#a0449c",
  "RawSienna": "#983c04",
  "red": "#ff0000",
  "Red": "#f01c24",
  "RedOrange": "#f86434",
  "RedViolet": "#a0246c",
  "Rhodamine": "#f0549c",
  "Royallue": "#0874bc",
  "RoyalPurple": "#683c9c",
  "RubineRed": "#f0047c",
  "Salmon": "#f8948c",
  "SeaGreen": "#30bc9c",
  "Sepia": "#701404",
  "SkyBlue": "#48c4dc",
  "SpringGreen": "#c8dc64",
  "Tan": "#e09c74",
  "teal": "#007F7F",
  "TealBlue": "#08acb4",
  "Thistle": "#d884b4",
  "Turquoise": "#08b4cc",
  "violet": "#800080",
  "Violet": "#60449c",
  "VioletRed": "#f054a4",
  "WildStrawberry": "#f0246c",
  "yellow": "#FFFF00",
  "Yellow": "#fff404",
  "YellowGreen": "#98cc6c",
  "YellowOrange": "#ffa41c"
}`);
  var colorFromSpec = (model, spec) => {
    let color = "";
    if (model === "HTML") {
      if (!htmlRegEx.test(spec)) {
        throw new ParseError("Invalid HTML input.");
      }
      color = spec;
    } else if (model === "RGB") {
      if (!RGBregEx.test(spec)) {
        throw new ParseError("Invalid RGB input.");
      }
      spec.split(",").map((e) => {
        color += toHex(Number(e.trim()));
      });
    } else {
      if (!rgbRegEx.test(spec)) {
        throw new ParseError("Invalid rbg input.");
      }
      spec.split(",").map((e) => {
        const num = Number(e.trim());
        if (num > 1) {
          throw new ParseError("Color rgb input must be < 1.");
        }
        color += toHex(Number((num * 255).toFixed(0)));
      });
    }
    if (color.charAt(0) !== "#") {
      color = "#" + color;
    }
    return color;
  };
  var validateColor = (color, macros2, token) => {
    const macroName = `\\\\color@${color}`;
    const match = htmlOrNameRegEx.exec(color);
    if (!match) {
      throw new ParseError("Invalid color: '" + color + "'", token);
    }
    if (xcolorHtmlRegEx.test(color)) {
      return "#" + color;
    } else if (color.charAt(0) === "#") {
      return color;
    } else if (macros2.has(macroName)) {
      color = macros2.get(macroName).tokens[0].text;
    } else if (xcolors[color]) {
      color = xcolors[color];
    }
    return color;
  };
  var mathmlBuilder$8 = (group, style) => {
    let expr = buildExpression(group.body, style.withColor(group.color));
    if (expr.length === 0) {
      expr.push(new MathNode("mrow"));
    }
    expr = expr.map((e) => {
      e.style.color = group.color;
      return e;
    });
    return newDocumentFragment(expr);
  };
  defineFunction({
    type: "color",
    names: ["\\textcolor"],
    props: {
      numArgs: 2,
      numOptionalArgs: 1,
      allowedInText: true,
      argTypes: ["raw", "raw", "original"]
    },
    handler({ parser: parser2, token }, args, optArgs) {
      const model = optArgs[0] && assertNodeType(optArgs[0], "raw").string;
      let color = "";
      if (model) {
        const spec = assertNodeType(args[0], "raw").string;
        color = colorFromSpec(model, spec);
      } else {
        color = validateColor(assertNodeType(args[0], "raw").string, parser2.gullet.macros, token);
      }
      const body = args[1];
      return {
        type: "color",
        mode: parser2.mode,
        color,
        isTextColor: true,
        body: ordargument(body)
      };
    },
    mathmlBuilder: mathmlBuilder$8
  });
  defineFunction({
    type: "color",
    names: ["\\color"],
    props: {
      numArgs: 1,
      numOptionalArgs: 1,
      allowedInText: true,
      argTypes: ["raw", "raw"]
    },
    handler({ parser: parser2, breakOnTokenText, token }, args, optArgs) {
      const model = optArgs[0] && assertNodeType(optArgs[0], "raw").string;
      let color = "";
      if (model) {
        const spec = assertNodeType(args[0], "raw").string;
        color = colorFromSpec(model, spec);
      } else {
        color = validateColor(assertNodeType(args[0], "raw").string, parser2.gullet.macros, token);
      }
      const body = parser2.parseExpression(true, breakOnTokenText, true);
      return {
        type: "color",
        mode: parser2.mode,
        color,
        isTextColor: false,
        body
      };
    },
    mathmlBuilder: mathmlBuilder$8
  });
  defineFunction({
    type: "color",
    names: ["\\definecolor"],
    props: {
      numArgs: 3,
      allowedInText: true,
      argTypes: ["raw", "raw", "raw"]
    },
    handler({ parser: parser2, funcName, token }, args) {
      const name = assertNodeType(args[0], "raw").string;
      if (!/^[A-Za-z]+$/.test(name)) {
        throw new ParseError("Color name must be latin letters.", token);
      }
      const model = assertNodeType(args[1], "raw").string;
      if (!["HTML", "RGB", "rgb"].includes(model)) {
        throw new ParseError("Color model must be HTML, RGB, or rgb.", token);
      }
      const spec = assertNodeType(args[2], "raw").string;
      const color = colorFromSpec(model, spec);
      parser2.gullet.macros.set(`\\\\color@${name}`, { tokens: [{ text: color }], numArgs: 0 });
      return { type: "internal", mode: parser2.mode };
    }
    // No mathmlBuilder. The point of \definecolor is to set a macro.
  });
  defineFunction({
    type: "cr",
    names: ["\\\\"],
    props: {
      numArgs: 0,
      numOptionalArgs: 0,
      allowedInText: true
    },
    handler({ parser: parser2 }, args, optArgs) {
      const size = parser2.gullet.future().text === "[" ? parser2.parseSizeGroup(true) : null;
      const newLine = !parser2.settings.displayMode;
      return {
        type: "cr",
        mode: parser2.mode,
        newLine,
        size: size && assertNodeType(size, "size").value
      };
    },
    // The following builder is called only at the top level,
    // not within tabular/array environments.
    mathmlBuilder(group, style) {
      const node = new MathNode("mo");
      if (group.newLine) {
        node.setAttribute("linebreak", "newline");
        if (group.size) {
          const size = calculateSize(group.size, style);
          node.setAttribute("height", size.number + size.unit);
        }
      }
      return node;
    }
  });
  var globalMap = {
    "\\global": "\\global",
    "\\long": "\\\\globallong",
    "\\\\globallong": "\\\\globallong",
    "\\def": "\\gdef",
    "\\gdef": "\\gdef",
    "\\edef": "\\xdef",
    "\\xdef": "\\xdef",
    "\\let": "\\\\globallet",
    "\\futurelet": "\\\\globalfuture"
  };
  var checkControlSequence = (tok) => {
    const name = tok.text;
    if (/^(?:[\\{}$&#^_]|EOF)$/.test(name)) {
      throw new ParseError("Expected a control sequence", tok);
    }
    return name;
  };
  var getRHS = (parser2) => {
    let tok = parser2.gullet.popToken();
    if (tok.text === "=") {
      tok = parser2.gullet.popToken();
      if (tok.text === " ") {
        tok = parser2.gullet.popToken();
      }
    }
    return tok;
  };
  var letCommand = (parser2, name, tok, global) => {
    let macro = parser2.gullet.macros.get(tok.text);
    if (macro == null) {
      tok.noexpand = true;
      macro = {
        tokens: [tok],
        numArgs: 0,
        // reproduce the same behavior in expansion
        unexpandable: !parser2.gullet.isExpandable(tok.text)
      };
    }
    parser2.gullet.macros.set(name, macro, global);
  };
  defineFunction({
    type: "internal",
    names: [
      "\\global",
      "\\long",
      "\\\\globallong"
      // can’t be entered directly
    ],
    props: {
      numArgs: 0,
      allowedInText: true
    },
    handler({ parser: parser2, funcName }) {
      parser2.consumeSpaces();
      const token = parser2.fetch();
      if (globalMap[token.text]) {
        if (funcName === "\\global" || funcName === "\\\\globallong") {
          token.text = globalMap[token.text];
        }
        return assertNodeType(parser2.parseFunction(), "internal");
      }
      throw new ParseError(`Invalid token after macro prefix`, token);
    }
  });
  defineFunction({
    type: "internal",
    names: ["\\def", "\\gdef", "\\edef", "\\xdef"],
    props: {
      numArgs: 0,
      allowedInText: true,
      primitive: true
    },
    handler({ parser: parser2, funcName }) {
      let tok = parser2.gullet.popToken();
      const name = tok.text;
      if (/^(?:[\\{}$&#^_]|EOF)$/.test(name)) {
        throw new ParseError("Expected a control sequence", tok);
      }
      let numArgs = 0;
      let insert;
      const delimiters2 = [[]];
      while (parser2.gullet.future().text !== "{") {
        tok = parser2.gullet.popToken();
        if (tok.text === "#") {
          if (parser2.gullet.future().text === "{") {
            insert = parser2.gullet.future();
            delimiters2[numArgs].push("{");
            break;
          }
          tok = parser2.gullet.popToken();
          if (!/^[1-9]$/.test(tok.text)) {
            throw new ParseError(`Invalid argument number "${tok.text}"`);
          }
          if (parseInt(tok.text) !== numArgs + 1) {
            throw new ParseError(`Argument number "${tok.text}" out of order`);
          }
          numArgs++;
          delimiters2.push([]);
        } else if (tok.text === "EOF") {
          throw new ParseError("Expected a macro definition");
        } else {
          delimiters2[numArgs].push(tok.text);
        }
      }
      let { tokens } = parser2.gullet.consumeArg();
      if (insert) {
        tokens.unshift(insert);
      }
      if (funcName === "\\edef" || funcName === "\\xdef") {
        tokens = parser2.gullet.expandTokens(tokens);
        if (tokens.length > parser2.gullet.settings.maxExpand) {
          throw new ParseError("Too many expansions in an " + funcName);
        }
        tokens.reverse();
      }
      parser2.gullet.macros.set(
        name,
        { tokens, numArgs, delimiters: delimiters2 },
        funcName === globalMap[funcName]
      );
      return { type: "internal", mode: parser2.mode };
    }
  });
  defineFunction({
    type: "internal",
    names: [
      "\\let",
      "\\\\globallet"
      // can’t be entered directly
    ],
    props: {
      numArgs: 0,
      allowedInText: true,
      primitive: true
    },
    handler({ parser: parser2, funcName }) {
      const name = checkControlSequence(parser2.gullet.popToken());
      parser2.gullet.consumeSpaces();
      const tok = getRHS(parser2);
      letCommand(parser2, name, tok, funcName === "\\\\globallet");
      return { type: "internal", mode: parser2.mode };
    }
  });
  defineFunction({
    type: "internal",
    names: [
      "\\futurelet",
      "\\\\globalfuture"
      // can’t be entered directly
    ],
    props: {
      numArgs: 0,
      allowedInText: true,
      primitive: true
    },
    handler({ parser: parser2, funcName }) {
      const name = checkControlSequence(parser2.gullet.popToken());
      const middle = parser2.gullet.popToken();
      const tok = parser2.gullet.popToken();
      letCommand(parser2, name, tok, funcName === "\\\\globalfuture");
      parser2.gullet.pushToken(tok);
      parser2.gullet.pushToken(middle);
      return { type: "internal", mode: parser2.mode };
    }
  });
  defineFunction({
    type: "internal",
    names: ["\\newcommand", "\\renewcommand", "\\providecommand"],
    props: {
      numArgs: 0,
      allowedInText: true,
      primitive: true
    },
    handler({ parser: parser2, funcName }) {
      let name = "";
      const tok = parser2.gullet.popToken();
      if (tok.text === "{") {
        name = checkControlSequence(parser2.gullet.popToken());
        parser2.gullet.popToken();
      } else {
        name = checkControlSequence(tok);
      }
      const exists = parser2.gullet.isDefined(name);
      if (exists && funcName === "\\newcommand") {
        throw new ParseError(
          `\\newcommand{${name}} attempting to redefine ${name}; use \\renewcommand`
        );
      }
      if (!exists && funcName === "\\renewcommand") {
        throw new ParseError(
          `\\renewcommand{${name}} when command ${name} does not yet exist; use \\newcommand`
        );
      }
      let numArgs = 0;
      if (parser2.gullet.future().text === "[") {
        let tok2 = parser2.gullet.popToken();
        tok2 = parser2.gullet.popToken();
        if (!/^[0-9]$/.test(tok2.text)) {
          throw new ParseError(`Invalid number of arguments: "${tok2.text}"`);
        }
        numArgs = parseInt(tok2.text);
        tok2 = parser2.gullet.popToken();
        if (tok2.text !== "]") {
          throw new ParseError(`Invalid argument "${tok2.text}"`);
        }
      }
      const { tokens } = parser2.gullet.consumeArg();
      if (!(funcName === "\\providecommand" && parser2.gullet.macros.has(name))) {
        parser2.gullet.macros.set(
          name,
          { tokens, numArgs }
        );
      }
      return { type: "internal", mode: parser2.mode };
    }
  });
  var delimiterSizes = {
    "\\bigl": { mclass: "mopen", size: 1 },
    "\\Bigl": { mclass: "mopen", size: 2 },
    "\\biggl": { mclass: "mopen", size: 3 },
    "\\Biggl": { mclass: "mopen", size: 4 },
    "\\bigr": { mclass: "mclose", size: 1 },
    "\\Bigr": { mclass: "mclose", size: 2 },
    "\\biggr": { mclass: "mclose", size: 3 },
    "\\Biggr": { mclass: "mclose", size: 4 },
    "\\bigm": { mclass: "mrel", size: 1 },
    "\\Bigm": { mclass: "mrel", size: 2 },
    "\\biggm": { mclass: "mrel", size: 3 },
    "\\Biggm": { mclass: "mrel", size: 4 },
    "\\big": { mclass: "mord", size: 1 },
    "\\Big": { mclass: "mord", size: 2 },
    "\\bigg": { mclass: "mord", size: 3 },
    "\\Bigg": { mclass: "mord", size: 4 }
  };
  var leftToRight = {
    "(": ")",
    "\\lparen": "\\rparen",
    "[": "]",
    "\\lbrack": "\\rbrack",
    "\\{": "\\}",
    "\\lbrace": "\\rbrace",
    "\u2987": "\u2988",
    "\\llparenthesis": "\\rrparenthesis",
    "\\lfloor": "\\rfloor",
    "\u230A": "\u230B",
    "\\lceil": "\\rceil",
    "\u2308": "\u2309",
    "\\langle": "\\rangle",
    "\u27E8": "\u27E9",
    "\\lAngle": "\\rAngle",
    "\u27EA": "\u27EB",
    "\\llangle": "\\rrangle",
    "\u2989": "\u298A",
    "\\lvert": "\\rvert",
    "\\lVert": "\\rVert",
    "\\lgroup": "\\rgroup",
    "\u27EE": "\u27EF",
    "\\lmoustache": "\\rmoustache",
    "\u23B0": "\u23B1",
    "\\llbracket": "\\rrbracket",
    "\u27E6": "\u27E7",
    "\\lBrace": "\\rBrace",
    "\u2983": "\u2984"
  };
  var leftDelimiterNames = new Set(Object.keys(leftToRight));
  new Set(Object.values(leftToRight));
  var delimiters = /* @__PURE__ */ new Set([
    "(",
    "\\lparen",
    ")",
    "\\rparen",
    "[",
    "\\lbrack",
    "]",
    "\\rbrack",
    "\\{",
    "\\lbrace",
    "\\}",
    "\\rbrace",
    "\u2987",
    "\\llparenthesis",
    "\u2988",
    "\\rrparenthesis",
    "\\lfloor",
    "\\rfloor",
    "\u230A",
    "\u230B",
    "\\lceil",
    "\\rceil",
    "\u2308",
    "\u2309",
    "<",
    ">",
    "\\langle",
    "\u27E8",
    "\\rangle",
    "\u27E9",
    "\\lAngle",
    "\u27EA",
    "\\rAngle",
    "\u27EB",
    "\\llangle",
    "\u2989",
    "\\rrangle",
    "\u298A",
    "\\lt",
    "\\gt",
    "\\lvert",
    "\\rvert",
    "\\lVert",
    "\\rVert",
    "\\lgroup",
    "\\rgroup",
    "\u27EE",
    "\u27EF",
    "\\lmoustache",
    "\\rmoustache",
    "\u23B0",
    "\u23B1",
    "\\llbracket",
    "\\rrbracket",
    "\u27E6",
    "\u27E7",
    "\\lBrace",
    "\\rBrace",
    "\u2983",
    "\u2984",
    "/",
    "\\backslash",
    "|",
    "\\vert",
    "\\|",
    "\\Vert",
    "\u2016",
    "\\uparrow",
    "\\Uparrow",
    "\\downarrow",
    "\\Downarrow",
    "\\updownarrow",
    "\\Updownarrow",
    "."
  ]);
  var dels = /* @__PURE__ */ new Set(["}", "\\left", "\\middle", "\\right"]);
  var isDelimiter = (str) => str.length > 0 && (delimiters.has(str) || delimiterSizes[str] || dels.has(str));
  var sizeToMaxHeight = [0, 1.2, 1.8, 2.4, 3];
  function checkDelimiter(delim, context) {
    if (delim.type === "ordgroup" && delim.body.length === 1) {
      delim = delim.body[0];
    }
    const symDelim = checkSymbolNodeType(delim);
    if (symDelim && delimiters.has(symDelim.text)) {
      if (symDelim.text === "<" || symDelim.text === "\\lt") {
        symDelim.text = "\u27E8";
      }
      if (symDelim.text === ">" || symDelim.text === "\\gt") {
        symDelim.text = "\u27E9";
      }
      return symDelim;
    } else if (symDelim) {
      throw new ParseError(`Invalid delimiter '${symDelim.text}' after '${context.funcName}'`, delim);
    } else {
      throw new ParseError(`Invalid delimiter type '${delim.type}'`, delim);
    }
  }
  var needExplicitStretch = /* @__PURE__ */ new Set(["/", "\\", "\\backslash", "\u2216", "\\vert", "|"]);
  var makeFenceMo = (delim, mode, form, isStretchy) => {
    const text2 = delim === "." ? "" : delim;
    const node = new MathNode("mo", [makeText(text2, mode)]);
    node.setAttribute("fence", "true");
    node.setAttribute("form", form);
    node.setAttribute("stretchy", isStretchy ? "true" : "false");
    return node;
  };
  defineFunction({
    type: "delimsizing",
    names: [
      "\\bigl",
      "\\Bigl",
      "\\biggl",
      "\\Biggl",
      "\\bigr",
      "\\Bigr",
      "\\biggr",
      "\\Biggr",
      "\\bigm",
      "\\Bigm",
      "\\biggm",
      "\\Biggm",
      "\\big",
      "\\Big",
      "\\bigg",
      "\\Bigg"
    ],
    props: {
      numArgs: 1,
      argTypes: ["primitive"]
    },
    handler: (context, args) => {
      const delim = checkDelimiter(args[0], context);
      const delimNode = {
        type: "delimsizing",
        mode: context.parser.mode,
        size: delimiterSizes[context.funcName].size,
        mclass: delimiterSizes[context.funcName].mclass,
        delim: delim.text
      };
      const nextToken = context.parser.fetch().text;
      if (nextToken !== "^" && nextToken !== "_") {
        return delimNode;
      } else {
        return {
          type: "ordgroup",
          mode: "math",
          body: [delimNode, { type: "ordgroup", mode: "math", body: [] }]
        };
      }
    },
    mathmlBuilder: (group) => {
      const children = [];
      const delim = group.delim === "." ? "" : group.delim;
      children.push(makeText(delim, group.mode));
      const node = new MathNode("mo", children);
      if (group.mclass === "mopen" || group.mclass === "mclose") {
        node.setAttribute("fence", "true");
      } else {
        node.setAttribute("fence", "false");
      }
      if (needExplicitStretch.has(delim) || delim.indexOf("arrow") > -1) {
        node.setAttribute("stretchy", "true");
      }
      node.setAttribute("symmetric", "true");
      node.setAttribute("minsize", sizeToMaxHeight[group.size] + "em");
      node.setAttribute("maxsize", sizeToMaxHeight[group.size] + "em");
      return node;
    }
  });
  function assertParsed(group) {
    if (!group.body) {
      throw new Error("Bug: The delim ParseNode wasn't fully parsed.");
    }
  }
  defineFunction({
    type: "leftright-right",
    names: ["\\right"],
    props: {
      numArgs: 1,
      argTypes: ["primitive"]
    },
    handler: (context, args) => {
      return {
        type: "leftright-right",
        mode: context.parser.mode,
        delim: checkDelimiter(args[0], context).text
      };
    }
  });
  defineFunction({
    type: "leftright",
    names: ["\\left"],
    props: {
      numArgs: 1,
      argTypes: ["primitive"]
    },
    handler: (context, args) => {
      const delim = checkDelimiter(args[0], context);
      const parser2 = context.parser;
      ++parser2.leftrightDepth;
      let body = parser2.parseExpression(false, "\\right", true);
      let nextToken = parser2.fetch();
      while (nextToken.text === "\\middle") {
        parser2.consume();
        const middle = parser2.fetch().text;
        if (!symbols.math[middle]) {
          throw new ParseError(`Invalid delimiter '${middle}' after '\\middle'`);
        }
        checkDelimiter({ type: "atom", mode: "math", text: middle }, { funcName: "\\middle" });
        body.push({ type: "middle", mode: "math", delim: middle });
        parser2.consume();
        body = body.concat(parser2.parseExpression(false, "\\right", true));
        nextToken = parser2.fetch();
      }
      --parser2.leftrightDepth;
      parser2.expect("\\right", false);
      const right = assertNodeType(parser2.parseFunction(), "leftright-right");
      return {
        type: "leftright",
        mode: parser2.mode,
        body,
        left: delim.text,
        right: right.delim,
        isStretchy: true
      };
    },
    mathmlBuilder: (group, style) => {
      assertParsed(group);
      const inner2 = buildExpression(group.body, style);
      const leftNode = makeFenceMo(group.left, group.mode, "prefix", true);
      inner2.unshift(leftNode);
      const rightNode = makeFenceMo(group.right, group.mode, "postfix", true);
      if (group.body.length > 0) {
        const lastElement = group.body[group.body.length - 1];
        if (lastElement.type === "color" && !lastElement.isTextColor) {
          rightNode.setAttribute("mathcolor", lastElement.color);
        }
      }
      inner2.push(rightNode);
      return makeRow(inner2);
    }
  });
  defineFunction({
    type: "delimiter",
    names: Array.from(leftDelimiterNames),
    props: {
      numArgs: 0,
      allowedInText: true,
      allowedInMath: true,
      allowedInArgument: true
    },
    handler: ({ parser: parser2, funcName, token }) => {
      if (parser2.mode === "text") {
        return {
          type: "textord",
          mode: "text",
          text: funcName,
          loc: token.loc
        };
      } else if (!parser2.settings.wrapDelimiterPairs) {
        return {
          type: "atom",
          mode: "math",
          family: "open",
          loc: token.loc,
          text: funcName
        };
      }
      const rightDelim = leftToRight[funcName];
      const body = parser2.parseExpression(false, rightDelim, false);
      const nextToken = parser2.fetch().text;
      if (nextToken !== rightDelim) {
        throw new ParseError("Unmatched delimiter");
      }
      parser2.consume();
      return {
        type: "delimiter",
        mode: parser2.mode,
        body,
        left: funcName,
        right: rightDelim
      };
    },
    mathmlBuilder: (group, style) => {
      assertParsed(group);
      const inner2 = buildExpression(group.body, style);
      const leftNode = makeFenceMo(group.left, group.mode, "prefix", false);
      inner2.unshift(leftNode);
      const rightNode = makeFenceMo(group.right, group.mode, "postfix", false);
      if (group.body.length > 0) {
        const lastElement = group.body[group.body.length - 1];
        if (lastElement.type === "color" && !lastElement.isTextColor) {
          rightNode.setAttribute("mathcolor", lastElement.color);
        }
      }
      inner2.push(rightNode);
      return makeRow(inner2);
    }
  });
  defineFunction({
    type: "middle",
    names: ["\\middle"],
    props: {
      numArgs: 1,
      argTypes: ["primitive"]
    },
    handler: (context, args) => {
      const delim = checkDelimiter(args[0], context);
      if (!context.parser.leftrightDepth) {
        throw new ParseError("\\middle without preceding \\left", delim);
      }
      return {
        type: "middle",
        mode: context.parser.mode,
        delim: delim.text
      };
    },
    mathmlBuilder: (group) => {
      const textNode = makeText(group.delim, group.mode);
      const middleNode = new MathNode("mo", [textNode]);
      middleNode.setAttribute("stretchy", "true");
      middleNode.setAttribute("form", "infix");
      if (textNode.text !== "/") {
        middleNode.setAttribute("lspace", "0.05em");
        middleNode.setAttribute("rspace", "0.05em");
      }
      return middleNode;
    }
  });
  var boxTags = ["\\boxed", "\\fcolorbox", "\\colorbox"];
  var mathmlBuilder$7 = (group, style) => {
    const tag2 = boxTags.includes(group.label) ? "mrow" : "menclose";
    const node = new MathNode(tag2, [buildGroup$1(group.body, style)]);
    switch (group.label) {
      case "\\overline":
        node.setAttribute("notation", "top");
        node.classes.push("tml-overline");
        break;
      case "\\underline":
        node.setAttribute("notation", "bottom");
        node.classes.push("tml-underline");
        break;
      case "\\cancel":
        node.setAttribute("notation", "updiagonalstrike");
        node.children.push(new MathNode("mrow", [], ["tml-cancel", "upstrike"]));
        break;
      case "\\bcancel":
        node.setAttribute("notation", "downdiagonalstrike");
        node.children.push(new MathNode("mrow", [], ["tml-cancel", "downstrike"]));
        break;
      case "\\sout":
        node.setAttribute("notation", "horizontalstrike");
        node.children.push(new MathNode("mrow", [], ["tml-cancel", "sout"]));
        break;
      case "\\xcancel":
        node.setAttribute("notation", "updiagonalstrike downdiagonalstrike");
        node.children.push(new MathNode("mrow", [], ["tml-cancel", "tml-xcancel"]));
        break;
      // cancelto is handled in cancelto.js
      case "\\longdiv":
        node.setAttribute("notation", "longdiv");
        node.classes.push("longdiv-top");
        node.children.push(new MathNode("mrow", [], ["longdiv-arc"]));
        break;
      case "\\phase":
        node.setAttribute("notation", "phasorangle");
        node.classes.push("phasor-bottom");
        node.children.push(new MathNode("mrow", [], ["phasor-angle"]));
        break;
      case "\\textcircled":
        node.setAttribute("notation", "circle");
        node.classes.push("circle-pad");
        node.children.push(new MathNode("mrow", [], ["textcircle"]));
        break;
      case "\\angl":
        node.setAttribute("notation", "actuarial");
        node.classes.push("actuarial");
        break;
      case "\\boxed":
        node.style.padding = "3pt";
        node.style.border = "1px solid";
        node.setAttribute("scriptlevel", "0");
        node.setAttribute("displaystyle", "true");
        break;
      case "\\fbox":
        node.setAttribute("notation", "box");
        node.classes.push("tml-fbox");
        break;
      case "\\fcolorbox":
      case "\\colorbox": {
        node.style.padding = "0.3em";
        if (group.label === "\\fcolorbox") {
          node.style.border = "0.0667em solid " + String(group.borderColor);
        }
        break;
      }
    }
    if (group.backgroundColor) {
      node.setAttribute("mathbackground", group.backgroundColor);
    }
    return node;
  };
  defineFunction({
    type: "enclose",
    names: ["\\colorbox"],
    props: {
      numArgs: 2,
      numOptionalArgs: 1,
      allowedInText: true,
      argTypes: ["raw", "raw", "text"]
    },
    handler({ parser: parser2, funcName }, args, optArgs) {
      const model = optArgs[0] && assertNodeType(optArgs[0], "raw").string;
      let color = "";
      if (model) {
        const spec = assertNodeType(args[0], "raw").string;
        color = colorFromSpec(model, spec);
      } else {
        color = validateColor(assertNodeType(args[0], "raw").string, parser2.gullet.macros);
      }
      const body = args[1];
      return {
        type: "enclose",
        mode: parser2.mode,
        label: funcName,
        backgroundColor: color,
        body
      };
    },
    mathmlBuilder: mathmlBuilder$7
  });
  defineFunction({
    type: "enclose",
    names: ["\\fcolorbox"],
    props: {
      numArgs: 3,
      numOptionalArgs: 1,
      allowedInText: true,
      argTypes: ["raw", "raw", "raw", "text"]
    },
    handler({ parser: parser2, funcName }, args, optArgs) {
      const model = optArgs[0] && assertNodeType(optArgs[0], "raw").string;
      let borderColor = "";
      let backgroundColor;
      if (model) {
        const borderSpec = assertNodeType(args[0], "raw").string;
        const backgroundSpec = assertNodeType(args[0], "raw").string;
        borderColor = colorFromSpec(model, borderSpec);
        backgroundColor = colorFromSpec(model, backgroundSpec);
      } else {
        borderColor = validateColor(assertNodeType(args[0], "raw").string, parser2.gullet.macros);
        backgroundColor = validateColor(assertNodeType(args[1], "raw").string, parser2.gullet.macros);
      }
      const body = args[2];
      return {
        type: "enclose",
        mode: parser2.mode,
        label: funcName,
        backgroundColor,
        borderColor,
        body
      };
    },
    mathmlBuilder: mathmlBuilder$7
  });
  defineFunction({
    type: "enclose",
    names: ["\\fbox"],
    props: {
      numArgs: 1,
      argTypes: ["hbox"],
      allowedInText: true
    },
    handler({ parser: parser2 }, args) {
      return {
        type: "enclose",
        mode: parser2.mode,
        label: "\\fbox",
        body: args[0]
      };
    }
  });
  defineFunction({
    type: "enclose",
    names: [
      "\\angl",
      "\\cancel",
      "\\bcancel",
      "\\xcancel",
      "\\overline",
      "\\boxed",
      "\\longdiv",
      "\\phase"
    ],
    props: {
      numArgs: 1
    },
    handler({ parser: parser2, funcName }, args) {
      const body = args[0];
      return {
        type: "enclose",
        mode: parser2.mode,
        label: funcName,
        body
      };
    },
    mathmlBuilder: mathmlBuilder$7
  });
  defineFunction({
    type: "enclose",
    names: ["\\sout"],
    props: {
      numArgs: 1,
      allowedInText: true
    },
    handler({ parser: parser2, funcName }, args) {
      const body = args[0];
      return {
        type: "enclose",
        mode: parser2.mode,
        label: funcName,
        body
      };
    },
    mathmlBuilder: mathmlBuilder$7
  });
  defineFunction({
    type: "enclose",
    names: ["\\underline"],
    props: {
      numArgs: 1,
      allowedInText: true
    },
    handler({ parser: parser2, funcName }, args) {
      const body = args[0];
      return {
        type: "enclose",
        mode: parser2.mode,
        label: funcName,
        body
      };
    },
    mathmlBuilder: mathmlBuilder$7
  });
  defineFunction({
    type: "enclose",
    names: ["\\textcircled"],
    props: {
      numArgs: 1,
      argTypes: ["text"],
      allowedInArgument: true,
      allowedInText: true
    },
    handler({ parser: parser2, funcName }, args) {
      const body = args[0];
      return {
        type: "enclose",
        mode: parser2.mode,
        label: funcName,
        body
      };
    },
    mathmlBuilder: mathmlBuilder$7
  });
  defineFunction({
    type: "environment",
    names: ["\\begin", "\\end"],
    props: {
      numArgs: 1,
      argTypes: ["text"]
    },
    handler({ parser: parser2, funcName }, args) {
      const nameGroup = args[0];
      if (nameGroup.type !== "ordgroup") {
        throw new ParseError("Invalid environment name", nameGroup);
      }
      let envName = "";
      for (let i = 0; i < nameGroup.body.length; ++i) {
        envName += assertNodeType(nameGroup.body[i], "textord").text;
      }
      if (funcName === "\\begin") {
        if (!Object.prototype.hasOwnProperty.call(environments, envName)) {
          throw new ParseError("No such environment: " + envName, nameGroup);
        }
        const env = environments[envName];
        const { args: args2, optArgs } = parser2.parseArguments("\\begin{" + envName + "}", env);
        const context = {
          mode: parser2.mode,
          envName,
          parser: parser2
        };
        const result = env.handler(context, args2, optArgs);
        parser2.expect("\\end", false);
        const endNameToken = parser2.nextToken;
        const end = assertNodeType(parser2.parseFunction(), "environment");
        if (end.name !== envName) {
          throw new ParseError(
            `Mismatch: \\begin{${envName}} matched by \\end{${end.name}}`,
            endNameToken
          );
        }
        return result;
      }
      return {
        type: "environment",
        mode: parser2.mode,
        name: envName,
        nameGroup
      };
    }
  });
  defineFunction({
    type: "envTag",
    names: ["\\env@tag"],
    props: {
      numArgs: 1,
      argTypes: ["math"]
    },
    handler({ parser: parser2 }, args) {
      return {
        type: "envTag",
        mode: parser2.mode,
        body: args[0]
      };
    },
    mathmlBuilder(group, style) {
      return new MathNode("mrow");
    }
  });
  defineFunction({
    type: "noTag",
    names: ["\\env@notag"],
    props: {
      numArgs: 0
    },
    handler({ parser: parser2 }) {
      return {
        type: "noTag",
        mode: parser2.mode
      };
    },
    mathmlBuilder(group, style) {
      return new MathNode("mrow");
    }
  });
  var script = Object.freeze({
    B: 8426,
    // Offset from ASCII B to Unicode script B
    E: 8427,
    F: 8427,
    H: 8387,
    I: 8391,
    L: 8390,
    M: 8422,
    R: 8393,
    e: 8394,
    g: 8355,
    o: 8389
  });
  var frak = Object.freeze({
    C: 8426,
    H: 8388,
    I: 8392,
    R: 8394,
    Z: 8398
  });
  var bbb = Object.freeze({
    C: 8383,
    // blackboard bold
    H: 8389,
    N: 8391,
    P: 8393,
    Q: 8393,
    R: 8395,
    Z: 8394
  });
  var bold = Object.freeze({
    "\u03F5": 119527,
    // lunate epsilon
    "\u03D1": 119564,
    // vartheta
    "\u03F0": 119534,
    // varkappa
    "\u03C6": 119577,
    // varphi
    "\u03F1": 119535,
    // varrho
    "\u03D6": 119563
    // varpi
  });
  var boldItalic = Object.freeze({
    "\u03F5": 119643,
    // lunate epsilon
    "\u03D1": 119680,
    // vartheta
    "\u03F0": 119650,
    // varkappa
    "\u03C6": 119693,
    // varphi
    "\u03F1": 119651,
    // varrho
    "\u03D6": 119679
    // varpi
  });
  var boldsf = Object.freeze({
    "\u03F5": 119701,
    // lunate epsilon
    "\u03D1": 119738,
    // vartheta
    "\u03F0": 119708,
    // varkappa
    "\u03C6": 119751,
    // varphi
    "\u03F1": 119709,
    // varrho
    "\u03D6": 119737
    // varpi
  });
  var bisf = Object.freeze({
    "\u03F5": 119759,
    // lunate epsilon
    "\u03D1": 119796,
    // vartheta
    "\u03F0": 119766,
    // varkappa
    "\u03C6": 119809,
    // varphi
    "\u03F1": 119767,
    // varrho
    "\u03D6": 119795
    // varpi
  });
  var offset = Object.freeze({
    upperCaseLatin: {
      // A-Z
      "normal": (ch) => {
        return 0;
      },
      "bold": (ch) => {
        return 119743;
      },
      "italic": (ch) => {
        return 119795;
      },
      "bold-italic": (ch) => {
        return 119847;
      },
      "script": (ch) => {
        return script[ch] || 119899;
      },
      "script-bold": (ch) => {
        return 119951;
      },
      "fraktur": (ch) => {
        return frak[ch] || 120003;
      },
      "fraktur-bold": (ch) => {
        return 120107;
      },
      "double-struck": (ch) => {
        return bbb[ch] || 120055;
      },
      "sans-serif": (ch) => {
        return 120159;
      },
      "sans-serif-bold": (ch) => {
        return 120211;
      },
      "sans-serif-italic": (ch) => {
        return 120263;
      },
      "sans-serif-bold-italic": (ch) => {
        return 120380;
      },
      "monospace": (ch) => {
        return 120367;
      }
    },
    lowerCaseLatin: {
      // a-z
      "normal": (ch) => {
        return 0;
      },
      "bold": (ch) => {
        return 119737;
      },
      "italic": (ch) => {
        return ch === "h" ? 8358 : 119789;
      },
      "bold-italic": (ch) => {
        return 119841;
      },
      "script": (ch) => {
        return script[ch] || 119893;
      },
      "script-bold": (ch) => {
        return 119945;
      },
      "fraktur": (ch) => {
        return 119997;
      },
      "fraktur-bold": (ch) => {
        return 120101;
      },
      "double-struck": (ch) => {
        return 120049;
      },
      "sans-serif": (ch) => {
        return 120153;
      },
      "sans-serif-bold": (ch) => {
        return 120205;
      },
      "sans-serif-italic": (ch) => {
        return 120257;
      },
      "sans-serif-bold-italic": (ch) => {
        return 120309;
      },
      "monospace": (ch) => {
        return 120361;
      }
    },
    upperCaseGreek: {
      // A-Ω
      "normal": (ch) => {
        return 0;
      },
      "bold": (ch) => {
        return 119575;
      },
      "italic": (ch) => {
        return 119633;
      },
      // \boldsymbol actually returns upright bold for upperCaseGreek
      "bold-italic": (ch) => {
        return 119575;
      },
      "script": (ch) => {
        return 0;
      },
      "script-bold": (ch) => {
        return 0;
      },
      "fraktur": (ch) => {
        return 0;
      },
      "fraktur-bold": (ch) => {
        return 0;
      },
      "double-struck": (ch) => {
        return 0;
      },
      // Unicode has no code points for regular-weight san-serif Greek. Use bold.
      "sans-serif": (ch) => {
        return 119749;
      },
      "sans-serif-bold": (ch) => {
        return 119749;
      },
      "sans-serif-italic": (ch) => {
        return 0;
      },
      "sans-serif-bold-italic": (ch) => {
        return 119807;
      },
      "monospace": (ch) => {
        return 0;
      }
    },
    lowerCaseGreek: {
      // α-ω
      "normal": (ch) => {
        return 0;
      },
      "bold": (ch) => {
        return 119569;
      },
      "italic": (ch) => {
        return 119627;
      },
      "bold-italic": (ch) => {
        return ch === "\u03D5" ? 119678 : 119685;
      },
      "script": (ch) => {
        return 0;
      },
      "script-bold": (ch) => {
        return 0;
      },
      "fraktur": (ch) => {
        return 0;
      },
      "fraktur-bold": (ch) => {
        return 0;
      },
      "double-struck": (ch) => {
        return 0;
      },
      // Unicode has no code points for regular-weight san-serif Greek. Use bold.
      "sans-serif": (ch) => {
        return 119743;
      },
      "sans-serif-bold": (ch) => {
        return 119743;
      },
      "sans-serif-italic": (ch) => {
        return 0;
      },
      "sans-serif-bold-italic": (ch) => {
        return 119801;
      },
      "monospace": (ch) => {
        return 0;
      }
    },
    varGreek: {
      // \varGamma, etc
      "normal": (ch) => {
        return 0;
      },
      "bold": (ch) => {
        return bold[ch] || -51;
      },
      "italic": (ch) => {
        return 0;
      },
      "bold-italic": (ch) => {
        return boldItalic[ch] || 58;
      },
      "script": (ch) => {
        return 0;
      },
      "script-bold": (ch) => {
        return 0;
      },
      "fraktur": (ch) => {
        return 0;
      },
      "fraktur-bold": (ch) => {
        return 0;
      },
      "double-struck": (ch) => {
        return 0;
      },
      "sans-serif": (ch) => {
        return boldsf[ch] || 116;
      },
      "sans-serif-bold": (ch) => {
        return boldsf[ch] || 116;
      },
      "sans-serif-italic": (ch) => {
        return 0;
      },
      "sans-serif-bold-italic": (ch) => {
        return bisf[ch] || 174;
      },
      "monospace": (ch) => {
        return 0;
      }
    },
    numeral: {
      // 0-9
      "normal": (ch) => {
        return 0;
      },
      "bold": (ch) => {
        return 120734;
      },
      "italic": (ch) => {
        return 0;
      },
      "bold-italic": (ch) => {
        return 0;
      },
      "script": (ch) => {
        return 0;
      },
      "script-bold": (ch) => {
        return 0;
      },
      "fraktur": (ch) => {
        return 0;
      },
      "fraktur-bold": (ch) => {
        return 0;
      },
      "double-struck": (ch) => {
        return 120744;
      },
      "sans-serif": (ch) => {
        return 120754;
      },
      "sans-serif-bold": (ch) => {
        return 120764;
      },
      "sans-serif-italic": (ch) => {
        return 0;
      },
      "sans-serif-bold-italic": (ch) => {
        return 0;
      },
      "monospace": (ch) => {
        return 120774;
      }
    }
  });
  var variantChar = (ch, variant) => {
    const codePoint = ch.codePointAt(0);
    const block2 = 64 < codePoint && codePoint < 91 ? "upperCaseLatin" : 96 < codePoint && codePoint < 123 ? "lowerCaseLatin" : 912 < codePoint && codePoint < 938 ? "upperCaseGreek" : 944 < codePoint && codePoint < 970 || ch === "\u03D5" ? "lowerCaseGreek" : 120545 < codePoint && codePoint < 120572 || bold[ch] ? "varGreek" : 47 < codePoint && codePoint < 58 ? "numeral" : "other";
    return block2 === "other" ? ch : String.fromCodePoint(codePoint + offset[block2][variant](ch));
  };
  var smallCaps = Object.freeze({
    a: "\u1D00",
    b: "\u0299",
    c: "\u1D04",
    d: "\u1D05",
    e: "\u1D07",
    f: "\uA730",
    g: "\u0262",
    h: "\u029C",
    i: "\u026A",
    j: "\u1D0A",
    k: "\u1D0B",
    l: "\u029F",
    m: "\u1D0D",
    n: "\u0274",
    o: "\u1D0F",
    p: "\u1D18",
    q: "\u01EB",
    r: "\u0280",
    s: "s",
    t: "\u1D1B",
    u: "\u1D1C",
    v: "\u1D20",
    w: "\u1D21",
    x: "x",
    y: "\u028F",
    z: "\u1D22"
  });
  var varNameFonts = ["mathrm", "mathit"];
  var isLongVariableName = (group, font) => {
    if (!varNameFonts.includes(font) || !group.body || group.body.type !== "ordgroup" || group.body.body.length === 1) {
      return false;
    }
    if (group.body.body[0].type !== "mathord") {
      return false;
    }
    for (let i = 1; i < group.body.body.length; i++) {
      const parseNodeType = group.body.body[i].type;
      if (!(parseNodeType === "mathord" || parseNodeType === "textord" && !isNaN(group.body.body[i].text))) {
        return false;
      }
    }
    return true;
  };
  var mathmlBuilder$6 = (group, style) => {
    const font = group.font;
    const newStyle = style.withFont(font);
    const mathGroup = buildGroup$1(group.body, newStyle);
    if (mathGroup.children.length === 0) {
      return mathGroup;
    }
    if (font === "boldsymbol" && ["mo", "mpadded", "mrow"].includes(mathGroup.type)) {
      mathGroup.style.fontWeight = "bold";
      return mathGroup;
    }
    if (isLongVariableName(group, font)) {
      const mi2 = mathGroup.children[0].children[0].children ? mathGroup.children[0].children[0] : mathGroup.children[0];
      delete mi2.attributes.mathvariant;
      for (let i = 1; i < mathGroup.children.length; i++) {
        mi2.children[0].text += mathGroup.children[i].children[0].children ? mathGroup.children[i].children[0].children[0].text : mathGroup.children[i].children[0].text;
      }
      if (font === "mathit") {
        mi2.children[0].text = mi2.children[0].text.split("").map((c2) => variantChar(c2, "italic")).join("");
        return mi2;
      }
      const mpadded = new MathNode("mpadded", [mi2]);
      mpadded.setAttribute("lspace", "0");
      return mpadded;
    }
    let canConsolidate = mathGroup.children[0].type === "mo";
    for (let i = 1; i < mathGroup.children.length; i++) {
      if (mathGroup.children[i].type === "mo" && font === "boldsymbol") {
        mathGroup.children[i].style.fontWeight = "bold";
      }
      if (mathGroup.children[i].type !== "mi") {
        canConsolidate = false;
      }
      const localVariant = mathGroup.children[i].attributes && mathGroup.children[i].attributes.mathvariant || "";
      if (localVariant !== "normal") {
        canConsolidate = false;
      }
    }
    if (!canConsolidate) {
      return mathGroup;
    }
    const mi = mathGroup.children[0];
    for (let i = 1; i < mathGroup.children.length; i++) {
      mi.children.push(mathGroup.children[i].children[0]);
    }
    if (mi.attributes.mathvariant && mi.attributes.mathvariant === "normal") {
      const bogus = new MathNode("mtext", new TextNode2("\u200B"));
      return new MathNode("mrow", [bogus, mi]);
    }
    return mi;
  };
  var fontAliases = {
    "\\Bbb": "\\mathbb",
    "\\bold": "\\mathbf",
    "\\frak": "\\mathfrak",
    "\\bm": "\\boldsymbol"
  };
  defineFunction({
    type: "font",
    names: [
      // styles
      "\\mathrm",
      "\\mathit",
      "\\mathbf",
      "\\mathnormal",
      "\\up@greek",
      "\\boldsymbol",
      // families
      "\\mathbb",
      "\\mathcal",
      "\\mathfrak",
      "\\mathscr",
      "\\mathsf",
      "\\mathsfit",
      "\\mathtt",
      // aliases
      "\\Bbb",
      "\\bm",
      "\\bold",
      "\\frak"
    ],
    props: {
      numArgs: 1,
      allowedInArgument: true
    },
    handler: ({ parser: parser2, funcName }, args) => {
      const body = normalizeArgument(args[0]);
      let func = funcName;
      if (func in fontAliases) {
        func = fontAliases[func];
      }
      return {
        type: "font",
        mode: parser2.mode,
        font: func.slice(1),
        body
      };
    },
    mathmlBuilder: mathmlBuilder$6
  });
  defineFunction({
    type: "font",
    names: ["\\rm", "\\sf", "\\tt", "\\bf", "\\it", "\\cal"],
    props: {
      numArgs: 0,
      allowedInText: true
    },
    handler: ({ parser: parser2, funcName, breakOnTokenText }, args) => {
      const { mode } = parser2;
      const body = parser2.parseExpression(true, breakOnTokenText, true);
      const fontStyle = `math${funcName.slice(1)}`;
      return {
        type: "font",
        mode,
        font: fontStyle,
        body: {
          type: "ordgroup",
          mode: parser2.mode,
          body
        }
      };
    },
    mathmlBuilder: mathmlBuilder$6
  });
  var stylArray = ["display", "text", "script", "scriptscript"];
  var scriptLevel = { auto: -1, display: 0, text: 0, script: 1, scriptscript: 2 };
  var adjustStyle = (functionSize, originalStyle) => {
    let style = originalStyle;
    if (functionSize === "display") {
      const newSize = style.level >= StyleLevel.SCRIPT ? StyleLevel.TEXT : StyleLevel.DISPLAY;
      style = style.withLevel(newSize);
    } else if (functionSize === "text" && style.level === StyleLevel.DISPLAY) {
      style = style.withLevel(StyleLevel.TEXT);
    } else if (functionSize === "auto") {
      style = style.incrementLevel();
    } else if (functionSize === "script") {
      style = style.withLevel(StyleLevel.SCRIPT);
    } else if (functionSize === "scriptscript") {
      style = style.withLevel(StyleLevel.SCRIPTSCRIPT);
    }
    return style;
  };
  var mathmlBuilder$5 = (group, style) => {
    style = adjustStyle(group.scriptLevel, style);
    const numer = buildGroup$1(group.numer, style);
    const denom = buildGroup$1(group.denom, style);
    if (style.level === 3) {
      numer.style.mathDepth = "2";
      numer.setAttribute("scriptlevel", "2");
      denom.style.mathDepth = "2";
      denom.setAttribute("scriptlevel", "2");
    }
    let node = new MathNode("mfrac", [numer, denom]);
    if (!group.hasBarLine) {
      node.setAttribute("linethickness", "0px");
    } else if (group.barSize) {
      const ruleWidth = calculateSize(group.barSize, style);
      node.setAttribute("linethickness", ruleWidth.number + ruleWidth.unit);
    }
    if (group.leftDelim != null || group.rightDelim != null) {
      const withDelims = [];
      if (group.leftDelim != null) {
        const leftOp = new MathNode("mo", [
          new TextNode2(group.leftDelim.replace("\\", ""))
        ]);
        leftOp.setAttribute("fence", "true");
        withDelims.push(leftOp);
      }
      withDelims.push(node);
      if (group.rightDelim != null) {
        const rightOp = new MathNode("mo", [
          new TextNode2(group.rightDelim.replace("\\", ""))
        ]);
        rightOp.setAttribute("fence", "true");
        withDelims.push(rightOp);
      }
      node = makeRow(withDelims);
    }
    if (group.scriptLevel !== "auto") {
      node = new MathNode("mstyle", [node]);
      node.setAttribute("displaystyle", String(group.scriptLevel === "display"));
      node.setAttribute("scriptlevel", scriptLevel[group.scriptLevel]);
    }
    return node;
  };
  defineFunction({
    type: "genfrac",
    names: [
      "\\cfrac",
      "\\dfrac",
      "\\frac",
      "\\tfrac",
      "\\dbinom",
      "\\binom",
      "\\tbinom",
      "\\\\atopfrac",
      // can’t be entered directly
      "\\\\bracefrac",
      "\\\\brackfrac"
      // ditto
    ],
    props: {
      numArgs: 2,
      allowedInArgument: true
    },
    handler: ({ parser: parser2, funcName }, args) => {
      const numer = args[0];
      const denom = args[1];
      let hasBarLine = false;
      let leftDelim = null;
      let rightDelim = null;
      let scriptLevel2 = "auto";
      switch (funcName) {
        case "\\cfrac":
        case "\\dfrac":
        case "\\frac":
        case "\\tfrac":
          hasBarLine = true;
          break;
        case "\\\\atopfrac":
          hasBarLine = false;
          break;
        case "\\dbinom":
        case "\\binom":
        case "\\tbinom":
          leftDelim = "(";
          rightDelim = ")";
          break;
        case "\\\\bracefrac":
          leftDelim = "\\{";
          rightDelim = "\\}";
          break;
        case "\\\\brackfrac":
          leftDelim = "[";
          rightDelim = "]";
          break;
        default:
          throw new Error("Unrecognized genfrac command");
      }
      if (funcName === "\\cfrac" || funcName.startsWith("\\d")) {
        scriptLevel2 = "display";
      } else if (funcName.startsWith("\\t")) {
        scriptLevel2 = "text";
      }
      return {
        type: "genfrac",
        mode: parser2.mode,
        continued: false,
        numer,
        denom,
        hasBarLine,
        leftDelim,
        rightDelim,
        scriptLevel: scriptLevel2,
        barSize: null
      };
    },
    mathmlBuilder: mathmlBuilder$5
  });
  defineFunction({
    type: "infix",
    names: ["\\over", "\\choose", "\\atop", "\\brace", "\\brack"],
    props: {
      numArgs: 0,
      infix: true
    },
    handler({ parser: parser2, funcName, token }) {
      let replaceWith;
      switch (funcName) {
        case "\\over":
          replaceWith = "\\frac";
          break;
        case "\\choose":
          replaceWith = "\\binom";
          break;
        case "\\atop":
          replaceWith = "\\\\atopfrac";
          break;
        case "\\brace":
          replaceWith = "\\\\bracefrac";
          break;
        case "\\brack":
          replaceWith = "\\\\brackfrac";
          break;
        default:
          throw new Error("Unrecognized infix genfrac command");
      }
      return {
        type: "infix",
        mode: parser2.mode,
        replaceWith,
        token
      };
    }
  });
  var delimFromValue = function(delimString) {
    let delim = null;
    if (delimString.length > 0) {
      delim = delimString;
      delim = delim === "." ? null : delim;
    }
    return delim;
  };
  defineFunction({
    type: "genfrac",
    names: ["\\genfrac"],
    props: {
      numArgs: 6,
      allowedInArgument: true,
      argTypes: ["math", "math", "size", "text", "math", "math"]
    },
    handler({ parser: parser2 }, args) {
      const numer = args[4];
      const denom = args[5];
      const leftNode = normalizeArgument(args[0]);
      const leftDelim = leftNode.type === "atom" && leftNode.family === "open" ? delimFromValue(leftNode.text) : null;
      const rightNode = normalizeArgument(args[1]);
      const rightDelim = rightNode.type === "atom" && rightNode.family === "close" ? delimFromValue(rightNode.text) : null;
      const barNode = assertNodeType(args[2], "size");
      let hasBarLine;
      let barSize = null;
      if (barNode.isBlank) {
        hasBarLine = true;
      } else {
        barSize = barNode.value;
        hasBarLine = barSize.number > 0;
      }
      let scriptLevel2 = "auto";
      let styl = args[3];
      if (styl.type === "ordgroup") {
        if (styl.body.length > 0) {
          const textOrd = assertNodeType(styl.body[0], "textord");
          scriptLevel2 = stylArray[Number(textOrd.text)];
        }
      } else {
        styl = assertNodeType(styl, "textord");
        scriptLevel2 = stylArray[Number(styl.text)];
      }
      return {
        type: "genfrac",
        mode: parser2.mode,
        numer,
        denom,
        continued: false,
        hasBarLine,
        barSize,
        leftDelim,
        rightDelim,
        scriptLevel: scriptLevel2
      };
    },
    mathmlBuilder: mathmlBuilder$5
  });
  defineFunction({
    type: "infix",
    names: ["\\above"],
    props: {
      numArgs: 1,
      argTypes: ["size"],
      infix: true
    },
    handler({ parser: parser2, funcName, token }, args) {
      return {
        type: "infix",
        mode: parser2.mode,
        replaceWith: "\\\\abovefrac",
        barSize: assertNodeType(args[0], "size").value,
        token
      };
    }
  });
  defineFunction({
    type: "genfrac",
    names: ["\\\\abovefrac"],
    props: {
      numArgs: 3,
      argTypes: ["math", "size", "math"]
    },
    handler: ({ parser: parser2, funcName }, args) => {
      const numer = args[0];
      const barSize = assert(assertNodeType(args[1], "infix").barSize);
      const denom = args[2];
      const hasBarLine = barSize.number > 0;
      return {
        type: "genfrac",
        mode: parser2.mode,
        numer,
        denom,
        continued: false,
        hasBarLine,
        barSize,
        leftDelim: null,
        rightDelim: null,
        scriptLevel: "auto"
      };
    },
    mathmlBuilder: mathmlBuilder$5
  });
  defineFunction({
    type: "hbox",
    names: ["\\hbox"],
    props: {
      numArgs: 1,
      argTypes: ["hbox"],
      allowedInArgument: true,
      allowedInText: false
    },
    handler({ parser: parser2 }, args) {
      return {
        type: "hbox",
        mode: parser2.mode,
        body: ordargument(args[0])
      };
    },
    mathmlBuilder(group, style) {
      const newStyle = style.withLevel(StyleLevel.TEXT);
      const mrow = buildExpressionRow(group.body, newStyle);
      return consolidateText(mrow);
    }
  });
  var mathmlBuilder$4 = (group, style) => {
    const accentNode2 = mathMLnode(group.label);
    accentNode2.style["math-depth"] = 0;
    return new MathNode(group.isOver ? "mover" : "munder", [
      buildGroup$1(group.base, style),
      accentNode2
    ]);
  };
  defineFunction({
    type: "horizBracket",
    names: ["\\overbrace", "\\underbrace", "\\overbracket", "\\underbracket"],
    props: {
      numArgs: 1
    },
    handler({ parser: parser2, funcName }, args) {
      return {
        type: "horizBracket",
        mode: parser2.mode,
        label: funcName,
        isOver: /^\\over/.test(funcName),
        base: args[0]
      };
    },
    mathmlBuilder: mathmlBuilder$4
  });
  defineFunction({
    type: "html",
    names: ["\\class", "\\id", "\\style", "\\data"],
    props: {
      numArgs: 2,
      argTypes: ["raw", "original"],
      allowedInText: true
    },
    handler: ({ parser: parser2, funcName, token }, args) => {
      const value = assertNodeType(args[0], "raw").string;
      const body = args[1];
      if (parser2.settings.strict) {
        throw new ParseError(`Function "${funcName}" is disabled in strict mode`, token);
      }
      let trustContext;
      const attributes = {};
      switch (funcName) {
        case "\\class":
          attributes.class = value;
          trustContext = {
            command: "\\class",
            class: value
          };
          break;
        case "\\id":
          attributes.id = value;
          trustContext = {
            command: "\\id",
            id: value
          };
          break;
        case "\\style":
          attributes.style = value;
          trustContext = {
            command: "\\style",
            style: value
          };
          break;
        case "\\data": {
          const data = value.split(",");
          for (let i = 0; i < data.length; i++) {
            const keyVal = data[i].split("=");
            if (keyVal.length !== 2) {
              throw new ParseError("Error parsing key-value for \\data");
            }
            attributes["data-" + keyVal[0].trim()] = keyVal[1].trim();
          }
          trustContext = {
            command: "\\data",
            attributes
          };
          break;
        }
        default:
          throw new Error("Unrecognized html command");
      }
      if (!parser2.settings.isTrusted(trustContext)) {
        throw new ParseError(`Function "${funcName}" is not trusted`, token);
      }
      return {
        type: "html",
        mode: parser2.mode,
        attributes,
        body: ordargument(body)
      };
    },
    mathmlBuilder: (group, style) => {
      const element = buildExpressionRow(group.body, style);
      const classes = [];
      if (group.attributes.class) {
        classes.push(...group.attributes.class.trim().split(/\s+/));
      }
      element.classes = classes;
      for (const attr in group.attributes) {
        if (attr !== "class" && Object.prototype.hasOwnProperty.call(group.attributes, attr)) {
          element.setAttribute(attr, group.attributes[attr]);
        }
      }
      return element;
    }
  });
  var sizeData = function(str) {
    if (/^[-+]? *(\d+(\.\d*)?|\.\d+)$/.test(str)) {
      return { number: +str, unit: "bp" };
    } else {
      const match = /([-+]?) *(\d+(?:\.\d*)?|\.\d+) *([a-z]{2})/.exec(str);
      if (!match) {
        throw new ParseError("Invalid size: '" + str + "' in \\includegraphics");
      }
      const data = {
        number: +(match[1] + match[2]),
        // sign + magnitude, cast to number
        unit: match[3]
      };
      if (!validUnit(data)) {
        throw new ParseError("Invalid unit: '" + data.unit + "' in \\includegraphics.");
      }
      return data;
    }
  };
  defineFunction({
    type: "includegraphics",
    names: ["\\includegraphics"],
    props: {
      numArgs: 1,
      numOptionalArgs: 1,
      argTypes: ["raw", "url"],
      allowedInText: false
    },
    handler: ({ parser: parser2, token }, args, optArgs) => {
      let width = { number: 0, unit: "em" };
      let height = { number: 0.9, unit: "em" };
      let totalheight = { number: 0, unit: "em" };
      let alt = "";
      if (optArgs[0]) {
        const attributeStr = assertNodeType(optArgs[0], "raw").string;
        const attributes = attributeStr.split(",");
        for (let i = 0; i < attributes.length; i++) {
          const keyVal = attributes[i].split("=");
          if (keyVal.length === 2) {
            const str = keyVal[1].trim();
            switch (keyVal[0].trim()) {
              case "alt":
                alt = str;
                break;
              case "width":
                width = sizeData(str);
                break;
              case "height":
                height = sizeData(str);
                break;
              case "totalheight":
                totalheight = sizeData(str);
                break;
              default:
                throw new ParseError("Invalid key: '" + keyVal[0] + "' in \\includegraphics.");
            }
          }
        }
      }
      const src = assertNodeType(args[0], "url").url;
      if (alt === "") {
        alt = src;
        alt = alt.replace(/^.*[\\/]/, "");
        alt = alt.substring(0, alt.lastIndexOf("."));
      }
      if (!parser2.settings.isTrusted({
        command: "\\includegraphics",
        url: src
      })) {
        throw new ParseError(`Function "\\includegraphics" is not trusted`, token);
      }
      return {
        type: "includegraphics",
        mode: parser2.mode,
        alt,
        width,
        height,
        totalheight,
        src
      };
    },
    mathmlBuilder: (group, style) => {
      const height = calculateSize(group.height, style);
      const depth = { number: 0, unit: "em" };
      if (group.totalheight.number > 0) {
        if (group.totalheight.unit === height.unit && group.totalheight.number > height.number) {
          depth.number = group.totalheight.number - height.number;
          depth.unit = height.unit;
        }
      }
      let width = 0;
      if (group.width.number > 0) {
        width = calculateSize(group.width, style);
      }
      const graphicStyle = { height: height.number + depth.number + "em" };
      if (width.number > 0) {
        graphicStyle.width = width.number + width.unit;
      }
      if (depth.number > 0) {
        graphicStyle.verticalAlign = -depth.number + depth.unit;
      }
      const node = new Img(group.src, group.alt, graphicStyle);
      node.height = height;
      node.depth = depth;
      return new MathNode("mtext", [node]);
    }
  });
  defineFunction({
    type: "kern",
    names: ["\\kern", "\\mkern", "\\hskip", "\\mskip"],
    props: {
      numArgs: 1,
      argTypes: ["size"],
      primitive: true,
      allowedInText: true
    },
    handler({ parser: parser2, funcName, token }, args) {
      const size = assertNodeType(args[0], "size");
      if (parser2.settings.strict) {
        const mathFunction = funcName[1] === "m";
        const muUnit = size.value.unit === "mu";
        if (mathFunction) {
          if (!muUnit) {
            throw new ParseError(`LaTeX's ${funcName} supports only mu units, not ${size.value.unit} units`, token);
          }
          if (parser2.mode !== "math") {
            throw new ParseError(`LaTeX's ${funcName} works only in math mode`, token);
          }
        } else {
          if (muUnit) {
            throw new ParseError(`LaTeX's ${funcName} doesn't support mu units`, token);
          }
        }
      }
      return {
        type: "kern",
        mode: parser2.mode,
        dimension: size.value
      };
    },
    mathmlBuilder(group, style) {
      const dimension = calculateSize(group.dimension, style);
      const ch = dimension.number > 0 && dimension.unit === "em" ? spaceCharacter(dimension.number) : "";
      if (group.mode === "text" && ch.length > 0) {
        const character = new TextNode2(ch);
        return new MathNode("mtext", [character]);
      } else {
        if (dimension.number >= 0) {
          const node = new MathNode("mspace");
          node.setAttribute("width", dimension.number + dimension.unit);
          return node;
        } else {
          const node = new MathNode("mrow");
          node.style.marginLeft = dimension.number + dimension.unit;
          return node;
        }
      }
    }
  });
  var spaceCharacter = function(width) {
    if (width >= 0.05555 && width <= 0.05556) {
      return "\u200A";
    } else if (width >= 0.1666 && width <= 0.1667) {
      return "\u2009";
    } else if (width >= 0.2222 && width <= 0.2223) {
      return "\u2005";
    } else if (width >= 0.2777 && width <= 0.2778) {
      return "\u2005\u200A";
    } else {
      return "";
    }
  };
  var invalidIdRegEx = /[^A-Za-z_0-9-]/g;
  defineFunction({
    type: "label",
    names: ["\\label"],
    props: {
      numArgs: 1,
      argTypes: ["raw"]
    },
    handler({ parser: parser2 }, args) {
      return {
        type: "label",
        mode: parser2.mode,
        string: args[0].string.replace(invalidIdRegEx, "")
      };
    },
    mathmlBuilder(group, style) {
      const node = new MathNode("mrow", [], ["tml-label"]);
      if (group.string.length > 0) {
        node.setLabel(group.string);
      }
      return node;
    }
  });
  var textModeLap = ["\\clap", "\\llap", "\\rlap"];
  defineFunction({
    type: "lap",
    names: ["\\mathllap", "\\mathrlap", "\\mathclap", "\\clap", "\\llap", "\\rlap"],
    props: {
      numArgs: 1,
      allowedInText: true
    },
    handler: ({ parser: parser2, funcName, token }, args) => {
      if (textModeLap.includes(funcName)) {
        if (parser2.settings.strict && parser2.mode !== "text") {
          throw new ParseError(`{${funcName}} can be used only in text mode.
 Try \\math${funcName.slice(1)}`, token);
        }
        funcName = funcName.slice(1);
      } else {
        funcName = funcName.slice(5);
      }
      const body = args[0];
      return {
        type: "lap",
        mode: parser2.mode,
        alignment: funcName,
        body
      };
    },
    mathmlBuilder: (group, style) => {
      let strut;
      if (group.alignment === "llap") {
        const phantomInner = buildExpression(ordargument(group.body), style);
        const phantom2 = new MathNode("mphantom", phantomInner);
        strut = new MathNode("mpadded", [phantom2]);
        strut.setAttribute("width", "0.1px");
      }
      const inner2 = buildGroup$1(group.body, style);
      let node;
      if (group.alignment === "llap") {
        inner2.style.position = "absolute";
        inner2.style.right = "0";
        inner2.style.bottom = `0`;
        node = new MathNode("mpadded", [strut, inner2]);
      } else {
        node = new MathNode("mpadded", [inner2]);
      }
      if (group.alignment === "rlap") {
        if (group.body.body.length > 0 && group.body.body[0].type === "genfrac") {
          node.setAttribute("lspace", "0.16667em");
        }
      } else {
        const offset2 = group.alignment === "llap" ? "-1" : "-0.5";
        node.setAttribute("lspace", offset2 + "width");
        if (group.alignment === "llap") {
          node.style.position = "relative";
        } else {
          node.style.display = "flex";
          node.style.justifyContent = "center";
        }
      }
      node.setAttribute("width", "0.1px");
      return node;
    }
  });
  defineFunction({
    type: "ordgroup",
    names: ["\\(", "$"],
    props: {
      numArgs: 0,
      allowedInText: true,
      allowedInMath: false
    },
    handler({ funcName, parser: parser2 }, args) {
      const outerMode = parser2.mode;
      parser2.switchMode("math");
      const close2 = funcName === "\\(" ? "\\)" : "$";
      const body = parser2.parseExpression(false, close2);
      parser2.expect(close2);
      parser2.switchMode(outerMode);
      return {
        type: "ordgroup",
        mode: parser2.mode,
        body
      };
    }
  });
  defineFunction({
    type: "text",
    // Doesn't matter what this is.
    names: ["\\)", "\\]"],
    props: {
      numArgs: 0,
      allowedInText: true,
      allowedInMath: false
    },
    handler(context, token) {
      throw new ParseError(`Mismatched ${context.funcName}`, token);
    }
  });
  var chooseStyle = (group, style) => {
    switch (style.level) {
      case StyleLevel.DISPLAY:
        return group.display;
      case StyleLevel.TEXT:
        return group.text;
      case StyleLevel.SCRIPT:
        return group.script;
      case StyleLevel.SCRIPTSCRIPT:
        return group.scriptscript;
      default:
        return group.text;
    }
  };
  defineFunction({
    type: "mathchoice",
    names: ["\\mathchoice"],
    props: {
      numArgs: 4,
      primitive: true
    },
    handler: ({ parser: parser2 }, args) => {
      return {
        type: "mathchoice",
        mode: parser2.mode,
        display: ordargument(args[0]),
        text: ordargument(args[1]),
        script: ordargument(args[2]),
        scriptscript: ordargument(args[3])
      };
    },
    mathmlBuilder: (group, style) => {
      const body = chooseStyle(group, style);
      return buildExpressionRow(body, style);
    }
  });
  var textAtomTypes = ["text", "textord", "mathord", "atom"];
  function mathmlBuilder$3(group, style) {
    let node;
    const inner2 = buildExpression(group.body, style);
    if (group.mclass === "minner") {
      node = new MathNode("mpadded", inner2);
    } else if (group.mclass === "mord") {
      if (group.isCharacterBox || inner2[0].type === "mathord") {
        node = inner2[0];
        node.type = "mi";
        if (node.children.length === 1 && node.children[0].text && node.children[0].text === "\u2207") {
          node.setAttribute("mathvariant", "normal");
        }
      } else {
        node = new MathNode("mi", inner2);
      }
    } else {
      node = new MathNode("mrow", inner2);
      if (group.mustPromote) {
        node = inner2[0];
        node.type = "mo";
        if (group.isCharacterBox && group.body[0].text && /[A-Za-z]/.test(group.body[0].text)) {
          node.setAttribute("mathvariant", "italic");
        }
      } else {
        node = new MathNode("mrow", inner2);
      }
      const doSpacing = style.level < 2;
      if (node.type === "mrow") {
        if (doSpacing) {
          if (group.mclass === "mbin") {
            node.children.unshift(padding(0.2222));
            node.children.push(padding(0.2222));
          } else if (group.mclass === "mrel") {
            node.children.unshift(padding(0.2778));
            node.children.push(padding(0.2778));
          } else if (group.mclass === "mpunct") {
            node.children.push(padding(0.1667));
          } else if (group.mclass === "minner") {
            node.children.unshift(padding(0.0556));
            node.children.push(padding(0.0556));
          }
        }
      } else {
        if (group.mclass === "mbin") {
          node.attributes.lspace = doSpacing ? "0.2222em" : "0";
          node.attributes.rspace = doSpacing ? "0.2222em" : "0";
        } else if (group.mclass === "mrel") {
          node.attributes.lspace = doSpacing ? "0.2778em" : "0";
          node.attributes.rspace = doSpacing ? "0.2778em" : "0";
        } else if (group.mclass === "mpunct") {
          node.attributes.lspace = "0em";
          node.attributes.rspace = doSpacing ? "0.1667em" : "0";
        } else if (group.mclass === "mopen" || group.mclass === "mclose") {
          node.attributes.lspace = "0em";
          node.attributes.rspace = "0em";
        } else if (group.mclass === "minner" && doSpacing) {
          node.attributes.lspace = "0.0556em";
          node.attributes.width = "+0.1111em";
        }
      }
      if (!(group.mclass === "mopen" || group.mclass === "mclose")) {
        delete node.attributes.stretchy;
        delete node.attributes.form;
      }
    }
    return node;
  }
  defineFunction({
    type: "mclass",
    names: [
      "\\mathord",
      "\\mathbin",
      "\\mathrel",
      "\\mathopen",
      "\\mathclose",
      "\\mathpunct",
      "\\mathinner"
    ],
    props: {
      numArgs: 1,
      primitive: true
    },
    handler({ parser: parser2, funcName }, args) {
      const body = args[0];
      const isCharacterBox$1 = isCharacterBox(body);
      let mustPromote = true;
      const mord = { type: "mathord", text: "", mode: parser2.mode };
      const arr = body.body ? body.body : [body];
      for (const arg of arr) {
        if (textAtomTypes.includes(arg.type)) {
          if (symbols[parser2.mode][arg.text]) {
            mord.text += symbols[parser2.mode][arg.text].replace;
          } else if (arg.text) {
            mord.text += arg.text;
          } else if (arg.body) {
            arg.body.map((e) => {
              mord.text += e.text;
            });
          }
        } else {
          mustPromote = false;
          break;
        }
      }
      if (mustPromote && funcName === "\\mathord" && mord.type === "mathord" && mord.text.length > 1) {
        return mord;
      } else {
        return {
          type: "mclass",
          mode: parser2.mode,
          mclass: "m" + funcName.slice(5),
          body: ordargument(mustPromote ? mord : body),
          isCharacterBox: isCharacterBox$1,
          mustPromote
        };
      }
    },
    mathmlBuilder: mathmlBuilder$3
  });
  var binrelClass = (arg) => {
    const atom = arg.type === "ordgroup" && arg.body.length && arg.body.length === 1 ? arg.body[0] : arg;
    if (atom.type === "atom") {
      const family = arg.body.length > 0 && arg.body[0].text && symbols.math[arg.body[0].text] ? symbols.math[arg.body[0].text].group : atom.family;
      if (family === "bin" || family === "rel") {
        return "m" + family;
      } else {
        return "mord";
      }
    } else {
      return "mord";
    }
  };
  defineFunction({
    type: "mclass",
    names: ["\\@binrel"],
    props: {
      numArgs: 2
    },
    handler({ parser: parser2 }, args) {
      return {
        type: "mclass",
        mode: parser2.mode,
        mclass: binrelClass(args[0]),
        body: ordargument(args[1]),
        isCharacterBox: isCharacterBox(args[1])
      };
    }
  });
  defineFunction({
    type: "mclass",
    names: ["\\stackrel", "\\overset", "\\underset"],
    props: {
      numArgs: 2
    },
    handler({ parser: parser2, funcName }, args) {
      const baseArg = args[1];
      const shiftedArg = args[0];
      let mclass;
      if (funcName !== "\\stackrel") {
        mclass = binrelClass(baseArg);
      } else {
        mclass = "mrel";
      }
      const baseType = mclass === "mrel" || mclass === "mbin" ? "op" : "ordgroup";
      const baseOp = {
        type: baseType,
        mode: baseArg.mode,
        limits: true,
        alwaysHandleSupSub: true,
        parentIsSupSub: false,
        symbol: false,
        suppressBaseShift: funcName !== "\\stackrel",
        body: ordargument(baseArg)
      };
      return {
        type: "supsub",
        mode: shiftedArg.mode,
        stack: true,
        base: baseOp,
        sup: funcName === "\\underset" ? null : shiftedArg,
        sub: funcName === "\\underset" ? shiftedArg : null
      };
    },
    mathmlBuilder: mathmlBuilder$3
  });
  var buildGroup = (el, style, noneNode) => {
    if (!el) {
      return noneNode;
    }
    const node = buildGroup$1(el, style);
    if (node.type === "mrow" && node.children.length === 0) {
      return noneNode;
    }
    return node;
  };
  defineFunction({
    type: "multiscript",
    names: ["\\sideset", "\\pres@cript"],
    // See macros.js for \prescript
    props: {
      numArgs: 3
    },
    handler({ parser: parser2, funcName, token }, args) {
      if (args[2].body.length === 0) {
        throw new ParseError(funcName + `cannot parse an empty base.`);
      }
      const base = args[2].body[0];
      if (parser2.settings.strict && funcName === "\\sideset" && !base.symbol) {
        throw new ParseError(`The base of \\sideset must be a big operator. Try \\prescript.`);
      }
      if (args[0].body.length > 0 && args[0].body[0].type !== "supsub" || args[1].body.length > 0 && args[1].body[0].type !== "supsub") {
        throw new ParseError("\\sideset can parse only subscripts and superscripts in its first two arguments", token);
      }
      const prescripts = args[0].body.length > 0 ? args[0].body[0] : null;
      const postscripts = args[1].body.length > 0 ? args[1].body[0] : null;
      if (!prescripts && !postscripts) {
        return base;
      } else if (!prescripts) {
        return {
          type: "styling",
          mode: parser2.mode,
          scriptLevel: "text",
          body: [{
            type: "supsub",
            mode: parser2.mode,
            base,
            sup: postscripts.sup,
            sub: postscripts.sub
          }]
        };
      } else {
        return {
          type: "multiscript",
          mode: parser2.mode,
          isSideset: funcName === "\\sideset",
          prescripts,
          postscripts,
          base
        };
      }
    },
    mathmlBuilder(group, style) {
      const base = buildGroup$1(group.base, style);
      const prescriptsNode = new MathNode("mprescripts");
      const noneNode = new MathNode("none");
      let children = [];
      const preSub = buildGroup(group.prescripts.sub, style, noneNode);
      const preSup = buildGroup(group.prescripts.sup, style, noneNode);
      if (group.isSideset) {
        preSub.setAttribute("style", "text-align: left;");
        preSup.setAttribute("style", "text-align: left;");
      }
      if (group.postscripts) {
        const postSub = buildGroup(group.postscripts.sub, style, noneNode);
        const postSup = buildGroup(group.postscripts.sup, style, noneNode);
        children = [base, postSub, postSup, prescriptsNode, preSub, preSup];
      } else {
        children = [base, prescriptsNode, preSub, preSup];
      }
      return new MathNode("mmultiscripts", children);
    }
  });
  defineFunction({
    type: "not",
    names: ["\\not"],
    props: {
      numArgs: 1,
      primitive: true,
      allowedInText: false
    },
    handler({ parser: parser2 }, args) {
      const isCharacterBox$1 = isCharacterBox(args[0]);
      let body;
      if (isCharacterBox$1) {
        body = ordargument(args[0]);
        if (body[0].text.charAt(0) === "\\") {
          body[0].text = symbols.math[body[0].text].replace;
        }
        body[0].text = body[0].text.slice(0, 1) + "\u0338" + body[0].text.slice(1);
      } else {
        const notNode = { type: "textord", mode: "math", text: "\u0338" };
        const kernNode = { type: "kern", mode: "math", dimension: { number: -0.6, unit: "em" } };
        body = [notNode, kernNode, args[0]];
      }
      return {
        type: "not",
        mode: parser2.mode,
        body,
        isCharacterBox: isCharacterBox$1
      };
    },
    mathmlBuilder(group, style) {
      if (group.isCharacterBox) {
        const inner2 = buildExpression(group.body, style, true);
        return inner2[0];
      } else {
        return buildExpressionRow(group.body, style);
      }
    }
  });
  var ordAtomTypes = ["textord", "mathord", "atom"];
  var noSuccessor = ["\\smallint"];
  var ordTypes = ["textord", "mathord", "ordgroup", "close", "leftright", "font"];
  var setSpacing = (node) => {
    node.attributes.lspace = "0.1667em";
    node.attributes.rspace = "0.1667em";
  };
  var mathmlBuilder$2 = (group, style) => {
    let node;
    if (group.symbol) {
      node = new MathNode("mo", [makeText(group.name, group.mode)]);
      if (noSuccessor.includes(group.name)) {
        node.setAttribute("largeop", "false");
      } else {
        node.setAttribute("movablelimits", "false");
      }
      if (group.fromMathOp) {
        setSpacing(node);
      }
    } else if (group.body) {
      node = new MathNode("mo", buildExpression(group.body, style));
      if (group.fromMathOp) {
        setSpacing(node);
      }
    } else {
      node = new MathNode("mi", [new TextNode2(group.name.slice(1))]);
      if (!group.parentIsSupSub) {
        const operator = new MathNode("mo", [makeText("\u2061", "text")]);
        const row = [node, operator];
        if (group.needsLeadingSpace) {
          const lead = new MathNode("mspace");
          lead.setAttribute("width", "0.1667em");
          row.unshift(lead);
        }
        if (!group.isFollowedByDelimiter) {
          const trail = new MathNode("mspace");
          trail.setAttribute("width", "0.1667em");
          row.push(trail);
        }
        node = new MathNode("mrow", row);
      }
    }
    return node;
  };
  var singleCharBigOps = {
    "\u220F": "\\prod",
    "\u2210": "\\coprod",
    "\u2211": "\\sum",
    "\u22C0": "\\bigwedge",
    "\u22C1": "\\bigvee",
    "\u22C2": "\\bigcap",
    "\u22C3": "\\bigcup",
    "\u2A00": "\\bigodot",
    "\u2A01": "\\bigoplus",
    "\u2A02": "\\bigotimes",
    "\u2A04": "\\biguplus",
    "\u2A05": "\\bigsqcap",
    "\u2A06": "\\bigsqcup",
    "\u2A03": "\\bigcupdot",
    "\u2A07": "\\bigdoublevee",
    "\u2A08": "\\bigdoublewedge",
    "\u2A09": "\\bigtimes"
  };
  defineFunction({
    type: "op",
    names: [
      "\\coprod",
      "\\bigvee",
      "\\bigwedge",
      "\\biguplus",
      "\\bigcupplus",
      "\\bigcupdot",
      "\\bigcap",
      "\\bigcup",
      "\\bigdoublevee",
      "\\bigdoublewedge",
      "\\intop",
      "\\prod",
      "\\sum",
      "\\bigotimes",
      "\\bigoplus",
      "\\bigodot",
      "\\bigsqcap",
      "\\bigsqcup",
      "\\bigtimes",
      "\\smallint",
      "\u220F",
      "\u2210",
      "\u2211",
      "\u22C0",
      "\u22C1",
      "\u22C2",
      "\u22C3",
      "\u2A00",
      "\u2A01",
      "\u2A02",
      "\u2A03",
      "\u2A04",
      "\u2A05",
      "\u2A06",
      "\u2A07",
      "\u2A08",
      "\u2A09"
    ],
    props: {
      numArgs: 0
    },
    handler: ({ parser: parser2, funcName }, args) => {
      let fName = funcName;
      if (fName.length === 1) {
        fName = singleCharBigOps[fName];
      }
      return {
        type: "op",
        mode: parser2.mode,
        limits: true,
        parentIsSupSub: false,
        symbol: true,
        stack: false,
        // This is true for \stackrel{}, not here.
        name: fName
      };
    },
    mathmlBuilder: mathmlBuilder$2
  });
  defineFunction({
    type: "op",
    names: ["\\mathop"],
    props: {
      numArgs: 1,
      primitive: true
    },
    handler: ({ parser: parser2 }, args) => {
      const body = args[0];
      const arr = body.body ? body.body : [body];
      const isSymbol = arr.length === 1 && ordAtomTypes.includes(arr[0].type);
      return {
        type: "op",
        mode: parser2.mode,
        limits: true,
        parentIsSupSub: false,
        symbol: isSymbol,
        fromMathOp: true,
        stack: false,
        name: isSymbol ? arr[0].text : null,
        body: isSymbol ? null : ordargument(body)
      };
    },
    mathmlBuilder: mathmlBuilder$2
  });
  var singleCharIntegrals = {
    "\u222B": "\\int",
    "\u222C": "\\iint",
    "\u222D": "\\iiint",
    "\u222E": "\\oint",
    "\u222F": "\\oiint",
    "\u2230": "\\oiiint",
    "\u2231": "\\intclockwise",
    "\u2232": "\\varointclockwise",
    "\u2A0C": "\\iiiint",
    "\u2A0D": "\\intbar",
    "\u2A0E": "\\intBar",
    "\u2A0F": "\\fint",
    "\u2A12": "\\rppolint",
    "\u2A13": "\\scpolint",
    "\u2A15": "\\pointint",
    "\u2A16": "\\sqint",
    "\u2A17": "\\intlarhk",
    "\u2A18": "\\intx",
    "\u2A19": "\\intcap",
    "\u2A1A": "\\intcup"
  };
  defineFunction({
    type: "op",
    names: [
      "\\arcsin",
      "\\arccos",
      "\\arctan",
      "\\arctg",
      "\\arcctg",
      "\\arg",
      "\\ch",
      "\\cos",
      "\\cosec",
      "\\cosh",
      "\\cot",
      "\\cotg",
      "\\coth",
      "\\csc",
      "\\ctg",
      "\\cth",
      "\\deg",
      "\\dim",
      "\\exp",
      "\\hom",
      "\\ker",
      "\\lg",
      "\\ln",
      "\\log",
      "\\sec",
      "\\sin",
      "\\sinh",
      "\\sh",
      "\\sgn",
      "\\tan",
      "\\tanh",
      "\\tg",
      "\\th"
    ],
    props: {
      numArgs: 0
    },
    handler({ parser: parser2, funcName }) {
      const prevAtomType = parser2.prevAtomType;
      const next = parser2.gullet.future().text;
      return {
        type: "op",
        mode: parser2.mode,
        limits: false,
        parentIsSupSub: false,
        symbol: false,
        stack: false,
        isFollowedByDelimiter: isDelimiter(next),
        needsLeadingSpace: prevAtomType.length > 0 && ordTypes.includes(prevAtomType),
        name: funcName
      };
    },
    mathmlBuilder: mathmlBuilder$2
  });
  defineFunction({
    type: "op",
    names: ["\\det", "\\gcd", "\\inf", "\\lim", "\\max", "\\min", "\\Pr", "\\sup"],
    props: {
      numArgs: 0
    },
    handler({ parser: parser2, funcName }) {
      const prevAtomType = parser2.prevAtomType;
      const next = parser2.gullet.future().text;
      return {
        type: "op",
        mode: parser2.mode,
        limits: true,
        parentIsSupSub: false,
        symbol: false,
        stack: false,
        isFollowedByDelimiter: isDelimiter(next),
        needsLeadingSpace: prevAtomType.length > 0 && ordTypes.includes(prevAtomType),
        name: funcName
      };
    },
    mathmlBuilder: mathmlBuilder$2
  });
  defineFunction({
    type: "op",
    names: [
      "\\int",
      "\\iint",
      "\\iiint",
      "\\iiiint",
      "\\oint",
      "\\oiint",
      "\\oiiint",
      "\\intclockwise",
      "\\varointclockwise",
      "\\intbar",
      "\\intBar",
      "\\fint",
      "\\rppolint",
      "\\scpolint",
      "\\pointint",
      "\\sqint",
      "\\intlarhk",
      "\\intx",
      "\\intcap",
      "\\intcup",
      "\u222B",
      "\u222C",
      "\u222D",
      "\u222E",
      "\u222F",
      "\u2230",
      "\u2231",
      "\u2232",
      "\u2A0C",
      "\u2A0D",
      "\u2A0E",
      "\u2A0F",
      "\u2A12",
      "\u2A13",
      "\u2A15",
      "\u2A16",
      "\u2A17",
      "\u2A18",
      "\u2A19",
      "\u2A1A"
    ],
    props: {
      numArgs: 0,
      allowedInArgument: true
    },
    handler({ parser: parser2, funcName }) {
      let fName = funcName;
      if (fName.length === 1) {
        fName = singleCharIntegrals[fName];
      }
      return {
        type: "op",
        mode: parser2.mode,
        limits: false,
        parentIsSupSub: false,
        symbol: true,
        stack: false,
        name: fName
      };
    },
    mathmlBuilder: mathmlBuilder$2
  });
  var mathmlBuilder$1 = (group, style) => {
    let expression = buildExpression(group.body, style.withFont("mathrm"));
    let isAllString = true;
    for (let i = 0; i < expression.length; i++) {
      let node = expression[i];
      if (node instanceof MathNode) {
        if ((node.type === "mrow" || node.type === "mpadded") && node.children.length === 1 && node.children[0] instanceof MathNode) {
          node = node.children[0];
        } else if (node.type === "mrow" && node.children.length === 2 && node.children[0] instanceof MathNode && node.children[1] instanceof MathNode && node.children[1].type === "mspace" && !node.children[1].attributes.width && node.children[1].children.length === 0) {
          node = node.children[0];
        }
        switch (node.type) {
          case "mi":
          case "mn":
          case "ms":
          case "mtext":
            break;
          // Do nothing yet.
          case "mspace":
            {
              if (node.attributes.width) {
                const width = node.attributes.width.replace("em", "");
                const ch = spaceCharacter(Number(width));
                if (ch === "") {
                  isAllString = false;
                } else {
                  expression[i] = new MathNode("mtext", [new TextNode2(ch)]);
                }
              }
            }
            break;
          case "mo": {
            const child = node.children[0];
            if (node.children.length === 1 && child instanceof TextNode2) {
              child.text = child.text.replace(/\u2212/, "-").replace(/\u2217/, "*");
            } else {
              isAllString = false;
            }
            break;
          }
          default:
            isAllString = false;
        }
      } else {
        isAllString = false;
      }
    }
    if (isAllString) {
      const word = expression.map((node) => node.toText()).join("");
      expression = [new TextNode2(word)];
    } else if (expression.length === 1 && ["mover", "munder"].includes(expression[0].type) && (expression[0].children[0].type === "mi" || expression[0].children[0].type === "mtext")) {
      expression[0].children[0].type = "mi";
      if (group.parentIsSupSub) {
        return new MathNode("mrow", expression);
      } else {
        const operator = new MathNode("mo", [makeText("\u2061", "text")]);
        return newDocumentFragment([expression[0], operator]);
      }
    }
    let wrapper;
    if (isAllString) {
      wrapper = new MathNode("mi", expression);
      if (expression[0].text.length === 1) {
        wrapper.setAttribute("mathvariant", "normal");
      }
    } else {
      wrapper = new MathNode("mrow", expression);
    }
    if (!group.parentIsSupSub) {
      const operator = new MathNode("mo", [makeText("\u2061", "text")]);
      const fragment = [wrapper, operator];
      if (group.needsLeadingSpace) {
        const space = new MathNode("mspace");
        space.setAttribute("width", "0.1667em");
        fragment.unshift(space);
      }
      if (!group.isFollowedByDelimiter) {
        const trail = new MathNode("mspace");
        trail.setAttribute("width", "0.1667em");
        fragment.push(trail);
      }
      return newDocumentFragment(fragment);
    }
    return wrapper;
  };
  defineFunction({
    type: "operatorname",
    names: ["\\operatorname@", "\\operatornamewithlimits"],
    props: {
      numArgs: 1,
      allowedInArgument: true
    },
    handler: ({ parser: parser2, funcName }, args) => {
      const body = args[0];
      const prevAtomType = parser2.prevAtomType;
      const next = parser2.gullet.future().text;
      return {
        type: "operatorname",
        mode: parser2.mode,
        body: ordargument(body),
        alwaysHandleSupSub: funcName === "\\operatornamewithlimits",
        limits: false,
        parentIsSupSub: false,
        isFollowedByDelimiter: isDelimiter(next),
        needsLeadingSpace: prevAtomType.length > 0 && ordTypes.includes(prevAtomType)
      };
    },
    mathmlBuilder: mathmlBuilder$1
  });
  defineMacro(
    "\\operatorname",
    "\\@ifstar\\operatornamewithlimits\\operatorname@"
  );
  defineFunctionBuilders({
    type: "ordgroup",
    mathmlBuilder(group, style) {
      return buildExpressionRow(group.body, style, group.semisimple);
    }
  });
  defineFunction({
    type: "phantom",
    names: ["\\phantom"],
    props: {
      numArgs: 1,
      allowedInText: true
    },
    handler: ({ parser: parser2 }, args) => {
      const body = args[0];
      return {
        type: "phantom",
        mode: parser2.mode,
        body: ordargument(body)
      };
    },
    mathmlBuilder: (group, style) => {
      const inner2 = buildExpression(group.body, style);
      return new MathNode("mphantom", inner2);
    }
  });
  defineFunction({
    type: "hphantom",
    names: ["\\hphantom"],
    props: {
      numArgs: 1,
      allowedInText: true
    },
    handler: ({ parser: parser2 }, args) => {
      const body = args[0];
      return {
        type: "hphantom",
        mode: parser2.mode,
        body
      };
    },
    mathmlBuilder: (group, style) => {
      const inner2 = buildExpression(ordargument(group.body), style);
      const phantom2 = new MathNode("mphantom", inner2);
      const node = new MathNode("mpadded", [phantom2]);
      node.setAttribute("height", "0px");
      node.setAttribute("depth", "0px");
      return node;
    }
  });
  defineFunction({
    type: "vphantom",
    names: ["\\vphantom"],
    props: {
      numArgs: 1,
      allowedInText: true
    },
    handler: ({ parser: parser2 }, args) => {
      const body = args[0];
      return {
        type: "vphantom",
        mode: parser2.mode,
        body
      };
    },
    mathmlBuilder: (group, style) => {
      const inner2 = buildExpression(ordargument(group.body), style);
      const phantom2 = new MathNode("mphantom", inner2);
      const node = new MathNode("mpadded", [phantom2]);
      node.setAttribute("width", "0.1px");
      return node;
    }
  });
  defineFunction({
    type: "pmb",
    names: ["\\pmb"],
    props: {
      numArgs: 1,
      allowedInText: true
    },
    handler({ parser: parser2 }, args) {
      return {
        type: "pmb",
        mode: parser2.mode,
        body: ordargument(args[0])
      };
    },
    mathmlBuilder(group, style) {
      const inner2 = buildExpression(group.body, style);
      const node = wrapWithMstyle(inner2);
      node.setAttribute("style", "font-weight:bold");
      return node;
    }
  });
  var mathmlBuilder = (group, style) => {
    const newStyle = style.withLevel(StyleLevel.TEXT);
    const node = new MathNode("mpadded", [buildGroup$1(group.body, newStyle)]);
    const dy = calculateSize(group.dy, style);
    node.setAttribute("voffset", dy.number + dy.unit);
    if (dy.number > 0) {
      node.style.padding = dy.number + dy.unit + " 0 0 0";
    } else {
      node.style.padding = "0 0 " + Math.abs(dy.number) + dy.unit + " 0";
    }
    return node;
  };
  defineFunction({
    type: "raise",
    names: ["\\raise", "\\lower"],
    props: {
      numArgs: 2,
      argTypes: ["size", "primitive"],
      primitive: true
    },
    handler({ parser: parser2, funcName }, args) {
      const amount = assertNodeType(args[0], "size").value;
      if (funcName === "\\lower") {
        amount.number *= -1;
      }
      const body = args[1];
      return {
        type: "raise",
        mode: parser2.mode,
        dy: amount,
        body
      };
    },
    mathmlBuilder
  });
  defineFunction({
    type: "raise",
    names: ["\\raisebox"],
    props: {
      numArgs: 2,
      argTypes: ["size", "hbox"],
      allowedInText: true
    },
    handler({ parser: parser2, funcName }, args) {
      const amount = assertNodeType(args[0], "size").value;
      const body = args[1];
      return {
        type: "raise",
        mode: parser2.mode,
        dy: amount,
        body
      };
    },
    mathmlBuilder
  });
  defineFunction({
    type: "ref",
    names: ["\\ref", "\\eqref"],
    props: {
      numArgs: 1,
      argTypes: ["raw"]
    },
    handler({ parser: parser2, funcName }, args) {
      return {
        type: "ref",
        mode: parser2.mode,
        funcName,
        string: args[0].string.replace(invalidIdRegEx, "")
      };
    },
    mathmlBuilder(group, style) {
      const classes = group.funcName === "\\ref" ? ["tml-ref"] : ["tml-ref", "tml-eqref"];
      return new AnchorNode("#" + group.string, classes, null);
    }
  });
  defineFunction({
    type: "reflect",
    names: ["\\reflectbox"],
    props: {
      numArgs: 1,
      argTypes: ["hbox"],
      allowedInText: true
    },
    handler({ parser: parser2 }, args) {
      return {
        type: "reflect",
        mode: parser2.mode,
        body: args[0]
      };
    },
    mathmlBuilder(group, style) {
      const node = buildGroup$1(group.body, style);
      node.style.transform = "scaleX(-1)";
      return node;
    }
  });
  defineFunction({
    type: "internal",
    names: ["\\relax"],
    props: {
      numArgs: 0,
      allowedInText: true,
      allowedInArgument: true
    },
    handler({ parser: parser2 }) {
      return {
        type: "internal",
        mode: parser2.mode
      };
    }
  });
  defineFunction({
    type: "rule",
    names: ["\\rule"],
    props: {
      numArgs: 2,
      numOptionalArgs: 1,
      allowedInText: true,
      allowedInMath: true,
      argTypes: ["size", "size", "size"]
    },
    handler({ parser: parser2 }, args, optArgs) {
      const shift = optArgs[0];
      const width = assertNodeType(args[0], "size");
      const height = assertNodeType(args[1], "size");
      return {
        type: "rule",
        mode: parser2.mode,
        shift: shift && assertNodeType(shift, "size").value,
        width: width.value,
        height: height.value
      };
    },
    mathmlBuilder(group, style) {
      const width = calculateSize(group.width, style);
      const height = calculateSize(group.height, style);
      const shift = group.shift ? calculateSize(group.shift, style) : { number: 0, unit: "em" };
      const color = style.color && style.getColor() || "black";
      const rule = new MathNode("mspace");
      if (width.number > 0 && height.number > 0) {
        rule.setAttribute("mathbackground", color);
      }
      rule.setAttribute("width", width.number + width.unit);
      rule.setAttribute("height", height.number + height.unit);
      if (shift.number === 0) {
        return rule;
      }
      const wrapper = new MathNode("mpadded", [rule]);
      if (shift.number >= 0) {
        wrapper.setAttribute("height", "+" + shift.number + shift.unit);
      } else {
        wrapper.setAttribute("height", shift.number + shift.unit);
        wrapper.setAttribute("depth", "+" + -shift.number + shift.unit);
      }
      wrapper.setAttribute("voffset", shift.number + shift.unit);
      return wrapper;
    }
  });
  var numRegEx = /^[0-9]$/;
  var unicodeNumSubs = {
    "0": "\u2080",
    "1": "\u2081",
    "2": "\u2082",
    "3": "\u2083",
    "4": "\u2084",
    "5": "\u2085",
    "6": "\u2086",
    "7": "\u2087",
    "8": "\u2088",
    "9": "\u2089"
  };
  var unicodeNumSups = {
    "0": "\u2070",
    "1": "\xB9",
    "2": "\xB2",
    "3": "\xB3",
    "4": "\u2074",
    "5": "\u2075",
    "6": "\u2076",
    "7": "\u2077",
    "8": "\u2078",
    "9": "\u2079"
  };
  defineFunction({
    type: "sfrac",
    names: ["\\sfrac"],
    props: {
      numArgs: 2,
      allowedInText: true,
      allowedInMath: true
    },
    handler({ parser: parser2 }, args) {
      let numerator = "";
      for (const node of args[0].body) {
        if (node.type !== "textord" || !numRegEx.test(node.text)) {
          throw new ParseError("Numerator must be an integer.", node);
        }
        numerator += node.text;
      }
      let denominator = "";
      for (const node of args[1].body) {
        if (node.type !== "textord" || !numRegEx.test(node.text)) {
          throw new ParseError("Denominator must be an integer.", node);
        }
        denominator += node.text;
      }
      return {
        type: "sfrac",
        mode: parser2.mode,
        numerator,
        denominator
      };
    },
    mathmlBuilder(group, style) {
      const numerator = group.numerator.split("").map((c2) => unicodeNumSups[c2]).join("");
      const denominator = group.denominator.split("").map((c2) => unicodeNumSubs[c2]).join("");
      const text2 = new TextNode2(numerator + "\u2044" + denominator, group.mode, style);
      return new MathNode("mn", [text2], ["special-fraction"]);
    }
  });
  var sizeMap = {
    "\\tiny": 0.5,
    "\\sixptsize": 0.6,
    "\\Tiny": 0.6,
    "\\scriptsize": 0.7,
    "\\footnotesize": 0.8,
    "\\small": 0.9,
    "\\normalsize": 1,
    "\\large": 1.2,
    "\\Large": 1.44,
    "\\LARGE": 1.728,
    "\\huge": 2.074,
    "\\Huge": 2.488
  };
  defineFunction({
    type: "sizing",
    names: [
      "\\tiny",
      "\\sixptsize",
      "\\Tiny",
      "\\scriptsize",
      "\\footnotesize",
      "\\small",
      "\\normalsize",
      "\\large",
      "\\Large",
      "\\LARGE",
      "\\huge",
      "\\Huge"
    ],
    props: {
      numArgs: 0,
      allowedInText: true
    },
    handler: ({ breakOnTokenText, funcName, parser: parser2 }, args) => {
      if (parser2.settings.strict && parser2.mode === "math") {
        console.log(`Temml strict-mode warning: Command ${funcName} is invalid in math mode.`);
      }
      const body = parser2.parseExpression(false, breakOnTokenText, true);
      return {
        type: "sizing",
        mode: parser2.mode,
        funcName,
        body
      };
    },
    mathmlBuilder: (group, style) => {
      const newStyle = style.withFontSize(sizeMap[group.funcName]);
      const inner2 = buildExpression(group.body, newStyle);
      const node = wrapWithMstyle(inner2);
      const factor = (sizeMap[group.funcName] / style.fontSize).toFixed(4);
      node.setAttribute("mathsize", factor + "em");
      return node;
    }
  });
  defineFunction({
    type: "smash",
    names: ["\\smash"],
    props: {
      numArgs: 1,
      numOptionalArgs: 1,
      allowedInText: true
    },
    handler: ({ parser: parser2 }, args, optArgs) => {
      let smashHeight = false;
      let smashDepth = false;
      const tbArg = optArgs[0] && assertNodeType(optArgs[0], "ordgroup");
      if (tbArg) {
        let letter = "";
        for (let i = 0; i < tbArg.body.length; ++i) {
          const node = tbArg.body[i];
          letter = node.text;
          if (letter === "t") {
            smashHeight = true;
          } else if (letter === "b") {
            smashDepth = true;
          } else {
            smashHeight = false;
            smashDepth = false;
            break;
          }
        }
      } else {
        smashHeight = true;
        smashDepth = true;
      }
      const body = args[0];
      return {
        type: "smash",
        mode: parser2.mode,
        body,
        smashHeight,
        smashDepth
      };
    },
    mathmlBuilder: (group, style) => {
      const node = new MathNode("mpadded", [buildGroup$1(group.body, style)]);
      if (group.smashHeight) {
        node.setAttribute("height", "0px");
      }
      if (group.smashDepth) {
        node.setAttribute("depth", "0px");
      }
      return node;
    }
  });
  var xHeights = [
    "a",
    "c",
    "e",
    "\u0131",
    "m",
    "n",
    "o",
    "r",
    "s",
    "u",
    "v",
    "w",
    "x",
    "z",
    "\u03B1",
    "\u03B5",
    "\u03B9",
    "\u03BA",
    "\u03BD",
    "\u03BF",
    "\u03C0",
    "\u03C3",
    "\u03C4",
    "\u03C5",
    "\u03C9",
    "\\alpha",
    "\\epsilon",
    "\\iota",
    "\\kappa",
    "\\nu",
    "\\omega",
    "\\pi",
    "\\tau",
    "\\omega"
  ];
  defineFunction({
    type: "sqrt",
    names: ["\\sqrt"],
    props: {
      numArgs: 1,
      numOptionalArgs: 1
    },
    handler({ parser: parser2 }, args, optArgs) {
      const index = optArgs[0];
      const body = args[0];
      if (body.body && body.body.length === 1 && body.body[0].text && xHeights.includes(body.body[0].text)) {
        body.body.push({
          "type": "rule",
          "mode": "math",
          "shift": null,
          "width": { "number": 0, "unit": "pt" },
          "height": { "number": 0.5, "unit": "em" }
        });
      }
      return {
        type: "sqrt",
        mode: parser2.mode,
        body,
        index
      };
    },
    mathmlBuilder(group, style) {
      const { body, index } = group;
      return index ? new MathNode("mroot", [
        buildGroup$1(body, style),
        buildGroup$1(index, style.incrementLevel())
      ]) : new MathNode("msqrt", [buildGroup$1(body, style)]);
    }
  });
  var styleMap = {
    display: 0,
    text: 1,
    script: 2,
    scriptscript: 3
  };
  var styleAttributes = {
    display: ["0", "true"],
    text: ["0", "false"],
    script: ["1", "false"],
    scriptscript: ["2", "false"]
  };
  defineFunction({
    type: "styling",
    names: ["\\displaystyle", "\\textstyle", "\\scriptstyle", "\\scriptscriptstyle"],
    props: {
      numArgs: 0,
      allowedInText: true,
      primitive: true
    },
    handler({ breakOnTokenText, funcName, parser: parser2 }, args) {
      const body = parser2.parseExpression(true, breakOnTokenText, true);
      const scriptLevel2 = funcName.slice(1, funcName.length - 5);
      return {
        type: "styling",
        mode: parser2.mode,
        // Figure out what scriptLevel to use by pulling out the scriptLevel from
        // the function name
        scriptLevel: scriptLevel2,
        body
      };
    },
    mathmlBuilder(group, style) {
      const newStyle = style.withLevel(styleMap[group.scriptLevel]);
      const inner2 = buildExpression(group.body, newStyle);
      const node = wrapWithMstyle(inner2);
      const attr = styleAttributes[group.scriptLevel];
      node.setAttribute("scriptlevel", attr[0]);
      node.setAttribute("displaystyle", attr[1]);
      return node;
    }
  });
  var symbolRegEx = /^m(over|under|underover)$/;
  var smallPad = "DHKLUcegorsuvxyz\u03A0\u03A5\u03A8\u03B1\u03B4\u03B7\u03B9\u03BC\u03BD\u03BF\u03C4\u03C5\u03C7\u03F5";
  var mediumPad = "BCEFGIMNOPQRSTXZlpqtw\u0393\u0398\u039E\u03A3\u03A6\u03A9\u03B2\u03B5\u03B6\u03B8\u03BE\u03C1\u03C2\u03C6\u03C8\u03D1\u03D5\u03F1";
  var largePad = "AJdf\u0394\u039B";
  defineFunctionBuilders({
    type: "supsub",
    mathmlBuilder(group, style) {
      let isBracket = false;
      let isOver;
      let isSup;
      let appendApplyFunction = false;
      let appendSpace = false;
      let needsLeadingSpace = false;
      if (group.base && group.base.type === "horizBracket") {
        isSup = !!group.sup;
        if (isSup === group.base.isOver) {
          isBracket = true;
          isOver = group.base.isOver;
        }
      }
      if (group.base && !group.stack && (group.base.type === "op" || group.base.type === "operatorname")) {
        group.base.parentIsSupSub = true;
        appendApplyFunction = !group.base.symbol;
        appendSpace = appendApplyFunction && !group.isFollowedByDelimiter;
        needsLeadingSpace = group.base.needsLeadingSpace;
      }
      const children = group.stack && group.base.body.length === 1 ? [buildGroup$1(group.base.body[0], style)] : [buildGroup$1(group.base, style)];
      const childStyle = style.inSubOrSup();
      if (group.sub) {
        const sub = buildGroup$1(group.sub, childStyle);
        if (style.level === 3) {
          sub.setAttribute("scriptlevel", "2");
        }
        children.push(sub);
      }
      if (group.sup) {
        const sup = buildGroup$1(group.sup, childStyle);
        if (style.level === 3) {
          sup.setAttribute("scriptlevel", "2");
        }
        if (group.base && group.base.text && group.base.text.length === 1) {
          const text2 = group.base.text;
          if (smallPad.indexOf(text2) > -1) {
            sup.classes.push("tml-sml-pad");
          } else if (mediumPad.indexOf(text2) > -1) {
            sup.classes.push("tml-med-pad");
          } else if (largePad.indexOf(text2) > -1) {
            sup.classes.push("tml-lrg-pad");
          }
        }
        children.push(sup);
      }
      let nodeType;
      if (isBracket) {
        nodeType = isOver ? "mover" : "munder";
      } else if (!group.sub) {
        const base = group.base;
        if (base && base.type === "op" && base.limits && (style.level === StyleLevel.DISPLAY || base.alwaysHandleSupSub)) {
          nodeType = "mover";
        } else if (base && base.type === "operatorname" && base.alwaysHandleSupSub && (base.limits || style.level === StyleLevel.DISPLAY)) {
          nodeType = "mover";
        } else {
          nodeType = "msup";
        }
      } else if (!group.sup) {
        const base = group.base;
        if (group.stack) {
          nodeType = "munder";
        } else if (base && base.type === "op" && base.limits && (style.level === StyleLevel.DISPLAY || base.alwaysHandleSupSub)) {
          nodeType = "munder";
        } else if (base && base.type === "operatorname" && base.alwaysHandleSupSub && (base.limits || style.level === StyleLevel.DISPLAY)) {
          nodeType = "munder";
        } else {
          nodeType = "msub";
        }
      } else {
        const base = group.base;
        if (base && (base.type === "op" && base.limits || base.type === "multiscript") && (style.level === StyleLevel.DISPLAY || base.alwaysHandleSupSub)) {
          nodeType = "munderover";
        } else if (base && base.type === "operatorname" && base.alwaysHandleSupSub && (style.level === StyleLevel.DISPLAY || base.limits)) {
          nodeType = "munderover";
        } else {
          nodeType = "msubsup";
        }
      }
      let node = new MathNode(nodeType, children);
      if (appendApplyFunction) {
        const operator = new MathNode("mo", [makeText("\u2061", "text")]);
        if (needsLeadingSpace) {
          const space = new MathNode("mspace");
          space.setAttribute("width", "0.1667em");
          node = newDocumentFragment([space, node, operator]);
        } else {
          node = newDocumentFragment([node, operator]);
        }
        if (appendSpace) {
          const space = new MathNode("mspace");
          space.setAttribute("width", "0.1667em");
          node.children.push(space);
        }
      } else if (symbolRegEx.test(nodeType)) {
        node = new MathNode("mrow", [node]);
      }
      return node;
    }
  });
  var short = [
    "\\shortmid",
    "\\nshortmid",
    "\\shortparallel",
    "\\nshortparallel",
    "\\smallsetminus"
  ];
  var arrows = ["\\Rsh", "\\Lsh", "\\restriction"];
  var isArrow = (str) => {
    if (str.length === 1) {
      const codePoint = str.codePointAt(0);
      return 8591 < codePoint && codePoint < 8704;
    }
    return str.indexOf("arrow") > -1 || str.indexOf("harpoon") > -1 || arrows.includes(str);
  };
  defineFunctionBuilders({
    type: "atom",
    mathmlBuilder(group, style) {
      const node = new MathNode("mo", [makeText(group.text, group.mode)]);
      if (group.family === "punct") {
        node.setAttribute("separator", "true");
      } else if (group.family === "open" || group.family === "close") {
        if (group.family === "open") {
          node.setAttribute("form", "prefix");
          node.setAttribute("stretchy", "false");
        } else if (group.family === "close") {
          node.setAttribute("form", "postfix");
          node.setAttribute("stretchy", "false");
        }
      } else if (group.text === "\\mid") {
        node.setAttribute("lspace", "0.22em");
        node.setAttribute("rspace", "0.22em");
        node.setAttribute("stretchy", "false");
      } else if (group.family === "rel" && isArrow(group.text)) {
        node.setAttribute("stretchy", "false");
      } else if (short.includes(group.text)) {
        node.setAttribute("mathsize", "70%");
      } else if (group.text === ":") {
        node.attributes.lspace = "0.2222em";
        node.attributes.rspace = "0.2222em";
      } else if (group.needsSpacing) {
        if (group.family === "bin") {
          return new MathNode("mrow", [padding(0.222), node, padding(0.222)]);
        } else {
          return new MathNode("mrow", [padding(0.2778), node, padding(0.2778)]);
        }
      }
      return node;
    }
  });
  var fontMap = {
    // styles
    mathbf: "bold",
    mathrm: "normal",
    textit: "italic",
    mathit: "italic",
    mathnormal: "italic",
    // families
    mathbb: "double-struck",
    mathcal: "script",
    mathfrak: "fraktur",
    mathscr: "script",
    mathsf: "sans-serif",
    mathtt: "monospace"
  };
  var getVariant = function(group, style) {
    if (style.fontFamily === "texttt") {
      return "monospace";
    } else if (style.fontFamily === "textsc") {
      return "normal";
    } else if (style.fontFamily === "textsf") {
      if (style.fontShape === "textit" && style.fontWeight === "textbf") {
        return "sans-serif-bold-italic";
      } else if (style.fontShape === "textit") {
        return "sans-serif-italic";
      } else if (style.fontWeight === "textbf") {
        return "sans-serif-bold";
      } else {
        return "sans-serif";
      }
    } else if (style.fontShape === "textit" && style.fontWeight === "textbf") {
      return "bold-italic";
    } else if (style.fontShape === "textit") {
      return "italic";
    } else if (style.fontWeight === "textbf") {
      return "bold";
    }
    const font = style.font;
    if (!font || font === "mathnormal") {
      return null;
    }
    const mode = group.mode;
    switch (font) {
      case "mathit":
        return "italic";
      case "mathrm": {
        const codePoint = group.text.codePointAt(0);
        return 939 < codePoint && codePoint < 975 ? "italic" : "normal";
      }
      case "greekItalic":
        return "italic";
      case "up@greek":
        return "normal";
      case "boldsymbol":
      case "mathboldsymbol":
        return "bold-italic";
      case "mathbf":
        return "bold";
      case "mathbb":
        return "double-struck";
      case "mathfrak":
        return "fraktur";
      case "mathscr":
      case "mathcal":
        return "script";
      case "mathsf":
        return "sans-serif";
      case "mathsfit":
        return "sans-serif-italic";
      case "mathtt":
        return "monospace";
    }
    let text2 = group.text;
    if (symbols[mode][text2] && symbols[mode][text2].replace) {
      text2 = symbols[mode][text2].replace;
    }
    return Object.prototype.hasOwnProperty.call(fontMap, font) ? fontMap[font] : null;
  };
  var numberRegEx = /^\d(?:[\d,.]*\d)?$/;
  var latinRegEx = /[A-Ba-z]/;
  var primes = /* @__PURE__ */ new Set([
    "\\prime",
    "\\dprime",
    "\\trprime",
    "\\qprime",
    "\\backprime",
    "\\backdprime",
    "\\backtrprime"
  ]);
  var italicNumber = (text2, variant, tag2) => {
    const mn = new MathNode(tag2, [text2]);
    const wrapper = new MathNode("mstyle", [mn]);
    wrapper.style["font-style"] = "italic";
    wrapper.style["font-family"] = "Cambria, 'Times New Roman', serif";
    if (variant === "bold-italic") {
      wrapper.style["font-weight"] = "bold";
    }
    return wrapper;
  };
  defineFunctionBuilders({
    type: "mathord",
    mathmlBuilder(group, style) {
      const text2 = makeText(group.text, group.mode, style);
      const codePoint = text2.text.codePointAt(0);
      const defaultVariant = 912 < codePoint && codePoint < 938 ? "normal" : "italic";
      const variant = getVariant(group, style) || defaultVariant;
      if (variant === "script") {
        text2.text = variantChar(text2.text, variant);
        return new MathNode("mi", [text2], [style.font]);
      } else if (variant !== "italic") {
        text2.text = variantChar(text2.text, variant);
      }
      let node = new MathNode("mi", [text2]);
      if (variant === "normal") {
        node.setAttribute("mathvariant", "normal");
        if (text2.text.length === 1) {
          const mspace = new MathNode("mspace", []);
          node = new MathNode("mrow", [node, mspace]);
        }
      }
      return node;
    }
  });
  defineFunctionBuilders({
    type: "textord",
    mathmlBuilder(group, style) {
      let ch = group.text;
      const codePoint = ch.codePointAt(0);
      if (style.fontFamily === "textsc") {
        if (96 < codePoint && codePoint < 123) {
          ch = smallCaps[ch];
        }
      }
      const text2 = makeText(ch, group.mode, style);
      const variant = getVariant(group, style) || "normal";
      let node;
      if (numberRegEx.test(group.text)) {
        const tag2 = group.mode === "text" ? "mtext" : "mn";
        if (variant === "italic" || variant === "bold-italic") {
          return italicNumber(text2, variant, tag2);
        } else {
          if (variant !== "normal") {
            text2.text = text2.text.split("").map((c2) => variantChar(c2, variant)).join("");
          }
          node = new MathNode(tag2, [text2]);
        }
      } else if (group.mode === "text") {
        if (variant !== "normal") {
          text2.text = variantChar(text2.text, variant);
        }
        node = new MathNode("mtext", [text2]);
      } else if (primes.has(group.text)) {
        node = new MathNode("mo", [text2]);
        node.classes.push("tml-prime");
      } else {
        const origText = text2.text;
        if (variant !== "italic") {
          text2.text = variantChar(text2.text, variant);
        }
        node = new MathNode("mi", [text2]);
        if (text2.text === origText && latinRegEx.test(origText)) {
          node.setAttribute("mathvariant", "italic");
        }
      }
      return node;
    }
  });
  var cssSpace = {
    "\\nobreak": "nobreak",
    "\\allowbreak": "allowbreak"
  };
  var regularSpace = {
    " ": {},
    "\\ ": {},
    "~": {
      className: "nobreak"
    },
    "\\space": {},
    "\\nobreakspace": {
      className: "nobreak"
    }
  };
  defineFunctionBuilders({
    type: "spacing",
    mathmlBuilder(group, style) {
      let node;
      if (Object.prototype.hasOwnProperty.call(regularSpace, group.text)) {
        node = new MathNode("mtext", [new TextNode2("\xA0")]);
      } else if (Object.prototype.hasOwnProperty.call(cssSpace, group.text)) {
        node = new MathNode("mo");
        if (group.text === "\\nobreak") {
          node.setAttribute("linebreak", "nobreak");
        }
      } else {
        throw new ParseError(`Unknown type of space "${group.text}"`);
      }
      return node;
    }
  });
  defineFunctionBuilders({
    type: "tag"
  });
  var textFontFamilies = {
    "\\text": void 0,
    "\\textrm": "textrm",
    "\\textsf": "textsf",
    "\\texttt": "texttt",
    "\\textnormal": "textrm",
    "\\textsc": "textsc"
    // small caps
  };
  var textFontWeights = {
    "\\textbf": "textbf",
    "\\textmd": "textmd"
  };
  var textFontShapes = {
    "\\textit": "textit",
    "\\textup": "textup"
  };
  var styleWithFont = (group, style) => {
    const font = group.font;
    if (!font) {
      return style;
    } else if (textFontFamilies[font]) {
      return style.withTextFontFamily(textFontFamilies[font]);
    } else if (textFontWeights[font]) {
      return style.withTextFontWeight(textFontWeights[font]);
    } else if (font === "\\emph") {
      return style.fontShape === "textit" ? style.withTextFontShape("textup") : style.withTextFontShape("textit");
    }
    return style.withTextFontShape(textFontShapes[font]);
  };
  defineFunction({
    type: "text",
    names: [
      // Font families
      "\\text",
      "\\textrm",
      "\\textsf",
      "\\texttt",
      "\\textnormal",
      "\\textsc",
      // Font weights
      "\\textbf",
      "\\textmd",
      // Font Shapes
      "\\textit",
      "\\textup",
      "\\emph"
    ],
    props: {
      numArgs: 1,
      argTypes: ["text"],
      allowedInArgument: true,
      allowedInText: true
    },
    handler({ parser: parser2, funcName }, args) {
      const body = args[0];
      return {
        type: "text",
        mode: parser2.mode,
        body: ordargument(body),
        font: funcName
      };
    },
    mathmlBuilder(group, style) {
      const newStyle = styleWithFont(group, style);
      const mrow = buildExpressionRow(group.body, newStyle);
      return consolidateText(mrow);
    }
  });
  defineFunction({
    type: "vcenter",
    names: ["\\vcenter"],
    props: {
      numArgs: 1,
      argTypes: ["original"],
      allowedInText: false
    },
    handler({ parser: parser2 }, args) {
      return {
        type: "vcenter",
        mode: parser2.mode,
        body: args[0]
      };
    },
    mathmlBuilder(group, style) {
      const mtd = new MathNode("mtd", [buildGroup$1(group.body, style)]);
      mtd.style.padding = "0";
      const mtr = new MathNode("mtr", [mtd]);
      return new MathNode("mtable", [mtr]);
    }
  });
  defineFunction({
    type: "verb",
    names: ["\\verb"],
    props: {
      numArgs: 0,
      allowedInText: true
    },
    handler(context, args, optArgs) {
      throw new ParseError("\\verb ended by end of line instead of matching delimiter");
    },
    mathmlBuilder(group, style) {
      const text2 = new TextNode2(makeVerb(group));
      const node = new MathNode("mtext", [text2]);
      node.setAttribute("mathvariant", "monospace");
      return node;
    }
  });
  var makeVerb = (group) => group.body.replace(/ /g, group.star ? "\u2423" : "\xA0");
  var functions = _functions;
  var spaceRegexString = "[ \r\n	]";
  var controlWordRegexString = "\\\\[a-zA-Z@]+";
  var controlSymbolRegexString = "\\\\[^\uD800-\uDFFF]";
  var controlWordWhitespaceRegexString = `(${controlWordRegexString})${spaceRegexString}*`;
  var controlSpaceRegexString = "\\\\(\n|[ \r	]+\n?)[ \r	]*";
  var combiningDiacriticalMarkString = "[\u0300-\u036F]";
  var combiningDiacriticalMarksEndRegex = new RegExp(`${combiningDiacriticalMarkString}+$`);
  var tokenRegexString = `(${spaceRegexString}+)|${controlSpaceRegexString}|([!-\\[\\]-\u2027\u202A-\uD7FF\uF900-\uFFFF]${combiningDiacriticalMarkString}*|[\uD800-\uDBFF][\uDC00-\uDFFF]${combiningDiacriticalMarkString}*|\\\\verb\\*([^]).*?\\4|\\\\verb([^*a-zA-Z]).*?\\5|${controlWordWhitespaceRegexString}|${controlSymbolRegexString})`;
  var Lexer = class {
    constructor(input, settings) {
      this.input = input;
      this.settings = settings;
      this.tokenRegex = new RegExp(tokenRegexString, "g");
      this.catcodes = {
        "%": 14,
        // comment character
        "~": 13
        // active character
      };
    }
    setCatcode(char, code) {
      this.catcodes[char] = code;
    }
    /**
     * This function lexes a single token.
     */
    lex() {
      const input = this.input;
      const pos = this.tokenRegex.lastIndex;
      if (pos === input.length) {
        return new Token("EOF", new SourceLocation(this, pos, pos));
      }
      const match = this.tokenRegex.exec(input);
      if (match === null || match.index !== pos) {
        throw new ParseError(
          `Unexpected character: '${input[pos]}'`,
          new Token(input[pos], new SourceLocation(this, pos, pos + 1))
        );
      }
      const text2 = match[6] || match[3] || (match[2] ? "\\ " : " ");
      if (this.catcodes[text2] === 14) {
        const nlIndex = input.indexOf("\n", this.tokenRegex.lastIndex);
        if (nlIndex === -1) {
          this.tokenRegex.lastIndex = input.length;
          if (this.settings.strict) {
            throw new ParseError("% comment has no terminating newline; LaTeX would fail because of commenting the end of math mode");
          }
        } else {
          this.tokenRegex.lastIndex = nlIndex + 1;
        }
        return this.lex();
      }
      return new Token(text2, new SourceLocation(this, pos, this.tokenRegex.lastIndex));
    }
  };
  var Namespace = class {
    /**
     * Both arguments are optional.  The first argument is an object of
     * built-in mappings which never change.  The second argument is an object
     * of initial (global-level) mappings, which will constantly change
     * according to any global/top-level `set`s done.
     */
    constructor(builtins = {}, globalMacros = {}) {
      this.current = globalMacros;
      this.builtins = builtins;
      this.undefStack = [];
    }
    /**
     * Start a new nested group, affecting future local `set`s.
     */
    beginGroup() {
      this.undefStack.push({});
    }
    /**
     * End current nested group, restoring values before the group began.
     */
    endGroup() {
      if (this.undefStack.length === 0) {
        throw new ParseError(
          "Unbalanced namespace destruction: attempt to pop global namespace; please report this as a bug"
        );
      }
      const undefs = this.undefStack.pop();
      for (const undef in undefs) {
        if (Object.prototype.hasOwnProperty.call(undefs, undef)) {
          if (undefs[undef] === void 0) {
            delete this.current[undef];
          } else {
            this.current[undef] = undefs[undef];
          }
        }
      }
    }
    /**
     * Detect whether `name` has a definition.  Equivalent to
     * `get(name) != null`.
     */
    has(name) {
      return Object.prototype.hasOwnProperty.call(this.current, name) || Object.prototype.hasOwnProperty.call(this.builtins, name);
    }
    /**
     * Get the current value of a name, or `undefined` if there is no value.
     *
     * Note: Do not use `if (namespace.get(...))` to detect whether a macro
     * is defined, as the definition may be the empty string which evaluates
     * to `false` in JavaScript.  Use `if (namespace.get(...) != null)` or
     * `if (namespace.has(...))`.
     */
    get(name) {
      if (Object.prototype.hasOwnProperty.call(this.current, name)) {
        return this.current[name];
      } else {
        return this.builtins[name];
      }
    }
    /**
     * Set the current value of a name, and optionally set it globally too.
     * Local set() sets the current value and (when appropriate) adds an undo
     * operation to the undo stack.  Global set() may change the undo
     * operation at every level, so takes time linear in their number.
     */
    set(name, value, global = false) {
      if (global) {
        for (let i = 0; i < this.undefStack.length; i++) {
          delete this.undefStack[i][name];
        }
        if (this.undefStack.length > 0) {
          this.undefStack[this.undefStack.length - 1][name] = value;
        }
      } else {
        const top = this.undefStack[this.undefStack.length - 1];
        if (top && !Object.prototype.hasOwnProperty.call(top, name)) {
          top[name] = this.current[name];
        }
      }
      this.current[name] = value;
    }
  };
  var implicitCommands = {
    "^": true,
    // Parser.js
    _: true,
    // Parser.js
    "\\limits": true,
    // Parser.js
    "\\nolimits": true
    // Parser.js
  };
  var MacroExpander = class {
    constructor(input, settings, mode) {
      this.settings = settings;
      this.expansionCount = 0;
      this.feed(input);
      this.macros = new Namespace(macros, settings.macros);
      this.mode = mode;
      this.stack = [];
    }
    /**
     * Feed a new input string to the same MacroExpander
     * (with existing macros etc.).
     */
    feed(input) {
      this.lexer = new Lexer(input, this.settings);
    }
    /**
     * Switches between "text" and "math" modes.
     */
    switchMode(newMode) {
      this.mode = newMode;
    }
    /**
     * Start a new group nesting within all namespaces.
     */
    beginGroup() {
      this.macros.beginGroup();
    }
    /**
     * End current group nesting within all namespaces.
     */
    endGroup() {
      this.macros.endGroup();
    }
    /**
     * Returns the topmost token on the stack, without expanding it.
     * Similar in behavior to TeX's `\futurelet`.
     */
    future() {
      if (this.stack.length === 0) {
        this.pushToken(this.lexer.lex());
      }
      return this.stack[this.stack.length - 1];
    }
    /**
     * Remove and return the next unexpanded token.
     */
    popToken() {
      this.future();
      return this.stack.pop();
    }
    /**
     * Add a given token to the token stack.  In particular, this get be used
     * to put back a token returned from one of the other methods.
     */
    pushToken(token) {
      this.stack.push(token);
    }
    /**
     * Append an array of tokens to the token stack.
     */
    pushTokens(tokens) {
      this.stack.push(...tokens);
    }
    /**
     * Find an macro argument without expanding tokens and append the array of
     * tokens to the token stack. Uses Token as a container for the result.
     */
    scanArgument(isOptional) {
      let start;
      let end;
      let tokens;
      if (isOptional) {
        this.consumeSpaces();
        if (this.future().text !== "[") {
          return null;
        }
        start = this.popToken();
        ({ tokens, end } = this.consumeArg(["]"]));
      } else {
        ({ tokens, start, end } = this.consumeArg());
      }
      this.pushToken(new Token("EOF", end.loc));
      this.pushTokens(tokens);
      return new Token("", SourceLocation.range(start, end));
    }
    /**
     * Consume all following space tokens, without expansion.
     */
    consumeSpaces() {
      for (; ; ) {
        const token = this.future();
        if (token.text === " ") {
          this.stack.pop();
        } else {
          break;
        }
      }
    }
    /**
     * Consume an argument from the token stream, and return the resulting array
     * of tokens and start/end token.
     */
    consumeArg(delims) {
      const tokens = [];
      const isDelimited = delims && delims.length > 0;
      if (!isDelimited) {
        this.consumeSpaces();
      }
      const start = this.future();
      let tok;
      let depth = 0;
      let match = 0;
      do {
        tok = this.popToken();
        tokens.push(tok);
        if (tok.text === "{") {
          ++depth;
        } else if (tok.text === "}") {
          --depth;
          if (depth === -1) {
            throw new ParseError("Extra }", tok);
          }
        } else if (tok.text === "EOF") {
          throw new ParseError(
            "Unexpected end of input in a macro argument, expected '" + (delims && isDelimited ? delims[match] : "}") + "'",
            tok
          );
        }
        if (delims && isDelimited) {
          if ((depth === 0 || depth === 1 && delims[match] === "{") && tok.text === delims[match]) {
            ++match;
            if (match === delims.length) {
              tokens.splice(-match, match);
              break;
            }
          } else {
            match = 0;
          }
        }
      } while (depth !== 0 || isDelimited);
      if (start.text === "{" && tokens[tokens.length - 1].text === "}") {
        tokens.pop();
        tokens.shift();
      }
      tokens.reverse();
      return { tokens, start, end: tok };
    }
    /**
     * Consume the specified number of (delimited) arguments from the token
     * stream and return the resulting array of arguments.
     */
    consumeArgs(numArgs, delimiters2) {
      if (delimiters2) {
        if (delimiters2.length !== numArgs + 1) {
          throw new ParseError("The length of delimiters doesn't match the number of args!");
        }
        const delims = delimiters2[0];
        for (let i = 0; i < delims.length; i++) {
          const tok = this.popToken();
          if (delims[i] !== tok.text) {
            throw new ParseError("Use of the macro doesn't match its definition", tok);
          }
        }
      }
      const args = [];
      for (let i = 0; i < numArgs; i++) {
        args.push(this.consumeArg(delimiters2 && delimiters2[i + 1]).tokens);
      }
      return args;
    }
    /**
     * Expand the next token only once if possible.
     *
     * If the token is expanded, the resulting tokens will be pushed onto
     * the stack in reverse order, and the number of such tokens will be
     * returned.  This number might be zero or positive.
     *
     * If not, the return value is `false`, and the next token remains at the
     * top of the stack.
     *
     * In either case, the next token will be on the top of the stack,
     * or the stack will be empty (in case of empty expansion
     * and no other tokens).
     *
     * Used to implement `expandAfterFuture` and `expandNextToken`.
     *
     * If expandableOnly, only expandable tokens are expanded and
     * an undefined control sequence results in an error.
     */
    expandOnce(expandableOnly) {
      const topToken = this.popToken();
      const name = topToken.text;
      const expansion = !topToken.noexpand ? this._getExpansion(name) : null;
      if (expansion == null || expandableOnly && expansion.unexpandable) {
        if (expandableOnly && expansion == null && name[0] === "\\" && !this.isDefined(name)) {
          throw new ParseError("Undefined control sequence: " + name);
        }
        this.pushToken(topToken);
        return false;
      }
      this.expansionCount++;
      if (this.expansionCount > this.settings.maxExpand) {
        throw new ParseError(
          "Too many expansions: infinite loop or need to increase maxExpand setting"
        );
      }
      let tokens = expansion.tokens;
      const args = this.consumeArgs(expansion.numArgs, expansion.delimiters);
      if (expansion.numArgs) {
        tokens = tokens.slice();
        for (let i = tokens.length - 1; i >= 0; --i) {
          let tok = tokens[i];
          if (tok.text === "#") {
            if (i === 0) {
              throw new ParseError("Incomplete placeholder at end of macro body", tok);
            }
            tok = tokens[--i];
            if (tok.text === "#") {
              tokens.splice(i + 1, 1);
            } else if (/^[1-9]$/.test(tok.text)) {
              tokens.splice(i, 2, ...args[+tok.text - 1]);
            } else {
              throw new ParseError("Not a valid argument number", tok);
            }
          }
        }
      }
      this.pushTokens(tokens);
      return tokens.length;
    }
    /**
     * Expand the next token only once (if possible), and return the resulting
     * top token on the stack (without removing anything from the stack).
     * Similar in behavior to TeX's `\expandafter\futurelet`.
     * Equivalent to expandOnce() followed by future().
     */
    expandAfterFuture() {
      this.expandOnce();
      return this.future();
    }
    /**
     * Recursively expand first token, then return first non-expandable token.
     */
    expandNextToken() {
      for (; ; ) {
        if (this.expandOnce() === false) {
          const token = this.stack.pop();
          if (token.treatAsRelax) {
            token.text = "\\relax";
          }
          return token;
        }
      }
      throw new Error();
    }
    /**
     * Fully expand the given macro name and return the resulting list of
     * tokens, or return `undefined` if no such macro is defined.
     */
    expandMacro(name) {
      return this.macros.has(name) ? this.expandTokens([new Token(name)]) : void 0;
    }
    /**
     * Fully expand the given token stream and return the resulting list of
     * tokens.  Note that the input tokens are in reverse order, but the
     * output tokens are in forward order.
     */
    expandTokens(tokens) {
      const output = [];
      const oldStackLength = this.stack.length;
      this.pushTokens(tokens);
      while (this.stack.length > oldStackLength) {
        if (this.expandOnce(true) === false) {
          const token = this.stack.pop();
          if (token.treatAsRelax) {
            token.noexpand = false;
            token.treatAsRelax = false;
          }
          output.push(token);
        }
      }
      return output;
    }
    /**
     * Fully expand the given macro name and return the result as a string,
     * or return `undefined` if no such macro is defined.
     */
    expandMacroAsText(name) {
      const tokens = this.expandMacro(name);
      if (tokens) {
        return tokens.map((token) => token.text).join("");
      } else {
        return tokens;
      }
    }
    /**
     * Returns the expanded macro as a reversed array of tokens and a macro
     * argument count.  Or returns `null` if no such macro.
     */
    _getExpansion(name) {
      const definition = this.macros.get(name);
      if (definition == null) {
        return definition;
      }
      if (name.length === 1) {
        const catcode = this.lexer.catcodes[name];
        if (catcode != null && catcode !== 13) {
          return;
        }
      }
      const expansion = typeof definition === "function" ? definition(this) : definition;
      if (typeof expansion === "string") {
        let numArgs = 0;
        if (expansion.indexOf("#") !== -1) {
          const stripped = expansion.replace(/##/g, "");
          while (stripped.indexOf("#" + (numArgs + 1)) !== -1) {
            ++numArgs;
          }
        }
        const bodyLexer = new Lexer(expansion, this.settings);
        const tokens = [];
        let tok = bodyLexer.lex();
        while (tok.text !== "EOF") {
          tokens.push(tok);
          tok = bodyLexer.lex();
        }
        tokens.reverse();
        const expanded = { tokens, numArgs };
        return expanded;
      }
      return expansion;
    }
    /**
     * Determine whether a command is currently "defined" (has some
     * functionality), meaning that it's a macro (in the current group),
     * a function, a symbol, or one of the special commands listed in
     * `implicitCommands`.
     */
    isDefined(name) {
      return this.macros.has(name) || Object.prototype.hasOwnProperty.call(functions, name) || Object.prototype.hasOwnProperty.call(symbols.math, name) || Object.prototype.hasOwnProperty.call(symbols.text, name) || Object.prototype.hasOwnProperty.call(implicitCommands, name);
    }
    /**
     * Determine whether a command is expandable.
     */
    isExpandable(name) {
      const macro = this.macros.get(name);
      return macro != null ? typeof macro === "string" || typeof macro === "function" || !macro.unexpandable : Object.prototype.hasOwnProperty.call(functions, name) && !functions[name].primitive;
    }
  };
  var unicodeSubRegEx = /^[₊₋₌₍₎₀₁₂₃₄₅₆₇₈₉ₐₑₕᵢⱼₖₗₘₙₒₚᵣₛₜᵤᵥₓᵦᵧᵨᵩᵪ]/;
  var uSubsAndSups = Object.freeze({
    "\u208A": "+",
    "\u208B": "-",
    "\u208C": "=",
    "\u208D": "(",
    "\u208E": ")",
    "\u2080": "0",
    "\u2081": "1",
    "\u2082": "2",
    "\u2083": "3",
    "\u2084": "4",
    "\u2085": "5",
    "\u2086": "6",
    "\u2087": "7",
    "\u2088": "8",
    "\u2089": "9",
    "\u2090": "a",
    "\u2091": "e",
    "\u2095": "h",
    "\u1D62": "i",
    "\u2C7C": "j",
    "\u2096": "k",
    "\u2097": "l",
    "\u2098": "m",
    "\u2099": "n",
    "\u2092": "o",
    "\u209A": "p",
    "\u1D63": "r",
    "\u209B": "s",
    "\u209C": "t",
    "\u1D64": "u",
    "\u1D65": "v",
    "\u2093": "x",
    "\u1D66": "\u03B2",
    "\u1D67": "\u03B3",
    "\u1D68": "\u03C1",
    "\u1D69": "\u03D5",
    "\u1D6A": "\u03C7",
    "\u207A": "+",
    "\u207B": "-",
    "\u207C": "=",
    "\u207D": "(",
    "\u207E": ")",
    "\u2070": "0",
    "\xB9": "1",
    "\xB2": "2",
    "\xB3": "3",
    "\u2074": "4",
    "\u2075": "5",
    "\u2076": "6",
    "\u2077": "7",
    "\u2078": "8",
    "\u2079": "9",
    "\u1D2C": "A",
    "\u1D2E": "B",
    "\u1D30": "D",
    "\u1D31": "E",
    "\u1D33": "G",
    "\u1D34": "H",
    "\u1D35": "I",
    "\u1D36": "J",
    "\u1D37": "K",
    "\u1D38": "L",
    "\u1D39": "M",
    "\u1D3A": "N",
    "\u1D3C": "O",
    "\u1D3E": "P",
    "\u1D3F": "R",
    "\u1D40": "T",
    "\u1D41": "U",
    "\u2C7D": "V",
    "\u1D42": "W",
    "\u1D43": "a",
    "\u1D47": "b",
    "\u1D9C": "c",
    "\u1D48": "d",
    "\u1D49": "e",
    "\u1DA0": "f",
    "\u1D4D": "g",
    "\u02B0": "h",
    "\u2071": "i",
    "\u02B2": "j",
    "\u1D4F": "k",
    "\u02E1": "l",
    "\u1D50": "m",
    "\u207F": "n",
    "\u1D52": "o",
    "\u1D56": "p",
    "\u02B3": "r",
    "\u02E2": "s",
    "\u1D57": "t",
    "\u1D58": "u",
    "\u1D5B": "v",
    "\u02B7": "w",
    "\u02E3": "x",
    "\u02B8": "y",
    "\u1DBB": "z",
    "\u1D5D": "\u03B2",
    "\u1D5E": "\u03B3",
    "\u1D5F": "\u03B4",
    "\u1D60": "\u03D5",
    "\u1D61": "\u03C7",
    "\u1DBF": "\u03B8"
  });
  var asciiFromScript = Object.freeze({
    "\u{1D49C}": "A",
    "\u212C": "B",
    "\u{1D49E}": "C",
    "\u{1D49F}": "D",
    "\u2130": "E",
    "\u2131": "F",
    "\u{1D4A2}": "G",
    "\u210B": "H",
    "\u2110": "I",
    "\u{1D4A5}": "J",
    "\u{1D4A6}": "K",
    "\u2112": "L",
    "\u2133": "M",
    "\u{1D4A9}": "N",
    "\u{1D4AA}": "O",
    "\u{1D4AB}": "P",
    "\u{1D4AC}": "Q",
    "\u211B": "R",
    "\u{1D4AE}": "S",
    "\u{1D4AF}": "T",
    "\u{1D4B0}": "U",
    "\u{1D4B1}": "V",
    "\u{1D4B2}": "W",
    "\u{1D4B3}": "X",
    "\u{1D4B4}": "Y",
    "\u{1D4B5}": "Z"
  });
  var unicodeAccents = {
    "\u0301": { text: "\\'", math: "\\acute" },
    "\u0300": { text: "\\`", math: "\\grave" },
    "\u0308": { text: '\\"', math: "\\ddot" },
    "\u0303": { text: "\\~", math: "\\tilde" },
    "\u0304": { text: "\\=", math: "\\bar" },
    "\u0306": { text: "\\u", math: "\\breve" },
    "\u030C": { text: "\\v", math: "\\check" },
    "\u0302": { text: "\\^", math: "\\hat" },
    "\u0307": { text: "\\.", math: "\\dot" },
    "\u030A": { text: "\\r", math: "\\mathring" },
    "\u030B": { text: "\\H" },
    "\u0327": { text: "\\c" }
  };
  var unicodeSymbols = {
    "\xE1": "a\u0301",
    "\xE0": "a\u0300",
    "\xE4": "a\u0308",
    "\u01DF": "a\u0308\u0304",
    "\xE3": "a\u0303",
    "\u0101": "a\u0304",
    "\u0103": "a\u0306",
    "\u1EAF": "a\u0306\u0301",
    "\u1EB1": "a\u0306\u0300",
    "\u1EB5": "a\u0306\u0303",
    "\u01CE": "a\u030C",
    "\xE2": "a\u0302",
    "\u1EA5": "a\u0302\u0301",
    "\u1EA7": "a\u0302\u0300",
    "\u1EAB": "a\u0302\u0303",
    "\u0227": "a\u0307",
    "\u01E1": "a\u0307\u0304",
    "\xE5": "a\u030A",
    "\u01FB": "a\u030A\u0301",
    "\u1E03": "b\u0307",
    "\u0107": "c\u0301",
    "\u010D": "c\u030C",
    "\u0109": "c\u0302",
    "\u010B": "c\u0307",
    "\u010F": "d\u030C",
    "\u1E0B": "d\u0307",
    "\xE9": "e\u0301",
    "\xE8": "e\u0300",
    "\xEB": "e\u0308",
    "\u1EBD": "e\u0303",
    "\u0113": "e\u0304",
    "\u1E17": "e\u0304\u0301",
    "\u1E15": "e\u0304\u0300",
    "\u0115": "e\u0306",
    "\u011B": "e\u030C",
    "\xEA": "e\u0302",
    "\u1EBF": "e\u0302\u0301",
    "\u1EC1": "e\u0302\u0300",
    "\u1EC5": "e\u0302\u0303",
    "\u0117": "e\u0307",
    "\u1E1F": "f\u0307",
    "\u01F5": "g\u0301",
    "\u1E21": "g\u0304",
    "\u011F": "g\u0306",
    "\u01E7": "g\u030C",
    "\u011D": "g\u0302",
    "\u0121": "g\u0307",
    "\u1E27": "h\u0308",
    "\u021F": "h\u030C",
    "\u0125": "h\u0302",
    "\u1E23": "h\u0307",
    "\xED": "i\u0301",
    "\xEC": "i\u0300",
    "\xEF": "i\u0308",
    "\u1E2F": "i\u0308\u0301",
    "\u0129": "i\u0303",
    "\u012B": "i\u0304",
    "\u012D": "i\u0306",
    "\u01D0": "i\u030C",
    "\xEE": "i\u0302",
    "\u01F0": "j\u030C",
    "\u0135": "j\u0302",
    "\u1E31": "k\u0301",
    "\u01E9": "k\u030C",
    "\u013A": "l\u0301",
    "\u013E": "l\u030C",
    "\u1E3F": "m\u0301",
    "\u1E41": "m\u0307",
    "\u0144": "n\u0301",
    "\u01F9": "n\u0300",
    "\xF1": "n\u0303",
    "\u0148": "n\u030C",
    "\u1E45": "n\u0307",
    "\xF3": "o\u0301",
    "\xF2": "o\u0300",
    "\xF6": "o\u0308",
    "\u022B": "o\u0308\u0304",
    "\xF5": "o\u0303",
    "\u1E4D": "o\u0303\u0301",
    "\u1E4F": "o\u0303\u0308",
    "\u022D": "o\u0303\u0304",
    "\u014D": "o\u0304",
    "\u1E53": "o\u0304\u0301",
    "\u1E51": "o\u0304\u0300",
    "\u014F": "o\u0306",
    "\u01D2": "o\u030C",
    "\xF4": "o\u0302",
    "\u1ED1": "o\u0302\u0301",
    "\u1ED3": "o\u0302\u0300",
    "\u1ED7": "o\u0302\u0303",
    "\u022F": "o\u0307",
    "\u0231": "o\u0307\u0304",
    "\u0151": "o\u030B",
    "\u1E55": "p\u0301",
    "\u1E57": "p\u0307",
    "\u0155": "r\u0301",
    "\u0159": "r\u030C",
    "\u1E59": "r\u0307",
    "\u015B": "s\u0301",
    "\u1E65": "s\u0301\u0307",
    "\u0161": "s\u030C",
    "\u1E67": "s\u030C\u0307",
    "\u015D": "s\u0302",
    "\u1E61": "s\u0307",
    "\u1E97": "t\u0308",
    "\u0165": "t\u030C",
    "\u1E6B": "t\u0307",
    "\xFA": "u\u0301",
    "\xF9": "u\u0300",
    "\xFC": "u\u0308",
    "\u01D8": "u\u0308\u0301",
    "\u01DC": "u\u0308\u0300",
    "\u01D6": "u\u0308\u0304",
    "\u01DA": "u\u0308\u030C",
    "\u0169": "u\u0303",
    "\u1E79": "u\u0303\u0301",
    "\u016B": "u\u0304",
    "\u1E7B": "u\u0304\u0308",
    "\u016D": "u\u0306",
    "\u01D4": "u\u030C",
    "\xFB": "u\u0302",
    "\u016F": "u\u030A",
    "\u0171": "u\u030B",
    "\u1E7D": "v\u0303",
    "\u1E83": "w\u0301",
    "\u1E81": "w\u0300",
    "\u1E85": "w\u0308",
    "\u0175": "w\u0302",
    "\u1E87": "w\u0307",
    "\u1E98": "w\u030A",
    "\u1E8D": "x\u0308",
    "\u1E8B": "x\u0307",
    "\xFD": "y\u0301",
    "\u1EF3": "y\u0300",
    "\xFF": "y\u0308",
    "\u1EF9": "y\u0303",
    "\u0233": "y\u0304",
    "\u0177": "y\u0302",
    "\u1E8F": "y\u0307",
    "\u1E99": "y\u030A",
    "\u017A": "z\u0301",
    "\u017E": "z\u030C",
    "\u1E91": "z\u0302",
    "\u017C": "z\u0307",
    "\xC1": "A\u0301",
    "\xC0": "A\u0300",
    "\xC4": "A\u0308",
    "\u01DE": "A\u0308\u0304",
    "\xC3": "A\u0303",
    "\u0100": "A\u0304",
    "\u0102": "A\u0306",
    "\u1EAE": "A\u0306\u0301",
    "\u1EB0": "A\u0306\u0300",
    "\u1EB4": "A\u0306\u0303",
    "\u01CD": "A\u030C",
    "\xC2": "A\u0302",
    "\u1EA4": "A\u0302\u0301",
    "\u1EA6": "A\u0302\u0300",
    "\u1EAA": "A\u0302\u0303",
    "\u0226": "A\u0307",
    "\u01E0": "A\u0307\u0304",
    "\xC5": "A\u030A",
    "\u01FA": "A\u030A\u0301",
    "\u1E02": "B\u0307",
    "\u0106": "C\u0301",
    "\u010C": "C\u030C",
    "\u0108": "C\u0302",
    "\u010A": "C\u0307",
    "\u010E": "D\u030C",
    "\u1E0A": "D\u0307",
    "\xC9": "E\u0301",
    "\xC8": "E\u0300",
    "\xCB": "E\u0308",
    "\u1EBC": "E\u0303",
    "\u0112": "E\u0304",
    "\u1E16": "E\u0304\u0301",
    "\u1E14": "E\u0304\u0300",
    "\u0114": "E\u0306",
    "\u011A": "E\u030C",
    "\xCA": "E\u0302",
    "\u1EBE": "E\u0302\u0301",
    "\u1EC0": "E\u0302\u0300",
    "\u1EC4": "E\u0302\u0303",
    "\u0116": "E\u0307",
    "\u1E1E": "F\u0307",
    "\u01F4": "G\u0301",
    "\u1E20": "G\u0304",
    "\u011E": "G\u0306",
    "\u01E6": "G\u030C",
    "\u011C": "G\u0302",
    "\u0120": "G\u0307",
    "\u1E26": "H\u0308",
    "\u021E": "H\u030C",
    "\u0124": "H\u0302",
    "\u1E22": "H\u0307",
    "\xCD": "I\u0301",
    "\xCC": "I\u0300",
    "\xCF": "I\u0308",
    "\u1E2E": "I\u0308\u0301",
    "\u0128": "I\u0303",
    "\u012A": "I\u0304",
    "\u012C": "I\u0306",
    "\u01CF": "I\u030C",
    "\xCE": "I\u0302",
    "\u0130": "I\u0307",
    "\u0134": "J\u0302",
    "\u1E30": "K\u0301",
    "\u01E8": "K\u030C",
    "\u0139": "L\u0301",
    "\u013D": "L\u030C",
    "\u1E3E": "M\u0301",
    "\u1E40": "M\u0307",
    "\u0143": "N\u0301",
    "\u01F8": "N\u0300",
    "\xD1": "N\u0303",
    "\u0147": "N\u030C",
    "\u1E44": "N\u0307",
    "\xD3": "O\u0301",
    "\xD2": "O\u0300",
    "\xD6": "O\u0308",
    "\u022A": "O\u0308\u0304",
    "\xD5": "O\u0303",
    "\u1E4C": "O\u0303\u0301",
    "\u1E4E": "O\u0303\u0308",
    "\u022C": "O\u0303\u0304",
    "\u014C": "O\u0304",
    "\u1E52": "O\u0304\u0301",
    "\u1E50": "O\u0304\u0300",
    "\u014E": "O\u0306",
    "\u01D1": "O\u030C",
    "\xD4": "O\u0302",
    "\u1ED0": "O\u0302\u0301",
    "\u1ED2": "O\u0302\u0300",
    "\u1ED6": "O\u0302\u0303",
    "\u022E": "O\u0307",
    "\u0230": "O\u0307\u0304",
    "\u0150": "O\u030B",
    "\u1E54": "P\u0301",
    "\u1E56": "P\u0307",
    "\u0154": "R\u0301",
    "\u0158": "R\u030C",
    "\u1E58": "R\u0307",
    "\u015A": "S\u0301",
    "\u1E64": "S\u0301\u0307",
    "\u0160": "S\u030C",
    "\u1E66": "S\u030C\u0307",
    "\u015C": "S\u0302",
    "\u1E60": "S\u0307",
    "\u0164": "T\u030C",
    "\u1E6A": "T\u0307",
    "\xDA": "U\u0301",
    "\xD9": "U\u0300",
    "\xDC": "U\u0308",
    "\u01D7": "U\u0308\u0301",
    "\u01DB": "U\u0308\u0300",
    "\u01D5": "U\u0308\u0304",
    "\u01D9": "U\u0308\u030C",
    "\u0168": "U\u0303",
    "\u1E78": "U\u0303\u0301",
    "\u016A": "U\u0304",
    "\u1E7A": "U\u0304\u0308",
    "\u016C": "U\u0306",
    "\u01D3": "U\u030C",
    "\xDB": "U\u0302",
    "\u016E": "U\u030A",
    "\u0170": "U\u030B",
    "\u1E7C": "V\u0303",
    "\u1E82": "W\u0301",
    "\u1E80": "W\u0300",
    "\u1E84": "W\u0308",
    "\u0174": "W\u0302",
    "\u1E86": "W\u0307",
    "\u1E8C": "X\u0308",
    "\u1E8A": "X\u0307",
    "\xDD": "Y\u0301",
    "\u1EF2": "Y\u0300",
    "\u0178": "Y\u0308",
    "\u1EF8": "Y\u0303",
    "\u0232": "Y\u0304",
    "\u0176": "Y\u0302",
    "\u1E8E": "Y\u0307",
    "\u0179": "Z\u0301",
    "\u017D": "Z\u030C",
    "\u1E90": "Z\u0302",
    "\u017B": "Z\u0307",
    "\u03AC": "\u03B1\u0301",
    "\u1F70": "\u03B1\u0300",
    "\u1FB1": "\u03B1\u0304",
    "\u1FB0": "\u03B1\u0306",
    "\u03AD": "\u03B5\u0301",
    "\u1F72": "\u03B5\u0300",
    "\u03AE": "\u03B7\u0301",
    "\u1F74": "\u03B7\u0300",
    "\u03AF": "\u03B9\u0301",
    "\u1F76": "\u03B9\u0300",
    "\u03CA": "\u03B9\u0308",
    "\u0390": "\u03B9\u0308\u0301",
    "\u1FD2": "\u03B9\u0308\u0300",
    "\u1FD1": "\u03B9\u0304",
    "\u1FD0": "\u03B9\u0306",
    "\u03CC": "\u03BF\u0301",
    "\u1F78": "\u03BF\u0300",
    "\u03CD": "\u03C5\u0301",
    "\u1F7A": "\u03C5\u0300",
    "\u03CB": "\u03C5\u0308",
    "\u03B0": "\u03C5\u0308\u0301",
    "\u1FE2": "\u03C5\u0308\u0300",
    "\u1FE1": "\u03C5\u0304",
    "\u1FE0": "\u03C5\u0306",
    "\u03CE": "\u03C9\u0301",
    "\u1F7C": "\u03C9\u0300",
    "\u038E": "\u03A5\u0301",
    "\u1FEA": "\u03A5\u0300",
    "\u03AB": "\u03A5\u0308",
    "\u1FE9": "\u03A5\u0304",
    "\u1FE8": "\u03A5\u0306",
    "\u038F": "\u03A9\u0301",
    "\u1FFA": "\u03A9\u0300"
  };
  var binLeftCancellers = ["bin", "op", "open", "punct", "rel"];
  var sizeRegEx = /([-+]?) *(\d+(?:\.\d*)?|\.\d+) *([a-z]{2})/;
  var textRegEx = /^ *\\text/;
  var Parser = class _Parser2 {
    constructor(input, settings, isPreamble = false) {
      this.mode = "math";
      this.gullet = new MacroExpander(input, settings, this.mode);
      this.settings = settings;
      this.isPreamble = isPreamble;
      this.leftrightDepth = 0;
      this.prevAtomType = "";
    }
    /**
     * Checks a result to make sure it has the right type, and throws an
     * appropriate error otherwise.
     */
    expect(text2, consume = true) {
      if (this.fetch().text !== text2) {
        throw new ParseError(`Expected '${text2}', got '${this.fetch().text}'`, this.fetch());
      }
      if (consume) {
        this.consume();
      }
    }
    /**
     * Discards the current lookahead token, considering it consumed.
     */
    consume() {
      this.nextToken = null;
    }
    /**
     * Return the current lookahead token, or if there isn't one (at the
     * beginning, or if the previous lookahead token was consume()d),
     * fetch the next token as the new lookahead token and return it.
     */
    fetch() {
      if (this.nextToken == null) {
        this.nextToken = this.gullet.expandNextToken();
      }
      return this.nextToken;
    }
    /**
     * Switches between "text" and "math" modes.
     */
    switchMode(newMode) {
      this.mode = newMode;
      this.gullet.switchMode(newMode);
    }
    /**
     * Main parsing function, which parses an entire input.
     */
    parse() {
      this.gullet.beginGroup();
      if (this.settings.colorIsTextColor) {
        this.gullet.macros.set("\\color", "\\textcolor");
      }
      const parse = this.parseExpression(false);
      this.expect("EOF");
      if (this.isPreamble) {
        const macros2 = /* @__PURE__ */ Object.create(null);
        Object.entries(this.gullet.macros.current).forEach(([key, value]) => {
          macros2[key] = value;
        });
        this.gullet.endGroup();
        return macros2;
      }
      const tag2 = this.gullet.macros.get("\\df@tag");
      this.gullet.endGroup();
      if (tag2) {
        this.gullet.macros.current["\\df@tag"] = tag2;
      }
      return parse;
    }
    static get endOfExpression() {
      return ["}", "\\endgroup", "\\end", "\\right", "\\endtoggle", "&"];
    }
    /**
     * Fully parse a separate sequence of tokens as a separate job.
     * Tokens should be specified in reverse order, as in a MacroDefinition.
     */
    subparse(tokens) {
      const oldToken = this.nextToken;
      this.consume();
      this.gullet.pushToken(new Token("}"));
      this.gullet.pushTokens(tokens);
      const parse = this.parseExpression(false);
      this.expect("}");
      this.nextToken = oldToken;
      return parse;
    }
    /**
       * Parses an "expression", which is a list of atoms.
       *
       * `breakOnInfix`: Should the parsing stop when we hit infix nodes? This
       *                 happens when functions have higher precedence than infix
       *                 nodes in implicit parses.
       *
       * `breakOnTokenText`: The text of the token that the expression should end
       *                     with, or `null` if something else should end the
       *                     expression.
       *
       * `breakOnMiddle`: \color, \over, and old styling functions work on an implicit group.
       *                  These groups end just before the usual tokens, but they also
       *                  end just before `\middle`.
       */
    parseExpression(breakOnInfix, breakOnTokenText, breakOnMiddle) {
      const body = [];
      this.prevAtomType = "";
      while (true) {
        if (this.mode === "math") {
          this.consumeSpaces();
        }
        const lex = this.fetch();
        if (_Parser2.endOfExpression.indexOf(lex.text) !== -1) {
          break;
        }
        if (breakOnTokenText && lex.text === breakOnTokenText) {
          break;
        }
        if (breakOnMiddle && lex.text === "\\middle") {
          break;
        }
        if (breakOnInfix && functions[lex.text] && functions[lex.text].infix) {
          break;
        }
        const atom = this.parseAtom(breakOnTokenText);
        if (!atom) {
          break;
        } else if (atom.type === "internal") {
          continue;
        }
        body.push(atom);
        this.prevAtomType = atom.type === "atom" ? atom.family : atom.type;
      }
      if (this.mode === "text") {
        this.formLigatures(body);
      }
      return this.handleInfixNodes(body);
    }
    /**
     * Rewrites infix operators such as \over with corresponding commands such
     * as \frac.
     *
     * There can only be one infix operator per group.  If there's more than one
     * then the expression is ambiguous.  This can be resolved by adding {}.
     */
    handleInfixNodes(body) {
      let overIndex = -1;
      let funcName;
      for (let i = 0; i < body.length; i++) {
        if (body[i].type === "infix") {
          if (overIndex !== -1) {
            throw new ParseError("only one infix operator per group", body[i].token);
          }
          overIndex = i;
          funcName = body[i].replaceWith;
        }
      }
      if (overIndex !== -1 && funcName) {
        let numerNode;
        let denomNode;
        const numerBody = body.slice(0, overIndex);
        const denomBody = body.slice(overIndex + 1);
        if (numerBody.length === 1 && numerBody[0].type === "ordgroup") {
          numerNode = numerBody[0];
        } else {
          numerNode = { type: "ordgroup", mode: this.mode, body: numerBody };
        }
        if (denomBody.length === 1 && denomBody[0].type === "ordgroup") {
          denomNode = denomBody[0];
        } else {
          denomNode = { type: "ordgroup", mode: this.mode, body: denomBody };
        }
        let node;
        if (funcName === "\\\\abovefrac") {
          node = this.callFunction(funcName, [numerNode, body[overIndex], denomNode], []);
        } else {
          node = this.callFunction(funcName, [numerNode, denomNode], []);
        }
        return [node];
      } else {
        return body;
      }
    }
    /**
     * Handle a subscript or superscript with nice errors.
     */
    handleSupSubscript(name) {
      const symbolToken = this.fetch();
      const symbol = symbolToken.text;
      this.consume();
      this.consumeSpaces();
      let group;
      do {
        group = this.parseGroup(name);
      } while (group.type && group.type === "internal");
      if (!group) {
        throw new ParseError("Expected group after '" + symbol + "'", symbolToken);
      }
      return group;
    }
    /**
     * Converts the textual input of an unsupported command into a text node
     * contained within a color node whose color is determined by errorColor
     */
    formatUnsupportedCmd(text2) {
      const textordArray = [];
      for (let i = 0; i < text2.length; i++) {
        textordArray.push({ type: "textord", mode: "text", text: text2[i] });
      }
      const textNode = {
        type: "text",
        mode: this.mode,
        body: textordArray
      };
      const colorNode = {
        type: "color",
        mode: this.mode,
        color: this.settings.errorColor,
        body: [textNode]
      };
      return colorNode;
    }
    /**
     * Parses a group with optional super/subscripts.
     */
    parseAtom(breakOnTokenText) {
      const base = this.parseGroup("atom", breakOnTokenText);
      if (base && base.type === "internal") {
        return base;
      }
      if (this.mode === "text") {
        return base;
      }
      let superscript;
      let subscript;
      while (true) {
        this.consumeSpaces();
        const lex = this.fetch();
        if (lex.text === "\\limits" || lex.text === "\\nolimits") {
          if (base && base.type === "op") {
            const limits = lex.text === "\\limits";
            base.limits = limits;
            base.alwaysHandleSupSub = true;
          } else if (base && base.type === "operatorname") {
            if (base.alwaysHandleSupSub) {
              base.limits = lex.text === "\\limits";
            }
          } else {
            throw new ParseError("Limit controls must follow a math operator", lex);
          }
          this.consume();
        } else if (lex.text === "^") {
          if (superscript) {
            throw new ParseError("Double superscript", lex);
          }
          superscript = this.handleSupSubscript("superscript");
        } else if (lex.text === "_") {
          if (subscript) {
            throw new ParseError("Double subscript", lex);
          }
          subscript = this.handleSupSubscript("subscript");
        } else if (lex.text === "'") {
          if (superscript) {
            throw new ParseError("Double superscript", lex);
          }
          const prime = { type: "textord", mode: this.mode, text: "\\prime" };
          const primes2 = [prime];
          this.consume();
          while (this.fetch().text === "'") {
            primes2.push(prime);
            this.consume();
          }
          if (this.fetch().text === "^") {
            primes2.push(this.handleSupSubscript("superscript"));
          }
          superscript = { type: "ordgroup", mode: this.mode, body: primes2 };
        } else if (uSubsAndSups[lex.text]) {
          const isSub = unicodeSubRegEx.test(lex.text);
          const subsupTokens = [];
          subsupTokens.push(new Token(uSubsAndSups[lex.text]));
          this.consume();
          while (true) {
            const token = this.fetch().text;
            if (!uSubsAndSups[token]) {
              break;
            }
            if (unicodeSubRegEx.test(token) !== isSub) {
              break;
            }
            subsupTokens.unshift(new Token(uSubsAndSups[token]));
            this.consume();
          }
          const body = this.subparse(subsupTokens);
          if (isSub) {
            subscript = { type: "ordgroup", mode: "math", body };
          } else {
            superscript = { type: "ordgroup", mode: "math", body };
          }
        } else {
          break;
        }
      }
      if (superscript || subscript) {
        if (base && base.type === "multiscript" && !base.postscripts) {
          base.postscripts = { sup: superscript, sub: subscript };
          return base;
        } else {
          const isFollowedByDelimiter = !base || base.type !== "op" && base.type !== "operatorname" ? void 0 : isDelimiter(this.nextToken.text);
          return {
            type: "supsub",
            mode: this.mode,
            base,
            sup: superscript,
            sub: subscript,
            isFollowedByDelimiter
          };
        }
      } else {
        return base;
      }
    }
    /**
     * Parses an entire function, including its base and all of its arguments.
     */
    parseFunction(breakOnTokenText, name) {
      const token = this.fetch();
      const func = token.text;
      const funcData = functions[func];
      if (!funcData) {
        return null;
      }
      this.consume();
      if (name && name !== "atom" && !funcData.allowedInArgument) {
        throw new ParseError(
          "Got function '" + func + "' with no arguments" + (name ? " as " + name : ""),
          token
        );
      } else if (this.mode === "text" && !funcData.allowedInText) {
        throw new ParseError("Can't use function '" + func + "' in text mode", token);
      } else if (this.mode === "math" && funcData.allowedInMath === false) {
        throw new ParseError("Can't use function '" + func + "' in math mode", token);
      }
      const prevAtomType = this.prevAtomType;
      const { args, optArgs } = this.parseArguments(func, funcData);
      this.prevAtomType = prevAtomType;
      return this.callFunction(func, args, optArgs, token, breakOnTokenText);
    }
    /**
     * Call a function handler with a suitable context and arguments.
     */
    callFunction(name, args, optArgs, token, breakOnTokenText) {
      const context = {
        funcName: name,
        parser: this,
        token,
        breakOnTokenText
      };
      const func = functions[name];
      if (func && func.handler) {
        return func.handler(context, args, optArgs);
      } else {
        throw new ParseError(`No function handler for ${name}`);
      }
    }
    /**
     * Parses the arguments of a function or environment
     */
    parseArguments(func, funcData) {
      const totalArgs = funcData.numArgs + funcData.numOptionalArgs;
      if (totalArgs === 0) {
        return { args: [], optArgs: [] };
      }
      const args = [];
      const optArgs = [];
      for (let i = 0; i < totalArgs; i++) {
        let argType = funcData.argTypes && funcData.argTypes[i];
        const isOptional = i < funcData.numOptionalArgs;
        if (funcData.primitive && argType == null || // \sqrt expands into primitive if optional argument doesn't exist
        funcData.type === "sqrt" && i === 1 && optArgs[0] == null) {
          argType = "primitive";
        }
        const arg = this.parseGroupOfType(`argument to '${func}'`, argType, isOptional);
        if (isOptional) {
          optArgs.push(arg);
        } else if (arg != null) {
          args.push(arg);
        } else {
          throw new ParseError("Null argument, please report this as a bug");
        }
      }
      return { args, optArgs };
    }
    /**
     * Parses a group when the mode is changing.
     */
    parseGroupOfType(name, type, optional) {
      switch (type) {
        case "size":
          return this.parseSizeGroup(optional);
        case "url":
          return this.parseUrlGroup(optional);
        case "math":
        case "text":
          return this.parseArgumentGroup(optional, type);
        case "hbox": {
          const group = this.parseArgumentGroup(optional, "text");
          return group != null ? {
            type: "styling",
            mode: group.mode,
            body: [group],
            scriptLevel: "text"
            // simulate \textstyle
          } : null;
        }
        case "raw": {
          const token = this.parseStringGroup("raw", optional);
          return token != null ? {
            type: "raw",
            mode: "text",
            string: token.text
          } : null;
        }
        case "primitive": {
          if (optional) {
            throw new ParseError("A primitive argument cannot be optional");
          }
          const group = this.parseGroup(name);
          if (group == null) {
            throw new ParseError("Expected group as " + name, this.fetch());
          }
          return group;
        }
        case "original":
        case null:
        case void 0:
          return this.parseArgumentGroup(optional);
        default:
          throw new ParseError("Unknown group type as " + name, this.fetch());
      }
    }
    /**
     * Discard any space tokens, fetching the next non-space token.
     */
    consumeSpaces() {
      while (true) {
        const ch = this.fetch().text;
        if (ch === " " || ch === "\xA0" || ch === "\uFE0E") {
          this.consume();
        } else {
          break;
        }
      }
    }
    /**
     * Parses a group, essentially returning the string formed by the
     * brace-enclosed tokens plus some position information.
     */
    parseStringGroup(modeName, optional) {
      const argToken = this.gullet.scanArgument(optional);
      if (argToken == null) {
        return null;
      }
      let str = "";
      let nextToken;
      while ((nextToken = this.fetch()).text !== "EOF") {
        str += nextToken.text;
        this.consume();
      }
      this.consume();
      argToken.text = str;
      return argToken;
    }
    /**
     * Parses a regex-delimited group: the largest sequence of tokens
     * whose concatenated strings match `regex`. Returns the string
     * formed by the tokens plus some position information.
     */
    parseRegexGroup(regex, modeName) {
      const firstToken = this.fetch();
      let lastToken = firstToken;
      let str = "";
      let nextToken;
      while ((nextToken = this.fetch()).text !== "EOF" && regex.test(str + nextToken.text)) {
        lastToken = nextToken;
        str += lastToken.text;
        this.consume();
      }
      if (str === "") {
        throw new ParseError("Invalid " + modeName + ": '" + firstToken.text + "'", firstToken);
      }
      return firstToken.range(lastToken, str);
    }
    /**
     * Parses a size specification, consisting of magnitude and unit.
     */
    parseSizeGroup(optional) {
      let res;
      let isBlank = false;
      this.gullet.consumeSpaces();
      if (!optional && this.gullet.future().text !== "{") {
        res = this.parseRegexGroup(/^[-+]? *(?:$|\d+|\d+\.\d*|\.\d*) *[a-z]{0,2} *$/, "size");
      } else {
        res = this.parseStringGroup("size", optional);
      }
      if (!res) {
        return null;
      }
      if (!optional && res.text.length === 0) {
        res.text = "0pt";
        isBlank = true;
      }
      const match = sizeRegEx.exec(res.text);
      if (!match) {
        throw new ParseError("Invalid size: '" + res.text + "'", res);
      }
      const data = {
        number: +(match[1] + match[2]),
        // sign + magnitude, cast to number
        unit: match[3]
      };
      if (!validUnit(data)) {
        throw new ParseError("Invalid unit: '" + data.unit + "'", res);
      }
      return {
        type: "size",
        mode: this.mode,
        value: data,
        isBlank
      };
    }
    /**
     * Parses an URL, checking escaped letters and allowed protocols,
     * and setting the catcode of % as an active character (as in \hyperref).
     */
    parseUrlGroup(optional) {
      this.gullet.lexer.setCatcode("%", 13);
      this.gullet.lexer.setCatcode("~", 12);
      const res = this.parseStringGroup("url", optional);
      this.gullet.lexer.setCatcode("%", 14);
      this.gullet.lexer.setCatcode("~", 13);
      if (res == null) {
        return null;
      }
      let url = res.text.replace(/\\([#$%&~_^{}])/g, "$1");
      url = res.text.replace(/{\u2044}/g, "/");
      return {
        type: "url",
        mode: this.mode,
        url
      };
    }
    /**
     * Parses an argument with the mode specified.
     */
    parseArgumentGroup(optional, mode) {
      const argToken = this.gullet.scanArgument(optional);
      if (argToken == null) {
        return null;
      }
      const outerMode = this.mode;
      if (mode) {
        this.switchMode(mode);
      }
      this.gullet.beginGroup();
      const expression = this.parseExpression(false, "EOF");
      this.expect("EOF");
      this.gullet.endGroup();
      const result = {
        type: "ordgroup",
        mode: this.mode,
        loc: argToken.loc,
        body: expression
      };
      if (mode) {
        this.switchMode(outerMode);
      }
      return result;
    }
    /**
     * Parses an ordinary group, which is either a single nucleus (like "x")
     * or an expression in braces (like "{x+y}") or an implicit group, a group
     * that starts at the current position, and ends right before a higher explicit
     * group ends, or at EOF.
     */
    parseGroup(name, breakOnTokenText) {
      const firstToken = this.fetch();
      const text2 = firstToken.text;
      if (name === "argument to '\\left'") {
        return this.parseSymbol();
      }
      let result;
      if (text2 === "{" || text2 === "\\begingroup" || text2 === "\\toggle") {
        this.consume();
        const groupEnd = text2 === "{" ? "}" : text2 === "\\begingroup" ? "\\endgroup" : "\\endtoggle";
        this.gullet.beginGroup();
        const expression = this.parseExpression(false, groupEnd);
        const lastToken = this.fetch();
        this.expect(groupEnd);
        this.gullet.endGroup();
        result = {
          type: lastToken.text === "\\endtoggle" ? "toggle" : "ordgroup",
          mode: this.mode,
          loc: SourceLocation.range(firstToken, lastToken),
          body: expression,
          // A group formed by \begingroup...\endgroup is a semi-simple group
          // which doesn't affect spacing in math mode, i.e., is transparent.
          // https://tex.stackexchange.com/questions/1930/
          semisimple: text2 === "\\begingroup" || void 0
        };
      } else {
        result = this.parseFunction(breakOnTokenText, name) || this.parseSymbol();
        if (result == null && text2[0] === "\\" && !Object.prototype.hasOwnProperty.call(implicitCommands, text2)) {
          if (this.settings.throwOnError) {
            throw new ParseError("Unsupported function name: " + text2, firstToken);
          }
          result = this.formatUnsupportedCmd(text2);
          this.consume();
        }
      }
      return result;
    }
    /**
     * Form ligature-like combinations of characters for text mode.
     * This includes inputs like "--", "---", "``" and "''".
     * The result will simply replace multiple textord nodes with a single
     * character in each value by a single textord node having multiple
     * characters in its value.  The representation is still ASCII source.
     * The group will be modified in place.
     */
    formLigatures(group) {
      let n = group.length - 1;
      for (let i = 0; i < n; ++i) {
        const a = group[i];
        const v = a.text;
        if (v === "-" && group[i + 1].text === "-") {
          if (i + 1 < n && group[i + 2].text === "-") {
            group.splice(i, 3, {
              type: "textord",
              mode: "text",
              loc: SourceLocation.range(a, group[i + 2]),
              text: "---"
            });
            n -= 2;
          } else {
            group.splice(i, 2, {
              type: "textord",
              mode: "text",
              loc: SourceLocation.range(a, group[i + 1]),
              text: "--"
            });
            n -= 1;
          }
        }
        if ((v === "'" || v === "`") && group[i + 1].text === v) {
          group.splice(i, 2, {
            type: "textord",
            mode: "text",
            loc: SourceLocation.range(a, group[i + 1]),
            text: v + v
          });
          n -= 1;
        }
      }
    }
    /**
     * Parse a single symbol out of the string. Here, we handle single character
     * symbols and special functions like \verb.
     */
    parseSymbol() {
      const nucleus = this.fetch();
      let text2 = nucleus.text;
      if (/^\\verb[^a-zA-Z]/.test(text2)) {
        this.consume();
        let arg = text2.slice(5);
        const star = arg.charAt(0) === "*";
        if (star) {
          arg = arg.slice(1);
        }
        if (arg.length < 2 || arg.charAt(0) !== arg.slice(-1)) {
          throw new ParseError(`\\verb assertion failed --
                    please report what input caused this bug`);
        }
        arg = arg.slice(1, -1);
        return {
          type: "verb",
          mode: "text",
          body: arg,
          star
        };
      }
      if (Object.prototype.hasOwnProperty.call(unicodeSymbols, text2[0]) && this.mode === "math" && !symbols[this.mode][text2[0]]) {
        if (this.settings.strict && this.mode === "math") {
          throw new ParseError(
            `Accented Unicode text character "${text2[0]}" used in math mode`,
            nucleus
          );
        }
        text2 = unicodeSymbols[text2[0]] + text2.slice(1);
      }
      const match = this.mode === "math" ? combiningDiacriticalMarksEndRegex.exec(text2) : null;
      if (match) {
        text2 = text2.substring(0, match.index);
        if (text2 === "i") {
          text2 = "\u0131";
        } else if (text2 === "j") {
          text2 = "\u0237";
        }
      }
      let symbol;
      if (symbols[this.mode][text2]) {
        let group = symbols[this.mode][text2].group;
        if (group === "bin" && (binLeftCancellers.includes(this.prevAtomType) || this.prevAtomType === "")) {
          group = "open";
        }
        const loc = SourceLocation.range(nucleus);
        let s;
        if (Object.prototype.hasOwnProperty.call(ATOMS, group)) {
          const family = group;
          s = {
            type: "atom",
            mode: this.mode,
            family,
            loc,
            text: text2
          };
          if ((family === "rel" || family === "bin") && this.prevAtomType === "text") {
            if (textRegEx.test(loc.lexer.input.slice(loc.end))) {
              s.needsSpacing = true;
            }
          }
        } else {
          if (asciiFromScript[text2]) {
            this.consume();
            const nextCode = this.fetch().text.charCodeAt(0);
            const font = nextCode === 65025 ? "mathscr" : "mathcal";
            if (nextCode === 65024 || nextCode === 65025) {
              this.consume();
            }
            return {
              type: "font",
              mode: "math",
              font,
              body: { type: "mathord", mode: "math", loc, text: asciiFromScript[text2] }
            };
          }
          s = {
            type: group,
            mode: this.mode,
            loc,
            text: text2
          };
        }
        symbol = s;
      } else if (text2.charCodeAt(0) >= 128 || combiningDiacriticalMarksEndRegex.exec(text2)) {
        if (this.settings.strict && this.mode === "math") {
          throw new ParseError(`Unicode text character "${text2[0]}" used in math mode`, nucleus);
        }
        symbol = {
          type: "textord",
          mode: "text",
          loc: SourceLocation.range(nucleus),
          text: text2
        };
      } else {
        return null;
      }
      this.consume();
      if (match) {
        for (let i = 0; i < match[0].length; i++) {
          const accent2 = match[0][i];
          if (!unicodeAccents[accent2]) {
            throw new ParseError(`Unknown accent ' ${accent2}'`, nucleus);
          }
          const command = unicodeAccents[accent2][this.mode] || unicodeAccents[accent2].text;
          if (!command) {
            throw new ParseError(`Accent ${accent2} unsupported in ${this.mode} mode`, nucleus);
          }
          symbol = {
            type: "accent",
            mode: this.mode,
            loc: SourceLocation.range(nucleus),
            label: command,
            isStretchy: false,
            base: symbol
          };
        }
      }
      return symbol;
    }
  };
  var parseTree = function(toParse, settings) {
    if (!(typeof toParse === "string" || toParse instanceof String)) {
      throw new TypeError("Temml can only parse string typed expression");
    }
    let tree;
    let parser2;
    try {
      parser2 = new Parser(toParse, settings);
      delete parser2.gullet.macros.current["\\df@tag"];
      tree = parser2.parse();
    } catch (error) {
      if (error.toString() === "ParseError:  Unmatched delimiter") {
        settings.wrapDelimiterPairs = false;
        parser2 = new Parser(toParse, settings);
        delete parser2.gullet.macros.current["\\df@tag"];
        tree = parser2.parse();
      } else {
        throw error;
      }
    }
    if (!(tree.length > 0 && tree[0].type && tree[0].type === "array" && tree[0].addEqnNum)) {
      if (parser2.gullet.macros.get("\\df@tag")) {
        if (!settings.displayMode) {
          throw new ParseError("\\tag works only in display mode");
        }
        parser2.gullet.feed("\\df@tag");
        tree = [
          {
            type: "tag",
            mode: "text",
            body: tree,
            tag: parser2.parse()
          }
        ];
      }
    }
    return tree;
  };
  var subOrSupLevel = [2, 2, 3, 3];
  var Style = class _Style {
    constructor(data) {
      this.level = data.level;
      this.color = data.color;
      this.font = data.font || "";
      this.fontFamily = data.fontFamily || "";
      this.fontSize = data.fontSize || 1;
      this.fontWeight = data.fontWeight || "";
      this.fontShape = data.fontShape || "";
      this.maxSize = data.maxSize;
    }
    /**
     * Returns a new style object with the same properties as "this".  Properties
     * from "extension" will be copied to the new style object.
     */
    extend(extension) {
      const data = {
        level: this.level,
        color: this.color,
        font: this.font,
        fontFamily: this.fontFamily,
        fontSize: this.fontSize,
        fontWeight: this.fontWeight,
        fontShape: this.fontShape,
        maxSize: this.maxSize
      };
      for (const key in extension) {
        if (Object.prototype.hasOwnProperty.call(extension, key)) {
          data[key] = extension[key];
        }
      }
      return new _Style(data);
    }
    withLevel(n) {
      return this.extend({
        level: n
      });
    }
    incrementLevel() {
      return this.extend({
        level: Math.min(this.level + 1, 3)
      });
    }
    inSubOrSup() {
      return this.extend({
        level: subOrSupLevel[this.level]
      });
    }
    /**
     * Create a new style object with the given color.
     */
    withColor(color) {
      return this.extend({
        color
      });
    }
    /**
     * Creates a new style object with the given math font or old text font.
     * @type {[type]}
     */
    withFont(font) {
      return this.extend({
        font
      });
    }
    /**
     * Create a new style objects with the given fontFamily.
     */
    withTextFontFamily(fontFamily) {
      return this.extend({
        fontFamily,
        font: ""
      });
    }
    /**
     * Creates a new style object with the given font size
     */
    withFontSize(num) {
      return this.extend({
        fontSize: num
      });
    }
    /**
     * Creates a new style object with the given font weight
     */
    withTextFontWeight(fontWeight) {
      return this.extend({
        fontWeight,
        font: ""
      });
    }
    /**
     * Creates a new style object with the given font weight
     */
    withTextFontShape(fontShape) {
      return this.extend({
        fontShape,
        font: ""
      });
    }
    /**
     * Gets the CSS color of the current style object
     */
    getColor() {
      return this.color;
    }
  };
  var version = "0.13.3";
  function postProcess(block2) {
    const labelMap = {};
    let i = 0;
    const amsEqns = document.getElementsByClassName("tml-eqn");
    for (let parent of amsEqns) {
      i += 1;
      parent.setAttribute("id", "tml-eqn-" + String(i));
      while (true) {
        if (parent.tagName === "mtable") {
          break;
        }
        const labels = parent.getElementsByClassName("tml-label");
        if (labels.length > 0) {
          const id = parent.attributes.id.value;
          labelMap[id] = String(i);
          break;
        } else {
          parent = parent.parentElement;
        }
      }
    }
    const taggedEqns = document.getElementsByClassName("tml-tageqn");
    for (const parent of taggedEqns) {
      const labels = parent.getElementsByClassName("tml-label");
      if (labels.length > 0) {
        const tags = parent.getElementsByClassName("tml-tag");
        if (tags.length > 0) {
          const id = parent.attributes.id.value;
          labelMap[id] = tags[0].textContent;
        }
      }
    }
    const refs = block2.getElementsByClassName("tml-ref");
    [...refs].forEach((ref) => {
      const attr = ref.getAttribute("href");
      let str = labelMap[attr.slice(1)];
      if (ref.className.indexOf("tml-eqref") === -1) {
        str = str.replace(/^\(/, "");
        str = str.replace(/\)$/, "");
      } else {
        if (str.charAt(0) !== "(") {
          str = "(" + str;
        }
        if (str.slice(-1) !== ")") {
          str = str + ")";
        }
      }
      const mtext = document.createElementNS("http://www.w3.org/1998/Math/MathML", "mtext");
      mtext.appendChild(document.createTextNode(str));
      const math2 = document.createElementNS("http://www.w3.org/1998/Math/MathML", "math");
      math2.appendChild(mtext);
      ref.textContent = "";
      ref.appendChild(math2);
    });
  }
  var findEndOfMath = function(delimiter, text2, startIndex) {
    let index = startIndex;
    let braceLevel = 0;
    const delimLength = delimiter.length;
    while (index < text2.length) {
      const character = text2[index];
      if (braceLevel <= 0 && text2.slice(index, index + delimLength) === delimiter) {
        return index;
      } else if (character === "\\") {
        index++;
      } else if (character === "{") {
        braceLevel++;
      } else if (character === "}") {
        braceLevel--;
      }
      index++;
    }
    return -1;
  };
  var escapeRegex = function(string) {
    return string.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  };
  var amsRegex = /^\\(?:begin|(?:eq)?ref){/;
  var splitAtDelimiters = function(text2, delimiters2) {
    let index;
    const data = [];
    const regexLeft = new RegExp(
      "(" + delimiters2.map((x) => escapeRegex(x.left)).join("|") + ")"
    );
    while (true) {
      index = text2.search(regexLeft);
      if (index === -1) {
        break;
      }
      if (index > 0) {
        data.push({
          type: "text",
          data: text2.slice(0, index)
        });
        text2 = text2.slice(index);
      }
      const i = delimiters2.findIndex((delim) => text2.startsWith(delim.left));
      index = findEndOfMath(delimiters2[i].right, text2, delimiters2[i].left.length);
      if (index === -1) {
        break;
      }
      const rawData = text2.slice(0, index + delimiters2[i].right.length);
      const math2 = amsRegex.test(rawData) ? rawData : text2.slice(delimiters2[i].left.length, index);
      data.push({
        type: "math",
        data: math2,
        rawData,
        display: delimiters2[i].display
      });
      text2 = text2.slice(index + delimiters2[i].right.length);
    }
    if (text2 !== "") {
      data.push({
        type: "text",
        data: text2
      });
    }
    return data;
  };
  var defaultDelimiters = [
    { left: "$$", right: "$$", display: true },
    { left: "\\(", right: "\\)", display: false },
    // LaTeX uses $…$, but it ruins the display of normal `$` in text:
    // {left: "$", right: "$", display: false},
    // $ must come after $$
    // Render AMS environments even if outside $$…$$ delimiters.
    { left: "\\begin{equation}", right: "\\end{equation}", display: true },
    { left: "\\begin{equation*}", right: "\\end{equation*}", display: true },
    { left: "\\begin{align}", right: "\\end{align}", display: true },
    { left: "\\begin{align*}", right: "\\end{align*}", display: true },
    { left: "\\begin{alignat}", right: "\\end{alignat}", display: true },
    { left: "\\begin{alignat*}", right: "\\end{alignat*}", display: true },
    { left: "\\begin{gather}", right: "\\end{gather}", display: true },
    { left: "\\begin{gather*}", right: "\\end{gather*}", display: true },
    { left: "\\begin{CD}", right: "\\end{CD}", display: true },
    // Ditto \ref & \eqref
    { left: "\\ref{", right: "}", display: false },
    { left: "\\eqref{", right: "}", display: false },
    { left: "\\[", right: "\\]", display: true }
  ];
  var firstDraftDelimiters = {
    "$": [
      { left: "$$", right: "$$", display: true },
      { left: "$`", right: "`$", display: false },
      { left: "$", right: "$", display: false }
    ],
    "(": [
      { left: "\\[", right: "\\]", display: true },
      { left: "\\(", right: "\\)", display: false }
    ]
  };
  var amsDelimiters = [
    { left: "\\begin{equation}", right: "\\end{equation}", display: true },
    { left: "\\begin{equation*}", right: "\\end{equation*}", display: true },
    { left: "\\begin{align}", right: "\\end{align}", display: true },
    { left: "\\begin{align*}", right: "\\end{align*}", display: true },
    { left: "\\begin{alignat}", right: "\\end{alignat}", display: true },
    { left: "\\begin{alignat*}", right: "\\end{alignat*}", display: true },
    { left: "\\begin{gather}", right: "\\end{gather}", display: true },
    { left: "\\begin{gather*}", right: "\\end{gather*}", display: true },
    { left: "\\begin{CD}", right: "\\end{CD}", display: true },
    { left: "\\ref{", right: "}", display: false },
    { left: "\\eqref{", right: "}", display: false }
  ];
  var delimitersFromKey = (key) => {
    if (key === "$" || key === "(") {
      return firstDraftDelimiters[key];
    } else if (key === "$+" || key === "(+") {
      const firstDraft = firstDraftDelimiters[key.slice(0, 1)];
      return firstDraft.concat(amsDelimiters);
    } else if (key === "ams") {
      return amsDelimiters;
    } else if (key === "all") {
      return firstDraftDelimiters["("].concat(firstDraftDelimiters["$"]).concat(amsDelimiters);
    } else {
      return defaultDelimiters;
    }
  };
  var renderMathInText = function(text2, optionsCopy) {
    const data = splitAtDelimiters(text2, optionsCopy.delimiters);
    if (data.length === 1 && data[0].type === "text") {
      return null;
    }
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < data.length; i++) {
      if (data[i].type === "text") {
        fragment.appendChild(document.createTextNode(data[i].data));
      } else {
        const span = document.createElement("span");
        let math2 = data[i].data;
        optionsCopy.displayMode = data[i].display;
        try {
          if (optionsCopy.preProcess) {
            math2 = optionsCopy.preProcess(math2);
          }
          temml.render(math2, span, optionsCopy);
        } catch (e) {
          if (!(e instanceof ParseError)) {
            throw e;
          }
          optionsCopy.errorCallback(
            "Temml auto-render: Failed to parse `" + data[i].data + "` with ",
            e
          );
          fragment.appendChild(document.createTextNode(data[i].rawData));
          continue;
        }
        fragment.appendChild(span);
      }
    }
    return fragment;
  };
  var renderElem = function(elem, optionsCopy) {
    for (let i = 0; i < elem.childNodes.length; i++) {
      const childNode = elem.childNodes[i];
      if (childNode.nodeType === 3) {
        const frag = renderMathInText(childNode.textContent, optionsCopy);
        if (frag) {
          i += frag.childNodes.length - 1;
          elem.replaceChild(frag, childNode);
        }
      } else if (childNode.nodeType === 1) {
        const className = " " + childNode.className + " ";
        const shouldRender = optionsCopy.ignoredTags.indexOf(childNode.nodeName.toLowerCase()) === -1 && optionsCopy.ignoredClasses.every((x) => className.indexOf(" " + x + " ") === -1);
        if (shouldRender) {
          renderElem(childNode, optionsCopy);
        }
      }
    }
  };
  var renderMathInElement = function(elem, options2) {
    if (!elem) {
      throw new Error("No element provided to render");
    }
    const optionsCopy = {};
    for (const option in options2) {
      if (Object.prototype.hasOwnProperty.call(options2, option)) {
        optionsCopy[option] = options2[option];
      }
    }
    if (optionsCopy.fences) {
      optionsCopy.delimiters = delimitersFromKey(optionsCopy.fences);
    } else {
      optionsCopy.delimiters = optionsCopy.delimiters || defaultDelimiters;
    }
    optionsCopy.ignoredTags = optionsCopy.ignoredTags || [
      "script",
      "noscript",
      "style",
      "textarea",
      "pre",
      "code",
      "option"
    ];
    optionsCopy.ignoredClasses = optionsCopy.ignoredClasses || [];
    optionsCopy.errorCallback = optionsCopy.errorCallback || console.error;
    optionsCopy.macros = optionsCopy.macros || {};
    renderElem(elem, optionsCopy);
    postProcess(elem);
  };
  var render = function(expression, baseNode, options2 = {}) {
    baseNode.textContent = "";
    const alreadyInMathElement = baseNode.tagName.toLowerCase() === "math";
    if (alreadyInMathElement) {
      options2.wrap = "none";
    }
    const math2 = renderToMathMLTree(expression, options2);
    if (alreadyInMathElement) {
      baseNode.textContent = "";
      math2.children.forEach((e) => {
        baseNode.appendChild(e.toNode());
      });
    } else if (math2.children.length > 1) {
      baseNode.textContent = "";
      math2.children.forEach((e) => {
        baseNode.appendChild(e.toNode());
      });
    } else {
      baseNode.appendChild(math2.toNode());
    }
  };
  if (typeof document !== "undefined") {
    if (document.compatMode !== "CSS1Compat") {
      typeof console !== "undefined" && console.warn(
        "Warning: Temml doesn't work in quirks mode. Make sure your website has a suitable doctype."
      );
      render = function() {
        throw new ParseError("Temml doesn't work in quirks mode.");
      };
    }
  }
  var renderToString = function(expression, options2) {
    const markup = renderToMathMLTree(expression, options2).toMarkup();
    return markup;
  };
  var generateParseTree = function(expression, options2) {
    const settings = new Settings(options2);
    return parseTree(expression, settings);
  };
  var definePreamble = function(expression, options2) {
    const settings = new Settings(options2);
    settings.macros = {};
    if (!(typeof expression === "string" || expression instanceof String)) {
      throw new TypeError("Temml can only parse string typed expression");
    }
    const parser2 = new Parser(expression, settings, true);
    delete parser2.gullet.macros.current["\\df@tag"];
    const macros2 = parser2.parse();
    return macros2;
  };
  var renderError = function(error, expression, options2) {
    if (options2.throwOnError || !(error instanceof ParseError)) {
      throw error;
    }
    const node = new Span(["temml-error"], [new TextNode$1(expression + "\n\n" + error.toString())]);
    node.style.color = options2.errorColor;
    node.style.whiteSpace = "pre-line";
    return node;
  };
  var renderToMathMLTree = function(expression, options2) {
    const settings = new Settings(options2);
    try {
      const tree = parseTree(expression, settings);
      const style = new Style({
        level: settings.displayMode ? StyleLevel.DISPLAY : StyleLevel.TEXT,
        maxSize: settings.maxSize
      });
      return buildMathML(tree, expression, style, settings);
    } catch (error) {
      return renderError(error, expression, settings);
    }
  };
  var temml$1 = {
    /**
     * Current Temml version
     */
    version,
    /**
     * Renders the given LaTeX into MathML, and adds
     * it as a child to the specified DOM node.
     */
    render,
    /**
     * Renders the given LaTeX into MathML string,
     * for sending to the client.
     */
    renderToString,
    /**
     * Finds all the math delimiters in a given element of a running HTML document
     * and converts the contents of each instance into a <math> element.
     */
    renderMathInElement,
    /**
     * Post-process an entire HTML block.
     * Writes AMS auto-numbers and implements \ref{}.
     * Typcally called once, after a loop has rendered many individual spans.
     */
    postProcess,
    /**
     * Temml error, usually during parsing.
     */
    ParseError,
    /**
     * Creates a set of macros with document-wide scope.
     */
    definePreamble,
    /**
     * Parses the given LaTeX into Temml's internal parse tree structure,
     * without rendering to HTML or MathML.
     *
     * NOTE: This method is not currently recommended for public use.
     * The internal tree representation is unstable and is very likely
     * to change. Use at your own risk.
     */
    __parse: generateParseTree,
    /**
     * Renders the given LaTeX into a MathML internal DOM tree
     * representation, without flattening that representation to a string.
     *
     * NOTE: This method is not currently recommended for public use.
     * The internal tree representation is unstable and is very likely
     * to change. Use at your own risk.
     */
    __renderToMathMLTree: renderToMathMLTree,
    /**
     * adds a new symbol to builtin symbols table
     */
    __defineSymbol: defineSymbol,
    /**
     * adds a new macro to builtin macro list
     */
    __defineMacro: defineMacro
  };

  // node_modules/highlight.js/es/core.js
  var import_core = __toESM(require_core(), 1);
  var core_default = import_core.default;

  // node_modules/highlight.js/es/languages/javascript.js
  var IDENT_RE = "[A-Za-z$_][0-9A-Za-z$_]*";
  var KEYWORDS = [
    "as",
    // for exports
    "in",
    "of",
    "if",
    "for",
    "while",
    "finally",
    "var",
    "new",
    "function",
    "do",
    "return",
    "void",
    "else",
    "break",
    "catch",
    "instanceof",
    "with",
    "throw",
    "case",
    "default",
    "try",
    "switch",
    "continue",
    "typeof",
    "delete",
    "let",
    "yield",
    "const",
    "class",
    // JS handles these with a special rule
    // "get",
    // "set",
    "debugger",
    "async",
    "await",
    "static",
    "import",
    "from",
    "export",
    "extends",
    // It's reached stage 3, which is "recommended for implementation":
    "using"
  ];
  var LITERALS = [
    "true",
    "false",
    "null",
    "undefined",
    "NaN",
    "Infinity"
  ];
  var TYPES = [
    // Fundamental objects
    "Object",
    "Function",
    "Boolean",
    "Symbol",
    // numbers and dates
    "Math",
    "Date",
    "Number",
    "BigInt",
    // text
    "String",
    "RegExp",
    // Indexed collections
    "Array",
    "Float32Array",
    "Float64Array",
    "Int8Array",
    "Uint8Array",
    "Uint8ClampedArray",
    "Int16Array",
    "Int32Array",
    "Uint16Array",
    "Uint32Array",
    "BigInt64Array",
    "BigUint64Array",
    // Keyed collections
    "Set",
    "Map",
    "WeakSet",
    "WeakMap",
    // Structured data
    "ArrayBuffer",
    "SharedArrayBuffer",
    "Atomics",
    "DataView",
    "JSON",
    // Control abstraction objects
    "Promise",
    "Generator",
    "GeneratorFunction",
    "AsyncFunction",
    // Reflection
    "Reflect",
    "Proxy",
    // Internationalization
    "Intl",
    // WebAssembly
    "WebAssembly"
  ];
  var ERROR_TYPES = [
    "Error",
    "EvalError",
    "InternalError",
    "RangeError",
    "ReferenceError",
    "SyntaxError",
    "TypeError",
    "URIError"
  ];
  var BUILT_IN_GLOBALS = [
    "setInterval",
    "setTimeout",
    "clearInterval",
    "clearTimeout",
    "require",
    "exports",
    "eval",
    "isFinite",
    "isNaN",
    "parseFloat",
    "parseInt",
    "decodeURI",
    "decodeURIComponent",
    "encodeURI",
    "encodeURIComponent",
    "escape",
    "unescape"
  ];
  var BUILT_IN_VARIABLES = [
    "arguments",
    "this",
    "super",
    "console",
    "window",
    "document",
    "localStorage",
    "sessionStorage",
    "module",
    "global"
    // Node.js
  ];
  var BUILT_INS = [].concat(
    BUILT_IN_GLOBALS,
    TYPES,
    ERROR_TYPES
  );
  function javascript(hljs) {
    const regex = hljs.regex;
    const hasClosingTag = (match, { after }) => {
      const tag2 = "</" + match[0].slice(1);
      const pos = match.input.indexOf(tag2, after);
      return pos !== -1;
    };
    const IDENT_RE$1 = IDENT_RE;
    const FRAGMENT = {
      begin: "<>",
      end: "</>"
    };
    const XML_SELF_CLOSING = /<[A-Za-z0-9\\._:-]+\s*\/>/;
    const XML_TAG = {
      begin: /<[A-Za-z0-9\\._:-]+/,
      end: /\/[A-Za-z0-9\\._:-]+>|\/>/,
      /**
       * @param {RegExpMatchArray} match
       * @param {CallbackResponse} response
       */
      isTrulyOpeningTag: (match, response) => {
        const afterMatchIndex = match[0].length + match.index;
        const nextChar = match.input[afterMatchIndex];
        if (
          // HTML should not include another raw `<` inside a tag
          // nested type?
          // `<Array<Array<number>>`, etc.
          nextChar === "<" || // the , gives away that this is not HTML
          // `<T, A extends keyof T, V>`
          nextChar === ","
        ) {
          response.ignoreMatch();
          return;
        }
        if (nextChar === ">") {
          if (!hasClosingTag(match, { after: afterMatchIndex })) {
            response.ignoreMatch();
          }
        }
        let m;
        const afterMatch = match.input.substring(afterMatchIndex);
        if (m = afterMatch.match(/^\s*=/)) {
          response.ignoreMatch();
          return;
        }
        if (m = afterMatch.match(/^\s+extends\s+/)) {
          if (m.index === 0) {
            response.ignoreMatch();
            return;
          }
        }
      }
    };
    const KEYWORDS$1 = {
      $pattern: IDENT_RE,
      keyword: KEYWORDS,
      literal: LITERALS,
      built_in: BUILT_INS,
      "variable.language": BUILT_IN_VARIABLES
    };
    const decimalDigits2 = "[0-9](_?[0-9])*";
    const frac2 = `\\.(${decimalDigits2})`;
    const decimalInteger = `0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*`;
    const NUMBER = {
      className: "number",
      variants: [
        // DecimalLiteral
        { begin: `(\\b(${decimalInteger})((${frac2})|\\.)?|(${frac2}))[eE][+-]?(${decimalDigits2})\\b` },
        { begin: `\\b(${decimalInteger})\\b((${frac2})\\b|\\.)?|(${frac2})\\b` },
        // DecimalBigIntegerLiteral
        { begin: `\\b(0|[1-9](_?[0-9])*)n\\b` },
        // NonDecimalIntegerLiteral
        { begin: "\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*n?\\b" },
        { begin: "\\b0[bB][0-1](_?[0-1])*n?\\b" },
        { begin: "\\b0[oO][0-7](_?[0-7])*n?\\b" },
        // LegacyOctalIntegerLiteral (does not include underscore separators)
        // https://tc39.es/ecma262/#sec-additional-syntax-numeric-literals
        { begin: "\\b0[0-7]+n?\\b" }
      ],
      relevance: 0
    };
    const SUBST = {
      className: "subst",
      begin: "\\$\\{",
      end: "\\}",
      keywords: KEYWORDS$1,
      contains: []
      // defined later
    };
    const HTML_TEMPLATE = {
      begin: ".?html`",
      end: "",
      starts: {
        end: "`",
        returnEnd: false,
        contains: [
          hljs.BACKSLASH_ESCAPE,
          SUBST
        ],
        subLanguage: "xml"
      }
    };
    const CSS_TEMPLATE = {
      begin: ".?css`",
      end: "",
      starts: {
        end: "`",
        returnEnd: false,
        contains: [
          hljs.BACKSLASH_ESCAPE,
          SUBST
        ],
        subLanguage: "css"
      }
    };
    const GRAPHQL_TEMPLATE = {
      begin: ".?gql`",
      end: "",
      starts: {
        end: "`",
        returnEnd: false,
        contains: [
          hljs.BACKSLASH_ESCAPE,
          SUBST
        ],
        subLanguage: "graphql"
      }
    };
    const TEMPLATE_STRING = {
      className: "string",
      begin: "`",
      end: "`",
      contains: [
        hljs.BACKSLASH_ESCAPE,
        SUBST
      ]
    };
    const JSDOC_COMMENT = hljs.COMMENT(
      /\/\*\*(?!\/)/,
      "\\*/",
      {
        relevance: 0,
        contains: [
          {
            begin: "(?=@[A-Za-z]+)",
            relevance: 0,
            contains: [
              {
                className: "doctag",
                begin: "@[A-Za-z]+"
              },
              {
                className: "type",
                begin: "\\{",
                end: "\\}",
                excludeEnd: true,
                excludeBegin: true,
                relevance: 0
              },
              {
                className: "variable",
                begin: IDENT_RE$1 + "(?=\\s*(-)|$)",
                endsParent: true,
                relevance: 0
              },
              // eat spaces (not newlines) so we can find
              // types or variables
              {
                begin: /(?=[^\n])\s/,
                relevance: 0
              }
            ]
          }
        ]
      }
    );
    const COMMENT = {
      className: "comment",
      variants: [
        JSDOC_COMMENT,
        hljs.C_BLOCK_COMMENT_MODE,
        hljs.C_LINE_COMMENT_MODE
      ]
    };
    const SUBST_INTERNALS = [
      hljs.APOS_STRING_MODE,
      hljs.QUOTE_STRING_MODE,
      HTML_TEMPLATE,
      CSS_TEMPLATE,
      GRAPHQL_TEMPLATE,
      TEMPLATE_STRING,
      // Skip numbers when they are part of a variable name
      { match: /\$\d+/ },
      NUMBER
      // This is intentional:
      // See https://github.com/highlightjs/highlight.js/issues/3288
      // hljs.REGEXP_MODE
    ];
    SUBST.contains = SUBST_INTERNALS.concat({
      // we need to pair up {} inside our subst to prevent
      // it from ending too early by matching another }
      begin: /\{/,
      end: /\}/,
      keywords: KEYWORDS$1,
      contains: [
        "self"
      ].concat(SUBST_INTERNALS)
    });
    const SUBST_AND_COMMENTS = [].concat(COMMENT, SUBST.contains);
    const PARAMS_CONTAINS = SUBST_AND_COMMENTS.concat([
      // eat recursive parens in sub expressions
      {
        begin: /(\s*)\(/,
        end: /\)/,
        keywords: KEYWORDS$1,
        contains: ["self"].concat(SUBST_AND_COMMENTS)
      }
    ]);
    const PARAMS = {
      className: "params",
      // convert this to negative lookbehind in v12
      begin: /(\s*)\(/,
      // to match the parms with
      end: /\)/,
      excludeBegin: true,
      excludeEnd: true,
      keywords: KEYWORDS$1,
      contains: PARAMS_CONTAINS
    };
    const CLASS_OR_EXTENDS = {
      variants: [
        // class Car extends vehicle
        {
          match: [
            /class/,
            /\s+/,
            IDENT_RE$1,
            /\s+/,
            /extends/,
            /\s+/,
            regex.concat(IDENT_RE$1, "(", regex.concat(/\./, IDENT_RE$1), ")*")
          ],
          scope: {
            1: "keyword",
            3: "title.class",
            5: "keyword",
            7: "title.class.inherited"
          }
        },
        // class Car
        {
          match: [
            /class/,
            /\s+/,
            IDENT_RE$1
          ],
          scope: {
            1: "keyword",
            3: "title.class"
          }
        }
      ]
    };
    const CLASS_REFERENCE = {
      relevance: 0,
      match: regex.either(
        // Hard coded exceptions
        /\bJSON/,
        // Float32Array, OutT
        /\b[A-Z][a-z]+([A-Z][a-z]*|\d)*/,
        // CSSFactory, CSSFactoryT
        /\b[A-Z]{2,}([A-Z][a-z]+|\d)+([A-Z][a-z]*)*/,
        // FPs, FPsT
        /\b[A-Z]{2,}[a-z]+([A-Z][a-z]+|\d)*([A-Z][a-z]*)*/
        // P
        // single letters are not highlighted
        // BLAH
        // this will be flagged as a UPPER_CASE_CONSTANT instead
      ),
      className: "title.class",
      keywords: {
        _: [
          // se we still get relevance credit for JS library classes
          ...TYPES,
          ...ERROR_TYPES
        ]
      }
    };
    const USE_STRICT = {
      label: "use_strict",
      className: "meta",
      relevance: 10,
      begin: /^\s*['"]use (strict|asm)['"]/
    };
    const FUNCTION_DEFINITION = {
      variants: [
        {
          match: [
            /function/,
            /\s+/,
            IDENT_RE$1,
            /(?=\s*\()/
          ]
        },
        // anonymous function
        {
          match: [
            /function/,
            /\s*(?=\()/
          ]
        }
      ],
      className: {
        1: "keyword",
        3: "title.function"
      },
      label: "func.def",
      contains: [PARAMS],
      illegal: /%/
    };
    const UPPER_CASE_CONSTANT = {
      relevance: 0,
      match: /\b[A-Z][A-Z_0-9]+\b/,
      className: "variable.constant"
    };
    function noneOf(list2) {
      return regex.concat("(?!", list2.join("|"), ")");
    }
    const FUNCTION_CALL = {
      match: regex.concat(
        /\b/,
        noneOf([
          ...BUILT_IN_GLOBALS,
          "super",
          "import"
        ].map((x) => `${x}\\s*\\(`)),
        IDENT_RE$1,
        regex.lookahead(/\s*\(/)
      ),
      className: "title.function",
      relevance: 0
    };
    const PROPERTY_ACCESS = {
      begin: regex.concat(/\./, regex.lookahead(
        regex.concat(IDENT_RE$1, /(?![0-9A-Za-z$_(])/)
      )),
      end: IDENT_RE$1,
      excludeBegin: true,
      keywords: "prototype",
      className: "property",
      relevance: 0
    };
    const GETTER_OR_SETTER = {
      match: [
        /get|set/,
        /\s+/,
        IDENT_RE$1,
        /(?=\()/
      ],
      className: {
        1: "keyword",
        3: "title.function"
      },
      contains: [
        {
          // eat to avoid empty params
          begin: /\(\)/
        },
        PARAMS
      ]
    };
    const FUNC_LEAD_IN_RE = "(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|" + hljs.UNDERSCORE_IDENT_RE + ")\\s*=>";
    const FUNCTION_VARIABLE = {
      match: [
        /const|var|let/,
        /\s+/,
        IDENT_RE$1,
        /\s*/,
        /=\s*/,
        /(async\s*)?/,
        // async is optional
        regex.lookahead(FUNC_LEAD_IN_RE)
      ],
      keywords: "async",
      className: {
        1: "keyword",
        3: "title.function"
      },
      contains: [
        PARAMS
      ]
    };
    return {
      name: "JavaScript",
      aliases: ["js", "jsx", "mjs", "cjs"],
      keywords: KEYWORDS$1,
      // this will be extended by TypeScript
      exports: { PARAMS_CONTAINS, CLASS_REFERENCE },
      illegal: /#(?![$_A-z])/,
      contains: [
        hljs.SHEBANG({
          label: "shebang",
          binary: "node",
          relevance: 5
        }),
        USE_STRICT,
        hljs.APOS_STRING_MODE,
        hljs.QUOTE_STRING_MODE,
        HTML_TEMPLATE,
        CSS_TEMPLATE,
        GRAPHQL_TEMPLATE,
        TEMPLATE_STRING,
        COMMENT,
        // Skip numbers when they are part of a variable name
        { match: /\$\d+/ },
        NUMBER,
        CLASS_REFERENCE,
        {
          scope: "attr",
          match: IDENT_RE$1 + regex.lookahead(":"),
          relevance: 0
        },
        FUNCTION_VARIABLE,
        {
          // "value" container
          begin: "(" + hljs.RE_STARTERS_RE + "|\\b(case|return|throw)\\b)\\s*",
          keywords: "return throw case",
          relevance: 0,
          contains: [
            COMMENT,
            hljs.REGEXP_MODE,
            {
              className: "function",
              // we have to count the parens to make sure we actually have the
              // correct bounding ( ) before the =>.  There could be any number of
              // sub-expressions inside also surrounded by parens.
              begin: FUNC_LEAD_IN_RE,
              returnBegin: true,
              end: "\\s*=>",
              contains: [
                {
                  className: "params",
                  variants: [
                    {
                      begin: hljs.UNDERSCORE_IDENT_RE,
                      relevance: 0
                    },
                    {
                      className: null,
                      begin: /\(\s*\)/,
                      skip: true
                    },
                    {
                      begin: /(\s*)\(/,
                      end: /\)/,
                      excludeBegin: true,
                      excludeEnd: true,
                      keywords: KEYWORDS$1,
                      contains: PARAMS_CONTAINS
                    }
                  ]
                }
              ]
            },
            {
              // could be a comma delimited list of params to a function call
              begin: /,/,
              relevance: 0
            },
            {
              match: /\s+/,
              relevance: 0
            },
            {
              // JSX
              variants: [
                { begin: FRAGMENT.begin, end: FRAGMENT.end },
                { match: XML_SELF_CLOSING },
                {
                  begin: XML_TAG.begin,
                  // we carefully check the opening tag to see if it truly
                  // is a tag and not a false positive
                  "on:begin": XML_TAG.isTrulyOpeningTag,
                  end: XML_TAG.end
                }
              ],
              subLanguage: "xml",
              contains: [
                {
                  begin: XML_TAG.begin,
                  end: XML_TAG.end,
                  skip: true,
                  contains: ["self"]
                }
              ]
            }
          ]
        },
        FUNCTION_DEFINITION,
        {
          // prevent this from getting swallowed up by function
          // since they appear "function like"
          beginKeywords: "while if switch catch for"
        },
        {
          // we have to count the parens to make sure we actually have the correct
          // bounding ( ).  There could be any number of sub-expressions inside
          // also surrounded by parens.
          begin: "\\b(?!function)" + hljs.UNDERSCORE_IDENT_RE + "\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)\\s*\\{",
          // end parens
          returnBegin: true,
          label: "func.def",
          contains: [
            PARAMS,
            hljs.inherit(hljs.TITLE_MODE, { begin: IDENT_RE$1, className: "title.function" })
          ]
        },
        // catch ... so it won't trigger the property rule below
        {
          match: /\.\.\./,
          relevance: 0
        },
        PROPERTY_ACCESS,
        // hack: prevents detection of keywords in some circumstances
        // .keyword()
        // $keyword = x
        {
          match: "\\$" + IDENT_RE$1,
          relevance: 0
        },
        {
          match: [/\bconstructor(?=\s*\()/],
          className: { 1: "title.function" },
          contains: [PARAMS]
        },
        FUNCTION_CALL,
        UPPER_CASE_CONSTANT,
        CLASS_OR_EXTENDS,
        GETTER_OR_SETTER,
        {
          match: /\$[(.]/
          // relevance booster for a pattern common to JS libs: `$(something)` and `$.something`
        }
      ]
    };
  }

  // node_modules/highlight.js/es/languages/typescript.js
  var IDENT_RE2 = "[A-Za-z$_][0-9A-Za-z$_]*";
  var KEYWORDS2 = [
    "as",
    // for exports
    "in",
    "of",
    "if",
    "for",
    "while",
    "finally",
    "var",
    "new",
    "function",
    "do",
    "return",
    "void",
    "else",
    "break",
    "catch",
    "instanceof",
    "with",
    "throw",
    "case",
    "default",
    "try",
    "switch",
    "continue",
    "typeof",
    "delete",
    "let",
    "yield",
    "const",
    "class",
    // JS handles these with a special rule
    // "get",
    // "set",
    "debugger",
    "async",
    "await",
    "static",
    "import",
    "from",
    "export",
    "extends",
    // It's reached stage 3, which is "recommended for implementation":
    "using"
  ];
  var LITERALS2 = [
    "true",
    "false",
    "null",
    "undefined",
    "NaN",
    "Infinity"
  ];
  var TYPES2 = [
    // Fundamental objects
    "Object",
    "Function",
    "Boolean",
    "Symbol",
    // numbers and dates
    "Math",
    "Date",
    "Number",
    "BigInt",
    // text
    "String",
    "RegExp",
    // Indexed collections
    "Array",
    "Float32Array",
    "Float64Array",
    "Int8Array",
    "Uint8Array",
    "Uint8ClampedArray",
    "Int16Array",
    "Int32Array",
    "Uint16Array",
    "Uint32Array",
    "BigInt64Array",
    "BigUint64Array",
    // Keyed collections
    "Set",
    "Map",
    "WeakSet",
    "WeakMap",
    // Structured data
    "ArrayBuffer",
    "SharedArrayBuffer",
    "Atomics",
    "DataView",
    "JSON",
    // Control abstraction objects
    "Promise",
    "Generator",
    "GeneratorFunction",
    "AsyncFunction",
    // Reflection
    "Reflect",
    "Proxy",
    // Internationalization
    "Intl",
    // WebAssembly
    "WebAssembly"
  ];
  var ERROR_TYPES2 = [
    "Error",
    "EvalError",
    "InternalError",
    "RangeError",
    "ReferenceError",
    "SyntaxError",
    "TypeError",
    "URIError"
  ];
  var BUILT_IN_GLOBALS2 = [
    "setInterval",
    "setTimeout",
    "clearInterval",
    "clearTimeout",
    "require",
    "exports",
    "eval",
    "isFinite",
    "isNaN",
    "parseFloat",
    "parseInt",
    "decodeURI",
    "decodeURIComponent",
    "encodeURI",
    "encodeURIComponent",
    "escape",
    "unescape"
  ];
  var BUILT_IN_VARIABLES2 = [
    "arguments",
    "this",
    "super",
    "console",
    "window",
    "document",
    "localStorage",
    "sessionStorage",
    "module",
    "global"
    // Node.js
  ];
  var BUILT_INS2 = [].concat(
    BUILT_IN_GLOBALS2,
    TYPES2,
    ERROR_TYPES2
  );
  function javascript2(hljs) {
    const regex = hljs.regex;
    const hasClosingTag = (match, { after }) => {
      const tag2 = "</" + match[0].slice(1);
      const pos = match.input.indexOf(tag2, after);
      return pos !== -1;
    };
    const IDENT_RE$1 = IDENT_RE2;
    const FRAGMENT = {
      begin: "<>",
      end: "</>"
    };
    const XML_SELF_CLOSING = /<[A-Za-z0-9\\._:-]+\s*\/>/;
    const XML_TAG = {
      begin: /<[A-Za-z0-9\\._:-]+/,
      end: /\/[A-Za-z0-9\\._:-]+>|\/>/,
      /**
       * @param {RegExpMatchArray} match
       * @param {CallbackResponse} response
       */
      isTrulyOpeningTag: (match, response) => {
        const afterMatchIndex = match[0].length + match.index;
        const nextChar = match.input[afterMatchIndex];
        if (
          // HTML should not include another raw `<` inside a tag
          // nested type?
          // `<Array<Array<number>>`, etc.
          nextChar === "<" || // the , gives away that this is not HTML
          // `<T, A extends keyof T, V>`
          nextChar === ","
        ) {
          response.ignoreMatch();
          return;
        }
        if (nextChar === ">") {
          if (!hasClosingTag(match, { after: afterMatchIndex })) {
            response.ignoreMatch();
          }
        }
        let m;
        const afterMatch = match.input.substring(afterMatchIndex);
        if (m = afterMatch.match(/^\s*=/)) {
          response.ignoreMatch();
          return;
        }
        if (m = afterMatch.match(/^\s+extends\s+/)) {
          if (m.index === 0) {
            response.ignoreMatch();
            return;
          }
        }
      }
    };
    const KEYWORDS$1 = {
      $pattern: IDENT_RE2,
      keyword: KEYWORDS2,
      literal: LITERALS2,
      built_in: BUILT_INS2,
      "variable.language": BUILT_IN_VARIABLES2
    };
    const decimalDigits2 = "[0-9](_?[0-9])*";
    const frac2 = `\\.(${decimalDigits2})`;
    const decimalInteger = `0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*`;
    const NUMBER = {
      className: "number",
      variants: [
        // DecimalLiteral
        { begin: `(\\b(${decimalInteger})((${frac2})|\\.)?|(${frac2}))[eE][+-]?(${decimalDigits2})\\b` },
        { begin: `\\b(${decimalInteger})\\b((${frac2})\\b|\\.)?|(${frac2})\\b` },
        // DecimalBigIntegerLiteral
        { begin: `\\b(0|[1-9](_?[0-9])*)n\\b` },
        // NonDecimalIntegerLiteral
        { begin: "\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*n?\\b" },
        { begin: "\\b0[bB][0-1](_?[0-1])*n?\\b" },
        { begin: "\\b0[oO][0-7](_?[0-7])*n?\\b" },
        // LegacyOctalIntegerLiteral (does not include underscore separators)
        // https://tc39.es/ecma262/#sec-additional-syntax-numeric-literals
        { begin: "\\b0[0-7]+n?\\b" }
      ],
      relevance: 0
    };
    const SUBST = {
      className: "subst",
      begin: "\\$\\{",
      end: "\\}",
      keywords: KEYWORDS$1,
      contains: []
      // defined later
    };
    const HTML_TEMPLATE = {
      begin: ".?html`",
      end: "",
      starts: {
        end: "`",
        returnEnd: false,
        contains: [
          hljs.BACKSLASH_ESCAPE,
          SUBST
        ],
        subLanguage: "xml"
      }
    };
    const CSS_TEMPLATE = {
      begin: ".?css`",
      end: "",
      starts: {
        end: "`",
        returnEnd: false,
        contains: [
          hljs.BACKSLASH_ESCAPE,
          SUBST
        ],
        subLanguage: "css"
      }
    };
    const GRAPHQL_TEMPLATE = {
      begin: ".?gql`",
      end: "",
      starts: {
        end: "`",
        returnEnd: false,
        contains: [
          hljs.BACKSLASH_ESCAPE,
          SUBST
        ],
        subLanguage: "graphql"
      }
    };
    const TEMPLATE_STRING = {
      className: "string",
      begin: "`",
      end: "`",
      contains: [
        hljs.BACKSLASH_ESCAPE,
        SUBST
      ]
    };
    const JSDOC_COMMENT = hljs.COMMENT(
      /\/\*\*(?!\/)/,
      "\\*/",
      {
        relevance: 0,
        contains: [
          {
            begin: "(?=@[A-Za-z]+)",
            relevance: 0,
            contains: [
              {
                className: "doctag",
                begin: "@[A-Za-z]+"
              },
              {
                className: "type",
                begin: "\\{",
                end: "\\}",
                excludeEnd: true,
                excludeBegin: true,
                relevance: 0
              },
              {
                className: "variable",
                begin: IDENT_RE$1 + "(?=\\s*(-)|$)",
                endsParent: true,
                relevance: 0
              },
              // eat spaces (not newlines) so we can find
              // types or variables
              {
                begin: /(?=[^\n])\s/,
                relevance: 0
              }
            ]
          }
        ]
      }
    );
    const COMMENT = {
      className: "comment",
      variants: [
        JSDOC_COMMENT,
        hljs.C_BLOCK_COMMENT_MODE,
        hljs.C_LINE_COMMENT_MODE
      ]
    };
    const SUBST_INTERNALS = [
      hljs.APOS_STRING_MODE,
      hljs.QUOTE_STRING_MODE,
      HTML_TEMPLATE,
      CSS_TEMPLATE,
      GRAPHQL_TEMPLATE,
      TEMPLATE_STRING,
      // Skip numbers when they are part of a variable name
      { match: /\$\d+/ },
      NUMBER
      // This is intentional:
      // See https://github.com/highlightjs/highlight.js/issues/3288
      // hljs.REGEXP_MODE
    ];
    SUBST.contains = SUBST_INTERNALS.concat({
      // we need to pair up {} inside our subst to prevent
      // it from ending too early by matching another }
      begin: /\{/,
      end: /\}/,
      keywords: KEYWORDS$1,
      contains: [
        "self"
      ].concat(SUBST_INTERNALS)
    });
    const SUBST_AND_COMMENTS = [].concat(COMMENT, SUBST.contains);
    const PARAMS_CONTAINS = SUBST_AND_COMMENTS.concat([
      // eat recursive parens in sub expressions
      {
        begin: /(\s*)\(/,
        end: /\)/,
        keywords: KEYWORDS$1,
        contains: ["self"].concat(SUBST_AND_COMMENTS)
      }
    ]);
    const PARAMS = {
      className: "params",
      // convert this to negative lookbehind in v12
      begin: /(\s*)\(/,
      // to match the parms with
      end: /\)/,
      excludeBegin: true,
      excludeEnd: true,
      keywords: KEYWORDS$1,
      contains: PARAMS_CONTAINS
    };
    const CLASS_OR_EXTENDS = {
      variants: [
        // class Car extends vehicle
        {
          match: [
            /class/,
            /\s+/,
            IDENT_RE$1,
            /\s+/,
            /extends/,
            /\s+/,
            regex.concat(IDENT_RE$1, "(", regex.concat(/\./, IDENT_RE$1), ")*")
          ],
          scope: {
            1: "keyword",
            3: "title.class",
            5: "keyword",
            7: "title.class.inherited"
          }
        },
        // class Car
        {
          match: [
            /class/,
            /\s+/,
            IDENT_RE$1
          ],
          scope: {
            1: "keyword",
            3: "title.class"
          }
        }
      ]
    };
    const CLASS_REFERENCE = {
      relevance: 0,
      match: regex.either(
        // Hard coded exceptions
        /\bJSON/,
        // Float32Array, OutT
        /\b[A-Z][a-z]+([A-Z][a-z]*|\d)*/,
        // CSSFactory, CSSFactoryT
        /\b[A-Z]{2,}([A-Z][a-z]+|\d)+([A-Z][a-z]*)*/,
        // FPs, FPsT
        /\b[A-Z]{2,}[a-z]+([A-Z][a-z]+|\d)*([A-Z][a-z]*)*/
        // P
        // single letters are not highlighted
        // BLAH
        // this will be flagged as a UPPER_CASE_CONSTANT instead
      ),
      className: "title.class",
      keywords: {
        _: [
          // se we still get relevance credit for JS library classes
          ...TYPES2,
          ...ERROR_TYPES2
        ]
      }
    };
    const USE_STRICT = {
      label: "use_strict",
      className: "meta",
      relevance: 10,
      begin: /^\s*['"]use (strict|asm)['"]/
    };
    const FUNCTION_DEFINITION = {
      variants: [
        {
          match: [
            /function/,
            /\s+/,
            IDENT_RE$1,
            /(?=\s*\()/
          ]
        },
        // anonymous function
        {
          match: [
            /function/,
            /\s*(?=\()/
          ]
        }
      ],
      className: {
        1: "keyword",
        3: "title.function"
      },
      label: "func.def",
      contains: [PARAMS],
      illegal: /%/
    };
    const UPPER_CASE_CONSTANT = {
      relevance: 0,
      match: /\b[A-Z][A-Z_0-9]+\b/,
      className: "variable.constant"
    };
    function noneOf(list2) {
      return regex.concat("(?!", list2.join("|"), ")");
    }
    const FUNCTION_CALL = {
      match: regex.concat(
        /\b/,
        noneOf([
          ...BUILT_IN_GLOBALS2,
          "super",
          "import"
        ].map((x) => `${x}\\s*\\(`)),
        IDENT_RE$1,
        regex.lookahead(/\s*\(/)
      ),
      className: "title.function",
      relevance: 0
    };
    const PROPERTY_ACCESS = {
      begin: regex.concat(/\./, regex.lookahead(
        regex.concat(IDENT_RE$1, /(?![0-9A-Za-z$_(])/)
      )),
      end: IDENT_RE$1,
      excludeBegin: true,
      keywords: "prototype",
      className: "property",
      relevance: 0
    };
    const GETTER_OR_SETTER = {
      match: [
        /get|set/,
        /\s+/,
        IDENT_RE$1,
        /(?=\()/
      ],
      className: {
        1: "keyword",
        3: "title.function"
      },
      contains: [
        {
          // eat to avoid empty params
          begin: /\(\)/
        },
        PARAMS
      ]
    };
    const FUNC_LEAD_IN_RE = "(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|" + hljs.UNDERSCORE_IDENT_RE + ")\\s*=>";
    const FUNCTION_VARIABLE = {
      match: [
        /const|var|let/,
        /\s+/,
        IDENT_RE$1,
        /\s*/,
        /=\s*/,
        /(async\s*)?/,
        // async is optional
        regex.lookahead(FUNC_LEAD_IN_RE)
      ],
      keywords: "async",
      className: {
        1: "keyword",
        3: "title.function"
      },
      contains: [
        PARAMS
      ]
    };
    return {
      name: "JavaScript",
      aliases: ["js", "jsx", "mjs", "cjs"],
      keywords: KEYWORDS$1,
      // this will be extended by TypeScript
      exports: { PARAMS_CONTAINS, CLASS_REFERENCE },
      illegal: /#(?![$_A-z])/,
      contains: [
        hljs.SHEBANG({
          label: "shebang",
          binary: "node",
          relevance: 5
        }),
        USE_STRICT,
        hljs.APOS_STRING_MODE,
        hljs.QUOTE_STRING_MODE,
        HTML_TEMPLATE,
        CSS_TEMPLATE,
        GRAPHQL_TEMPLATE,
        TEMPLATE_STRING,
        COMMENT,
        // Skip numbers when they are part of a variable name
        { match: /\$\d+/ },
        NUMBER,
        CLASS_REFERENCE,
        {
          scope: "attr",
          match: IDENT_RE$1 + regex.lookahead(":"),
          relevance: 0
        },
        FUNCTION_VARIABLE,
        {
          // "value" container
          begin: "(" + hljs.RE_STARTERS_RE + "|\\b(case|return|throw)\\b)\\s*",
          keywords: "return throw case",
          relevance: 0,
          contains: [
            COMMENT,
            hljs.REGEXP_MODE,
            {
              className: "function",
              // we have to count the parens to make sure we actually have the
              // correct bounding ( ) before the =>.  There could be any number of
              // sub-expressions inside also surrounded by parens.
              begin: FUNC_LEAD_IN_RE,
              returnBegin: true,
              end: "\\s*=>",
              contains: [
                {
                  className: "params",
                  variants: [
                    {
                      begin: hljs.UNDERSCORE_IDENT_RE,
                      relevance: 0
                    },
                    {
                      className: null,
                      begin: /\(\s*\)/,
                      skip: true
                    },
                    {
                      begin: /(\s*)\(/,
                      end: /\)/,
                      excludeBegin: true,
                      excludeEnd: true,
                      keywords: KEYWORDS$1,
                      contains: PARAMS_CONTAINS
                    }
                  ]
                }
              ]
            },
            {
              // could be a comma delimited list of params to a function call
              begin: /,/,
              relevance: 0
            },
            {
              match: /\s+/,
              relevance: 0
            },
            {
              // JSX
              variants: [
                { begin: FRAGMENT.begin, end: FRAGMENT.end },
                { match: XML_SELF_CLOSING },
                {
                  begin: XML_TAG.begin,
                  // we carefully check the opening tag to see if it truly
                  // is a tag and not a false positive
                  "on:begin": XML_TAG.isTrulyOpeningTag,
                  end: XML_TAG.end
                }
              ],
              subLanguage: "xml",
              contains: [
                {
                  begin: XML_TAG.begin,
                  end: XML_TAG.end,
                  skip: true,
                  contains: ["self"]
                }
              ]
            }
          ]
        },
        FUNCTION_DEFINITION,
        {
          // prevent this from getting swallowed up by function
          // since they appear "function like"
          beginKeywords: "while if switch catch for"
        },
        {
          // we have to count the parens to make sure we actually have the correct
          // bounding ( ).  There could be any number of sub-expressions inside
          // also surrounded by parens.
          begin: "\\b(?!function)" + hljs.UNDERSCORE_IDENT_RE + "\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)\\s*\\{",
          // end parens
          returnBegin: true,
          label: "func.def",
          contains: [
            PARAMS,
            hljs.inherit(hljs.TITLE_MODE, { begin: IDENT_RE$1, className: "title.function" })
          ]
        },
        // catch ... so it won't trigger the property rule below
        {
          match: /\.\.\./,
          relevance: 0
        },
        PROPERTY_ACCESS,
        // hack: prevents detection of keywords in some circumstances
        // .keyword()
        // $keyword = x
        {
          match: "\\$" + IDENT_RE$1,
          relevance: 0
        },
        {
          match: [/\bconstructor(?=\s*\()/],
          className: { 1: "title.function" },
          contains: [PARAMS]
        },
        FUNCTION_CALL,
        UPPER_CASE_CONSTANT,
        CLASS_OR_EXTENDS,
        GETTER_OR_SETTER,
        {
          match: /\$[(.]/
          // relevance booster for a pattern common to JS libs: `$(something)` and `$.something`
        }
      ]
    };
  }
  function typescript(hljs) {
    const regex = hljs.regex;
    const tsLanguage = javascript2(hljs);
    const IDENT_RE$1 = IDENT_RE2;
    const TYPES3 = [
      "any",
      "void",
      "number",
      "boolean",
      "string",
      "object",
      "never",
      "symbol",
      "bigint",
      "unknown"
    ];
    const NAMESPACE = {
      begin: [
        /namespace/,
        /\s+/,
        hljs.IDENT_RE
      ],
      beginScope: {
        1: "keyword",
        3: "title.class"
      }
    };
    const INTERFACE = {
      beginKeywords: "interface",
      end: /\{/,
      excludeEnd: true,
      keywords: {
        keyword: "interface extends",
        built_in: TYPES3
      },
      contains: [tsLanguage.exports.CLASS_REFERENCE]
    };
    const USE_STRICT = {
      className: "meta",
      relevance: 10,
      begin: /^\s*['"]use strict['"]/
    };
    const TS_SPECIFIC_KEYWORDS = [
      "type",
      // "namespace",
      "interface",
      "public",
      "private",
      "protected",
      "implements",
      "declare",
      "abstract",
      "readonly",
      "enum",
      "override",
      "satisfies"
    ];
    const KEYWORDS$1 = {
      $pattern: IDENT_RE2,
      keyword: KEYWORDS2.concat(TS_SPECIFIC_KEYWORDS),
      literal: LITERALS2,
      built_in: BUILT_INS2.concat(TYPES3),
      "variable.language": BUILT_IN_VARIABLES2
    };
    const DECORATOR = {
      className: "meta",
      begin: "@" + IDENT_RE$1
    };
    const swapMode = (mode, label, replacement) => {
      const indx = mode.contains.findIndex((m) => m.label === label);
      if (indx === -1) {
        throw new Error("can not find mode to replace");
      }
      mode.contains.splice(indx, 1, replacement);
    };
    Object.assign(tsLanguage.keywords, KEYWORDS$1);
    tsLanguage.exports.PARAMS_CONTAINS.push(DECORATOR);
    const ATTRIBUTE_HIGHLIGHT = tsLanguage.contains.find((c2) => c2.scope === "attr");
    const OPTIONAL_KEY_OR_ARGUMENT = Object.assign(
      {},
      ATTRIBUTE_HIGHLIGHT,
      { match: regex.concat(IDENT_RE$1, regex.lookahead(/\s*\?:/)) }
    );
    tsLanguage.exports.PARAMS_CONTAINS.push([
      tsLanguage.exports.CLASS_REFERENCE,
      // class reference for highlighting the params types
      ATTRIBUTE_HIGHLIGHT,
      // highlight the params key
      OPTIONAL_KEY_OR_ARGUMENT
      // Added for optional property assignment highlighting
    ]);
    tsLanguage.contains = tsLanguage.contains.concat([
      DECORATOR,
      NAMESPACE,
      INTERFACE,
      OPTIONAL_KEY_OR_ARGUMENT
      // Added for optional property assignment highlighting
    ]);
    swapMode(tsLanguage, "shebang", hljs.SHEBANG());
    swapMode(tsLanguage, "use_strict", USE_STRICT);
    const functionDeclaration = tsLanguage.contains.find((m) => m.label === "func.def");
    functionDeclaration.relevance = 0;
    Object.assign(tsLanguage, {
      name: "TypeScript",
      aliases: [
        "ts",
        "tsx",
        "mts",
        "cts"
      ]
    });
    return tsLanguage;
  }

  // node_modules/highlight.js/es/languages/python.js
  function python(hljs) {
    const regex = hljs.regex;
    const IDENT_RE3 = new RegExp("[\\p{XID_Start}_]\\p{XID_Continue}*", "u");
    const RESERVED_WORDS = [
      "and",
      "as",
      "assert",
      "async",
      "await",
      "break",
      "case",
      "class",
      "continue",
      "def",
      "del",
      "elif",
      "else",
      "except",
      "finally",
      "for",
      "from",
      "global",
      "if",
      "import",
      "in",
      "is",
      "lambda",
      "match",
      "nonlocal|10",
      "not",
      "or",
      "pass",
      "raise",
      "return",
      "try",
      "while",
      "with",
      "yield"
    ];
    const BUILT_INS3 = [
      "__import__",
      "abs",
      "all",
      "any",
      "ascii",
      "bin",
      "bool",
      "breakpoint",
      "bytearray",
      "bytes",
      "callable",
      "chr",
      "classmethod",
      "compile",
      "complex",
      "delattr",
      "dict",
      "dir",
      "divmod",
      "enumerate",
      "eval",
      "exec",
      "filter",
      "float",
      "format",
      "frozenset",
      "getattr",
      "globals",
      "hasattr",
      "hash",
      "help",
      "hex",
      "id",
      "input",
      "int",
      "isinstance",
      "issubclass",
      "iter",
      "len",
      "list",
      "locals",
      "map",
      "max",
      "memoryview",
      "min",
      "next",
      "object",
      "oct",
      "open",
      "ord",
      "pow",
      "print",
      "property",
      "range",
      "repr",
      "reversed",
      "round",
      "set",
      "setattr",
      "slice",
      "sorted",
      "staticmethod",
      "str",
      "sum",
      "super",
      "tuple",
      "type",
      "vars",
      "zip"
    ];
    const LITERALS3 = [
      "__debug__",
      "Ellipsis",
      "False",
      "None",
      "NotImplemented",
      "True"
    ];
    const TYPES3 = [
      "Any",
      "Callable",
      "Coroutine",
      "Dict",
      "List",
      "Literal",
      "Generic",
      "Optional",
      "Sequence",
      "Set",
      "Tuple",
      "Type",
      "Union"
    ];
    const KEYWORDS3 = {
      $pattern: /[A-Za-z]\w+|__\w+__/,
      keyword: RESERVED_WORDS,
      built_in: BUILT_INS3,
      literal: LITERALS3,
      type: TYPES3
    };
    const PROMPT = {
      className: "meta",
      begin: /^(>>>|\.\.\.) /
    };
    const SUBST = {
      className: "subst",
      begin: /\{/,
      end: /\}/,
      keywords: KEYWORDS3,
      illegal: /#/
    };
    const LITERAL_BRACKET = {
      begin: /\{\{/,
      relevance: 0
    };
    const STRING = {
      className: "string",
      contains: [hljs.BACKSLASH_ESCAPE],
      variants: [
        {
          begin: /([uU]|[bB]|[rR]|[bB][rR]|[rR][bB])?'''/,
          end: /'''/,
          contains: [
            hljs.BACKSLASH_ESCAPE,
            PROMPT
          ],
          relevance: 10
        },
        {
          begin: /([uU]|[bB]|[rR]|[bB][rR]|[rR][bB])?"""/,
          end: /"""/,
          contains: [
            hljs.BACKSLASH_ESCAPE,
            PROMPT
          ],
          relevance: 10
        },
        {
          begin: /([fF][rR]|[rR][fF]|[fF])'''/,
          end: /'''/,
          contains: [
            hljs.BACKSLASH_ESCAPE,
            PROMPT,
            LITERAL_BRACKET,
            SUBST
          ]
        },
        {
          begin: /([fF][rR]|[rR][fF]|[fF])"""/,
          end: /"""/,
          contains: [
            hljs.BACKSLASH_ESCAPE,
            PROMPT,
            LITERAL_BRACKET,
            SUBST
          ]
        },
        {
          begin: /([uU]|[rR])'/,
          end: /'/,
          relevance: 10
        },
        {
          begin: /([uU]|[rR])"/,
          end: /"/,
          relevance: 10
        },
        {
          begin: /([bB]|[bB][rR]|[rR][bB])'/,
          end: /'/
        },
        {
          begin: /([bB]|[bB][rR]|[rR][bB])"/,
          end: /"/
        },
        {
          begin: /([fF][rR]|[rR][fF]|[fF])'/,
          end: /'/,
          contains: [
            hljs.BACKSLASH_ESCAPE,
            LITERAL_BRACKET,
            SUBST
          ]
        },
        {
          begin: /([fF][rR]|[rR][fF]|[fF])"/,
          end: /"/,
          contains: [
            hljs.BACKSLASH_ESCAPE,
            LITERAL_BRACKET,
            SUBST
          ]
        },
        hljs.APOS_STRING_MODE,
        hljs.QUOTE_STRING_MODE
      ]
    };
    const digitpart = "[0-9](_?[0-9])*";
    const pointfloat = `(\\b(${digitpart}))?\\.(${digitpart})|\\b(${digitpart})\\.`;
    const lookahead = `\\b|${RESERVED_WORDS.join("|")}`;
    const NUMBER = {
      className: "number",
      relevance: 0,
      variants: [
        // exponentfloat, pointfloat
        // https://docs.python.org/3.9/reference/lexical_analysis.html#floating-point-literals
        // optionally imaginary
        // https://docs.python.org/3.9/reference/lexical_analysis.html#imaginary-literals
        // Note: no leading \b because floats can start with a decimal point
        // and we don't want to mishandle e.g. `fn(.5)`,
        // no trailing \b for pointfloat because it can end with a decimal point
        // and we don't want to mishandle e.g. `0..hex()`; this should be safe
        // because both MUST contain a decimal point and so cannot be confused with
        // the interior part of an identifier
        {
          begin: `(\\b(${digitpart})|(${pointfloat}))[eE][+-]?(${digitpart})[jJ]?(?=${lookahead})`
        },
        {
          begin: `(${pointfloat})[jJ]?`
        },
        // decinteger, bininteger, octinteger, hexinteger
        // https://docs.python.org/3.9/reference/lexical_analysis.html#integer-literals
        // optionally "long" in Python 2
        // https://docs.python.org/2.7/reference/lexical_analysis.html#integer-and-long-integer-literals
        // decinteger is optionally imaginary
        // https://docs.python.org/3.9/reference/lexical_analysis.html#imaginary-literals
        {
          begin: `\\b([1-9](_?[0-9])*|0+(_?0)*)[lLjJ]?(?=${lookahead})`
        },
        {
          begin: `\\b0[bB](_?[01])+[lL]?(?=${lookahead})`
        },
        {
          begin: `\\b0[oO](_?[0-7])+[lL]?(?=${lookahead})`
        },
        {
          begin: `\\b0[xX](_?[0-9a-fA-F])+[lL]?(?=${lookahead})`
        },
        // imagnumber (digitpart-based)
        // https://docs.python.org/3.9/reference/lexical_analysis.html#imaginary-literals
        {
          begin: `\\b(${digitpart})[jJ](?=${lookahead})`
        }
      ]
    };
    const COMMENT_TYPE = {
      className: "comment",
      begin: regex.lookahead(/# type:/),
      end: /$/,
      keywords: KEYWORDS3,
      contains: [
        {
          // prevent keywords from coloring `type`
          begin: /# type:/
        },
        // comment within a datatype comment includes no keywords
        {
          begin: /#/,
          end: /\b\B/,
          endsWithParent: true
        }
      ]
    };
    const PARAMS = {
      className: "params",
      variants: [
        // Exclude params in functions without params
        {
          className: "",
          begin: /\(\s*\)/,
          skip: true
        },
        {
          begin: /\(/,
          end: /\)/,
          excludeBegin: true,
          excludeEnd: true,
          keywords: KEYWORDS3,
          contains: [
            "self",
            PROMPT,
            NUMBER,
            STRING,
            hljs.HASH_COMMENT_MODE
          ]
        }
      ]
    };
    SUBST.contains = [
      STRING,
      NUMBER,
      PROMPT
    ];
    return {
      name: "Python",
      aliases: [
        "py",
        "gyp",
        "ipython"
      ],
      unicodeRegex: true,
      keywords: KEYWORDS3,
      illegal: /(<\/|\?)|=>/,
      contains: [
        PROMPT,
        NUMBER,
        {
          // very common convention
          scope: "variable.language",
          match: /\bself\b/
        },
        {
          // eat "if" prior to string so that it won't accidentally be
          // labeled as an f-string
          beginKeywords: "if",
          relevance: 0
        },
        { match: /\bor\b/, scope: "keyword" },
        STRING,
        COMMENT_TYPE,
        hljs.HASH_COMMENT_MODE,
        {
          match: [
            /\bdef/,
            /\s+/,
            IDENT_RE3
          ],
          scope: {
            1: "keyword",
            3: "title.function"
          },
          contains: [PARAMS]
        },
        {
          variants: [
            {
              match: [
                /\bclass/,
                /\s+/,
                IDENT_RE3,
                /\s*/,
                /\(\s*/,
                IDENT_RE3,
                /\s*\)/
              ]
            },
            {
              match: [
                /\bclass/,
                /\s+/,
                IDENT_RE3
              ]
            }
          ],
          scope: {
            1: "keyword",
            3: "title.class",
            6: "title.class.inherited"
          }
        },
        {
          className: "meta",
          begin: /^[\t ]*@/,
          end: /(?=#)|$/,
          contains: [
            NUMBER,
            PARAMS,
            STRING
          ]
        }
      ]
    };
  }

  // node_modules/highlight.js/es/languages/bash.js
  function bash(hljs) {
    const regex = hljs.regex;
    const VAR = {};
    const BRACED_VAR = {
      begin: /\$\{/,
      end: /\}/,
      contains: [
        "self",
        {
          begin: /:-/,
          contains: [VAR]
        }
        // default values
      ]
    };
    Object.assign(VAR, {
      className: "variable",
      variants: [
        { begin: regex.concat(
          /\$[\w\d#@][\w\d_]*/,
          // negative look-ahead tries to avoid matching patterns that are not
          // Perl at all like $ident$, @ident@, etc.
          `(?![\\w\\d])(?![$])`
        ) },
        BRACED_VAR
      ]
    });
    const SUBST = {
      className: "subst",
      begin: /\$\(/,
      end: /\)/,
      contains: [hljs.BACKSLASH_ESCAPE]
    };
    const COMMENT = hljs.inherit(
      hljs.COMMENT(),
      {
        match: [
          /(^|\s)/,
          /#.*$/
        ],
        scope: {
          2: "comment"
        }
      }
    );
    const HERE_DOC = {
      begin: /<<-?\s*(?=\w+)/,
      starts: { contains: [
        hljs.END_SAME_AS_BEGIN({
          begin: /(\w+)/,
          end: /(\w+)/,
          className: "string"
        })
      ] }
    };
    const QUOTE_STRING = {
      className: "string",
      begin: /"/,
      end: /"/,
      contains: [
        hljs.BACKSLASH_ESCAPE,
        VAR,
        SUBST
      ]
    };
    SUBST.contains.push(QUOTE_STRING);
    const ESCAPED_QUOTE = {
      match: /\\"/
    };
    const APOS_STRING = {
      className: "string",
      begin: /'/,
      end: /'/
    };
    const ESCAPED_APOS = {
      match: /\\'/
    };
    const ARITHMETIC = {
      begin: /\$?\(\(/,
      end: /\)\)/,
      contains: [
        {
          begin: /\d+#[0-9a-f]+/,
          className: "number"
        },
        hljs.NUMBER_MODE,
        VAR
      ]
    };
    const SH_LIKE_SHELLS = [
      "fish",
      "bash",
      "zsh",
      "sh",
      "csh",
      "ksh",
      "tcsh",
      "dash",
      "scsh"
    ];
    const KNOWN_SHEBANG = hljs.SHEBANG({
      binary: `(${SH_LIKE_SHELLS.join("|")})`,
      relevance: 10
    });
    const FUNCTION = {
      className: "function",
      begin: /\w[\w\d_]*\s*\(\s*\)\s*\{/,
      returnBegin: true,
      contains: [hljs.inherit(hljs.TITLE_MODE, { begin: /\w[\w\d_]*/ })],
      relevance: 0
    };
    const KEYWORDS3 = [
      "if",
      "then",
      "else",
      "elif",
      "fi",
      "time",
      "for",
      "while",
      "until",
      "in",
      "do",
      "done",
      "case",
      "esac",
      "coproc",
      "function",
      "select"
    ];
    const LITERALS3 = [
      "true",
      "false"
    ];
    const PATH_MODE = { match: /(\/[a-z._-]+)+/ };
    const SHELL_BUILT_INS = [
      "break",
      "cd",
      "continue",
      "eval",
      "exec",
      "exit",
      "export",
      "getopts",
      "hash",
      "pwd",
      "readonly",
      "return",
      "shift",
      "test",
      "times",
      "trap",
      "umask",
      "unset"
    ];
    const BASH_BUILT_INS = [
      "alias",
      "bind",
      "builtin",
      "caller",
      "command",
      "declare",
      "echo",
      "enable",
      "help",
      "let",
      "local",
      "logout",
      "mapfile",
      "printf",
      "read",
      "readarray",
      "source",
      "sudo",
      "type",
      "typeset",
      "ulimit",
      "unalias"
    ];
    const ZSH_BUILT_INS = [
      "autoload",
      "bg",
      "bindkey",
      "bye",
      "cap",
      "chdir",
      "clone",
      "comparguments",
      "compcall",
      "compctl",
      "compdescribe",
      "compfiles",
      "compgroups",
      "compquote",
      "comptags",
      "comptry",
      "compvalues",
      "dirs",
      "disable",
      "disown",
      "echotc",
      "echoti",
      "emulate",
      "fc",
      "fg",
      "float",
      "functions",
      "getcap",
      "getln",
      "history",
      "integer",
      "jobs",
      "kill",
      "limit",
      "log",
      "noglob",
      "popd",
      "print",
      "pushd",
      "pushln",
      "rehash",
      "sched",
      "setcap",
      "setopt",
      "stat",
      "suspend",
      "ttyctl",
      "unfunction",
      "unhash",
      "unlimit",
      "unsetopt",
      "vared",
      "wait",
      "whence",
      "where",
      "which",
      "zcompile",
      "zformat",
      "zftp",
      "zle",
      "zmodload",
      "zparseopts",
      "zprof",
      "zpty",
      "zregexparse",
      "zsocket",
      "zstyle",
      "ztcp"
    ];
    const GNU_CORE_UTILS = [
      "chcon",
      "chgrp",
      "chown",
      "chmod",
      "cp",
      "dd",
      "df",
      "dir",
      "dircolors",
      "ln",
      "ls",
      "mkdir",
      "mkfifo",
      "mknod",
      "mktemp",
      "mv",
      "realpath",
      "rm",
      "rmdir",
      "shred",
      "sync",
      "touch",
      "truncate",
      "vdir",
      "b2sum",
      "base32",
      "base64",
      "cat",
      "cksum",
      "comm",
      "csplit",
      "cut",
      "expand",
      "fmt",
      "fold",
      "head",
      "join",
      "md5sum",
      "nl",
      "numfmt",
      "od",
      "paste",
      "ptx",
      "pr",
      "sha1sum",
      "sha224sum",
      "sha256sum",
      "sha384sum",
      "sha512sum",
      "shuf",
      "sort",
      "split",
      "sum",
      "tac",
      "tail",
      "tr",
      "tsort",
      "unexpand",
      "uniq",
      "wc",
      "arch",
      "basename",
      "chroot",
      "date",
      "dirname",
      "du",
      "echo",
      "env",
      "expr",
      "factor",
      // "false", // keyword literal already
      "groups",
      "hostid",
      "id",
      "link",
      "logname",
      "nice",
      "nohup",
      "nproc",
      "pathchk",
      "pinky",
      "printenv",
      "printf",
      "pwd",
      "readlink",
      "runcon",
      "seq",
      "sleep",
      "stat",
      "stdbuf",
      "stty",
      "tee",
      "test",
      "timeout",
      // "true", // keyword literal already
      "tty",
      "uname",
      "unlink",
      "uptime",
      "users",
      "who",
      "whoami",
      "yes"
    ];
    return {
      name: "Bash",
      aliases: [
        "sh",
        "zsh"
      ],
      keywords: {
        $pattern: /\b[a-z][a-z0-9._-]+\b/,
        keyword: KEYWORDS3,
        literal: LITERALS3,
        built_in: [
          ...SHELL_BUILT_INS,
          ...BASH_BUILT_INS,
          // Shell modifiers
          "set",
          "shopt",
          ...ZSH_BUILT_INS,
          ...GNU_CORE_UTILS
        ]
      },
      contains: [
        KNOWN_SHEBANG,
        // to catch known shells and boost relevancy
        hljs.SHEBANG(),
        // to catch unknown shells but still highlight the shebang
        FUNCTION,
        ARITHMETIC,
        COMMENT,
        HERE_DOC,
        PATH_MODE,
        QUOTE_STRING,
        ESCAPED_QUOTE,
        APOS_STRING,
        ESCAPED_APOS,
        VAR
      ]
    };
  }

  // node_modules/highlight.js/es/languages/cpp.js
  function cpp(hljs) {
    const regex = hljs.regex;
    const C_LINE_COMMENT_MODE = hljs.COMMENT("//", "$", { contains: [{ begin: /\\\n/ }] });
    const DECLTYPE_AUTO_RE = "decltype\\(auto\\)";
    const NAMESPACE_RE = "[a-zA-Z_]\\w*::";
    const TEMPLATE_ARGUMENT_RE = "<[^<>]+>";
    const FUNCTION_TYPE_RE = "(?!struct)(" + DECLTYPE_AUTO_RE + "|" + regex.optional(NAMESPACE_RE) + "[a-zA-Z_]\\w*" + regex.optional(TEMPLATE_ARGUMENT_RE) + ")";
    const CPP_PRIMITIVE_TYPES = {
      className: "type",
      begin: "\\b[a-z\\d_]*_t\\b"
    };
    const CHARACTER_ESCAPES = "\\\\(x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4,8}|[0-7]{3}|\\S)";
    const STRINGS2 = {
      className: "string",
      variants: [
        {
          begin: '(u8?|U|L)?"',
          end: '"',
          illegal: "\\n",
          contains: [hljs.BACKSLASH_ESCAPE]
        },
        {
          begin: "(u8?|U|L)?'(" + CHARACTER_ESCAPES + "|.)",
          end: "'",
          illegal: "."
        },
        hljs.END_SAME_AS_BEGIN({
          begin: /(?:u8?|U|L)?R"([^()\\ ]{0,16})\(/,
          end: /\)([^()\\ ]{0,16})"/
        })
      ]
    };
    const NUMBERS = {
      className: "number",
      variants: [
        // Floating-point literal.
        {
          begin: "[+-]?(?:(?:[0-9](?:'?[0-9])*\\.(?:[0-9](?:'?[0-9])*)?|\\.[0-9](?:'?[0-9])*)(?:[Ee][+-]?[0-9](?:'?[0-9])*)?|[0-9](?:'?[0-9])*[Ee][+-]?[0-9](?:'?[0-9])*|0[Xx](?:[0-9A-Fa-f](?:'?[0-9A-Fa-f])*(?:\\.(?:[0-9A-Fa-f](?:'?[0-9A-Fa-f])*)?)?|\\.[0-9A-Fa-f](?:'?[0-9A-Fa-f])*)[Pp][+-]?[0-9](?:'?[0-9])*)(?:[Ff](?:16|32|64|128)?|(BF|bf)16|[Ll]|)"
        },
        // Integer literal.
        {
          begin: "[+-]?\\b(?:0[Bb][01](?:'?[01])*|0[Xx][0-9A-Fa-f](?:'?[0-9A-Fa-f])*|0(?:'?[0-7])*|[1-9](?:'?[0-9])*)(?:[Uu](?:LL?|ll?)|[Uu][Zz]?|(?:LL?|ll?)[Uu]?|[Zz][Uu]|)"
          // Note: there are user-defined literal suffixes too, but perhaps having the custom suffix not part of the
          // literal highlight actually makes it stand out more.
        }
      ],
      relevance: 0
    };
    const PREPROCESSOR = {
      className: "meta",
      begin: /#\s*[a-z]+\b/,
      end: /$/,
      keywords: { keyword: "if else elif endif define undef warning error line pragma _Pragma ifdef ifndef include" },
      contains: [
        {
          begin: /\\\n/,
          relevance: 0
        },
        hljs.inherit(STRINGS2, { className: "string" }),
        {
          className: "string",
          begin: /<.*?>/
        },
        C_LINE_COMMENT_MODE,
        hljs.C_BLOCK_COMMENT_MODE
      ]
    };
    const TITLE_MODE = {
      className: "title",
      begin: regex.optional(NAMESPACE_RE) + hljs.IDENT_RE,
      relevance: 0
    };
    const FUNCTION_TITLE = regex.optional(NAMESPACE_RE) + hljs.IDENT_RE + "\\s*\\(";
    const RESERVED_KEYWORDS = [
      "alignas",
      "alignof",
      "and",
      "and_eq",
      "asm",
      "atomic_cancel",
      "atomic_commit",
      "atomic_noexcept",
      "auto",
      "bitand",
      "bitor",
      "break",
      "case",
      "catch",
      "class",
      "co_await",
      "co_return",
      "co_yield",
      "compl",
      "concept",
      "const_cast|10",
      "consteval",
      "constexpr",
      "constinit",
      "continue",
      "decltype",
      "default",
      "delete",
      "do",
      "dynamic_cast|10",
      "else",
      "enum",
      "explicit",
      "export",
      "extern",
      "false",
      "final",
      "for",
      "friend",
      "goto",
      "if",
      "import",
      "inline",
      "module",
      "mutable",
      "namespace",
      "new",
      "noexcept",
      "not",
      "not_eq",
      "nullptr",
      "operator",
      "or",
      "or_eq",
      "override",
      "private",
      "protected",
      "public",
      "reflexpr",
      "register",
      "reinterpret_cast|10",
      "requires",
      "return",
      "sizeof",
      "static_assert",
      "static_cast|10",
      "struct",
      "switch",
      "synchronized",
      "template",
      "this",
      "thread_local",
      "throw",
      "transaction_safe",
      "transaction_safe_dynamic",
      "true",
      "try",
      "typedef",
      "typeid",
      "typename",
      "union",
      "using",
      "virtual",
      "volatile",
      "while",
      "xor",
      "xor_eq"
    ];
    const RESERVED_TYPES = [
      "bool",
      "char",
      "char16_t",
      "char32_t",
      "char8_t",
      "double",
      "float",
      "int",
      "long",
      "short",
      "void",
      "wchar_t",
      "unsigned",
      "signed",
      "const",
      "static"
    ];
    const TYPE_HINTS = [
      "any",
      "auto_ptr",
      "barrier",
      "binary_semaphore",
      "bitset",
      "complex",
      "condition_variable",
      "condition_variable_any",
      "counting_semaphore",
      "deque",
      "false_type",
      "flat_map",
      "flat_set",
      "future",
      "imaginary",
      "initializer_list",
      "istringstream",
      "jthread",
      "latch",
      "lock_guard",
      "multimap",
      "multiset",
      "mutex",
      "optional",
      "ostringstream",
      "packaged_task",
      "pair",
      "promise",
      "priority_queue",
      "queue",
      "recursive_mutex",
      "recursive_timed_mutex",
      "scoped_lock",
      "set",
      "shared_future",
      "shared_lock",
      "shared_mutex",
      "shared_timed_mutex",
      "shared_ptr",
      "stack",
      "string_view",
      "stringstream",
      "timed_mutex",
      "thread",
      "true_type",
      "tuple",
      "unique_lock",
      "unique_ptr",
      "unordered_map",
      "unordered_multimap",
      "unordered_multiset",
      "unordered_set",
      "variant",
      "vector",
      "weak_ptr",
      "wstring",
      "wstring_view"
    ];
    const FUNCTION_HINTS = [
      "abort",
      "abs",
      "acos",
      "apply",
      "as_const",
      "asin",
      "atan",
      "atan2",
      "calloc",
      "ceil",
      "cerr",
      "cin",
      "clog",
      "cos",
      "cosh",
      "cout",
      "declval",
      "endl",
      "exchange",
      "exit",
      "exp",
      "fabs",
      "floor",
      "fmod",
      "forward",
      "fprintf",
      "fputs",
      "free",
      "frexp",
      "fscanf",
      "future",
      "invoke",
      "isalnum",
      "isalpha",
      "iscntrl",
      "isdigit",
      "isgraph",
      "islower",
      "isprint",
      "ispunct",
      "isspace",
      "isupper",
      "isxdigit",
      "labs",
      "launder",
      "ldexp",
      "log",
      "log10",
      "make_pair",
      "make_shared",
      "make_shared_for_overwrite",
      "make_tuple",
      "make_unique",
      "malloc",
      "memchr",
      "memcmp",
      "memcpy",
      "memset",
      "modf",
      "move",
      "pow",
      "printf",
      "putchar",
      "puts",
      "realloc",
      "scanf",
      "sin",
      "sinh",
      "snprintf",
      "sprintf",
      "sqrt",
      "sscanf",
      "std",
      "stderr",
      "stdin",
      "stdout",
      "strcat",
      "strchr",
      "strcmp",
      "strcpy",
      "strcspn",
      "strlen",
      "strncat",
      "strncmp",
      "strncpy",
      "strpbrk",
      "strrchr",
      "strspn",
      "strstr",
      "swap",
      "tan",
      "tanh",
      "terminate",
      "to_underlying",
      "tolower",
      "toupper",
      "vfprintf",
      "visit",
      "vprintf",
      "vsprintf"
    ];
    const LITERALS3 = [
      "NULL",
      "false",
      "nullopt",
      "nullptr",
      "true"
    ];
    const BUILT_IN = ["_Pragma"];
    const CPP_KEYWORDS = {
      type: RESERVED_TYPES,
      keyword: RESERVED_KEYWORDS,
      literal: LITERALS3,
      built_in: BUILT_IN,
      _type_hints: TYPE_HINTS
    };
    const FUNCTION_DISPATCH = {
      className: "function.dispatch",
      relevance: 0,
      keywords: {
        // Only for relevance, not highlighting.
        _hint: FUNCTION_HINTS
      },
      begin: regex.concat(
        /\b/,
        /(?!decltype)/,
        /(?!if)/,
        /(?!for)/,
        /(?!switch)/,
        /(?!while)/,
        hljs.IDENT_RE,
        regex.lookahead(/(<[^<>]+>|)\s*\(/)
      )
    };
    const EXPRESSION_CONTAINS = [
      FUNCTION_DISPATCH,
      PREPROCESSOR,
      CPP_PRIMITIVE_TYPES,
      C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      NUMBERS,
      STRINGS2
    ];
    const EXPRESSION_CONTEXT = {
      // This mode covers expression context where we can't expect a function
      // definition and shouldn't highlight anything that looks like one:
      // `return some()`, `else if()`, `(x*sum(1, 2))`
      variants: [
        {
          begin: /=/,
          end: /;/
        },
        {
          begin: /\(/,
          end: /\)/
        },
        {
          beginKeywords: "new throw return else",
          end: /;/
        }
      ],
      keywords: CPP_KEYWORDS,
      contains: EXPRESSION_CONTAINS.concat([
        {
          begin: /\(/,
          end: /\)/,
          keywords: CPP_KEYWORDS,
          contains: EXPRESSION_CONTAINS.concat(["self"]),
          relevance: 0
        }
      ]),
      relevance: 0
    };
    const FUNCTION_DECLARATION = {
      className: "function",
      begin: "(" + FUNCTION_TYPE_RE + "[\\*&\\s]+)+" + FUNCTION_TITLE,
      returnBegin: true,
      end: /[{;=]/,
      excludeEnd: true,
      keywords: CPP_KEYWORDS,
      illegal: /[^\w\s\*&:<>.]/,
      contains: [
        {
          // to prevent it from being confused as the function title
          begin: DECLTYPE_AUTO_RE,
          keywords: CPP_KEYWORDS,
          relevance: 0
        },
        {
          begin: FUNCTION_TITLE,
          returnBegin: true,
          contains: [TITLE_MODE],
          relevance: 0
        },
        // needed because we do not have look-behind on the below rule
        // to prevent it from grabbing the final : in a :: pair
        {
          begin: /::/,
          relevance: 0
        },
        // initializers
        {
          begin: /:/,
          endsWithParent: true,
          contains: [
            STRINGS2,
            NUMBERS
          ]
        },
        // allow for multiple declarations, e.g.:
        // extern void f(int), g(char);
        {
          relevance: 0,
          match: /,/
        },
        {
          className: "params",
          begin: /\(/,
          end: /\)/,
          keywords: CPP_KEYWORDS,
          relevance: 0,
          contains: [
            C_LINE_COMMENT_MODE,
            hljs.C_BLOCK_COMMENT_MODE,
            STRINGS2,
            NUMBERS,
            CPP_PRIMITIVE_TYPES,
            // Count matching parentheses.
            {
              begin: /\(/,
              end: /\)/,
              keywords: CPP_KEYWORDS,
              relevance: 0,
              contains: [
                "self",
                C_LINE_COMMENT_MODE,
                hljs.C_BLOCK_COMMENT_MODE,
                STRINGS2,
                NUMBERS,
                CPP_PRIMITIVE_TYPES
              ]
            }
          ]
        },
        CPP_PRIMITIVE_TYPES,
        C_LINE_COMMENT_MODE,
        hljs.C_BLOCK_COMMENT_MODE,
        PREPROCESSOR
      ]
    };
    return {
      name: "C++",
      aliases: [
        "cc",
        "c++",
        "h++",
        "hpp",
        "hh",
        "hxx",
        "cxx"
      ],
      keywords: CPP_KEYWORDS,
      illegal: "</",
      classNameAliases: { "function.dispatch": "built_in" },
      contains: [].concat(
        EXPRESSION_CONTEXT,
        FUNCTION_DECLARATION,
        FUNCTION_DISPATCH,
        EXPRESSION_CONTAINS,
        [
          PREPROCESSOR,
          {
            // containers: ie, `vector <int> rooms (9);`
            begin: "\\b(deque|list|queue|priority_queue|pair|stack|vector|map|set|bitset|multiset|multimap|unordered_map|unordered_set|unordered_multiset|unordered_multimap|array|tuple|optional|variant|function|flat_map|flat_set)\\s*<(?!<)",
            end: ">",
            keywords: CPP_KEYWORDS,
            contains: [
              "self",
              CPP_PRIMITIVE_TYPES
            ]
          },
          {
            begin: hljs.IDENT_RE + "::",
            keywords: CPP_KEYWORDS
          },
          {
            match: [
              // extra complexity to deal with `enum class` and `enum struct`
              /\b(?:enum(?:\s+(?:class|struct))?|class|struct|union)/,
              /\s+/,
              /\w+/
            ],
            className: {
              1: "keyword",
              3: "title.class"
            }
          }
        ]
      )
    };
  }

  // node_modules/highlight.js/es/languages/java.js
  var decimalDigits = "[0-9](_*[0-9])*";
  var frac = `\\.(${decimalDigits})`;
  var hexDigits = "[0-9a-fA-F](_*[0-9a-fA-F])*";
  var NUMERIC = {
    className: "number",
    variants: [
      // DecimalFloatingPointLiteral
      // including ExponentPart
      { begin: `(\\b(${decimalDigits})((${frac})|\\.)?|(${frac}))[eE][+-]?(${decimalDigits})[fFdD]?\\b` },
      // excluding ExponentPart
      { begin: `\\b(${decimalDigits})((${frac})[fFdD]?\\b|\\.([fFdD]\\b)?)` },
      { begin: `(${frac})[fFdD]?\\b` },
      { begin: `\\b(${decimalDigits})[fFdD]\\b` },
      // HexadecimalFloatingPointLiteral
      { begin: `\\b0[xX]((${hexDigits})\\.?|(${hexDigits})?\\.(${hexDigits}))[pP][+-]?(${decimalDigits})[fFdD]?\\b` },
      // DecimalIntegerLiteral
      { begin: "\\b(0|[1-9](_*[0-9])*)[lL]?\\b" },
      // HexIntegerLiteral
      { begin: `\\b0[xX](${hexDigits})[lL]?\\b` },
      // OctalIntegerLiteral
      { begin: "\\b0(_*[0-7])*[lL]?\\b" },
      // BinaryIntegerLiteral
      { begin: "\\b0[bB][01](_*[01])*[lL]?\\b" }
    ],
    relevance: 0
  };
  function recurRegex(re, substitution, depth) {
    if (depth === -1) return "";
    return re.replace(substitution, (_) => {
      return recurRegex(re, substitution, depth - 1);
    });
  }
  function java(hljs) {
    const regex = hljs.regex;
    const JAVA_IDENT_RE = "[\xC0-\u02B8a-zA-Z_$][\xC0-\u02B8a-zA-Z_$0-9]*";
    const GENERIC_IDENT_RE = JAVA_IDENT_RE + recurRegex("(?:<" + JAVA_IDENT_RE + "~~~(?:\\s*,\\s*" + JAVA_IDENT_RE + "~~~)*>)?", /~~~/g, 2);
    const MAIN_KEYWORDS = [
      "synchronized",
      "abstract",
      "private",
      "var",
      "static",
      "if",
      "const ",
      "for",
      "while",
      "strictfp",
      "finally",
      "protected",
      "import",
      "native",
      "final",
      "void",
      "enum",
      "else",
      "break",
      "transient",
      "catch",
      "instanceof",
      "volatile",
      "case",
      "assert",
      "package",
      "default",
      "public",
      "try",
      "switch",
      "continue",
      "throws",
      "protected",
      "public",
      "private",
      "module",
      "requires",
      "exports",
      "do",
      "sealed",
      "yield",
      "permits",
      "goto",
      "when"
    ];
    const BUILT_INS3 = [
      "super",
      "this"
    ];
    const LITERALS3 = [
      "false",
      "true",
      "null"
    ];
    const TYPES3 = [
      "char",
      "boolean",
      "long",
      "float",
      "int",
      "byte",
      "short",
      "double"
    ];
    const KEYWORDS3 = {
      keyword: MAIN_KEYWORDS,
      literal: LITERALS3,
      type: TYPES3,
      built_in: BUILT_INS3
    };
    const ANNOTATION = {
      className: "meta",
      begin: "@" + JAVA_IDENT_RE,
      contains: [
        {
          begin: /\(/,
          end: /\)/,
          contains: ["self"]
          // allow nested () inside our annotation
        }
      ]
    };
    const PARAMS = {
      className: "params",
      begin: /\(/,
      end: /\)/,
      keywords: KEYWORDS3,
      relevance: 0,
      contains: [hljs.C_BLOCK_COMMENT_MODE],
      endsParent: true
    };
    return {
      name: "Java",
      aliases: ["jsp"],
      keywords: KEYWORDS3,
      illegal: /<\/|#/,
      contains: [
        hljs.COMMENT(
          "/\\*\\*",
          "\\*/",
          {
            relevance: 0,
            contains: [
              {
                // eat up @'s in emails to prevent them to be recognized as doctags
                begin: /\w+@/,
                relevance: 0
              },
              {
                className: "doctag",
                begin: "@[A-Za-z]+"
              }
            ]
          }
        ),
        // relevance boost
        {
          begin: /import java\.[a-z]+\./,
          keywords: "import",
          relevance: 2
        },
        hljs.C_LINE_COMMENT_MODE,
        hljs.C_BLOCK_COMMENT_MODE,
        {
          begin: /"""/,
          end: /"""/,
          className: "string",
          contains: [hljs.BACKSLASH_ESCAPE]
        },
        hljs.APOS_STRING_MODE,
        hljs.QUOTE_STRING_MODE,
        {
          match: [
            /\b(?:class|interface|enum|extends|implements|new)/,
            /\s+/,
            JAVA_IDENT_RE
          ],
          className: {
            1: "keyword",
            3: "title.class"
          }
        },
        {
          // Exceptions for hyphenated keywords
          match: /non-sealed/,
          scope: "keyword"
        },
        {
          begin: [
            regex.concat(/(?!else)/, JAVA_IDENT_RE),
            /\s+/,
            JAVA_IDENT_RE,
            /\s+/,
            /=(?!=)/
          ],
          className: {
            1: "type",
            3: "variable",
            5: "operator"
          }
        },
        {
          begin: [
            /record/,
            /\s+/,
            JAVA_IDENT_RE
          ],
          className: {
            1: "keyword",
            3: "title.class"
          },
          contains: [
            PARAMS,
            hljs.C_LINE_COMMENT_MODE,
            hljs.C_BLOCK_COMMENT_MODE
          ]
        },
        {
          // Expression keywords prevent 'keyword Name(...)' from being
          // recognized as a function definition
          beginKeywords: "new throw return else",
          relevance: 0
        },
        {
          begin: [
            "(?:" + GENERIC_IDENT_RE + "\\s+)",
            hljs.UNDERSCORE_IDENT_RE,
            /\s*(?=\()/
          ],
          className: { 2: "title.function" },
          keywords: KEYWORDS3,
          contains: [
            {
              className: "params",
              begin: /\(/,
              end: /\)/,
              keywords: KEYWORDS3,
              relevance: 0,
              contains: [
                ANNOTATION,
                hljs.APOS_STRING_MODE,
                hljs.QUOTE_STRING_MODE,
                NUMERIC,
                hljs.C_BLOCK_COMMENT_MODE
              ]
            },
            hljs.C_LINE_COMMENT_MODE,
            hljs.C_BLOCK_COMMENT_MODE
          ]
        },
        NUMERIC,
        ANNOTATION
      ]
    };
  }

  // node_modules/highlight.js/es/languages/go.js
  function go(hljs) {
    const LITERALS3 = [
      "true",
      "false",
      "iota",
      "nil"
    ];
    const BUILT_INS3 = [
      "append",
      "cap",
      "close",
      "complex",
      "copy",
      "imag",
      "len",
      "make",
      "new",
      "panic",
      "print",
      "println",
      "real",
      "recover",
      "delete"
    ];
    const TYPES3 = [
      "bool",
      "byte",
      "complex64",
      "complex128",
      "error",
      "float32",
      "float64",
      "int8",
      "int16",
      "int32",
      "int64",
      "string",
      "uint8",
      "uint16",
      "uint32",
      "uint64",
      "int",
      "uint",
      "uintptr",
      "rune"
    ];
    const KWS = [
      "break",
      "case",
      "chan",
      "const",
      "continue",
      "default",
      "defer",
      "else",
      "fallthrough",
      "for",
      "func",
      "go",
      "goto",
      "if",
      "import",
      "interface",
      "map",
      "package",
      "range",
      "return",
      "select",
      "struct",
      "switch",
      "type",
      "var"
    ];
    const KEYWORDS3 = {
      keyword: KWS,
      type: TYPES3,
      literal: LITERALS3,
      built_in: BUILT_INS3
    };
    return {
      name: "Go",
      aliases: ["golang"],
      keywords: KEYWORDS3,
      illegal: "</",
      contains: [
        hljs.C_LINE_COMMENT_MODE,
        hljs.C_BLOCK_COMMENT_MODE,
        {
          className: "string",
          variants: [
            hljs.QUOTE_STRING_MODE,
            hljs.APOS_STRING_MODE,
            {
              begin: "`",
              end: "`"
            }
          ]
        },
        {
          className: "number",
          variants: [
            {
              match: /-?\b0[xX]\.[a-fA-F0-9](_?[a-fA-F0-9])*[pP][+-]?\d(_?\d)*i?/,
              // hex without a present digit before . (making a digit afterwards required)
              relevance: 0
            },
            {
              match: /-?\b0[xX](_?[a-fA-F0-9])+((\.([a-fA-F0-9](_?[a-fA-F0-9])*)?)?[pP][+-]?\d(_?\d)*)?i?/,
              // hex with a present digit before . (making a digit afterwards optional)
              relevance: 0
            },
            {
              match: /-?\b0[oO](_?[0-7])*i?/,
              // leading 0o octal
              relevance: 0
            },
            {
              match: /-?\.\d(_?\d)*([eE][+-]?\d(_?\d)*)?i?/,
              // decimal without a present digit before . (making a digit afterwards required)
              relevance: 0
            },
            {
              match: /-?\b\d(_?\d)*(\.(\d(_?\d)*)?)?([eE][+-]?\d(_?\d)*)?i?/,
              // decimal with a present digit before . (making a digit afterwards optional)
              relevance: 0
            }
          ]
        },
        {
          begin: /:=/
          // relevance booster
        },
        {
          className: "function",
          beginKeywords: "func",
          end: "\\s*(\\{|$)",
          excludeEnd: true,
          contains: [
            hljs.TITLE_MODE,
            {
              className: "params",
              begin: /\(/,
              end: /\)/,
              endsParent: true,
              keywords: KEYWORDS3,
              illegal: /["']/
            }
          ]
        }
      ]
    };
  }

  // node_modules/highlight.js/es/languages/rust.js
  function rust(hljs) {
    const regex = hljs.regex;
    const RAW_IDENTIFIER = /(r#)?/;
    const UNDERSCORE_IDENT_RE = regex.concat(RAW_IDENTIFIER, hljs.UNDERSCORE_IDENT_RE);
    const IDENT_RE3 = regex.concat(RAW_IDENTIFIER, hljs.IDENT_RE);
    const FUNCTION_INVOKE = {
      className: "title.function.invoke",
      relevance: 0,
      begin: regex.concat(
        /\b/,
        /(?!let|for|while|if|else|match\b)/,
        IDENT_RE3,
        regex.lookahead(/\s*\(/)
      )
    };
    const NUMBER_SUFFIX = "([ui](8|16|32|64|128|size)|f(32|64))?";
    const KEYWORDS3 = [
      "abstract",
      "as",
      "async",
      "await",
      "become",
      "box",
      "break",
      "const",
      "continue",
      "crate",
      "do",
      "dyn",
      "else",
      "enum",
      "extern",
      "false",
      "final",
      "fn",
      "for",
      "if",
      "impl",
      "in",
      "let",
      "loop",
      "macro",
      "match",
      "mod",
      "move",
      "mut",
      "override",
      "priv",
      "pub",
      "ref",
      "return",
      "self",
      "Self",
      "static",
      "struct",
      "super",
      "trait",
      "true",
      "try",
      "type",
      "typeof",
      "union",
      "unsafe",
      "unsized",
      "use",
      "virtual",
      "where",
      "while",
      "yield"
    ];
    const LITERALS3 = [
      "true",
      "false",
      "Some",
      "None",
      "Ok",
      "Err"
    ];
    const BUILTINS = [
      // functions
      "drop ",
      // traits
      "Copy",
      "Send",
      "Sized",
      "Sync",
      "Drop",
      "Fn",
      "FnMut",
      "FnOnce",
      "ToOwned",
      "Clone",
      "Debug",
      "PartialEq",
      "PartialOrd",
      "Eq",
      "Ord",
      "AsRef",
      "AsMut",
      "Into",
      "From",
      "Default",
      "Iterator",
      "Extend",
      "IntoIterator",
      "DoubleEndedIterator",
      "ExactSizeIterator",
      "SliceConcatExt",
      "ToString",
      // macros
      "assert!",
      "assert_eq!",
      "bitflags!",
      "bytes!",
      "cfg!",
      "col!",
      "concat!",
      "concat_idents!",
      "debug_assert!",
      "debug_assert_eq!",
      "env!",
      "eprintln!",
      "panic!",
      "file!",
      "format!",
      "format_args!",
      "include_bytes!",
      "include_str!",
      "line!",
      "local_data_key!",
      "module_path!",
      "option_env!",
      "print!",
      "println!",
      "select!",
      "stringify!",
      "try!",
      "unimplemented!",
      "unreachable!",
      "vec!",
      "write!",
      "writeln!",
      "macro_rules!",
      "assert_ne!",
      "debug_assert_ne!"
    ];
    const TYPES3 = [
      "i8",
      "i16",
      "i32",
      "i64",
      "i128",
      "isize",
      "u8",
      "u16",
      "u32",
      "u64",
      "u128",
      "usize",
      "f32",
      "f64",
      "str",
      "char",
      "bool",
      "Box",
      "Option",
      "Result",
      "String",
      "Vec"
    ];
    return {
      name: "Rust",
      aliases: ["rs"],
      keywords: {
        $pattern: hljs.IDENT_RE + "!?",
        type: TYPES3,
        keyword: KEYWORDS3,
        literal: LITERALS3,
        built_in: BUILTINS
      },
      illegal: "</",
      contains: [
        hljs.C_LINE_COMMENT_MODE,
        hljs.COMMENT("/\\*", "\\*/", { contains: ["self"] }),
        hljs.inherit(hljs.QUOTE_STRING_MODE, {
          begin: /b?"/,
          illegal: null
        }),
        {
          className: "symbol",
          // negative lookahead to avoid matching `'`
          begin: /'[a-zA-Z_][a-zA-Z0-9_]*(?!')/
        },
        {
          scope: "string",
          variants: [
            { begin: /b?r(#*)"(.|\n)*?"\1(?!#)/ },
            {
              begin: /b?'/,
              end: /'/,
              contains: [
                {
                  scope: "char.escape",
                  match: /\\('|\w|x\w{2}|u\w{4}|U\w{8})/
                }
              ]
            }
          ]
        },
        {
          className: "number",
          variants: [
            { begin: "\\b0b([01_]+)" + NUMBER_SUFFIX },
            { begin: "\\b0o([0-7_]+)" + NUMBER_SUFFIX },
            { begin: "\\b0x([A-Fa-f0-9_]+)" + NUMBER_SUFFIX },
            { begin: "\\b(\\d[\\d_]*(\\.[0-9_]+)?([eE][+-]?[0-9_]+)?)" + NUMBER_SUFFIX }
          ],
          relevance: 0
        },
        {
          begin: [
            /fn/,
            /\s+/,
            UNDERSCORE_IDENT_RE
          ],
          className: {
            1: "keyword",
            3: "title.function"
          }
        },
        {
          className: "meta",
          begin: "#!?\\[",
          end: "\\]",
          contains: [
            {
              className: "string",
              begin: /"/,
              end: /"/,
              contains: [
                hljs.BACKSLASH_ESCAPE
              ]
            }
          ]
        },
        {
          begin: [
            /let/,
            /\s+/,
            /(?:mut\s+)?/,
            UNDERSCORE_IDENT_RE
          ],
          className: {
            1: "keyword",
            3: "keyword",
            4: "variable"
          }
        },
        // must come before impl/for rule later
        {
          begin: [
            /for/,
            /\s+/,
            UNDERSCORE_IDENT_RE,
            /\s+/,
            /in/
          ],
          className: {
            1: "keyword",
            3: "variable",
            5: "keyword"
          }
        },
        {
          begin: [
            /type/,
            /\s+/,
            UNDERSCORE_IDENT_RE
          ],
          className: {
            1: "keyword",
            3: "title.class"
          }
        },
        {
          begin: [
            /(?:trait|enum|struct|union|impl|for)/,
            /\s+/,
            UNDERSCORE_IDENT_RE
          ],
          className: {
            1: "keyword",
            3: "title.class"
          }
        },
        {
          begin: hljs.IDENT_RE + "::",
          keywords: {
            keyword: "Self",
            built_in: BUILTINS,
            type: TYPES3
          }
        },
        {
          className: "punctuation",
          begin: "->"
        },
        FUNCTION_INVOKE
      ]
    };
  }

  // node_modules/highlight.js/es/languages/sql.js
  function sql(hljs) {
    const regex = hljs.regex;
    const COMMENT_MODE = hljs.COMMENT("--", "$");
    const STRING = {
      scope: "string",
      variants: [
        {
          begin: /'/,
          end: /'/,
          contains: [{ match: /''/ }]
        }
      ]
    };
    const QUOTED_IDENTIFIER = {
      begin: /"/,
      end: /"/,
      contains: [{ match: /""/ }]
    };
    const LITERALS3 = [
      "true",
      "false",
      // Not sure it's correct to call NULL literal, and clauses like IS [NOT] NULL look strange that way.
      // "null",
      "unknown"
    ];
    const MULTI_WORD_TYPES = [
      "double precision",
      "large object",
      "with timezone",
      "without timezone"
    ];
    const TYPES3 = [
      "bigint",
      "binary",
      "blob",
      "boolean",
      "char",
      "character",
      "clob",
      "date",
      "dec",
      "decfloat",
      "decimal",
      "float",
      "int",
      "integer",
      "interval",
      "nchar",
      "nclob",
      "national",
      "numeric",
      "real",
      "row",
      "smallint",
      "time",
      "timestamp",
      "varchar",
      "varying",
      // modifier (character varying)
      "varbinary"
    ];
    const NON_RESERVED_WORDS = [
      "add",
      "asc",
      "collation",
      "desc",
      "final",
      "first",
      "last",
      "view"
    ];
    const RESERVED_WORDS = [
      "abs",
      "acos",
      "all",
      "allocate",
      "alter",
      "and",
      "any",
      "are",
      "array",
      "array_agg",
      "array_max_cardinality",
      "as",
      "asensitive",
      "asin",
      "asymmetric",
      "at",
      "atan",
      "atomic",
      "authorization",
      "avg",
      "begin",
      "begin_frame",
      "begin_partition",
      "between",
      "bigint",
      "binary",
      "blob",
      "boolean",
      "both",
      "by",
      "call",
      "called",
      "cardinality",
      "cascaded",
      "case",
      "cast",
      "ceil",
      "ceiling",
      "char",
      "char_length",
      "character",
      "character_length",
      "check",
      "classifier",
      "clob",
      "close",
      "coalesce",
      "collate",
      "collect",
      "column",
      "commit",
      "condition",
      "connect",
      "constraint",
      "contains",
      "convert",
      "copy",
      "corr",
      "corresponding",
      "cos",
      "cosh",
      "count",
      "covar_pop",
      "covar_samp",
      "create",
      "cross",
      "cube",
      "cume_dist",
      "current",
      "current_catalog",
      "current_date",
      "current_default_transform_group",
      "current_path",
      "current_role",
      "current_row",
      "current_schema",
      "current_time",
      "current_timestamp",
      "current_path",
      "current_role",
      "current_transform_group_for_type",
      "current_user",
      "cursor",
      "cycle",
      "date",
      "day",
      "deallocate",
      "dec",
      "decimal",
      "decfloat",
      "declare",
      "default",
      "define",
      "delete",
      "dense_rank",
      "deref",
      "describe",
      "deterministic",
      "disconnect",
      "distinct",
      "double",
      "drop",
      "dynamic",
      "each",
      "element",
      "else",
      "empty",
      "end",
      "end_frame",
      "end_partition",
      "end-exec",
      "equals",
      "escape",
      "every",
      "except",
      "exec",
      "execute",
      "exists",
      "exp",
      "external",
      "extract",
      "false",
      "fetch",
      "filter",
      "first_value",
      "float",
      "floor",
      "for",
      "foreign",
      "frame_row",
      "free",
      "from",
      "full",
      "function",
      "fusion",
      "get",
      "global",
      "grant",
      "group",
      "grouping",
      "groups",
      "having",
      "hold",
      "hour",
      "identity",
      "in",
      "indicator",
      "initial",
      "inner",
      "inout",
      "insensitive",
      "insert",
      "int",
      "integer",
      "intersect",
      "intersection",
      "interval",
      "into",
      "is",
      "join",
      "json_array",
      "json_arrayagg",
      "json_exists",
      "json_object",
      "json_objectagg",
      "json_query",
      "json_table",
      "json_table_primitive",
      "json_value",
      "lag",
      "language",
      "large",
      "last_value",
      "lateral",
      "lead",
      "leading",
      "left",
      "like",
      "like_regex",
      "listagg",
      "ln",
      "local",
      "localtime",
      "localtimestamp",
      "log",
      "log10",
      "lower",
      "match",
      "match_number",
      "match_recognize",
      "matches",
      "max",
      "member",
      "merge",
      "method",
      "min",
      "minute",
      "mod",
      "modifies",
      "module",
      "month",
      "multiset",
      "national",
      "natural",
      "nchar",
      "nclob",
      "new",
      "no",
      "none",
      "normalize",
      "not",
      "nth_value",
      "ntile",
      "null",
      "nullif",
      "numeric",
      "octet_length",
      "occurrences_regex",
      "of",
      "offset",
      "old",
      "omit",
      "on",
      "one",
      "only",
      "open",
      "or",
      "order",
      "out",
      "outer",
      "over",
      "overlaps",
      "overlay",
      "parameter",
      "partition",
      "pattern",
      "per",
      "percent",
      "percent_rank",
      "percentile_cont",
      "percentile_disc",
      "period",
      "portion",
      "position",
      "position_regex",
      "power",
      "precedes",
      "precision",
      "prepare",
      "primary",
      "procedure",
      "ptf",
      "range",
      "rank",
      "reads",
      "real",
      "recursive",
      "ref",
      "references",
      "referencing",
      "regr_avgx",
      "regr_avgy",
      "regr_count",
      "regr_intercept",
      "regr_r2",
      "regr_slope",
      "regr_sxx",
      "regr_sxy",
      "regr_syy",
      "release",
      "result",
      "return",
      "returns",
      "revoke",
      "right",
      "rollback",
      "rollup",
      "row",
      "row_number",
      "rows",
      "running",
      "savepoint",
      "scope",
      "scroll",
      "search",
      "second",
      "seek",
      "select",
      "sensitive",
      "session_user",
      "set",
      "show",
      "similar",
      "sin",
      "sinh",
      "skip",
      "smallint",
      "some",
      "specific",
      "specifictype",
      "sql",
      "sqlexception",
      "sqlstate",
      "sqlwarning",
      "sqrt",
      "start",
      "static",
      "stddev_pop",
      "stddev_samp",
      "submultiset",
      "subset",
      "substring",
      "substring_regex",
      "succeeds",
      "sum",
      "symmetric",
      "system",
      "system_time",
      "system_user",
      "table",
      "tablesample",
      "tan",
      "tanh",
      "then",
      "time",
      "timestamp",
      "timezone_hour",
      "timezone_minute",
      "to",
      "trailing",
      "translate",
      "translate_regex",
      "translation",
      "treat",
      "trigger",
      "trim",
      "trim_array",
      "true",
      "truncate",
      "uescape",
      "union",
      "unique",
      "unknown",
      "unnest",
      "update",
      "upper",
      "user",
      "using",
      "value",
      "values",
      "value_of",
      "var_pop",
      "var_samp",
      "varbinary",
      "varchar",
      "varying",
      "versioning",
      "when",
      "whenever",
      "where",
      "width_bucket",
      "window",
      "with",
      "within",
      "without",
      "year"
    ];
    const RESERVED_FUNCTIONS = [
      "abs",
      "acos",
      "array_agg",
      "asin",
      "atan",
      "avg",
      "cast",
      "ceil",
      "ceiling",
      "coalesce",
      "corr",
      "cos",
      "cosh",
      "count",
      "covar_pop",
      "covar_samp",
      "cume_dist",
      "dense_rank",
      "deref",
      "element",
      "exp",
      "extract",
      "first_value",
      "floor",
      "json_array",
      "json_arrayagg",
      "json_exists",
      "json_object",
      "json_objectagg",
      "json_query",
      "json_table",
      "json_table_primitive",
      "json_value",
      "lag",
      "last_value",
      "lead",
      "listagg",
      "ln",
      "log",
      "log10",
      "lower",
      "max",
      "min",
      "mod",
      "nth_value",
      "ntile",
      "nullif",
      "percent_rank",
      "percentile_cont",
      "percentile_disc",
      "position",
      "position_regex",
      "power",
      "rank",
      "regr_avgx",
      "regr_avgy",
      "regr_count",
      "regr_intercept",
      "regr_r2",
      "regr_slope",
      "regr_sxx",
      "regr_sxy",
      "regr_syy",
      "row_number",
      "sin",
      "sinh",
      "sqrt",
      "stddev_pop",
      "stddev_samp",
      "substring",
      "substring_regex",
      "sum",
      "tan",
      "tanh",
      "translate",
      "translate_regex",
      "treat",
      "trim",
      "trim_array",
      "unnest",
      "upper",
      "value_of",
      "var_pop",
      "var_samp",
      "width_bucket"
    ];
    const POSSIBLE_WITHOUT_PARENS = [
      "current_catalog",
      "current_date",
      "current_default_transform_group",
      "current_path",
      "current_role",
      "current_schema",
      "current_transform_group_for_type",
      "current_user",
      "session_user",
      "system_time",
      "system_user",
      "current_time",
      "localtime",
      "current_timestamp",
      "localtimestamp"
    ];
    const COMBOS = [
      "create table",
      "insert into",
      "primary key",
      "foreign key",
      "not null",
      "alter table",
      "add constraint",
      "grouping sets",
      "on overflow",
      "character set",
      "respect nulls",
      "ignore nulls",
      "nulls first",
      "nulls last",
      "depth first",
      "breadth first"
    ];
    const FUNCTIONS = RESERVED_FUNCTIONS;
    const KEYWORDS3 = [
      ...RESERVED_WORDS,
      ...NON_RESERVED_WORDS
    ].filter((keyword) => {
      return !RESERVED_FUNCTIONS.includes(keyword);
    });
    const VARIABLE = {
      scope: "variable",
      match: /@[a-z0-9][a-z0-9_]*/
    };
    const OPERATOR = {
      scope: "operator",
      match: /[-+*/=%^~]|&&?|\|\|?|!=?|<(?:=>?|<|>)?|>[>=]?/,
      relevance: 0
    };
    const FUNCTION_CALL = {
      match: regex.concat(/\b/, regex.either(...FUNCTIONS), /\s*\(/),
      relevance: 0,
      keywords: { built_in: FUNCTIONS }
    };
    function kws_to_regex(list2) {
      return regex.concat(
        /\b/,
        regex.either(...list2.map((kw) => {
          return kw.replace(/\s+/, "\\s+");
        })),
        /\b/
      );
    }
    const MULTI_WORD_KEYWORDS = {
      scope: "keyword",
      match: kws_to_regex(COMBOS),
      relevance: 0
    };
    function reduceRelevancy(list2, {
      exceptions,
      when
    } = {}) {
      const qualifyFn = when;
      exceptions = exceptions || [];
      return list2.map((item) => {
        if (item.match(/\|\d+$/) || exceptions.includes(item)) {
          return item;
        } else if (qualifyFn(item)) {
          return `${item}|0`;
        } else {
          return item;
        }
      });
    }
    return {
      name: "SQL",
      case_insensitive: true,
      // does not include {} or HTML tags `</`
      illegal: /[{}]|<\//,
      keywords: {
        $pattern: /\b[\w\.]+/,
        keyword: reduceRelevancy(KEYWORDS3, { when: (x) => x.length < 3 }),
        literal: LITERALS3,
        type: TYPES3,
        built_in: POSSIBLE_WITHOUT_PARENS
      },
      contains: [
        {
          scope: "type",
          match: kws_to_regex(MULTI_WORD_TYPES)
        },
        MULTI_WORD_KEYWORDS,
        FUNCTION_CALL,
        VARIABLE,
        STRING,
        QUOTED_IDENTIFIER,
        hljs.C_NUMBER_MODE,
        hljs.C_BLOCK_COMMENT_MODE,
        COMMENT_MODE,
        OPERATOR
      ]
    };
  }

  // node_modules/highlight.js/es/languages/json.js
  function json(hljs) {
    const ATTRIBUTE = {
      className: "attr",
      begin: /"(\\.|[^\\"\r\n])*"(?=\s*:)/,
      relevance: 1.01
    };
    const PUNCTUATION = {
      match: /[{}[\],:]/,
      className: "punctuation",
      relevance: 0
    };
    const LITERALS3 = [
      "true",
      "false",
      "null"
    ];
    const LITERALS_MODE = {
      scope: "literal",
      beginKeywords: LITERALS3.join(" ")
    };
    return {
      name: "JSON",
      aliases: ["jsonc"],
      keywords: {
        literal: LITERALS3
      },
      contains: [
        ATTRIBUTE,
        PUNCTUATION,
        hljs.QUOTE_STRING_MODE,
        LITERALS_MODE,
        hljs.C_NUMBER_MODE,
        hljs.C_LINE_COMMENT_MODE,
        hljs.C_BLOCK_COMMENT_MODE
      ],
      illegal: "\\S"
    };
  }

  // node_modules/highlight.js/es/languages/xml.js
  function xml(hljs) {
    const regex = hljs.regex;
    const TAG_NAME_RE = regex.concat(/[\p{L}_]/u, regex.optional(/[\p{L}0-9_.-]*:/u), /[\p{L}0-9_.-]*/u);
    const XML_IDENT_RE = /[\p{L}0-9._:-]+/u;
    const XML_ENTITIES = {
      className: "symbol",
      begin: /&[a-z]+;|&#[0-9]+;|&#x[a-f0-9]+;/
    };
    const XML_META_KEYWORDS = {
      begin: /\s/,
      contains: [
        {
          className: "keyword",
          begin: /#?[a-z_][a-z1-9_-]+/,
          illegal: /\n/
        }
      ]
    };
    const XML_META_PAR_KEYWORDS = hljs.inherit(XML_META_KEYWORDS, {
      begin: /\(/,
      end: /\)/
    });
    const APOS_META_STRING_MODE = hljs.inherit(hljs.APOS_STRING_MODE, { className: "string" });
    const QUOTE_META_STRING_MODE = hljs.inherit(hljs.QUOTE_STRING_MODE, { className: "string" });
    const TAG_INTERNALS = {
      endsWithParent: true,
      illegal: /</,
      relevance: 0,
      contains: [
        {
          className: "attr",
          begin: XML_IDENT_RE,
          relevance: 0
        },
        {
          begin: /=\s*/,
          relevance: 0,
          contains: [
            {
              className: "string",
              endsParent: true,
              variants: [
                {
                  begin: /"/,
                  end: /"/,
                  contains: [XML_ENTITIES]
                },
                {
                  begin: /'/,
                  end: /'/,
                  contains: [XML_ENTITIES]
                },
                { begin: /[^\s"'=<>`]+/ }
              ]
            }
          ]
        }
      ]
    };
    return {
      name: "HTML, XML",
      aliases: [
        "html",
        "xhtml",
        "rss",
        "atom",
        "xjb",
        "xsd",
        "xsl",
        "plist",
        "wsf",
        "svg"
      ],
      case_insensitive: true,
      unicodeRegex: true,
      contains: [
        {
          className: "meta",
          begin: /<![a-z]/,
          end: />/,
          relevance: 10,
          contains: [
            XML_META_KEYWORDS,
            QUOTE_META_STRING_MODE,
            APOS_META_STRING_MODE,
            XML_META_PAR_KEYWORDS,
            {
              begin: /\[/,
              end: /\]/,
              contains: [
                {
                  className: "meta",
                  begin: /<![a-z]/,
                  end: />/,
                  contains: [
                    XML_META_KEYWORDS,
                    XML_META_PAR_KEYWORDS,
                    QUOTE_META_STRING_MODE,
                    APOS_META_STRING_MODE
                  ]
                }
              ]
            }
          ]
        },
        hljs.COMMENT(
          /<!--/,
          /-->/,
          { relevance: 10 }
        ),
        {
          begin: /<!\[CDATA\[/,
          end: /\]\]>/,
          relevance: 10
        },
        XML_ENTITIES,
        // xml processing instructions
        {
          className: "meta",
          end: /\?>/,
          variants: [
            {
              begin: /<\?xml/,
              relevance: 10,
              contains: [
                QUOTE_META_STRING_MODE
              ]
            },
            {
              begin: /<\?[a-z][a-z0-9]+/
            }
          ]
        },
        {
          className: "tag",
          /*
          The lookahead pattern (?=...) ensures that 'begin' only matches
          '<style' as a single word, followed by a whitespace or an
          ending bracket.
          */
          begin: /<style(?=\s|>)/,
          end: />/,
          keywords: { name: "style" },
          contains: [TAG_INTERNALS],
          starts: {
            end: /<\/style>/,
            returnEnd: true,
            subLanguage: [
              "css",
              "xml"
            ]
          }
        },
        {
          className: "tag",
          // See the comment in the <style tag about the lookahead pattern
          begin: /<script(?=\s|>)/,
          end: />/,
          keywords: { name: "script" },
          contains: [TAG_INTERNALS],
          starts: {
            end: /<\/script>/,
            returnEnd: true,
            subLanguage: [
              "javascript",
              "handlebars",
              "xml"
            ]
          }
        },
        // we need this for now for jSX
        {
          className: "tag",
          begin: /<>|<\/>/
        },
        // open tag
        {
          className: "tag",
          begin: regex.concat(
            /</,
            regex.lookahead(regex.concat(
              TAG_NAME_RE,
              // <tag/>
              // <tag>
              // <tag ...
              regex.either(/\/>/, />/, /\s/)
            ))
          ),
          end: /\/?>/,
          contains: [
            {
              className: "name",
              begin: TAG_NAME_RE,
              relevance: 0,
              starts: TAG_INTERNALS
            }
          ]
        },
        // close tag
        {
          className: "tag",
          begin: regex.concat(
            /<\//,
            regex.lookahead(regex.concat(
              TAG_NAME_RE,
              />/
            ))
          ),
          contains: [
            {
              className: "name",
              begin: TAG_NAME_RE,
              relevance: 0
            },
            {
              begin: />/,
              relevance: 0,
              endsParent: true
            }
          ]
        }
      ]
    };
  }

  // node_modules/highlight.js/es/languages/markdown.js
  function markdown(hljs) {
    const regex = hljs.regex;
    const INLINE_HTML = {
      begin: /<\/?[A-Za-z_]/,
      end: ">",
      subLanguage: "xml",
      relevance: 0
    };
    const HORIZONTAL_RULE = {
      begin: "^[-\\*]{3,}",
      end: "$"
    };
    const CODE = {
      className: "code",
      variants: [
        // TODO: fix to allow these to work with sublanguage also
        { begin: "(`{3,})[^`](.|\\n)*?\\1`*[ ]*" },
        { begin: "(~{3,})[^~](.|\\n)*?\\1~*[ ]*" },
        // needed to allow markdown as a sublanguage to work
        {
          begin: "```",
          end: "```+[ ]*$"
        },
        {
          begin: "~~~",
          end: "~~~+[ ]*$"
        },
        { begin: "`.+?`" },
        {
          begin: "(?=^( {4}|\\t))",
          // use contains to gobble up multiple lines to allow the block to be whatever size
          // but only have a single open/close tag vs one per line
          contains: [
            {
              begin: "^( {4}|\\t)",
              end: "(\\n)$"
            }
          ],
          relevance: 0
        }
      ]
    };
    const LIST = {
      className: "bullet",
      begin: "^[ 	]*([*+-]|(\\d+\\.))(?=\\s+)",
      end: "\\s+",
      excludeEnd: true
    };
    const LINK_REFERENCE = {
      begin: /^\[[^\n]+\]:/,
      returnBegin: true,
      contains: [
        {
          className: "symbol",
          begin: /\[/,
          end: /\]/,
          excludeBegin: true,
          excludeEnd: true
        },
        {
          className: "link",
          begin: /:\s*/,
          end: /$/,
          excludeBegin: true
        }
      ]
    };
    const URL_SCHEME = /[A-Za-z][A-Za-z0-9+.-]*/;
    const LINK = {
      variants: [
        // too much like nested array access in so many languages
        // to have any real relevance
        {
          begin: /\[.+?\]\[.*?\]/,
          relevance: 0
        },
        // popular internet URLs
        {
          begin: /\[.+?\]\(((data|javascript|mailto):|(?:http|ftp)s?:\/\/).*?\)/,
          relevance: 2
        },
        {
          begin: regex.concat(/\[.+?\]\(/, URL_SCHEME, /:\/\/.*?\)/),
          relevance: 2
        },
        // relative urls
        {
          begin: /\[.+?\]\([./?&#].*?\)/,
          relevance: 1
        },
        // whatever else, lower relevance (might not be a link at all)
        {
          begin: /\[.*?\]\(.*?\)/,
          relevance: 0
        }
      ],
      returnBegin: true,
      contains: [
        {
          // empty strings for alt or link text
          match: /\[(?=\])/
        },
        {
          className: "string",
          relevance: 0,
          begin: "\\[",
          end: "\\]",
          excludeBegin: true,
          returnEnd: true
        },
        {
          className: "link",
          relevance: 0,
          begin: "\\]\\(",
          end: "\\)",
          excludeBegin: true,
          excludeEnd: true
        },
        {
          className: "symbol",
          relevance: 0,
          begin: "\\]\\[",
          end: "\\]",
          excludeBegin: true,
          excludeEnd: true
        }
      ]
    };
    const BOLD = {
      className: "strong",
      contains: [],
      // defined later
      variants: [
        {
          begin: /_{2}(?!\s)/,
          end: /_{2}/
        },
        {
          begin: /\*{2}(?!\s)/,
          end: /\*{2}/
        }
      ]
    };
    const ITALIC = {
      className: "emphasis",
      contains: [],
      // defined later
      variants: [
        {
          begin: /\*(?![*\s])/,
          end: /\*/
        },
        {
          begin: /_(?![_\s])/,
          end: /_/,
          relevance: 0
        }
      ]
    };
    const BOLD_WITHOUT_ITALIC = hljs.inherit(BOLD, { contains: [] });
    const ITALIC_WITHOUT_BOLD = hljs.inherit(ITALIC, { contains: [] });
    BOLD.contains.push(ITALIC_WITHOUT_BOLD);
    ITALIC.contains.push(BOLD_WITHOUT_ITALIC);
    let CONTAINABLE = [
      INLINE_HTML,
      LINK
    ];
    [
      BOLD,
      ITALIC,
      BOLD_WITHOUT_ITALIC,
      ITALIC_WITHOUT_BOLD
    ].forEach((m) => {
      m.contains = m.contains.concat(CONTAINABLE);
    });
    CONTAINABLE = CONTAINABLE.concat(BOLD, ITALIC);
    const HEADER = {
      className: "section",
      variants: [
        {
          begin: "^#{1,6}",
          end: "$",
          contains: CONTAINABLE
        },
        {
          begin: "(?=^.+?\\n[=-]{2,}$)",
          contains: [
            { begin: "^[=-]*$" },
            {
              begin: "^",
              end: "\\n",
              contains: CONTAINABLE
            }
          ]
        }
      ]
    };
    const BLOCKQUOTE = {
      className: "quote",
      begin: "^>\\s+",
      contains: CONTAINABLE,
      end: "$"
    };
    const ENTITY = {
      //https://spec.commonmark.org/0.31.2/#entity-references
      scope: "literal",
      match: /&([a-zA-Z0-9]+|#[0-9]{1,7}|#[Xx][0-9a-fA-F]{1,6});/
    };
    return {
      name: "Markdown",
      aliases: [
        "md",
        "mkdown",
        "mkd"
      ],
      contains: [
        HEADER,
        INLINE_HTML,
        LIST,
        BOLD,
        ITALIC,
        BLOCKQUOTE,
        CODE,
        HORIZONTAL_RULE,
        LINK,
        LINK_REFERENCE,
        ENTITY
      ]
    };
  }

  // node_modules/highlight.js/es/languages/css.js
  var MODES = (hljs) => {
    return {
      IMPORTANT: {
        scope: "meta",
        begin: "!important"
      },
      BLOCK_COMMENT: hljs.C_BLOCK_COMMENT_MODE,
      HEXCOLOR: {
        scope: "number",
        begin: /#(([0-9a-fA-F]{3,4})|(([0-9a-fA-F]{2}){3,4}))\b/
      },
      FUNCTION_DISPATCH: {
        className: "built_in",
        begin: /[\w-]+(?=\()/
      },
      ATTRIBUTE_SELECTOR_MODE: {
        scope: "selector-attr",
        begin: /\[/,
        end: /\]/,
        illegal: "$",
        contains: [
          hljs.APOS_STRING_MODE,
          hljs.QUOTE_STRING_MODE
        ]
      },
      CSS_NUMBER_MODE: {
        scope: "number",
        begin: hljs.NUMBER_RE + "(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx)?",
        relevance: 0
      },
      CSS_VARIABLE: {
        className: "attr",
        begin: /--[A-Za-z_][A-Za-z0-9_-]*/
      }
    };
  };
  var HTML_TAGS = [
    "a",
    "abbr",
    "address",
    "article",
    "aside",
    "audio",
    "b",
    "blockquote",
    "body",
    "button",
    "canvas",
    "caption",
    "cite",
    "code",
    "dd",
    "del",
    "details",
    "dfn",
    "div",
    "dl",
    "dt",
    "em",
    "fieldset",
    "figcaption",
    "figure",
    "footer",
    "form",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "header",
    "hgroup",
    "html",
    "i",
    "iframe",
    "img",
    "input",
    "ins",
    "kbd",
    "label",
    "legend",
    "li",
    "main",
    "mark",
    "menu",
    "nav",
    "object",
    "ol",
    "optgroup",
    "option",
    "p",
    "picture",
    "q",
    "quote",
    "samp",
    "section",
    "select",
    "source",
    "span",
    "strong",
    "summary",
    "sup",
    "table",
    "tbody",
    "td",
    "textarea",
    "tfoot",
    "th",
    "thead",
    "time",
    "tr",
    "ul",
    "var",
    "video"
  ];
  var SVG_TAGS = [
    "defs",
    "g",
    "marker",
    "mask",
    "pattern",
    "svg",
    "switch",
    "symbol",
    "feBlend",
    "feColorMatrix",
    "feComponentTransfer",
    "feComposite",
    "feConvolveMatrix",
    "feDiffuseLighting",
    "feDisplacementMap",
    "feFlood",
    "feGaussianBlur",
    "feImage",
    "feMerge",
    "feMorphology",
    "feOffset",
    "feSpecularLighting",
    "feTile",
    "feTurbulence",
    "linearGradient",
    "radialGradient",
    "stop",
    "circle",
    "ellipse",
    "image",
    "line",
    "path",
    "polygon",
    "polyline",
    "rect",
    "text",
    "use",
    "textPath",
    "tspan",
    "foreignObject",
    "clipPath"
  ];
  var TAGS = [
    ...HTML_TAGS,
    ...SVG_TAGS
  ];
  var MEDIA_FEATURES = [
    "any-hover",
    "any-pointer",
    "aspect-ratio",
    "color",
    "color-gamut",
    "color-index",
    "device-aspect-ratio",
    "device-height",
    "device-width",
    "display-mode",
    "forced-colors",
    "grid",
    "height",
    "hover",
    "inverted-colors",
    "monochrome",
    "orientation",
    "overflow-block",
    "overflow-inline",
    "pointer",
    "prefers-color-scheme",
    "prefers-contrast",
    "prefers-reduced-motion",
    "prefers-reduced-transparency",
    "resolution",
    "scan",
    "scripting",
    "update",
    "width",
    // TODO: find a better solution?
    "min-width",
    "max-width",
    "min-height",
    "max-height"
  ].sort().reverse();
  var PSEUDO_CLASSES = [
    "active",
    "any-link",
    "blank",
    "checked",
    "current",
    "default",
    "defined",
    "dir",
    // dir()
    "disabled",
    "drop",
    "empty",
    "enabled",
    "first",
    "first-child",
    "first-of-type",
    "fullscreen",
    "future",
    "focus",
    "focus-visible",
    "focus-within",
    "has",
    // has()
    "host",
    // host or host()
    "host-context",
    // host-context()
    "hover",
    "indeterminate",
    "in-range",
    "invalid",
    "is",
    // is()
    "lang",
    // lang()
    "last-child",
    "last-of-type",
    "left",
    "link",
    "local-link",
    "not",
    // not()
    "nth-child",
    // nth-child()
    "nth-col",
    // nth-col()
    "nth-last-child",
    // nth-last-child()
    "nth-last-col",
    // nth-last-col()
    "nth-last-of-type",
    //nth-last-of-type()
    "nth-of-type",
    //nth-of-type()
    "only-child",
    "only-of-type",
    "optional",
    "out-of-range",
    "past",
    "placeholder-shown",
    "read-only",
    "read-write",
    "required",
    "right",
    "root",
    "scope",
    "target",
    "target-within",
    "user-invalid",
    "valid",
    "visited",
    "where"
    // where()
  ].sort().reverse();
  var PSEUDO_ELEMENTS = [
    "after",
    "backdrop",
    "before",
    "cue",
    "cue-region",
    "first-letter",
    "first-line",
    "grammar-error",
    "marker",
    "part",
    "placeholder",
    "selection",
    "slotted",
    "spelling-error"
  ].sort().reverse();
  var ATTRIBUTES = [
    "accent-color",
    "align-content",
    "align-items",
    "align-self",
    "alignment-baseline",
    "all",
    "anchor-name",
    "animation",
    "animation-composition",
    "animation-delay",
    "animation-direction",
    "animation-duration",
    "animation-fill-mode",
    "animation-iteration-count",
    "animation-name",
    "animation-play-state",
    "animation-range",
    "animation-range-end",
    "animation-range-start",
    "animation-timeline",
    "animation-timing-function",
    "appearance",
    "aspect-ratio",
    "backdrop-filter",
    "backface-visibility",
    "background",
    "background-attachment",
    "background-blend-mode",
    "background-clip",
    "background-color",
    "background-image",
    "background-origin",
    "background-position",
    "background-position-x",
    "background-position-y",
    "background-repeat",
    "background-size",
    "baseline-shift",
    "block-size",
    "border",
    "border-block",
    "border-block-color",
    "border-block-end",
    "border-block-end-color",
    "border-block-end-style",
    "border-block-end-width",
    "border-block-start",
    "border-block-start-color",
    "border-block-start-style",
    "border-block-start-width",
    "border-block-style",
    "border-block-width",
    "border-bottom",
    "border-bottom-color",
    "border-bottom-left-radius",
    "border-bottom-right-radius",
    "border-bottom-style",
    "border-bottom-width",
    "border-collapse",
    "border-color",
    "border-end-end-radius",
    "border-end-start-radius",
    "border-image",
    "border-image-outset",
    "border-image-repeat",
    "border-image-slice",
    "border-image-source",
    "border-image-width",
    "border-inline",
    "border-inline-color",
    "border-inline-end",
    "border-inline-end-color",
    "border-inline-end-style",
    "border-inline-end-width",
    "border-inline-start",
    "border-inline-start-color",
    "border-inline-start-style",
    "border-inline-start-width",
    "border-inline-style",
    "border-inline-width",
    "border-left",
    "border-left-color",
    "border-left-style",
    "border-left-width",
    "border-radius",
    "border-right",
    "border-right-color",
    "border-right-style",
    "border-right-width",
    "border-spacing",
    "border-start-end-radius",
    "border-start-start-radius",
    "border-style",
    "border-top",
    "border-top-color",
    "border-top-left-radius",
    "border-top-right-radius",
    "border-top-style",
    "border-top-width",
    "border-width",
    "bottom",
    "box-align",
    "box-decoration-break",
    "box-direction",
    "box-flex",
    "box-flex-group",
    "box-lines",
    "box-ordinal-group",
    "box-orient",
    "box-pack",
    "box-shadow",
    "box-sizing",
    "break-after",
    "break-before",
    "break-inside",
    "caption-side",
    "caret-color",
    "clear",
    "clip",
    "clip-path",
    "clip-rule",
    "color",
    "color-interpolation",
    "color-interpolation-filters",
    "color-profile",
    "color-rendering",
    "color-scheme",
    "column-count",
    "column-fill",
    "column-gap",
    "column-rule",
    "column-rule-color",
    "column-rule-style",
    "column-rule-width",
    "column-span",
    "column-width",
    "columns",
    "contain",
    "contain-intrinsic-block-size",
    "contain-intrinsic-height",
    "contain-intrinsic-inline-size",
    "contain-intrinsic-size",
    "contain-intrinsic-width",
    "container",
    "container-name",
    "container-type",
    "content",
    "content-visibility",
    "counter-increment",
    "counter-reset",
    "counter-set",
    "cue",
    "cue-after",
    "cue-before",
    "cursor",
    "cx",
    "cy",
    "direction",
    "display",
    "dominant-baseline",
    "empty-cells",
    "enable-background",
    "field-sizing",
    "fill",
    "fill-opacity",
    "fill-rule",
    "filter",
    "flex",
    "flex-basis",
    "flex-direction",
    "flex-flow",
    "flex-grow",
    "flex-shrink",
    "flex-wrap",
    "float",
    "flood-color",
    "flood-opacity",
    "flow",
    "font",
    "font-display",
    "font-family",
    "font-feature-settings",
    "font-kerning",
    "font-language-override",
    "font-optical-sizing",
    "font-palette",
    "font-size",
    "font-size-adjust",
    "font-smooth",
    "font-smoothing",
    "font-stretch",
    "font-style",
    "font-synthesis",
    "font-synthesis-position",
    "font-synthesis-small-caps",
    "font-synthesis-style",
    "font-synthesis-weight",
    "font-variant",
    "font-variant-alternates",
    "font-variant-caps",
    "font-variant-east-asian",
    "font-variant-emoji",
    "font-variant-ligatures",
    "font-variant-numeric",
    "font-variant-position",
    "font-variation-settings",
    "font-weight",
    "forced-color-adjust",
    "gap",
    "glyph-orientation-horizontal",
    "glyph-orientation-vertical",
    "grid",
    "grid-area",
    "grid-auto-columns",
    "grid-auto-flow",
    "grid-auto-rows",
    "grid-column",
    "grid-column-end",
    "grid-column-start",
    "grid-gap",
    "grid-row",
    "grid-row-end",
    "grid-row-start",
    "grid-template",
    "grid-template-areas",
    "grid-template-columns",
    "grid-template-rows",
    "hanging-punctuation",
    "height",
    "hyphenate-character",
    "hyphenate-limit-chars",
    "hyphens",
    "icon",
    "image-orientation",
    "image-rendering",
    "image-resolution",
    "ime-mode",
    "initial-letter",
    "initial-letter-align",
    "inline-size",
    "inset",
    "inset-area",
    "inset-block",
    "inset-block-end",
    "inset-block-start",
    "inset-inline",
    "inset-inline-end",
    "inset-inline-start",
    "isolation",
    "justify-content",
    "justify-items",
    "justify-self",
    "kerning",
    "left",
    "letter-spacing",
    "lighting-color",
    "line-break",
    "line-height",
    "line-height-step",
    "list-style",
    "list-style-image",
    "list-style-position",
    "list-style-type",
    "margin",
    "margin-block",
    "margin-block-end",
    "margin-block-start",
    "margin-bottom",
    "margin-inline",
    "margin-inline-end",
    "margin-inline-start",
    "margin-left",
    "margin-right",
    "margin-top",
    "margin-trim",
    "marker",
    "marker-end",
    "marker-mid",
    "marker-start",
    "marks",
    "mask",
    "mask-border",
    "mask-border-mode",
    "mask-border-outset",
    "mask-border-repeat",
    "mask-border-slice",
    "mask-border-source",
    "mask-border-width",
    "mask-clip",
    "mask-composite",
    "mask-image",
    "mask-mode",
    "mask-origin",
    "mask-position",
    "mask-repeat",
    "mask-size",
    "mask-type",
    "masonry-auto-flow",
    "math-depth",
    "math-shift",
    "math-style",
    "max-block-size",
    "max-height",
    "max-inline-size",
    "max-width",
    "min-block-size",
    "min-height",
    "min-inline-size",
    "min-width",
    "mix-blend-mode",
    "nav-down",
    "nav-index",
    "nav-left",
    "nav-right",
    "nav-up",
    "none",
    "normal",
    "object-fit",
    "object-position",
    "offset",
    "offset-anchor",
    "offset-distance",
    "offset-path",
    "offset-position",
    "offset-rotate",
    "opacity",
    "order",
    "orphans",
    "outline",
    "outline-color",
    "outline-offset",
    "outline-style",
    "outline-width",
    "overflow",
    "overflow-anchor",
    "overflow-block",
    "overflow-clip-margin",
    "overflow-inline",
    "overflow-wrap",
    "overflow-x",
    "overflow-y",
    "overlay",
    "overscroll-behavior",
    "overscroll-behavior-block",
    "overscroll-behavior-inline",
    "overscroll-behavior-x",
    "overscroll-behavior-y",
    "padding",
    "padding-block",
    "padding-block-end",
    "padding-block-start",
    "padding-bottom",
    "padding-inline",
    "padding-inline-end",
    "padding-inline-start",
    "padding-left",
    "padding-right",
    "padding-top",
    "page",
    "page-break-after",
    "page-break-before",
    "page-break-inside",
    "paint-order",
    "pause",
    "pause-after",
    "pause-before",
    "perspective",
    "perspective-origin",
    "place-content",
    "place-items",
    "place-self",
    "pointer-events",
    "position",
    "position-anchor",
    "position-visibility",
    "print-color-adjust",
    "quotes",
    "r",
    "resize",
    "rest",
    "rest-after",
    "rest-before",
    "right",
    "rotate",
    "row-gap",
    "ruby-align",
    "ruby-position",
    "scale",
    "scroll-behavior",
    "scroll-margin",
    "scroll-margin-block",
    "scroll-margin-block-end",
    "scroll-margin-block-start",
    "scroll-margin-bottom",
    "scroll-margin-inline",
    "scroll-margin-inline-end",
    "scroll-margin-inline-start",
    "scroll-margin-left",
    "scroll-margin-right",
    "scroll-margin-top",
    "scroll-padding",
    "scroll-padding-block",
    "scroll-padding-block-end",
    "scroll-padding-block-start",
    "scroll-padding-bottom",
    "scroll-padding-inline",
    "scroll-padding-inline-end",
    "scroll-padding-inline-start",
    "scroll-padding-left",
    "scroll-padding-right",
    "scroll-padding-top",
    "scroll-snap-align",
    "scroll-snap-stop",
    "scroll-snap-type",
    "scroll-timeline",
    "scroll-timeline-axis",
    "scroll-timeline-name",
    "scrollbar-color",
    "scrollbar-gutter",
    "scrollbar-width",
    "shape-image-threshold",
    "shape-margin",
    "shape-outside",
    "shape-rendering",
    "speak",
    "speak-as",
    "src",
    // @font-face
    "stop-color",
    "stop-opacity",
    "stroke",
    "stroke-dasharray",
    "stroke-dashoffset",
    "stroke-linecap",
    "stroke-linejoin",
    "stroke-miterlimit",
    "stroke-opacity",
    "stroke-width",
    "tab-size",
    "table-layout",
    "text-align",
    "text-align-all",
    "text-align-last",
    "text-anchor",
    "text-combine-upright",
    "text-decoration",
    "text-decoration-color",
    "text-decoration-line",
    "text-decoration-skip",
    "text-decoration-skip-ink",
    "text-decoration-style",
    "text-decoration-thickness",
    "text-emphasis",
    "text-emphasis-color",
    "text-emphasis-position",
    "text-emphasis-style",
    "text-indent",
    "text-justify",
    "text-orientation",
    "text-overflow",
    "text-rendering",
    "text-shadow",
    "text-size-adjust",
    "text-transform",
    "text-underline-offset",
    "text-underline-position",
    "text-wrap",
    "text-wrap-mode",
    "text-wrap-style",
    "timeline-scope",
    "top",
    "touch-action",
    "transform",
    "transform-box",
    "transform-origin",
    "transform-style",
    "transition",
    "transition-behavior",
    "transition-delay",
    "transition-duration",
    "transition-property",
    "transition-timing-function",
    "translate",
    "unicode-bidi",
    "user-modify",
    "user-select",
    "vector-effect",
    "vertical-align",
    "view-timeline",
    "view-timeline-axis",
    "view-timeline-inset",
    "view-timeline-name",
    "view-transition-name",
    "visibility",
    "voice-balance",
    "voice-duration",
    "voice-family",
    "voice-pitch",
    "voice-range",
    "voice-rate",
    "voice-stress",
    "voice-volume",
    "white-space",
    "white-space-collapse",
    "widows",
    "width",
    "will-change",
    "word-break",
    "word-spacing",
    "word-wrap",
    "writing-mode",
    "x",
    "y",
    "z-index",
    "zoom"
  ].sort().reverse();
  function css(hljs) {
    const regex = hljs.regex;
    const modes = MODES(hljs);
    const VENDOR_PREFIX = { begin: /-(webkit|moz|ms|o)-(?=[a-z])/ };
    const AT_MODIFIERS = "and or not only";
    const AT_PROPERTY_RE = /@-?\w[\w]*(-\w+)*/;
    const IDENT_RE3 = "[a-zA-Z-][a-zA-Z0-9_-]*";
    const STRINGS2 = [
      hljs.APOS_STRING_MODE,
      hljs.QUOTE_STRING_MODE
    ];
    return {
      name: "CSS",
      case_insensitive: true,
      illegal: /[=|'\$]/,
      keywords: { keyframePosition: "from to" },
      classNameAliases: {
        // for visual continuity with `tag {}` and because we
        // don't have a great class for this?
        keyframePosition: "selector-tag"
      },
      contains: [
        modes.BLOCK_COMMENT,
        VENDOR_PREFIX,
        // to recognize keyframe 40% etc which are outside the scope of our
        // attribute value mode
        modes.CSS_NUMBER_MODE,
        {
          className: "selector-id",
          begin: /#[A-Za-z0-9_-]+/,
          relevance: 0
        },
        {
          className: "selector-class",
          begin: "\\." + IDENT_RE3,
          relevance: 0
        },
        modes.ATTRIBUTE_SELECTOR_MODE,
        {
          className: "selector-pseudo",
          variants: [
            { begin: ":(" + PSEUDO_CLASSES.join("|") + ")" },
            { begin: ":(:)?(" + PSEUDO_ELEMENTS.join("|") + ")" }
          ]
        },
        // we may actually need this (12/2020)
        // { // pseudo-selector params
        //   begin: /\(/,
        //   end: /\)/,
        //   contains: [ hljs.CSS_NUMBER_MODE ]
        // },
        modes.CSS_VARIABLE,
        {
          className: "attribute",
          begin: "\\b(" + ATTRIBUTES.join("|") + ")\\b"
        },
        // attribute values
        {
          begin: /:/,
          end: /[;}{]/,
          contains: [
            modes.BLOCK_COMMENT,
            modes.HEXCOLOR,
            modes.IMPORTANT,
            modes.CSS_NUMBER_MODE,
            ...STRINGS2,
            // needed to highlight these as strings and to avoid issues with
            // illegal characters that might be inside urls that would tigger the
            // languages illegal stack
            {
              begin: /(url|data-uri)\(/,
              end: /\)/,
              relevance: 0,
              // from keywords
              keywords: { built_in: "url data-uri" },
              contains: [
                ...STRINGS2,
                {
                  className: "string",
                  // any character other than `)` as in `url()` will be the start
                  // of a string, which ends with `)` (from the parent mode)
                  begin: /[^)]/,
                  endsWithParent: true,
                  excludeEnd: true
                }
              ]
            },
            modes.FUNCTION_DISPATCH
          ]
        },
        {
          begin: regex.lookahead(/@/),
          end: "[{;]",
          relevance: 0,
          illegal: /:/,
          // break on Less variables @var: ...
          contains: [
            {
              className: "keyword",
              begin: AT_PROPERTY_RE
            },
            {
              begin: /\s/,
              endsWithParent: true,
              excludeEnd: true,
              relevance: 0,
              keywords: {
                $pattern: /[a-z-]+/,
                keyword: AT_MODIFIERS,
                attribute: MEDIA_FEATURES.join(" ")
              },
              contains: [
                {
                  begin: /[a-z-]+(?=:)/,
                  className: "attribute"
                },
                ...STRINGS2,
                modes.CSS_NUMBER_MODE
              ]
            }
          ]
        },
        {
          className: "selector-tag",
          begin: "\\b(" + TAGS.join("|") + ")\\b"
        }
      ]
    };
  }

  // node_modules/highlight.js/es/languages/yaml.js
  function yaml(hljs) {
    const LITERALS3 = "true false yes no null";
    const URI_CHARACTERS = "[\\w#;/?:@&=+$,.~*'()[\\]]+";
    const KEY = {
      className: "attr",
      variants: [
        // added brackets support and special char support
        { begin: /[\w*@][\w*@ :()\./-]*:(?=[ \t]|$)/ },
        {
          // double quoted keys - with brackets and special char support
          begin: /"[\w*@][\w*@ :()\./-]*":(?=[ \t]|$)/
        },
        {
          // single quoted keys - with brackets and special char support
          begin: /'[\w*@][\w*@ :()\./-]*':(?=[ \t]|$)/
        }
      ]
    };
    const TEMPLATE_VARIABLES = {
      className: "template-variable",
      variants: [
        {
          // jinja templates Ansible
          begin: /\{\{/,
          end: /\}\}/
        },
        {
          // Ruby i18n
          begin: /%\{/,
          end: /\}/
        }
      ]
    };
    const SINGLE_QUOTE_STRING = {
      className: "string",
      relevance: 0,
      begin: /'/,
      end: /'/,
      contains: [
        {
          match: /''/,
          scope: "char.escape",
          relevance: 0
        }
      ]
    };
    const STRING = {
      className: "string",
      relevance: 0,
      variants: [
        {
          begin: /"/,
          end: /"/
        },
        { begin: /\S+/ }
      ],
      contains: [
        hljs.BACKSLASH_ESCAPE,
        TEMPLATE_VARIABLES
      ]
    };
    const CONTAINER_STRING = hljs.inherit(STRING, { variants: [
      {
        begin: /'/,
        end: /'/,
        contains: [
          {
            begin: /''/,
            relevance: 0
          }
        ]
      },
      {
        begin: /"/,
        end: /"/
      },
      { begin: /[^\s,{}[\]]+/ }
    ] });
    const DATE_RE = "[0-9]{4}(-[0-9][0-9]){0,2}";
    const TIME_RE = "([Tt \\t][0-9][0-9]?(:[0-9][0-9]){2})?";
    const FRACTION_RE = "(\\.[0-9]*)?";
    const ZONE_RE = "([ \\t])*(Z|[-+][0-9][0-9]?(:[0-9][0-9])?)?";
    const TIMESTAMP = {
      className: "number",
      begin: "\\b" + DATE_RE + TIME_RE + FRACTION_RE + ZONE_RE + "\\b"
    };
    const VALUE_CONTAINER = {
      end: ",",
      endsWithParent: true,
      excludeEnd: true,
      keywords: LITERALS3,
      relevance: 0
    };
    const OBJECT = {
      begin: /\{/,
      end: /\}/,
      contains: [VALUE_CONTAINER],
      illegal: "\\n",
      relevance: 0
    };
    const ARRAY = {
      begin: "\\[",
      end: "\\]",
      contains: [VALUE_CONTAINER],
      illegal: "\\n",
      relevance: 0
    };
    const MODES2 = [
      KEY,
      {
        className: "meta",
        begin: "^---\\s*$",
        relevance: 10
      },
      {
        // multi line string
        // Blocks start with a | or > followed by a newline
        //
        // Indentation of subsequent lines must be the same to
        // be considered part of the block
        className: "string",
        begin: "[\\|>]([1-9]?[+-])?[ ]*\\n( +)[^ ][^\\n]*\\n(\\2[^\\n]+\\n?)*"
      },
      {
        // Ruby/Rails erb
        begin: "<%[%=-]?",
        end: "[%-]?%>",
        subLanguage: "ruby",
        excludeBegin: true,
        excludeEnd: true,
        relevance: 0
      },
      {
        // named tags
        className: "type",
        begin: "!\\w+!" + URI_CHARACTERS
      },
      // https://yaml.org/spec/1.2/spec.html#id2784064
      {
        // verbatim tags
        className: "type",
        begin: "!<" + URI_CHARACTERS + ">"
      },
      {
        // primary tags
        className: "type",
        begin: "!" + URI_CHARACTERS
      },
      {
        // secondary tags
        className: "type",
        begin: "!!" + URI_CHARACTERS
      },
      {
        // fragment id &ref
        className: "meta",
        begin: "&" + hljs.UNDERSCORE_IDENT_RE + "$"
      },
      {
        // fragment reference *ref
        className: "meta",
        begin: "\\*" + hljs.UNDERSCORE_IDENT_RE + "$"
      },
      {
        // array listing
        className: "bullet",
        // TODO: remove |$ hack when we have proper look-ahead support
        begin: "-(?=[ ]|$)",
        relevance: 0
      },
      hljs.HASH_COMMENT_MODE,
      {
        beginKeywords: LITERALS3,
        keywords: { literal: LITERALS3 }
      },
      TIMESTAMP,
      // numbers are any valid C-style number that
      // sit isolated from other words
      {
        className: "number",
        begin: hljs.C_NUMBER_RE + "\\b",
        relevance: 0
      },
      OBJECT,
      ARRAY,
      SINGLE_QUOTE_STRING,
      STRING
    ];
    const VALUE_MODES = [...MODES2];
    VALUE_MODES.pop();
    VALUE_MODES.push(CONTAINER_STRING);
    VALUE_CONTAINER.contains = VALUE_MODES;
    return {
      name: "YAML",
      case_insensitive: true,
      aliases: ["yml"],
      contains: MODES2
    };
  }

  // node_modules/highlight.js/es/languages/latex.js
  function latex(hljs) {
    const regex = hljs.regex;
    const KNOWN_CONTROL_WORDS = regex.either(...[
      "(?:NeedsTeXFormat|RequirePackage|GetIdInfo)",
      "Provides(?:Expl)?(?:Package|Class|File)",
      "(?:DeclareOption|ProcessOptions)",
      "(?:documentclass|usepackage|input|include)",
      "makeat(?:letter|other)",
      "ExplSyntax(?:On|Off)",
      "(?:new|renew|provide)?command",
      "(?:re)newenvironment",
      "(?:New|Renew|Provide|Declare)(?:Expandable)?DocumentCommand",
      "(?:New|Renew|Provide|Declare)DocumentEnvironment",
      "(?:(?:e|g|x)?def|let)",
      "(?:begin|end)",
      "(?:part|chapter|(?:sub){0,2}section|(?:sub)?paragraph)",
      "caption",
      "(?:label|(?:eq|page|name)?ref|(?:paren|foot|super)?cite)",
      "(?:alpha|beta|[Gg]amma|[Dd]elta|(?:var)?epsilon|zeta|eta|[Tt]heta|vartheta)",
      "(?:iota|(?:var)?kappa|[Ll]ambda|mu|nu|[Xx]i|[Pp]i|varpi|(?:var)rho)",
      "(?:[Ss]igma|varsigma|tau|[Uu]psilon|[Pp]hi|varphi|chi|[Pp]si|[Oo]mega)",
      "(?:frac|sum|prod|lim|infty|times|sqrt|leq|geq|left|right|middle|[bB]igg?)",
      "(?:[lr]angle|q?quad|[lcvdi]?dots|d?dot|hat|tilde|bar)"
    ].map((word) => word + "(?![a-zA-Z@:_])"));
    const L3_REGEX = new RegExp([
      // A function \module_function_name:signature or \__module_function_name:signature,
      // where both module and function_name need at least two characters and
      // function_name may contain single underscores.
      "(?:__)?[a-zA-Z]{2,}_[a-zA-Z](?:_?[a-zA-Z])+:[a-zA-Z]*",
      // A variable \scope_module_and_name_type or \scope__module_ane_name_type,
      // where scope is one of l, g or c, type needs at least two characters
      // and module_and_name may contain single underscores.
      "[lgc]__?[a-zA-Z](?:_?[a-zA-Z])*_[a-zA-Z]{2,}",
      // A quark \q_the_name or \q__the_name or
      // scan mark \s_the_name or \s__vthe_name,
      // where variable_name needs at least two characters and
      // may contain single underscores.
      "[qs]__?[a-zA-Z](?:_?[a-zA-Z])+",
      // Other LaTeX3 macro names that are not covered by the three rules above.
      "use(?:_i)?:[a-zA-Z]*",
      "(?:else|fi|or):",
      "(?:if|cs|exp):w",
      "(?:hbox|vbox):n",
      "::[a-zA-Z]_unbraced",
      "::[a-zA-Z:]"
    ].map((pattern) => pattern + "(?![a-zA-Z:_])").join("|"));
    const L2_VARIANTS = [
      { begin: /[a-zA-Z@]+/ },
      // control word
      { begin: /[^a-zA-Z@]?/ }
      // control symbol
    ];
    const DOUBLE_CARET_VARIANTS = [
      { begin: /\^{6}[0-9a-f]{6}/ },
      { begin: /\^{5}[0-9a-f]{5}/ },
      { begin: /\^{4}[0-9a-f]{4}/ },
      { begin: /\^{3}[0-9a-f]{3}/ },
      { begin: /\^{2}[0-9a-f]{2}/ },
      { begin: /\^{2}[\u0000-\u007f]/ }
    ];
    const CONTROL_SEQUENCE = {
      className: "keyword",
      begin: /\\/,
      relevance: 0,
      contains: [
        {
          endsParent: true,
          begin: KNOWN_CONTROL_WORDS
        },
        {
          endsParent: true,
          begin: L3_REGEX
        },
        {
          endsParent: true,
          variants: DOUBLE_CARET_VARIANTS
        },
        {
          endsParent: true,
          relevance: 0,
          variants: L2_VARIANTS
        }
      ]
    };
    const MACRO_PARAM = {
      className: "params",
      relevance: 0,
      begin: /#+\d?/
    };
    const DOUBLE_CARET_CHAR = {
      // relevance: 1
      variants: DOUBLE_CARET_VARIANTS
    };
    const SPECIAL_CATCODE = {
      className: "built_in",
      relevance: 0,
      begin: /[$&^_]/
    };
    const MAGIC_COMMENT = {
      className: "meta",
      begin: /% ?!(T[eE]X|tex|BIB|bib)/,
      end: "$",
      relevance: 10
    };
    const COMMENT = hljs.COMMENT(
      "%",
      "$",
      { relevance: 0 }
    );
    const EVERYTHING_BUT_VERBATIM = [
      CONTROL_SEQUENCE,
      MACRO_PARAM,
      DOUBLE_CARET_CHAR,
      SPECIAL_CATCODE,
      MAGIC_COMMENT,
      COMMENT
    ];
    const BRACE_GROUP_NO_VERBATIM = {
      begin: /\{/,
      end: /\}/,
      relevance: 0,
      contains: [
        "self",
        ...EVERYTHING_BUT_VERBATIM
      ]
    };
    const ARGUMENT_BRACES = hljs.inherit(
      BRACE_GROUP_NO_VERBATIM,
      {
        relevance: 0,
        endsParent: true,
        contains: [
          BRACE_GROUP_NO_VERBATIM,
          ...EVERYTHING_BUT_VERBATIM
        ]
      }
    );
    const ARGUMENT_BRACKETS = {
      begin: /\[/,
      end: /\]/,
      endsParent: true,
      relevance: 0,
      contains: [
        BRACE_GROUP_NO_VERBATIM,
        ...EVERYTHING_BUT_VERBATIM
      ]
    };
    const SPACE_GOBBLER = {
      begin: /\s+/,
      relevance: 0
    };
    const ARGUMENT_M = [ARGUMENT_BRACES];
    const ARGUMENT_O = [ARGUMENT_BRACKETS];
    const ARGUMENT_AND_THEN = function(arg, starts_mode) {
      return {
        contains: [SPACE_GOBBLER],
        starts: {
          relevance: 0,
          contains: arg,
          starts: starts_mode
        }
      };
    };
    const CSNAME = function(csname, starts_mode) {
      return {
        begin: "\\\\" + csname + "(?![a-zA-Z@:_])",
        keywords: {
          $pattern: /\\[a-zA-Z]+/,
          keyword: "\\" + csname
        },
        relevance: 0,
        contains: [SPACE_GOBBLER],
        starts: starts_mode
      };
    };
    const BEGIN_ENV = function(envname, starts_mode) {
      return hljs.inherit(
        {
          begin: "\\\\begin(?=[ 	]*(\\r?\\n[ 	]*)?\\{" + envname + "\\})",
          keywords: {
            $pattern: /\\[a-zA-Z]+/,
            keyword: "\\begin"
          },
          relevance: 0
        },
        ARGUMENT_AND_THEN(ARGUMENT_M, starts_mode)
      );
    };
    const VERBATIM_DELIMITED_EQUAL = (innerName = "string") => {
      return hljs.END_SAME_AS_BEGIN({
        className: innerName,
        begin: /(.|\r?\n)/,
        end: /(.|\r?\n)/,
        excludeBegin: true,
        excludeEnd: true,
        endsParent: true
      });
    };
    const VERBATIM_DELIMITED_ENV = function(envname) {
      return {
        className: "string",
        end: "(?=\\\\end\\{" + envname + "\\})"
      };
    };
    const VERBATIM_DELIMITED_BRACES = (innerName = "string") => {
      return {
        relevance: 0,
        begin: /\{/,
        starts: {
          endsParent: true,
          contains: [
            {
              className: innerName,
              end: /(?=\})/,
              endsParent: true,
              contains: [
                {
                  begin: /\{/,
                  end: /\}/,
                  relevance: 0,
                  contains: ["self"]
                }
              ]
            }
          ]
        }
      };
    };
    const VERBATIM = [
      ...[
        "verb",
        "lstinline"
      ].map((csname) => CSNAME(csname, { contains: [VERBATIM_DELIMITED_EQUAL()] })),
      CSNAME("mint", ARGUMENT_AND_THEN(ARGUMENT_M, { contains: [VERBATIM_DELIMITED_EQUAL()] })),
      CSNAME("mintinline", ARGUMENT_AND_THEN(ARGUMENT_M, { contains: [
        VERBATIM_DELIMITED_BRACES(),
        VERBATIM_DELIMITED_EQUAL()
      ] })),
      CSNAME("url", { contains: [
        VERBATIM_DELIMITED_BRACES("link"),
        VERBATIM_DELIMITED_BRACES("link")
      ] }),
      CSNAME("hyperref", { contains: [VERBATIM_DELIMITED_BRACES("link")] }),
      CSNAME("href", ARGUMENT_AND_THEN(ARGUMENT_O, { contains: [VERBATIM_DELIMITED_BRACES("link")] })),
      ...[].concat(...[
        "",
        "\\*"
      ].map((suffix) => [
        BEGIN_ENV("verbatim" + suffix, VERBATIM_DELIMITED_ENV("verbatim" + suffix)),
        BEGIN_ENV("filecontents" + suffix, ARGUMENT_AND_THEN(ARGUMENT_M, VERBATIM_DELIMITED_ENV("filecontents" + suffix))),
        ...[
          "",
          "B",
          "L"
        ].map(
          (prefix) => BEGIN_ENV(prefix + "Verbatim" + suffix, ARGUMENT_AND_THEN(ARGUMENT_O, VERBATIM_DELIMITED_ENV(prefix + "Verbatim" + suffix)))
        )
      ])),
      BEGIN_ENV("minted", ARGUMENT_AND_THEN(ARGUMENT_O, ARGUMENT_AND_THEN(ARGUMENT_M, VERBATIM_DELIMITED_ENV("minted"))))
    ];
    return {
      name: "LaTeX",
      aliases: ["tex"],
      contains: [
        ...VERBATIM,
        ...EVERYTHING_BUT_VERBATIM
      ]
    };
  }

  // node_modules/highlight.js/es/languages/powershell.js
  function powershell(hljs) {
    const TYPES3 = [
      "string",
      "char",
      "byte",
      "int",
      "long",
      "bool",
      "decimal",
      "single",
      "double",
      "DateTime",
      "xml",
      "array",
      "hashtable",
      "void"
    ];
    const VALID_VERBS = "Add|Clear|Close|Copy|Enter|Exit|Find|Format|Get|Hide|Join|Lock|Move|New|Open|Optimize|Pop|Push|Redo|Remove|Rename|Reset|Resize|Search|Select|Set|Show|Skip|Split|Step|Switch|Undo|Unlock|Watch|Backup|Checkpoint|Compare|Compress|Convert|ConvertFrom|ConvertTo|Dismount|Edit|Expand|Export|Group|Import|Initialize|Limit|Merge|Mount|Out|Publish|Restore|Save|Sync|Unpublish|Update|Approve|Assert|Build|Complete|Confirm|Deny|Deploy|Disable|Enable|Install|Invoke|Register|Request|Restart|Resume|Start|Stop|Submit|Suspend|Uninstall|Unregister|Wait|Debug|Measure|Ping|Repair|Resolve|Test|Trace|Connect|Disconnect|Read|Receive|Send|Write|Block|Grant|Protect|Revoke|Unblock|Unprotect|Use|ForEach|Sort|Tee|Where";
    const COMPARISON_OPERATORS = "-and|-as|-band|-bnot|-bor|-bxor|-casesensitive|-ccontains|-ceq|-cge|-cgt|-cle|-clike|-clt|-cmatch|-cne|-cnotcontains|-cnotlike|-cnotmatch|-contains|-creplace|-csplit|-eq|-exact|-f|-file|-ge|-gt|-icontains|-ieq|-ige|-igt|-ile|-ilike|-ilt|-imatch|-in|-ine|-inotcontains|-inotlike|-inotmatch|-ireplace|-is|-isnot|-isplit|-join|-le|-like|-lt|-match|-ne|-not|-notcontains|-notin|-notlike|-notmatch|-or|-regex|-replace|-shl|-shr|-split|-wildcard|-xor";
    const KEYWORDS3 = {
      $pattern: /-?[A-z\.\-]+\b/,
      keyword: "if else foreach return do while until elseif begin for trap data dynamicparam end break throw param continue finally in switch exit filter try process catch hidden static parameter",
      // "echo" relevance has been set to 0 to avoid auto-detect conflicts with shell transcripts
      built_in: "ac asnp cat cd CFS chdir clc clear clhy cli clp cls clv cnsn compare copy cp cpi cpp curl cvpa dbp del diff dir dnsn ebp echo|0 epal epcsv epsn erase etsn exsn fc fhx fl ft fw gal gbp gc gcb gci gcm gcs gdr gerr ghy gi gin gjb gl gm gmo gp gps gpv group gsn gsnp gsv gtz gu gv gwmi h history icm iex ihy ii ipal ipcsv ipmo ipsn irm ise iwmi iwr kill lp ls man md measure mi mount move mp mv nal ndr ni nmo npssc nsn nv ogv oh popd ps pushd pwd r rbp rcjb rcsn rd rdr ren ri rjb rm rmdir rmo rni rnp rp rsn rsnp rujb rv rvpa rwmi sajb sal saps sasv sbp sc scb select set shcm si sl sleep sls sort sp spjb spps spsv start stz sujb sv swmi tee trcm type wget where wjb write"
      // TODO: 'validate[A-Z]+' can't work in keywords
    };
    const TITLE_NAME_RE = /\w[\w\d]*((-)[\w\d]+)*/;
    const BACKTICK_ESCAPE = {
      begin: "`[\\s\\S]",
      relevance: 0
    };
    const VAR = {
      className: "variable",
      variants: [
        { begin: /\$\B/ },
        {
          className: "keyword",
          begin: /\$this/
        },
        { begin: /\$[\w\d][\w\d_:]*/ }
      ]
    };
    const LITERAL = {
      className: "literal",
      begin: /\$(null|true|false)\b/
    };
    const QUOTE_STRING = {
      className: "string",
      variants: [
        {
          begin: /"/,
          end: /"/
        },
        {
          begin: /@"/,
          end: /^"@/
        }
      ],
      contains: [
        BACKTICK_ESCAPE,
        VAR,
        {
          className: "variable",
          begin: /\$[A-z]/,
          end: /[^A-z]/
        }
      ]
    };
    const APOS_STRING = {
      className: "string",
      variants: [
        {
          begin: /'/,
          end: /'/
        },
        {
          begin: /@'/,
          end: /^'@/
        }
      ]
    };
    const PS_HELPTAGS = {
      className: "doctag",
      variants: [
        /* no paramater help tags */
        { begin: /\.(synopsis|description|example|inputs|outputs|notes|link|component|role|functionality)/ },
        /* one parameter help tags */
        { begin: /\.(parameter|forwardhelptargetname|forwardhelpcategory|remotehelprunspace|externalhelp)\s+\S+/ }
      ]
    };
    const PS_COMMENT = hljs.inherit(
      hljs.COMMENT(null, null),
      {
        variants: [
          /* single-line comment */
          {
            begin: /#/,
            end: /$/
          },
          /* multi-line comment */
          {
            begin: /<#/,
            end: /#>/
          }
        ],
        contains: [PS_HELPTAGS]
      }
    );
    const CMDLETS = {
      className: "built_in",
      variants: [{ begin: "(".concat(VALID_VERBS, ")+(-)[\\w\\d]+") }]
    };
    const PS_CLASS = {
      className: "class",
      beginKeywords: "class enum",
      end: /\s*[{]/,
      excludeEnd: true,
      relevance: 0,
      contains: [hljs.TITLE_MODE]
    };
    const PS_FUNCTION = {
      className: "function",
      begin: /function\s+/,
      end: /\s*\{|$/,
      excludeEnd: true,
      returnBegin: true,
      relevance: 0,
      contains: [
        {
          begin: "function",
          relevance: 0,
          className: "keyword"
        },
        {
          className: "title",
          begin: TITLE_NAME_RE,
          relevance: 0
        },
        {
          begin: /\(/,
          end: /\)/,
          className: "params",
          relevance: 0,
          contains: [VAR]
        }
        // CMDLETS
      ]
    };
    const PS_USING = {
      begin: /using\s/,
      end: /$/,
      returnBegin: true,
      contains: [
        QUOTE_STRING,
        APOS_STRING,
        {
          className: "keyword",
          begin: /(using|assembly|command|module|namespace|type)/
        }
      ]
    };
    const PS_ARGUMENTS = { variants: [
      // PS literals are pretty verbose so it's a good idea to accent them a bit.
      {
        className: "operator",
        begin: "(".concat(COMPARISON_OPERATORS, ")\\b")
      },
      {
        className: "literal",
        begin: /(-){1,2}[\w\d-]+/,
        relevance: 0
      }
    ] };
    const HASH_SIGNS = {
      className: "selector-tag",
      begin: /@\B/,
      relevance: 0
    };
    const PS_METHODS = {
      className: "function",
      begin: /\[.*\]\s*[\w]+[ ]??\(/,
      end: /$/,
      returnBegin: true,
      relevance: 0,
      contains: [
        {
          className: "keyword",
          begin: "(".concat(
            KEYWORDS3.keyword.toString().replace(
              /\s/g,
              "|"
            ),
            ")\\b"
          ),
          endsParent: true,
          relevance: 0
        },
        hljs.inherit(hljs.TITLE_MODE, { endsParent: true })
      ]
    };
    const GENTLEMANS_SET = [
      // STATIC_MEMBER,
      PS_METHODS,
      PS_COMMENT,
      BACKTICK_ESCAPE,
      hljs.NUMBER_MODE,
      QUOTE_STRING,
      APOS_STRING,
      // PS_NEW_OBJECT_TYPE,
      CMDLETS,
      VAR,
      LITERAL,
      HASH_SIGNS
    ];
    const PS_TYPE = {
      begin: /\[/,
      end: /\]/,
      excludeBegin: true,
      excludeEnd: true,
      relevance: 0,
      contains: [].concat(
        "self",
        GENTLEMANS_SET,
        {
          begin: "(" + TYPES3.join("|") + ")",
          className: "built_in",
          relevance: 0
        },
        {
          className: "type",
          begin: /[\.\w\d]+/,
          relevance: 0
        }
      )
    };
    PS_METHODS.contains.unshift(PS_TYPE);
    return {
      name: "PowerShell",
      aliases: [
        "pwsh",
        "ps",
        "ps1"
      ],
      case_insensitive: true,
      keywords: KEYWORDS3,
      contains: GENTLEMANS_SET.concat(
        PS_CLASS,
        PS_FUNCTION,
        PS_USING,
        PS_ARGUMENTS,
        PS_TYPE
      )
    };
  }

  // node_modules/highlight.js/es/languages/c.js
  function c(hljs) {
    const regex = hljs.regex;
    const C_LINE_COMMENT_MODE = hljs.COMMENT("//", "$", { contains: [{ begin: /\\\n/ }] });
    const DECLTYPE_AUTO_RE = "decltype\\(auto\\)";
    const NAMESPACE_RE = "[a-zA-Z_]\\w*::";
    const TEMPLATE_ARGUMENT_RE = "<[^<>]+>";
    const FUNCTION_TYPE_RE = "(" + DECLTYPE_AUTO_RE + "|" + regex.optional(NAMESPACE_RE) + "[a-zA-Z_]\\w*" + regex.optional(TEMPLATE_ARGUMENT_RE) + ")";
    const TYPES3 = {
      className: "type",
      variants: [
        { begin: "\\b[a-z\\d_]*_t\\b" },
        { match: /\batomic_[a-z]{3,6}\b/ }
      ]
    };
    const CHARACTER_ESCAPES = "\\\\(x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4,8}|[0-7]{3}|\\S)";
    const STRINGS2 = {
      className: "string",
      variants: [
        {
          begin: '(u8?|U|L)?"',
          end: '"',
          illegal: "\\n",
          contains: [hljs.BACKSLASH_ESCAPE]
        },
        {
          begin: "(u8?|U|L)?'(" + CHARACTER_ESCAPES + "|.)",
          end: "'",
          illegal: "."
        },
        hljs.END_SAME_AS_BEGIN({
          begin: /(?:u8?|U|L)?R"([^()\\ ]{0,16})\(/,
          end: /\)([^()\\ ]{0,16})"/
        })
      ]
    };
    const NUMBERS = {
      className: "number",
      variants: [
        { match: /\b(0b[01']+)/ },
        { match: /(-?)\b([\d']+(\.[\d']*)?|\.[\d']+)((ll|LL|l|L)(u|U)?|(u|U)(ll|LL|l|L)?|f|F|b|B)/ },
        { match: /(-?)\b(0[xX][a-fA-F0-9]+(?:'[a-fA-F0-9]+)*(?:\.[a-fA-F0-9]*(?:'[a-fA-F0-9]*)*)?(?:[pP][-+]?[0-9]+)?(l|L)?(u|U)?)/ },
        { match: /(-?)\b\d+(?:'\d+)*(?:\.\d*(?:'\d*)*)?(?:[eE][-+]?\d+)?/ }
      ],
      relevance: 0
    };
    const PREPROCESSOR = {
      className: "meta",
      begin: /#\s*[a-z]+\b/,
      end: /$/,
      keywords: { keyword: "if else elif endif define undef warning error line pragma _Pragma ifdef ifndef elifdef elifndef include" },
      contains: [
        {
          begin: /\\\n/,
          relevance: 0
        },
        hljs.inherit(STRINGS2, { className: "string" }),
        {
          className: "string",
          begin: /<.*?>/
        },
        C_LINE_COMMENT_MODE,
        hljs.C_BLOCK_COMMENT_MODE
      ]
    };
    const TITLE_MODE = {
      className: "title",
      begin: regex.optional(NAMESPACE_RE) + hljs.IDENT_RE,
      relevance: 0
    };
    const FUNCTION_TITLE = regex.optional(NAMESPACE_RE) + hljs.IDENT_RE + "\\s*\\(";
    const C_KEYWORDS = [
      "asm",
      "auto",
      "break",
      "case",
      "continue",
      "default",
      "do",
      "else",
      "enum",
      "extern",
      "for",
      "fortran",
      "goto",
      "if",
      "inline",
      "register",
      "restrict",
      "return",
      "sizeof",
      "typeof",
      "typeof_unqual",
      "struct",
      "switch",
      "typedef",
      "union",
      "volatile",
      "while",
      "_Alignas",
      "_Alignof",
      "_Atomic",
      "_Generic",
      "_Noreturn",
      "_Static_assert",
      "_Thread_local",
      // aliases
      "alignas",
      "alignof",
      "noreturn",
      "static_assert",
      "thread_local",
      // not a C keyword but is, for all intents and purposes, treated exactly like one.
      "_Pragma"
    ];
    const C_TYPES = [
      "float",
      "double",
      "signed",
      "unsigned",
      "int",
      "short",
      "long",
      "char",
      "void",
      "_Bool",
      "_BitInt",
      "_Complex",
      "_Imaginary",
      "_Decimal32",
      "_Decimal64",
      "_Decimal96",
      "_Decimal128",
      "_Decimal64x",
      "_Decimal128x",
      "_Float16",
      "_Float32",
      "_Float64",
      "_Float128",
      "_Float32x",
      "_Float64x",
      "_Float128x",
      // modifiers
      "const",
      "static",
      "constexpr",
      // aliases
      "complex",
      "bool",
      "imaginary"
    ];
    const KEYWORDS3 = {
      keyword: C_KEYWORDS,
      type: C_TYPES,
      literal: "true false NULL",
      // TODO: apply hinting work similar to what was done in cpp.js
      built_in: "std string wstring cin cout cerr clog stdin stdout stderr stringstream istringstream ostringstream auto_ptr deque list queue stack vector map set pair bitset multiset multimap unordered_set unordered_map unordered_multiset unordered_multimap priority_queue make_pair array shared_ptr abort terminate abs acos asin atan2 atan calloc ceil cosh cos exit exp fabs floor fmod fprintf fputs free frexp fscanf future isalnum isalpha iscntrl isdigit isgraph islower isprint ispunct isspace isupper isxdigit tolower toupper labs ldexp log10 log malloc realloc memchr memcmp memcpy memset modf pow printf putchar puts scanf sinh sin snprintf sprintf sqrt sscanf strcat strchr strcmp strcpy strcspn strlen strncat strncmp strncpy strpbrk strrchr strspn strstr tanh tan vfprintf vprintf vsprintf endl initializer_list unique_ptr"
    };
    const EXPRESSION_CONTAINS = [
      PREPROCESSOR,
      TYPES3,
      C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      NUMBERS,
      STRINGS2
    ];
    const EXPRESSION_CONTEXT = {
      // This mode covers expression context where we can't expect a function
      // definition and shouldn't highlight anything that looks like one:
      // `return some()`, `else if()`, `(x*sum(1, 2))`
      variants: [
        {
          begin: /=/,
          end: /;/
        },
        {
          begin: /\(/,
          end: /\)/
        },
        {
          beginKeywords: "new throw return else",
          end: /;/
        }
      ],
      keywords: KEYWORDS3,
      contains: EXPRESSION_CONTAINS.concat([
        {
          begin: /\(/,
          end: /\)/,
          keywords: KEYWORDS3,
          contains: EXPRESSION_CONTAINS.concat(["self"]),
          relevance: 0
        }
      ]),
      relevance: 0
    };
    const FUNCTION_DECLARATION = {
      begin: "(" + FUNCTION_TYPE_RE + "[\\*&\\s]+)+" + FUNCTION_TITLE,
      returnBegin: true,
      end: /[{;=]/,
      excludeEnd: true,
      keywords: KEYWORDS3,
      illegal: /[^\w\s\*&:<>.]/,
      contains: [
        {
          // to prevent it from being confused as the function title
          begin: DECLTYPE_AUTO_RE,
          keywords: KEYWORDS3,
          relevance: 0
        },
        {
          begin: FUNCTION_TITLE,
          returnBegin: true,
          contains: [hljs.inherit(TITLE_MODE, { className: "title.function" })],
          relevance: 0
        },
        // allow for multiple declarations, e.g.:
        // extern void f(int), g(char);
        {
          relevance: 0,
          match: /,/
        },
        {
          className: "params",
          begin: /\(/,
          end: /\)/,
          keywords: KEYWORDS3,
          relevance: 0,
          contains: [
            C_LINE_COMMENT_MODE,
            hljs.C_BLOCK_COMMENT_MODE,
            STRINGS2,
            NUMBERS,
            TYPES3,
            // Count matching parentheses.
            {
              begin: /\(/,
              end: /\)/,
              keywords: KEYWORDS3,
              relevance: 0,
              contains: [
                "self",
                C_LINE_COMMENT_MODE,
                hljs.C_BLOCK_COMMENT_MODE,
                STRINGS2,
                NUMBERS,
                TYPES3
              ]
            }
          ]
        },
        TYPES3,
        C_LINE_COMMENT_MODE,
        hljs.C_BLOCK_COMMENT_MODE,
        PREPROCESSOR
      ]
    };
    return {
      name: "C",
      aliases: ["h"],
      keywords: KEYWORDS3,
      // Until differentiations are added between `c` and `cpp`, `c` will
      // not be auto-detected to avoid auto-detect conflicts between C and C++
      disableAutodetect: true,
      illegal: "</",
      contains: [].concat(
        EXPRESSION_CONTEXT,
        FUNCTION_DECLARATION,
        EXPRESSION_CONTAINS,
        [
          PREPROCESSOR,
          {
            begin: hljs.IDENT_RE + "::",
            keywords: KEYWORDS3
          },
          {
            className: "class",
            beginKeywords: "enum class struct union",
            end: /[{;:<>=]/,
            contains: [
              { beginKeywords: "final class struct" },
              hljs.TITLE_MODE
            ]
          }
        ]
      ),
      exports: {
        preprocessor: PREPROCESSOR,
        strings: STRINGS2,
        keywords: KEYWORDS3
      }
    };
  }

  // node_modules/highlight.js/es/languages/matlab.js
  function matlab(hljs) {
    const TRANSPOSE_RE = "('|\\.')+";
    const TRANSPOSE = {
      relevance: 0,
      contains: [{ begin: TRANSPOSE_RE }]
    };
    return {
      name: "Matlab",
      keywords: {
        keyword: "arguments break case catch classdef continue else elseif end enumeration events for function global if methods otherwise parfor persistent properties return spmd switch try while",
        built_in: "sin sind sinh asin asind asinh cos cosd cosh acos acosd acosh tan tand tanh atan atand atan2 atanh sec secd sech asec asecd asech csc cscd csch acsc acscd acsch cot cotd coth acot acotd acoth hypot exp expm1 log log1p log10 log2 pow2 realpow reallog realsqrt sqrt nthroot nextpow2 abs angle complex conj imag real unwrap isreal cplxpair fix floor ceil round mod rem sign airy besselj bessely besselh besseli besselk beta betainc betaln ellipj ellipke erf erfc erfcx erfinv expint gamma gammainc gammaln psi legendre cross dot factor isprime primes gcd lcm rat rats perms nchoosek factorial cart2sph cart2pol pol2cart sph2cart hsv2rgb rgb2hsv zeros ones eye repmat rand randn linspace logspace freqspace meshgrid accumarray size length ndims numel disp isempty isequal isequalwithequalnans cat reshape diag blkdiag tril triu fliplr flipud flipdim rot90 find sub2ind ind2sub bsxfun ndgrid permute ipermute shiftdim circshift squeeze isscalar isvector ans eps realmax realmin pi i|0 inf nan isnan isinf isfinite j|0 why compan gallery hadamard hankel hilb invhilb magic pascal rosser toeplitz vander wilkinson max min nanmax nanmin mean nanmean type table readtable writetable sortrows sort figure plot plot3 scatter scatter3 cellfun legend intersect ismember procrustes hold num2cell "
      },
      illegal: '(//|"|#|/\\*|\\s+/\\w+)',
      contains: [
        {
          className: "function",
          beginKeywords: "function",
          end: "$",
          contains: [
            hljs.UNDERSCORE_TITLE_MODE,
            {
              className: "params",
              variants: [
                {
                  begin: "\\(",
                  end: "\\)"
                },
                {
                  begin: "\\[",
                  end: "\\]"
                }
              ]
            }
          ]
        },
        {
          className: "built_in",
          begin: /true|false/,
          relevance: 0,
          starts: TRANSPOSE
        },
        {
          begin: "[a-zA-Z][a-zA-Z_0-9]*" + TRANSPOSE_RE,
          relevance: 0
        },
        {
          className: "number",
          begin: hljs.C_NUMBER_RE,
          relevance: 0,
          starts: TRANSPOSE
        },
        {
          className: "string",
          begin: "'",
          end: "'",
          contains: [{ begin: "''" }]
        },
        {
          begin: /\]|\}|\)/,
          relevance: 0,
          starts: TRANSPOSE
        },
        {
          className: "string",
          begin: '"',
          end: '"',
          contains: [{ begin: '""' }],
          starts: TRANSPOSE
        },
        hljs.COMMENT("^\\s*%\\{\\s*$", "^\\s*%\\}\\s*$"),
        hljs.COMMENT("%", "$")
      ]
    };
  }

  // src/renderer.js
  [
    ["javascript", javascript],
    ["typescript", typescript],
    ["python", python],
    ["bash", bash],
    ["cpp", cpp],
    ["java", java],
    ["go", go],
    ["rust", rust],
    ["sql", sql],
    ["json", json],
    ["xml", xml],
    ["markdown", markdown],
    ["css", css],
    ["yaml", yaml],
    ["latex", latex],
    ["powershell", powershell],
    ["c", c],
    ["matlab", matlab]
  ].forEach(([name, def2]) => core_default.registerLanguage(name, def2));
  var ON_HEADING_COLOR = "#1e4e79";
  var CODE_BG = "#f6f8fa";
  var CODE_FONT_KEY = "ai-copy-code-font";
  var CODE_FONT_FALLBACK = "Consolas,'Courier New',monospace";
  function getCodeFont() {
    let user = "";
    try {
      user = (localStorage.getItem(CODE_FONT_KEY) || "").trim();
    } catch (_) {
    }
    if (!user) return CODE_FONT_FALLBACK;
    const safe = user.replace(/'/g, "\\'");
    return `'${safe}',${CODE_FONT_FALLBACK}`;
  }
  var HEADING_FONT_SIZE = { 1: "20pt", 2: "16pt", 3: "14pt", 4: "12pt", 5: "11.5pt", 6: "11pt" };
  var HEADING_MARGIN = "margin-top:11pt;margin-bottom:11pt";
  function headingStyle(depth) {
    return `font-size:${HEADING_FONT_SIZE[depth]};color:${ON_HEADING_COLOR};${HEADING_MARGIN}`;
  }
  function buildMarked() {
    const marked2 = new Marked({ gfm: true, breaks: false });
    marked2.use({
      renderer: {
        // Form controls are discarded by paste targets. Visible Unicode boxes
        // preserve task state, without claiming to create native OneNote tags.
        checkbox({ checked }) {
          return checked ? "\u2611" : "\u2610";
        },
        list(token) {
          if (!token.items.every((item) => item.task)) return false;
          return token.items.map((item) => {
            const body = this.parser.parse(item.tokens, false);
            return `<div>${item.checked ? "\u2611" : "\u2610"} ${body}</div>
`;
          }).join("");
        },
        // Headings → emit the exact inline style OneNote uses for its built-in
        // heading styles, so paste maps them to real heading styles.
        heading({ tokens, depth }) {
          const text2 = this.parser.parseInline(tokens);
          return `<h${depth} style="${headingStyle(depth)}">${text2}</h${depth}>
`;
        },
        // Code block → OneNote-friendly div. OneNote does not preserve <pre>;
        // we render a styled div with an optional language label. When the
        // language is registered, the body is syntax-highlighted (hljs), with
        // token classes rewritten to inline color styles (see highlightToHtml).
        code({ text: text2, lang }) {
          const language = (lang || "").trim();
          const font = getCodeFont();
          const label = language ? `<div style="font-family:${font};font-size:10pt;color:#6a737d;padding:2px 8px 0 8px">${escapeHtml(language)}</div>` : "";
          const body = `<pre style="margin:0;padding:8px;white-space:pre-wrap;word-break:break-word;font-family:${font};font-size:10pt">${codeBodyToHtml(text2, language)}</pre>`;
          return `<div style="background-color:${CODE_BG};border:1px solid #e1e4e8;border-radius:4px;margin:8px 0;overflow-x:auto">${label}${body}</div>`;
        }
      },
      // Math support. The converter emits `$...$` (inline) and `$$...$$` (block).
      // We register these as marked extensions so they are tokenised by marked
      // itself — which means a `$` INSIDE a fenced code block is never mistaken
      // for math (marked has already classified that text as a code token before
      // the inline tokenizer runs). Each token is rendered to Presentation MathML
      // via Temml; OneNote converts embedded `<math>` to native equations on paste.
      extensions: [
        {
          name: "blockMath",
          level: "block",
          start(src) {
            return src.indexOf("$$");
          },
          tokenizer(src) {
            const m = /^\$\$([\s\S]+?)\$\$(?:\n|$)/.exec(src);
            if (m) {
              const tex = m[1];
              return { type: "blockMath", raw: "$$" + tex + "$$", tex };
            }
          },
          renderer({ tex }) {
            return renderMath(tex, true);
          }
        },
        {
          name: "inlineMath",
          level: "inline",
          start(src) {
            return src.indexOf("$");
          },
          tokenizer(src) {
            const m = /^\$((?:\\\$|[^\$\n])+?)\$/.exec(src);
            if (m && m[1].trim()) {
              const tex = m[1];
              return { type: "inlineMath", raw: "$" + tex + "$", tex };
            }
          },
          renderer({ tex }) {
            return renderMath(tex, false);
          }
        }
      ]
    });
    return marked2;
  }
  var _marked = buildMarked();
  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function renderMath(tex, displayMode) {
    try {
      const mathml = temml$1.renderToString(tex, { displayMode, throwOnError: false });
      return mathml.replace(/<annotation[\s\S]*?<\/annotation>/g, "") + "\n";
    } catch (_) {
      return "<code>" + escapeHtml(tex) + "</code>";
    }
  }
  var TOKEN_COLORS = {
    keyword: "#d73a49",
    "selector-tag": "#d73a49",
    "selector-id": "#d73a49",
    "selector-class": "#d73a49",
    built_in: "#005cc5",
    builtin: "#005cc5",
    type: "#005cc5",
    "class-builtin": "#005cc5",
    literal: "#005cc5",
    number: "#005cc5",
    symbol: "#005cc5",
    bullet: "#005cc5",
    link: "#032f62",
    string: "#032f62",
    "meta-string": "#032f62",
    regexp: "#032f62",
    comment: "#6a737d",
    quote: "#6a737d",
    doctag: "#6a737d",
    title: "#6f42c1",
    "title.function_": "#6f42c1",
    "title.class_": "#6f42c1",
    section: "#6f42c1",
    "function.title": "#6f42c1",
    "class.title": "#6f42c1",
    attr: "#005cc5",
    attribute: "#005cc5",
    "template-variable": "#e36209",
    variable: "#e36209",
    "meta": "#6a737d",
    operator: "#005cc5",
    "property": "#005cc5",
    "params": "#24292e"
  };
  function highlightToHtml(code, lang) {
    const language = (lang || "").trim().toLowerCase();
    if (!language || !core_default.getLanguage(language)) return escapeHtml(code);
    try {
      const { value } = core_default.highlight(code, { language });
      return rewriteClassesToInlineColor(value);
    } catch (_) {
      return escapeHtml(code);
    }
  }
  function rewriteClassesToInlineColor(html2) {
    return html2.replace(/<span class="([^"]*)">/g, (whole, classes) => {
      const tokens = classes.split(/\s+/).map((c2) => c2.replace(/^hljs-/, ""));
      const matched = tokens.find((tok) => Object.prototype.hasOwnProperty.call(TOKEN_COLORS, tok));
      if (!matched) return "<span>";
      return `<span style="color:${TOKEN_COLORS[matched]}">`;
    });
  }
  function codeBodyToHtml(text2, lang) {
    if (lang && core_default.getLanguage(lang)) {
      const highlighted = highlightToHtml(text2, lang);
      return highlighted.replace(/^.*$/gm, (line) => line.startsWith("<") ? line : line.replace(/^( +)/, (lead) => "&nbsp;".repeat(lead.length)));
    }
    return escapeHtml(text2).replace(/^.*$/gm, (line) => line.replace(/^( +)/, (lead) => "&nbsp;".repeat(lead.length)));
  }
  function postProcess2(html2) {
    return html2.replace(/<table(?![^>]*\sborder=)/g, '<table border="1"');
  }
  function mdToOneNoteHtml(md) {
    if (!md || !md.trim()) return "";
    const raw = _marked.parse(md, { async: false });
    return postProcess2(String(raw));
  }

  // src/pipeline.js
  var BADGE_STYLES = {
    user: "background-color:#2563eb;color:#ffffff;font-size:11pt;font-weight:bold",
    assistant: "background-color:#0d9488;color:#ffffff;font-size:11pt;font-weight:bold"
  };
  var BADGE_LABEL = { user: t("badgeUser"), assistant: t("badgeAssistant") };
  function htmlToPlainText(html2) {
    let root3;
    if (typeof DOMParser !== "undefined") {
      root3 = new DOMParser().parseFromString(html2, "text/html").body;
    } else {
      root3 = document.createElement("div");
      root3.innerHTML = html2;
    }
    root3.querySelectorAll("p,div,li,tr,h1,h2,h3,h4,h5,h6").forEach((el) => {
      el.append("\n");
    });
    return (root3.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
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
  async function copyRichText(html2, text2) {
    if (typeof ClipboardItem === "undefined") {
      throw new Error("ClipboardItem is not supported in this browser.");
    }
    const item = new ClipboardItem({
      "text/html": new Blob([html2], { type: "text/html" }),
      "text/plain": new Blob([text2 || html2], { type: "text/plain" })
    });
    await navigator.clipboard.write([item]);
  }
  async function copyRichTextFallback(html2, text2) {
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
  async function copyForOneNote(html2, text2) {
    try {
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        await copyRichText(html2, text2);
        return { method: "clipboard-item" };
      }
    } catch (err) {
      console.warn("[ai-copy] ClipboardItem write failed, falling back:", err);
    }
    await copyRichTextFallback(html2, text2);
    return { method: "execcommand" };
  }

  // src/logo.js
  var LOGO_KEY = "ai-copy-logo";
  var SWAP_ATTR = "data-ai-copy-logo";
  var ORIG_ATTR = "data-ai-copy-orig";
  var KIMI_PATH = "M21.765.351C22.998.351 24 1.353 24 2.586S22.998 4.82 21.765 4.82h-1.974c-.15 0-.26-.12-.26-.26V2.586A2.237 2.237 0 0 1 21.765.35M9.41 13.388l8.447-8.377c.16-.16.07-.471-.14-.471h-4.55s-.1.02-.14.06l-9.099 9.029c-.14.14-.35.02-.35-.21V4.81c0-.15-.1-.27-.221-.27H.22c-.12 0-.22.12-.22.27v18.57c0 .15.1.27.22.27h3.137c.12 0 .22-.12.22-.27v-3.79c0-.08.03-.16.08-.21l2.826-2.796c.07-.07.16-.08.241-.03l7.546 5.551a8.9 8.9 0 0 0 4.018 1.493c.12.01.23-.11.23-.27V19.76c0-.14-.08-.25-.19-.26a5.8 5.8 0 0 1-2.355-.942l-6.533-4.73c-.14-.09-.15-.32-.03-.441";
  var DEEPSEEK_PATH = "M23.748 4.651c-.254-.124-.364.113-.512.233-.051.04-.094.09-.137.137-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.155-.708-.311-.955-.65-.172-.24-.219-.509-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.094.172.187.129.323-.082.28-.18.553-.266.833-.055.179-.137.218-.328.14a5.5 5.5 0 0 1-1.737-1.179c-.857-.828-1.631-1.743-2.597-2.46a12 12 0 0 0-.689-.47c-.985-.957.13-1.743.387-1.836.27-.098.094-.433-.778-.428-.872.003-1.67.295-2.687.685a3 3 0 0 1-.465.136 9.6 9.6 0 0 0-2.883-.101c-1.885.21-3.39 1.1-4.497 2.622C.082 8.776-.231 10.854.152 13.02c.403 2.284 1.568 4.175 3.36 5.653 1.857 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.132-.284 4.994-1.86.47.234.962.328 1.78.398.629.058 1.235-.031 1.705-.129.735-.155.684-.836.418-.961-2.155-1.004-1.682-.595-2.112-.926 1.095-1.295 2.768-3.598 3.284-6.733.05-.346.115-.834.108-1.114-.004-.171.035-.238.23-.257a4.2 4.2 0 0 0 1.545-.475c1.397-.763 1.96-2.016 2.093-3.517.02-.23-.004-.467-.247-.588M11.58 18.168c-2.088-1.642-3.101-2.183-3.52-2.16-.39.024-.32.472-.234.763.09.288.207.487.371.74.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.168-1.361-.801-2.5-1.86-3.301-3.306-.775-1.393-1.225-2.888-1.299-4.482-.02-.385.094-.522.477-.592a4.7 4.7 0 0 1 1.53-.038c2.131.311 3.946 1.264 5.467 2.774.868.86 1.525 1.887 2.202 2.89.72 1.066 1.494 2.082 2.48 2.915.348.291.626.513.892.677-.802.09-2.14.109-3.055-.615zm1.001-6.44a.306.306 0 0 1 .415-.287.3.3 0 0 1 .113.074.3.3 0 0 1 .086.214c0 .17-.136.307-.308.307a.303.303 0 0 1-.306-.307m3.11 1.596c-.2.081-.4.151-.591.16a1.25 1.25 0 0 1-.798-.254c-.274-.23-.47-.358-.551-.758a1.7 1.7 0 0 1 .015-.588c.07-.327-.007-.537-.238-.727-.188-.156-.426-.199-.689-.199a.6.6 0 0 1-.254-.078.253.253 0 0 1-.114-.358 1 1 0 0 1 .192-.21c.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.392.451.462.576.685.915.176.264.336.536.446.848.066.194-.02.353-.25.45";
  var DEEPSEEK_BLUE = "#5786FE";
  var KIMI_DARK = "#111111";
  var KIMI_LIGHT = "#f3f4f6";
  function svgDataUri(path, fill, darkFill) {
    const style = darkFill ? `<style>@media (prefers-color-scheme:dark){path{fill:${darkFill}}}</style>` : "";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${style}<path fill="${fill}" d="${path}"/></svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  var BRANDS = {
    kimi: {
      name: "Kimi",
      path: KIMI_PATH,
      inlineFill: "currentColor",
      imgUri: svgDataUri(KIMI_PATH, KIMI_DARK, KIMI_LIGHT)
    },
    deepseek: {
      name: "DeepSeek",
      path: DEEPSEEK_PATH,
      inlineFill: DEEPSEEK_BLUE,
      imgUri: svgDataUri(DEEPSEEK_PATH, DEEPSEEK_BLUE)
    }
  };
  var originals = /* @__PURE__ */ new WeakMap();
  function rememberOriginal(el, snapshot) {
    if (!originals.has(el)) originals.set(el, snapshot);
  }
  var debugState = { lastError: "" };
  function noteError(step, err) {
    debugState.lastError = step + ": " + (err && err.message || err);
  }
  function swapGemini(doc, choice, brand) {
    const img = doc.querySelector("img.sparkle-image");
    if (img && img.getAttribute(SWAP_ATTR) !== choice) {
      rememberOriginal(img, { src: img.getAttribute("src") || "" });
      img.setAttribute("src", brand.imgUri);
      img.setAttribute(SWAP_ATTR, choice);
    }
    const wmClone = doc.querySelector(`.gemini-sidenav-text[${SWAP_ATTR}]`);
    const wordmark = findOriginal(
      doc,
      ".side-nav-sparkle-button .gemini-sidenav-text",
      (el) => el
    );
    if (wordmark) ensureClone(doc, wordmark, wmClone, choice, brand);
    else if (wmClone) wmClone.remove();
    try {
      swapBrandTexts(doc, brand, "Gemini", "hallucination-disclaimer");
    } catch (err) {
      noteError("gemini-texts", err);
    }
  }
  function rewriteClone(clone, choice, brand) {
    if (clone.localName === "svg") {
      while (clone.firstChild) clone.firstChild.remove();
      const path = clone.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", brand.path);
      path.setAttribute("fill", brand.inlineFill);
      clone.appendChild(path);
    } else {
      clone.textContent = brand.name;
    }
    clone.setAttribute(SWAP_ATTR, choice);
  }
  function brandClone(orig, choice, brand) {
    const clone = orig.cloneNode(false);
    clone.removeAttribute(ORIG_ATTR);
    clone.style.display = "";
    rewriteClone(clone, choice, brand);
    return clone;
  }
  function findOriginal(doc, selector, pick) {
    const els = [...doc.querySelectorAll(selector)].map(pick).filter((el) => el && !el.hasAttribute(SWAP_ATTR));
    return els.find((el) => el.hasAttribute(ORIG_ATTR)) || els.find((el) => el.style.display !== "none");
  }
  function ensureClone(doc, orig, existingClone, choice, brand) {
    if (!orig.parentElement) return;
    if (!orig.hasAttribute(ORIG_ATTR)) {
      rememberOriginal(orig, { display: orig.style.display || "" });
      orig.style.display = "none";
      orig.setAttribute(ORIG_ATTR, "1");
    }
    if (existingClone && orig.nextElementSibling === existingClone) {
      if (existingClone.getAttribute("class") !== orig.getAttribute("class")) {
        existingClone.remove();
        orig.insertAdjacentElement("afterend", brandClone(orig, choice, brand));
      } else if (existingClone.getAttribute(SWAP_ATTR) !== choice) {
        rewriteClone(existingClone, choice, brand);
      }
      return;
    }
    if (existingClone) existingClone.remove();
    orig.insertAdjacentElement("afterend", brandClone(orig, choice, brand));
  }
  function blossomSvgs(doc) {
    const found = /* @__PURE__ */ new Set();
    for (const use2 of doc.querySelectorAll('use[href*="#blossom"]')) {
      const svg = use2.closest("svg");
      if (svg) found.add(svg);
    }
    for (const sym of doc.querySelectorAll("symbol#blossom")) {
      const svg = sym.closest("svg");
      if (svg) found.add(svg);
    }
    if (!found.size) {
      for (const btn of doc.querySelectorAll('button[aria-controls="stage-slideover-sidebar"]')) {
        const svg = btn.querySelector("svg");
        if (svg) found.add(svg);
      }
    }
    return [...found];
  }
  function swapChatGPT(doc, choice, brand) {
    try {
      for (const svg of blossomSvgs(doc)) {
        if (svg.isConnected === false) continue;
        if (svg.hasAttribute(SWAP_ATTR)) continue;
        ensureClone(doc, svg, adjacentClone(svg), choice, brand);
      }
      removeOrphanClones(doc, `svg[${SWAP_ATTR}]`);
    } catch (err) {
      noteError("blossom", err);
    }
    try {
      for (const wm of [...doc.querySelectorAll(".header-wordmark")]) {
        if (wm.isConnected === false) continue;
        if (wm.hasAttribute(SWAP_ATTR)) continue;
        ensureClone(doc, wm, adjacentClone(wm), choice, brand);
      }
      removeOrphanClones(doc, `.header-wordmark[${SWAP_ATTR}]`);
    } catch (err) {
      noteError("wordmark", err);
    }
    try {
      swapBrandTexts(doc, brand, "ChatGPT", '[data-testid="thread-disclaimer"]');
    } catch (err) {
      noteError("texts", err);
    }
  }
  function adjacentClone(orig) {
    const sib = orig.nextElementSibling;
    return sib && sib.hasAttribute(SWAP_ATTR) ? sib : null;
  }
  function removeOrphanClones(doc, cloneSelector) {
    for (const clone of [...doc.querySelectorAll(cloneSelector)]) {
      const prev = clone.previousElementSibling;
      if (!prev || !prev.hasAttribute(ORIG_ATTR)) clone.remove();
    }
  }
  function textNodesIn(root3) {
    const out = [];
    const walk = (node) => {
      for (const child of node.childNodes) {
        if (child.nodeType === 3) out.push(child);
        else if (child.nodeType === 1) walk(child);
      }
    };
    walk(root3);
    return out;
  }
  function cssQuote(s) {
    return '"' + s.replace(/[\\"]/g, "\\$&") + '"';
  }
  function swapBrandTexts(doc, brand, siteName, disclaimerSel) {
    try {
      const rules = [];
      for (const el of doc.querySelectorAll("[data-placeholder]")) {
        const snap = originals.get(el);
        const value = el.getAttribute("data-placeholder") || "";
        const orig = snap && typeof snap.placeholder === "string" ? snap.placeholder : value;
        if (orig.includes(siteName)) {
          if (!snap) rememberOriginal(el, { placeholder: value });
          const wanted = orig.split(siteName).join(brand.name);
          if (value !== wanted) el.setAttribute("data-placeholder", wanted);
          for (const pseudo of ["::before", "::after"]) {
            if (pseudoRenders(el, pseudo)) {
              rules.push(`[data-placeholder=${cssQuote(orig)}]${pseudo}{content:${cssQuote(wanted)}!important}`);
            }
          }
        }
        swapTextNodesIn(el, brand, siteName);
      }
      syncTextStyle(doc, rules);
    } catch (err) {
      noteError("placeholder", err);
    }
    try {
      for (const box of doc.querySelectorAll(disclaimerSel)) {
        swapTextNodesIn(box, brand, siteName);
      }
    } catch (err) {
      noteError("disclaimer", err);
    }
  }
  var TEXT_STYLE_ATTR = "data-ai-copy-text";
  function pseudoRenders(el, pseudo) {
    if (typeof getComputedStyle !== "function") return false;
    let content = "";
    try {
      content = (getComputedStyle(el, pseudo) || {}).content || "";
    } catch (_) {
      return false;
    }
    return content !== "none" && content !== "normal" && content !== "";
  }
  function syncTextStyle(doc, rules) {
    let style = doc.querySelector(`style[${TEXT_STYLE_ATTR}]`);
    if (!rules.length) {
      if (style) style.remove();
      return;
    }
    if (!style) {
      style = doc.createElement("style");
      style.setAttribute(TEXT_STYLE_ATTR, "1");
      (doc.head || doc.documentElement).appendChild(style);
    }
    const css2 = rules.join("\n");
    if (style.textContent !== css2) style.textContent = css2;
  }
  function swapTextNodesIn(scope, brand, siteName) {
    for (const node of textNodesIn(scope)) {
      const snap = originals.get(node);
      const value = node.nodeValue || "";
      if (!snap && !value.includes(siteName)) continue;
      const origText = snap && typeof snap.text === "string" ? snap.text : value;
      if (!snap) rememberOriginal(node, { text: value });
      const wanted = origText.split(siteName).join(brand.name);
      if (node.nodeValue !== wanted) node.nodeValue = wanted;
    }
  }
  function applyLogo(doc, hostname, choice) {
    const brand = BRANDS[choice];
    if (!brand) return;
    const host = (hostname || "").toLowerCase();
    const on = (h) => host === h || host.endsWith("." + h);
    if (on("gemini.google.com")) swapGemini(doc, choice, brand);
    else if (on("chatgpt.com") || on("chat.openai.com")) swapChatGPT(doc, choice, brand);
  }
  function readLogoSetting() {
    try {
      const v = (localStorage.getItem(LOGO_KEY) || "").trim().toLowerCase();
      return BRANDS[v] ? v : "";
    } catch (_) {
      return "";
    }
  }
  var observer = null;
  var debounceTimer = 0;
  var resyncTimer = 0;
  var RESYNC_MS = 1500;
  function ensureObserver() {
    if (observer || typeof MutationObserver === "undefined" || !document.body) return;
    observer = new MutationObserver(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(applyLogoSwap, 200);
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style", "data-placeholder"]
    });
    if (typeof setInterval === "function" && !resyncTimer) {
      resyncTimer = setInterval(applyLogoSwap, RESYNC_MS);
    }
  }
  function stopObserver() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (resyncTimer) {
      clearInterval(resyncTimer);
      resyncTimer = 0;
    }
    clearTimeout(debounceTimer);
  }
  function applyLogoSwap() {
    const choice = readLogoSetting();
    if (!choice) return;
    ensureObserver();
    applyLogo(document, typeof location !== "undefined" ? location.hostname : "", choice);
  }
  function restoreLogos(doc) {
    doc.querySelectorAll(`[${SWAP_ATTR}], [${ORIG_ATTR}]`).forEach((el) => {
      const orig = originals.get(el);
      if (el.hasAttribute(ORIG_ATTR)) {
        el.style.display = orig && orig.display || "";
        el.removeAttribute(ORIG_ATTR);
        originals.delete(el);
      } else if (orig && orig.src !== void 0) {
        el.setAttribute("src", orig.src);
        el.removeAttribute(SWAP_ATTR);
        originals.delete(el);
      } else {
        el.remove();
      }
    });
    doc.querySelectorAll(`style[${TEXT_STYLE_ATTR}]`).forEach((el) => el.remove());
    doc.querySelectorAll("[data-placeholder]").forEach((el) => {
      const snap = originals.get(el);
      if (snap && typeof snap.placeholder === "string") {
        if (el.getAttribute("data-placeholder") !== snap.placeholder) {
          el.setAttribute("data-placeholder", snap.placeholder);
        }
        originals.delete(el);
      }
      restoreTextNodesIn(el);
    });
    doc.querySelectorAll('[data-testid="thread-disclaimer"], hallucination-disclaimer').forEach((box) => restoreTextNodesIn(box));
  }
  function restoreTextNodesIn(scope) {
    for (const node of textNodesIn(scope)) {
      const snap = originals.get(node);
      if (snap && typeof snap.text === "string") {
        if (node.nodeValue !== snap.text) node.nodeValue = snap.text;
        originals.delete(node);
      }
    }
  }
  function clearLogoSetting(doc = document) {
    stopObserver();
    restoreLogos(doc);
  }
  if (typeof window !== "undefined") {
    try {
      window.__aiCopyLogoDebug = () => ({
        version: true ? "0.5.4" : "dev",
        choice: readLogoSetting(),
        placeholders: [...document.querySelectorAll("[data-placeholder]")].map((el) => el.getAttribute("data-placeholder")),
        overrideStyleInjected: !!document.querySelector(`style[${TEXT_STYLE_ATTR}]`),
        observerActive: !!observer,
        resyncActive: !!resyncTimer,
        lastError: debugState.lastError
      });
    } catch (_) {
    }
  }
  function promptLogoChoice(shadow, toastFn) {
    const current = readLogoSetting();
    let value;
    try {
      value = prompt(t("settingsLogoPrompt"), current);
    } catch (_) {
      toastFn(shadow, t("toastFail", { err: "prompt blocked" }), 2200);
      return;
    }
    if (value === null) return;
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) {
      try {
        localStorage.removeItem(LOGO_KEY);
      } catch (_) {
      }
      clearLogoSetting();
      toastFn(shadow, t("settingsLogoReset"));
      return;
    }
    if (!BRANDS[trimmed]) {
      toastFn(shadow, t("settingsLogoInvalid"), 2200);
      return;
    }
    try {
      localStorage.setItem(LOGO_KEY, trimmed);
      applyLogoSwap();
      toastFn(shadow, t("settingsLogoSaved", { name: BRANDS[trimmed].name }));
    } catch (err) {
      toastFn(shadow, t("toastFail", { err: err && err.message || err }), 3e3);
    }
  }

  // src/ui.js
  var STYLES = `
  :host { all: initial; }
  .fab {
    position: fixed; right: 24px; bottom: 24px; z-index: 2147483647;
    width: 52px; height: 52px; border-radius: 50%;
    background: #202624; color: #fff; border: none; cursor: pointer;
    font-size: 22px; box-shadow: 0 3px 10px rgba(20,30,25,.18), inset 0 1px 0 rgba(255,255,255,.12);
    display: flex; align-items: center; justify-content: center;
    transition: transform .12s ease, background .12s ease;
    user-select: none; touch-action: none;
  }
  .fab:hover { background: #343f39; transform: scale(1.06); }
  .fab:focus-visible { outline: 2px solid #6b8577; outline-offset: 3px; }
  .fab > svg { width: 28px; height: 28px; pointer-events: none; }
  .fab:active { transform: scale(.96); }
  .fab[disabled] { opacity: .55; cursor: not-allowed; }
  .fab.dragging { transition: none; cursor: grabbing; opacity: .9; }

  /* Settings tools (gear + logo swap) \u2014 children of the FAB. The cluster
     VISUALLY sits to the left of the FAB, but its box OVERLAPS the FAB's
     left edge. This overlap is deliberate and essential: there must be no
     dead space between the FAB's hover area and the cluster's, otherwise
     moving the cursor from the FAB toward the buttons crosses empty page and
     they vanish before the click lands. The visible gap on screen comes from
     transparent padding inside the cluster, which keeps the hover chain
     unbroken. It follows the FAB on drag automatically (it's an absolute
     child of the fixed FAB).

     Geometry (FAB is 52px wide): cluster box width 44 + right offset 46
     places its right edge 6px inside the FAB (so the boxes overlap by 6px)
     while its left edge sticks 38px out past the FAB's left edge \u2014 exactly
     where the round icons (38px, in 6px right padding) visually sit. The
     cluster is vertically centered on the FAB and tall enough (two 38px
     buttons + gap) that a cursor travelling from anywhere in the FAB's left
     half to a button stays inside the cluster until it lands. */
  .fab.tools {
    position: absolute; top: 50%; right: 46px; bottom: auto;
      /* bottom:auto: the .fab base sets bottom:24px, which together with
         top:50% would clamp this cluster to a 2px strip and squash it */
    width: 44px; height: auto; padding: 0 6px 0 0; /* height/auto + no shadow:
      undo the .fab base chrome (52px box + drop shadow) this div inherits */
    display: flex; flex-direction: column; align-items: center; gap: 10px;
    background: transparent; border: none; box-shadow: none; cursor: default;
    user-select: none; opacity: 0; pointer-events: none;
    transform: translateY(-50%) translateX(6px);
    transition: opacity .12s ease, transform .12s ease;
  }
  .fab.tool {
    position: static; /* undo the .fab base's position:fixed/right/bottom \u2014
                         the buttons must be in-flow children of the cluster */
    width: 38px; height: 38px; border-radius: 50%; padding: 0;
    background: #202624; color: #fff; border: none; cursor: pointer;
    font-size: 18px; display: flex; align-items: center; justify-content: center;
    box-shadow: 0 3px 10px rgba(20,30,25,.18), inset 0 1px 0 rgba(255,255,255,.12);
    transition: background .12s ease, transform .12s ease;
  }
  .fab.tool:hover { background: #343f39; transform: scale(1.06); }
  .fab.tool:active { transform: scale(.96); }
  .fab.tool:focus-visible { outline: 2px solid #6b8577; outline-offset: 3px; }
  .fab.tool svg { width: 19px; height: 19px; pointer-events: none; }
  /* Reveal while the FAB OR the cluster itself is hovered \u2014 the overlapping
     box guarantees the cursor never leaves hover coverage in between. */
  .fab:hover .fab.tools,
  .fab.tools:hover,
  .fab.tools:focus-within {
    opacity: 1; pointer-events: auto;
    transform: translateY(-50%) translateX(0);
  }
  .fab.dragging .fab.tools { opacity: 0 !important; pointer-events: none; }

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
  var FAB_ICONS = {
    // Copy: two overlapping rounded squares + a checkmark.
    copy: [
      "M8 8V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-3",
      "M5 8h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z",
      "m7 14 2 2 4-4"
    ],
    // Gear (code-font setting).
    gear: [
      "M9.5 3.5h5l.6 2.4 2 .9 2.2-.7 2.5 4.3-1.7 1.7v2.3l1.7 1.7-2.5 4.3-2.2-.7-2 .9-.6 2.4h-5l-.6-2.4-2-.9-2.2.7-2.5-4.3 1.7-1.7v-2.3l-1.7-1.7 2.5-4.3 2.2.7 2-.9Z",
      "M15.5 13.25a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0"
    ],
    // Paint swatch (logo-swap setting) — heroicons "swatch", outline.
    swatch: [
      "M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402M6.75 21A3.75 3.75 0 0 1 3 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 0 0 3.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88",
      "M6.75 17.25h.008v.008H6.75v-.008Z"
    ]
  };
  function makeFabIcon(kind = "copy") {
    if (kind === true) kind = "gear";
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    for (const [key, value] of Object.entries({
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "1.7",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "aria-hidden": "true",
      focusable: "false"
    })) svg.setAttribute(key, value);
    for (const d of FAB_ICONS[kind] || FAB_ICONS.copy) {
      const path = document.createElementNS(ns, "path");
      path.setAttribute("d", d);
      svg.appendChild(path);
    }
    return svg;
  }
  function hostParent() {
    return document.body || document.documentElement;
  }
  function createShadowRoot() {
    const host = document.createElement("div");
    host.id = "ai-copy-host";
    const shadow = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = STYLES;
    shadow.appendChild(style);
    hostParent().appendChild(host);
    keepHostAttached(host);
    return shadow;
  }
  function keepHostAttached(host) {
    if (typeof MutationObserver === "undefined") return;
    const obs = new MutationObserver(() => {
      if (!host.isConnected) hostParent().appendChild(host);
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
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
      const { html: html2, text: text2 } = renderConversation(messages);
      await copyForOneNote(html2, text2);
      toast(shadow, t("toastConversation", { n: messages.length }));
    } catch (err) {
      console.error("[ai-copy] copy failed", err);
      toast(shadow, t("toastFail", { err: err && err.message || err }), 3e3);
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
  function readCodeFont() {
    try {
      return (localStorage.getItem(CODE_FONT_KEY) || "").trim();
    } catch (_) {
      return "";
    }
  }
  function promptCodeFont(shadow) {
    const current = readCodeFont();
    let value;
    try {
      value = prompt(t("settingsCodeFontPrompt"), current);
    } catch (_) {
      toast(shadow, t("toastFail", { err: "prompt blocked" }), 2200);
      return;
    }
    if (value === null) return;
    const trimmed = value.trim();
    try {
      if (trimmed) {
        localStorage.setItem(CODE_FONT_KEY, trimmed);
        toast(shadow, t("settingsCodeFontSaved", { font: trimmed }));
      } else {
        localStorage.removeItem(CODE_FONT_KEY);
        toast(shadow, t("settingsCodeFontReset"));
      }
    } catch (err) {
      toast(shadow, t("toastFail", { err: err && err.message || err }), 3e3);
    }
  }
  function mountFloatingButton(adapter) {
    const shadow = createShadowRoot();
    const fab = document.createElement("button");
    fab.className = "fab";
    fab.title = t("fabTitle");
    fab.setAttribute("aria-label", t("fabTitle"));
    fab.appendChild(makeFabIcon());
    fab.addEventListener("click", async () => {
      const messages = adapter.getMessages();
      if (!messages.length) {
        toast(shadow, t("toastNoMessages"), 2200);
        return;
      }
      fab.disabled = true;
      try {
        await doCopy(shadow, adapter, messages);
      } finally {
        fab.disabled = false;
      }
    });
    const tools = document.createElement("div");
    tools.className = "fab tools";
    const makeTool = (icon, title, onClick) => {
      const btn = document.createElement("button");
      btn.className = "fab tool";
      btn.type = "button";
      btn.title = title;
      btn.setAttribute("aria-label", title);
      btn.appendChild(makeFabIcon(icon));
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      });
      tools.appendChild(btn);
      return btn;
    };
    makeTool("gear", t("settingsTitle"), () => promptCodeFont(shadow));
    makeTool("swatch", t("settingsLogoTitle"), () => promptLogoChoice(shadow, toast));
    fab.appendChild(tools);
    shadow.appendChild(fab);
    applySavedPosition(fab);
    makeDraggable(fab);
  }
  function mountPerMessageButtons(adapter) {
    const shadow = document.shadowRoots ? null : createShadowRoot();
    const hostShadow = shadow || document.getElementById("ai-copy-host").shadowRoot;
    async function copyOne(role, el, label) {
      try {
        const { html: html2, text: text2 } = renderMessage({ role, el });
        await copyForOneNote(html2, text2);
        toast(hostShadow, label);
      } catch (err) {
        toast(hostShadow, t("toastFail", { err: err && err.message || err }), 3e3);
      }
    }
    async function copyTurn(contentEl, label) {
      try {
        const messages = adapter.getMessages();
        const start = findTurnIndex(messages, contentEl);
        if (start < 0) throw new Error(t("errNotFound"));
        const { html: html2, text: text2 } = renderTurn(messages, start);
        await copyForOneNote(html2, text2);
        toast(hostShadow, label);
      } catch (err) {
        toast(hostShadow, t("toastFail", { err: err && err.message || err }), 3e3);
      }
    }
    if (typeof adapter.getNativeToolbars === "function") {
      mountNativeToolbarButtons(adapter, hostShadow, copyOne, copyTurn);
    } else {
      mountOverlayButtons(adapter, hostShadow, copyOne, copyTurn);
    }
  }
  function mountNativeToolbarButtons(adapter, hostShadow, copyOne, copyTurn) {
    const tipStyle = adapter.tooltipStyle || {};
    const tipFontWeight = tipStyle.fontWeight || "600";
    const tipFont = tipStyle.fontFamily || '-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,Arial,sans-serif';
    const tipAbove = tipStyle.position === "above";
    function ensureSharedTip() {
      let tip = document.getElementById("aicopy-shared-tip");
      if (tip) return tip;
      tip = document.createElement("div");
      tip.id = "aicopy-shared-tip";
      tip.style.cssText = `position:fixed;background:#0d0d0d;color:#ffffff;font-size:12px;line-height:16px;font-weight:${tipFontWeight};padding:5px 9px;border-radius:6px;white-space:nowrap;opacity:0;pointer-events:none;z-index:2147483647;transition:opacity .1s ease;font-family:${tipFont};box-shadow:0 2px 8px rgba(0,0,0,.18)`;
      document.body.appendChild(tip);
      return tip;
    }
    function showTip(tip, anchor, text2) {
      tip.textContent = text2;
      const r = anchor.getBoundingClientRect();
      tip.style.left = Math.max(4, Math.min(r.left + r.width / 2, window.innerWidth - 4)) + "px";
      tip.style.top = tipAbove ? r.top - 8 + "px" : r.bottom + 8 + "px";
      tip.style.transform = tipAbove ? "translateX(-50%) translateY(-100%)" : "translateX(-50%)";
      tip.style.opacity = "1";
    }
    function hideTip(tip) {
      tip.style.opacity = "0";
    }
    const svgAttrs = 'xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
    const CLIPBOARD_SVG = `<svg ${svgAttrs}><path d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"/></svg>`;
    const CLIPBOARD_DOC_SVG = `<svg ${svgAttrs}><path d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 0 0-9-9Z"/></svg>`;
    const sharedTip = ensureSharedTip();
    function makeNativeButton(toolbar, title, double) {
      let btn;
      if (typeof adapter.makeNativeButton === "function") {
        btn = adapter.makeNativeButton(toolbar, title, double);
      } else {
        const template = toolbar.querySelector("button");
        btn = template ? template.cloneNode(false) : document.createElement("button");
        btn.type = "button";
        btn.removeAttribute("aria-label");
        btn.removeAttribute("data-test-id");
        btn.removeAttribute("data-testid");
        btn.removeAttribute("id");
        btn.textContent = "";
        const iconWrap = document.createElement("span");
        iconWrap.style.display = "flex";
        iconWrap.style.alignItems = "center";
        iconWrap.style.justifyContent = "center";
        iconWrap.innerHTML = double ? CLIPBOARD_DOC_SVG : CLIPBOARD_SVG;
        btn.appendChild(iconWrap);
      }
      btn.setAttribute("aria-label", title);
      btn.addEventListener("mouseenter", () => showTip(sharedTip, btn, title));
      btn.addEventListener("mouseleave", () => hideTip(sharedTip));
      btn.addEventListener("focus", () => showTip(sharedTip, btn, title));
      btn.addEventListener("blur", () => hideTip(sharedTip));
      return btn;
    }
    const attach = ({ toolbar, content, role, insertAfter }) => {
      if (toolbar.dataset.aiCopyBound) return;
      toolbar.dataset.aiCopyBound = "1";
      const place = (btn) => {
        if (insertAfter && toolbar.contains(insertAfter)) {
          insertAfter.insertAdjacentElement("afterend", btn);
        } else {
          toolbar.appendChild(btn);
        }
      };
      const singleBtn = makeNativeButton(toolbar, t("btnCopyOne"), false);
      singleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        copyOne(role, content, t("toastOne"));
      });
      place(singleBtn);
      if (role === "user") {
        const turnBtn = makeNativeButton(toolbar, t("btnCopyTurn"), true);
        turnBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          copyTurn(content, t("toastTurn"));
        });
        place(turnBtn);
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
      const singleBtn = makeOverlayButton(t("overlayOne"));
      singleBtn.style.right = "4px";
      singleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        copyOne(role, el, t("toastOne"));
      });
      const buttons = [singleBtn];
      if (role === "user") {
        const turnBtn = makeOverlayButton(t("overlayTurn"));
        turnBtn.style.right = "70px";
        turnBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          copyTurn(el, t("toastTurn"));
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
    const version2 = true ? "0.5.4" : "dev";
    console.log(`[ai-copy] active on ${adapter.name} v${version2}`);
    mountFloatingButton(adapter);
    mountPerMessageButtons(adapter);
    applyLogoSwap();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
