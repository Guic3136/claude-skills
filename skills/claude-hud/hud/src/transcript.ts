import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';

export interface AgentEvent {
  type: 'agent_start' | 'agent_stop';
  agentName: string;
  timestamp: string;
  sessionId?: string;
}

export interface AgentStatus {
  name: string;
  startTime: string;
  sessionId?: string;
}

export interface TaskProgress {
  completed: number;
  total: number;
  inProgress?: number;
  pending?: number;
}

export interface TaskInfo {
  id: string;
  subject: string;
  status: 'pending' | 'in_progress' | 'completed';
  owner?: string;
}

// 缓存机制，减少重复文件读取
let taskCache: { tasks: TaskInfo[]; timestamp: number } | null = null;
const CACHE_TTL = 1000; // 1秒缓存

/**
 * 从 task 系统获取任务列表
 * 尝试从多个可能的来源读取任务数据
 */
export async function readTasksFromSystem(): Promise<TaskInfo[]> {
  // 检查缓存
  if (taskCache && (Date.now() - taskCache.timestamp) < CACHE_TTL) {
    return taskCache.tasks;
  }

  const tasks: TaskInfo[] = [];

  // 尝试从 tasks.jsonl 文件读取
  const tasksPath = path.join(homedir(), '.claude', 'tasks.jsonl');
  if (fs.existsSync(tasksPath)) {
    try {
      const content = fs.readFileSync(tasksPath, 'utf8');
      const lines = content.split('\n');

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        try {
          const data = JSON.parse(trimmedLine);
          if (data.type === 'task' && data.data) {
            tasks.push({
              id: data.data.id || String(tasks.length + 1),
              subject: data.data.subject || 'Unknown Task',
              status: data.data.status || 'pending',
              owner: data.data.owner
            });
          }
        } catch {
          // 忽略解析失败的行
          continue;
        }
      }
    } catch (error) {
      // 读取失败时静默处理
      if (process.env.HUD_DEBUG) {
        console.error('Error reading tasks:', error);
      }
    }
  }

  // 更新缓存
  taskCache = { tasks, timestamp: Date.now() };
  return tasks;
}

/**
 * 计算任务进度统计
 */
export function calculateTaskProgress(tasks: TaskInfo[]): TaskProgress {
  return {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    pending: tasks.filter(t => t.status === 'pending').length
  };
}

/**
 * 解析单行 JSON 事件
 */
function parseEventLine(line: string): AgentEvent | null {
  try {
    const data = JSON.parse(line);

    // 检查是否是 agent 事件
    if (data.type === 'agent_start' || data.type === 'agent_stop') {
      return {
        type: data.type,
        agentName: data.agent_name || data.agentName || 'unknown',
        timestamp: data.timestamp || new Date().toISOString(),
        sessionId: data.session_id || data.sessionId
      };
    }

    return null;
  } catch (error) {
    return null;
  }
}

// Agent 事件缓存
let agentCache: { events: AgentEvent[]; timestamp: number } | null = null;
const AGENT_CACHE_TTL = 500; // 500ms 缓存

/**
 * 读取 history.jsonl 文件并解析 Agent 事件
 */
export async function parseHistoryFile(filePath?: string): Promise<AgentEvent[]> {
  const historyPath = filePath || path.join(homedir(), '.claude', 'history.jsonl');

  // 如果文件不存在，返回空数组
  if (!fs.existsSync(historyPath)) {
    return [];
  }

  // 检查缓存
  if (agentCache && (Date.now() - agentCache.timestamp) < AGENT_CACHE_TTL) {
    return agentCache.events;
  }

  const events: AgentEvent[] = [];

  try {
    // 使用同步读取以提高性能（文件通常很小）
    const content = fs.readFileSync(historyPath, 'utf8');
    const lines = content.split('\n');

    // 只读取最后 100 行以提高性能
    const recentLines = lines.slice(-100);

    for (const line of recentLines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      const event = parseEventLine(trimmedLine);
      if (event) {
        events.push(event);
      }
    }
  } catch (error) {
    if (process.env.HUD_DEBUG) {
      console.error('Error reading history:', error);
    }
    return [];
  }

  // 更新缓存
  agentCache = { events, timestamp: Date.now() };
  return events;
}

/**
 * 获取当前正在运行的 Agent 列表
 * 通过匹配 agent_start 和 agent_stop 事件对来计算
 */
export function getRunningAgents(events: AgentEvent[]): AgentStatus[] {
  const runningAgents = new Map<string, AgentStatus>();

  for (const event of events) {
    if (event.type === 'agent_start') {
      runningAgents.set(event.agentName, {
        name: event.agentName,
        startTime: event.timestamp,
        sessionId: event.sessionId
      });
    } else if (event.type === 'agent_stop') {
      // 移除已停止的 agent
      runningAgents.delete(event.agentName);
    }
  }

  return Array.from(runningAgents.values());
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
