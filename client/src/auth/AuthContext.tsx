import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api, onUnauthorized } from '../lib/api';
import type { RegisterInput, SurveyInput, User } from '../lib/types';

type AuthState =
  | { status: 'loading'; user: null }
  | { status: 'anonymous'; user: null }
  | { status: 'authenticated'; user: User };

interface Auth {
  status: AuthState['status'];
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  submitSurvey: (input: SurveyInput) => Promise<void>;
  /** Re-reads the session (e.g. after confirming the email in another tab). */
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  /** Drop local session state (e.g. after a 401). */
  expire: () => void;
}

const AuthContext = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading', user: null });

  const expire = useCallback(() => setState({ status: 'anonymous', user: null }), []);

  useEffect(() => {
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
    return user;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const { user } = await api.register(input);
    setState({ status: 'authenticated', user });
    return user;
  }, []);

  const refresh = useCallback(async () => {
    const { user } = await api.me();
    if (user) setState({ status: 'authenticated', user });
    else setState({ status: 'anonymous', user: null });
  }, []);

  const submitSurvey = useCallback(async (input: SurveyInput) => {
    const { user } = await api.submitSurvey(input);
    setState({ status: 'authenticated', user });
  }, []);

  const logout = useCallback(async () => {
    await api.logout().catch(() => {});
    expire();
  }, [expire]);

  const value = useMemo<Auth>(
    () => ({ ...state, login, register, submitSurvey, refresh, logout, expire }),
    [state, login, register, submitSurvey, refresh, logout, expire],
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

/**
 * Gate for signed-in pages. New owners are sent to the welcome survey first;
 * `onboarding` marks the survey page itself.
 */
export function RequireAuth({ children, step }: { children: ReactNode; step?: 'verify' | 'onboarding' }) {
  const { status, user } = useAuth();
  const location = useLocation();
  if (status === 'loading') {
    return <div className="h-full bg-canvas" aria-busy="true" />;
  }
  if (status === 'anonymous') {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  // Gates run in order: confirm the email, then answer the welcome survey, then the app.
  const required = user?.needs_verification ? 'verify' : user?.needs_onboarding ? 'onboarding' : undefined;
  if (required !== step) {
    const to = { verify: '/verifica-tu-correo', onboarding: '/bienvenida' } as const;
    return <Navigate to={required ? to[required] : '/app'} replace />;
  }
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return user?.is_admin ? <>{children}</> : <Navigate to="/app" replace />;
}
