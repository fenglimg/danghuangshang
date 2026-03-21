import { useEffect, useMemo, useState } from "react"
import { getAuthToken } from "../utils/auth"
import { useTheme } from "../theme"

type RunSummary = {
  runId: string
  taskType: string
  title: string
  topic: string
  status: string
  targetActiveMs: number
  cumulativeActiveMs: number
  startedAt: string
  endedAt: string | null
  currentPhase: string
  currentTarget: string | null
  lastHeartbeatAt: string | null
  heartbeatOk: boolean
  interruptions: number
  recoveries: number
  notificationStatus?: string | null
  notificationTarget?: string | null
  notificationReadyAt?: string | null
  notificationText?: string | null
  deliveryStatus?: string | null
  deliveryChannelId?: string | null
  lastDeliveryAttemptAt?: string | null
  sentAt?: string | null
  messageId?: string | null
  deliveryFailureReason?: string | null
  deliveryRetryReady?: boolean
  summaryCompletedAt?: string | null
  nextRead?: { title?: string | null; source?: string | null } | null
  summary?: {
    headline?: string | null
    bullets?: string[]
  } | null
}

function fmtMs(ms: number) {
  const totalSec = Math.floor((ms || 0) / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}m ${s}s`
}

function rel(ts?: string | null) {
  if (!ts) return '—'
  const diff = Math.max(0, Date.now() - new Date(ts).getTime())
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s前`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m前`
  const h = Math.floor(m / 60)
  return `${h}h前`
}

function toneForStatus(status?: string | null) {
  switch (status) {
    case 'running': return 'text-blue-400 bg-blue-500/10 border-blue-500/30'
    case 'recovering':
    case 'idle-warning': return 'text-yellow-300 bg-yellow-500/10 border-yellow-500/30'
    case 'done':
    case 'completed': return 'text-green-400 bg-green-500/10 border-green-500/30'
    case 'failed':
    case 'notification-failed': return 'text-red-400 bg-red-500/10 border-red-500/30'
    default: return 'text-[#d4a574] bg-[#d4a574]/10 border-[#d4a574]/30'
  }
}

function toneForDelivery(status?: string | null) {
  switch (status) {
    case 'ready': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    case 'sending': return 'text-blue-400 bg-blue-500/10 border-blue-500/30'
    case 'sent': return 'text-green-400 bg-green-500/10 border-green-500/30'
    case 'failed': return 'text-red-400 bg-red-500/10 border-red-500/30'
    case 'not-configured': return 'text-gray-400 bg-white/5 border-white/10'
    default: return 'text-[#d4a574] bg-[#d4a574]/10 border-[#d4a574]/30'
  }
}

async function authedFetch(path: string, init: RequestInit = {}) {
  return fetch(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
}

export default function StudyRunner() {
  const { theme } = useTheme()
  const [runs, setRuns] = useState<RunSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [busyRunId, setBusyRunId] = useState<string | null>(null)
  const [channelOverrides, setChannelOverrides] = useState<Record<string, string>>({})
  const [flash, setFlash] = useState<string | null>(null)
  const [flashError, setFlashError] = useState<string | null>(null)

  const bg = theme === 'light' ? 'bg-white border border-gray-200' : 'bg-[#1a1a2e]'
  const sub = theme === 'light' ? 'text-gray-500' : 'text-[#a3a3a3]'
  const inputCls = theme === 'light'
    ? 'bg-white border border-gray-300 text-gray-900'
    : 'bg-[#0f1020] border border-white/10 text-white'

  const fetchRuns = async () => {
    setLoading(true)
    try {
      const r = await authedFetch('/api/study/runs')
      if (r.ok) {
        const d = await r.json()
        setRuns(d.runs || [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRuns() }, [])

  const active = useMemo(
    () => runs.find(r => ['running', 'recovering', 'idle-warning', 'interrupted'].includes(r.status)),
    [runs]
  )

  const doneCount = runs.filter(r => ['completed', 'done'].includes(r.status)).length
  const readyCount = runs.filter(r => r.notificationStatus === 'ready').length
  const sentCount = runs.filter(r => r.deliveryStatus === 'sent').length

  const notifyRun = async (run: RunSummary) => {
    setBusyRunId(run.runId)
    setFlash(null)
    setFlashError(null)
    try {
      const channelId = (channelOverrides[run.runId] || '').trim()
      const r = await authedFetch(`/api/study/runs/${run.runId}/notify`, {
        method: 'POST',
        body: JSON.stringify(channelId ? { channelId } : {}),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) {
        throw new Error(data?.error || `Notify failed (${r.status})`)
      }
      setFlash(`已发送：${run.topic || run.title}`)
      await fetchRuns()
    } catch (err: any) {
      setFlashError(err?.message || '发送失败')
    } finally {
      setBusyRunId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">学习执行器</h2>
          <p className={`text-sm ${sub}`}>已接入自动 summary / finalize / notify / delivery 状态链</p>
        </div>
        <button onClick={fetchRuns} className="px-3 py-1.5 text-xs border border-[#d4a574]/30 text-[#d4a574] rounded hover:bg-[#d4a574]/10 cursor-pointer">↻ 刷新</button>
      </div>

      {flash && <div className="px-3 py-2 rounded-lg text-xs border border-green-500/30 bg-green-500/10 text-green-300">{flash}</div>}
      {flashError && <div className="px-3 py-2 rounded-lg text-xs border border-red-500/30 bg-red-500/10 text-red-300">{flashError}</div>}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className={`${bg} rounded-lg p-3`}><div className={`text-[10px] uppercase ${sub}`}>总 Runs</div><div className="font-mono text-2xl text-[#d4a574]">{runs.length}</div></div>
        <div className={`${bg} rounded-lg p-3`}><div className={`text-[10px] uppercase ${sub}`}>运行中</div><div className="font-mono text-2xl text-blue-400">{runs.filter(r => r.status === 'running').length}</div></div>
        <div className={`${bg} rounded-lg p-3`}><div className={`text-[10px] uppercase ${sub}`}>已完成</div><div className="font-mono text-2xl text-green-400">{doneCount}</div></div>
        <div className={`${bg} rounded-lg p-3`}><div className={`text-[10px] uppercase ${sub}`}>待发送</div><div className="font-mono text-2xl text-emerald-400">{readyCount}</div></div>
        <div className={`${bg} rounded-lg p-3`}><div className={`text-[10px] uppercase ${sub}`}>已发送</div><div className="font-mono text-2xl text-cyan-400">{sentCount}</div></div>
      </div>

      <div className={`${bg} rounded-lg p-4`}>
        <div className="flex items-center justify-between mb-2">
          <div className="font-medium">当前活跃 Run</div>
          {active && <div className="text-xs text-[#d4a574] font-mono">{active.runId}</div>}
        </div>
        {!active ? (
          <div className={sub}>当前没有活跃的学习 run</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div><span className={sub}>主题：</span>{active.topic || active.title}</div>
              <div><span className={sub}>状态：</span>{active.status}</div>
              <div><span className={sub}>阶段：</span>{active.currentPhase || '—'}</div>
              <div><span className={sub}>目标：</span>{active.currentTarget || '—'}</div>
            </div>
            <div className="space-y-1">
              <div><span className={sub}>有效学习：</span>{fmtMs(active.cumulativeActiveMs)} / {fmtMs(active.targetActiveMs)}</div>
              <div><span className={sub}>最后心跳：</span>{rel(active.lastHeartbeatAt)}</div>
              <div><span className={sub}>心跳健康：</span>{active.heartbeatOk ? '正常' : '异常'}</div>
              <div><span className={sub}>中断/恢复：</span>{active.interruptions} / {active.recoveries}</div>
            </div>
          </div>
        )}
      </div>

      <div className={`${bg} rounded-lg p-4`}>
        <div className="font-medium mb-3">历史 Runs</div>
        {loading ? <div className={sub}>加载中...</div> : runs.length === 0 ? <div className={sub}>暂无 run 记录</div> : (
          <div className="space-y-3">
            {runs.map(run => {
              const canNotify = run.notificationStatus === 'ready' || !!run.deliveryRetryReady
              const channelOverride = channelOverrides[run.runId] || ''
              return (
                <div key={run.runId} className="border border-white/10 rounded p-3 text-sm space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{run.topic || run.title}</div>
                      <div className={`text-xs ${sub} font-mono mt-1`}>{run.runId}</div>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
                      <div className={`text-xs px-2 py-1 rounded border ${toneForStatus(run.status)}`}>{run.status}</div>
                      <div className={`text-xs px-2 py-1 rounded border ${toneForDelivery(run.deliveryStatus || run.notificationStatus)}`}>{run.deliveryStatus || run.notificationStatus || '—'}</div>
                    </div>
                  </div>

                  <div className={`grid md:grid-cols-4 gap-2 text-xs ${sub}`}>
                    <div>有效时长: {fmtMs(run.cumulativeActiveMs)}</div>
                    <div>目标: {fmtMs(run.targetActiveMs)}</div>
                    <div>当前阶段: {run.currentPhase || '—'}</div>
                    <div>最后心跳: {rel(run.lastHeartbeatAt)}</div>
                    <div>通知目标: {run.notificationTarget || '—'}</div>
                    <div>通知就绪: {rel(run.notificationReadyAt)}</div>
                    <div>最后投递: {rel(run.lastDeliveryAttemptAt)}</div>
                    <div>已发送: {rel(run.sentAt)}</div>
                  </div>

                  {run.summary?.headline && (
                    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                      <div className="text-xs text-[#d4a574] mb-1">摘要</div>
                      <div className="text-sm font-medium">{run.summary.headline}</div>
                      {!!run.summary.bullets?.length && (
                        <ul className={`mt-2 list-disc pl-4 space-y-1 text-xs ${sub}`}>
                          {run.summary.bullets.map((bullet, idx) => <li key={idx}>{bullet}</li>)}
                        </ul>
                      )}
                    </div>
                  )}

                  {(run.deliveryFailureReason || run.messageId || run.nextRead?.title) && (
                    <div className="grid md:grid-cols-2 gap-2 text-xs">
                      {run.deliveryFailureReason && (
                        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-red-300">发送失败：{run.deliveryFailureReason}</div>
                      )}
                      {run.messageId && (
                        <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-cyan-200">messageId: {run.messageId}</div>
                      )}
                      {run.nextRead?.title && (
                        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white/80">下次继续：{run.nextRead.title}{run.nextRead.source ? ` (${run.nextRead.source})` : ''}</div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row gap-2 md:items-center">
                    <input
                      value={channelOverride}
                      onChange={(e) => setChannelOverrides(prev => ({ ...prev, [run.runId]: e.target.value }))}
                      placeholder="可选：覆盖 channelId 后再发送"
                      className={`flex-1 rounded px-3 py-2 text-xs ${inputCls}`}
                    />
                    <button
                      disabled={!canNotify || busyRunId === run.runId}
                      onClick={() => notifyRun(run)}
                      className="px-3 py-2 text-xs rounded border border-[#d4a574]/30 text-[#d4a574] hover:bg-[#d4a574]/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {busyRunId === run.runId ? '发送中...' : (run.deliveryRetryReady ? '重试发送' : '发送通知')}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
