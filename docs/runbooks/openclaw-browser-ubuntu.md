# OpenClaw 浏览器能力（Ubuntu 24.04）安装/配置/验收 Runbook

目标：让 OpenClaw 的 `browser` 工具在无显示器的 Ubuntu 服务器上**稳定可用**（截图、自动化、打开受 JS 影响的页面等）。

结论（推荐）：使用 **Google Chrome Stable（deb 安装）** 作为标准浏览器二进制。

---

## 0) 什么时候需要装浏览器？

建议安装（满足任一条）：
- 需要 `browser` 截图/自动化交互
- 需要打开登录态页面（后台/控制台）
- `web_fetch` 经常遇到 403 / “Just a moment …” / JS 渲染页

可以不装：
- 仅做信息检索（search-layer / web_fetch），不需要截图和交互

---

## 1) 现状检查（先跑一遍）

```bash
. /etc/os-release
echo "$ID $VERSION_ID"

which google-chrome || true
which chromium || true
which chromium-browser || true
```

> 备注：Ubuntu 上的 snap chromium 在服务器环境里常见缺依赖/兼容问题，不建议作为 OpenClaw 标准依赖。

---

## 2) 安装 Google Chrome Stable（deb）

```bash
sudo apt update
sudo apt install -y wget ca-certificates

wget -O /tmp/google-chrome-stable_current_amd64.deb \
  https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb

sudo apt install -y /tmp/google-chrome-stable_current_amd64.deb

# 中文字体（避免中文 tofu 方块）
sudo apt install -y fonts-noto-cjk

google-chrome --version
which google-chrome
```

---

## 3) OpenClaw 配置建议（无头 + root 场景）

> 说明：服务器无显示器 → 需要 headless。
> root 运行时 Chrome 可能因沙盒限制无法启动 → 通常需要 noSandbox。

### 3.1 配置项（建议值）

- `browser.defaultProfile`: `"openclaw"`
- `browser.headless`: `true`
- `browser.noSandbox`: `true`（如果你改为非 root 运行，可再评估是否关闭）
- `browser.executablePath`: `$(which google-chrome)`

### 3.2 配置方式（二选一）

**方式 A：命令式（方便但容易漏）**

```bash
openclaw config set browser.defaultProfile "openclaw"
openclaw config set browser.headless true
openclaw config set browser.noSandbox true
openclaw config set browser.executablePath "$(which google-chrome)"
openclaw gateway restart
```

**方式 B：声明式（推荐，便于回滚/审计）**

直接在 `openclaw.json` 里加 `browser` 子树（用 gateway config.patch 也可）。

---

## 4) 启动与验收

```bash
# 启动浏览器服务（若使用 OpenClaw 独立 profile）
openclaw browser start
```

验收建议（最小闭环）：
- 用 `browser` 工具打开一个网页并截图
- 或让 agent 执行一次“打开搜索页 + 截图”的工具调用

---

## 5) 常见问题

### Q1：为什么不推荐 snap chromium？
- 服务器/极简环境经常缺 `xdg-utils` 等组件
- snap 本身的沙盒/挂载路径会带来更多不可控变量
- 对自动化/稳定性不友好

### Q2：noSandbox 风险是什么？
- 浏览器进程隔离弱化
- 建议只对可信目标使用，并保持系统有快照/备份与最小权限

---

## 6) 回滚/卸载（可选）

```bash
sudo apt remove -y google-chrome-stable
sudo apt autoremove -y
```
