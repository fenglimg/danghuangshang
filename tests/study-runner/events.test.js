import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'os';
import { mkdtempSync } from 'fs';
import { join } from 'path';

import { RunManager, EventLogger, EVENT_TYPE, readRunEvents } from '../../gui/server/study-runner/index.js';

test('study run events can be read back as a debugging timeline', () => {
  const homeDir = mkdtempSync(join(os.tmpdir(), 'study-runner-home-'));
  const runManager = new RunManager({ homeDir });
  const eventLogger = new EventLogger({ homeDir });
  const run = runManager.createRun({ title: 'Timeline flow' });

  const startEvent = {
    ts: '2026-03-21T05:20:00.000Z',
    type: EVENT_TYPE.TOOL_START,
    tool: 'read',
    phase: 'reading',
    currentStepId: 'step-1',
    currentTarget: 'paper-a',
  };
  const started = runManager.recordToolEvent(run.runId, startEvent);
  eventLogger.appendToolEventFlow(run.runId, startEvent, started, run);

  const heartbeat = runManager.markHeartbeat(run.runId, {
    ts: '2026-03-21T05:20:05.000Z',
  });
  eventLogger.append(run.runId, {
    type: EVENT_TYPE.HEARTBEAT,
    runId: run.runId,
    ts: heartbeat.lastHeartbeatAt,
    phase: heartbeat.currentPhase,
    currentStepId: heartbeat.currentStepId,
    currentTarget: heartbeat.currentTarget,
    cumulativeActiveMs: heartbeat.cumulativeActiveMs,
  });

  const endEvent = {
    ts: '2026-03-21T05:20:15.000Z',
    type: EVENT_TYPE.TOOL_END,
    tool: 'read',
    durationMs: 15_000,
    checkpoint: { lastCompletedStepId: 'step-1' },
  };
  const ended = runManager.recordToolEvent(run.runId, endEvent);
  eventLogger.appendToolEventFlow(run.runId, endEvent, ended, heartbeat);

  const events = readRunEvents(homeDir, run.runId);

  assert.deepEqual(
    events.map((event) => event.type),
    [EVENT_TYPE.RUN_CREATED, EVENT_TYPE.TOOL_START, EVENT_TYPE.HEARTBEAT, EVENT_TYPE.TOOL_END]
  );
  assert.equal(events[1].ts, '2026-03-21T05:20:00.000Z');
  assert.equal(events[2].ts, '2026-03-21T05:20:05.000Z');
  assert.equal(events[2].currentTarget, 'paper-a');
  assert.equal(events[3].ts, '2026-03-21T05:20:15.000Z');
  assert.equal(events[3].durationMs, 15_000);
  assert.equal(ended.cumulativeActiveMs, 15_000);
});

test('study run tool-event flow logs synthetic completion when run becomes summary-complete', () => {
  const homeDir = mkdtempSync(join(os.tmpdir(), 'study-runner-home-'));
  const runManager = new RunManager({ homeDir });
  const eventLogger = new EventLogger({ homeDir });
  const run = runManager.createRun({
    title: 'Completion timeline flow',
    targetActiveMs: 15_000,
  });

  const endEvent = {
    ts: '2026-03-21T05:25:15.000Z',
    type: EVENT_TYPE.TOOL_END,
    tool: 'read',
    durationMs: 15_000,
  };
  const completed = runManager.recordToolEvent(run.runId, endEvent);
  eventLogger.appendToolEventFlow(run.runId, endEvent, completed, run);

  const events = readRunEvents(homeDir, run.runId);

  assert.deepEqual(
    events.map((event) => event.type),
    [EVENT_TYPE.RUN_CREATED, EVENT_TYPE.TOOL_END]
  );
  assert.equal(completed.status, 'done');
  assert.equal(completed.currentPhase, 'summary-complete');
});

test('study run auto-summary flow logs summarize-done and notification-ready events when notification target exists', () => {
  const homeDir = mkdtempSync(join(os.tmpdir(), 'study-runner-home-'));
  const runManager = new RunManager({ homeDir });
  const eventLogger = new EventLogger({ homeDir });
  const run = runManager.createRun({
    title: 'Summary timeline flow',
    targetActiveMs: 5_000,
    notificationTarget: 'discord:study-room',
  });

  const endEvent = {
    ts: '2026-03-21T05:45:05.000Z',
    type: EVENT_TYPE.TOOL_END,
    tool: 'read',
    durationMs: 5_000,
  };
  const completed = runManager.recordToolEvent(run.runId, endEvent);
  eventLogger.appendToolEventFlow(run.runId, endEvent, completed, run);
  eventLogger.appendSummaryComplete(run.runId, {
    ts: '2026-03-21T05:45:05.000Z',
    markdown: '# Summary\n',
  }, completed, run);

  const events = readRunEvents(homeDir, run.runId);

  assert.deepEqual(
    events.map((event) => event.type),
    [
      EVENT_TYPE.RUN_CREATED,
      EVENT_TYPE.TOOL_END,
      EVENT_TYPE.SUMMARIZE_DONE,
      EVENT_TYPE.NOTIFICATION_READY,
    ]
  );
  assert.equal(events[2].phase, 'notification-ready');
  assert.equal(events[3].ts, '2026-03-21T05:45:05.000Z');
  assert.equal(events[3].phase, 'notification-ready');
  assert.equal(events[2].hasSummary, true);
  assert.equal(events[3].notificationStatus, 'ready');
  assert.equal(events[3].hasNotificationText, true);
});

test('study run delivery flow logs delivery attempt and sent events', () => {
  const homeDir = mkdtempSync(join(os.tmpdir(), 'study-runner-home-'));
  const runManager = new RunManager({ homeDir });
  const eventLogger = new EventLogger({ homeDir });
  const run = runManager.createRun({
    title: 'Delivery timeline flow',
    targetActiveMs: 5_000,
    notificationTarget: 'discord:study-room',
  });

  runManager.recordToolEvent(run.runId, {
    ts: '2026-03-21T05:47:05.000Z',
    type: EVENT_TYPE.TOOL_END,
    tool: 'read',
    durationMs: 5_000,
  });

  const finalized = runManager.getRun(run.runId);
  eventLogger.appendSummaryComplete(run.runId, {
    ts: finalized.summaryCompletedAt,
    markdown: '# Summary\n',
  }, finalized, run);

  const sending = runManager.markNotificationDeliveryAttempt(run.runId, {
    ts: '2026-03-21T05:47:30.000Z',
    channelId: '123456789012345678',
  });
  eventLogger.appendDeliveryAttempt(run.runId, sending, finalized, {
    ts: '2026-03-21T05:47:30.000Z',
    channelId: '123456789012345678',
    resolutionSource: 'config.channels.discord',
  });

  const delivered = runManager.markNotificationDelivered(run.runId, {
    ts: '2026-03-21T05:47:32.000Z',
    channelId: '123456789012345678',
    messageId: '234567890123456789',
  });
  eventLogger.appendDeliverySent(run.runId, delivered, sending, {
    ts: '2026-03-21T05:47:32.000Z',
    channelId: '123456789012345678',
    messageId: '234567890123456789',
  });

  const events = readRunEvents(homeDir, run.runId);

  assert.deepEqual(
    events.map((event) => event.type),
    [
      EVENT_TYPE.RUN_CREATED,
      EVENT_TYPE.SUMMARIZE_DONE,
      EVENT_TYPE.NOTIFICATION_READY,
      EVENT_TYPE.DELIVERY_ATTEMPT,
      EVENT_TYPE.DELIVERY_SENT,
    ]
  );
  assert.equal(events[3].deliveryStatus, 'sending');
  assert.equal(events[3].channelId, '123456789012345678');
  assert.equal(events[4].deliveryStatus, 'sent');
  assert.equal(events[4].messageId, '234567890123456789');
});
