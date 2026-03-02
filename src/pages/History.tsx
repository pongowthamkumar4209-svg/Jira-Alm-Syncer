import { useState } from 'react';
import { Search, Filter } from 'lucide-react';

interface SyncLog {
  id: number;
  rtmId: string;
  almReqId: string;
  syncType: string;
  result: string;
  schema: string;
  name: string;
  reqType: string;
  status: string;
  warnings: string;
  errors: string;
  plannedRelease: string;
  dateTime: string;
}

const DEMO_LOGS: SyncLog[] = [
  { id: 1, rtmId: 'DEMO-001', almReqId: '1234', syncType: 'CREATE', result: 'Requirement has been created successfully', schema: 'PTC_DEMO', name: 'Feature: Auto-braking system', reqType: 'Feature', status: 'Approved', warnings: '', errors: '', plannedRelease: 'R2024.1', dateTime: '2025-01-20 10:32:14' },
  { id: 2, rtmId: 'DEMO-002', almReqId: '1235', syncType: 'UPDATE', result: 'Requirement Updated successfully', schema: 'PTC_DEMO', name: 'L1.001 Speed monitoring requirement', reqType: 'L1 Business Requirement', status: 'In Development', warnings: 'Warning: JIRA/ALM PTC Validation mismatch', errors: '', plannedRelease: 'R2024.2', dateTime: '2025-01-20 10:32:18' },
  { id: 3, rtmId: 'DEMO-003', almReqId: '0', syncType: 'BLOCK CREATE', result: 'Requirement is not Created', schema: 'PTC_DEMO', name: 'L2.002 GPS tracking', reqType: 'L2 Requirement', status: 'Draft', warnings: '', errors: 'OT/IT Program cannot be NULL', plannedRelease: 'TBD', dateTime: '2025-01-20 10:32:22' },
  { id: 4, rtmId: 'DEMO-004', almReqId: '1236', syncType: 'JIRA UPDATE', result: 'Requirement already exists in ALM, updated ID in JIRA', schema: 'PTC_DEMO', name: 'Feature: Collision detection', reqType: 'Feature', status: 'Done', warnings: 'Warning: RTM ID Already exists in ALM', errors: '', plannedRelease: '', dateTime: '2025-01-20 10:32:25' },
  { id: 5, rtmId: 'DEMO-005', almReqId: '1237', syncType: 'ORPHAN TRACE', result: 'Requirement Updated successfully', schema: 'PTC_DEMO', name: 'L1.003 Safety compliance check', reqType: 'L1 Business Requirement', status: 'Testing', warnings: 'Warning: requirement is orphan', errors: '', plannedRelease: 'TBD', dateTime: '2025-01-20 10:32:30' },
];

const syncTypeColors: Record<string, string> = {
  'CREATE':              '#4ade80',
  'UPDATE':              '#60a5fa',
  'JIRA UPDATE':         '#a78bfa',
  'BLOCK CREATE':        '#f87171',
  'BLOCK UPDATE':        '#f87171',
  'ORPHAN TRACE':        '#fbbf24',
  'WARNING UPDATE':      '#fbbf24',
  'UPDATE NAME':         '#60a5fa',
  'UPDATE PARENT TRACE': '#60a5fa',
  'BLOCK UNKNOWN':       '#f87171',
};

export default function History() {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [selected, setSelected] = useState<SyncLog | null>(null);

  const uniqueTypes = ['ALL', ...Array.from(new Set(DEMO_LOGS.map(l => l.syncType)))];

  const filtered = DEMO_LOGS.filter(l => {
    const matchSearch = !search || l.rtmId.toLowerCase().includes(search.toLowerCase()) || l.name.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'ALL' || l.syncType === filterType;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-base font-bold" style={{ color: '#f0f0f0' }}>Sync History</h1>
        <p className="text-[10px] font-mono mt-0.5" style={{ color: '#555' }}>JIRA → ALM SYNC EXECUTION LOG — JiraToAlmSyncLogs</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5" style={{ color: '#444' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search RTM ID or name..."
            className="w-full rounded pl-9 pr-3 py-2 text-xs font-mono focus:outline-none"
            style={{ background: '#111', border: '1px solid #222', color: '#e8e8e8' }}
            onFocus={e => (e.target.style.borderColor = 'rgba(200,0,0,0.4)')}
            onBlur={e  => (e.target.style.borderColor = '#222')} />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="h-3.5 w-3.5 shrink-0" style={{ color: '#444' }} />
          {uniqueTypes.map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className="rounded px-2.5 py-1.5 text-[10px] font-mono font-medium transition-all"
              style={{
                background: filterType === t ? 'rgba(200,0,0,0.15)' : 'transparent',
                border: filterType === t ? '1px solid rgba(200,0,0,0.35)' : '1px solid #222',
                color: filterType === t ? '#e03030' : '#555',
              }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded overflow-hidden" style={{ border: '1px solid #1e1e1e' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: '#0f0f0f', borderBottom: '1px solid #1e1e1e' }}>
                {['#', 'RTM ID', 'ALM Req ID', 'Sync Type', 'Req Type', 'Status', 'Planned Release', 'Date/Time', ''].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left font-mono text-[9px] uppercase tracking-wider" style={{ color: '#444' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((log, i) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #141414', background: i % 2 === 0 ? '#0d0d0d' : '#0f0f0f' }}
                  className="transition-colors"
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(200,0,0,0.05)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? '#0d0d0d' : '#0f0f0f')}>
                  <td className="px-3 py-2 font-mono" style={{ color: '#444' }}>{log.id}</td>
                  <td className="px-3 py-2 font-mono font-semibold" style={{ color: '#e03030' }}>{log.rtmId}</td>
                  <td className="px-3 py-2 font-mono" style={{ color: '#888' }}>{log.almReqId}</td>
                  <td className="px-3 py-2">
                    <span className="font-mono font-bold text-[10px]" style={{ color: syncTypeColors[log.syncType] || '#888' }}>
                      {log.syncType}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono" style={{ color: '#666' }}>{log.reqType}</td>
                  <td className="px-3 py-2 font-mono" style={{ color: '#666' }}>{log.status}</td>
                  <td className="px-3 py-2 font-mono" style={{ color: log.plannedRelease === 'TBD' ? '#fbbf24' : '#666' }}>{log.plannedRelease || '—'}</td>
                  <td className="px-3 py-2 font-mono text-[10px]" style={{ color: '#444' }}>{log.dateTime}</td>
                  <td className="px-3 py-2">
                    <button onClick={() => setSelected(log)} className="text-[10px] font-mono transition-colors px-2 py-0.5 rounded"
                      style={{ color: '#555', border: '1px solid #222' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#e03030'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(200,0,0,0.3)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#555'; (e.currentTarget as HTMLElement).style.borderColor = '#222'; }}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-10 font-mono text-xs" style={{ color: '#333' }}>No results found</div>
        )}
      </div>

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }} onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg rounded-xl p-5 space-y-3" style={{ background: '#111', border: '1px solid #2a2a2a' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold" style={{ color: '#f0f0f0' }}>{selected.rtmId}</p>
                <span className="text-[10px] font-mono font-bold" style={{ color: syncTypeColors[selected.syncType] || '#888' }}>{selected.syncType}</span>
              </div>
              <button onClick={() => setSelected(null)} className="text-xs font-mono" style={{ color: '#555' }}>✕ Close</button>
            </div>
            <div className="space-y-2 text-xs">
              {[
                ['Name', selected.name],
                ['ALM Req ID', selected.almReqId],
                ['Requirement Type', selected.reqType],
                ['Status', selected.status],
                ['Schema', selected.schema],
                ['Planned Release', selected.plannedRelease || '—'],
                ['Result', selected.result],
                ['Warnings', selected.warnings || '—'],
                ['Errors', selected.errors || '—'],
                ['DateTime', selected.dateTime],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-3">
                  <span className="shrink-0 w-32 font-mono text-[10px] uppercase" style={{ color: '#555' }}>{label}</span>
                  <span className="font-mono" style={{ color: value === '—' ? '#333' : '#aaa' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
