import { PrismaClient } from '@prisma/client';
import { env } from './env';

/**
 * Instância única (singleton) do Prisma Client.
 * O Prisma protege automaticamente contra SQL Injection ao usar
 * consultas parametrizadas.
 */
export const prisma = new PrismaClient({
  log: env.isDev ? ['warn', 'error'] : ['error'],
});
