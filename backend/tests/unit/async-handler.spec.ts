import { describe, it, expect, vi } from 'vitest';
import { asyncHandler } from '../../src/utils/async-handler';
import type { Request, Response, NextFunction } from 'express';

describe('asyncHandler', () => {
  it('chama next(err) quando o handler rejeita', async () => {
    const boom = new Error('falhou');
    const wrapped = asyncHandler(async () => {
      throw boom;
    });
    const next = vi.fn() as unknown as NextFunction;
    wrapped({} as Request, {} as Response, next);
    await new Promise((r) => setImmediate(r));
    expect(next).toHaveBeenCalledWith(boom);
  });

  it('não chama next quando o handler resolve', async () => {
    const wrapped = asyncHandler(async (_req, res) => {
      (res as any).done = true;
      return res;
    });
    const next = vi.fn() as unknown as NextFunction;
    const res = {} as Response;
    wrapped({} as Request, res, next);
    await new Promise((r) => setImmediate(r));
    expect(next).not.toHaveBeenCalled();
    expect((res as any).done).toBe(true);
  });
});
