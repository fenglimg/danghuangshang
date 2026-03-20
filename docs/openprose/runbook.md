# OpenProse Runbook（从 0 到 1）

## 1. 目的
- 在本仓库内完成 OpenProse 工作流的本地可运行验证
- 提供 smoke + demo 的一键运行方式

## 2. 你需要准备什么
- 能运行 OpenClaw 的环境（本机已安装 openclaw）
- open-prose 插件（本机 `openclaw plugins list` 显示 **OpenProse / open-prose: loaded**）
- prose skill（`openclaw skills info prose` 可查看路径与状态）

## 3. 快速开始
### 3.1 Smoke
```bash
bash scripts/prose-smoke.sh
```

### 3.2 运行 demo（占位）
> demo 的脚本入口会在确定“prose 命令的实际执行方式”后补齐。

```bash
bash scripts/prose-run-demo.sh triage prose/fixtures/triage-input.txt
bash scripts/prose-run-demo.sh review  prose/fixtures/review-input.txt
bash scripts/prose-run-demo.sh release prose/fixtures/release-input.txt
```

## 4. 如何定位 prose 的可运行入口（M1 关键）
本机已确认：
- `openclaw plugins list`：OpenProse(open-prose) 为 loaded
- `openclaw skills info prose`：skill 为 Ready

下一步需要确定：在当前 OpenClaw 版本里，是否存在可直接运行的 CLI（例如 `openclaw prose ...` 或 `prose ...`），或需要通过 OpenClaw 的 agent turn 来触发。

建议执行并记录输出：
```bash
openclaw plugins info open-prose
openclaw skills info prose
openclaw help | grep -i prose -n || true
```

## 5. 排障
### 5.1 找不到 open-prose
- 运行：`openclaw plugins doctor`
- 运行：`openclaw plugins list`

### 5.2 prose 技能路径不存在
- 以 `openclaw skills info prose` 输出的 Path 为准

