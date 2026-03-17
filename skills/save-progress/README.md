# Save Progress - 会话进度保存工具

一个用于保存 Claude Code 会话进度并在压缩后自动加载的完整解决方案。

## 功能特性

- 📝 **手动保存**: 使用 `/save-progress` 命令随时保存会话摘要
- ⚠️ **自动提醒**: 上下文即将溢出时自动提醒是否保存
- 🔄 **自动加载**: 压缩后自动加载最近的会话摘要
- 📂 **按时间戳存储**: 避免文件覆盖，支持多版本历史
- ⚙️ **可配置**: 支持自定义上下文上限（128k/200k等）
- 🖥️ **跨平台**: 支持 Windows、macOS、Linux

## 安装

### 1. 安装命令

将 `.claude/commands/save-progress.md` 复制到你的项目目录：

```bash
mkdir -p .claude/commands
cp skills/save-progress/.claude/commands/save-progress.md .claude/commands/
```

### 2. 安装脚本

将 `.claude/scripts/` 下的文件复制到你的**用户配置目录**：

**macOS / Linux:**
```bash
mkdir -p ~/.claude/scripts
cp .claude/scripts/*.js ~/.claude/scripts/
```

**Windows:**
```powershell
# PowerShell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.claude\scripts"
Copy-Item ".claude\scripts\*.js" "$env:USERPROFILE\.claude\scripts\"
```

### 3. 配置 Hooks

根据你的操作系统选择对应的配置：

**macOS / Linux** - 使用 `settings.json`：

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

**Windows** - 使用 `settings.windows.json` 作为参考，修改路径：

```json
{
  "hooks": {
    "PostCompact": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node C:/Users/你的用户名/.claude/scripts/load-summary.js",
            "statusMessage": "正在加载会话摘要..."
          }
        ]
      }
    ]
  }
}
```

**⚠️ Windows 用户注意**：
- 将 `C:/Users/你的用户名/.claude/scripts/` 替换为实际路径
- 使用正斜杠 `/` 或双反斜杠 `\\`，不要使用单反斜杠
- 可以参考 `settings.windows.json` 文件

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

**macOS / Linux:**
```bash
# 查看完整配置
node ~/.claude/scripts/save-progress-config.js

# 查看上下文上限
node ~/.claude/scripts/save-progress-config.js --context-limit

# 查看警告阈值
node ~/.claude/scripts/save-progress-config.js --warning-threshold
```

**Windows:**
```powershell
# 查看完整配置
node $env:USERPROFILE\.claude\scripts\save-progress-config.js

# 或指定完整路径
node C:\Users\你的用户名\.claude\scripts\save-progress-config.js --context-limit
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

## 跨平台注意事项

### Windows 特殊说明

1. **路径格式**: 使用正斜杠 `/` 或双反斜杠 `\\`
   - ✅ 正确: `C:/Users/Admin/.claude/scripts/load-summary.js`
   - ❌ 错误: `C:\Users\Admin\.claude\scripts\load-summary.js`

2. **脚本位置**: 推荐放在 `%USERPROFILE%\.claude\scripts\`
   - 实际路径通常是 `C:\Users\你的用户名\.claude\scripts\`

3. **权限问题**: 如果遇到权限错误，尝试：
   ```powershell
   # 检查脚本是否存在
   Test-Path "$env:USERPROFILE\.claude\scripts\load-summary.js"
   
   # 手动运行测试
   node "$env:USERPROFILE\.claude\scripts\load-summary.js"
   ```

### macOS / Linux 特殊说明

1. **路径格式**: 使用标准的 Unix 路径
   - `~/.claude/scripts/load-summary.js`

2. **权限问题**: 确保脚本可执行
   ```bash
   chmod +x ~/.claude/scripts/*.js
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

## 故障排除

### /save-progress 命令不存在

- 检查文件是否在 `.claude/commands/save-progress.md`
- 确认使用 `.md` 格式而非 `.json`
- 重启 Claude Code

### 压缩后不加载摘要

**macOS / Linux:**
- 检查 `~/.claude/scripts/load-summary.js` 是否存在
- 确认 `summaries/` 目录存在且有 `session-summary-*.md` 文件
- 检查 `settings.json` 中的 hook 配置

**Windows:**
- 检查 `C:\Users\你的用户名\.claude\scripts\load-summary.js` 是否存在
- 确认路径使用正斜杠 `/`
- 尝试手动运行脚本看是否有错误

### 配置不生效

- 检查 `.claude/save-progress-config.json` 是否存在且格式正确
- 检查 `settings.json` 中的 `env` 配置
- 重启 Claude Code 使环境变量生效

### 路径相关问题（Windows）

如果遇到 "Cannot find module" 错误：

1. 确认脚本文件确实存在于指定路径
2. 在 `settings.json` 中使用绝对路径
3. 使用正斜杠 `/` 代替反斜杠

## 更新日志

### v1.0.0
- 初始版本发布
- 支持手动保存和自动加载
- 支持跨平台（Windows、macOS、Linux）

## 作者

Leo Baher

## 许可证

MIT
