import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
  ConflictError,
} from '../../utils/errors';
import { presentSkill } from '../users/user.presenter';
import * as walletService from '../wallet/wallet.service';
import { emitToUser, emitToUsers, emitToRequest } from '../../realtime/realtime';
import { CreateRequestInput } from './request.schemas';

const requestInclude: Prisma.ExchangeRequestInclude = {
  requester: { select: { id: true, name: true, avatarUrl: true } },
  recipient: { select: { id: true, name: true, avatarUrl: true } },
  requestedSkill: { include: { category: true } },
  offeredSkill: { include: { category: true } },
  events: { orderBy: { createdAt: 'asc' } },
  reviews: { select: { authorId: true } },
  _count: { select: { messages: true } },
};

function presentRequest(r: any, viewerId: string) {
  const role = r.requesterId === viewerId ? 'REQUESTER' : 'RECIPIENT';
  const otherUser = role === 'REQUESTER' ? r.recipient : r.requester;
  /* v8 ignore next 3 -- guarda defensivo: r.reviews vem sempre como array (include do Prisma) */
  const hasReviewed = Array.isArray(r.reviews)
    ? r.reviews.some((rv: any) => rv.authorId === viewerId)
    : false;
  return {
    id: r.id,
    type: r.type,
    status: r.status,
    coinAmount: r.coinAmount,
    message: r.message,
    suggestedDate: r.suggestedDate,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    role,
    otherUser,
    requester: r.requester,
    recipient: r.recipient,
    /* v8 ignore next -- requestedSkill é FK obrigatória, sempre presente */
    requestedSkill: r.requestedSkill ? presentSkill(r.requestedSkill) : null,
    offeredSkill: r.offeredSkill ? presentSkill(r.offeredSkill) : null,
    /* v8 ignore start -- guardas defensivos: events e _count sempre presentes (include do Prisma) */
    events: Array.isArray(r.events)
      ? r.events.map((e: any) => ({ status: e.status, note: e.note, createdAt: e.createdAt }))
      : [],
    messagesCount: r._count?.messages ?? 0,
    /* v8 ignore stop */
    hasReviewed,
    canReview: r.status === 'COMPLETED' && !hasReviewed,
  };
}

async function getRawRequest(id: string) {
  const r = await prisma.exchangeRequest.findUnique({ where: { id } });
  if (!r) throw new NotFoundError('Solicitação não encontrada');
  return r;
}

export async function getRequestById(userId: string, id: string) {
  const r = await prisma.exchangeRequest.findUnique({ where: { id }, include: requestInclude });
  if (!r) throw new NotFoundError('Solicitação não encontrada');
  if (r.requesterId !== userId && r.recipientId !== userId) {
    throw new ForbiddenError('Você não participa desta solicitação');
  }
  return presentRequest(r, userId);
}

export async function createRequest(requesterId: string, input: CreateRequestInput) {
  if (input.recipientId === requesterId) {
    throw new BadRequestError('Você não pode enviar uma solicitação para si mesmo');
  }

  const [recipient, requester] = await Promise.all([
    prisma.user.findUnique({ where: { id: input.recipientId }, select: { id: true, name: true } }),
    prisma.user.findUnique({ where: { id: requesterId }, select: { name: true } }),
  ]);
  if (!recipient) throw new NotFoundError('Usuário não encontrado');
  /* v8 ignore next -- requester é o usuário autenticado, sempre presente */
  const requesterName = requester?.name ?? 'Alguém';

  // A habilidade solicitada precisa ser ensinada pelo destinatário.
  const teaching = await prisma.userTeachingSkill.findUnique({
    where: { userId_skillId: { userId: input.recipientId, skillId: input.requestedSkillId } },
  });
  if (!teaching) throw new BadRequestError('Este usuário não ensina a habilidade solicitada');

  if (input.type === 'EXCHANGE') {
    if (!input.offeredSkillId) throw new BadRequestError('Informe a habilidade oferecida');
    const offered = await prisma.userTeachingSkill.findUnique({
      where: { userId_skillId: { userId: requesterId, skillId: input.offeredSkillId } },
    });
    if (!offered) throw new BadRequestError('Você não cadastrou a habilidade oferecida');
    if (!teaching.acceptsExchange) {
      throw new BadRequestError('Este usuário não aceita troca para esta habilidade');
    }
  }

  let coinAmount: number | null = null;
  if (input.type === 'COIN') {
    if (!teaching.acceptsCoins) {
      throw new BadRequestError('Este usuário não aceita moedas para esta habilidade');
    }
    coinAmount = input.coinAmount ?? teaching.coinPrice ?? 0;
    if (!coinAmount || coinAmount <= 0) throw new BadRequestError('Quantidade de moedas inválida');
  }

  const duplicate = await prisma.exchangeRequest.findFirst({
    where: {
      requesterId,
      recipientId: input.recipientId,
      requestedSkillId: input.requestedSkillId,
      status: { in: ['PENDING', 'ACCEPTED'] },
    },
  });
  if (duplicate) throw new ConflictError('Já existe uma solicitação ativa para esta habilidade');

  const created = await prisma.$transaction(async (tx) => {
    const request = await tx.exchangeRequest.create({
      data: {
        requesterId,
        recipientId: input.recipientId,
        requestedSkillId: input.requestedSkillId,
        offeredSkillId: input.type === 'EXCHANGE' ? input.offeredSkillId : null,
        type: input.type,
        status: 'PENDING',
        coinAmount,
        message: input.message,
        suggestedDate: input.suggestedDate,
        events: { create: { status: 'PENDING', note: 'Solicitação criada' } },
      },
    });

    if (input.type === 'COIN' && coinAmount) {
      await walletService.lockCoins(tx, requesterId, coinAmount, request.id);
    }

    await tx.notification.create({
      data: {
        userId: input.recipientId,
        type: 'REQUEST_RECEIVED',
        title: 'Nova solicitação recebida',
        message:
          input.type === 'COIN'
            ? `${requesterName} quer agendar uma aula com você`
            : `${requesterName} propôs uma troca de habilidades`,
        link: `/requests/${request.id}`,
      },
    });

    return request;
  });

  // Emissões sempre após o commit da transação
  emitToUser(input.recipientId, 'notification:new', { link: `/requests/${created.id}` });
  emitToUsers([requesterId, input.recipientId], 'request:updated', {
    requestId: created.id,
    status: 'PENDING',
  });

  return getRequestById(requesterId, created.id);
}

export async function listRequests(
  userId: string,
  box: 'sent' | 'received' | 'all',
  status?: string,
) {
  const where: Prisma.ExchangeRequestWhereInput =
    box === 'sent'
      ? { requesterId: userId }
      : box === 'received'
        ? { recipientId: userId }
        : { OR: [{ requesterId: userId }, { recipientId: userId }] };

  if (status) where.status = status;

  const requests = await prisma.exchangeRequest.findMany({
    where,
    include: requestInclude,
    orderBy: { updatedAt: 'desc' },
  });
  return { items: requests.map((r) => presentRequest(r, userId)) };
}

export async function acceptRequest(userId: string, id: string) {
  const r = await getRawRequest(id);
  if (r.recipientId !== userId) {
    throw new ForbiddenError('Apenas o destinatário pode aceitar a solicitação');
  }
  if (r.status !== 'PENDING') throw new BadRequestError('A solicitação não está mais pendente');

  await prisma.$transaction(async (tx) => {
    await tx.exchangeRequest.update({
      where: { id },
      data: {
        status: 'ACCEPTED',
        events: { create: { status: 'ACCEPTED', note: 'Solicitação aceita' } },
      },
    });
    await tx.notification.create({
      data: {
        userId: r.requesterId,
        type: 'REQUEST_ACCEPTED',
        title: 'Solicitação aceita 🎉',
        message: 'Sua solicitação foi aceita. Combine os detalhes pelo chat!',
        link: `/requests/${id}`,
      },
    });
  });

  emitToUser(r.requesterId, 'notification:new', { link: `/requests/${id}` });
  emitToUsers([r.requesterId, r.recipientId], 'request:updated', {
    requestId: id,
    status: 'ACCEPTED',
  });

  return getRequestById(userId, id);
}

export async function rejectRequest(userId: string, id: string) {
  const r = await getRawRequest(id);
  if (r.recipientId !== userId) {
    throw new ForbiddenError('Apenas o destinatário pode recusar a solicitação');
  }
  if (r.status !== 'PENDING') throw new BadRequestError('A solicitação não está mais pendente');

  await prisma.$transaction(async (tx) => {
    if (r.type === 'COIN' && r.coinAmount) {
      await walletService.unlockCoins(tx, r.requesterId, r.coinAmount, id);
    }
    await tx.exchangeRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        events: { create: { status: 'REJECTED', note: 'Solicitação recusada' } },
      },
    });
    await tx.notification.create({
      data: {
        userId: r.requesterId,
        type: 'REQUEST_REJECTED',
        title: 'Solicitação recusada',
        message: 'Sua solicitação foi recusada.',
        link: `/requests/${id}`,
      },
    });
  });

  emitToUser(r.requesterId, 'notification:new', { link: `/requests/${id}` });
  emitToUsers([r.requesterId, r.recipientId], 'request:updated', {
    requestId: id,
    status: 'REJECTED',
  });

  return getRequestById(userId, id);
}

export async function cancelRequest(userId: string, id: string) {
  const r = await getRawRequest(id);
  if (r.requesterId !== userId) {
    throw new ForbiddenError('Apenas quem solicitou pode cancelar');
  }
  if (r.status !== 'PENDING' && r.status !== 'ACCEPTED') {
    throw new BadRequestError('Esta solicitação não pode mais ser cancelada');
  }

  await prisma.$transaction(async (tx) => {
    if (r.type === 'COIN' && r.coinAmount) {
      await walletService.unlockCoins(tx, r.requesterId, r.coinAmount, id);
    }
    await tx.exchangeRequest.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        events: { create: { status: 'CANCELLED', note: 'Solicitação cancelada' } },
      },
    });
    await tx.notification.create({
      data: {
        userId: r.recipientId,
        type: 'REQUEST_CANCELLED',
        title: 'Solicitação cancelada',
        message: 'Uma solicitação foi cancelada pelo solicitante.',
        link: `/requests/${id}`,
      },
    });
  });

  emitToUser(r.recipientId, 'notification:new', { link: `/requests/${id}` });
  emitToUsers([r.requesterId, r.recipientId], 'request:updated', {
    requestId: id,
    status: 'CANCELLED',
  });

  return getRequestById(userId, id);
}

export async function completeRequest(userId: string, id: string) {
  const r = await getRawRequest(id);
  if (r.requesterId !== userId && r.recipientId !== userId) {
    throw new ForbiddenError('Você não participa desta solicitação');
  }
  if (r.status !== 'ACCEPTED') {
    throw new BadRequestError('Apenas solicitações aceitas podem ser concluídas');
  }

  await prisma.$transaction(async (tx) => {
    if (r.type === 'COIN' && r.coinAmount) {
      await walletService.settlePayment(tx, r.requesterId, r.recipientId, r.coinAmount, id);
    }
    await tx.exchangeRequest.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        events: { create: { status: 'COMPLETED', note: 'Troca/aula concluída' } },
      },
    });
    await tx.notification.createMany({
      data: [
        {
          userId: r.requesterId,
          type: 'REQUEST_COMPLETED',
          title: 'Troca concluída ✅',
          message: 'Não esqueça de avaliar a experiência!',
          link: `/requests/${id}`,
        },
        {
          userId: r.recipientId,
          type: 'REQUEST_COMPLETED',
          title: 'Troca concluída ✅',
          message: 'Não esqueça de avaliar a experiência!',
          link: `/requests/${id}`,
        },
      ],
    });
    if (r.type === 'COIN' && r.coinAmount) {
      await tx.notification.create({
        data: {
          userId: r.recipientId,
          type: 'COINS_RECEIVED',
          title: 'Moedas recebidas 🪙',
          message: `Você recebeu ${r.coinAmount} moedas pela aula.`,
          link: '/wallet',
        },
      });
    }
  });

  emitToUsers([r.requesterId, r.recipientId], 'notification:new', { link: `/requests/${id}` });
  emitToUsers([r.requesterId, r.recipientId], 'request:updated', {
    requestId: id,
    status: 'COMPLETED',
  });

  return getRequestById(userId, id);
}

// ---- Chat simples vinculado à solicitação ----
async function ensureParticipant(id: string, userId: string) {
  const r = await getRawRequest(id);
  if (r.requesterId !== userId && r.recipientId !== userId) {
    throw new ForbiddenError('Você não participa desta solicitação');
  }
  return r;
}

export async function listMessages(userId: string, requestId: string) {
  await ensureParticipant(requestId, userId);
  await prisma.chatMessage.updateMany({
    where: { requestId, senderId: { not: userId }, read: false },
    data: { read: true },
  });
  const messages = await prisma.chatMessage.findMany({
    where: { requestId },
    include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
    orderBy: { createdAt: 'asc' },
  });
  return {
    items: messages.map((m) => ({
      id: m.id,
      content: m.content,
      createdAt: m.createdAt,
      mine: m.senderId === userId,
      sender: m.sender,
    })),
  };
}

export async function sendMessage(userId: string, requestId: string, content: string) {
  const r = await ensureParticipant(requestId, userId);
  if (r.status !== 'ACCEPTED' && r.status !== 'COMPLETED') {
    throw new BadRequestError('O chat fica disponível após a solicitação ser aceita');
  }
  const recipientId = r.requesterId === userId ? r.recipientId : r.requesterId;

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.chatMessage.create({
      data: { requestId, senderId: userId, content },
      include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
    });
    await tx.notification.create({
      data: {
        userId: recipientId,
        type: 'NEW_MESSAGE',
        title: 'Nova mensagem 💬',
        message: content.length > 60 ? `${content.slice(0, 60)}...` : content,
        link: `/requests/${requestId}`,
      },
    });
    return created;
  });

  // Chat ao vivo para quem está com a solicitação aberta + badge do outro
  emitToRequest(requestId, 'chat:message', {
    id: message.id,
    content: message.content,
    createdAt: message.createdAt,
    sender: message.sender,
  });
  emitToUser(recipientId, 'notification:new', { link: `/requests/${requestId}` });

  return {
    id: message.id,
    content: message.content,
    createdAt: message.createdAt,
    mine: true,
    sender: message.sender,
  };
}
