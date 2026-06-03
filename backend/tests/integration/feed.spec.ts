import { describe, it, expect } from 'vitest';
import { api, bearer } from '../helpers/app';
import { makeUser, makeSkill, addTeaching, addLearning } from '../helpers/factories';
import { prisma } from '../../src/config/prisma';

async function buildScenario() {
  const s1 = await makeSkill('Violino Feed');
  const s2 = await makeSkill('Tricô Feed');
  const me = await makeUser({ onboardingCompleted: true });
  await addTeaching(me.user.id, s2.id);
  await addLearning(me.user.id, s1.id);

  // match recíproco: ensina s1 (que eu quero) e quer s2 (que eu ensino)
  const partner = await makeUser({ onboardingCompleted: true });
  await addTeaching(partner.user.id, s1.id);
  await addLearning(partner.user.id, s2.id);

  // sem habilidades compatíveis (dois com pontuação idêntica → exercita o desempate)
  const stranger = await makeUser({ onboardingCompleted: true });
  const stranger2 = await makeUser({ onboardingCompleted: true });

  // não concluiu onboarding → não deve aparecer
  const hidden = await makeUser({ onboardingCompleted: false });

  return { me, partner, stranger, stranger2, hidden, s1, s2 };
}

describe('GET /api/feed', () => {
  it('ordena candidatos por compatibilidade e ignora não-onboardados', async () => {
    const { me, partner, hidden } = await buildScenario();
    const res = await api.get('/api/feed').set('Authorization', bearer(me.token));
    expect(res.status).toBe(200);
    const ids = res.body.items.map((u: any) => u.id);
    expect(ids).toContain(partner.user.id);
    expect(ids).not.toContain(hidden.user.id);
    // parceiro recíproco tem o maior score
    expect(res.body.items[0].id).toBe(partner.user.id);
  });

  it('filtra apenas matches reais com onlyMatches=true', async () => {
    const { me, partner, stranger } = await buildScenario();
    const res = await api
      .get('/api/feed?onlyMatches=true')
      .set('Authorization', bearer(me.token));
    const ids = res.body.items.map((u: any) => u.id);
    expect(ids).toContain(partner.user.id);
    expect(ids).not.toContain(stranger.user.id);
  });

  it('pagina os resultados (hasMore)', async () => {
    const { me } = await buildScenario();
    const page1 = await api
      .get('/api/feed?limit=1&page=1')
      .set('Authorization', bearer(me.token));
    expect(page1.body.items).toHaveLength(1);
    expect(page1.body.hasMore).toBe(true);

    const big = await api.get('/api/feed?limit=50').set('Authorization', bearer(me.token));
    expect(big.body.hasMore).toBe(false);
  });

  it('retorna 404 quando o usuário do token não existe mais', async () => {
    const { token, user } = await makeUser({ onboardingCompleted: true });
    await prisma.user.delete({ where: { id: user.id } });
    const res = await api.get('/api/feed').set('Authorization', bearer(token));
    expect(res.status).toBe(404);
  });
});

describe('GET /api/feed/suggestions', () => {
  it('retorna os melhores matches', async () => {
    const { me, partner } = await buildScenario();
    const res = await api
      .get('/api/feed/suggestions?limit=3')
      .set('Authorization', bearer(me.token));
    expect(res.body.items.some((u: any) => u.id === partner.user.id)).toBe(true);
  });

  it('usa o limite padrão quando não informado', async () => {
    const { me, partner } = await buildScenario();
    const res = await api.get('/api/feed/suggestions').set('Authorization', bearer(me.token));
    expect(res.status).toBe(200);
    expect(res.body.items.some((u: any) => u.id === partner.user.id)).toBe(true);
  });
});
