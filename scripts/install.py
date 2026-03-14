#!/usr/bin/env python3
"""
Claude Skills 跨平台安装脚本
支持 Windows, macOS, Linux
"""

import os
import sys
import shutil
import platform
from pathlib import Path


def get_skills_dir():
    """获取 Claude 技能目录（跨平台）"""
    home = Path.home()

    if platform.system() == "Windows":
        return home / ".claude" / "skills"
    else:  # macOS, Linux
        return home / ".claude" / "skills"


def get_repo_dir():
    """获取仓库目录"""
    return Path(__file__).parent.parent.resolve()


def list_skills():
    """列出可用技能"""
    repo_dir = get_repo_dir()
    skills_dir = repo_dir / "skills"

    if not skills_dir.exists():
        print("❌ 错误: 找不到 skills 目录")
        return []

    skills = []
    for item in skills_dir.iterdir():
        if item.is_dir() and not item.name.startswith("_"):
            skills.append(item.name)

    return sorted(skills)


def check_installed(skill_name):
    """检查技能是否已安装"""
    skills_dir = get_skills_dir()
    target = skills_dir / skill_name

    if target.exists():
        if target.is_symlink():
            return "symbolic_link"
        else:
            return "directory"
    return None


def install_skill(skill_name, use_copy=False):
    """安装单个技能"""
    repo_dir = get_repo_dir()
    skills_dir = get_skills_dir()
    source = repo_dir / "skills" / skill_name
    target = skills_dir / skill_name

    # 检查源技能是否存在
    if not source.exists():
        print(f"❌ 错误: 技能 '{skill_name}' 不存在")
        print(f"   路径: {source}")
        return False

    # 创建技能目录
    skills_dir.mkdir(parents=True, exist_ok=True)

    # 如果目标已存在，先删除
    if target.exists():
        if target.is_symlink():
            target.unlink()
        elif target.is_dir():
            shutil.rmtree(target)
        else:
            target.unlink()
        print(f"   📝 更新已存在的技能")

    # 创建链接或复制
    try:
        if use_copy or platform.system() == "Windows":
            # Windows 下复制文件（避免符号链接权限问题）
            shutil.copytree(source, target)
            print(f"   📋 已复制（Windows 推荐方式）")
        else:
            # macOS/Linux 使用符号链接
            target.symlink_to(source, target_is_directory=True)
            print(f"   🔗 已创建符号链接")

        print(f"✅ 已安装: {skill_name}")
        print(f"   位置: {target}")
        return True

    except Exception as e:
        print(f"❌ 安装失败: {e}")
        # 失败后尝试复制
        try:
            if target.exists():
                shutil.rmtree(target)
            shutil.copytree(source, target)
            print(f"✅ 已安装（使用复制）: {skill_name}")
            return True
        except Exception as e2:
            print(f"❌ 复制也失败: {e2}")
            return False


def install_all(use_copy=False):
    """安装所有技能"""
    skills = list_skills()

    if not skills:
        print("❌ 没有找到可用技能")
        return

    print(f"找到 {len(skills)} 个技能，开始安装...\n")

    success_count = 0
    for skill in skills:
        if install_skill(skill, use_copy):
            success_count += 1
            print()

    print("=" * 50)
    print(f"✅ 成功安装 {success_count}/{len(skills)} 个技能")


def show_help():
    """显示帮助信息"""
    print("Claude Skills 安装程序 (跨平台)")
    print("=" * 50)
    print()
    print("支持系统: Windows, macOS, Linux")
    print()
    print("用法:")
    print(f"  {sys.executable} install.py <skill-name>    # 安装指定技能")
    print(f"  {sys.executable} install.py --all          # 安装所有技能")
    print(f"  {sys.executable} install.py --list         # 列出可用技能")
    print(f"  {sys.executable} install.py --help         # 显示帮助")
    print()
    print("示例:")
    print(f"  {sys.executable} install.py file-organizer")
    print(f"  {sys.executable} install.py --all")
    print()
    print("选项:")
    print("  --copy    强制使用复制方式（而不是符号链接）")
    print()
    print("当前系统:", platform.system(), platform.release())
    print("Python 版本:", platform.python_version())


def show_list():
    """显示可用技能列表"""
    skills = list_skills()

    if not skills:
        print("❌ 没有找到可用技能")
        return

    print("可用技能:")
    print("-" * 50)

    for skill in skills:
        status = check_installed(skill)
        if status == "symbolic_link":
            print(f"  🔗 {skill:<20} (已安装 - 符号链接)")
        elif status == "directory":
            print(f"  📋 {skill:<20} (已安装 - 复制)")
        else:
            print(f"  ○  {skill:<20} (未安装)")

    print("-" * 50)
    print(f"总计: {len(skills)} 个技能")


def main():
    """主函数"""
    args = sys.argv[1:]

    # 检查是否有 --copy 参数
    use_copy = "--copy" in args
    if use_copy:
        args.remove("--copy")

    # 没有参数，显示帮助
    if not args:
        show_help()
        return

    command = args[0]

    if command in ("--help", "-h"):
        show_help()

    elif command in ("--list", "-l"):
        show_list()

    elif command in ("--all", "-a"):
        install_all(use_copy)
        print()
        print("🎉 安装完成！请重启 Claude Code")

    elif command.startswith("-"):
        print(f"❌ 未知选项: {command}")
        print("使用 --help 查看帮助")

    else:
        # 安装指定技能
        skill_name = command
        print("Claude Skills 安装程序")
        print("=" * 50)
        print()

        if install_skill(skill_name, use_copy):
            print()
            print("🎉 安装完成！请重启 Claude Code")
            print()
            print("测试方法:")
            print("  1. 重启 Claude Code")
            print("  2. 输入: 创建一个 Python 脚本")
            print("  3. 观察是否自动保存到 scripts/python/ 目录")


if __name__ == "__main__":
    main()
