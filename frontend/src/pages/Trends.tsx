/** Página de tendências: habilidades populares, mais desejadas e salvar interesse. */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { Spinner } from '../components/ui/Spinner';
import { useToast } from '../contexts/ToastContext';
import { api } from '../services/api';
import { categoryIconName } from '../utils/format';

export function Trends() {
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.get('/stats/trends?limit=10'), api.get('/skills/me/saved')])
      .then(([trends, saved]) => {
        if (cancelled) return;
        setData(trends);
        setSavedIds(new Set(saved.items.map((s: any) => s.id)));
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleSave = async (id: string) => {
    const willSave = !savedIds.has(id);
    try {
      if (willSave) await api.post(`/skills/${id}/save`);
      else await api.del(`/skills/${id}/save`);
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (willSave) next.add(id);
        else next.delete(id);
        return next;
      });
      toast(willSave ? 'Habilidade salva' : 'Removida dos salvos', 'success');
    } catch {
      toast('Erro ao salvar', 'error');
    }
  };

  if (error) return <EmptyState icon="exclamation-triangle" title="Erro ao carregar tendências" />;
  if (!data) {
    return (
      <div className="row" style={{ justifyContent: 'center' }}>
        <Spinner />
      </div>
    );
  }

  const rankRow = (s: any) => {
    const saved = savedIds.has(s.id);
    return (
      <div className="request-item" key={s.id}>
        <div className="tx-item__icon">
          <Icon name={categoryIconName(s.categorySlug)} />
        </div>
        <div className="request-item__body">
          <div className="request-item__title">{s.name}</div>
          <div className="request-item__sub">
            {s.category || ''} · {s.teachers} ensinam · {s.learners} querem aprender
          </div>
        </div>
        <button
          className="icon-btn"
          data-save={s.id}
          title={saved ? 'Remover dos salvos' : 'Salvar interesse'}
          onClick={() => toggleSave(s.id)}
        >
          <Icon name={saved ? 'bookmark-fill' : 'bookmark'} />
        </button>
        <Link className="btn btn--ghost btn--sm" to={`/search?q=${encodeURIComponent(s.name)}`}>
          Ver
        </Link>
      </div>
    );
  };

  return (
    <>
      <h1 className="page-title">
        <Icon name="fire" /> Tendências
      </h1>
      <p className="page-subtitle">As habilidades mais movimentadas na SkillEx</p>

      <div className="section-title">
        <Icon name="star-fill" /> Mais populares
      </div>
      <div className="card">
        {data.popular.length ? data.popular.map(rankRow) : <p className="muted">Sem dados ainda.</p>}
      </div>

      <div className="section-title">
        <Icon name="bullseye" /> Mais desejadas para aprender
      </div>
      <div className="card">
        {data.mostWanted.length ? (
          data.mostWanted.map(rankRow)
        ) : (
          <p className="muted">Sem dados ainda.</p>
        )}
      </div>
    </>
  );
}
