# CSV Wave Execution Context

**Session**: `cwp-openmoss-absorption-20260316`
**Requirement**: 将 OpenMOSS 吸收路线图转为可执行的 CSV Wave 工作流
**Prepared**: 2026-03-16
**Status**: Ready for wave execution planning

> 本 CSV session 只覆盖 `danghuangshang` 对 OpenMOSS 的 **核心治理层吸收**：
> `task core -> activity log -> review/patrol -> gui control plane`
>
> 明确不包含：
> `rules / prompt management / notification-lite / reflection-scoring / planner-executor systemization / agent auth-registration`

---

## Feasibility Verdict

**可行，但要分清两件事：**

1. **转成 wave 工作流**：可行，而且已经具备条件  
   当前路线图和 issue 台账已经足够生成依赖有序的 `tasks.csv`。

2. **在本会话里直接跑完整 wave agents**：当前不可直接完成  
   原因不是方案不合理，而是当前工具环境里**没有可调用的 `spawn_agents_on_csv` 执行器**。因此，这里能把你带到“执行前一刻”，但不能在本会话里真正启动 CSV 子代理波次执行引擎。

---

## Important Clarification

路线图中的 `Wave 1 / 2 / 3` 更准确地说是**阶段层级**，不是严格的拓扑执行波次。

按真实依赖计算后，应展开为：

| Execution Wave | Tasks | Why |
|----------------|-------|-----|
| 1 | `1` | ADR 和边界冻结必须最先完成 |
| 2 | `2` | 模型和状态机依赖 ADR |
| 3 | `3` | ActivityLog/API 依赖 task core |
| 4 | `4`, `5` | review 与 patrol 都依赖任务核心和事件流，二者可并行 |
| 5 | `6` | 任务 GUI 依赖 review/patrol 的真实数据面 |
| 6 | `7` | 控制面依赖 task board 已落地 |

因此：
- **可以进入 wave 工作流**
- 但应按**6 个执行波次**运行，而不是按原先 3 个 phase 直接并发

---

## Recommended Execution Mode

### 最合理的进入方式

先进入 **Wave 1 / Wave 2 / Wave 3 的串行验证**，确认 task core 方向成立，再在 Wave 4 开始使用并发。

推荐并发参数：

- `Wave 1-3`: `concurrency = 1`
- `Wave 4`: `concurrency = 2`
- `Wave 5-6`: `concurrency = 1`

原因：
- 前三波是基础抽象，不值得并发冒险
- 第四波的 `review` 和 `patrol` scope 已拆开，适合并发
- 后两波再次收敛到 GUI 集成，回到串行更稳

---

## Scope Discipline

本次 CSV 化已经按 scope 做了约束，目的是避免并发冲突：

- `task-core`: `src/openmoss/task-core/**`
- `activity-log`: `src/openmoss/activity-log/**`
- `review`: `src/openmoss/review/**`
- `patrol`: `src/openmoss/patrol/**`
- `gui`: `gui/src/pages/**`, `gui/src/App.tsx`, `gui/server/**`

唯一需要注意的是：
- 多个任务都允许最小范围触碰 `gui/server/**`
- 因此真正执行时，**Wave 4 并发前要再检查 server API 入口是否会冲突**

如果冲突风险高，则把 Wave 4 也改为串行。

---

## What Is Ready Now

- 已有可执行主状态文件：
  - `/root/danghuangshang/.workflow/.csv-wave/cwp-openmoss-absorption-20260316/tasks.csv`
- 已有波次级验收门文档：
  - `/root/danghuangshang/.workflow/.csv-wave/cwp-openmoss-absorption-20260316/wave-gates.md`
- 已有前置输入：
  - 路线图
  - issue 台账
  - 开发 SOP
  - 吸收优先级分析
- 已明确：
  - 真实依赖波次
  - scope 约束
  - phase 与 wave 的区别
  - `install.sh` 当前仍不应进入执行范围
  - 当前 CSV 只对应 A 类优先吸收项，不覆盖后续 backlog

---

## What Is Not Ready Yet

- 当前会话没有 `spawn_agents_on_csv` 执行工具
- 尚未生成每个 wave 的临时 CSV 和结果合并器
- 尚未选择第一波是“文档型执行”还是“直接代码型执行”
- post-core backlog 尚未转入新的 CSV session

---

## Practical Recommendation

如果你要继续转入具体执行，我建议这样做：

1. **先把 Wave 1 单独落地**
   - 只执行任务 `1`
   - 产出正式 ADR

2. **ADR 稳定后再进入 Wave 2-3**
   - 任务 `2`
   - 任务 `3`

3. **只有任务核心和事件流跑通后，再决定是否开启 Wave 4 并发**
   - 任务 `4`
   - 任务 `5`

每一波结束后，除了检查任务级 `acceptance_criteria`，还要检查独立的波次级验收门：
- `/root/danghuangshang/.workflow/.csv-wave/cwp-openmoss-absorption-20260316/wave-gates.md`

当前不应把以下 backlog 混入本 session：
- rules layer
- prompt visibility / audit
- reflection / scoring
- notification-lite
- planner / executor systemization

这比一上来就“整个 CSV 一键跑完”更规范。

---

## Conclusion

**结论是：可以转入具体 wave 工作流，而且当前已经适合这么做。**

但要注意：
- 现在适合做的是**规范化的 wave 规划与逐波执行**
- 不是直接跳过 ADR、跳过 task core、跳过验证去大规模并发实现
- 也不是现在就去改 `install.sh`

换句话说，**可行，但应按“ADR → task core → activity log → review/patrol → GUI”这条真实依赖链进入执行，而不是把 roadmap 的 phase 直接当作并发批次。**
