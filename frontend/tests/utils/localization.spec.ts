import { describe, it, expect } from 'vitest';
import { COMMON_LANGUAGES, languageLabel, normalizeLanguage } from '../../src/utils/languages';
import { countryLabel, normalizeCountry } from '../../src/utils/countries';

describe('languages', () => {
  it('COMMON_LANGUAGES é um array não vazio', () => {
    expect(Array.isArray(COMMON_LANGUAGES)).toBe(true);
    expect(COMMON_LANGUAGES.length).toBeGreaterThan(0);
  });

  it('COMMON_LANGUAGES está ordenado alfabeticamente por label', () => {
    for (let i = 1; i < COMMON_LANGUAGES.length; i++) {
      expect(COMMON_LANGUAGES[i - 1].label.localeCompare(COMMON_LANGUAGES[i].label, 'pt-BR')).toBeLessThanOrEqual(0);
    }
  });

  it('languageLabel retorna o rótulo para código conhecido', () => {
    expect(languageLabel('pt')).toBe('Português');
    expect(languageLabel('en')).toBe('Inglês');
  });

  it('languageLabel retorna o próprio valor para código desconhecido', () => {
    expect(languageLabel('xx')).toBe('xx');
  });

  it('normalizeLanguage retorna o código quando já é um código válido', () => {
    expect(normalizeLanguage('pt')).toBe('pt');
    expect(normalizeLanguage('en')).toBe('en');
  });

  it('normalizeLanguage converte rótulo legado para código', () => {
    expect(normalizeLanguage('Português')).toBe('pt');
    expect(normalizeLanguage('inglês')).toBe('en');
  });

  it('normalizeLanguage retorna o input original quando não encontra', () => {
    expect(normalizeLanguage('Klingon')).toBe('Klingon');
  });
});

describe('countries', () => {
  it('countryLabel retorna o nome para código conhecido', () => {
    expect(countryLabel('BR')).toBe('Brasil');
    expect(countryLabel('US')).toBe('Estados Unidos');
  });

  it('countryLabel retorna o próprio código para código desconhecido', () => {
    expect(countryLabel('ZZ')).toBe('ZZ');
  });

  it('normalizeCountry retorna vazio para string vazia', () => {
    expect(normalizeCountry('')).toBe('');
  });

  it('normalizeCountry retorna o próprio código quando já é válido', () => {
    expect(normalizeCountry('BR')).toBe('BR');
  });

  it('normalizeCountry converte rótulo para código', () => {
    expect(normalizeCountry('Brasil')).toBe('BR');
  });

  it('normalizeCountry retorna vazio para rótulo desconhecido', () => {
    expect(normalizeCountry('Atlantida')).toBe('');
  });
});
