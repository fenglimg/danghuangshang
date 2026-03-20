#!/usr/bin/env node
/**
 * OpenMOSS closed-loop demo for danghuangshang GUI server.
 *
 * Prereqs:
 *   - GUI server running
 *   - Auth token available (env BOLUO_AUTH_TOKEN or --token)
 *
 * Usage:
 *   node scripts/openmoss-closed-loop-demo.mjs \
 *     --baseUrl https://console.example.xyz \
 *     --token $BOLUO_AUTH_TOKEN
 *
 * Env fallbacks:
 *   - OPENMOSS_GUI_URL (default http://127.0.0.1:${BOLUO_GUI_PORT||18795})
 *   - BOLUO_AUTH_TOKEN
 */

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--baseUrl' || a === '--base-url') {
      out.baseUrl = argv[i + 1];
      i += 1;
      continue;
    }
    if (a === '--token') {
      out.token = argv[i + 1];
      i += 1;
      continue;
    }
    if (a === '--help' || a === '-h') {
      out.help = true;
      continue;
    }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  console.log(`OpenMOSS closed-loop demo\n\n` +
    `Options:\n` +
    `  --baseUrl <url>   GUI server base URL (e.g. https://console.241412.xyz)\n` +
    `  --token <token>   Auth token (same as BOLUO_AUTH_TOKEN)\n\n` +
    `Env:\n` +
    `  OPENMOSS_GUI_URL, BOLUO_GUI_PORT, BOLUO_AUTH_TOKEN\n`);
  process.exit(0);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const baseUrl = args.baseUrl
  || process.env.OPENMOSS_GUI_URL
  || `http://127.0.0.1:${process.env.BOLUO_GUI_PORT || 18795}`;

const token = args.token || process.env.BOLUO_AUTH_TOKEN;
if (!token) {
  console.error('ERROR: auth token required. Set BOLUO_AUTH_TOKEN or pass --token');
  process.exit(1);
}

const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
};

async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  if (!res.ok) {
    const msg = json?.error || json?.message || `${res.status} ${res.statusText}`;
    throw new Error(`${method} ${path} failed: ${msg}`);
  }
  return json;
}

function printSection(title, payload) {
  console.log(`\n=== ${title} ===`);
  console.log(JSON.stringify(payload, null, 2));
}

async function main() {
  console.log('OpenMOSS closed-loop demo');
  console.log(`baseUrl: ${baseUrl}`);

  // 1) Create task
  const created = await api('/api/openmoss/tasks', {
    method: 'POST',
    body: {
      title: `Closed-loop demo ${new Date().toISOString()}`,
      description: 'Create -> claim -> submit -> review -> patrol -> recover -> approve',
      actor: 'silijian',
      note: 'bootstrap demo task',
      modules: [
        {
          title: 'Demo module',
          workItems: [
            { title: 'Demo work item', assignee: 'gongbu' },
          ],
        },
      ],
      metadata: {
        demo: true,
        source: 'scripts/openmoss-closed-loop-demo.mjs',
      },
    },
  });

  const task = created.task;
  const taskId = task.id;
  console.log(`\nCreated taskId: ${taskId}`);

  // 2) Claim
  const claimed = await api(`/api/openmoss/tasks/${encodeURIComponent(taskId)}/claim`, {
    method: 'POST',
    body: { actor: 'gongbu', note: 'claim for implementation' },
  });

  // 3) Submit
  const submitted = await api(`/api/openmoss/tasks/${encodeURIComponent(taskId)}/submit`, {
    method: 'POST',
    body: { actor: 'gongbu', note: 'submit for review' },
  });

  // 4) Reject once -> should go to rework
  const rejected = await api(`/api/openmoss/tasks/${encodeURIComponent(taskId)}/review`, {
    method: 'POST',
    body: {
      actor: 'duchayuan',
      action: 'reject',
      note: 'demo reject once to exercise rework path',
      metadata: { severity: 'minor', demo: true },
    },
  });

  // 5) Re-claim (recover from rework -> in_progress)
  const reclaimed = await api(`/api/openmoss/tasks/${encodeURIComponent(taskId)}/claim`, {
    method: 'POST',
    body: { actor: 'gongbu', note: 'address review comments' },
  });

  // 6) Force a patrol block by scanning with thresholdMinutes=0 and now far in future.
  // Patrol scan uses updatedAt/createdAt; we just ensure the scan sees it as stale.
  const scan = await api('/api/openmoss/patrol/scan', {
    method: 'POST',
    body: {
      actor: 'patrol',
      thresholdMinutes: 0,
      now: new Date(Date.now() + 3600_000).toISOString(),
    },
  });

  // 7) Recover blocked task by claiming again (server auto-resolves open alerts on claim when previously blocked)
  const recovered = await api(`/api/openmoss/tasks/${encodeURIComponent(taskId)}/claim`, {
    method: 'POST',
    body: { actor: 'gongbu', note: 'recover after patrol block' },
  });

  // 8) Submit again
  const resubmitted = await api(`/api/openmoss/tasks/${encodeURIComponent(taskId)}/submit`, {
    method: 'POST',
    body: { actor: 'gongbu', note: 'resubmit after recovery' },
  });

  // 9) Approve -> done
  const approved = await api(`/api/openmoss/tasks/${encodeURIComponent(taskId)}/review`, {
    method: 'POST',
    body: { actor: 'duchayuan', action: 'approve', note: 'approve after rework + patrol recovery' },
  });

  // 10) Pull read models
  const finalTask = await api(`/api/openmoss/tasks/${encodeURIComponent(taskId)}`);
  const timeline = await api(`/api/openmoss/tasks/${encodeURIComponent(taskId)}/timeline`);
  const reviews = await api(`/api/openmoss/tasks/${encodeURIComponent(taskId)}/reviews`);
  const alerts = await api(`/api/openmoss/tasks/${encodeURIComponent(taskId)}/patrol-alerts`);
  const queue = await api('/api/openmoss/reviews/queue');

  // Print summary
  printSection('Summary', {
    taskId,
    status: finalTask.task?.status,
    owner: finalTask.task?.owner,
    timelineEvents: (timeline.timeline || []).map((e) => e.type),
    reviewsTotal: reviews.total,
    alertsTotal: alerts.total,
    openAlerts: (alerts.alerts || []).filter((a) => a.status === 'open').length,
    queueTotal: queue.total,
  });

  // Print details (trim a bit)
  printSection('Task', finalTask.task);
  printSection('Timeline(last 20)', (timeline.timeline || []).slice(-20));
  printSection('Reviews', reviews.reviews);
  printSection('PatrolAlerts', alerts.alerts);

  // Also print important intermediate ops (for debugging)
  printSection('Ops', {
    claimed,
    submitted,
    rejected,
    reclaimed,
    scan,
    recovered,
    resubmitted,
    approved,
  });

  console.log('\nOK: closed-loop demo completed');
}

main().catch((err) => {
  console.error(`\nFAILED: ${err.message}`);
  process.exit(1);
});
