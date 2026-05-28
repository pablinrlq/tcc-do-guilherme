import { z } from 'zod';
import {
  SKILL_LEVELS,
  LEARNING_LEVELS,
  MODALITIES,
  PREFERRED_GENDERS,
  AVAILABILITY_SLOTS,
} from '../../utils/constants';

/** Identificação da habilidade: catálogo (skillId) ou texto livre (skillName). */
const skillRef = {
  skillId: z.string().optional(),
  skillName: z.string().min(2, 'Nome da habilidade muito curto').max(60).optional(),
  categoryId: z.string().optional(),
};

const hasSkillRef = (d: { skillId?: string; skillName?: string }) =>
  Boolean(d.skillId || d.skillName);

// ----- Habilidade que ENSINA -----
export const createTeachingSkillSchema = z
  .object({
    ...skillRef,
    level: z.enum(SKILL_LEVELS),
    description: z.string().max(500).optional(),
    experienceYears: z.number().int().min(0).max(80).optional(),
    modality: z.enum(MODALITIES).default('BOTH'),
    acceptsCoins: z.boolean().default(true),
    acceptsExchange: z.boolean().default(true),
    coinPrice: z.number().int().min(0).max(100000).optional(),
    availability: z.array(z.enum(AVAILABILITY_SLOTS)).optional(),
    tags: z.array(z.string().max(30)).max(10).optional(),
  })
  .refine(hasSkillRef, { message: 'Informe a habilidade (skillId ou skillName)' });
export type CreateTeachingSkillInput = z.infer<typeof createTeachingSkillSchema>;

export const updateTeachingSkillSchema = z.object({
  level: z.enum(SKILL_LEVELS).optional(),
  description: z.string().max(500).optional(),
  experienceYears: z.number().int().min(0).max(80).optional(),
  modality: z.enum(MODALITIES).optional(),
  acceptsCoins: z.boolean().optional(),
  acceptsExchange: z.boolean().optional(),
  coinPrice: z.number().int().min(0).max(100000).nullable().optional(),
  availability: z.array(z.enum(AVAILABILITY_SLOTS)).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
});
export type UpdateTeachingSkillInput = z.infer<typeof updateTeachingSkillSchema>;

// ----- Habilidade que DESEJA APRENDER -----
export const createLearningSkillSchema = z
  .object({
    ...skillRef,
    currentLevel: z.enum(LEARNING_LEVELS).default('NONE'),
    goal: z.string().max(300).optional(),
    preferredGender: z.enum(PREFERRED_GENDERS).optional(),
    preferredNationality: z.string().max(60).optional(),
    preferredLanguage: z.string().max(60).optional(),
    preferredAgeRange: z.string().max(20).optional(),
    modality: z.enum(MODALITIES).default('BOTH'),
  })
  .refine(hasSkillRef, { message: 'Informe a habilidade (skillId ou skillName)' });
export type CreateLearningSkillInput = z.infer<typeof createLearningSkillSchema>;

export const updateLearningSkillSchema = z.object({
  currentLevel: z.enum(LEARNING_LEVELS).optional(),
  goal: z.string().max(300).optional(),
  preferredGender: z.enum(PREFERRED_GENDERS).optional(),
  preferredNationality: z.string().max(60).optional(),
  preferredLanguage: z.string().max(60).optional(),
  preferredAgeRange: z.string().max(20).optional(),
  modality: z.enum(MODALITIES).optional(),
});
export type UpdateLearningSkillInput = z.infer<typeof updateLearningSkillSchema>;
