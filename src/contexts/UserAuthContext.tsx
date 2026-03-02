import { createContext, useContext, useState, type ReactNode } from 'react';

interface UserAuthContextType {
  isUserLoggedIn: boolean;
  userLogin: (username: string, password: string) => boolean;
  userLogout: () => void;
  currentUser: string | null;
}

// Hardcoded credentials — replace with API call in production
const VALID_USERS: Record<string, string> = {
  'admin':      'Admin@123',
  'pongowtham': 'Pong@2025',
  'demo':       'Demo@123',
};

const UserAuthContext = createContext<UserAuthContextType | null>(null);

export function UserAuthProvider({ children }: { children: ReactNode }) {
  const [isUserLoggedIn, setIsUserLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem('app_user_logged_in') === 'true';
  });
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return sessionStorage.getItem('app_current_user') || null;
  });

  const userLogin = (username: string, password: string): boolean => {
    const storedPassword = VALID_USERS[username.toLowerCase()];
    if (storedPassword && storedPassword === password) {
      setIsUserLoggedIn(true);
      setCurrentUser(username);
      sessionStorage.setItem('app_user_logged_in', 'true');
      sessionStorage.setItem('app_current_user', username);
      return true;
    }
    return false;
  };

  const userLogout = () => {
    setIsUserLoggedIn(false);
    setCurrentUser(null);
    sessionStorage.removeItem('app_user_logged_in');
    sessionStorage.removeItem('app_current_user');
    // Also clear ALM session
    localStorage.removeItem('jira_alm_session');
  };

  return (
    <UserAuthContext.Provider value={{ isUserLoggedIn, userLogin, userLogout, currentUser }}>
      {children}
    </UserAuthContext.Provider>
  );
}

export function useUserAuth() {
  const ctx = useContext(UserAuthContext);
  if (!ctx) throw new Error('useUserAuth must be used within UserAuthProvider');
  return ctx;
}
