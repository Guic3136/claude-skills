@echo off
setlocal EnableDelayedExpansion

:: Claude HUD Skill 一键安装脚本 (Windows)
:: 用法: 双击运行或在 CMD/PowerShell 中执行 install.cmd

echo ========================================
echo   Claude HUD 状态栏 - Windows 安装脚本
echo ========================================
echo.

set "SCRIPT_DIR=%~dp0"
set "HUD_SRC_DIR=%SCRIPT_DIR%hud"

:: 1. 检查 Node.js
echo [INFO] 检查 Node.js...
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] 未找到 Node.js，请先安装 Node.js 16+
    echo   下载地址: https://nodejs.org/
    exit /b 1
)

for /f "tokens=1 delims=." %%a in ('node --version') do (
    set "NODE_MAJOR=%%a"
)
set "NODE_MAJOR=!NODE_MAJOR:v=!"

if !NODE_MAJOR! LSS 16 (
    echo [ERROR] Node.js 版本过低，需要 16+，当前版本:
    node --version
    exit /b 1
)
for /f "tokens=*" %%a in ('node --version') do (
    echo [SUCCESS] Node.js 版本: %%a
)

:: 2. 创建插件目录
echo [INFO] 创建插件目录...
set "PLUGIN_DIR=%USERPROFILE%\.claude\plugins\claude-hud"
if not exist "%PLUGIN_DIR%" mkdir "%PLUGIN_DIR%"

:: 3. 复制源码
echo [INFO] 复制 HUD 源码...
xcopy /E /I /Y "%HUD_SRC_DIR%\*" "%PLUGIN_DIR%\" >nul

:: 4. 安装依赖并编译
cd /d "%PLUGIN_DIR%"
echo [INFO] 安装 npm 依赖...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm install 失败
    exit /b 1
)

echo [INFO] 编译 TypeScript...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm run build 失败
    exit /b 1
)

:: 5. 创建默认配置
set "CONFIG_FILE=%USERPROFILE%\.claude\hud-config.json"
if not exist "%CONFIG_FILE%" (
    echo [INFO] 创建默认配置文件...
    node -e "const fs=require('fs'),path=require('path'),os=require('os');const c={preset:'essential',enabled:true,displayItems:['model','context','git','path'],maxContextTokens:0,colors:{primary:'[36m',success:'[32m',warning:'[33m',error:'[31m',info:'[34m',secondary:'[35m',muted:'[90m'},format:{separator:' | ',progressBarWidth:10,progressBarFilled:'█',progressBarEmpty:'░',showPercent:true,shortenPath:true,maxPathLength:30}};fs.writeFileSync(path.join(os.homedir(),'.claude','hud-config.json'),JSON.stringify(c,null,2));"
)

:: 6. 配置 settings.json
echo [INFO] 配置 Claude Code settings.json...
set "SETTINGS_FILE=%USERPROFILE%\.claude\settings.json"
if exist "%SETTINGS_FILE%" (
    copy "%SETTINGS_FILE%" "%SETTINGS_FILE%.bak" >nul
)
node -e "const fs=require('fs'),path=require('path'),os=require('os');const sp=path.join(os.homedir(),'.claude','settings.json');let s={};try{s=JSON.parse(fs.readFileSync(sp,'utf8'));}catch(e){}s.statusLine={type:'command',command:'node '+path.join(os.homedir(),'.claude','plugins','claude-hud','dist','index.js').replace(/\\\\/g,'/')};fs.writeFileSync(sp,JSON.stringify(s,null,2));"

:: 7. 创建 hud-config 命令
echo [INFO] 创建 hud-config 命令...
echo @echo off > "%USERPROFILE%\.claude\hud-config.cmd"
echo node "%PLUGIN_DIR%\dist\cli.js" %%* >> "%USERPROFILE%\.claude\hud-config.cmd"

:: 将 hud-config.cmd 所在目录添加到用户 PATH
echo [INFO] 检查 PATH 配置...
echo %PATH% | findstr /I /C:"%USERPROFILE%\.claude" >nul
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] 将 %USERPROFILE%\.claude 添加到用户 PATH...
    setx PATH "%USERPROFILE%\.claude;%PATH%" >nul
    echo [SUCCESS] PATH 已更新（需要重新打开终端生效）
)

:: 8. 检测并安装 sqlite3
echo [INFO] 检测 sqlite3...
where sqlite3 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] sqlite3 已安装
) else (
    echo [WARN] 未找到 sqlite3，尝试自动安装...
    
    where choco >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo [INFO] 通过 Chocolatey 安装 sqlite3...
        choco install sqlite -y
        if %ERRORLEVEL% EQU 0 (
            echo [SUCCESS] sqlite3 安装成功
        ) else (
            echo [WARN] Chocolatey 安装 sqlite3 失败
        )
    ) else (
        where winget >nul 2>&1
        if %ERRORLEVEL% EQU 0 (
            echo [INFO] 通过 winget 安装 sqlite3...
            winget install SQLite.SQLite -e --accept-package-agreements --accept-source-agreements
            if %ERRORLEVEL% EQU 0 (
                echo [SUCCESS] sqlite3 安装成功
                echo [INFO] 请重新打开终端使 PATH 生效
            ) else (
                echo [WARN] winget 安装 sqlite3 失败
            )
        ) else (
            echo [WARN] 未找到包管理器 (choco / winget)
            echo.
            echo 如需 CC Switch 模型检测功能，请手动安装 sqlite3:
            echo   方式1: 安装 Chocolatey (https://chocolatey.org/)，然后运行 'choco install sqlite'
            echo   方式2: 从 https://sqlite.org/download.html 下载命令行工具
            echo.
            echo [INFO] HUD 核心功能不受影响，继续安装...
        )
    )
)

echo.
echo ========================================
echo [SUCCESS] Claude HUD 安装完成！
echo ========================================
echo.
echo 请重启 Claude Code 以查看状态栏。
echo.
echo 使用 hud-config 命令自定义配置:
echo   hud-config preset essential  :: 精简模式
echo   hud-config preset full       :: 完整模式
echo   hud-config preset minimal    :: 极简模式
echo.
pause
