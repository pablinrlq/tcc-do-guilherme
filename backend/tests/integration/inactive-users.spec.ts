import { describe, it, expect } from 'vitest';
import { api, bearer } from '../helpers/app';
import { makeUser, makeSkill, addTeaching } from '../helpers/factories';
import { prisma } from '../../src/config/prisma';

/** Desativa a conta diretamente no banco (como o admin fará). */
async function deactivate(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { isActive: false } });
}

describe('contas desativadas (isActive = false)', () => {
  it('bloqueia o login com 403 e mensagem clara', async () => {
    const { user } = await makeUser({ email: 'inativo@test.com', password: 'senha123' });
    await deactivate(user.id);

    const res = await api
      .post('/api/auth/login')
      .send({ email: 'inativo@test.com', password: 'senha123' });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/desativada/i);
  });

  it('GET /auth/me responde 401 para token de conta desativada (derruba a sessão)', async () => {
    const { user, token } = await makeUser();
    await deactivate(user.id);

    const res = await api.get('/api/auth/me').set('Authorization', bearer(token));
    expect(res.status).toBe(401);
  });

  it('não aparece no feed de outros usuários', async () => {
    const me = await makeUser({ onboardingCompleted: true });
    const visible = await makeUser({ onboardingCompleted: true });
    const hidden = await makeUser({ onboardingCompleted: true });
    await deactivate(hidden.user.id);

    const res = await api.get('/api/feed').set('Authorization', bearer(me.token));
    expect(res.status).toBe(200);
    const ids = res.body.items.map((i: any) => i.id);
    expect(ids).toContain(visible.user.id);
    expect(ids).not.toContain(hidden.user.id);
  });

  it('não aparece na busca de usuários', async () => {
    const me = await makeUser({ onboardingCompleted: true });
    const hidden = await makeUser({ name: 'Invisível', onboardingCompleted: true });
    await deactivate(hidden.user.id);

    const res = await api
      .get('/api/users?q=Invisível')
      .set('Authorization', bearer(me.token));
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(0);
  });

  it('perfil público responde 404', async () => {
    const me = await makeUser();
    const hidden = await makeUser();
    await deactivate(hidden.user.id);

    const res = await api
      .get(`/api/users/${hidden.user.id}`)
      .set('Authorization', bearer(me.token));
    expect(res.status).toBe(404);
  });

  it('é omitido da lista de favoritos', async () => {
    const me = await makeUser({ onboardingCompleted: true });
    const fav = await makeUser({ onboardingCompleted: true });
    await api.post(`/api/users/${fav.user.id}/favorite`).set('Authorization', bearer(me.token));
    await deactivate(fav.user.id);

    const res = await api.get('/api/users/me/favorites').set('Authorization', bearer(me.token));
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(0);
  });

  it('é excluído do ranking de reputação', async () => {
    const a = await makeUser({ onboardingCompleted: true });
    const b = await makeUser({ onboardingCompleted: true });
    const skill = await makeSkill(`Skill Ranking ${Date.now()}`);
    await addTeaching(b.user.id, skill.id);
    await prisma.exchangeRequest.create({
      data: {
        requesterId: a.user.id,
        recipientId: b.user.id,
        requestedSkillId: skill.id,
        type: 'COIN',
        status: 'COMPLETED',
        coinAmount: 10,
      },
    });
    await deactivate(b.user.id);

    const res = await api.get('/api/stats/ranking').set('Authorization', bearer(a.token));
    expect(res.status).toBe(200);
    const ids = res.body.ranking.map((r: any) => r.id);
    expect(ids).toContain(a.user.id);
    expect(ids).not.toContain(b.user.id);
  });
});
