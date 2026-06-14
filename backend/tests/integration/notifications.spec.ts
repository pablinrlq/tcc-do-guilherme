import { describe, it, expect } from 'vitest';
import { api, bearer } from '../helpers/app';
import { makeUser } from '../helpers/factories';
import { prisma } from '../../src/config/prisma';

async function notify(userId: string, read = false) {
  return prisma.notification.create({
    data: { userId, type: 'NEW_MATCH', title: 'Oi', message: 'Mensagem', read },
  });
}

describe('notificações', () => {
  it('lista notificações com total e não lidas (paginado)', async () => {
    const { token, user } = await makeUser();
    await notify(user.id, false);
    await notify(user.id, true);

    const res = await api
      .get('/api/notifications?limit=1&page=1')
      .set('Authorization', bearer(token));
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.unread).toBe(1);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.hasMore).toBe(true);
  });

  it('usa paginação padrão quando page/limit não são informados', async () => {
    const { token, user } = await makeUser();
    await notify(user.id, false);
    const res = await api.get('/api/notifications').set('Authorization', bearer(token));
    expect(res.status).toBe(200);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(20);
  });

  it('conta as não lidas', async () => {
    const { token, user } = await makeUser();
    await notify(user.id, false);
    await notify(user.id, false);
    const res = await api.get('/api/notifications/unread-count').set('Authorization', bearer(token));
    expect(res.body.unread).toBe(2);
  });

  it('marca uma notificação como lida', async () => {
    const { token, user } = await makeUser();
    const n = await notify(user.id, false);
    const res = await api
      .post(`/api/notifications/${n.id}/read`)
      .set('Authorization', bearer(token));
    expect(res.body.success).toBe(true);
    const updated = await prisma.notification.findUnique({ where: { id: n.id } });
    expect(updated!.read).toBe(true);
  });

  it('marca todas como lidas', async () => {
    const { token, user } = await makeUser();
    await notify(user.id, false);
    await notify(user.id, false);
    const res = await api.post('/api/notifications/read-all').set('Authorization', bearer(token));
    expect(res.body.success).toBe(true);
    const remaining = await prisma.notification.count({ where: { userId: user.id, read: false } });
    expect(remaining).toBe(0);
  });
});
