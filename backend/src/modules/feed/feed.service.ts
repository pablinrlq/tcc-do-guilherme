import { prisma } from '../../config/prisma';
import { NotFoundError } from '../../utils/errors';
import { calculateMatch } from '../match/match.algorithm';
import { toMatchUser, matchInclude, presentMatchedUser } from '../match/match.service';

interface FeedOptions {
  page: number;
  limit: number;
  onlyMatches: boolean;
}

/**
 * Monta o feed do usuário ordenado por compatibilidade (match) decrescente.
 *
 * Observação de escalabilidade: para o MVP, os candidatos são carregados e
 * pontuados em memória — abordagem simples e didática. Em produção, seria
 * possível pré-filtrar por habilidade via SQL e paginar no banco.
 */
export async function computeFeed(userId: string, opts: FeedOptions) {
  const me = await prisma.user.findUnique({ where: { id: userId }, include: matchInclude });
  if (!me) throw new NotFoundError('Usuário não encontrado');
  const meMatch = toMatchUser(me);

  const candidates = await prisma.user.findMany({
    where: { id: { not: userId }, onboardingCompleted: true, isActive: true },
    include: { ...matchInclude, reviewsReceived: { select: { rating: true } } },
  });

  const scored = candidates.map((user) => ({
    user,
    match: calculateMatch(meMatch, toMatchUser(user)),
  }));

  let filtered = scored;
  if (opts.onlyMatches) {
    filtered = scored.filter((s) => s.match.skillsToLearn.length > 0);
  }

  filtered.sort(
    (a, b) =>
      b.match.score - a.match.score ||
      new Date(b.user.lastActiveAt).getTime() - new Date(a.user.lastActiveAt).getTime(),
  );

  const total = filtered.length;
  const start = (opts.page - 1) * opts.limit;
  const items = filtered
    .slice(start, start + opts.limit)
    .map(({ user, match }) => presentMatchedUser(me, user, match));

  return {
    items,
    page: opts.page,
    limit: opts.limit,
    total,
    hasMore: start + opts.limit < total,
  };
}

/** Sugestões iniciais (melhores matches) — usado no onboarding e na home. */
export async function getSuggestions(userId: string, limit = 5) {
  const feed = await computeFeed(userId, { page: 1, limit, onlyMatches: true });
  return feed.items;
}
