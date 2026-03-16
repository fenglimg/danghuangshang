# OpenMOSS Absorption Priorities for danghuangshang

**Question**
- 结合当前 `danghuangshang` 框架，哪些 OpenMOSS 能力值得吸收？
- 哪些适合吸收但要谨慎？
- 哪些当前不适合吸收？
- 每一类判断在当前框架里有什么证据，而不是盲目对标？

---

## Executive Judgment

对当前 `danghuangshang` 来说，最合理的吸收原则不是“尽量像 OpenMOSS”，而是：

> **只吸收那些能补齐当前架构缺口、又不破坏当前框架核心哲学的能力。**

当前框架的核心哲学很清楚：

1. **组织语义优先**
   - 三省六部是用户可理解的协作界面，而不是纯技术角色系统
2. **静态部署优先**
   - 当前更像一套本地可控、单租户、运维友好的 OpenClaw 组织模板
3. **运行可见性强，但任务治理弱**
   - 已经能看会话、日志、cron、skills、系统状态
   - 但还不能把协作过程沉淀为“可追踪任务状态流”

因此，最值得吸收的是**治理内核**，而不是 **OpenMOSS 的全套中间件形态**。

---

## Current Framework Evidence

### 1. 当前强项是“组织化协作模板”

证据：
- [README.md#L28](/root/danghuangshang/README.md#L28)
- [README.md#L61](/root/danghuangshang/README.md#L61)
- [architecture.md#L17](/root/danghuangshang/docs/architecture.md#L17)
- [sansheng-flow.md#L22](/root/danghuangshang/docs/sansheng-flow.md#L22)

说明：
- `danghuangshang` 已经把用户入口、司礼监、内阁、六部、都察院组织得非常完整
- 它的问题不是“没有 agent 角色”
- 它的问题是“角色之间的工作结果缺少任务层沉淀”

### 2. 当前强项是“运行态控制面”，不是“任务治理控制面”

证据：
- [gui.md#L21](/root/danghuangshang/docs/gui.md#L21)
- [App.tsx#L29](/root/danghuangshang/gui/src/App.tsx#L29)
- [index.js#L573](/root/danghuangshang/gui/server/index.js#L573)
- [index.js#L1306](/root/danghuangshang/gui/server/index.js#L1306)
- [index.js#L2090](/root/danghuangshang/gui/server/index.js#L2090)

说明：
- 当前 GUI 已经覆盖：
  - dashboard
  - sessions
  - cron
  - skills
  - system
- 这说明它并不缺“控制台”
- 它缺的是“任务态数据源”和“治理对象”

### 3. 当前框架偏单租户、静态配置、共享工作区

证据：
- [faq.md#L66](/root/danghuangshang/docs/faq.md#L66)
- [faq.md#L82](/root/danghuangshang/docs/faq.md#L82)
- [security.md#L24](/root/danghuangshang/docs/security.md#L24)
- [security.md#L53](/root/danghuangshang/docs/security.md#L53)
- [index.js#L31](/root/danghuangshang/gui/server/index.js#L31)
- [index.js#L61](/root/danghuangshang/gui/server/index.js#L61)

说明：
- 当前架构不是“agent 自主注册到中间件”
- 而是“管理员部署好一组固定 agent，并在共享 workspace / sandbox 约束里运行”
- 这会直接影响哪些 OpenMOSS 能力值得吸收

### 4. 当前框架已经有定时调度和 skills 生态

证据：
- [architecture.md#L37](/root/danghuangshang/docs/architecture.md#L37)
- [index.js#L1306](/root/danghuangshang/gui/server/index.js#L1306)
- [index.js#L2090](/root/danghuangshang/gui/server/index.js#L2090)

说明：
- 某些 OpenMOSS 能力不是“没有”，而是 `danghuangshang` 已经用另一种形式实现了
- 这种情况下，不应该重复吸收

---

## A. 明确建议吸收

这些能力会**直接补齐当前缺口**，而且和当前框架哲学基本一致。

### A1. Task Core

**建议程度**: 非常高

**为什么该吸收**
- 当前角色协作流程是存在的，但缺少任务实体
- 司礼监/内阁/兵部/都察院之间现在更像“消息和会话流水”
- 引入 task core 后，现有流程第一次能沉淀为“工作单元 + 状态流”

**本地证据**
- 当前协作流程是存在的：[sansheng-flow.md#L7](/root/danghuangshang/docs/sansheng-flow.md#L7)
- 当前 GUI 缺少任务中心：[gui.md#L21](/root/danghuangshang/docs/gui.md#L21)
- 当前后端主要读取会话，而不是任务：[index.js#L573](/root/danghuangshang/gui/server/index.js#L573)

**吸收后应达到的回归点**
- 同样一个“@司礼监 做登录功能”的需求
- 不改变原有用户体验
- 但后台会生成 task / subtask / 状态记录

### A2. ActivityLog / Timeline

**建议程度**: 非常高

**为什么该吸收**
- 当前系统能看到会话和消息
- 但无法明确回答“这个任务是怎么推进的、在哪一步被打回、哪一步卡住了”
- ActivityLog 能把“对话历史”提升为“执行历史”

**本地证据**
- 当前 GUI 侧重 sessions/logs：[App.tsx#L29](/root/danghuangshang/gui/src/App.tsx#L29)
- dashboard summary 实际聚焦活跃度、token、预览消息：[index.js#L593](/root/danghuangshang/gui/server/index.js#L593)

**吸收后应达到的回归点**
- 对任一任务，可以查看完整事件流，而不需要靠翻聊天记录猜测

### A3. Review 闭环

**建议程度**: 非常高

**为什么该吸收**
- 当前都察院语义已经天然存在
- 但主要还是“后置审查流程说明”和消息结果
- 最适合把 OpenMOSS 的 review 闭环和当前都察院结合起来

**本地证据**
- 都察院后置审查语义非常明确：[sansheng-flow.md#L34](/root/danghuangshang/docs/sansheng-flow.md#L34)
- 安全文档也明确要求 code review：[security.md#L96](/root/danghuangshang/docs/security.md#L96)

**吸收后应达到的回归点**
- 审查不再只是“发一条报告”
- 而是能真实驱动 approve / reject / rework 状态

### A4. Patrol / Blocked Recovery

**建议程度**: 高

**为什么该吸收**
- 当前框架强调长期在线、cron、自检和稳定运行
- 但没有把“卡住的任务”变成显式治理对象
- Patrol 非常适合补这个缺口

**本地证据**
- 框架强调 7x24 在线和 cron：[README.md#L28](/root/danghuangshang/README.md#L28), [index.js#L1306](/root/danghuangshang/gui/server/index.js#L1306)
- GUI 当前有系统健康与日志，但没有 blocked 任务概念：[gui.md#L23](/root/danghuangshang/docs/gui.md#L23)

**吸收后应达到的回归点**
- 能明确识别“任务卡死”“任务超时”“需要人工接管”

### A5. GUI 任务治理控制面

**建议程度**: 高

**为什么该吸收**
- 当前 GUI 已经非常适合扩展
- 不是要推翻重来，而是从“运行台”升级为“治理台”

**本地证据**
- 已有 GUI 基础和页签扩展结构：[App.tsx#L29](/root/danghuangshang/gui/src/App.tsx#L29)
- 现有页面已覆盖 sessions/cron/skills/system：[gui.md#L21](/root/danghuangshang/docs/gui.md#L21)

**吸收后应达到的回归点**
- 保留现有 dashboard/sessions/cron/skills
- 新增 tasks/timeline/review/patrol 面板

---

## B. 适合吸收，但要谨慎

这些能力本身有价值，但如果照 OpenMOSS 原样搬，会和当前框架发生风格或边界冲突。

### B1. Global Rules / Task Rules

**建议程度**: 中高

**为什么谨慎**
- 这确实能增强治理能力
- 但 `danghuangshang` 当前已经有 SOUL / IDENTITY / skills / 角色主题约束
- 如果再硬塞一套规则体系，很容易出现“规则来源重复”

**本地证据**
- 当前框架高度依赖角色人格与行为约束：[faq.md#L84](/root/danghuangshang/docs/faq.md#L84)
- 共享 workspace 和统一身份注入是最佳实践：[faq.md#L66](/root/danghuangshang/docs/faq.md#L66), [architecture.md#L54](/root/danghuangshang/docs/architecture.md#L54)

**更合适的吸收方式**
- 先做“只读 + 可审计”的 rule layer
- 后做 task-level rules
- 最后才考虑 GUI 编辑

### B2. Prompt Management

**建议程度**: 中

**为什么谨慎**
- OpenMOSS 的 prompt 管理更偏“中间件角色提示词中心”
- `danghuangshang` 当前更偏“文件 + 身份 + skills + 组织角色语义”
- 如果太早做在线 prompt 管理，会破坏 git 版本化和当前角色文件体系

**本地证据**
- 当前 agent 身份与行为更多依赖安装生成和 workspace 文件：[faq.md#L84](/root/danghuangshang/docs/faq.md#L84)
- 当前 skills 生态已经支持通过文件系统和 ClawdHub 管理：[index.js#L2090](/root/danghuangshang/gui/server/index.js#L2090)

**更合适的吸收方式**
- 先做 prompt/rule 的展示与对比
- 不要先做在线实时编辑

### B3. Notifications

**建议程度**: 中

**为什么谨慎**
- OpenMOSS 通知很合理
- 但 `danghuangshang` 本身已经把 Discord / 飞书当成一线交互面
- 如果再叠一套通知系统，容易变成重复提醒

**本地证据**
- 当前明确把 Discord 当 GUI：[gui.md#L55](/root/danghuangshang/docs/gui.md#L55)
- 当前多平台 / 会话 / channel 已经是主交互面：[App.tsx#L29](/root/danghuangshang/gui/src/App.tsx#L29)

**更合适的吸收方式**
- 只吸收任务完成、审查打回、patrol alert 三类事件通知
- 复用现有 Discord/飞书通道，不另起复杂通知子系统

### B4. Scoring / Reflection

**建议程度**: 中

**为什么谨慎**
- reflection 很有价值，适合吸收
- leaderboard / gamification 不一定适合当前朝廷框架

**本地证据**
- 当前框架强调的是部门职责、治理、审查，不是 agent 竞技
- GUI 目前也没有积分/排行的产品语言：[gui.md#L21](/root/danghuangshang/docs/gui.md#L21)

**更合适的吸收方式**
- 先吸收 `reflection log`
- 暂缓公开 leaderboard
- 如果要评分，也先做内部质量信号

---

## C. 当前不建议优先吸收

这些能力不是完全没价值，而是**和当前框架不匹配，或者当前已有等价路径**。

### C1. Full Agent Registration / Self-Registration

**建议程度**: 低

**为什么不适合**
- OpenMOSS 偏中间件，需要 agent 自注册
- `danghuangshang` 当前是静态部署、管理员控制、固定 agent 拓扑
- 强行引入 agent self-registration 会增加复杂度，却不解决当前主要痛点

**本地证据**
- 当前推荐固定 `agents.list`、共享 workspace、静态配置：[faq.md#L66](/root/danghuangshang/docs/faq.md#L66)
- 当前 GUI 认证也是单管理口令模型：[index.js#L31](/root/danghuangshang/gui/server/index.js#L31)

**结论**
- 这不是当前阶段的关键缺口

### C2. Setup Wizard

**建议程度**: 低

**为什么不适合**
- 当前框架已经有 `install.sh`、迁移文档、install prompt、doctor
- 它的问题不是“不会安装”
- 而是“治理层能力还不够”

**本地证据**
- 安装与迁移文档已经很完整：[host-install-migration.md#L1](/root/danghuangshang/docs/host-install-migration.md#L1)
- 安装提示词也已存在：[install-prompt.md#L32](/root/danghuangshang/docs/install-prompt.md#L32)

**结论**
- 先优化 doctor / migration，比重做 wizard 更合适

### C3. Full OpenMOSS Auth Stack

**建议程度**: 低

**为什么不适合**
- OpenMOSS 的 agent/admin/registration 三层鉴权适合中间件
- 当前 `danghuangshang` 部署模型更偏单租户、单运维平面
- 现阶段引入完整 auth stack 会把系统复杂度抬得过高

**本地证据**
- 当前 GUI 使用单 `BOLUO_AUTH_TOKEN`：[index.js#L31](/root/danghuangshang/gui/server/index.js#L31)
- 当前 agent 运行依赖本地 openclaw 配置和 host/sandbox 模型：[security.md#L39](/root/danghuangshang/docs/security.md#L39)

**结论**
- 只有在你未来真把它演化成“独立中间件服务”时，这件事才变重要

### C4. 重复吸收 skills / recurring task 生态

**建议程度**: 低

**为什么不适合**
- skills 管理、cron 调度，这些 `danghuangshang` 已经有
- 从 OpenMOSS 再搬一套价值不大

**本地证据**
- skills 管理 API 已经完整存在：[index.js#L2090](/root/danghuangshang/gui/server/index.js#L2090)
- cron 管理 API 已经存在：[index.js#L1306](/root/danghuangshang/gui/server/index.js#L1306)

**结论**
- 这些不是当前缺口，不应重复建设

---

## Final Recommendation Stack

### 第一层：现在就该做

1. Task Core
2. ActivityLog
3. Review
4. Patrol
5. GUI task governance

### 第二层：做完第一层再评估

1. Rules
2. Prompt visibility / audit
3. Reflection log
4. 精简通知机制

### 第三层：当前不要优先做

1. Self-registration
2. Full auth stack
3. Setup wizard
4. Leaderboard / gamification
5. 重复的 skills / cron 能力

---

## Best Deep Strategy

如果你问“更深层次上，我应该怎么吸收最合适”，我的判断是：

> **不要吸收 OpenMOSS 的“系统形态”，要吸收 OpenMOSS 的“治理原理”。**

具体到当前框架，就是：

- 保留 `danghuangshang` 的三省六部组织语义
- 保留现有 install / migration / doctor / skills / cron / channels 路线
- 在这些之下补一层任务治理内核

这样最后形成的不是：

- “一个不伦不类的半 OpenMOSS”

而是：

- “一个更成熟的 `danghuangshang`，它有 OpenMOSS 式治理能力，但仍然保持自己的框架哲学”

这条路才最稳，也最容易找到回归点。

---

## Concrete Regression Points

为了防止“吸收完却没有回归点”，建议你以后每一轮改造都检查这 4 个回归点：

1. **用户入口不变**
   - 用户仍然可以 `@司礼监` / `@兵部`
   - 不要求学习新的系统入口

2. **组织语义不变**
   - 三省六部仍然成立
   - OpenMOSS 能力只作为治理内核，不替代角色世界观

3. **运维路径不变**
   - 仍然优先 `install.sh + doctor + migration`
   - 不强迫演化为独立中间件部署

4. **治理能力变强**
   - 任务可追踪
   - 审查可打回
   - 卡死可上报
   - GUI 可看见真实工作流

如果这 4 条同时成立，说明你吸收对了。
