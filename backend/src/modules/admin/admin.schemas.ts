import { z } from 'zod';

export const listUsersSchema = z.object({
  q: z.string().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListUsersInput = z.infer<typeof listUsersSchema>;

export const setUserStatusSchema = z.object({
  isActive: z.boolean(),
});
export type SetUserStatusInput = z.infer<typeof setUserStatusSchema>;

export const categoryCreateSchema = z.object({
  name: z.string().min(2, 'Nome muito curto').max(40),
  icon: z.string().max(40).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve estar no formato #RRGGBB')
    .optional(),
});
export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;

export const categoryUpdateSchema = categoryCreateSchema.partial();
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;

export const skillCreateSchema = z.object({
  name: z.string().min(2, 'Nome muito curto').max(60),
  categoryId: z.string().min(1, 'Informe a categoria'),
});
export type SkillCreateInput = z.infer<typeof skillCreateSchema>;

export const skillUpdateSchema = skillCreateSchema.partial();
export type SkillUpdateInput = z.infer<typeof skillUpdateSchema>;
