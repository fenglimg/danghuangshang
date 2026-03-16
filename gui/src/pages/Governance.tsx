import { useCallback, useEffect, useState } from "react"
import { useTheme } from "../theme"
import { getAuthToken } from "../utils/auth"

interface TaskModule {
  id: string
  title: string
  workItems: { id: string; title: string; status: string }[]
}

interface TaskItem {
  id: string
  title: string
  description: string
  status: string
  owner: string | null
  updatedAt: string
  createdAt: string
  version: number
  modules: TaskModule[]
}

interface TimelineEvent {
  id: string
  type: string
  actor: string
  note: string
  fromStatus: string | null
  toStatus: string | null
  createdAt: string
  metadata?: Record<string, unknown>
}

interface ReviewRecord {
  id: string
  taskId: string
  reviewer: string
  action: "approve" | "reject"
  note: string
  createdAt: string
  metadata?: Record<string, unknown>
}

interface PatrolAlert {
  id: string
  taskId: string
  actor: string
  reason: string
  recommendation: string
  status: string
  createdAt: string
  staleMinutes: number
}

function relTime(ts: string) {
  if (!ts) return "未知"
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  if (d > 0) return `${d}天前`
  if (h > 0) return `${h}小时前`
  if (m > 0) return `${m}分钟前`
  return "刚刚"
}

function statusTone(status: string): { label: string; color: string; bg: string } {
  switch (status) {
    case "pending": return { label: "待接单", color: "text-slate-300", bg: "bg-slate-500/20" }
    case "in_progress": return { label: "进行中", color: "text-blue-400", bg: "bg-blue-500/20" }
    case "review": return { label: "待审查", color: "text-amber-400", bg: "bg-amber-500/20" }
    case "done": return { label: "已完成", color: "text-green-400", bg: "bg-green-500/20" }
    case "rework": return { label: "返工中", color: "text-orange-400", bg: "bg-orange-500/20" }
    case "blocked": return { label: "已阻断", color: "text-red-400", bg: "bg-red-500/20" }
    default: return { label: status || "未知", color: "text-gray-400", bg: "bg-gray-500/20" }
  }
}

function eventLabel(type: string) {
  switch (type) {
    case "create": return "创建"
    case "claim": return "认领"
    case "submit": return "提交审查"
    case "review": return "审查"
    case "block": return "巡检阻断"
    default: return type
  }
}

function actorLabel(actor: string) {
  switch (actor) {
    case "silijian": return "司礼监"
    case "gongbu": return "工部"
    case "duchayuan": return "都察院"
    case "patrol": return "巡检"
    case "emperor": return "用户"
    default: return actor || "未知"
  }
}

function alertStatusTone(status: string): { label: string; color: string; bg: string } {
  switch (status) {
    case "resolved": return { label: "已解除", color: "text-emerald-400", bg: "bg-emerald-500/20" }
    case "open": return { label: "告警中", color: "text-red-400", bg: "bg-red-500/20" }
    default: return { label: status || "未知", color: "text-gray-400", bg: "bg-gray-500/20" }
  }
}

export default function Governance() {
  const { theme } = useTheme()
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [taskReviews, setTaskReviews] = useState<ReviewRecord[]>([])
  const [reviewQueue, setReviewQueue] = useState<TaskItem[]>([])
  const [taskAlerts, setTaskAlerts] = useState<PatrolAlert[]>([])
  const [patrolAlerts, setPatrolAlerts] = useState<PatrolAlert[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const bg = theme === "light" ? "bg-white border border-gray-200" : "bg-[#1a1a2e]"
  const sub = theme === "light" ? "text-gray-500" : "text-[#a3a3a3]"
  const inputBg = theme === "light" ? "bg-gray-50 border-gray-300 text-gray-900" : "bg-[#0d0d1a] border-[#d4a574]/30 text-[#e5e5e5]"

  const authToken = getAuthToken()

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || null
  const taskTitleById = tasks.reduce<Record<string, string>>((acc, task) => {
    acc[task.id] = task.title || task.id
    return acc
  }, {})

  const filteredTasks = tasks.filter((task) => {
    if (statusFilter !== "all" && task.status !== statusFilter) return false
    if (!search.trim()) return true
    const needle = search.toLowerCase()
    return (
      task.title.toLowerCase().includes(needle) ||
      task.id.toLowerCase().includes(needle) ||
      (task.owner || "").toLowerCase().includes(needle)
    )
  })

  const statusCounts = tasks.reduce<Record<string, number>>((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1
    return acc
  }, {})

  const fetchBoard = useCallback(async () => {
    setLoading(true)
    try {
      const [tasksRes, queueRes, alertsRes] = await Promise.all([
        fetch("/api/openmoss/tasks", { headers: { Authorization: `Bearer ${authToken}` } }),
        fetch("/api/openmoss/reviews/queue", { headers: { Authorization: `Bearer ${authToken}` } }),
        fetch("/api/openmoss/patrol/alerts?status=open", { headers: { Authorization: `Bearer ${authToken}` } }),
      ])

      const tasksData = tasksRes.ok ? await tasksRes.json() : { tasks: [] }
      const queueData = queueRes.ok ? await queueRes.json() : { tasks: [] }
      const alertsData = alertsRes.ok ? await alertsRes.json() : { alerts: [] }

      const nextTasks = tasksData.tasks || []
      setTasks(nextTasks)
      setReviewQueue(queueData.tasks || [])
      setPatrolAlerts(alertsData.alerts || [])

      setSelectedTaskId((current) => {
        if (current && nextTasks.some((task: TaskItem) => task.id === current)) {
          return current
        }
        return nextTasks[0]?.id || null
      })
    } catch {
      setTasks([])
      setReviewQueue([])
      setPatrolAlerts([])
    }
    setLoading(false)
  }, [authToken])

  const fetchTaskDetail = useCallback(async (taskId: string) => {
    setDetailLoading(true)
    try {
      const [timelineRes, reviewsRes, alertsRes] = await Promise.all([
        fetch(`/api/openmoss/tasks/${encodeURIComponent(taskId)}/timeline`, { headers: { Authorization: `Bearer ${authToken}` } }),
        fetch(`/api/openmoss/tasks/${encodeURIComponent(taskId)}/reviews`, { headers: { Authorization: `Bearer ${authToken}` } }),
        fetch(`/api/openmoss/tasks/${encodeURIComponent(taskId)}/patrol-alerts`, { headers: { Authorization: `Bearer ${authToken}` } }),
      ])

      const timelineData = timelineRes.ok ? await timelineRes.json() : { timeline: [] }
      const reviewsData = reviewsRes.ok ? await reviewsRes.json() : { reviews: [] }
      const alertsData = alertsRes.ok ? await alertsRes.json() : { alerts: [] }

      setTimeline(timelineData.timeline || [])
      setTaskReviews(reviewsData.reviews || [])
      setTaskAlerts(alertsData.alerts || [])
    } catch {
      setTimeline([])
      setTaskReviews([])
      setTaskAlerts([])
    }
    setDetailLoading(false)
  }, [authToken])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchBoard()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [fetchBoard])

  useEffect(() => {
    if (!selectedTaskId) {
      return
    }
    const timer = window.setTimeout(() => {
      void fetchTaskDetail(selectedTaskId)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [fetchTaskDetail, selectedTaskId])

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type })
    window.setTimeout(() => {
      setToast((current) => current?.message === message ? null : current)
    }, 2600)
  }, [])

  const refreshGovernance = useCallback(async (taskId?: string | null) => {
    await fetchBoard()
    if (taskId) {
      await fetchTaskDetail(taskId)
    }
  }, [fetchBoard, fetchTaskDetail])

  const runReviewAction = useCallback(async (taskId: string, action: "approve" | "reject") => {
    const note = window.prompt(
      action === "approve" ? "填写审查通过备注（可留空）" : "填写打回原因",
      action === "approve" ? "GUI control plane approval" : "Need follow-up changes before approval"
    )

    if (note === null) {
      return
    }

    setActionLoading(`review:${taskId}:${action}`)
    try {
      const response = await fetch(`/api/openmoss/tasks/${encodeURIComponent(taskId)}/review`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          actor: "duchayuan",
          action,
          note,
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || "审查操作失败")
      }

      await refreshGovernance(taskId)
      showToast(action === "approve" ? "审查已通过" : "任务已打回返工")
    } catch (error) {
      const message = error instanceof Error ? error.message : "审查操作失败"
      showToast(message, "error")
    }
    setActionLoading(null)
  }, [authToken, refreshGovernance, showToast])

  const runPatrolScan = useCallback(async () => {
    const thresholdRaw = window.prompt("巡检超时阈值（分钟）", "60")
    if (thresholdRaw === null) {
      return
    }

    const thresholdMinutes = Number.parseInt(thresholdRaw, 10)
    if (!Number.isInteger(thresholdMinutes) || thresholdMinutes <= 0) {
      showToast("请输入有效的分钟数", "error")
      return
    }

    setActionLoading("patrol-scan")
    try {
      const response = await fetch("/api/openmoss/patrol/scan", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          actor: "patrol",
          thresholdMinutes,
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || "巡检扫描失败")
      }

      await refreshGovernance(selectedTaskId)
      showToast(`巡检完成：扫描 ${data.scanned ?? 0} 项，触发 ${data.triggered?.length ?? 0} 项`)
    } catch (error) {
      const message = error instanceof Error ? error.message : "巡检扫描失败"
      showToast(message, "error")
    }
    setActionLoading(null)
  }, [authToken, refreshGovernance, selectedTaskId, showToast])

  const reclaimBlockedTask = useCallback(async (taskId: string) => {
    const note = window.prompt("填写恢复认领备注（可留空）", "Patrol recovery via governance console")
    if (note === null) {
      return
    }

    setActionLoading(`claim:${taskId}`)
    try {
      const response = await fetch(`/api/openmoss/tasks/${encodeURIComponent(taskId)}/claim`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          actor: "silijian",
          note,
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || "恢复认领失败")
      }

      await refreshGovernance(taskId)
      showToast("任务已恢复认领并回到进行中")
    } catch (error) {
      const message = error instanceof Error ? error.message : "恢复认领失败"
      showToast(message, "error")
    }
    setActionLoading(null)
  }, [authToken, refreshGovernance, showToast])

  return (
    <div className="space-y-4 sm:space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg border text-sm shadow-lg ${
          toast.type === "success"
            ? "bg-green-500/15 border-green-500/40 text-green-400"
            : "bg-red-500/15 border-red-500/40 text-red-400"
        }`}>
          {toast.message}
        </div>
      )}

      <div className={`${bg} rounded-lg p-4 sm:p-5`}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className={`text-[10px] uppercase tracking-[0.2em] ${sub}`}>Governance Plane</div>
            <h2 className="mt-1 text-xl sm:text-2xl font-bold text-[#d4a574]">任务治理台</h2>
            <p className={`mt-1 text-xs sm:text-sm ${sub}`}>
              真实读取 OpenMOSS task core、ActivityLog、review queue 与 patrol alerts。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索任务 / owner / id"
              className={`px-3 py-2 rounded-lg border text-sm min-w-52 ${inputBg}`}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`px-3 py-2 rounded-lg border text-sm ${inputBg}`}
            >
              <option value="all">全部状态</option>
              <option value="pending">待接单</option>
              <option value="in_progress">进行中</option>
              <option value="review">待审查</option>
              <option value="rework">返工中</option>
              <option value="blocked">已阻断</option>
              <option value="done">已完成</option>
            </select>
            <button
              onClick={fetchBoard}
              className="px-3 py-2 rounded-lg border border-[#d4a574]/30 text-[#d4a574] hover:bg-[#d4a574]/10 text-sm cursor-pointer"
            >
              ↻ 刷新治理面
            </button>
            <button
              onClick={runPatrolScan}
              disabled={actionLoading === "patrol-scan"}
              className="px-3 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm cursor-pointer disabled:opacity-50"
            >
              {actionLoading === "patrol-scan" ? "巡检中..." : "⚠ 立即巡检"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {[
          { label: "总任务", value: tasks.length, status: "all" },
          { label: "进行中", value: statusCounts.in_progress || 0, status: "in_progress" },
          { label: "待审查", value: statusCounts.review || 0, status: "review" },
          { label: "返工中", value: statusCounts.rework || 0, status: "rework" },
          { label: "待审队列", value: reviewQueue.length, status: "review" },
          { label: "巡检告警", value: patrolAlerts.length, status: "blocked" },
        ].map((card) => (
          <button
            key={card.label}
            onClick={() => setStatusFilter(card.status)}
            className={`${bg} rounded-lg p-3 text-left cursor-pointer hover:bg-[#d4a574]/8 transition-colors`}
          >
            <div className={`text-[10px] uppercase ${sub}`}>{card.label}</div>
            <div className="font-mono text-xl sm:text-2xl text-[#d4a574] mt-1">{card.value}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-4">
        <section className={`${bg} rounded-lg p-4`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#d4a574]">任务流</h3>
            <span className={`text-xs ${sub}`}>{filteredTasks.length} / {tasks.length}</span>
          </div>

          {loading ? (
            <div className={`py-10 text-center ${sub}`}>加载治理任务中...</div>
          ) : filteredTasks.length === 0 ? (
            <div className={`py-10 text-center ${sub}`}>当前筛选条件下没有任务</div>
          ) : (
            <div className="space-y-2 max-h-[720px] overflow-y-auto pr-1">
              {filteredTasks.map((task) => {
                const tone = statusTone(task.status)
                const moduleCount = task.modules?.length || 0
                const workItemCount = (task.modules || []).reduce((sum, module) => sum + module.workItems.length, 0)
                return (
                  <button
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className={`w-full text-left rounded-lg border p-3 transition-colors cursor-pointer ${
                      selectedTaskId === task.id ? "border-[#d4a574] bg-[#d4a574]/10" : "border-[#d4a574]/10 hover:border-[#d4a574]/30 hover:bg-[#d4a574]/6"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-sm sm:text-base">{task.title}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${tone.bg} ${tone.color}`}>{tone.label}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full bg-[#d4a574]/10 text-[#d4a574]`}>v{task.version}</span>
                    </div>
                    <div className={`mt-1 text-xs ${sub}`}>{task.id}</div>
                    {task.description && (
                      <div className={`mt-2 text-sm line-clamp-2 ${sub}`}>{task.description}</div>
                    )}
                    <div className={`mt-3 flex flex-wrap gap-3 text-[11px] ${sub}`}>
                      <span>负责人: {task.owner || "未指定"}</span>
                      <span>模块: {moduleCount}</span>
                      <span>WorkItem: {workItemCount}</span>
                      <span>更新: {relTime(task.updatedAt)}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className={`${bg} rounded-lg p-4`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#d4a574]">任务详情与时间线</h3>
              {selectedTask && <span className={`text-xs ${sub}`}>任务编号: {selectedTask.id}</span>}
            </div>

            {!selectedTask ? (
              <div className={`py-12 text-center ${sub}`}>选择一条任务查看时间线</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-lg font-semibold">{selectedTask.title}</div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusTone(selectedTask.status).bg} ${statusTone(selectedTask.status).color}`}>
                      {statusTone(selectedTask.status).label}
                    </span>
                  </div>
                  <div className={`mt-1 text-xs ${sub}`}>
                    负责人: {selectedTask.owner || "未指定"} · 创建于 {new Date(selectedTask.createdAt).toLocaleString("zh-CN")}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedTask.status === "review" && (
                      <>
                        <button
                          onClick={() => runReviewAction(selectedTask.id, "approve")}
                          disabled={actionLoading === `review:${selectedTask.id}:approve`}
                          className="px-3 py-1.5 rounded-lg border border-green-500/30 text-green-400 hover:bg-green-500/10 text-xs cursor-pointer disabled:opacity-50"
                        >
                          {actionLoading === `review:${selectedTask.id}:approve` ? "处理中..." : "通过审查"}
                        </button>
                        <button
                          onClick={() => runReviewAction(selectedTask.id, "reject")}
                          disabled={actionLoading === `review:${selectedTask.id}:reject`}
                          className="px-3 py-1.5 rounded-lg border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 text-xs cursor-pointer disabled:opacity-50"
                        >
                          {actionLoading === `review:${selectedTask.id}:reject` ? "处理中..." : "打回返工"}
                        </button>
                      </>
                    )}
                    {selectedTask.status === "blocked" && (
                      <button
                        onClick={() => reclaimBlockedTask(selectedTask.id)}
                        disabled={actionLoading === `claim:${selectedTask.id}`}
                        className="px-3 py-1.5 rounded-lg border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 text-xs cursor-pointer disabled:opacity-50"
                      >
                        {actionLoading === `claim:${selectedTask.id}` ? "处理中..." : "恢复认领"}
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-[#d4a574]/10 p-3">
                    <div className={`text-[10px] uppercase ${sub}`}>审查记录</div>
                    <div className="mt-2 space-y-2">
                      {taskReviews.length === 0 ? (
                        <div className={`text-xs ${sub}`}>暂无审查记录</div>
                      ) : taskReviews.map((review) => (
                        <div key={review.id} className="rounded-md border border-[#d4a574]/10 p-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${review.action === "approve" ? "bg-green-500/20 text-green-400" : "bg-orange-500/20 text-orange-400"}`}>
                              {review.action === "approve" ? "通过" : "打回"}
                            </span>
                            <span className={`text-[10px] ${sub}`}>{relTime(review.createdAt)}</span>
                          </div>
                          <div className="mt-1 text-xs">审查人: {actorLabel(review.reviewer)}</div>
                          {review.note && <div className={`mt-1 text-xs ${sub}`}>{review.note}</div>}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border border-[#d4a574]/10 p-3">
                    <div className={`text-[10px] uppercase ${sub}`}>巡检告警历史</div>
                    <div className="mt-2 space-y-2">
                      {taskAlerts.length === 0 ? (
                        <div className={`text-xs ${sub}`}>暂无巡检告警</div>
                      ) : taskAlerts.map((alert) => (
                        <div key={alert.id} className="rounded-md border border-[#d4a574]/10 p-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${alertStatusTone(alert.status).bg} ${alertStatusTone(alert.status).color}`}>
                              {alertStatusTone(alert.status).label}
                            </span>
                            <span className={`text-[10px] ${sub}`}>{relTime(alert.createdAt)}</span>
                          </div>
                          <div className={`mt-1 text-[11px] ${sub}`}>来源: {actorLabel(alert.actor)}</div>
                          <div className="mt-1 text-xs">{alert.reason}</div>
                          <div className={`mt-1 text-xs ${sub}`}>{alert.recommendation}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-[#d4a574]/10 p-3">
                  <div className="flex items-center justify-between">
                    <div className={`text-[10px] uppercase ${sub}`}>活动时间线</div>
                    {detailLoading && <div className={`text-[10px] ${sub}`}>刷新中...</div>}
                  </div>
                  <div className="mt-3 space-y-3">
                    {timeline.length === 0 ? (
                      <div className={`text-xs ${sub}`}>暂无时间线事件</div>
                    ) : timeline.map((event) => (
                      <div key={event.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#d4a574] mt-1" />
                          <div className="w-px flex-1 bg-[#d4a574]/15 min-h-6" />
                        </div>
                        <div className="flex-1 pb-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium">{eventLabel(event.type)}</span>
                            <span className={`text-[10px] ${sub}`}>{actorLabel(event.actor)}</span>
                            <span className={`text-[10px] ${sub}`}>{relTime(event.createdAt)}</span>
                          </div>
                          <div className={`mt-1 text-xs ${sub}`}>
                            {event.fromStatus || "none"} → {event.toStatus || "none"}
                          </div>
                          {event.note && <div className="mt-1 text-sm">{event.note}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={`${bg} rounded-lg p-4`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[#d4a574]">待审队列</h3>
                <span className={`text-xs ${sub}`}>{reviewQueue.length}</span>
              </div>
              <div className="space-y-2">
                {reviewQueue.length === 0 ? (
                  <div className={`text-xs ${sub}`}>当前没有待审任务</div>
                ) : reviewQueue.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-lg border border-[#d4a574]/10 p-3"
                  >
                    <button
                      onClick={() => setSelectedTaskId(task.id)}
                      className="w-full text-left hover:text-[#d4a574] cursor-pointer"
                    >
                      <div className="font-medium text-sm">{task.title}</div>
                      <div className={`mt-1 text-xs ${sub}`}>{task.id}</div>
                      <div className={`mt-2 text-[11px] ${sub}`}>更新: {relTime(task.updatedAt)}</div>
                    </button>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => runReviewAction(task.id, "approve")}
                        disabled={actionLoading === `review:${task.id}:approve`}
                        className="px-2.5 py-1 rounded-md border border-green-500/30 text-green-400 hover:bg-green-500/10 text-[11px] cursor-pointer disabled:opacity-50"
                      >
                        {actionLoading === `review:${task.id}:approve` ? "处理中..." : "通过"}
                      </button>
                      <button
                        onClick={() => runReviewAction(task.id, "reject")}
                        disabled={actionLoading === `review:${task.id}:reject`}
                        className="px-2.5 py-1 rounded-md border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 text-[11px] cursor-pointer disabled:opacity-50"
                      >
                        {actionLoading === `review:${task.id}:reject` ? "处理中..." : "打回"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`${bg} rounded-lg p-4`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[#d4a574]">开放巡检告警</h3>
                <span className={`text-xs ${sub}`}>{patrolAlerts.length}</span>
              </div>
              <div className="space-y-2">
                {patrolAlerts.length === 0 ? (
                  <div className={`text-xs ${sub}`}>当前没有开放巡检告警</div>
                ) : patrolAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="rounded-lg border border-[#d4a574]/10 p-3"
                  >
                    <button
                      onClick={() => setSelectedTaskId(alert.taskId)}
                      className="w-full text-left hover:text-[#d4a574] cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{taskTitleById[alert.taskId] || alert.taskId}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${alertStatusTone(alert.status).bg} ${alertStatusTone(alert.status).color}`}>
                          {alertStatusTone(alert.status).label}
                        </span>
                      </div>
                      <div className={`mt-1 text-[11px] ${sub}`}>任务编号: {alert.taskId}</div>
                      <div className="mt-1 text-xs">{alert.reason}</div>
                      <div className={`mt-1 text-[11px] ${sub}`}>来源: {actorLabel(alert.actor)}</div>
                      <div className={`mt-2 text-[11px] ${sub}`}>{alert.recommendation}</div>
                    </button>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => reclaimBlockedTask(alert.taskId)}
                        disabled={actionLoading === `claim:${alert.taskId}`}
                        className="px-2.5 py-1 rounded-md border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 text-[11px] cursor-pointer disabled:opacity-50"
                      >
                        {actionLoading === `claim:${alert.taskId}` ? "处理中..." : "恢复认领"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
