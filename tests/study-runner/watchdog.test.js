import test from 'node:test';
import assert from 'node:assert/strict';

import { DEFAULTS, RUN_STATUS, evaluateRunHealth, buildRecoveryUpdate } from '../../gui/server/study-runner/index.js';

function makeRun(overrides = {}) {
  return {
    runId: 'study-test',
    status: RUN_STATUS.RUNNING,
    startedAt: '2026-03-21T05:00:00.000Z',
    lastHeartbeatAt: '2026-03-21T05:00:10.000Z',
    lastProgressAt: '2026-03-21T05:00:20.000Z',
    heartbeatOk: true,
    recoveries: 0,
    recoveryFailures: 0,
    defaults: { ...DEFAULTS },
    ...overrides,
  };
}

test('watchdog reports healthy runs inside heartbeat and progress windows', () => {
  const run = makeRun();
  const health = evaluateRunHealth(run, Date.parse('2026-03-21T05:00:30.000Z'));

  assert.equal(health.ok, true);
  assert.equal(buildRecoveryUpdate(run, health), null);
});

test('watchdog turns idle progress into an idle warning update', () => {
  const run = makeRun({
    lastHeartbeatAt: '2026-03-21T05:01:20.000Z',
    lastProgressAt: '2026-03-21T05:00:00.000Z',
  });
  const health = evaluateRunHealth(run, Date.parse('2026-03-21T05:01:30.000Z'));
  const update = buildRecoveryUpdate(run, health, '2026-03-21T05:01:30.000Z');

  assert.equal(health.ok, false);
  assert.equal(health.reason, 'progress_idle_timeout');
  assert.equal(update.recovery.action, 'warn-idle');
  assert.equal(update.patch.status, RUN_STATUS.IDLE_WARNING);
  assert.equal(update.event.type, 'idle_warning');
});

test('watchdog escalates heartbeat timeouts into recovery and fail states', () => {
  const recoveringRun = makeRun({
    lastHeartbeatAt: '2026-03-21T05:00:00.000Z',
  });
  const recoveringHealth = evaluateRunHealth(recoveringRun, Date.parse('2026-03-21T05:00:30.000Z'));
  const recoveringUpdate = buildRecoveryUpdate(recoveringRun, recoveringHealth, '2026-03-21T05:00:30.000Z');

  assert.equal(recoveringHealth.reason, 'runner_heartbeat_timeout');
  assert.equal(recoveringUpdate.patch.status, RUN_STATUS.RECOVERING);
  assert.equal(recoveringUpdate.patch.recoveries, 1);

  const failingRun = makeRun({
    lastHeartbeatAt: '2026-03-21T05:00:00.000Z',
    recoveries: DEFAULTS.maxRecoveries,
  });
  const failingHealth = evaluateRunHealth(failingRun, Date.parse('2026-03-21T05:00:30.000Z'));
  const failingUpdate = buildRecoveryUpdate(failingRun, failingHealth, '2026-03-21T05:00:30.000Z');

  assert.equal(failingUpdate.patch.status, RUN_STATUS.FAILED);
  assert.equal(failingUpdate.patch.recoveryFailures, 1);
  assert.equal(failingUpdate.event.type, 'recovery_failed');
});
