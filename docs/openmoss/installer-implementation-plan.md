# OpenMOSS Installer Implementation Plan

> Status: Active  
> Date: 2026-03-17  
> Branch: `task/openmoss-installer-implementation`  
> Worktree: `/root/danghuangshang-openmoss-installer-impl`

← [返回文档索引](../README.md) | [返回 Installer Entry](./installer-implementation-entry.md) | [返回 ADR-002](./adr-002-installer-minimum-delivery-policy.md)

---

## 一句话目标

在不越过 ADR-002 边界的前提下，把 OpenMOSS 的安装路径交付面做成**一致、可验证、可回滚**，而不是让安装器承担运行期初始化责任。

---

## 为什么现在要开 implementation

当前已经不是 review 阶段，而是进入了独立 worktree / 独立分支的 installer implementation 任务。

这次 implementation 不是为了扩大 scope，而是为了处理一个已经出现的交付面一致性问题：

1. [install.sh](/root/danghuangshang-openmoss-installer-impl/install.sh#L1259) 会在安装结束后下载并运行远端 `doctor.sh`
2. [install.sh](/root/danghuangshang-openmoss-installer-impl/install.sh#L1261) 当前下载地址仍指向 `wanikua/danghuangshang/main`
3. [docs/doctor.md](/root/danghuangshang-openmoss-installer-impl/docs/doctor.md#L12) 的一键命令也仍指向 `wanikua/danghuangshang/main/doctor.sh`
4. 但当前 fork 已经在本仓库的 [doctor.sh](/root/danghuangshang-openmoss-installer-impl/doctor.sh#L680) 中加入 OpenMOSS 状态检查
5. migration / install prompt 文档已经开始依赖这些 OpenMOSS 检查结论：
   - [host-install-migration.md](/root/danghuangshang-openmoss-installer-impl/docs/host-install-migration.md#L224)
   - [install-prompt.md](/root/danghuangshang-openmoss-installer-impl/docs/install-prompt.md#L129)

因此，当前最需要解决的不是“要不要预创建 `state/openmoss`”，而是：

> **安装入口、诊断脚本、迁移文档是否在指向同一套交付能力。**

---

## 继承约束

本计划必须无条件继承以下边界：

1. [ADR-002](./adr-002-installer-minimum-delivery-policy.md)
2. [installer-implementation-entry.md](./installer-implementation-entry.md)
3. [install-readiness-assessment.md](./install-readiness-assessment.md)
4. [live-upgrade-rehearsal-2026-03-17.md](./live-upgrade-rehearsal-2026-03-17.md)

其中最关键的硬约束是：

- 不预创建 `~/.openclaw/state/openmoss/`
- 不把 GUI/API 的惰性初始化责任搬进 `install.sh`
- `doctor.sh` 仍然只做只读检查
- 不引入 schema migration runner
- 不把规则层、评分层、通知层混入本任务

---

## 当前问题拆解

### P1. `doctor.sh` 来源存在分叉风险

当前风险：

- 安装器和文档都在让用户相信“跑 `doctor.sh` 就能看见 OpenMOSS 状态”
- 但它们引用的远端脚本来源还是上游仓库
- 上游脚本未必包含当前 fork 的 OpenMOSS 检查

这会导致：

- 安装路径说明和真实执行结果不一致
- migration 文档说得通，但安装后的自检可能看不到 OpenMOSS
- 后续 L3 / rehearsal 验证无法稳定复现

### P2. 当前 `install.sh` 已有提示，但还没有“交付面一致性”闭环

当前已具备：

- 安装结束提示中已经说明 OpenMOSS state 是惰性创建
- 已提示用户先跑 `doctor.sh`

当前仍缺：

- `install.sh` 到底应该执行哪一份 `doctor.sh`
- 文档的一键命令是否应该与安装器保持一致
- 这一致性改动是否已经经过真实旧环境验证

### P3. implementation 验证对象必须收窄

本次 implementation 不能再回到“大而全”的方向。

本次只应验证：

1. 安装入口是否指向正确的只读诊断能力
2. 诊断输出是否与 OpenMOSS 当前实际能力一致
3. 旧环境升级后是否仍保持“未使用前目录不存在，使用后惰性创建”

---

## Phase 1 Audit Result

> Audit Date: 2026-03-17

### 交付入口盘点

当前会把用户导向 `doctor.sh` 的入口共有五类：

1. [install.sh](/root/danghuangshang-openmoss-installer-impl/install.sh#L1255)
   - 安装结束后自动下载并执行 `doctor.sh`
   - 当前下载源：`https://raw.githubusercontent.com/wanikua/danghuangshang/main/doctor.sh`
2. [docs/doctor.md](/root/danghuangshang-openmoss-installer-impl/docs/doctor.md#L12)
   - 一键命令仍指向 upstream raw `doctor.sh`
3. [README.md](/root/danghuangshang-openmoss-installer-impl/README.md#L91)
   - 首页快捷诊断命令仍指向 upstream raw `doctor.sh`
4. [README_EN.md](/root/danghuangshang-openmoss-installer-impl/README_EN.md#L36)
   - 英文首页快捷诊断命令仍指向 upstream raw `doctor.sh`
5. 本仓库内的本地执行路径
   - `bash ./doctor.sh`
   - migration / install prompt 文档已开始默认依赖这一路径：
     - [host-install-migration.md](/root/danghuangshang-openmoss-installer-impl/docs/host-install-migration.md#L224)
     - [install-prompt.md](/root/danghuangshang-openmoss-installer-impl/docs/install-prompt.md#L129)

### fork 与 upstream 的实际差异

当前 fork 的 [doctor.sh](/root/danghuangshang-openmoss-installer-impl/doctor.sh#L680) 已增加：

- OpenMOSS state 目录存在性检查
- `meta/schema-version.json` 读取
- `tasks/events/reviews/patrol-alerts` 目录检查
- OpenMOSS 文件数量概览
- “目录不存在也可能正常”的惰性创建说明

而 `upstream/main:doctor.sh` 当前仍停留在：

- 工作区检查后直接进入可选集成与服务检查
- 不包含任何 OpenMOSS / `state/openmoss` / `schema-version` / `patrol-alerts` 相关逻辑

这意味着：

> **upstream raw `doctor.sh` 不是当前 fork 的 OpenMOSS-aware doctor。**

### canonical doctor 来源结论

Phase 1 结论如下：

1. **canonical doctor implementation source 必须是当前 fork 仓库内的 `doctor.sh`**
2. 对用户的任何 OpenMOSS 诊断承诺，都不能再默认指向 upstream raw `doctor.sh`
3. `openclaw doctor` 仍然有价值，但它不是 OpenMOSS state 只读检查的替代物

更具体地说：

- 对于仓库内运行路径，canonical 入口应优先是 `bash ./doctor.sh`
- 对于远程一键命令，如果仍然保留 curl 方案，也必须指向当前 fork 的交付源，而不是 upstream

### 是否必须修改 `install.sh`

Phase 1 的判断结果是：**必须修改 `install.sh`。**

原因不是为了扩大安装器职责，而是为了消除“承诺与实现不一致”：

1. `install.sh` 现在会在结束后自动运行 upstream raw `doctor.sh`
2. 但安装提示已经要求用户用 `doctor.sh` 理解 OpenMOSS 状态
3. migration / prompt / doctor 文档也已经依赖 fork 版 OpenMOSS 检查
4. 如果不改 `install.sh`，安装后的自检结果与文档承诺会持续分叉

因此，Phase 2 的最小对齐已经有明确必要性。

### 伴随必须一起对齐的文件

根据本次 audit，后续最小对齐不应只改 `install.sh`，还至少应一起检查：

1. [docs/doctor.md](/root/danghuangshang-openmoss-installer-impl/docs/doctor.md)
2. [README.md](/root/danghuangshang-openmoss-installer-impl/README.md)
3. [README_EN.md](/root/danghuangshang-openmoss-installer-impl/README_EN.md)

原因很简单：

- 这几处都在直接暴露 `doctor.sh` 的入口
- 如果只改 `install.sh`，用户仍可能从 README 拿到 upstream 版本的 doctor

---

## 执行阶段

### Phase 1. Delivery Surface Audit

目标：

- 盘点所有安装路径里会触达 `doctor.sh` 的入口
- 选定唯一的 canonical doctor 来源
- 判断是否真的需要修改 `install.sh`

检查范围：

- [install.sh](/root/danghuangshang-openmoss-installer-impl/install.sh)
- [doctor.sh](/root/danghuangshang-openmoss-installer-impl/doctor.sh)
- [docs/doctor.md](/root/danghuangshang-openmoss-installer-impl/docs/doctor.md)
- [docs/host-install-migration.md](/root/danghuangshang-openmoss-installer-impl/docs/host-install-migration.md)
- [docs/install-prompt.md](/root/danghuangshang-openmoss-installer-impl/docs/install-prompt.md)

验收标准：

1. 明确写出 canonical doctor 来源
2. 明确写出哪些文件必须一起改，哪些不该改
3. 如果发现现状已足够，也要把“不改脚本”的理由写清楚

### Phase 2. Minimal Delivery Alignment

目标：

- 只在 Phase 1 证明存在交付面不一致时，做最小脚本/文档对齐

允许的候选改动：

1. 调整 `install.sh` 末尾 `doctor.sh` 的获取或调用方式
2. 调整 `docs/doctor.md` 的一键命令来源
3. 调整文档中的验证顺序，让安装器、doctor、migration 叙事一致

明确禁止：

1. 新增 OpenMOSS 目录初始化逻辑
2. 在安装阶段生成 schema-version 文件
3. 在 `doctor.sh` 中加入自动修复
4. 引入任何历史治理数据迁移动作

验收标准：

1. `install.sh`、`docs/doctor.md`、migration 文档指向同一套诊断能力
2. 文案不会暗示“安装后 OpenMOSS 已初始化”
3. `bash -n install.sh` 和 `bash -n doctor.sh` 通过

### Phase 3. Live Upgrade Rehearsal Replay

目标：

- 基于真实旧环境或隔离快照，验证最终 implementation 没有破坏 ADR-002 路线

最少验证项：

1. 旧配置 hash 不变
2. 安装后、未进入治理功能前，`state/openmoss` 仍可不存在
3. 运行 `doctor.sh` 时，输出与当前实现一致
4. 首次治理写入后，目录和 schema 仍由运行期惰性创建

产物：

- 一份新的 implementation 级 rehearsal / validation 文档
  - [installer-implementation-rehearsal-2026-03-17.md](./installer-implementation-rehearsal-2026-03-17.md)

### Phase 4. Merge Gate

目标：

- 只有在前 3 个阶段都收敛后，才允许讨论回收进长期分支

准入门：

1. 改动范围只落在 installer 交付面
2. 没有越过 ADR-002 的禁止项
3. 真实验证记录已补齐
4. 可以单独审查、单独回滚

---

## Phase 4 Merge Gate Result

> Gate Date: 2026-03-17

### Gate 1. 范围是否仍然只落在 installer 交付面

结论：**通过**

当前改动范围只包含：

- [install.sh](/root/danghuangshang-openmoss-installer-impl/install.sh)
- [docs/doctor.md](/root/danghuangshang-openmoss-installer-impl/docs/doctor.md)
- [README.md](/root/danghuangshang-openmoss-installer-impl/README.md)
- [README_EN.md](/root/danghuangshang-openmoss-installer-impl/README_EN.md)
- implementation 入口 / 计划 / rehearsal 文档

未涉及：

- task core / review / patrol / GUI 模型变更
- schema migration engine
- rules / scoring / notifications

### Gate 2. 是否越过 ADR-002

结论：**通过**

本批改动没有出现：

- `install.sh` 预创建 `~/.openclaw/state/openmoss/`
- 安装阶段写入 OpenMOSS schema 或默认治理数据
- `doctor.sh` 自动修复 / 自动迁移
- 将运行期初始化责任转移到安装器

### Gate 3. 验证是否充足

结论：**通过**

已具备的验证证据：

1. `bash -n install.sh`
2. `bash -n doctor.sh`
3. [installer-implementation-rehearsal-2026-03-17.md](./installer-implementation-rehearsal-2026-03-17.md)

该 rehearsal 已证明：

- doctor 来源对齐后，未使用治理前的空目录语义仍被正确解释
- 读取旧系统状态不会预创建 OpenMOSS state
- 首次治理写入后仍为运行期惰性创建
- 快照与真实主环境配置均未被破坏

### Gate 4. 是否已经适合作为长期分支候选回收

结论：**通过**

此前唯一的阻塞点是：

- [install.sh](/root/danghuangshang-openmoss-installer-impl/install.sh#L27)
- [docs/doctor.md](/root/danghuangshang-openmoss-installer-impl/docs/doctor.md#L12)
- [README.md](/root/danghuangshang-openmoss-installer-impl/README.md#L91)
- [README_EN.md](/root/danghuangshang-openmoss-installer-impl/README_EN.md#L36)

这些入口此前都把远程 doctor 来源固定为：

```text
https://raw.githubusercontent.com/fenglimg/danghuangshang/integrate/local-host-install-openmoss/doctor.sh
```

现在已收口为最终长期分支来源：

```text
https://raw.githubusercontent.com/fenglimg/danghuangshang/local-host-install/doctor.sh
```

这意味着：

- 本地仓库执行路径仍优先走 `bash ./doctor.sh`
- 远程 fallback 已不再依赖中间集成分支
- 当前这批改动已经满足“ready for long-branch recovery”的交付稳定性要求

因此当前 gate verdict 更新为：

> **这批改动已经达到“可提交、可审查、可作为 installer implementation 第一批候选、并可准备回收到长期分支”的标准。**

---

## 当前推荐的第一批执行项

按当前证据，第一批最值得执行的是：

1. 核对 `install.sh` 自动下载的 `doctor.sh` 是否必须从当前 fork 获取，而不是继续指向 upstream
2. 核对 [docs/doctor.md](/root/danghuangshang-openmoss-installer-impl/docs/doctor.md) 的 curl 命令是否也应同步
3. 如果 1 和 2 成立，再做最小对齐改动
4. 做一轮 implementation 级 rehearsal，证明对齐后仍满足惰性创建策略

这也是本计划优先级最高的一段，因为它直接决定：

> **安装后用户运行的到底是不是“理解 OpenMOSS 的 doctor”。**

---

## 暂不进入本计划的能力

以下内容即使有价值，也不在本轮 implementation 内：

1. schema migration engine
2. `doctor.sh` 自动修复
3. `install.sh` 自动初始化 OpenMOSS 目录
4. GUI 治理默认任务种子数据
5. rules / scoring / prompt audit / notifications

---

## 完成定义

本计划完成时，应同时满足：

1. 已选定并落地统一的 doctor 交付来源
2. 安装提示、doctor 命令、迁移文档三者一致
3. 没有引入任何违反 ADR-002 的行为
4. 已完成一轮 implementation 级 live upgrade rehearsal
5. 结果可以安全回收到长期分支，而不依赖当前临时 worktree

---

## 当前结论

一句话结论：

> **本轮 installer implementation 应优先解决“doctor 来源与交付叙事一致性”，而不是扩展安装器职责。**
