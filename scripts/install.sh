#!/bin/bash
# Claude Skills 安装脚本

SKILLS_DIR="${HOME}/.claude/skills"
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "Claude Skills 安装程序"
echo "======================="

mkdir -p "$SKILLS_DIR"

for skill_path in "$REPO_DIR"/skills/*; do
    if [ -d "$skill_path" ]; then
        skill_name=$(basename "$skill_path")
        echo "安装技能: $skill_name"
        ln -sf "$skill_path" "$SKILLS_DIR/$skill_name"
        echo "  已安装到: $SKILLS_DIR/$skill_name"
    fi
done

echo ""
echo "安装完成！请重启 Claude Code"
