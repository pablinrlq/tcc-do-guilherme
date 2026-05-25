import { describe, it, expect } from 'vitest';
import { generateResetToken, hashResetToken } from '../../../src/utils/reset-token';

describe('reset-token', () => {
  it('gera token bruto de 64 hex e hash correspondente', () => {
    const { raw, hash } = generateResetToken();
    expect(raw).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).toBe(hashResetToken(raw));
  });

  it('gera tokens diferentes a cada chamada', () => {
    expect(generateResetToken().raw).not.toBe(generateResetToken().raw);
  });

  it('hash é determinístico e diferente do valor bruto', () => {
    const raw = 'a'.repeat(64);
    expect(hashResetToken(raw)).toBe(hashResetToken(raw));
    expect(hashResetToken(raw)).not.toBe(raw);
  });
});
