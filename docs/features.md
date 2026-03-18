# 🧭 功能总览

> ← [返回文档索引](./README.md) | [返回项目 README](../README.md)

---

## 这页是干什么的

如果你想快速回答下面几个问题，就先看这页：

- 这个项目到底有哪些特性？
- 我应该从哪种入口开始用？
- 哪些功能是核心能力，哪些是玩法扩展？
- OpenMOSS 在里面处于什么位置？

一句话总结：

> `danghuangshang` 是一个基于 OpenClaw 的多 Agent 产品套件；OpenMOSS 是它当前已经吸收进来的治理层，而不是全部产品本体。

---

## 一、核心能力矩阵

| 能力 | 你能做什么 | 主要入口 | 相关文档 |
|------|------------|----------|----------|
| 多 Agent 协作 | 让不同部门按职责处理不同类型任务 | Discord / 飞书 / WebUI | [架构详解](./architecture.md) |
| 三省流程 | 让司礼监接旨、内阁优化、都察院审查 | Discord / 飞书 | [三省流程](./sansheng-flow.md) |
| 独立记忆 | 每个 Agent 保留独立上下文和工作区 | 所有入口 | [架构详解](./architecture.md) |
| 60+ Skill | GitHub、Notion、浏览器、Cron、检索等 | 所有入口 | [Skills & Extensions](./skills-and-extensions.md) |
| 定时自动化 | 让 Agent 定时写日报、巡检、备份 | CLI / GUI | [进阶篇教程](./tutorial-advanced.md) |
| GUI 后台 | 用浏览器管理系统状态、会话、Cron、治理任务 | Web GUI | [GUI 管理界面](./gui.md) |
| 数据沉淀 | 同步到 Notion，做日报/周报/知识库 | Discord / GUI / Notion | [Notion 接入](./notion-setup.md) |
| 语义记忆搜索 | 用 embedding 检索历史记忆 | CLI / Agent | [语义记忆搜索](./memory-search.md) |
| 记忆备份 | 备份所有 Agent 的记忆数据库与配置 | Shell | [项目 README](../README.md#L331) |
| OpenMOSS 治理层 | 管理任务状态、时间线、审查、巡检 | Governance GUI / API | [OpenMOSS 当前可用能力](./openmoss/what-you-can-use-now.md) |

---

## 二、入口模式

| 模式 | 适合谁 | 特点 | 文档 |
|------|--------|------|------|
| Discord 多 Bot | 海外 / 想玩完整朝廷协作 | 每个部门一个 Bot，真实 mention 直呼 | [Linux + Discord](./setup-linux-discord.md) |
| 飞书单 Bot | 国内 / 不想配置多个机器人 | 司礼监单入口，后台 `sessions_spawn` 调度 | [Linux + 飞书](./setup-feishu.md) |
| 纯 WebUI | 想快速试用、不想配 Bot | 直接打开 Gateway Chat | [纯 WebUI](./setup-webui.md) |
| Docker | 想容器化部署 | 环境更整齐、迁移方便 | [Docker 部署](./setup-docker.md) |
| 宿主机直装 | 已有老环境，想迁移到当前路线 | 更贴近本地 fork 交付面 | [宿主机迁移](./host-install-migration.md) |
| macOS / WSL2 | 桌面端开发或本地测试 | 适合个人环境 | [macOS](./setup-macos.md) / [Windows WSL2](./windows-wsl.md) |

---

## 三、典型玩法

| 玩法 | 说明 | 文档 |
|------|------|------|
| 司礼监调度模式 | 把任务交给司礼监，让它拆解、派活、回报 | [玩法模式](./usage-modes.md) |
| Discord 多 Bot 直呼 | 直接点名兵部、户部、都察院等 | [玩法模式](./usage-modes.md) |
| 飞书单 Bot 模式 | 只和司礼监说话，后台自动调度 | [玩法模式](./usage-modes.md) |
| GUI 管理模式 | 在 Web 后台看状态、看会话、做治理动作 | [GUI 页面总览](./gui-pages.md) |
| Notion 沉淀模式 | 自动写日报、财务表、项目档案 | [Notion 接入](./notion-setup.md) |
| Cron 自动值守模式 | 让朝廷自动写日报、做健康检查、做汇总 | [进阶篇教程](./tutorial-advanced.md) |
| 翰林院写作模式 | 多 Agent 协作写小说、长文、设定集 | [玩法模式](./usage-modes.md) |
| 菠萝王朝组织模式 | 参考真实 14 Agent 案例搭自己的 AI 朝廷 | [菠萝王朝案例](./pineapple-dynasty.md) |

---

## 四、GUI 能力

GUI 当前包含这些页面：

- 总览
- 朝堂
- 治理
- 部门
- Token 统计
- 会话
- 频道
- 节点
- 奏章板
- 奏报厅
- 日志
- 搜索
- 定时
- 技能
- 系统
- 设置

详细解释见：

- [GUI 管理界面](./gui.md)
- [GUI 页面总览](./gui-pages.md)

---

## 五、Skills 与 Extensions

当前仓库自带：

- 预装 skills：`weather`、`github`、`notion`、`hacker-news`、`browser-use`、`quadrants`、`openviking`
- 可选 extension：`novel-openviking`

详细见：

- [Skills & Extensions](./skills-and-extensions.md)

---

## 六、OpenMOSS 在这个项目里的位置

OpenMOSS 不是单独入口产品，而是当前已经吸收进 `danghuangshang` 的治理层。

已经可用的部分：

- task core
- timeline / activity log
- review / rework
- patrol / recovery
- Governance GUI
- installer / doctor 的 phase-1 交付面理解

还没完成的部分：

- reflection
- rules layer
- actor auth / registration
- scoring / leaderboard

详细见：

- [OpenMOSS 当前可用能力](./openmoss/what-you-can-use-now.md)

---

## 七、怎么开始最合理

如果你是第一次接触，建议顺序：

1. 先选一个入口模式：
   - 海外优先 Discord
   - 国内优先飞书
   - 只想快试优先 WebUI
2. 再过一遍功能地图：
   - 看这页
   - 看 [玩法模式](./usage-modes.md)
   - 看 [功能矩阵](./feature-matrix.md)
   - 看 [GUI 页面总览](./gui-pages.md)
3. 最后做手测：
   - [Danghuangshang 全量手测清单](./testing-checklist.md)

---

← [返回文档索引](./README.md)
