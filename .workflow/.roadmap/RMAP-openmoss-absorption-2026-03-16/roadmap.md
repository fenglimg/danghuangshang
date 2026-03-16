# Requirement Roadmap

**Session**: RMAP-openmoss-absorption-2026-03-16
**Requirement**: 为当前基于 `danghuangshang` 的本地 OpenClaw 分支制定 OpenMOSS 吸收路线图，按 `task core -> review/patrol -> GUI control plane` 三阶段拆开
**Strategy**: progressive
**Status**: In Progress
**Created**: 2026-03-16T00:00:00+08:00

---

## Execution Progress

- **2026-03-16 / Wave 1 completed**
  - `ISS-OPENMOSS-001` 已完成
  - 已产出正式 ADR：
    - `/root/danghuangshang-openmoss-exec/docs/openmoss/adr-001-absorption-boundary.md`
  - 已冻结：
    - OpenMOSS 吸收边界
    - 组织语义层 vs 系统职责层分离规则
    - 三省六部到治理职责层的映射
    - 一期 `filesystem-first` 存储策略
    - Wave 1-3 不改 `install.sh` 的准入规则
- **Next**
  - 进入 `ISS-OPENMOSS-007`
  - 在现有治理页基础上增加真正可驱动状态变化的 review / patrol 操作入口

- **2026-03-16 / Wave 2 completed**
  - `ISS-OPENMOSS-002` 已完成
  - 已建立：
    - `gui/server/openmoss/task-core/` 独立模块
    - `Task / Module / WorkItem` 最小模型
    - `pending -> in_progress -> review -> done` 主状态机
    - `rework / blocked` 扩展状态
    - `filesystem-first` 存储抽象与 schema/index 初始化
  - 已补自动测试：
    - `tests/openmoss/task-core/task-core.test.js`
  - 当前仍未进入：
    - `install.sh`
    - ActivityLog
    - GUI 页面

- **2026-03-16 / Wave 3 completed**
  - `ISS-OPENMOSS-003` 已完成
  - 已建立：
    - `gui/server/openmoss/activity-log/` 事件模型与 JSONL 存储
    - `OpenMossTaskService` 服务层
    - 最小任务 API：
      - `GET /api/openmoss/tasks`
      - `POST /api/openmoss/tasks`
      - `GET /api/openmoss/tasks/:taskId`
      - `GET /api/openmoss/tasks/:taskId/timeline`
      - `POST /api/openmoss/tasks/:taskId/claim`
      - `POST /api/openmoss/tasks/:taskId/submit`
      - `POST /api/openmoss/tasks/:taskId/review`
      - `POST /api/openmoss/tasks/:taskId/block`
  - 已验证：
    - `create / claim / submit / review / block` 五类事件
    - 单任务时间线读取
    - 一条完整任务事件序列
  - 当前仍未进入：
    - GUI 页面
    - review/patrol 子系统本体
    - `install.sh`

- **2026-03-16 / Wave 4 completed**
  - `ISS-OPENMOSS-004` 与 `ISS-OPENMOSS-005` 已完成
  - 已建立：
    - `gui/server/openmoss/review/` ReviewRecord 与审查闭环
    - `gui/server/openmoss/patrol/` PatrolAlert 与 stale scan
    - review queue / task reviews 查询 API
    - patrol alerts / manual patrol scan API
  - 已验证：
    - approve -> done
    - reject -> rework
    - stale task -> blocked
    - patrol alert 可查询且含恢复建议
  - 当前仍未进入：
    - GUI 页面
    - `install.sh`

- **2026-03-16 / Wave 5 completed**
  - `ISS-OPENMOSS-006` 已完成
  - 已建立：
    - GUI `治理` 页签
    - 真实 task list / task detail / activity timeline
    - 只读 review queue
    - 只读 patrol alerts
  - 已验证：
    - 前端构建通过
    - 治理页只读取真实 API，不依赖 mock 数据
    - sessions / dashboard / system 等旧页面未被替换
  - 当前仍未进入：
    - review / patrol 的 GUI 操作入口
    - `install.sh`

---

## Strategy Assessment

- **Uncertainty Level**: medium-high
- **Decomposition Mode**: progressive
- **Assessment Basis**:
  - 当前仓库需要持续同步 `upstream/main`，不能做大面积侵入式改造
  - 已确认 `danghuangshang` 与 OpenMOSS 处于不同抽象层次：前者偏组织模板，后者偏任务治理中间件
  - 目标不是替换现有三省六部，而是引入治理能力 overlay
  - `task core` 是 `review/patrol` 和 GUI control plane 的前置依赖，存在明显层级关系
- **Goal**:
  - 在保留 `danghuangshang` 现有角色语义、消息路由和运行面能力的前提下，分阶段吸收 OpenMOSS 的任务治理能力
- **Constraints**:
  - 不直接污染上游镜像层
  - 优先保持 `local-host-install` 的可持续迭代性
  - 初期不重写现有 Gateway、bindings、channels 体系
  - 新增能力必须可以单独验证、单独回滚、单独演进
- **Stakeholders**:
  - 本地分支维护者
  - 未来执行该路线图的开发 Agent / 工程协作 Agent
  - 使用三省六部体系进行实际协作的终端用户

---

## Roadmap

| Wave | Issue ID | Layer | Goal | Priority | Dependencies |
|------|----------|-------|------|----------|--------------|
| 1 | ISS-OPENMOSS-001 | Task Core | 定义任务治理内核边界、角色映射和存储策略 | P0 | - |
| 1 | ISS-OPENMOSS-002 | Task Core | 建立 Task / Module / WorkItem 状态模型与持久化抽象 | P0 | ISS-OPENMOSS-001 |
| 1 | ISS-OPENMOSS-003 | Task Core | 建立 ActivityLog 与最小查询/写入 API | P0 | ISS-OPENMOSS-002 |
| 2 | ISS-OPENMOSS-004 | Review/Patrol | 引入 ReviewRecord 与 rework/review 闭环 | P1 | ISS-OPENMOSS-003 |
| 2 | ISS-OPENMOSS-005 | Review/Patrol | 引入 Patrol 超时检测、blocked 恢复与告警机制 | P1 | ISS-OPENMOSS-003 |
| 3 | ISS-OPENMOSS-006 | GUI Control Plane | 新增任务面板、活动时间线与状态过滤视图 | P1 | ISS-OPENMOSS-004, ISS-OPENMOSS-005 |
| 3 | ISS-OPENMOSS-007 | GUI Control Plane | 新增 review/patrol 控制面与治理操作入口 | P2 | ISS-OPENMOSS-006 |

---

## Phase Detail

### Phase 1: Task Core

**Objective**
- 在不改写现有三省六部协作入口的前提下，引入可持久化的任务工作单元与事件日志。

**Why First**
- 没有任务实体、状态流和活动日志，后续 review/patrol 只能停留在 prompt 约定，无法形成系统级闭环。

**Scope**
- 任务数据模型
- 最小状态机
- 事件模型
- 角色职责映射草案
- 最小 API / 存储层

**Out of Scope**
- GUI 大改
- 强制接管现有消息路由
- prompt/rule 后台编辑

**Success Gate**
- 可以创建和查询最小任务单元
- 可以记录状态变化与事件时间线
- 可以把至少一条现有工程协作流程映射到 task core

### Phase 2: Review / Patrol

**Objective**
- 在 task core 上叠加质量控制和巡检恢复机制，把“都察院审查”和未来巡检角色从软流程提升为系统流程。

**Why Second**
- review 与 patrol 依赖稳定的工作单元、状态流和交付事件，否则无法判断“审什么”“巡什么”“如何回退或打回”。

**Scope**
- ReviewRecord
- rejected / rework / approved 分支
- blocked / timeout / stale 检测
- Patrol 告警与恢复建议
- 审查结果事件化

**Out of Scope**
- 完整积分排行榜
- 高级自动仲裁策略
- 跨项目通知矩阵

**Success Gate**
- 至少一条执行流程可以进入 review 并被打回或通过
- 至少一种超时/卡死情形可被 patrol 标记为 blocked
- 所有 review/patrol 决策都能进入统一事件流

### Phase 3: GUI Control Plane

**Objective**
- 把当前偏运行观察台的 GUI 扩展为“任务治理控制台”，但不破坏现有 dashboard/court/sessions/cron/skills 的使用价值。

**Why Third**
- 没有底层 task/review/patrol 数据，界面层只能是假壳。

**Scope**
- Task board
- Activity timeline
- Review queue
- Patrol alerts

**Out of Scope**
- 全量替换现有 GUI IA
- 复杂 setup wizard
- 完整多租户管理
- Global rules / task rules GUI
- Prompt 在线编辑

**Success Gate**
- 用户可在 GUI 看到任务状态流、审查队列与告警面板
- GUI 中的任务视图与底层状态保持一致
- 控制面和现有 sessions/logs/system 页面职责边界清晰

---

## Convergence Criteria

### ISS-OPENMOSS-001: 定义 OpenMOSS 吸收边界与角色映射 ADR
- **Criteria**:
  - 明确写出哪些 OpenMOSS 能力作为 overlay 吸收，哪些暂不吸收
  - 明确三省六部角色与 Planner / Executor / Reviewer / Patrol 的映射关系
  - 明确存储策略一期选型
- **Verification**:
  - 产出 ADR / design doc
  - 能回答“为什么不直接替换现有角色层”
- **Definition of Done**:
  - 后续实现阶段不再反复争论架构边界

### ISS-OPENMOSS-002: 建立任务状态模型与持久化抽象
- **Criteria**:
  - 存在 Task / Module / WorkItem(或 SubTask) 的最小模型
  - 存在 `pending -> in_progress -> review -> done` 主路径
  - 支持 `rework`、`blocked` 扩展位
- **Verification**:
  - 单元测试覆盖状态转移
  - 可以创建、更新、列出任务对象
- **Definition of Done**:
  - 系统第一次拥有“可追踪工作单元”

### ISS-OPENMOSS-003: 建立 ActivityLog 与最小任务 API
- **Criteria**:
  - 所有关键动作均写入统一事件流
  - 至少支持 create / claim / submit / review / block 五类事件
  - 提供最小读写 API
- **Verification**:
  - 可通过 API 拉到某个工作单元完整时间线
  - GUI 或 CLI 能看到事件序列
- **Definition of Done**:
  - 系统第一次拥有“可解释执行过程”

### ISS-OPENMOSS-004: 引入 ReviewRecord 与审查闭环
- **Criteria**:
  - 交付后必须进入 review
  - review 可给出 approve / reject
  - reject 会触发 rework，并带审查意见
- **Verification**:
  - 集成测试验证 through/reject/rework 路径
  - 审查事件落入 ActivityLog
- **Definition of Done**:
  - 都察院审查从“消息行为”提升为“系统状态流”

### ISS-OPENMOSS-005: 引入 Patrol 超时巡检与 blocked 恢复
- **Criteria**:
  - 可定义超时阈值
  - 卡住任务能被标记为 blocked
  - blocked 状态可触发恢复建议或人工接管入口
- **Verification**:
  - 模拟超时任务并观察 blocked 转移
  - 生成 patrol alert 事件
- **Definition of Done**:
  - 系统第一次具备“发现卡死并上报”的能力

### ISS-OPENMOSS-006: 增加任务面板与活动时间线 GUI
- **Criteria**:
  - GUI 可按状态查看任务
  - GUI 可查看任务事件时间线
  - 可按角色、阶段、更新时间筛选
- **Verification**:
  - 前后端联调
  - 页面数据与 API 返回一致
- **Definition of Done**:
  - 用户第一次能在图形界面中理解工作流整体状态

### ISS-OPENMOSS-007: 增加 review/patrol 控制面
- **Criteria**:
  - GUI 可查看 review queue
  - GUI 可查看 patrol alerts
- **Verification**:
  - review / patrol 页面能反映真实状态变化
  - 至少一个治理动作入口可触发真实状态变化或操作流程
- **Definition of Done**:
  - GUI 从运行观察台升级为核心治理控制台（不含 rules/prompt 系统）

---

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| 把三省六部人格层和系统职责层硬绑定，导致后续扩展困难 | High | 先做 ADR，明确“组织语义层”和“系统职责层”分离 |
| 一开始就引入过重数据库/服务，破坏本地分支轻量迭代节奏 | High | 一期优先最小持久化抽象，必要时先文件/SQLite 单机落地 |
| 直接改动 gateway / bindings / channels，造成上游同步成本上升 | High | 初期只在 overlay 模块和 GUI 扩展层落地 |
| review/patrol 过早做成强制机制，影响现有使用体验 | Medium | 先做可观测、可提示、可切换的机制，再逐步收紧 |
| GUI 控制面过早扩张，导致没有真实数据支撑 | Medium | 严格要求先完成 task core 与 review/patrol 数据面 |

---

## Coverage Boundary

当前路线图完成后，预期只能实现对 OpenMOSS 的**核心治理层吸收**，而不是完整吸收全部概念。

明确不在当前 3-phase 范围内的能力：
- Planner / Executor 显式系统角色
- Agent registration / authentication
- Global rules / task-level rules
- Prompt management
- Setup wizard
- Notification channels
- Scoring / reflection / leaderboard

详见覆盖矩阵：
- `/root/danghuangshang/.workflow/.analysis/ANL-openmoss-danghuangshang-compare-2026-03-16/openmoss-coverage-matrix.md`

---

## Post-Core Backlog

以下能力根据最新分析，**不应混入当前 active 3-phase / CSV execution**，但适合作为后续 backlog：

| Backlog Issue | Theme | Why Deferred |
|---------------|-------|--------------|
| ISS-OPENMOSS-008 | Rules Layer | 当前已有 SOUL / IDENTITY / skills 约束，需先梳理规则来源，避免重复叠层 |
| ISS-OPENMOSS-009 | Prompt Visibility / Audit | 当前更适合先做只读审计，不适合直接做在线 prompt 编辑 |
| ISS-OPENMOSS-010 | Reflection / Quality Signals | 适合建立在 review 闭环稳定之后，先吸收 reflection，再评估 scoring |
| ISS-OPENMOSS-011 | Notification Lite | 应复用现有 Discord/飞书通道，只做关键事件通知，不单独起复杂子系统 |
| ISS-OPENMOSS-012 | Planner / Executor Systemization | 是更完整吸收 OpenMOSS 的关键步骤，但不应早于核心治理层稳定 |

这些 backlog 的优先级依据详见：
- `/root/danghuangshang/.workflow/.analysis/ANL-openmoss-danghuangshang-compare-2026-03-16/absorption-priorities.md`

---

## Branch Strategy

- 基线分支：`upstream-main`
- 长期本地分支：`local-host-install`
- 建议集成验证分支：
  - `integrate/openmoss-task-core`
  - `integrate/openmoss-review-patrol`
  - `integrate/openmoss-gui-control-plane`

推荐规则：
- 每个 phase 独立验证、独立合并、独立回滚
- 不在 `upstream-main` 承载任何吸收性改造
- 如 phase 失败，保留结论文档，不强行回灌代码

---

## Execution Notes

- 推荐先做工程类任务的 task core 试点，不要一开始覆盖所有部门。
- 推荐一期先让“司礼监/内阁 -> Planner，兵部 -> Executor，都察院 -> Reviewer”，Patrol 作为新增系统角色试点。
- 推荐存储方案按以下顺序评估：
  - Stage 1: 文件或轻量 SQLite
  - Stage 2: 稳定后再决定是否抽象成独立服务
- 推荐 GUI 增量式扩展，而不是重做现有信息架构。
- 推荐把 rules / prompt / notification / reflection / planner-executor systemization 放入后续 backlog，而不是混入当前 3-phase 执行。

---

## Iteration History

### Round 1 - 2026-03-16T00:00:00+08:00
**User Feedback**: 要求直接生成 OpenMOSS 吸收路线图，并按 `task core -> review/patrol -> GUI control plane` 三阶段拆开。  
**Changes Made**: 采用 progressive 分层路线，生成 3 phase / 7 issues 的执行框架，并显式写出依赖、风险、收敛标准和分支策略。  
**Status**: approved for planning

---

## Codebase Context

- 当前主分析结论位于：
  - `/root/danghuangshang/.workflow/.analysis/ANL-openmoss-danghuangshang-compare-2026-03-16/discussion.md`
  - `/root/danghuangshang/.workflow/.analysis/ANL-openmoss-danghuangshang-compare-2026-03-16/conclusions.json`
- 关键基础判断：
  - `danghuangshang` 是 OpenClaw 上层组织模板
  - OpenMOSS 是 OpenClaw 上层任务治理中间件
  - 最优吸收路径是 overlay，不是替换
