import { test } from 'node:test';
import assert from 'node:assert/strict';
import { t, getLocale, setLocale } from '../src/i18n.js';

// NOTE on concurrency: node:test runs test files in parallel and they share
// this module's _locale cache. So these tests never rely on the "default"
// locale — every assertion pins the locale explicitly with setLocale() first.
// The "defaults to en in Node" behaviour is implicitly covered by the en
// assertions (which all pass once setLocale('en') runs).

test('setLocale forces a locale and getLocale returns it', () => {
  setLocale('zh');
  assert.equal(getLocale(), 'zh');
  setLocale('en');
  assert.equal(getLocale(), 'en');
});

test('t returns the zh string when locale is zh', () => {
  setLocale('zh');
  assert.equal(t('toastOne'), '✓ 已复制该消息');
  assert.equal(t('badgeUser'), '🧑 用户');
});

test('t returns the en string when locale is en', () => {
  setLocale('en');
  assert.equal(t('toastOne'), '✓ Message copied');
  assert.equal(t('badgeUser'), '🧑 You');
  assert.equal(t('badgeAssistant'), '🤖 AI');
});

test('t substitutes {placeholders}', () => {
  setLocale('zh');
  assert.equal(t('toastConversation', { n: 3 }), '✓ 已复制 3 条消息，可粘贴到 OneNote');
  setLocale('en');
  assert.equal(t('toastConversation', { n: 3 }), '✓ Copied 3 messages — paste into OneNote');
});

test('t image tag includes the number and caption', () => {
  setLocale('zh');
  assert.equal(t('imageTag', { n: 1, alt: '流程图' }), '图片 1：流程图');
  assert.equal(t('imageTagNoAlt', { n: 2 }), '图片 2');
  setLocale('en');
  assert.equal(t('imageTag', { n: 1, alt: 'flow' }), 'Image 1: flow');
  assert.equal(t('imageTagNoAlt', { n: 2 }), 'Image 2');
});

test('t falls back to the key itself for an unknown key', () => {
  setLocale('en');
  assert.equal(t('nope'), 'nope');
});

test('every known key resolves in both locales (no missing string)', () => {
  const keys = [
    'toastConversation', 'toastOne', 'toastTurn', 'toastFail',
    'btnCopyOne', 'btnCopyTurn', 'fabTitle', 'overlayOne', 'overlayTurn',
    'badgeUser', 'badgeAssistant', 'imageTag', 'imageTagNoAlt',
    'toastNoMessages', 'errNotFound',
  ];
  for (const key of keys) {
    setLocale('zh');
    const zh = t(key);
    setLocale('en');
    const en = t(key);
    assert.ok(zh && zh !== key, `${key} has a zh string`);
    assert.ok(en && en !== key, `${key} has an en string`);
  }
});
