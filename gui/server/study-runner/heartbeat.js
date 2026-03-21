import { EVENT_TYPE, RUN_STATUS } from './types.js';

export class HeartbeatController {
  constructor({ runManager, eventLogger }) {
    this.runManager = runManager;
    this.eventLogger = eventLogger;
    this.timers = new Map();
  }

  start(runId, intervalMs = 10_000) {
    this.stop(runId);
    const tick = () => {
      const run = this.runManager.getRun(runId);
      if (!run) return this.stop(runId);
      if ([RUN_STATUS.COMPLETED, RUN_STATUS.DONE, RUN_STATUS.FAILED, RUN_STATUS.STOPPED].includes(run.status)) {
        return this.stop(runId);
      }
      this.runManager.markHeartbeat(runId);
      this.eventLogger.append(runId, {
        type: EVENT_TYPE.HEARTBEAT,
        phase: run.currentPhase,
        currentStepId: run.currentStepId,
        currentTarget: run.currentTarget,
        cumulativeActiveMs: run.cumulativeActiveMs,
      });
    };
    tick();
    const timer = setInterval(tick, intervalMs);
    this.timers.set(runId, timer);
  }

  stop(runId) {
    const timer = this.timers.get(runId);
    if (timer) clearInterval(timer);
    this.timers.delete(runId);
  }
}
