import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { Shield, LayoutDashboard, RefreshCw, LogOut, ChevronLeft, Menu, X, History } from 'lucide-react';

const navItems = [
  { path: '/',        label: 'Dashboard',       icon: LayoutDashboard },
  { path: '/sync',    label: 'Jira → ALM Sync', icon: RefreshCw },
  { path: '/history', label: 'Sync History',     icon: History },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { session, logout: almLogout } = useAuth();
  const { userLogout, currentUser } = useUserAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    almLogout();
    userLogout();
  };

  const NavContent = ({ onNavClick }: { onNavClick?: () => void }) => (
    <>
      <div className="flex items-center gap-2.5 px-3 py-3.5" style={{ borderBottom: '1px solid #1a1a1a' }}>
        <div className="flex items-center justify-center w-7 h-7 rounded" style={{ background: 'rgba(200,0,0,0.15)', border: '1px solid rgba(200,0,0,0.3)' }}>
          <Shield className="h-4 w-4" style={{ color: '#e03030' }} />
        </div>
        {(!collapsed || onNavClick) && (
          <div>
            <p className="text-xs font-bold tracking-tight" style={{ color: '#f0f0f0' }}>ALM OPS</p>
            <p className="text-[9px] font-mono uppercase" style={{ color: '#555' }}>Jira Sync</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-auto py-2 px-1.5 space-y-0.5">
        {navItems.map(item => {
          const active = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} onClick={onNavClick}
              className="flex items-center gap-2.5 rounded px-2.5 py-2 text-xs font-medium transition-all"
              style={{
                background: active ? 'rgba(200,0,0,0.12)' : 'transparent',
                color: active ? '#e03030' : '#777',
                borderLeft: active ? '2px solid #cc0000' : '2px solid transparent',
              }}>
              <item.icon className="h-3.5 w-3.5 shrink-0" />
              {(!collapsed || onNavClick) && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 space-y-2" style={{ borderTop: '1px solid #1a1a1a' }}>
        {(!collapsed || onNavClick) && (
          <div className="px-2 py-1.5 rounded space-y-1" style={{ background: '#111' }}>
            {currentUser && (
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#4ade80' }} />
                <p className="text-[10px] font-mono truncate" style={{ color: '#888' }}>{currentUser}</p>
              </div>
            )}
            {session?.schema && (
              <>
                <p className="text-[9px] font-mono uppercase" style={{ color: '#444' }}>Schema</p>
                <p className="text-[10px] font-mono truncate" style={{ color: '#666' }}>{session.schema}</p>
              </>
            )}
          </div>
        )}
        <div className="flex items-center justify-between">
          {!onNavClick && (
            <button onClick={() => setCollapsed(!collapsed)} className="rounded p-1 transition-colors" style={{ color: '#555' }}>
              <ChevronLeft className={`h-3.5 w-3.5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            </button>
          )}
          <button onClick={handleLogout} title="Sign Out" className="rounded p-1 transition-colors ml-auto" style={{ color: '#555' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#e03030')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#555')}>
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0d0d0d' }}>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3"
        style={{ background: '#0d0d0d', borderBottom: '1px solid #1a1a1a' }}>
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4" style={{ color: '#e03030' }} />
          <span className="text-sm font-bold" style={{ color: '#f0f0f0' }}>ALM OPS</span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(200,0,0,0.15)', color: '#e03030' }}>JIRA SYNC</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} style={{ color: '#888' }}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.75)' }} onClick={() => setMobileOpen(false)} />
          <div className="md:hidden fixed top-0 left-0 h-full w-60 z-50 flex flex-col" style={{ background: '#0d0d0d', borderRight: '1px solid #1a1a1a' }}>
            <NavContent onNavClick={() => setMobileOpen(false)} />
          </div>
        </>
      )}

      {/* Desktop sidebar */}
      <aside className={`hidden md:flex flex-col transition-all duration-200 ${collapsed ? 'w-14' : 'w-52'}`}
        style={{ background: '#0a0a0a', borderRight: '1px solid #1a1a1a' }}>
        <NavContent />
      </aside>

      <main className="flex-1 overflow-auto p-4 pt-16 md:pt-4">
        {children}
      </main>
    </div>
  );
}
