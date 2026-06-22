import { describe, it, expect } from 'vitest';
import { slugify } from '../../../src/utils/slug';

describe('slugify', () => {
  it('remove acentos e normaliza para minúsculas', () => {
    expect(slugify('Programação Avançada')).toBe('programacao-avancada');
  });

  it('troca caracteres especiais por hífen', () => {
    expect(slugify('C++ & Node.js!')).toBe('c-node-js');
  });

  it('remove hífens nas pontas e espaços', () => {
    expect(slugify('  Marketing Digital  ')).toBe('marketing-digital');
  });

  it('lida com string só de símbolos', () => {
    expect(slugify('@#$%')).toBe('');
  });
});
