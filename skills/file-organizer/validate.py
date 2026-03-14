#!/usr/bin/env python3
"""
文件组织验证工具
检查工作区文件是否符合 organization-rules.json 规则
"""
import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Tuple


def load_rules(rules_path: Path = None) -> Dict:
    """加载组织规则"""
    if rules_path is None:
        # 尝试多个位置
        possible_paths = [
            Path(".claude/organization-rules.json"),
            Path(".claude/skills/file-organizer/organization-rules.json"),
            Path(os.path.expanduser("~/.claude/skills/file-organizer/organization-rules.json")),
        ]
        for path in possible_paths:
            if path.exists():
                rules_path = path
                break

    if not rules_path or not rules_path.exists():
        print("[ERROR] 错误: 找不到 organization-rules.json")
        sys.exit(1)

    with open(rules_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def get_expected_location(file_path: Path, rules: Dict) -> Tuple[str, str]:
    """
    根据规则返回文件期望的位置
    返回: (expected_dir, rule_name)
    """
    ext = file_path.suffix.lower()

    for rule in rules.get("rules", []):
        if ext in rule.get("extensions", []):
            return rule["directory"].split("/")[0], rule["name"]

    return None, None


def validate_workspace(workspace_path: Path, rules: Dict) -> Dict:
    """验证整个工作区"""
    results = {
        "valid": [],
        "invalid": [],
        "unknown": [],
        "summary": {
            "total": 0,
            "correct": 0,
            "incorrect": 0,
            "unknown": 0
        }
    }

    base_path = Path(rules.get("base_path", ".").replace("${WORKSPACE_ROOT}", str(workspace_path)))

    # 遍历工作区根目录文件
    for item in workspace_path.iterdir():
        if item.is_dir():
            continue  # 跳过目录

        # 跳过隐藏文件和特定文件
        if item.name.startswith('.') or item.name in ['README.md', 'LICENSE']:
            continue

        results["summary"]["total"] += 1

        expected_dir, rule_name = get_expected_location(item, rules)

        if expected_dir is None:
            results["unknown"].append({
                "file": str(item),
                "reason": "未知文件类型"
            })
            results["summary"]["unknown"] += 1
            continue

        # 检查是否在正确的目录
        if expected_dir in str(item.parent):
            results["valid"].append({
                "file": str(item),
                "rule": rule_name,
                "location": str(item.parent)
            })
            results["summary"]["correct"] += 1
        else:
            results["invalid"].append({
                "file": str(item),
                "rule": rule_name,
                "expected": f"{base_path}/{expected_dir}/",
                "actual": str(item.parent)
            })
            results["summary"]["incorrect"] += 1

    return results


def print_results(results: Dict):
    """打印验证结果"""
    print("\n" + "=" * 60)
    print("文件组织验证报告")
    print("=" * 60)

    summary = results["summary"]

    # 统计
    print(f"\n统计:")
    print(f"   总文件数: {summary['total']}")
    print(f"   [OK] 正确位置: {summary['correct']}")
    print(f"   [X]  错误位置: {summary['incorrect']}")
    print(f"   [?]  未知类型: {summary['unknown']}")

    if summary['total'] > 0:
        correct_pct = (summary['correct'] / summary['total']) * 100
        print(f"   合规率: {correct_pct:.1f}%")

    # 详细结果
    if results["invalid"]:
        print(f"\n[X] 需要移动的文件 ({len(results['invalid'])}):")
        print("-" * 60)
        for item in results["invalid"]:
            print(f"   文件: {Path(item['file']).name}")
            print(f"   规则: {item['rule']}")
            print(f"   期望: {item['expected']}")
            print(f"   实际: {item['actual']}")
            print()

    if results["unknown"]:
        print(f"\n[?] 未知类型文件 ({len(results['unknown'])}):")
        print("-" * 60)
        for item in results["unknown"]:
            print(f"   {Path(item['file']).name}")

    if not results["invalid"] and not results["unknown"]:
        print("\n[OK] 所有文件都在正确位置！")

    print("\n" + "=" * 60)


def suggest_fixes(results: Dict, dry_run: bool = True):
    """建议修复方案"""
    if not results["invalid"]:
        return

    print("\n建议的修复命令:")
    print("-" * 60)

    for item in results["invalid"]:
        file_path = Path(item["file"])
        target_dir = Path(item["expected"])
        target_path = target_dir / file_path.name

        if dry_run:
            print(f"   [预览] mv '{file_path}' '{target_path}'")
        else:
            # 实际执行移动
            target_dir.mkdir(parents=True, exist_ok=True)
            file_path.rename(target_path)
            print(f"   ✅ 已移动: {file_path.name} -> {target_dir}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="验证工作区文件组织")
    parser.add_argument("--path", "-p", default=".", help="工作区路径")
    parser.add_argument("--rules", "-r", help="规则文件路径")
    parser.add_argument("--fix", "-f", action="store_true", help="自动修复")
    parser.add_argument("--dry-run", "-d", action="store_true", help="仅预览")

    args = parser.parse_args()

    workspace = Path(args.path).resolve()
    if not workspace.exists():
        print(f"❌ 错误: 路径不存在 {workspace}")
        sys.exit(1)

    rules_path = Path(args.rules) if args.rules else None
    rules = load_rules(rules_path)

    print(f"验证工作区: {workspace}")
    print(f"规则版本: {rules.get('version', 'unknown')}")

    results = validate_workspace(workspace, rules)
    print_results(results)

    if args.fix:
        suggest_fixes(results, dry_run=False)
    elif args.dry_run:
        suggest_fixes(results, dry_run=True)
