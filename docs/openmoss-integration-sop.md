# OpenMOSS 吸收开发流程 SOP

> 适用于当前仓库以 `danghuangshang` 为上游基线、以 `local-host-install` 为本地长期分支，并计划分阶段吸收 OpenMOSS 的任务治理能力的场景。

← [返回文档索引](./README.md) | [返回项目 README](../README.md)

---

## 目标

把 OpenMOSS 的优秀能力以**可回滚、可验证、可持续同步上游**的方式吸收到当前本地 fork 中，同时避免以下常见错误：

- 一开始就改 `install.sh`
- 在 `local-host-install` 上直接堆实验代码
- 把三省六部语义层和系统职责层硬耦合
- 在没有真实数据层之前先做 GUI 外壳
- 在未稳定前把实验逻辑带到现网安装路径

---

## 核心原则

1. **先分支隔离，再做功能验证**
2. **先内核，再闭环，再控制面**
3. **先增量接入，不替换现有朝廷交互**
4. **`install.sh` 属于交付面，不属于实验面**
5. **每个 phase 必须有独立成功标准和回滚点**

---

## 分支分层

### 固定分支职责

| 分支 | 职责 | 是否允许实验 |
|------|------|-------------|
| `upstream-main` | 本地镜像 `upstream/main` | ❌ |
| `local-host-install` | 本地长期运行策略、兼容说明、宿主机直装文档 | ⚠️ 只接收已验证改造 |
| `integrate/openmoss-task-core` | Task Core 集成验证 | ✅ |
| `integrate/openmoss-review-patrol` | Review / Patrol 集成验证 | ✅ |
| `integrate/openmoss-gui-control-plane` | GUI Control Plane 集成验证 | ✅ |

### 起分支规则

#### Phase 1: Task Core

默认从：

```bash
git checkout upstream-main
git checkout -b integrate/openmoss-task-core
```

原因：
- 这一阶段的目标是验证“任务治理内核”是否成立
- 应尽量脱离本地宿主机特化改动，降低噪声

#### Phase 2: Review / Patrol

默认从：

```bash
git checkout integrate/openmoss-task-core
git checkout -b integrate/openmoss-review-patrol
```

原因：
- Review / Patrol 强依赖 task core
- 不应回退到 `local-host-install` 重新开始

#### Phase 3: GUI Control Plane

默认从：

```bash
git checkout integrate/openmoss-review-patrol
git checkout -b integrate/openmoss-gui-control-plane
```

原因：
- 没有 task/review/patrol 数据时，GUI 没有真实支撑

---

## 标准开发顺序

### Phase 0: 设计冻结

开始写代码前，必须先完成：

- OpenMOSS 吸收边界 ADR
- 三省六部语义层 vs 系统职责层映射
- 一期存储方案确认
- Phase 1 的收敛标准确认

这一步对应路线图中的 `ISS-OPENMOSS-001`。

### Phase 1: Task Core

目标：
- 建立 Task / Module / WorkItem（或 SubTask）模型
- 建立状态机
- 建立 ActivityLog
- 建立最小查询/写入 API

结束标志：
- 至少一条真实工程流程能落成任务状态流
- 能查询完整事件时间线

### Phase 2: Review / Patrol

目标：
- 建立 ReviewRecord
- 建立 approve / reject / rework 分支
- 建立 blocked / timeout / patrol alert 机制

结束标志：
- 至少一条流程可被审查打回
- 至少一种超时任务可被 patrol 标记

### Phase 3: GUI Control Plane

目标：
- 新增任务面板
- 新增活动时间线
- 新增 review queue / patrol alerts 面板

结束标志：
- GUI 可展示真实任务流，而不是模拟数据

### Phase 4: 回收与交付

目标：
- 从集成分支提炼稳定变更
- 决定哪些内容回收至 `local-host-install`
- 决定哪些内容进入安装器/迁移脚本

结束标志：
- 已形成可持续升级路径
- 安装器只承载稳定能力

---

## 每个 Phase 哪些文件能动

### Phase 1: Task Core

**允许修改**
- 新增任务核心模块目录
- 新增存储抽象
- 新增后端 API
- 新增测试
- `.workflow/` 中的设计文档、roadmap、分析文件
- 少量文档，说明设计与验证方式

**原则上不动**
- `install.sh`
- 现有平台接入脚本
- 大范围改 `docs/setup-*.md`
- 现有 GUI 主结构
- `README.md` 中的安装承诺

**推荐目录**
- `gui/server/` 下新增 API 支撑层，或抽离独立服务目录
- `tests/` 或项目现有测试目录
- `docs/` 下设计文档

### Phase 2: Review / Patrol

**允许修改**
- Phase 1 引入的任务核心代码
- 审查/巡检模型与 API
- 都察院/巡检角色相关约定文档
- 测试

**原则上不动**
- `install.sh`
- 大规模 GUI 信息架构
- 默认安装模板字段

### Phase 3: GUI Control Plane

**允许修改**
- `gui/src/` 新页面
- `gui/server/index.js` 或相关 API 层
- 文档索引与 GUI 文档

**原则上不动**
- `install.sh`
- 现有渠道接入核心逻辑
- 上游同步策略文档的基本分层原则

### Phase 4: 回收与交付

**允许修改**
- `local-host-install` 中的稳定代码
- `docs/host-install-migration.md`
- `docs/install-prompt.md`
- `docs/doctor.md`
- `install.sh`
- 迁移脚本 / doctor / 初始化模板

**前提**
- 至少一个集成分支完成验证
- 数据模型和运行方式已经稳定
- 已明确老环境如何增量升级，而不只是“重装”

---

## `install.sh` 什么时候才允许改

默认情况下，**Phase 1 / 2 / 3 都不应该先改 `install.sh`**。

只有同时满足以下条件，才允许进入 `install.sh` 修改阶段：

1. 功能已经在集成分支中跑通
2. 数据模型、目录结构、默认配置项已经稳定
3. 已明确这是“长期保留能力”，不是试验性逻辑
4. 已明确老用户如何升级，不要求重装
5. 已明确新增依赖、目录初始化、doctor/migration 补丁内容

### 允许改 `install.sh` 的典型场景

- 需要安装稳定依赖
- 需要初始化新的持久化目录
- 需要生成稳定的默认配置字段
- 需要补充新的 systemd/service 启动逻辑
- 需要给 `doctor` / migration 增加稳定修复动作

### 不允许改 `install.sh` 的典型场景

- “先装上再试试看”
- 还在改模型字段名
- 还不确定是文件存储还是 SQLite
- GUI 还只是 demo
- 还不能解释老机器如何升级

---

## 安装器改动准入清单

在修改 `install.sh` 前，必须逐项确认：

- [ ] 新能力不是实验性质
- [ ] 目录结构已冻结
- [ ] 默认配置字段已冻结
- [ ] `doctor` 或 migration 路径已定义
- [ ] 现有安装用户不会被破坏
- [ ] 现有 `~/.openclaw` / `~/clawd` 升级路径明确
- [ ] 至少完成一次从旧配置到新能力的增量验证

---

## Post-Core Backlog Rule

以下能力默认**不进入当前 3 phase active execution**，除非你显式重开一轮规划：

- Global rules / task rules
- Prompt visibility / audit / editing
- Reflection / scoring
- Notification lite
- Planner / Executor systemization
- Agent auth / registration

原因：
- 这些能力要么与当前 `danghuangshang` 的组织语义和文件化身份体系存在重叠
- 要么不是当前架构最核心的缺口
- 要么会明显抬高交付复杂度，不适合和 task core 同步推进

因此 SOP 默认要求：
- 当前 active execution 只覆盖 `task core -> review/patrol -> gui control plane`
- 上述能力进入后续 backlog，再次评估后单独立项

---

## 实际交付流程

推荐采用下面的标准流水线，而不是“改完就执行 `install.sh` 重装”：

### 1. 集成分支验证

```bash
git checkout upstream-main
git checkout -b integrate/openmoss-task-core
```

执行：
- 写代码
- 写测试
- 跑本地验证
- 记录发现

### 2. 形成稳定提交

要求：
- 每个 issue 有独立提交边界
- 可以 cherry-pick
- 可以回滚

### 3. 回收至长期分支

只有通过验证的变更，才允许带回：

```bash
git checkout local-host-install
git cherry-pick <stable-commit>
```

或：

```bash
git merge integrate/openmoss-xxx
```

前提是分支边界清晰、冲突可控。

### 4. 补交付层

只有这一步，才考虑：
- `install.sh`
- migration 文档
- `doctor`
- 升级说明

### 5. 增量部署

对于已有机器，优先走：

```bash
git pull
openclaw doctor --fix --non-interactive
systemctl --user restart openclaw-gateway
```

而不是默认要求：

```bash
bash ./install.sh
```

### 6. 新机器初始化

只有新环境才默认使用：

```bash
bash ./install.sh
```

---

## 现网验证规则

### 不在主运行目录直接试验

不推荐：
- 直接在现网 `~/.openclaw` 上试新模型
- 直接覆盖 live config
- 直接改 live DB / live storage

推荐：
- 使用独立测试目录
- 使用单独 SQLite 文件或临时存储目录
- 必要时使用独立 worktree

### 推荐验证层次

1. 单元测试
2. 本地 API / 存储联调
3. 单流程端到端试点
4. 非现网灰度验证
5. 回收到长期分支
6. 最后补安装器

---

## 回滚规则

每个 Phase 都必须有可回滚点。

### Phase 1 回滚

- 删除 task core 实验代码
- 保留 ADR / roadmap / 结论文档
- 不触碰安装器

### Phase 2 回滚

- 保留 task core
- 回退 review / patrol 扩展
- 保持原有都察院消息审查流程仍能工作

### Phase 3 回滚

- 后端状态流保留
- GUI 控制面回退
- 现有 dashboard / sessions / cron / skills 页面保持可用

### 安装器回滚

如果已经进入交付层：
- 必须提供 migration 回退说明
- 必须说明哪些目录或配置字段可以安全移除

---

## 推荐的实际执行模板

### Task Core 阶段

```bash
git checkout upstream-main
git checkout -b integrate/openmoss-task-core
```

允许：
- 模型
- 存储
- API
- tests
- ADR / docs

禁止：
- `install.sh`
- 大改 GUI
- 大改平台接入

### Review / Patrol 阶段

```bash
git checkout integrate/openmoss-task-core
git checkout -b integrate/openmoss-review-patrol
```

允许：
- review / patrol 逻辑
- 状态扩展
- tests
- docs

禁止：
- `install.sh`
- 交付文档大改

### GUI Control Plane 阶段

```bash
git checkout integrate/openmoss-review-patrol
git checkout -b integrate/openmoss-gui-control-plane
```

允许：
- `gui/src/*`
- `gui/server/*`
- GUI docs

禁止：
- `install.sh`
- setup / migration 默认流程承诺
- 把 rules / prompt / notification / scoring 混进当前 GUI phase

### 交付阶段

```bash
git checkout local-host-install
git checkout -b release/openmoss-phase-1
```

允许：
- `install.sh`
- `docs/host-install-migration.md`
- `docs/install-prompt.md`
- `docs/doctor.md`
- 稳定配置模板

前提：
- 前三阶段至少一个已验证并准备长期保留

---

## 一句话准则

**先在集成分支把能力做成“可运行、可测试、可回滚”的稳定内核，再决定是否让 `install.sh` 知道它的存在。**

---

## 相关文档

- [OpenMOSS 吸收路线图](../.workflow/.roadmap/RMAP-openmoss-absorption-2026-03-16/roadmap.md)
- [OpenMOSS 对比分析](../.workflow/.analysis/ANL-openmoss-danghuangshang-compare-2026-03-16/discussion.md)
- [上游同步策略](./upstream-sync.md)
- [宿主机直装迁移指南](./host-install-migration.md)
