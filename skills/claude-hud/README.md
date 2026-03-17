# Claude HUD

自定义 Claude Code 状态栏，实时显示关键信息，提升开发效率。

## 功能介绍

Claude HUD 在状态栏中显示以下信息：

| 组件 | 说明 |
|------|------|
| **模型显示** | 当前使用的 Claude 模型（如 Opus 4.6、Sonnet 4.6） |
| **Context 使用率** | 可视化进度条显示上下文使用情况 |
| **Git 状态** | 分支名、是否有未提交更改 |
| **项目路径** | 当前工作目录（可配置显示完整路径或仅项目名） |
| **Agent 状态** | 是否有 Agent 正在运行 |
| **Todo 进度** | 待办任务完成进度 |

## 安装方法

```bash
./install.sh
```

安装完成后重启 Claude Code 即可看到状态栏。

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
  "displayItems": ["model", "context", "tokens", "git", "path", "tool", "agent", "todo"],
  "maxContextTokens": 200000,
  "colors": {
    "primary": "\u001b[36m",
    "success": "\u001b[32m",
    "warning": "\u001b[33m",
    "error": "\u001b[31m",
    "info": "\u001b[34m",
    "secondary": "\u001b[35m",
    "muted": "\u001b[90m"
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

### 自定义上下文上限

**重要**：你可以通过修改 `maxContextTokens` 来适配不同的 Claude 模型上下文限制，**无需修改代码**。

**常见模型配置：**

| 模型 | 上下文上限 | maxContextTokens 建议值 |
|------|-----------|------------------------|
| Claude Sonnet/Opus | 128,000 | 128000 或 115200 (90%预警) |
| Claude 3.5 Sonnet | 200,000 | 200000 或 180000 (90%预警) |
| Claude 3 Opus | 200,000 | 200000 |

**配置示例：**

```json
{
  "preset": "full",
  "maxContextTokens": 200000,
  "displayItems": ["model", "context", "tokens", "git"]
}
```

修改后重启 Claude Code 即可生效。

**工作原理：**
- HUD 会读取 `maxContextTokens` 作为显示的上限
- 达到 90% 时显示 ⚠️ 警告图标
- 例如：设置为 200000，使用 180000 时会显示 `⚠️ [████████░░] 90%`

## 预设配置

### essential（精简模式）

仅显示最常用信息：
- Context 使用率
- Git 分支

```bash
hud-config --preset essential
```

### full（完整模式）

显示所有可用信息：
- 模型、Context、Git、路径、Agent、Todo

```bash
hud-config --preset full
```

### minimal（极简模式）

最少干扰，仅在需要时显示：
- 仅 Context 使用率（超过阈值时）

```bash
hud-config --preset minimal
```

## 卸载方法

```bash
./uninstall.sh
```

卸载后状态栏将恢复为默认样式。

## 故障排查

**状态栏未显示**
- 确认已重启 Claude Code
- 检查 `~/.claude/plugins/claude-hud/` 目录是否存在
- 查看 Claude Code 日志获取错误信息

**配置未生效**
- 运行 `hud-config` 重新加载配置
- 检查 `~/.claude/hud-config.json` 语法是否正确
- 确认使用 `maxContextTokens` 而不是其他名称

**上下文上限显示不正确**
- 检查 `hud-config.json` 中 `maxContextTokens` 是否为数字类型
- 确认重启了 Claude Code
- 查看当前配置：`cat ~/.claude/hud-config.json`

## 许可证

MIT License
