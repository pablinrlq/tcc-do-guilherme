/** Central de notificações. */
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { Spinner } from '../components/ui/Spinner';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { timeAgo } from '../utils/format';

const ICONS: Record<string, string> = {
  REQUEST_RECEIVED: 'envelope',
  REQUEST_ACCEPTED: 'check-circle-fill',
  REQUEST_REJECTED: 'x-circle-fill',
  REQUEST_CANCELLED: 'slash-circle',
  REQUEST_COMPLETED: 'trophy',
  NEW_MESSAGE: 'chat-dots',
  NEW_MATCH: 'lightning-charge-fill',
  REVIEW_RECEIVED: 'star-fill',
  COINS_RECEIVED: 'coin',
};

export function Notifications() {
  const navigate = useNavigate();
  const { refreshUnread } = useAuth();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await api.get('/notifications?limit=50'));
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const readAll = async () => {
    await api.post('/notifications/read-all');
    refreshUnread();
    load();
  };

  const open = async (n: any) => {
    try {
      await api.post(`/notifications/${n.id}/read`);
      refreshUnread();
    } catch {
      /* ignore */
    }
    if (n.link) navigate(n.link);
  };

  if (error) return <EmptyState icon="exclamation-triangle" title="Erro ao carregar notificações" />;
  if (!data) {
    return (
      <div className="row" style={{ justifyContent: 'center' }}>
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <div className="row-between mb-16">
        <h1 className="page-title" style={{ margin: 0 }}>
          Notificações
        </h1>
        {data.unread > 0 && (
          <button className="btn btn--ghost btn--sm" id="read-all" onClick={readAll}>
            Marcar todas
          </button>
        )}
      </div>
      <div id="notif-list">
        {data.items.length === 0 ? (
          <EmptyState icon="bell" title="Tudo em dia!" subtitle="Você não tem notificações." />
        ) : (
          data.items.map((n: any) => (
            <div
              className="request-item"
              key={n.id}
              data-notif={n.id}
              data-link={n.link || ''}
              style={n.read ? { opacity: 0.6 } : undefined}
              onClick={() => open(n)}
            >
              <div className="tx-item__icon">
                <Icon name={ICONS[n.type] || 'bell'} />
              </div>
              <div className="request-item__body">
                <div className="request-item__title">{n.title}</div>
                <div className="request-item__sub">
                  {n.message} · {timeAgo(n.createdAt)}
                </div>
              </div>
              {!n.read && (
                <span className="badge-dot" style={{ position: 'static' }}>
                  •
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}
