import { describe, it, expect } from 'vitest';
import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  BadRequestError,
} from '../../../src/utils/errors';

describe('hierarquia de erros', () => {
  it('AppError usa 400 por padrão e aceita statusCode/details customizados', () => {
    const def = new AppError('algo');
    expect(def.statusCode).toBe(400);
    const custom = new AppError('outro', 418, { foo: 'bar' });
    expect(custom.statusCode).toBe(418);
    expect(custom.details).toEqual({ foo: 'bar' });
    expect(custom.name).toBe('AppError');
  });

  it('cada subclasse mapeia o statusCode HTTP correto', () => {
    expect(new NotFoundError().statusCode).toBe(404);
    expect(new UnauthorizedError().statusCode).toBe(401);
    expect(new ForbiddenError().statusCode).toBe(403);
    expect(new ConflictError().statusCode).toBe(409);
    expect(new BadRequestError().statusCode).toBe(400);
  });

  it('mensagens padrão e customizadas funcionam', () => {
    expect(new NotFoundError().message).toBe('Recurso não encontrado');
    expect(new NotFoundError('sumiu').message).toBe('sumiu');
  });
});
