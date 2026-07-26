/**
 * pipeline.js — orchestration: extract → convert → render
 *
 * Combines a platform adapter, the converter, and the renderer into one
 * function that produces { html, text } ready for the clipboard.
 *
 * Messages are framed with a colored role badge (user / assistant) and
 * separated by a visible divider so the pasted conversation reads clearly in
 * OneNote. Framing happens at the HTML layer (after rendering) so the badge
 * styles survive — Markdown-stage wrapping would strip the inline styles.
 */
import { htmlToMd } from './converter.js';
import { mdToOneNoteHtml } from './renderer.js';

// Role badge styles. OneNote reliably honours background-color + color on a
// <p>, so these render as solid colour bars that clearly distinguish speakers.
const BADGE_STYLES = {
  user: 'background-color:#2563eb;color:#ffffff;font-size:11pt;font-weight:bold',
  assistant: 'background-color:#0d9488;color:#ffffff;font-size:11pt;font-weight:bold',
};
const BADGE_LABEL = { user: '🧑 用户', assistant: '🤖 AI' };

/** Cheap HTML → plain text for the text/plain clipboard slot. */
function htmlToPlainText(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  tmp.querySelectorAll('p,div,li,tr,h1,h2,h3,h4,h5,h6').forEach(el => {
    el.append('\n');
  });
  return (tmp.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
}

/** Build the styled role-badge HTML that precedes a message body. */
function roleBadge(role) {
  const style = BADGE_STYLES[role] || BADGE_STYLES.assistant;
  const label = BADGE_LABEL[role] || BADGE_LABEL.assistant;
  return `<p style="${style}">${label}</p>`;
}

/** Wrap a single message's body HTML with a role badge. */
function frameMessageHtml(role, bodyHtml) {
  return `${roleBadge(role)}\n<p>&nbsp;</p>\n${bodyHtml}`;
}

/**
 * Build clipboard payloads for one message element.
 * @param {{role:string, el:Element}} msg
 * @returns {{html:string, text:string, md:string}}
 */
export function renderMessage(msg) {
  const md = htmlToMd(msg.el);
  const bodyHtml = mdToOneNoteHtml(md);
  const html = frameMessageHtml(msg.role, bodyHtml);
  return { html, text: htmlToPlainText(html), md };
}

/**
 * Build clipboard payloads for an entire conversation.
 * Messages are separated by a horizontal rule plus surrounding spacing so
 * each turn is visually distinct in OneNote.
 * @param {{role:string, el:Element}[]} messages
 * @returns {{html:string, text:string}}
 */
export function renderConversation(messages) {
  const html = renderMessagesHtml(messages);
  return { html, text: htmlToPlainText(html) };
}

/**
 * Build clipboard payloads for a single conversation turn: one user question
 * plus all the assistant messages that follow it (up to the next user turn).
 * @param {{role:string, el:Element}[]} messages  full message list (DOM order)
 * @param {number} startIndex  index of the user message that starts this turn
 * @returns {{html:string, text:string, nextIndex:number}}
 *          nextIndex = index of the next user message (or messages.length)
 */
export function renderTurn(messages, startIndex) {
  const msgs = messages.slice(startIndex);
  // Take the leading message and every following assistant message.
  const turn = [];
  for (let i = 0; i < msgs.length; i++) {
    if (i === 0) {
      turn.push(msgs[i]); // the user question (or whatever leads)
      continue;
    }
    if (msgs[i].role === 'user') break; // next turn begins
    turn.push(msgs[i]);
  }
  const html = renderMessagesHtml(turn);
  return { html, text: htmlToPlainText(html), nextIndex: startIndex + turn.length };
}

/** Shared renderer: badge each message and join with dividers. */
function renderMessagesHtml(messages) {
  const DIVIDER = '<hr style="border:none;border-top:2px solid #d1d5db;margin:16px 0">';
  const parts = messages.map(m => {
    const md = htmlToMd(m.el);
    const bodyHtml = mdToOneNoteHtml(md);
    return frameMessageHtml(m.role, bodyHtml);
  });
  return parts.join(`\n${DIVIDER}\n`);
}
