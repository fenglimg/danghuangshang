# 🧪 Danghuangshang 全量手测清单

> ← [返回文档索引](./README.md) | [功能矩阵](./feature-matrix.md) | [OpenMOSS 当前可用能力](./openmoss/what-you-can-use-now.md)

> Goal: 按 `P0 / P1 / P2` 分层验证 `danghuangshang` 的核心能力、玩法模式与 OpenMOSS 治理层

---

## 0. 测试前准备

### 0.1 测试记录模板

每测一项，至少记录：

- `结果`：通过 / 失败 / 跳过
- `环境`：Discord / 飞书 / WebUI / GUI
- `证据`：截图、日志、返回 JSON、Notion 页面、GitHub issue/PR 链接
- `备注`：异常现象、复现步骤、临时结论

建议自己建一个表：

| ID | 优先级 | 测试项 | 结果 | 证据 | 备注 |
|----|--------|--------|------|------|------|

### 0.2 基础前置

至少准备：

- 一套可启动的 `danghuangshang`
- 一个可用的 LLM API Key
- 三选一入口：
  - Discord Bot
  - 飞书单 Bot
  - 纯 WebUI

建议额外准备：

- GitHub 账号，并完成 `gh auth login`
- Notion Integration Token
- 如要测语义记忆：Embedding Provider Key

### 0.3 基础命令

先确认基础状态：

```bash
cd /root/.openclaw/workspace/_repos/danghuangshang
git status -sb
openclaw --version
systemctl --user status openclaw-gateway --no-pager
```

如果你使用本仓库 GUI：

```bash
cd /root/.openclaw/workspace/_repos/danghuangshang/gui
npm install
npm run build
cd /root/.openclaw/workspace/_repos/danghuangshang/gui/server
npm install
```

如果要先做 OpenMOSS 自动化基线验证：

```bash
cd /root/.openclaw/workspace/_repos/danghuangshang
npm --prefix gui/server run test:openmoss
```

预期：

- `openclaw` 命令存在
- gateway 服务可启动
- OpenMOSS 测试通过

失败排查：

- [配置诊断](./doctor.md)
- [Linux + Discord](./setup-linux-discord.md)
- [Linux + 飞书](./setup-feishu.md)
- [纯 WebUI](./setup-webui.md)

---

## P0 必测

这些项决定系统当前是不是“能用”。

### P0-01 基础安装与服务启动

操作：

```bash
systemctl --user restart openclaw-gateway
systemctl --user status openclaw-gateway --no-pager
journalctl --user -u openclaw-gateway --since "5 min ago" --no-pager
```

预期：

- `active (running)`
- 日志中无持续报错

失败排查：

- [基础篇教程](./tutorial-basics.md)
- [配置诊断](./doctor.md)

### P0-02 `doctor.sh` 基础诊断

操作：

```bash
cd /root/.openclaw/workspace/_repos/danghuangshang
bash ./doctor.sh
```

预期：

- Discord / 飞书 / 工作区 / 可选集成至少能给出清晰诊断
- 如果 OpenMOSS 尚未实际使用，`state/openmoss` 不存在也应被解释为正常

失败排查：

- [配置诊断](./doctor.md)

### P0-03 入口联通性

三选一，至少测通一种。

#### 方案 A：Discord

操作：

1. 在 Discord 客户端真实 mention 司礼监 Bot
2. 发送：`你好，自我介绍一下`

预期：

- 司礼监正常回复

补充检查：

1. 再真实 mention 兵部：`用 Python 写个 Hello World`
2. 再真实 mention 户部：`如何控制 AI API 成本`

参考：

- [Discord Bot 创建](./setup-discord.md)

#### 方案 B：飞书

操作：

1. 在飞书给司礼监机器人发消息
2. 内容：`你好，介绍一下你是谁`

预期：

- 司礼监正常回复
- 机器人不是沉默或只显示已读

参考：

- [Linux + 飞书](./setup-feishu.md)

#### 方案 C：纯 WebUI

操作：

1. 启动 gateway
2. 打开 `http://你的服务器IP:18789`
3. 进入 Chat
4. 输入：`你好，自我介绍一下`

预期：

- 可以直接对话

参考：

- [纯 WebUI](./setup-webui.md)

### P0-04 司礼监调度模式

目标：

- 验证“朝廷产品”最核心玩法

操作：

在可用入口里对司礼监发送：

```text
帮我写一个用户登录 API，并顺便评估一下本月 API 成本
```

预期：

- 司礼监接旨
- 复杂任务时有内阁优化或拆解迹象
- 至少把编码类和财务类任务拆开

证据建议：

- 对话截图
- 如果有 GUI / Sessions，记录对应会话

参考：

- [项目 README](../README.md)
- [三省流程](./sansheng-flow.md)

### P0-05 Discord 多 Bot 直呼模式

仅 Discord 路径测试。

操作：

1. 真实 mention 兵部：`写一个最简登录接口`
2. 真实 mention 礼部：`写一条 AI 工具推荐文案`
3. 真实 mention 户部：`分析本月 API 花费控制思路`

预期：

- 各部门按职责响应
- 不串角色

补充检查：

如果要测 Bot 间互相触发，检查：

- `allowBots: true`
- `groupPolicy: "open"`

参考：

- [Discord Bot 创建](./setup-discord.md)
- [架构详解](./architecture.md)

### P0-06 GUI 登录与基础页面

操作：

```bash
cd /root/.openclaw/workspace/_repos/danghuangshang/gui
npm run build
cd /root/.openclaw/workspace/_repos/danghuangshang/gui/server
BOLUO_AUTH_TOKEN=test-pass node index.js
```

然后打开 GUI，至少检查这些页面：

1. Dashboard
2. Court
3. Sessions
4. System

预期：

- 能正常登录
- 页面能加载，不是空白页
- Dashboard 有基本概况
- Court 可发消息
- Sessions 可看到历史数据或空态
- System 可看到系统信息

参考：

- [GUI 管理界面](./gui.md)
- [GUI 页面总览](./gui-pages.md)

### P0-07 Governance 基础联通

操作：

1. 打开 GUI 中的 Governance 页面
2. 查看任务区、时间线区、review 区、patrol 区是否正常渲染

预期：

- Governance 页面可打开
- OpenMOSS 相关接口有返回
- 没有明显报错或空白崩溃

参考：

- [OpenMOSS 当前可用能力](./openmoss/what-you-can-use-now.md)

---

## P1 强烈建议测

这些项决定系统是不是“好用”和“完整”。

### P1-01 GitHub Skill

前置：

- 已执行 `gh auth login`

操作：

让兵部或吏部执行类似任务：

```text
帮我为这个仓库创建一个 issue，标题是“测试 GitHub skill”
```

预期：

- Agent 能调用 GitHub 能力
- 能拿到 issue 链接或明确失败原因

参考：

- [Skills & Extensions](./skills-and-extensions.md)

### P1-02 Notion 接入

前置：

- 已配置 Notion Integration Token

操作：

1. 按 [Notion 接入](./notion-setup.md) 完成配置
2. 让相关部门写一条日报、财务记录或项目档案

预期：

- Notion 页面或数据库有新记录
- 字段映射大体正常

参考：

- [Notion 接入](./notion-setup.md)

### P1-03 OpenClaw Cron

操作：

1. 配置一个低风险定时任务
2. 例如：每小时生成一次健康摘要，或手动触发一次 cron

预期：

- 任务按计划触发
- 日志中能看到执行痕迹
- 不重复狂刷

参考：

- [进阶篇教程](./tutorial-advanced.md)

### P1-04 记忆备份

操作：

按项目 README 中的备份流程执行一次：

1. 创建备份
2. 列出现有备份
3. 用 `dry-run` 验证恢复流程

预期：

- 备份文件生成成功
- 列表可见
- `dry-run` 不报致命错误

参考：

- [项目 README](../README.md)

### P1-05 语义记忆搜索

前置：

- 已配置 Embedding Provider

操作：

1. 让某个 Agent 先产生几条可区分的记忆
2. 再执行 memory status / index / search 一类操作

预期：

- 能完成索引
- 能按语义召回相关历史内容

参考：

- [语义记忆搜索](./memory-search.md)

### P1-06 GUI 进阶页面

操作：

继续检查这些页面：

1. Tokens
2. Logs
3. Search
4. Cron
5. Skills
6. Settings

预期：

- 页面可加载
- 基本筛选/查看功能正常
- 不出现持续性前端报错

参考：

- [GUI 页面总览](./gui-pages.md)

### P1-07 OpenMOSS 任务核心

操作：

通过 API 或 GUI 完成一次最小任务流：

1. 创建任务
2. claim
3. submit

预期：

- 任务 ID 生成成功
- 状态按顺序变化
- 数据可持久化，刷新后仍在

参考：

- [OpenMOSS 当前可用能力](./openmoss/what-you-can-use-now.md)

### P1-08 OpenMOSS 时间线 / review / patrol

操作：

在上一步任务基础上继续：

1. 查看 timeline
2. 执行 review
3. 触发 patrol scan
4. 如有告警，尝试 resolve 或 reclaim

预期：

- timeline 能看到关键事件
- review 队列可见
- patrol 能产出或解释当前结果

参考：

- [OpenMOSS 当前可用能力](./openmoss/what-you-can-use-now.md)

### P1-09 OpenMOSS 治理 GUI 动作

操作：

在 Governance 页面验证这些动作：

1. 通过审查
2. 打回返工
3. 立即巡检
4. 恢复认领

预期：

- 点击后有明确反馈
- 状态与列表刷新正确
- 时间线或相关区域能反映动作结果

参考：

- [OpenMOSS 当前可用能力](./openmoss/what-you-can-use-now.md)

---

## P2 玩法验证

这些项决定系统是不是“有趣”“可扩展”“可展示”。

### P2-01 飞书单 Bot 后台调度

操作：

在飞书里只对司礼监发复杂任务，例如：

```text
帮我整理一个新功能发布说明，并顺手做风险排查
```

预期：

- 用户只看到一个飞书 Bot
- 后台仍出现拆解、多角色处理或不同类型结果

参考：

- [玩法模式](./usage-modes.md)
- [Linux + 飞书](./setup-feishu.md)

### P2-02 纯 WebUI 模式

操作：

只保留 WebUI 入口，连续做两类任务：

1. 普通问答
2. 多步骤任务

预期：

- 两类任务都能跑通
- WebUI 至少能作为低门槛验证入口

参考：

- [玩法模式](./usage-modes.md)
- [纯 WebUI](./setup-webui.md)

### P2-03 翰林院小说工作流

操作：

让翰林院相关角色完成一次最小写作流程：

1. 世界观或题材定义
2. 大纲生成
3. 正文样章
4. 审校

预期：

- 至少能看出角色分工
- 输出不是单点闲聊，而是工作流式协作

参考：

- [玩法模式](./usage-modes.md)
- [项目 README](../README.md)

### P2-04 菠萝王朝式组织玩法

操作：

按案例选 2-3 条真实玩法验证：

1. 每日简报
2. 市场或项目分析
3. 财务归档
4. 项目列传/档案沉淀

预期：

- 能形成持续产出
- Notion / GUI / 聊天入口之间有联动

参考：

- [菠萝王朝案例](./pineapple-dynasty.md)

### P2-05 OpenViking / 扩展玩法

前置：

- 已安装对应扩展或向量能力

操作：

1. 验证 `openviking` 检索能力
2. 如安装 `novel-openviking`，验证写作场景中的检索增强

预期：

- 能拿到检索结果
- 在内容场景下能体现增强效果

参考：

- [Skills & Extensions](./skills-and-extensions.md)

---

## 不要按“已完成能力”验收的项

下面这些能力当前还不应按“失败”记账，因为本来就还没完整吸收：

- reflection
- rules layer
- actor auth / registration
- scoring / leaderboard
- setup wizard 式完整 OpenMOSS 化

依据：

- [OpenMOSS 当前可用能力](./openmoss/what-you-can-use-now.md)
- [OpenMOSS 吸收矩阵](./openmoss/absorption-matrix.md)

---

## 收尾建议

完成手测后，建议把结果整理成三份结论：

1. `可立即上线使用` 的能力
2. `可演示但还要补` 的能力
3. `明确未完成，不应误判` 的能力

如果你要对外展示，推荐展示顺序：

1. [功能总览](./features.md)
2. [玩法模式](./usage-modes.md)
3. [功能矩阵](./feature-matrix.md)
4. [GUI 页面总览](./gui-pages.md)
5. [全量手测清单](./testing-checklist.md)

---

← [返回文档索引](./README.md)
