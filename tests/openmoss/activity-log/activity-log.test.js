import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'os';
import { mkdtempSync } from 'fs';
import { join } from 'path';

import { OpenMossTaskService } from '../../../gui/server/openmoss/activity-log/index.js';

test('activity log records create/claim/submit/review timeline', () => {
  const rootDir = mkdtempSync(join(os.tmpdir(), 'openmoss-activity-log-'));
  const service = new OpenMossTaskService({ rootDir });

  const created = service.createTask({
    title: 'Ship governance timeline',
    actor: 'silijian',
    note: 'Create initial task shell',
  });
  const claimed = service.claimTask(created.id, {
    actor: 'bingbu',
    note: 'Started implementation',
  });
  const submitted = service.submitTask(created.id, {
    actor: 'bingbu',
    note: 'Ready for review',
  });
  const reviewed = service.reviewTask(created.id, {
    actor: 'duchayuan',
    action: 'approve',
    note: 'Approved after review',
  });
  const timeline = service.getTaskTimeline(created.id);

  assert.equal(claimed.task.status, 'in_progress');
  assert.equal(submitted.task.status, 'review');
  assert.equal(reviewed.task.status, 'done');
  assert.deepEqual(
    timeline.map((event) => event.type),
    ['create', 'claim', 'submit', 'review']
  );
  assert.equal(timeline[3].metadata.action, 'approve');

  service.taskStorage.clearAll();
});

test('activity log supports blocked path and reject -> rework path', () => {
  const rootDir = mkdtempSync(join(os.tmpdir(), 'openmoss-activity-log-'));
  const service = new OpenMossTaskService({ rootDir });

  const created = service.createTask({
    title: 'Handle blocked branch',
    actor: 'silijian',
  });
  service.claimTask(created.id, { actor: 'gongbu' });
  const blocked = service.blockTask(created.id, {
    actor: 'duchayuan',
    note: 'Missing deployment secret',
  });
  const reClaimed = service.claimTask(created.id, {
    actor: 'gongbu',
    note: 'Secret restored, continue work',
  });
  service.submitTask(created.id, { actor: 'gongbu' });
  const rejected = service.reviewTask(created.id, {
    actor: 'duchayuan',
    action: 'reject',
    note: 'Need one more fix',
  });
  const timeline = service.getTaskTimeline(created.id);

  assert.equal(blocked.task.status, 'blocked');
  assert.equal(reClaimed.task.status, 'in_progress');
  assert.equal(rejected.task.status, 'rework');
  assert.deepEqual(
    timeline.map((event) => event.type),
    ['create', 'claim', 'block', 'claim', 'submit', 'review']
  );
  assert.equal(timeline.at(-1).metadata.action, 'reject');

  service.taskStorage.clearAll();
});
