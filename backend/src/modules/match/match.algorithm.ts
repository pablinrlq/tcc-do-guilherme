import { MATCH_WEIGHTS } from '../../utils/constants';

/**
 * ============================================================================
 *  ALGORITMO DE MATCH DA SKILLEX
 * ----------------------------------------------------------------------------
 *  Calcula a compatibilidade (0–100) entre dois usuários sob a ótica do
 *  usuário "A" (quem está navegando) em relação ao candidato "B".
 *
 *  A pontuação combina 7 critérios ponderados (pesos somam 100):
 *
 *   1. Reciprocidade (50) — A quer aprender o que B ensina E B quer aprender
 *      o que A ensina. É o núcleo do "Skill Exchange" (troca direta).
 *   2. Compatibilidade de habilidade (20) — quanto dos objetivos de
 *      aprendizagem de A o usuário B consegue ensinar.
 *   3. Localização (8) — mesma cidade vale mais que mesmo estado.
 *   4. Idioma (7) — idiomas em comum.
 *   5. Modalidade (7) — online/presencial compatíveis.
 *   6. Disponibilidade (5) — horários em comum.
 *   7. Atividade recente (3) — usuários ativos têm leve prioridade.
 *
 *  A função é PURA (não acessa banco), o que facilita testes e a explicação
 *  acadêmica do funcionamento.
 * ============================================================================
 */

export interface MatchUser {
  id: string;
  teachSkillIds: string[];
  learnSkillIds: string[];
  city?: string | null;
  state?: string | null;
  languages?: string[];
  availability?: string[];
  preferredModality?: string | null;
  lastActiveAt?: Date | null;
}

export type MatchType = 'PERFECT' | 'PARTIAL' | 'COIN_ONLY';

export interface MatchResult {
  score: number;
  type: MatchType;
  reciprocal: boolean;
  /** Habilidades que B ensina e A deseja aprender. */
  skillsToLearn: string[];
  /** Habilidades que A ensina e B deseja aprender. */
  skillsToTeach: string[];
  breakdown: {
    reciprocity: number;
    skillMatch: number;
    location: number;
    language: number;
    modality: number;
    availability: number;
    activity: number;
  };
}

const DAY_MS = 1000 * 60 * 60 * 24;

/** Pontua a sobreposição de duas listas (idiomas, disponibilidade). */
function scoreOverlap(a: string[] | undefined, b: string[] | undefined, weight: number): number {
  if (!a || !b || a.length === 0 || b.length === 0) {
    return Math.round(weight * 0.5); // perfil incompleto → pontuação neutra
  }
  const setB = new Set(b.map((v) => v.toLowerCase()));
  const common = a.some((v) => setB.has(v.toLowerCase()));
  return common ? weight : 0;
}

/** Pontua compatibilidade de modalidade (online/presencial/ambas). */
function scoreModality(a: string | null | undefined, b: string | null | undefined, weight: number): number {
  if (!a || !b) return Math.round(weight * 0.5);
  if (a === 'BOTH' || b === 'BOTH' || a === b) return weight;
  return 0;
}

/** Pontua a atividade recente do candidato. */
function scoreActivity(date: Date | null | undefined, weight: number): number {
  if (!date) return 0;
  const days = (Date.now() - new Date(date).getTime()) / DAY_MS;
  if (days <= 3) return weight;
  if (days <= 7) return Math.round(weight * 0.66);
  if (days <= 30) return Math.round(weight * 0.33);
  return 0;
}

/**
 * Calcula o match entre o usuário A (navegando) e o candidato B.
 */
export function calculateMatch(a: MatchUser, b: MatchUser): MatchResult {
  const aLearn = new Set(a.learnSkillIds);
  const bLearn = new Set(b.learnSkillIds);

  // d = B ensina o que A quer aprender | r = A ensina o que B quer aprender
  const skillsToLearn = b.teachSkillIds.filter((id) => aLearn.has(id));
  const skillsToTeach = a.teachSkillIds.filter((id) => bLearn.has(id));
  const d = skillsToLearn.length;
  const r = skillsToTeach.length;
  const reciprocal = d > 0 && r > 0;

  // 1. Reciprocidade — núcleo do Skill Exchange
  const reciprocity = reciprocal ? MATCH_WEIGHTS.reciprocity : 0;

  // 2. Compatibilidade de habilidade — cobertura dos objetivos de A
  const coverage = aLearn.size > 0 ? Math.min(1, d / aLearn.size) : 0;
  const skillMatch = Math.round(MATCH_WEIGHTS.skillMatch * coverage);

  // 3. Localização
  let location = 0;
  if (a.city && b.city && a.city.trim().toLowerCase() === b.city.trim().toLowerCase()) {
    location = MATCH_WEIGHTS.location;
  } else if (a.state && b.state && a.state.trim().toLowerCase() === b.state.trim().toLowerCase()) {
    location = Math.round(MATCH_WEIGHTS.location / 2);
  }

  // 4–7. Idioma, modalidade, disponibilidade e atividade
  const language = scoreOverlap(a.languages, b.languages, MATCH_WEIGHTS.language);
  const modality = scoreModality(a.preferredModality, b.preferredModality, MATCH_WEIGHTS.modality);
  const availability = scoreOverlap(a.availability, b.availability, MATCH_WEIGHTS.availability);
  const activity = scoreActivity(b.lastActiveAt, MATCH_WEIGHTS.activity);

  const total =
    reciprocity + skillMatch + location + language + modality + availability + activity;
  const score = Math.max(0, Math.min(100, Math.round(total)));

  let type: MatchType;
  if (reciprocal) type = 'PERFECT';
  else if (d > 0 || r > 0) type = 'PARTIAL';
  else type = 'COIN_ONLY';

  return {
    score,
    type,
    reciprocal,
    skillsToLearn,
    skillsToTeach,
    breakdown: { reciprocity, skillMatch, location, language, modality, availability, activity },
  };
}
