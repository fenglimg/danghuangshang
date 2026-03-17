# OpenClaw hotfix: message(action=send) poll false-positive + empty components

## 症状
- 使用 message tool `action=send` 发送普通文本时，被 OpenClaw 拦截并报错：
  - `Poll fields require action "poll"; use action "poll" instead of "send".`

## 根因
- 某些 tool-call 适配器会在 `message.send` 请求里注入默认空字段，例如：
  - `pollQuestion: ""`
  - `pollOption: []`
  - `pollDurationHours: 0`
  - `components.modal.fields: []`
- OpenClaw 在 `hasPollCreationParams()` 中把 `pollDurationHours: 0` 也当成“创建投票意图”，从而拒绝 `send`。

## 上游状态
- Issue: https://github.com/openclaw/openclaw/issues/48928
- PR: https://github.com/openclaw/openclaw/pull/40431 （截至 2026-03-17：open，未合并）

## 本项目的临时修复（可选，默认关闭）
脚本：`scripts/openclaw-hotfix-message-send.sh`

修复内容：
1) 将 poll-intent 检测改为：仅当数值/数值字符串 `> 0` 时才算 poll intent（与 PR #40431 一致）
2) 清理空的 `components` 结构（例如 `components.modal.fields: []`），避免 strict 校验报错

启用方式：
- 在安装后执行：
  - `DANGHUANGSHANG_OPENCLAW_HOTFIX_MESSAGE_SEND=1 ./install.sh`
  - 或者手动：`./scripts/openclaw-hotfix-message-send.sh`

生效方式：
- 打补丁后需要重启 gateway：
  - `openclaw gateway restart`

回滚：
- 还原脚本自动创建的备份文件：
  - `.../dist/reply-*.js.bak.danghuangshang.YYYYMMDDHHMMSS`
- 覆盖回去后重启 gateway。
