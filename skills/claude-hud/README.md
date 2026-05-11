# Claude HUD - 状态栏插件

Claude Code 的状态栏插件，显示实时会话信息。

## 功能

- **model** - 当前模型名称
- **context** - 上下文使用率进度条（90% 时警告）
- **tokens** - Token 数量（k 单位）
- **git** - Git 分支和状态
- **path** - 当前项目路径
- **tool** - 工具使用状态
- **agent** - Agent 运行状态
- **todo** - 任务进度
- **speed** - 当前 Token 输出速率（tok/s）
- **speed-avg** - 会话平均 Token 速率

## 安装

### macOS / Linux

```bash
cd skills/claude-hud
chmod +x install.sh
./install.sh
```

### Windows

在 PowerShell 或 CMD 中执行：

```batch
cd skills\claude-hud
install.cmd
```

安装完成后，重启 Claude Code 即可看到状态栏。

## 配置

配置文件：`~/.claude/hud-config.json`

```bash
# 显示所有项目
hud-config preset full

# 精简模式
hud-config preset essential

# 最小模式（仅上下文）
hud-config preset minimal

# 自定义显示项
hud-config items model,context,speed

# 设置上下文窗口上限
hud-config limit 200000

# 启用/禁用
hud-config enable
hud-config disable
```

## 显示项说明

| 项目 | 说明 |
|------|------|
| model | 模型名称，自动从 settings.json / CC Switch / 环境变量检测 |
| context | 上下文使用率，90% 以上显示 ⚠️ 警告 |
| tokens | 当前/最大 token 数 |
| git | Git 分支名和修改状态 |
| path | 当前工作路径 |
| tool | 当前使用的工具 |
| agent | 运行中的 Agent |
| todo | 任务完成进度 |
| speed | 当前增量 token 速率 |
| speed-avg | 会话平均 token 速率 |

## 跨平台支持

- 所有临时文件使用 `os.tmpdir()`，兼容 Windows/macOS/Linux
- sqlite3 CLI 为可选依赖，Windows 上自动探测插件目录下的 sqlite3.exe
- 安装脚本：macOS/Linux 使用 `install.sh`，Windows 使用 `install.cmd`
