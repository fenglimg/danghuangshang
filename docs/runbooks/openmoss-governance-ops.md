# OpenMOSS Governance — Ops Runbook

本页用于“运维/验收/回滚”OpenMOSS 治理闭环能力（task/review/patrol/activity-log），确保功能可重复验证、数据可持久化、可备份。

> 适用仓库：`danghuangshang`

---

## 0. 关键约定

### 数据目录（持久化）
默认写入：
- `~/.openclaw/state/openmoss`

可通过环境变量迁移/隔离：
- `OPENMOSS_STATE_DIR=/path/to/openmoss-state`

> 注意：治理数据 **不应** 写进 repo；升级/安装脚本 **不得** 覆盖/删除该目录。

### GUI Server 地址
默认：
- `http://127.0.0.1:18795`

可通过环境变量：
- `BOLUO_GUI_PORT=...`

### 认证
GUI Server 通过：
- `BOLUO_AUTH_TOKEN`

完成 API 认证。

---

## 1) 备份 OpenMOSS 状态（强烈建议）

脚本：
- `scripts/openmoss-backup.sh`

用法：

```bash
# 默认备份 ~/.openclaw/state/openmoss -> ~/.openclaw/backup/openmoss-state-<ts>.tgz
./scripts/openmoss-backup.sh

# 指定 state dir（例如把数据放在 /data）
OPENMOSS_STATE_DIR=/data/openmoss-state ./scripts/openmoss-backup.sh

# 指定备份输出目录
OPENMOSS_BACKUP_DIR=$HOME/backups ./scripts/openmoss-backup.sh
```

---

## 2) 一键验收治理闭环（Closed-loop Demo）

脚本：
- `scripts/openmoss-closed-loop-demo.mjs`

该脚本会跑通以下闭环路径：
- create → claim → submit → review(reject) → claim → patrol block → claim(recover+resolve alert) → submit → review(approve)

用法（推荐使用参数方式，避免在 shell history 里残留 token）：

```bash
node scripts/openmoss-closed-loop-demo.mjs \
  --baseUrl https://console.example.xyz \
  --token "$BOLUO_AUTH_TOKEN"
```

也支持环境变量：

```bash
export OPENMOSS_GUI_URL=https://console.example.xyz
export BOLUO_AUTH_TOKEN=***
node scripts/openmoss-closed-loop-demo.mjs
```

成功标志（脚本输出 Summary）：
- `status: done`
- `reviewsTotal >= 2`（reject + approve）
- `alertsTotal >= 1` 且 `openAlerts: 0`
- `queueTotal: 0`

---

## 3) 常见问题

### 401 Unauthorized
- 确认 `BOLUO_AUTH_TOKEN` 与 GUI server 启动时一致。

### Patrol scan 不触发 block
- demo 脚本已使用 `thresholdMinutes=0` 并将 `now` 设置到未来时间；若仍不触发，检查 server 端对 staleMinutes 的计算逻辑是否有变更。

---

## 4) 回滚/恢复（数据级）

- 如果是代码回滚：用 Git revert/checkout。
- 如果是治理数据损坏：优先使用你在 **1)** 生成的 `openmoss-state-<ts>.tgz` 恢复。

示例（恢复到默认目录）：

```bash
# 停止 GUI server 后再操作
rm -rf ~/.openclaw/state/openmoss
mkdir -p ~/.openclaw/state

tar -C ~/.openclaw/state -xzf ~/.openclaw/backup/openmoss-state-<ts>.tgz
```
