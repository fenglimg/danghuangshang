import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'os';
import { mkdtempSync } from 'fs';
import { join } from 'path';

import { RunManager, EVENT_TYPE, readRunSummary } from '../../gui/server/study-runner/index.js';

test('run manager creates running study runs with sane defaults', () => {
  const homeDir = mkdtempSync(join(os.tmpdir(), 'study-runner-home-'));
  const runManager = new RunManager({ homeDir });

  const run = runManager.createRun({
    title: 'Read papers',
    topic: 'Transformer interpretability',
    targetActiveMs: 45_000,
  });

  assert.equal(run.status, 'running');
  assert.equal(run.targetActiveMs, 45_000);
  assert.equal(run.topic, 'Transformer interpretability');
  assert.equal(run.cumulativeActiveMs, 0);
  assert.equal(typeof run.lastProgressAt, 'string');
  assert.equal(run.lastHeartbeatAt, null);
  assert.equal(run.notificationStatus, 'not-configured');
});

test('run manager records tool progress and accumulates counted tool time', () => {
  const homeDir = mkdtempSync(join(os.tmpdir(), 'study-runner-home-'));
  const runManager = new RunManager({ homeDir });
  const run = runManager.createRun({ title: 'Tool event flow' });

  const started = runManager.recordToolEvent(run.runId, {
    ts: '2026-03-21T05:10:00.000Z',
    type: EVENT_TYPE.TOOL_START,
    tool: 'read',
    phase: 'gathering',
    currentStepId: 'step-1',
    currentTarget: 'paper-a',
  });
  const ended = runManager.recordToolEvent(run.runId, {
    ts: '2026-03-21T05:12:00.000Z',
    type: EVENT_TYPE.TOOL_END,
    tool: 'read',
    durationMs: 12_000,
    checkpoint: { lastCompletedStepId: 'step-1' },
  });

  assert.equal(started.currentPhase, 'gathering');
  assert.equal(started.currentStepId, 'step-1');
  assert.equal(started.currentTarget, 'paper-a');
  assert.equal(started.lastProgressAt, '2026-03-21T05:10:00.000Z');
  assert.equal(ended.cumulativeActiveMs, 12_000);
  assert.equal(ended.lastProgressAt, '2026-03-21T05:12:00.000Z');
  assert.equal(ended.checkpoint.lastCompletedStepId, 'step-1');
});

test('run manager marks heartbeat without losing current run context', () => {
  const homeDir = mkdtempSync(join(os.tmpdir(), 'study-runner-home-'));
  const runManager = new RunManager({ homeDir });
  const run = runManager.createRun({ title: 'Heartbeat flow' });

  runManager.recordToolEvent(run.runId, {
    ts: '2026-03-21T05:15:00.000Z',
    type: EVENT_TYPE.TOOL_START,
    tool: 'read',
    phase: 'note-taking',
    currentStepId: 'step-2',
    currentTarget: 'notes.md',
  });

  const updated = runManager.markHeartbeat(run.runId, {
    ts: '2026-03-21T05:15:10.000Z',
  });

  assert.equal(updated.heartbeatOk, true);
  assert.equal(updated.lastHeartbeatAt, '2026-03-21T05:15:10.000Z');
  assert.equal(updated.currentPhase, 'note-taking');
  assert.equal(updated.currentStepId, 'step-2');
  assert.equal(updated.currentTarget, 'notes.md');
});

test('run manager caps counted tool time at target and marks run summary-complete when no notification target exists', () => {
  const homeDir = mkdtempSync(join(os.tmpdir(), 'study-runner-home-'));
  const runManager = new RunManager({ homeDir });
  const run = runManager.createRun({
    title: 'Completion flow',
    targetActiveMs: 15_000,
  });

  runManager.recordToolEvent(run.runId, {
    ts: '2026-03-21T05:25:00.000Z',
    type: EVENT_TYPE.TOOL_START,
    tool: 'read',
    phase: 'reading',
    currentStepId: 'step-3',
    currentTarget: 'paper-b',
  });

  const completed = runManager.recordToolEvent(run.runId, {
    ts: '2026-03-21T05:25:20.000Z',
    type: EVENT_TYPE.TOOL_END,
    tool: 'read',
    durationMs: 18_000,
  });

  assert.equal(completed.cumulativeActiveMs, 15_000);
  assert.equal(completed.status, 'done');
  assert.equal(completed.currentPhase, 'summary-complete');
  assert.equal(completed.notificationStatus, 'not-configured');
  assert.equal(completed.endedAt, '2026-03-21T05:25:20.000Z');
});

test('run manager auto-persists summary artifacts and marks notification-ready when notification target exists', () => {
  const homeDir = mkdtempSync(join(os.tmpdir(), 'study-runner-home-'));
  const runManager = new RunManager({ homeDir });
  const run = runManager.createRun({
    title: 'Auto summary flow',
    topic: 'Graph neural networks',
    targetActiveMs: 5_000,
    notificationTarget: 'discord:study-room',
  });

  const completed = runManager.recordToolEvent(run.runId, {
    ts: '2026-03-21T05:27:05.000Z',
    type: EVENT_TYPE.TOOL_END,
    tool: 'read',
    durationMs: 5_000,
    currentTarget: 'paper-d',
    checkpoint: {
      lastCompletedStepId: 'step-4',
      resumeFrom: 'paper-e',
    },
  });

  assert.equal(completed.status, 'done');
  assert.equal(completed.currentPhase, 'notification-ready');
  assert.equal(completed.notificationStatus, 'ready');
  assert.equal(completed.deliveryStatus, 'ready');
  assert.equal(completed.summaryCompletedAt, '2026-03-21T05:27:05.000Z');
  assert.match(completed.summary.headline, /Graph neural networks/);
  assert.equal(completed.nextRead.title, 'paper-e');
  assert.equal(completed.nextRead.source, 'checkpoint.resumeFrom');
  assert.match(completed.notificationText, /Graph neural networks/);
  assert.match(readRunSummary(homeDir, run.runId), /# Completed Graph neural networks in 0m 5s/);
});

test('run manager ignores further tool progression after summary-complete finalization', () => {
  const homeDir = mkdtempSync(join(os.tmpdir(), 'study-runner-home-'));
  const runManager = new RunManager({ homeDir });
  const run = runManager.createRun({
    title: 'Terminal flow',
    targetActiveMs: 5_000,
  });

  const completed = runManager.recordToolEvent(run.runId, {
    ts: '2026-03-21T05:30:05.000Z',
    type: EVENT_TYPE.TOOL_END,
    tool: 'read',
    durationMs: 5_000,
  });
  const afterCompletion = runManager.recordToolEvent(run.runId, {
    ts: '2026-03-21T05:30:15.000Z',
    type: EVENT_TYPE.TOOL_END,
    tool: 'read',
    durationMs: 2_000,
    phase: 'should-not-apply',
  });

  assert.equal(completed.status, 'done');
  assert.equal(afterCompletion.cumulativeActiveMs, 5_000);
  assert.equal(afterCompletion.currentPhase, 'summary-complete');
  assert.equal(afterCompletion.endedAt, '2026-03-21T05:30:05.000Z');
});

test('run manager completes summaries and marks notification-ready when configured', () => {
  const homeDir = mkdtempSync(join(os.tmpdir(), 'study-runner-home-'));
  const runManager = new RunManager({ homeDir });
  const run = runManager.createRun({
    title: 'Summary completion flow',
    targetActiveMs: 5_000,
    notificationTarget: 'discord:study-room',
  });

  const completedRun = runManager.recordToolEvent(run.runId, {
    ts: '2026-03-21T05:40:05.000Z',
    type: EVENT_TYPE.TOOL_END,
    tool: 'read',
    durationMs: 5_000,
  });

  const completed = runManager.completeSummary(run.runId, {
    ts: '2026-03-21T05:40:20.000Z',
    summary: {
      headline: 'Covered the key findings',
      bullets: ['Captured the main claims', 'Queued one follow-up read'],
    },
    markdown: '# Summary\n\n- Captured the main claims\n- Queued one follow-up read\n',
    nextRead: {
      title: 'Mechanistic interpretability survey',
    },
    notificationText: 'Study summary ready for review.',
  });

  assert.equal(completedRun.status, 'done');
  assert.equal(completed.status, 'done');
  assert.equal(completed.currentPhase, 'notification-ready');
  assert.equal(completed.summaryStartedAt, '2026-03-21T05:40:05.000Z');
  assert.equal(completed.summaryCompletedAt, '2026-03-21T05:40:20.000Z');
  assert.equal(completed.notificationStatus, 'ready');
  assert.equal(completed.notificationReadyAt, '2026-03-21T05:40:20.000Z');
  assert.equal(completed.notificationText, 'Study summary ready for review.');
  assert.deepEqual(completed.nextRead, {
    title: 'Mechanistic interpretability survey',
  });
  assert.equal(readRunSummary(homeDir, run.runId), '# Summary\n\n- Captured the main claims\n- Queued one follow-up read\n');
});

test('run manager persists successful Discord delivery metadata', () => {
  const homeDir = mkdtempSync(join(os.tmpdir(), 'study-runner-home-'));
  const runManager = new RunManager({ homeDir });
  const run = runManager.createRun({
    title: 'Delivery success flow',
    targetActiveMs: 5_000,
    notificationTarget: 'discord:study-room',
  });

  runManager.recordToolEvent(run.runId, {
    ts: '2026-03-21T05:50:05.000Z',
    type: EVENT_TYPE.TOOL_END,
    tool: 'read',
    durationMs: 5_000,
  });

  const sending = runManager.markNotificationDeliveryAttempt(run.runId, {
    ts: '2026-03-21T05:50:10.000Z',
    channelId: '123456789012345678',
  });
  const delivered = runManager.markNotificationDelivered(run.runId, {
    ts: '2026-03-21T05:50:12.000Z',
    channelId: '123456789012345678',
    messageId: '234567890123456789',
  });

  assert.equal(sending.notificationStatus, 'sending');
  assert.equal(sending.deliveryStatus, 'sending');
  assert.equal(sending.currentPhase, 'notification-sending');
  assert.equal(delivered.notificationStatus, 'sent');
  assert.equal(delivered.deliveryStatus, 'sent');
  assert.equal(delivered.currentPhase, 'notification-sent');
  assert.equal(delivered.sentAt, '2026-03-21T05:50:12.000Z');
  assert.equal(delivered.messageId, '234567890123456789');
  assert.equal(delivered.deliveryChannelId, '123456789012345678');
  assert.equal(delivered.deliveryRetryReady, false);
});

test('run manager marks failed Discord deliveries as retry-ready', () => {
  const homeDir = mkdtempSync(join(os.tmpdir(), 'study-runner-home-'));
  const runManager = new RunManager({ homeDir });
  const run = runManager.createRun({
    title: 'Delivery failure flow',
    targetActiveMs: 5_000,
    notificationTarget: 'discord:study-room',
  });

  const failed = runManager.markNotificationDeliveryFailed(run.runId, {
    ts: '2026-03-21T05:55:10.000Z',
    channelId: '123456789012345678',
    failureReason: 'Discord API unavailable',
  });

  assert.equal(failed.notificationStatus, 'failed');
  assert.equal(failed.deliveryStatus, 'failed');
  assert.equal(failed.currentPhase, 'notification-failed');
  assert.equal(failed.deliveryChannelId, '123456789012345678');
  assert.equal(failed.deliveryFailureReason, 'Discord API unavailable');
  assert.equal(failed.deliveryRetryReady, true);
});
