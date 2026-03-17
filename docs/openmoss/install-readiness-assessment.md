# OpenMOSS 安装器评审准入评估

> Status: Installer Review In Progress  
> Scope: 判断当前 6-wave active scope 是否已具备进入 `install.sh` / migration / doctor 评审的前提

← [返回文档索引](../README.md) | [返回 OpenMOSS SOP](../openmoss-integration-sop.md)

---

## 结论先行

当前结论不是“已经可以改 `install.sh`”，而是：

> **已经具备进入“安装器评审”阶段的前置讨论条件，但还不具备直接进入“安装器实现”阶段的条件。**

换句话说：

- **可以评审**
- **还不应直接落安装器改动**

补充说明：

- `2026-03-17` 已完成 `L3` GUI 人工联调收官
- 当前已开始 installer review 第一波改造：`doctor.sh` 与 migration 文档补充 OpenMOSS state 规则
- 当前仍然没有进入 `install.sh` 实装阶段

---

## 评估口径

按 SOP 中的安装器准入逻辑，分成三类：

1. **已具备**
2. **部分具备，可进入评审**
3. **未具备，不能直接改安装器**

---

## A. 已具备进入安装器评审的前提

### A1. 核心能力已经形成真实闭环

判定：**已具备**

证据：

- task core 已完成：
  - [task-core index.js](/root/danghuangshang-openmoss-exec/gui/server/openmoss/task-core/index.js)
- activity log 已完成：
  - [activity-log service.js](/root/danghuangshang-openmoss-exec/gui/server/openmoss/activity-log/service.js)
- review 已完成：
  - [review service.js](/root/danghuangshang-openmoss-exec/gui/server/openmoss/review/service.js)
- patrol 已完成：
  - [patrol service.js](/root/danghuangshang-openmoss-exec/gui/server/openmoss/patrol/service.js)
- governance GUI 已完成：
  - [Governance.tsx](/root/danghuangshang-openmoss-exec/gui/src/pages/Governance.tsx)

判断理由：

- 现在已经不是“抽象设计”
- 而是有真实模型、真实状态流、真实事件流、真实 GUI 控制面

### A2. 一期存储路径已经冻结

判定：**已具备**

证据：

- [ADR-001](/root/danghuangshang-openmoss-exec/docs/openmoss/adr-001-absorption-boundary.md)
- [task-core storage.js](/root/danghuangshang-openmoss-exec/gui/server/openmoss/task-core/storage.js#L33)

当前已冻结为：

```text
~/.openclaw/state/openmoss/
```

判断理由：

- 路径已经明确
- 目录职责已经明确
- 没有把治理状态混进 `~/clawd`

### A3. 当前 active scope 已全部完成

判定：**已具备**

证据：

- [tasks.csv](/root/danghuangshang-openmoss-exec/.workflow/.csv-wave/cwp-openmoss-absorption-20260316/tasks.csv)
- [roadmap.md](/root/danghuangshang-openmoss-exec/.workflow/.roadmap/RMAP-openmoss-absorption-2026-03-16/roadmap.md)
- [issues.jsonl](/root/danghuangshang-openmoss-exec/.workflow/issues/issues.jsonl)

判断理由：

- 1 到 7 号 active task 已全部完成
- 现在可以从“实现阶段”进入“收官评审阶段”

---

## B. 部分具备，可进入评审但不能直接实现

### B1. 数据 schema 已存在，但 migration 机制还未建立

判定：**部分具备**

证据：

- 已有 schema version：
  - [task-core storage.js](/root/danghuangshang-openmoss-exec/gui/server/openmoss/task-core/storage.js#L48)
- 但没有 migration runner
- 没有版本升级脚本
- 没有 schema upgrade 文档

判断理由：

- 这说明“可以讨论如何迁移”
- 但还不能把 schema 升级责任直接交给 `install.sh`

### B2. GUI / API 闭环已完成，并已完成首轮 live upgrade rehearsal

判定：**部分具备**

证据：

- API 与 GUI 都已经完成
- 已完成一次基于真实旧环境快照的 live upgrade rehearsal：
  - [live-upgrade-rehearsal-2026-03-17.md](/root/danghuangshang-openmoss-exec/docs/openmoss/live-upgrade-rehearsal-2026-03-17.md)
- 验证结论：
  - 旧配置未被破坏
  - `state/openmoss` 在未使用治理能力前保持不存在
  - 升级 GUI 能读旧系统并写新治理数据
- 仍未完成：
  - `local-host-install` 分支级集成验证
  - 主运行面上的 install-path rehearsal
  - 基于最终 installer policy 的演练

判断理由：

- 这已经不再是“完全未验证”
- 但仍不足以直接改安装器

### B3. 新目录按需惰性创建可行，但 installer policy 还未定义

判定：**部分具备**

证据：

- 代码已能自行 `mkdir -p` 初始化：
  - [task-core storage.js](/root/danghuangshang-openmoss-exec/gui/server/openmoss/task-core/storage.js#L15)
  - [activity-log storage.js](/root/danghuangshang-openmoss-exec/gui/server/openmoss/activity-log/storage.js)
  - [review storage.js](/root/danghuangshang-openmoss-exec/gui/server/openmoss/review/storage.js)
  - [patrol storage.js](/root/danghuangshang-openmoss-exec/gui/server/openmoss/patrol/storage.js)

判断理由：

- 这意味着严格来说不一定非要 `install.sh` 预创建目录
- 但是否预创建、是否做权限检查、是否做备份提示，还没形成交付策略

---

## B. 部分具备，可进入评审但不能直接实现（续）

### B4. `doctor.sh` 已开始理解 OpenMOSS 治理状态，但仍是只读校验

判定：**部分具备**

证据：

- `doctor.sh` 已新增 OpenMOSS state 检查：
  - [doctor.sh](/root/danghuangshang-openmoss-exec/doctor.sh)
- 已覆盖：
  - `~/.openclaw/state/openmoss/` 是否存在
  - `meta/schema-version.json` 是否存在
  - `tasks/events/reviews/patrol-alerts` 目录与基础数量概览
- 仍未覆盖：
  - 自动修复
  - schema migration runner
  - live data reconciliation

判断理由：

- 这足以支撑 installer review 第一波
- 但还不足以把 OpenMOSS 修复责任直接下放给安装器

### B5. 迁移文档已补 OpenMOSS 状态目录规则，并与 rehearsal 结论对齐

判定：**部分具备**

证据：

- [host-install-migration.md](/root/danghuangshang-openmoss-exec/docs/host-install-migration.md)
- [install-prompt.md](/root/danghuangshang-openmoss-exec/docs/install-prompt.md)

当前状态：

- 文档已明确：
  - `~/.openclaw/state/openmoss/` 属于运行态治理数据
  - 旧环境如无该目录，不应预先创建空目录
  - 它应在 GUI/API 首次使用时惰性创建
  - 迁移时应跟随 `~/.openclaw` 一并备份与保留
- 仍未完成：
  - 基于最终 installer policy 的 live upgrade 演练
  - 基于真实老环境的升级验收

## C. 当前不具备，不能直接进入安装器实现

### C3. `install.sh` 还没有任何 OpenMOSS 交付面约定

判定：**未具备**

证据：

- [install.sh](/root/danghuangshang-openmoss-exec/install.sh)

当前问题：

- 没有 OpenMOSS state 目录初始化
- 没有兼容性提示
- 没有迁移补丁
- 没有与治理层相关的 doctor / bootstrap / schema check

结论：

- 现在直接改 `install.sh`，仍然是“先装上再试”的风险模式

### C4. 还没有针对老环境的增量升级演练

判定：**未具备**

当前缺口：

- 没有拿现有 `~/.openclaw` live 环境做一次升级演练
- 没有验证：
  - 旧配置不变
  - 新治理目录惰性出现
  - GUI 升级后可读旧系统又可写新治理数据

这项是进入安装器实现前的硬前提。

---

## 当前最合理的安装器评审结论

### 可以进入评审的内容

这些内容现在已经值得开评审：

1. 是否需要 `install.sh` 预创建 `~/.openclaw/state/openmoss/`
2. 是否需要 `doctor.sh` 新增 OpenMOSS state 检查
3. 是否需要 `host-install-migration.md` 增加 OpenMOSS state 迁移章节
4. 是否需要定义 schema version 升级规则
5. 是否需要在 `install-prompt.md` 补充 OpenMOSS 治理能力说明

### 还不能直接实现的内容

这些内容现在还不应直接写进安装器：

1. 自动迁移旧治理数据
2. 自动修复 schema mismatch
3. 强制初始化治理默认配置
4. 把 GUI/治理特性直接写成用户安装承诺

---

## 准入矩阵

| 准入项 | 当前状态 | 结论 |
|--------|----------|------|
| active 6-wave 功能闭环 | 已完成 | 可评审 |
| 存储路径冻结 | 已完成 | 可评审 |
| GUI/API 编译与测试 | 已完成 | 可评审 |
| doctor 支撑 | 已补首轮只读检查 | 仍不可实装 |
| migration 支撑 | 已补目录规则文档 | 仍不可实装 |
| live upgrade 演练 | 已完成快照级 rehearsal | 仍不可实装 |
| install.sh 交付策略 | 缺失 | 不可实装 |
| schema migration 机制 | 缺失 | 不可实装 |

---

## 建议下一步

最合理的顺序不是直接改 `install.sh`，而是：

1. 已完成 [`6-wave-closeout-regression-checklist.md`](/root/danghuangshang-openmoss-exec/docs/openmoss/6-wave-closeout-regression-checklist.md)
2. 继续 installer review 第一波：
   - `doctor.sh` 首轮检查是否足够
   - migration 文档是否覆盖旧环境惰性接入
3. 下一步收敛 installer policy：`install.sh` 是否只做目录策略/提示
4. 在 installer policy 收敛后，再做一轮贴近主运行面的升级演练
5. 只有完成上述演练后，才允许真正进入 `install.sh` 修改

---

## 当前 verdict

一句话结论：

> **现在已经完成治理层收官、installer review 第一波也已启动，并完成了一次真实旧环境快照级 rehearsal；但在 installer policy 收敛前，仍不够资格直接动安装器。**

这正符合当前 SOP：  
**先完成核心治理层收官，再进入交付评审，而不是让安装器替代验证。**
