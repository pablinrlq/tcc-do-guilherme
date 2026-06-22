import { describe, it, expect, vi, afterEach } from 'vitest';
import { z, ZodError } from 'zod';
import { errorHandler } from '../../../src/middlewares/error-handler';
import { NotFoundError } from '../../../src/utils/errors';
import { env } from '../../../src/config/env';
import type { Request, Response } from 'express';

function mockRes() {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res) as any;
  res.json = vi.fn().mockReturnValue(res) as any;
  return res as Response;
}

const req = {} as Request;
const next = vi.fn();

afterEach(() => {
  vi.restoreAllMocks();
});

describe('errorHandler', () => {
  it('traduz ZodError em 422 com lista de issues', () => {
    const res = mockRes();
    let zodErr: ZodError;
    try {
      z.object({ x: z.string() }).parse({ x: 1 });
      throw new Error('deveria ter lançado');
    } catch (e) {
      zodErr = e as ZodError;
    }
    errorHandler(zodErr!, req, res, next);
    expect(res.status).toHaveBeenCalledWith(422);
    expect((res.json as any).mock.calls[0][0].error).toBe('Dados inválidos');
  });

  it('usa o statusCode de um AppError conhecido', () => {
    const res = mockRes();
    errorHandler(new NotFoundError('sumiu'), req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect((res.json as any).mock.calls[0][0].error).toBe('sumiu');
  });

  it('responde 500 para erro inesperado (sem debug fora de dev)', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = mockRes();
    const original = env.isDev;
    env.isDev = false;
    errorHandler(new Error('boom'), req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect((res.json as any).mock.calls[0][0].debug).toBeUndefined();
    env.isDev = original;
  });

  it('inclui debug quando em modo desenvolvimento', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = mockRes();
    const original = env.isDev;
    env.isDev = true;
    errorHandler(new Error('boom'), req, res, next);
    expect((res.json as any).mock.calls[0][0].debug).toContain('boom');
    env.isDev = original;
  });
});
