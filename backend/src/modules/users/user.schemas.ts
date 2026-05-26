import { z } from 'zod';
import { GENDERS, MODALITIES, SKILL_LEVELS, AVAILABILITY_SLOTS } from '../../utils/constants';
import { createTeachingSkillSchema, createLearningSkillSchema } from '../skills/skill.schemas';

/** Booleano vindo de query string ('true'/'false'). */
const boolParam = z.preprocess((v) => {
  if (v === 'true' || v === true) return true;
  if (v === 'false' || v === false) return false;
  return undefined;
}, z.boolean().optional());

export const updateBasicSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  bio: z.string().max(200).optional(),
  city: z.string().max(80).optional(),
  state: z.string().max(80).optional(),
});
export type UpdateBasicInput = z.infer<typeof updateBasicSchema>;

export const updateProfileSchema = z.object({
  gender: z.enum(GENDERS).optional(),
  birthDate: z.coerce.date().optional(),
  nationality: z.string().max(60).optional(),
  languages: z.array(z.string().max(40)).max(20).optional(),
  learningPrefs: z.array(z.string().max(40)).max(20).optional(),
  availability: z.array(z.enum(AVAILABILITY_SLOTS)).optional(),
  preferredModality: z.enum(MODALITIES).optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const onboardingSchema = z.object({
  profile: updateProfileSchema.optional(),
  teachingSkills: z.array(createTeachingSkillSchema).max(20).optional(),
  learningSkills: z.array(createLearningSkillSchema).max(20).optional(),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Informe sua senha para confirmar'),
});
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;

export const searchSchema = z.object({
  q: z.string().trim().max(80).optional(),
  skillId: z.string().optional(),
  categoryId: z.string().optional(),
  modality: z.enum(MODALITIES).optional(),
  level: z.enum(SKILL_LEVELS).optional(),
  city: z.string().max(80).optional(),
  state: z.string().max(80).optional(),
  language: z.string().max(40).optional(),
  nationality: z.string().max(60).optional(),
  gender: z.enum(GENDERS).optional(),
  minAge: z.coerce.number().int().min(0).max(120).optional(),
  maxAge: z.coerce.number().int().min(0).max(120).optional(),
  acceptsCoins: boolParam,
  acceptsExchange: boolParam,
  availability: z.enum(AVAILABILITY_SLOTS).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});
export type SearchInput = z.infer<typeof searchSchema>;
