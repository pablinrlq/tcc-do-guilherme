import { describe, it, expect } from 'vitest';
import { api, bearer } from '../helpers/app';
import { makeUser, makeSkill, addTeaching } from '../helpers/factories';
import { prisma } from '../../src/config/prisma';
import * as requestService from '../../src/modules/requests/request.service';

/** Cenário base: requester (com skill oferecida) e recipient (que ensina skill pedida). */
async function setup(
  teachOpts: { acceptsCoins?: boolean; acceptsExchange?: boolean; coinPrice?: number | null } = {},
) {
  const requester = await makeUser({ balance: 100 });
  const recipient = await makeUser();
  const requested = await makeSkill('Pedida ' + Math.random());
  const offered = await makeSkill('Oferecida ' + Math.random());
  await addTeaching(recipient.user.id, requested.id, teachOpts);
  await addTeaching(requester.user.id, offered.id);
  return { requester, recipient, requested, offered };
}

function post(path: string, token: string, body?: unknown) {
  return api.post(path).set('Authorization', bearer(token)).send(body as any);
}

describe('POST /api/requests — criação', () => {
  it('cria solicitação de troca (EXCHANGE)', async () => {
    const { requester, recipient, requested, offered } = await setup();
    const res = await post('/api/requests', requester.token, {
      recipientId: recipient.user.id,
      requestedSkillId: requested.id,
      offeredSkillId: offered.id,
      type: 'EXCHANGE',
      message: 'Vamos trocar?',
    });
    expect(res.status).toBe(201);
    expect(res.body.request.status).toBe('PENDING');
    const notif = await prisma.notification.findFirst({
      where: { userId: recipient.user.id, type: 'REQUEST_RECEIVED' },
    });
    expect(notif!.message).toContain('troca');
  });

  it('cria solicitação paga (COIN) e reserva moedas', async () => {
    const { requester, recipient, requested } = await setup({ coinPrice: 30 });
    const res = await post('/api/requests', requester.token, {
      recipientId: recipient.user.id,
      requestedSkillId: requested.id,
      type: 'COIN',
    });
    expect(res.status).toBe(201);
    expect(res.body.request.coinAmount).toBe(30);

    const wallet = await prisma.wallet.findUnique({ where: { userId: requester.user.id } });
    expect(wallet!.balance).toBe(70);
    expect(wallet!.lockedBalance).toBe(30);
    const lock = await prisma.coinTransaction.findFirst({ where: { type: 'LOCK' } });
    expect(lock!.amount).toBe(-30);
  });

  it('usa coinAmount informado quando presente', async () => {
    const { requester, recipient, requested } = await setup({ coinPrice: 30 });
    const res = await post('/api/requests', requester.token, {
      recipientId: recipient.user.id,
      requestedSkillId: requested.id,
      type: 'COIN',
      coinAmount: 15,
    });
    expect(res.body.request.coinAmount).toBe(15);
  });

  it('rejeita solicitação para si mesmo (400)', async () => {
    const { requester, requested } = await setup();
    const res = await post('/api/requests', requester.token, {
      recipientId: requester.user.id,
      requestedSkillId: requested.id,
      type: 'COIN',
    });
    expect(res.status).toBe(400);
  });

  it('retorna 404 quando o destinatário não existe', async () => {
    const { requester, requested } = await setup();
    const res = await post('/api/requests', requester.token, {
      recipientId: 'inexistente',
      requestedSkillId: requested.id,
      type: 'COIN',
    });
    expect(res.status).toBe(404);
  });

  it('rejeita quando o destinatário não ensina a habilidade (400)', async () => {
    const { requester, recipient } = await setup();
    const outra = await makeSkill('Não Ensinada');
    const res = await post('/api/requests', requester.token, {
      recipientId: recipient.user.id,
      requestedSkillId: outra.id,
      type: 'COIN',
    });
    expect(res.status).toBe(400);
  });

  it('rejeita troca quando a habilidade oferecida não está cadastrada (400)', async () => {
    const { requester, recipient, requested } = await setup();
    const naoMinha = await makeSkill('Não Minha');
    const res = await post('/api/requests', requester.token, {
      recipientId: recipient.user.id,
      requestedSkillId: requested.id,
      offeredSkillId: naoMinha.id,
      type: 'EXCHANGE',
    });
    expect(res.status).toBe(400);
  });

  it('rejeita troca quando o destinatário não aceita troca (400)', async () => {
    const { requester, recipient, requested, offered } = await setup({ acceptsExchange: false });
    const res = await post('/api/requests', requester.token, {
      recipientId: recipient.user.id,
      requestedSkillId: requested.id,
      offeredSkillId: offered.id,
      type: 'EXCHANGE',
    });
    expect(res.status).toBe(400);
  });

  it('rejeita pagamento quando o destinatário não aceita moedas (400)', async () => {
    const { requester, recipient, requested } = await setup({ acceptsCoins: false });
    const res = await post('/api/requests', requester.token, {
      recipientId: recipient.user.id,
      requestedSkillId: requested.id,
      type: 'COIN',
    });
    expect(res.status).toBe(400);
  });

  it('rejeita quando o valor em moedas é inválido (400)', async () => {
    const { requester, recipient, requested } = await setup({ coinPrice: null });
    const res = await post('/api/requests', requester.token, {
      recipientId: recipient.user.id,
      requestedSkillId: requested.id,
      type: 'COIN',
    });
    expect(res.status).toBe(400);
  });

  it('rejeita saldo insuficiente para reservar moedas (400)', async () => {
    const requester = await makeUser({ balance: 5 });
    const recipient = await makeUser();
    const requested = await makeSkill('Cara Demais');
    await addTeaching(recipient.user.id, requested.id, { coinPrice: 50 });
    const res = await post('/api/requests', requester.token, {
      recipientId: recipient.user.id,
      requestedSkillId: requested.id,
      type: 'COIN',
    });
    expect(res.status).toBe(400);
  });

  it('rejeita solicitação duplicada ativa (409)', async () => {
    const { requester, recipient, requested } = await setup();
    const body = {
      recipientId: recipient.user.id,
      requestedSkillId: requested.id,
      type: 'COIN' as const,
    };
    await post('/api/requests', requester.token, body);
    const dup = await post('/api/requests', requester.token, body);
    expect(dup.status).toBe(409);
  });

  it('valida no serviço a ausência de habilidade oferecida na troca', async () => {
    const { requester, recipient, requested } = await setup();
    await expect(
      requestService.createRequest(requester.user.id, {
        recipientId: recipient.user.id,
        requestedSkillId: requested.id,
        type: 'EXCHANGE',
      } as any),
    ).rejects.toThrow('habilidade oferecida');
  });
});

describe('ciclo de vida da solicitação', () => {
  async function createCoin(coinPrice = 20) {
    const { requester, recipient, requested } = await setup({ coinPrice });
    const created = await post('/api/requests', requester.token, {
      recipientId: recipient.user.id,
      requestedSkillId: requested.id,
      type: 'COIN',
    });
    return { requester, recipient, requested, id: created.body.request.id };
  }

  it('aceita uma solicitação pendente (apenas o destinatário)', async () => {
    const { requester, recipient, id } = await createCoin();
    const forbidden = await post(`/api/requests/${id}/accept`, requester.token);
    expect(forbidden.status).toBe(403);

    const ok = await post(`/api/requests/${id}/accept`, recipient.token);
    expect(ok.body.request.status).toBe('ACCEPTED');

    const again = await post(`/api/requests/${id}/accept`, recipient.token);
    expect(again.status).toBe(400);
  });

  it('recusa uma solicitação paga e estorna as moedas', async () => {
    const { requester, recipient, id } = await createCoin(20);
    const res = await post(`/api/requests/${id}/reject`, recipient.token);
    expect(res.body.request.status).toBe('REJECTED');
    const wallet = await prisma.wallet.findUnique({ where: { userId: requester.user.id } });
    expect(wallet!.balance).toBe(100);
    expect(wallet!.lockedBalance).toBe(0);
  });

  it('recusa exige ser o destinatário e estar pendente', async () => {
    const { requester, recipient, id } = await createCoin();
    const forbidden = await post(`/api/requests/${id}/reject`, requester.token);
    expect(forbidden.status).toBe(403);
    await post(`/api/requests/${id}/accept`, recipient.token);
    const tooLate = await post(`/api/requests/${id}/reject`, recipient.token);
    expect(tooLate.status).toBe(400);
  });

  it('cancela (solicitante) uma solicitação paga e estorna', async () => {
    const { requester, id } = await createCoin(20);
    const res = await post(`/api/requests/${id}/cancel`, requester.token);
    expect(res.body.request.status).toBe('CANCELLED');
    const wallet = await prisma.wallet.findUnique({ where: { userId: requester.user.id } });
    expect(wallet!.lockedBalance).toBe(0);
  });

  it('cancela exige ser o solicitante e estado válido', async () => {
    const { requester, recipient, id } = await createCoin();
    const forbidden = await post(`/api/requests/${id}/cancel`, recipient.token);
    expect(forbidden.status).toBe(403);
    // conclui via aceite + complete e tenta cancelar
    await post(`/api/requests/${id}/accept`, recipient.token);
    await post(`/api/requests/${id}/complete`, requester.token);
    const tooLate = await post(`/api/requests/${id}/cancel`, requester.token);
    expect(tooLate.status).toBe(400);
  });

  it('recusa e cancela trocas (EXCHANGE) sem movimentar moedas', async () => {
    const base = await setup();
    const created1 = await post('/api/requests', base.requester.token, {
      recipientId: base.recipient.user.id,
      requestedSkillId: base.requested.id,
      offeredSkillId: base.offered.id,
      type: 'EXCHANGE',
    });
    const rej = await post(`/api/requests/${created1.body.request.id}/reject`, base.recipient.token);
    expect(rej.body.request.status).toBe('REJECTED');

    const created2 = await post('/api/requests', base.requester.token, {
      recipientId: base.recipient.user.id,
      requestedSkillId: base.requested.id,
      offeredSkillId: base.offered.id,
      type: 'EXCHANGE',
    });
    const cancel = await post(
      `/api/requests/${created2.body.request.id}/cancel`,
      base.requester.token,
    );
    expect(cancel.body.request.status).toBe('CANCELLED');
    // o saldo do solicitante permanece intacto (nenhuma moeda envolvida)
    const wallet = await prisma.wallet.findUnique({ where: { userId: base.requester.user.id } });
    expect(wallet!.balance).toBe(100);
  });

  it('conclui uma troca (EXCHANGE) sem movimentar moedas', async () => {
    const { requester, recipient, requested, offered } = await setup();
    const created = await post('/api/requests', requester.token, {
      recipientId: recipient.user.id,
      requestedSkillId: requested.id,
      offeredSkillId: offered.id,
      type: 'EXCHANGE',
    });
    const id = created.body.request.id;
    await post(`/api/requests/${id}/accept`, recipient.token);
    const done = await post(`/api/requests/${id}/complete`, recipient.token);
    expect(done.body.request.status).toBe('COMPLETED');
  });

  it('conclui uma aula paga liquidando o pagamento ao professor', async () => {
    const { requester, recipient, id } = await createCoin(40);
    await post(`/api/requests/${id}/accept`, recipient.token);
    const done = await post(`/api/requests/${id}/complete`, requester.token);
    expect(done.body.request.status).toBe('COMPLETED');

    const payer = await prisma.wallet.findUnique({ where: { userId: requester.user.id } });
    const payee = await prisma.wallet.findUnique({ where: { userId: recipient.user.id } });
    expect(payer!.lockedBalance).toBe(0);
    expect(payee!.balance).toBe(140); // 100 inicial + 40 recebidos
    const coinsNotif = await prisma.notification.findFirst({
      where: { userId: recipient.user.id, type: 'COINS_RECEIVED' },
    });
    expect(coinsNotif).toBeTruthy();
  });

  it('retorna 404 ao agir sobre solicitação inexistente', async () => {
    const { token } = await makeUser();
    for (const action of ['accept', 'reject', 'cancel', 'complete']) {
      const res = await post(`/api/requests/inexistente/${action}`, token);
      expect(res.status).toBe(404);
    }
  });

  it('concluir exige participante e estado ACCEPTED', async () => {
    const { requester, id } = await createCoin();
    const stranger = await makeUser();
    const forbidden = await post(`/api/requests/${id}/complete`, stranger.token);
    expect(forbidden.status).toBe(403);
    const notAccepted = await post(`/api/requests/${id}/complete`, requester.token);
    expect(notAccepted.status).toBe(400);
  });
});

describe('GET /api/requests', () => {
  it('detalha a solicitação para os participantes e bloqueia terceiros', async () => {
    const { requester, recipient, requested } = await setup({ coinPrice: 10 });
    const created = await post('/api/requests', requester.token, {
      recipientId: recipient.user.id,
      requestedSkillId: requested.id,
      type: 'COIN',
    });
    const id = created.body.request.id;

    const asRequester = await api
      .get(`/api/requests/${id}`)
      .set('Authorization', bearer(requester.token));
    expect(asRequester.body.request.role).toBe('REQUESTER');

    const asRecipient = await api
      .get(`/api/requests/${id}`)
      .set('Authorization', bearer(recipient.token));
    expect(asRecipient.body.request.role).toBe('RECIPIENT');

    const stranger = await makeUser();
    const forbidden = await api
      .get(`/api/requests/${id}`)
      .set('Authorization', bearer(stranger.token));
    expect(forbidden.status).toBe(403);

    const notFound = await api
      .get('/api/requests/inexistente')
      .set('Authorization', bearer(requester.token));
    expect(notFound.status).toBe(404);
  });

  it('lista por caixa (sent/received/all) e por status, com flag de avaliação', async () => {
    const { requester, recipient, requested } = await setup({ coinPrice: 10 });
    const created = await post('/api/requests', requester.token, {
      recipientId: recipient.user.id,
      requestedSkillId: requested.id,
      type: 'COIN',
    });
    const id = created.body.request.id;
    await post(`/api/requests/${id}/accept`, recipient.token);
    await post(`/api/requests/${id}/complete`, requester.token);

    const sent = await api
      .get('/api/requests?box=sent')
      .set('Authorization', bearer(requester.token));
    expect(sent.body.items[0].canReview).toBe(true);

    const received = await api
      .get('/api/requests?box=received&status=COMPLETED')
      .set('Authorization', bearer(recipient.token));
    expect(received.body.items).toHaveLength(1);

    const all = await api.get('/api/requests?box=all').set('Authorization', bearer(requester.token));
    expect(all.body.items.length).toBeGreaterThanOrEqual(1);

    // sem o parâmetro box → caixa padrão "all"
    const defaultBox = await api
      .get('/api/requests')
      .set('Authorization', bearer(requester.token));
    expect(defaultBox.body.items.length).toBeGreaterThanOrEqual(1);

    // após avaliar, hasReviewed = true e canReview = false
    await post('/api/reviews', requester.token, { requestId: id, rating: 5 });
    const afterReview = await api
      .get('/api/requests?box=sent')
      .set('Authorization', bearer(requester.token));
    expect(afterReview.body.items[0].hasReviewed).toBe(true);
    expect(afterReview.body.items[0].canReview).toBe(false);
  });
});

describe('chat da solicitação', () => {
  async function acceptedRequest() {
    const { requester, recipient, requested } = await setup({ coinPrice: 10 });
    const created = await post('/api/requests', requester.token, {
      recipientId: recipient.user.id,
      requestedSkillId: requested.id,
      type: 'COIN',
    });
    const id = created.body.request.id;
    return { requester, recipient, id };
  }

  it('bloqueia o chat antes do aceite (400)', async () => {
    const { requester, id } = await acceptedRequest();
    const res = await post(`/api/requests/${id}/messages`, requester.token, { content: 'oi' });
    expect(res.status).toBe(400);
  });

  it('troca mensagens após o aceite e gera notificação', async () => {
    const { requester, recipient, id } = await acceptedRequest();
    await post(`/api/requests/${id}/accept`, recipient.token);

    const m1 = await post(`/api/requests/${id}/messages`, requester.token, { content: 'Olá!' });
    expect(m1.status).toBe(201);
    expect(m1.body.message.mine).toBe(true);

    const longText = 'x'.repeat(80);
    await post(`/api/requests/${id}/messages`, recipient.token, { content: longText });
    const notif = await prisma.notification.findFirst({
      where: { userId: requester.user.id, type: 'NEW_MESSAGE' },
      orderBy: { createdAt: 'desc' },
    });
    expect(notif!.message.endsWith('...')).toBe(true);

    const list = await api
      .get(`/api/requests/${id}/messages`)
      .set('Authorization', bearer(requester.token));
    expect(list.body.items).toHaveLength(2);
    expect(list.body.items.some((m: any) => m.mine === true)).toBe(true);
    expect(list.body.items.some((m: any) => m.mine === false)).toBe(true);
  });

  it('bloqueia mensagens/leitura de quem não participa (403)', async () => {
    const { id } = await acceptedRequest();
    const stranger = await makeUser();
    const send = await post(`/api/requests/${id}/messages`, stranger.token, { content: 'oi' });
    expect(send.status).toBe(403);
    const read = await api
      .get(`/api/requests/${id}/messages`)
      .set('Authorization', bearer(stranger.token));
    expect(read.status).toBe(403);
  });
});
