import { describe, it, expect } from 'vitest';
import { calculateMatch, MatchUser } from '../../src/modules/match/match.algorithm';
import { MATCH_WEIGHTS } from '../../src/utils/constants';

/** Usuário base; cada teste sobrescreve só o que precisa. */
function user(overrides: Partial<MatchUser> = {}): MatchUser {
  return {
    id: overrides.id ?? 'x',
    teachSkillIds: overrides.teachSkillIds ?? [],
    learnSkillIds: overrides.learnSkillIds ?? [],
    city: overrides.city,
    state: overrides.state,
    languages: overrides.languages,
    availability: overrides.availability,
    preferredModality: overrides.preferredModality,
    lastActiveAt: overrides.lastActiveAt,
  };
}

const recentDate = new Date(); // agora → atividade máxima

describe('calculateMatch — tipo de match', () => {
  it('marca PERFECT quando há reciprocidade (A↔B)', () => {
    const a = user({ teachSkillIds: ['s1'], learnSkillIds: ['s2'] });
    const b = user({ teachSkillIds: ['s2'], learnSkillIds: ['s1'] });
    const r = calculateMatch(a, b);
    expect(r.type).toBe('PERFECT');
    expect(r.reciprocal).toBe(true);
    expect(r.breakdown.reciprocity).toBe(MATCH_WEIGHTS.reciprocity);
    expect(r.skillsToLearn).toEqual(['s2']);
    expect(r.skillsToTeach).toEqual(['s1']);
  });

  it('marca PARTIAL quando B ensina o que A quer, mas sem reciprocidade', () => {
    const a = user({ teachSkillIds: ['s9'], learnSkillIds: ['s2'] });
    const b = user({ teachSkillIds: ['s2'], learnSkillIds: ['s5'] });
    const r = calculateMatch(a, b);
    expect(r.type).toBe('PARTIAL');
    expect(r.reciprocal).toBe(false);
    expect(r.breakdown.reciprocity).toBe(0);
  });

  it('marca PARTIAL quando A ensina o que B quer (d=0, r>0)', () => {
    const a = user({ teachSkillIds: ['s1'], learnSkillIds: ['sX'] });
    const b = user({ teachSkillIds: ['sY'], learnSkillIds: ['s1'] });
    const r = calculateMatch(a, b);
    expect(r.type).toBe('PARTIAL');
    expect(r.skillsToTeach).toEqual(['s1']);
    expect(r.skillsToLearn).toEqual([]);
  });

  it('marca COIN_ONLY quando não há nenhuma sobreposição de habilidades', () => {
    const a = user({ teachSkillIds: ['a1'], learnSkillIds: ['a2'] });
    const b = user({ teachSkillIds: ['b1'], learnSkillIds: ['b2'] });
    const r = calculateMatch(a, b);
    expect(r.type).toBe('COIN_ONLY');
    expect(r.breakdown.skillMatch).toBe(0);
  });
});

describe('calculateMatch — cobertura de habilidade (skillMatch)', () => {
  it('coverage 0 quando A não quer aprender nada (aLearn vazio)', () => {
    const a = user({ teachSkillIds: ['s1'], learnSkillIds: [] });
    const b = user({ teachSkillIds: ['s2'], learnSkillIds: ['s1'] });
    const r = calculateMatch(a, b);
    expect(r.breakdown.skillMatch).toBe(0);
  });

  it('coverage parcial: B ensina metade do que A quer aprender', () => {
    const a = user({ teachSkillIds: [], learnSkillIds: ['s1', 's2'] });
    const b = user({ teachSkillIds: ['s1'], learnSkillIds: [] });
    const r = calculateMatch(a, b);
    expect(r.breakdown.skillMatch).toBe(Math.round(MATCH_WEIGHTS.skillMatch * 0.5));
  });
});

describe('calculateMatch — localização', () => {
  it('mesma cidade vale o peso total', () => {
    const a = user({ city: ' São Paulo ', state: 'SP' });
    const b = user({ city: 'são paulo', state: 'SP' });
    expect(calculateMatch(a, b).breakdown.location).toBe(MATCH_WEIGHTS.location);
  });

  it('mesmo estado (cidade diferente) vale metade', () => {
    const a = user({ city: 'Campinas', state: 'sp' });
    const b = user({ city: 'Santos', state: 'SP' });
    expect(calculateMatch(a, b).breakdown.location).toBe(Math.round(MATCH_WEIGHTS.location / 2));
  });

  it('cidade e estado diferentes valem zero', () => {
    const a = user({ city: 'Recife', state: 'PE' });
    const b = user({ city: 'Curitiba', state: 'PR' });
    expect(calculateMatch(a, b).breakdown.location).toBe(0);
  });
});

describe('calculateMatch — overlap de listas (idioma/disponibilidade)', () => {
  it('listas ausentes/vazias dão pontuação neutra (metade)', () => {
    const a = user({ languages: undefined, availability: [] });
    const b = user({ languages: ['pt'], availability: ['MORNING'] });
    const r = calculateMatch(a, b);
    expect(r.breakdown.language).toBe(Math.round(MATCH_WEIGHTS.language * 0.5));
    expect(r.breakdown.availability).toBe(Math.round(MATCH_WEIGHTS.availability * 0.5));
  });

  it('item em comum dá o peso total (case-insensitive)', () => {
    const a = user({ languages: ['Português'] });
    const b = user({ languages: ['português', 'Inglês'] });
    expect(calculateMatch(a, b).breakdown.language).toBe(MATCH_WEIGHTS.language);
  });

  it('sem item em comum dá zero', () => {
    const a = user({ availability: ['MORNING'] });
    const b = user({ availability: ['NIGHT'] });
    expect(calculateMatch(a, b).breakdown.availability).toBe(0);
  });
});

describe('calculateMatch — modalidade', () => {
  it('modalidade ausente → neutra', () => {
    const a = user({ preferredModality: null });
    const b = user({ preferredModality: 'ONLINE' });
    expect(calculateMatch(a, b).breakdown.modality).toBe(Math.round(MATCH_WEIGHTS.modality * 0.5));
  });

  it('BOTH em A é compatível com qualquer modalidade de B', () => {
    const a = user({ preferredModality: 'BOTH' });
    const b = user({ preferredModality: 'ONLINE' });
    expect(calculateMatch(a, b).breakdown.modality).toBe(MATCH_WEIGHTS.modality);
  });

  it('BOTH em B é compatível com qualquer modalidade de A', () => {
    const a = user({ preferredModality: 'ONLINE' });
    const b = user({ preferredModality: 'BOTH' });
    expect(calculateMatch(a, b).breakdown.modality).toBe(MATCH_WEIGHTS.modality);
  });

  it('modalidades iguais → peso total', () => {
    const a = user({ preferredModality: 'ONLINE' });
    const b = user({ preferredModality: 'ONLINE' });
    expect(calculateMatch(a, b).breakdown.modality).toBe(MATCH_WEIGHTS.modality);
  });

  it('modalidades incompatíveis → zero', () => {
    const a = user({ preferredModality: 'ONLINE' });
    const b = user({ preferredModality: 'IN_PERSON' });
    expect(calculateMatch(a, b).breakdown.modality).toBe(0);
  });
});

describe('calculateMatch — atividade recente', () => {
  const days = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

  it('sem data → zero', () => {
    expect(calculateMatch(user(), user({ lastActiveAt: null })).breakdown.activity).toBe(0);
  });
  it('≤ 3 dias → peso total', () => {
    expect(calculateMatch(user(), user({ lastActiveAt: days(1) })).breakdown.activity).toBe(
      MATCH_WEIGHTS.activity,
    );
  });
  it('≤ 7 dias → 66%', () => {
    expect(calculateMatch(user(), user({ lastActiveAt: days(5) })).breakdown.activity).toBe(
      Math.round(MATCH_WEIGHTS.activity * 0.66),
    );
  });
  it('≤ 30 dias → 33%', () => {
    expect(calculateMatch(user(), user({ lastActiveAt: days(20) })).breakdown.activity).toBe(
      Math.round(MATCH_WEIGHTS.activity * 0.33),
    );
  });
  it('> 30 dias → zero', () => {
    expect(calculateMatch(user(), user({ lastActiveAt: days(60) })).breakdown.activity).toBe(0);
  });
});

describe('calculateMatch — pontuação total', () => {
  it('match perfeito com todos os critérios máximos chega a 100', () => {
    const a = user({
      teachSkillIds: ['s1'],
      learnSkillIds: ['s2'],
      city: 'SP',
      state: 'SP',
      languages: ['pt'],
      availability: ['MORNING'],
      preferredModality: 'ONLINE',
      lastActiveAt: recentDate,
    });
    const b = user({
      teachSkillIds: ['s2'],
      learnSkillIds: ['s1'],
      city: 'SP',
      state: 'SP',
      languages: ['pt'],
      availability: ['MORNING'],
      preferredModality: 'ONLINE',
      lastActiveAt: recentDate,
    });
    const r = calculateMatch(a, b);
    expect(r.score).toBe(100);
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });
});
