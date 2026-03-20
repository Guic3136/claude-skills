import { readStdin, parseJSONData, HUDData } from './stdin';
import { renderStatusBar, formatAgentStatus, renderCompactTodoProgress, renderItem } from './render';
import { parseHistoryFile, getRunningAgents, readTasksFromSystem, calculateTaskProgress } from './transcript';
import { getGitStatus, formatGitStatus, getShortPath } from './git';
import { loadConfig, HUDConfig, DisplayItem, ConfigWatcher } from './config';
import { calcCurrentSpeed } from './speed-tracker';

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
    fs.writeFileSync('/tmp/hud-debug.json', JSON.stringify(debugInfo, null, 2));
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

  // 如果用户配置了自定义上下文窗口上限，则覆盖从 Claude Code 接收到的值
  if (config.maxContextTokens && config.maxContextTokens > 0) {
    data.maxContextTokens = config.maxContextTokens;
  }

  // 使用配置系统渲染
  const statusBar = await renderWithConfig(data, config);

  if (statusBar) {
    console.log(statusBar);
  }
}

main();
