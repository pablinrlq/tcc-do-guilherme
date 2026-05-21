import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { hashPassword, comparePassword } from '../../utils/password';
import { signToken } from '../../utils/jwt';
import { generateResetToken, hashResetToken } from '../../utils/reset-token';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from '../../utils/errors';
import { WELCOME_BONUS_COINS } from '../../utils/constants';
import { presentAuthUser } from '../users/user.presenter';
import {
  RegisterInput,
  LoginInput,
  ChangePasswordInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from './auth.schemas';

/** Validade do token de recuperação de senha (1 hora). */
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

/**
 * Cria um novo usuário com perfil vazio e carteira com bônus de boas-vindas.
 */
export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ConflictError('Já existe uma conta com este e-mail');
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      bio: input.bio,
      city: input.city,
      state: input.state,
      profile: { create: {} },
      wallet: {
        create: {
          balance: WELCOME_BONUS_COINS,
          transactions: {
            create: {
              amount: WELCOME_BONUS_COINS,
              type: 'BONUS',
              description: 'Bônus de boas-vindas',
              balanceAfter: WELCOME_BONUS_COINS,
            },
          },
        },
      },
    },
    include: { profile: true, wallet: true },
  });

  const token = signToken({ sub: user.id, role: user.role });
  return { user: presentAuthUser(user), token };
}

/**
 * Autentica um usuário existente comparando a senha com o hash armazenado.
 */
export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { profile: true, wallet: true },
  });

  // Mensagem genérica evita revelar se o e-mail existe (boa prática de segurança).
  if (!user) {
    throw new UnauthorizedError('E-mail ou senha inválidos');
  }

  const valid = await comparePassword(input.password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError('E-mail ou senha inválidos');
  }

  if (!user.isActive) {
    throw new ForbiddenError('Esta conta foi desativada');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastActiveAt: new Date() },
  });

  const token = signToken({ sub: user.id, role: user.role });
  return { user: presentAuthUser(user), token };
}

/**
 * Retorna os dados do usuário autenticado.
 */
export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true, wallet: true },
  });
  if (!user) {
    throw new NotFoundError('Usuário não encontrado');
  }
  // 401 derruba a sessão no frontend — mitiga tokens JWT já emitidos
  // antes da desativação da conta (middleware permanece stateless).
  if (!user.isActive) {
    throw new UnauthorizedError('Conta desativada');
  }
  return presentAuthUser(user);
}

/**
 * Altera a senha do usuário autenticado, exigindo a senha atual.
 */
export async function changePassword(userId: string, input: ChangePasswordInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  /* v8 ignore next -- usuário autenticado já validado pelo middleware */
  if (!user) throw new NotFoundError('Usuário não encontrado');

  const valid = await comparePassword(input.currentPassword, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError('Senha atual incorreta');
  }

  const passwordHash = await hashPassword(input.newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  return { success: true };
}

/**
 * Inicia a recuperação de senha. A resposta é sempre a mesma, exista ou não
 * a conta (evita enumeração de e-mails). Sem serviço de e-mail no MVP:
 * fora de produção o token/link é retornado na resposta e logado no
 * console — suficiente para demonstrar o fluxo completo.
 */
export async function forgotPassword(input: ForgotPasswordInput) {
  const generic = {
    success: true,
    message: 'Se o e-mail existir, enviaremos as instruções de recuperação.',
  };

  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !user.isActive) {
    return generic;
  }

  const { raw, hash } = generateResetToken();
  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
    prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hash,
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    }),
  ]);

  if (env.nodeEnv !== 'production') {
    const resetLink = `${env.clientUrl}/reset-password?token=${raw}`;
    console.log(`[SkillEx] Link de recuperação para ${user.email}: ${resetLink}`);
    return { ...generic, resetToken: raw, resetLink };
  }
  return generic;
}

/**
 * Define uma nova senha a partir de um token de recuperação válido
 * (não expirado e nunca usado).
 */
export async function resetPassword(input: ResetPasswordInput) {
  const tokenHash = hashResetToken(input.token);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!record || record.usedAt || record.expiresAt < new Date() || !record.user.isActive) {
    throw new BadRequestError('Token inválido ou expirado. Solicite um novo link.');
  }

  const passwordHash = await hashPassword(input.password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);
  return { success: true };
}
