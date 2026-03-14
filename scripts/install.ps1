# Claude Skills 安装脚本 (Windows PowerShell)
# 支持安装单个技能或所有技能

param(
    [Parameter(Position = 0)]
    [string]$SkillName,

    [switch]$All,
    [switch]$List,
    [switch]$Help
)

$SkillsDir = "$env:USERPROFILE\.claude\skills"
$RepoDir = Split-Path -Parent $PSScriptRoot

# 显示帮助信息
function Show-Help {
    Write-Host "Claude Skills 安装程序" -ForegroundColor Cyan
    Write-Host "=======================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "用法:"
    Write-Host "  .\install.ps1 <skill-name>   # 安装指定技能"
    Write-Host "  .\install.ps1 -All          # 安装所有技能"
    Write-Host "  .\install.ps1 -List         # 列出可用技能"
    Write-Host "  .\install.ps1 -Help         # 显示帮助"
    Write-Host ""
    Write-Host "示例:"
    Write-Host "  .\install.ps1 file-organizer  # 只安装 file-organizer 技能"
    Write-Host "  .\install.ps1 -All            # 安装所有技能"
    Write-Host ""
    Write-Host "可用技能:"
    List-Skills
}

# 列出可用技能
function List-Skills {
    Get-ChildItem -Path "$RepoDir\skills" -Directory | ForEach-Object {
        $skillName = $_.Name
        $targetPath = Join-Path $SkillsDir $skillName

        if (Test-Path $targetPath) {
            Write-Host "  [OK] $skillName (已安装)" -ForegroundColor Green
        } else {
            Write-Host "  [  ] $skillName" -ForegroundColor Gray
        }
    }
}

# 安装单个技能
function Install-Skill($Name) {
    $skillPath = Join-Path "$RepoDir\skills" $Name

    if (-not (Test-Path $skillPath)) {
        Write-Host "❌ 错误: 技能 '$Name' 不存在" -ForegroundColor Red
        Write-Host ""
        Write-Host "可用技能:" -ForegroundColor Yellow
        List-Skills
        return $false
    }

    $targetPath = Join-Path $SkillsDir $Name

    # 删除旧版本（如果存在）
    if (Test-Path $targetPath) {
        Remove-Item -Path $targetPath -Recurse -Force
        Write-Host "  📝 更新已存在的技能" -ForegroundColor Yellow
    }

    # 复制技能（Windows 符号链接需要管理员权限，使用复制代替）
    Copy-Item -Path $skillPath -Destination $targetPath -Recurse -Force
    Write-Host "✅ 已安装: $Name" -ForegroundColor Green
    Write-Host "   位置: $targetPath" -ForegroundColor Gray

    return $true
}

# 安装所有技能
function Install-All {
    Write-Host "安装所有可用技能..." -ForegroundColor Cyan
    Write-Host ""

    $count = 0
    Get-ChildItem -Path "$RepoDir\skills" -Directory | ForEach-Object {
        $skillName = $_.Name
        if (Install-Skill $skillName) {
            Write-Host ""
            $count++
        }
    }

    Write-Host "=======================" -ForegroundColor Cyan
    Write-Host "共安装 $count 个技能" -ForegroundColor Green
}

# 主逻辑
# 创建技能目录
New-Item -ItemType Directory -Force -Path $SkillsDir | Out-Null

if ($Help) {
    Show-Help
} elseif ($List) {
    Write-Host "可用技能:" -ForegroundColor Cyan
    List-Skills
} elseif ($All) {
    Install-All
    Write-Host ""
    Write-Host "🎉 安装完成！请重启 Claude Code" -ForegroundColor Green
} elseif ($SkillName) {
    Write-Host "Claude Skills 安装程序" -ForegroundColor Cyan
    Write-Host "=======================" -ForegroundColor Cyan
    Write-Host ""

    if (Install-Skill $SkillName) {
        Write-Host ""
        Write-Host "🎉 安装完成！请重启 Claude Code" -ForegroundColor Green
        Write-Host ""
        Write-Host "测试方法:" -ForegroundColor Yellow
        Write-Host "  1. 重启 Claude Code"
        Write-Host "  2. 输入: 创建一个 Python 脚本"
        Write-Host "  3. 观察是否自动保存到 scripts/python/ 目录"
    }
} else {
    Show-Help
}
