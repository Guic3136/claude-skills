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
  maxContextTokens?: number;
  modelContextMap?: Record<string, number>;
}

// 默认颜色配置
export const defaultColors: ColorConfig = {
  primary: '\x1b[36m',
  secondary: '\x1b[35m',
  success: '\x1b[32m',
  warning: '\x1b[33m',
  error: '\x1b[31m',
  info: '\x1b[34m',
  muted: '\x1b[90m',
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
    displayItems: ['model', 'context', 'tokens', 'git', 'path', 'tool', 'agent', 'todo', 'speed'],
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
      primary: '\x1b[0m',
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
    modelContextMap: userConfig.modelContextMap || baseConfig.modelContextMap,
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

  getConfig(): HUDConfig {
    return this.currentConfig;
  }

  reload(): HUDConfig {
    this.currentConfig = loadConfig();
    this.notifyWatchers();
    return this.currentConfig;
  }

  onChange(callback: (config: HUDConfig) => void): void {
    this.watchers.push(callback);
  }

  private notifyWatchers(): void {
    for (const watcher of this.watchers) {
      watcher(this.currentConfig);
    }
  }

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

  stopWatching(): void {
    if (this.fsWatcher) {
      this.fsWatcher.close();
      this.fsWatcher = null;
    }
  }
}

export function resetConfig(): HUDConfig {
  saveConfig(defaultConfig);
  return defaultConfig;
}

export function validateConfig(config: unknown): config is HUDConfig {
  if (typeof config !== 'object' || config === null) {
    return false;
  }

  const c = config as Partial<HUDConfig>;

  if (c.preset && !['full', 'essential', 'minimal', 'custom'].includes(c.preset)) {
    return false;
  }

  if (c.displayItems) {
    const validItems: DisplayItem[] = ['model', 'context', 'tokens', 'git', 'path', 'tool', 'agent', 'todo', 'speed', 'speed-avg'];
    if (!Array.isArray(c.displayItems) || !c.displayItems.every(item => validItems.includes(item))) {
      return false;
    }
  }

  if (c.enabled !== undefined && typeof c.enabled !== 'boolean') {
    return false;
  }

  return true;
}

// Built-in model context sizes
const builtinModelContextSizes: Record<string, number> = {
  'claude-opus-4-7': 200000,
  'claude-opus-4-6': 200000,
  'claude-opus-4-5': 200000,
  'claude-sonnet-4-6': 200000,
  'claude-sonnet-4-5': 200000,
  'claude-haiku-4-5': 200000,
  'claude-3-5-sonnet': 200000,
  'claude-3-opus': 200000,
  'claude-3-sonnet': 200000,
  'claude-3-haiku': 200000,
  'gpt-4o': 128000,
  'gpt-4': 128000,
  'gpt-3.5-turbo': 16385,
  'gemini-pro': 1000000,
  'gemini-1.5-pro': 1000000,
  'deepseek-chat': 64000,
  'deepseek-coder': 128000,
};

export function lookupModelContextSize(
  model: string,
  modelContextMap?: Record<string, number>
): { size: number; matchType: string } | null {
  if (!model) return null;

  const normalizedModel = model.toLowerCase().trim();

  // Priority 1: exact match in user config
  if (modelContextMap) {
    for (const [key, value] of Object.entries(modelContextMap)) {
      if (key.toLowerCase().trim() === normalizedModel) {
        return { size: value, matchType: 'user-config-exact' };
      }
    }
  }

  // Priority 2: exact match in built-in
  for (const [key, value] of Object.entries(builtinModelContextSizes)) {
    if (key.toLowerCase() === normalizedModel) {
      return { size: value, matchType: 'builtin-exact' };
    }
  }

  // Priority 3: prefix match in user config
  if (modelContextMap) {
    for (const [key, value] of Object.entries(modelContextMap)) {
      if (normalizedModel.startsWith(key.toLowerCase().trim())) {
        return { size: value, matchType: 'user-config-prefix' };
      }
    }
  }

  // Priority 4: prefix match in built-in
  for (const [key, value] of Object.entries(builtinModelContextSizes)) {
    if (normalizedModel.startsWith(key.toLowerCase())) {
      return { size: value, matchType: 'builtin-prefix' };
    }
  }

  return null;
}
