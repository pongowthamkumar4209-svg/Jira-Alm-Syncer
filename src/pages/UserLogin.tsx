import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { Shield, Loader2, Eye, EyeOff, Lock, User } from 'lucide-react';

export default function UserLogin() {
  const navigate = useNavigate();
  const { userLogin } = useUserAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError('Username and password are required.');
      return;
    }
    setLoading(true);
    // Simulate auth handshake delay
    await new Promise(r => setTimeout(r, 600));
    const success = userLogin(username.trim(), password);
    if (success) {
      navigate('/connect');
    } else {
      setAttempts(a => a + 1);
      setError(attempts >= 2
        ? 'Multiple failed attempts. Please verify your credentials with your administrator.'
        : 'Invalid username or password.');
      setPassword('');
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 20% 60%, rgba(160,0,0,0.12) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(120,0,0,0.08) 0%, transparent 45%), #0d0d0d',
      }}
    >
      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(200,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(200,0,0,0.04) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }} />

      {/* Glow orb */}
      <div className="absolute pointer-events-none" style={{
        top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '500px', height: '300px',
        background: 'radial-gradient(ellipse, rgba(180,0,0,0.06) 0%, transparent 70%)',
        filter: 'blur(40px)',
      }} />

      <div className="w-full max-w-sm space-y-6 relative z-10">

        {/* Logo + Title */}
        <div className="text-center space-y-4">
          <div className="inline-flex flex-col items-center gap-2">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: 'rgba(200,0,0,0.1)',
                border: '1px solid rgba(200,0,0,0.35)',
                boxShadow: '0 0 32px rgba(200,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)',
              }}
            >
              <Shield className="h-8 w-8" style={{ color: '#e03030' }} />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em]" style={{ color: 'rgba(200,0,0,0.7)' }}>ALM OPS</p>
              <h1 className="text-2xl font-bold mt-0.5" style={{ color: '#f4f4f4' }}>Jira–ALM Sync</h1>
              <p className="text-[10px] font-mono mt-1 uppercase tracking-widest" style={{ color: '#444' }}>Secure Access Portal</p>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-xl p-6 space-y-4" style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
        }}>

          {/* Error */}
          {error && (
            <div className="rounded-lg px-3.5 py-2.5 flex items-start gap-2 text-xs"
              style={{ background: 'rgba(200,0,0,0.08)', border: '1px solid rgba(200,0,0,0.3)', color: '#f87171' }}>
              <span className="mt-0.5 shrink-0">✗</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">

            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider" style={{ color: '#666' }}>
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-3.5 w-3.5 pointer-events-none" style={{ color: '#444' }} />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoComplete="username"
                  autoFocus
                  className="w-full rounded-lg pl-9 pr-3 py-2.5 text-sm font-mono focus:outline-none transition-all"
                  style={{ background: '#111', border: '1px solid #252525', color: '#e8e8e8' }}
                  onFocus={e => {
                    e.target.style.borderColor = 'rgba(200,0,0,0.5)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(200,0,0,0.08)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = '#252525';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider" style={{ color: '#666' }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 pointer-events-none" style={{ color: '#444' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full rounded-lg pl-9 pr-10 py-2.5 text-sm font-mono focus:outline-none transition-all"
                  style={{ background: '#111', border: '1px solid #252525', color: '#e8e8e8' }}
                  onFocus={e => {
                    e.target.style.borderColor = 'rgba(200,0,0,0.5)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(200,0,0,0.08)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = '#252525';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 transition-colors"
                  style={{ color: '#444' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#888')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#444')}
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #cc0000, #8a0000)',
                color: '#fff',
                boxShadow: loading ? 'none' : '0 0 20px rgba(200,0,0,0.35)',
                letterSpacing: '0.08em',
              }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.boxShadow = '0 0 30px rgba(200,0,0,0.5)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = loading ? 'none' : '0 0 20px rgba(200,0,0,0.35)'; }}
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Watermark */}
        <p className="text-center text-[10px] font-mono uppercase tracking-widest" style={{ color: 'rgba(200,0,0,0.35)' }}>
          ⚡ Owned &amp; Built by{' '}
          <span style={{ color: 'rgba(220,0,0,0.6)', fontWeight: 700 }}>Pongowtham</span>
        </p>
      </div>
    </div>
  );
}
