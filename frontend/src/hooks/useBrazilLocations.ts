/** Estados e cidades do Brasil via API pública do IBGE, com cache em memória. */
import { useEffect, useState } from 'react';

export interface BrazilState {
  sigla: string;
  nome: string;
}

const IBGE_BASE = 'https://servicodados.ibge.gov.br/api/v1/localidades';

let statesCache: Promise<BrazilState[]> | null = null;
const cityCache = new Map<string, Promise<string[]>>();

function fetchStates(): Promise<BrazilState[]> {
  if (!statesCache) {
    statesCache = fetch(`${IBGE_BASE}/estados?orderBy=nome`)
      .then((r) => {
        if (!r.ok) throw new Error('Falha ao carregar estados');
        return r.json();
      })
      .then((data: Array<{ sigla: string; nome: string }>) =>
        data.map((s) => ({ sigla: s.sigla, nome: s.nome })),
      )
      .catch((err) => {
        statesCache = null;
        throw err;
      });
  }
  return statesCache;
}

function fetchCities(uf: string): Promise<string[]> {
  const cached = cityCache.get(uf);
  if (cached) return cached;
  const p = fetch(`${IBGE_BASE}/estados/${uf}/municipios`)
    .then((r) => {
      if (!r.ok) throw new Error('Falha ao carregar cidades');
      return r.json();
    })
    .then((data: Array<{ nome: string }>) => data.map((c) => c.nome).sort((a, b) => a.localeCompare(b, 'pt-BR')))
    .catch((err) => {
      cityCache.delete(uf);
      throw err;
    });
  cityCache.set(uf, p);
  return p;
}

export function useBrazilStates(): { states: BrazilState[]; loading: boolean; error: string | null } {
  const [states, setStates] = useState<BrazilState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchStates()
      .then((s) => {
        if (alive) setStates(s);
      })
      .catch((e) => {
        if (alive) setError(e.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return { states, loading, error };
}

export function useBrazilCities(uf: string): { cities: string[]; loading: boolean; error: string | null } {
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uf) {
      setCities([]);
      setLoading(false);
      setError(null);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(null);
    fetchCities(uf)
      .then((c) => {
        if (alive) setCities(c);
      })
      .catch((e) => {
        if (alive) setError(e.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [uf]);

  return { cities, loading, error };
}
