import { describe, it, expect } from 'vitest';
import { api, bearer } from '../helpers/app';
import { makeUser, makeSkill, addTeaching, addLearning } from '../helpers/factories';
import { prisma } from '../../src/config/prisma';

describe('GET /api/match/:userId', () => {
  it('calcula o match recíproco com nomes das habilidades', async () => {
    const s1 = await makeSkill('Piano Match');
    const s2 = await makeSkill('Costura Match');
    const me = await makeUser();
    await addTeaching(me.user.id, s2.id);
    await addLearning(me.user.id, s1.id);

    const other = await makeUser();
    await addTeaching(other.user.id, s1.id);
    await addLearning(other.user.id, s2.id);

    const res = await api
      .get(`/api/match/${other.user.id}`)
      .set('Authorization', bearer(me.token));
    expect(res.status).toBe(200);
    expect(res.body.match.reciprocal).toBe(true);
    expect(res.body.match.skillsTheyTeachYouWant).toContain('Piano Match');
    expect(res.body.match.skillsYouTeachTheyWant).toContain('Costura Match');
  });

  it('retorna 404 para usuário-alvo inexistente', async () => {
    const me = await makeUser();
    const res = await api.get('/api/match/inexistente').set('Authorization', bearer(me.token));
    expect(res.status).toBe(404);
  });

  it('retorna 404 quando o solicitante não existe mais', async () => {
    const me = await makeUser();
    const other = await makeUser();
    await prisma.user.delete({ where: { id: me.user.id } });
    const res = await api
      .get(`/api/match/${other.user.id}`)
      .set('Authorization', bearer(me.token));
    expect(res.status).toBe(404);
  });
});
