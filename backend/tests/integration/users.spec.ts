import { describe, it, expect, afterAll } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import { api, bearer } from '../helpers/app';
import { makeUser, makeCategory, makeSkill, addTeaching } from '../helpers/factories';
import { prisma } from '../../src/config/prisma';
import { env } from '../../src/config/env';

// PNG 1x1 transparente (para o upload de avatar)
const PNG_1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
const uploadedFiles: string[] = [];

afterAll(() => {
  // limpa avatares criados durante os testes
  for (const f of uploadedFiles) {
    const p = path.resolve(process.cwd(), env.uploadDir, f);
    if (fs.existsSync(p)) fs.rmSync(p);
  }
});

const yearsAgo = (y: number) => new Date(Date.now() - y * 365.25 * 24 * 60 * 60 * 1000);

describe('PATCH /api/users/me e /me/profile', () => {
  it('atualiza dados básicos', async () => {
    const { token } = await makeUser();
    const res = await api
      .patch('/api/users/me')
      .set('Authorization', bearer(token))
      .send({ name: 'Nome Novo', bio: 'Bio nova', city: 'Rio', state: 'RJ' });
    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Nome Novo');
  });

  it('atualiza o perfil com e sem arrays JSON', async () => {
    const { token } = await makeUser();
    const withArrays = await api
      .patch('/api/users/me/profile')
      .set('Authorization', bearer(token))
      .send({
        gender: 'FEMALE',
        languages: ['Português', 'Inglês'],
        learningPrefs: ['Prático'],
        availability: ['MORNING'],
        preferredModality: 'ONLINE',
      });
    expect(withArrays.body.user.profile.languages).toEqual(['Português', 'Inglês']);

    // segunda atualização sem arrays exercita o ramo "undefined"
    const withoutArrays = await api
      .patch('/api/users/me/profile')
      .set('Authorization', bearer(token))
      .send({ nationality: 'Brasileiro' });
    expect(withoutArrays.body.user.profile.languages).toEqual(['Português', 'Inglês']);
  });
});

describe('POST /api/users/me/onboarding', () => {
  it('conclui o onboarding com perfil e habilidades', async () => {
    const { token, user } = await makeUser();
    const res = await api
      .post('/api/users/me/onboarding')
      .set('Authorization', bearer(token))
      .send({
        profile: { gender: 'MALE' },
        teachingSkills: [{ skillName: 'Violão', level: 'ADVANCED' }],
        learningSkills: [{ skillName: 'Piano' }],
      });
    expect(res.status).toBe(200);
    expect(res.body.user.onboardingCompleted).toBe(true);
    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    expect(updated!.onboardingCompleted).toBe(true);
  });

  it('conclui o onboarding apenas com habilidades de ensino (sem learning)', async () => {
    const { token } = await makeUser();
    const res = await api
      .post('/api/users/me/onboarding')
      .set('Authorization', bearer(token))
      .send({ teachingSkills: [{ skillName: 'Marcenaria Onboarding', level: 'ADVANCED' }] });
    expect(res.status).toBe(200);
    expect(res.body.user.onboardingCompleted).toBe(true);
  });

  it('ignora habilidades duplicadas (ConflictError) e conclui mesmo assim', async () => {
    const { token, user } = await makeUser();
    const skill = await makeSkill('Repetida');
    await prisma.userTeachingSkill.create({
      data: { userId: user.id, skillId: skill.id, level: 'EXPERT' },
    });
    await prisma.userLearningSkill.create({ data: { userId: user.id, skillId: skill.id } });

    const res = await api
      .post('/api/users/me/onboarding')
      .set('Authorization', bearer(token))
      .send({
        teachingSkills: [{ skillId: skill.id, level: 'EXPERT' }],
        learningSkills: [{ skillId: skill.id }],
      });
    expect(res.status).toBe(200);
  });

  it('propaga erros que não são de conflito no ensino (skillId inválido → 404)', async () => {
    const { token } = await makeUser();
    const res = await api
      .post('/api/users/me/onboarding')
      .set('Authorization', bearer(token))
      .send({ teachingSkills: [{ skillId: 'inexistente', level: 'ADVANCED' }] });
    expect(res.status).toBe(404);
  });

  it('propaga erros que não são de conflito na aprendizagem (skillId inválido → 404)', async () => {
    const { token } = await makeUser();
    const res = await api
      .post('/api/users/me/onboarding')
      .set('Authorization', bearer(token))
      .send({ learningSkills: [{ skillId: 'inexistente' }] });
    expect(res.status).toBe(404);
  });
});

describe('POST /api/users/me/avatar', () => {
  it('aceita uma imagem válida e grava a URL do avatar', async () => {
    const { token } = await makeUser();
    const res = await api
      .post('/api/users/me/avatar')
      .set('Authorization', bearer(token))
      .attach('avatar', PNG_1x1, { filename: 'a.png', contentType: 'image/png' });
    expect(res.status).toBe(200);
    expect(res.body.user.avatarUrl).toMatch(/^\/uploads\//);
    uploadedFiles.push(res.body.user.avatarUrl.replace('/uploads/', ''));
  });

  it('rejeita arquivo sem imagem (400)', async () => {
    const { token } = await makeUser();
    const res = await api.post('/api/users/me/avatar').set('Authorization', bearer(token));
    expect(res.status).toBe(400);
  });

  it('rejeita formato não suportado (422)', async () => {
    const { token } = await makeUser();
    const res = await api
      .post('/api/users/me/avatar')
      .set('Authorization', bearer(token))
      .attach('avatar', Buffer.from('texto'), { filename: 'a.txt', contentType: 'text/plain' });
    expect(res.status).toBe(422);
  });
});

describe('GET /api/users/:id (perfil público)', () => {
  it('retorna o próprio perfil (isOwnProfile, sem match)', async () => {
    const { token, user } = await makeUser({ onboardingCompleted: true });
    const res = await api.get(`/api/users/${user.id}`).set('Authorization', bearer(token));
    expect(res.body.user.isOwnProfile).toBe(true);
    expect(res.body.user.match).toBeNull();
  });

  it('retorna perfil de outro usuário com match, favorito e avaliações', async () => {
    const viewer = await makeUser({ onboardingCompleted: true });
    const target = await makeUser({ onboardingCompleted: true });
    const skill = await makeSkill('Aula Perfil');

    await prisma.favorite.create({
      data: { userId: viewer.user.id, favoriteUserId: target.user.id },
    });
    const req = await prisma.exchangeRequest.create({
      data: {
        requesterId: viewer.user.id,
        recipientId: target.user.id,
        requestedSkillId: skill.id,
        type: 'COIN',
        status: 'COMPLETED',
        coinAmount: 10,
      },
    });
    await prisma.review.create({
      data: {
        requestId: req.id,
        authorId: viewer.user.id,
        targetId: target.user.id,
        skillId: skill.id,
        rating: 5,
        comment: 'Top',
      },
    });

    const res = await api
      .get(`/api/users/${target.user.id}`)
      .set('Authorization', bearer(viewer.token));
    expect(res.body.user.isFavorite).toBe(true);
    expect(res.body.user.completedExchanges).toBe(1);
    expect(res.body.user.match).not.toBeNull();
    expect(res.body.user.reviews).toHaveLength(1);
    // Solicitação COMPLETED não conta como ativa
    expect(res.body.user.activeRequest).toBeNull();
  });

  it('expõe a solicitação ativa entre os dois usuários (nas duas direções)', async () => {
    const viewer = await makeUser({ onboardingCompleted: true });
    const target = await makeUser({ onboardingCompleted: true });
    const skill = await makeSkill(`Skill Ativa ${Date.now()}`);

    // Direção: o DONO do perfil enviou a solicitação para quem está vendo
    const pending = await prisma.exchangeRequest.create({
      data: {
        requesterId: target.user.id,
        recipientId: viewer.user.id,
        requestedSkillId: skill.id,
        type: 'COIN',
        status: 'PENDING',
        coinAmount: 10,
      },
    });

    const res = await api
      .get(`/api/users/${target.user.id}`)
      .set('Authorization', bearer(viewer.token));
    expect(res.body.user.activeRequest).toEqual({ id: pending.id, status: 'PENDING' });
  });

  it('retorna 404 para usuário inexistente', async () => {
    const { token } = await makeUser();
    const res = await api.get('/api/users/inexistente').set('Authorization', bearer(token));
    expect(res.status).toBe(404);
  });
});

describe('favoritos', () => {
  it('adiciona, lista e remove favorito', async () => {
    const viewer = await makeUser({ onboardingCompleted: true });
    const target = await makeUser({ onboardingCompleted: true });

    const add = await api
      .post(`/api/users/${target.user.id}/favorite`)
      .set('Authorization', bearer(viewer.token));
    expect(add.body.isFavorite).toBe(true);

    const list = await api
      .get('/api/users/me/favorites')
      .set('Authorization', bearer(viewer.token));
    expect(list.body.items.some((u: any) => u.id === target.user.id)).toBe(true);

    const remove = await api
      .delete(`/api/users/${target.user.id}/favorite`)
      .set('Authorization', bearer(viewer.token));
    expect(remove.body.isFavorite).toBe(false);
  });

  it('impede favoritar a si mesmo (400) e alvo inexistente (404)', async () => {
    const { token, user } = await makeUser();
    const self = await api
      .post(`/api/users/${user.id}/favorite`)
      .set('Authorization', bearer(token));
    expect(self.status).toBe(400);

    const ghost = await api
      .post('/api/users/inexistente/favorite')
      .set('Authorization', bearer(token));
    expect(ghost.status).toBe(404);
  });
});

describe('GET /api/users (busca avançada)', () => {
  async function buildSearchWorld() {
    const me = await makeUser({
      onboardingCompleted: true,
      city: 'São Paulo',
      state: 'SP',
    });
    const cat = await makeCategory('Tecnologia');
    const skill = await makeSkill('Node', cat.id);

    const full = await makeUser({
      name: 'Carlos Dev',
      bio: 'Programador full stack',
      onboardingCompleted: true,
      city: 'São Paulo',
      state: 'SP',
    });
    await addTeaching(full.user.id, skill.id, {
      modality: 'ONLINE',
      level: 'EXPERT',
      acceptsCoins: true,
      acceptsExchange: true,
    });
    await prisma.userProfile.update({
      where: { userId: full.user.id },
      data: {
        gender: 'MALE',
        nationality: 'Brasileiro',
        languages: '["Português"]',
        availability: '["MORNING"]',
        birthDate: yearsAgo(25),
      },
    });

    const old = await makeUser({ onboardingCompleted: true });
    await prisma.userProfile.update({
      where: { userId: old.user.id },
      data: { languages: '["Inglês"]', availability: '["NIGHT"]', birthDate: yearsAgo(60) },
    });

    const child = await makeUser({ onboardingCompleted: true });
    await prisma.userProfile.update({
      where: { userId: child.user.id },
      data: { birthDate: yearsAgo(10) },
    });

    const noBirth = await makeUser({ onboardingCompleted: true });

    return { me, cat, skill, full, old, child, noBirth };
  }

  it('busca sem filtros retorna candidatos onboardados', async () => {
    const { me, full } = await buildSearchWorld();
    const res = await api.get('/api/users').set('Authorization', bearer(me.token));
    expect(res.status).toBe(200);
    expect(res.body.items.some((u: any) => u.id === full.user.id)).toBe(true);
  });

  it('aplica filtros de habilidade (skillId, categoria, modalidade, nível, moedas, troca)', async () => {
    const { me, cat, skill, full } = await buildSearchWorld();
    const queries = [
      `skillId=${skill.id}`,
      `categoryId=${cat.id}`,
      'modality=ONLINE',
      'level=EXPERT',
      'acceptsCoins=true',
      'acceptsExchange=true',
    ];
    for (const q of queries) {
      const res = await api.get(`/api/users?${q}`).set('Authorization', bearer(me.token));
      expect(res.body.items.some((u: any) => u.id === full.user.id)).toBe(true);
    }
  });

  it('aplica filtros de localização, perfil e texto', async () => {
    const { me, full } = await buildSearchWorld();
    for (const q of ['city=São', 'state=SP', 'gender=MALE', 'nationality=Brasil', 'q=Carlos']) {
      const res = await api.get(`/api/users?${q}`).set('Authorization', bearer(me.token));
      expect(res.body.items.some((u: any) => u.id === full.user.id)).toBe(true);
    }
  });

  it('aplica filtros em memória de idioma e disponibilidade', async () => {
    const { me, full, old } = await buildSearchWorld();
    const lang = await api.get('/api/users?language=portug').set('Authorization', bearer(me.token));
    const langIds = lang.body.items.map((u: any) => u.id);
    expect(langIds).toContain(full.user.id);
    expect(langIds).not.toContain(old.user.id);

    const avail = await api
      .get('/api/users?availability=MORNING')
      .set('Authorization', bearer(me.token));
    const availIds = avail.body.items.map((u: any) => u.id);
    expect(availIds).toContain(full.user.id);
    expect(availIds).not.toContain(old.user.id);
  });

  it('filtra por faixa etária (exclui fora do intervalo e sem data de nascimento)', async () => {
    const { me, full, old, child, noBirth } = await buildSearchWorld();
    const res = await api
      .get('/api/users?minAge=18&maxAge=40')
      .set('Authorization', bearer(me.token));
    const ids = res.body.items.map((u: any) => u.id);
    expect(ids).toContain(full.user.id);
    expect(ids).not.toContain(old.user.id); // age > max
    expect(ids).not.toContain(child.user.id); // age < min
    expect(ids).not.toContain(noBirth.user.id); // sem data

    // apenas limite inferior
    const onlyMin = await api.get('/api/users?minAge=18').set('Authorization', bearer(me.token));
    const minIds = onlyMin.body.items.map((u: any) => u.id);
    expect(minIds).toContain(old.user.id); // 60 anos passa só com mínimo
    expect(minIds).not.toContain(child.user.id);

    // apenas limite superior
    const onlyMax = await api.get('/api/users?maxAge=40').set('Authorization', bearer(me.token));
    const maxIds = onlyMax.body.items.map((u: any) => u.id);
    expect(maxIds).toContain(child.user.id); // 10 anos passa só com máximo
    expect(maxIds).not.toContain(old.user.id);
  });

  it('pagina a busca (hasMore)', async () => {
    const { me } = await buildSearchWorld();
    const res = await api.get('/api/users?limit=1').set('Authorization', bearer(me.token));
    expect(res.body.items).toHaveLength(1);
    expect(res.body.hasMore).toBe(true);
  });

  it('retorna 404 quando o usuário autenticado não existe mais', async () => {
    const { token, user } = await makeUser({ onboardingCompleted: true });
    await prisma.user.delete({ where: { id: user.id } });
    const res = await api.get('/api/users').set('Authorization', bearer(token));
    expect(res.status).toBe(404);
  });
});
