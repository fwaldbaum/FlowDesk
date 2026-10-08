import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api, onUnauthorized } from '../lib/api';
import type { User } from '../lib/types';

type AuthState =
  | { status: 'loading'; user: null }
  | { status: 'anonymous'; user: null }
  | { status: 'authenticated'; user: User };

interface Auth {
  status: AuthState['status'];
  user: User | null;
  /** True until the workspace owner has signed up. */
  setupRequired: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Drop local session state (e.g. after a 401). */
  expire: () => void;
}

const AuthContext = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading', user: null });
  const [setupRequired, setSetupRequired] = useState(false);

  const expire = useCallback(() => setState({ status: 'anonymous', user: null }), []);

  useEffect(() => {
    api.authStatus().then((s) => setSetupRequired(s.setupRequired)).catch(() => {});
    api
      .me()
      .then(({ user }) => (user ? setState({ status: 'authenticated', user }) : expire()))
      .catch(expire);
    onUnauthorized(expire);
    return () => onUnauthorized(null);
  }, [expire]);

  const login = useCallback(async (email: string, password: string) => {
    const { user } = await api.login(email, password);
    setState({ status: 'authenticated', user });
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { user } = await api.register(name, email, password);
    setSetupRequired(false);
    setState({ status: 'authenticated', user });
  }, []);

  const logout = useCallback(async () => {
    await api.logout().catch(() => {});
    expire();
  }, [expire]);

  const value = useMemo<Auth>(
    () => ({ ...state, setupRequired, login, register, logout, expire }),
    [state, setupRequired, login, register, logout, expire],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth must be used inside <AuthProvider>');
  return auth;
}

/** Only allow redirects back into the app, never to another origin. */
export function safeNext(next: string | null) {
  return next && next.startsWith('/app') && !next.startsWith('//') ? next : '/app';
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') {
    return <div className="h-full bg-canvas" aria-busy="true" />;
  }
  if (status === 'anonymous') {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return <>{children}</>;
}
