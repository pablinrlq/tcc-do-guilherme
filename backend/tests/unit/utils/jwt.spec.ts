import { describe, it, expect } from 'vitest';
import { signToken, verifyToken } from '../../../src/utils/jwt';

describe('jwt', () => {
  it('assina e verifica um token (round-trip)', () => {
    const token = signToken({ sub: 'user-1', role: 'USER' });
    expect(typeof token).toBe('string');
    const payload = verifyToken(token);
    expect(payload.sub).toBe('user-1');
    expect(payload.role).toBe('USER');
  });

  it('lança erro para token inválido', () => {
    expect(() => verifyToken('token.invalido.aqui')).toThrow();
  });
});
