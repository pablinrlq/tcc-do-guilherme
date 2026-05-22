import rateLimit, { type RateLimitRequestHandler } from 'express-rate-limit';
import { env } from '../config/env';

interface LimiterOptions {
  windowMs: number;
  max: number;
  enabled: boolean;
}

/**
 * Cria um limitador de requisições por IP. Quando `enabled` é falso
 * (ambiente de teste), o limite é ignorado — os testes de integração e o
 * E2E disparam dezenas de requisições em sequência e estourariam o limite.
 */
export function createLimiter(opts: LimiterOptions): RateLimitRequestHandler {
  return rateLimit({
    windowMs: opts.windowMs,
    limit: opts.max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => !opts.enabled,
    handler: (_req, res) =>
      res.status(429).json({ error: 'Muitas requisições. Tente novamente em instantes.' }),
  });
}

/** Limite global da API: 300 requisições por minuto por IP. */
export const globalLimiter = createLimiter({
  windowMs: 60_000,
  max: 300,
  enabled: env.nodeEnv !== 'test',
});

/** Limite estrito para rotas sensíveis de autenticação (anti força bruta). */
export const authLimiter = createLimiter({
  windowMs: 15 * 60_000,
  max: 10,
  enabled: env.nodeEnv !== 'test',
});
