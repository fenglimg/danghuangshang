import { EVENT_TYPE, RUN_STATUS, DEFAULTS } from './types.js';

export function evaluateRunHealth(run, nowMs = Date.now()) {
  if (!run) return { ok: false, reason: 'missing_run' };
  if ([RUN_STATUS.COMPLETED, RUN_STATUS.DONE, RUN_STATUS.FAILED, RUN_STATUS.STOPPED].includes(run.status)) {
    return { ok: true, terminal: true };
  }

  const lastHeartbeatMs = run.lastHeartbeatAt ? Date.parse(run.lastHeartbeatAt) : 0;
  const heartbeatAgeMs = lastHeartbeatMs ? nowMs - lastHeartbeatMs : Number.POSITIVE_INFINITY;
  if (heartbeatAgeMs > (run.defaults?.runnerHeartbeatTimeoutMs || DEFAULTS.runnerHeartbeatTimeoutMs)) {
    return { ok: false, reason: 'runner_heartbeat_timeout', heartbeatAgeMs };
  }

  const lastProgressMs = run.lastProgressAt ? Date.parse(run.lastProgressAt) : (run.startedAt ? Date.parse(run.startedAt) : nowMs);
  const progressIdleMs = nowMs - lastProgressMs;
  if (progressIdleMs > (run.defaults?.progressIdleTimeoutMs || DEFAULTS.progressIdleTimeoutMs)) {
    return { ok: false, reason: 'progress_idle_timeout', progressIdleMs };
  }

  return { ok: true };
}

export function buildRecoveryAction(run, health) {
  if (!run || !health || health.ok) return null;
  if ((run.recoveries || 0) >= (run.defaults?.maxRecoveries || DEFAULTS.maxRecoveries)) {
    return { action: 'fail', reason: 'recovery_limit_exceeded' };
  }
  return { action: 'retry-current-step', reason: health.reason };
}

export function buildRecoveryUpdate(run, health, nowIso = new Date().toISOString()) {
  const recovery = buildRecoveryAction(run, health);
  if (!recovery) return null;

  if (recovery.action === 'fail') {
    return {
      recovery,
      patch: {
        status: RUN_STATUS.FAILED,
        heartbeatOk: false,
        lastRecoveryAt: nowIso,
        recoveryFailures: (run.recoveryFailures || 0) + 1,
      },
      event: {
        type: EVENT_TYPE.RECOVERY_FAILED,
        reason: recovery.reason,
      },
    };
  }

  if (health?.reason === 'progress_idle_timeout') {
    return {
      recovery: {
        action: 'warn-idle',
        reason: health.reason,
      },
      patch: {
        status: RUN_STATUS.IDLE_WARNING,
        heartbeatOk: false,
      },
      event: {
        type: EVENT_TYPE.IDLE_WARNING,
        reason: health.reason,
        progressIdleMs: health.progressIdleMs,
      },
    };
  }

  return {
    recovery,
    patch: {
      status: RUN_STATUS.RECOVERING,
      heartbeatOk: false,
      lastRecoveryAt: nowIso,
      recoveries: (run.recoveries || 0) + 1,
    },
    event: {
      type: EVENT_TYPE.RECOVERY_START,
      reason: recovery.reason,
      heartbeatAgeMs: health?.heartbeatAgeMs,
    },
  };
}
