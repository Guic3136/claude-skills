const fs = require('fs');
const path = require('path');

const CONFIG_FILE = '.claude/save-progress-config.json';
const DEFAULT_CONFIG = {
  contextLimit: 128000,
  warningThreshold: 0.9,
  autoSaveOnOverflow: false,
  summariesDir: 'summaries'
};

function getConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const userConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      return { ...DEFAULT_CONFIG, ...userConfig };
    }
  } catch (error) {
    console.error('Error reading config:', error.message);
  }
  return DEFAULT_CONFIG;
}

function main() {
  const config = getConfig();

  // 输出配置信息（用于其他脚本读取）
  if (process.argv.includes('--context-limit')) {
    console.log(config.contextLimit);
    return;
  }

  if (process.argv.includes('--warning-threshold')) {
    console.log(config.warningThreshold);
    return;
  }

  if (process.argv.includes('--summaries-dir')) {
    console.log(config.summariesDir);
    return;
  }

  if (process.argv.includes('--check')) {
    // 检查是否达到警告阈值
    const warningTokens = Math.floor(config.contextLimit * config.warningThreshold);
    console.log(`当前配置：上下文上限 ${config.contextLimit}，警告阈值 ${config.warningThreshold * 100}% (${warningTokens} tokens)`);
    return;
  }

  // 默认输出完整配置
  console.log(JSON.stringify(config, null, 2));
}

main();
