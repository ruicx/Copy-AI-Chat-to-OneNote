import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseHTML } from 'linkedom';
import { renderMessage, renderConversation } from '../src/pipeline.js';
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
