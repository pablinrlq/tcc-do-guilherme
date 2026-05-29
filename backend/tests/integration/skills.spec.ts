import { describe, it, expect } from 'vitest';
import { api, bearer } from '../helpers/app';
import { makeUser, makeCategory, makeSkill } from '../helpers/factories';
import { seedBaseData } from '../helpers/db';
import * as skillService from '../../src/modules/skills/skill.service';
import { prisma } from '../../src/config/prisma';

describe('GET /api/categories e /api/skills', () => {
  it('lista categorias com contagem de habilidades', async () => {
    const { category } = await seedBaseData();
    const res = await api.get('/api/categories');
    expect(res.status).toBe(200);
    const found = res.body.categories.find((c: any) => c.id === category.id);
    expect(found.skillsCount).toBe(2);
  });

  it('lista habilidades com filtros q e categoryId', async () => {
    const { category, violino } = await seedBaseData();
    const all = await api.get('/api/skills');
    expect(all.body.skills.length).toBeGreaterThanOrEqual(2);

    const byQ = await api.get('/api/skills?q=Violino');
    expect(byQ.body.skills.some((s: any) => s.id === violino.id)).toBe(true);

    const byCat = await api.get(`/api/skills?categoryId=${category.id}`);
    expect(byCat.body.skills.length).toBe(2);
  });
});

describe('habilidades que o usuário ensina/aprende', () => {
  it('adiciona habilidade de ensino via skillId', async () => {
    const { token } = await makeUser();
    const skill = await makeSkill('Guitarra');
    const res = await api
      .post('/api/skills/teaching')
      .set('Authorization', bearer(token))
      .send({ skillId: skill.id, level: 'ADVANCED' });
    expect(res.status).toBe(201);
    expect(res.body.skill.name).toBe('Guitarra');
  });

  it('adiciona habilidade de ensino criando skill nova via skillName', async () => {
    const { token } = await makeUser();
    const res = await api
      .post('/api/skills/teaching')
      .set('Authorization', bearer(token))
      .send({ skillName: 'Cerâmica Artística', level: 'INTERMEDIATE' });
    expect(res.status).toBe(201);
    // categoria de fallback "Outros" foi criada
    const outros = await prisma.category.findUnique({ where: { slug: 'outros' } });
    expect(outros).toBeTruthy();
  });

  it('rejeita habilidade de ensino duplicada com 409', async () => {
    const { token } = await makeUser();
    const skill = await makeSkill('Xadrez');
    await api
      .post('/api/skills/teaching')
      .set('Authorization', bearer(token))
      .send({ skillId: skill.id, level: 'EXPERT' });
    const dup = await api
      .post('/api/skills/teaching')
      .set('Authorization', bearer(token))
      .send({ skillId: skill.id, level: 'EXPERT' });
    expect(dup.status).toBe(409);
  });

  it('atualiza e remove habilidade de ensino', async () => {
    const { token } = await makeUser();
    const skill = await makeSkill('Fotografia');
    const created = await api
      .post('/api/skills/teaching')
      .set('Authorization', bearer(token))
      .send({ skillId: skill.id, level: 'BEGINNER', availability: ['MORNING'], tags: ['retrato'] });

    const upd = await api
      .patch(`/api/skills/teaching/${created.body.id}`)
      .set('Authorization', bearer(token))
      .send({ level: 'ADVANCED', availability: ['NIGHT'] });
    expect(upd.body.level).toBe('ADVANCED');

    // atualização apenas com tags (availability indefinida) cobre o ramo oposto
    const updTags = await api
      .patch(`/api/skills/teaching/${created.body.id}`)
      .set('Authorization', bearer(token))
      .send({ tags: ['estúdio'] });
    expect(updTags.body.tags).toEqual(['estúdio']);

    const del = await api
      .delete(`/api/skills/teaching/${created.body.id}`)
      .set('Authorization', bearer(token));
    expect(del.body.success).toBe(true);
  });

  it('retorna 404 ao atualizar/remover habilidade de outro usuário', async () => {
    const a = await makeUser();
    const b = await makeUser();
    const skill = await makeSkill('Marcenaria');
    const created = await api
      .post('/api/skills/teaching')
      .set('Authorization', bearer(a.token))
      .send({ skillId: skill.id, level: 'EXPERT' });

    const upd = await api
      .patch(`/api/skills/teaching/${created.body.id}`)
      .set('Authorization', bearer(b.token))
      .send({ level: 'BEGINNER' });
    expect(upd.status).toBe(404);

    const del = await api
      .delete(`/api/skills/teaching/${created.body.id}`)
      .set('Authorization', bearer(b.token));
    expect(del.status).toBe(404);
  });

  it('CRUD de habilidade de aprendizagem', async () => {
    const { token } = await makeUser();
    const skill = await makeSkill('Espanhol');
    const created = await api
      .post('/api/skills/learning')
      .set('Authorization', bearer(token))
      .send({ skillId: skill.id, currentLevel: 'BEGINNER', goal: 'viajar' });
    expect(created.status).toBe(201);

    const upd = await api
      .patch(`/api/skills/learning/${created.body.id}`)
      .set('Authorization', bearer(token))
      .send({ currentLevel: 'INTERMEDIATE' });
    expect(upd.body.currentLevel).toBe('INTERMEDIATE');

    const del = await api
      .delete(`/api/skills/learning/${created.body.id}`)
      .set('Authorization', bearer(token));
    expect(del.body.success).toBe(true);
  });

  it('rejeita aprendizagem duplicada (409) e acesso indevido (404)', async () => {
    const a = await makeUser();
    const b = await makeUser();
    const skill = await makeSkill('Francês');
    const created = await api
      .post('/api/skills/learning')
      .set('Authorization', bearer(a.token))
      .send({ skillId: skill.id });
    const dup = await api
      .post('/api/skills/learning')
      .set('Authorization', bearer(a.token))
      .send({ skillId: skill.id });
    expect(dup.status).toBe(409);

    const updOther = await api
      .patch(`/api/skills/learning/${created.body.id}`)
      .set('Authorization', bearer(b.token))
      .send({ currentLevel: 'ADVANCED' });
    expect(updOther.status).toBe(404);

    const delOther = await api
      .delete(`/api/skills/learning/${created.body.id}`)
      .set('Authorization', bearer(b.token));
    expect(delOther.status).toBe(404);
  });

  it('lista as habilidades do próprio usuário', async () => {
    const { token, user } = await makeUser();
    const skill = await makeSkill('Bateria');
    await prisma.userTeachingSkill.create({
      data: { userId: user.id, skillId: skill.id, level: 'ADVANCED' },
    });
    const res = await api.get('/api/skills/me').set('Authorization', bearer(token));
    expect(res.body.teachingSkills).toHaveLength(1);
  });
});

describe('bookmarks de habilidades (saved)', () => {
  it('salva, lista e remove habilidade de interesse', async () => {
    const { token } = await makeUser();
    const skill = await makeSkill('Yoga');

    const save = await api
      .post(`/api/skills/${skill.id}/save`)
      .set('Authorization', bearer(token));
    expect(save.status).toBe(201);
    // idempotente
    await api.post(`/api/skills/${skill.id}/save`).set('Authorization', bearer(token));

    const list = await api.get('/api/skills/me/saved').set('Authorization', bearer(token));
    expect(list.body.items).toHaveLength(1);

    const del = await api
      .delete(`/api/skills/${skill.id}/save`)
      .set('Authorization', bearer(token));
    expect(del.body.saved).toBe(false);
  });

  it('retorna 404 ao salvar habilidade inexistente', async () => {
    const { token } = await makeUser();
    const res = await api.post('/api/skills/inexistente/save').set('Authorization', bearer(token));
    expect(res.status).toBe(404);
  });
});

describe('GET /api/skills/suggestions', () => {
  it('retorna vazio quando o usuário não tem habilidades', async () => {
    const { token } = await makeUser();
    const res = await api.get('/api/skills/suggestions').set('Authorization', bearer(token));
    expect(res.body.items).toEqual([]);
  });

  it('sugere habilidades da mesma categoria ordenadas por demanda', async () => {
    const { token, user } = await makeUser();
    const cat = await makeCategory('Idiomas');
    const mine = await makeSkill('Inglês', cat.id);
    const mineLearning = await makeSkill('Russo', cat.id);
    const other = await makeSkill('Alemão', cat.id);
    const popular = await makeSkill('Italiano', cat.id);
    await prisma.userTeachingSkill.create({
      data: { userId: user.id, skillId: mine.id, level: 'EXPERT' },
    });
    // habilidade que o usuário deseja aprender → exercita o map de learning
    await prisma.userLearningSkill.create({
      data: { userId: user.id, skillId: mineLearning.id },
    });
    // gera demanda para "Italiano"
    const demand = await makeUser();
    await prisma.userLearningSkill.create({
      data: { userId: demand.user.id, skillId: popular.id },
    });

    const res = await api
      .get('/api/skills/suggestions?limit=5')
      .set('Authorization', bearer(token));
    const ids = res.body.items.map((s: any) => s.id);
    expect(ids).toContain(popular.id);
    expect(ids).toContain(other.id);
    expect(ids).not.toContain(mine.id);
    // o de maior demanda vem primeiro
    expect(res.body.items[0].id).toBe(popular.id);
  });
});

describe('skillService.resolveSkillId e getFallbackCategoryId (ramos diretos)', () => {
  it('resolve skillId existente', async () => {
    const skill = await makeSkill('Direto');
    expect(await skillService.resolveSkillId({ skillId: skill.id })).toBe(skill.id);
  });

  it('lança NotFound para skillId inexistente', async () => {
    await expect(skillService.resolveSkillId({ skillId: 'nope' })).rejects.toThrow(
      'não encontrada no catálogo',
    );
  });

  it('reaproveita skill existente pelo slug do skillName', async () => {
    const cat = await makeCategory('Pintura');
    const skill = await prisma.skill.create({
      data: { name: 'Aquarela', slug: 'aquarela', categoryId: cat.id },
    });
    const resolved = await skillService.resolveSkillId({ skillName: 'aquarela' });
    expect(resolved).toBe(skill.id);
  });

  it('cria skill nova usando categoria preferida válida', async () => {
    const cat = await makeCategory('Arte');
    const id = await skillService.resolveSkillId({ skillName: 'Gravura', categoryId: cat.id });
    const created = await prisma.skill.findUnique({ where: { id } });
    expect(created!.categoryId).toBe(cat.id);
  });

  it('usa "Outros" quando a categoria preferida não existe e reaproveita na segunda vez', async () => {
    const id1 = await skillService.resolveSkillId({
      skillName: 'Origami',
      categoryId: 'cat-inexistente',
    });
    const id2 = await skillService.resolveSkillId({ skillName: 'Macramê' });
    const s1 = await prisma.skill.findUnique({ where: { id: id1 } });
    const s2 = await prisma.skill.findUnique({ where: { id: id2 } });
    expect(s1!.categoryId).toBe(s2!.categoryId); // ambos na categoria "Outros"
  });

  it('lança BadRequest quando não há referência de habilidade', async () => {
    await expect(skillService.resolveSkillId({})).rejects.toThrow('Informe uma habilidade');
    await expect(skillService.resolveSkillId({ skillName: 'a' })).rejects.toThrow();
  });
});
