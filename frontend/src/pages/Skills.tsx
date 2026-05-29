/** Gerenciamento das habilidades que o usuário ensina e deseja aprender. */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { Sheet } from '../components/ui/Sheet';
import { Spinner } from '../components/ui/Spinner';
import { useToast } from '../contexts/ToastContext';
import { api } from '../services/api';
import { LEARNING_LEVEL_LABELS, LEVEL_LABELS, MODALITY_LABELS, label } from '../utils/format';

const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
const LEARN_LEVELS = ['NONE', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
const MODALITIES = ['BOTH', 'ONLINE', 'IN_PERSON'];

function LevelSelect({
  name,
  opts,
  labels,
}: {
  name: string;
  opts: string[];
  labels: Record<string, string>;
}) {
  return (
    <select className="select" name={name}>
      {opts.map((o) => (
        <option key={o} value={o}>
          {labels[o]}
        </option>
      ))}
    </select>
  );
}

export function Skills() {
  const { toast, confirm } = useToast();
  const [data, setData] = useState<any>(null);
  const [saved, setSaved] = useState<any>(null);
  const [suggested, setSuggested] = useState<any>(null);
  const [error, setError] = useState(false);
  const [form, setForm] = useState<null | { kind: 'teach' | 'learn'; prefill?: string }>(null);

  const load = useCallback(async () => {
    try {
      const [d, s, sug] = await Promise.all([
        api.get('/skills/me'),
        api.get('/skills/me/saved'),
        api.get('/skills/suggestions'),
      ]);
      setData(d);
      setSaved(s);
      setSuggested(sug);
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <EmptyState icon="exclamation-triangle" title="Erro ao carregar habilidades" />;
  if (!data) {
    return (
      <div className="row" style={{ justifyContent: 'center' }}>
        <Spinner />
      </div>
    );
  }

  const teaching = data.teachingSkills || [];
  const learning = data.learningSkills || [];
  const savedItems = saved?.items || [];
  const suggestions = suggested?.items || [];

  const removeSkill = async (s: any, kind: 'teach' | 'learn') => {
    if (!(await confirm('Remover esta habilidade?', 'Remover'))) return;
    try {
      await api.del(`/skills/${kind === 'teach' ? 'teaching' : 'learning'}/${s.id}`);
      toast('Habilidade removida', 'success');
      await load();
    } catch {
      toast('Erro ao remover', 'error');
    }
  };

  const unsave = async (id: string) => {
    try {
      await api.del(`/skills/${id}/save`);
      toast('Removida dos salvos', 'success');
      await load();
    } catch {
      toast('Erro ao remover', 'error');
    }
  };

  const submitTeach = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await api.post('/skills/teaching', {
        skillName: fd.get('skillName'),
        level: fd.get('level'),
        modality: fd.get('modality'),
        description: fd.get('description') || undefined,
        experienceYears: fd.get('experienceYears') ? Number(fd.get('experienceYears')) : undefined,
        coinPrice: fd.get('coinPrice') ? Number(fd.get('coinPrice')) : undefined,
      });
      setForm(null);
      toast('Habilidade adicionada!', 'success');
      await load();
    } catch (err: any) {
      toast(err?.message || 'Erro ao adicionar', 'error');
    }
  };

  const submitLearn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await api.post('/skills/learning', {
        skillName: fd.get('skillName'),
        currentLevel: fd.get('currentLevel'),
        modality: fd.get('modality'),
        goal: fd.get('goal') || undefined,
      });
      setForm(null);
      toast('Habilidade adicionada!', 'success');
      await load();
    } catch (err: any) {
      toast(err?.message || 'Erro ao adicionar', 'error');
    }
  };

  const skillRow = (s: any, kind: 'teach' | 'learn') => (
    <div className="request-item" key={s.id}>
      <div className="request-item__body">
        <div className="request-item__title">{s.skill?.name}</div>
        <div className="request-item__sub">
          {kind === 'teach' ? (
            <>
              {label(LEVEL_LABELS, s.level)} · {label(MODALITY_LABELS, s.modality)}
              {s.coinPrice ? (
                <>
                  {' '}
                  · <Icon name="coin" /> {s.coinPrice}
                </>
              ) : null}
            </>
          ) : (
            <>
              Nível: {label(LEARNING_LEVEL_LABELS, s.currentLevel)} ·{' '}
              {label(MODALITY_LABELS, s.modality)}
            </>
          )}
        </div>
      </div>
      <button
        className="icon-btn"
        data-del={s.id}
        data-kind={kind}
        title="Remover"
        onClick={() => removeSkill(s, kind)}
      >
        <Icon name="trash" />
      </button>
    </div>
  );

  return (
    <>
      <h1 className="page-title">Minhas habilidades</h1>
      <p className="page-subtitle">Gerencie o que você ensina e o que deseja aprender</p>

      <div className="section-title">
        <Icon name="mortarboard-fill" /> Ensino{' '}
        <button className="btn btn--ghost btn--sm" id="add-teach" onClick={() => setForm({ kind: 'teach' })}>
          <Icon name="plus-lg" /> Adicionar
        </button>
      </div>
      <div id="teach-list">
        {teaching.length ? (
          teaching.map((s: any) => skillRow(s, 'teach'))
        ) : (
          <p className="muted">Você ainda não cadastrou habilidades para ensinar.</p>
        )}
      </div>

      <div className="section-title">
        <Icon name="book-half" /> Quero aprender{' '}
        <button className="btn btn--ghost btn--sm" id="add-learn" onClick={() => setForm({ kind: 'learn' })}>
          <Icon name="plus-lg" /> Adicionar
        </button>
      </div>
      <div id="learn-list">
        {learning.length ? (
          learning.map((s: any) => skillRow(s, 'learn'))
        ) : (
          <p className="muted">Você ainda não cadastrou habilidades para aprender.</p>
        )}
      </div>

      {suggestions.length > 0 && (
        <>
          <div className="section-title">
            <Icon name="stars" /> Sugestões para você
          </div>
          <p className="muted mb-8" style={{ fontSize: '.85rem' }}>
            Habilidades relacionadas ao que você já cadastrou. Toque para adicionar aos seus
            interesses.
          </p>
          <div className="chips mb-8">
            {suggestions.map((s: any) => (
              <button
                className="chip"
                key={s.name}
                data-suggest={s.name}
                onClick={() => setForm({ kind: 'learn', prefill: s.name })}
              >
                <Icon name="plus-lg" /> {s.name}
              </button>
            ))}
          </div>
        </>
      )}

      {savedItems.length > 0 && (
        <>
          <div className="section-title">
            <Icon name="bookmark-fill" /> Habilidades salvas
          </div>
          <div id="saved-list">
            {savedItems.map((s: any) => (
              <div className="request-item" key={s.id}>
                <div className="request-item__body">
                  <div className="request-item__title">{s.name}</div>
                  <div className="request-item__sub">
                    {s.category?.name || ''} · {s.teachersCount} ensinam · {s.learnersCount} querem
                    aprender
                  </div>
                </div>
                <Link className="btn btn--ghost btn--sm" to={`/search?q=${encodeURIComponent(s.name)}`}>
                  Buscar
                </Link>
                <button className="icon-btn" data-unsave={s.id} title="Remover dos salvos" onClick={() => unsave(s.id)}>
                  <Icon name="bookmark-x" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {form?.kind === 'teach' && (
        <Sheet title="Adicionar habilidade que ensino" onClose={() => setForm(null)}>
          <form id="teach-form" onSubmit={submitTeach}>
            <div className="field">
              <label className="field__label">Habilidade</label>
              <input className="input" name="skillName" placeholder="Ex.: Violino, Inglês, Excel" required />
            </div>
            <div className="row gap-8">
              <div className="field full">
                <label className="field__label">Nível</label>
                <LevelSelect name="level" opts={LEVELS} labels={LEVEL_LABELS} />
              </div>
              <div className="field full">
                <label className="field__label">Modalidade</label>
                <LevelSelect name="modality" opts={MODALITIES} labels={MODALITY_LABELS} />
              </div>
            </div>
            <div className="field">
              <label className="field__label">Descrição</label>
              <textarea
                className="textarea"
                name="description"
                placeholder="O que você ensina nessa habilidade?"
              ></textarea>
            </div>
            <div className="row gap-8">
              <div className="field full">
                <label className="field__label">Anos de experiência</label>
                <input className="input" type="number" name="experienceYears" min={0} max={80} />
              </div>
              <div className="field full">
                <label className="field__label">Preço em moedas</label>
                <input className="input" type="number" name="coinPrice" min={0} placeholder="Opcional" />
              </div>
            </div>
            <button className="btn btn--primary btn--block" type="submit">
              Adicionar
            </button>
          </form>
        </Sheet>
      )}

      {form?.kind === 'learn' && (
        <Sheet title="Adicionar habilidade que quero aprender" onClose={() => setForm(null)}>
          <form id="learn-form" onSubmit={submitLearn}>
            <div className="field">
              <label className="field__label">Habilidade</label>
              <input
                className="input"
                name="skillName"
                defaultValue={form.prefill || ''}
                placeholder="Ex.: Fotografia, Espanhol"
                required
              />
            </div>
            <div className="row gap-8">
              <div className="field full">
                <label className="field__label">Nível atual</label>
                <LevelSelect name="currentLevel" opts={LEARN_LEVELS} labels={LEARNING_LEVEL_LABELS} />
              </div>
              <div className="field full">
                <label className="field__label">Modalidade</label>
                <LevelSelect name="modality" opts={MODALITIES} labels={MODALITY_LABELS} />
              </div>
            </div>
            <div className="field">
              <label className="field__label">Objetivo</label>
              <textarea className="textarea" name="goal" placeholder="O que você quer alcançar?"></textarea>
            </div>
            <button className="btn btn--primary btn--block" type="submit">
              Adicionar
            </button>
          </form>
        </Sheet>
      )}
    </>
  );
}
