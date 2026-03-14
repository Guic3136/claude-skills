# Claude Skills

个人 Claude Code 技能库，包含文件自动分类等团队协作工具。

## 技能列表

| 技能 | 描述 | 版本 |
|------|------|------|
| [file-organizer](./skills/file-organizer) | 工作区文件自动分类 - 创建即分类 | 1.0.0 |

## 快速开始

### 安装技能

```bash
# 克隆本仓库
git clone https://github.com/Guic3136/claude-skills.git

# 安装技能到 Claude Code
cd claude-skills
./scripts/install.sh
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
├── skills/              # 技能集合
│   └── file-organizer/  # 文件自动分类技能
├── templates/           # 技能开发模板
├── docs/               # 开发文档
└── scripts/            # 辅助脚本
```

## 开发新技能

参考 [templates/skill-template](./templates/skill-template) 创建新技能。

## 许可证

MIT License
