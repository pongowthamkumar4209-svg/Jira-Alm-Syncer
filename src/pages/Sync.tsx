import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ExecutionConsole } from '@/components/ExecutionConsole';
import { useConsole } from '@/hooks/useConsole';
import { Field } from '@/components/Field';
import { Loader2, RefreshCw, ChevronDown, ChevronUp, Wifi, WifiOff, FlaskConical } from 'lucide-react';

const BACKEND_URL = 'http://localhost:5000';

const DEMO_LOGS: { type: 'info' | 'success' | 'error' | 'warning'; message: string; delay: number }[] = [
  { type: 'info',    message: 'Starting Jira → ALM sync...', delay: 200 },
  { type: 'info',    message: 'Authenticating to Jira with Bearer Token...', delay: 600 },
  { type: 'success', message: 'Jira authentication successful', delay: 400 },
  { type: 'info',    message: 'Fetching issues via JQL: (filter in (36582) OR filter in (36567)) AND "ALM Schema Name" = "PTC_DEMO_SCHEMA"', delay: 700 },
  { type: 'success', message: 'Retrieved 12 issues from Jira', delay: 800 },
  { type: 'info',    message: 'Authenticating to ALM host: mfalm.demo.com...', delay: 500 },
  { type: 'success', message: 'ALM session established successfully', delay: 400 },
  { type: 'info',    message: 'Processing requirement DEMO-001 [Feature]...', delay: 600 },
  { type: 'success', message: 'CREATE — DEMO-001: New requirement created in ALM (ID: 3421)', delay: 400 },
  { type: 'info',    message: 'Processing requirement DEMO-002 [L1 Business Requirement]...', delay: 500 },
  { type: 'success', message: 'UPDATE — DEMO-002: Requirement updated successfully (ID: 3198)', delay: 400 },
  { type: 'info',    message: 'Processing requirement DEMO-003 [L2 Requirement]...', delay: 500 },
  { type: 'success', message: 'JIRA UPDATE — DEMO-003: ALM Req ID 3199 written back to Jira', delay: 400 },
  { type: 'info',    message: 'Processing requirement DEMO-004 [L1 Business Requirement]...', delay: 500 },
  { type: 'warning', message: 'ORPHAN TRACE — DEMO-004: No parent requirement found in ALM', delay: 400 },
  { type: 'info',    message: 'Processing requirement DEMO-005 [L2 Requirement]...', delay: 500 },
  { type: 'warning', message: 'WARNING UPDATE — DEMO-005: JIRA/ALM PTC Validation Method mismatch. ALM value overrides JIRA value.', delay: 400 },
  { type: 'info',    message: 'Processing requirement DEMO-006 [Feature]...', delay: 500 },
  { type: 'success', message: 'UPDATE NAME — DEMO-006: Name change detected and updated in ALM', delay: 400 },
  { type: 'info',    message: 'Processing requirement DEMO-007 [L2 Requirement]...', delay: 500 },
  { type: 'error',   message: 'BLOCK CREATE — DEMO-007: OT/IT Program cannot be a NULL value', delay: 400 },
  { type: 'info',    message: 'Processing requirement DEMO-008 [L1 Business Requirement]...', delay: 500 },
  { type: 'success', message: 'CREATE — DEMO-008: New requirement created in ALM (ID: 3422)', delay: 400 },
  { type: 'info',    message: 'Processing requirement DEMO-009 [L2 Requirement]...', delay: 500 },
  { type: 'success', message: 'UPDATE — DEMO-009: Requirement updated successfully (ID: 3200)', delay: 400 },
  { type: 'info',    message: 'Processing requirement DEMO-010 [Feature]...', delay: 500 },
  { type: 'success', message: 'UPDATE PARENT TRACE — DEMO-010: Parent trace refreshed successfully', delay: 400 },
  { type: 'info',    message: 'Processing requirement DEMO-011 [L1 Business Requirement]...', delay: 500 },
  { type: 'warning', message: 'WARNING UPDATE — DEMO-011: Name Truncated to 255 characters', delay: 400 },
  { type: 'info',    message: 'Processing requirement DEMO-012 [L2 Requirement]...', delay: 500 },
  { type: 'success', message: 'CREATE — DEMO-012: New requirement created in ALM (ID: 3423)', delay: 400 },
  { type: 'info',    message: 'Writing 12 results to database JiraToAlmSyncLogs...', delay: 700 },
  { type: 'success', message: 'Database write complete', delay: 400 },
  { type: 'success', message: '✓ Sync completed — Duration: 0h 0m 18s 342ms', delay: 300 },
];

export default function Sync() {
  const { session } = useAuth();
  const { logs, isRunning, setIsRunning, addLog, clearLogs } = useConsole();

  const [schema,      setSchema]      = useState(session?.schema || '');
  const [jiraUrl,     setJiraUrl]     = useState(session?.jiraUrl || '');
  const [jiraToken,   setJiraToken]   = useState(session?.jiraToken || '');
  const [almHost,     setAlmHost]     = useState(session?.almHost || '');
  const [almUsername, setAlmUsername] = useState(session?.almUsername || '');
  const [almPassword, setAlmPassword] = useState(session?.almPassword || '');
  const [almDomain,   setAlmDomain]   = useState(session?.almDomain || '');
  const [almProject,  setAlmProject]  = useState(session?.almProject || '');
  const [dbHost,      setDbHost]      = useState(session?.dbHost || '');
  const [dbName,      setDbName]      = useState(session?.dbName || '');
  const [dbUsername,  setDbUsername]  = useState(session?.dbUsername || '');
  const [dbPassword,  setDbPassword]  = useState(session?.dbPassword || '');

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [mode, setMode] = useState<'demo' | 'live'>('demo');

  const [result, setResult] = useState<{
    created: number; updated: number; jiraUpdated: number;
    blocked: number; duration: string; tbd: number;
  } | null>(null);

  useEffect(() => {
    checkBackend();
  }, []);

  const checkBackend = async () => {
    setBackendStatus('checking');
    try {
      const res = await fetch(`${BACKEND_URL}/api/health`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        setBackendStatus('online');
        setMode('live'); // Auto-switch to live if backend is available
      } else {
        setBackendStatus('offline');
      }
    } catch {
      setBackendStatus('offline');
    }
  };

  const runDemo = async () => {
    clearLogs();
    setResult(null);
    setIsRunning(true);
    addLog('info', `[DEMO MODE] Simulating sync for schema: ${schema || 'PTC_DEMO_SCHEMA'}`);
    addLog('info', `[DEMO MODE] Jira: ${jiraUrl || 'https://jira.demo.com'}  |  ALM: ${almHost || 'mfalm.demo.com'}  |  ${almDomain || 'DEFAULT'}\\${almProject || 'ALM_Demo'}`);

    for (const log of DEMO_LOGS) {
      await new Promise(r => setTimeout(r, log.delay));
      addLog(log.type, log.message);
    }

    setResult({ created: 3, updated: 3, jiraUpdated: 1, blocked: 1, tbd: 1, duration: '0h 0m 18s 342ms' });
    setIsRunning(false);
  };

  const runLive = async () => {
    if (!schema || !jiraUrl || !jiraToken || !almHost || !almUsername || !almDomain || !almProject) {
      addLog('error', 'Missing required fields. Please fill all connection parameters.');
      return;
    }
    clearLogs();
    setResult(null);
    setIsRunning(true);
    addLog('info', `Starting Jira → ALM sync for schema: ${schema}`);
    addLog('info', `Jira: ${jiraUrl}  |  ALM: ${almHost}  |  ${almDomain}\\${almProject}`);

    let created = 0, updated = 0, jiraUpdated = 0, blocked = 0, tbd = 0, duration = '';

    try {
      const response = await fetch(`${BACKEND_URL}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schema, jiraUrl, jiraToken, almHost, almUsername, almPassword, almDomain, almProject, dbHost, dbName, dbUsername, dbPassword }),
      });

      if (!response.ok) {
        const err = await response.json();
        addLog('error', err.error || 'Backend returned an error.');
        setIsRunning(false);
        return;
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const payload = JSON.parse(line.slice(6));
              if (payload.type && payload.message) {
                addLog(payload.type, payload.message);
                const msg = payload.message;
                if (/\bCREATE\b/.test(msg) && !/BLOCK/.test(msg)) created++;
                if (/\bUPDATE\b/.test(msg) && !/BLOCK|NAME|PARENT/.test(msg)) updated++;
                if (/JIRA UPDATE/.test(msg)) jiraUpdated++;
                if (/BLOCK/.test(msg)) blocked++;
                if (/TBD/.test(msg)) tbd++;
                const m = msg.match(/"Duration"\s*:\s*"([^"]+)"/);
                if (m) duration = m[1];
              } else if (payload.exitCode !== undefined) {
                addLog(payload.exitCode === 0 ? 'success' : 'error',
                  payload.exitCode === 0 ? `✓ Sync completed — Exit code: 0` : `Script exited with code ${payload.exitCode}`);
              }
            } catch { /* skip */ }
          }
        }
      }
      setResult({ created, updated, jiraUpdated, blocked, tbd, duration: duration || 'N/A' });
    } catch (err: any) {
      addLog('error', `Connection error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSync = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'demo') runDemo();
    else runLive();
  };

  const syncTypes = [
    { label: 'CREATE',              color: '#4ade80', desc: 'New requirement created in ALM' },
    { label: 'UPDATE',              color: '#60a5fa', desc: 'Existing requirement updated' },
    { label: 'JIRA UPDATE',         color: '#a78bfa', desc: 'ALM Req ID written back to Jira' },
    { label: 'BLOCK CREATE',        color: '#f87171', desc: 'Creation blocked due to error' },
    { label: 'BLOCK UPDATE',        color: '#f87171', desc: 'Update blocked due to error' },
    { label: 'ORPHAN TRACE',        color: '#fbbf24', desc: 'No parent requirement found' },
    { label: 'WARNING UPDATE',      color: '#fbbf24', desc: 'Updated with warnings' },
    { label: 'UPDATE NAME',         color: '#60a5fa', desc: 'JIRA name change detected' },
    { label: 'UPDATE PARENT TRACE', color: '#60a5fa', desc: 'Parent trace updated' },
    { label: 'BLOCK UNKNOWN',       color: '#f87171', desc: 'Invalid ALM Req ID' },
  ];

  return (
    <div className="space-y-4 max-w-4xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-base font-bold" style={{ color: '#f0f0f0' }}>Jira → ALM Sync</h1>
          <p className="text-[10px] font-mono mt-0.5" style={{ color: '#555' }}>
            EXECUTES: Jira-ALMGeneric.ps1 via local backend
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode toggle */}
          <div className="flex rounded overflow-hidden" style={{ border: '1px solid #222' }}>
            <button type="button" onClick={() => setMode('demo')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-medium transition-all"
              style={{
                background: mode === 'demo' ? 'rgba(251,191,36,0.12)' : 'transparent',
                color: mode === 'demo' ? '#fbbf24' : '#555',
                borderRight: '1px solid #222',
              }}>
              <FlaskConical className="h-3 w-3" /> DEMO
            </button>
            <button type="button" onClick={() => { setMode('live'); checkBackend(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-medium transition-all"
              style={{
                background: mode === 'live' ? 'rgba(74,222,128,0.08)' : 'transparent',
                color: mode === 'live' ? '#4ade80' : '#555',
              }}>
              <Wifi className="h-3 w-3" /> LIVE
            </button>
          </div>

          {/* Backend status — only show in live mode */}
          {mode === 'live' && (
            <button onClick={checkBackend} title="Re-check backend"
              className="rounded px-3 py-1.5 flex items-center gap-1.5 text-[10px] font-mono transition-all"
              style={{
                background: backendStatus === 'online' ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)',
                border: backendStatus === 'online' ? '1px solid rgba(74,222,128,0.25)' : '1px solid rgba(248,113,113,0.25)',
                color: backendStatus === 'online' ? '#4ade80' : backendStatus === 'offline' ? '#f87171' : '#888',
              }}>
              {backendStatus === 'online'
                ? <><Wifi className="h-3 w-3" /> BACKEND ONLINE</>
                : backendStatus === 'offline'
                ? <><WifiOff className="h-3 w-3" /> BACKEND OFFLINE</>
                : <><Loader2 className="h-3 w-3 animate-spin" /> CHECKING...</>}
            </button>
          )}
        </div>
      </div>

      {/* Demo mode banner */}
      {mode === 'demo' && (
        <div className="rounded p-3 flex items-start gap-3"
          style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.2)' }}>
          <FlaskConical className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#fbbf24' }} />
          <div>
            <p className="text-xs font-semibold" style={{ color: '#fbbf24' }}>Demo Mode — No backend required</p>
            <p className="text-[10px] font-mono mt-0.5" style={{ color: '#777' }}>
              Simulates a real sync with realistic log output. Switch to <span style={{ color: '#4ade80' }}>LIVE</span> mode and run <span style={{ color: '#fbbf24' }}>start.bat</span> to execute against real Jira & ALM.
            </p>
          </div>
        </div>
      )}

      {/* Live offline warning */}
      {mode === 'live' && backendStatus === 'offline' && (
        <div className="rounded p-3 flex items-start gap-3"
          style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)' }}>
          <WifiOff className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#f87171' }} />
          <div>
            <p className="text-xs font-semibold" style={{ color: '#f87171' }}>Backend server is not running</p>
            <p className="text-[10px] font-mono mt-0.5" style={{ color: '#777' }}>
              Double-click <span style={{ color: '#fbbf24' }}>start.bat</span> in your jira-alm folder, then click the status pill to recheck.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSync} className="space-y-3">

        {/* Core params */}
        <div className="rounded p-4 space-y-3" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
          <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: '#555' }}>Core Parameters</p>
          <Field label="ALM Schema Name  (-SSchema)" value={schema} onChange={setSchema}
            placeholder="PTC_CB945021_PTC_SCHEMA" required={mode === 'live'} hint="Used in JQL filter" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Jira URL  (-jiraUrl)" value={jiraUrl} onChange={setJiraUrl} placeholder="https://jira.domain.com" required={mode === 'live'} />
            <Field label="Jira Bearer Token  (-Ttoken)" value={jiraToken} onChange={setJiraToken} type="password" placeholder="eyJhbGci..." required={mode === 'live'} />
          </div>
        </div>

        {/* ALM params */}
        <div className="rounded p-4 space-y-3" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
          <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: '#555' }}>ALM Connection</p>
          <Field label="ALM Host  (-almHost)" value={almHost} onChange={setAlmHost} placeholder="mfalm.domain.com" required={mode === 'live'} hint="No https://" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="ALM Username  (-AAlmusername)" value={almUsername} onChange={setAlmUsername} placeholder="domain\\user" required={mode === 'live'} />
            <Field label="ALM Password  (-AAlmpassword)" value={almPassword} onChange={setAlmPassword} type="password" placeholder="••••••••" required={mode === 'live'} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Domain  (-DDomain)" value={almDomain} onChange={setAlmDomain} placeholder="DEFAULT" required={mode === 'live'} />
            <Field label="Project  (-PProject)" value={almProject} onChange={setAlmProject} placeholder="ALM_Project_001" required={mode === 'live'} />
          </div>
        </div>

        {/* DB params */}
        <div className="rounded overflow-hidden" style={{ border: '1px solid #1e1e1e' }}>
          <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between px-4 py-3"
            style={{ background: showAdvanced ? '#141414' : '#111', color: '#555' }}>
            <span className="text-[10px] font-mono uppercase tracking-widest">
              Database Logging  (-DB_Host, -DB_Name...)
              <span className="ml-2 normal-case" style={{ color: '#333' }}>— Optional</span>
            </span>
            {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          {showAdvanced && (
            <div className="p-4 space-y-3" style={{ background: '#0f0f0f', borderTop: '1px solid #1a1a1a' }}>
              <div className="grid grid-cols-2 gap-3">
                <Field label="DB Host  (-DB_Host)" value={dbHost} onChange={setDbHost} placeholder="sql-server.domain.com" />
                <Field label="DB Name  (-DB_Name)" value={dbName} onChange={setDbName} placeholder="JiraALMSyncLogs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="DB Username  (-DBUserName)" value={dbUsername} onChange={setDbUsername} placeholder="sa" />
                <Field label="DB Password  (-DBPassword)" value={dbPassword} onChange={setDbPassword} type="password" placeholder="••••••••" />
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <button type="submit" disabled={isRunning || (mode === 'live' && backendStatus !== 'online')}
          className="flex items-center gap-2 px-6 py-2.5 rounded text-xs font-bold transition-all disabled:opacity-40"
          style={{
            background: mode === 'demo'
              ? 'linear-gradient(135deg, #b45309, #78350f)'
              : 'linear-gradient(135deg, #cc0000, #990000)',
            color: '#fff',
            boxShadow: isRunning ? 'none' : mode === 'demo' ? '0 0 18px rgba(180,83,9,0.3)' : '0 0 18px rgba(200,0,0,0.3)',
          }}>
          {isRunning
            ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {mode === 'demo' ? 'SIMULATING...' : 'SYNCING...'}</>
            : mode === 'demo'
            ? <><FlaskConical className="h-3.5 w-3.5" /> RUN DEMO SYNC</>
            : <><RefreshCw className="h-3.5 w-3.5" /> EXECUTE SYNC</>}
        </button>
      </form>

      {/* Console */}
      <ExecutionConsole logs={logs} isRunning={isRunning} onClear={clearLogs} />

      {/* Result summary */}
      {result && (
        <div className="rounded p-4 space-y-3" style={{ background: '#0f0f0f', border: '1px solid rgba(200,0,0,0.2)' }}>
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: '#e03030' }}>Sync Summary</p>
            {mode === 'demo' && (
              <span className="text-[9px] font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>
                DEMO DATA
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { label: 'Created',      value: result.created,     color: '#4ade80' },
              { label: 'Updated',      value: result.updated,     color: '#60a5fa' },
              { label: 'Jira Updated', value: result.jiraUpdated, color: '#a78bfa' },
              { label: 'Blocked',      value: result.blocked,     color: '#f87171' },
              { label: 'TBD Release',  value: result.tbd,         color: '#fbbf24' },
            ].map(s => (
              <div key={s.label} className="rounded p-2.5 text-center" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
                <p className="text-xl font-mono font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[9px] font-mono uppercase" style={{ color: '#555' }}>{s.label}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] font-mono" style={{ color: '#444' }}>Duration: {result.duration}</p>
        </div>
      )}

      {/* Sync type legend */}
      <div className="rounded p-4" style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}>
        <p className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: '#444' }}>Sync Type Reference</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {syncTypes.map(s => (
            <div key={s.label} className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold shrink-0 w-40" style={{ color: s.color }}>{s.label}</span>
              <span className="text-[10px]" style={{ color: '#444' }}>{s.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
