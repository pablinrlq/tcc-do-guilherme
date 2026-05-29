import { parseJsonArray } from '../../utils/json';

/**
 * Camada de apresentação (DTO): converte modelos do Prisma em objetos seguros
 * para a API, removendo dados sensíveis (ex.: passwordHash) e convertendo
 * campos JSON em arrays.
 */

interface CategoryLike {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  color?: string | null;
}

interface SkillLike {
  id: string;
  name: string;
  slug: string;
  category?: CategoryLike | null;
}

export function presentCategory(category: CategoryLike) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    icon: category.icon ?? null,
    color: category.color ?? null,
  };
}

export function presentSkill(skill: SkillLike) {
  return {
    id: skill.id,
    name: skill.name,
    slug: skill.slug,
    category: skill.category ? presentCategory(skill.category) : null,
  };
}

export function presentTeachingSkill(ts: any) {
  return {
    id: ts.id,
    level: ts.level,
    description: ts.description ?? null,
    experienceYears: ts.experienceYears ?? null,
    modality: ts.modality,
    acceptsCoins: ts.acceptsCoins,
    acceptsExchange: ts.acceptsExchange,
    coinPrice: ts.coinPrice ?? null,
    availability: parseJsonArray(ts.availability),
    tags: parseJsonArray(ts.tags),
    skill: ts.skill ? presentSkill(ts.skill) : null,
  };
}

export function presentLearningSkill(ls: any) {
  return {
    id: ls.id,
    currentLevel: ls.currentLevel,
    goal: ls.goal ?? null,
    modality: ls.modality,
    preferredGender: ls.preferredGender ?? null,
    preferredNationality: ls.preferredNationality ?? null,
    preferredLanguage: ls.preferredLanguage ?? null,
    preferredAgeRange: ls.preferredAgeRange ?? null,
    skill: ls.skill ? presentSkill(ls.skill) : null,
  };
}

export function presentProfile(profile: any | null | undefined) {
  if (!profile) return null;
  return {
    gender: profile.gender ?? null,
    birthDate: profile.birthDate ?? null,
    nationality: profile.nationality ?? null,
    languages: parseJsonArray(profile.languages),
    learningPrefs: parseJsonArray(profile.learningPrefs),
    availability: parseJsonArray(profile.availability),
    preferredModality: profile.preferredModality ?? null,
  };
}

function computeRating(reviews: { rating: number }[] | undefined, count?: number, sum?: number) {
  if (reviews && reviews.length > 0) {
    const total = reviews.reduce((acc, r) => acc + r.rating, 0);
    return { average: Number((total / reviews.length).toFixed(1)), count: reviews.length };
  }
  if (typeof count === 'number' && count > 0 && typeof sum === 'number') {
    return { average: Number((sum / count).toFixed(1)), count };
  }
  return { average: 0, count: 0 };
}

/**
 * Representação privada do próprio usuário autenticado (inclui e-mail/carteira).
 */
export function presentAuthUser(user: any) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl ?? null,
    bio: user.bio ?? null,
    city: user.city ?? null,
    state: user.state ?? null,
    onboardingCompleted: user.onboardingCompleted,
    createdAt: user.createdAt,
    wallet: user.wallet
      ? { balance: user.wallet.balance, lockedBalance: user.wallet.lockedBalance }
      : null,
    profile: presentProfile(user.profile),
  };
}

/**
 * Representação pública de um usuário (feed, busca, perfil de terceiros).
 */
export function presentPublicUser(user: any) {
  const rating = computeRating(
    user.reviewsReceived,
    user._count?.reviewsReceived,
    user.ratingSum,
  );
  return {
    id: user.id,
    name: user.name,
    avatarUrl: user.avatarUrl ?? null,
    bio: user.bio ?? null,
    city: user.city ?? null,
    state: user.state ?? null,
    onboardingCompleted: user.onboardingCompleted,
    memberSince: user.createdAt ?? null,
    lastActiveAt: user.lastActiveAt ?? null,
    rating,
    teachingSkills: Array.isArray(user.teachingSkills)
      ? user.teachingSkills.map(presentTeachingSkill)
      : [],
    learningSkills: Array.isArray(user.learningSkills)
      ? user.learningSkills.map(presentLearningSkill)
      : [],
    profile: user.profile ? presentProfile(user.profile) : undefined,
  };
}
