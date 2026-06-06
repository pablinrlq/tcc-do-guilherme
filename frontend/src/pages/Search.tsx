/** Busca de pessoas e habilidades com filtros (estado na URL via useSearchParams). */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { UserCard } from '../components/UserCard';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { Sheet } from '../components/ui/Sheet';
import { SkeletonCards } from '../components/ui/SkeletonCards';
import { api } from '../services/api';
import {
  AVAILABILITY_LABELS,
  GENDER_LABELS,
  LEVEL_LABELS,
  MODALITY_LABELS,
  categoryIconName,
} from '../utils/format';

// Chaves de filtro persistidas na query string da URL
const FILTER_KEYS = [
  'q',
  'categoryId',
  'modality',
  'level',
  'acceptsCoins',
  'acceptsExchange',
  'city',
  'state',
  'language',
  'nationality',
  'gender',
  'availability',
  'minAge',
  'maxAge',
] as const;

type FilterKey = (typeof FILTER_KEYS)[number];
type Filters = Record<FilterKey, string>;

function readFilters(params: URLSearchParams): Filters {
  const f = {} as Filters;
  for (const key of FILTER_KEYS) f[key] = params.get(key) ?? '';
  return f;
}

// Cache de categorias entre visitas (mudam raramente)
let categoriesCache: any[] = [];

function SelectFilter({
  id,
  name,
  label: fieldLabel,
  values,
  labels,
  current,
  anyLabel,
}: {
  id: string;
  name: string;
  label: string;
  values: string[];
  labels: Record<string, string>;
  current: string;
  anyLabel: string;
}) {
  return (
    <div className="field">
      <label className="field__label">{fieldLabel}</label>
      <select className="select" id={id} name={name} defaultValue={current}>
        {['', ...values].map((v) => (
          <option key={v} value={v}>
            {v ? labels[v] : anyLabel}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = readFilters(searchParams);

  const [q, setQ] = useState(filters.q);
  const [categories, setCategories] = useState<any[]>(categoriesCache);
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const pageRef = useRef(1);

  // Campo de busca → URL com debounce (replace para não poluir o histórico)
  useEffect(() => {
    if (q === (searchParams.get('q') ?? '')) return;
    const t = setTimeout(() => {
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          if (q) p.set('q', q);
          else p.delete('q');
          return p;
        },
        { replace: true },
      );
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // Navegações externas (ex.: link "Ver" das tendências) atualizam o campo
  const urlQ = searchParams.get('q') ?? '';
  useEffect(() => {
    setQ(urlQ);
  }, [urlQ]);

  useEffect(() => {
    if (categoriesCache.length) return;
    let cancelled = false;
    api.get('/categories').then((data) => {
      categoriesCache = data.categories;
      if (!cancelled) setCategories(data.categories);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const buildQuery = useCallback(() => {
    const p = new URLSearchParams();
    for (const key of FILTER_KEYS) {
      const value = searchParams.get(key);
      if (value) p.set(key, value);
    }
    return p.toString();
  }, [searchParams]);

  const load = useCallback(
    async (page: number, append: boolean) => {
      if (!append) setLoading(true);
      setError(false);
      try {
        const qs = buildQuery();
        const data = await api.get(`/users?${qs ? `${qs}&` : ''}limit=30&page=${page}`);
        setItems((prev) => (append ? [...prev, ...data.items] : data.items));
        setTotal(data.total);
        setHasMore(Boolean(data.hasMore));
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    },
    [buildQuery],
  );

  // Qualquer mudança nos filtros da URL refaz a busca a partir da página 1
  const paramsKey = searchParams.toString();
  useEffect(() => {
    pageRef.current = 1;
    load(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  const loadMore = () => {
    pageRef.current += 1;
    load(pageRef.current, true);
  };

  const updateParams = (changes: Partial<Filters>) => {
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(changes)) {
          if (value) p.set(key, value);
          else p.delete(key);
        }
        return p;
      },
      { replace: true },
    );
  };

  const applyFilters = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    updateParams({
      modality: String(fd.get('modality') || ''),
      level: String(fd.get('level') || ''),
      availability: String(fd.get('availability') || ''),
      gender: String(fd.get('gender') || ''),
      city: String(fd.get('city') || ''),
      state: String(fd.get('state') || ''),
      language: String(fd.get('language') || ''),
      nationality: String(fd.get('nationality') || ''),
      minAge: String(fd.get('minAge') || ''),
      maxAge: String(fd.get('maxAge') || ''),
      acceptsCoins: fd.get('acceptsCoins') ? 'true' : '',
      acceptsExchange: fd.get('acceptsExchange') ? 'true' : '',
    });
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    updateParams({
      modality: '',
      level: '',
      availability: '',
      gender: '',
      city: '',
      state: '',
      language: '',
      nationality: '',
      minAge: '',
      maxAge: '',
      acceptsCoins: '',
      acceptsExchange: '',
    });
    setFiltersOpen(false);
  };

  return (
    <>
      <h1 className="page-title">Buscar</h1>
      <div className="row gap-8 mb-16">
        <input
          className="input"
          id="search-q"
          placeholder="Habilidade, pessoa ou interesse..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn btn--secondary" id="filter-btn" onClick={() => setFiltersOpen(true)}>
          <i className="bi bi-sliders"></i>
        </button>
      </div>
      <div className="chips mb-16" id="cat-chips">
        <span
          className={`chip${filters.categoryId === '' ? ' selected' : ''}`}
          data-cat=""
          onClick={() => updateParams({ categoryId: '' })}
        >
          Todas
        </span>
        {categories.map((c) => (
          <span
            key={c.id}
            className={`chip${filters.categoryId === c.id ? ' selected' : ''}`}
            data-cat={c.id}
            onClick={() => updateParams({ categoryId: c.id })}
          >
            <Icon name={categoryIconName(c.slug)} /> {c.name}
          </span>
        ))}
      </div>
      <div id="search-list">
        {loading ? (
          <SkeletonCards count={2} />
        ) : error ? (
          <EmptyState icon="exclamation-triangle" title="Erro na busca" subtitle="Tente novamente." />
        ) : items.length === 0 ? (
          <EmptyState icon="search" title="Nada encontrado" subtitle="Tente outros termos ou ajuste os filtros." />
        ) : (
          <>
            <p className="muted mb-8">{total} resultado(s)</p>
            {items.map((u) => (
              <UserCard key={u.id} user={u} />
            ))}
            {hasMore && (
              <button className="btn btn--secondary btn--block" id="load-more" onClick={loadMore}>
                Carregar mais
              </button>
            )}
          </>
        )}
      </div>

      {filtersOpen && (
        <Sheet title="Filtros" onClose={() => setFiltersOpen(false)}>
          <form onSubmit={applyFilters}>
            <SelectFilter
              id="f-modality"
              name="modality"
              label="Modalidade"
              values={['ONLINE', 'IN_PERSON', 'BOTH']}
              labels={MODALITY_LABELS}
              current={filters.modality}
              anyLabel="Qualquer modalidade"
            />
            <SelectFilter
              id="f-level"
              name="level"
              label="Nível de experiência"
              values={['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']}
              labels={LEVEL_LABELS}
              current={filters.level}
              anyLabel="Qualquer nível"
            />
            <SelectFilter
              id="f-availability"
              name="availability"
              label="Disponibilidade"
              values={['MORNING', 'AFTERNOON', 'NIGHT', 'WEEKEND']}
              labels={AVAILABILITY_LABELS}
              current={filters.availability}
              anyLabel="Qualquer horário"
            />
            <SelectFilter
              id="f-gender"
              name="gender"
              label="Gênero"
              values={['MALE', 'FEMALE', 'OTHER', 'UNDISCLOSED']}
              labels={GENDER_LABELS}
              current={filters.gender}
              anyLabel="Qualquer gênero"
            />
            <div className="row gap-8">
              <div className="field full">
                <label className="field__label">Cidade</label>
                <input className="input" id="f-city" name="city" defaultValue={filters.city} placeholder="Ex.: São Paulo" />
              </div>
              <div className="field full">
                <label className="field__label">Estado</label>
                <input className="input" id="f-state" name="state" defaultValue={filters.state} placeholder="Ex.: SP" />
              </div>
            </div>
            <div className="row gap-8">
              <div className="field full">
                <label className="field__label">Idioma</label>
                <input className="input" id="f-language" name="language" defaultValue={filters.language} placeholder="Ex.: Inglês" />
              </div>
              <div className="field full">
                <label className="field__label">Nacionalidade</label>
                <input className="input" id="f-nationality" name="nationality" defaultValue={filters.nationality} placeholder="Ex.: Brasileira" />
              </div>
            </div>
            <div className="row gap-8">
              <div className="field full">
                <label className="field__label">Idade mínima</label>
                <input className="input" type="number" id="f-min-age" name="minAge" min={0} max={120} defaultValue={filters.minAge} />
              </div>
              <div className="field full">
                <label className="field__label">Idade máxima</label>
                <input className="input" type="number" id="f-max-age" name="maxAge" min={0} max={120} defaultValue={filters.maxAge} />
              </div>
            </div>
            <label className="row gap-8 mb-8">
              <input type="checkbox" id="f-coins" name="acceptsCoins" defaultChecked={filters.acceptsCoins === 'true'} /> Apenas
              quem aceita moedas
            </label>
            <label className="row gap-8 mb-16">
              <input type="checkbox" id="f-exchange" name="acceptsExchange" defaultChecked={filters.acceptsExchange === 'true'} />{' '}
              Apenas quem aceita troca direta
            </label>
            <div className="btn-row">
              <button className="btn btn--secondary full" type="button" id="f-clear" onClick={clearFilters}>
                Limpar
              </button>
              <button className="btn btn--primary full" type="submit" id="f-apply">
                Aplicar
              </button>
            </div>
          </form>
        </Sheet>
      )}
    </>
  );
}
