# danghuangshang：worktree / 分支回收 SOP（ff-only）

目的：把“worktree 清理 + 分支回收 + push 后对齐校验”变成一套固定流程，减少口头沟通误差与竞态误判。

适用场景：
- 你有一个长期分支（例如 `local-delivery` / `local-host-install`）
- 你有一个临时/恢复分支（例如 `recover/*`）
- 想把长期分支 **快进（ff-only）** 到恢复分支，并推送到远端

> 原则：除非明确允许，否则一律 **禁止 merge commit**，只允许 `--ff-only`。

---

## 0. 三个概念（人话）

- **worktree**：同一个仓库的“多个工作目录”。不同 worktree 可能绑定不同分支。
- **长期分支**：你希望一直保持干净可用、持续迭代的分支（例如 `local-delivery`）。
- **恢复/实验分支**：用于 cherry-pick、冲突修复、回收验证的分支（例如 `recover/*`）。

你要做的事情通常是：
1) 在恢复分支上把东西整理好
2) 再让长期分支 **ff-only 快进** 到恢复分支头

---

## 1) 进入正确的 worktree（避免在“错目录”操作）

```bash
cd /root/.openclaw/workspace/_repos/danghuangshang
pwd

git rev-parse --show-toplevel

git worktree list
```

检查点：
- `--show-toplevel` 输出必须是你期望的仓库根目录
- `git worktree list` 能看到当前目录对应的分支绑定

---

## 2) 做“卫生检查”（永远先做）

```bash
# 当前分支/状态
git status -sb

# 最近提交（确认自己看的是哪条线）
git log --oneline -n 10 --decorate

# 远端引用更新（避免读到旧的 origin/*）
git fetch --prune origin
```

如果 `git status` 显示有改动：
- 优先 `git stash push -u -m "wip: before recovery"`
- 或者把改动提交到单独分支；不要带着脏工作树做回收

---

## 3) 明确“目标是什么”（写清楚 A/B）

把这两个变量写出来（建议贴到 Discord thread 里）：

- 长期分支 A：`<A>`（例：`local-delivery`）
- 恢复分支 B：`<B>`（例：`recover/local-delivery-openmoss-phase1`）

并用命令确认两者头提交：

```bash
git show -s --oneline <A>
git show -s --oneline <B>
```

---

## 4) 判断是否能 ff-only（关键）

```bash
# 关键：A 是否是 B 的祖先？
# 0 表示可以 ff-only

git merge-base --is-ancestor <A> <B>
echo $?
```

- 输出 `0`：可以继续
- 非 0：不能 ff-only（说明分叉了）。此时要么：
  - 回到恢复分支上重新基于 A 处理（推荐）
  - 或明确允许 cherry-pick/重建恢复分支

---

## 5) 执行 ff-only 快进

```bash
# 切到长期分支 A
git switch <A>

# 快进到恢复分支 B
git merge --ff-only <B>
```

---

## 6) 推送到远端

```bash
git push origin <A>
```

---

## 7) 推送后对齐校验（避免“看起来推了，其实没对齐”）

**不要并行跑 push 和校验。**

正确做法：push 完后再做一次 fetch，然后做 left-right 计数。

```bash
# 确保读到最新远端

git fetch --prune origin

# 对比 A 和 B 是否完全一致（0 0 才算）

git rev-list --left-right --count origin/<A>...origin/<B>
```

预期：`0\t0`

---

## 8) 常见坑位速查

### 坑 1：并行执行导致“短暂误报 ahead/behind”
症状：你刚 push 完，马上 `rev-list` 看见 `0 17` 之类的数字。
原因：你读到的是 push 前的远端引用缓存/旧状态。
解决：**串行**，push 后 `git fetch --prune origin` 再比对。

### 坑 2：在错误 worktree 上 merge
症状：merge 后发现改动出现在另一个 worktree/分支。
解决：每次操作前固定跑 `git status -sb` + `git worktree list`。

### 坑 3：不小心产生 merge commit
解决：只用 `git merge --ff-only`；如果报错就停下，不要改成普通 merge。

---

## 9) 与 OpenClaw/协作线程的配合（推荐实践）

- 把每次回收当作一个“操作工单”，固定在一个 Discord thread 里执行与记录
- thread 里贴：
  - A/B 分支名
  - `merge-base --is-ancestor` 结果
  - `rev-list --left-right --count` 结果
- 主频道只贴结论（例如“已 ff-only 合入 + origin 对齐 0/0”）

---

## 10) 一键模板（复制粘贴版）

把 `<A>` `<B>` 替换成你的分支名：

```bash
cd /root/.openclaw/workspace/_repos/danghuangshang
set -e

git fetch --prune origin

git status -sb

git merge-base --is-ancestor <A> <B>

git switch <A>

git merge --ff-only <B>

git push origin <A>

git fetch --prune origin

git rev-list --left-right --count origin/<A>...origin/<B>
```
