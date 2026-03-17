#!/bin/bash

# Claude HUD Skill 卸载脚本
# 用法: ./uninstall.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 目标目录
PLUGIN_DIR="$HOME/.claude/plugins/claude-hud"
CONFIG_FILE="$HOME/.claude/hud-config.json"
SETTINGS_FILE="$HOME/.claude/settings.json"

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo "========================================"
echo "  Claude HUD 状态栏 - 卸载脚本"
echo "========================================"
echo ""

# 确认卸载
read -p "确定要卸载 Claude HUD 吗? (y/N): " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
  log_info "卸载已取消"
  exit 0
fi

# 1. 备份 settings.json
if [ -f "$SETTINGS_FILE" ]; then
  BACKUP_FILE="$SETTINGS_FILE.bak.$(date +%Y%m%d_%H%M%S)"
  log_info "备份 settings.json 到: $BACKUP_FILE"
  cp "$SETTINGS_FILE" "$BACKUP_FILE"
fi

# 2. 移除 statusLine 配置
if [ -f "$SETTINGS_FILE" ]; then
  log_info "移除 Claude Code 状态栏配置..."
  node << 'NODE_SCRIPT'
const fs = require('fs');
const settingsFile = process.env.HOME + '/.claude/settings.json';
try {
  const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
  if (settings.statusLine && settings.statusLine.command && settings.statusLine.command.includes('claude-hud')) {
    delete settings.statusLine;
    fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
    console.log('StatusLine configuration removed');
  } else {
    console.log('No HUD statusLine configuration found');
  }
} catch (e) {
  console.log('Error processing settings:', e.message);
}
NODE_SCRIPT
fi

# 3. 删除插件目录
if [ -d "$PLUGIN_DIR" ]; then
  log_info "删除插件目录: $PLUGIN_DIR"
  rm -rf "$PLUGIN_DIR"
fi

# 4. 移除 hud-config 命令链接
if [ -L "/usr/local/bin/hud-config" ]; then
  log_info "移除 /usr/local/bin/hud-config"
  rm -f /usr/local/bin/hud-config
elif [ -L "$HOME/.local/bin/hud-config" ]; then
  log_info "移除 ~/.local/bin/hud-config"
  rm -f "$HOME/.local/bin/hud-config"
fi

# 5. 询问是否保留用户配置
echo ""
read -p "是否保留用户配置文件 (~/.claude/hud-config.json)? (Y/n): " keep_config
if [[ $keep_config =~ ^[Nn]$ ]]; then
  if [ -f "$CONFIG_FILE" ]; then
    log_info "删除用户配置文件: $CONFIG_FILE"
    rm -f "$CONFIG_FILE"
  fi
else
  log_info "保留用户配置文件: $CONFIG_FILE"
fi

echo ""
echo "========================================"
log_success "Claude HUD 卸载完成！"
echo "========================================"
echo ""
echo "请重启 Claude Code 以恢复默认状态栏。"
echo ""
