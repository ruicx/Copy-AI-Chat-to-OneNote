# 平台 DOM 选择器记录

记录各 AI 平台的选择器依据和校准状态。AI 平台的 DOM 类名经常混淆且频繁变动，这份文档是维护适配器的依据。

## 通用原则

每个适配器在 `src/platforms/*.js`，使用**多层兜底选择器**（class / attribute / 结构特征），任一命中即可。当某平台改版导致复制失效时：

1. 打开该平台页面，用 DevTools (F12) Elements 面板定位用户消息和 AI 消息的容器。
2. 找一个**稳定**的属性（优先 `data-*` 属性或 `role`，其次语义化 class；避免随机 hash 类名）。
3. 更新 `src/platforms/<platform>.js` 的选择器列表。
4. 用"另存网页"导出一份新的 `test/fixtures/<platform>-sample.html`。
5. 更新/新增对应的 `test/adapter-<platform>.test.js`，跑 `npm test` 直到绿。

---

## ChatGPT（已验证 ✅）

**核实日期**：2026-07，基于 2025 DOM 结构 + 社区 userscript（exportChatGPTChat.js、ChatGPT Fold）。

**结构**：
```html
<div data-message-author-role="user" data-message-id="...">
  <div class="whitespace-pre-wrap">用户输入文本</div>
</div>
<div data-message-author-role="assistant" data-message-id="...">
  <div>
    <div class="markdown prose w-full break-words dark:prose-invert">
      <!-- 渲染后的 Markdown 内容 -->
    </div>
  </div>
</div>
```

**选择器**（`src/platforms/chatgpt.js`）：
- 轮次：`[data-message-author-role]`（过滤值 = `user`/`assistant`）—— 稳定，长期可靠
- 角色判定：`getAttribute('data-message-author-role')`
- 助手内容：`.markdown` → `[class*="markdown"]` → 最后一个子 div（兜底链）
- 用户内容：`.whitespace-pre-wrap`

**夹具**：`test/fixtures/chatgpt-sample.html` + `test/adapter-chatgpt.test.js`（7 测试）

---

## Gemini（待校准 ⚠️）

**难点**：Gemini 用 Angular/Lit，类名混淆且无规律，无公开文档，社区资料稀缺。

**当前启发式**（`src/platforms/gemini.js`）：
- 根容器：`[data-test-id="conversation"]` / `chat-history` / `main[role="main"]`
- 轮次：`[data-test-id^="conversation-turn"]` / `[class*="conversation-turn"]` / `model-response` / `user-query`
- 角色判定：元素 hint 匹配 `user-query|query-text`（用户）或 `model-response`（助手）

**校准步骤**：
1. 登录 gemini.google.com，发一条带表格和代码块的对话。
2. F12 → Elements，点选 AI 的回复气泡，看它的 `data-test-id` 或稳定 class。
3. 同样找用户输入气泡。
4. 把真实选择器填进 `src/platforms/gemini.js` 的对应数组（保留现有兜底项）。
5. 另存网页为 `test/fixtures/gemini-sample.html`，写 `test/adapter-gemini.test.js`。

---

## Claude（待校准 ⚠️）

**当前启发式**（`src/platforms/claude.js`）：
- 用户：`[data-testid="user-message"]`（testid 相对稳定）
- 助手：`[class*="prose"]` / `.font-claude-message`

**校准**：同上，登录 claude.ai 后用 DevTools 确认。

---

## DeepSeek / Kimi / 豆包（待校准 ⚠️）

均为启发式兜底（`.ds-markdown` / `[class*="bubble"]` / `[class*="message-item"]`），首次使用前务必按上述步骤用 DevTools 校准并补夹具测试。

---

## 参考

- [exportChatGPTChat.js](https://gist.github.com/miketromba/3cecba180dab31b36955b4723de642cd)（ChatGPT 选择器来源）
- [ChatGPT Fold userscript](https://greasyfork.org/en/scripts/559517-chatgpt-fold-original-button-current-dom-patch/code)（2025 选择器交叉验证）
