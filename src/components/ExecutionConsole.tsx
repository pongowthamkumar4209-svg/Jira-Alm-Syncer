import { useRef, useEffect } from 'react';
import { Trash2, Terminal } from 'lucide-react';
import type { LogEntry } from '@/hooks/useConsole';

const colors: Record<LogEntry['type'], string> = {
  info:    '#888',
  success: '#4ade80',
  error:   '#f87171',
  warning: '#fbbf24',
};

const prefixes: Record<LogEntry['type'], string> = {
  info:    '›',
  success: '✓',
  error:   '✗',
  warning: '⚠',
};

export function ExecutionConsole({ logs, isRunning, onClear }: {
  logs: LogEntry[];
  isRunning: boolean;
  onClear: () => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="rounded" style={{ background: '#0a0a0a', border: '1px solid #1e1e1e' }}>
      <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid #1a1a1a' }}>
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5" style={{ color: isRunning ? '#e03030' : '#555' }} />
          <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: '#555' }}>
            Execution Console
          </span>
          {isRunning && (
            <span className="text-[10px] font-mono animate-pulse" style={{ color: '#e03030' }}>
              ● RUNNING
            </span>
          )}
        </div>
        <button onClick={onClear} style={{ color: '#444' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#e03030')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#444')}>
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="h-48 overflow-auto p-3 font-mono-console space-y-0.5">
        {logs.length === 0 ? (
          <p className="text-xs italic" style={{ color: '#333' }}>Awaiting execution...</p>
        ) : (
          logs.map(log => (
            <div key={log.id} className="flex items-start gap-2 text-xs">
              <span style={{ color: '#444' }} className="shrink-0">{log.timestamp}</span>
              <span style={{ color: colors[log.type] }} className="shrink-0">{prefixes[log.type]}</span>
              <span style={{ color: log.type === 'info' ? '#aaa' : colors[log.type] }}>{log.message}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
