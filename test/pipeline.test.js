import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseHTML } from 'linkedom';
import { renderMessage, renderConversation, renderTurn, findTurnIndex } from '../src/pipeline.js';
import { setNodeDomParser } from '../src/converter.js';

// Inject linkedom as the DOM backend so converter (and pipeline's
// htmlToPlainText which uses document.createElement) work under Node.
setNodeDomParser((html) => {
  const { document } = parseHTML(`<body>${html}</body>`);
  return document.querySelector('body');
});
// pipeline.htmlToPlainText uses the global document; expose linkedom's.
globalThis.document = parseHTML('<body></body>').document;

// Helper to build a fake message element via converter's parser.
function makeMsg(role, innerHtml) {
  const { document } = parseHTML(`<body>${innerHtml}</body>`);
  return { role, el: document.querySelector('body') };
}

test('user message gets a blue role badge', () => {
  const { html } = renderMessage(makeMsg('user', '<p>hi</p>'));
  assert.match(html, /<p style="background-color:#2563eb[^"]*">🧑 用户<\/p>/);
  assert.match(html, /color:#ffffff/);
});

test('assistant message gets a teal role badge', () => {
  const { html } = renderMessage(makeMsg('assistant', '<p>hello</p>'));
  assert.match(html, /<p style="background-color:#0d9488[^"]*">🤖 AI<\/p>/);
});

test('message body content is preserved after the badge', () => {
  const { html } = renderMessage(makeMsg('assistant', '<h2>Title</h2><p>body text</p>'));
  assert.match(html, /<h2[^>]*>Title<\/h2>/);
  assert.match(html, /body text/);
});

test('conversation separates turns with a visible divider', () => {
  const msgs = [
    makeMsg('user', '<p>question</p>'),
    makeMsg('assistant', '<p>answer</p>'),
    makeMsg('user', '<p>follow up</p>'),
    makeMsg('assistant', '<p>reply</p>'),
  ];
  const { html } = renderConversation(msgs);
  // A divider between each adjacent pair → 3 dividers for 4 messages
  const dividerCount = (html.match(/<hr /g) || []).length;
  assert.equal(dividerCount, 3);
  // Both role badges present in the right counts
  assert.equal((html.match(/🧑 用户/g) || []).length, 2);
  assert.equal((html.match(/🤖 AI/g) || []).length, 2);
});

test('plain-text fallback is non-empty and contains content', () => {
  const { text } = renderConversation([makeMsg('user', '<p>hello world</p>')]);
  assert.match(text, /用户/);
  assert.match(text, /hello world/);
});

test('renderTurn copies one user question + its following answers', () => {
  const msgs = [
    makeMsg('user', '<p>Q1</p>'),
    makeMsg('assistant', '<p>A1</p>'),
    makeMsg('user', '<p>Q2</p>'),
    makeMsg('assistant', '<p>A2</p>'),
  ];
  // Turn starting at index 2 (Q2) should include only Q2 + A2.
  const { html, nextIndex } = renderTurn(msgs, 2);
  assert.equal(nextIndex, 4, 'consumed to end');
  assert.match(html, /Q2/);
  assert.match(html, /A2/);
  assert.doesNotMatch(html, /Q1/);
  assert.doesNotMatch(html, /A1/);
});

test('renderTurn includes multiple consecutive assistant replies', () => {
  const msgs = [
    makeMsg('user', '<p>Q</p>'),
    makeMsg('assistant', '<p>A-part1</p>'),
    makeMsg('assistant', '<p>A-part2</p>'),
    makeMsg('user', '<p>next question</p>'),
  ];
  const { html, nextIndex } = renderTurn(msgs, 0);
  assert.equal(nextIndex, 3, 'stops before next user turn');
  assert.match(html, /Q/);
  assert.match(html, /A-part1/);
  assert.match(html, /A-part2/);
  assert.doesNotMatch(html, /next question/);
});

test('image placeholders number across all messages in a conversation', () => {
  // Two assistant messages each containing an image must produce [图片 1]
  // and [图片 2], NOT two [图片 1]s. The sequence counter is shared across
  // the whole rendered conversation via one ctx.
  const msgs = [
    makeMsg('user', '<p>Q</p>'),
    makeMsg('assistant', '<p>A1</p><img src="data:image/png;base64,AAAA" alt="first">'),
    makeMsg('user', '<p>Q2</p>'),
    makeMsg('assistant', '<p>A2</p><img src="data:image/png;base64,BBBB" alt="second">'),
  ];
  const { html } = renderConversation(msgs);
  assert.match(html, /🖼️ \[图片 1：first\]/);
  assert.match(html, /🖼️ \[图片 2：second\]/);
  assert.doesNotMatch(html, /data:image/);
});

test('findTurnIndex matches the exact node when present', () => {
  const msgs = [
    makeMsg('user', '<p>Q1</p>'),
    makeMsg('assistant', '<p>A1</p>'),
    makeMsg('user', '<p>Q2</p>'),
  ];
  assert.equal(findTurnIndex(msgs, msgs[2].el), 2);
  assert.equal(findTurnIndex(msgs, msgs[0].el), 0);
});

test('findTurnIndex falls back to DOM containment (the turn-content bug)', () => {
  // Reproduces the real failure: the UI is given an OUTER turn element while
  // getMessages().el is the INNER content node. Strict === never matches;
  // containment must rescue it. (Gemini: <user-query> vs <div class="query-text">.
  //  ChatGPT: toolbar-walk ancestor vs .markdown node.)
  const { document: outerDoc } = parseHTML(
    '<body><user-query><div class="query-text">hello</div></user-query></body>'
  );
  const turn = outerDoc.querySelector('user-query');
  const content = outerDoc.querySelector('.query-text');
  const msgs = [{ role: 'user', el: content }];
  // Strict === would return -1 here.
  assert.equal(findTurnIndex(msgs, turn), 0, 'outer turn resolves to its inner content');
  // And the reverse direction: messages[].el is outer, lookup is inner.
  assert.equal(findTurnIndex([{ role: 'user', el: turn }], content), 0);
  // No relation at all → -1.
  const { document: other } = parseHTML('<body><p>unrelated</p></body>');
  assert.equal(findTurnIndex(msgs, other.querySelector('p')), -1);
});

test('findTurnIndex handles null / empty input', () => {
  assert.equal(findTurnIndex([], null), -1);
  assert.equal(findTurnIndex([{ role: 'user', el: null }], null), -1);
});
