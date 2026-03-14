# Claude Skills 开发入门

## 什么是 Claude Skill？

Claude Skill 是一种扩展 Claude Code 功能的方式。

## 技能结构

```
skill-name/
├── skill.yaml          # 技能定义
├── system-prompt.md    # 行为指导
└── README.md          # 使用说明
```

## 快速开始

1. 复制模板：
```bash
cp -r templates/skill-template my-skill
```

2. 编辑 `skill.yaml` 和 `system-prompt.md`

3. 测试：
```bash
cp -r my-skill ~/.claude/skills/
claude  # 重启
```

## 最佳实践

- 清晰的描述
- 具体的规则
- 语义化版本号
