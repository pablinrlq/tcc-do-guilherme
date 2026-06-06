/** Detalhe da solicitação: status, histórico, chat e avaliação. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Avatar } from '../components/ui/Avatar';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { Spinner } from '../components/ui/Spinner';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useRealtime, useRequestRoom } from '../hooks/useRealtime';
import { api } from '../services/api';
import { STATUS_LABELS, formatDateTime, label, timeAgo } from '../utils/format';

export function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const { user: me, refreshUnread } = useAuth();
  const { toast, confirm } = useToast();

  const [r, setR] = useState<any>(null);
  const [error, setError] = useState(false);
  const [messages, setMessages] = useState<any[] | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);

  const reload = useCallback(async () => {
    try {
      setR((await api.get(`/requests/${id}`)).request);
      setError(false);
    } catch {
      setError(true);
    }
  }, [id]);

  const refreshChatMessages = useCallback(async () => {
    try {
      const data = await api.get(`/requests/${id}/messages`);
      setMessages(data.items);
    } catch {
      setMessages([]);
    }
  }, [id]);

  useEffect(() => {
    reload();
  }, [reload]);

  const chatOpen = r && (r.status === 'ACCEPTED' || r.status === 'COMPLETED');

  useEffect(() => {
    if (chatOpen) refreshChatMessages();
  }, [chatOpen, refreshChatMessages]);

  // Chat sempre rolado para a última mensagem
  useEffect(() => {
    const chat = chatRef.current;
    if (chat) chat.scrollTop = chat.scrollHeight;
  }, [messages]);

  // Tempo real: chat ao vivo e atualização de status sem recarregar.
  // O cleanup dos hooks descadastra os handlers quando a página desmonta.
  useRequestRoom(id);
  useRealtime('chat:message', (m: any) => {
    if (m?.sender?.id === me?.id) return; // o próprio envio já foi exibido
    setMessages((prev) => [...(prev ?? []), { ...m, mine: false }]);
    refreshUnread();
  });
  useRealtime('request:updated', (p: any) => {
    if (p?.requestId === id) reload();
  });
  // Join confirmado pelo servidor: ressincroniza o chat via REST para não
  // perder mensagens enviadas antes de a room ficar ativa (ou em reconexões).
  useRealtime('request:joined', (joinedId: any) => {
    if (joinedId === id && chatOpen) refreshChatMessages();
  });

  if (error) return <EmptyState icon="emoji-frown" title="Solicitação não encontrada" />;
  if (!r) {
    return (
      <div className="row" style={{ justifyContent: 'center' }}>
        <Spinner />
      </div>
    );
  }

  const doAction = async (act: string) => {
    const confirmMsgs: Record<string, string> = {
      reject: 'Recusar esta solicitação?',
      cancel: 'Cancelar esta solicitação?',
      complete: 'Confirmar que a troca/aula foi concluída?',
    };
    if (confirmMsgs[act] && !(await confirm(confirmMsgs[act]))) return;
    try {
      await api.post(`/requests/${id}/${act}`);
      toast('Feito!', 'success');
      refreshUnread();
      reload();
    } catch (err: any) {
      toast(err?.message || 'Erro na ação', 'error');
    }
  };

  const sendReview = async () => {
    try {
      await api.post('/reviews', { requestId: id, rating, comment: comment || undefined });
      toast('Avaliação enviada!', 'success');
      reload();
    } catch (err: any) {
      toast(err?.message || 'Erro ao avaliar', 'error');
    }
  };

  const sendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.querySelector('input') as HTMLInputElement;
    const content = input.value.trim();
    if (!content) return;
    input.value = '';
    try {
      const { message } = await api.post(`/requests/${id}/messages`, { content });
      setMessages((prev) => [...(prev ?? []), message]);
    } catch (err: any) {
      toast(err?.message || 'Erro ao enviar', 'error');
    }
  };

  const actionButtons: Array<{ act: string; cls: string; content: React.ReactNode }> = [];
  if (r.role === 'RECIPIENT' && r.status === 'PENDING') {
    actionButtons.push({
      act: 'accept',
      cls: 'btn btn--primary full',
      content: (
        <>
          <Icon name="check-lg" /> Aceitar
        </>
      ),
    });
    actionButtons.push({
      act: 'reject',
      cls: 'btn btn--danger full',
      content: (
        <>
          <Icon name="x-lg" /> Recusar
        </>
      ),
    });
  }
  if (r.role === 'REQUESTER' && (r.status === 'PENDING' || r.status === 'ACCEPTED')) {
    actionButtons.push({ act: 'cancel', cls: 'btn btn--outline full', content: 'Cancelar' });
  }
  if (r.status === 'ACCEPTED') {
    actionButtons.push({
      act: 'complete',
      cls: 'btn btn--success full',
      content: (
        <>
          <Icon name="check-circle" /> Marcar como concluída
        </>
      ),
    });
  }

  return (
    <>
      <Link className="btn btn--ghost btn--sm mb-8" to="/requests">
        <Icon name="arrow-left" /> Solicitações
      </Link>

      <div className="card mb-16">
        <div className="row gap-12 mb-8">
          <Avatar user={r.otherUser} size="md" />
          <div className="full">
            <div className="row-between">
              <strong>{r.otherUser?.name}</strong>
              <span className={`status-pill status-pill--${r.status.toLowerCase()}`}>
                {label(STATUS_LABELS, r.status)}
              </span>
            </div>
            <div className="muted" style={{ fontSize: '.82rem' }}>
              {timeAgo(r.createdAt)}
            </div>
          </div>
        </div>
        <p style={{ fontSize: '.92rem' }}>
          <strong>{r.requestedSkill?.name}</strong>
        </p>
        <p className="muted" style={{ fontSize: '.86rem' }}>
          {r.type === 'COIN' ? (
            <>
              Aula paga · <Icon name="coin" /> {r.coinAmount} moedas
            </>
          ) : (
            <>
              Troca: você {r.role === 'REQUESTER' ? 'oferece' : 'recebe'}{' '}
              <strong>{r.offeredSkill?.name || '—'}</strong>
            </>
          )}
        </p>
        {r.message ? (
          <p style={{ marginTop: 8, fontSize: '.9rem' }}>
            <Icon name="chat-left-text" /> {r.message}
          </p>
        ) : null}
        {r.suggestedDate ? (
          <p className="muted" style={{ fontSize: '.82rem', marginTop: 4 }}>
            <Icon name="calendar-event" /> Data sugerida: {formatDateTime(r.suggestedDate)}
          </p>
        ) : null}
      </div>

      <div id="actions">
        {actionButtons.length > 0 && (
          <div className="btn-row mb-16">
            {actionButtons.map((b) => (
              <button key={b.act} className={b.cls} data-act={b.act} onClick={() => doAction(b.act)}>
                {b.content}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="section-title">Histórico</div>
      <div className="timeline">
        {(r.events || []).map((e: any, i: number) => (
          <div className="timeline__item" key={i}>
            <div>
              {label(STATUS_LABELS, e.status)}
              {e.note ? ` — ${e.note}` : ''}
            </div>
            <div className="timeline__date">{formatDateTime(e.createdAt)}</div>
          </div>
        ))}
      </div>

      {r.canReview && (
        <>
          <div className="section-title">Avaliar experiência</div>
          <div className="card" id="review-card">
            <div className="stars stars--input" id="star-input" data-rating={rating}>
              {[1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  data-v={i}
                  style={{ opacity: i <= rating ? 1 : 0.3 }}
                  onClick={() => setRating(i)}
                >
                  <i className="bi bi-star-fill"></i>
                </span>
              ))}
            </div>
            <textarea
              className="textarea mt-8"
              id="review-comment"
              placeholder="Conte como foi a experiência..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            ></textarea>
            <button className="btn btn--primary btn--block mt-8" id="send-review" onClick={sendReview}>
              Enviar avaliação
            </button>
          </div>
        </>
      )}

      {chatOpen && (
        <>
          <div className="section-title">Conversa</div>
          <div className="chat" id="chat" ref={chatRef}>
            {messages === null ? (
              <Spinner />
            ) : messages.length === 0 ? (
              <p className="muted text-center">
                <Icon name="chat-dots" /> Inicie a conversa
              </p>
            ) : (
              messages.map((m: any, i: number) => (
                <div className={`msg msg--${m.mine ? 'out' : 'in'}`} key={m.id ?? i}>
                  {m.content}
                  <span className="msg__time">{timeAgo(m.createdAt)}</span>
                </div>
              ))
            )}
          </div>
          <form className="chat-input" id="chat-form" onSubmit={sendMessage}>
            <input className="input" name="content" placeholder="Escreva uma mensagem..." autoComplete="off" />
            <button className="btn btn--primary" type="submit">
              <Icon name="send" />
            </button>
          </form>
        </>
      )}
    </>
  );
}
