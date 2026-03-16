import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'os';
import { mkdtempSync } from 'fs';
import { join } from 'path';

import { OpenMossTaskService } from '../../../gui/server/openmoss/activity-log/index.js';
import { PatrolService } from '../../../gui/server/openmoss/patrol/index.js';

test('patrol scan blocks stale in-progress tasks and records alert', () => {
  const rootDir = mkdtempSync(join(os.tmpdir(), 'openmoss-patrol-'));
  const taskService = new OpenMossTaskService({ rootDir });
  const patrolService = new PatrolService({ rootDir });

  const created = taskService.createTask({
    title: 'Patrol blocked flow',
    actor: 'silijian',
    status: 'in_progress',
    createdAt: '2026-03-16T00:00:00.000Z',
    updatedAt: '2026-03-16T00:00:00.000Z',
  });
  const result = patrolService.scanTasks({
    actor: 'patrol',
    thresholdMinutes: 30,
    now: '2026-03-16T01:00:00.000Z',
  });
  const alerts = patrolService.getTaskAlerts(created.id);
  const task = taskService.getTask(created.id);

  assert.equal(result.triggered.length, 1);
  assert.equal(task.status, 'blocked');
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].thresholdMinutes, 30);
  assert.match(alerts[0].recommendation, /Inspect|Check|Reassign/);

  taskService.taskStorage.clearAll();
});

test('patrol scan does not duplicate open alerts for the same stale task', () => {
  const rootDir = mkdtempSync(join(os.tmpdir(), 'openmoss-patrol-'));
  const taskService = new OpenMossTaskService({ rootDir });
  const patrolService = new PatrolService({ rootDir });

  const created = taskService.createTask({
    title: 'Patrol dedupe flow',
    actor: 'silijian',
    status: 'review',
    createdAt: '2026-03-16T00:00:00.000Z',
    updatedAt: '2026-03-16T00:00:00.000Z',
  });

  const firstScan = patrolService.scanTasks({
    thresholdMinutes: 10,
    now: '2026-03-16T00:30:00.000Z',
  });
  const secondScan = patrolService.scanTasks({
    thresholdMinutes: 10,
    now: '2026-03-16T01:00:00.000Z',
  });
  const alerts = patrolService.getTaskAlerts(created.id);

  assert.equal(firstScan.triggered.length, 1);
  assert.equal(secondScan.triggered.length, 0);
  assert.equal(alerts.length, 1);

  taskService.taskStorage.clearAll();
});
