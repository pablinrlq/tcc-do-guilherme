import { prisma } from '../../config/prisma';
import { parseJsonArray } from '../../utils/json';
import { NotFoundError } from '../../utils/errors';
import { presentPublicUser } from '../users/user.presenter';
import { calculateMatch, MatchUser, MatchResult } from './match.algorithm';

/** Include padrão necessário para calcular o match de um usuário. */
export const matchInclude = {
  profile: true,
  teachingSkills: { include: { skill: { include: { category: true } } } },
  learningSkills: { include: { skill: { include: { category: true } } } },
} as const;

/** Converte um usuário do Prisma para a estrutura usada pelo algoritmo. */
export function toMatchUser(user: any): MatchUser {
  return {
    id: user.id,
    teachSkillIds: (user.teachingSkills ?? []).map((t: any) => t.skillId),
    learnSkillIds: (user.learningSkills ?? []).map((l: any) => l.skillId),
    city: user.city,
    state: user.state,
    languages: user.profile ? parseJsonArray(user.profile.languages) : [],
    availability: user.profile ? parseJsonArray(user.profile.availability) : [],
    preferredModality: user.profile?.preferredModality ?? null,
    lastActiveAt: user.lastActiveAt,
  };
}

/** Resolve nomes de habilidades a partir dos vínculos (ensina/aprende). */
export function namesFromLinks(ids: string[], links: any[]): string[] {
  const map = new Map<string, string>(
    (links ?? []).map((l: any) => [l.skillId, l.skill?.name]),
  );
  return ids.map((id) => map.get(id)).filter((n): n is string => Boolean(n));
}

/**
 * Monta o item de usuário com informações de match, reutilizado pelo
 * feed e pela busca para manter uma única fonte de verdade.
 */
export function presentMatchedUser(me: any, user: any, match: MatchResult) {
  return {
    ...presentPublicUser(user),
    match: {
      score: match.score,
      type: match.type,
      reciprocal: match.reciprocal,
      breakdown: match.breakdown,
      skillsTheyTeachYouWant: namesFromLinks(match.skillsToLearn, user.teachingSkills),
      skillsYouTeachTheyWant: namesFromLinks(match.skillsToTeach, me.teachingSkills),
    },
  };
}

/**
 * Calcula o match entre o usuário autenticado e outro usuário,
 * incluindo os nomes das habilidades envolvidas (para exibição).
 */
export async function getMatchBetween(userId: string, otherId: string) {
  const [me, other] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, include: matchInclude }),
    prisma.user.findUnique({ where: { id: otherId }, include: matchInclude }),
  ]);
  if (!me || !other) throw new NotFoundError('Usuário não encontrado');

  const result = calculateMatch(toMatchUser(me), toMatchUser(other));
  return {
    score: result.score,
    type: result.type,
    reciprocal: result.reciprocal,
    breakdown: result.breakdown,
    skillsTheyTeachYouWant: namesFromLinks(result.skillsToLearn, other.teachingSkills),
    skillsYouTeachTheyWant: namesFromLinks(result.skillsToTeach, me.teachingSkills),
  };
}
