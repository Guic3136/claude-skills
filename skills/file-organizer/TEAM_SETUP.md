# File Organizer Skill - 团队设置指南

## 概述

本技能为团队提供**统一的文件分类规范**，确保所有成员创建文件时自动遵循相同的目录结构。

## 快速开始

### 1. 个人安装

```bash
# 克隆或复制技能到 Claude 技能目录
cp -r file-organizer ~/.claude/skills/

# 重启 Claude Code
claude
```

### 2. 团队共享配置

#### 方案 A: Git 子模块（推荐）

```bash
# 在项目仓库中添加技能为子模块
git submodule add https://github.com/your-team/file-organizer-skill.git .claude/skills/file-organizer

# 团队成员克隆时
git clone --recurse-submodules <your-repo>
```

#### 方案 B: 直接复制

```bash
# 将技能文件提交到项目仓库
cp -r file-organizer/ your-project/.claude/skills/
git add .claude/skills/file-organizer
git commit -m "Add file-organizer skill for team"
```

#### 方案 C: 共享配置（仅规则文件）

```bash
# 只共享规则文件
cp organization-rules.json your-project/.claude/
```

## 团队工作流程

### 首次设置

1. **项目经理/负责人**：
   - 安装技能
   - 根据团队需求调整 `organization-rules.json`
   - 提交到版本控制

2. **团队成员**：
   - 拉取最新代码
   - 技能自动生效
   - 开始创建文件，自动分类

### 日常使用

```
成员A: "创建一个数据分析脚本"
Claude: 自动保存到 → scripts/python/data_analysis.py

成员B: "截图保存结果"
Claude: 自动保存到 → screenshots/test_result_20260314.png

成员C: "生成配置文件"
Claude: 自动保存到 → configs/app_settings.json
```

### 规则更新

当需要修改规则时：

1. 编辑 `organization-rules.json`
2. 提交更改：`git commit -am "Update: 添加 .xml 文件支持"`
3. 推送到仓库：`git push`
4. 团队成员拉取：`git pull`

## 目录结构

安装后，项目结构如下：

```
your-project/
├── .claude/
│   ├── skills/
│   │   └── file-organizer/     # 技能文件（可选提交到版本控制）
│   │       ├── skill.yaml
│   │       ├── system-prompt.md
│   │       └── organization-rules.json
│   └── organization-rules.json  # 团队共享规则（推荐提交）
├── screenshots/                 # 截图文件
├── scripts/
│   ├── python/                 # Python 脚本
│   └── node/                   # Node.js 脚本
├── configs/                     # 配置文件
├── output/                      # 输出文档
├── data/                        # 数据文件
├── tests/                       # 测试文件
├── utils/                       # 工具函数
├── docs/                        # 项目文档
└── temp/                        # 临时文件
```

## 自定义规则

### 本地覆盖

创建 `.claude/local-rules.json`：

```json
{
  "version": "1.0.0-local",
  "extends": "./organization-rules.json",
  "overrides": {
    "rules": [
      {
        "id": "custom_data",
        "name": "自定义数据",
        "extensions": [".custom"],
        "directory": "mydata",
        "naming_pattern": "{name}.{ext}"
      }
    ]
  }
}
```

### 添加新规则

编辑 `organization-rules.json`，添加：

```json
{
  "id": "new_category",
  "name": "新分类名称",
  "extensions": [".ext1", ".ext2"],
  "directory": "newfolder",
  "naming_pattern": "{name}.{ext}",
  "description": "描述用途",
  "examples": ["example.ext1"],
  "auto_create_dir": true
}
```

## 最佳实践

### 1. 版本控制

```bash
# 必须提交
git add .claude/organization-rules.json
git add .claude/WORKSPACE_RULES.md

# 可选提交（技能本身）
git add .claude/skills/file-organizer/
```

### 2. 规则变更流程

```
提议变更 → 团队讨论 → 更新规则 → 通知全员 → 逐步迁移
```

### 3. 冲突解决

当本地规则和团队规则冲突时：

1. Claude 会询问用户选择
2. 或根据 `team_settings.conflict_resolution` 自动处理
3. 推荐设置为 `"ask_user"` 避免误操作

## 故障排除

### 技能未生效

1. 检查技能目录是否存在
2. 重启 Claude Code
3. 检查 `skill.yaml` 语法

### 规则未同步

1. 确认 `organization-rules.json` 在版本控制中
2. 拉取最新代码：`git pull`
3. 检查文件权限

### 文件未自动分类

1. 确认文件扩展名在规则中
2. 检查规则优先级（本地 > 共享 > 默认）
3. 查看 Claude 日志

## 高级配置

### CI/CD 集成

在 CI 中验证文件分类：

```yaml
# .github/workflows/check-organization.yml
name: Check File Organization
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Validate file organization
        run: |
          python .claude/skills/file-organizer/validate.py
```

### 自动化迁移

批量整理现有文件：

```bash
python .claude/skills/file-organizer/migrate.py \
  --source . \
  --rules .claude/organization-rules.json \
  --dry-run  # 先预览
```

## 支持与反馈

- 问题反馈：在团队项目管理工具中创建 Issue
- 规则建议：提交 PR 修改 `organization-rules.json`
- 技能改进：联系技能维护者

---

**维护者**: Leo Baher
**版本**: 1.0.0
**最后更新**: 2026-03-14
