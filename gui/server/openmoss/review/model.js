import crypto from 'crypto';

export const REVIEW_ACTIONS = Object.freeze(['approve', 'reject']);

function nowIso() {
  return new Date().toISOString();
}

export function createReviewRecord(input = {}) {
  const action = input.action === 'reject' ? 'reject' : 'approve';

  if (!input.taskId || typeof input.taskId !== 'string') {
    throw new Error('ReviewRecord taskId is required');
  }

  if (!input.reviewer || typeof input.reviewer !== 'string' || !input.reviewer.trim()) {
    throw new Error('ReviewRecord reviewer is required');
  }

  return {
    id: input.id || `review_${crypto.randomUUID()}`,
    taskId: input.taskId,
    reviewer: input.reviewer.trim(),
    action,
    note: typeof input.note === 'string' ? input.note : '',
    fromStatus: input.fromStatus ?? 'review',
    toStatus: input.toStatus ?? (action === 'approve' ? 'done' : 'rework'),
    createdAt: input.createdAt || nowIso(),
    metadata: input.metadata && typeof input.metadata === 'object' ? { ...input.metadata } : {},
  };
}
