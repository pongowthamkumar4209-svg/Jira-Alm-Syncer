import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Loader2, RefreshCw, Database, Link2 } from 'lucide-react';

type Tab = 'jira' | 'alm' | 'db';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [tab, setTab] = useState<Tab>('jira');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Jira fields
  const [jiraUrl, setJiraUrl]     = useState('');
  const [jiraToken, setJiraToken] = useState('');
  const [schema, setSchema]       = useState('');

  // ALM fields
  const [almHost,     setAlmHost]     = useState('');
  const [almUsername, setAlmUsername] = useState('');
  const [almPassword, setAlmPassword] = useState('');
  const [almDomain,   setAlmDomain]   = useState('');
  const [almProject,  setAlmProject]  = useState('');

  // DB fields
  const [dbHost,     setDbHost]     = useState('');
  const [dbName,     setDbName]     = useState('');
  const [dbUsername, setDbUsername] = useState('');
  const [dbPassword, setDbPassword] = useState('');

  const tabs: { key: Tab; label: string; icon: typeof RefreshCw }[] = [
    { key: 'jira', label: 'Jira',       icon: RefreshCw },
    { key: 'alm',  label: 'ALM',        icon: Link2 },
    { key: 'db',   label: 'Database',   icon: Database },
  ];

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!jiraUrl || !jiraToken || !schema) { setTab('jira'); setError('Jira URL, Token and Schema are required.'); return; }
    if (!almHost || !almUsername || !almPassword || !almDomain || !almProject) { setTab('alm'); setError('All ALM fields are required.'); return; }
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 600)); // simulate handshake
      login({ jiraUrl, jiraToken, almHost, almUsername, almPassword, almDomain, almProject, schema, dbHost, dbName, dbUsername, dbPassword });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Connection failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    login({
      jiraUrl: 'https://jira.demo.com', jiraToken: 'demo-token', schema: 'PTC_DEMO_SCHEMA',
      almHost: 'mfalm.demo.com', almUsername: 'demo', almPassword: 'demo123',
      almDomain: 'DEFAULT', almProject: 'ALM_Demo',
      dbHost: '', dbName: '', dbUsername: '', dbPassword: '',
    });
    navigate('/');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 15% 50%, rgba(180,0,0,0.1) 0%, transparent 55%), radial-gradient(ellipse at 85% 20%, rgba(140,0,0,0.07) 0%, transparent 45%), #0d0d0d' }}>

      {/* Grid bg */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(200,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(200,0,0,0.05) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />

      <div className="w-full max-w-md space-y-5 relative z-10">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl"
            style={{ background: 'rgba(200,0,0,0.12)', border: '1px solid rgba(200,0,0,0.3)', boxShadow: '0 0 28px rgba(200,0,0,0.18)' }}>
            <Shield className="h-7 w-7" style={{ color: '#e03030' }} />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: '#e03030' }}>ALM OPS</p>
            <h1 className="text-xl font-bold" style={{ color: '#f0f0f0' }}>Jira → ALM Sync</h1>
            <p className="text-xs mt-1 font-mono uppercase tracking-widest" style={{ color: '#555' }}>Configure Connection Parameters</p>
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex rounded overflow-hidden" style={{ border: '1px solid #222' }}>
          {tabs.map(t => (
            <button key={t.key} type="button" onClick={() => setTab(t.key)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all"
              style={{
                background: tab === t.key ? 'rgba(200,0,0,0.15)' : '#0d0d0d',
                color: tab === t.key ? '#e03030' : '#555',
                borderRight: t.key !== 'db' ? '1px solid #222' : 'none',
              }}>
              <t.icon className="h-3 w-3" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded px-3 py-2 text-xs" style={{ background: 'rgba(200,0,0,0.1)', border: '1px solid rgba(200,0,0,0.35)', color: '#f87171' }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleConnect} className="space-y-3">
          <div className="rounded p-4 space-y-3" style={{ background: '#0f0f0f', border: '1px solid #1e1e1e' }}>

            {/* JIRA TAB */}
            {tab === 'jira' && (
              <div className="space-y-3">
                <FormField label="Jira URL" value={jiraUrl} onChange={setJiraUrl} placeholder="https://jira.domain.com" required />
                <FormField label="Jira Bearer Token" value={jiraToken} onChange={setJiraToken} type="password" placeholder="eyJhbGciO..." required />
                <FormField label="ALM Schema Name" value={schema} onChange={setSchema} placeholder="PTC_CB945021_PTC_SCHEMA" required hint="Used in JQL filter" />
                <div className="pt-1 rounded px-3 py-2 text-xs font-mono" style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', color: '#555' }}>
                  <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: '#444' }}>JQL Preview</p>
                  <p style={{ color: '#666' }}>
                    {schema
                      ? `(filter in (36582) OR filter in (36567)) AND "ALM Schema Name" = "${schema}" ORDER BY issuekey ASC`
                      : 'Enter schema to preview JQL...'}
                  </p>
                </div>
              </div>
            )}

            {/* ALM TAB */}
            {tab === 'alm' && (
              <div className="space-y-3">
                <FormField label="ALM Host" value={almHost} onChange={setAlmHost} placeholder="mfalm.domain.com" required hint="No https://" />
                <FormField label="ALM Username" value={almUsername} onChange={setAlmUsername} placeholder="domain\\username" required />
                <FormField label="ALM Password" value={almPassword} onChange={setAlmPassword} type="password" placeholder="••••••••" required />
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Domain" value={almDomain} onChange={setAlmDomain} placeholder="DEFAULT" required />
                  <FormField label="Project" value={almProject} onChange={setAlmProject} placeholder="ALM_Project" required />
                </div>
              </div>
            )}

            {/* DB TAB */}
            {tab === 'db' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded px-3 py-2 text-xs" style={{ background: 'rgba(200,0,0,0.05)', border: '1px solid rgba(200,0,0,0.15)', color: '#888' }}>
                  <Database className="h-3 w-3 shrink-0" style={{ color: '#e03030' }} />
                  Database config is optional. Sync results will still be logged locally if left empty.
                </div>
                <FormField label="DB Host" value={dbHost} onChange={setDbHost} placeholder="sql-server.domain.com" />
                <FormField label="DB Name" value={dbName} onChange={setDbName} placeholder="JiraALMSync" />
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="DB Username" value={dbUsername} onChange={setDbUsername} placeholder="sa" />
                  <FormField label="DB Password" value={dbPassword} onChange={setDbPassword} type="password" placeholder="••••••••" />
                </div>
              </div>
            )}
          </div>

          {/* Tab nav buttons */}
          <div className="flex justify-between items-center">
            <button type="button" onClick={() => setTab(tab === 'jira' ? 'db' : tab === 'alm' ? 'jira' : 'alm')}
              className="text-xs transition-colors" style={{ color: '#555' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#e03030')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#555')}>
              ← Back
            </button>
            {tab !== 'db' ? (
              <button type="button" onClick={() => setTab(tab === 'jira' ? 'alm' : 'db')}
                className="text-xs px-4 py-1.5 rounded transition-all"
                style={{ background: 'rgba(200,0,0,0.12)', color: '#e03030', border: '1px solid rgba(200,0,0,0.25)' }}>
                Next →
              </button>
            ) : (
              <button type="submit" disabled={loading}
                className="flex items-center gap-2 px-5 py-2 rounded text-xs font-bold transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #cc0000, #990000)', color: '#fff', boxShadow: '0 0 18px rgba(200,0,0,0.3)' }}>
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {loading ? 'CONNECTING...' : 'CONNECT & START'}
              </button>
            )}
          </div>

          {/* Or connect from any tab */}
          {tab !== 'db' && (
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded text-xs font-bold transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #cc0000, #990000)', color: '#fff', boxShadow: '0 0 18px rgba(200,0,0,0.3)' }}>
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {loading ? 'CONNECTING...' : 'CONNECT & START'}
            </button>
          )}
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: '#1a1a1a' }} />
          <span className="text-[10px]" style={{ color: '#444' }}>or</span>
          <div className="flex-1 h-px" style={{ background: '#1a1a1a' }} />
        </div>

        <button type="button" onClick={handleDemo} disabled={loading}
          className="w-full py-2.5 rounded text-xs font-medium transition-colors disabled:opacity-50"
          style={{ border: '1px solid #222', color: '#666', background: 'transparent' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(200,0,0,0.35)'; (e.currentTarget as HTMLElement).style.color = '#e03030'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#222'; (e.currentTarget as HTMLElement).style.color = '#666'; }}>
          DEMO ACCESS (Preview Mode)
        </button>

        {/* Watermark */}
        <p className="text-center text-[10px] font-mono uppercase tracking-widest" style={{ color: 'rgba(200,0,0,0.4)' }}>
          ⚡ Owned &amp; Built by <span style={{ color: 'rgba(220,0,0,0.7)', fontWeight: 700 }}>Pongowtham</span>
        </p>
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, placeholder, type = 'text', required, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean; hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider" style={{ color: '#666' }}>
        {label}
        {required && <span style={{ color: '#e03030' }}>*</span>}
        {hint && <span className="normal-case font-normal" style={{ color: '#444' }}>— {hint}</span>}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded px-3 py-2 text-sm font-mono focus:outline-none transition-colors"
        style={{ background: '#0d0d0d', border: '1px solid #222', color: '#e8e8e8' }}
        onFocus={e => (e.target.style.borderColor = 'rgba(200,0,0,0.45)')}
        onBlur={e  => (e.target.style.borderColor = '#222')} />
    </div>
  );
}
