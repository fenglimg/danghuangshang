import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'fs';
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

function writeJsonLinesAtomic(filePath, records) {
  const tempPath = `${filePath}.tmp`;
  const content = records.map((record) => JSON.stringify(record)).join('\n');
  writeFileSync(tempPath, content ? `${content}\n` : '', 'utf-8');
  renameSync(tempPath, filePath);
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

  resolveOpenAlerts(taskId, input = {}) {
    this.ensureInitialized();
    const alertPath = this.#getTaskAlertPath(taskId);
    if (!existsSync(alertPath)) {
      return [];
    }

    const actor = typeof input.actor === 'string' && input.actor.trim() ? input.actor.trim() : 'system';
    const note = typeof input.note === 'string' && input.note.trim() ? input.note.trim() : '';
    const resolvedAt = input.resolvedAt || new Date().toISOString();
    let resolvedCount = 0;

    const nextAlerts = readJsonLines(alertPath).map((alert) => {
      if (alert.status !== 'open') {
        return alert;
      }

      resolvedCount += 1;
      return {
        ...alert,
        status: 'resolved',
        metadata: {
          ...(alert.metadata && typeof alert.metadata === 'object' ? alert.metadata : {}),
          resolvedAt,
          resolvedBy: actor,
          resolutionNote: note,
        },
      };
    });

    if (resolvedCount === 0) {
      return [];
    }

    writeJsonLinesAtomic(alertPath, nextAlerts);
    return nextAlerts.filter((alert) => alert.status === 'resolved');
  }

  #getTaskAlertPath(taskId) {
    return join(this.alertsDir, `${taskId}.jsonl`);
  }
}
