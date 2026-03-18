# ADR-002: OpenMOSS Installer Minimum Delivery Policy

> Status: Accepted  
> Date: 2026-03-17  
> Scope: Installer review convergence after 6-wave closeout and live upgrade rehearsal

← [返回文档索引](../README.md) | [返回 ADR-001](./adr-001-absorption-boundary.md)

---

## Decision

当前阶段对 OpenMOSS 的安装器交付策略冻结为：

1. **`install.sh` 第一阶段不预创建 `~/.openclaw/state/openmoss/`**
2. **OpenMOSS state 继续采用 GUI/API 首次使用时惰性创建**
3. **`doctor.sh` 只做只读检查，不承担自动修复或自动迁移**
4. **migration 文档必须明确备份、保留、惰性创建规则**
5. **在 installer policy 已冻结但尚未实装前，`install.sh` 仍可保持不变**

一句话结论：

> **先让安装器“理解 OpenMOSS 存在”，不让安装器“代替 OpenMOSS 完成初始化”。**

---

## Context

到当前为止，已有三类证据成立：

### 1. 治理层已经真实闭环

- task core / activity log / review / patrol / governance GUI 全部完成
- 6-wave 收官回归已通过

证据：

- [6-wave-closeout-regression-checklist.md](./6-wave-closeout-regression-checklist.md)

### 2. 真实旧环境快照升级已验证

已完成基于真实旧环境快照的 rehearsal，证明：

- 旧配置 hash 不变
- `state/openmoss` 在未使用治理能力前保持不存在
- 首次治理写入后可以惰性创建
- 升级 GUI 能同时读旧系统数据并写新治理数据

证据：

- [live-upgrade-rehearsal-2026-03-17.md](./live-upgrade-rehearsal-2026-03-17.md)

### 3. 当前真正未收敛的是交付策略，不是技术可行性

现在的核心问题已经不是“能不能做”，而是：

- 是否要让 `install.sh` 预创建目录
- 是否要让 `doctor.sh` 自动修复目录
- 是否要在安装阶段承诺某种默认治理状态

这正是 installer policy 应收敛的部分。

---

## Why Not Precreate The State Directory

当前不让 `install.sh` 预创建 `~/.openclaw/state/openmoss/`，原因有五个：

### 1. rehearsal 已证明惰性创建可行

OpenMOSS state 不依赖安装时初始化，首次治理写入即可稳定创建。

这意味着：

- 预创建不是功能必需项
- 不应把“可选的交付动作”误写成“必需的安装动作”

### 2. 预创建空目录会模糊“功能已启用”与“目录已存在”的边界

如果安装器无条件创建空目录，会出现两类误导：

- 用户以为 OpenMOSS 已经初始化完成
- 运维会把“空目录存在”误判成“治理层已经跑过”

当前更清晰的语义是：

- **目录存在 = 至少有过一次真实治理写入**
- **目录不存在 = 治理层尚未实际使用**

### 3. 旧环境升级时，惰性创建更安全

对于已有 `.openclaw` 的老环境：

- 不预创建空目录，能避免制造“升级痕迹”
- 不会在用户尚未进入治理页前改动其目录树
- 更符合“先验证，再写盘”的保守升级哲学

### 4. 预创建不能替代 schema/migration 设计

即使 `install.sh` 创建了目录，也并没有解决：

- schema version 策略
- migration runner
- data reconciliation

所以预创建目录并不等于真正解决安装器问题。

### 5. 当前最小交付目标是降低风险，而不是扩大承诺

当前阶段更应该做到：

- 文档说清楚
- doctor 能看见
- upgrade rehearsal 已验证

而不是在 `install.sh` 里过早写入更多责任。

---

## Minimum Delivery Surface

当前最小交付面冻结为下表：

| 面 | 当前策略 | 结论 |
|----|----------|------|
| `install.sh` | 不预创建 `state/openmoss`，不写 schema，不做迁移 | 保持不变 |
| `doctor.sh` | 只读检查目录、schema、文件数量概览 | 已允许 |
| migration 文档 | 明确 `state/openmoss` 跟随 `~/.openclaw` 备份，缺失时属正常，按需惰性创建 | 已允许 |
| install prompt | 明确不手工造空目录，优先用 doctor 验证 | 已允许 |
| GUI/API | 首次治理写入时负责真实初始化 | 已允许 |

---

## Explicit Non-Goals

以下能力明确**不属于当前 installer 最小交付面**：

1. 安装时自动创建默认治理任务
2. 安装时自动写入 OpenMOSS schema 升级补丁
3. 安装时自动迁移历史治理数据
4. `doctor.sh` 自动修复 `state/openmoss`
5. 安装时承诺“OpenMOSS 已完全启用”

---

## Consequences

### Positive

1. `install.sh` 仍然保持最小风险，不会在用户未进入治理功能前写盘
2. 旧环境升级的非破坏性边界更清晰
3. `state/openmoss` 的存在语义保持干净
4. 后续如果要真正改 `install.sh`，可以聚焦在“提示/策略”而不是“初始化/迁移”

### Negative

1. 安装后用户第一次使用治理功能时，目录会在运行期才出现
2. 有些用户会期待“安装完成后目录立刻存在”，需要靠文档和 doctor 解释清楚
3. 如果未来需要更强安装器保障，还需要再开一轮 installer implementation

---

## What This Unlocks

ADR-002 冻结后，下一阶段就不再讨论“该不该预创建目录”，而是只剩两个可执行方向：

1. **保持 `install.sh` 不变**，仅把 policy、doctor、migration 文档作为第一阶段交付
2. 如果后续确实需要改 `install.sh`，也只能做**最小提示型变更**，不能越过本 ADR 的边界

换句话说：

> **当前已经有资格规划 installer implementation，但 implementation 仍必须服从“不预创建 state/openmoss”的最小交付策略。**
