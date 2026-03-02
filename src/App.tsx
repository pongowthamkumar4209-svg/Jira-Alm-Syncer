import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { UserAuthProvider, useUserAuth } from '@/contexts/UserAuthContext';
import { AppLayout } from '@/components/AppLayout';
import UserLogin from './pages/UserLogin';
import ConnectPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sync from './pages/Sync';
import History from './pages/History';
import NotFound from './pages/NotFound';

function RequireUserAuth({ children }: { children: JSX.Element }) {
  const { isUserLoggedIn } = useUserAuth();
  if (!isUserLoggedIn) return <Navigate to="/login" replace />;
  return children;
}

function RequireAlmSession({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/connect" replace />;
  return children;
}

function AppRoutes() {
  const { isUserLoggedIn } = useUserAuth();
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Step 1 — /login: App username/password */}
      <Route
        path="/login"
        element={isUserLoggedIn ? <Navigate to="/connect" replace /> : <UserLogin />}
      />

      {/* Step 2 — /connect: Jira/ALM/DB config */}
      <Route
        path="/connect"
        element={
          <RequireUserAuth>
            {isAuthenticated ? <Navigate to="/" replace /> : <ConnectPage />}
          </RequireUserAuth>
        }
      />

      {/* Step 3 — /: Protected app */}
      <Route
        path="/*"
        element={
          <RequireUserAuth>
            <RequireAlmSession>
              <AppLayout>
                <Routes>
                  <Route path="/"        element={<Dashboard />} />
                  <Route path="/sync"    element={<Sync />} />
                  <Route path="/history" element={<History />} />
                  <Route path="*"        element={<NotFound />} />
                </Routes>
              </AppLayout>
            </RequireAlmSession>
          </RequireUserAuth>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <UserAuthProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </UserAuthProvider>
  );
}
