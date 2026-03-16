import { FilesystemActivityLogStorage } from '../activity-log/storage.js';
import { FilesystemTaskCoreStorage } from '../task-core/storage.js';
import { FilesystemPatrolStorage } from './storage.js';

function normalizeLimit(limit) {
  if (limit === undefined) {
    return undefined;
  }

  const parsed = Number.parseInt(limit, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function buildRecommendation(task) {
  switch (task.status) {
    case 'review':
      return 'Ask duchayuan to complete the review or reject with a concrete rework note.';
    case 'in_progress':
      return 'Check the assignee handoff, resolve the blocker, then reclaim the task to continue execution.';
    case 'pending':
      return 'Reassign or claim the task so it can enter active execution.';
    default:
      return 'Inspect the timeline, resolve the blocker, and move the task back into execution.';
  }
}

export class PatrolService {
  constructor(options = {}) {
    this.taskStorage = new FilesystemTaskCoreStorage(options);
    this.activityLogStorage = new FilesystemActivityLogStorage(options);
    this.patrolStorage = new FilesystemPatrolStorage(options);
  }

  listAlerts(filters = {}) {
    return this.patrolStorage.listAlerts({
      taskId: filters.taskId,
      status: filters.status,
      limit: normalizeLimit(filters.limit),
    });
  }

  getTaskAlerts(taskId) {
    return this.patrolStorage.listTaskAlerts(taskId);
  }

  scanTasks(input = {}) {
    const thresholdMinutes = Number.isFinite(input.thresholdMinutes) ? input.thresholdMinutes : 60;
    const actor = typeof input.actor === 'string' && input.actor.trim() ? input.actor.trim() : 'patrol';
    const nowMs = input.now ? new Date(input.now).getTime() : Date.now();

    const candidates = this.taskStorage.listTasks()
      .filter((task) => ['pending', 'in_progress', 'review'].includes(task.status));

    const triggered = [];
    for (const task of candidates) {
      const updatedAtMs = new Date(task.updatedAt).getTime();
      const staleMinutes = Math.floor((nowMs - updatedAtMs) / 60000);

      if (staleMinutes < thresholdMinutes) {
        continue;
      }

      if (this.patrolStorage.hasOpenAlert(task.id)) {
        continue;
      }

      const fromStatus = task.status;
      const blockedTask = this.taskStorage.transitionTask(task.id, 'blocked');
      const alert = this.patrolStorage.appendAlert(task.id, {
        actor,
        reason: `task stale for ${staleMinutes} minutes`,
        recommendation: buildRecommendation(task),
        thresholdMinutes,
        staleMinutes,
        fromStatus,
        toStatus: blockedTask.status,
        metadata: {
          lastUpdatedAt: task.updatedAt,
        },
      });
      const event = this.activityLogStorage.appendTaskEvent(task.id, {
        type: 'block',
        actor,
        note: alert.reason,
        fromStatus,
        toStatus: blockedTask.status,
        metadata: {
          patrolAlertId: alert.id,
          recommendation: alert.recommendation,
          thresholdMinutes,
          staleMinutes,
        },
      });

      triggered.push({ task: blockedTask, alert, event });
    }

    return {
      thresholdMinutes,
      scanned: candidates.length,
      triggered,
    };
  }
}
