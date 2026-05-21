import { z } from 'zod';

const STRONG_PASSWORD_MESSAGE =
  'A senha deve ter ao menos 8 caracteres, com letra maiúscula, minúscula, número e símbolo.';

const strongPassword = z
  .string()
  .min(8, STRONG_PASSWORD_MESSAGE)
  .max(100)
  .refine(
    (value) =>
      /[A-Z]/.test(value) &&
      /[a-z]/.test(value) &&
      /\d/.test(value) &&
      /[^A-Za-z0-9]/.test(value),
    { message: STRONG_PASSWORD_MESSAGE },
  );

export const registerSchema = z.object({
  name: z.string().min(2, 'Nome muito curto').max(80),
  email: z.string().email('E-mail inválido').toLowerCase(),
  password: strongPassword,
  bio: z.string().max(200).optional(),
  city: z.string().max(80).optional(),
  state: z.string().max(80).optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido').toLowerCase(),
  password: z.string().min(1, 'Informe a senha'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Informe a senha atual'),
  newPassword: strongPassword,
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('E-mail inválido').toLowerCase(),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(10, 'Token inválido'),
  password: strongPassword,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
