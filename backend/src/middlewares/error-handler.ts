import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { env } from '../config/env';

/**
 * Middleware global de tratamento de erros.
 * Traduz exceções conhecidas (Zod, AppError) em respostas HTTP padronizadas.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): Response {
  if (err instanceof ZodError) {
    return res.status(422).json({
      error: 'Dados inválidos',
      issues: err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details,
    });
  }

  // Erro inesperado — registra no servidor e devolve resposta genérica
  console.error('[Erro não tratado]', err);
  return res.status(500).json({
    error: 'Erro interno do servidor',
    ...(env.isDev ? { debug: String(err) } : {}),
  });
}
