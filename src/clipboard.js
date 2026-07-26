/**
 * clipboard.js — multi-format clipboard write for OneNote
 *
 * OneNote's paste fidelity depends on the clipboard carrying BOTH `text/html`
 * (which it parses for structure) and `text/plain` (fallback so nothing is
 * lost). We MUST stay inside the user-gesture call stack — browsers reject
 * `navigator.clipboard.write` without a user activation. Call this only from
 * click handlers.
 */

/**
 * Write HTML + plain-text to the clipboard in one ClipboardItem.
 * @param {string} html  OneNote-friendly HTML (from renderer)
 * @param {string} text  Plain-text fallback
 * @returns {Promise<void>}
 */
export async function copyRichText(html, text) {
  if (typeof ClipboardItem === 'undefined') {
    throw new Error('ClipboardItem is not supported in this browser.');
  }
  const item = new ClipboardItem({
    'text/html': new Blob([html], { type: 'text/html' }),
    'text/plain': new Blob([text || html], { type: 'text/plain' }),
  });
  await navigator.clipboard.write([item]);
}

/**
 * Fallback for browsers without async ClipboardItem write: render the HTML
 * into a hidden selection and run execCommand('copy'). Lower fidelity but
 * still carries HTML on the clipboard.
 */
export async function copyRichTextFallback(html, text) {
  const holder = document.createElement('div');
  holder.setAttribute('contenteditable', 'true');
  holder.style.position = 'fixed';
  holder.style.top = '-9999px';
  holder.innerHTML = html;
  document.body.appendChild(holder);
  try {
    const range = document.createRange();
    range.selectNodeContents(holder);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    const ok = document.execCommand('copy');
    sel.removeAllRanges();
    if (!ok) throw new Error('execCommand copy failed');
  } finally {
    holder.remove();
  }
}

/** Try the modern path first, fall back to execCommand on failure. */
export async function copyForOneNote(html, text) {
  try {
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
      await copyRichText(html, text);
      return { method: 'clipboard-item' };
    }
  } catch (err) {
    console.warn('[ai-copy] ClipboardItem write failed, falling back:', err);
  }
  await copyRichTextFallback(html, text);
  return { method: 'execcommand' };
}
