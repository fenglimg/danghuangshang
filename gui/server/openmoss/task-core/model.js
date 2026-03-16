import crypto from 'crypto';
import { assertValidTransition, isValidTaskStatus } from './state.js';

function nowIso() {
  return new Date().toISOString();
}

function buildId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function requireTitle(title, label) {
  if (!title || typeof title !== 'string' || !title.trim()) {
    throw new Error(`${label} title is required`);
  }

  return title.trim();
}

function normalizeStatus(status) {
  if (status === undefined) {
    return 'pending';
  }

  if (!isValidTaskStatus(status)) {
    throw new Error(`Unknown task status: ${status}`);
  }

  return status;
}

export function createWorkItem(input = {}) {
  const timestamp = nowIso();
  return {
    entityType: 'work-item',
    id: input.id || buildId('workitem'),
    title: requireTitle(input.title, 'WorkItem'),
    description: typeof input.description === 'string' ? input.description : '',
    status: normalizeStatus(input.status),
    assignee: typeof input.assignee === 'string' ? input.assignee : null,
    createdAt: input.createdAt || timestamp,
    updatedAt: input.updatedAt || timestamp,
  };
}

export function createModule(input = {}) {
  const timestamp = nowIso();
  const workItems = Array.isArray(input.workItems)
    ? input.workItems.map((item) => createWorkItem(item))
    : [];

  return {
    entityType: 'module',
    id: input.id || buildId('module'),
    title: requireTitle(input.title, 'Module'),
    description: typeof input.description === 'string' ? input.description : '',
    status: normalizeStatus(input.status),
    createdAt: input.createdAt || timestamp,
    updatedAt: input.updatedAt || timestamp,
    workItems,
  };
}

export function createTask(input = {}) {
  const timestamp = nowIso();
  const modules = Array.isArray(input.modules)
    ? input.modules.map((item) => createModule(item))
    : [];

  return {
    entityType: 'task',
    id: input.id || buildId('task'),
    title: requireTitle(input.title, 'Task'),
    description: typeof input.description === 'string' ? input.description : '',
    status: normalizeStatus(input.status),
    owner: typeof input.owner === 'string' ? input.owner : null,
    createdAt: input.createdAt || timestamp,
    updatedAt: input.updatedAt || timestamp,
    version: Number.isInteger(input.version) ? input.version : 1,
    modules,
    metadata: input.metadata && typeof input.metadata === 'object' ? { ...input.metadata } : {},
  };
}

export function transitionTask(task, nextStatus) {
  assertValidTransition(task.status, nextStatus);
  return {
    ...task,
    status: nextStatus,
    updatedAt: nowIso(),
    version: task.version + 1,
  };
}

export function updateTaskDetails(task, patch = {}) {
  return {
    ...task,
    title: patch.title !== undefined ? requireTitle(patch.title, 'Task') : task.title,
    description: patch.description !== undefined
      ? (typeof patch.description === 'string' ? patch.description : '')
      : task.description,
    owner: patch.owner !== undefined
      ? (typeof patch.owner === 'string' ? patch.owner : null)
      : task.owner,
    metadata: patch.metadata && typeof patch.metadata === 'object'
      ? { ...task.metadata, ...patch.metadata }
      : task.metadata,
    updatedAt: nowIso(),
    version: task.version + 1,
  };
}

export function addModuleToTask(task, input = {}) {
  const module = createModule(input);
  return {
    task: {
      ...task,
      modules: [...task.modules, module],
      updatedAt: nowIso(),
      version: task.version + 1,
    },
    module,
  };
}

export function addWorkItemToModule(task, moduleId, input = {}) {
  let createdWorkItem = null;
  let matchedModule = false;

  const modules = task.modules.map((module) => {
    if (module.id !== moduleId) {
      return module;
    }

    matchedModule = true;
    createdWorkItem = createWorkItem(input);
    return {
      ...module,
      workItems: [...module.workItems, createdWorkItem],
      updatedAt: nowIso(),
    };
  });

  if (!matchedModule) {
    throw new Error(`Module not found: ${moduleId}`);
  }

  return {
    task: {
      ...task,
      modules,
      updatedAt: nowIso(),
      version: task.version + 1,
    },
    workItem: createdWorkItem,
  };
}

export function validateTaskShape(task) {
  if (!task || task.entityType !== 'task') {
    throw new Error('Task payload must be a task entity');
  }

  requireTitle(task.title, 'Task');
  normalizeStatus(task.status);

  if (!Array.isArray(task.modules)) {
    throw new Error('Task modules must be an array');
  }

  for (const module of task.modules) {
    if (!module || module.entityType !== 'module') {
      throw new Error('Task module payload must be a module entity');
    }

    requireTitle(module.title, 'Module');
    normalizeStatus(module.status);

    if (!Array.isArray(module.workItems)) {
      throw new Error('Module workItems must be an array');
    }

    for (const workItem of module.workItems) {
      if (!workItem || workItem.entityType !== 'work-item') {
        throw new Error('Module workItem payload must be a work-item entity');
      }

      requireTitle(workItem.title, 'WorkItem');
      normalizeStatus(workItem.status);
    }
  }

  return task;
}
