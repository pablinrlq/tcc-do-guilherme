import { describe, it, expect } from 'vitest';
import { api, bearer } from '../helpers/app';
import { makeUser, makeSkill } from '../helpers/factories';
import { prisma } from '../../src/config/prisma';

async function makeAdmin() {
  return makeUser({ role: 'ADMIN' });
}

async function makeReport(
  reporterId: string,
  targetId: string,
  opts: { status?: string; type?: string } = {},
) {
  return prisma.report.create({
    data: {
      reporterId,
      targetId,
      type: opts.type ?? 'SPAM',
      description: 'Descrição detalhada do problema reportado.',
      status: opts.status ?? 'PENDING',
    },
  });
}

// ---------------------------------------------------------------------------
//  POST /api/reports
// ---------------------------------------------------------------------------
describe('POST /api/reports', () => {
  it('cria denúncia de usuário com sucesso', async () => {
    const reporter = await makeUser();
    const target = await makeUser();

    const res = await api
      .post('/api/reports')
      .set('Authorization', bearer(reporter.token))
      .send({ targetId: target.user.id, type: 'SPAM', description: 'Este usuário manda spam.' });

    expect(res.status).toBe(201);
    expect(res.body.report.status).toBe('PENDING');

    const saved = await prisma.report.findFirst({ where: { reporterId: reporter.user.id } });
    expect(saved).not.toBeNull();
    expect(saved!.targetId).toBe(target.user.id);
  });

  it('cria denúncia de solicitação com sucesso', async () => {
    const reporter = await makeUser();
    const other = await makeUser();
    const skill = await makeSkill('Habilidade Report');
    const req = await prisma.exchangeRequest.create({
      data: {
        requesterId: reporter.user.id,
        recipientId: other.user.id,
        requestedSkillId: skill.id,
        type: 'COIN',
        status: 'ACCEPTED',
        coinAmount: 5,
      },
    });

    const res = await api
      .post('/api/reports')
      .set('Authorization', bearer(reporter.token))
      .send({ requestId: req.id, type: 'SCAM', description: 'Golpe durante a negociação aqui.' });

    expect(res.status).toBe(201);
    const saved = await prisma.report.findFirst({ where: { requestId: req.id } });
    expect(saved).not.toBeNull();
  });

  it('retorna 401 sem autenticação', async () => {
    const res = await api
      .post('/api/reports')
      .send({ targetId: 'qualquer', type: 'SPAM', description: 'teste' });
    expect(res.status).toBe(401);
  });

  it('retorna 400 ao denunciar a si mesmo', async () => {
    const reporter = await makeUser();

    const res = await api
      .post('/api/reports')
      .set('Authorization', bearer(reporter.token))
      .send({ targetId: reporter.user.id, type: 'SPAM', description: 'Tentando denunciar a si.' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/si mesmo/i);
  });

  it('retorna 404 quando usuário alvo não existe', async () => {
    const reporter = await makeUser();

    const res = await api
      .post('/api/reports')
      .set('Authorization', bearer(reporter.token))
      .send({ targetId: 'nao-existe', type: 'FAKE_PROFILE', description: 'Perfil inventado aqui.' });

    expect(res.status).toBe(404);
  });

  it('retorna 404 quando solicitação não existe', async () => {
    const reporter = await makeUser();

    const res = await api
      .post('/api/reports')
      .set('Authorization', bearer(reporter.token))
      .send({ requestId: 'nao-existe', type: 'SCAM', description: 'Solicitação inexistente aqui.' });

    expect(res.status).toBe(404);
  });

  it('retorna 403 quando reporter não participa da solicitação', async () => {
    const reporter = await makeUser();
    const a = await makeUser();
    const b = await makeUser();
    const skill = await makeSkill('Skill Estranha');
    const req = await prisma.exchangeRequest.create({
      data: {
        requesterId: a.user.id,
        recipientId: b.user.id,
        requestedSkillId: skill.id,
        type: 'COIN',
        coinAmount: 5,
      },
    });

    const res = await api
      .post('/api/reports')
      .set('Authorization', bearer(reporter.token))
      .send({ requestId: req.id, type: 'SCAM', description: 'Não participo desta solicitação.' });

    expect(res.status).toBe(403);
  });

  it('retorna 409 quando já existe denúncia pendente para o mesmo alvo', async () => {
    const reporter = await makeUser();
    const target = await makeUser();

    await api
      .post('/api/reports')
      .set('Authorization', bearer(reporter.token))
      .send({ targetId: target.user.id, type: 'HARASSMENT', description: 'Primeiro report aqui.' });

    const dup = await api
      .post('/api/reports')
      .set('Authorization', bearer(reporter.token))
      .send({ targetId: target.user.id, type: 'SPAM', description: 'Segundo report duplicado.' });

    expect(dup.status).toBe(409);
  });

  it('retorna 422 para payload inválido (sem targetId nem requestId)', async () => {
    const reporter = await makeUser();

    const res = await api
      .post('/api/reports')
      .set('Authorization', bearer(reporter.token))
      .send({ type: 'SPAM', description: 'Falta o alvo da denúncia aqui.' });

    expect(res.status).toBe(422);
  });

  it('retorna 422 quando descrição é muito curta', async () => {
    const reporter = await makeUser();
    const target = await makeUser();

    const res = await api
      .post('/api/reports')
      .set('Authorization', bearer(reporter.token))
      .send({ targetId: target.user.id, type: 'SPAM', description: 'curta' });

    expect(res.status).toBe(422);
  });
});

// ---------------------------------------------------------------------------
//  GET /api/reports/mine
// ---------------------------------------------------------------------------
describe('GET /api/reports/mine', () => {
  it('retorna denúncias submetidas pelo próprio usuário', async () => {
    const reporter = await makeUser();
    const target = await makeUser();
    await makeReport(reporter.user.id, target.user.id);

    const res = await api
      .get('/api/reports/mine')
      .set('Authorization', bearer(reporter.token));

    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
    expect(res.body.items[0].description).toBeDefined();
  });

  it('respeita paginação e hasMore', async () => {
    const reporter = await makeUser();
    const t1 = await makeUser();
    const t2 = await makeUser();
    await makeReport(reporter.user.id, t1.user.id);
    await makeReport(reporter.user.id, t2.user.id);

    const res = await api
      .get('/api/reports/mine?page=1&limit=1')
      .set('Authorization', bearer(reporter.token));

    expect(res.body.items).toHaveLength(1);
    expect(res.body.hasMore).toBe(true);
  });

  it('retorna 401 sem autenticação', async () => {
    expect((await api.get('/api/reports/mine')).status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
//  GET /api/reports/admin
// ---------------------------------------------------------------------------
describe('GET /api/reports/admin', () => {
  it('admin lista todas as denúncias sem filtro', async () => {
    const admin = await makeAdmin();
    const reporter = await makeUser();
    const target = await makeUser();
    await makeReport(reporter.user.id, target.user.id);

    const res = await api
      .get('/api/reports/admin')
      .set('Authorization', bearer(admin.token));

    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
    expect(res.body.items[0]).toHaveProperty('reporter');
  });

  it('filtra por status', async () => {
    const admin = await makeAdmin();
    const reporter = await makeUser();
    const t1 = await makeUser();
    const t2 = await makeUser();
    await makeReport(reporter.user.id, t1.user.id, { status: 'PENDING' });
    await makeReport(reporter.user.id, t2.user.id, { status: 'RESOLVED' });

    const res = await api
      .get('/api/reports/admin?status=RESOLVED')
      .set('Authorization', bearer(admin.token));

    expect(res.status).toBe(200);
    expect(res.body.items.every((r: any) => r.status === 'RESOLVED')).toBe(true);
  });

  it('pagina resultados (hasMore)', async () => {
    const admin = await makeAdmin();
    const reporter = await makeUser();
    const t1 = await makeUser();
    const t2 = await makeUser();
    await makeReport(reporter.user.id, t1.user.id);
    await makeReport(reporter.user.id, t2.user.id);

    const res = await api
      .get('/api/reports/admin?page=1&limit=1')
      .set('Authorization', bearer(admin.token));

    expect(res.body.items).toHaveLength(1);
    expect(res.body.hasMore).toBe(true);
  });

  it('retorna 401 sem autenticação', async () => {
    expect((await api.get('/api/reports/admin')).status).toBe(401);
  });

  it('retorna 403 para usuário não-admin', async () => {
    const user = await makeUser();
    const res = await api
      .get('/api/reports/admin')
      .set('Authorization', bearer(user.token));
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
//  PATCH /api/reports/admin/:id
// ---------------------------------------------------------------------------
describe('PATCH /api/reports/admin/:id', () => {
  it('admin marca denúncia como UNDER_REVIEW', async () => {
    const admin = await makeAdmin();
    const reporter = await makeUser();
    const target = await makeUser();
    const report = await makeReport(reporter.user.id, target.user.id);

    const res = await api
      .patch(`/api/reports/admin/${report.id}`)
      .set('Authorization', bearer(admin.token))
      .send({ status: 'UNDER_REVIEW', adminNote: 'Analisando o caso agora.' });

    expect(res.status).toBe(200);
    expect(res.body.report.status).toBe('UNDER_REVIEW');
    const updated = await prisma.report.findUnique({ where: { id: report.id } });
    expect(updated!.adminNote).toBe('Analisando o caso agora.');
    expect(updated!.resolvedAt).toBeNull();
  });

  it('admin resolve denúncia e notifica o denunciante', async () => {
    const admin = await makeAdmin();
    const reporter = await makeUser();
    const target = await makeUser();
    const report = await makeReport(reporter.user.id, target.user.id);

    const res = await api
      .patch(`/api/reports/admin/${report.id}`)
      .set('Authorization', bearer(admin.token))
      .send({ status: 'RESOLVED', adminNote: 'Medidas tomadas.' });

    expect(res.status).toBe(200);
    expect(res.body.report.status).toBe('RESOLVED');
    expect(res.body.report.resolvedAt).toBeDefined();

    const notif = await prisma.notification.findFirst({
      where: { userId: reporter.user.id, type: 'REPORT_RESOLVED' },
    });
    expect(notif).not.toBeNull();
    expect(notif!.title).toMatch(/resolvida/i);
  });

  it('admin encerra denúncia (DISMISSED) e notifica o denunciante', async () => {
    const admin = await makeAdmin();
    const reporter = await makeUser();
    const target = await makeUser();
    const report = await makeReport(reporter.user.id, target.user.id);

    const res = await api
      .patch(`/api/reports/admin/${report.id}`)
      .set('Authorization', bearer(admin.token))
      .send({ status: 'DISMISSED' });

    expect(res.status).toBe(200);
    expect(res.body.report.status).toBe('DISMISSED');

    const notif = await prisma.notification.findFirst({
      where: { userId: reporter.user.id, type: 'REPORT_RESOLVED' },
    });
    expect(notif).not.toBeNull();
  });

  it('retorna 400 ao tentar alterar uma denúncia já encerrada', async () => {
    const admin = await makeAdmin();
    const reporter = await makeUser();
    const target = await makeUser();
    const report = await makeReport(reporter.user.id, target.user.id, { status: 'RESOLVED' });

    const res = await api
      .patch(`/api/reports/admin/${report.id}`)
      .set('Authorization', bearer(admin.token))
      .send({ status: 'DISMISSED' });

    expect(res.status).toBe(400);
  });

  it('retorna 400 ao tentar alterar denúncia com status DISMISSED', async () => {
    const admin = await makeAdmin();
    const reporter = await makeUser();
    const target = await makeUser();
    const report = await makeReport(reporter.user.id, target.user.id, { status: 'DISMISSED' });

    const res = await api
      .patch(`/api/reports/admin/${report.id}`)
      .set('Authorization', bearer(admin.token))
      .send({ status: 'RESOLVED' });

    expect(res.status).toBe(400);
  });

  it('retorna 404 para denúncia inexistente', async () => {
    const admin = await makeAdmin();

    const res = await api
      .patch('/api/reports/admin/nao-existe')
      .set('Authorization', bearer(admin.token))
      .send({ status: 'RESOLVED' });

    expect(res.status).toBe(404);
  });

  it('retorna 401 sem autenticação', async () => {
    expect(
      (await api.patch('/api/reports/admin/qualquer').send({ status: 'RESOLVED' })).status,
    ).toBe(401);
  });

  it('retorna 403 para usuário não-admin', async () => {
    const user = await makeUser();
    const res = await api
      .patch('/api/reports/admin/qualquer')
      .set('Authorization', bearer(user.token))
      .send({ status: 'RESOLVED' });
    expect(res.status).toBe(403);
  });
});
