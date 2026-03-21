import { EVENT_TYPE, RUN_STATUS } from './types.js';

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.trim()).map((value) => value.trim()))];
}

function pluralize(count, noun) {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

function formatDuration(ms) {
  const totalMs = Number(ms || 0);
  if (!Number.isFinite(totalMs) || totalMs <= 0) return '0m 0s';
  const totalSeconds = Math.floor(totalMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

function truncate(text, maxLength = 220) {
  if (typeof text !== 'string') return '';
  const normalized = text.trim().replace(/\s+/g, ' ');
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function lastMatchingEvent(events, predicate) {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    if (predicate(events[index])) {
      return events[index];
    }
  }
  return null;
}

function resolveTitle(run) {
  return truncate(run?.topic || run?.title || run?.runId || 'Study run', 80);
}

function resolveHeadline(run, activeLabel) {
  const title = resolveTitle(run);
  if ([RUN_STATUS.DONE, RUN_STATUS.COMPLETED].includes(run?.status)) {
    return `Completed ${title} in ${activeLabel}`;
  }
  if (run?.status === RUN_STATUS.SUMMARIZING) {
    return `Summarizing ${title} after ${activeLabel}`;
  }
  return `Study summary for ${title}`;
}

function resolveLastFocus(run, events) {
  const focusEvent = lastMatchingEvent(events, (event) => typeof event?.currentTarget === 'string' && event.currentTarget.trim());
  return truncate(focusEvent?.currentTarget || run?.currentTarget || '', 120) || null;
}

function resolveNextRead(run, lastFocus) {
  const resumeFrom = typeof run?.checkpoint?.resumeFrom === 'string' ? run.checkpoint.resumeFrom.trim() : '';
  if (resumeFrom && run?.nextRead?.source === 'last-focus') {
    return {
      title: resumeFrom,
      source: 'checkpoint.resumeFrom',
    };
  }

  if (run?.nextRead && typeof run.nextRead === 'object') {
    return run.nextRead;
  }
  if (typeof run?.nextRead === 'string' && run.nextRead.trim()) {
    return {
      title: run.nextRead.trim(),
      source: 'stored',
    };
  }

  if (resumeFrom) {
    return {
      title: resumeFrom,
      source: 'checkpoint.resumeFrom',
    };
  }

  if (lastFocus) {
    return {
      title: lastFocus,
      source: 'last-focus',
    };
  }

  return null;
}

function buildStats(run, events) {
  const toolEndEvents = events.filter((event) => event?.type === EVENT_TYPE.TOOL_END);
  const heartbeatCount = events.filter((event) => event?.type === EVENT_TYPE.HEARTBEAT).length;
  const phases = uniqueStrings(events.map((event) => event?.phase));
  const tools = uniqueStrings(toolEndEvents.map((event) => event?.tool));

  return {
    eventCount: events.length,
    toolEndCount: toolEndEvents.length,
    heartbeatCount,
    phases,
    tools,
    activeMs: Number(run?.cumulativeActiveMs || 0),
    targetActiveMs: Number(run?.targetActiveMs || 0),
    interruptions: Number(run?.interruptions || 0),
    recoveries: Number(run?.recoveries || 0),
    recoveryFailures: Number(run?.recoveryFailures || 0),
  };
}

function buildBullets(run, stats, lastFocus, nextRead) {
  const bullets = [];
  const activeLabel = formatDuration(stats.activeMs);
  const targetLabel = stats.targetActiveMs > 0 ? formatDuration(stats.targetActiveMs) : null;

  bullets.push(`Tracked ${activeLabel} of active study${targetLabel ? ` against a ${targetLabel} target` : ''}.`);

  if (stats.toolEndCount > 0) {
    const phasePart = stats.phases.length > 0 ? ` across ${pluralize(stats.phases.length, 'phase')} (${stats.phases.join(', ')})` : '';
    const toolPart = stats.tools.length > 0 ? ` using ${stats.tools.join(', ')}` : '';
    bullets.push(`Timeline captured ${pluralize(stats.toolEndCount, 'tool completion')}${phasePart}${toolPart}.`);
  } else if (stats.eventCount > 0) {
    bullets.push(`Timeline captured ${pluralize(stats.eventCount, 'event')} but no completed tool steps yet.`);
  }

  if (lastFocus) {
    bullets.push(`Last focus: ${lastFocus}.`);
  }

  if (stats.interruptions > 0 || stats.recoveries > 0 || stats.recoveryFailures > 0) {
    bullets.push(`Recovery activity: ${pluralize(stats.interruptions, 'interruption')}, ${pluralize(stats.recoveries, 'recovery attempt')}, ${pluralize(stats.recoveryFailures, 'failed recovery')}.`);
  } else if (stats.heartbeatCount > 0) {
    bullets.push(`Heartbeat updates recorded ${pluralize(stats.heartbeatCount, 'time')} during the run.`);
  }

  if (nextRead && typeof nextRead?.title === 'string' && nextRead.title.trim()) {
    bullets.push(`Next read: ${truncate(nextRead.title, 120)}.`);
  }

  return bullets.slice(0, 4);
}

function buildMarkdown(run, headline, bullets, stats, nextRead, lastFocus) {
  const lines = [
    `# ${headline}`,
    '',
    `- Run ID: ${run?.runId || 'unknown'}`,
    `- Status: ${run?.status || 'unknown'} / ${run?.currentPhase || 'unknown'}`,
    `- Active study: ${formatDuration(stats.activeMs)}${stats.targetActiveMs > 0 ? ` / ${formatDuration(stats.targetActiveMs)} target` : ''}`,
    `- Timeline events: ${stats.eventCount}`,
    '',
    '## Highlights',
    '',
    ...bullets.map((bullet) => `- ${bullet}`),
  ];

  if (lastFocus) {
    lines.push('', '## Last Focus', '', `- ${lastFocus}`);
  }

  if (nextRead && typeof nextRead?.title === 'string' && nextRead.title.trim()) {
    lines.push('', '## Next Read', '', `- ${truncate(nextRead.title, 160)}`);
  }

  return `${lines.join('\n')}\n`;
}

function buildNotificationText(run, headline, stats, nextRead, lastFocus) {
  const parts = [
    `${headline}.`,
    `${pluralize(stats.toolEndCount, 'tool step')} captured in the timeline.`,
  ];

  if (lastFocus) {
    parts.push(`Last focus: ${truncate(lastFocus, 60)}.`);
  }
  if (nextRead && typeof nextRead?.title === 'string' && nextRead.title.trim()) {
    parts.push(`Next: ${truncate(nextRead.title, 60)}.`);
  }
  if (run?.notificationTarget) {
    parts.push(`Target: ${truncate(run.notificationTarget, 60)}.`);
  }

  return truncate(parts.join(' '), 280);
}

export function buildStudyRunSummary(run, events = [], overrides = {}) {
  const safeEvents = Array.isArray(events) ? events : [];
  const stats = buildStats(run, safeEvents);
  const lastFocus = resolveLastFocus(run, safeEvents);
  const nextRead = overrides.nextRead !== undefined ? overrides.nextRead : resolveNextRead(run, lastFocus);
  const activeLabel = formatDuration(stats.activeMs);
  const headline = resolveHeadline(run, activeLabel);
  const bullets = buildBullets(run, stats, lastFocus, nextRead);

  const summary = overrides.summary !== undefined ? overrides.summary : {
    headline,
    bullets,
    status: run?.status || null,
    phase: run?.currentPhase || null,
    generatedAt: overrides.ts || new Date().toISOString(),
    stats,
  };
  const markdown = typeof overrides.markdown === 'string' && overrides.markdown.trim()
    ? overrides.markdown
    : buildMarkdown(run, headline, bullets, stats, nextRead, lastFocus);
  const notificationText = overrides.notificationText !== undefined
    ? overrides.notificationText
    : buildNotificationText(run, headline, stats, nextRead, lastFocus);

  return {
    summary,
    markdown,
    nextRead,
    notificationText,
  };
}
