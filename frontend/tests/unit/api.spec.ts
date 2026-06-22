import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api, ApiError, getToken, setToken } from '../../src/services/api';

function mockFetch(status: number, body: string, ok = status >= 200 && status < 300) {
  const fn = vi.fn(async () => ({ status, ok, text: async () => body }));
  global.fetch = fn as any;
  return fn;
}

beforeEach(() => {
  localStorage.clear();
});

describe('token storage', () => {
  it('grava e remove o token', () => {
    expect(getToken()).toBeNull();
    setToken('abc');
    expect(getToken()).toBe('abc');
    setToken(null);
    expect(getToken()).toBeNull();
  });
});

describe('api.request', () => {
  it('faz GET e anexa Authorization quando há token', async () => {
    setToken('tok123');
    const fn = mockFetch(200, JSON.stringify({ ok: true }));
    const data = await api.get('/x');
    expect(data).toEqual({ ok: true });
    const [, init] = fn.mock.calls[0];
    expect((init as any).headers.Authorization).toBe('Bearer tok123');
    expect((init as any).method).toBe('GET');
  });

  it('envia JSON no corpo de POST/PATCH', async () => {
    const fn = mockFetch(200, JSON.stringify({ id: 1 }));
    await api.post('/x', { a: 1 });
    const [, init] = fn.mock.calls[0];
    expect((init as any).headers['Content-Type']).toBe('application/json');
    expect((init as any).body).toBe(JSON.stringify({ a: 1 }));
    await api.patch('/x', { b: 2 });
    await api.del('/x');
  });

  it('envia corpo JSON em DELETE quando informado (exclusão de conta)', async () => {
    const fn = mockFetch(200, JSON.stringify({ success: true }));
    await api.del('/users/me', { password: 'segredo' });
    const [, init] = fn.mock.calls[0];
    expect((init as any).method).toBe('DELETE');
    expect((init as any).body).toBe(JSON.stringify({ password: 'segredo' }));
  });

  it('envia FormData em upload sem Content-Type manual', async () => {
    const fn = mockFetch(200, JSON.stringify({ ok: true }));
    const form = new FormData();
    await api.upload('/avatar', form);
    const [, init] = fn.mock.calls[0];
    expect((init as any).headers['Content-Type']).toBeUndefined();
    expect((init as any).body).toBe(form);
  });

  it('retorna null quando o corpo é vazio', async () => {
    mockFetch(204, '');
    expect(await api.get('/x')).toBeNull();
  });

  it('retorna texto puro quando não é JSON', async () => {
    mockFetch(200, 'texto-cru');
    expect(await api.get('/x')).toBe('texto-cru');
  });

  it('lança ApiError com a mensagem do servidor', async () => {
    mockFetch(400, JSON.stringify({ error: 'Falha X' }));
    await expect(api.get('/x')).rejects.toMatchObject({ status: 400, message: 'Falha X' });
    expect((await api.get('/x').catch((e) => e)) instanceof ApiError).toBe(true);
  });

  it('usa mensagem padrão quando o erro não traz "error"', async () => {
    mockFetch(500, JSON.stringify({ outro: 1 }));
    await expect(api.get('/x')).rejects.toThrow('Ocorreu um erro inesperado');
  });

  it('em 401 limpa o token e dispara o evento skillex:unauthorized', async () => {
    setToken('tok');
    const listener = vi.fn();
    window.addEventListener('skillex:unauthorized', listener);
    mockFetch(401, JSON.stringify({ error: 'nope' }));
    await api.get('/x').catch(() => {});
    expect(getToken()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener('skillex:unauthorized', listener);
  });
});
