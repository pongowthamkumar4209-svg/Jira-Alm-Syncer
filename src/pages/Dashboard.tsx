import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { RefreshCw, History, Database, Shield, Activity } from 'lucide-react';

export default function Dashboard() {
  const { session } = useAuth();

  const cards = [
    { label: 'Jira URL',      value: session?.jiraUrl || '—',      color: '#555' },
    { label: 'ALM Host',      value: session?.almHost || '—',      color: '#555' },
    { label: 'ALM Project',   value: session?.almProject || '—',   color: '#e0e0e0' },
    { label: 'ALM Domain',    value: session?.almDomain || '—',    color: '#e0e0e0' },
    { label: 'Schema',        value: session?.schema || '—',       color: '#e03030' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-base font-bold" style={{ color: '#f0f0f0' }}>Sync Dashboard</h1>
          <p className="text-[10px] font-mono mt-0.5" style={{ color: '#555' }}>JIRA ↔ ALM REQUIREMENT SYNC PORTAL</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono" style={{ color: '#4ade80' }}>
          <span className="w-1.5 h-1.5 rounded-full inline-block animate-pulse" style={{ background: '#4ade80' }} />
          SESSION ACTIVE
        </div>
      </div>

      {/* Connection cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {cards.map(c => (
          <div key={c.label} className="rounded p-3 space-y-1" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
            <p className="text-[9px] font-mono uppercase tracking-wider" style={{ color: '#444' }}>{c.label}</p>
            <p className="text-xs font-mono font-semibold truncate" style={{ color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link to="/sync"
          className="rounded p-5 flex items-center gap-4 group transition-all"
          style={{ background: '#111', border: '1px solid #1e1e1e' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(200,0,0,0.35)'; (e.currentTarget as HTMLElement).style.background = 'rgba(200,0,0,0.07)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#1e1e1e'; (e.currentTarget as HTMLElement).style.background = '#111'; }}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(200,0,0,0.12)', border: '1px solid rgba(200,0,0,0.2)' }}>
            <RefreshCw className="h-5 w-5" style={{ color: '#e03030' }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#f0f0f0' }}>Run Sync</p>
            <p className="text-[10px] font-mono" style={{ color: '#555' }}>Jira → ALM requirement sync</p>
          </div>
        </Link>

        <Link to="/history"
          className="rounded p-5 flex items-center gap-4 group transition-all"
          style={{ background: '#111', border: '1px solid #1e1e1e' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(200,0,0,0.35)'; (e.currentTarget as HTMLElement).style.background = 'rgba(200,0,0,0.07)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#1e1e1e'; (e.currentTarget as HTMLElement).style.background = '#111'; }}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(200,0,0,0.12)', border: '1px solid rgba(200,0,0,0.2)' }}>
            <History className="h-5 w-5" style={{ color: '#e03030' }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#f0f0f0' }}>Sync History</p>
            <p className="text-[10px] font-mono" style={{ color: '#555' }}>View past execution results</p>
          </div>
        </Link>

        <div className="rounded p-5 flex items-center gap-4" style={{ background: '#0f0f0f', border: '1px solid #1a1a1a' }}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
            <Database className="h-5 w-5" style={{ color: '#444' }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#555' }}>DB Logging</p>
            <p className="text-[10px] font-mono" style={{ color: session?.dbHost ? '#4ade80' : '#555' }}>
              {session?.dbHost ? `● ${session.dbHost}` : '○ Not configured'}
            </p>
          </div>
        </div>
      </div>

      {/* Script params summary */}
      <div className="rounded p-4" style={{ background: '#0f0f0f', border: '1px solid #1a1a1a' }}>
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-3.5 w-3.5" style={{ color: '#e03030' }} />
          <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: '#555' }}>PowerShell Parameters Preview</p>
        </div>
        <pre className="text-[10px] font-mono leading-relaxed overflow-x-auto" style={{ color: '#444' }}>
{`.\Jira-ALMGeneric.ps1 \`
  -SSchema "${session?.schema || '<schema>'}" \`
  -Ttoken "${session?.jiraToken ? '***' : '<token>'}" \`
  -AAlmusername "${session?.almUsername || '<username>'}" \`
  -AAlmpassword "***" \`
  -DDomain "${session?.almDomain || '<domain>'}" \`
  -PProject "${session?.almProject || '<project>'}" \`
  -jiraUrl "${session?.jiraUrl || '<jiraUrl>'}" \`
  -almHost "${session?.almHost || '<almHost>'}"${session?.dbHost ? ` \`
  -DB_Host "${session.dbHost}" \`
  -DB_Name "${session.dbName}" \`
  -DBUserName "${session.dbUsername}" \`
  -DBPassword "***"` : ''}`}
        </pre>
      </div>

      {/* Watermark */}
      <div className="text-center pt-1">
        <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'rgba(200,0,0,0.3)' }}>
          ⚡ Owned &amp; Built by <span style={{ color: 'rgba(220,0,0,0.55)', fontWeight: 700 }}>Pongowtham</span>
        </p>
      </div>
    </div>
  );
}
