# Claude Skills

Claude Code 技能库，提供文件自动分类等生产力工具，支持团队协作。

## 技能列表

<!-- 自动从 registry.yaml 生成 -->
| 技能 | 分类 | 描述 | 版本 | 状态 |
|------|------|------|------|------|
| [file-organizer](./skills/file-organizer) | 🚀 生产力 | 工作区文件自动分类 - 创建即分类 | 1.0.0 | ✅ 稳定 |

**总计**: 1 个技能 | [查看所有技能](./registry.yaml)

## 快速开始

### 安装单个技能

```bash
# 克隆本仓库
git clone https://github.com/Guic3136/claude-skills.git

# 安装指定技能到 Claude Code
cd claude-skills
./scripts/install.sh file-organizer

# 重启 Claude Code
claude
```

### 安装所有推荐技能

```bash
./scripts/install.sh --default
```

### 手动安装

```bash
# 复制技能到 Claude 技能目录
cp -r skills/file-organizer ~/.claude/skills/

# 重启 Claude Code
claude
```

## 目录结构

```
claude-skills/
├── skills/                        # ⭐ 所有技能存放于此
│   ├── file-organizer/           # 技能1: 文件自动分类
│   ├── [更多技能...]/            # 技能2, 3, ...
│   └── _template/                # 技能模板
├── templates/                     # 开发模板
│   └── skill-template/           # 新建技能的模板
├── docs/                         # 开发文档
│   ├── getting-started.md       # 入门指南
│   ├── multi-skill-architecture.md  # 多技能架构设计
│   └── skill-development.md     # 开发指南
├── scripts/                      # 辅助脚本
│   ├── install.sh               # 安装脚本
│   └── validate-all.py          # 验证所有技能
└── registry.yaml                 # 技能注册表
```

## 开发新技能

### 快速创建

```bash
# 使用模板创建新技能
cp -r templates/skill-template skills/my-skill

# 编辑配置
vim skills/my-skill/skill.yaml
vim skills/my-skill/system-prompt.md

# 提交到仓库
git add skills/my-skill
git commit -m "Add skill: my-skill v1.0.0"
git push
```

### 详细指南

- [多技能架构设计](./docs/multi-skill-architecture.md) - 了解如何扩展
- [技能开发指南](./docs/getting-started.md) - 开发新技能的详细步骤
- [团队分享指南](./TEAM_SHARING.md) - 如何分享给团队成员

## 分类

| 分类 | 图标 | 技能数量 | 说明 |
|------|------|----------|------|
| 生产力 | 🚀 | 1 | 文件管理、任务自动化 |
| 沟通协作 | 💬 | 0 | Git 提交、PR 管理 |
| 开发工具 | 💻 | 0 | 代码审查、测试生成 |
| 文档工具 | 📝 | 0 | 文档生成、注释完善 |
| 分析工具 | 🔍 | 0 | 代码分析、质量检查 |

## 许可证

MIT License
