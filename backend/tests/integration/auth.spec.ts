import { describe, it, expect } from 'vitest';
import { api, bearer } from '../helpers/app';
import { makeUser } from '../helpers/factories';
import { prisma } from '../../src/config/prisma';

describe('POST /api/auth/register', () => {
  it('cria usuário com carteira e bônus de boas-vindas', async () => {
    const res = await api.post('/api/auth/register').send({
      name: 'Maria',
      email: 'maria@test.com',
      password: 'Senha123!',
      city: 'São Paulo',
      state: 'SP',
    });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe('maria@test.com');
    expect(res.body.user.wallet.balance).toBe(100);

    const tx = await prisma.coinTransaction.findFirst({ where: { type: 'BONUS' } });
    expect(tx?.amount).toBe(100);
  });

  it('normaliza o e-mail para minúsculas', async () => {
    const res = await api
      .post('/api/auth/register')
      .send({ name: 'João', email: 'JOAO@TEST.COM', password: 'Senha123!' });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('joao@test.com');
  });

  it('rejeita e-mail duplicado com 409', async () => {
    await makeUser({ email: 'dup@test.com' });
    const res = await api
      .post('/api/auth/register')
      .send({ name: 'Outro', email: 'dup@test.com', password: 'Senha123!' });
    expect(res.status).toBe(409);
  });

  it('rejeita payload inválido com 422', async () => {
    const res = await api
      .post('/api/auth/register')
      .send({ name: 'x', email: 'invalido', password: '123' });
    expect(res.status).toBe(422);
    expect(res.body.issues.length).toBeGreaterThan(0);
  });
});

describe('POST /api/auth/login', () => {
  it('autentica com credenciais corretas e atualiza lastActiveAt', async () => {
    const { user } = await makeUser({ email: 'login@test.com', password: 'segredo1' });
    const before = user.lastActiveAt.getTime();
    await new Promise((r) => setTimeout(r, 5));

    const res = await api
      .post('/api/auth/login')
      .send({ email: 'login@test.com', password: 'segredo1' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();

    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    expect(updated!.lastActiveAt.getTime()).toBeGreaterThanOrEqual(before);
  });

  it('recusa senha incorreta com 401', async () => {
    await makeUser({ email: 'senha@test.com', password: 'correta1' });
    const res = await api
      .post('/api/auth/login')
      .send({ email: 'senha@test.com', password: 'errada99' });
    expect(res.status).toBe(401);
  });

  it('recusa e-mail inexistente com 401', async () => {
    const res = await api
      .post('/api/auth/login')
      .send({ email: 'naoexiste@test.com', password: 'qualquer1' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('retorna o usuário autenticado', async () => {
    const { token, user } = await makeUser({ email: 'me@test.com' });
    const res = await api.get('/api/auth/me').set('Authorization', bearer(token));
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(user.id);
  });

  it('rejeita requisição sem token com 401', async () => {
    const res = await api.get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('retorna 404 quando o usuário do token não existe mais', async () => {
    const { token, user } = await makeUser();
    await prisma.user.delete({ where: { id: user.id } });
    const res = await api.get('/api/auth/me').set('Authorization', bearer(token));
    expect(res.status).toBe(404);
  });
});
