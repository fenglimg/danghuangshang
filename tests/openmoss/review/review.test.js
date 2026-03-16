import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'os';
import { mkdtempSync } from 'fs';
import { join } from 'path';

import { OpenMossTaskService } from '../../../gui/server/openmoss/activity-log/index.js';
import { ReviewWorkflowService } from '../../../gui/server/openmoss/review/index.js';

test('review workflow creates approve record and completes task', () => {
  const rootDir = mkdtempSync(join(os.tmpdir(), 'openmoss-review-'));
  const taskService = new OpenMossTaskService({ rootDir });
  const reviewService = new ReviewWorkflowService({ rootDir });

  const task = taskService.createTask({ title: 'Review approve flow', actor: 'silijian' });
  taskService.claimTask(task.id, { actor: 'bingbu' });
  taskService.submitTask(task.id, { actor: 'bingbu' });

  const result = reviewService.reviewTask(task.id, {
    actor: 'duchayuan',
    action: 'approve',
    note: 'Approved for merge',
  });
  const reviews = reviewService.getTaskReviews(task.id);
  const queue = reviewService.listPendingReviews();

  assert.equal(result.task.status, 'done');
  assert.equal(result.reviewRecord.action, 'approve');
  assert.equal(reviews.length, 1);
  assert.equal(reviews[0].reviewer, 'duchayuan');
  assert.equal(queue.length, 0);

  taskService.taskStorage.clearAll();
});

test('review workflow creates reject record and moves task to rework', () => {
  const rootDir = mkdtempSync(join(os.tmpdir(), 'openmoss-review-'));
  const taskService = new OpenMossTaskService({ rootDir });
  const reviewService = new ReviewWorkflowService({ rootDir });

  const task = taskService.createTask({ title: 'Review reject flow', actor: 'silijian' });
  taskService.claimTask(task.id, { actor: 'bingbu' });
  taskService.submitTask(task.id, { actor: 'bingbu' });

  const result = reviewService.reviewTask(task.id, {
    actor: 'duchayuan',
    action: 'reject',
    note: 'Need another patch',
    metadata: { severity: 'major' },
  });
  const reviews = reviewService.listReviews({ taskId: task.id });

  assert.equal(result.task.status, 'rework');
  assert.equal(result.reviewRecord.action, 'reject');
  assert.equal(reviews.length, 1);
  assert.equal(reviews[0].metadata.severity, 'major');

  taskService.taskStorage.clearAll();
});
