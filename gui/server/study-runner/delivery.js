const DISCORD_CHANNEL_ID_RE = /^\d{17,20}$/;

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function resolveConfiguredChannelId(candidate) {
  if (typeof candidate === 'string' && DISCORD_CHANNEL_ID_RE.test(candidate.trim())) {
    return candidate.trim();
  }
  if (candidate && typeof candidate === 'object') {
    const directChannelId = normalizeString(candidate.channelId);
    if (DISCORD_CHANNEL_ID_RE.test(directChannelId)) {
      return directChannelId;
    }
    const id = normalizeString(candidate.id);
    if (DISCORD_CHANNEL_ID_RE.test(id)) {
      return id;
    }
  }
  return null;
}

function resolveAliasChannelId(alias, config = {}) {
  const discordConfig = config?.channels?.discord || {};
  const studyRunnerConfig = config?.studyRunner || {};
  const candidates = [
    discordConfig.targets?.[alias],
    discordConfig.channels?.[alias],
    studyRunnerConfig.notificationTargets?.[alias],
  ];

  for (const candidate of candidates) {
    const channelId = resolveConfiguredChannelId(candidate);
    if (channelId) {
      return channelId;
    }
  }

  return null;
}

export function isDiscordChannelId(value) {
  return DISCORD_CHANNEL_ID_RE.test(normalizeString(value));
}

export function resolveDiscordNotificationTarget(notificationTarget, options = {}) {
  const normalizedTarget = normalizeString(notificationTarget);
  const fallbackChannelId = normalizeString(options.fallbackChannelId);
  const config = options.config || {};

  if (!normalizedTarget) {
    return { channelId: null, source: null, target: normalizedTarget };
  }

  if (isDiscordChannelId(normalizedTarget)) {
    return {
      channelId: normalizedTarget,
      source: 'notificationTarget',
      target: normalizedTarget,
    };
  }

  const target = normalizedTarget.startsWith('discord:')
    ? normalizedTarget.slice('discord:'.length).trim()
    : normalizedTarget;

  if (isDiscordChannelId(target)) {
    return {
      channelId: target,
      source: 'notificationTarget.discord',
      target: normalizedTarget,
    };
  }

  const configuredChannelId = resolveAliasChannelId(target, config);
  if (configuredChannelId) {
    return {
      channelId: configuredChannelId,
      source: 'config.channels.discord',
      target: normalizedTarget,
    };
  }

  if (['court', 'study-room'].includes(target) && isDiscordChannelId(fallbackChannelId)) {
    return {
      channelId: fallbackChannelId,
      source: 'env.BOLUO_COURT_CHANNEL',
      target: normalizedTarget,
    };
  }

  return {
    channelId: null,
    source: null,
    target: normalizedTarget,
  };
}

export function truncateDiscordMessage(content, maxLength = 2000) {
  const normalized = normalizeString(content);
  if (!normalized) return '';
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

export function buildDiscordNotificationContent(run, markdown = '') {
  const explicitText = normalizeString(run?.notificationText);
  if (explicitText) {
    return truncateDiscordMessage(explicitText);
  }

  const headline = normalizeString(run?.summary?.headline);
  const bullets = Array.isArray(run?.summary?.bullets)
    ? run.summary.bullets
        .filter((bullet) => typeof bullet === 'string' && bullet.trim())
        .slice(0, 3)
        .map((bullet) => `- ${bullet.trim()}`)
    : [];
  const nextReadTitle = normalizeString(run?.nextRead?.title);
  const parts = [];

  if (headline) {
    parts.push(headline);
  }
  if (bullets.length) {
    parts.push(...bullets);
  }
  if (nextReadTitle) {
    parts.push(`Next read: ${nextReadTitle}`);
  }

  if (parts.length) {
    return truncateDiscordMessage(parts.join('\n'));
  }

  return truncateDiscordMessage(markdown);
}
