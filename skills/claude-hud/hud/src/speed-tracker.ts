import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface SpeedSnapshot {
  tokens: number;
  timestamp: number;
}

const SNAPSHOT_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

function getSnapshotPath(sessionId: string): string {
  return path.join(os.tmpdir(), `hud-speed-${sessionId}.json`);
}

function readSnapshot(filePath: string): SpeedSnapshot | null {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data) as SpeedSnapshot;
  } catch {
    return null;
  }
}

function writeSnapshot(filePath: string, snapshot: SpeedSnapshot): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(snapshot), 'utf-8');
  } catch {
    // Silently ignore write errors
  }
}

function cleanupOldSnapshots(): void {
  try {
    const tmpDir = os.tmpdir();
    const files = fs.readdirSync(tmpDir);
    const now = Date.now();

    for (const file of files) {
      if (!file.startsWith('hud-speed-') || !file.endsWith('.json')) {
        continue;
      }

      const filePath = path.join(tmpDir, file);
      try {
        const stat = fs.statSync(filePath);
        if (now - stat.mtimeMs > SNAPSHOT_MAX_AGE_MS) {
          fs.unlinkSync(filePath);
        }
      } catch {
        // Ignore errors for individual file cleanup
      }
    }
  } catch {
    // Ignore errors during cleanup
  }
}

export function calcCurrentSpeed(
  totalOutputTokens: number,
  totalApiDurationMs: number,
  sessionId: string
): number {
  try {
    const snapshotPath = getSnapshotPath(sessionId);
    const now = Date.now();

    // Periodically clean up old snapshots
    cleanupOldSnapshots();

    const previous = readSnapshot(snapshotPath);

    // Save current snapshot
    const current: SpeedSnapshot = {
      tokens: totalOutputTokens,
      timestamp: now,
    };
    writeSnapshot(snapshotPath, current);

    // If no previous snapshot exists, we can't calculate incremental speed
    if (!previous) {
      return 0;
    }

    const deltaTokens = totalOutputTokens - previous.tokens;
    const deltaTimeSeconds = (now - previous.timestamp) / 1000;

    // Guard against invalid values
    if (deltaTimeSeconds <= 0 || deltaTokens < 0) {
      return 0;
    }

    return deltaTokens / deltaTimeSeconds;
  } catch {
    return 0;
  }
}
