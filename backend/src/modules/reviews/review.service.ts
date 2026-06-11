import { prisma } from '../../config/prisma';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  ConflictError,
} from '../../utils/errors';
import { emitToUser } from '../../realtime/realtime';
import { CreateReviewInput } from './review.schemas';

/** Cria uma avaliação após uma troca/aula concluída. */
export async function createReview(authorId: string, input: CreateReviewInput) {
  const request = await prisma.exchangeRequest.findUnique({ where: { id: input.requestId } });
  if (!request) throw new NotFoundError('Solicitação não encontrada');
  if (request.requesterId !== authorId && request.recipientId !== authorId) {
    throw new ForbiddenError('Você não participa desta solicitação');
  }
  if (request.status !== 'COMPLETED') {
    throw new BadRequestError('Só é possível avaliar após a conclusão da troca/aula');
  }

  const isRequester = request.requesterId === authorId;
  const targetId = isRequester ? request.recipientId : request.requesterId;
  // Habilidade avaliada = aquela ensinada pela pessoa avaliada.
  const skillId = isRequester
    ? request.requestedSkillId
    : request.offeredSkillId ?? request.requestedSkillId;

  const existing = await prisma.review.findUnique({
    where: { requestId_authorId: { requestId: input.requestId, authorId } },
  });
  if (existing) throw new ConflictError('Você já avaliou esta troca');

  const review = await prisma.$transaction(async (tx) => {
    const created = await tx.review.create({
      data: {
        requestId: input.requestId,
        authorId,
        targetId,
        skillId,
        rating: input.rating,
        comment: input.comment,
      },
    });
    await tx.notification.create({
      data: {
        userId: targetId,
        type: 'REVIEW_RECEIVED',
        title: 'Nova avaliação ⭐',
        message: `Você recebeu uma avaliação de ${input.rating} estrela(s).`,
        link: `/profile/${targetId}`,
      },
    });
    return created;
  });

  emitToUser(targetId, 'notification:new', { link: `/profile/${targetId}` });

  return {
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
  };
}

export async function listUserReviews(userId: string, page = 1, limit = 10) {
  const [reviews, agg] = await Promise.all([
    prisma.review.findMany({
      where: { targetId: userId },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        skill: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.review.aggregate({
      where: { targetId: userId },
      _avg: { rating: true },
      _count: true,
    }),
  ]);

  return {
    items: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      /* v8 ignore next -- skill sempre presente (include do Prisma) */
      skill: r.skill?.name ?? null,
      author: r.author,
    })),
    average: Number((agg._avg.rating ?? 0).toFixed(1)),
    count: agg._count,
    page,
    limit,
  };
}
