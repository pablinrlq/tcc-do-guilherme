import { prisma } from '../../config/prisma';
import { slugify } from '../../utils/slug';
import { stringifyArray } from '../../utils/json';
import { NotFoundError, ConflictError, BadRequestError } from '../../utils/errors';
import {
  presentSkill,
  presentCategory,
  presentTeachingSkill,
  presentLearningSkill,
} from '../users/user.presenter';
import {
  CreateTeachingSkillInput,
  UpdateTeachingSkillInput,
  CreateLearningSkillInput,
  UpdateLearningSkillInput,
} from './skill.schemas';

interface SkillRefInput {
  skillId?: string;
  skillName?: string;
  categoryId?: string;
}

/** Garante uma categoria de fallback ("Outros") para habilidades livres. */
async function getFallbackCategoryId(preferred?: string): Promise<string> {
  if (preferred) {
    const c = await prisma.category.findUnique({ where: { id: preferred } });
    if (c) return c.id;
  }
  const slug = 'outros';
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) return existing.id;
  const created = await prisma.category.create({
    data: { name: 'Outros', slug, icon: '✨', color: '#9CA3AF' },
  });
  return created.id;
}

/** Resolve o id de uma habilidade a partir do catálogo ou criando uma nova. */
export async function resolveSkillId(input: SkillRefInput): Promise<string> {
  if (input.skillId) {
    const skill = await prisma.skill.findUnique({ where: { id: input.skillId } });
    if (!skill) throw new NotFoundError('Habilidade não encontrada no catálogo');
    return skill.id;
  }
  if (input.skillName && input.skillName.trim().length >= 2) {
    const name = input.skillName.trim();
    const slug = slugify(name);
    const existing = await prisma.skill.findUnique({ where: { slug } });
    if (existing) return existing.id;
    const categoryId = await getFallbackCategoryId(input.categoryId);
    const created = await prisma.skill.create({ data: { name, slug, categoryId } });
    return created.id;
  }
  throw new BadRequestError('Informe uma habilidade (skillId ou skillName)');
}

export async function listCategories() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { skills: true } } },
    orderBy: { name: 'asc' },
  });
  return categories.map((c) => ({ ...presentCategory(c), skillsCount: c._count.skills }));
}

export async function listSkills(q?: string, categoryId?: string) {
  const skills = await prisma.skill.findMany({
    where: {
      ...(q ? { name: { contains: q } } : {}),
      ...(categoryId ? { categoryId } : {}),
    },
    include: {
      category: true,
      _count: { select: { teachingLinks: true, learningLinks: true } },
    },
    orderBy: { name: 'asc' },
    take: 120,
  });
  return skills.map((s) => ({
    ...presentSkill(s),
    teachersCount: s._count.teachingLinks,
    learnersCount: s._count.learningLinks,
  }));
}

export async function getMySkills(userId: string) {
  const [teaching, learning] = await Promise.all([
    prisma.userTeachingSkill.findMany({
      where: { userId },
      include: { skill: { include: { category: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.userLearningSkill.findMany({
      where: { userId },
      include: { skill: { include: { category: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);
  return {
    teachingSkills: teaching.map(presentTeachingSkill),
    learningSkills: learning.map(presentLearningSkill),
  };
}

/** Apresenta uma habilidade do catálogo com contadores de oferta/demanda. */
function presentCatalogSkill(s: any) {
  return {
    ...presentSkill(s),
    /* v8 ignore start -- _count sempre presente (include do Prisma) */
    teachersCount: s._count?.teachingLinks ?? 0,
    learnersCount: s._count?.learningLinks ?? 0,
    /* v8 ignore stop */
  };
}

// ---- Habilidades salvas (bookmarks de interesse) ----
export async function saveSkill(userId: string, skillId: string) {
  const skill = await prisma.skill.findUnique({ where: { id: skillId } });
  if (!skill) throw new NotFoundError('Habilidade não encontrada');
  await prisma.savedSkill.upsert({
    where: { userId_skillId: { userId, skillId } },
    update: {},
    create: { userId, skillId },
  });
  return { success: true, saved: true };
}

export async function unsaveSkill(userId: string, skillId: string) {
  await prisma.savedSkill.deleteMany({ where: { userId, skillId } });
  return { success: true, saved: false };
}

export async function listSavedSkills(userId: string) {
  const saved = await prisma.savedSkill.findMany({
    where: { userId },
    include: {
      skill: {
        include: {
          category: true,
          _count: { select: { teachingLinks: true, learningLinks: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return { items: saved.map((s) => presentCatalogSkill(s.skill)) };
}

/**
 * Sugestão automática de habilidades similares: do mesmo conjunto de categorias
 * que o usuário já ensina/aprende, ainda não cadastradas por ele, ordenadas por
 * demanda (oferta + procura). Ajuda a descobrir habilidades relacionadas.
 */
export async function getSuggestedSkills(userId: string, limit = 8) {
  const [teaching, learning] = await Promise.all([
    prisma.userTeachingSkill.findMany({ where: { userId }, include: { skill: true } }),
    prisma.userLearningSkill.findMany({ where: { userId }, include: { skill: true } }),
  ]);

  const ownSkillIds = new Set([
    ...teaching.map((t) => t.skillId),
    ...learning.map((l) => l.skillId),
  ]);
  const categoryIds = [
    ...new Set([
      ...teaching.map((t) => t.skill.categoryId),
      ...learning.map((l) => l.skill.categoryId),
    ]),
  ];
  if (categoryIds.length === 0) return { items: [] };

  const candidates = await prisma.skill.findMany({
    where: { categoryId: { in: categoryIds }, id: { notIn: [...ownSkillIds] } },
    include: {
      category: true,
      _count: { select: { teachingLinks: true, learningLinks: true } },
    },
  });

  const items = candidates
    .map((s) => ({
      ...presentCatalogSkill(s),
      demand: s._count.teachingLinks + s._count.learningLinks,
    }))
    .sort((a, b) => b.demand - a.demand)
    .slice(0, limit);

  return { items };
}

// ---- Habilidades que ensina ----
export async function addTeachingSkill(userId: string, input: CreateTeachingSkillInput) {
  const skillId = await resolveSkillId(input);

  const exists = await prisma.userTeachingSkill.findUnique({
    where: { userId_skillId: { userId, skillId } },
  });
  if (exists) throw new ConflictError('Você já cadastrou esta habilidade para ensinar');

  const created = await prisma.userTeachingSkill.create({
    data: {
      userId,
      skillId,
      level: input.level,
      description: input.description,
      experienceYears: input.experienceYears,
      modality: input.modality,
      acceptsCoins: input.acceptsCoins,
      acceptsExchange: input.acceptsExchange,
      coinPrice: input.coinPrice,
      availability: stringifyArray(input.availability),
      tags: stringifyArray(input.tags),
    },
    include: { skill: { include: { category: true } } },
  });
  return presentTeachingSkill(created);
}

export async function updateTeachingSkill(
  userId: string,
  id: string,
  input: UpdateTeachingSkillInput,
) {
  const existing = await prisma.userTeachingSkill.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new NotFoundError('Habilidade não encontrada');
  }
  const updated = await prisma.userTeachingSkill.update({
    where: { id },
    data: {
      level: input.level,
      description: input.description,
      experienceYears: input.experienceYears,
      modality: input.modality,
      acceptsCoins: input.acceptsCoins,
      acceptsExchange: input.acceptsExchange,
      coinPrice: input.coinPrice,
      availability:
        input.availability !== undefined ? stringifyArray(input.availability) : undefined,
      tags: input.tags !== undefined ? stringifyArray(input.tags) : undefined,
    },
    include: { skill: { include: { category: true } } },
  });
  return presentTeachingSkill(updated);
}

export async function removeTeachingSkill(userId: string, id: string) {
  const existing = await prisma.userTeachingSkill.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new NotFoundError('Habilidade não encontrada');
  }
  await prisma.userTeachingSkill.delete({ where: { id } });
  return { success: true };
}

// ---- Habilidades que deseja aprender ----
export async function addLearningSkill(userId: string, input: CreateLearningSkillInput) {
  const skillId = await resolveSkillId(input);

  const exists = await prisma.userLearningSkill.findUnique({
    where: { userId_skillId: { userId, skillId } },
  });
  if (exists) throw new ConflictError('Você já cadastrou esta habilidade para aprender');

  const created = await prisma.userLearningSkill.create({
    data: {
      userId,
      skillId,
      currentLevel: input.currentLevel,
      goal: input.goal,
      preferredGender: input.preferredGender,
      preferredNationality: input.preferredNationality,
      preferredLanguage: input.preferredLanguage,
      preferredAgeRange: input.preferredAgeRange,
      modality: input.modality,
    },
    include: { skill: { include: { category: true } } },
  });
  return presentLearningSkill(created);
}

export async function updateLearningSkill(
  userId: string,
  id: string,
  input: UpdateLearningSkillInput,
) {
  const existing = await prisma.userLearningSkill.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new NotFoundError('Habilidade não encontrada');
  }
  const updated = await prisma.userLearningSkill.update({
    where: { id },
    data: {
      currentLevel: input.currentLevel,
      goal: input.goal,
      preferredGender: input.preferredGender,
      preferredNationality: input.preferredNationality,
      preferredLanguage: input.preferredLanguage,
      preferredAgeRange: input.preferredAgeRange,
      modality: input.modality,
    },
    include: { skill: { include: { category: true } } },
  });
  return presentLearningSkill(updated);
}

export async function removeLearningSkill(userId: string, id: string) {
  const existing = await prisma.userLearningSkill.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new NotFoundError('Habilidade não encontrada');
  }
  await prisma.userLearningSkill.delete({ where: { id } });
  return { success: true };
}
