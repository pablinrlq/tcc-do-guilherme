import { describe, it, expect } from 'vitest';
import {
  evaluatePassword,
  isStrongPassword,
  passwordStrength,
  PASSWORD_RULE_MESSAGE,
} from '../../src/utils/password';

describe('evaluatePassword', () => {
  it('senha vazia reprova tudo', () => {
    const c = evaluatePassword('');
    expect(c).toEqual({ length: false, upper: false, lower: false, number: false, symbol: false });
  });

  it('senha forte aprova tudo', () => {
    const c = evaluatePassword('Abc123!@');
    expect(c).toEqual({ length: true, upper: true, lower: true, number: true, symbol: true });
  });

  it('detecta cada critério separadamente', () => {
    expect(evaluatePassword('AAAAAAAA').upper).toBe(true);
    expect(evaluatePassword('AAAAAAAA').lower).toBe(false);
    expect(evaluatePassword('aaaaaaaa').lower).toBe(true);
    expect(evaluatePassword('aaaaaaaa').upper).toBe(false);
    expect(evaluatePassword('12345678').number).toBe(true);
    expect(evaluatePassword('!@#$%^&*').symbol).toBe(true);
    expect(evaluatePassword('1234567').length).toBe(false);
    expect(evaluatePassword('12345678').length).toBe(true);
  });
});

describe('isStrongPassword', () => {
  it('retorna true para senha forte', () => {
    expect(isStrongPassword('Abc123!@')).toBe(true);
  });

  it('retorna false se faltar qualquer critério', () => {
    expect(isStrongPassword('abcdefg1!')).toBe(false); // sem maiúscula
    expect(isStrongPassword('ABCDEFG1!')).toBe(false); // sem minúscula
    expect(isStrongPassword('Abcdefg!!')).toBe(false); // sem número
    expect(isStrongPassword('Abcdef12')).toBe(false);  // sem símbolo
    expect(isStrongPassword('Abc1!')).toBe(false);     // muito curta
  });
});

describe('passwordStrength', () => {
  it('retorna score 0 e rótulo "Muito fraca" para senha vazia', () => {
    const { score, label } = passwordStrength('');
    expect(score).toBe(0);
    expect(label).toBe('Muito fraca');
  });

  it('retorna score 1 e rótulo "Muito fraca" para apenas um critério', () => {
    // 'abc': lower=true, demais false → score=1
    const { score, label } = passwordStrength('abc');
    expect(score).toBe(1);
    expect(label).toBe('Muito fraca');
  });

  it('retorna score 2 e rótulo "Fraca" para dois critérios', () => {
    // 'aaaaaaaa': length+lower → score=2
    const { score, label } = passwordStrength('aaaaaaaa');
    expect(score).toBe(2);
    expect(label).toBe('Fraca');
  });

  it('retorna score 3 e rótulo "Razoável"', () => {
    // 'AAAAaaaa': length+upper+lower → score=3
    const { score, label } = passwordStrength('AAAAaaaa');
    expect(score).toBe(3);
    expect(label).toBe('Razoável');
  });

  it('retorna score 4 e rótulo "Boa"', () => {
    // 'AAAAaaaa1': length+upper+lower+number → score=4
    const { score, label } = passwordStrength('AAAAaaaa1');
    expect(score).toBe(4);
    expect(label).toBe('Boa');
  });

  it('retorna score 5 e rótulo "Forte" para senha completa', () => {
    const { score, label } = passwordStrength('Abc123!@');
    expect(score).toBe(5);
    expect(label).toBe('Forte');
  });
});

describe('PASSWORD_RULE_MESSAGE', () => {
  it('é uma string não vazia', () => {
    expect(typeof PASSWORD_RULE_MESSAGE).toBe('string');
    expect(PASSWORD_RULE_MESSAGE.length).toBeGreaterThan(0);
  });
});
