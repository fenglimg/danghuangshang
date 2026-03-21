# OpenMOSS Live Upgrade Rehearsal 2026-03-17

> Status: Completed  
> Scope: 基于真实旧环境快照验证 OpenMOSS 治理层接入不会破坏现有运行面

← [返回文档索引](../README.md) | [返回安装器评审准入评估](./install-readiness-assessment.md)

---

## 目标

验证以下三件事是否同时成立：

1. 旧配置不破坏
2. `~/.openclaw/state/openmoss/` 在未使用治理能力前保持不存在，使用后惰性创建
3. 升级后的 GUI 能同时读取旧系统运行数据，并写入新的治理数据

---

## 演练对象

真实旧环境基线：

- `HOME`: `/root`
- 配置目录：`/root/.openclaw`
- 工作区：`/root/clawd`
- Gateway 状态：`systemctl --user is-active openclaw-gateway -> active`
- 演练前 `~/.openclaw/state/openmoss/`：**不存在**
- `openclaw.json` SHA-256：
  - `f7eb9333769f56ab9e054b268862eea730f4f21016bf3497ac6618f98652bafa`

隔离演练快照：

- 快照根目录：`/tmp/openmoss-live-upgrade-20260317T162418Z`
- 快照 HOME：`/tmp/openmoss-live-upgrade-20260317T162418Z/home`
- 演练 GUI：`127.0.0.1:18796`

说明：

- 演练基于真实旧环境的完整快照进行
- 不直接在主运行面的 `HOME=/root` 上写入治理数据
- 因此本次 rehearsal 可以验证升级路径，但不会污染主环境

---

## 验证步骤

### 1. 基线采样

确认：

- `/root/.openclaw` 存在
- `/root/clawd` 存在
- `/root/.openclaw/state/openmoss/` 不存在
- `openclaw-gateway` 为 `active`

### 2. 建立真实旧环境快照

执行：

```bash
mkdir -p /tmp/openmoss-live-upgrade-20260317T162418Z/home
cp -a /root/.openclaw /tmp/openmoss-live-upgrade-20260317T162418Z/home/.openclaw
cp -a /root/clawd /tmp/openmoss-live-upgrade-20260317T162418Z/home/clawd
```

结果：

- 快照中的 `openclaw.json` hash 与真实环境一致
- 快照中的 `state/openmoss` 仍不存在

### 3. 启动升级后 GUI

执行：

```bash
cd /root/.openclaw/workspace/_repos/danghuangshang/gui/server
env BOLUO_AUTH_TOKEN=openmoss-rehearsal-token \
  BOLUO_GUI_PORT=18796 \
  BOLUO_BIND_HOST=127.0.0.1 \
  HOME=/tmp/openmoss-live-upgrade-20260317T162418Z/home \
  node index.js
```

### 4. 先访问旧系统接口，不触发治理写入

访问：

- `GET /api/status`

验证：

- 成功返回旧系统运行信息
- `botAccounts.length = 15`
- `totalSessions = 6`
- 在只读访问后，`state/openmoss` 仍不存在

### 5. 首次使用治理写入，验证惰性创建

执行：

- `POST /api/openmoss/tasks`

写入任务：

- `live-upgrade-rehearsal-001`

验证：

- `~/.openclaw/state/openmoss/` 在首次治理写入后创建成功
- `meta/schema-version.json` 存在
- `tasks/live-upgrade-rehearsal-001.json` 存在
- `events/live-upgrade-rehearsal-001.jsonl` 存在
- `GET /api/openmoss/tasks` 能看到新任务
- `GET /api/openmoss/tasks/live-upgrade-rehearsal-001/timeline` 能看到事件

### 6. 配置不破坏验证

验证：

- 快照内 `openclaw.json` hash 未变化
- 真实环境 `/root/.openclaw/openclaw.json` hash 也未变化

---

## 演练结果

本次 rehearsal 结果：

- [x] 旧配置不破坏
- [x] `state/openmoss` 在未使用治理能力前保持不存在
- [x] 首次治理写入后 `state/openmoss` 惰性创建成功
- [x] 升级后的 GUI 能读取旧系统运行数据
- [x] 升级后的 GUI 能写入新的治理数据

核心结果摘要：

```json
{
  "result": "ok",
  "legacyBotAccounts": 15,
  "totalSessions": 6,
  "stateCreated": true,
  "schemaExists": true,
  "taskFileExists": true,
  "eventFileExists": true,
  "snapshotConfigHashUnchanged": true,
  "realConfigHashUnchanged": true
}
```

---

## 结论

这次 live upgrade rehearsal 证明了：

> **OpenMOSS 治理层可以基于真实旧环境快照非破坏接入，不会在未使用时提前污染旧环境，并能在首次治理写入时完成惰性初始化。**

但这还不等于可以直接改 `install.sh`。

到当前为止，`install.sh` 的最小交付策略已经由 [ADR-002](./adr-002-installer-minimum-delivery-policy.md) 冻结。

当前剩下的，不再是“要不要先定 policy”，而是：

1. 是否真的存在证据证明需要进一步 installer implementation
2. 如果需要，是否能在不越过 ADR-002 的前提下单独开任务执行
3. 是否能基于单独脚本改动再做一轮 implementation 级验证

因此，这份 rehearsal 的结论应被理解为：

> **它证明了治理层接入和惰性创建路线可行，但任何新的脚本行为变更仍必须作为独立 installer implementation 任务推进。**
