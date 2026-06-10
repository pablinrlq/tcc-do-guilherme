import { describe, it, expect } from 'vitest';
import { api, bearer } from '../helpers/app';
import { makeUser } from '../helpers/factories';
import { prisma } from '../../src/config/prisma';

describe('GET /api/wallet', () => {
  it('retorna o saldo da carteira existente', async () => {
    const { token } = await makeUser({ balance: 250 });
    const res = await api.get('/api/wallet').set('Authorization', bearer(token));
    expect(res.status).toBe(200);
    expect(res.body.wallet.balance).toBe(250);
  });

  it('cria a carteira automaticamente quando ausente (getOrCreateWallet)', async () => {
    const { token, user } = await makeUser();
    await prisma.wallet.delete({ where: { userId: user.id } });
    const res = await api.get('/api/wallet').set('Authorization', bearer(token));
    expect(res.status).toBe(200);
    expect(res.body.wallet.balance).toBe(0);
  });
});

describe('GET /api/wallet/history', () => {
  it('lista o histórico paginado de transações', async () => {
    const { token, user } = await makeUser();
    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
    for (let i = 0; i < 3; i++) {
      await prisma.coinTransaction.create({
        data: {
          walletId: wallet!.id,
          amount: 10,
          type: 'PURCHASE',
          balanceAfter: 100 + i * 10,
        },
      });
    }
    const res = await api
      .get('/api/wallet/history?limit=2&page=1')
      .set('Authorization', bearer(token));
    expect(res.body.transactions).toHaveLength(2);
    expect(res.body.total).toBe(3);
    expect(res.body.hasMore).toBe(true);
  });

  it('retorna 404 quando a carteira não existe', async () => {
    const { token, user } = await makeUser();
    await prisma.wallet.delete({ where: { userId: user.id } });
    const res = await api.get('/api/wallet/history').set('Authorization', bearer(token));
    expect(res.status).toBe(404);
  });
});

describe('POST /api/wallet/purchase', () => {
  it('credita moedas e registra a transação', async () => {
    const { token, user } = await makeUser({ balance: 100 });
    const res = await api
      .post('/api/wallet/purchase')
      .set('Authorization', bearer(token))
      .send({ amount: 50 });
    expect(res.status).toBe(200);
    expect(res.body.wallet.balance).toBe(150);

    const tx = await prisma.coinTransaction.findFirst({
      where: { type: 'PURCHASE' },
      orderBy: { createdAt: 'desc' },
    });
    expect(tx?.amount).toBe(50);
    expect(tx?.relatedRequestId).toBeNull();
    expect(await prisma.wallet.findUnique({ where: { userId: user.id } })).toBeTruthy();
  });

  it('rejeita valor inválido com 422', async () => {
    const { token } = await makeUser();
    const res = await api
      .post('/api/wallet/purchase')
      .set('Authorization', bearer(token))
      .send({ amount: 0 });
    expect(res.status).toBe(422);
  });
});
