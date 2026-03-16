import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { resolveOpenMossStateDir } from '../task-core/storage.js';
import { createPatrolAlert } from './model.js';

function ensureDir(dirPath) {
  mkdirSync(dirPath, { recursive: true });
}

function readJsonLines(filePath) {
  if (!existsSync(filePath)) {
    return [];
  }

  return readFileSync(filePath, 'utf-8')
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
}

export class FilesystemPatrolStorage {
  constructor(options = {}) {
    this.rootDir = resolveOpenMossStateDir(options.rootDir);
    this.alertsDir = join(this.rootDir, 'patrol-alerts');
  }

  ensureInitialized() {
    ensureDir(this.alertsDir);
  }

  appendAlert(taskId, input = {}) {
    this.ensureInitialized();
    const alert = createPatrolAlert({
      ...input,
      taskId,
    });
    appendFileSync(this.#getTaskAlertPath(taskId), `${JSON.stringify(alert)}\n`, 'utf-8');
    return alert;
  }

  listTaskAlerts(taskId) {
    this.ensureInitialized();
    return readJsonLines(this.#getTaskAlertPath(taskId))
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }

  listAlerts(filters = {}) {
    this.ensureInitialized();
    const files = readdirSync(this.alertsDir)
      .filter((fileName) => fileName.endsWith('.jsonl'));

    const alerts = files.flatMap((fileName) => readJsonLines(join(this.alertsDir, fileName)));
    const filtered = alerts
      .filter((alert) => !filters.taskId || alert.taskId === filters.taskId)
      .filter((alert) => !filters.status || alert.status === filters.status)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    if (filters.limit && Number.isInteger(filters.limit)) {
      return filtered.slice(0, filters.limit);
    }

    return filtered;
  }

  hasOpenAlert(taskId) {
    const alerts = this.listTaskAlerts(taskId);
    return alerts.some((alert) => alert.status === 'open');
  }

  #getTaskAlertPath(taskId) {
    return join(this.alertsDir, `${taskId}.jsonl`);
  }
}
