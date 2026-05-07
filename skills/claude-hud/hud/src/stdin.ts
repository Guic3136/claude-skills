export interface HUDData {
  currentContextTokens: number;
  maxContextTokens: number;
  model?: string;
  sessionId?: string;
  timestamp?: string;
  totalOutputTokens?: number;
  totalApiDurationMs?: number;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// 调试日志函数
export function logDebug(message: string, data?: unknown, level: LogLevel = 'debug'): void {
  if (!process.env.HUD_DEBUG) return;

  const fs = require('fs');
  const logFile = process.env.HUD_DEBUG_LOG || '/tmp/hud-debug.log';

  const logEntry = {
    timestamp: new Date().toISOString(),
    pid: process.pid,
    level,
    message,
    data
  };

  try {
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  } catch {
    // ignore
  }

  // HUD_DEBUG=2 时同时输出到 stderr（实时调试）
  if (process.env.HUD_DEBUG === '2') {
    console.error(`[HUD ${level.toUpperCase()}] ${message}`, data !== undefined ? JSON.stringify(data) : '');
  }
}

// 从 stdin JSON 中提取模型名称，检查多个可能的字段
function extractModel(data: any): string | undefined {
  if (data.model && typeof data.model === 'object') {
    // 按优先级检查对象中的多个可能字段
    const modelObj = data.model;
    return modelObj.id ||
           modelObj.name ||
           modelObj.model ||
           modelObj.display_name ||
           modelObj.apiName ||
           undefined;
  }
  if (typeof data.model === 'string') {
    return data.model;
  }
  // 顶层字段回退
  if (typeof data.model_id === 'string') {
    return data.model_id;
  }
  if (typeof data.model_name === 'string') {
    return data.model_name;
  }
  return undefined;
}

export function parseJSONData(jsonString: string): HUDData | null {
  try {
    logDebug('Raw input received', jsonString.substring(0, 2000));

    const data = JSON.parse(jsonString);

    logDebug('Parsed data structure', {
      hasContextWindow: !!data.context_window,
      contextWindowKeys: data.context_window ? Object.keys(data.context_window) : null,
      usedPercentage: data.context_window?.used_percentage,
      contextWindowSize: data.context_window?.context_window_size,
      modelType: typeof data.model,
      modelValue: typeof data.model === 'object' ? data.model : data.model,
      modelKeys: data.model && typeof data.model === 'object' ? Object.keys(data.model) : null,
    });

    let currentTokens: number;
    let maxTokens: number;
    let model: string | undefined;

    // 支持 Claude Code 的实际数据格式
    if (data.context_window) {
      // 新格式: { context_window: { used_percentage, context_window_size } }
      const cw = data.context_window;
      maxTokens = cw.context_window_size || 200000;

      // 使用 Claude Code 提供的 used_percentage 计算当前 token 数
      // 注意：total_input_tokens 和 total_output_tokens 是累计值，不是当前使用量
      const usedPercentage = typeof cw.used_percentage === 'number' ? cw.used_percentage : 0;
      currentTokens = Math.round((usedPercentage / 100) * maxTokens);

      // 使用增强的模型提取逻辑
      model = extractModel(data);
    } else if (typeof data.currentContextTokens === 'number' &&
               typeof data.maxContextTokens === 'number') {
      // 旧格式直接兼容
      currentTokens = data.currentContextTokens;
      maxTokens = data.maxContextTokens;
      model = typeof data.model === 'string' ? data.model : extractModel(data);
    } else {
      console.error('Invalid data: missing required token fields');
      return null;
    }

    // 验证并清理数据
    currentTokens = Math.max(0, currentTokens);
    maxTokens = Math.max(1, maxTokens); // 至少为1，避免除零

    // 解析 token 速率相关字段
    let totalOutputTokens: number | undefined;
    let totalApiDurationMs: number | undefined;

    if (data.context_window) {
      const cw = data.context_window;
      if (typeof cw.total_output_tokens === 'number') {
        totalOutputTokens = cw.total_output_tokens;
      }
    }

    if (data.cost && typeof data.cost.total_api_duration_ms === 'number') {
      totalApiDurationMs = data.cost.total_api_duration_ms;
    }

    const result = {
      currentContextTokens: currentTokens,
      maxContextTokens: maxTokens,
      model: model || 'claude',
      sessionId: data.session_id || data.sessionId,
      timestamp: data.timestamp,
      totalOutputTokens,
      totalApiDurationMs,
    };

    logDebug('Parsed result', result);

    return result;
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    logDebug('Parse error', error);
    return null;
  }
}

export function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    let resolved = false;

    process.stdin.setEncoding('utf8');

    // 监听数据
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });

    // stdin 结束
    process.stdin.on('end', () => {
      if (!resolved) {
        resolved = true;
        resolve(data.trim());
      }
    });

    // 错误处理
    process.stdin.on('error', () => {
      if (!resolved) {
        resolved = true;
        resolve('');
      }
    });

    // 超时保护：如果 100ms 内没有数据，可能是交互模式
    const timeout = setTimeout(() => {
      if (!resolved && data === '') {
        resolved = true;
        resolve('');
      }
    }, 100);

    // 清理 timeout
    process.stdin.on('end', () => clearTimeout(timeout));
    process.stdin.on('error', () => clearTimeout(timeout));
  });
}
