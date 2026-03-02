import { useState, useCallback } from 'react';

export interface LogEntry {
  id: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
  timestamp: string;
}

export function useConsole() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addLog = useCallback((type: LogEntry['type'], message: string) => {
    const entry: LogEntry = {
      id: Math.random().toString(36).slice(2),
      type,
      message,
      timestamp: new Date().toLocaleTimeString(),
    };
    setLogs(prev => [...prev, entry]);
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  return { logs, isRunning, setIsRunning, addLog, clearLogs };
}
