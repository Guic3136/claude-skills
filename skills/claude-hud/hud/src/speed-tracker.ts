import * as fs from 'fs';

interface SpeedSnapshot {
  totalOutputTokens: number;
  totalApiDurationMs: number;
}

const SNAPSHOT_DIR = '/tmp';

function snapshotPath(sessionId: string): string {
  return `${SNAPSHOT_DIR}/hud-speed-${sessionId}.json`;
}

export function calcCurrentSpeed(
  totalOutputTokens: number,
  totalApiDurationMs: number,
  sessionId: string
): number {
  const path = snapshotPath(sessionId);
  let speed = 0;

  try {
    if (fs.existsSync(path)) {
      const prev: SpeedSnapshot = JSON.parse(fs.readFileSync(path, 'utf-8'));
      const deltaTokens = totalOutputTokens - prev.totalOutputTokens;
      const deltaMs = totalApiDurationMs - prev.totalApiDurationMs;

      if (deltaMs > 0 && deltaTokens > 0) {
        speed = deltaTokens / (deltaMs / 1000);
      }
    }
  } catch {
    // 读取或解析失败，speed 保持 0
  }

  // 更新快照
  try {
    fs.writeFileSync(path, JSON.stringify({ totalOutputTokens, totalApiDurationMs }));
  } catch {
    // 写入失败不影响展示
  }

  return isFinite(speed) && !isNaN(speed) ? speed : 0;
}
