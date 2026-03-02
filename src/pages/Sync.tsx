import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ExecutionConsole } from '@/components/ExecutionConsole';
import { useConsole } from '@/hooks/useConsole';
import { Field } from '@/components/Field';
import { Loader2, RefreshCw, ChevronDown, ChevronUp, Wifi, WifiOff } from 'lucide-react';

const BACKEND_URL = 'http://localhost:5000';

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

  const [result, setResult] = useState<{
    created: number; updated: number; jiraUpdated: number;
    blocked: number; duration: string; tbd: number;
  } | null>(null);

  // Check backend health on mount
  useEffect(() => {
    checkBackend();
  }, []);

  const checkBackend = async () => {
    setBackendStatus('checking');
    try {
      const res = await fetch(`${BACKEND_URL}/api/health`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        setBackendStatus('online');
        if (!data.script_exists) {
          addLog('warning', `Backend online but script not found at: ${data.script_path}`);
          addLog('warning', 'Place Jira-ALMGeneric.ps1 in the root of the jira-alm folder.');
        }
      } else {
        setBackendStatus('offline');
      }
    } catch {
      setBackendStatus('offline');
    }
  };

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();

    if (backendStatus !== 'online') {
      addLog('error', 'Backend is offline. Please run start.bat on your Windows machine first.');
      return;
    }

    if (!schema || !jiraUrl || !jiraToken || !almHost || !almUsername || !almDomain || !almProject) {
      addLog('error', 'Missing required fields. Please fill all connection parameters.');
      return;
    }

    clearLogs();
    setResult(null);
    setIsRunning(true);

    addLog('info', `Starting Jira → ALM sync for schema: ${schema}`);
    addLog('info', `Jira: ${jiraUrl}  |  ALM: ${almHost}  |  ${almDomain}\\${almProject}`);

    const body = {
      schema, jiraUrl, jiraToken,
      almHost, almUsername, almPassword, almDomain, almProject,
      dbHost, dbName, dbUsername, dbPassword,
    };

    // Track counts from streamed output
    let created = 0, updated = 0, jiraUpdated = 0, blocked = 0, tbd = 0;
    let duration = '';
    let finalJson = '';

    try {
      const response = await fetch(`${BACKEND_URL}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.json();
        addLog('error', err.error || 'Backend returned an error.');
        setIsRunning(false);
        return;
      }

      // Read the SSE stream
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
          if (line.startsWith('event: ')) {
            // event type captured in next data line
          } else if (line.startsWith('data: ')) {
            try {
              const payload = JSON.parse(line.slice(6));

              if (payload.type && payload.message) {
                // Log line from PowerShell stdout
                addLog(payload.type, payload.message);

                // Count sync types from output
                const msg = payload.message;
                if (/\bCREATE\b/.test(msg) && !/BLOCK/.test(msg)) created++;
                if (/\bUPDATE\b/.test(msg) && !/BLOCK/.test(msg) && !/NAME/.test(msg) && !/PARENT/.test(msg)) updated++;
                if (/JIRA UPDATE/.test(msg)) jiraUpdated++;
                if (/BLOCK/.test(msg)) blocked++;
                if (/TBD/.test(msg)) tbd++;

                // Try to capture duration from the PS1 JSON output
                if (msg.includes('"Duration"')) {
                  try {
                    const match = msg.match(/"Duration"\s*:\s*"([^"]+)"/);
                    if (match) duration = match[1];
                  } catch { /* ignore */ }
                }

              } else if (payload.exitCode !== undefined) {
                // Final done event
                if (payload.exitCode === 0) {
                  addLog('success', `✓ Sync completed — Exit code: ${payload.exitCode}`);
                } else {
                  addLog('error', `Script exited with code ${payload.exitCode}`);
                }
              } else if (payload.message && !payload.type) {
                addLog('info', payload.message);
              }

            } catch { /* not JSON, skip */ }
          }
        }
      }

      setResult({ created, updated, jiraUpdated, blocked, tbd, duration: duration || 'N/A' });

    } catch (err: any) {
      if (err.name === 'AbortError') {
        addLog('warning', 'Sync was cancelled.');
      } else {
        addLog('error', `Connection error: ${err.message}`);
        addLog('error', 'Make sure start.bat is running on your Windows machine.');
      }
    } finally {
      setIsRunning(false);
    }
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

      {/* Header + backend status */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-base font-bold" style={{ color: '#f0f0f0' }}>Jira → ALM Sync</h1>
          <p className="text-[10px] font-mono mt-0.5" style={{ color: '#555' }}>
            EXECUTES: Jira-ALMGeneric.ps1 via local backend
          </p>
        </div>

        {/* Backend status pill */}
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={checkBackend} title="Re-check backend"
            className="rounded px-3 py-1.5 flex items-center gap-2 text-[10px] font-mono transition-all"
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
        </div>
      </div>

      {/* Offline warning banner */}
      {backendStatus === 'offline' && (
        <div className="rounded p-3 flex items-start gap-3"
          style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)' }}>
          <WifiOff className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#f87171' }} />
          <div className="space-y-1">
            <p className="text-xs font-semibold" style={{ color: '#f87171' }}>Backend server is not running</p>
            <p className="text-[10px] font-mono" style={{ color: '#777' }}>
              Double-click <span style={{ color: '#fbbf24' }}>start.bat</span> in your jira-alm folder to start the backend, then click the status pill above to recheck.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSync} className="space-y-3">

        {/* Core params */}
        <div className="rounded p-4 space-y-3" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
          <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: '#555' }}>Core Parameters</p>
          <Field label="ALM Schema Name  (-SSchema)" value={schema} onChange={setSchema}
            placeholder="PTC_CB945021_PTC_SCHEMA" required hint="Used in JQL filter" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Jira URL  (-jiraUrl)" value={jiraUrl} onChange={setJiraUrl}
              placeholder="https://jira.domain.com" required />
            <Field label="Jira Bearer Token  (-Ttoken)" value={jiraToken} onChange={setJiraToken}
              type="password" placeholder="eyJhbGci..." required />
          </div>
        </div>

        {/* ALM params */}
        <div className="rounded p-4 space-y-3" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
          <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: '#555' }}>ALM Connection</p>
          <Field label="ALM Host  (-almHost)" value={almHost} onChange={setAlmHost}
            placeholder="mfalm.domain.com" required hint="No https://" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="ALM Username  (-AAlmusername)" value={almUsername} onChange={setAlmUsername}
              placeholder="domain\\user" required />
            <Field label="ALM Password  (-AAlmpassword)" value={almPassword} onChange={setAlmPassword}
              type="password" placeholder="••••••••" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Domain  (-DDomain)" value={almDomain} onChange={setAlmDomain}
              placeholder="DEFAULT" required />
            <Field label="Project  (-PProject)" value={almProject} onChange={setAlmProject}
              placeholder="ALM_Project_001" required />
          </div>
        </div>

        {/* DB params collapsible */}
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
        <button type="submit" disabled={isRunning || backendStatus !== 'online'}
          className="flex items-center gap-2 px-6 py-2.5 rounded text-xs font-bold transition-all disabled:opacity-40"
          style={{
            background: 'linear-gradient(135deg, #cc0000, #990000)',
            color: '#fff',
            boxShadow: (isRunning || backendStatus !== 'online') ? 'none' : '0 0 18px rgba(200,0,0,0.3)',
          }}>
          {isRunning
            ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> SYNCING...</>
            : <><RefreshCw className="h-3.5 w-3.5" /> EXECUTE SYNC</>}
        </button>
      </form>

      {/* Console */}
      <ExecutionConsole logs={logs} isRunning={isRunning} onClear={clearLogs} />

      {/* Result summary */}
      {result && (
        <div className="rounded p-4 space-y-3" style={{ background: '#0f0f0f', border: '1px solid rgba(200,0,0,0.2)' }}>
          <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: '#e03030' }}>Sync Summary</p>
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
