# OpenMOSS Installer Implementation Entry

> Status: Active  
> Scope: 为任何未来的 OpenMOSS 安装器脚本改动提供单独任务入口，避免继续与 installer review 混做

← [返回文档索引](../README.md) | [返回安装器评审准入评估](./install-readiness-assessment.md) | [返回 ADR-002](./adr-002-installer-minimum-delivery-policy.md)

---

## 背景

当前仓库已经完成：

- OpenMOSS 6-wave 治理层收官
- installer review 第一阶段文档与 `doctor.sh` 只读检查补强
- 真实旧环境快照级 live upgrade rehearsal
- [ADR-002](/root/danghuangshang-openmoss-exec/docs/openmoss/adr-002-installer-minimum-delivery-policy.md) 对安装器最小交付策略冻结

同时，团队已明确收敛原则：

> **把 `8809807` 视为 installer review 第一阶段完成点；如果后续真的要动脚本，必须单独开 `installer implementation` 任务，不再和 review 混做。**

这份文档就是该单独任务的入口。

当前执行计划：

- [installer-implementation-plan.md](./installer-implementation-plan.md)

---

## 基线

installer implementation 任务的规划基线固定为：

- 基线提交：`8809807`
- 当前必须继承的策略：ADR-002
- 当前必须继承的验证结论：
  - [6-wave-closeout-regression-checklist.md](/root/danghuangshang-openmoss-exec/docs/openmoss/6-wave-closeout-regression-checklist.md)
  - [live-upgrade-rehearsal-2026-03-17.md](/root/danghuangshang-openmoss-exec/docs/openmoss/live-upgrade-rehearsal-2026-03-17.md)
  - [install-readiness-assessment.md](/root/danghuangshang-openmoss-exec/docs/openmoss/install-readiness-assessment.md)

说明：

- `8809807` 不是要求回退代码，而是 installer implementation 的责任边界起点
- 后续任何真正的脚本行为改动，都必须把自己视为一个新任务，而不是 review 的自然延伸

---

## 任务目标

只有在出现明确证据证明“最小提示型交付仍不足够”时，才允许开启 installer implementation。

一旦开启，目标也必须保持最小：

1. 让安装路径更容易理解 OpenMOSS 的存在
2. 不让安装器替代 OpenMOSS 运行期初始化
3. 不破坏旧环境、不污染未启用治理的环境
4. 保持脚本改动可验证、可回滚、可单独审查

---

## 分支与工作区规则

如果未来正式开启该任务，推荐流程固定为：

1. 基于当前稳定收官点新开独立 worktree
2. 在该 worktree 上新建独立分支
3. 所有脚本改动只在该分支发生
4. 未完成验证前，不回灌 `local-host-install` 或其他长期分支

推荐命名：

- worktree：`../danghuangshang-openmoss-installer-impl`
- branch：`task/openmoss-installer-implementation`

---

## 允许修改的文件

只有单独开立 installer implementation 任务后，以下文件才进入可修改候选范围：

- [install.sh](/root/danghuangshang-openmoss-exec/install.sh)
- [doctor.sh](/root/danghuangshang-openmoss-exec/doctor.sh)
- [docs/doctor.md](/root/danghuangshang-openmoss-exec/docs/doctor.md)
- [docs/host-install-migration.md](/root/danghuangshang-openmoss-exec/docs/host-install-migration.md)
- [docs/install-prompt.md](/root/danghuangshang-openmoss-exec/docs/install-prompt.md)
- 与该任务直接对应的 rehearsal / validation 文档

允许的改动类型：

- 提示型说明增强
- 只读检查增强
- 与 ADR-002 一致的最小安装路径提示
- 针对旧环境升级的验证记录补充

---

## 明确禁止的改动

即使正式开启 installer implementation，也仍然禁止：

1. 在 `install.sh` 中预创建 `~/.openclaw/state/openmoss/`
2. 在安装阶段自动写入 OpenMOSS schema 或治理默认数据
3. 在 `doctor.sh` 中增加自动修复或自动迁移
4. 把 GUI/API 的运行期初始化责任挪到安装器
5. 把新的治理模型、规则层、评分层、通知层混入该任务

这些禁止项直接受 ADR-002 约束，不因新任务开启而失效。

---

## 开始前检查

在真正开始 installer implementation 前，必须先确认：

- [ ] 需求不是“顺手再改一点脚本”
- [ ] 能明确说明为什么现有“提示 + doctor + migration 文档”仍不足够
- [ ] 改动点只涉及交付面，不回头重做治理核心
- [ ] 已准备独立 worktree / 分支
- [ ] 已定义验证方法，而不是“改完跑一下安装器看看”

---

## 完成标准

installer implementation 任务只有在以下条件同时成立时才算完成：

1. 改动严格没有越过 ADR-002 边界
2. `bash -n install.sh` 和 `bash -n doctor.sh` 通过
3. 真实旧环境或其隔离快照完成一轮增量升级验证
4. 文档明确说明“哪些能力已经进入安装路径，哪些仍留在运行期”
5. 结果能单独审查、单独回滚

---

## 当前结论

一句话结论：

> **现在可以规划 installer implementation，但只有在单独 worktree / 单独分支 / 单独任务中，才允许继续讨论任何新的脚本行为变更。**

当前任务已经在独立分支中启动，后续执行以 [installer-implementation-plan.md](./installer-implementation-plan.md) 为准。
