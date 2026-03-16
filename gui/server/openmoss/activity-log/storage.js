import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { createActivityEvent } from './events.js';
import { resolveOpenMossStateDir } from '../task-core/storage.js';

function ensureDir(dirPath) {
  mkdirSync(dirPath, { recursive: true });
}

export class FilesystemActivityLogStorage {
  constructor(options = {}) {
    this.rootDir = resolveOpenMossStateDir(options.rootDir);
    this.eventsDir = join(this.rootDir, 'events');
  }

  ensureInitialized() {
    ensureDir(this.eventsDir);
  }

  appendTaskEvent(taskId, input = {}) {
    this.ensureInitialized();
    const event = createActivityEvent({
      ...input,
      taskId,
    });
    appendFileSync(this.#getTaskEventPath(taskId), `${JSON.stringify(event)}\n`, 'utf-8');
    return event;
  }

  listTaskEvents(taskId) {
    this.ensureInitialized();
    const eventPath = this.#getTaskEventPath(taskId);
    if (!existsSync(eventPath)) {
      return [];
    }

    return readFileSync(eventPath, 'utf-8')
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line));
  }

  #getTaskEventPath(taskId) {
    return join(this.eventsDir, `${taskId}.jsonl`);
  }
}
