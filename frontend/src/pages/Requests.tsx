/** Lista de solicitações de troca/aula (recebidas e enviadas). */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '../components/ui/Avatar';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { Spinner } from '../components/ui/Spinner';
import { api } from '../services/api';
import { STATUS_LABELS, label, timeAgo } from '../utils/format';

type Box = 'received' | 'sent';

// Persiste a aba escolhida entre navegações (paridade com a SPA antiga)
let lastBox: Box = 'received';

export function Requests() {
  const [box, setBox] = useState<Box>(lastBox);
  const [items, setItems] = useState<any[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    lastBox = box;
    let cancelled = false;
    setItems(null);
    setError(false);
    api
      .get(`/requests?box=${box}`)
      .then((data) => {
        if (!cancelled) setItems(data.items);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [box]);

  return (
    <>
      <h1 className="page-title">Trocas e aulas</h1>
      <div className="segmented" id="req-seg">
        <button
          data-box="received"
          className={box === 'received' ? 'active' : ''}
          onClick={() => setBox('received')}
        >
          Recebidas
        </button>
        <button
          data-box="sent"
          className={box === 'sent' ? 'active' : ''}
          onClick={() => setBox('sent')}
        >
          Enviadas
        </button>
      </div>
      <div id="req-list">
        {error ? (
          <EmptyState icon="exclamation-triangle" title="Erro ao carregar" />
        ) : items === null ? (
          <Spinner />
        ) : items.length === 0 ? (
          <EmptyState
            icon="inbox"
            title="Nenhuma solicitação"
            subtitle={
              box === 'received'
                ? 'Você ainda não recebeu solicitações.'
                : 'Explore o feed e proponha uma troca!'
            }
          />
        ) : (
          items.map((r) => (
            <Link className="request-item" to={`/requests/${r.id}`} key={r.id}>
              <Avatar user={r.otherUser} size="sm" />
              <div className="request-item__body">
                <div className="request-item__title">{r.otherUser?.name}</div>
                <div className="request-item__sub">
                  {r.requestedSkill?.name || ''} ·{' '}
                  {r.type === 'COIN' ? (
                    <>
                      Aula · <Icon name="coin" /> {r.coinAmount}
                    </>
                  ) : (
                    'Troca de habilidades'
                  )}{' '}
                  · {timeAgo(r.updatedAt)}
                </div>
              </div>
              <span className={`status-pill status-pill--${r.status.toLowerCase()}`}>
                {label(STATUS_LABELS, r.status)}
              </span>
            </Link>
          ))
        )}
      </div>
    </>
  );
}
