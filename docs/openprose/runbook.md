# OpenProse Runbook（从 0 到 1）

## 1. 目的
- 在本仓库内完成 OpenProse 工作流的本地可运行验证
- 提供 smoke + demo 的一键运行方式
- 在当前技术约束下，优先验证“**频道公开回流**”模式

## 2. 你需要准备什么
- 能运行 OpenClaw 的环境（本机已安装 openclaw）
- open-prose 插件（本机 `openclaw plugins list` 显示 **OpenProse / open-prose: loaded**）
- prose skill（`openclaw skills info prose` 可查看路径与状态）

## 3. 当前推荐模式
### 3.1 为什么不用私有 transcript 回流
当前环境下，内部 transcript / tool-result 汇总会遇到：
- `sessions_history` / agent-to-agent history 限制
- `sessions_spawn(runtime=subagent)` 与 `streamTo` 的兼容问题
- 不同 OpenClaw 版本打包产物中，回流实现差异较大

因此当前推荐：
- **OpenProse 负责编排**
- **频道消息负责回流**

详见：`docs/openprose/channel-feedback.md`

## 4. 快速开始
### 4.1 Smoke
```bash
bash scripts/prose-smoke.sh
```

### 4.2 运行 demo（占位）
```bash
bash scripts/prose-run-demo.sh triage prose/fixtures/triage-input.txt
bash scripts/prose-run-demo.sh review  prose/fixtures/review-input.txt
bash scripts/prose-run-demo.sh release prose/fixtures/release-input.txt
```

## 5. 约定
### 5.1 输出格式
- 第一行给结论
- 后面用 bullet 列要点
- 能直接贴 Discord
- 不用表格

### 5.2 回流方式
当前优先采用：
- 子 agent 在当前 Discord 频道/线程**直接回帖**
- 司礼监基于公开回帖做收口

而不是：
- 父流程私下读取子 agent transcript

## 6. 排障
### 6.1 找不到 open-prose
- 运行：`openclaw plugins doctor`
- 运行：`openclaw plugins list`

### 6.2 prose 技能路径不存在
- 以 `openclaw skills info prose` 输出的 Path 为准

### 6.3 遇到 `streamTo is only supported for runtime=acp`
这说明当前 OpenClaw / OpenProse 执行路径仍在走：
- `sessions_spawn(runtime=subagent)`
- 且被工具层自动附带了 `streamTo`

当前策略：
- 不继续把 demo 建立在私有回流上
- 优先改造成“频道公开回流”模式
