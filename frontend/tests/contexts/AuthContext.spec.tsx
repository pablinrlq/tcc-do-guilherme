import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

vi.mock('../../src/services/api', () => ({
  api: { get: vi.fn(), post: vi.fn() },
  getToken: vi.fn(() => null),
  setToken: vi.fn(),
}));

vi.mock('../../src/services/realtime', () => ({
  connectRealtime: vi.fn(),
  disconnectRealtime: vi.fn(),
}));

import { AuthProvider, useAuth } from '../../src/contexts/AuthContext';
import { api, getToken, setToken } from '../../src/services/api';
import { connectRealtime, disconnectRealtime } from '../../src/services/realtime';

const fakeUser = {
  id: 'u1',
  name: 'Ana',
  email: 'ana@a.com',
  role: 'USER',
  avatarUrl: null,
  bio: null,
  city: null,
  state: null,
  onboardingCompleted: true,
  wallet: null,
  profile: null,
};

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  vi.clearAllMocks();
  (getToken as any).mockReturnValue(null);
});

describe('boot da sessão', () => {
  it('sem token vai direto para guest', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.status).toBe('guest');
    expect(result.current.user).toBeNull();
    expect(api.get).not.toHaveBeenCalled();
  });

  it('com token restaura a sessão (loading → authed) e conecta o tempo real', async () => {
    (getToken as any).mockReturnValue('tok');
    (api.get as any).mockResolvedValue({ user: fakeUser });
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('authed'));
    expect(result.current.user?.id).toBe('u1');
    expect(connectRealtime).toHaveBeenCalled();
  });

  it('com token inválido (/auth/me falha) vira guest', async () => {
    (getToken as any).mockReturnValue('tok');
    (api.get as any).mockRejectedValue(new Error('401'));
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('guest'));
    expect(result.current.user).toBeNull();
  });

  it('boot resolvido após o unmount não atualiza estado (cleanup)', async () => {
    (getToken as any).mockReturnValue('tok');
    const d = deferred<{ user: typeof fakeUser }>();
    (api.get as any).mockReturnValue(d.promise);
    const { unmount } = renderHook(() => useAuth(), { wrapper });
    unmount();
    await act(async () => {
      d.resolve({ user: fakeUser });
      await d.promise;
    });
    expect(connectRealtime).not.toHaveBeenCalled();
  });

  it('boot rejeitado após o unmount não atualiza estado (cleanup)', async () => {
    (getToken as any).mockReturnValue('tok');
    const d = deferred<{ user: typeof fakeUser }>();
    (api.get as any).mockReturnValue(d.promise);
    const { unmount } = renderHook(() => useAuth(), { wrapper });
    unmount();
    await act(async () => {
      d.reject(new Error('falha'));
      await d.promise.catch(() => {});
    });
    // Sem erro nem warning de setState após unmount — nada a assertar além do fluxo
    expect(connectRealtime).not.toHaveBeenCalled();
  });
});

describe('login / register / logout', () => {
  it('login define token, usuário e conecta o tempo real', async () => {
    (api.post as any).mockResolvedValue({ user: fakeUser, token: 'tok' });
    const { result } = renderHook(() => useAuth(), { wrapper });
    let u: any;
    await act(async () => {
      u = await result.current.login('ana@a.com', '123');
    });
    expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'ana@a.com', password: '123' });
    expect(setToken).toHaveBeenCalledWith('tok');
    expect(u.id).toBe('u1');
    expect(result.current.status).toBe('authed');
    expect(result.current.user?.id).toBe('u1');
    expect(connectRealtime).toHaveBeenCalled();
  });

  it('register define token, usuário e conecta o tempo real', async () => {
    (api.post as any).mockResolvedValue({ user: fakeUser, token: 'tok2' });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.register({ name: 'Ana' });
    });
    expect(setToken).toHaveBeenCalledWith('tok2');
    expect(result.current.status).toBe('authed');
    expect(connectRealtime).toHaveBeenCalled();
  });

  it('logout desconecta o tempo real, limpa token, usuário e contador', async () => {
    (api.post as any).mockResolvedValue({ user: fakeUser, token: 'tok' });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.login('a', 'b');
    });
    act(() => {
      result.current.logout();
    });
    expect(disconnectRealtime).toHaveBeenCalled();
    expect(setToken).toHaveBeenCalledWith(null);
    expect(result.current.user).toBeNull();
    expect(result.current.status).toBe('guest');
    expect(result.current.unread).toBe(0);
  });
});

describe('isAdmin e setUser', () => {
  it('isAdmin reflete o papel do usuário', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAdmin).toBe(false);
    act(() => {
      result.current.setUser({ ...fakeUser, role: 'ADMIN' });
    });
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.status).toBe('authed');
    act(() => {
      result.current.setUser(null);
    });
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.status).toBe('guest');
  });
});

describe('refreshUnread', () => {
  it('atualiza o contador de não lidas', async () => {
    (api.get as any).mockResolvedValue({ unread: 7 });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.refreshUnread();
    });
    expect(result.current.unread).toBe(7);
  });

  it('é silencioso em caso de erro', async () => {
    (api.get as any).mockRejectedValue(new Error('falha'));
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.refreshUnread();
    });
    expect(result.current.unread).toBe(0);
  });
});

describe('sessão expirada (401 em qualquer chamada)', () => {
  it('evento skillex:unauthorized zera a sessão e desconecta', async () => {
    (api.post as any).mockResolvedValue({ user: fakeUser, token: 'tok' });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.login('a', 'b');
    });
    expect(result.current.status).toBe('authed');
    act(() => {
      window.dispatchEvent(new CustomEvent('skillex:unauthorized'));
    });
    expect(result.current.status).toBe('guest');
    expect(result.current.user).toBeNull();
    expect(result.current.unread).toBe(0);
    expect(disconnectRealtime).toHaveBeenCalled();
  });

  it('listener é removido no unmount do provider', async () => {
    const { unmount } = renderHook(() => useAuth(), { wrapper });
    unmount();
    expect(() => window.dispatchEvent(new CustomEvent('skillex:unauthorized'))).not.toThrow();
  });
});

describe('useAuth fora do provider', () => {
  it('lança erro explicativo', () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth deve ser usado dentro de <AuthProvider>',
    );
  });
});
