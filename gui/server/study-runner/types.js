export const RUN_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  RECOVERING: 'recovering',
  IDLE_WARNING: 'idle-warning',
  INTERRUPTED: 'interrupted',
  COMPLETED: 'completed',
  SUMMARIZING: 'summarizing',
  DONE: 'done',
  FAILED: 'failed',
  STOPPED: 'stopped',
};

export const EVENT_TYPE = {
  RUN_CREATED: 'run_created',
  TOOL_START: 'tool_start',
  TOOL_END: 'tool_end',
  HEARTBEAT: 'heartbeat',
  IDLE_WARNING: 'idle_warning',
  INTERRUPTION: 'interruption',
  RECOVERY_START: 'recovery_start',
  RECOVERY_OK: 'recovery_ok',
  RECOVERY_FAILED: 'recovery_failed',
  COMPLETED: 'completed',
  SUMMARIZE_START: 'summarize_start',
  SUMMARIZE_DONE: 'summarize_done',
  NOTIFICATION_READY: 'notification_ready',
  DELIVERY_ATTEMPT: 'delivery_attempt',
  DELIVERY_SENT: 'delivery_sent',
  DELIVERY_FAILED: 'delivery_failed',
  RUN_STOPPED: 'run_stopped',
};

export const DEFAULTS = {
  runnerHeartbeatIntervalMs: 10_000,
  runnerHeartbeatTimeoutMs: 25_000,
  progressIdleTimeoutMs: 60_000,
  maxStepRetries: 2,
  maxRecoveries: 3,
};
