import { createContext, useContext, useState, type ReactNode } from 'react';

interface Session {
  jiraUrl: string;
  jiraToken: string;
  almHost: string;
  almUsername: string;
  almPassword: string;
  almDomain: string;
  almProject: string;
  schema: string;
  dbHost: string;
  dbName: string;
  dbUsername: string;
  dbPassword: string;
}

interface AuthContextType {
  session: Session | null;
  isAuthenticated: boolean;
  login: (s: Session) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => {
    try {
      const stored = localStorage.getItem('jira_alm_session');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const login = (s: Session) => {
    setSession(s);
    localStorage.setItem('jira_alm_session', JSON.stringify(s));
  };

  const logout = () => {
    setSession(null);
    localStorage.removeItem('jira_alm_session');
  };

  return (
    <AuthContext.Provider value={{ session, isAuthenticated: !!session, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
