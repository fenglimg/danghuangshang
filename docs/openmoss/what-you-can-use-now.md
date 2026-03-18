# ✅ OpenMOSS 当前可用能力

> ← [返回文档索引](../README.md) | [返回 OpenMOSS 吸收矩阵](./absorption-matrix.md)

---

## 这页是干什么的

OpenMOSS 相关文档现在很多，但多数偏开发、ADR 和收官记录。

这页只回答两个问题：

1. 我现在到底能用哪些 OpenMOSS 能力？
2. 哪些能力现在还不能按“已完成”去验收？

---

## 一、当前已经可用

### 1. Task Core

已支持：

- 任务创建
- 任务状态流转
- module / work item 结构
- schema version 初始化

代码证据：

- [task-core/state.js](../../gui/server/openmoss/task-core/state.js)
- [task-core/storage.js](../../gui/server/openmoss/task-core/storage.js)

### 2. Activity Log / Timeline

已支持：

- create
- claim
- submit
- review
- block

代码证据：

- [activity-log/service.js](../../gui/server/openmoss/activity-log/service.js)

### 3. Review / Rework

已支持：

- review queue
- approve
- reject
- rework
- review record

代码证据：

- [review/service.js](../../gui/server/openmoss/review/service.js)

### 4. Patrol / Recovery

已支持：

- stale task scan
- patrol alerts
- block
- resolve alerts
- reclaim blocked task

代码证据：

- [patrol/service.js](../../gui/server/openmoss/patrol/service.js)

### 5. Governance GUI

已支持：

- 查看任务流
- 查看时间线
- 查看 review queue
- 查看 patrol alerts
- 通过审查
- 打回返工
- 立即巡检
- 恢复认领

代码证据：

- [Governance.tsx](../../gui/src/pages/Governance.tsx)

### 6. Installer / Doctor Phase-1 Awareness

已支持：

- `doctor.sh` 识别 OpenMOSS state
- `install.sh` 解释惰性创建规则

文档与脚本证据：

- [doctor.md](../doctor.md)
- [install-readiness-assessment.md](./install-readiness-assessment.md)

---

## 二、当前不要按“已完成”验收

这些能力现在还不应记为失败，因为本来就没完成：

- reflection
- rules layer
- governance actor auth / registration
- scoring / leaderboard
- setup wizard 式完整 OpenMOSS 化

证据：

- [absorption-matrix.md](./absorption-matrix.md)
- [adr-003-phase2-reflection-rules-auth.md](./adr-003-phase2-reflection-rules-auth.md)

---

## 三、最小验证路线

如果你只想快速确认 OpenMOSS 当前是不是能用，建议最少做这 5 件事：

1. 打开 Governance 页
2. 创建一条任务
3. claim -> submit -> review
4. 查看 timeline
5. 运行一次 patrol scan

如果要更完整：

- 看 [Danghuangshang 全量手测清单](../testing-checklist.md)

---

## 四、推荐你怎么显示这类文档

OpenMOSS 文档建议分两层：

### 用户层

放这页：

- 我能用什么
- 我不能用什么
- 我怎么最小验证

### 开发层

继续放现有这些：

- ADR
- 收官回归
- SOP
- install readiness
- phase-2 backlog

这样用户和开发者不会混淆。

---

← [返回文档索引](../README.md)
