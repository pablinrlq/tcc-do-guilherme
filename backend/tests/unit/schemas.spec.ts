import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema } from '../../src/modules/auth/auth.schemas';
import {
  updateBasicSchema,
  updateProfileSchema,
  onboardingSchema,
  searchSchema,
} from '../../src/modules/users/user.schemas';
import {
  createTeachingSkillSchema,
  updateTeachingSkillSchema,
  createLearningSkillSchema,
  updateLearningSkillSchema,
} from '../../src/modules/skills/skill.schemas';
import { createRequestSchema, sendMessageSchema } from '../../src/modules/requests/request.schemas';
import { purchaseCoinsSchema } from '../../src/modules/wallet/wallet.schemas';
import { createReviewSchema } from '../../src/modules/reviews/review.schemas';
import { createReportSchema, resolveReportSchema } from '../../src/modules/reports/report.schemas';

describe('auth schemas', () => {
  it('registerSchema normaliza e-mail e valida limites', () => {
    const parsed = registerSchema.parse({
      name: 'Ana',
      email: 'ANA@Mail.com',
      password: 'Senha123!',
    });
    expect(parsed.email).toBe('ana@mail.com');
  });

  it('registerSchema rejeita senha sem letras, números ou símbolos', () => {
    expect(() =>
      registerSchema.parse({ name: 'Ana', email: 'a@a.com', password: 'somenteletras' }),
    ).toThrow();
    expect(() =>
      registerSchema.parse({ name: 'Ana', email: 'a@a.com', password: 'Sem-simbolo1' }),
    ).not.toThrow();
  });

  it('registerSchema rejeita senha curta e nome curto', () => {
    expect(() => registerSchema.parse({ name: 'A', email: 'a@a.com', password: '123' })).toThrow();
  });

  it('loginSchema exige senha não vazia', () => {
    expect(() => loginSchema.parse({ email: 'a@a.com', password: '' })).toThrow();
  });
});

describe('user schemas', () => {
  it('updateBasicSchema aceita campos opcionais', () => {
    expect(updateBasicSchema.parse({ name: 'Novo Nome' }).name).toBe('Novo Nome');
  });

  it('updateProfileSchema coage data e valida enums', () => {
    const p = updateProfileSchema.parse({
      gender: 'FEMALE',
      birthDate: '1990-01-01',
      languages: ['Português'],
      availability: ['MORNING'],
      preferredModality: 'ONLINE',
    });
    expect(p.birthDate).toBeInstanceOf(Date);
  });

  it('onboardingSchema aceita estrutura aninhada', () => {
    const o = onboardingSchema.parse({
      profile: { gender: 'MALE' },
      teachingSkills: [{ skillName: 'Violino', level: 'EXPERT' }],
      learningSkills: [{ skillName: 'Tricô' }],
    });
    expect(o.teachingSkills).toHaveLength(1);
  });

  it('searchSchema aplica defaults de página e converte boolParam (string)', () => {
    const s = searchSchema.parse({ acceptsCoins: 'true', acceptsExchange: 'false' });
    expect(s.page).toBe(1);
    expect(s.limit).toBe(12);
    expect(s.acceptsCoins).toBe(true);
    expect(s.acceptsExchange).toBe(false);
  });

  it('searchSchema converte boolParam (boolean) e valores desconhecidos', () => {
    const s = searchSchema.parse({ acceptsCoins: true, acceptsExchange: false });
    expect(s.acceptsCoins).toBe(true);
    expect(s.acceptsExchange).toBe(false);
    const u = searchSchema.parse({ acceptsCoins: 'talvez' });
    expect(u.acceptsCoins).toBeUndefined();
  });
});

describe('skill schemas', () => {
  it('createTeachingSkillSchema aplica defaults e aceita skillId', () => {
    const t = createTeachingSkillSchema.parse({ skillId: 's1', level: 'ADVANCED' });
    expect(t.modality).toBe('BOTH');
    expect(t.acceptsCoins).toBe(true);
  });

  it('createTeachingSkillSchema exige skillId ou skillName (refine)', () => {
    expect(() => createTeachingSkillSchema.parse({ level: 'ADVANCED' })).toThrow();
  });

  it('createLearningSkillSchema aceita skillName e default currentLevel', () => {
    const l = createLearningSkillSchema.parse({ skillName: 'Piano' });
    expect(l.currentLevel).toBe('NONE');
  });

  it('createLearningSkillSchema exige referência de habilidade (refine)', () => {
    expect(() => createLearningSkillSchema.parse({ goal: 'aprender' })).toThrow();
  });

  it('update schemas aceitam campos parciais', () => {
    expect(updateTeachingSkillSchema.parse({ coinPrice: null })).toEqual({ coinPrice: null });
    expect(updateLearningSkillSchema.parse({ currentLevel: 'BEGINNER' }).currentLevel).toBe(
      'BEGINNER',
    );
  });
});

describe('request schemas', () => {
  it('createRequestSchema aceita troca com habilidade oferecida', () => {
    const r = createRequestSchema.parse({
      recipientId: 'u1',
      requestedSkillId: 's1',
      type: 'EXCHANGE',
      offeredSkillId: 's2',
    });
    expect(r.type).toBe('EXCHANGE');
  });

  it('createRequestSchema rejeita troca sem habilidade oferecida (refine)', () => {
    expect(() =>
      createRequestSchema.parse({ recipientId: 'u1', requestedSkillId: 's1', type: 'EXCHANGE' }),
    ).toThrow();
  });

  it('createRequestSchema aceita COIN sem oferta', () => {
    const r = createRequestSchema.parse({
      recipientId: 'u1',
      requestedSkillId: 's1',
      type: 'COIN',
      coinAmount: 10,
    });
    expect(r.coinAmount).toBe(10);
  });

  it('sendMessageSchema rejeita conteúdo vazio', () => {
    expect(() => sendMessageSchema.parse({ content: '' })).toThrow();
  });
});

describe('wallet & review schemas', () => {
  it('purchaseCoinsSchema exige valor mínimo de 1', () => {
    expect(purchaseCoinsSchema.parse({ amount: 50 }).amount).toBe(50);
    expect(() => purchaseCoinsSchema.parse({ amount: 0 })).toThrow();
  });

  it('createReviewSchema valida rating entre 1 e 5', () => {
    expect(createReviewSchema.parse({ requestId: 'r1', rating: 5 }).rating).toBe(5);
    expect(() => createReviewSchema.parse({ requestId: 'r1', rating: 6 })).toThrow();
  });
});

describe('report schemas', () => {
  it('createReportSchema aceita targetId com tipo válido', () => {
    const r = createReportSchema.parse({
      targetId: 'u1',
      type: 'SPAM',
      description: 'Descrição longa o suficiente.',
    });
    expect(r.type).toBe('SPAM');
  });

  it('createReportSchema aceita requestId sem targetId', () => {
    const r = createReportSchema.parse({
      requestId: 'req1',
      type: 'SCAM',
      description: 'Tentativa de golpe aqui.',
    });
    expect(r.requestId).toBe('req1');
  });

  it('createReportSchema rejeita quando nem targetId nem requestId são fornecidos', () => {
    expect(() =>
      createReportSchema.parse({ type: 'SPAM', description: 'Sem alvo informado aqui.' }),
    ).toThrow();
  });

  it('createReportSchema rejeita tipo inválido', () => {
    expect(() =>
      createReportSchema.parse({ targetId: 'u1', type: 'INVALIDO', description: 'Texto ok.' }),
    ).toThrow();
  });

  it('createReportSchema rejeita descrição menor que 10 caracteres', () => {
    expect(() =>
      createReportSchema.parse({ targetId: 'u1', type: 'SPAM', description: 'curto' }),
    ).toThrow();
  });

  it('resolveReportSchema aceita todos os status finais', () => {
    expect(resolveReportSchema.parse({ status: 'RESOLVED' }).status).toBe('RESOLVED');
    expect(resolveReportSchema.parse({ status: 'DISMISSED' }).status).toBe('DISMISSED');
    expect(resolveReportSchema.parse({ status: 'UNDER_REVIEW' }).status).toBe('UNDER_REVIEW');
  });

  it('resolveReportSchema aceita adminNote opcional', () => {
    const r = resolveReportSchema.parse({ status: 'RESOLVED', adminNote: 'Caso encerrado.' });
    expect(r.adminNote).toBe('Caso encerrado.');
    expect(resolveReportSchema.parse({ status: 'DISMISSED' }).adminNote).toBeUndefined();
  });

  it('resolveReportSchema rejeita status inválido', () => {
    expect(() => resolveReportSchema.parse({ status: 'PENDING' })).toThrow();
  });
});
