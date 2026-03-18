# Codex TUI 使用要点（OpenClaw 环境）

适用场景：你需要进入 Codex 的全屏 TUI（交互界面）去 `resume` 一个 session、查看/继续执行任务。

## 1) 核心结论（最容易踩坑的点）

- **`codex resume` 需要 TTY**：没有 TTY 会报 `Error: stdin is not a terminal`。
  - 在 OpenClaw 里：
    - 用 `exec` 跑命令时要 `pty:true`（否则就是无 TTY）。
- **TUI 里要按 Enter 才会“真正执行”**：你把指令发进会话后，如果不 `Enter`，经常只是停在输入框里。
- **断流/重连时别把任务做大**：优先用“最小命令”驱动它输出可读信息（例如 `git status -sb`），避免长时间流式输出导致断链。

## 2) 推荐操作范式（最小命令策略）

当你只想确认状态/推进一步，按这个节奏：

1. 进入 TUI（确保有 TTY）
2. 先跑 1~3 条最短命令（5~10 秒内能出结果）
   - `cd /root/danghuangshang && git status -sb`
   - `git log --oneline -n 5 --decorate`
   - `git rev-list --left-right --count A...B`
3. 等输出稳定后再做下一步动作（比如 merge/push）

## 3) 在 OpenClaw 里“记得 Enter”

如果你是通过 OpenClaw 的 `process(write)` 把文字送进一个 PTY/TUI 会话：
- 文字写入后，**再发一次 `process(send-keys)` 的 `ENTER`** 才会提交执行。

## 4) 竞态提醒：push 与校验不要并行

不要把下面两类命令并行跑：
- `git push ...`
- `git rev-list --left-right --count ...`（或任何依赖远端引用的校验）

原因：校验可能读到 push 前的远端引用，出现短暂误报（例如 0/17）。

推荐做法：
- push 完后，串行执行：
  - `git fetch --prune origin`
  - 再 `git rev-list --left-right --count ...`

## 5) 常见报错速查

- `Error: stdin is not a terminal`
  - 解决：用 PTY（OpenClaw `exec` 设 `pty:true`）再 `codex resume ...`
- `Stream disconnected before completion ...`
  - 解决：缩小任务粒度；优先跑最小命令拿状态；避免一次性长输出。
