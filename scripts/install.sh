#!/bin/bash
# Claude Skills 安装脚本
# 支持安装单个技能或所有技能

set -e

SKILLS_DIR="${HOME}/.claude/skills"
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# 显示帮助信息
show_help() {
    echo "Claude Skills 安装程序"
    echo "======================="
    echo ""
    echo "用法:"
    echo "  $0 <skill-name>     # 安装指定技能"
    echo "  $0 --all            # 安装所有技能"
    echo "  $0 --list           # 列出可用技能"
    echo "  $0 --help           # 显示帮助"
    echo ""
    echo "示例:"
    echo "  $0 file-organizer   # 只安装 file-organizer 技能"
    echo "  $0 --all            # 安装所有技能"
    echo ""
    echo "可用技能:"
    list_skills
}

# 列出可用技能
list_skills() {
    for skill_path in "$REPO_DIR"/skills/*; do
        if [ -d "$skill_path" ]; then
            skill_name=$(basename "$skill_path")
            # 检查是否已安装
            if [ -L "$SKILLS_DIR/$skill_name" ] || [ -d "$SKILLS_DIR/$skill_name" ]; then
                echo "  ✓ $skill_name (已安装)"
            else
                echo "  ○ $skill_name"
            fi
        fi
    done
}

# 安装单个技能
install_skill() {
    local skill_name=$1
    local skill_path="${REPO_DIR}/skills/${skill_name}"

    if [ ! -d "$skill_path" ]; then
        echo "❌ 错误: 技能 '$skill_name' 不存在"
        echo ""
        echo "可用技能:"
        list_skills
        return 1
    fi

    local target="${SKILLS_DIR}/${skill_name}"

    # 删除旧版本（如果存在）
    if [ -L "$target" ]; then
        rm "$target"
        echo "  📝 更新已存在的符号链接"
    elif [ -d "$target" ]; then
        rm -rf "$target"
        echo "  📝 替换旧版本"
    fi

    # 创建符号链接
    ln -sf "$skill_path" "$target"
    echo "✅ 已安装: $skill_name"
    echo "   位置: $target"
}

# 安装所有技能
install_all() {
    echo "安装所有可用技能..."
    echo ""

    local count=0
    for skill_path in "$REPO_DIR"/skills/*; do
        if [ -d "$skill_path" ]; then
            skill_name=$(basename "$skill_path")
            install_skill "$skill_name"
            echo ""
            ((count++))
        fi
    done

    echo "======================="
    echo "共安装 $count 个技能"
}

# 主逻辑
main() {
    # 创建技能目录
    mkdir -p "$SKILLS_DIR"

    # 解析参数
    case "${1:-}" in
        "")
            # 没有参数，显示帮助
            show_help
            ;;
        "--help"|"-h")
            show_help
            ;;
        "--list"|"-l")
            echo "可用技能:"
            list_skills
            ;;
        "--all"|"-a")
            install_all
            echo ""
            echo "🎉 安装完成！请重启 Claude Code"
            ;;
        *)
            # 安装指定技能
            echo "Claude Skills 安装程序"
            echo "======================="
            echo ""
            install_skill "$1"
            echo ""
            echo "🎉 安装完成！请重启 Claude Code"
            echo ""
            echo "测试方法:"
            echo "  1. 重启 Claude Code"
            echo "  2. 输入: 创建一个 Python 脚本"
            echo "  3. 观察是否自动保存到 scripts/python/ 目录"
            ;;
    esac
}

main "$@"
