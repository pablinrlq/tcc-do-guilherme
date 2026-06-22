import { describe, it, expect } from 'vitest';
import { api, bearer } from '../helpers/app';
import { makeUser, makeSkill, addTeaching, addLearning } from '../helpers/factories';
import { prisma } from '../../src/config/prisma';

describe('GET /api/stats/trends', () => {
  it('retorna habilidades populares e mais procuradas', async () => {
    const teacher = await makeUser({ onboardingCompleted: true });
    const learner = await makeUser({ onboardingCompleted: true });
    // duas habilidades com demanda → exercita os comparadores de ordenação
    const skill = await makeSkill('Marketing Trend');
    const skill2 = await makeSkill('Design Trend');
    await addTeaching(teacher.user.id, skill.id);
    await addLearning(learner.user.id, skill.id);
    await addLearning(learner.user.id, skill2.id);
    await addTeaching(teacher.user.id, skill2.id);
    // habilidade sem demanda (não entra em popular/mostWanted)
    await makeSkill('Sem Demanda');

    const res = await api.get('/api/stats/trends').set('Authorization', bearer(teacher.token));
    expect(res.status).toBe(200);
    expect(res.body.popular.some((s: any) => s.id === skill.id)).toBe(true);
    expect(res.body.mostWanted.some((s: any) => s.id === skill.id)).toBe(true);
    expect(res.body.popular.some((s: any) => s.name === 'Sem Demanda')).toBe(false);
  });
});

describe('GET /api/stats/ranking', () => {
  it('classifica usuários por reputação (avaliações + trocas)', async () => {
    const a = await makeUser({ onboardingCompleted: true });
    const b = await makeUser({ onboardingCompleted: true });
    const skill = await makeSkill('Aula Rank');

    const request = await prisma.exchangeRequest.create({
      data: {
        requesterId: a.user.id,
        recipientId: b.user.id,
        requestedSkillId: skill.id,
        type: 'COIN',
        status: 'COMPLETED',
        coinAmount: 10,
      },
    });
    await prisma.review.create({
      data: {
        requestId: request.id,
        authorId: a.user.id,
        targetId: b.user.id,
        skillId: skill.id,
        rating: 5,
      },
    });
    // usuário sem reviews nem trocas → fora do ranking
    await makeUser({ onboardingCompleted: true });

    const res = await api.get('/api/stats/ranking').set('Authorization', bearer(a.token));
    const ids = res.body.ranking.map((u: any) => u.id);
    expect(ids).toContain(b.user.id);
    expect(res.body.ranking[0].position).toBe(1);
  });
});

describe('GET /api/stats/overview', () => {
  it('bloqueia usuários não administradores com 403', async () => {
    const { token } = await makeUser({ role: 'USER' });
    const res = await api.get('/api/stats/overview').set('Authorization', bearer(token));
    expect(res.status).toBe(403);
  });

  it('retorna a visão geral para administradores', async () => {
    const admin = await makeUser({ role: 'ADMIN' });
    await makeSkill('Skill Overview');
    const res = await api.get('/api/stats/overview').set('Authorization', bearer(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.totalUsers).toBeGreaterThanOrEqual(1);
    expect(res.body).toHaveProperty('coinsInCirculation');
    expect(res.body).toHaveProperty('averageRating');
  });

  it('reporta zero moedas em circulação quando não há carteiras', async () => {
    const admin = await makeUser({ role: 'ADMIN' });
    await prisma.coinTransaction.deleteMany();
    await prisma.wallet.deleteMany();
    const res = await api.get('/api/stats/overview').set('Authorization', bearer(admin.token));
    expect(res.body.coinsInCirculation).toBe(0);
  });
});
