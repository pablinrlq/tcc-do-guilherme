/** Ranking de reputação: usuários mais bem avaliados e ativos. */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '../components/ui/Avatar';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { Spinner } from '../components/ui/Spinner';
import { Stars } from '../components/ui/Stars';
import { api } from '../services/api';

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export function Ranking() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/stats/ranking?limit=30')
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <EmptyState icon="exclamation-triangle" title="Erro ao carregar o ranking" />;
  if (!data) {
    return (
      <div className="row" style={{ justifyContent: 'center' }}>
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <h1 className="page-title">
        <Icon name="trophy" /> Ranking
      </h1>
      <p className="page-subtitle">Os membros mais bem avaliados e ativos da SkillEx</p>
      <div className="card">
        {data.ranking.length ? (
          data.ranking.map((u: any) => (
            <Link className="rank-item" to={`/profile/${u.id}`} key={u.id}>
              <div className="rank-item__badge">
                {MEDALS[u.position] || <span className="rank-pos">{u.position}</span>}
              </div>
              <Avatar user={u} size="md" />
              <div className="rank-item__body">
                <div className="rank-item__name">{u.name}</div>
                <div className="rank-item__meta">
                  {u.rating.count ? (
                    <>
                      <Stars rating={u.rating.average} /> {u.rating.average} ({u.rating.count})
                    </>
                  ) : (
                    <span className="muted">Sem avaliações</span>
                  )}
                </div>
                <div className="rank-item__meta">
                  <Icon name="arrow-left-right" /> {u.completedExchanges} troca(s) concluída(s)
                </div>
              </div>
              <div className="rank-item__score" title="Pontuação de reputação">
                {u.reputation}
              </div>
            </Link>
          ))
        ) : (
          <p className="muted">Ainda não há reputação suficiente para um ranking.</p>
        )}
      </div>
    </>
  );
}
