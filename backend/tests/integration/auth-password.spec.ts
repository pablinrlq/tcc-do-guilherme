import { describe, it, expect } from 'vitest';
import { api, bearer } from '../helpers/app';
import { makeUser } from '../helpers/factories';
import { prisma } from '../../src/config/prisma';
import { env } from '../../src/config/env';
import * as authService from '../../src/modules/auth/auth.service';

describe('POST /api/auth/change-password', () => {
  it('altera a senha e permite login com a nova', async () => {
    const { user, token } = await makeUser({ email: 'troca@test.com', password: 'antiga123' });

    const res = await api
      .post('/api/auth/change-password')
      .set('Authorization', bearer(token))
      .send({ currentPassword: 'antiga123', newPassword: 'NovaSenha1!' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const oldLogin = await api
      .post('/api/auth/login')
      .send({ email: user.email, password: 'antiga123' });
    expect(oldLogin.status).toBe(401);

    const newLogin = await api
      .post('/api/auth/login')
      .send({ email: user.email, password: 'NovaSenha1!' });
    expect(newLogin.status).toBe(200);
  });

  it('recusa senha atual incorreta com 401', async () => {
    const { token } = await makeUser({ password: 'correta1' });
    const res = await api
      .post('/api/auth/change-password')
      .set('Authorization', bearer(token))
      .send({ currentPassword: 'errada99', newPassword: 'NovaSenha1!' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/senha atual/i);
  });

  it('rejeita nova senha curta com 422', async () => {
    const { token } = await makeUser({ password: 'correta1' });
    const res = await api
      .post('/api/auth/change-password')
      .set('Authorization', bearer(token))
      .send({ currentPassword: 'correta1', newPassword: '123' });
    expect(res.status).toBe(422);
  });

  it('exige autenticação', async () => {
    const res = await api
      .post('/api/auth/change-password')
      .send({ currentPassword: 'a', newPassword: 'NovaSenha1!' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/forgot-password', () => {
  it('gera token e expõe link de reset fora de produção', async () => {
    const { user } = await makeUser({ email: 'esqueci@test.com' });

    const res = await api.post('/api/auth/forgot-password').send({ email: user.email });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.resetToken).toMatch(/^[0-9a-f]{64}$/);
    expect(res.body.resetLink).toContain('/reset-password?token=');

    const stored = await prisma.passwordResetToken.findFirst({ where: { userId: user.id } });
    expect(stored).not.toBeNull();
    expect(stored!.tokenHash).not.toBe(res.body.resetToken); // só o hash é persistido
  });

  it('responde de forma genérica para e-mail inexistente (sem enumeração)', async () => {
    const res = await api
      .post('/api/auth/forgot-password')
      .send({ email: 'nunca-existiu@test.com' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.resetToken).toBeUndefined();
  });

  it('não gera token para conta desativada', async () => {
    const { user } = await makeUser({ email: 'desativada@test.com' });
    await prisma.user.update({ where: { id: user.id }, data: { isActive: false } });

    const res = await api.post('/api/auth/forgot-password').send({ email: user.email });
    expect(res.status).toBe(200);
    expect(res.body.resetToken).toBeUndefined();
    expect(await prisma.passwordResetToken.count({ where: { userId: user.id } })).toBe(0);
  });

  it('invalida tokens anteriores ao gerar um novo', async () => {
    const { user } = await makeUser({ email: 'renova@test.com' });
    const first = await api.post('/api/auth/forgot-password').send({ email: user.email });
    const second = await api.post('/api/auth/forgot-password').send({ email: user.email });
    expect(first.body.resetToken).not.toBe(second.body.resetToken);
    expect(await prisma.passwordResetToken.count({ where: { userId: user.id } })).toBe(1);
  });

  it('em produção não expõe o token na resposta', async () => {
    const { user } = await makeUser({ email: 'prod@test.com' });
    const original = env.nodeEnv;
    env.nodeEnv = 'production';
    try {
      const result = await authService.forgotPassword({ email: user.email });
      expect(result.success).toBe(true);
      expect((result as any).resetToken).toBeUndefined();
    } finally {
      env.nodeEnv = original;
    }
  });
});

describe('POST /api/auth/reset-password', () => {
  async function getResetToken(email: string): Promise<string> {
    const res = await api.post('/api/auth/forgot-password').send({ email });
    return res.body.resetToken;
  }

  it('redefine a senha com token válido (uso único)', async () => {
    const { user } = await makeUser({ email: 'reset@test.com', password: 'antiga123' });
    const token = await getResetToken(user.email);

    const res = await api
      .post('/api/auth/reset-password')
      .send({ token, password: 'Novissima1!' });
    expect(res.status).toBe(200);

    const login = await api
      .post('/api/auth/login')
      .send({ email: user.email, password: 'Novissima1!' });
    expect(login.status).toBe(200);

    // Reuso do mesmo token deve falhar
    const reuse = await api
      .post('/api/auth/reset-password')
      .send({ token, password: 'OutraNova1!' });
    expect(reuse.status).toBe(400);
  });

  it('recusa token inexistente com 400', async () => {
    const res = await api
      .post('/api/auth/reset-password')
      .send({ token: 'f'.repeat(64), password: 'NovaSenha1!' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/inválido ou expirado/i);
  });

  it('recusa token expirado com 400', async () => {
    const { user } = await makeUser({ email: 'expirado@test.com' });
    const token = await getResetToken(user.email);
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const res = await api
      .post('/api/auth/reset-password')
      .send({ token, password: 'NovaSenha1!' });
    expect(res.status).toBe(400);
  });

  it('recusa token de conta desativada com 400', async () => {
    const { user } = await makeUser({ email: 'reset-inativa@test.com' });
    const token = await getResetToken(user.email);
    await prisma.user.update({ where: { id: user.id }, data: { isActive: false } });

    const res = await api
      .post('/api/auth/reset-password')
      .send({ token, password: 'NovaSenha1!' });
    expect(res.status).toBe(400);
  });
});
