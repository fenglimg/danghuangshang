import crypto from 'crypto';

export const ACTIVITY_EVENT_TYPES = Object.freeze([
  'create',
  'claim',
  'submit',
  'review',
  'block',
]);

function nowIso() {
  return new Date().toISOString();
}

export function isValidActivityEventType(type) {
  return ACTIVITY_EVENT_TYPES.includes(type);
}

export function createActivityEvent(input = {}) {
  if (!isValidActivityEventType(input.type)) {
    throw new Error(`Unknown activity event type: ${input.type}`);
  }

  if (!input.taskId || typeof input.taskId !== 'string') {
    throw new Error('Activity event taskId is required');
  }

  return {
    id: input.id || `evt_${crypto.randomUUID()}`,
    type: input.type,
    taskId: input.taskId,
    actor: typeof input.actor === 'string' && input.actor.trim() ? input.actor.trim() : 'system',
    note: typeof input.note === 'string' ? input.note : '',
    fromStatus: input.fromStatus ?? null,
    toStatus: input.toStatus ?? null,
    createdAt: input.createdAt || nowIso(),
    metadata: input.metadata && typeof input.metadata === 'object' ? { ...input.metadata } : {},
  };
}
