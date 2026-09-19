/**
 * i18n.js — bilingual user-facing strings (zh / en).
 *
 * Locale is detected once from navigator.language (e.g. "zh-CN" → zh, anything
 * else → en) and cached. Tests can override it via setLocale(). Every
 * user-visible string — toasts, button titles, the role badge label, the
 * image placeholder tag — goes through t(key) so adding a language later is
 * just one more table column.
 *
 * Note: the PASTED content itself (role badge + image placeholder) is also
 * localized, so it reads naturally in whichever language the user runs the
 * script in.
 */

let _locale = null;

/** Resolve the active locale. "zh*" (any region) → 'zh', otherwise 'en'. */
export function getLocale() {
  if (_locale) return _locale;
  if (typeof navigator !== 'undefined') {
    const lang = (navigator.language || navigator.userLanguage || '').toLowerCase();
    if (lang.startsWith('zh')) return (_locale = 'zh');
  }
  return (_locale = 'en');
}

/** Force a locale (tests). Pass 'zh' / 'en', or nothing to clear the cache. */
export function setLocale(l) {
  _locale = l || null;
}

const STRINGS = {
  // Toast shown after copying the whole conversation. {n} → message count.
  toastConversation: { zh: '✓ 已复制 {n} 条消息，可粘贴到 OneNote',
                       en: '✓ Copied {n} messages — paste into OneNote' },
  // Toast shown after copying a single message.
  toastOne:         { zh: '✓ 已复制该消息',
                      en: '✓ Message copied' },
  // Toast shown after copying one turn (question + its answers).
  toastTurn:        { zh: '✓ 已复制本轮对话',
                      en: '✓ Turn copied' },
  // Toast shown when a copy fails. {err} → the error message.
  toastFail:        { zh: '✗ 复制失败：{err}',
                      en: '✗ Copy failed: {err}' },
  // Title for the single-message copy button.
  btnCopyOne:       { zh: '复制本条到 OneNote',
                      en: 'Copy this message to OneNote' },
  // Title for the copy-turn button (clipboard-document icon).
  btnCopyTurn:      { zh: '复制本轮到 OneNote',
                      en: 'Copy this turn to OneNote' },
  // Floating action button tooltip. The "(drag to move)" hint.
  fabTitle:         { zh: '复制整段对话到 OneNote（拖动可移动位置）',
                      en: 'Copy whole conversation to OneNote (drag to move)' },
  // Overlay (fallback) single-message button label.
  overlayOne:       { zh: '📋 本条',
                      en: '📋 This' },
  // Overlay (fallback) copy-turn button label.
  overlayTurn:      { zh: '📋 本轮',
                      en: '📋 Turn' },
  // Short pill labels for bars that render icon + text (Kimi user bar).
  pillOne:          { zh: '复制本条',
                      en: 'Copy msg' },
  pillTurn:         { zh: '复制本轮',
                      en: 'Copy turn' },
  // Role-badge labels prepended to each pasted message.
  badgeUser:        { zh: '🧑 用户',
                      en: '🧑 You' },
  badgeAssistant:   { zh: '🤖 AI',
                      en: '🤖 AI' },
  // Image-placeholder tag. {n} → image number, {alt} → short caption (may be empty).
  imageTag:         { zh: '图片 {n}：{alt}',
                      en: 'Image {n}: {alt}' },
  // Image-placeholder tag when there is no caption.
  imageTagNoAlt:    { zh: '图片 {n}',
                      en: 'Image {n}' },
  // Toast shown when no messages were found to copy.
  toastNoMessages:  { zh: '未检测到对话消息',
                      en: 'No conversation messages found' },
  // Error thrown when a per-message button can't map its element to a turn.
  errNotFound:      { zh: '未找到该消息',
                      en: 'Message not found' },
  // Settings (gear) button tooltip.
  settingsTitle:    { zh: '设置',
                      en: 'Settings' },
  // Prompt asking the user for the code-block monospace font.
  // {default} → the current fallback font name (kept for future use).
  settingsCodeFontPrompt: { zh: '请输入代码块等宽字体名（留空恢复默认 Consolas）：',
                            en: 'Enter the monospace font for code blocks (leave empty for default Consolas):' },
  // Toast after saving a custom code font. {font} → the font name the user typed.
  settingsCodeFontSaved:  { zh: '✓ 代码字体已保存：{font}',
                            en: '✓ Code font saved: {font}' },
  // Toast after clearing the custom font back to the default.
  settingsCodeFontReset:  { zh: '✓ 代码字体已恢复默认',
                            en: '✓ Code font reset to default' },
  // Logo-swap button tooltip (next to the gear on the FAB).
  settingsLogoTitle:      { zh: '切换站点 Logo（Kimi / DeepSeek）',
                            en: 'Swap site logo (Kimi / DeepSeek)' },
  // Prompt asking which brand the top-left site logo should become.
  settingsLogoPrompt:     { zh: '切换左上角站点 Logo —— 输入 kimi 或 deepseek（留空恢复默认）：',
                            en: 'Swap the top-left site logo — enter kimi or deepseek (leave empty to restore default):' },
  // Toast after switching the site logo. {name} → the chosen brand name.
  settingsLogoSaved:      { zh: '✓ Logo 已切换为 {name}',
                            en: '✓ Logo switched to {name}' },
  // Toast after clearing the logo back to the site's own.
  settingsLogoReset:      { zh: '✓ Logo 已恢复默认',
                            en: '✓ Logo restored to default' },
  // Toast when the prompt input is not one of the known brands.
  settingsLogoInvalid:    { zh: '✗ 无法识别的 Logo，可选：kimi、deepseek',
                            en: '✗ Unknown logo — choose kimi or deepseek' },
};

/**
 * Look up a key for the active locale and substitute {placeholders}.
 * Falls back to English if a key is somehow missing.
 */
export function t(key, vars) {
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
