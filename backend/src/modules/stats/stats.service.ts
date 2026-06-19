import { prisma } from '../../config/prisma';

/** Habilidades em alta (tendências) com base em oferta e demanda. */
export async function getTrends(limit = 8) {
  const skills = await prisma.skill.findMany({
    include: {
      category: true,
      _count: { select: { teachingLinks: true, learningLinks: true } },
    },
  });

  const mapped = skills.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    /* v8 ignore start -- category sempre presente (FK obrigatória + include) */
    category: s.category?.name ?? null,
    categorySlug: s.category?.slug ?? null,
    icon: s.category?.icon ?? null,
    /* v8 ignore stop */
    teachers: s._count.teachingLinks,
    learners: s._count.learningLinks,
    demand: s._count.teachingLinks + s._count.learningLinks,
  }));

  const popular = mapped
    .filter((s) => s.demand > 0)
    .sort((a, b) => b.demand - a.demand)
    .slice(0, limit);

  const mostWanted = [...mapped]
    .filter((s) => s.learners > 0)
    .sort((a, b) => b.learners - a.learners)
    .slice(0, limit);

  return { popular, mostWanted };
}

/**
 * Ranking de reputação dos usuários.
 *
 * A reputação combina três sinais, de forma explicável para o TCC:
 *  - Qualidade: média das avaliações (0–5) normalizada para 0–100;
 *  - Confiança: suavização bayesiana que reduz o peso de quem tem poucas
 *    avaliações (evita que 1 nota 5 fique acima de 50 notas 4,9);
 *  - Atividade: cada troca/aula concluída soma pontos.
 */
export async function getRanking(limit = 20) {
  const [users, completed] = await Promise.all([
    prisma.user.findMany({
      where: { onboardingCompleted: true, isActive: true },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        city: true,
        state: true,
        reviewsReceived: { select: { rating: true } },
      },
    }),
    prisma.exchangeRequest.findMany({
      where: { status: 'COMPLETED' },
      select: { requesterId: true, recipientId: true },
    }),
  ]);

  // Trocas concluídas por usuário (conta para ambos os lados da troca)
  const completedCount = new Map<string, number>();
  for (const r of completed) {
    completedCount.set(r.requesterId, (completedCount.get(r.requesterId) ?? 0) + 1);
    completedCount.set(r.recipientId, (completedCount.get(r.recipientId) ?? 0) + 1);
  }

  const ranked = users
    .map((u) => {
      const ratings = u.reviewsReceived;
      const count = ratings.length;
      const avg = count ? ratings.reduce((s, r) => s + r.rating, 0) / count : 0;
      const exchanges = completedCount.get(u.id) ?? 0;

      const quality = (avg / 5) * 100; // 0–100
      const confidence = count / (count + 3); // suavização bayesiana
      const reputation = Math.round(quality * confidence + exchanges * 5);

      return {
        id: u.id,
        name: u.name,
        avatarUrl: u.avatarUrl,
        city: u.city,
        state: u.state,
        rating: { average: Number(avg.toFixed(1)), count },
        completedExchanges: exchanges,
        reputation,
      };
    })
    .filter((u) => u.rating.count > 0 || u.completedExchanges > 0)
    .sort((a, b) => b.reputation - a.reputation)
    .slice(0, limit)
    .map((u, i) => ({ ...u, position: i + 1 }));

  return { ranking: ranked };
}

/** Estatísticas gerais da plataforma (painel administrativo). */
export async function getOverview() {
  const [totalUsers, onboarded, totalSkills, totalRequests, completed, reviewsAgg, coins] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { onboardingCompleted: true } }),
      prisma.skill.count(),
      prisma.exchangeRequest.count(),
      prisma.exchangeRequest.count({ where: { status: 'COMPLETED' } }),
      prisma.review.aggregate({ _avg: { rating: true }, _count: true }),
      prisma.wallet.aggregate({ _sum: { balance: true, lockedBalance: true } }),
    ]);

  return {
    totalUsers,
    onboardedUsers: onboarded,
    totalSkills,
    totalRequests,
    completedExchanges: completed,
    totalReviews: reviewsAgg._count,
    averageRating: Number((reviewsAgg._avg.rating ?? 0).toFixed(2)),
    coinsInCirculation: (coins._sum.balance ?? 0) + (coins._sum.lockedBalance ?? 0),
  };
}
