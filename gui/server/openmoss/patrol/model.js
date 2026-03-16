import crypto from 'crypto';

function nowIso() {
  return new Date().toISOString();
}

export function createPatrolAlert(input = {}) {
  if (!input.taskId || typeof input.taskId !== 'string') {
    throw new Error('PatrolAlert taskId is required');
  }

  return {
    id: input.id || `alert_${crypto.randomUUID()}`,
    taskId: input.taskId,
    actor: typeof input.actor === 'string' && input.actor.trim() ? input.actor.trim() : 'patrol',
    reason: typeof input.reason === 'string' && input.reason.trim()
      ? input.reason.trim()
      : 'task exceeded timeout threshold',
    recommendation: typeof input.recommendation === 'string' && input.recommendation.trim()
      ? input.recommendation.trim()
      : 'Inspect the last timeline event, resolve the blocker, then reclaim the task.',
    thresholdMinutes: Number.isFinite(input.thresholdMinutes) ? input.thresholdMinutes : 60,
    staleMinutes: Number.isFinite(input.staleMinutes) ? input.staleMinutes : 0,
    fromStatus: input.fromStatus ?? null,
    toStatus: input.toStatus ?? 'blocked',
    status: input.status === 'resolved' ? 'resolved' : 'open',
    createdAt: input.createdAt || nowIso(),
    metadata: input.metadata && typeof input.metadata === 'object' ? { ...input.metadata } : {},
  };
}
