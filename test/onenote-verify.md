# OneNote 端到端验证清单（第 4 层 · 手工）

这是整个项目**唯一无法自动化、但最关键**的验证环节。前面三层测试已保证：DOM 提取正确、转换出的 Markdown 干净、渲染出的 HTML 符合 OneNote 官方约束、剪贴板双格式写入。但"粘贴到真实 OneNote 后格式是否保真"只能在 OneNote 里肉眼看。

请在**三个 OneNote 版本**逐格验证，每格用一条带该格式的 AI 消息测一次。

## 验证矩阵

| 格式 | OneNote UWP/Win10-11 | OneNote 桌面 2016/M365 | OneNote 网页版 |
|------|:---:|:---:|:---:|
| 标题层级 H1–H6 | ☐ | ☐ | ☐ |
| 表格（含表头） | ☐ | ☐ ☢️ | ☐ |
| 代码块（带语言标签） | ☐ | ☐ | ☐ |
| 有序列表 | ☐ | ☐ | ☐ |
| 无序列表 | ☐ | ☐ | ☐ |
| 嵌套列表（缩进） | ☐ | ☐ | ☐ |
| 引用 blockquote | ☐ | ☐ | ☐ |
| 加粗 **bold** | ☐ | ☐ | ☐ |
| 斜体 *italic* | ☐ | ☐ | ☐ |
| 行内代码 `code` | ☐ | ☐ | ☐ |
| 超链接 | ☐ | ☐ | ☐ |
| 水平分隔线 | ☐ | ☐ | ☐ |

> ☢️ = 高风险项。**桌面 2016 的表格**有社区反馈会塌成纯文本（[参考](https://forums.allroundautomations.com/threads/copy-as-html-table-works-but-not-quite.17139/)），重点验证。

## 验证步骤

1. **准备一条内容丰富的 AI 消息**：让 AI 输出含上述全部格式的回复（标题、表格、代码块、列表、加粗斜体、链接）。例如问"用 Markdown 写一个包含 h2/h3、三列表格、Python 代码块、有序无序列表、加粗斜体、链接的技术说明"。
2. **确认剪贴板写入了 text/html**（第 3 层）：点复制按钮后，打开下面的诊断页验证。
3. **在 OneNote 粘贴**：新建一页，`Ctrl+V`（默认粘贴，保留源格式）。
4. **逐项核对**：对照矩阵打勾。失败项记录现象（塌成纯文本 / 丢失边框 / 样式错乱）。

## 剪贴板诊断页（第 3 层验证）

把下面内容存成 `.html` 用浏览器打开，点复制按钮后立即点"读取剪贴板"，确认 `text/html` 和 `text/plain` 都在、HTML 符合 OneNote 约束：

```html
<!DOCTYPE html><html><body>
<button onclick="test()">读取剪贴板</button>
<pre id="out"></pre>
<script>
async function test(){
  const items = await navigator.clipboard.read();
  for(const item of items){
    for(const type of item.types){
      const blob = await item.getType(type);
      const text = await blob.text();
      console.log(type, text);
      document.getElementById('out').textContent +=
        `\n=== ${type} ===\n${text}\n`;
    }
  }
}
</script></body></html>
```

**检查点**：
- ✅ 同时有 `text/html` 和 `text/plain`
- ✅ HTML 里**没有** `<pre>` 直接包 `<code>`（代码块应是带背景色的 `<div>`）
- ✅ `<table>` 有 `border="1"` 属性
- ✅ 标题有 `color:#1e4e79`

## 兜底方案（若桌面 2016 表格仍塌陷）

若验证发现桌面 2016 表格粘贴为纯文本，启用 RTF 兜底：在 `src/clipboard.js` 的 `ClipboardItem` 里额外写入 `text/rtf` 格式。RTF 需要从 HTML 转换，可：
- 方案 A（轻量）：手写一个针对表格的极简 HTML→RTF 转换器（只处理 table/tr/td/bold）。
- 方案 B（推荐试用）：先粘贴到 Word 中转一次（Word 的剪贴板处理对 OneNote 兼容更好），再从 Word 复制到 OneNote。

## 验证记录

（每次发布前在此记录验证结果）

- **v0.1.0**（待验证）：
  - 网页版：____
  - UWP：____
  - 桌面 2016：____
