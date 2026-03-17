# OpenMOSS 6-Wave 收官回归清单

> Status: Completed  
> Scope: `Wave 1 -> Wave 6` 收官验证

← [返回文档索引](../README.md) | [返回 ADR-001](./adr-001-absorption-boundary.md)

---

## 目标

这份清单只服务一个目的：

> 在决定是否进入 `install.sh` / migration / doctor 评审之前，先确认当前 6 个 wave 的 active scope 已经**真实闭环**，而不是“看起来代码都写了”。

---

## 当前范围

本清单只覆盖已经完成的 active scope：

1. task core
2. activity log
3. review
4. patrol
5. governance GUI
6. governance control actions

明确不覆盖：

- rules layer
- prompt audit / edit
- notification-lite
- reflection / scoring
- installer implementation

---

## 当前基线

当前执行基线为 worktree 提交：

- `8c3ec3e` `docs: freeze openmoss absorption boundary adr`
- `9620a0b` `feat: add openmoss task core foundation`
- `354417c` `feat: add openmoss activity log and task api`
- `f5e3c5e` `feat: add openmoss review and patrol workflows`
- `710be30` `feat: add openmoss governance gui`
- `209c2ef` `feat: add governance control actions`
- `bd49ce0` `fix: resolve patrol alerts on task reclaim`
- `5e76d90` `feat: localize governance labels for L3 review`

---

## L0: 静态基线

以下项必须全部为 `PASS`，否则不进入更高层回归。

- [ ] ADR 仍然明确规定 `Wave 1-3` 不改 `install.sh`
  - 证据: [adr-001-absorption-boundary.md](/root/danghuangshang-openmoss-exec/docs/openmoss/adr-001-absorption-boundary.md)
- [ ] OpenMOSS 存储路径仍固定为 `~/.openclaw/state/openmoss/`
  - 证据: [storage.js](/root/danghuangshang-openmoss-exec/gui/server/openmoss/task-core/storage.js)
- [ ] 组织语义层与系统职责层没有重新耦合
  - 证据: [adr-001-absorption-boundary.md](/root/danghuangshang-openmoss-exec/docs/openmoss/adr-001-absorption-boundary.md)
- [ ] 当前 active scope 没有混入 rules / prompt / notification / scoring
  - 证据: [tasks.csv](/root/danghuangshang-openmoss-exec/.workflow/.csv-wave/cwp-openmoss-absorption-20260316/tasks.csv)

---

## L1: 自动化回归

### 后端治理层

执行：

```bash
cd /root/danghuangshang-openmoss-exec/gui/server
npm run test:openmoss
node --check /root/danghuangshang-openmoss-exec/gui/server/index.js
```

验收：

- [ ] `task-core` 测试通过
  - 证据文件: [task-core.test.js](/root/danghuangshang-openmoss-exec/tests/openmoss/task-core/task-core.test.js)
- [ ] `activity-log` 测试通过
  - 证据文件: [activity-log.test.js](/root/danghuangshang-openmoss-exec/tests/openmoss/activity-log/activity-log.test.js)
- [ ] `review` 测试通过
  - 证据文件: [review.test.js](/root/danghuangshang-openmoss-exec/tests/openmoss/review/review.test.js)
- [ ] `patrol` 测试通过
  - 证据 file: [patrol.test.js](/root/danghuangshang-openmoss-exec/tests/openmoss/patrol/patrol.test.js)
- [ ] `gui/server/index.js` 语法检查通过
  - 证据 file: [index.js](/root/danghuangshang-openmoss-exec/gui/server/index.js)

### 前端治理面

执行：

```bash
cd /root/danghuangshang-openmoss-exec/gui
npx eslint gui/src/pages/Governance.tsx gui/src/App.tsx gui/src/types.ts
npm run build
```

验收：

- [ ] 新增治理页 lint 通过
  - 证据 file: [Governance.tsx](/root/danghuangshang-openmoss-exec/gui/src/pages/Governance.tsx)
- [ ] GUI 构建通过
  - 证据文件: [App.tsx](/root/danghuangshang-openmoss-exec/gui/src/App.tsx), [Governance.tsx](/root/danghuangshang-openmoss-exec/gui/src/pages/Governance.tsx)

说明：

- 当前仓库存在旧页面的历史 lint 问题，**不属于本次 OpenMOSS 6-wave 收官阻断项**
- 但新增治理页相关文件必须保持干净

---

## L2: API 行为回归

### 任务主链路

建议用 GUI 或 curl 验证以下顺序：

1. 创建任务
2. 认领任务
3. 提交审查
4. 审查通过

验收：

- [ ] `GET /api/openmoss/tasks` 能看到任务
- [ ] `GET /api/openmoss/tasks/:taskId/timeline` 能看到至少 `create -> claim -> submit -> review`
- [ ] 通过审查后任务进入 `done`

证据代码：

- [service.js](/root/danghuangshang-openmoss-exec/gui/server/openmoss/activity-log/service.js)
- [review service.js](/root/danghuangshang-openmoss-exec/gui/server/openmoss/review/service.js)
- [index.js](/root/danghuangshang-openmoss-exec/gui/server/index.js)

### 打回返工链路

建议验证：

1. 创建任务
2. 认领
3. 提交审查
4. GUI 打回返工

验收：

- [ ] 任务状态从 `review` 变成 `rework`
- [ ] ReviewRecord 可查
- [ ] timeline 中新增 `review` 事件，metadata 中带 `action=reject`

### 巡检阻断链路

建议验证：

1. 准备一条 stale 任务
2. GUI 执行“立即巡检”

验收：

- [ ] stale 任务变为 `blocked`
- [ ] patrol alert 可查
- [ ] timeline 中新增 `block` 事件

### 恢复认领链路

建议验证：

1. 选择一条 `blocked` 任务
2. GUI 执行“恢复认领”

验收：

- [ ] 任务回到 `in_progress`
- [ ] timeline 中新增 `claim` 事件
- [ ] 告警页与任务详情页刷新后状态一致

---

## L3: GUI 闭环回归

在 [`Governance.tsx`](/root/danghuangshang-openmoss-exec/gui/src/pages/Governance.tsx) 上验证：

- [ ] 任务流列表与 `/api/openmoss/tasks` 返回一致
- [ ] 状态筛选有效
- [ ] 选中任务后时间线、review records、patrol alerts 联动刷新
- [ ] review queue 中操作“通过 / 打回”后，详情区同步刷新
- [ ] patrol alerts 中“恢复认领”后，任务状态同步刷新
- [ ] 顶部“立即巡检”可以触发真实 patrol scan
- [ ] 旧页面 `dashboard / sessions / system / cron / skills` 仍可正常进入

---

## L4: 数据面回归

直接检查 `~/.openclaw/state/openmoss/`：

- [ ] `meta/schema-version.json` 存在
- [ ] `tasks/*.json` 存在且能反映真实状态
- [ ] `events/*.jsonl` 能持续追加
- [ ] `reviews/*.jsonl` 存在
- [ ] `patrol-alerts/*.jsonl` 存在
- [ ] 同一任务的 task snapshot、timeline、review、alert 之间能相互对应

---

## 收官判定

只有同时满足以下条件，才能判定 6-wave active scope 收官完成：

1. L0 通过
2. L1 通过
3. L2 至少覆盖一条 approve 主链路、一条 reject/rework 链路、一条 patrol/blocked 链路
4. L3 通过
5. L4 通过
6. 仍未违反 ADR / SOP 边界，不提前修改 `install.sh`

---

## 当前建议结论

当前最合理的执行顺序是：

1. 先按本清单做一次完整收官回归
2. 再进入安装器评审
3. 评审通过后，才决定是否进入 `install.sh` / `doctor.sh` / migration 实装

原因很简单：

> 现在已经具备治理能力闭环，但是否进入安装器，不取决于“功能有没有写完”，而取决于“升级路径和交付路径是否已经严谨”。 

---

## 2026-03-17 执行记录

本轮收官回归已实际完成，结论为：`PASS`。

### L0: 静态基线

- [x] ADR 仍然明确规定 `Wave 1-3` 不改 `install.sh`
- [x] OpenMOSS 存储路径仍固定为 `~/.openclaw/state/openmoss/`
- [x] 组织语义层与系统职责层没有重新耦合
- [x] 当前 active scope 没有混入 rules / prompt / notification / scoring

### L1: 自动化回归

- [x] `npm run test:openmoss` 通过
- [x] `node --check gui/server/index.js` 通过
- [x] `npx eslint src/pages/Governance.tsx src/App.tsx src/types.ts` 通过
- [x] `npm run build` 通过

### L2: API 行为回归

- [x] approve 主链路通过：`create -> claim -> submit -> review -> done`
- [x] reject/rework 链路通过：`review -> rework`
- [x] patrol/blocked 链路通过：stale 任务可进入 `blocked`
- [x] recover-claim 链路通过：`blocked -> in_progress`
- [x] 恢复认领后全局 `Patrol Alerts` 与任务详情已保持一致

### L3: GUI 闭环回归

- [x] 任务流列表与状态筛选有效
- [x] 选中任务后时间线、审查记录、巡检告警联动刷新
- [x] review queue 中“通过 / 打回”可驱动真实状态变化
- [x] patrol alerts 中“恢复认领”可驱动真实状态变化
- [x] 顶部“立即巡检”可触发真实 patrol scan
- [x] 本轮人工联调已完成 `approve`、`reject`、`patrol block`、`reclaim` 四类核心 GUI 闭环

### L4: 数据面回归

- [x] `meta/schema-version.json` 存在
- [x] `tasks/*.json`、`events/*.jsonl`、`reviews/*.jsonl`、`patrol-alerts/*.jsonl` 已通过临时隔离 HOME 的真实写盘验证
- [x] task snapshot、timeline、review、alert 之间可相互对应

### 收官结论

- [x] `Wave 1 -> Wave 6` active scope 已收官
- [x] 当前阶段可以转入 installer review
- [x] 当前阶段仍不应直接进入 `install.sh` 实装
