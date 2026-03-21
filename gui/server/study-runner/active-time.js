import { EVENT_TYPE, RUN_STATUS } from './types.js';

const TERMINAL_STATUSES = [RUN_STATUS.COMPLETED, RUN_STATUS.DONE, RUN_STATUS.FAILED, RUN_STATUS.STOPPED];

function isTerminalRun(run) {
  return TERMINAL_STATUSES.includes(run?.status);
}

function resolveActiveMs(value) {
  const activeMs = Number(value || 0);
  return Number.isFinite(activeMs) && activeMs > 0 ? activeMs : 0;
}

function resolveTargetActiveMs(value) {
  const targetActiveMs = Number(value || 0);
  return Number.isFinite(targetActiveMs) && targetActiveMs > 0 ? targetActiveMs : null;
}

export function buildCompletedRun(run, endedAt = new Date().toISOString()) {
  const targetActiveMs = resolveTargetActiveMs(run?.targetActiveMs);
  const currentActiveMs = resolveActiveMs(run?.cumulativeActiveMs);

  return {
    ...run,
    status: RUN_STATUS.COMPLETED,
    cumulativeActiveMs: targetActiveMs ?? currentActiveMs,
    endedAt: run?.endedAt || endedAt,
    currentPhase: 'summarizing-ready',
  };
}

export function isCountedLearningTool(toolName) {
  return ['web_fetch', 'read', 'exec', 'browser', 'canvas'].includes(toolName);
}

export function applyToolDuration(run, event) {
  if (!run || !event) return run;
  if (isTerminalRun(run)) return run;
  if (event.type !== EVENT_TYPE.TOOL_END) return run;
  if (!isCountedLearningTool(event.tool)) return run;
  const durationMs = Number(event.durationMs || 0);
  if (!Number.isFinite(durationMs) || durationMs <= 0) return run;

  const currentActiveMs = resolveActiveMs(run.cumulativeActiveMs);
  const targetActiveMs = resolveTargetActiveMs(run.targetActiveMs);
  const nextActiveMs = currentActiveMs + durationMs;
  const cumulativeActiveMs = targetActiveMs === null ? nextActiveMs : Math.min(nextActiveMs, targetActiveMs);

  const progressedRun = {
    ...run,
    cumulativeActiveMs,
  };

  if (targetActiveMs !== null && cumulativeActiveMs >= targetActiveMs) {
    return buildCompletedRun(progressedRun, event.ts);
  }

  return {
    ...progressedRun,
  };
}
