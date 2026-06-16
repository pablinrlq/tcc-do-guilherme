import { prisma } from '../../config/prisma';
import { NotFoundError, BadRequestError, ConflictError, ForbiddenError } from '../../utils/errors';
import { emitToUser } from '../../realtime/realtime';
import { CreateReportInput, ResolveReportInput } from './report.schemas';

export async function createReport(reporterId: string, input: CreateReportInput) {
  if (input.targetId && input.targetId === reporterId) {
    throw new BadRequestError('Você não pode denunciar a si mesmo');
  }

  if (input.targetId) {
    const target = await prisma.user.findUnique({ where: { id: input.targetId }, select: { id: true } });
    if (!target) throw new NotFoundError('Usuário não encontrado');
  }

  if (input.requestId) {
    const req = await prisma.exchangeRequest.findUnique({
      where: { id: input.requestId },
      select: { requesterId: true, recipientId: true },
    });
    if (!req) throw new NotFoundError('Solicitação não encontrada');
    if (req.requesterId !== reporterId && req.recipientId !== reporterId) {
      throw new ForbiddenError('Você não participa desta solicitação');
    }
  }

  const existing = await prisma.report.findFirst({
    where: {
      reporterId,
      ...(input.targetId ? { targetId: input.targetId } : {}),
      ...(input.requestId ? { requestId: input.requestId } : {}),
      status: { in: ['PENDING', 'UNDER_REVIEW'] },
    },
  });
  if (existing) throw new ConflictError('Você já possui uma denúncia pendente para este alvo');

  const report = await prisma.report.create({
    data: {
      reporterId,
      targetId: input.targetId,
      requestId: input.requestId,
      type: input.type,
      description: input.description,
    },
  });

  return { id: report.id, status: report.status, createdAt: report.createdAt };
}

export async function listReports(filters: { status?: string; page: number; limit: number }) {
  const { status, page, limit } = filters;
  const where = status ? { status } : {};

  const [items, total] = await Promise.all([
    prisma.report.findMany({
      where,
      include: {
        reporter: { select: { id: true, name: true, avatarUrl: true } },
        target: { select: { id: true, name: true, avatarUrl: true } },
        request: { select: { id: true, type: true, status: true } },
        resolvedBy: { select: { id: true, name: true } },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.report.count({ where }),
  ]);

  return { items, total, page, limit, hasMore: total > page * limit };
}

export async function resolveReport(reportId: string, adminId: string, input: ResolveReportInput) {
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) throw new NotFoundError('Denúncia não encontrada');
  if (report.status === 'RESOLVED' || report.status === 'DISMISSED') {
    throw new BadRequestError('Esta denúncia já foi encerrada');
  }

  const isFinal = input.status === 'RESOLVED' || input.status === 'DISMISSED';

  const updated = await prisma.$transaction(async (tx) => {
    const r = await tx.report.update({
      where: { id: reportId },
      data: {
        status: input.status,
        adminNote: input.adminNote,
        resolvedById: isFinal ? adminId : undefined,
        resolvedAt: isFinal ? new Date() : undefined,
      },
    });

    if (isFinal) {
      await tx.notification.create({
        data: {
          userId: report.reporterId,
          type: 'REPORT_RESOLVED',
          title: input.status === 'RESOLVED' ? 'Denúncia resolvida' : 'Denúncia analisada',
          message:
            input.status === 'RESOLVED'
              ? 'Sua denúncia foi analisada e as medidas necessárias foram tomadas.'
              : 'Sua denúncia foi analisada. Não encontramos violação confirmada desta vez.',
          link: '/notifications',
        },
      });
    }

    return r;
  });

  if (isFinal) {
    emitToUser(report.reporterId, 'notification:new', { link: '/notifications' });
  }

  return {
    id: updated.id,
    status: updated.status,
    adminNote: updated.adminNote,
    resolvedAt: updated.resolvedAt,
  };
}

export async function getUserReports(reporterId: string, page = 1, limit = 10) {
  const [items, total] = await Promise.all([
    prisma.report.findMany({
      where: { reporterId },
      include: {
        target: { select: { id: true, name: true, avatarUrl: true } },
        request: { select: { id: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.report.count({ where: { reporterId } }),
  ]);

  return { items, total, page, limit, hasMore: total > page * limit };
}
