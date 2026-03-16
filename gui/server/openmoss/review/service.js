import { FilesystemActivityLogStorage } from '../activity-log/storage.js';
import { FilesystemTaskCoreStorage } from '../task-core/storage.js';
import { FilesystemReviewStorage } from './storage.js';

function requireReviewer(actor) {
  if (!actor || typeof actor !== 'string' || !actor.trim()) {
    throw new Error('reviewer is required');
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

export class ReviewWorkflowService {
  constructor(options = {}) {
    this.taskStorage = new FilesystemTaskCoreStorage(options);
    this.activityLogStorage = new FilesystemActivityLogStorage(options);
    this.reviewStorage = new FilesystemReviewStorage(options);
  }

  listPendingReviews(filters = {}) {
    return this.taskStorage.listTasks({
      status: 'review',
      limit: normalizeLimit(filters.limit),
    });
  }

  listReviews(filters = {}) {
    return this.reviewStorage.listAllReviews({
      taskId: filters.taskId,
      action: filters.action,
      limit: normalizeLimit(filters.limit),
    });
  }

  getTaskReviews(taskId) {
    return this.reviewStorage.listTaskReviews(taskId);
  }

  reviewTask(taskId, input = {}) {
    const reviewer = requireReviewer(input.actor || input.reviewer || 'system');
    const action = input.action === 'reject' ? 'reject' : 'approve';

    const before = this.taskStorage.getTask(taskId);
    if (!before) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const nextStatus = action === 'approve' ? 'done' : 'rework';
    const task = this.taskStorage.transitionTask(taskId, nextStatus);
    const reviewRecord = this.reviewStorage.appendReviewRecord(taskId, {
      reviewer,
      action,
      note: input.note,
      fromStatus: before.status,
      toStatus: task.status,
      metadata: input.metadata,
    });
    const event = this.activityLogStorage.appendTaskEvent(taskId, {
      type: 'review',
      actor: reviewer,
      note: input.note,
      fromStatus: before.status,
      toStatus: task.status,
      metadata: {
        ...(input.metadata && typeof input.metadata === 'object' ? input.metadata : {}),
        action,
        reviewRecordId: reviewRecord.id,
      },
    });

    return { task, reviewRecord, event };
  }
}
