import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword } from '../../../src/utils/password';

describe('password', () => {
  it('gera um hash diferente da senha em texto puro', async () => {
    const hash = await hashPassword('senha123');
    expect(hash).not.toBe('senha123');
    expect(hash.length).toBeGreaterThan(20);
  });

  it('confirma a senha correta', async () => {
    const hash = await hashPassword('segredo');
    expect(await comparePassword('segredo', hash)).toBe(true);
  });

  it('rejeita a senha incorreta', async () => {
    const hash = await hashPassword('segredo');
    expect(await comparePassword('errada', hash)).toBe(false);
  });
});
