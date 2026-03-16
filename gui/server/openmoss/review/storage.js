import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { resolveOpenMossStateDir } from '../task-core/storage.js';
import { createReviewRecord } from './model.js';

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

export class FilesystemReviewStorage {
  constructor(options = {}) {
    this.rootDir = resolveOpenMossStateDir(options.rootDir);
    this.reviewsDir = join(this.rootDir, 'reviews');
  }

  ensureInitialized() {
    ensureDir(this.reviewsDir);
  }

  appendReviewRecord(taskId, input = {}) {
    this.ensureInitialized();
    const record = createReviewRecord({
      ...input,
      taskId,
    });
    appendFileSync(this.#getTaskReviewPath(taskId), `${JSON.stringify(record)}\n`, 'utf-8');
    return record;
  }

  listTaskReviews(taskId) {
    this.ensureInitialized();
    return readJsonLines(this.#getTaskReviewPath(taskId))
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }

  listAllReviews(filters = {}) {
    this.ensureInitialized();
    const files = readdirSync(this.reviewsDir)
      .filter((fileName) => fileName.endsWith('.jsonl'));

    const reviews = files.flatMap((fileName) => readJsonLines(join(this.reviewsDir, fileName)));
    const filtered = reviews
      .filter((review) => !filters.taskId || review.taskId === filters.taskId)
      .filter((review) => !filters.action || review.action === filters.action)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    if (filters.limit && Number.isInteger(filters.limit)) {
      return filtered.slice(0, filters.limit);
    }

    return filtered;
  }

  #getTaskReviewPath(taskId) {
    return join(this.reviewsDir, `${taskId}.jsonl`);
  }
}
