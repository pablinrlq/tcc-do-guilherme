/** Criação de uma solicitação de troca ou aula paga. */
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Avatar } from '../components/ui/Avatar';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { Spinner } from '../components/ui/Spinner';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { api } from '../services/api';

type RequestType = 'EXCHANGE' | 'COIN';

export function RequestNew() {
  const navigate = useNavigate();
  const { id: targetId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user: me } = useAuth();
  const { toast } = useToast();

  const wantCoin = searchParams.get('mode') === 'coin'; // botão "Comprar aula" do card
  const [target, setTarget] = useState<any>(null);
  const [mySkills, setMySkills] = useState<any>(null);
  const [error, setError] = useState(false);
  const [type, setType] = useState<RequestType>(wantCoin ? 'COIN' : 'EXCHANGE');
  const [requestedSkillId, setRequestedSkillId] = useState('');
  const [coinAmount, setCoinAmount] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.get(`/users/${targetId}`), api.get('/skills/me')])
      .then(([{ user: t }, skills]) => {
        if (cancelled) return;
        setTarget(t);
        setMySkills(skills);
        const first = (t.teachingSkills || [])[0];
        if (first) {
          setRequestedSkillId(first.skill.id);
          setCoinAmount(first.coinPrice ? String(first.coinPrice) : '');
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [targetId]);

  const teach = target?.teachingSkills || [];
  const myTeach = mySkills?.teachingSkills || [];
  const balance = me?.wallet?.balance ?? 0;

  if (error) return <EmptyState icon="emoji-frown" title="Não foi possível carregar" />;
  if (!target || !mySkills) {
    return (
      <div className="row" style={{ justifyContent: 'center' }}>
        <Spinner />
      </div>
    );
  }
  if (!teach.length) {
    return (
      <EmptyState
        icon="patch-question"
        title="Sem habilidades"
        subtitle="Este usuário não cadastrou nada para ensinar ainda."
      />
    );
  }

  const onSkillChange = (skillId: string) => {
    setRequestedSkillId(skillId);
    const opt = teach.find((s: any) => s.skill.id === skillId);
    setCoinAmount(opt?.coinPrice ? String(opt.coinPrice) : '');
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body: any = {
      recipientId: targetId,
      requestedSkillId,
      type,
      message: fd.get('message') || undefined,
      suggestedDate: fd.get('suggestedDate') || undefined,
    };
    if (type === 'EXCHANGE') {
      if (!myTeach.length) {
        toast('Cadastre uma habilidade para oferecer', 'error');
        return;
      }
      body.offeredSkillId = fd.get('offeredSkillId');
    } else {
      body.coinAmount = Number(coinAmount);
      if (!body.coinAmount) {
        toast('Informe a quantidade de moedas', 'error');
        return;
      }
    }
    setSending(true);
    try {
      const { request } = await api.post('/requests', body);
      toast('Solicitação enviada!', 'success');
      navigate(`/requests/${request.id}`);
    } catch (err: any) {
      toast(err?.message || 'Erro ao enviar', 'error');
      setSending(false);
    }
  };

  return (
    <>
      <button className="btn btn--ghost btn--sm mb-8" onClick={() => history.back()}>
        <Icon name="arrow-left" /> Voltar
      </button>
      <div className="row gap-12 mb-16">
        <Avatar user={target} size="md" />
        <div>
          <div style={{ fontWeight: 700 }}>{target.name}</div>
          <div className="muted" style={{ fontSize: '.84rem' }}>
            Nova solicitação
          </div>
        </div>
      </div>

      <form id="req-form" className="card" onSubmit={onSubmit}>
        <div className="field">
          <label className="field__label">O que você quer aprender?</label>
          <select
            className="select"
            name="requestedSkillId"
            id="req-skill"
            value={requestedSkillId}
            onChange={(e) => onSkillChange(e.target.value)}
          >
            {teach.map((s: any) => (
              <option key={s.skill.id} value={s.skill.id}>
                {s.skill.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="field__label">Forma de troca</label>
          <div className="segmented" id="type-seg" style={{ marginBottom: 0 }}>
            <button
              type="button"
              data-type="EXCHANGE"
              className={type === 'EXCHANGE' ? 'active' : ''}
              onClick={() => setType('EXCHANGE')}
            >
              <Icon name="arrow-left-right" /> Troca
            </button>
            <button
              type="button"
              data-type="COIN"
              className={type === 'COIN' ? 'active' : ''}
              onClick={() => setType('COIN')}
            >
              <Icon name="coin" /> Pagar com moedas
            </button>
          </div>
        </div>

        <div className={`field${type === 'EXCHANGE' ? '' : ' hidden'}`} id="exchange-box">
          <label className="field__label">Habilidade que você oferece</label>
          {myTeach.length ? (
            <select className="select" name="offeredSkillId">
              {myTeach.map((s: any) => (
                <option key={s.skill.id} value={s.skill.id}>
                  {s.skill.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="field__hint">
              Você não tem habilidades cadastradas. <Link to="/skills">Adicione uma</Link> ou use
              moedas.
            </p>
          )}
        </div>

        <div className={`field${type === 'COIN' ? '' : ' hidden'}`} id="coin-box">
          <label className="field__label">Quantidade de moedas</label>
          <input
            className="input"
            type="number"
            name="coinAmount"
            min={1}
            value={coinAmount}
            onChange={(e) => setCoinAmount(e.target.value)}
          />
          <div className="field__hint">
            Seu saldo disponível: <Icon name="coin" /> {balance}
          </div>
        </div>

        <div className="field">
          <label className="field__label">Mensagem</label>
          <textarea
            className="textarea"
            name="message"
            placeholder="Apresente-se e proponha um horário..."
          ></textarea>
        </div>
        <div className="field">
          <label className="field__label">Data sugerida (opcional)</label>
          <input className="input" type="date" name="suggestedDate" />
        </div>

        <button className="btn btn--primary btn--block" type="submit" disabled={sending}>
          {sending ? 'Enviando...' : 'Enviar solicitação'}
        </button>
      </form>
    </>
  );
}
