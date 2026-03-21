import crypto from 'crypto';
import { DEFAULTS, RUN_STATUS, EVENT_TYPE } from './types.js';
import { applyToolDuration, buildCompletedRun } from './active-time.js';
import { appendRunEvent, readRunEvents, readRunState, readRunSummary, writeRunState, writeRunSummary } from './storage.js';
import { buildStudyRunSummary } from './summary.js';

const TERMINAL_STATUSES = [RUN_STATUS.COMPLETED, RUN_STATUS.DONE, RUN_STATUS.FAILED, RUN_STATUS.STOPPED];

function isValidRunId(runId) {
  return typeof runId === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(runId);
}

function normalizeStatus(status, fallback = RUN_STATUS.RUNNING) {
  return Object.values(RUN_STATUS).includes(status) ? status : fallback;
}

function progressStatus(status) {
  if ([RUN_STATUS.PENDING, RUN_STATUS.IDLE_WARNING, RUN_STATUS.RECOVERING, RUN_STATUS.INTERRUPTED].includes(status)) {
    return RUN_STATUS.RUNNING;
  }
  return normalizeStatus(status);
}

function isTerminalStatus(status) {
  return TERMINAL_STATUSES.includes(status);
}

function resolveTimestamp(ts) {
  return typeof ts === 'string' && ts ? ts : new Date().toISOString();
}

function hasSummaryPayload(input = {}) {
  return input.summary !== undefined
    || input.nextRead !== undefined
    || (typeof input.markdown === 'string' && input.markdown.trim().length > 0)
    || input.notificationText !== undefined;
}

function canStartSummarizing(run) {
  return !!run && (
    run.status === RUN_STATUS.COMPLETED
    || run.status === RUN_STATUS.SUMMARIZING
    || run.currentPhase === 'summarizing-ready'
    || run.currentPhase === 'summarizing'
  );
}

function canCompleteSummary(run) {
  return !!run && (
    run.status === RUN_STATUS.COMPLETED
    || run.status === RUN_STATUS.SUMMARIZING
    || run.status === RUN_STATUS.DONE
    || run.currentPhase === 'summarizing-ready'
    || run.currentPhase === 'summarizing'
    || run.currentPhase === 'summary-complete'
    || run.currentPhase === 'notification-ready'
  );
}

function isSummarizingReady(run) {
  return run?.status === RUN_STATUS.COMPLETED && run?.currentPhase === 'summarizing-ready';
}

function buildTimelineToolEvent(runId, event, nextRun, fallbackTs) {
  return {
    ts: nextRun?.lastProgressAt || fallbackTs || new Date().toISOString(),
    ...event,
    runId,
  };
}

function buildCompletionTimelineEvent(runId, previousRun, nextRun, triggerEvent = {}) {
  const triggerDurationMs = Number(triggerEvent.durationMs);

  return {
    type: EVENT_TYPE.COMPLETED,
    ts: nextRun?.endedAt || nextRun?.lastProgressAt || triggerEvent.ts || new Date().toISOString(),
    runId,
    fromStatus: previousRun?.status || null,
    toStatus: nextRun?.status || null,
    fromPhase: previousRun?.currentPhase || null,
    phase: nextRun?.currentPhase || null,
    currentStepId: nextRun?.currentStepId ?? null,
    currentTarget: nextRun?.currentTarget ?? null,
    cumulativeActiveMs: nextRun?.cumulativeActiveMs ?? 0,
    targetActiveMs: nextRun?.targetActiveMs ?? null,
    triggerType: triggerEvent.type || null,
    triggerTool: triggerEvent.tool || null,
    triggerDurationMs: Number.isFinite(triggerDurationMs) ? triggerDurationMs : undefined,
  };
}

export class RunManager {
  constructor({ homeDir }) {
    this.homeDir = homeDir;
  }

  createRun(input = {}) {
    const runId = input.runId || `study-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    if (!isValidRunId(runId)) {
      throw new Error('Invalid run ID');
    }

    const now = new Date().toISOString();
    const targetActiveMs = Number(input.targetActiveMs);
    const run = {
      runId,
      taskType: input.taskType || 'generic-study',
      title: input.title || 'Study Run',
      topic: input.topic || '',
      status: normalizeStatus(input.status, RUN_STATUS.RUNNING),
      targetActiveMs: Number.isFinite(targetActiveMs) && targetActiveMs > 0 ? targetActiveMs : 15 * 60 * 1000,
      cumulativeActiveMs: 0,
      startedAt: now,
      endedAt: null,
      currentPhase: input.currentPhase || 'init',
      currentStepId: null,
      currentTarget: null,
      lastHeartbeatAt: null,
      lastProgressAt: now,
      lastRecoveryAt: null,
      heartbeatOk: false,
      interruptions: 0,
      recoveries: 0,
      recoveryFailures: 0,
      notificationTarget: input.notificationTarget || null,
      notificationStatus: input.notificationTarget ? 'pending' : 'not-configured',
      notificationReadyAt: null,
      notificationText: null,
      deliveryStatus: input.notificationTarget ? 'pending' : 'not-configured',
      deliveryChannelId: null,
      lastDeliveryAttemptAt: null,
      sentAt: null,
      messageId: null,
      deliveryFailureReason: null,
      deliveryRetryReady: false,
      checkpoint: {
        lastCompletedStepId: null,
        resumeFrom: null,
      },
      summary: null,
      summaryStartedAt: null,
      summaryCompletedAt: null,
      nextRead: null,
      sources: Array.isArray(input.sources) ? input.sources : [],
      steps: Array.isArray(input.steps) ? input.steps : [],
      defaults: {
        ...DEFAULTS,
        ...(input.defaults && typeof input.defaults === 'object' ? input.defaults : {}),
      },
    };
    writeRunState(this.homeDir, runId, run);
    appendRunEvent(this.homeDir, runId, {
      ts: now,
      type: EVENT_TYPE.RUN_CREATED,
      runId,
      taskType: run.taskType,
      targetActiveMs: run.targetActiveMs,
    });
    return run;
  }

  getRun(runId) {
    return readRunState(this.homeDir, runId);
  }

  generateSummary(runId, overrides = {}) {
    const current = this.getRun(runId);
    if (!current) throw new Error(`Run not found: ${runId}`);
    const events = readRunEvents(this.homeDir, runId);
    return buildStudyRunSummary(current, events, overrides);
  }

  persistGeneratedSummary(runId, overrides = {}, options = {}) {
    const current = options.run || this.getRun(runId);
    if (!current) throw new Error(`Run not found: ${runId}`);

    const events = Array.isArray(options.events) ? options.events : readRunEvents(this.homeDir, runId);
    const generated = buildStudyRunSummary(current, events, overrides);
    const existingMarkdown = readRunSummary(this.homeDir, runId);
    const overwrite = options.overwrite === true;
    const nextSummary = overwrite || current.summary == null ? generated.summary : current.summary;
    const nextRead = overwrite || current.nextRead == null ? generated.nextRead : current.nextRead;
    const notificationText = overwrite || current.notificationText == null ? generated.notificationText : current.notificationText;

    if ((overwrite || !existingMarkdown) && typeof generated.markdown === 'string' && generated.markdown.trim()) {
      writeRunSummary(this.homeDir, runId, generated.markdown);
    }

    if (nextSummary === current.summary && nextRead === current.nextRead && notificationText === current.notificationText) {
      return { run: current, generated };
    }

    let updated = {
      ...current,
      summary: nextSummary,
      nextRead,
      notificationText,
    };
    writeRunState(this.homeDir, runId, updated);
    return { run: updated, generated };
  }

  updateRun(runId, patch) {
    const current = this.getRun(runId);
    if (!current) throw new Error(`Run not found: ${runId}`);
    const updated = { ...current, ...patch };
    writeRunState(this.homeDir, runId, updated);
    return updated;
  }

  markHeartbeat(runId, patch = {}) {
    const current = this.getRun(runId);
    if (!current) throw new Error(`Run not found: ${runId}`);

    const now = typeof patch.ts === 'string' && patch.ts ? patch.ts : new Date().toISOString();
    return this.updateRun(runId, {
      lastHeartbeatAt: now,
      heartbeatOk: true,
      status: typeof patch.status === 'string' ? normalizeStatus(patch.status, current.status) : normalizeStatus(current.status, RUN_STATUS.RUNNING),
      currentPhase: typeof patch.phase === 'string' && patch.phase ? patch.phase : current.currentPhase,
      currentStepId: patch.currentStepId !== undefined ? patch.currentStepId : current.currentStepId,
      currentTarget: patch.currentTarget !== undefined ? patch.currentTarget : current.currentTarget,
    });
  }

  recordToolEvent(runId, event = {}) {
    const current = this.getRun(runId);
    if (!current) throw new Error(`Run not found: ${runId}`);
    if (isTerminalStatus(current.status)) return current;

    const eventTs = typeof event.ts === 'string' && event.ts ? event.ts : new Date().toISOString();
    const nextRun = applyToolDuration(current, {
      ...event,
      ts: eventTs,
    });
    let updated = {
      ...nextRun,
      status: progressStatus(nextRun.status),
      lastProgressAt: eventTs,
      currentPhase: isSummarizingReady(nextRun)
        ? nextRun.currentPhase
        : (typeof event.phase === 'string' && event.phase ? event.phase : nextRun.currentPhase),
      currentStepId: event.currentStepId !== undefined ? event.currentStepId : nextRun.currentStepId,
      currentTarget: event.currentTarget !== undefined ? event.currentTarget : nextRun.currentTarget,
      checkpoint: event.checkpoint && typeof event.checkpoint === 'object'
        ? { ...(nextRun.checkpoint || {}), ...event.checkpoint }
        : nextRun.checkpoint,
    };
    writeRunState(this.homeDir, runId, updated);

    if (isSummarizingReady(updated) && !isSummarizingReady(current)) {
      const events = [
        ...readRunEvents(this.homeDir, runId),
        buildTimelineToolEvent(runId, event, updated, eventTs),
        buildCompletionTimelineEvent(runId, current, updated, {
          ...event,
          ts: eventTs,
        }),
      ];
      const generated = this.persistGeneratedSummary(runId, { ts: eventTs }, { run: updated, events });
      updated = this.completeSummary(runId, {
        ts: eventTs,
        summary: generated.run.summary,
        nextRead: generated.run.nextRead,
        notificationText: generated.run.notificationText,
        markdown: generated.generated?.markdown,
      });
    }

    return updated;
  }

  markInterrupted(runId, reason) {
    const current = this.getRun(runId);
    if (!current) throw new Error(`Run not found: ${runId}`);
    return this.updateRun(runId, {
      status: RUN_STATUS.INTERRUPTED,
      heartbeatOk: false,
      interruptions: (current.interruptions || 0) + 1,
      interruptionReason: reason,
    });
  }

  markCompleted(runId) {
    const current = this.getRun(runId);
    if (!current) throw new Error(`Run not found: ${runId}`);
    return this.updateRun(runId, buildCompletedRun(current));
  }

  markSummarizing(runId, patch = {}) {
    const current = this.getRun(runId);
    if (!current) throw new Error(`Run not found: ${runId}`);
    if (!canStartSummarizing(current)) {
      throw new Error(`Run is not ready for summarizing: ${runId}`);
    }

    const now = resolveTimestamp(patch.ts);
    return this.updateRun(runId, {
      status: RUN_STATUS.SUMMARIZING,
      currentPhase: 'summarizing',
      summaryStartedAt: current.summaryStartedAt || now,
    });
  }

  completeSummary(runId, input = {}) {
    const current = this.getRun(runId);
    if (!current) throw new Error(`Run not found: ${runId}`);
    if (!canCompleteSummary(current)) {
      throw new Error(`Run is not ready for summary completion: ${runId}`);
    }
    if (!hasSummaryPayload(input)) {
      throw new Error('Summary payload is required');
    }

    const now = resolveTimestamp(input.ts);
    if (typeof input.markdown === 'string' && input.markdown.trim()) {
      writeRunSummary(this.homeDir, runId, input.markdown);
    }

    return this.updateRun(runId, {
      status: RUN_STATUS.DONE,
      currentPhase: current.notificationTarget ? 'notification-ready' : 'summary-complete',
      summaryStartedAt: current.summaryStartedAt || now,
      summaryCompletedAt: now,
      summary: input.summary !== undefined ? input.summary : current.summary,
      nextRead: input.nextRead !== undefined ? input.nextRead : current.nextRead,
      notificationText: input.notificationText !== undefined ? input.notificationText : current.notificationText,
      notificationStatus: current.notificationTarget ? 'ready' : 'not-configured',
      notificationReadyAt: current.notificationTarget ? now : null,
      deliveryStatus: current.notificationTarget ? 'ready' : 'not-configured',
      sentAt: null,
      messageId: null,
      lastDeliveryAttemptAt: null,
      deliveryFailureReason: null,
      deliveryRetryReady: false,
    });
  }

  markNotificationDeliveryAttempt(runId, input = {}) {
    const current = this.getRun(runId);
    if (!current) throw new Error(`Run not found: ${runId}`);
    if (!current.notificationTarget) {
      throw new Error(`Notification target is not configured: ${runId}`);
    }

    const now = resolveTimestamp(input.ts);
    return this.updateRun(runId, {
      currentPhase: 'notification-sending',
      notificationStatus: 'sending',
      deliveryStatus: 'sending',
      lastDeliveryAttemptAt: now,
      deliveryChannelId: input.channelId !== undefined ? input.channelId : current.deliveryChannelId,
      deliveryFailureReason: null,
      deliveryRetryReady: false,
    });
  }

  markNotificationDelivered(runId, input = {}) {
    const current = this.getRun(runId);
    if (!current) throw new Error(`Run not found: ${runId}`);
    if (!current.notificationTarget) {
      throw new Error(`Notification target is not configured: ${runId}`);
    }

    const now = resolveTimestamp(input.ts);
    return this.updateRun(runId, {
      currentPhase: 'notification-sent',
      notificationStatus: 'sent',
      deliveryStatus: 'sent',
      lastDeliveryAttemptAt: input.lastDeliveryAttemptAt !== undefined ? input.lastDeliveryAttemptAt : (current.lastDeliveryAttemptAt || now),
      sentAt: now,
      messageId: input.messageId !== undefined ? input.messageId : current.messageId,
      deliveryChannelId: input.channelId !== undefined ? input.channelId : current.deliveryChannelId,
      deliveryFailureReason: null,
      deliveryRetryReady: false,
    });
  }

  markNotificationDeliveryFailed(runId, input = {}) {
    const current = this.getRun(runId);
    if (!current) throw new Error(`Run not found: ${runId}`);
    if (!current.notificationTarget) {
      throw new Error(`Notification target is not configured: ${runId}`);
    }

    const now = resolveTimestamp(input.ts);
    return this.updateRun(runId, {
      currentPhase: 'notification-failed',
      notificationStatus: 'failed',
      deliveryStatus: 'failed',
      lastDeliveryAttemptAt: now,
      deliveryChannelId: input.channelId !== undefined ? input.channelId : current.deliveryChannelId,
      deliveryFailureReason: input.failureReason !== undefined ? input.failureReason : current.deliveryFailureReason,
      deliveryRetryReady: true,
    });
  }
}
