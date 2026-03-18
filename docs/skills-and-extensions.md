# 🧩 Skills & Extensions

> ← [返回文档索引](./README.md) | [功能总览](./features.md)

---

## 这页是干什么的

这页专门回答：

- 当前仓库自带了哪些 skills？
- 哪些是可选扩展？
- 这些能力适合干什么？

---

## 预装 Skills

| Skill | 用途 | 前置条件 | 典型场景 |
|------|------|----------|----------|
| `weather` | 天气查询 | 无 | 出行提醒、日程助手 |
| `github` | GitHub Issue/PR/CI 操作 | `gh auth login` | 建 issue、开 PR、查仓库 |
| `notion` | Notion 页面/数据库管理 | Notion Token | 日报、财务、知识库 |
| `hacker-news` | HN 搜索与浏览 | 无 | 技术资讯、热点追踪 |
| `browser-use` | 浏览器自动化 | 浏览器环境 | 社媒操作、网页填表、抓取 |
| `quadrants` | 四象限任务管理 | 对应服务/API | 任务分组、优先级管理 |
| `openviking` | 向量知识库 | OpenViking 相关环境 | 知识检索、资料增强 |

源码入口：

- [skills/README.md](../skills/README.md)

---

## 可选 Extensions

| Extension | 用途 | 前置条件 | 典型场景 |
|-----------|------|----------|----------|
| `novel-openviking` | 给翰林院增加 OpenViking 检索增强 | 已安装 OpenViking | 小说检索、世界观资料联动 |

源码入口：

- [extensions/README.md](../extensions/README.md)

---

## 怎么显示给用户最清楚

推荐分三层显示：

### 首页 / README

只写：

- 有 60+ skill
- 内置哪些代表性能力
- 链接到这页

### 文档索引

在 `docs/README.md` 单独给这页一个入口。

### 这页本身

对每个 skill 只讲 3 件事：

1. 它是干什么的
2. 要不要额外配置
3. 适合什么场景

---

## 常见使用顺序

如果你是第一次用，推荐按这个顺序尝试：

1. `weather`
2. `github`
3. `notion`
4. `browser-use`
5. `openviking`

这样从低门槛到高门槛逐步上手最稳。

---

## 相关文档

- [Notion 接入](./notion-setup.md)
- [进阶篇教程](./tutorial-advanced.md)
- [玩法模式](./usage-modes.md)

---

← [返回文档索引](./README.md)
