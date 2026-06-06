/** Feed principal: usuários ordenados por compatibilidade (match). */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserCard } from '../components/UserCard';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { SkeletonCards } from '../components/ui/SkeletonCards';
import { api } from '../services/api';

type FeedMode = 'all' | 'matches';

// Persiste o segmento escolhido entre navegações (paridade com a SPA antiga)
let lastMode: FeedMode = 'all';

export function Feed() {
  const [mode, setMode] = useState<FeedMode>(lastMode);
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async (m: FeedMode, p: number, append: boolean) => {
    if (!append) setLoading(true);
    setError(false);
    try {
      const data = await api.get(`/feed?limit=30&page=${p}${m === 'matches' ? '&onlyMatches=true' : ''}`);
      setItems((prev) => (append ? [...prev, ...data.items] : data.items));
      setHasMore(Boolean(data.hasMore));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    lastMode = mode;
    setPage(1);
    load(mode, 1, false);
  }, [mode, load]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    load(mode, next, true);
  };

  return (
    <>
      <h1 className="page-title">Para você</h1>
      <p className="page-subtitle">Pessoas compatíveis com o seu perfil</p>
      <div className="chips mb-16">
        <Link className="chip" to="/trends">
          <Icon name="fire" /> Tendências
        </Link>
        <Link className="chip" to="/ranking">
          <Icon name="trophy" /> Ranking
        </Link>
      </div>
      <div className="segmented" id="feed-seg">
        <button
          data-mode="all"
          className={mode === 'all' ? 'active' : ''}
          onClick={() => setMode('all')}
        >
          Todos
        </button>
        <button
          data-mode="matches"
          className={mode === 'matches' ? 'active' : ''}
          onClick={() => setMode('matches')}
        >
          Melhores matches
        </button>
      </div>
      <div id="feed-list">
        {loading ? (
          <SkeletonCards count={3} />
        ) : error ? (
          <EmptyState
            icon="exclamation-triangle"
            title="Erro ao carregar o feed"
            subtitle="Tente novamente mais tarde."
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon="puzzle"
            title="Nenhuma recomendação ainda"
            subtitle="Adicione habilidades ao seu perfil para melhorar os matches."
          />
        ) : (
          <>
            {items.map((u) => (
              <UserCard key={u.id} user={u} />
            ))}
            {hasMore && (
              <button className="btn btn--secondary btn--block" id="feed-more" onClick={loadMore}>
                Carregar mais
              </button>
            )}
          </>
        )}
      </div>
    </>
  );
}
