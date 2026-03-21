import { appendRunEvent } from './storage.js';
import { EVENT_TYPE, RUN_STATUS } from './types.js';

function isSummarizingReady(run) {
  return run?.status === RUN_STATUS.COMPLETED && run?.currentPhase === 'summarizing-ready';
}

function buildCompletionEvent(runId, previousRun, nextRun, triggerEvent = {}) {
  const triggerDurationMs = Number(triggerEvent.durationMs);

  return {
    type: EVENT_TYPE.COMPLETED,
    ts: nextRun?.endedAt || nextRun?.lastProgressAt || new Date().toISOString(),
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

function buildSummaryStartEvent(runId, previousRun, nextRun, input = {}) {
  return {
    type: EVENT_TYPE.SUMMARIZE_START,
    ts: nextRun?.summaryStartedAt || input.ts || new Date().toISOString(),
    runId,
    fromStatus: previousRun?.status || null,
    toStatus: nextRun?.status || null,
    fromPhase: previousRun?.currentPhase || null,
    phase: nextRun?.currentPhase || null,
  };
}

function buildSummaryDoneEvent(runId, previousRun, nextRun, input = {}) {
  return {
    type: EVENT_TYPE.SUMMARIZE_DONE,
    ts: nextRun?.summaryCompletedAt || input.ts || new Date().toISOString(),
    runId,
    fromStatus: previousRun?.status || null,
    toStatus: nextRun?.status || null,
    fromPhase: previousRun?.currentPhase || null,
    phase: nextRun?.currentPhase || null,
    hasSummary: nextRun?.summary !== null,
    hasMarkdown: typeof input.markdown === 'string' && input.markdown.trim().length > 0,
    nextRead: nextRun?.nextRead ?? null,
    notificationStatus: nextRun?.notificationStatus || null,
  };
}

function buildNotificationReadyEvent(runId, nextRun, input = {}) {
  return {
    type: EVENT_TYPE.NOTIFICATION_READY,
    ts: nextRun?.notificationReadyAt || nextRun?.summaryCompletedAt || input.ts || new Date().toISOString(),
    runId,
    phase: nextRun?.currentPhase || null,
    notificationTarget: nextRun?.notificationTarget || null,
    notificationStatus: nextRun?.notificationStatus || null,
    hasNotificationText: typeof nextRun?.notificationText === 'string' && nextRun.notificationText.trim().length > 0,
  };
}

function buildDeliveryAttemptEvent(runId, previousRun, nextRun, input = {}) {
  return {
    type: EVENT_TYPE.DELIVERY_ATTEMPT,
    ts: nextRun?.lastDeliveryAttemptAt || input.ts || new Date().toISOString(),
    runId,
    fromDeliveryStatus: previousRun?.deliveryStatus || previousRun?.notificationStatus || null,
    deliveryStatus: nextRun?.deliveryStatus || nextRun?.notificationStatus || null,
    notificationTarget: nextRun?.notificationTarget || null,
    channelId: nextRun?.deliveryChannelId || input.channelId || null,
    resolutionSource: input.resolutionSource || null,
  };
}

function buildDeliverySentEvent(runId, previousRun, nextRun, input = {}) {
  return {
    type: EVENT_TYPE.DELIVERY_SENT,
    ts: nextRun?.sentAt || input.ts || new Date().toISOString(),
    runId,
    fromDeliveryStatus: previousRun?.deliveryStatus || previousRun?.notificationStatus || null,
    deliveryStatus: nextRun?.deliveryStatus || nextRun?.notificationStatus || null,
    channelId: nextRun?.deliveryChannelId || input.channelId || null,
    messageId: nextRun?.messageId || input.messageId || null,
  };
}

function buildDeliveryFailedEvent(runId, previousRun, nextRun, input = {}) {
  return {
    type: EVENT_TYPE.DELIVERY_FAILED,
    ts: nextRun?.lastDeliveryAttemptAt || input.ts || new Date().toISOString(),
    runId,
    fromDeliveryStatus: previousRun?.deliveryStatus || previousRun?.notificationStatus || null,
    deliveryStatus: nextRun?.deliveryStatus || nextRun?.notificationStatus || null,
    channelId: nextRun?.deliveryChannelId || input.channelId || null,
    failureReason: nextRun?.deliveryFailureReason || input.failureReason || null,
    retryReady: nextRun?.deliveryRetryReady === true,
  };
}

export class EventLogger {
  constructor({ homeDir }) {
    this.homeDir = homeDir;
  }

  append(runId, event) {
    appendRunEvent(this.homeDir, runId, {
      ts: new Date().toISOString(),
      ...event,
    });
  }

  appendToolEventFlow(runId, event, nextRun, previousRun = null) {
    this.append(runId, {
      ts: nextRun?.lastProgressAt || event?.ts,
      ...event,
      runId,
    });

    if (!isSummarizingReady(nextRun) || isSummarizingReady(previousRun)) {
      return;
    }

    this.append(runId, buildCompletionEvent(runId, previousRun, nextRun, event));
  }

  appendSummaryStart(runId, nextRun, previousRun = null, input = {}) {
    if (nextRun?.currentPhase !== 'summarizing' || nextRun?.status !== RUN_STATUS.SUMMARIZING) {
      return;
    }
    if (previousRun?.currentPhase === 'summarizing' && previousRun?.status === RUN_STATUS.SUMMARIZING) {
      return;
    }

    this.append(runId, buildSummaryStartEvent(runId, previousRun, nextRun, input));
  }

  appendSummaryComplete(runId, input, nextRun, previousRun = null) {
    if (!nextRun?.summaryCompletedAt) {
      return;
    }

    this.append(runId, buildSummaryDoneEvent(runId, previousRun, nextRun, input));

    if (nextRun.notificationStatus === 'ready' && previousRun?.notificationStatus !== 'ready') {
      this.append(runId, buildNotificationReadyEvent(runId, nextRun, input));
    }
  }

  appendDeliveryAttempt(runId, nextRun, previousRun = null, input = {}) {
    if (!nextRun?.lastDeliveryAttemptAt) {
      return;
    }

    this.append(runId, buildDeliveryAttemptEvent(runId, previousRun, nextRun, input));
  }

  appendDeliverySent(runId, nextRun, previousRun = null, input = {}) {
    if (!nextRun?.sentAt) {
      return;
    }

    this.append(runId, buildDeliverySentEvent(runId, previousRun, nextRun, input));
  }

  appendDeliveryFailed(runId, nextRun, previousRun = null, input = {}) {
    if ((nextRun?.deliveryStatus || nextRun?.notificationStatus) !== 'failed') {
      return;
    }

    this.append(runId, buildDeliveryFailedEvent(runId, previousRun, nextRun, input));
  }
}
