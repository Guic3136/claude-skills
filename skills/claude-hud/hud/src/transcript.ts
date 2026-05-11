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

let taskCache: { tasks: TaskInfo[]; timestamp: number } | null = null;
const CACHE_TTL = 1000;

export async function readTasksFromSystem(): Promise<TaskInfo[]> {
  if (taskCache && (Date.now() - taskCache.timestamp) < CACHE_TTL) {
    return taskCache.tasks;
  }

  const tasks: TaskInfo[] = [];
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
          continue;
        }
      }
    } catch (error) {
      if (process.env.HUD_DEBUG) {
        console.error('Error reading tasks:', error);
      }
    }
  }

  taskCache = { tasks, timestamp: Date.now() };
  return tasks;
}

export function calculateTaskProgress(tasks: TaskInfo[]): TaskProgress {
  return {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    pending: tasks.filter(t => t.status === 'pending').length
  };
}

function parseEventLine(line: string): AgentEvent | null {
  try {
    const data = JSON.parse(line);

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

let agentCache: { events: AgentEvent[]; timestamp: number } | null = null;
const AGENT_CACHE_TTL = 500;

export async function parseHistoryFile(filePath?: string): Promise<AgentEvent[]> {
  const historyPath = filePath || path.join(homedir(), '.claude', 'history.jsonl');

  if (!fs.existsSync(historyPath)) {
    return [];
  }

  if (agentCache && (Date.now() - agentCache.timestamp) < AGENT_CACHE_TTL) {
    return agentCache.events;
  }

  const events: AgentEvent[] = [];

  try {
    const content = fs.readFileSync(historyPath, 'utf8');
    const lines = content.split('\n');
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

  agentCache = { events, timestamp: Date.now() };
  return events;
}

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
      runningAgents.delete(event.agentName);
    }
  }

  return Array.from(runningAgents.values());
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
