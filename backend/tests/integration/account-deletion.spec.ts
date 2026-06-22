import { describe, it, expect } from 'vitest';
import { api, bearer } from '../helpers/app';
import { makeUser, makeSkill, addTeaching } from '../helpers/factories';
import { prisma } from '../../src/config/prisma';

describe('DELETE /api/users/me (LGPD)', () => {
  it('exige senha correta (401) e autenticação (401)', async () => {
    const { token } = await makeUser({ password: 'minhasenha1' });

    const semToken = await api.delete('/api/users/me').send({ password: 'x' });
    expect(semToken.status).toBe(401);

    const senhaErrada = await api
      .delete('/api/users/me')
      .set('Authorization', bearer(token))
      .send({ password: 'errada99' });
    expect(senhaErrada.status).toBe(401);
    expect(senhaErrada.body.error).toMatch(/senha incorreta/i);
  });

  it('anonimiza o usuário e remove todos os dados pessoais', async () => {
    const alvo = await makeUser({
      name: 'Pessoa Excluída',
      email: 'excluir@test.com',
      password: 'senha123',
      onboardingCompleted: true,
      bio: 'Bio pessoal',
      city: 'Recife',
      state: 'PE',
    });
    const outro = await makeUser({ onboardingCompleted: true });
    const skill = await makeSkill(`Skill Del ${Date.now()}`);
    await addTeaching(alvo.user.id, skill.id);
    await prisma.userLearningSkill.create({
      data: { userId: alvo.user.id, skillId: skill.id, currentLevel: 'NONE', modality: 'BOTH' },
    });
    await api
      .post(`/api/users/${outro.user.id}/favorite`)
      .set('Authorization', bearer(alvo.token));
    await api
      .post(`/api/users/${alvo.user.id}/favorite`)
      .set('Authorization', bearer(outro.token));

    const res = await api
      .delete('/api/users/me')
      .set('Authorization', bearer(alvo.token))
      .send({ password: 'senha123' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const depois = await prisma.user.findUnique({
      where: { id: alvo.user.id },
      include: { profile: true, wallet: true, teachingSkills: true, learningSkills: true },
    });
    expect(depois!.name).toBe('Usuário removido');
    expect(depois!.email).toContain('@skillex.invalid');
    expect(depois!.passwordHash).toBe('!');
    expect(depois!.bio).toBeNull();
    expect(depois!.city).toBeNull();
    expect(depois!.isActive).toBe(false);
    expect(depois!.profile).toBeNull();
    expect(depois!.wallet).toBeNull();
    expect(depois!.teachingSkills).toHaveLength(0);
    expect(depois!.learningSkills).toHaveLength(0);

    // Favoritos nos dois sentidos removidos
    const favs = await prisma.favorite.count({
      where: { OR: [{ userId: alvo.user.id }, { favoriteUserId: alvo.user.id }] },
    });
    expect(favs).toBe(0);

    // Login antigo falha e perfil público some
    const login = await api
      .post('/api/auth/login')
      .send({ email: 'excluir@test.com', password: 'senha123' });
    expect(login.status).toBe(401);

    const perfil = await api
      .get(`/api/users/${alvo.user.id}`)
      .set('Authorization', bearer(outro.token));
    expect(perfil.status).toBe(404);
  });

  it('cancela solicitações ativas devolvendo moedas do OUTRO solicitante', async () => {
    // O outro usuário pagou 30 moedas por uma aula com quem vai excluir a conta
    const professor = await makeUser({ password: 'senha123', onboardingCompleted: true });
    const aluno = await makeUser({ balance: 100, onboardingCompleted: true });
    const skill = await makeSkill(`Skill Aula ${Date.now()}`);
    await addTeaching(professor.user.id, skill.id, { coinPrice: 30 });

    const criada = await api
      .post('/api/requests')
      .set('Authorization', bearer(aluno.token))
      .send({ recipientId: professor.user.id, requestedSkillId: skill.id, type: 'COIN' });
    expect(criada.status).toBe(201);
    const requestId = criada.body.request.id;

    const antes = await prisma.wallet.findUnique({ where: { userId: aluno.user.id } });
    expect(antes!.balance).toBe(70);
    expect(antes!.lockedBalance).toBe(30);

    // Professor exclui a conta → solicitação cancelada, moedas do aluno devolvidas
    const res = await api
      .delete('/api/users/me')
      .set('Authorization', bearer(professor.token))
      .send({ password: 'senha123' });
    expect(res.status).toBe(200);

    const request = await prisma.exchangeRequest.findUnique({
      where: { id: requestId },
      include: { events: true },
    });
    expect(request!.status).toBe('CANCELLED');
    expect(request!.events.some((e) => /excluída/i.test(e.note ?? ''))).toBe(true);

    const carteira = await prisma.wallet.findUnique({ where: { userId: aluno.user.id } });
    expect(carteira!.balance).toBe(100);
    expect(carteira!.lockedBalance).toBe(0);

    // O outro participante foi notificado do cancelamento
    const notif = await prisma.notification.findFirst({
      where: { userId: aluno.user.id, type: 'REQUEST_CANCELLED' },
    });
    expect(notif).not.toBeNull();
  });

  it('cancela troca (EXCHANGE) ativa em que o excluído é o solicitante, notificando o destinatário', async () => {
    const solicitante = await makeUser({ password: 'senha123', onboardingCompleted: true });
    const destinatario = await makeUser({ onboardingCompleted: true });
    const skill = await makeSkill(`Skill Troca ${Date.now()}`);
    const oferecida = await makeSkill(`Skill Oferecida ${Date.now()}`);

    const request = await prisma.exchangeRequest.create({
      data: {
        requesterId: solicitante.user.id,
        recipientId: destinatario.user.id,
        requestedSkillId: skill.id,
        offeredSkillId: oferecida.id,
        type: 'EXCHANGE',
        status: 'PENDING',
      },
    });

    const res = await api
      .delete('/api/users/me')
      .set('Authorization', bearer(solicitante.token))
      .send({ password: 'senha123' });
    expect(res.status).toBe(200);

    const depois = await prisma.exchangeRequest.findUnique({ where: { id: request.id } });
    expect(depois!.status).toBe('CANCELLED');

    const notif = await prisma.notification.findFirst({
      where: { userId: destinatario.user.id, type: 'REQUEST_CANCELLED' },
    });
    expect(notif).not.toBeNull();
  });

  it('preserva avaliações e histórico de terceiros', async () => {
    const autor = await makeUser({ password: 'senha123', onboardingCompleted: true });
    const alvo = await makeUser({ onboardingCompleted: true });
    const skill = await makeSkill(`Skill Review ${Date.now()}`);
    const request = await prisma.exchangeRequest.create({
      data: {
        requesterId: autor.user.id,
        recipientId: alvo.user.id,
        requestedSkillId: skill.id,
        type: 'COIN',
        status: 'COMPLETED',
        coinAmount: 10,
      },
    });
    await prisma.review.create({
      data: {
        requestId: request.id,
        authorId: autor.user.id,
        targetId: alvo.user.id,
        skillId: skill.id,
        rating: 5,
        comment: 'Excelente!',
      },
    });

    const res = await api
      .delete('/api/users/me')
      .set('Authorization', bearer(autor.token))
      .send({ password: 'senha123' });
    expect(res.status).toBe(200);

    // A avaliação recebida pelo terceiro continua existindo (autor anonimizado)
    const review = await prisma.review.findFirst({
      where: { targetId: alvo.user.id },
      include: { author: { select: { name: true } } },
    });
    expect(review).not.toBeNull();
    expect(review!.rating).toBe(5);
    expect(review!.author.name).toBe('Usuário removido');

    // Solicitação concluída (histórico) não foi cancelada
    const reqDepois = await prisma.exchangeRequest.findUnique({ where: { id: request.id } });
    expect(reqDepois!.status).toBe('COMPLETED');
  });

  it('remove o arquivo físico do avatar', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const { env } = await import('../../src/config/env');

    const alvo = await makeUser({ password: 'senha123' });
    const uploadDir = path.resolve(process.cwd(), env.uploadDir);
    await fs.promises.mkdir(uploadDir, { recursive: true });
    const filename = `avatar-teste-${Date.now()}.png`;
    const filePath = path.join(uploadDir, filename);
    await fs.promises.writeFile(filePath, 'png-fake');
    await prisma.user.update({
      where: { id: alvo.user.id },
      data: { avatarUrl: `/uploads/${filename}` },
    });

    const res = await api
      .delete('/api/users/me')
      .set('Authorization', bearer(alvo.token))
      .send({ password: 'senha123' });
    expect(res.status).toBe(200);
    expect(fs.existsSync(filePath)).toBe(false);
  });
});
