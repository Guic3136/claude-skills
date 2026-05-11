import { HUDData } from './stdin';
import { TaskProgress, AgentStatus } from './transcript';
import { HUDConfig, ColorConfig, FormatConfig, DisplayItem, loadConfig } from './config';

const RESET = '\x1b[0m';

export function calculatePercentage(current: number, max: number): number {
  if (max <= 0) return 0;
  const percentage = (current / max) * 100;
  return Math.min(Math.max(percentage, 0), 100);
}

export function renderProgressBar(percentage: number, format?: FormatConfig): string {
  const config = format || {
    progressBarWidth: 10,
    progressBarFilled: '█',
    progressBarEmpty: '░',
    showPercent: true,
    separator: ' | ',
    shortenPath: true,
    maxPathLength: 30,
  };

  const width = config.progressBarWidth;
  const filledCount = Math.round((percentage / 100) * width);
  const emptyCount = width - filledCount;

  const filled = config.progressBarFilled.repeat(filledCount);
  const empty = config.progressBarEmpty.repeat(emptyCount);

  if (config.showPercent) {
    return `[${filled}${empty}] ${Math.round(percentage)}%`;
  }
  return `[${filled}${empty}]`;
}

export function colorize(text: string, color: string): string {
  return `${color}${text}${RESET}`;
}

export function getPercentageColor(percentage: number, colors: ColorConfig): string {
  if (percentage >= 90) return colors.error;
  if (percentage >= 70) return colors.warning;
  if (percentage >= 50) return colors.info;
  return colors.success;
}

export function renderModel(data: HUDData, colors: ColorConfig): string {
  const model = data.model || 'unknown';
  return colorize(model, colors.primary);
}

export function renderContext(data: HUDData, colors: ColorConfig, format: FormatConfig): string {
  const percentage = calculatePercentage(data.currentContextTokens, data.maxContextTokens);
  const color = getPercentageColor(percentage, colors);
  const progressBar = renderProgressBar(percentage, format);
  const warningIcon = percentage >= 90 ? '⚠️ ' : '';
  return colorize(warningIcon + progressBar, color);
}

export function renderTokens(data: HUDData, colors: ColorConfig): string {
  const formatK = (n: number): string => {
    if (n >= 1000) {
      return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'k';
    }
    return String(n);
  };
  const tokens = `${formatK(data.currentContextTokens)}/${formatK(data.maxContextTokens)}`;
  return colorize(tokens, colors.muted);
}

export function renderGit(colors: ColorConfig): string {
  return colorize('(git)', colors.secondary);
}

export function renderPath(colors: ColorConfig, format: FormatConfig): string {
  return colorize('~/path', colors.info);
}

export function renderTool(colors: ColorConfig): string {
  return colorize('🔧 Tool', colors.warning);
}

export function renderAgent(colors: ColorConfig): string {
  return colorize('🤖 Agent', colors.secondary);
}

export function renderTodo(colors: ColorConfig): string {
  return colorize('📋 0/0', colors.success);
}

export function renderItem(item: DisplayItem, data: HUDData, config: HUDConfig): string {
  const { colors, format } = config;

  switch (item) {
    case 'model':
      return renderModel(data, colors);
    case 'context':
      return renderContext(data, colors, format);
    case 'tokens':
      return renderTokens(data, colors);
    case 'git':
      return renderGit(colors);
    case 'path':
      return renderPath(colors, format);
    case 'tool':
      return renderTool(colors);
    case 'agent':
      return renderAgent(colors);
    case 'todo':
      return renderTodo(colors);
    case 'speed': {
      return '';
    }
    case 'speed-avg': {
      return '';
    }
    default:
      return '';
  }
}

export function renderStatusBar(data: HUDData, config?: HUDConfig): string {
  if (!config) {
    const percentage = calculatePercentage(data.currentContextTokens, data.maxContextTokens);
    const progressBar = renderProgressBar(percentage);
    const model = data.model || 'unknown';
    const tokens = `${data.currentContextTokens}/${data.maxContextTokens}`;
    return `${model} | ${progressBar} | ${tokens}`;
  }

  if (!config.enabled) {
    return '';
  }

  const parts: string[] = [];
  for (const item of config.displayItems) {
    const rendered = renderItem(item, data, config);
    if (rendered) {
      parts.push(rendered);
    }
  }

  return parts.join(config.format.separator);
}

export function renderColoredStatusBar(data: HUDData, config: HUDConfig): string {
  return renderStatusBar(data, config);
}

export function renderPlainStatusBar(data: HUDData, config: HUDConfig): string {
  const colored = renderStatusBar(data, config);
  return colored.replace(/\x1b\[[0-9;]*m/g, '');
}

export function estimateStatusBarWidth(data: HUDData, config: HUDConfig): number {
  const plainText = renderPlainStatusBar(data, config);
  let width = 0;
  for (const char of plainText) {
    const code = char.charCodeAt(0);
    if (code >= 0x20 && code <= 0x7e) {
      width += 1;
    } else {
      width += 2;
    }
  }
  return width;
}

export function renderTodoProgress(progress: TaskProgress, width: number = 10): string {
  if (progress.total === 0) {
    return '📋 Tasks: 0/0';
  }

  const percentage = calculatePercentage(progress.completed, progress.total);
  const progressBar = renderProgressBar(percentage, {
    progressBarWidth: width,
    progressBarFilled: '█',
    progressBarEmpty: '░',
    showPercent: true,
    separator: ' | ',
    shortenPath: true,
    maxPathLength: 30,
  });

  return `📋 Tasks: ${progress.completed}/${progress.total} ${progressBar}`;
}

export function renderCompactTodoProgress(progress: TaskProgress): string {
  if (progress.total === 0) {
    return '📋 0/0';
  }

  const percentage = Math.round((progress.completed / progress.total) * 100);
  return `📋 ${progress.completed}/${progress.total} (${percentage}%)`;
}

export function formatAgentStatus(agents: AgentStatus[]): string {
  if (agents.length === 0) {
    return '';
  }

  if (agents.length === 1) {
    return `🤖 Agent: ${agents[0].name}`;
  }

  return `🤖 Agents: ${agents.length} running`;
}
