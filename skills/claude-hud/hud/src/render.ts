import { HUDData } from './stdin';
import { TaskProgress, AgentStatus } from './transcript';
import { HUDConfig, ColorConfig, FormatConfig, DisplayItem, loadConfig } from './config';

// 重置颜色
const RESET = '\x1b[0m';

// 计算百分比
export function calculatePercentage(current: number, max: number): number {
  if (max <= 0) return 0;
  const percentage = (current / max) * 100;
  return Math.min(Math.max(percentage, 0), 100);
}

// 渲染进度条
export function renderProgressBar(
  percentage: number,
  format?: FormatConfig
): string {
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

// 应用颜色
export function colorize(text: string, color: string): string {
  return `${color}${text}${RESET}`;
}

// 根据百分比获取颜色
export function getPercentageColor(percentage: number, colors: ColorConfig): string {
  if (percentage >= 90) return colors.error;
  if (percentage >= 70) return colors.warning;
  if (percentage >= 50) return colors.info;
  return colors.success;
}

// 渲染模型信息
export function renderModel(data: HUDData, colors: ColorConfig): string {
  const model = data.model || 'unknown';
  return colorize(model, colors.primary);
}

// 渲染 Context 进度条
export function renderContext(data: HUDData, colors: ColorConfig, format: FormatConfig): string {
  const percentage = calculatePercentage(
    data.currentContextTokens,
    data.maxContextTokens
  );
  const color = getPercentageColor(percentage, colors);
  const progressBar = renderProgressBar(percentage, format);
  // 达到 90% 时显示警告图标
  const warningIcon = percentage >= 90 ? '⚠️ ' : '';
  return colorize(warningIcon + progressBar, color);
}

// 渲染 Token 数量（带 k 单位）
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

// 渲染 Git 信息（占位符，需要 git 模块）
export function renderGit(colors: ColorConfig): string {
  // 将由 git 模块提供实际实现
  return colorize('(git)', colors.secondary);
}

// 渲染项目路径（占位符，需要 git 模块）
export function renderPath(colors: ColorConfig, format: FormatConfig): string {
  // 将由 git 模块提供实际实现
  return colorize('~/path', colors.info);
}

// 渲染工具信息（占位符，需要 transcript 模块）
export function renderTool(colors: ColorConfig): string {
  // 将由 transcript 模块提供实际实现
  return colorize('🔧 Tool', colors.warning);
}

// 渲染 Agent 信息（占位符，需要 transcript 模块）
export function renderAgent(colors: ColorConfig): string {
  // 将由 transcript 模块提供实际实现
  return colorize('🤖 Agent', colors.secondary);
}

// 渲染 Todo 进度（占位符，需要 todo 模块）
export function renderTodo(colors: ColorConfig): string {
  // 将由 todo 模块提供实际实现
  return colorize('📋 0/0', colors.success);
}

// 渲染单个显示项
export function renderItem(
  item: DisplayItem,
  data: HUDData,
  config: HUDConfig
): string {
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
    default:
      return '';
  }
}

// 旧版渲染函数（向后兼容）
export function renderStatusBar(data: HUDData, config?: HUDConfig): string {
  // 如果没有提供配置，使用默认显示
  if (!config) {
    const percentage = calculatePercentage(
      data.currentContextTokens,
      data.maxContextTokens
    );
    const progressBar = renderProgressBar(percentage);
    const model = data.model || 'unknown';
    const tokens = `${data.currentContextTokens}/${data.maxContextTokens}`;
    return `${model} | ${progressBar} | ${tokens}`;
  }

  // 如果 HUD 被禁用
  if (!config.enabled) {
    return '';
  }

  // 根据配置渲染各个部分
  const parts: string[] = [];

  for (const item of config.displayItems) {
    const rendered = renderItem(item, data, config);
    if (rendered) {
      parts.push(rendered);
    }
  }

  return parts.join(config.format.separator);
}

// 渲染带颜色的状态栏（用于终端显示）
export function renderColoredStatusBar(data: HUDData, config: HUDConfig): string {
  return renderStatusBar(data, config);
}

// 渲染纯文本状态栏（用于日志记录）
export function renderPlainStatusBar(data: HUDData, config: HUDConfig): string {
  // 移除 ANSI 颜色代码
  const colored = renderStatusBar(data, config);
  return colored.replace(/\x1b\[[0-9;]*m/g, '');
}

// 获取状态栏宽度估算（用于布局计算）
export function estimateStatusBarWidth(data: HUDData, config: HUDConfig): number {
  const plainText = renderPlainStatusBar(data, config);
  // 考虑中文字符宽度（emoji 和中文字符占 2 个宽度）
  let width = 0;
  for (const char of plainText) {
    const code = char.charCodeAt(0);
    // 简单判断：ASCII 字符占 1，其他占 2
    if (code >= 0x20 && code <= 0x7e) {
      width += 1;
    } else {
      width += 2;
    }
  }
  return width;
}

// Todo 进度渲染函数（保持向后兼容）
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

/**
 * 格式化 Agent 状态显示字符串
 */
export function formatAgentStatus(agents: AgentStatus[]): string {
  if (agents.length === 0) {
    return '';
  }

  if (agents.length === 1) {
    return `🤖 Agent: ${agents[0].name}`;
  }

  return `🤖 Agents: ${agents.length} running`;
}
