# Save Progress 跨平台测试指南

本文档说明如何在不同平台上测试 save-progress 技能的兼容性。

## 快速测试

在项目根目录运行：

```bash
node skills/save-progress/test/cross-platform-test.js
```

## 测试覆盖内容

### 1. 路径处理测试
- `path.join()` 正确处理平台特定的路径分隔符
- `path.resolve()` 返回绝对路径
- Windows: 使用 `\`，Unix: 使用 `/`

### 2. 文件系统操作
- 创建目录（`fs.mkdirSync`）
- 写入文件（`fs.writeFileSync`）
- 读取文件（`fs.readFileSync`）
- 获取文件状态（`fs.statSync`）
- 读取目录内容（`fs.readdirSync`）

### 3. 业务逻辑测试
- 写入 `.last-summary` 指针文件
- 读取并解析路径
- 按修改时间查找最新文件

### 4. 特殊路径处理
- 包含空格的路径
- 中文路径
- 特殊字符路径

### 5. 环境检测
- 获取用户主目录（`os.homedir()`）
- 路径分隔符验证

## 平台特定测试

### Windows 测试

**环境要求：**
- Windows 10/11
- Node.js >= 16.0.0
- PowerShell 或 CMD

**额外测试项：**

```powershell
# 1. 测试长路径支持
New-Item -ItemType Directory -Force -Path "test-long-path"

# 2. 测试 UNC 路径（如果在域环境中）
# \\\server\share\path

# 3. 测试包含特殊字符的用户名路径
```

**已知限制：**
- 路径长度限制：260 字符（除非启用长路径支持）
- 保留字符：`< > : " | ? *`
- 保留设备名：CON, PRN, AUX, NUL, COM1-9, LPT1-9

### macOS 测试

**环境要求：**
- macOS 10.14 或更高版本
- Node.js >= 16.0.0

**额外测试项：**

```bash
# 1. 测试区分大小写的 APFS
touch Test.txt test.txt
ls -la

# 2. 测试扩展属性
xattr -w com.test "value" test.txt
xattr -l test.txt

# 3. 测试符号链接
ln -s test.txt link.txt
```

### Linux 测试

**环境要求：**
- Linux 内核 4.0+
- Node.js >= 16.0.0

**额外测试项：**

```bash
# 1. 测试区分大小写的文件系统
touch Test.txt test.txt
ls -la

# 2. 测试符号链接和硬链接
ln -s test.txt symlink.txt
ln test.txt hardlink.txt

# 3. 测试权限
chmod 644 test.txt
ls -l test.txt
```

## 手动功能测试

### 1. 安装测试

**macOS/Linux:**
```bash
mkdir -p ~/.claude/scripts
cp .claude/scripts/*.js ~/.claude/scripts/
ls -la ~/.claude/scripts/
```

**Windows:**
```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.claude\scripts"
Copy-Item ".claude\scripts\*.js" "$env:USERPROFILE\.claude\scripts\"
Get-ChildItem "$env:USERPROFILE\.claude\scripts\"
```

### 2. 命令测试

重启 Claude Code 后测试：

```
/save-progress
```

预期行为：
1. 创建 `summaries/` 目录
2. 生成带时间戳的文件
3. 显示保存成功的消息

### 3. Compact 测试

```
/compact
```

预期行为：
1. 压缩上下文
2. 自动加载最近的摘要
3. 显示摘要内容

## 故障排除

### Windows 常见问题

**问题**: "Cannot find module" 错误

**解决**:
1. 确认脚本文件存在于 `%USERPROFILE%\.claude\scripts\`
2. 使用绝对路径
3. 使用正斜杠 `/` 而不是反斜杠 `\`

```json
{
  "command": "node C:/Users/Admin/.claude/scripts/load-summary.js"
}
```

### macOS/Linux 常见问题

**问题**: 权限被拒绝

**解决**:
```bash
chmod +x ~/.claude/scripts/*.js
```

**问题**: 找不到模块

**解决**:
1. 确认脚本文件存在于 `~/.claude/scripts/`
2. 检查文件名大小写

## 测试报告模板

| 测试项 | Windows | macOS | Linux |
|--------|---------|-------|-------|
| 路径处理 | ✅ | ? | ? |
| 文件创建 | ✅ | ? | ? |
| 中文路径 | ✅ | ? | ? |
| 空格路径 | ✅ | ? | ? |
| 脚本执行 | ✅ | ? | ? |
| Compact Hook | ✅ | ? | ? |

**测试环境：**
- Windows: Windows 11 Pro 23H2, Node.js 25.8.1 ✅
- macOS: (待测试)
- Linux: (待测试)

## 提交测试结果

如果你在 macOS 或 Linux 上测试了此技能，请提交测试结果：

1. 运行测试脚本
2. 复制输出结果
3. 更新 TESTING.md 中的测试报告表格
4. 提交 PR

## 持续集成

建议在不同平台上运行自动化测试：

```yaml
# .github/workflows/test.yml
name: Cross-Platform Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node-version: [16, 18, 20]

    steps:
    - uses: actions/checkout@v3
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
    - name: Run tests
      run: node skills/save-progress/test/cross-platform-test.js
```
