# 宿主机直装迁移指南

> 适用于**当前已经在 Docker 或历史 `.openclaw` 目录中运行 OpenClaw**，现在希望切换为 `danghuangshang/install.sh` 宿主机直装路径的场景。

← [返回文档索引](./README.md) | [返回项目 README](../README.md)

---

## 目标

把现有运行面从：

- Docker 中的 OpenClaw
- 历史 `.openclaw` 目录
- 混合式宿主机/容器运行

切换为：

- 宿主机直接安装的 `openclaw`
- `~/clawd` 工作区
- `~/.openclaw` 配置目录
- `systemctl --user` 管理的 `openclaw-gateway`

---

## 总原则

1. **先备份，再切换**
2. **先停旧运行面，再创建新路径**
3. **以 `install.sh` 生成的结构为基线**
4. **只从旧配置回填真实运行必需值**：provider、API Key、现有 bot token、gateway token、现有 guild/channel 约束
5. **不要把旧 runtime 的混合 patch 整包搬回来**

---

## 推荐步骤

### 1. 备份当前运行目录

```bash
TS="$(date -u +%Y%m%dT%H%M%SZ)"
cp -a ~/.openclaw "$HOME/.openclaw.backup-host-install-$TS"
cp -a ~/clawd "$HOME/clawd.backup-host-install-$TS"
```

如果你希望把“当前 live 目录本身”直接退役为 legacy，也可以在停服务后执行：

```bash
mv ~/.openclaw "$HOME/.openclaw.legacy-active-$TS"
mv ~/clawd "$HOME/clawd.legacy-active-$TS"
```

---

### 2. 停掉 Docker 运行面

如果你当前是单容器：

```bash
docker stop openclaw
```

如果你是 compose：

```bash
cd /path/to/docker-stack
docker compose stop openclaw
```

确认 18789 端口不再由容器提供：

```bash
docker ps --format '{{.Names}} {{.Status}}' | grep '^openclaw ' || true
```

---

### 3. 在宿主机执行 `install.sh`

推荐直接在项目仓库内执行，确保脚本版本固定：

```bash
cd ~/danghuangshang
bash ./install.sh
```

如果你是一次性试跑，也可以：

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/wanikua/danghuangshang/main/install.sh)
```

注意：

- `install.sh` 只会在 `~/.openclaw/openclaw.json` **不存在**时写入模板
- 所以如果你想严格走模板初始化，必须先把旧 `~/.openclaw` 挪走

---

### 4. 回填旧配置中的真实运行值

建议保留 `install.sh` 生成的结构，只回填：

- `models.providers`
- `gateway`
- 已有 Discord/飞书账号 token
- 已有 guild / channel allowlist 或 mention 策略
- 你已经验证过可用的 `model.primary`

不建议整份覆盖回旧配置，因为那样会把历史运行面的耦合和 patch 一起带回来。

---

### 5. 用 doctor 清理当前 CLI 不支持的字段

```bash
openclaw doctor --fix --non-interactive
```

如果当前 CLI 版本较新，你仍然可能看到一些模板字段不被接受，例如：

- `runTimeoutSeconds`
- `subagents.maxConcurrent`
- `applicationId`

这些字段不是迁移失败，而是**模板版本与当前 CLI schema 暂未完全对齐**。在宿主机直装路径下，应以当前 CLI 可接受的配置为准。

---

### 6. 启动宿主机 Gateway

```bash
systemctl --user restart openclaw-gateway
systemctl --user status openclaw-gateway --no-pager
openclaw gateway health
openclaw gateway status
```

---

## 迁移后检查清单

- `which openclaw` 指向宿主机安装路径
- `openclaw --version` 正常
- `systemctl --user status openclaw-gateway` 为 `active (running)`
- `openclaw gateway health` 返回 `OK`
- 18789 端口由宿主机服务提供，而不是 Docker 容器
- `~/.openclaw/openclaw.json` 已经替换为宿主机直装后的 live config
- 旧 `.openclaw` / `clawd` 已有 timestamped backup

---

## 常见问题

### 1. `install.sh` 提示 `openclaw` 已存在，安装失败

这是因为机器上原先已有全局 `openclaw` 命令，脚本的全局安装没有覆盖处理。

先手动装官方 CLI：

```bash
npm install -g openclaw --force --loglevel=error
```

然后重新执行：

```bash
cd ~/danghuangshang
bash ./install.sh
```

### 2. `doctor` 提示 service 使用版本管理器里的 Node

这通常出现在 `nvm/fnm/volta` 环境下。短期不影响运行，但后续 Node 版本切换后可能导致 systemd 服务指向失效。

可选处理：

- 保持当前版本管理器路径不变
- 或改成系统级 Node + 重新安装 `openclaw`

### 3. 迁移后只有部分 bot 能登录

说明你只回填了现有 token，而没有补齐其余部门 bot。这不影响宿主机直装本身成功，只说明 **bot fleet 仍未完全补齐**。

---

## 相关文档

- [安装提示词](./install-prompt.md)
- [上游同步策略](./upstream-sync.md)
- [配置诊断](./doctor.md)
