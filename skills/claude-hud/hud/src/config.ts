import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// 显示项类型
export type DisplayItem =
  | 'model'
  | 'context'
  | 'tokens'
  | 'git'
  | 'path'
  | 'tool'
  | 'agent'
  | 'todo'
  | 'speed'
  | 'speed-avg';

// 颜色配置
export interface ColorConfig {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  muted: string;
}

// 格式配置
export interface FormatConfig {
  separator: string;
  progressBarWidth: number;
  progressBarFilled: string;
  progressBarEmpty: string;
  showPercent: boolean;
  shortenPath: boolean;
  maxPathLength: number;
}

// 预设配置
export interface HUDConfig {
  preset: 'full' | 'essential' | 'minimal' | 'custom';
  displayItems: DisplayItem[];
  colors: ColorConfig;
  format: FormatConfig;
  enabled: boolean;
  maxContextTokens?: number; // 自定义上下文窗口上限，默认为 200000
}

// 默认颜色配置
export const defaultColors: ColorConfig = {
  primary: '\x1b[36m',    // 青色
  secondary: '\x1b[35m',  // 洋红
  success: '\x1b[32m',    // 绿色
  warning: '\x1b[33m',    // 黄色
  error: '\x1b[31m',      // 红色
  info: '\x1b[34m',       // 蓝色
  muted: '\x1b[90m',      // 灰色
};

// 默认格式配置
export const defaultFormat: FormatConfig = {
  separator: ' | ',
  progressBarWidth: 10,
  progressBarFilled: '█',
  progressBarEmpty: '░',
  showPercent: true,
  shortenPath: true,
  maxPathLength: 30,
};

// 预设配置
export const presets: Record<string, HUDConfig> = {
  full: {
    preset: 'full',
    displayItems: ['model', 'context', 'tokens', 'speed', 'speed-avg', 'git', 'path', 'tool', 'agent', 'todo'],
    colors: defaultColors,
    format: defaultFormat,
    enabled: true,
  },
  essential: {
    preset: 'essential',
    displayItems: ['model', 'context', 'git', 'path'],
    colors: defaultColors,
    format: {
      ...defaultFormat,
      progressBarWidth: 8,
    },
    enabled: true,
  },
  minimal: {
    preset: 'minimal',
    displayItems: ['context'],
    colors: {
      ...defaultColors,
      primary: '\x1b[0m',  // 无颜色
    },
    format: {
      ...defaultFormat,
      progressBarWidth: 5,
      showPercent: false,
    },
    enabled: true,
  },
  custom: {
    preset: 'custom',
    displayItems: ['model', 'context', 'git'],
    colors: defaultColors,
    format: defaultFormat,
    enabled: true,
  },
};

// 默认配置
export const defaultConfig: HUDConfig = presets.essential;

// 配置文件路径
export function getConfigPath(): string {
  const configDir = path.join(os.homedir(), '.claude');
  return path.join(configDir, 'hud-config.json');
}

// 加载配置
export function loadConfig(): HUDConfig {
  const configPath = getConfigPath();

  try {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8');
      const userConfig = JSON.parse(content);
      return mergeConfig(userConfig);
    }
  } catch (error) {
    console.error('Failed to load config:', error);
  }

  return defaultConfig;
}

// 保存配置
export function saveConfig(config: HUDConfig): void {
  const configPath = getConfigPath();

  try {
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save config:', error);
  }
}

// 合并用户配置与默认配置
export function mergeConfig(userConfig: Partial<HUDConfig>): HUDConfig {
  // 如果指定了预设，先加载预设
  const baseConfig = userConfig.preset && presets[userConfig.preset]
    ? presets[userConfig.preset]
    : defaultConfig;

  return {
    preset: userConfig.preset || baseConfig.preset,
    displayItems: userConfig.displayItems || baseConfig.displayItems,
    colors: { ...baseConfig.colors, ...userConfig.colors },
    format: { ...baseConfig.format, ...userConfig.format },
    enabled: userConfig.enabled !== undefined ? userConfig.enabled : baseConfig.enabled,
    maxContextTokens: userConfig.maxContextTokens !== undefined ? userConfig.maxContextTokens : baseConfig.maxContextTokens,
  };
}

// 应用预设
export function applyPreset(presetName: 'full' | 'essential' | 'minimal'): HUDConfig {
  const preset = presets[presetName];
  if (preset) {
    saveConfig({ ...preset });
    return { ...preset };
  }
  return defaultConfig;
}

// 配置热加载支持
export class ConfigWatcher {
  private configPath: string;
  private currentConfig: HUDConfig;
  private watchers: ((config: HUDConfig) => void)[] = [];
  private fsWatcher: fs.FSWatcher | null = null;

  constructor() {
    this.configPath = getConfigPath();
    this.currentConfig = loadConfig();
  }

  // 获取当前配置
  getConfig(): HUDConfig {
    return this.currentConfig;
  }

  // 重新加载配置
  reload(): HUDConfig {
    this.currentConfig = loadConfig();
    this.notifyWatchers();
    return this.currentConfig;
  }

  // 监听配置变化
  onChange(callback: (config: HUDConfig) => void): void {
    this.watchers.push(callback);
  }

  // 通知所有监听器
  private notifyWatchers(): void {
    for (const watcher of this.watchers) {
      watcher(this.currentConfig);
    }
  }

  // 启动文件监听（热加载）
  startWatching(): void {
    if (this.fsWatcher) {
      return;
    }

    try {
      this.fsWatcher = fs.watch(this.configPath, (eventType) => {
        if (eventType === 'change') {
          console.error('Config file changed, reloading...');
          this.reload();
        }
      });
    } catch (error) {
      console.error('Failed to watch config file:', error);
    }
  }

  // 停止文件监听
  stopWatching(): void {
    if (this.fsWatcher) {
      this.fsWatcher.close();
      this.fsWatcher = null;
    }
  }
}

// 重置为默认配置
export function resetConfig(): HUDConfig {
  saveConfig(defaultConfig);
  return defaultConfig;
}

// 验证配置
export function validateConfig(config: unknown): config is HUDConfig {
  if (typeof config !== 'object' || config === null) {
    return false;
  }

  const c = config as Partial<HUDConfig>;

  // 验证 preset
  if (c.preset && !['full', 'essential', 'minimal', 'custom'].includes(c.preset)) {
    return false;
  }

  // 验证 displayItems
  if (c.displayItems) {
    const validItems: DisplayItem[] = ['model', 'context', 'tokens', 'git', 'path', 'tool', 'agent', 'todo', 'speed', 'speed-avg'];
    if (!Array.isArray(c.displayItems) || !c.displayItems.every(item => validItems.includes(item))) {
      return false;
    }
  }

  // 验证 enabled
  if (c.enabled !== undefined && typeof c.enabled !== 'boolean') {
    return false;
  }

  return true;
}
