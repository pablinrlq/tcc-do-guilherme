import { describe, it, expect, vi } from 'vitest';
import { authenticate, requireAdmin, AuthRequest } from '../../../src/middlewares/auth';
import { signToken } from '../../../src/utils/jwt';
import { UnauthorizedError, ForbiddenError } from '../../../src/utils/errors';
import type { Response } from 'express';

const res = {} as Response;

describe('authenticate', () => {
  it('lança 401 quando não há header Authorization', () => {
    const req = { headers: {} } as AuthRequest;
    expect(() => authenticate(req, res, vi.fn())).toThrow(UnauthorizedError);
  });

  it('lança 401 quando header não começa com Bearer', () => {
    const req = { headers: { authorization: 'Basic abc' } } as AuthRequest;
    expect(() => authenticate(req, res, vi.fn())).toThrow(UnauthorizedError);
  });

  it('lança 401 para token inválido', () => {
    const req = { headers: { authorization: 'Bearer token.invalido' } } as AuthRequest;
    expect(() => authenticate(req, res, vi.fn())).toThrow('Token inválido ou expirado');
  });

  it('popula userId/userRole e chama next para token válido', () => {
    const token = signToken({ sub: 'u1', role: 'ADMIN' });
    const req = { headers: { authorization: `Bearer ${token}` } } as AuthRequest;
    const next = vi.fn();
    authenticate(req, res, next);
    expect(req.userId).toBe('u1');
    expect(req.userRole).toBe('ADMIN');
    expect(next).toHaveBeenCalledOnce();
  });
});

describe('requireAdmin', () => {
  it('bloqueia usuários comuns com 403', () => {
    const req = { userRole: 'USER' } as AuthRequest;
    expect(() => requireAdmin(req, res, vi.fn())).toThrow(ForbiddenError);
  });

  it('permite administradores', () => {
    const req = { userRole: 'ADMIN' } as AuthRequest;
    const next = vi.fn();
    requireAdmin(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });
});
