import { execSync } from 'child_process';
import * as path from 'path';
import * as os from 'os';

export interface GitStatus {
  branch: string;
  isGitRepo: boolean;
  isClean: boolean;
  modifiedCount: number;
  addedCount: number;
  deletedCount: number;
}

/**
 * 获取当前目录的 Git 分支名
 */
export function getGitBranch(cwd: string = process.cwd()): string | null {
  try {
    const result = execSync('git branch --show-current', {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return result.trim() || null;
  } catch {
    return null;
  }
}

/**
 * 获取 Git 仓库状态
 */
export function getGitStatus(cwd: string = process.cwd()): GitStatus {
  const branch = getGitBranch(cwd);

  if (!branch) {
    return {
      branch: '',
      isGitRepo: false,
      isClean: true,
      modifiedCount: 0,
      addedCount: 0,
      deletedCount: 0
    };
  }

  try {
    const result = execSync('git status --porcelain', {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const lines = result.trim().split('\n').filter(line => line.length > 0);

    let modifiedCount = 0;
    let addedCount = 0;
    let deletedCount = 0;

    for (const line of lines) {
      const status = line.substring(0, 2);
      // Xy 格式，X 是 staging 状态，y 是 working tree 状态
      if (status.includes('M')) modifiedCount++;
      if (status.includes('A')) addedCount++;
      if (status.includes('D')) deletedCount++;
    }

    return {
      branch,
      isGitRepo: true,
      isClean: lines.length === 0,
      modifiedCount,
      addedCount,
      deletedCount
    };
  } catch {
    return {
      branch,
      isGitRepo: true,
      isClean: true,
      modifiedCount: 0,
      addedCount: 0,
      deletedCount: 0
    };
  }
}

/**
 * 格式化 Git 状态为字符串
 */
export function formatGitStatus(status: GitStatus): string {
  if (!status.isGitRepo) {
    return '';
  }

  let result = `(${status.branch})`;

  if (!status.isClean) {
    const changes: string[] = [];
    if (status.addedCount > 0) changes.push(`+${status.addedCount}`);
    if (status.modifiedCount > 0) changes.push(`~${status.modifiedCount}`);
    if (status.deletedCount > 0) changes.push(`-${status.deletedCount}`);
    result += ` [${changes.join(' ')}]`;
  } else {
    result += ' [✓]';
  }

  return result;
}

/**
 * 获取当前工作目录的短路径
 */
export function getShortPath(cwd: string = process.cwd(), maxLength: number = 30): string {
  const home = os.homedir();

  // 将 home 路径替换为 ~
  let shortPath = cwd;
  if (cwd.startsWith(home)) {
    shortPath = '~' + cwd.substring(home.length);
  }

  // 如果路径太长，截断中间部分
  if (shortPath.length > maxLength) {
    const parts = shortPath.split('/');
    if (parts.length > 3) {
      shortPath = `${parts[0]}/.../${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
    }
  }

  return shortPath;
}
