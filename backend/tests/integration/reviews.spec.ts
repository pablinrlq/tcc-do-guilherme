import { describe, it, expect } from 'vitest';
import { api, bearer } from '../helpers/app';
import { makeUser, makeSkill } from '../helpers/factories';
import { prisma } from '../../src/config/prisma';

interface ReqOpts {
  status?: string;
  type?: string;
  offeredSkillId?: string | null;
}

async function makeRequest(
  requesterId: string,
  recipientId: string,
  requestedSkillId: string,
  opts: ReqOpts = {},
) {
  return prisma.exchangeRequest.create({
    data: {
      requesterId,
      recipientId,
      requestedSkillId,
      offeredSkillId: opts.offeredSkillId ?? null,
      type: opts.type ?? 'COIN',
      status: opts.status ?? 'COMPLETED',
      coinAmount: 10,
    },
  });
}

describe('POST /api/reviews', () => {
  it('permite ao solicitante avaliar o destinatário após a conclusão', async () => {
    const a = await makeUser();
    const b = await makeUser();
    const skill = await makeSkill('Aula Review');
    const req = await makeRequest(a.user.id, b.user.id, skill.id);

    const res = await api
      .post('/api/reviews')
      .set('Authorization', bearer(a.token))
      .send({ requestId: req.id, rating: 5, comment: 'Excelente!' });
    expect(res.status).toBe(201);

    const review = await prisma.review.findFirst({ where: { requestId: req.id } });
    expect(review!.targetId).toBe(b.user.id);
    expect(review!.skillId).toBe(skill.id);

    const notif = await prisma.notification.findFirst({
      where: { userId: b.user.id, type: 'REVIEW_RECEIVED' },
    });
    expect(notif).toBeTruthy();
  });

  it('permite ao destinatário avaliar usando a habilidade oferecida (troca)', async () => {
    const a = await makeUser();
    const b = await makeUser();
    const requested = await makeSkill('Pedida');
    const offered = await makeSkill('Oferecida');
    const req = await makeRequest(a.user.id, b.user.id, requested.id, {
      type: 'EXCHANGE',
      offeredSkillId: offered.id,
    });

    const res = await api
      .post('/api/reviews')
      .set('Authorization', bearer(b.token))
      .send({ requestId: req.id, rating: 4 });
    expect(res.status).toBe(201);
    const review = await prisma.review.findFirst({ where: { authorId: b.user.id } });
    expect(review!.targetId).toBe(a.user.id);
    expect(review!.skillId).toBe(offered.id);
  });

  it('destinatário sem habilidade oferecida cai na habilidade solicitada', async () => {
    const a = await makeUser();
    const b = await makeUser();
    const skill = await makeSkill('Aula Coin Review');
    const req = await makeRequest(a.user.id, b.user.id, skill.id, { type: 'COIN' });
    const res = await api
      .post('/api/reviews')
      .set('Authorization', bearer(b.token))
      .send({ requestId: req.id, rating: 3 });
    expect(res.status).toBe(201);
    const review = await prisma.review.findFirst({ where: { authorId: b.user.id } });
    expect(review!.skillId).toBe(skill.id);
  });

  it('retorna 404 para solicitação inexistente', async () => {
    const a = await makeUser();
    const res = await api
      .post('/api/reviews')
      .set('Authorization', bearer(a.token))
      .send({ requestId: 'inexistente', rating: 5 });
    expect(res.status).toBe(404);
  });

  it('retorna 403 para quem não participa da solicitação', async () => {
    const a = await makeUser();
    const b = await makeUser();
    const stranger = await makeUser();
    const skill = await makeSkill('Aula 403');
    const req = await makeRequest(a.user.id, b.user.id, skill.id);
    const res = await api
      .post('/api/reviews')
      .set('Authorization', bearer(stranger.token))
      .send({ requestId: req.id, rating: 5 });
    expect(res.status).toBe(403);
  });

  it('retorna 400 quando a solicitação não está concluída', async () => {
    const a = await makeUser();
    const b = await makeUser();
    const skill = await makeSkill('Aula Pendente');
    const req = await makeRequest(a.user.id, b.user.id, skill.id, { status: 'ACCEPTED' });
    const res = await api
      .post('/api/reviews')
      .set('Authorization', bearer(a.token))
      .send({ requestId: req.id, rating: 5 });
    expect(res.status).toBe(400);
  });

  it('impede avaliação duplicada do mesmo autor com 409', async () => {
    const a = await makeUser();
    const b = await makeUser();
    const skill = await makeSkill('Aula Dup');
    const req = await makeRequest(a.user.id, b.user.id, skill.id);
    await api
      .post('/api/reviews')
      .set('Authorization', bearer(a.token))
      .send({ requestId: req.id, rating: 5 });
    const dup = await api
      .post('/api/reviews')
      .set('Authorization', bearer(a.token))
      .send({ requestId: req.id, rating: 4 });
    expect(dup.status).toBe(409);
  });
});

describe('GET /api/reviews/user/:userId', () => {
  it('lista avaliações recebidas com média e contagem', async () => {
    const a = await makeUser();
    const b = await makeUser();
    const skill = await makeSkill('Aula Lista');
    const req = await makeRequest(a.user.id, b.user.id, skill.id);
    await prisma.review.create({
      data: {
        requestId: req.id,
        authorId: a.user.id,
        targetId: b.user.id,
        skillId: skill.id,
        rating: 4,
        comment: 'Bom',
      },
    });

    const res = await api
      .get(`/api/reviews/user/${b.user.id}?page=1&limit=10`)
      .set('Authorization', bearer(a.token));
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.average).toBe(4);
    expect(res.body.items[0].skill).toBe('Aula Lista');
  });

  it('retorna média zero quando o usuário não tem avaliações', async () => {
    const a = await makeUser();
    const target = await makeUser();
    const res = await api
      .get(`/api/reviews/user/${target.user.id}`)
      .set('Authorization', bearer(a.token));
    expect(res.body.count).toBe(0);
    expect(res.body.average).toBe(0);
  });
});
