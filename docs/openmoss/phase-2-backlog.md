# OpenMOSS Phase-2 Backlog

> Status: Draft backlog
> Source: [ADR-003](./adr-003-phase2-reflection-rules-auth.md), [absorption matrix](./absorption-matrix.md)

← [返回文档索引](../README.md) | [返回 ADR-003](./adr-003-phase2-reflection-rules-auth.md)

---

## Objective

把 OpenMOSS 的下一阶段吸收收敛为三条可执行主线：

- `reflection`
- `rules layer`
- `auth / registration`

排序原则：

1. 先补对当前治理闭环最关键的缺口
2. 先做只读、最小、可回滚实现
3. 不把 installer / setup / leaderboard 混入本轮

---

## P0

### PH2-REF-001: 建立 ReflectionRecord 最小模型

目标：

- 为 `reject -> rework` 链路增加正式 reflection record
- 与现有 task / review / activity log 对齐

建议范围：

- `gui/server/openmoss/reflection/`
- 最小 storage / model / service

验收标准：

1. 任务被 `reject` 后可以创建 reflection record
2. reflection record 至少包含 `taskId`、`actor`、`reason`、`note`、`createdAt`
3. 自动化测试覆盖创建与读取
4. 不破坏现有 review 流程

### PH2-REF-002: 把 Reflection 接入统一时间线和任务详情

目标：

- 让 reflection 不只是存起来，而是能被治理面消费

建议范围：

- Activity timeline
- task detail panel
- 最小 reflection API

验收标准：

1. `GET` 某任务详情时能看到 reflection 历史
2. 时间线可见 reflection 事件
3. 至少一条集成测试覆盖 `reject -> reflection -> rework`
4. Governance 页不需要新大页签即可查看 reflection

### PH2-RULE-001: 建立 Global Rules / Task Rules 只读模型

目标：

- 把当前分散在文档和 prompt 里的治理约束变成可查询对象

建议范围：

- `global rules`
- `task rules`
- version / scope / updatedAt

验收标准：

1. 存在最小 rule schema
2. 能区分 `global` 与 `task-level`
3. 能按任务解析“当前生效规则集合”
4. 自动化测试覆盖规则作用域判断

### PH2-RULE-002: 提供 Rules 只读 API 与治理页展示

目标：

- 先做可见与可审计，不做在线编辑

建议范围：

- rules query API
- task detail 中的 applicable rules
- 基础元数据展示

验收标准：

1. 存在 rules 查询 API
2. 治理页或任务详情可看到适用规则
3. 每条规则可看到来源、版本、更新时间
4. 不引入在线编辑入口

---

## P1

### PH2-AUTH-001: 定义 Governance Actor Registry

目标：

- 为 review / patrol / reflection / rule change 提供稳定 actor identity

建议范围：

- governance actor schema
- role mapping
- enable / disable 状态

验收标准：

1. 存在最小 actor registry
2. 每个 actor 至少包含 `id`、`role`、`status`
3. 审查和巡检记录可引用 registry 中的 actor
4. 自动化测试覆盖 registry 基础读写

### PH2-AUTH-002: 建立最小 Registration / Revoke 流程

目标：

- 让治理 actor 有可管理的加入与撤销路径

建议范围：

- register
- revoke
- rotate / disable

验收标准：

1. 存在最小 registration 接口或管理入口
2. 被 revoke 或 disable 的 actor 不能继续执行受限治理动作
3. 至少一条失败路径测试覆盖未授权访问
4. 不要求 setup wizard

### PH2-AUTH-003: 审查与巡检动作的授权边界

目标：

- 让关键治理动作具备最小权限边界

建议范围：

- review action auth
- patrol action auth
- rule change auth

验收标准：

1. 至少两类治理动作会校验 actor 身份
2. 未授权请求返回明确错误
3. 时间线或审计日志能记录执行主体
4. 不影响现有 GUI 全局登录链路的基本可用性

### PH2-RULE-003: 规则来源与现有文件体系的边界整理

目标：

- 避免 `rules layer` 与现有 `SOUL.md / skills / docs` 重复冲突

建议范围：

- 来源映射
- 优先级说明
- 冲突处理文档

验收标准：

1. 文档明确 rule layer 与现有文件体系的职责边界
2. 至少给出一条冲突解析规则
3. 更新相关 OpenMOSS 文档，不依赖口头约定

### PH2-REF-003: Reflection 到 Rule Candidate 的最小桥接

目标：

- 让重复打回的问题能沉淀成规则候选，而不是永久停留在单条反思里

建议范围：

- rule candidate 标记
- reflection metadata
- 只读汇总视图

验收标准：

1. reflection 可标记为 rule candidate
2. 至少可按任务或按类型汇总候选项
3. 不要求自动生成规则

---

## Deferred

以下内容不进入当前 backlog 执行面：

1. leaderboard / reward score
2. prompt 在线编辑器
3. notification channels
4. setup wizard
5. planner / executor 全量自治系统化
6. installer implementation 扩写

---

## Recommended Execution Order

1. `PH2-REF-001`
2. `PH2-REF-002`
3. `PH2-RULE-001`
4. `PH2-RULE-002`
5. `PH2-AUTH-001`
6. `PH2-AUTH-002`
7. `PH2-AUTH-003`
8. `PH2-RULE-003`
9. `PH2-REF-003`

原因：

- 先补反思沉淀，能最快增强现有 review 闭环
- 再补 rules layer，给治理解释和后续收敛提供载体
- 最后补 auth / registration，避免在边界未清时过早做重

---

## Exit Condition

Phase-2 backlog 只有在以下条件满足时，才可认为进入执行准备状态：

1. 已接受 ADR-003 的目标和非目标
2. 已确认本轮不进入 `install.sh`
3. 已有 worktree / 分支隔离方案
4. 每项任务都能独立测试与独立回滚
