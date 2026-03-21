# OpenProse 融入子区 Anchor

## 目标
把 OpenProse（声明式 DSL 工作流）融入当前 OpenClaw + danghuangshang 框架，验证是否能显著减少“频繁对话推进”的人肉调度成本。

## 当前定位
在当前技术约束下，OpenProse 优先作为：
- **流程编排层**
- **公开协作 DSL**

而不是：
- 私有 transcript 汇总层
- 黑箱式后台总控器

默认采用：
- **OpenProse 负责编排**
- **频道消息负责回流**

详见：`docs/openprose/channel-feedback.md`

## 范围（本分支）
- 启用/验证 open-prose 插件可运行（以 smoke test 为准）
- 交付 3 个最小 demo：
  - A：需求拆解与拟派单（triage）
  - B：PR/代码审查工作流（review）
  - C：版本发布 runbook（release）
- 固化 runbook + 模板/约定（输出格式、人工确认点、失败回退）
- 将 demo 逐步迁移为“频道公开回流”模式

## 非目标（先不做）
- 直接全自动执行高风险动作（例如：自动合并、自动发布、自动改生产配置）
- 复杂的私有 transcript 汇总编排
- 对 `sessions_history` / `streamTo` 的强依赖

## 验收标准
1. 本地可重复执行 smoke：`scripts/prose-smoke.sh` 成功
2. 三个 demo 在本地可跑，能输出“可直接贴 Discord”的汇报草稿
3. 子 agent 回执能够公开发回频道/线程
4. 文档齐全：`docs/openprose/runbook.md` 能指导新人从 0 跑通

## 里程碑
- M1：插件入口定位 + smoke（当天）
- M2：三条 demo MVP（1-2 天）
- M3：模板化 + 协作规范对齐（2-3 天）
- M4：将 demo 切到“频道回流”模式并验证
