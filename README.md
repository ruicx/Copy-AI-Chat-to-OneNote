# AI 对话一键复制到 OneNote

油猴脚本：在 AI 平台（ChatGPT / Gemini / Claude / DeepSeek / Kimi / 豆包）一键复制对话到剪贴板，粘贴到 OneNote 时**保留标题层级、表格、列表、代码块、加粗/斜体**等格式，而不是塌成纯文本。

## 工作原理

```
AI 页面 DOM → [① DOM→Markdown] → 干净 MD → [② Marked 渲染 + OneNote 后处理] → OneNote 友好 HTML → [③ ClipboardItem 多格式写入]
```

- **为什么要先转 Markdown 再渲染**：AI 页面的 HTML 是渲染产物，夹杂大量框架类名、内联样式、嵌套 div、复制按钮等噪声。先转 MD 再渲染能洗掉噪声，保证输出干净且跨平台一致。
- **为什么用 `ClipboardItem` 写双格式**：OneNote 粘贴时有时优先取纯文本导致表格塌陷。脚本同时写 `text/html`（保格式）+ `text/plain`（兜底），OneNote 会优先解析 HTML。

## 安装

1. 装浏览器扩展 [Tampermonkey](https://www.tampermonkey.net/)（Chrome/Edge/Firefox 均可）。
2. 打开 Tampermonkey 仪表盘 → 新建脚本，把 [`ai-chat-copy.user.js`](./ai-chat-copy.user.js) 全部内容粘贴进去，保存。
3. 打开任一支持的 AI 平台，页面右下角会出现 📋 按钮。每条消息上还会出现悬停才显示的"📋 复制"按钮。

## 使用

- **整段对话**：点右下角 📋，提示"已复制 N 条消息"，到 OneNote 里 `Ctrl+V`。
- **单条消息**：鼠标移到某条消息上，点出现的"📋 复制"。
- **OneNote 粘贴贴士**：用默认 `Ctrl+V` 即可（"保留源格式"）。若个别格式丢失，见下方[故障排查](#故障排查)。

## 支持平台

| 平台 | 状态 | 选择器依据 |
|------|------|-----------|
| ChatGPT | ✅ 已验证（夹具测试） | `[data-message-author-role]` + `.markdown` |
| Gemini | ⚠️ 待真实页面校准 | 启发式兜底（选择器混淆，见 docs） |
| Claude | ⚠️ 待真实页面校准 | `[data-testid="user-message"]` + `[class*="prose"]` |
| DeepSeek | ⚠️ 待真实页面校准 | `.ds-markdown` 兜底 |
| Kimi | ⚠️ 待真实页面校准 | `[class*="bubble"]` 兜底 |
| 豆包 | ⚠️ 待真实页面校准 | `[class*="message-item"]` 兜底 |

> ChatGPT 之外的平台选择器是启发式兜底，**首次使用前请用 DevTools 校准**（见 [`docs/selector-notes.md`](./docs/selector-notes.md)）。

## 开发

```bash
npm install          # 装依赖（marked、esbuild、linkedom）
npm test             # 跑全部自动化测试（46 个）
npm run build        # 重新打包 ai-chat-copy.user.js
```

### 测试分层

| 层 | 内容 | 自动化 | 状态 |
|----|------|:---:|:---:|
| 1 | 转换器 + 渲染器单元测试 | ✅ | 39/39 绿 |
| 2 | 适配器选择器（夹具页回归） | ✅ | ChatGPT 7/7 绿 |
| 3 | 剪贴板多格式写入 | 半手工 | 需真实浏览器 |
| 4 | OneNote 端到端保真 | 手工 | 见 [`test/onenote-verify.md`](./test/onenote-verify.md) |

第 1、2 层覆盖了约 80% 的逻辑（纯转换 + 选择器提取），它们在你碰 OneNote 之前已经跑过。第 4 层是最终保真验证，需在三个 OneNote 版本（UWP / 桌面 2016 / 网页版）逐项打勾。

## 故障排查

- **复制后粘贴为空**：浏览器可能拦截了剪贴板。确保脚本设置里 `@grant none`，并在**点击按钮后立即粘贴**（剪贴板写入有超时）。
- **Gemini/Claude 等选择器失效（按钮在但提取不到消息）**：这些平台 DOM 混淆且频繁变动。按 [`docs/selector-notes.md`](./docs/selector-notes.md) 用 DevTools 重新确认选择器，更新对应 `src/platforms/*.js`，更新夹具，跑 `npm test`。
- **OneNote 桌面 2016 表格塌成纯文本**：这是已知问题。先确认 `text/html` 已写入（用第 3 层诊断页验证）；若仍塌，可启用 RTF 兜底（见 [`test/onenote-verify.md`](./test/onenote-verify.md) 的兜底方案）。
- **流式输出未完成时复制**：脚本目前不阻断，建议等 AI 输出完再复制。

## 许可证

MIT
