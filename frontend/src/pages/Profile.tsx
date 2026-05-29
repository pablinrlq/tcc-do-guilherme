/** Perfil do usuário (próprio e de terceiros), com match, habilidades e avaliações. */
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Avatar } from '../components/ui/Avatar';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { MatchBadge } from '../components/ui/MatchBadge';
import { ScoreRing } from '../components/ui/ScoreRing';
import { SkillBadge } from '../components/ui/SkillBadge';
import { Spinner } from '../components/ui/Spinner';
import { Stars } from '../components/ui/Stars';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { api } from '../services/api';
import { ReportModal } from '../components/ui/ReportModal';
import {
  LEARNING_LEVEL_LABELS,
  LEVEL_LABELS,
  MODALITY_LABELS,
  label,
  timeAgo,
} from '../utils/format';

function TeachingCard({ s }: { s: any }) {
  return (
    <div className="card">
      <div className="row-between">
        <strong>{s.skill?.name}</strong>
        {s.coinPrice ? (
          <span className="skill-badge">
            <Icon name="coin" /> {s.coinPrice}
          </span>
        ) : null}
      </div>
      <div className="muted" style={{ fontSize: '.82rem', marginTop: 2 }}>
        {label(LEVEL_LABELS, s.level)} · {label(MODALITY_LABELS, s.modality)}
        {s.experienceYears ? ` · ${s.experienceYears} ano(s)` : ''}
      </div>
      {s.description ? <p style={{ fontSize: '.88rem', marginTop: 6 }}>{s.description}</p> : null}
      {s.tags?.length ? (
        <div className="tag-list mt-8">
          {s.tags.map((t: string) => (
            <SkillBadge key={t} name={t} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function LearningCard({ s }: { s: any }) {
  return (
    <div className="card">
      <strong>{s.skill?.name}</strong>
      <div className="muted" style={{ fontSize: '.82rem', marginTop: 2 }}>
        Nível atual: {label(LEARNING_LEVEL_LABELS, s.currentLevel)} ·{' '}
        {label(MODALITY_LABELS, s.modality)}
      </div>
      {s.goal ? (
        <p style={{ fontSize: '.88rem', marginTop: 6 }}>
          <Icon name="bullseye" /> {s.goal}
        </p>
      ) : null}
    </div>
  );
}

export function Profile() {
  const { id } = useParams<{ id: string }>();
  const { user: me, isAdmin, logout } = useAuth();
  const { toast, confirm } = useToast();
  const targetId = id === 'me' ? me!.id : id!;
  const isOwn = targetId === me?.id;

  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState(false);
  const [fav, setFav] = useState(false);
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setUser(null);
    setError(false);
    api
      .get(`/users/${targetId}`)
      .then((res) => {
        if (cancelled) return;
        setUser(res.user);
        setFav(Boolean(res.user.isFavorite));
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [targetId]);

  if (error) return <EmptyState icon="emoji-frown" title="Perfil não encontrado" />;
  if (!user) {
    return (
      <div className="row" style={{ justifyContent: 'center' }}>
        <Spinner />
      </div>
    );
  }

  const match = user.match;
  const teaching = user.teachingSkills || [];
  const learning = user.learningSkills || [];

  const onLogout = async () => {
    if (await confirm('Deseja sair da sua conta?', 'Sair')) logout();
  };

  const toggleFav = async () => {
    try {
      if (fav) await api.del(`/users/${user.id}/favorite`);
      else await api.post(`/users/${user.id}/favorite`);
      setFav(!fav);
      toast(!fav ? 'Adicionado aos favoritos' : 'Removido dos favoritos', 'success');
    } catch {
      toast('Erro ao favoritar', 'error');
    }
  };

  return (
    <>
      {!isOwn && (
        <button className="btn btn--ghost btn--sm mb-8" onClick={() => history.back()}>
          <Icon name="arrow-left" /> Voltar
        </button>
      )}
      <div className="profile-header">
        <Avatar user={user} size="lg" />
        <div className="profile-header__name">{user.name}</div>
        <div className="profile-header__meta">
          {user.city ? (
            <>
              <Icon name="geo-alt-fill" /> {user.city}
              {user.state ? '/' + user.state : ''}
            </>
          ) : null}
        </div>
        {user.rating?.count ? (
          <div>
            <Stars rating={user.rating.average} /> <strong>{user.rating.average}</strong>{' '}
            <span className="muted">({user.rating.count})</span>
          </div>
        ) : (
          <div className="muted">Ainda sem avaliações</div>
        )}
        {user.bio ? (
          <p className="muted" style={{ maxWidth: 340 }}>
            {user.bio}
          </p>
        ) : null}

        <div className="profile-header__stats">
          <div className="stat">
            <div className="stat__value">{user.completedExchanges ?? 0}</div>
            <div className="stat__label">Trocas</div>
          </div>
          <div className="stat">
            <div className="stat__value">{teaching.length}</div>
            <div className="stat__label">Ensina</div>
          </div>
          <div className="stat">
            <div className="stat__value">{learning.length}</div>
            <div className="stat__label">Aprende</div>
          </div>
        </div>
      </div>

      {!isOwn && match && (
        <div className="card mb-16">
          <div className="row-between mb-8">
            <strong>Compatibilidade</strong>
            <ScoreRing score={match.score} />
          </div>
          <div className="row wrap gap-8 mb-8">
            <MatchBadge match={match} />
          </div>
          {match.skillsTheyTeachYouWant?.length ? (
            <p style={{ fontSize: '.85rem' }}>
              <strong>{user.name}</strong> pode te ensinar:{' '}
              {match.skillsTheyTeachYouWant.map((s: string) => (
                <SkillBadge key={s} name={s} kind="learn" />
              ))}
            </p>
          ) : null}
          {match.skillsYouTeachTheyWant?.length ? (
            <p style={{ fontSize: '.85rem', marginTop: 6 }}>
              Você pode ensinar:{' '}
              {match.skillsYouTeachTheyWant.map((s: string) => (
                <SkillBadge key={s} name={s} kind="teach" />
              ))}
            </p>
          ) : null}
        </div>
      )}

      <div id="profile-actions" className="btn-row mb-16">
        {isOwn ? (
          <>
            <Link className="btn btn--primary" to="/profile/edit">
              <Icon name="pencil-square" /> Editar perfil
            </Link>
            <Link className="btn btn--outline" to="/skills">
              <Icon name="mortarboard" /> Habilidades
            </Link>
            <Link className="btn btn--outline" to="/favorites">
              <Icon name="heart" /> Favoritos
            </Link>
            {isAdmin && (
              <Link className="btn btn--outline" to="/admin">
                <Icon name="speedometer2" /> Painel admin
              </Link>
            )}
            <button className="btn btn--ghost" id="logout-btn" onClick={onLogout}>
              <Icon name="box-arrow-right" /> Sair
            </button>
          </>
        ) : (
          <>
            {/* Já existe solicitação em andamento entre os dois? Troca o CTA pelo
                atalho para a conversa, evitando solicitações duplicadas (409). */}
            {user.activeRequest ? (
              <Link className="btn btn--primary full" to={`/requests/${user.activeRequest.id}`}>
                <Icon name="chat-dots" /> Vocês já têm uma solicitação{' '}
                {user.activeRequest.status === 'ACCEPTED' ? 'aceita' : 'pendente'} — abrir
              </Link>
            ) : (
              <Link className="btn btn--primary full" to={`/request/new/${user.id}`}>
                <Icon name="arrow-left-right" /> Solicitar troca
              </Link>
            )}
            <button className="btn btn--outline" id="fav-btn" onClick={toggleFav}>
              <Icon name={fav ? 'heart-fill' : 'heart'} /> {fav ? 'Favorito' : 'Favoritar'}
            </button>
            <button
              className="btn btn--ghost"
              id="report-btn"
              title="Denunciar usuário"
              onClick={() => setReporting(true)}
            >
              <Icon name="flag" />
            </button>
          </>
        )}
      </div>

      {teaching.length > 0 && (
        <>
          <div className="section-title">
            <Icon name="mortarboard-fill" /> Ensina
          </div>
          {teaching.map((s: any) => (
            <TeachingCard key={s.id} s={s} />
          ))}
        </>
      )}
      {learning.length > 0 && (
        <>
          <div className="section-title">
            <Icon name="book-half" /> Quer aprender
          </div>
          {learning.map((s: any) => (
            <LearningCard key={s.id} s={s} />
          ))}
        </>
      )}

      <div className="section-title">
        <Icon name="star-fill" /> Avaliações
      </div>
      <div className="card">
        {user.reviews?.length ? (
          user.reviews.map((r: any, i: number) => (
            <div className="review-item" key={i}>
              <div className="review-item__head">
                <Avatar user={r.author} size="sm" /> <strong>{r.author.name}</strong>{' '}
                <Stars rating={r.rating} />
              </div>
              {r.comment ? (
                <p className="muted" style={{ fontSize: '.88rem' }}>
                  {r.comment}
                </p>
              ) : null}
              <div className="muted" style={{ fontSize: '.74rem' }}>
                {r.skill ? `sobre ${r.skill} · ` : ''}
                {timeAgo(r.createdAt)}
              </div>
            </div>
          ))
        ) : (
          <p className="muted">Nenhuma avaliação ainda.</p>
        )}
      </div>

      {reporting && (
        <ReportModal
          targetId={user.id}
          targetName={user.name}
          onClose={() => setReporting(false)}
        />
      )}
    </>
  );
}
