import { describe, it, expect } from 'vitest';
import {
  toMatchUser,
  namesFromLinks,
  presentMatchedUser,
} from '../../src/modules/match/match.service';

describe('toMatchUser', () => {
  it('extrai ids e converte JSON do perfil quando presente', () => {
    const m = toMatchUser({
      id: 'u1',
      teachingSkills: [{ skillId: 's1' }],
      learningSkills: [{ skillId: 's2' }],
      city: 'SP',
      state: 'SP',
      profile: { languages: '["pt"]', availability: '["MORNING"]', preferredModality: 'ONLINE' },
      lastActiveAt: new Date(),
    });
    expect(m.teachSkillIds).toEqual(['s1']);
    expect(m.languages).toEqual(['pt']);
    expect(m.preferredModality).toBe('ONLINE');
  });

  it('usa defaults quando perfil/skills ausentes', () => {
    const m = toMatchUser({ id: 'u1', city: null, state: null, lastActiveAt: null });
    expect(m.teachSkillIds).toEqual([]);
    expect(m.learnSkillIds).toEqual([]);
    expect(m.languages).toEqual([]);
    expect(m.preferredModality).toBeNull();
  });
});

describe('namesFromLinks', () => {
  it('mapeia ids para nomes e descarta os sem correspondência', () => {
    const links = [
      { skillId: 's1', skill: { name: 'Violino' } },
      { skillId: 's2', skill: { name: undefined } },
    ];
    expect(namesFromLinks(['s1', 's2', 's3'], links)).toEqual(['Violino']);
  });

  it('lida com lista de links ausente', () => {
    expect(namesFromLinks(['s1'], undefined as any)).toEqual([]);
  });
});

describe('presentMatchedUser', () => {
  it('compõe o usuário público com o bloco de match', () => {
    const me = { id: 'me', teachingSkills: [{ skillId: 's2', skill: { name: 'Costura' } }] };
    const user = {
      id: 'u1',
      name: 'Bob',
      teachingSkills: [{ skillId: 's1', skill: { name: 'Piano' } }],
    };
    const match = {
      score: 80,
      type: 'PERFECT' as const,
      reciprocal: true,
      skillsToLearn: ['s1'],
      skillsToTeach: ['s2'],
      breakdown: {
        reciprocity: 50,
        skillMatch: 20,
        location: 0,
        language: 0,
        modality: 0,
        availability: 0,
        activity: 0,
      },
    };
    const result = presentMatchedUser(me, user, match);
    expect(result.match.score).toBe(80);
    expect(result.match.skillsTheyTeachYouWant).toEqual(['Piano']);
    expect(result.match.skillsYouTeachTheyWant).toEqual(['Costura']);
  });
});
