import { describe, it, expect } from 'vitest';
import { api, bearer } from '../helpers/app';
import { makeUser, makeCategory, makeSkill, addTeaching } from '../helpers/factories';
import { prisma } from '../../src/config/prisma';

async function makeAdmin() {
  return makeUser({ role: 'ADMIN' });
}

describe('proteção das rotas /api/admin', () => {
  it('exige autenticação (401) e papel ADMIN (403)', async () => {
    expect((await api.get('/api/admin/users')).status).toBe(401);

    const { token } = await makeUser(); // usuário comum
    const res = await api.get('/api/admin/users').set('Authorization', bearer(token));
    expect(res.status).toBe(403);
  });
});

describe('GET /api/admin/users', () => {
  it('lista usuários com paginação e dados administrativos', async () => {
    const admin = await makeAdmin();
    await makeUser({ name: 'Fulano Listado' });

    const res = await api
      .get('/api/admin/users?page=1&limit=10')
      .set('Authorization', bearer(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThanOrEqual(2);
    expect(res.body.items[0]).toHaveProperty('email');
    expect(res.body.items[0]).toHaveProperty('isActive');
  });

  it('busca por nome ou e-mail', async () => {
    const admin = await makeAdmin();
    await makeUser({ name: 'Procurado Especial', email: 'procurado@test.com' });

    const byName = await api
      .get('/api/admin/users?q=Procurado Especial')
      .set('Authorization', bearer(admin.token));
    expect(byName.body.items).toHaveLength(1);

    const byEmail = await api
      .get('/api/admin/users?q=procurado@test.com')
      .set('Authorization', bearer(admin.token));
    expect(byEmail.body.items).toHaveLength(1);
  });

  it('pagina resultados (hasMore)', async () => {
    const admin = await makeAdmin();
    await makeUser();
    await makeUser();

    const res = await api
      .get('/api/admin/users?page=1&limit=2')
      .set('Authorization', bearer(admin.token));
    expect(res.body.items).toHaveLength(2);
    expect(res.body.hasMore).toBe(true);
  });
});

describe('PATCH /api/admin/users/:id/status', () => {
  it('desativa e reativa uma conta', async () => {
    const admin = await makeAdmin();
    const alvo = await makeUser({ password: 'senha123' });

    const off = await api
      .patch(`/api/admin/users/${alvo.user.id}/status`)
      .set('Authorization', bearer(admin.token))
      .send({ isActive: false });
    expect(off.status).toBe(200);
    expect(off.body.user.isActive).toBe(false);

    const login = await api
      .post('/api/auth/login')
      .send({ email: alvo.user.email, password: 'senha123' });
    expect(login.status).toBe(403);

    const on = await api
      .patch(`/api/admin/users/${alvo.user.id}/status`)
      .set('Authorization', bearer(admin.token))
      .send({ isActive: true });
    expect(on.body.user.isActive).toBe(true);
  });

  it('impede o admin de desativar a própria conta', async () => {
    const admin = await makeAdmin();
    const res = await api
      .patch(`/api/admin/users/${admin.user.id}/status`)
      .set('Authorization', bearer(admin.token))
      .send({ isActive: false });
    expect(res.status).toBe(400);
  });

  it('responde 404 para usuário inexistente', async () => {
    const admin = await makeAdmin();
    const res = await api
      .patch('/api/admin/users/nao-existe/status')
      .set('Authorization', bearer(admin.token))
      .send({ isActive: false });
    expect(res.status).toBe(404);
  });
});

describe('CRUD /api/admin/categories', () => {
  it('cria, edita e exclui categoria vazia', async () => {
    const admin = await makeAdmin();

    const created = await api
      .post('/api/admin/categories')
      .set('Authorization', bearer(admin.token))
      .send({ name: 'Categoria Nova', icon: 'star', color: '#FF8800' });
    expect(created.status).toBe(201);
    expect(created.body.category.slug).toBe('categoria-nova');

    const id = created.body.category.id;
    const updated = await api
      .patch(`/api/admin/categories/${id}`)
      .set('Authorization', bearer(admin.token))
      .send({ name: 'Categoria Renomeada' });
    expect(updated.status).toBe(200);
    expect(updated.body.category.slug).toBe('categoria-renomeada');

    const deleted = await api
      .delete(`/api/admin/categories/${id}`)
      .set('Authorization', bearer(admin.token));
    expect(deleted.status).toBe(200);
    expect(await prisma.category.findUnique({ where: { id } })).toBeNull();
  });

  it('atualiza ícone/cor sem renomear (slug preservado)', async () => {
    const admin = await makeAdmin();
    const cat = await makeCategory('Mantém Slug');

    const res = await api
      .patch(`/api/admin/categories/${cat.id}`)
      .set('Authorization', bearer(admin.token))
      .send({ icon: 'music', color: '#00AA00' });
    expect(res.status).toBe(200);
    expect(res.body.category.slug).toBe(cat.slug);
    expect(res.body.category.icon).toBe('music');
  });

  it('rejeita nome duplicado na criação e na edição (409)', async () => {
    const admin = await makeAdmin();
    await makeCategory('Duplicada');
    const outra = await makeCategory('Outra Categoria');

    const dupCreate = await api
      .post('/api/admin/categories')
      .set('Authorization', bearer(admin.token))
      .send({ name: 'Duplicada' });
    expect(dupCreate.status).toBe(409);

    const dupRename = await api
      .patch(`/api/admin/categories/${outra.id}`)
      .set('Authorization', bearer(admin.token))
      .send({ name: 'Duplicada' });
    expect(dupRename.status).toBe(409);
  });

  it('bloqueia exclusão de categoria com habilidades (409)', async () => {
    const admin = await makeAdmin();
    const cat = await makeCategory('Com Skills');
    await makeSkill('Skill Presa', cat.id);

    const res = await api
      .delete(`/api/admin/categories/${cat.id}`)
      .set('Authorization', bearer(admin.token));
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/habilidade/i);
  });

  it('responde 404 para categoria inexistente (editar e excluir)', async () => {
    const admin = await makeAdmin();
    const upd = await api
      .patch('/api/admin/categories/nao-existe')
      .set('Authorization', bearer(admin.token))
      .send({ name: 'Tanto Faz' });
    expect(upd.status).toBe(404);

    const del = await api
      .delete('/api/admin/categories/nao-existe')
      .set('Authorization', bearer(admin.token));
    expect(del.status).toBe(404);
  });

  it('rejeita payload inválido com 422', async () => {
    const admin = await makeAdmin();
    const res = await api
      .post('/api/admin/categories')
      .set('Authorization', bearer(admin.token))
      .send({ name: 'X', color: 'laranja' });
    expect(res.status).toBe(422);
  });
});

describe('CRUD /api/admin/skills', () => {
  it('cria, edita (nome e categoria) e exclui habilidade sem uso', async () => {
    const admin = await makeAdmin();
    const cat1 = await makeCategory('Origem');
    const cat2 = await makeCategory('Destino');

    const created = await api
      .post('/api/admin/skills')
      .set('Authorization', bearer(admin.token))
      .send({ name: 'Habilidade Nova', categoryId: cat1.id });
    expect(created.status).toBe(201);
    expect(created.body.skill.category.id).toBe(cat1.id);

    const id = created.body.skill.id;
    const updated = await api
      .patch(`/api/admin/skills/${id}`)
      .set('Authorization', bearer(admin.token))
      .send({ name: 'Habilidade Renomeada', categoryId: cat2.id });
    expect(updated.status).toBe(200);
    expect(updated.body.skill.slug).toBe('habilidade-renomeada');
    expect(updated.body.skill.category.id).toBe(cat2.id);

    const deleted = await api
      .delete(`/api/admin/skills/${id}`)
      .set('Authorization', bearer(admin.token));
    expect(deleted.status).toBe(200);
    expect(await prisma.skill.findUnique({ where: { id } })).toBeNull();
  });

  it('atualiza mantendo o mesmo nome (slug preservado)', async () => {
    const admin = await makeAdmin();
    const cat = await makeCategory('Cat Mesmo Nome');
    const skill = await makeSkill('Skill Mesmo Nome', cat.id);

    const res = await api
      .patch(`/api/admin/skills/${skill.id}`)
      .set('Authorization', bearer(admin.token))
      .send({ name: 'Skill Mesmo Nome' });
    expect(res.status).toBe(200);
    expect(res.body.skill.slug).toBe(skill.slug);
  });

  it('rejeita categoria inexistente na criação e na edição (404)', async () => {
    const admin = await makeAdmin();
    const skill = await makeSkill('Skill Movel');

    const create = await api
      .post('/api/admin/skills')
      .set('Authorization', bearer(admin.token))
      .send({ name: 'Sem Categoria', categoryId: 'nao-existe' });
    expect(create.status).toBe(404);

    const update = await api
      .patch(`/api/admin/skills/${skill.id}`)
      .set('Authorization', bearer(admin.token))
      .send({ categoryId: 'nao-existe' });
    expect(update.status).toBe(404);
  });

  it('rejeita nome duplicado (409)', async () => {
    const admin = await makeAdmin();
    const cat = await makeCategory('Para Dup');
    await makeSkill('Skill Duplicada', cat.id);
    const outra = await makeSkill('Skill Livre', cat.id);

    const dupCreate = await api
      .post('/api/admin/skills')
      .set('Authorization', bearer(admin.token))
      .send({ name: 'Skill Duplicada', categoryId: cat.id });
    expect(dupCreate.status).toBe(409);

    const dupRename = await api
      .patch(`/api/admin/skills/${outra.id}`)
      .set('Authorization', bearer(admin.token))
      .send({ name: 'Skill Duplicada' });
    expect(dupRename.status).toBe(409);
  });

  it('bloqueia exclusão de habilidade em uso (409)', async () => {
    const admin = await makeAdmin();
    const { user } = await makeUser();
    const skill = await makeSkill('Skill Em Uso');
    await addTeaching(user.id, skill.id);

    const res = await api
      .delete(`/api/admin/skills/${skill.id}`)
      .set('Authorization', bearer(admin.token));
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/em uso/i);
  });

  it('responde 404 para habilidade inexistente (editar e excluir)', async () => {
    const admin = await makeAdmin();
    const upd = await api
      .patch('/api/admin/skills/nao-existe')
      .set('Authorization', bearer(admin.token))
      .send({ name: 'Tanto Faz' });
    expect(upd.status).toBe(404);

    const del = await api
      .delete('/api/admin/skills/nao-existe')
      .set('Authorization', bearer(admin.token));
    expect(del.status).toBe(404);
  });
});
