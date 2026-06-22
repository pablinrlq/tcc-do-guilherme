import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

async function importHook() {
  const mod = await import('../../src/hooks/useBrazilLocations');
  return mod;
}

// ---------------------------------------------------------------------------
//  useBrazilStates
// ---------------------------------------------------------------------------
describe('useBrazilStates', () => {
  it('carrega estados com sucesso', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          { sigla: 'SP', nome: 'São Paulo' },
          { sigla: 'RJ', nome: 'Rio de Janeiro' },
        ],
      }),
    );

    const { useBrazilStates } = await importHook();
    const { result } = renderHook(() => useBrazilStates());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.states).toHaveLength(2);
    expect(result.current.states[0].sigla).toBe('SP');
    expect(result.current.error).toBeNull();
  });

  it('expõe erro quando a resposta não é ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false }),
    );

    const { useBrazilStates } = await importHook();
    const { result } = renderHook(() => useBrazilStates());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Falha ao carregar estados');
    expect(result.current.states).toHaveLength(0);
  });

  it('expõe erro em falha de rede', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Network error')),
    );

    const { useBrazilStates } = await importHook();
    const { result } = renderHook(() => useBrazilStates());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Network error');
  });

  it('usa cache na segunda chamada (fetch chamado apenas uma vez)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ sigla: 'MG', nome: 'Minas Gerais' }],
    });
    vi.stubGlobal('fetch', fetchMock);

    const { useBrazilStates } = await importHook();

    const { result: r1 } = renderHook(() => useBrazilStates());
    await waitFor(() => expect(r1.current.loading).toBe(false));

    const { result: r2 } = renderHook(() => useBrazilStates());
    await waitFor(() => expect(r2.current.loading).toBe(false));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(r2.current.states).toHaveLength(1);
  });

  it('cleanup: alive=false impede setState após desmontagem (then)', async () => {
    let resolveFetch!: (r: any) => void;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValue(new Promise<any>((res) => { resolveFetch = res; })),
    );

    const { useBrazilStates } = await importHook();
    const { unmount, result } = renderHook(() => useBrazilStates());

    unmount(); // alive = false

    await act(async () => {
      resolveFetch({ ok: true, json: async () => [{ sigla: 'SP', nome: 'São Paulo' }] });
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(result.current.states).toHaveLength(0);
  });

  it('cleanup: alive=false impede setState após desmontagem (catch)', async () => {
    let rejectFetch!: (e: Error) => void;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValue(new Promise<any>((_res, rej) => { rejectFetch = rej; })),
    );

    const { useBrazilStates } = await importHook();
    const { unmount, result } = renderHook(() => useBrazilStates());

    unmount(); // alive = false

    await act(async () => {
      rejectFetch(new Error('offline'));
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(result.current.error).toBeNull(); // setError não chamado
  });
});

// ---------------------------------------------------------------------------
//  useBrazilCities
// ---------------------------------------------------------------------------
describe('useBrazilCities', () => {
  it('não dispara fetch com uf vazio', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { useBrazilCities } = await importHook();
    const { result } = renderHook(() => useBrazilCities(''));

    await act(async () => {});

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.cities).toHaveLength(0);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('carrega cidades com sucesso', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ nome: 'Campinas' }, { nome: 'Sorocaba' }],
      }),
    );

    const { useBrazilCities } = await importHook();
    const { result } = renderHook(() => useBrazilCities('SP'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.cities).toEqual(['Campinas', 'Sorocaba']);
    expect(result.current.error).toBeNull();
  });

  it('expõe erro quando a resposta não é ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false }),
    );

    const { useBrazilCities } = await importHook();
    const { result } = renderHook(() => useBrazilCities('RS'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Falha ao carregar cidades');
  });

  it('expõe erro em falha de rede', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('offline')),
    );

    const { useBrazilCities } = await importHook();
    const { result } = renderHook(() => useBrazilCities('BA'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('offline');
  });

  it('usa cache na segunda chamada com o mesmo uf', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ nome: 'Fortaleza' }],
    });
    vi.stubGlobal('fetch', fetchMock);

    const { useBrazilCities } = await importHook();

    const { result: r1 } = renderHook(() => useBrazilCities('CE'));
    await waitFor(() => expect(r1.current.loading).toBe(false));

    const { result: r2 } = renderHook(() => useBrazilCities('CE'));
    await waitFor(() => expect(r2.current.loading).toBe(false));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(r2.current.cities).toEqual(['Fortaleza']);
  });

  it('cleanup: alive=false impede setState após desmontagem (then)', async () => {
    let resolveFetch!: (r: any) => void;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValue(new Promise<any>((res) => { resolveFetch = res; })),
    );

    const { useBrazilCities } = await importHook();
    const { unmount, result } = renderHook(() => useBrazilCities('SC'));

    unmount(); // alive = false

    await act(async () => {
      resolveFetch({ ok: true, json: async () => [{ nome: 'Florianópolis' }] });
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(result.current.cities).toHaveLength(0);
  });

  it('cleanup: alive=false impede setState após desmontagem (catch)', async () => {
    let rejectFetch!: (e: Error) => void;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValue(new Promise<any>((_res, rej) => { rejectFetch = rej; })),
    );

    const { useBrazilCities } = await importHook();
    const { unmount, result } = renderHook(() => useBrazilCities('PR'));

    unmount(); // alive = false

    await act(async () => {
      rejectFetch(new Error('offline'));
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(result.current.error).toBeNull(); // setError não chamado
  });
});
