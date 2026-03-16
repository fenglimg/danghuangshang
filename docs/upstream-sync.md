# Upstream 同步策略

> 适用于这个仓库已经作为**本地部署基线**使用，同时又希望持续吸收 `wanikua/danghuangshang` 更新的场景。

← [返回文档索引](./README.md) | [返回项目 README](../README.md)

---

## 目标

把仓库分成两个明确层次：

1. **上游基线层**：尽量贴近 `upstream/main`
2. **本地定制层**：只承载宿主机直装、迁移文档、安装提示词、本地 overlay 和未来融合策略

这样未来无论是：

- 跟进 `danghuangshang` 官方更新
- 吸收更好的新项目
- 比较其他实现思路

都不会再把“上游同步”和“本地部署改造”混在一起。

---

## 推荐分支

### `upstream-main`

用途：

- 本地镜像 `upstream/main`
- 不放本地部署特化改动
- 只做 fast-forward 同步

来源：

- `upstream/main`

### `local-host-install`

用途：

- 当前服务器的宿主机直装路线
- 安装提示词、迁移文档、分支策略文档
- 未来本地 overlay / 兼容层

来源：

- 从 `upstream-main` 切出

---

## 推荐同步命令

### 1. 拉取上游

```bash
git fetch upstream --prune
```

### 2. 更新 `upstream-main`

```bash
git checkout upstream-main
git merge --ff-only upstream/main
```

如果 `upstream-main` 只是本地镜像，也可以直接：

```bash
git branch -f upstream-main upstream/main
```

### 3. 把上游更新带入本地分支

```bash
git checkout local-host-install
git rebase upstream-main
```

如果你更希望保留本地 merge 节点，也可以：

```bash
git checkout local-host-install
git merge upstream-main
```

推荐默认：

- **小而线性的本地改动** → `rebase`
- **长期并行演进、多人协作** → `merge`

---

## 改动边界

### 应该放在 `upstream-main` 的内容

- 没有。这个分支只负责镜像上游。

### 应该放在 `local-host-install` 的内容

- 宿主机直装迁移文档
- 当前服务器的安装提示词
- 与本地 CLI / service / gateway 相关的兼容说明
- 针对你自己环境的操作流程

### 不应该直接混进主工作分支的内容

- 临时实验脚本
- 未验证的新项目融合尝试
- 只为某次迁移排障写的一次性 patch

这些应单独开分支，例如：

```bash
git checkout -b spike/<topic> upstream-main
git checkout -b integrate/<project-name> upstream-main
```

---

## 融合其他项目的建议方式

如果未来你要吸收“更好的项目”，不要直接改 `local-host-install`。

推荐流程：

1. 先在单独分支比较：

```bash
git checkout -b integrate/<project-name> upstream-main
```

2. 明确它属于哪一层：

- 上游可替代 runtime
- 本地 overlay
- 独立工具/插件
- 文档或安装器增强

3. 只有在边界清楚之后，才把必要改动带回 `local-host-install`

---

## 当前建议

当前仓库建议把：

- `upstream-main` 作为持续同步 `wanikua/danghuangshang` 的镜像分支
- `local-host-install` 作为当前服务器迁移和本地运行策略的长期工作分支

而不是继续在旧的混合 feature 分支上累积运行态改动。
