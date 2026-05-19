/**
 * Constantes de domínio e valores permitidos para os campos "enum-like".
 * Centralizar aqui mantém a validação (Zod) e as regras de negócio consistentes.
 */

export const SKILL_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] as const;
export const LEARNING_LEVELS = ['NONE', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;
export const MODALITIES = ['ONLINE', 'IN_PERSON', 'BOTH'] as const;
export const GENDERS = ['MALE', 'FEMALE', 'OTHER', 'UNDISCLOSED'] as const;
export const PREFERRED_GENDERS = ['MALE', 'FEMALE', 'OTHER', 'ANY'] as const;
export const AVAILABILITY_SLOTS = ['MORNING', 'AFTERNOON', 'NIGHT', 'WEEKEND'] as const;

export const REQUEST_STATUS = [
  'PENDING',
  'ACCEPTED',
  'REJECTED',
  'CANCELLED',
  'COMPLETED',
] as const;
export const REQUEST_TYPES = ['EXCHANGE', 'COIN'] as const;

export const COIN_TX_TYPES = [
  'PURCHASE',
  'EARNING',
  'SPEND',
  'LOCK',
  'UNLOCK',
  'REFUND',
  'BONUS',
] as const;

export const NOTIFICATION_TYPES = [
  'REQUEST_RECEIVED',
  'REQUEST_ACCEPTED',
  'REQUEST_REJECTED',
  'REQUEST_CANCELLED',
  'REQUEST_COMPLETED',
  'NEW_MESSAGE',
  'NEW_MATCH',
  'REVIEW_RECEIVED',
  'COINS_RECEIVED',
] as const;

/** Quantidade de moedas concedidas a novos usuários. */
export const WELCOME_BONUS_COINS = 100;

/** Pesos do algoritmo de match (somam 100). */
export const MATCH_WEIGHTS = {
  reciprocity: 50, // troca recíproca de habilidades (núcleo do match)
  skillMatch: 20, // ensina o que o outro quer aprender
  location: 8, // mesma cidade/estado
  language: 7, // idioma em comum
  modality: 7, // modalidades compatíveis
  availability: 5, // horários compatíveis
  activity: 3, // atividade recente na plataforma
} as const;
