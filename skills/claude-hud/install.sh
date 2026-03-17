#!/bin/bash

# Claude HUD Skill 一键安装脚本
# 用法: ./install.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HUD_SRC_DIR="$SCRIPT_DIR/hud"

# 目标目录
PLUGIN_DIR="$HOME/.claude/plugins/claude-hud"
CONFIG_FILE="$HOME/.claude/hud-config.json"
SETTINGS_FILE="$HOME/.claude/settings.json"

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

cleanup() {
  local exit_code=$?
  if [ $exit_code -ne 0 ]; then
    echo ""
    log_error "安装过程中发生错误 (退出码: $exit_code)"
    log_info "如需回滚，请手动删除: $PLUGIN_DIR"
  fi
}
trap cleanup EXIT

echo "========================================"
echo "  Claude HUD 状态栏 - 安装脚本"
echo "========================================"
echo ""

# 1. 检查环境
log_info "检查环境..."
if ! command -v node &> /dev/null; then
  log_error "未找到 Node.js，请先安装 Node.js 16+"
  exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
  log_error "Node.js 版本过低，需要 16+，当前: $(node --version)"
  exit 1
fi
log_success "Node.js 版本: $(node --version)"

# 2. 创建插件目录
log_info "创建插件目录: $PLUGIN_DIR"
mkdir -p "$PLUGIN_DIR"

# 3. 复制源码
log_info "复制 HUD 源码..."
cp -r "$HUD_SRC_DIR"/* "$PLUGIN_DIR/"

# 4. 安装依赖并编译
cd "$PLUGIN_DIR"
log_info "安装 npm 依赖..."
npm install --silent

log_info "编译 TypeScript..."
npm run build

# 5. 创建默认配置
if [ ! -f "$CONFIG_FILE" ]; then
  log_info "创建默认配置文件..."
  cat > "$CONFIG_FILE" << 'EOF'
{
  "preset": "essential",
  "enabled": true,
  "displayItems": ["model", "context", "git"],
  "maxContextTokens": 0,
  "colors": {
    "primary": "\u001b[36m",
    "success": "\u001b[32m",
    "warning": "\u001b[33m",
    "error": "\u001b[31m",
    "info": "\u001b[34m",
    "secondary": "\u001b[35m",
    "muted": "\u001b[90m"
  },
  "format": {
    "separator": " | ",
    "progressBarWidth": 10,
    "progressBarFilled": "█",
    "progressBarEmpty": "░",
    "showPercent": true
  }
}
EOF
fi

# 6. 配置 settings.json
log_info "配置 Claude Code settings.json..."
if [ -f "$SETTINGS_FILE" ]; then
  # 备份原配置
  cp "$SETTINGS_FILE" "$SETTINGS_FILE.bak.$(date +%Y%m%d_%H%M%S)"

  # 使用 node 修改 JSON
  node << NODE_SCRIPT
const fs = require('fs');
const settings = JSON.parse(fs.readFileSync('$SETTINGS_FILE', 'utf8'));
settings.statusLine = {
  type: "command",
  command: "node $PLUGIN_DIR/dist/index.js"
};
fs.writeFileSync('$SETTINGS_FILE', JSON.stringify(settings, null, 2));
console.log('Settings updated');
NODE_SCRIPT
else
  # 创建新配置
  mkdir -p "$HOME/.claude"
  cat > "$SETTINGS_FILE" << EOF
{
  "statusLine": {
    "type": "command",
    "command": "node $PLUGIN_DIR/dist/index.js"
  }
}
EOF
fi

# 7. 创建 hud-config 命令链接
log_info "创建 hud-config 命令..."
if [ -d "/usr/local/bin" ] && [ -w "/usr/local/bin" ]; then
  ln -sf "$PLUGIN_DIR/dist/cli.js" /usr/local/bin/hud-config
  log_success "hud-config 已链接到 /usr/local/bin/"
elif [ -d "$HOME/.local/bin" ]; then
  mkdir -p "$HOME/.local/bin"
  ln -sf "$PLUGIN_DIR/dist/cli.js" "$HOME/.local/bin/hud-config"
  log_success "hud-config 已链接到 ~/.local/bin/"
else
  log_warn "无法创建全局命令，请手动添加以下别名:"
  echo "  alias hud-config='node $PLUGIN_DIR/dist/cli.js'"
fi

echo ""
echo "========================================"
log_success "Claude HUD 安装完成！"
echo "========================================"
echo ""
echo "请重启 Claude Code 以查看状态栏。"
echo ""
echo "使用 hud-config 命令自定义配置:"
echo "  hud-config --preset essential  # 精简模式"
echo "  hud-config --preset full       # 完整模式"
echo "  hud-config --preset minimal    # 极简模式"
echo ""
