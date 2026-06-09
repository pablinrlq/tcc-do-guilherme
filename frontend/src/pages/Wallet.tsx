/** Carteira de moedas: saldo, compra e histórico de transações. */
import { useCallback, useEffect, useState } from 'react';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { Sheet } from '../components/ui/Sheet';
import { Spinner } from '../components/ui/Spinner';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { api } from '../services/api';
import { TX_LABELS, formatDateTime, label } from '../utils/format';

const TX_ICONS: Record<string, string> = {
  PURCHASE: 'credit-card',
  EARNING: 'arrow-down-circle',
  SPEND: 'arrow-up-circle',
  LOCK: 'lock-fill',
  UNLOCK: 'unlock',
  REFUND: 'arrow-return-left',
  BONUS: 'gift',
};

export function Wallet() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState(false);
  const [buying, setBuying] = useState(false);
  const [amount, setAmount] = useState(0);

  const load = useCallback(async () => {
    try {
      setData(await api.get('/wallet/history?limit=50'));
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const confirmBuy = async () => {
    if (!amount || amount < 1) {
      toast('Informe um valor válido', 'error');
      return;
    }
    try {
      const { wallet } = await api.post('/wallet/purchase', { amount });
      if (user) setUser({ ...user, wallet });
      setBuying(false);
      setAmount(0);
      toast(`+${amount} moedas adicionadas!`, 'success');
      await load();
    } catch {
      toast('Erro ao adicionar moedas', 'error');
    }
  };

  if (error) return <EmptyState icon="exclamation-triangle" title="Erro ao carregar a carteira" />;
  if (!data) {
    return (
      <div className="row" style={{ justifyContent: 'center' }}>
        <Spinner />
      </div>
    );
  }

  const w = data.wallet;

  return (
    <>
      <h1 className="page-title">Carteira</h1>
      <div className="wallet-card">
        <div className="wallet-card__label">Saldo disponível</div>
        <div className="wallet-card__balance">
          <Icon name="coin" /> {w.balance}
        </div>
        {w.lockedBalance > 0 && (
          <div className="wallet-card__locked">
            <Icon name="lock-fill" /> {w.lockedBalance} reservadas em solicitações
          </div>
        )}
      </div>
      <button className="btn btn--primary btn--block mb-16" id="buy-btn" onClick={() => setBuying(true)}>
        <Icon name="plus-lg" /> Adicionar moedas
      </button>

      <div className="section-title">Histórico</div>
      <div className="card">
        {data.transactions.length ? (
          data.transactions.map((t: any) => {
            const cls = t.amount > 0 ? 'pos' : t.amount < 0 ? 'neg' : '';
            const sign = t.amount > 0 ? '+' : '';
            return (
              <div className="tx-item" key={t.id}>
                <div className="tx-item__icon">
                  <Icon name={TX_ICONS[t.type] || 'coin'} />
                </div>
                <div className="tx-item__body">
                  <div className="tx-item__title">{t.description || label(TX_LABELS, t.type)}</div>
                  <div className="tx-item__date">{formatDateTime(t.createdAt)}</div>
                </div>
                <div className={`tx-item__amount ${cls}`}>
                  {sign}
                  {t.amount} <Icon name="coin" />
                </div>
              </div>
            );
          })
        ) : (
          <p className="muted">Nenhuma transação ainda.</p>
        )}
      </div>
      <p className="muted text-center mt-16" style={{ fontSize: '.78rem' }}>
        <Icon name="lightbulb" /> O saque em dinheiro real será disponibilizado em versões futuras.
      </p>

      {buying && (
        <Sheet title="Adicionar moedas" onClose={() => setBuying(false)}>
          <p className="muted mb-16">Selecione um valor para recarregar (simulado).</p>
          <div className="chips mb-16" id="amount-chips">
            {[50, 100, 200, 500].map((v) => (
              <span
                key={v}
                className={`chip${amount === v ? ' selected' : ''}`}
                data-amt={v}
                onClick={() => setAmount(v)}
              >
                <Icon name="coin" /> {v}
              </span>
            ))}
          </div>
          <div className="field">
            <label className="field__label">Ou digite um valor</label>
            <input
              className="input"
              type="number"
              id="amt-input"
              min={1}
              placeholder="Quantidade"
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>
          <button className="btn btn--primary btn--block" id="confirm-buy" onClick={confirmBuy}>
            Confirmar recarga
          </button>
        </Sheet>
      )}
    </>
  );
}
