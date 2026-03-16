export const TASK_STATUSES = Object.freeze([
  'pending',
  'in_progress',
  'review',
  'done',
  'rework',
  'blocked',
]);

const ALLOWED_TRANSITIONS = Object.freeze({
  pending: ['in_progress', 'blocked'],
  in_progress: ['review', 'blocked'],
  review: ['done', 'rework', 'blocked'],
  rework: ['in_progress', 'blocked'],
  blocked: ['in_progress', 'rework'],
  done: [],
});

export function isValidTaskStatus(status) {
  return TASK_STATUSES.includes(status);
}

export function canTransitionStatus(fromStatus, toStatus) {
  if (!isValidTaskStatus(fromStatus) || !isValidTaskStatus(toStatus)) {
    return false;
  }

  if (fromStatus === toStatus) {
    return true;
  }

  return ALLOWED_TRANSITIONS[fromStatus].includes(toStatus);
}

export function assertValidTransition(fromStatus, toStatus) {
  if (!isValidTaskStatus(fromStatus)) {
    throw new Error(`Unknown task status: ${fromStatus}`);
  }

  if (!isValidTaskStatus(toStatus)) {
    throw new Error(`Unknown task status: ${toStatus}`);
  }

  if (!canTransitionStatus(fromStatus, toStatus)) {
    throw new Error(`Invalid task status transition: ${fromStatus} -> ${toStatus}`);
  }
}
