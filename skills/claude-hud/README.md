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

### 配置选项

```json
{
  "preset": "essential",
  "enabled": true,
  "displayItems": ["model", "context", "git"],
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
    "showPercent": true
  }
}
```

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

## 许可证

MIT License
