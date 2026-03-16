import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import os from 'os';
import {
  addModuleToTask,
  addWorkItemToModule,
  createTask,
  transitionTask,
  updateTaskDetails,
  validateTaskShape,
} from './model.js';

const SCHEMA_VERSION = 1;

function ensureDir(dirPath) {
  mkdirSync(dirPath, { recursive: true });
}

function writeJsonAtomic(filePath, value) {
  const tempPath = `${filePath}.tmp`;
  writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
  renameSync(tempPath, filePath);
}

function readJson(filePath, fallback = null) {
  if (!existsSync(filePath)) {
    return fallback;
  }

  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

export function resolveOpenMossStateDir(rootDir) {
  if (rootDir) {
    return rootDir;
  }

  const homeDir = process.env.HOME || os.homedir() || '/home/ubuntu';
  return join(homeDir, '.openclaw', 'state', 'openmoss');
}

export class FilesystemTaskCoreStorage {
  constructor(options = {}) {
    this.rootDir = resolveOpenMossStateDir(options.rootDir);
    this.metaDir = join(this.rootDir, 'meta');
    this.tasksDir = join(this.rootDir, 'tasks');
    this.indexesDir = join(this.rootDir, 'indexes');
    this.schemaPath = join(this.metaDir, 'schema-version.json');
    this.tasksIndexPath = join(this.indexesDir, 'tasks.json');
  }

  ensureInitialized() {
    ensureDir(this.metaDir);
    ensureDir(this.tasksDir);
    ensureDir(this.indexesDir);

    if (!existsSync(this.schemaPath)) {
      writeJsonAtomic(this.schemaPath, {
        schemaVersion: SCHEMA_VERSION,
        updatedAt: new Date().toISOString(),
      });
    }

    if (!existsSync(this.tasksIndexPath)) {
      writeJsonAtomic(this.tasksIndexPath, {
        ids: [],
        updatedAt: new Date().toISOString(),
      });
    }
  }

  getSchemaVersion() {
    this.ensureInitialized();
    return readJson(this.schemaPath);
  }

  getTask(taskId) {
    this.ensureInitialized();
    return readJson(join(this.tasksDir, `${taskId}.json`));
  }

  listTasks(filters = {}) {
    this.ensureInitialized();
    const indexed = readJson(this.tasksIndexPath, { ids: [] });
    const ids = Array.isArray(indexed?.ids) && indexed.ids.length > 0
      ? indexed.ids
      : readdirSync(this.tasksDir)
        .filter((fileName) => fileName.endsWith('.json'))
        .map((fileName) => fileName.replace(/\.json$/, ''));

    const tasks = ids
      .map((taskId) => this.getTask(taskId))
      .filter(Boolean)
      .filter((task) => !filters.status || task.status === filters.status)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

    if (filters.limit && Number.isInteger(filters.limit)) {
      return tasks.slice(0, filters.limit);
    }

    return tasks;
  }

  createTask(input = {}) {
    this.ensureInitialized();
    const task = createTask(input);

    if (this.getTask(task.id)) {
      throw new Error(`Task already exists: ${task.id}`);
    }

    this.#writeTask(task);
    this.#updateIndex((ids) => [...ids, task.id]);
    return task;
  }

  updateTask(taskId, patch = {}) {
    const existing = this.#requireTask(taskId);
    const updated = updateTaskDetails(existing, patch);
    this.#writeTask(updated);
    return updated;
  }

  transitionTask(taskId, nextStatus) {
    const existing = this.#requireTask(taskId);
    const updated = transitionTask(existing, nextStatus);
    this.#writeTask(updated);
    return updated;
  }

  addModule(taskId, input = {}) {
    const existing = this.#requireTask(taskId);
    const { task, module } = addModuleToTask(existing, input);
    this.#writeTask(task);
    return { task, module };
  }

  addWorkItem(taskId, moduleId, input = {}) {
    const existing = this.#requireTask(taskId);
    const { task, workItem } = addWorkItemToModule(existing, moduleId, input);
    this.#writeTask(task);
    return { task, workItem };
  }

  clearAll() {
    rmSync(this.rootDir, { recursive: true, force: true });
  }

  #requireTask(taskId) {
    const task = this.getTask(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    return task;
  }

  #writeTask(task) {
    this.ensureInitialized();
    validateTaskShape(task);
    writeJsonAtomic(join(this.tasksDir, `${task.id}.json`), task);
  }

  #updateIndex(updateFn) {
    const current = readJson(this.tasksIndexPath, { ids: [] });
    const nextIds = Array.from(new Set(updateFn(Array.isArray(current.ids) ? current.ids : [])));
    writeJsonAtomic(this.tasksIndexPath, {
      ids: nextIds,
      updatedAt: new Date().toISOString(),
    });
  }
}
