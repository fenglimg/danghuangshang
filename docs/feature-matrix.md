# 🧩 功能矩阵

> ← [返回文档索引](./README.md) | [功能总览](./features.md) | [全量手测清单](./testing-checklist.md)

---

## 这页是干什么的

这页把 `danghuangshang` 当前已经具备的主要特性，按：

- 是什么
- 从哪里进入
- 需要什么前置
- 去哪里看证据
- 应该怎么测

统一串起来。

如果你希望确认“所有特性有没有漏”，这页应该作为总表来用。

---

## 一、产品层能力

| 能力 | 说明 | 主要入口 | 前置条件 | 证据 | 对应测试 |
|------|------|----------|----------|------|----------|
| 多 Agent 协作 | 不同部门按职责处理不同类型任务 | Discord / 飞书 / WebUI | 至少一个可用入口 + LLM Key | [架构详解](./architecture.md) | [P0-03](./testing-checklist.md#p0-03-入口联通性) / [P0-04](./testing-checklist.md#p0-04-司礼监调度模式) |
| 三省流程 | 司礼监接旨、内阁优化、都察院审查 | Discord / 飞书 | 司礼监与相关部门可用 | [三省流程](./sansheng-flow.md) | [P0-04](./testing-checklist.md#p0-04-司礼监调度模式) |
| Discord 多 Bot 直呼 | 直接真实 mention 兵部、户部、都察院等 | Discord | 多 Bot 配置正确、`<@UserId>` 映射正确 | [玩法模式](./usage-modes.md) | [P0-05](./testing-checklist.md#p0-05-discord-多-bot-直呼模式) |
| 飞书单 Bot | 用户只跟司礼监对话，后台多 Agent 调度 | 飞书 | 飞书应用配置完成 | [玩法模式](./usage-modes.md) | [P2-01](./testing-checklist.md#p2-01-飞书单-bot-后台调度) |
| 纯 WebUI | 不配置 Bot，直接在浏览器里对话 | WebUI | Gateway 可访问 | [玩法模式](./usage-modes.md) | [P2-02](./testing-checklist.md#p2-02-纯-webui-模式) |
| 翰林院内容玩法 | 多 Agent 协作写小说、长文、设定 | Discord / WebUI | 相关角色配置齐全 | [玩法模式](./usage-modes.md) | [P2-03](./testing-checklist.md#p2-03-翰林院小说工作流) |
| 菠萝王朝组织玩法 | 参考真实 14 Agent 案例搭组织 | Discord / GUI / Notion | Notion 等增强配置可用 | [菠萝王朝案例](./pineapple-dynasty.md) | [P2-04](./testing-checklist.md#p2-04-菠萝王朝式组织玩法) |

---

## 二、平台与部署能力

| 能力 | 说明 | 主要入口 | 前置条件 | 证据 | 对应测试 |
|------|------|----------|----------|------|----------|
| Linux + Discord | 一键脚本 + Discord 多 Bot | 服务器 | Linux 服务器、Discord Token | [Linux + Discord](./setup-linux-discord.md) | [P0-01](./testing-checklist.md#p0-01-基础安装与服务启动) / [P0-03](./testing-checklist.md#p0-03-入口联通性) |
| Linux + 飞书 | 一键脚本 + 飞书单 Bot | 服务器 | Linux 服务器、飞书配置 | [Linux + 飞书](./setup-feishu.md) | [P0-01](./testing-checklist.md#p0-01-基础安装与服务启动) / [P0-03](./testing-checklist.md#p0-03-入口联通性) |
| 纯 WebUI | 浏览器直接使用 | 浏览器 | Gateway 服务、LLM Key | [纯 WebUI](./setup-webui.md) | [P0-03](./testing-checklist.md#p0-03-入口联通性) |
| Docker | 容器化部署 | Docker | Docker 环境 | [Docker 部署](./setup-docker.md) | [P0-01](./testing-checklist.md#p0-01-基础安装与服务启动) |
| 宿主机迁移 | 老环境迁移到 `install.sh` 路线 | Shell | 旧 `.openclaw` 环境 | [宿主机迁移](./host-install-migration.md) | [P0-01](./testing-checklist.md#p0-01-基础安装与服务启动) |
| macOS / WSL2 | 桌面测试或开发环境 | 本地环境 | 对应平台依赖 | [macOS](./setup-macos.md) / [Windows WSL2](./windows-wsl.md) | [P0-01](./testing-checklist.md#p0-01-基础安装与服务启动) |

---

## 三、运行时与数据能力

| 能力 | 说明 | 主要入口 | 前置条件 | 证据 | 对应测试 |
|------|------|----------|----------|------|----------|
| 独立记忆 | 每个 Agent 独立上下文与工作区 | 所有入口 | 正常安装 | [架构详解](./architecture.md) | [P0-04](./testing-checklist.md#p0-04-司礼监调度模式) |
| 60+ Skill 生态 | GitHub、Notion、浏览器、检索等能力 | 所有入口 | 按 skill 配置依赖 | [Skills & Extensions](./skills-and-extensions.md) | [P1-01](./testing-checklist.md#p1-01-github-skill) / [P1-02](./testing-checklist.md#p1-02-notion-接入) |
| OpenClaw Cron | 定时触发 AI 任务 | CLI / GUI | cron 配置可用 | [进阶篇教程](./tutorial-advanced.md) | [P1-03](./testing-checklist.md#p1-03-openclaw-cron) |
| 记忆备份 | 备份、列出、恢复 memory 数据 | Shell | 本地数据目录存在 | [项目 README](../README.md) | [P1-04](./testing-checklist.md#p1-04-记忆备份) |
| 语义记忆搜索 | embedding 检索历史记忆 | CLI / Agent | Embedding Provider Key | [语义记忆搜索](./memory-search.md) | [P1-05](./testing-checklist.md#p1-05-语义记忆搜索) |
| Notion 沉淀 | 日报、周报、财务、知识库 | Agent / GUI / Notion | Notion Integration Token | [Notion 接入](./notion-setup.md) | [P1-02](./testing-checklist.md#p1-02-notion-接入) |
| 沙箱隔离 | 运行时权限与工作区隔离 | Runtime | 对应沙箱策略 | [安全须知](./security.md) | 建议结合部署场景专项验证 |

---

## 四、GUI 能力

| 能力 | 说明 | 主要入口 | 前置条件 | 证据 | 对应测试 |
|------|------|----------|----------|------|----------|
| Dashboard | 总览系统状态、部门排行、趋势 | GUI | GUI 服务可启动 | [GUI 页面总览](./gui-pages.md) | [P0-06](./testing-checklist.md#p0-06-gui-登录与基础页面) |
| Court | Web 端直接下旨 | GUI | GUI 服务可启动 | [GUI 页面总览](./gui-pages.md) | [P0-06](./testing-checklist.md#p0-06-gui-登录与基础页面) |
| Sessions | 查看会话、消息、摘要 | GUI | GUI 服务可启动 | [GUI 页面总览](./gui-pages.md) | [P0-06](./testing-checklist.md#p0-06-gui-登录与基础页面) |
| Tokens / Logs / Search / Cron / Skills / System / Settings | 管理成本、日志、搜索、定时、技能与系统状态 | GUI | GUI 服务可启动 | [GUI 页面总览](./gui-pages.md) | [P1-06](./testing-checklist.md#p1-06-gui-进阶页面) |
| Governance | OpenMOSS 治理总控台 | GUI | GUI 服务可启动，OpenMOSS API 可用 | [OpenMOSS 当前可用能力](./openmoss/what-you-can-use-now.md) | [P0-07](./testing-checklist.md#p0-07-governance-基础联通) / [P1-09](./testing-checklist.md#p1-09-openmoss-治理-gui-动作) |

---

## 五、OpenMOSS 已吸收能力

| 能力 | 当前状态 | 说明 | 证据 | 对应测试 |
|------|----------|------|------|----------|
| Task Core | 已可用 | 任务创建、状态流转、module/work item | [OpenMOSS 当前可用能力](./openmoss/what-you-can-use-now.md) | [P1-07](./testing-checklist.md#p1-07-openmoss-任务核心) |
| Activity Log / Timeline | 已可用 | `create / claim / submit / review / block` 等事件 | [OpenMOSS 当前可用能力](./openmoss/what-you-can-use-now.md) | [P1-08](./testing-checklist.md#p1-08-openmoss-时间线--review--patrol) |
| Review / Rework | 已可用 | 审查、通过、打回返工 | [OpenMOSS 当前可用能力](./openmoss/what-you-can-use-now.md) | [P1-08](./testing-checklist.md#p1-08-openmoss-时间线--review--patrol) / [P1-09](./testing-checklist.md#p1-09-openmoss-治理-gui-动作) |
| Patrol / Recovery | 已可用 | stale 扫描、告警、恢复认领 | [OpenMOSS 当前可用能力](./openmoss/what-you-can-use-now.md) | [P1-08](./testing-checklist.md#p1-08-openmoss-时间线--review--patrol) / [P1-09](./testing-checklist.md#p1-09-openmoss-治理-gui-动作) |
| Governance GUI | 已可用 | 在 GUI 中查看任务并执行治理动作 | [OpenMOSS 当前可用能力](./openmoss/what-you-can-use-now.md) | [P0-07](./testing-checklist.md#p0-07-governance-基础联通) / [P1-09](./testing-checklist.md#p1-09-openmoss-治理-gui-动作) |
| Installer / Doctor Phase-1 Awareness | 已可用 | 安装器/诊断已知道 OpenMOSS 的最小交付边界 | [OpenMOSS 当前可用能力](./openmoss/what-you-can-use-now.md) | [P0-02](./testing-checklist.md#p0-02-doctorsh-基础诊断) |

---

## 六、当前不要误判为“已完成”的能力

这些不是“坏了”，而是本轮本来就还没吸收到位：

- reflection
- rules layer
- actor auth / registration
- scoring / leaderboard
- setup wizard 式完整 OpenMOSS 化

依据见：

- [OpenMOSS 当前可用能力](./openmoss/what-you-can-use-now.md)
- [OpenMOSS 吸收矩阵](./openmoss/absorption-matrix.md)

---

## 七、推荐阅读顺序

如果你要把文档展示给用户，建议顺序固定成：

1. [功能总览](./features.md)
2. [玩法模式](./usage-modes.md)
3. [功能矩阵](./feature-matrix.md)
4. [GUI 页面总览](./gui-pages.md)
5. [全量手测清单](./testing-checklist.md)

这样用户先知道“是什么”，再知道“怎么玩”，再知道“有哪些”，最后知道“怎么测”。

---

← [返回文档索引](./README.md)
