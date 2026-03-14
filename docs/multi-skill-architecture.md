# 多技能架构设计

## 当前结构（已支持多技能）

```
claude-skills/
├── README.md                      # 仓库总览
├── TEAM_SHARING.md               # 团队分享指南
├── docs/                          # 文档
│   ├── getting-started.md        # 入门指南
│   ├── multi-skill-architecture.md  # 本文件
│   └── skill-development.md      # 开发指南
├── skills/                        # ⭐ 所有技能存放于此
│   ├── file-organizer/           # 技能1: 文件自动分类
│   │   ├── skill.yaml
│   │   ├── system-prompt.md
│   │   ├── organization-rules.json
│   │   ├── TEAM_SETUP.md
│   │   └── validate.py
│   ├── code-reviewer/            # 技能2: 代码审查 (示例)
│   │   ├── skill.yaml
│   │   ├── system-prompt.md
│   │   └── review-rules.json
│   ├── doc-generator/            # 技能3: 文档生成 (示例)
│   │   ├── skill.yaml
│   │   ├── system-prompt.md
│   │   └── templates/
│   └── [更多技能...]
├── templates/                     # 技能模板
│   └── skill-template/           # 新建技能的模板
├── scripts/                       # 辅助脚本
│   ├── install.sh                # 安装单个/所有技能
│   ├── install-all.sh            # 一键安装所有
│   └── validate-all.py           # 验证所有技能
└── registry.yaml                 # 技能注册表（新增）
```

## 添加新技能的方法

### 方法1: 使用模板（推荐）

```bash
# 1. 复制模板
cp -r templates/skill-template skills/my-new-skill

# 2. 编辑配置文件
cd skills/my-new-skill
vim skill.yaml          # 修改名称、描述
vim system-prompt.md    # 编写技能逻辑

# 3. 提交到仓库
git add skills/my-new-skill
git commit -m "Add skill: my-new-skill v1.0.0"
git push
```

### 方法2: 从头创建

```bash
mkdir skills/another-skill
cd skills/another-skill

# 创建必要文件
touch skill.yaml
touch system-prompt.md
touch README.md
```

## 技能注册表（新增）

创建 `registry.yaml` 管理所有技能：

```yaml
# claude-skills/registry.yaml
version: "1.0.0"
last_updated: "2026-03-14"

skills:
  - id: file-organizer
    name: 文件自动分类
    version: 1.0.0
    author: Leo Baher
    description: 工作区文件自动分类 - 创建即分类
    category: productivity
    tags: [file-management, organization, workspace]
    path: skills/file-organizer
    install_by_default: true
    dependencies: []

  - id: code-reviewer
    name: 代码审查助手
    version: 0.1.0
    author: Leo Baher
    description: 自动代码审查，检查常见问题和最佳实践
    category: development
    tags: [code-review, quality, best-practices]
    path: skills/code-reviewer
    install_by_default: false
    dependencies: []

  - id: doc-generator
    name: 文档生成器
    version: 0.1.0
    author: Leo Baher
    description: 根据代码自动生成文档
    category: documentation
    tags: [docs, automation, templates]
    path: skills/doc-generator
    install_by_default: false
    dependencies: []

categories:
  - id: productivity
    name: 生产力工具
    description: 提高工作效率的工具
  - id: development
    name: 开发工具
    description: 辅助开发的工具
  - id: documentation
    name: 文档工具
    description: 文档生成和管理工具
```

## 改进的安装脚本

### 安装单个技能

```bash
./scripts/install.sh file-organizer
```

### 安装所有推荐技能

```bash
./scripts/install.sh --default
```

### 安装所有技能

```bash
./scripts/install.sh --all
```

### 改进后的 install.sh 示例

```bash
#!/bin/bash
# claude-skills/scripts/install.sh

SKILLS_DIR="${HOME}/.claude/skills"
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REGISTRY="${REPO_DIR}/registry.yaml"

# 解析参数
SKILL_NAME="${1}"
INSTALL_ALL=false
INSTALL_DEFAULT=false

if [ "$1" == "--all" ]; then
    INSTALL_ALL=true
elif [ "$1" == "--default" ]; then
    INSTALL_DEFAULT=true
elif [ -z "$1" ]; then
    echo "用法: $0 <skill-name>|--all|--default"
    echo ""
    echo "示例:"
    echo "  $0 file-organizer     # 安装单个技能"
    echo "  $0 --default          # 安装所有推荐技能"
    echo "  $0 --all              # 安装所有技能"
    exit 1
fi

mkdir -p "$SKILLS_DIR"

echo "Claude Skills 安装程序"
echo "======================"

# 安装单个技能
install_skill() {
    local skill_name=$1
    local skill_path="${REPO_DIR}/skills/${skill_name}"

    if [ ! -d "$skill_path" ]; then
        echo "❌ 错误: 技能 '$skill_name' 不存在"
        return 1
    fi

    local target="${SKILLS_DIR}/${skill_name}"

    # 删除旧版本
    if [ -L "$target" ]; then
        rm "$target"
    elif [ -d "$target" ]; then
        rm -rf "$target"
    fi

    # 创建符号链接
    ln -sf "$skill_path" "$target"
    echo "✅ 已安装: $skill_name"
}

if [ "$INSTALL_ALL" == true ]; then
    echo "安装所有技能..."
    for skill_path in "${REPO_DIR}"/skills/*; do
        if [ -d "$skill_path" ]; then
            skill_name=$(basename "$skill_path")
            install_skill "$skill_name"
        fi
    done
elif [ "$INSTALL_DEFAULT" == true ]; then
    echo "安装推荐技能..."
    # 从 registry.yaml 读取 install_by_default: true 的技能
    # 这里简化处理，假设有解析 yaml 的工具
    for skill_path in "${REPO_DIR}"/skills/*; do
        if [ -d "$skill_path" ]; then
            skill_name=$(basename "$skill_path")
            install_skill "$skill_name"
        fi
    done
else
    install_skill "$SKILL_NAME"
fi

echo ""
echo "安装完成！请重启 Claude Code"
echo "已安装技能:"
ls -1 "$SKILLS_DIR"
```

## 技能分类规划

### 按功能分类

| 分类 | 技能示例 | 用途 |
|------|----------|------|
| **productivity** | file-organizer | 文件管理、任务自动化 |
| **development** | code-reviewer, test-generator | 代码质量、测试辅助 |
| **documentation** | doc-generator, readme-writer | 文档生成、注释完善 |
| **communication** | commit-message, pr-helper | Git 提交、PR 管理 |
| **analysis** | code-metrics, dependency-checker | 代码分析、依赖检查 |

### 按项目阶段分类

| 阶段 | 技能 | 用途 |
|------|------|------|
| **开发前** | project-scaffold | 项目脚手架生成 |
| **开发中** | code-reviewer, file-organizer | 代码审查、文件管理 |
| **开发后** | doc-generator, test-generator | 文档、测试生成 |
| **发布** | release-helper, changelog-generator | 发布管理 |

## 技能间依赖管理

如果技能之间有依赖关系：

```yaml
# skill.yaml
dependencies:
  - name: file-organizer
    version: ">=1.0.0"
    required: true

  - name: code-base
    version: ">=0.5.0"
    required: false  # 可选依赖
```

安装时自动检查依赖：

```bash
./scripts/install.sh doc-generator
# 输出:
# 依赖检查...
# ✅ file-organizer 已安装
# ⚠️  code-base 未安装（可选）
# 继续安装 doc-generator...
```

## 版本管理

### 技能版本独立

每个技能有自己的版本：

```
skills/
├── file-organizer/v1.0.0/
├── file-organizer/v1.1.0/  # 新版本
├── code-reviewer/v0.5.0/
└── code-reviewer/v1.0.0/   # 新版本
```

或：

```
skills/
├── file-organizer/         # 当前版本
│   ├── skill.yaml (version: 1.0.0)
│   └── versions/
│       ├── v0.9.0/
│       └── v1.0.0/
```

### 使用 Git 标签

```bash
# 为单个技能打标签
git tag skill/file-organizer/v1.0.0
git push origin skill/file-organizer/v1.0.0
```

## 长期维护建议

### 1. 技能目录命名规范

```
skills/
├── file-organizer/           # ✅ 使用连字符分隔
├── code_reviewer/            # ❌ 不要用下划线
├── CodeReviewer/             # ❌ 不要大写
├── codeReviewer/             # ❌ 不要驼峰
└── doc-generator/            # ✅ 简短、清晰
```

### 2. 必需文件清单

每个技能必须包含：

```
skills/<skill-name>/
├── skill.yaml              # ✅ 技能定义（必需）
├── system-prompt.md        # ✅ 核心提示词（必需）
├── README.md               # ✅ 使用说明（必需）
└── [其他配置文件]          # 根据技能需要
```

### 3. README 模板

```markdown
# Skill Name

## 简介
一句话描述技能的作用。

## 功能
- 功能1: 描述
- 功能2: 描述

## 安装
```bash
cd claude-skills
./scripts/install.sh skill-name
```

## 使用示例
用户: "..."
Claude: [技能效果]

## 配置
如果有配置选项，在这里说明。

## 更新日志
- v1.0.0 (2026-03-14): 初始版本
```

## 示例：添加第二个技能

### 步骤

1. **复制模板**
```bash
cp -r templates/skill-template skills/commit-message
```

2. **编辑 skill.yaml**
```yaml
name: commit-message
description: 自动生成规范的 Git 提交信息
version: 1.0.0
author: Leo Baher
tags:
  - git
  - productivity
  - automation

category: communication

entry_point:
  type: prompt
  file: system-prompt.md
```

3. **编辑 system-prompt.md**
```markdown
# Commit Message Generator

## 任务
根据代码变更生成规范的 Git 提交信息。

## 规则
- 使用中文或英文（根据项目语言）
- 遵循 Conventional Commits 规范
- 格式: `<type>: <description>`

## Types
- feat: 新功能
- fix: 修复
- docs: 文档
- style: 格式
- refactor: 重构
- test: 测试
- chore: 构建/工具

## 示例
用户: "生成提交信息"
Claude: 分析 git diff → 生成: "feat: add user authentication"
```

4. **提交**
```bash
git add skills/commit-message
git commit -m "Add skill: commit-message v1.0.0"
git push
```

5. **安装使用**
```bash
./scripts/install.sh commit-message
```

## 总结

当前结构 **完全支持** 多个技能：

- ✅ `skills/` 目录可存放任意数量的技能
- ✅ 每个技能独立目录，互不干扰
- ✅ 可以独立版本控制
- ✅ 可以选择性安装
- ✅ 便于团队协作

添加新技能就像添加新文件夹一样简单！
