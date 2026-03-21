import { mkdirSync, existsSync, readFileSync, writeFileSync, appendFileSync } from 'fs';
import { join } from 'path';

export function resolveStudyRunsDir(homeDir) {
  return join(homeDir, '.openclaw', 'workspace', 'memory', 'study-runs');
}

export function ensureStudyRunsDir(homeDir) {
  const dir = resolveStudyRunsDir(homeDir);
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function runStatePath(homeDir, runId) {
  return join(resolveStudyRunsDir(homeDir), `${runId}.json`);
}

export function runEventsPath(homeDir, runId) {
  return join(resolveStudyRunsDir(homeDir), `${runId}.events.ndjson`);
}

export function runSummaryPath(homeDir, runId) {
  return join(resolveStudyRunsDir(homeDir), `${runId}.summary.md`);
}

export function writeRunState(homeDir, runId, data) {
  ensureStudyRunsDir(homeDir);
  writeFileSync(runStatePath(homeDir, runId), JSON.stringify(data, null, 2));
}

export function readRunState(homeDir, runId) {
  const path = runStatePath(homeDir, runId);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf-8'));
}

export function appendRunEvent(homeDir, runId, event) {
  ensureStudyRunsDir(homeDir);
  appendFileSync(runEventsPath(homeDir, runId), JSON.stringify(event) + '\n');
}

export function readRunEvents(homeDir, runId) {
  const path = runEventsPath(homeDir, runId);
  if (!existsSync(path)) return [];

  return readFileSync(path, 'utf-8')
    .split('\n')
    .filter((line) => line.trim())
    .flatMap((line) => {
      try {
        return [JSON.parse(line)];
      } catch {
        return [];
      }
    });
}

export function writeRunSummary(homeDir, runId, markdown) {
  ensureStudyRunsDir(homeDir);
  writeFileSync(runSummaryPath(homeDir, runId), markdown);
}

export function readRunSummary(homeDir, runId) {
  const path = runSummaryPath(homeDir, runId);
  if (!existsSync(path)) return null;
  return readFileSync(path, 'utf-8');
}
