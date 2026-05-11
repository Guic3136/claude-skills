@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   Claude HUD Plugin Installer (Windows)
echo ========================================
echo.

:: Check Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Please install Node.js ^>= 16
    echo         Download: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=1 delims=." %%a in ('node -v') do set NODE_MAJOR=%%a
set NODE_MAJOR=%NODE_MAJOR:v=%
if %NODE_MAJOR% LSS 16 (
    echo [ERROR] Node.js version too old. Required ^>= 16, found:
    node -v
    pause
    exit /b 1
)
echo [OK] Node.js version:
node -v

:: Set paths
set PLUGIN_DIR=%USERPROFILE%\.claude\plugins\claude-hud
set SCRIPT_DIR=%~dp0

:: Create plugin directory
echo.
echo [1/6] Creating plugin directory...
if not exist "%PLUGIN_DIR%" mkdir "%PLUGIN_DIR%"
if not exist "%PLUGIN_DIR%\src" mkdir "%PLUGIN_DIR%\src"

:: Copy source files
echo [2/6] Copying source files...
copy /y "%SCRIPT_DIR%src\*.ts" "%PLUGIN_DIR%\src\" >nul
copy /y "%SCRIPT_DIR%package.json" "%PLUGIN_DIR%\" >nul
copy /y "%SCRIPT_DIR%tsconfig.json" "%PLUGIN_DIR%\" >nul
if exist "%SCRIPT_DIR%src\*.js" copy /y "%SCRIPT_DIR%src\*.js" "%PLUGIN_DIR%\src\" >nul
echo [OK] Source files copied

:: Install dependencies
echo [3/6] Installing dependencies...
cd /d "%PLUGIN_DIR%"
call npm install
if errorlevel 1 (
    echo [ERROR] npm install failed
    pause
    exit /b 1
)
echo [OK] Dependencies installed

:: Build
echo [4/6] Building TypeScript...
call npm run build
if errorlevel 1 (
    echo [ERROR] Build failed
    pause
    exit /b 1
)
echo [OK] Build complete

:: Create default config
echo [5/6] Creating default configuration...
if not exist "%USERPROFILE%\.claude" mkdir "%USERPROFILE%\.claude"
if not exist "%USERPROFILE%\.claude\hud-config.json" (
    echo { > "%USERPROFILE%\.claude\hud-config.json"
    echo   "preset": "full", >> "%USERPROFILE%\.claude\hud-config.json"
    echo   "enabled": true >> "%USERPROFILE%\.claude\hud-config.json"
    echo } >> "%USERPROFILE%\.claude\hud-config.json"
    echo [OK] Default hud-config.json created
) else (
    echo [SKIP] hud-config.json already exists
)

:: Configure settings.json statusLine
echo [6/6] Configuring settings.json statusLine...
set SETTINGS_FILE=%USERPROFILE%\.claude\settings.json
if not exist "%SETTINGS_FILE%" (
    echo { > "%SETTINGS_FILE%"
    echo   "statusLine": { >> "%SETTINGS_FILE%"
    echo     "command": "node \"%PLUGIN_DIR%\\dist\\hud.js\"" >> "%SETTINGS_FILE%"
    echo   } >> "%SETTINGS_FILE%"
    echo } >> "%SETTINGS_FILE%"
    echo [OK] settings.json created with statusLine configured
) else (
    echo [SKIP] settings.json already exists
    echo        Please manually add the following to your settings.json:
    echo        "statusLine": {
    echo          "command": "node \"%PLUGIN_DIR%\\dist\\hud.js\""
    echo        }
)

:: Check sqlite3 (optional)
echo.
echo Checking optional dependencies...
where sqlite3 >nul 2>&1
if errorlevel 1 (
    echo [INFO] sqlite3 CLI not found (optional)
    echo        CC Switch model detection will use fallback method
    echo        Install via: choco install sqlite or winget install SQLite
) else (
    echo [OK] sqlite3 CLI available
)

:: Done
echo.
echo ========================================
echo   Installation complete!
echo ========================================
echo.
echo Please restart Claude Code to see the HUD status bar.
echo.
echo Configuration: %USERPROFILE%\.claude\hud-config.json
 echo   - Run: hud-config preset full
 echo   - Run: hud-config preset minimal
 echo   - Run: hud-config items model,context,speed
echo.
pause
