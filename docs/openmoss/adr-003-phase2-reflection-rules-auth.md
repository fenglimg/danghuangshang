# ADR-003: OpenMOSS Phase-2 Scope for Reflection, Rules, and Auth

> Status: Proposed
> Date: 2026-03-18
> Scope: Post-core governance absorption after ADR-001 / ADR-002 / absorption matrix

← [返回文档索引](../README.md) | [返回 ADR-001](./adr-001-absorption-boundary.md) | [返回吸收矩阵](./absorption-matrix.md)

---

## Decision

当前 OpenMOSS Phase-2 定义为：

1. **补治理支撑层，不重做治理内核**
2. **当前 Phase-2 只覆盖**
   - `reflection`
   - `rules layer`
   - `auth / registration`
3. **继续保持 overlay 策略**
   - 不替换三省六部语义层
   - 不重写现有 gateway / bindings / channels
4. **`install.sh` 仍不进入 Phase-2 主执行范围**
5. **优先做最小可验证实现，不追求一次性完整 OpenMOSS 化**

一句话结论：

> **Phase-1 解决“治理对象是否存在”，Phase-2 解决“治理对象如何持续约束、复盘、归因”。**

---

## Context

根据 [absorption-matrix.md](/root/danghuangshang/docs/openmoss/absorption-matrix.md)，当前仓库已经完成：

- task core
- activity log / timeline
- review / patrol
- governance GUI
- installer / doctor phase-1

但仍存在三类关键缺口：

### 1. review 有拦截能力，但缺少正式反思沉淀

当前可以：

- approve
- reject
- rework

但还不能系统回答：

- 某类打回是否重复发生
- 某个执行角色如何从打回中收敛
- 审查意见是否被结构化沉淀为后续规则或经验

### 2. 治理已有状态流，但缺少规则层

当前治理页可以看任务状态，却还没有统一、可查询、可审计的规则来源去说明：

- 某类任务为什么必须走某条流程
- 哪些约束是全局性的
- 哪些约束只属于单任务或单类任务

### 3. 已有 GUI token 保护，但没有 OpenMOSS 风格的治理主体身份模型

当前运行面已具备全局认证，但从治理层视角看，仍缺少：

- 系统职责层 actor 的稳定身份
- 最小 registration / enable / revoke 模型
- 审查、巡检、反思、规则变更的可归因主体

---

## Why Phase-2 Is Needed

Phase-2 不是为了“更像 OpenMOSS”，而是为了补齐 Phase-1 完成后暴露出来的治理短板：

1. **没有 reflection，review 只能拦错，不能沉淀经验**
2. **没有 rules layer，治理解释仍分散在 prompt / 文档 / 人脑里**
3. **没有最小 actor auth/registration，治理操作缺少稳定归因边界**

因此，Phase-2 的目标不是新增更多页面，而是让已有治理层具备：

- 可复盘
- 可约束
- 可归因

---

## In Scope

### A. Reflection

最小目标：

1. 为 `reject -> rework` 链路增加正式 `reflection` 记录
2. 允许把反思结果写入统一治理事件流
3. 允许按任务查询 reflection 历史
4. 允许在治理页或任务详情中查看 reflection

推荐最小形态：

- `reflection record`
- `reflection event type`
- `task-level reflection query`

### B. Rules Layer

最小目标：

1. 引入 `global rules`
2. 引入 `task rules`
3. 提供只读查询和审计视图
4. 明确规则版本和生效边界

推荐最小形态：

- 文件或本地持久化存储
- 只读 API
- 规则来源、更新时间、适用范围可见

### C. Auth / Registration

最小目标：

1. 定义治理 actor 的最小身份模型
2. 定义 registration / enable / disable / revoke 基础流程
3. 为 review / patrol / reflection / rule change 提供稳定 actor attribution
4. 不与现有运行面认证混淆

推荐最小形态：

- governance actor registry
- local token / key model
- 明确角色与职责映射

---

## Explicit Non-Goals

以下内容**不属于当前 Phase-2**：

1. setup wizard
2. scoring / leaderboard / reward system
3. prompt online editing
4. notification sub-system
5. planner / executor 全量自治编排重构
6. 多租户 agent platform
7. 外部 OAuth / SSO
8. 改写 `install.sh` 为 OpenMOSS 初始化器
9. 把现有三省六部语义层替换为 OpenMOSS 原生术语

---

## Design Rules

### Rule 1: Reflection 必须进入统一治理流

不允许再单独造一套“反思日志体系”绕开 task core / activity log。

### Rule 2: Rules layer 先只读，后编辑

Phase-2 只要求：

- 可存
- 可查
- 可审计

不要求在线编辑器。

### Rule 3: Auth / Registration 先做治理边界，不做平台边界

Phase-2 关注的是：

- 谁在执行治理动作
- 谁可以审查 / 巡检 / 改规则

不要求复制 OpenMOSS 原版整套 middleware 注册体系。

### Rule 4: Installer 继续后置

即使 Phase-2 落地，也不自动获得进入 `install.sh` 实装的资格。

若未来要改交付面，仍需单独评审：

- doctor 是否要理解新状态
- migration 是否要说明新目录
- 是否需要 live-upgrade rehearsal

---

## Acceptance Criteria

Phase-2 只有同时满足以下条件，才算完成：

### A. Reflection 验收

1. 至少一条 `reject -> rework` 路径会生成正式 reflection record
2. reflection 能按任务查询
3. reflection 能进入统一时间线或治理详情
4. 至少有一条自动化测试覆盖 reflection 主链路

### B. Rules Layer 验收

1. 存在 global rules 与 task rules 的最小模型
2. 存在只读查询入口
3. 规则来源、版本、更新时间可见
4. 至少一条任务能读取并展示适用规则
5. 自动化测试覆盖规则读取与作用域判定

### C. Auth / Registration 验收

1. 存在治理 actor 的最小 registry
2. 存在 registration / enable / revoke 基本流程
3. review / patrol / reflection / rule change 至少两类动作能记录稳定 actor identity
4. 自动化测试覆盖授权成功和拒绝路径

### D. 集成验收

1. 不破坏现有 Governance 页主链路
2. 不破坏 Phase-1 的 `doctor.sh` / `install.sh` 边界
3. 文档能明确说明哪些能力仍未吸收
4. 变更可独立回滚，不要求同步重装

---

## Merge Gate

只有同时满足以下条件，才允许把 Phase-2 结果视为可回收候选：

1. reflection / rules / auth 三个子域至少完成两个
2. 每个子域都有独立测试
3. 当前变更未把 `install.sh` 混入主实现
4. 已更新 absorption matrix 或后续覆盖矩阵
5. 已形成独立的 phase-2 backlog 收口记录

---

## Consequences

### Positive

1. review 将从“状态打回”升级为“状态打回 + 经验沉淀”
2. 规则将从分散约束升级为治理层可见对象
3. 治理操作将具备更稳定的身份边界和归因能力
4. 为后续 scoring / planner-executor systemization 留出更扎实基础

### Negative

1. 需要引入新的治理对象与存储结构
2. 需要解决规则来源与现有 SOUL / skills / prompt 文件的边界
3. auth / registration 若做过重，容易与当前单机静态部署哲学冲突

---

## Follow-up

本 ADR 接受后，下一步应执行：

1. 生成 phase-2 backlog
2. 先从 `reflection` 和 `rules layer` 开始
3. 把 `auth / registration` 约束在“治理 actor registry”范围内
4. 不与 installer implementation 混跑
