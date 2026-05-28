import { describe, it, expect } from 'vitest';
import {
  presentCategory,
  presentSkill,
  presentTeachingSkill,
  presentLearningSkill,
  presentProfile,
  presentAuthUser,
  presentPublicUser,
} from '../../src/modules/users/user.presenter';

describe('presentCategory / presentSkill', () => {
  it('apresenta categoria com defaults nulos', () => {
    expect(presentCategory({ id: 'c1', name: 'Música', slug: 'musica' })).toMatchObject({
      icon: null,
      color: null,
    });
  });

  it('apresenta skill com e sem categoria', () => {
    expect(presentSkill({ id: 's1', name: 'Violino', slug: 'violino' }).category).toBeNull();
    const withCat = presentSkill({
      id: 's1',
      name: 'Violino',
      slug: 'violino',
      category: { id: 'c1', name: 'Música', slug: 'musica' },
    });
    expect(withCat.category?.name).toBe('Música');
  });
});

describe('presentTeachingSkill / presentLearningSkill', () => {
  it('converte JSON e apresenta skill quando presente', () => {
    const t = presentTeachingSkill({
      id: 't1',
      level: 'EXPERT',
      modality: 'ONLINE',
      acceptsCoins: true,
      acceptsExchange: false,
      coinPrice: 30,
      availability: '["MORNING"]',
      tags: '["clássico"]',
      skill: { id: 's1', name: 'Violino', slug: 'violino' },
    });
    expect(t.availability).toEqual(['MORNING']);
    expect(t.tags).toEqual(['clássico']);
    expect(t.skill?.name).toBe('Violino');
  });

  it('usa nulos/[] quando campos ausentes', () => {
    const t = presentTeachingSkill({ id: 't1', level: 'BEGINNER', modality: 'BOTH' });
    expect(t.coinPrice).toBeNull();
    expect(t.availability).toEqual([]);
    expect(t.skill).toBeNull();

    const l = presentLearningSkill({ id: 'l1', currentLevel: 'NONE', modality: 'BOTH' });
    expect(l.goal).toBeNull();
    expect(l.skill).toBeNull();
  });

  it('apresenta learning skill com skill', () => {
    const l = presentLearningSkill({
      id: 'l1',
      currentLevel: 'BEGINNER',
      modality: 'ONLINE',
      goal: 'tocar',
      skill: { id: 's2', name: 'Piano', slug: 'piano' },
    });
    expect(l.skill?.name).toBe('Piano');
  });
});

describe('presentProfile', () => {
  it('retorna null quando perfil ausente', () => {
    expect(presentProfile(null)).toBeNull();
    expect(presentProfile(undefined)).toBeNull();
  });

  it('converte arrays JSON do perfil', () => {
    const p = presentProfile({
      gender: 'FEMALE',
      languages: '["pt","en"]',
      learningPrefs: '["Prático"]',
      availability: '["NIGHT"]',
      preferredModality: 'ONLINE',
    });
    expect(p!.languages).toEqual(['pt', 'en']);
    expect(p!.preferredModality).toBe('ONLINE');
  });
});

describe('presentAuthUser', () => {
  it('inclui carteira e perfil quando presentes', () => {
    const u = presentAuthUser({
      id: 'u1',
      name: 'Ana',
      email: 'ana@a.com',
      role: 'USER',
      onboardingCompleted: true,
      createdAt: new Date(),
      wallet: { balance: 100, lockedBalance: 5 },
      profile: { languages: '["pt"]' },
    });
    expect(u.wallet).toEqual({ balance: 100, lockedBalance: 5 });
    expect(u.profile?.languages).toEqual(['pt']);
  });

  it('usa nulos quando carteira/perfil ausentes', () => {
    const u = presentAuthUser({
      id: 'u1',
      name: 'Ana',
      email: 'ana@a.com',
      role: 'USER',
      onboardingCompleted: false,
      createdAt: new Date(),
    });
    expect(u.wallet).toBeNull();
    expect(u.profile).toBeNull();
  });
});

describe('presentPublicUser — computeRating', () => {
  it('calcula média a partir do array reviewsReceived', () => {
    const u = presentPublicUser({
      id: 'u1',
      name: 'Bob',
      createdAt: new Date(),
      reviewsReceived: [{ rating: 4 }, { rating: 5 }],
      teachingSkills: [{ id: 't1', level: 'EXPERT', modality: 'BOTH' }],
      learningSkills: [{ id: 'l1', currentLevel: 'NONE', modality: 'BOTH' }],
      profile: { languages: '["pt"]' },
    });
    expect(u.rating).toEqual({ average: 4.5, count: 2 });
    expect(u.teachingSkills).toHaveLength(1);
    expect(u.profile).toBeDefined();
  });

  it('usa fallback _count/ratingSum quando não há array de reviews', () => {
    const u = presentPublicUser({
      id: 'u1',
      name: 'Bob',
      reviewsReceived: [],
      _count: { reviewsReceived: 4 },
      ratingSum: 18,
    });
    expect(u.rating).toEqual({ average: 4.5, count: 4 });
    expect(u.teachingSkills).toEqual([]);
    expect(u.learningSkills).toEqual([]);
    expect(u.profile).toBeUndefined();
  });

  it('retorna rating zero quando não há nenhuma avaliação', () => {
    const u = presentPublicUser({ id: 'u1', name: 'Bob' });
    expect(u.rating).toEqual({ average: 0, count: 0 });
  });
});
