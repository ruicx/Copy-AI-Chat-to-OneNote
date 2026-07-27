# AI 对话一键复制到 OneNote

[English](./README.md)

油猴脚本：把 AI 对话（**ChatGPT / Gemini / Claude / DeepSeek / Kimi / 豆包**）复制到剪贴板，粘贴到 OneNote（UWP / 桌面 2016 / 网页版）时**保留标题层级、表格、代码块、列表、加粗/斜体**等格式，而不是塌成纯文本。

## 为什么需要它

AI 平台自带的复制按钮输出的是 Markdown 或夹带框架样式的 HTML。OneNote 粘贴时常常优先取纯文本，导致表格塌陷、标题丢层级、代码块丢样式。本脚本用一个 `ClipboardItem` 同时写入 `text/html`（保格式）和 `text/plain`（兜底），HTML 还专门按 OneNote 能稳定保留的方式塑形。

## 工作原理

```
页面 DOM ─▶ [① DOM→Markdown] ─▶ 干净 MD ─▶ [② Marked 渲染 + OneNote 后处理] ─▶ OneNote 友好 HTML ─▶ [③ ClipboardItem 多格式写入]
```

- **为什么先转 Markdown 再渲染**：AI 页面渲染出的 HTML 夹杂大量框架类名、内联样式、嵌套 div、复制按钮、语法高亮 span、Angular/Lit 自定义元素。先转 MD 再渲染能洗掉这些噪声，保证输出干净且跨平台一致。
- **为什么用 `ClipboardItem` 写双格式**：OneNote 有时优先取 `text/plain` 导致结构塌陷。同时写 `text/html`（结构）+ `text/plain`（兜底），OneNote 会优先解析 HTML。

完整架构和必须守住的约束见 [`AGENTS.md`](./AGENTS.md)。

## 安装

1. 装浏览器扩展 [Tampermonkey](https://www.tampermonkey.net/)（Chrome/Edge/Firefox 均可）或 [Violentmonkey](https://violentmonkey.github.io/)。
2. 点击下面的安装链接——脚本管理器会自动弹出安装对话框：

   | 来源 | 链接 |
   |------|------|
   | jsDelivr（国内速度快，无需翻墙） | **[安装](https://cdn.jsdelivr.net/gh/ruicx/Copy-AI-Chat-to-OneNote@main/ai-chat-copy.user.js)** |
   | GitHub 原始文件（需翻墙） | **[安装](https://raw.githubusercontent.com/ruicx/Copy-AI-Chat-to-OneNote/main/ai-chat-copy.user.js)** |

   > 如果两个链接都点不开，也可以手动复制 [`ai-chat-copy.user.js`](./ai-chat-copy.user.js) 的全部内容，在 Tampermonkey 新建脚本里粘贴。
3. 打开任一支持的 AI 平台，右下角会出现 📋 浮动按钮，每条消息的原生工具栏里也会出现复制按钮。

> 以后更新脚本，重新点一下同一个安装链接即可拉取最新版。

## 使用

三种复制模式（工具栏按钮的样式和各平台自己的按钮保持一致）：

- **整段对话**：点右下角 📋，提示「已复制 N 条消息」，到 OneNote 里 `Ctrl+V`。
- **单条消息**：鼠标移到某条消息上，点工具栏里的 **剪贴板** 图标（「复制本条到 OneNote」）。
- **本轮对话**（一条用户提问 + 后面紧跟的 AI 回复，直到下一条用户提问）：点 **剪贴板文档** 图标（「复制本轮到 OneNote」）。仅在有该按钮的工具栏出现。

> 界面文字是双语的：`zh-*`（任何中文地区）显示中文，其他所有语言显示英文（如英文系统下显示 "Copy this message to OneNote" / "Copied N messages"）。

**图片**：粘贴出来是 `🖼️ [图片 N：简短描述]` 占位符（英文系统下为 `🖼️ [Image N: …]`）。OneNote 拒绝粘贴 HTML 里的 `data:` URL 图片（会显示链接 + 安全提示而不是图片），而且也没法在一次剪贴板写入里同时带上格式文本和真实位图。占位符告诉你该取第几张图——Gemini 自带的单图复制按钮可以覆盖这个需求，也可以粘完文字后再补图。

**OneNote 粘贴贴士**：用默认 `Ctrl+V`（「保留源格式」）即可。

## 支持平台

| 平台 | 状态 | 说明 |
|------|------|------|
| ChatGPT | ✅ 已校准 | `[data-message-author-role]` + `.markdown`。原生工具栏注入（默认样式路径）。 |
| Gemini | ✅ 已校准 | `<user-query>`/`<model-response>` 自定义元素、`<code-block>`、图片包在 `<button>` 里、克隆 `<gem-icon-button>` 工具栏按钮匹配 Material 风格。 |
| Claude | ⚠️ 启发式兜底 | `[data-testid="user-message"]` + `[class*="prose"]`。依赖前请先校准。 |
| DeepSeek | ⚠️ 启发式兜底 | `.ds-markdown`。依赖前请先校准。 |
| Kimi | ⚠️ 启发式兜底 | `[class*="bubble"]`。依赖前请先校准。 |
| 豆包 | ⚠️ 启发式兜底 | `[class*="message-item"]`。依赖前请先校准。 |

> Claude / DeepSeek / Kimi / 豆包 的选择器是启发式兜底，首次使用前请用 DevTools 校准——见 [`docs/selector-notes.md`](./docs/selector-notes.md)。

## 开发

```bash
npm install          # 装依赖（marked、esbuild、linkedom）
npm test             # 跑全部自动化测试（82 个）
npm run build        # 重新打包 ai-chat-copy.user.js（强制 LF）
```

> **不要直接编辑 `ai-chat-copy.user.js`**——它是构建产物。改 `src/`，然后 `npm run build`。

### 测试分层

| 层 | 内容 | 自动化 |
|----|------|:---:|
| 1 | 转换器 + 渲染器 + pipeline 单元测试（linkedom） | ✅ |
| 2 | 适配器选择器（夹具页回归） | ✅ |
| 3 | 剪贴板多格式写入 | 半手工（需真实浏览器） |
| 4 | OneNote 端到端保真 | 手工——矩阵见 [`test/onenote-verify.md`](./test/onenote-verify.md) |

第 1、2 层覆盖约 80% 的逻辑，在你碰 OneNote 之前就跑过了。第 4 层是最终保真验证，需在三个 OneNote 版本逐项打勾。

### 目录结构

```
ai-chat-copy.user.js     构建产物（交付的油猴脚本）
src/
  index.js               入口：选适配器、装 UI、Trusted Types 策略
  converter.js           ① DOM→Markdown（核心）
  renderer.js            ② Markdown→OneNote 友好 HTML
  pipeline.js            编排：消息→{html, text}
  clipboard.js           ③ ClipboardItem 写入 + 兜底
  ui.js                  浮动按钮、单条按钮、toast（Shadow DOM）
  platforms/             每个 AI 站点一个适配器
test/
  converter.test.js, renderer.test.js, pipeline.test.js
  adapter-{chatgpt,gemini}.test.js
  fixtures/*.html        保存的页面快照，用于回归
  onenote-verify.md      手工验证矩阵 + 诊断页
docs/selector-notes.md   各平台选择器 + 重新校准流程
```

适配器契约、必须守的约束、Gemini 专项说明见 [`AGENTS.md`](./AGENTS.md)。

## 故障排查

- **复制后粘贴为空**：浏览器可能拦截了剪贴板。确保脚本头是 `@grant none`，并且**点完按钮立即粘贴**（剪贴板写入有超时）。
- **Gemini/Claude 等选择器失效（按钮在但提取不到消息）**：这些平台 DOM 混淆且频繁变动。按 [`docs/selector-notes.md`](./docs/selector-notes.md) 用 DevTools 重新确认选择器，更新对应 `src/platforms/*.js`，刷新夹具，跑 `npm test`。
- **OneNote 桌面 2016 表格塌成纯文本**：已知问题。先确认 `text/html` 已写入（用 `test/onenote-verify.md` 的诊断页）；若仍塌，启用该文档里的 RTF 兜底方案。
- **流式输出未完成时复制**：脚本目前不阻断，建议等 AI 输出完再复制。

## 许可证

MIT
