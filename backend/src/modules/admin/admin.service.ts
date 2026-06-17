import { prisma } from '../../config/prisma';
import { slugify } from '../../utils/slug';
import { NotFoundError, ConflictError, BadRequestError } from '../../utils/errors';
import {
  ListUsersInput,
  CategoryCreateInput,
  CategoryUpdateInput,
  SkillCreateInput,
  SkillUpdateInput,
} from './admin.schemas';

// ---------------------------------------------------------------------------
//  Usuários
// ---------------------------------------------------------------------------

/** Lista usuários da plataforma com busca por nome/e-mail e paginação. */
export async function listUsers(f: ListUsersInput) {
  const where = f.q
    ? { OR: [{ name: { contains: f.q } }, { email: { contains: f.q } }] }
    : {};

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        city: true,
        state: true,
        avatarUrl: true,
        isActive: true,
        onboardingCompleted: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (f.page - 1) * f.limit,
      take: f.limit,
    }),
  ]);

  return {
    items: users,
    total,
    page: f.page,
    limit: f.limit,
    hasMore: f.page * f.limit < total,
  };
}

/** Ativa/desativa a conta de um usuário (admin não pode se autodesativar). */
export async function setUserStatus(adminId: string, targetId: string, isActive: boolean) {
  if (adminId === targetId) {
    throw new BadRequestError('Você não pode desativar a própria conta de administrador');
  }
  const user = await prisma.user.findUnique({ where: { id: targetId } });
  if (!user) throw new NotFoundError('Usuário não encontrado');

  const updated = await prisma.user.update({
    where: { id: targetId },
    data: { isActive },
    select: { id: true, name: true, email: true, isActive: true },
  });
  return { user: updated };
}

// ---------------------------------------------------------------------------
//  Categorias
// ---------------------------------------------------------------------------

async function ensureCategoryNameFree(name: string, exceptId?: string) {
  const slug = slugify(name);
  const existing = await prisma.category.findFirst({
    where: { OR: [{ name }, { slug }], NOT: exceptId ? { id: exceptId } : undefined },
  });
  if (existing) throw new ConflictError('Já existe uma categoria com este nome');
  return slug;
}

export async function createCategory(input: CategoryCreateInput) {
  const slug = await ensureCategoryNameFree(input.name);
  const category = await prisma.category.create({
    data: { name: input.name, slug, icon: input.icon, color: input.color },
  });
  return { category };
}

export async function updateCategory(id: string, input: CategoryUpdateInput) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new NotFoundError('Categoria não encontrada');

  let slug: string | undefined;
  if (input.name && input.name !== category.name) {
    slug = await ensureCategoryNameFree(input.name, id);
  }

  const updated = await prisma.category.update({
    where: { id },
    data: { name: input.name, slug, icon: input.icon, color: input.color },
  });
  return { category: updated };
}

export async function deleteCategory(id: string) {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { skills: true } } },
  });
  if (!category) throw new NotFoundError('Categoria não encontrada');
  if (category._count.skills > 0) {
    throw new ConflictError(
      `A categoria possui ${category._count.skills} habilidade(s). Remova-as ou mova-as antes de excluir.`,
    );
  }
  await prisma.category.delete({ where: { id } });
  return { success: true };
}

// ---------------------------------------------------------------------------
//  Habilidades (catálogo)
// ---------------------------------------------------------------------------

async function ensureSkillNameFree(name: string, exceptId?: string) {
  const slug = slugify(name);
  const existing = await prisma.skill.findFirst({
    where: { OR: [{ name }, { slug }], NOT: exceptId ? { id: exceptId } : undefined },
  });
  if (existing) throw new ConflictError('Já existe uma habilidade com este nome');
  return slug;
}

export async function createSkill(input: SkillCreateInput) {
  const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
  if (!category) throw new NotFoundError('Categoria não encontrada');

  const slug = await ensureSkillNameFree(input.name);
  const skill = await prisma.skill.create({
    data: { name: input.name, slug, categoryId: input.categoryId },
    include: { category: true },
  });
  return { skill };
}

export async function updateSkill(id: string, input: SkillUpdateInput) {
  const skill = await prisma.skill.findUnique({ where: { id } });
  if (!skill) throw new NotFoundError('Habilidade não encontrada');

  if (input.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
    if (!category) throw new NotFoundError('Categoria não encontrada');
  }

  let slug: string | undefined;
  if (input.name && input.name !== skill.name) {
    slug = await ensureSkillNameFree(input.name, id);
  }

  const updated = await prisma.skill.update({
    where: { id },
    data: { name: input.name, slug, categoryId: input.categoryId },
    include: { category: true },
  });
  return { skill: updated };
}

export async function deleteSkill(id: string) {
  const skill = await prisma.skill.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          teachingLinks: true,
          learningLinks: true,
          requestedIn: true,
          offeredIn: true,
          reviews: true,
        },
      },
    },
  });
  if (!skill) throw new NotFoundError('Habilidade não encontrada');

  const c = skill._count;
  const inUse = c.teachingLinks + c.learningLinks + c.requestedIn + c.offeredIn + c.reviews;
  if (inUse > 0) {
    throw new ConflictError(
      'Esta habilidade está em uso (perfis, solicitações ou avaliações) e não pode ser excluída.',
    );
  }

  // savedBy tem onDelete: Cascade no schema — bookmarks caem junto.
  await prisma.skill.delete({ where: { id } });
  return { success: true };
}
