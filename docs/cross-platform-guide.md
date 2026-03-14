# 跨平台安装指南

本文档详细说明 Claude Skills 在不同操作系统上的安装方法。

## 支持的操作系统

| 系统 | 版本 | 支持状态 | 推荐安装方式 |
|------|------|----------|--------------|
| Windows | 10/11 | ✅ 完全支持 | Python 脚本 |
| macOS | 12+ (Monterey+) | ✅ 完全支持 | Bash 或 Python |
| Linux | Ubuntu 20.04+, CentOS 8+ | ✅ 完全支持 | Bash 或 Python |

## 安装方式对比

### 1. Python 脚本（推荐 ⭐）

**适用**: 所有平台 (Windows, macOS, Linux)

**优点**:
- 跨平台兼容
- 自动检测系统类型
- 智能处理符号链接（Windows 自动使用复制）
- 清晰的错误提示

**要求**:
- Python 3.7+

**使用方法**:
```bash
# 所有平台通用
python scripts/install.py file-organizer

# 如果 python 命令不可用，尝试
python3 scripts/install.py file-organizer
```

---

### 2. Bash 脚本

**适用**: macOS, Linux

**优点**:
- 使用符号链接，节省磁盘空间
- 更新技能时自动同步

**缺点**:
- Windows 需要 Git Bash 或 WSL

**使用方法**:
```bash
./scripts/install.sh file-organizer
```

**Windows 用户使用 Bash**:
- 安装 Git for Windows，使用 Git Bash
- 或启用 WSL (Windows Subsystem for Linux)

---

### 3. PowerShell 脚本

**适用**: Windows

**优点**:
- 原生 Windows 支持
- 无需额外安装

**缺点**:
- 仅适用于 Windows
- 使用文件复制而非符号链接

**使用方法**:
```powershell
.\scripts\install.ps1 file-organizer
```

**权限问题**:
如果提示 "无法加载脚本，因为在此系统上禁止运行脚本"，需要调整执行策略：
```powershell
# 以管理员身份运行 PowerShell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 然后重新运行安装脚本
.\scripts\install.ps1 file-organizer
```

---

## 各平台详细指南

### 🪟 Windows

#### 方法 1: Python（推荐）

```powershell
# 1. 确保已安装 Python（通常已安装）
python --version

# 2. 克隆仓库
git clone https://github.com/Guic3136/claude-skills.git
cd claude-skills

# 3. 安装技能
python scripts\install.py file-organizer
```

#### 方法 2: PowerShell

```powershell
# 克隆仓库
git clone https://github.com/Guic3136/claude-skills.git
cd claude-skills

# 安装（可能需要调整执行策略）
.\scripts\install.ps1 file-organizer
```

#### 方法 3: 手动复制

```powershell
# 复制技能
xcopy /E /I skills\file-organizer %USERPROFILE%\.claude\skills\
```

**Windows 注意事项**:

1. **符号链接限制**: Windows 创建符号链接需要管理员权限，因此脚本默认使用文件复制
2. **更新方式**: 使用复制方式时，技能更新需要重新运行安装脚本
3. **路径**: Claude 技能目录位于 `%USERPROFILE%\.claude\skills\`

---

### 🍎 macOS

#### 方法 1: Bash（推荐）

```bash
# 克隆仓库
git clone https://github.com/Guic3136/claude-skills.git
cd claude-skills

# 安装（使用符号链接）
./scripts/install.sh file-organizer
```

#### 方法 2: Python

```bash
python3 scripts/install.py file-organizer
```

**macOS 注意事项**:

1. **Python**: macOS 12+ 已预装 Python 3
2. **符号链接**: 完全支持符号链接
3. **路径**: Claude 技能目录位于 `~/.claude/skills/`

---

### 🐧 Linux

#### 方法 1: Bash（推荐）

```bash
# 克隆仓库
git clone https://github.com/Guic3136/claude-skills.git
cd claude-skills

# 赋予执行权限并安装
chmod +x scripts/install.sh
./scripts/install.sh file-organizer
```

#### 方法 2: Python

```bash
python3 scripts/install.py file-organizer
```

**Linux 注意事项**:

1. **Python**: 大多数发行版已预装 Python 3
2. **符号链接**: 完全支持符号链接
3. **路径**: Claude 技能目录位于 `~/.claude/skills/`

---

## 常见问题

### Q: 如何检查 Python 是否已安装？

```bash
# Windows
python --version

# macOS/Linux
python3 --version
```

如果未安装：
- Windows: 从 [python.org](https://www.python.org/downloads/) 下载
- macOS: `brew install python` 或从 python.org 下载
- Linux: `sudo apt install python3` (Ubuntu/Debian) 或 `sudo yum install python3` (CentOS/RHEL)

### Q: 安装后技能不生效？

1. **重启 Claude Code**
   ```bash
   claude
   # 按 Ctrl+C 退出，然后重新启动
   ```

2. **检查技能目录**
   ```bash
   # 查看是否正确安装
   ls ~/.claude/skills/  # macOS/Linux
   dir %USERPROFILE%\.claude\skills\  # Windows
   ```

3. **验证文件权限** (Linux/macOS)
   ```bash
   ls -la ~/.claude/skills/file-organizer/
   ```

### Q: 如何更新已安装的技能？

```bash
# 拉取最新代码
git pull

# 重新安装（会自动更新）
python scripts/install.py file-organizer
```

### Q: 符号链接 vs 复制，有什么区别？

| 特性 | 符号链接 | 文件复制 |
|------|----------|----------|
| **磁盘空间** | 节省空间（只是链接） | 占用更多空间 |
| **更新方式** | 自动同步（git pull 后生效） | 需要重新安装 |
| **Windows 支持** | 需要管理员权限 | 完全支持 |
| **macOS/Linux** | ✅ 推荐 | ✅ 可用 |

**建议**:
- macOS/Linux: 使用符号链接（Bash 脚本默认）
- Windows: 使用文件复制（Python 脚本默认）

### Q: 如何卸载技能？

```bash
# 删除技能目录
rm -rf ~/.claude/skills/file-organizer  # macOS/Linux
rmdir /S /Q %USERPROFILE%\.claude\skills\file-organizer  # Windows
```

---

## 故障排除

### 错误: "Permission denied" (权限不足)

**Linux/macOS**:
```bash
chmod +x scripts/install.sh
./scripts/install.sh file-organizer
```

**Windows PowerShell**:
```powershell
# 以管理员身份运行 PowerShell
# 然后执行
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 错误: "command not found: python"

```bash
# 尝试 python3
python3 scripts/install.py file-organizer

# 或检查 Python 安装
which python3  # macOS/Linux
where python   # Windows
```

### 错误: "skill not found"

```bash
# 列出可用技能
python scripts/install.py --list

# 确保在正确的目录
cd claude-skills
ls skills/  # 应该能看到技能列表
```

---

## 推荐组合

| 用户类型 | 推荐方式 | 原因 |
|----------|----------|------|
| Windows 新手 | Python 脚本 | 简单，无需配置 |
| Windows 高级用户 | PowerShell | 原生支持 |
| macOS 用户 | Bash 脚本 | 符号链接节省空间 |
| Linux 用户 | Bash 脚本 | 符号链接节省空间 |
| 跨平台团队 | Python 脚本 | 统一的安装体验 |

---

## 测试过的环境

| 系统 | 版本 | 测试日期 | 结果 |
|------|------|----------|------|
| Windows 11 | 23H2 | 2026-03-14 | ✅ 通过 |
| macOS | Sonoma 14 | 2026-03-14 | ✅ 通过 |
| Ubuntu | 22.04 LTS | 2026-03-14 | ✅ 通过 |

如有其他平台问题，请提交 Issue。
