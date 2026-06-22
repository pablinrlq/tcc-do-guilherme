import { describe, it, expect } from 'vitest';
import {
  label,
  LEVEL_LABELS,
  timeAgo,
  formatDate,
  formatDateTime,
  categoryIconName,
} from '../../src/utils/format';

describe('label', () => {
  it('retorna vazio para chave nula', () => {
    expect(label(LEVEL_LABELS, null)).toBe('');
    expect(label(LEVEL_LABELS, undefined)).toBe('');
  });
  it('traduz chave conhecida', () => {
    expect(label(LEVEL_LABELS, 'BEGINNER')).toBe('Iniciante');
  });
  it('usa a própria chave como fallback', () => {
    expect(label(LEVEL_LABELS, 'DESCONHECIDO')).toBe('DESCONHECIDO');
  });
});

describe('categoryIconName', () => {
  it('retorna o ícone do slug conhecido', () => {
    expect(categoryIconName('musica')).toBe('music-note-beamed');
  });
  it('usa fallback para slug desconhecido/nulo', () => {
    expect(categoryIconName('zzz')).toBe('tag-fill');
    expect(categoryIconName(null)).toBe('tag-fill');
  });
});

describe('timeAgo', () => {
  const ago = (ms: number) => new Date(Date.now() - ms);
  const SEC = 1000;
  const MIN = 60 * SEC;
  const HOUR = 60 * MIN;
  const DAY = 24 * HOUR;

  it('agora mesmo (< 1 min)', () => {
    expect(timeAgo(ago(5 * SEC))).toBe('agora mesmo');
  });
  it('minutos', () => {
    expect(timeAgo(ago(5 * MIN))).toBe('há 5 min');
  });
  it('horas', () => {
    expect(timeAgo(ago(3 * HOUR))).toBe('há 3 h');
  });
  it('um dia (singular)', () => {
    expect(timeAgo(ago(1.2 * DAY))).toBe('há 1 dia');
  });
  it('dias (plural)', () => {
    expect(timeAgo(ago(5 * DAY))).toBe('há 5 dias');
  });
  it('um mês (singular)', () => {
    expect(timeAgo(ago(40 * DAY))).toBe('há 1 mês');
  });
  it('meses (plural com "es")', () => {
    expect(timeAgo(ago(60 * DAY))).toBe('há 2 mêses');
  });
  it('anos', () => {
    expect(timeAgo(ago(400 * DAY))).toBe('há 1 ano(s)');
  });
});

describe('formatDate / formatDateTime', () => {
  it('formata data e data-hora sem lançar', () => {
    const d = new Date('2024-05-10T13:45:00');
    expect(typeof formatDate(d)).toBe('string');
    expect(formatDate(d).length).toBeGreaterThan(0);
    expect(typeof formatDateTime(d)).toBe('string');
  });
});
