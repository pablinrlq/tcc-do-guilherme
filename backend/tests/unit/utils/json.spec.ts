import { describe, it, expect } from 'vitest';
import { parseJsonArray, stringifyArray } from '../../../src/utils/json';

describe('parseJsonArray', () => {
  it('retorna [] para null/undefined', () => {
    expect(parseJsonArray(null)).toEqual([]);
    expect(parseJsonArray(undefined)).toEqual([]);
  });

  it('faz parse de um array JSON válido convertendo para string', () => {
    expect(parseJsonArray('["pt",1]')).toEqual(['pt', '1']);
  });

  it('retorna [] quando o JSON não é um array', () => {
    expect(parseJsonArray('{"a":1}')).toEqual([]);
  });

  it('retorna [] quando o JSON é inválido', () => {
    expect(parseJsonArray('not-json')).toEqual([]);
  });
});

describe('stringifyArray', () => {
  it('retorna null para vazio/null/undefined', () => {
    expect(stringifyArray([])).toBeNull();
    expect(stringifyArray(null)).toBeNull();
    expect(stringifyArray(undefined)).toBeNull();
  });

  it('serializa um array não vazio', () => {
    expect(stringifyArray(['a', 'b'])).toBe('["a","b"]');
  });
});
