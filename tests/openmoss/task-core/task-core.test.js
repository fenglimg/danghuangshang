import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'os';
import { mkdtempSync } from 'fs';
import { join } from 'path';

import {
  canTransitionStatus,
  createTask,
  FilesystemTaskCoreStorage,
} from '../../../gui/server/openmoss/task-core/index.js';

test('status machine allows the main path and rejects illegal jumps', () => {
  assert.equal(canTransitionStatus('pending', 'in_progress'), true);
  assert.equal(canTransitionStatus('in_progress', 'review'), true);
  assert.equal(canTransitionStatus('review', 'done'), true);
  assert.equal(canTransitionStatus('pending', 'done'), false);
  assert.equal(canTransitionStatus('done', 'review'), false);
});

test('task model creates task/module/work-item hierarchy', () => {
  const task = createTask({
    title: 'Build governance core',
    modules: [
      {
        title: 'Task model',
        workItems: [
          { title: 'Define states', assignee: 'bingbu' },
        ],
      },
    ],
  });

  assert.equal(task.status, 'pending');
  assert.equal(task.modules.length, 1);
  assert.equal(task.modules[0].workItems.length, 1);
  assert.match(task.id, /^task_/);
  assert.match(task.modules[0].id, /^module_/);
  assert.match(task.modules[0].workItems[0].id, /^workitem_/);
});

test('filesystem storage can create, update, transition, and list tasks', () => {
  const rootDir = mkdtempSync(join(os.tmpdir(), 'openmoss-task-core-'));
  const storage = new FilesystemTaskCoreStorage({ rootDir });

  const created = storage.createTask({
    title: 'Absorb task core',
    description: 'Wave 2 task core implementation',
  });

  const withModule = storage.addModule(created.id, { title: 'Storage adapter' });
  const moduleId = withModule.module.id;
  const withWorkItem = storage.addWorkItem(created.id, moduleId, {
    title: 'Persist task snapshots',
    assignee: 'gongbu',
  });

  const updated = storage.updateTask(created.id, {
    owner: 'silijian',
    metadata: { phase: 'wave-2' },
  });
  const inProgress = storage.transitionTask(created.id, 'in_progress');
  const inReview = storage.transitionTask(created.id, 'review');
  const listed = storage.listTasks();

  assert.equal(withWorkItem.workItem.assignee, 'gongbu');
  assert.equal(updated.owner, 'silijian');
  assert.equal(updated.metadata.phase, 'wave-2');
  assert.equal(inProgress.status, 'in_progress');
  assert.equal(inReview.status, 'review');
  assert.equal(listed.length, 1);
  assert.equal(listed[0].modules.length, 1);
  assert.equal(listed[0].modules[0].workItems.length, 1);
  assert.equal(storage.getSchemaVersion().schemaVersion, 1);

  storage.clearAll();
});

test('filesystem storage rejects illegal transitions', () => {
  const rootDir = mkdtempSync(join(os.tmpdir(), 'openmoss-task-core-'));
  const storage = new FilesystemTaskCoreStorage({ rootDir });
  const created = storage.createTask({ title: 'Invalid transition guard' });

  assert.throws(
    () => storage.transitionTask(created.id, 'done'),
    /Invalid task status transition: pending -> done/
  );

  storage.clearAll();
});
