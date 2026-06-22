import { prisma } from '../../src/config/prisma';
import { hashPassword } from '../../src/utils/password';
import { signToken } from '../../src/utils/jwt';
import { slugify } from '../../src/utils/slug';

let counter = 0;

interface MakeUserOpts {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  city?: string | null;
  state?: string | null;
  bio?: string | null;
  onboardingCompleted?: boolean;
  balance?: number;
  lockedBalance?: number;
  lastActiveAt?: Date;
}

/** Cria um usuário (com perfil + carteira) e devolve também um JWT válido. */
export async function makeUser(opts: MakeUserOpts = {}) {
  counter += 1;
  const password = opts.password ?? 'senha123';
  const user = await prisma.user.create({
    data: {
      name: opts.name ?? `Usuário ${counter}`,
      email: opts.email ?? `user${counter}.${Date.now()}@test.com`,
      passwordHash: await hashPassword(password),
      role: opts.role ?? 'USER',
      city: opts.city ?? null,
      state: opts.state ?? null,
      bio: opts.bio ?? null,
      onboardingCompleted: opts.onboardingCompleted ?? false,
      lastActiveAt: opts.lastActiveAt ?? new Date(),
      profile: { create: {} },
      wallet: {
        create: { balance: opts.balance ?? 100, lockedBalance: opts.lockedBalance ?? 0 },
      },
    },
    include: { profile: true, wallet: true },
  });
  const token = signToken({ sub: user.id, role: user.role });
  return { user, token, password };
}

export async function makeCategory(name = `Categoria ${++counter}`) {
  return prisma.category.create({ data: { name, slug: slugify(name) + '-' + counter } });
}

export async function makeSkill(name: string, categoryId?: string) {
  const catId = categoryId ?? (await makeCategory()).id;
  counter += 1;
  return prisma.skill.create({
    data: { name, slug: slugify(name) + '-' + counter, categoryId: catId },
  });
}

interface TeachingOpts {
  level?: string;
  modality?: string;
  acceptsCoins?: boolean;
  acceptsExchange?: boolean;
  coinPrice?: number | null;
  description?: string;
}

export async function addTeaching(userId: string, skillId: string, opts: TeachingOpts = {}) {
  return prisma.userTeachingSkill.create({
    data: {
      userId,
      skillId,
      level: opts.level ?? 'ADVANCED',
      modality: opts.modality ?? 'BOTH',
      acceptsCoins: opts.acceptsCoins ?? true,
      acceptsExchange: opts.acceptsExchange ?? true,
      coinPrice: opts.coinPrice === undefined ? 10 : opts.coinPrice,
      description: opts.description,
    },
  });
}

export async function addLearning(
  userId: string,
  skillId: string,
  opts: { currentLevel?: string; modality?: string } = {},
) {
  return prisma.userLearningSkill.create({
    data: {
      userId,
      skillId,
      currentLevel: opts.currentLevel ?? 'NONE',
      modality: opts.modality ?? 'BOTH',
    },
  });
}
