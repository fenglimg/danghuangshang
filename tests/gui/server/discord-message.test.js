import test from 'node:test';
import assert from 'node:assert/strict';

import { DISCORD_MAX_CONTENT_LENGTH, splitDiscordMessageContent } from '../../../gui/server/discord_message.js';

function stripContinuationPrefix(chunk) {
  return chunk.replace(/^\[\d+\/\d+\] /, '');
}

test('splitDiscordMessageContent keeps short content in one message', () => {
  const content = '【司礼监】这是一条简短回执。';
  const chunks = splitDiscordMessageContent(content);

  assert.deepEqual(chunks, [content]);
});

test('splitDiscordMessageContent splits long content on newline boundaries', () => {
  const block = `【内阁】拟票如下：\n${'甲'.repeat(2200)}\n${'乙'.repeat(2200)}\n`;
  const chunks = splitDiscordMessageContent(block);

  assert.ok(chunks.length >= 2);
  assert.ok(chunks.every((chunk) => chunk.length <= DISCORD_MAX_CONTENT_LENGTH));
  assert.equal(chunks.map(stripContinuationPrefix).join(''), block);
});

test('splitDiscordMessageContent falls back to hard split for long unbroken text', () => {
  const content = `【工部】${'a'.repeat(9000)}`;
  const chunks = splitDiscordMessageContent(content);

  assert.ok(chunks.length >= 3);
  assert.ok(chunks.every((chunk) => chunk.length <= DISCORD_MAX_CONTENT_LENGTH));
  assert.equal(chunks.map(stripContinuationPrefix).join(''), content);
});
