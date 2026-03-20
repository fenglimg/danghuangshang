import { Client, GatewayIntentBits, Partials, Events } from 'discord.js';

/**
 * Minimal Discord Gateway listener for danghuangshang.
 * Purpose: detect role mentions in a specific channel and call a callback.
 *
 * Env:
 * - BOLUO_DISCORD_LISTENER_TOKEN (required)
 * - BOLUO_COURT_CHANNEL (required)
 */

export function startDiscordListener({
  token = process.env.BOLUO_DISCORD_LISTENER_TOKEN,
  courtChannelId = process.env.BOLUO_COURT_CHANNEL,
  onMessage,
  log = console,
}) {
  if (!token) throw new Error('Missing BOLUO_DISCORD_LISTENER_TOKEN');
  if (!courtChannelId) throw new Error('Missing BOLUO_COURT_CHANNEL');
  if (typeof onMessage !== 'function') throw new Error('startDiscordListener requires onMessage(message)');

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel, Partials.Message],
  });

  client.once(Events.ClientReady, (c) => {
    log.info?.(`[discord-listener] ready as ${c.user?.tag} (${c.user?.id})`);
  });

  client.on(Events.MessageCreate, async (message) => {
    try {
      // Only target channel
      if (message.channelId !== courtChannelId) return;
      // Ignore bots (including ourselves)
      if (message.author?.bot) return;

      await onMessage(message);
    } catch (e) {
      log.error?.('[discord-listener] onMessage error:', e);
    }
  });

  client.login(token);
  return { client };
}
