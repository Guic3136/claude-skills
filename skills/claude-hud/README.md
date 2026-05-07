# Claude HUD

自定义 Claude Code 状态栏，实时显示关键信息，提升开发效率。

## 功能介绍

Claude HUD 在状态栏中显示以下信息：

| 组件 | 说明 |
|------|------|
| **模型显示** | 当前使用的 Claude 模型（如 opus-4-7、sonnet-4-6、mimo-v2） |
| **Context 使用率** | 可视化进度条显示上下文使用情况，90%+ 显示警告图标 |
| **Token 计数** | 当前/最大 token 数（k 格式，如 `45.2k/200k`） |
| **增量速率** | 实时 token 生成速度（tok/s） |
| **平均速率** | 会话平均 token 生成速度 |
| **Git 状态** | 分支名、是否有未提交更改 |
| **项目路径** | 当前工作目录（可配置缩短显示） |
| **Agent 状态** | 是否有 Agent 正在运行 |
| **Todo 进度** | 待办任务完成进度 |

## 安装方法

### 方式一：通过 claude-skills 仓库安装（推荐）

```bash
# 1. 克隆仓库
git clone https://github.com/Guic3136/claude-skills.git

# 2. 运行安装脚本
cd claude-skills
python scripts/install.py claude-hud

# 3. 重启 Claude Code
claude
```

### 方式二：直接运行 HUD 安装脚本

```bash
git clone https://github.com/Guic3136/claude-skills.git
cd claude-skills/skills/claude-hud
./install.sh
```

安装完成后重启 Claude Code 即可看到状态栏。

## 模型自动识别

HUD 支持自动识别当前使用的模型，无需手动配置上下文窗口大小。识别优先级：

1. **`~/.claude/settings.json`** 中的 `model` 字段（CC Switch 等工具修改的配置）
2. **CC Switch 数据库**（`~/.cc-switch/cc-switch.db`）
3. **环境变量**（`CLAUDE_MODEL` / `ANTHROPIC_MODEL` / `MODEL`）
4. **stdin 传入值**（Claude Code 默认提供的模型信息）

上下文窗口大小自动查找（三级匹配）：

1. **精确匹配** — 用户自定义的 `modelContextMap`
2. **前缀匹配** — 如 `claude-opus-4-7-xxx` 匹配 `claude-opus-4-7`
3. **内置匹配** — 内置已知模型映射表

内置已知模型：

| 模型 | 上下文大小 |
|------|-----------|
| claude-opus-4-7 | 200,000 |
| claude-sonnet-4-6 | 200,000 |
| claude-haiku-4-5 | 200,000 |
| claude-3-5-sonnet | 200,000 |
| claude-3-5-haiku | 200,000 |
| claude-3-opus | 200,000 |
| claude-3-sonnet | 200,000 |
| claude-3-haiku | 200,000 |
| mimo-v2 | 262,144 |
| mimo-v2-pro | 262,144 |

如果模型不在内置列表中，会回退到用户配置的 `maxContextTokens`。

## 配置指南

使用 `hud-config` 命令打开交互式配置界面：

```bash
hud-config
```

### 配置文件位置

配置文件位于 `~/.claude/hud-config.json`

### 配置选项

```json
{
  "preset": "full",
  "enabled": true,
  "displayItems": ["model", "context", "tokens", "speed", "speed-avg", "git", "path", "tool", "agent", "todo"],
  "maxContextTokens": 0,
  "modelContextMap": {
    "my-custom-model": 128000
  },
  "colors": {
    "primary": "[36m",
    "success": "[32m",
    "warning": "[33m",
    "error": "[31m",
    "info": "[34m",
    "secondary": "[35m",
    "muted": "[90m"
  },
  "format": {
    "separator": " | ",
    "progressBarWidth": 10,
    "progressBarFilled": "█",
    "progressBarEmpty": "░",
    "showPercent": true,
    "shortenPath": true,
    "maxPathLength": 30
  }
}
```

### 自定义模型上下文映射

如果使用非标准模型，可以通过 `modelContextMap` 手动映射上下文大小：

```json
{
  "modelContextMap": {
    "my-custom-model": 128000,
    "another-model": 64000
  }
}
```

匹配规则：先精确匹配，再前缀匹配（最长前缀优先），最后查内置映射。

### 自定义上下文上限

`maxContextTokens` 作为兜底上限，仅在模型自动识别和 `modelContextMap` 都无法匹配时生效。大多数情况下不需要手动设置。

## 预设配置

### essential（精简模式）

仅显示最常用信息：
- 模型、Context 使用率、Git 分支

```bash
hud-config --preset essential
```

### full（完整模式）

显示所有可用信息：
- 模型、Context、Token 计数、速率、Git、路径、Agent、Todo

```bash
hud-config --preset full
```

### minimal（极简模式）

最少干扰，仅在需要时显示：
- 仅 Context 使用率（超过阈值时）

```bash
hud-config --preset minimal
```

## 调试

当状态栏显示异常时，可以启用调试日志：

```bash
export HUD_DEBUG=1        # 写入 /tmp/hud-debug.log
export HUD_DEBUG=2        # 同时输出到 stderr（实时查看）
```

日志包含模型解析过程、stdin 原始数据、上下文大小匹配结果等信息。

## 卸载方法

```bash
./uninstall.sh
```

卸载后状态栏将恢复为默认样式。

## 故障排查

**状态栏未显示**
- 确认已重启 Claude Code
- 检查 `~/.claude/plugins/claude-hud/` 目录是否存在
- 检查 `~/.claude/settings.json` 中是否配置了 `statusLine`
- 运行 `HUD_DEBUG=2 node ~/.claude/plugins/claude-hud/dist/index.js` 查看报错

**模型显示不正确**
- HUD 会优先读取 `~/.claude/settings.json` 中的 `model` 字段
- 如果使用 CC Switch，确保 `settings.json` 中的 model 已更新
- 可通过 `HUD_DEBUG=1` 查看模型解析日志

**上下文上限显示不正确**
- 内置模型会自动匹配上下文大小，通常不需要手动配置
- 非标准模型可在 `hud-config.json` 中添加 `modelContextMap` 映射
- 检查 `~/.claude/hud-config.json` 语法是否正确

## 许可证

MIT License
