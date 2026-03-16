# ADR-001: OpenMOSS Absorption Boundary

> Status: Accepted  
> Date: 2026-03-16  
> Scope: Wave 1 / `ISS-OPENMOSS-001`

← [返回文档索引](../README.md) | [返回 OpenMOSS 集成 SOP](../openmoss-integration-sop.md)

---

## Decision

当前 fork 对 OpenMOSS 的吸收策略定为：

1. **吸收治理内核，不替换三省六部语义层**
2. **先做 overlay，不改写当前 gateway / channel / bindings / skills 体系**
3. **当前 active scope 仅覆盖**
   - `task core`
   - `activity log`
   - `review / patrol`
   - `GUI control plane`
4. **一期存储采用 filesystem-first 的本地持久化方案**
5. **Wave 1-3 不进入 `install.sh` 变更范围**

---

## Context

`danghuangshang` 当前已经具备两类明显能力：

1. **组织化协作语义**
   - 三省六部、司礼监、都察院等角色对用户可理解
2. **运行态控制面**
   - 已有 sessions、cron、skills、system、dashboard 等可视化能力

当前缺口不在“角色不够多”，而在“协作过程没有沉淀为任务治理对象”：

- 没有统一 Task / WorkItem
- 没有清晰状态流
- 没有统一 ActivityLog
- 都察院审查更多还是消息行为，不是系统状态
- GUI 能看运行状态，但还不能看治理状态

因此，OpenMOSS 对当前框架最有价值的部分不是整套系统形态，而是**治理能力**。

---

## Why Not Directly OpenMOSS-ify

不直接把当前 fork “OpenMOSS 化”，原因有四个：

1. **抽象层次不同**
   - `danghuangshang` 是组织协作模板
   - OpenMOSS 更像任务治理中间件
2. **当前 fork 有明确的上游同步约束**
   - 不能为了治理能力重写现有运行骨架
3. **当前部署哲学偏单机、静态、运维友好**
   - 不是多租户 agent registry 系统
4. **当前用户心智已经绑定三省六部**
   - 直接替换会破坏现有产品叙事和使用方式

结论：**应把 OpenMOSS 当作治理内核来源，而不是目标系统形状。**

---

## Scope Boundary

### In Scope

本轮 active absorption 只吸收以下能力：

1. **Task Core**
   - Task / Module / WorkItem 最小模型
   - 主状态机
2. **ActivityLog**
   - 统一事件流
   - 单任务时间线查询
3. **Review / Patrol**
   - 审查闭环
   - blocked / timeout / alert
4. **GUI Control Plane**
   - tasks
   - timeline
   - review queue
   - patrol alerts

### Explicitly Out of Scope

以下能力明确不进入当前 CSV session：

1. global rules / task rules
2. prompt online editing
3. notification sub-system
4. reflection scoring / leaderboard
5. planner / executor 完整系统化
6. agent registration / authentication
7. setup wizard
8. 重写现有 gateway / bindings / channels

这些内容进入 post-core backlog，不与当前 core-governance session 混跑。

---

## Layer Separation

### Layer A: 组织语义层

这一层继续保留给用户可见的朝廷语义：

- 皇帝
- 司礼监
- 中书省
- 门下省
- 尚书省
- 六部
- 都察院

它的作用是：

- 维持当前交互入口
- 维持角色叙事
- 维持任务分派和汇报的用户心智

### Layer B: 系统职责层

这一层是本次吸收 OpenMOSS 后要新增的治理职责：

- Intake
- Planner
- Dispatch
- Executor
- Reviewer
- Patrol

它的作用是：

- 提供稳定的任务治理对象
- 提供状态机和事件流
- 提供审查和巡检闭环

### Separation Rule

核心规则是：

> **组织语义层是对外叙事，系统职责层是对内治理。二者允许映射，但不允许硬绑定成同一个实现层。**

这意味着：

- 不把 `司礼监 = 某个固定 Planner 类`
- 不把 `都察院 = Patrol` 简化为同一件事
- 不要求所有治理能力都必须以“新增部门”的方式出现
- Patrol 可以是系统服务，再投影为现有都察院/巡检语义

---

## Role Mapping

| 现有角色 | 当前对外语义 | 系统职责层映射 | 说明 |
|----------|--------------|----------------|------|
| 皇帝 / 用户 | 下达目标、查看结果 | Request Owner | 保持入口角色，不进入治理内核实现 |
| 司礼监 | 总管调度、接单、汇报 | Intake / Coordinator | 负责接收需求和汇报，不等于全部 Planner 逻辑 |
| 中书省 | 起草诏令、生成方案 | Planner | 最适合承接任务拆解、计划生成、模块划分 |
| 门下省 | 审核驳回、把关 | Planning Reviewer / Policy Gate | 偏前置审议，不等于交付审查闭环 |
| 尚书省 | 分发落实 | Dispatch | 负责任务派发、排序、路由 |
| 六部 | 各专业执行 | Executor | 具体产出代码、文档、运维、运营等交付 |
| 都察院 | 后置审查、监察 | Reviewer / Auditor | 最适合承接 review 结果闭环 |
| 巡检能力 | 当前未系统化 | Patrol | 定义为系统职责，不新增强制用户入口部门 |

补充规则：

1. `Reviewer` 的主语义优先映射到都察院
2. `Patrol` 是治理服务，不要求先人格化
3. `Planner / Executor` 在一期只做职责映射，不做完整系统化重构

---

## Phase-1 Storage Strategy

### Decision

一期采用：

> **Storage interface + filesystem-first adapter**

默认不引入 SQLite，不新增数据库服务，不修改安装器。

### Why

这个选择更符合当前仓库证据：

1. 当前 GUI server 依赖非常轻
   - 只有 `express` / `cors` / `ws`
2. 当前部署主路径是本地 `~/.openclaw` + `~/clawd`
3. 当前项目强调静态部署、共享工作区和低运维成本
4. 当前阶段必须避免为了实验能力提前进入 `install.sh`

### Phase-1 Layout

一期建议落盘在：

```text
~/.openclaw/state/openmoss/
  meta/
    schema-version.json
  tasks/
    <task-id>.json
  events/
    <task-id>.jsonl
  indexes/
    tasks.json
```

约束：

1. **任务快照与事件流属于运行态治理数据，放在 `~/.openclaw`，不放到 `~/clawd`**
2. **workspace 仍然用于项目文件、skills、memory，不承载系统治理状态**
3. **所有写入通过存储抽象层完成，后续允许替换为 SQLite adapter**

### Deferred Option

当以下条件同时出现时，才考虑 Phase-2 之后引入 SQLite：

1. 任务量明显增大
2. GUI 查询性能成为实际问题
3. 需要更复杂的筛选、排序、聚合
4. 文件方案已经证明成为维护负担

因此，一期的目标不是“最强存储”，而是“最小稳定存储”。

---

## install.sh Boundary

Wave 1 到 Wave 3 明确不改 `install.sh`。

只有同时满足以下条件，才允许进入安装器修改阶段：

1. task core / activity log / review / patrol 已完成稳定验证
2. 数据目录、schema version、默认配置已经冻结
3. 已明确旧环境升级路径，而不是要求重装
4. doctor / migration / bootstrap 补丁方案已定义
5. 新增能力被确认会长期保留，而不是实验实现

结论：

> **安装器属于交付面，不属于当前治理内核实验面。**

---

## Consequences

### Positive

1. 后续 Wave 2/3 有明确边界，不再继续争论“要不要整体像 OpenMOSS”
2. 可以在不破坏当前三省六部叙事的情况下补齐治理内核
3. 可以把 `install.sh` 风险后移到能力稳定后
4. 为未来引入 SQLite、rules layer、planner/executor systemization 预留清晰升级点

### Negative

1. 一期不会拥有 OpenMOSS 的完整能力面
2. 文件存储在复杂查询上不如 SQLite
3. Patrol 在一期先作为系统职责，用户感知可能弱于“新增一个显式角色”

### Accepted Tradeoff

这些代价是接受的，因为当前首要目标是：

> **先让 `danghuangshang` 获得稳定、可回归、可持续同步上游的治理内核。**

---

## Wave-2 Entry Criteria

只有当本 ADR 被视为已接受后，才允许进入 Wave 2。

Wave 2 必须遵守以下冻结点：

1. overlay 而不是替换
2. 先任务内核，再 GUI
3. 文件优先存储抽象
4. `install.sh` 暂不进入范围
5. 组织语义层与系统职责层保持分离

---

## Related Documents

- [OpenMOSS 吸收开发流程 SOP](../openmoss-integration-sop.md)
- [OpenMOSS 吸收路线图](/root/danghuangshang-openmoss-exec/.workflow/.roadmap/RMAP-openmoss-absorption-2026-03-16/roadmap.md)
- [OpenMOSS 吸收优先级分析](/root/danghuangshang-openmoss-exec/.workflow/.analysis/ANL-openmoss-danghuangshang-compare-2026-03-16/absorption-priorities.md)
- [OpenMOSS 覆盖矩阵](/root/danghuangshang-openmoss-exec/.workflow/.analysis/ANL-openmoss-danghuangshang-compare-2026-03-16/openmoss-coverage-matrix.md)
