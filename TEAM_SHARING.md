# 团队分享指南

## 方案一：直接克隆（推荐 ⭐）

### 步骤

```bash
# 1. 克隆仓库到本地任意位置
git clone https://github.com/Guic3136/claude-skills.git

# 2. 进入仓库
cd claude-skills

# 3. 运行安装脚本（自动创建符号链接）
./scripts/install.sh        # Linux/Mac
# 或
./scripts/install.ps1       # Windows PowerShell

# 4. 重启 Claude Code
claude
```

### 安装脚本做了什么？

```bash
# 创建符号链接：~/.claude/skills/file-organizer -> ./skills/file-organizer
# 这样技能更新时只需要 git pull，无需重新安装
```

---

## 方案二：手动复制

如果团队成员不想用符号链接：

```bash
# 1. 克隆仓库
git clone https://github.com/Guic3136/claude-skills.git

# 2. 手动复制技能到 Claude 技能目录
# Linux/Mac:
cp -r claude-skills/skills/file-organizer ~/.claude/skills/

# Windows:
xcopy /E /I claude-skills\skills\file-organizer %USERPROFILE%\.claude\skills\file-organizer

# 3. 重启 Claude Code
claude
```

---

## 方案三：作为 Git 子模块（项目仓库中使用）

如果团队成员想在他们的项目仓库中使用：

```bash
# 1. 进入项目仓库
cd their-project

# 2. 添加为子模块
git submodule add https://github.com/Guic3136/claude-skills.git .claude/skills/claude-skills

# 3. 提交
git add .gitmodules .claude/skills/claude-skills
git commit -m "Add claude-skills submodule"

# 4. 安装技能
ln -s .claude/skills/claude-skills/skills/file-organizer ~/.claude/skills/file-organizer
```

**更新子模块：**
```bash
git submodule update --remote
```

---

## ⚠️ 重要：Token 配置

### 技能本身不包含 Token

`file-organizer` 技能**不需要** GitHub Token，它只是一个规则文件。

### 如果团队成员需要 GitHub MCP

他们需要自己在 `.claude.json` 中配置：

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "他们自己的_token_here"
      }
    }
  }
}
```

### 安全提醒

- ❌ 永远不要把 Token 提交到仓库
- ✅ 每个团队成员使用自己的 Token
- ✅ Token 只存储在本地 `.claude.json` 中

---

## 验证安装

团队成员安装后，可以验证是否成功：

```bash
# 检查技能目录
ls ~/.claude/skills/
# 应该看到: file-organizer, claude-hud, save-progress

# 在 Claude Code 中测试
cd their-project
claude
```

### file-organizer 验证

问 Claude：
```
"创建一个 Python 测试脚本"
```

如果 Claude 自动保存到 `scripts/python/` 目录，说明安装成功！

### claude-hud 验证

重启 Claude Code 后，输入框下方应出现状态栏，显示模型名称、Context 使用率、Git 分支等信息。

如果没有显示，检查：
```bash
ls ~/.claude/plugins/claude-hud/dist/index.js
cat ~/.claude/settings.json | grep statusLine
```

### save-progress 验证

在 Claude Code 中执行压缩操作后，会自动加载之前的会话进度。

---

## 更新技能

当有新版本时：

### 方案一（使用符号链接）：
```bash
cd claude-skills
git pull
# 自动生效，无需重新安装
```

### 方案二（手动复制）：
```bash
cd claude-skills
git pull
rm -rf ~/.claude/skills/file-organizer
cp -r skills/file-organizer ~/.claude/skills/
```

---

## 快速命令清单

发给团队成员的快捷指令：

```bash
# 一键安装所有技能（Linux/Mac）
git clone https://github.com/Guic3136/claude-skills.git && \
cd claude-skills && \
python3 scripts/install.py --all && \
echo "安装完成！请重启 Claude Code"

# 只安装 HUD 状态栏（Linux/Mac）
git clone https://github.com/Guic3136/claude-skills.git && \
cd claude-skills && \
python3 scripts/install.py claude-hud && \
echo "安装完成！请重启 Claude Code"

# 一键安装（Windows PowerShell）
git clone https://github.com/Guic3136/claude-skills.git; \
cd claude-skills; \
python scripts\install.py --all; \
Write-Host "安装完成！请重启 Claude Code"
```

---

## 常见问题

### Q: 安装后 Claude 没有识别技能？
A: 重启 Claude Code：`claude` 或按 `Ctrl+C` 后重新启动

### Q: 技能目录在哪里？
A:
- Windows: `%USERPROFILE%\.claude\skills\`
- Linux/Mac: `~/.claude/skills/`

### Q: 可以同时安装多个技能吗？
A: 可以，每个技能一个子目录：
```
~/.claude/skills/
├── file-organizer/
├── claude-hud/
├── save-progress/
└── ...
```

### Q: HUD 状态栏安装后没有显示？
A: 检查以下几点：
1. `~/.claude/settings.json` 中是否包含 `statusLine` 配置
2. `~/.claude/plugins/claude-hud/dist/index.js` 文件是否存在
3. Node.js 版本是否 >= 16
4. 运行 `HUD_DEBUG=2 node ~/.claude/plugins/claude-hud/dist/index.js` 查看报错

### Q: HUD 显示的模型名称不正确？
A: HUD 会自动从 settings.json、CC Switch、环境变量中读取模型信息。如果使用 CC Switch，确保切换后 settings.json 中的 model 字段已更新。

### Q: 如何卸载技能？
A: 直接删除技能目录：
```bash
rm -rf ~/.claude/skills/file-organizer
rm -rf ~/.claude/skills/claude-hud
rm -rf ~/.claude/skills/save-progress
```
