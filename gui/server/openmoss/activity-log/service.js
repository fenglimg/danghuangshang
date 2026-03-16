import { FilesystemActivityLogStorage } from './storage.js';
import { FilesystemTaskCoreStorage } from '../task-core/storage.js';

function requireActor(actor) {
  if (!actor || typeof actor !== 'string' || !actor.trim()) {
    throw new Error('actor is required');
  }

  return actor.trim();
}

function normalizeLimit(limit) {
  if (limit === undefined) {
    return undefined;
  }

  const parsed = Number.parseInt(limit, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export class OpenMossTaskService {
  constructor(options = {}) {
    this.taskStorage = new FilesystemTaskCoreStorage(options);
    this.activityLogStorage = new FilesystemActivityLogStorage(options);
  }

  listTasks(filters = {}) {
    return this.taskStorage.listTasks({
      status: filters.status,
      limit: normalizeLimit(filters.limit),
    });
  }

  getTask(taskId) {
    return this.taskStorage.getTask(taskId);
  }

  getTaskTimeline(taskId) {
    return this.activityLogStorage.listTaskEvents(taskId);
  }

  createTask(input = {}) {
    const actor = requireActor(input.actor || 'system');
    const task = this.taskStorage.createTask(input);
    this.activityLogStorage.appendTaskEvent(task.id, {
      type: 'create',
      actor,
      note: input.note,
      fromStatus: null,
      toStatus: task.status,
      metadata: {
        title: task.title,
      },
    });
    return task;
  }

  claimTask(taskId, input = {}) {
    return this.#transitionWithEvent(taskId, 'claim', 'in_progress', input);
  }

  submitTask(taskId, input = {}) {
    return this.#transitionWithEvent(taskId, 'submit', 'review', input);
  }

  blockTask(taskId, input = {}) {
    return this.#transitionWithEvent(taskId, 'block', 'blocked', input);
  }

  reviewTask(taskId, input = {}) {
    const action = input.action === 'reject' ? 'reject' : 'approve';
    const nextStatus = action === 'approve' ? 'done' : 'rework';
    return this.#transitionWithEvent(taskId, 'review', nextStatus, {
      ...input,
      metadata: {
        ...(input.metadata && typeof input.metadata === 'object' ? input.metadata : {}),
        action,
      },
    });
  }

  #transitionWithEvent(taskId, eventType, nextStatus, input = {}) {
    const actor = requireActor(input.actor || 'system');
    const before = this.taskStorage.getTask(taskId);
    if (!before) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const task = this.taskStorage.transitionTask(taskId, nextStatus);
    const event = this.activityLogStorage.appendTaskEvent(taskId, {
      type: eventType,
      actor,
      note: input.note,
      fromStatus: before.status,
      toStatus: task.status,
      metadata: input.metadata,
    });

    return { task, event };
  }
}
