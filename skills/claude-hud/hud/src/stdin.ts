export interface HUDData {
  currentContextTokens: number;
  maxContextTokens: number;
  model?: string;
  sessionId?: string;
  timestamp?: string;
  totalOutputTokens?: number;
  totalApiDurationMs?: number;
}

export function parseJSONData(jsonString: string): HUDData | null {
  try {
    const data = JSON.parse(jsonString);

    let currentTokens: number;
    let maxTokens: number;
    let model: string | undefined;

    // 支持 Claude Code 的实际数据格式
    if (data.context_window) {
      // 新格式: { context_window: { used_percentage, context_window_size } }
      const cw = data.context_window;
      maxTokens = cw.context_window_size || 200000;

      // 使用 Claude Code 提供的 used_percentage 计算当前 token 数
      const usedPercentage = typeof cw.used_percentage === 'number' ? cw.used_percentage : 0;
      currentTokens = Math.round((usedPercentage / 100) * maxTokens);

      // 模型名称可能在 data.model.id 中
      if (data.model && typeof data.model === 'object') {
        model = data.model.id || data.model.display_name;
      } else if (typeof data.model === 'string') {
        model = data.model;
      }
    } else if (typeof data.currentContextTokens === 'number' &&
               typeof data.maxContextTokens === 'number') {
      // 旧格式直接兼容
      currentTokens = data.currentContextTokens;
      maxTokens = data.maxContextTokens;
      model = typeof data.model === 'string' ? data.model : undefined;
    } else {
      console.error('Invalid data: missing required token fields');
      return null;
    }

    // 验证并清理数据
    currentTokens = Math.max(0, currentTokens);
    maxTokens = Math.max(1, maxTokens); // 至少为1，避免除零

    return {
      currentContextTokens: currentTokens,
      maxContextTokens: maxTokens,
      model: model || 'claude',
      sessionId: data.session_id || data.sessionId,
      timestamp: data.timestamp,
      totalOutputTokens: typeof data.total_output_tokens === 'number' ? data.total_output_tokens : undefined,
      totalApiDurationMs: typeof data.total_api_duration_ms === 'number' ? data.total_api_duration_ms : undefined,
    };
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return null;
  }
}

export function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    let resolved = false;

    process.stdin.setEncoding('utf8');

    process.stdin.on('data', (chunk) => {
      data += chunk;
    });

    process.stdin.on('end', () => {
      if (!resolved) {
        resolved = true;
        resolve(data.trim());
      }
    });

    process.stdin.on('error', () => {
      if (!resolved) {
        resolved = true;
        resolve('');
      }
    });

    const timeout = setTimeout(() => {
      if (!resolved && data === '') {
        resolved = true;
        resolve('');
      }
    }, 100);

    process.stdin.on('end', () => clearTimeout(timeout));
    process.stdin.on('error', () => clearTimeout(timeout));
  });
}

export function logDebug(label: string, data: unknown, level: 'info' | 'warn' | 'error' = 'info'): void {
  if (!process.env.HUD_DEBUG) return;

  try {
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    const logFile = process.env.HUD_DEBUG_LOG || path.join(os.tmpdir(), 'hud-debug.log');
    const entry = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${label}: ${JSON.stringify(data)}\n`;
    fs.appendFileSync(logFile, entry);
  } catch {
    // ignore logging errors
  }
}
