# OpenMOSS Phase-2 Waves

> Status: Draft execution waves
> Source: [phase-2-backlog.md](./phase-2-backlog.md), [ADR-003](./adr-003-phase2-reflection-rules-auth.md)

← [返回文档索引](../README.md) | [返回 Phase-2 Backlog](./phase-2-backlog.md)

---

## Goal

在不扩大当前 scope 的前提下，把 Phase-2 backlog 压缩成可执行 waves，覆盖：

- `reflection`
- `rules layer`
- `auth / registration`

执行原则：

1. 先补最影响现有治理闭环的能力
2. 先做最小模型和只读面，再做权限边界
3. 不把 installer、setup wizard、leaderboard 混入本轮

---

## Wave 0: Reflection Foundation

### 前置条件

- Phase-1 治理层已稳定存在
- 现有 `review -> rework` 路径已可用
- `gui/server/openmoss/review/` 与 `activity-log/` 测试可通过

### 任务

#### W0-1 建立 ReflectionRecord 最小模型

- 目标：定义 reflection 的最小数据结构和存储接口
- 涉及模块/路径：`gui/server/openmoss/reflection/`，测试放在 `tests/openmoss/reflection/`
- 验收标准：
  - 能创建并读取 reflection record
  - record 至少包含 `taskId`、`actor`、`reason`、`note`、`createdAt`

#### W0-2 建立 ReflectionService 并接入 reject 主链路

- 目标：让 `reject -> rework` 时可写入正式 reflection
- 涉及模块/路径：`gui/server/openmoss/reflection/`、`gui/server/openmoss/review/`、`gui/server/openmoss/activity-log/`
- 验收标准：
  - 至少一条 reject 路径会生成 reflection record
  - 不破坏现有 review record 与任务状态切换

#### W0-3 为 Reflection 增加最小 API

- 目标：提供按任务读取 reflection 的能力
- 涉及模块/路径：`gui/server/index.js`、`gui/server/openmoss/reflection/`
- 验收标准：
  - 存在按任务读取 reflection 的 API
  - 未命中任务或参数非法时返回明确错误

### 产出物

- 代码：reflection model / storage / service / API
- 测试：reflection 单元测试与一条集成链路测试
- 文档：如有必要，在 OpenMOSS 文档索引补充条目

### 风险点

- reject 与 reflection 的触发边界不清，容易出现双写或漏写
- 如果直接耦合 review service，后续可能难以扩展 reflection 来源

---

## Wave 1: Reflection in Governance UI + Rule Model

### 前置条件

- Wave 0 完成
- Governance 页现有任务详情与时间线刷新逻辑稳定

### 任务

#### W1-1 把 Reflection 接入时间线

- 目标：在统一 timeline 中展示 reflection 事件
- 涉及模块/路径：`gui/server/openmoss/activity-log/`、`gui/src/pages/Governance.tsx`
- 验收标准：
  - 任务时间线可见 reflection 事件
  - 不影响已有 create/claim/submit/review/block 事件展示

#### W1-2 在任务详情增加 Reflection 历史区块

- 目标：让治理面能直接查看反思记录
- 涉及模块/路径：`gui/src/pages/Governance.tsx`
- 验收标准：
  - 任务详情能看到该任务 reflection 列表
  - 不新增独立大页签

#### W1-3 建立 Global Rules / Task Rules 最小模型

- 目标：定义 rules layer 的最小 schema 和作用域
- 涉及模块/路径：`gui/server/openmoss/rules/`，测试放在 `tests/openmoss/rules/`
- 验收标准：
  - 能区分 `global` 与 `task-level`
  - 能解析某任务的生效规则集合

#### W1-4 定义 Rules 存储与版本元数据

- 目标：让规则具备来源、版本、更新时间等审计字段
- 涉及模块/路径：`gui/server/openmoss/rules/`
- 验收标准：
  - 每条规则可读取 `scope/source/version/updatedAt`
  - 自动化测试覆盖基本读写与作用域判断

### 产出物

- 代码：reflection UI 接入、rules model / storage
- 测试：timeline 与 rules 作用域测试
- 文档：必要时补充 rule schema 说明

### 风险点

- Governance 页信息密度上升，容易造成详情区拥挤
- rules model 若一开始做过重，会拖慢后续 API 和 auth 落地

---

## Wave 2: Rules Read Surface + Rule Boundary

### 前置条件

- Wave 1 完成
- rules 最小模型已冻结

### 任务

#### W2-1 提供 Rules 只读 API

- 目标：把 rules layer 变成可查询对象
- 涉及模块/路径：`gui/server/index.js`、`gui/server/openmoss/rules/`
- 验收标准：
  - 存在 rules 查询 API
  - 可按任务读取 applicable rules

#### W2-2 在治理页展示 Applicable Rules

- 目标：让任务详情显示当前适用规则
- 涉及模块/路径：`gui/src/pages/Governance.tsx`
- 验收标准：
  - 可在任务详情看到 applicable rules
  - 每条规则至少显示来源与版本

#### W2-3 输出 Rules 与现有文件体系的边界文档

- 目标：说明 rule layer 与 `SOUL.md / skills / docs` 的职责边界
- 涉及模块/路径：`docs/openmoss/`，如需代码辅助则放在 `gui/server/openmoss/rules/`
- 验收标准：
  - 文档明确职责边界与优先级
  - 至少给出一条冲突解析规则

#### W2-4 为 Reflection 增加 Rule Candidate 标记

- 目标：让重复打回问题能沉淀成规则候选
- 涉及模块/路径：`gui/server/openmoss/reflection/`、`gui/src/pages/Governance.tsx` 或 `TBD`，应落在 `gui/src/pages/` 下现有治理详情区域
- 验收标准：
  - reflection 可标记为 `rule candidate`
  - 可按任务汇总候选项

### 产出物

- 代码：rules read API、applicable rules UI、reflection candidate metadata
- 文档：rules boundary 文档
- 测试：rules API / applicable rules / candidate 标记测试

### 风险点

- rules 来源边界如果定义不清，会与现有 prompt/skills 产生重复约束
- candidate 机制若定义太弱，后续难承接到真正规则

---

## Wave 3: Governance Actor Registry + Minimal Registration

### 前置条件

- Wave 2 完成
- rules/ reflection 数据结构已稳定
- 当前 GUI 全局登录链路保持可用

### 任务

#### W3-1 定义 Governance Actor Registry

- 目标：为治理动作引入稳定 actor identity
- 涉及模块/路径：`gui/server/openmoss/auth/` 或 `gui/server/openmoss/actors/`，测试放在 `tests/openmoss/auth/` 或 `tests/openmoss/actors/`
- 验收标准：
  - 存在最小 actor registry
  - actor 至少含 `id/role/status`

#### W3-2 建立最小 registration / revoke / disable 流程

- 目标：让治理 actor 有加入与撤销路径
- 涉及模块/路径：`gui/server/openmoss/auth/` 或 `gui/server/openmoss/actors/`、`gui/server/index.js`
- 验收标准：
  - 存在最小 registration 接口或管理入口
  - revoke / disable 后无法继续执行受限动作

#### W3-3 审查与巡检动作接入稳定 actor attribution

- 目标：让 review / patrol 至少两类动作能记录 registry actor
- 涉及模块/路径：`gui/server/openmoss/review/`、`gui/server/openmoss/patrol/`、`gui/server/openmoss/auth/` 或 `actors/`
- 验收标准：
  - 审查和巡检动作可记录稳定 actor identity
  - 未授权调用返回明确错误

#### W3-4 把 Reflection / Rule Change 的主体归因接到 registry

- 目标：让 phase-2 新增能力也使用统一身份边界
- 涉及模块/路径：`gui/server/openmoss/reflection/`、`gui/server/openmoss/rules/`、`gui/server/openmoss/auth/` 或 `actors/`
- 验收标准：
  - reflection 与 rule change 至少一种动作能记录 registry actor
  - 审计信息可通过 API 查询

### 产出物

- 代码：actor registry、registration/revoke、action auth
- 测试：授权成功/失败路径、registry 基础测试
- 文档：必要时补充 actor model 说明

### 风险点

- auth 设计过重会与现有单机静态部署哲学冲突
- 若路径命名不稳，后续可能出现 `auth` 与 `actors` 双目录分裂

---

## Wave 4: Phase-2 Convergence and Recovery Gate

### 前置条件

- Wave 3 完成
- reflection / rules / auth 至少都已有最小可运行实现

### 任务

#### W4-1 做 phase-2 自动化回归清单

- 目标：把 reflection / rules / auth 的最小验收固定下来
- 涉及模块/路径：`docs/openmoss/`、`tests/openmoss/`
- 验收标准：
  - 存在一份 phase-2 回归清单文档
  - 清单能覆盖三条主线的核心链路

#### W4-2 做 Governance L3 人工联调脚本包

- 目标：给 reflection / rules / auth 提供最小联调路径
- 涉及模块/路径：`docs/openmoss/`，如需辅助脚本则放在 repo 合适目录下 `TBD`，但应优先靠现有 `gui/server` API 完成
- 验收标准：
  - 至少给出造数、浏览器联调、回归清理步骤
  - 覆盖 reflection、rules 可见性、auth 拒绝路径

#### W4-3 更新吸收矩阵与 phase-2 完成面说明

- 目标：把哪些已吸收、哪些仍延后重新写清楚
- 涉及模块/路径：`docs/openmoss/absorption-matrix.md`、`docs/openmoss/`
- 验收标准：
  - absorption matrix 与实际实现一致
  - 明确记录仍未进入的能力

#### W4-4 判断是否进入 installer review for phase-2

- 目标：决定 doctor / migration 是否需要理解新对象
- 涉及模块/路径：`docs/openmoss/`，代码路径 `TBD`，如需实现必须另开 installer 任务
- 验收标准：
  - 形成一条清晰 verdict：进入或不进入 installer review
  - 若进入，也只形成评审入口，不直接改 `install.sh`

### 产出物

- 文档：phase-2 回归清单、联调脚本包、矩阵更新、installer review verdict
- 测试：phase-2 自动化回归集合
- 代码：仅必要修补，不以新增大功能为主

### 风险点

- 容易把“phase-2 收官”与“installer 改造”再次混在一起
- 若回归门不明确，phase-2 会停留在“看起来都写了”

---

## Execution Rhythm Suggestion

### 单人节奏

- Wave 0: 2-3 天
- Wave 1: 2-4 天
- Wave 2: 2-3 天
- Wave 3: 3-5 天
- Wave 4: 1-2 天

### 双人节奏

- Wave 0: 1-2 天
- Wave 1: 1-2 天
- Wave 2: 1-2 天
- Wave 3: 2-3 天
- Wave 4: 1 天

### 小队节奏（3-4 人）

- Wave 0: 1 天
- Wave 1: 1 天
- Wave 2: 1 天
- Wave 3: 1-2 天
- Wave 4: 0.5-1 天

说明：

- `reflection` 与 `rules layer` 适合前置推进
- `auth / registration` 应在前两波模型稳定后再接入
- 若当前仓库仍需频繁吸收上游，建议按 wave 单独起 worktree，而不是一次性长线堆积
