import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { parseJsonArray, stringifyArray } from '../../utils/json';
import { comparePassword } from '../../utils/password';
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
  UnauthorizedError,
} from '../../utils/errors';
import * as walletService from '../wallet/wallet.service';
import { emitToUser } from '../../realtime/realtime';
import { presentAuthUser, presentPublicUser } from './user.presenter';
import { calculateMatch } from '../match/match.algorithm';
import {
  toMatchUser,
  matchInclude,
  presentMatchedUser,
  getMatchBetween,
} from '../match/match.service';
import * as skillService from '../skills/skill.service';
import {
  UpdateBasicInput,
  UpdateProfileInput,
  OnboardingInput,
  SearchInput,
} from './user.schemas';

/** Busca e apresenta o usuário autenticado (dados privados). */
async function getAuthUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true, wallet: true },
  });
  /* v8 ignore next -- usuário autenticado já validado em operações anteriores */
  if (!user) throw new NotFoundError('Usuário não encontrado');
  return presentAuthUser(user);
}

function computeAge(date?: Date | null): number | null {
  if (!date) return null;
  const diff = Date.now() - new Date(date).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

export async function updateBasicInfo(userId: string, input: UpdateBasicInput) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      name: input.name,
      bio: input.bio,
      city: input.city,
      state: input.state,
    },
  });
  return getAuthUser(userId);
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  await prisma.userProfile.upsert({
    where: { userId },
    update: {
      gender: input.gender,
      birthDate: input.birthDate,
      nationality: input.nationality,
      languages: input.languages !== undefined ? stringifyArray(input.languages) : undefined,
      learningPrefs:
        input.learningPrefs !== undefined ? stringifyArray(input.learningPrefs) : undefined,
      availability:
        input.availability !== undefined ? stringifyArray(input.availability) : undefined,
      preferredModality: input.preferredModality,
    },
    create: {
      userId,
      gender: input.gender,
      birthDate: input.birthDate,
      nationality: input.nationality,
      languages: stringifyArray(input.languages),
      learningPrefs: stringifyArray(input.learningPrefs),
      availability: stringifyArray(input.availability),
      preferredModality: input.preferredModality,
    },
  });
  return getAuthUser(userId);
}

/** Conclui o onboarding: perfil + habilidades + marca a flag como completa. */
export async function completeOnboarding(userId: string, input: OnboardingInput) {
  if (input.profile) {
    await updateProfile(userId, input.profile);
  }

  for (const ts of input.teachingSkills ?? []) {
    try {
      await skillService.addTeachingSkill(userId, ts);
    } catch (err) {
      if (!(err instanceof ConflictError)) throw err; // ignora duplicadas
    }
  }

  for (const ls of input.learningSkills ?? []) {
    try {
      await skillService.addLearningSkill(userId, ls);
    } catch (err) {
      if (!(err instanceof ConflictError)) throw err;
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { onboardingCompleted: true },
  });
  return getAuthUser(userId);
}

export async function setAvatar(userId: string, filename: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: `/uploads/${filename}` },
  });
  return getAuthUser(userId);
}

/** Perfil público de outro usuário, com avaliações, match e status de favorito. */
export async function getPublicProfile(viewerId: string, targetId: string) {
  const user = await prisma.user.findUnique({
    where: { id: targetId },
    include: { ...matchInclude, reviewsReceived: { select: { rating: true } } },
  });
  if (!user || !user.isActive) throw new NotFoundError('Usuário não encontrado');

  const [reviews, completedCount, favorite, activeRequest] = await Promise.all([
    prisma.review.findMany({
      where: { targetId },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        skill: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.exchangeRequest.count({
      where: {
        status: 'COMPLETED',
        OR: [{ requesterId: targetId }, { recipientId: targetId }],
      },
    }),
    viewerId !== targetId
      ? prisma.favorite.findUnique({
          where: { userId_favoriteUserId: { userId: viewerId, favoriteUserId: targetId } },
        })
      : null,
    // Solicitação em andamento entre quem vê e o dono do perfil (nas duas direções)
    viewerId !== targetId
      ? prisma.exchangeRequest.findFirst({
          where: {
            status: { in: ['PENDING', 'ACCEPTED'] },
            OR: [
              { requesterId: viewerId, recipientId: targetId },
              { requesterId: targetId, recipientId: viewerId },
            ],
          },
          select: { id: true, status: true },
        })
      : null,
  ]);

  const match = viewerId !== targetId ? await getMatchBetween(viewerId, targetId) : null;

  return {
    ...presentPublicUser(user),
    isOwnProfile: viewerId === targetId,
    isFavorite: Boolean(favorite),
    completedExchanges: completedCount,
    match,
    activeRequest,
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      /* v8 ignore next -- skill sempre presente (include do Prisma) */
      skill: r.skill?.name ?? null,
      author: r.author,
    })),
  };
}

/** Busca avançada de usuários com filtros e ordenação por compatibilidade. */
export async function searchUsers(userId: string, f: SearchInput) {
  const where: any = { id: { not: userId }, onboardingCompleted: true, isActive: true };

  const teachingSome: any = {};
  if (f.skillId) teachingSome.skillId = f.skillId;
  if (f.categoryId) teachingSome.skill = { categoryId: f.categoryId };
  if (f.modality) teachingSome.modality = { in: [f.modality, 'BOTH'] };
  if (f.level) teachingSome.level = f.level;
  if (f.acceptsCoins !== undefined) teachingSome.acceptsCoins = f.acceptsCoins;
  if (f.acceptsExchange !== undefined) teachingSome.acceptsExchange = f.acceptsExchange;
  if (Object.keys(teachingSome).length > 0) where.teachingSkills = { some: teachingSome };

  if (f.city) where.city = { contains: f.city };
  if (f.state) where.state = { contains: f.state };

  // Filtros do perfil complementar (mesclados num único objeto para não sobrescrever)
  const profileFilter: any = {};
  if (f.gender) profileFilter.gender = f.gender;
  if (f.nationality) profileFilter.nationality = { contains: f.nationality };
  if (Object.keys(profileFilter).length > 0) where.profile = profileFilter;

  if (f.q) {
    where.OR = [
      { name: { contains: f.q } },
      { bio: { contains: f.q } },
      { teachingSkills: { some: { skill: { name: { contains: f.q } } } } },
    ];
  }

  const me = await prisma.user.findUnique({ where: { id: userId }, include: matchInclude });
  if (!me) throw new NotFoundError('Usuário não encontrado');

  let users = await prisma.user.findMany({
    where,
    include: { ...matchInclude, reviewsReceived: { select: { rating: true } } },
    take: 300,
  });

  // Filtros que dependem de campos JSON / cálculo (feitos em memória)
  if (f.language) {
    const lang = f.language.toLowerCase();
    users = users.filter((u) =>
      parseJsonArray(u.profile?.languages).some((l) => l.toLowerCase().includes(lang)),
    );
  }
  if (f.availability) {
    users = users.filter((u) =>
      parseJsonArray(u.profile?.availability).includes(f.availability as string),
    );
  }
  if (f.minAge !== undefined || f.maxAge !== undefined) {
    users = users.filter((u) => {
      const age = computeAge(u.profile?.birthDate);
      if (age === null) return false;
      if (f.minAge !== undefined && age < f.minAge) return false;
      if (f.maxAge !== undefined && age > f.maxAge) return false;
      return true;
    });
  }

  const meMatch = toMatchUser(me);
  const scored = users.map((user) => ({ user, match: calculateMatch(meMatch, toMatchUser(user)) }));
  scored.sort((a, b) => b.match.score - a.match.score);

  const total = scored.length;
  const start = (f.page - 1) * f.limit;
  const items = scored
    .slice(start, start + f.limit)
    .map(({ user, match }) => presentMatchedUser(me, user, match));

  return { items, page: f.page, limit: f.limit, total, hasMore: start + f.limit < total };
}

/**
 * Exclui a conta do usuário (LGPD — direito ao esquecimento) por ANONIMIZAÇÃO.
 *
 * Estratégia: reviews e solicitações históricas referenciam o usuário sem
 * cascata (a exclusão física quebraria a integridade e apagaria avaliações
 * recebidas por terceiros). Por isso os dados pessoais são removidos e a
 * conta desativada, preservando o histórico de quem interagiu com ela.
 */
export async function deleteAccount(userId: string, password: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  /* v8 ignore next -- usuário autenticado já validado pelo middleware */
  if (!user) throw new NotFoundError('Usuário não encontrado');

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) throw new UnauthorizedError('Senha incorreta');

  // Solicitações em andamento são canceladas e as moedas reservadas são
  // devolvidas ao solicitante — inclusive quando o solicitante é o OUTRO
  // usuário (ninguém perde moedas por causa da exclusão).
  const activeRequests = await prisma.exchangeRequest.findMany({
    where: {
      status: { in: ['PENDING', 'ACCEPTED'] },
      OR: [{ requesterId: userId }, { recipientId: userId }],
    },
  });

  const oldAvatar = user.avatarUrl;

  await prisma.$transaction(async (tx) => {
    for (const r of activeRequests) {
      if (r.type === 'COIN' && r.coinAmount) {
        await walletService.unlockCoins(tx, r.requesterId, r.coinAmount, r.id);
      }
      await tx.exchangeRequest.update({
        where: { id: r.id },
        data: {
          status: 'CANCELLED',
          events: {
            create: { status: 'CANCELLED', note: 'Conta de um participante foi excluída' },
          },
        },
      });
      const otherId = r.requesterId === userId ? r.recipientId : r.requesterId;
      await tx.notification.create({
        data: {
          userId: otherId,
          type: 'REQUEST_CANCELLED',
          title: 'Solicitação cancelada',
          message: 'A solicitação foi cancelada porque o outro participante excluiu a conta.',
          link: `/requests/${r.id}`,
        },
      });
    }

    // Dados pessoais e vínculos do usuário
    await tx.favorite.deleteMany({ where: { OR: [{ userId }, { favoriteUserId: userId }] } });
    await tx.savedSkill.deleteMany({ where: { userId } });
    await tx.notification.deleteMany({ where: { userId } });
    await tx.match.deleteMany({ where: { OR: [{ userAId: userId }, { userBId: userId }] } });
    await tx.userTeachingSkill.deleteMany({ where: { userId } });
    await tx.userLearningSkill.deleteMany({ where: { userId } });
    await tx.passwordResetToken.deleteMany({ where: { userId } });
    await tx.userProfile.deleteMany({ where: { userId } });
    await tx.wallet.deleteMany({ where: { userId } }); // transações caem em cascata

    // Anonimização: histórico de terceiros permanece íntegro
    await tx.user.update({
      where: { id: userId },
      data: {
        name: 'Usuário removido',
        email: `removido+${userId}@skillex.invalid`,
        passwordHash: '!', // nunca valida no bcrypt
        avatarUrl: null,
        bio: null,
        city: null,
        state: null,
        isActive: false,
        onboardingCompleted: false,
      },
    });
  });

  // Emissões após o commit: avisa os outros participantes em tempo real
  for (const r of activeRequests) {
    const otherId = r.requesterId === userId ? r.recipientId : r.requesterId;
    emitToUser(otherId, 'notification:new', { link: `/requests/${r.id}` });
    emitToUser(otherId, 'request:updated', { requestId: r.id, status: 'CANCELLED' });
  }

  // Remove o arquivo físico do avatar (fora da transação; falha não é crítica)
  if (oldAvatar) {
    const file = path.resolve(process.cwd(), env.uploadDir, path.basename(oldAvatar));
    await fs.promises.rm(file, { force: true }).catch(/* v8 ignore next */ () => {});
  }

  return { success: true };
}

export async function addFavorite(userId: string, targetId: string) {
  if (userId === targetId) throw new BadRequestError('Você não pode favoritar a si mesmo');
  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) throw new NotFoundError('Usuário não encontrado');

  await prisma.favorite.upsert({
    where: { userId_favoriteUserId: { userId, favoriteUserId: targetId } },
    update: {},
    create: { userId, favoriteUserId: targetId },
  });
  return { success: true, isFavorite: true };
}

export async function removeFavorite(userId: string, targetId: string) {
  await prisma.favorite.deleteMany({ where: { userId, favoriteUserId: targetId } });
  return { success: true, isFavorite: false };
}

export async function listFavorites(userId: string) {
  const me = await prisma.user.findUnique({ where: { id: userId }, include: matchInclude });
  const favorites = await prisma.favorite.findMany({
    where: { userId, favoriteUser: { isActive: true } },
    include: {
      favoriteUser: {
        include: { ...matchInclude, reviewsReceived: { select: { rating: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const items = favorites.map((fav) => {
    /* v8 ignore next -- favoritos só existem se o dono (me) existir */
    if (!me) return presentPublicUser(fav.favoriteUser);
    const match = calculateMatch(toMatchUser(me), toMatchUser(fav.favoriteUser));
    return presentMatchedUser(me, fav.favoriteUser, match);
  });
  return { items };
}
