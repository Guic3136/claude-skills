#!/usr/bin/env node

import {
  loadConfig,
  saveConfig,
  applyPreset,
  resetConfig,
  validateConfig,
  presets,
  HUDConfig,
  DisplayItem,
  defaultColors,
  defaultFormat,
} from './config';

// 显示帮助信息
function showHelp(): void {
  console.log(`
Custom HUD Configuration CLI

Usage:
  hud-config <command> [options]

Commands:
  get                    Show current configuration
  set <key> <value>      Set a configuration value
  preset <name>          Apply a preset (full|essential|minimal)
  enable                 Enable HUD display
  disable                Disable HUD display
  items <list>           Set display items (comma-separated)
  limit <number>         Set context window limit (e.g., 128000)
  colors                 Show available colors
  reset                  Reset to default configuration
  validate               Validate current configuration
  help                   Show this help message

Examples:
  hud-config get
  hud-config preset minimal
  hud-config set format.progressBarWidth 5
  hud-config items model,context,git,todo
  hud-config limit 128000
  hud-config disable

Display Items:
  model    - Model name (e.g., claude-sonnet-4-6)
  context  - Context usage progress bar
  tokens   - Token count (current/max)
  git      - Git branch and status
  path     - Current project path
  tool     - Active tool name
  agent    - Running agents
  todo     - Task progress

Presets:
  full      - Show all items
  essential - Model, context, git, path (default)
  minimal   - Context only
`);
}

// 显示当前配置
function showConfig(): void {
  const config = loadConfig();
  console.log('Current Configuration:');
  console.log(JSON.stringify(config, null, 2));
}

// 设置配置值
function setValue(key: string, value: string): void {
  const config = loadConfig();

  switch (key) {
    case 'preset':
      if (['full', 'essential', 'minimal', 'custom'].includes(value)) {
        applyPreset(value as 'full' | 'essential' | 'minimal');
        console.log(`Applied preset: ${value}`);
      } else {
        console.error(`Invalid preset: ${value}`);
        process.exit(1);
      }
      break;
    case 'enabled':
      config.enabled = value === 'true';
      saveConfig(config);
      console.log(`HUD ${config.enabled ? 'enabled' : 'disabled'}`);
      break;
    case 'format.separator':
      config.format.separator = value;
      saveConfig(config);
      console.log(`Set separator to: "${value}"`);
      break;
    case 'format.progressBarWidth':
      config.format.progressBarWidth = parseInt(value, 10);
      saveConfig(config);
      console.log(`Set progress bar width to: ${value}`);
      break;
    case 'format.showPercent':
      config.format.showPercent = value === 'true';
      saveConfig(config);
      console.log(`Show percent: ${config.format.showPercent}`);
      break;
    case 'maxContextTokens':
    case 'context-limit':
    case 'limit': {
      const limit = parseInt(value, 10);
      if (isNaN(limit) || limit <= 0) {
        console.error(`Invalid context limit: ${value}`);
        process.exit(1);
      }
      config.maxContextTokens = limit;
      saveConfig(config);
      console.log(`Set context window limit to: ${limit.toLocaleString()} tokens`);
      break;
    }
    default:
      console.error(`Unknown key: ${key}`);
      process.exit(1);
  }
}

// 设置显示项
function setItems(itemsStr: string): void {
  const validItems: DisplayItem[] = ['model', 'context', 'tokens', 'git', 'path', 'tool', 'agent', 'todo'];
  const items = itemsStr.split(',').map(item => item.trim() as DisplayItem);

  const invalidItems = items.filter(item => !validItems.includes(item));
  if (invalidItems.length > 0) {
    console.error(`Invalid items: ${invalidItems.join(', ')}`);
    console.error(`Valid items: ${validItems.join(', ')}`);
    process.exit(1);
  }

  const config = loadConfig();
  config.displayItems = items;
  config.preset = 'custom';
  saveConfig(config);
  console.log(`Set display items: ${items.join(', ')}`);
}

// 显示颜色示例
function showColors(): void {
  console.log('Available Colors:');
  const colors = defaultColors;
  Object.entries(colors).forEach(([name, code]) => {
    console.log(`  ${code}${name}\x1b[0m`);
  });
}

// 验证配置
function validate(): void {
  const config = loadConfig();
  if (validateConfig(config)) {
    console.log('Configuration is valid');
  } else {
    console.error('Configuration is invalid');
    process.exit(1);
  }
}

// 主函数
function main(): void {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'get':
    case 'show':
      showConfig();
      break;
    case 'set':
      if (args.length < 3) {
        console.error('Usage: hud-config set <key> <value>');
        process.exit(1);
      }
      setValue(args[1], args[2]);
      break;
    case 'preset':
      if (!args[1]) {
        console.error('Usage: hud-config preset <full|essential|minimal>');
        process.exit(1);
      }
      applyPreset(args[1] as 'full' | 'essential' | 'minimal');
      console.log(`Applied preset: ${args[1]}`);
      break;
    case 'enable':
      setValue('enabled', 'true');
      break;
    case 'disable':
      setValue('enabled', 'false');
      break;
    case 'items':
      if (!args[1]) {
        console.error('Usage: hud-config items <item1,item2,...>');
        process.exit(1);
      }
      setItems(args[1]);
      break;
    case 'colors':
      showColors();
      break;
    case 'reset':
      resetConfig();
      console.log('Configuration reset to defaults');
      break;
    case 'validate':
      validate();
      break;
    case 'limit':
      if (!args[1]) {
        console.error('Usage: hud-config limit <number>');
        console.error('Example: hud-config limit 128000');
        process.exit(1);
      }
      setValue('maxContextTokens', args[1]);
      break;
    case 'help':
    case '--help':
    case '-h':
    default:
      showHelp();
      break;
  }
}

main();
