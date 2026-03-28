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
  recoveryFailures?: number
  checkpoint?: {
    lastCompletedStepId?: string | null
    resumeFrom?: string | null
  } | null
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
    stats?: {
      eventCount?: number
      toolEndCount?: number
      heartbeatCount?: number
      phases?: string[]
      tools?: string[]
      activeMs?: number
      targetActiveMs?: number
      interruptions?: number
      recoveries?: number
      recoveryFailures?: number
    } | null
  } | null
}

type RunEvent = {
  type?: string
  ts?: string
  phase?: string | null
  currentTarget?: string | null
  currentStepId?: string | null
  tool?: string | null
  durationMs?: number
  cumulativeActiveMs?: number
  targetActiveMs?: number | null
  triggerTool?: string | null
  triggerDurationMs?: number
  notificationTarget?: string | null
  notificationStatus?: string | null
  deliveryStatus?: string | null
  channelId?: string | null
  messageId?: string | null
  failureReason?: string | null
  retryReady?: boolean
  resolutionSource?: string | null
  hasSummary?: boolean
  hasMarkdown?: boolean
  nextRead?: { title?: string | null; source?: string | null } | null
}

type RunDetail = {
  summary?: RunSummary['summary']
  markdown?: string | null
  nextRead?: RunSummary['nextRead']
  notificationText?: string | null
  generatedFromState?: boolean
}

function fmtMs(ms: number) {
  const totalSec = Math.floor((ms || 0) / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
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
  if (h < 24) return `${h}h前`
  return `${Math.floor(h / 24)}d前`
}

function fmtTs(ts?: string | null) {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleString('zh-CN', { hour12: false })
  } catch {
    return ts
  }
}

function calcPercent(active?: number, target?: number) {
  const a = Number(active || 0)
  const t = Number(target || 0)
  if (!Number.isFinite(a) || !Number.isFinite(t) || t <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((a / t) * 100)))
}

function wallClockMs(startedAt?: string | null, endedAt?: string | null) {
  if (!startedAt) return 0
  const start = new Date(startedAt).getTime()
  const end = endedAt ? new Date(endedAt).getTime() : Date.now()
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 0
  return end - start
}

function engagementRatio(run: RunSummary) {
  const wall = wallClockMs(run.startedAt, run.endedAt)
  if (!wall) return null
  return Math.max(0, Math.min(1, (run.cumulativeActiveMs || 0) / wall))
}

function toneForStatus(status?: string | null) {
  switch (status) {
    case 'running': return 'text-blue-400 bg-blue-500/10 border-blue-500/30'
    case 'recovering':
    case 'idle-warning':
    case 'interrupted': return 'text-yellow-300 bg-yellow-500/10 border-yellow-500/30'
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

function toneForEvent(type?: string) {
  if (!type) return 'text-white/70 border-white/10 bg-white/5'
  if (type.includes('delivery_failed') || type.includes('recovery_failed') || type.includes('interruption')) return 'text-red-300 border-red-500/20 bg-red-500/10'
  if (type.includes('delivery_sent') || type.includes('completed') || type.includes('recovery_ok')) return 'text-green-300 border-green-500/20 bg-green-500/10'
  if (type.includes('heartbeat') || type.includes('tool_')) return 'text-blue-300 border-blue-500/20 bg-blue-500/10'
  if (type.includes('summarize') || type.includes('notification_ready') || type.includes('delivery_attempt')) return 'text-yellow-200 border-yellow-500/20 bg-yellow-500/10'
  return 'text-white/70 border-white/10 bg-white/5'
}

function labelForEvent(type?: string) {
  switch (type) {
    case 'run_created': return '创建 Run'
    case 'tool_start': return '工具开始'
    case 'tool_end': return '工具完成'
    case 'heartbeat': return '心跳'
    case 'idle_warning': return '空闲告警'
    case 'interruption': return '学习中断'
    case 'recovery_start': return '开始恢复'
    case 'recovery_ok': return '恢复成功'
    case 'recovery_failed': return '恢复失败'
    case 'completed': return '达到目标'
    case 'summarize_start': return '开始总结'
    case 'summarize_done': return '总结完成'
    case 'notification_ready': return '通知已就绪'
    case 'delivery_attempt': return '尝试投递'
    case 'delivery_sent': return '投递成功'
    case 'delivery_failed': return '投递失败'
    case 'run_stopped': return '手动停止'
    default: return type || 'event'
  }
}

function summarizeEvent(event: RunEvent) {
  const parts: string[] = []
  if (event.tool) parts.push(`工具 ${event.tool}`)
  if (typeof event.durationMs === 'number') parts.push(`耗时 ${fmtMs(event.durationMs)}`)
  if (typeof event.triggerDurationMs === 'number') parts.push(`触发耗时 ${fmtMs(event.triggerDurationMs)}`)
  if (event.currentTarget) parts.push(`目标：${event.currentTarget}`)
  if (typeof event.cumulativeActiveMs === 'number') parts.push(`累计 ${fmtMs(event.cumulativeActiveMs)}`)
  if (event.notificationTarget) parts.push(`通知到 ${event.notificationTarget}`)
  if (event.channelId) parts.push(`channel ${event.channelId}`)
  if (event.messageId) parts.push(`message ${event.messageId}`)
  if (event.failureReason) parts.push(`原因：${event.failureReason}`)
  if (event.nextRead?.title) parts.push(`下次：${event.nextRead.title}`)
  if (event.retryReady) parts.push('可重试')
  return parts.join(' · ') || '—'
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
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null)
  const [details, setDetails] = useState<Record<string, RunDetail>>({})
  const [eventsMap, setEventsMap] = useState<Record<string, RunEvent[]>>({})
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null)
  const [eventsLoadingId, setEventsLoadingId] = useState<string | null>(null)

  const bg = theme === 'light' ? 'bg-white border border-gray-200' : 'bg-[#1a1a2e]'
  const sub = theme === 'light' ? 'text-gray-500' : 'text-[#a3a3a3]'
  const inputCls = theme === 'light'
    ? 'bg-white border border-gray-300 text-gray-900'
    : 'bg-[#0f1020] border border-white/10 text-white'
  const panel = theme === 'light'
    ? 'bg-gray-50 border border-gray-200'
    : 'bg-white/5 border border-white/10'

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
  const failedCount = runs.filter(r => ['failed', 'notification-failed'].includes(r.status) || r.deliveryStatus === 'failed').length
  const totalActiveMs = runs.reduce((sum, run) => sum + (run.cumulativeActiveMs || 0), 0)
  const avgActiveMs = runs.length ? Math.round(totalActiveMs / runs.length) : 0

  const fetchRunDetail = async (runId: string) => {
    if (details[runId]) return
    setDetailLoadingId(runId)
    try {
      const r = await authedFetch(`/api/study/runs/${runId}/summary`)
      if (!r.ok) throw new Error(`加载详情失败 (${r.status})`)
      const data = await r.json()
      setDetails(prev => ({ ...prev, [runId]: data }))
    } catch (err: any) {
      setFlashError(err?.message || '加载详情失败')
    } finally {
      setDetailLoadingId(null)
    }
  }

  const fetchRunEvents = async (runId: string) => {
    if (eventsMap[runId]) return
    setEventsLoadingId(runId)
    try {
      const r = await authedFetch(`/api/study/runs/${runId}/events`)
      if (!r.ok) throw new Error(`加载时间线失败 (${r.status})`)
      const data = await r.json()
      setEventsMap(prev => ({ ...prev, [runId]: data.events || [] }))
    } catch (err: any) {
      setFlashError(err?.message || '加载时间线失败')
    } finally {
      setEventsLoadingId(null)
    }
  }

  const toggleExpand = async (runId: string) => {
    const next = expandedRunId === runId ? null : runId
    setExpandedRunId(next)
    if (next) {
      await Promise.all([fetchRunDetail(runId), fetchRunEvents(runId)])
    }
  }

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
      if (expandedRunId === run.runId) {
        setDetails(prev => ({ ...prev, [run.runId]: undefined as any }))
        setEventsMap(prev => ({ ...prev, [run.runId]: undefined as any }))
        await Promise.all([fetchRunDetail(run.runId), fetchRunEvents(run.runId)])
      }
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
          <p className={`text-sm ${sub}`}>学习记录 + 自动总结 + 通知投递 + 事件时间线</p>
        </div>
        <button onClick={fetchRuns} className="px-3 py-1.5 text-xs border border-[#d4a574]/30 text-[#d4a574] rounded hover:bg-[#d4a574]/10 cursor-pointer">↻ 刷新</button>
      </div>

      {flash && <div className="px-3 py-2 rounded-lg text-xs border border-green-500/30 bg-green-500/10 text-green-300">{flash}</div>}
      {flashError && <div className="px-3 py-2 rounded-lg text-xs border border-red-500/30 bg-red-500/10 text-red-300">{flashError}</div>}

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className={`${bg} rounded-lg p-3`}><div className={`text-[10px] uppercase ${sub}`}>总 Runs</div><div className="font-mono text-2xl text-[#d4a574]">{runs.length}</div></div>
        <div className={`${bg} rounded-lg p-3`}><div className={`text-[10px] uppercase ${sub}`}>运行中</div><div className="font-mono text-2xl text-blue-400">{runs.filter(r => r.status === 'running').length}</div></div>
        <div className={`${bg} rounded-lg p-3`}><div className={`text-[10px] uppercase ${sub}`}>已完成</div><div className="font-mono text-2xl text-green-400">{doneCount}</div></div>
        <div className={`${bg} rounded-lg p-3`}><div className={`text-[10px] uppercase ${sub}`}>待发送</div><div className="font-mono text-2xl text-emerald-400">{readyCount}</div></div>
        <div className={`${bg} rounded-lg p-3`}><div className={`text-[10px] uppercase ${sub}`}>已发送</div><div className="font-mono text-2xl text-cyan-400">{sentCount}</div></div>
        <div className={`${bg} rounded-lg p-3`}><div className={`text-[10px] uppercase ${sub}`}>异常</div><div className="font-mono text-2xl text-red-400">{failedCount}</div></div>
        <div className={`${bg} rounded-lg p-3 col-span-2 md:col-span-3`}><div className={`text-[10px] uppercase ${sub}`}>累计有效学习时长</div><div className="font-mono text-2xl text-[#d4a574]">{fmtMs(totalActiveMs)}</div></div>
        <div className={`${bg} rounded-lg p-3 col-span-2 md:col-span-3`}><div className={`text-[10px] uppercase ${sub}`}>平均单次有效学习</div><div className="font-mono text-2xl text-[#d4a574]">{fmtMs(avgActiveMs)}</div></div>
      </div>

      <div className={`${bg} rounded-lg p-4`}>
        <div className="flex items-center justify-between mb-2">
          <div className="font-medium">当前活跃 Run</div>
          {active && <div className="text-xs text-[#d4a574] font-mono">{active.runId}</div>}
        </div>
        {!active ? (
          <div className={sub}>当前没有活跃的学习 run</div>
        ) : (
          <div className="space-y-4 text-sm">
            <div>
              <div className="flex items-center justify-between mb-1 text-xs">
                <span className={sub}>学习进度</span>
                <span className="font-mono text-[#d4a574]">{calcPercent(active.cumulativeActiveMs, active.targetActiveMs)}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#d4a574] to-[#c49464]" style={{ width: `${calcPercent(active.cumulativeActiveMs, active.targetActiveMs)}%` }} />
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <div><span className={sub}>主题：</span>{active.topic || active.title}</div>
                <div><span className={sub}>任务类型：</span>{active.taskType || '—'}</div>
                <div><span className={sub}>状态：</span>{active.status}</div>
                <div><span className={sub}>阶段：</span>{active.currentPhase || '—'}</div>
                <div><span className={sub}>当前目标：</span>{active.currentTarget || '—'}</div>
              </div>
              <div className="space-y-1">
                <div><span className={sub}>有效学习：</span>{fmtMs(active.cumulativeActiveMs)} / {fmtMs(active.targetActiveMs)}</div>
                <div><span className={sub}>开始时间：</span>{fmtTs(active.startedAt)}</div>
                <div><span className={sub}>墙钟耗时：</span>{fmtMs(wallClockMs(active.startedAt, active.endedAt))}</div>
                <div><span className={sub}>学习效率：</span>{engagementRatio(active) == null ? '—' : `${Math.round((engagementRatio(active) || 0) * 100)}%`}</div>
                <div><span className={sub}>最后心跳：</span>{rel(active.lastHeartbeatAt)}</div>
              </div>
              <div className="space-y-1">
                <div><span className={sub}>心跳健康：</span>{active.heartbeatOk ? '正常' : '异常'}</div>
                <div><span className={sub}>中断/恢复：</span>{active.interruptions} / {active.recoveries}</div>
                <div><span className={sub}>恢复失败：</span>{active.recoveryFailures ?? 0}</div>
                <div><span className={sub}>通知目标：</span>{active.notificationTarget || '—'}</div>
                <div><span className={sub}>恢复点：</span>{active.checkpoint?.resumeFrom || '—'}</div>
              </div>
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
              const detail = details[run.runId]
              const eventList = eventsMap[run.runId] || []
              const progressPercent = calcPercent(run.cumulativeActiveMs, run.targetActiveMs)
              const stats = detail?.summary?.stats || run.summary?.stats
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

                  <div>
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <span className={sub}>完成进度</span>
                      <span className="font-mono text-[#d4a574]">{progressPercent}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#d4a574] to-[#c49464]" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>

                  <div className={`grid md:grid-cols-4 gap-2 text-xs ${sub}`}>
                    <div>任务类型: {run.taskType || '—'}</div>
                    <div>有效时长: {fmtMs(run.cumulativeActiveMs)}</div>
                    <div>目标: {fmtMs(run.targetActiveMs)}</div>
                    <div>当前阶段: {run.currentPhase || '—'}</div>
                    <div>开始: {fmtTs(run.startedAt)}</div>
                    <div>结束: {fmtTs(run.endedAt)}</div>
                    <div>墙钟耗时: {fmtMs(wallClockMs(run.startedAt, run.endedAt))}</div>
                    <div>学习效率: {engagementRatio(run) == null ? '—' : `${Math.round((engagementRatio(run) || 0) * 100)}%`}</div>
                    <div>最后心跳: {rel(run.lastHeartbeatAt)}</div>
                    <div>通知目标: {run.notificationTarget || '—'}</div>
                    <div>通知就绪: {rel(run.notificationReadyAt)}</div>
                    <div>已发送: {rel(run.sentAt)}</div>
                  </div>

                  {(run.summary?.headline || detail?.summary?.headline) && (
                    <div className={`rounded-lg ${panel} px-3 py-2`}>
                      <div className="text-xs text-[#d4a574] mb-1">结构化摘要</div>
                      <div className="text-sm font-medium">{detail?.summary?.headline || run.summary?.headline}</div>
                      {!!(detail?.summary?.bullets?.length || run.summary?.bullets?.length) && (
                        <ul className={`mt-2 list-disc pl-4 space-y-1 text-xs ${sub}`}>
                          {(detail?.summary?.bullets || run.summary?.bullets || []).map((bullet, idx) => <li key={idx}>{bullet}</li>)}
                        </ul>
                      )}
                    </div>
                  )}

                  <div className={`grid md:grid-cols-2 gap-2 text-xs`}>
                    {run.deliveryFailureReason && (
                      <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-red-300">发送失败：{run.deliveryFailureReason}</div>
                    )}
                    {run.messageId && (
                      <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-cyan-200 break-all">messageId: {run.messageId}</div>
                    )}
                    {(detail?.notificationText || run.notificationText) && (
                      <div className={`rounded-lg ${panel} px-3 py-2 text-white/80 md:col-span-2`}>
                        <div className="text-[#d4a574] mb-1">通知文案</div>
                        <div>{detail?.notificationText || run.notificationText}</div>
                      </div>
                    )}
                    {run.nextRead?.title && (
                      <div className={`rounded-lg ${panel} px-3 py-2 text-white/80`}>
                        下次继续：{run.nextRead.title}{run.nextRead.source ? ` (${run.nextRead.source})` : ''}
                      </div>
                    )}
                    {run.checkpoint?.resumeFrom && (
                      <div className={`rounded-lg ${panel} px-3 py-2 text-white/80`}>
                        恢复点：{run.checkpoint.resumeFrom}
                      </div>
                    )}
                  </div>

                  {stats && (
                    <div className={`rounded-lg ${panel} px-3 py-2 text-xs ${sub}`}>
                      <div className="text-[#d4a574] mb-2">统计参数</div>
                      <div className="grid md:grid-cols-4 gap-2">
                        <div>事件数: {stats.eventCount ?? '—'}</div>
                        <div>工具完成: {stats.toolEndCount ?? '—'}</div>
                        <div>心跳次数: {stats.heartbeatCount ?? '—'}</div>
                        <div>恢复失败: {stats.recoveryFailures ?? run.recoveryFailures ?? 0}</div>
                        <div>中断: {stats.interruptions ?? run.interruptions}</div>
                        <div>恢复: {stats.recoveries ?? run.recoveries}</div>
                        <div className="md:col-span-2">阶段: {(stats.phases || []).join(' / ') || '—'}</div>
                        <div className="md:col-span-2">工具: {(stats.tools || []).join(' / ') || '—'}</div>
                      </div>
                    </div>
                  )}

                  {expandedRunId === run.runId && (
                    <>
                      <div className={`rounded-lg ${panel} px-3 py-3 text-xs`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-[#d4a574]">完整总结</div>
                          {detailLoadingId === run.runId && <div className={sub}>加载中...</div>}
                        </div>
                        <pre className="whitespace-pre-wrap break-words text-white/80 font-mono text-[11px] leading-5">{detail?.markdown || '暂无 markdown summary'}</pre>
                      </div>

                      <div className={`rounded-lg ${panel} px-3 py-3 text-xs`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-[#d4a574]">事件时间线</div>
                          {eventsLoadingId === run.runId && <div className={sub}>加载中...</div>}
                        </div>
                        {!eventList.length ? (
                          <div className={sub}>暂无事件记录</div>
                        ) : (
                          <div className="space-y-2">
                            {eventList.map((event, idx) => (
                              <div key={`${event.ts || idx}-${event.type || idx}`} className={`rounded-lg border px-3 py-2 ${toneForEvent(event.type)}`}>
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
                                  <div className="font-medium">{labelForEvent(event.type)}</div>
                                  <div className="font-mono text-[11px] opacity-80">{fmtTs(event.ts)}</div>
                                </div>
                                <div className="mt-1 opacity-90 break-words">{summarizeEvent(event)}</div>
                                {(event.phase || event.currentStepId) && (
                                  <div className="mt-1 opacity-70">phase: {event.phase || '—'}{event.currentStepId ? ` · step: ${event.currentStepId}` : ''}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <div className="flex flex-col md:flex-row gap-2 md:items-center">
                    <input
                      value={channelOverride}
                      onChange={(e) => setChannelOverrides(prev => ({ ...prev, [run.runId]: e.target.value }))}
                      placeholder="可选：覆盖 channelId 后再发送"
                      className={`flex-1 rounded px-3 py-2 text-xs ${inputCls}`}
                    />
                    <button
                      onClick={() => toggleExpand(run.runId)}
                      className="px-3 py-2 text-xs rounded border border-white/15 text-white/80 hover:bg-white/5 cursor-pointer"
                    >
                      {expandedRunId === run.runId ? '收起详情' : '查看总结 / 时间线'}
                    </button>
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
