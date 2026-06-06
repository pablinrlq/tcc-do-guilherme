/** Card de usuário usado no feed, busca e favoritos. */
import { Link } from 'react-router-dom';
import { Avatar } from './ui/Avatar';
import { Icon } from './ui/Icon';
import { MatchBadge } from './ui/MatchBadge';
import { ScoreRing } from './ui/ScoreRing';
import { SkillBadge } from './ui/SkillBadge';
import { Stars } from './ui/Stars';

export function UserCard({ user }: { user: any }) {
  const m = user.match;
  const teaches = (user.teachingSkills || []).slice(0, 4);
  const learns = (user.learningSkills || []).slice(0, 3);

  return (
    <article className="user-card">
      <div className="user-card__top">
        <Avatar user={user} size="md" />
        <div className="user-card__info">
          <div className="user-card__name">{user.name}</div>
          <div className="user-card__meta">
            {user.city ? (
              <span>
                <Icon name="geo-alt-fill" /> {user.city}
                {user.state ? '/' + user.state : ''}
              </span>
            ) : null}
            {user.rating?.count ? (
              <span>
                <Stars rating={user.rating.average} /> {user.rating.average} ({user.rating.count})
              </span>
            ) : (
              <span className="muted">Sem avaliações</span>
            )}
          </div>
        </div>
        {m ? <ScoreRing score={m.score} /> : null}
      </div>

      {m ? (
        <div className="row wrap mt-8">
          <MatchBadge match={m} />
        </div>
      ) : null}
      {user.bio ? <p className="user-card__bio">{user.bio}</p> : null}
      {m?.reciprocal ? (
        <div className="reciprocity-banner">
          <Icon name="arrow-repeat" /> Troca perfeita: vocês podem ensinar um ao outro!
        </div>
      ) : null}

      <div className="user-card__skills">
        {teaches.length > 0 ? (
          <div className="user-card__skills-row">
            <span>Ensina:</span>{' '}
            {teaches.map((s: any, i: number) => (
              <SkillBadge key={i} name={s.skill?.name || ''} kind="teach" />
            ))}
          </div>
        ) : null}
        {learns.length > 0 ? (
          <div className="user-card__skills-row">
            <span>Quer aprender:</span>{' '}
            {learns.map((s: any, i: number) => (
              <SkillBadge key={i} name={s.skill?.name || ''} kind="learn" />
            ))}
          </div>
        ) : null}
      </div>

      <div className="user-card__actions">
        <Link className="btn btn--outline btn--sm" to={`/profile/${user.id}`}>
          <Icon name="person" /> Ver perfil
        </Link>
        <Link className="btn btn--outline btn--sm" to={`/request/new/${user.id}?mode=coin`}>
          <Icon name="coin" /> Comprar aula
        </Link>
        <Link className="btn btn--primary btn--sm full" to={`/request/new/${user.id}`}>
          <Icon name="arrow-left-right" /> Solicitar troca
        </Link>
      </div>
    </article>
  );
}
