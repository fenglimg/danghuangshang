# Wave Acceptance Gates

**Session**: `cwp-openmoss-absorption-20260316`
**Purpose**: 定义 6 个执行 wave 的总体验收门，用于补足 `tasks.csv` 中单任务验收之外的波次级验收标准。

---

## 使用方式

- `tasks.csv` 中的 `acceptance_criteria` 负责**任务级验收**
- 本文档中的 `Wave Gate` 负责**波次级验收**
- 只有当前 wave 的所有任务完成，且对应 `Wave Gate` 通过，才允许进入下一 wave

---

## Wave 1

**Tasks**
- `1` 冻结 OpenMOSS 吸收 ADR

**Wave Gate**
- 已形成正式 ADR
- 已明确：
  - 吸收边界
  - 角色映射
  - 一期存储策略
  - `install.sh` 暂不进入范围的条件
- 后续任务不再依赖口头假设推进

**Pass Signal**
- 团队可以用文档回答“为什么现在不直接 OpenMOSS 化”
- Task Core 实现边界已经稳定

**Blockers**
- 角色语义层和系统职责层仍混淆
- 存储策略未定
- 还在争论是否改 `install.sh`

---

## Wave 2

**Tasks**
- `2` 建立任务核心模型与状态机

**Wave Gate**
- 系统已具备最小任务实体
- 状态主路径 `pending -> in_progress -> review -> done` 已成立
- `rework` 与 `blocked` 已预留扩展位

**Pass Signal**
- 至少可以创建、更新、列出最小任务对象
- 状态转移测试通过

**Blockers**
- 只有文档，没有可运行模型
- 状态转移规则仍不稳定
- 模型命名或层级仍频繁变化

---

## Wave 3

**Tasks**
- `3` 建立 ActivityLog 与最小任务 API

**Wave Gate**
- 系统已具备统一事件流
- 最小任务 API 可支撑后续 review / patrol
- 单任务时间线可查询

**Pass Signal**
- 至少一条任务能产生完整事件序列
- `create / claim / submit / review / block` 五类事件可被读取

**Blockers**
- 事件流仍散落在不同结构中
- API 只能写不能读，或只能读不能写
- 无法从任务回溯事件历史

---

## Wave 4

**Tasks**
- `4` 引入 ReviewRecord 与审查闭环
- `5` 引入 Patrol 与 blocked 恢复机制

**Wave Gate**
- 系统第一次具备真实治理闭环
- review 与 patrol 都已经接入统一任务状态和事件流
- 至少存在一种“打回”路径和一种“巡检阻断”路径

**Pass Signal**
- 交付可进入 review，并能 approve / reject / rework
- 超时或卡住任务可进入 blocked
- 两类决策都能进入 ActivityLog

**Blockers**
- review 仍只是消息动作，不是状态流
- patrol 只能提醒，不能标记 blocked
- 两者的数据模型没有接入同一套任务核心

---

## Wave 5

**Tasks**
- `6` 新增任务面板与活动时间线 GUI

**Wave Gate**
- GUI 已能基于真实数据展示任务治理的主链路
- 用户可从 GUI 直接理解任务状态与事件时间线
- GUI 与现有 sessions / logs / system 页职责不冲突

**Pass Signal**
- 可按状态查看任务
- 可查看单任务时间线
- 页面数据全部来自真实 API

**Blockers**
- 页面依赖 mock 数据
- 任务面板与现有页面职责重叠严重
- 状态展示与后端真实数据不一致

---

## Wave 6

**Tasks**
- `7` 新增 review / patrol 控制面

**Wave Gate**
- GUI 从“运行观察台”升级为“治理控制台”
- 用户可在图形界面中查看审查队列、巡检告警和治理操作入口
- 至少一个治理动作可以真实驱动状态变化或处理流程

**Pass Signal**
- review queue 可用
- patrol alerts 可用
- 至少一个治理动作入口可用并验证生效

**Blockers**
- review/patrol 仅可看不可管
- GUI 控制面无法驱动真实状态变化

---

## Global Exit Criteria

当且仅当以下条件同时满足，整个 CSV wave 流程可视为完成：

- Wave 1 到 Wave 6 全部通过
- 每个任务级 `acceptance_criteria` 通过
- 每个 wave 的 `Wave Gate` 通过
- 仍未违反 SOP 中的边界规则：
  - 未过早改动 `install.sh`
  - 未把实验逻辑直接混入上游镜像层
  - 未跳过 Task Core / ActivityLog 而直接堆 GUI
  - 未把 rules / prompt / notification / scoring / auth-registration backlog 混进当前 core-governance session

---

## Recommended Review Rule

建议每个 wave 结束后做一次固定判断：

1. 当前 wave 的任务是否全部完成？
2. 当前 wave 的 `Wave Gate` 是否通过？
3. 是否有 blocker 说明应该返工，而不是进入下一 wave？
4. 是否仍符合 `openmoss-integration-sop.md` 中的边界规则？

如果任一答案为否，则不进入下一 wave。
