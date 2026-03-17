# Save Progress - 会话进度保存工具

一个用于保存 Claude Code 会话进度并在压缩后自动加载的完整解决方案。

## 功能特性

- 📝 **手动保存**: 使用 `/save-progress` 命令随时保存会话摘要
- ⚠️ **自动提醒**: 上下文即将溢出时自动提醒是否保存
- 🔄 **自动加载**: 压缩后自动加载最近的会话摘要
- 📂 **按时间戳存储**: 避免文件覆盖，支持多版本历史
- ⚙️ **可配置**: 支持自定义上下文上限（128k/200k等）

## 安装

### 1. 安装命令

将 `.claude/commands/save-progress.md` 复制到你的项目目录：

```bash
mkdir -p .claude/commands
cp skills/save-progress/.claude/commands/save-progress.md .claude/commands/
```

### 2. 安装脚本

将 `.claude/scripts/` 下的文件复制到你的用户配置目录：

```bash
# Windows
mkdir -p %USERPROFILE%\.claude\scripts
cp .claude/scripts/*.js %USERPROFILE%\.claude\scripts\

# macOS/Linux
mkdir -p ~/.claude/scripts
cp .claude/scripts/*.js ~/.claude/scripts/
```

### 3. 配置 Hooks

在你的 `settings.json`（用户级别或项目级别）中添加：

```json
{
  "env": {
    "SAVE_PROGRESS_CONTEXT_LIMIT": "128000",
    "SAVE_PROGRESS_WARNING_THRESHOLD": "0.9"
  },
  "hooks": {
    "PreCompact": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "上下文窗口即将达到上限并自动压缩。询问用户：'⚠️ 上下文即将溢出，是否先保存当前进展到文件？' 如果用户同意，创建一个带时间戳的文件 summaries/session-summary-YYYY-MM-DD-HHMM.md，记录：1) 当前任务目标 2) 已完成的工作 3) 关键决策和发现 4) 下一步计划。如果 summaries 目录不存在则自动创建。然后继续压缩。",
            "statusMessage": "上下文即将溢出，询问是否保存进度..."
          }
        ]
      }
    ],
    "PostCompact": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node ~/.claude/scripts/load-summary.js",
            "statusMessage": "正在加载会话摘要..."
          }
        ]
      }
    ]
  }
}
```

**Windows 用户注意**: 将 `~/.claude/scripts/` 替换为实际路径，如 `C:/Users/Admin/.claude/scripts/`

## 配置上下文上限

### 方法 1: 环境变量（推荐）

在 `settings.json` 中设置：

```json
{
  "env": {
    "SAVE_PROGRESS_CONTEXT_LIMIT": "200000",
    "SAVE_PROGRESS_WARNING_THRESHOLD": "0.9"
  }
}
```

支持的模型上下文上限：
- Claude Sonnet/Opus: 128000 (默认)
- Claude 3.5 Sonnet: 200000
- 其他模型: 根据实际调整

### 方法 2: 配置文件

创建 `.claude/save-progress-config.json`：

```json
{
  "contextLimit": 200000,
  "warningThreshold": 0.9,
  "autoSaveOnOverflow": false,
  "summariesDir": "summaries"
}
```

配置项说明：

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `contextLimit` | number | 128000 | 模型上下文上限（tokens） |
| `warningThreshold` | number | 0.9 | 警告阈值（0-1），如 0.9 表示 90% 时预警 |
| `autoSaveOnOverflow` | boolean | false | 是否自动保存（无需确认） |
| `summariesDir` | string | "summaries" | 摘要文件存储目录 |

## 使用方法

### 手动保存进度

```
/save-progress
```

执行后会：
1. 创建 `summaries/` 目录（如果不存在）
2. 生成带时间戳的摘要文件：`session-summary-2026-03-17-2110.md`
3. 记录当前任务目标、已完成工作、关键决策和下一步计划
4. 提示你运行 `/compact` 压缩上下文

### 压缩并加载

```
/compact
```

压缩后会自动加载最近保存的会话摘要。

### 自然溢出处理

当上下文接近上限时：
1. PreCompact hook 会自动触发中文提醒
2. 确认后会自动保存摘要
3. 自动执行压缩
4. PostCompact hook 自动加载摘要

### 查看当前配置

```bash
# 查看完整配置
node ~/.claude/scripts/save-progress-config.js

# 查看上下文上限
node ~/.claude/scripts/save-progress-config.js --context-limit

# 查看警告阈值
node ~/.claude/scripts/save-progress-config.js --warning-threshold
```

## 文件结构

```
your-project/
├── .claude/
│   ├── commands/
│   │   └── save-progress.md      # 自定义命令
│   ├── scripts/                  # 用户级脚本（全局安装）
│   │   ├── load-summary.js
│   │   └── save-progress-config.js
│   └── save-progress-config.json # 可选：自定义配置
├── summaries/                     # 自动创建的摘要目录
│   ├── session-summary-2026-03-17-2110.md
│   ├── session-summary-2026-03-17-2230.md
│   └── ...
└── .last-summary                  # 指向最新摘要的指针文件
```

## 配置说明

### PreCompact Hook

- **触发时机**: 上下文窗口即将达到上限（自然溢出时）
- **功能**: 弹出中文提示，询问是否保存进度
- **限制**: 不响应 `/compact` 手动命令，仅在自然溢出时触发

### PostCompact Hook

- **触发时机**: 执行 `/compact` 命令后
- **功能**: 自动查找并加载最新的会话摘要
- **查找逻辑**:
  1. 先检查 `.last-summary` 文件
  2. 如果没有，查找 `summaries/` 目录下最新的 `session-summary-*.md` 文件

## 注意事项

1. **Windows 路径**: 在 `settings.json` 中使用正斜杠或双反斜杠，如 `C:/Users/Admin/.claude/scripts/load-summary.js`
2. **重启生效**: 添加或修改 `.claude/commands/` 下的命令后，需要重启 Claude Code
3. **命令格式**: 自定义命令必须使用 `.md` 格式（Markdown + YAML frontmatter），不支持 `.json` 格式
4. **上下文上限**: 根据你的 Claude Code 订阅和模型选择调整 `contextLimit`，默认 128000 适用于大多数场景

## 故障排除

### /save-progress 命令不存在

- 检查文件是否在 `.claude/commands/save-progress.md`
- 确认使用 `.md` 格式而非 `.json`
- 重启 Claude Code

### 压缩后不加载摘要

- 检查 `load-summary.js` 路径是否正确
- 确认 `summaries/` 目录存在且有 `session-summary-*.md` 文件
- 检查 `settings.json` 中的 hook 配置

### 配置不生效

- 检查 `.claude/save-progress-config.json` 是否存在且格式正确
- 检查 `settings.json` 中的 `env` 配置
- 重启 Claude Code 使环境变量生效

## 作者

Leo Baher

## 许可证

MIT
