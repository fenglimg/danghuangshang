# OpenMOSS Installer Implementation Rehearsal 2026-03-17

> Status: Completed  
> Scope: 验证 doctor 交付来源对齐后，真实旧环境升级路径仍满足惰性创建与旧配置不破坏

← [返回文档索引](../README.md) | [返回 Implementation Plan](./installer-implementation-plan.md) | [返回 Live Upgrade Rehearsal](./live-upgrade-rehearsal-2026-03-17.md)

---

## 目标

验证在 Phase 2 完成 doctor 来源对齐后，以下结论是否仍然成立：

1. 旧配置不破坏
2. canonical doctor 入口能够正确解释 OpenMOSS state 的“未使用前可不存在”
3. 首次治理写盘后，OpenMOSS state 仍由运行期惰性创建
4. GUI 仍能在旧环境快照上读取旧系统状态并写入新治理数据

---

## 演练对象

真实旧环境基线：

- 主环境 `HOME`: `/root`
- 主环境 `~/.openclaw/state/openmoss/`：**不存在**
- 主环境 `openclaw.json` SHA-256：
  - `f7eb9333769f56ab9e054b268862eea730f4f21016bf3497ac6618f98652bafa`

本次 implementation 快照：

- 快照根目录：`/tmp/openmoss-installer-implementation-20260317T180824Z`
- 快照 `HOME`：`/tmp/openmoss-installer-implementation-20260317T180824Z/home`
- 快照 GUI：`127.0.0.1:18797`
- GUI token：`openmoss-installer-rehearsal`

说明：

- 快照重新从主环境复制，不复用已写过治理数据的旧 rehearsal 快照
- 因此这次回放可以单独验证 doctor 来源对齐后的行为，不污染主运行面

---

## 验证步骤

### 1. 建立新的旧环境快照

执行：

```bash
mkdir -p /tmp/openmoss-installer-implementation-20260317T180824Z/home
mkdir -p /tmp/openmoss-installer-implementation-20260317T180824Z/run
cp -a /root/.openclaw /tmp/openmoss-installer-implementation-20260317T180824Z/home/.openclaw
cp -a /root/clawd /tmp/openmoss-installer-implementation-20260317T180824Z/home/clawd
```

验证：

- 快照内 `openclaw.json` hash 与主环境一致
- 快照内 `state/openmoss` 初始不存在

### 2. 在未使用治理前运行 canonical doctor

执行：

```bash
env HOME=/tmp/openmoss-installer-implementation-20260317T180824Z/home \
  bash ./doctor.sh
```

关键输出：

- `未检测到 OpenMOSS state（如果尚未进入治理页或尚未创建治理任务，这属于正常情况）`
- `OpenMOSS state 目录会在 GUI/API 首次使用时惰性创建，不建议先手工创建空目录`

结论：

- doctor 来源对齐后，canonical doctor 入口能够正确解释“未使用前目录不存在”的预期

### 3. 启动 implementation worktree 下的 GUI

执行环境：

```bash
env BOLUO_AUTH_TOKEN=openmoss-installer-rehearsal \
  BOLUO_GUI_PORT=18797 \
  BOLUO_BIND_HOST=127.0.0.1 \
  HOME=/tmp/openmoss-installer-implementation-20260317T180824Z/home \
  node index.js
```

说明：

- 本次使用的是 `task/openmoss-installer-implementation` worktree 下的 GUI 代码
- 运行时通过本地依赖复用完成启动，不修改主环境

### 4. 先读旧系统状态，不触发治理写盘

访问：

```bash
curl -H 'Authorization: Bearer openmoss-installer-rehearsal' \
  http://127.0.0.1:18797/api/status
```

结果：

- 成功返回旧系统运行信息
- `botAccounts.length = 15`
- `totalSessions = 6`
- 读取后 `state/openmoss` 仍不存在

### 5. 发起治理写入并验证惰性创建

先观察到一个实现细节：

- 第一次 mutating 请求使用了非法状态 `todo`
- 请求被正确拒绝：`Unknown task status: todo`
- 但在该次 mutating 请求后，OpenMOSS state 根目录已被初始化，出现：
  - `meta/schema-version.json`
  - `indexes/tasks.json`

随后执行合法写入：

```bash
curl -X POST \
  -H 'Authorization: Bearer openmoss-installer-rehearsal' \
  -H 'Content-Type: application/json' \
  -d '{"id":"installer-implementation-rehearsal-001","title":"Installer implementation rehearsal","owner":"installer-rehearsal","status":"pending"}' \
  http://127.0.0.1:18797/api/openmoss/tasks
```

验证：

- `tasks/installer-implementation-rehearsal-001.json` 存在
- `events/installer-implementation-rehearsal-001.jsonl` 存在
- `GET /api/openmoss/tasks/installer-implementation-rehearsal-001/timeline` 返回 create 事件

结论：

- OpenMOSS state 没有在安装阶段预创建
- 它仍然是在运行期首次治理写路径上惰性出现

### 6. 再次运行 canonical doctor

执行：

```bash
env HOME=/tmp/openmoss-installer-implementation-20260317T180824Z/home \
  bash ./doctor.sh
```

关键输出：

- `OpenMOSS state 目录存在`
- `OpenMOSS schemaVersion: 1`
- `OpenMOSS tasks/ 目录存在`
- `OpenMOSS events/ 目录存在`
- `OpenMOSS 数据概览: tasks=1 events=1 reviews=0 patrol-alerts=0`
- `诊断完成：20 通过 3 警告 0 错误`

说明：

- `reviews/` 与 `patrol-alerts/` 缺失在本次仅创建 task 的前提下被标为 warning，不是 error
- 这与当前只读诊断定位一致

### 7. 配置不破坏验证

验证：

- 快照内 `openclaw.json` hash 不变
- 主环境 `/root/.openclaw/openclaw.json` hash 也不变
- 主环境 `~/.openclaw/state/openmoss/` 仍然不存在

---

## 演练结果

本次 implementation rehearsal 结果：

- [x] canonical doctor 入口已能正确解释 OpenMOSS 未使用前的空目录状态
- [x] 旧配置未被破坏
- [x] 读取旧系统状态不会预创建 `state/openmoss`
- [x] 运行期治理写入仍会惰性创建 OpenMOSS state
- [x] 写入后 doctor 能看到 schema、task、event 基础状态
- [x] 主环境未被污染

核心结果摘要：

```json
{
  "result": "ok",
  "doctorBeforeExplainsMissingState": true,
  "statusReadBeforeStateCreation": true,
  "lazyStateCreationRetained": true,
  "taskFileExists": true,
  "eventFileExists": true,
  "doctorAfterShowsSchema": true,
  "snapshotConfigHashUnchanged": true,
  "realConfigHashUnchanged": true,
  "realStateStillAbsent": true
}
```

---

## 额外观察

本次还观察到一个实现细节：

> **第一次 mutating API 请求即使因非法状态被拒绝，也会先初始化 OpenMOSS state 根目录与 schema/indexes。**

这不违反 ADR-002，因为目录仍然不是安装阶段创建，而是运行期治理写路径创建。

但它会影响一句更精细的语义表达：

- 当前更准确的说法应是：
  - **目录存在 = 至少发生过一次治理写路径初始化**
- 而不是更强的：
  - **目录存在 = 至少有过一次成功治理任务创建**

这一点当前先记录为实现观察，不在本轮 installer implementation 内继续扩 scope。

---

## 结论

一句话结论：

> **在 doctor 来源统一到当前 fork 后，OpenMOSS 仍然保持“安装不预创建、运行期惰性创建、旧配置不破坏”的升级路线，因此可以继续推进 installer implementation 的最小交付面对齐。**
