import { readStdin, parseJSONData, HUDData, logDebug } from './stdin';
import { renderStatusBar, formatAgentStatus, renderCompactTodoProgress, renderItem } from './render';
import { parseHistoryFile, getRunningAgents, readTasksFromSystem, calculateTaskProgress } from './transcript';
import { getGitStatus, formatGitStatus, getShortPath } from './git';
import { loadConfig, HUDConfig, DisplayItem, ConfigWatcher, lookupModelContextSize } from './config';
import { calcCurrentSpeed } from './speed-tracker';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// 从 ~/.claude/settings.json 读取 model 字段
function detectModelFromSettings(): string | undefined {
  try {
    const settingsPath = path.join(os.homedir(), '.claude', 'settings.json');
    if (!fs.existsSync(settingsPath)) return undefined;
    const content = fs.readFileSync(settingsPath, 'utf-8');
    const settings = JSON.parse(content);
    if (typeof settings.model === 'string' && settings.model.trim()) {
      return settings.model.trim();
    }
  } catch {
    // ignore
  }
  return undefined;
}

// 从 CC Switch 数据库读取当前 provider 的 model 配置
function detectModelFromCCSwitch(): string | undefined {
  try {
    const dbPath = path.join(os.homedir(), '.cc-switch', 'cc-switch.db');
    if (!fs.existsSync(dbPath)) return undefined;

    const { execSync } = require('child_process');
    const sql = `SELECT settings_config FROM providers WHERE is_current = 1 AND app_type = 'claude' LIMIT 1`;

    // 尝试多个 sqlite3 路径：系统 PATH -> 插件目录 -> 常见安装位置
    const sqlitePaths = ['sqlite3'];
    if (process.platform === 'win32') {
      const pluginDir = path.join(os.homedir(), '.claude', 'plugins', 'claude-hud');
      sqlitePaths.unshift(
        path.join(pluginDir, 'sqlite3.exe'),
        path.join(pluginDir, 'sqlite3', 'sqlite3.exe')
      );
    }

    let result: string | undefined;
    for (const sqliteCmd of sqlitePaths) {
      try {
        result = execSync(`"${sqliteCmd}" "${dbPath}" "${sql}"`, { encoding: 'utf-8', timeout: 5000 }).trim();
        if (result) break;
      } catch {
        // 尝试下一个路径
        continue;
      }
    }

    if (!result) return undefined;

    const config = JSON.parse(result);
    if (typeof config.model === 'string' && config.model.trim()) {
      return config.model.trim();
    }
  } catch {
    // ignore
  }
  return undefined;
}

// 扩展的 HUD 数据接口，包含动态获取的信息
interface ExtendedHUDData extends HUDData {
  git?: {
    branch: string;
    isClean: boolean;
    modifiedCount: number;
  };
  path?: string;
  tool?: string;
  agents?: string[];
  todo?: {
    completed: number;
    total: number;
  };
  speed?: number;
  speedAvg?: number;
}

// 根据配置收集所有需要的数据
async function collectData(baseData: HUDData, config: HUDConfig): Promise<ExtendedHUDData> {
  const data: ExtendedHUDData = { ...baseData };

  // 收集 Git 信息
  if (config.displayItems.includes('git') || config.displayItems.includes('path')) {
    try {
      const gitStatus = getGitStatus();
      data.git = {
        branch: gitStatus.branch,
        isClean: gitStatus.isClean,
        modifiedCount: gitStatus.modifiedCount,
      };
      data.path = getShortPath();
    } catch {
      // 非 Git 仓库或获取失败
    }
  }

  // 收集 Todo 信息
  if (config.displayItems.includes('todo')) {
    try {
      const tasks = await readTasksFromSystem();
      const progress = calculateTaskProgress(tasks);
      data.todo = {
        completed: progress.completed,
        total: progress.total,
      };
    } catch {
      data.todo = { completed: 0, total: 0 };
    }
  }

  // 计算 token 速率（增量当前速率）
  if (config.displayItems.includes('speed')) {
    if (baseData.totalOutputTokens && baseData.totalApiDurationMs && baseData.sessionId) {
      const speed = calcCurrentSpeed(
        baseData.totalOutputTokens,
        baseData.totalApiDurationMs,
        baseData.sessionId
      );
      if (speed > 0) {
        data.speed = speed;
      }
    }
  }

  // 计算会话平均速率
  if (config.displayItems.includes('speed-avg')) {
    if (baseData.totalOutputTokens && baseData.totalApiDurationMs && baseData.totalApiDurationMs > 0) {
      const avg = baseData.totalOutputTokens / (baseData.totalApiDurationMs / 1000);
      if (isFinite(avg) && !isNaN(avg) && avg > 0) {
        data.speedAvg = avg;
      }
    }
  }

  // 收集 Agent 信息
  if (config.displayItems.includes('agent')) {
    try {
      const events = await parseHistoryFile();
      const runningAgents = getRunningAgents(events);
      data.agents = runningAgents.map(a => a.name);
    } catch {
      data.agents = [];
    }
  }

  return data;
}

// 渲染单个显示项（使用动态数据）
function renderDynamicItem(
  item: DisplayItem,
  data: ExtendedHUDData,
  config: HUDConfig
): string {
  const { colors, format } = config;

  switch (item) {
    case 'model': {
      const model = data.model || 'unknown';
      return `${colors.primary}${model}\x1b[0m`;
    }
    case 'context': {
      const percentage = Math.min(Math.max((data.currentContextTokens / data.maxContextTokens) * 100, 0), 100);
      const width = format.progressBarWidth;
      const filledCount = Math.round((percentage / 100) * width);
      const emptyCount = width - filledCount;
      const filled = format.progressBarFilled.repeat(filledCount);
      const empty = format.progressBarEmpty.repeat(emptyCount);
      const progressBar = `[${filled}${empty}]${format.showPercent ? ` ${Math.round(percentage)}%` : ''}`;

      let color = colors.success;
      if (percentage >= 90) color = colors.error;
      else if (percentage >= 70) color = colors.warning;
      else if (percentage >= 50) color = colors.info;

      // 达到 90% 时显示警告图标
      const warningIcon = percentage >= 90 ? '⚠️ ' : '';

      return `${color}${warningIcon}${progressBar}\x1b[0m`;
    }
    case 'tokens': {
      // 使用 k 单位格式化数字
      const formatK = (n: number): string => {
        if (n >= 1000) {
          return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'k';
        }
        return String(n);
      };
      const tokens = `${formatK(data.currentContextTokens)}/${formatK(data.maxContextTokens)}`;
      return `${colors.muted}${tokens}\x1b[0m`;
    }
    case 'git': {
      if (data.git) {
        const symbol = data.git.isClean ? '✓' : 'M';
        const color = data.git.isClean ? colors.success : colors.warning;
        return `${color}(${data.git.branch}) [${symbol}]\x1b[0m`;
      }
      return '';
    }
    case 'path': {
      if (data.path) {
        return `${colors.info}${data.path}\x1b[0m`;
      }
      return '';
    }
    case 'tool': {
      // 工具信息需要从 history.jsonl 解析最后一个工具调用
      return `${colors.warning}🔧 Tool\x1b[0m`;
    }
    case 'agent': {
      if (data.agents && data.agents.length > 0) {
        if (data.agents.length === 1) {
          return `${colors.secondary}🤖 ${data.agents[0]}\x1b[0m`;
        }
        return `${colors.secondary}🤖 ${data.agents.length} agents\x1b[0m`;
      }
      return '';
    }
    case 'todo': {
      if (data.todo) {
        const { completed, total } = data.todo;
        if (total === 0) return `${colors.success}📋 0/0\x1b[0m`;
        const percentage = Math.round((completed / total) * 100);
        return `${colors.success}📋 ${completed}/${total} (${percentage}%)\x1b[0m`;
      }
      return '';
    }
    case 'speed': {
      const speed = data.speed || 0;
      if (speed === 0) return '';
      const formatted = speed < 10 ? speed.toFixed(1) : Math.round(speed).toString();
      let color = colors.primary;
      if (speed < 20) color = colors.warning;
      else if (speed > 80) color = colors.success;
      return `${color}⚡${formatted} tok/s\x1b[0m`;
    }
    case 'speed-avg': {
      const avg = data.speedAvg || 0;
      if (avg === 0) return '';
      const formatted = avg < 10 ? avg.toFixed(1) : Math.round(avg).toString();
      return `${colors.muted}≈${formatted} tok/s\x1b[0m`;
    }
    default:
      return '';
  }
}

// 主渲染函数
async function renderWithConfig(data: HUDData, config: HUDConfig): Promise<string> {
  // 如果 HUD 被禁用
  if (!config.enabled) {
    return '';
  }

  // 收集动态数据
  const extendedData = await collectData(data, config);

  // 根据配置渲染各个部分
  const parts: string[] = [];

  for (const item of config.displayItems) {
    const rendered = renderDynamicItem(item, extendedData, config);
    if (rendered) {
      parts.push(rendered);
    }
  }

  return parts.join(config.format.separator);
}

async function main() {
  const input = await readStdin();

  // 调试模式：将接收到的数据写入文件
  if (process.env.HUD_DEBUG) {
    const fs = require('fs');
    const debugInfo = {
      timestamp: new Date().toISOString(),
      inputLength: input?.length || 0,
      inputPreview: input?.substring(0, 500) || 'empty',
      cwd: process.cwd()
    };
    fs.writeFileSync(path.join(os.tmpdir(), 'hud-debug.json'), JSON.stringify(debugInfo, null, 2));
  }

  let data: HUDData;

  if (!input) {
    // 没有输入时使用默认值
    data = {
      currentContextTokens: 0,
      maxContextTokens: 200000,
      model: 'claude'
    };
  } else {
    const parsed = parseJSONData(input);
    if (!parsed) {
      // 解析失败也使用默认值
      data = {
        currentContextTokens: 0,
        maxContextTokens: 200000,
        model: 'claude'
      };
    } else {
      data = parsed;
    }
  }

  // 加载配置
  const config = loadConfig();

  // 记录 stdin 原始模型信息
  const stdinModel = data.model;
  const stdinMaxTokens = data.maxContextTokens;

  // 模型名称解析：settings.json / CC Switch 明确配置的 model 优先于 stdin
  // 因为 CC Switch 等外部工具通过修改配置文件切换模型，stdin 中的值可能是缓存的陈旧值
  let resolvedModel = data.model;
  let modelSource = 'stdin';

  // 优先级 1：~/.claude/settings.json（CC Switch 直接修改的配置文件）
  const settingsModel = detectModelFromSettings();
  if (settingsModel) {
    resolvedModel = settingsModel;
    modelSource = 'settings.json';
  }

  // 优先级 2：CC Switch 数据库（如果 settings.json 中没有 model 字段）
  if (!settingsModel) {
    const ccSwitchModel = detectModelFromCCSwitch();
    if (ccSwitchModel) {
      resolvedModel = ccSwitchModel;
      modelSource = 'cc-switch';
    }
  }

  // 优先级 3：环境变量（兜底）
  if (!settingsModel && !detectModelFromCCSwitch()) {
    const envModel = process.env.CLAUDE_MODEL || process.env.ANTHROPIC_MODEL || process.env.MODEL;
    if (envModel && envModel.trim()) {
      resolvedModel = envModel.trim();
      modelSource = 'env';
    }
  }

  data.model = resolvedModel;

  // 使用 lookupModelContextSize 解析上下文大小（精确 → 前缀 → 内置）
  let resolvedMaxTokens = data.maxContextTokens;
  let contextSource = 'stdin';

  const lookup = resolvedModel ? lookupModelContextSize(resolvedModel, config.modelContextMap) : null;
  if (lookup) {
    resolvedMaxTokens = lookup.size;
    contextSource = lookup.matchType;
  } else if (config.maxContextTokens && config.maxContextTokens > 0) {
    // 回退到用户全局配置
    resolvedMaxTokens = config.maxContextTokens;
    contextSource = 'global-config';
  }

  data.maxContextTokens = resolvedMaxTokens;

  logDebug('Model resolution', {
    stdinModel,
    resolvedModel,
    modelSource,
    stdinMaxTokens,
    resolvedMaxTokens,
    contextSource,
    settingsModel: detectModelFromSettings() || null,
    ccSwitchModel: detectModelFromCCSwitch() || null,
    envModel: (process.env.CLAUDE_MODEL || process.env.ANTHROPIC_MODEL || process.env.MODEL) || null,
  }, 'info');

  // 使用配置系统渲染
  const statusBar = await renderWithConfig(data, config);

  if (statusBar) {
    console.log(statusBar);
  }
}

main();
