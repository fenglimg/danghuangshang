# OpenMOSS Absorption Matrix

> Status: Verified on 2026-03-18
> Scope: `/root/danghuangshang` against `uluckyXH/OpenMOSS` DeepWiki baseline

---

## Baseline

本矩阵以 OpenMOSS DeepWiki 的以下能力面作为对照基线：

- `OpenMOSS Overview`
- `Architecture / Task Lifecycle`
- `Activity Feed`
- `Scoring & Monitoring`
- `Deployment & Operations`

本地判断原则不是“是否整仓复刻 OpenMOSS”，而是：

> 是否已经在 `danghuangshang` 上完成了 OpenMOSS 核心治理层的稳定吸收，以及哪些能力被明确排除或延后。

---

## Matrix

| 主题 | 已吸收 | 明确不吸收或延后 | 下一阶段建议 |
|------|--------|------------------|--------------|
| Task core / 状态机 | 已吸收。证据：`gui/server/openmoss/task-core/state.js` 关键词 `TASK_STATUSES`、`ALLOWED_TRANSITIONS`；`gui/server/openmoss/task-core/storage.js` 关键词 `resolveOpenMossStateDir`、`schemaVersion`；基线提交见 `docs/openmoss/6-wave-closeout-regression-checklist.md` 中 `9620a0b feat: add openmoss task core foundation`。 | - | 保持 `filesystem-first` 与 `~/.openclaw/state/openmoss/` 不变，除非后续有明确的 SQLite 演进条件。证据边界见 `docs/openmoss/adr-001-absorption-boundary.md` 关键词 `filesystem-first`。 |
| ActivityLog / Timeline | 已吸收。证据：`gui/server/openmoss/activity-log/service.js` 关键词 `create`、`claim`、`submit`、`review`、`block`；`gui/server/index.js` 关键词 `/api/openmoss/tasks/:taskId/timeline`；基线提交见 `docs/openmoss/6-wave-closeout-regression-checklist.md` 中 `354417c feat: add openmoss activity log and task api`。 | - | 若继续深化，优先补 `reflection` 事件类型，而不是另起第二套日志体系。当前缺口见 `.workflow/.analysis/ANL-openmoss-danghuangshang-compare-2026-03-16/openmoss-coverage-matrix.md` 关键词 `Reflection logs after rejection | Partial`。 |
| Review / Rework 闭环 | 已吸收。证据：`gui/server/openmoss/review/service.js` 关键词 `approve`、`reject`、`rework`；`gui/server/index.js` 关键词 `/api/openmoss/reviews/queue`、`/api/openmoss/tasks/:taskId/review`；`gui/src/pages/Governance.tsx` 关键词 `通过审查`、`打回返工`；基线提交见 `docs/openmoss/6-wave-closeout-regression-checklist.md` 中 `f5e3c5e feat: add openmoss review and patrol workflows`。 | 未完整吸收 OpenMOSS 原版的 `reflection` 学习闭环。证据：`docs/openmoss/adr-001-absorption-boundary.md` 关键词 `reflection scoring / leaderboard`；`.workflow/.analysis/.../openmoss-coverage-matrix.md` 关键词 `Reflection logs after rejection | Partial`。 | 下一阶段先补最小 `reflection log`，把“打回”后的经验沉淀成正式事件，再决定是否做更重的评分或激励。 |
| Patrol / Recovery | 已吸收。证据：`gui/server/openmoss/patrol/service.js` 关键词 `scanTasks`、`blocked`、`recommendation`、`resolveTaskAlerts`；`gui/server/index.js` 关键词 `/api/openmoss/patrol/scan`、`/api/openmoss/patrol/alerts`；`gui/src/pages/Governance.tsx` 关键词 `立即巡检`、`恢复认领`；修正提交可见当前分支历史 `4ae706e fix: resolve patrol alerts on task reclaim`。 | - | 保持 Patrol 作为系统职责层，不把它重新耦合成固定“部门实现”。边界证据：`docs/openmoss/adr-001-absorption-boundary.md` 关键词 `Patrol 是治理服务`。 |
| Governance GUI / Control Plane | 已吸收。证据：`gui/src/pages/Governance.tsx` 关键词 `真实读取 OpenMOSS task core`、`待审队列`、`开放巡检告警`、`活动时间线`；`gui/server/index.js` 关键词 `/api/openmoss/tasks`、`/api/openmoss/tasks/:taskId/reviews`、`/api/openmoss/tasks/:taskId/patrol-alerts`；基线提交见 `docs/openmoss/6-wave-closeout-regression-checklist.md` 中 `710be30 feat: add openmoss governance gui`、`209c2ef feat: add governance control actions`、`5e76d90 feat: localize governance labels for L3 review`。 | - | 若继续演进，优先补治理视图的规则/解释层，不要推翻现有 dashboard / sessions / cron 页面结构。边界证据：`docs/openmoss-integration-sop.md` 关键词 `不破坏现有 dashboard/court/sessions/cron/skills`。 |
| Installer / Doctor / 交付面理解 OpenMOSS | 已吸收，但只到 phase-1。证据：`install.sh` 关键词 `FORK_DOCTOR_RAW_URL`、`resolve_doctor_script_path`、`OpenMOSS 治理层说明`；`doctor.sh` 关键词 `OPENMOSS_STATE_DIR`、`schemaVersion`、`patrol-alerts`；`docs/doctor.md` 关键词 `只读诊断`；提交可见当前分支 `9129840 feat: align installer doctor delivery surface`、`950024c chore: retarget doctor delivery to local-host-install`、`5729bf3 fix: restore install syntax after recovery cherry-pick`。 | 明确不把安装器扩大成“自动初始化 OpenMOSS”的入口。证据：`docs/openmoss/adr-002-installer-minimum-delivery-policy.md` 关键词 `install.sh 第一阶段不预创建`、`doctor.sh 只做只读检查`、`Explicit Non-Goals`。 | 保持 ADR-002，不新增预创建空目录、自动修复、自动迁移；如需继续，只能在独立 installer implementation 任务中做最小提示型变更。证据：`docs/openmoss/install-readiness-assessment.md` 关键词 `还不应直接落安装器改动`。 |
| Scoring / Reward / Leaderboard | - | 明确未吸收。证据：`docs/openmoss/adr-001-absorption-boundary.md` 关键词 `reflection scoring / leaderboard`；`docs/openmoss/6-wave-closeout-regression-checklist.md` 关键词 `reflection / scoring`；`.workflow/.analysis/.../openmoss-coverage-matrix.md` 关键词 `Scoring / leaderboard | No | None`。 | 如果后续要吸收，建议先做内部审查评分字段和 reflection 面板，不要直接上排行榜叙事。 |
| Global rules / Prompt management | - | 明确延后。证据：`docs/openmoss/adr-001-absorption-boundary.md` 关键词 `global rules / task rules`、`prompt online editing`；`docs/openmoss-integration-sop.md` 关键词 `当前 active execution 只覆盖 task core -> review/patrol -> gui control plane`。 | 优先做只读 rule layer 和 prompt diff/audit，不建议先做在线编辑；理由见 `.workflow/.analysis/ANL-openmoss-danghuangshang-compare-2026-03-16/absorption-priorities.md` 关键词 `先做“只读 + 可审计”的 rule layer`。 |
| Agent registration / Auth / Setup wizard / Planner-Executor systemization | - | 明确延后。证据：`docs/openmoss/adr-001-absorption-boundary.md` 关键词 `planner / executor 完整系统化`、`agent registration / authentication`、`setup wizard`；`.workflow/.analysis/.../openmoss-coverage-matrix.md` 关键词 `Agent registration | No | None`、`Planner role as explicit system actor | No | Low`。 | 如果目标从“治理层吸收”升级为“更完整 OpenMOSS 化”，建议顺序是：`rules layer -> reflection -> agent auth/registration -> planner/executor systemization`，最后才评估 setup wizard。证据：`.workflow/.analysis/.../openmoss-coverage-matrix.md` 关键词 `Must-Have Later`。 |

---

## Verification Notes

2026-03-18 已在本仓库完成最小验证：

- `git log --oneline -n 8 --decorate`
- `npm --prefix gui/server run test:openmoss`
- `node --check gui/server/index.js`
- `bash -n install.sh`
- `bash -n doctor.sh`
- 关键证据 `rg` 检索均通过

---

## Summary

1. `danghuangshang` 已完成 OpenMOSS 核心治理层与 phase-1 installer/doctor 交付面的闭环。
2. 它并没有完成“完整 OpenMOSS 化”，而是按 ADR 主动做了边界收敛。
3. 当前最应继续吸收的不是安装器扩写，而是 `reflection / rules / auth-registration`。
4. `install.sh` 现在的合理定位是“理解 OpenMOSS 存在”，不是“代替 OpenMOSS 初始化”。
5. 因此结论应表述为：`core governance absorbed, full absorption not closed`。
