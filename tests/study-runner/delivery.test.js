import test from 'node:test';
import assert from 'node:assert/strict';

import { buildDiscordNotificationContent, resolveDiscordNotificationTarget } from '../../gui/server/study-runner/index.js';

test('discord notification target resolution accepts configured aliases and court fallback', () => {
  const configured = resolveDiscordNotificationTarget('discord:study-room', {
    config: {
      channels: {
        discord: {
          targets: {
            'study-room': {
              channelId: '123456789012345678',
            },
          },
        },
      },
    },
    fallbackChannelId: '987654321098765432',
  });
  const fallback = resolveDiscordNotificationTarget('discord:court', {
    config: {},
    fallbackChannelId: '987654321098765432',
  });

  assert.deepEqual(configured, {
    channelId: '123456789012345678',
    source: 'config.channels.discord',
    target: 'discord:study-room',
  });
  assert.deepEqual(fallback, {
    channelId: '987654321098765432',
    source: 'env.BOLUO_COURT_CHANNEL',
    target: 'discord:court',
  });
});

test('discord notification content falls back to summary headline and bullets', () => {
  const content = buildDiscordNotificationContent({
    summary: {
      headline: 'Completed the study block',
      bullets: [
        'Captured the main argument',
        'Queued a follow-up read',
      ],
    },
    nextRead: {
      title: 'Mechanistic interpretability survey',
    },
  });

  assert.match(content, /Completed the study block/);
  assert.match(content, /Captured the main argument/);
  assert.match(content, /Queued a follow-up read/);
  assert.match(content, /Next read: Mechanistic interpretability survey/);
});
