import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'os';
import { mkdtempSync } from 'fs';
import { join } from 'path';

import { EventLogger, EVENT_TYPE, RunManager, readRunEvents, readRunSummary } from '../../gui/server/study-runner/index.js';

test('study run summary generation derives summary artifacts from stored state and timeline', () => {
  const homeDir = mkdtempSync(join(os.tmpdir(), 'study-runner-home-'));
  const runManager = new RunManager({ homeDir });
  const eventLogger = new EventLogger({ homeDir });
  const run = runManager.createRun({
    title: 'Read papers',
    topic: 'Transformer interpretability',
    targetActiveMs: 5_000,
    notificationTarget: 'discord:study-room',
  });

  const startEvent = {
    ts: '2026-03-21T06:10:00.000Z',
    type: EVENT_TYPE.TOOL_START,
    tool: 'read',
    phase: 'reading',
    currentStepId: 'step-1',
    currentTarget: 'paper-a',
  };
  const started = runManager.recordToolEvent(run.runId, startEvent);
  eventLogger.appendToolEventFlow(run.runId, startEvent, started, run);

  const endEvent = {
    ts: '2026-03-21T06:10:05.000Z',
    type: EVENT_TYPE.TOOL_END,
    tool: 'read',
    durationMs: 5_000,
    currentStepId: 'step-1',
    currentTarget: 'paper-a',
  };
  const completed = runManager.recordToolEvent(run.runId, endEvent);
  const checkpointed = runManager.updateRun(run.runId, {
    checkpoint: {
      lastCompletedStepId: 'step-1',
      resumeFrom: 'paper-b',
    },
  });
  eventLogger.appendToolEventFlow(run.runId, endEvent, checkpointed, started);

  const generated = runManager.generateSummary(run.runId, {
    ts: '2026-03-21T06:10:10.000Z',
  });

  assert.equal(generated.summary.status, 'done');
  assert.equal(generated.summary.phase, 'notification-ready');
  assert.match(generated.summary.headline, /Transformer interpretability/);
  assert.ok(generated.summary.bullets.some((bullet) => bullet.includes('tool completion')));
  assert.equal(generated.nextRead.title, 'paper-b');
  assert.equal(generated.nextRead.source, 'checkpoint.resumeFrom');
  assert.match(generated.markdown, /# Completed Transformer interpretability in 0m 5s/);
  assert.match(generated.markdown, /## Highlights/);
  assert.match(generated.notificationText, /Transformer interpretability/);
  assert.match(generated.notificationText, /paper-b/);
});

test('generated study run summaries can finalize run state and notification readiness', () => {
  const homeDir = mkdtempSync(join(os.tmpdir(), 'study-runner-home-'));
  const runManager = new RunManager({ homeDir });
  const eventLogger = new EventLogger({ homeDir });
  const run = runManager.createRun({
    title: 'Summary finalize flow',
    targetActiveMs: 5_000,
    notificationTarget: 'discord:study-room',
  });

  const endEvent = {
    ts: '2026-03-21T06:15:05.000Z',
    type: EVENT_TYPE.TOOL_END,
    tool: 'read',
    durationMs: 5_000,
    currentTarget: 'paper-c',
  };
  const completed = runManager.recordToolEvent(run.runId, endEvent);
  eventLogger.appendToolEventFlow(run.runId, endEvent, completed, run);

  const generated = runManager.generateSummary(run.runId, {
    ts: '2026-03-21T06:15:20.000Z',
  });
  const finalized = runManager.completeSummary(run.runId, {
    ts: '2026-03-21T06:15:20.000Z',
    ...generated,
  });
  eventLogger.appendSummaryComplete(run.runId, {
    ts: '2026-03-21T06:15:20.000Z',
    ...generated,
  }, finalized, completed);

  const events = readRunEvents(homeDir, run.runId);

  assert.equal(finalized.status, 'done');
  assert.equal(finalized.currentPhase, 'notification-ready');
  assert.equal(finalized.notificationStatus, 'ready');
  assert.match(finalized.notificationText, /Summary finalize flow/);
  assert.equal(readRunSummary(homeDir, run.runId), generated.markdown);
  assert.deepEqual(
    events.map((event) => event.type),
    [
      EVENT_TYPE.RUN_CREATED,
      EVENT_TYPE.TOOL_END,
      EVENT_TYPE.SUMMARIZE_DONE,
    ]
  );
});
