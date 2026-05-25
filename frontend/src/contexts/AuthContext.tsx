/** Estado global de autenticação (usuário logado e notificações não lidas). */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, getToken, setToken } from '../services/api';
import { connectRealtime, disconnectRealtime } from '../services/realtime';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  bio: string | null;
  city: string | null;
  state: string | null;
  onboardingCompleted: boolean;
  wallet: { balance: number; lockedBalance: number } | null;
  profile: any;
}

/** 'loading' enquanto a sessão é restaurada no boot (evita flash de login). */
export type AuthStatus = 'loading' | 'guest' | 'authed';

export interface AuthContextValue {
  user: AppUser | null;
  status: AuthStatus;
  unread: number;
  isAdmin: boolean;
  login(email: string, password: string): Promise<AppUser>;
  register(data: Record<string, unknown>): Promise<AppUser>;
  logout(): void;
  setUser(user: AppUser | null): void;
  refreshUnread(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AppUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>(getToken() ? 'loading' : 'guest');
  const [unread, setUnread] = useState(0);

  const setUser = useCallback((u: AppUser | null) => {
    setUserState(u);
    setStatus(u ? 'authed' : 'guest');
  }, []);

  // Boot: restaura a sessão a partir do JWT salvo (GET /auth/me)
  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;
    api
      .get('/auth/me')
      .then(({ user: me }) => {
        if (cancelled) return;
        setUser(me);
        connectRealtime();
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sessão expirada em qualquer chamada à API (401) → volta para 'guest';
  // o redirect para /login acontece via <RequireAuth>.
  useEffect(() => {
    const onUnauthorized = () => {
      disconnectRealtime();
      setUser(null);
      setUnread(0);
    };
    window.addEventListener('skillex:unauthorized', onUnauthorized);
    return () => window.removeEventListener('skillex:unauthorized', onUnauthorized);
  }, [setUser]);

  const login = useCallback(
    async (email: string, password: string): Promise<AppUser> => {
      const { user: u, token } = await api.post('/auth/login', { email, password });
      setToken(token);
      setUser(u);
      connectRealtime();
      return u;
    },
    [setUser],
  );

  const register = useCallback(
    async (data: Record<string, unknown>): Promise<AppUser> => {
      const { user: u, token } = await api.post('/auth/register', data);
      setToken(token);
      setUser(u);
      connectRealtime();
      return u;
    },
    [setUser],
  );

  const logout = useCallback(() => {
    disconnectRealtime();
    setToken(null);
    setUser(null);
    setUnread(0);
  }, [setUser]);

  const refreshUnread = useCallback(async () => {
    try {
      const { unread: n } = await api.get('/notifications/unread-count');
      setUnread(n);
    } catch {
      /* silencioso */
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      unread,
      isAdmin: user?.role === 'ADMIN',
      login,
      register,
      logout,
      setUser,
      refreshUnread,
    }),
    [user, status, unread, login, register, logout, setUser, refreshUnread],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}
