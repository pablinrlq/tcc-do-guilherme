import { describe, it, expect } from 'vitest';
import express from 'express';
import supertest from 'supertest';
import { createLimiter, globalLimiter, authLimiter } from '../../../src/middlewares/rate-limit';

function buildApp(limiter: ReturnType<typeof createLimiter>) {
  const app = express();
  app.get('/ping', limiter, (_req, res) => res.json({ pong: true }));
  return supertest(app);
}

describe('rate-limit middleware', () => {
  it('permite requisições dentro do limite e bloqueia com 429 acima dele', async () => {
    const api = buildApp(createLimiter({ windowMs: 60_000, max: 2, enabled: true }));

    expect((await api.get('/ping')).status).toBe(200);
    expect((await api.get('/ping')).status).toBe(200);

    const blocked = await api.get('/ping');
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toMatch(/muitas requisições/i);
  });

  it('ignora o limite quando desabilitado (ambiente de teste)', async () => {
    const api = buildApp(createLimiter({ windowMs: 60_000, max: 1, enabled: false }));

    expect((await api.get('/ping')).status).toBe(200);
    expect((await api.get('/ping')).status).toBe(200);
    expect((await api.get('/ping')).status).toBe(200);
  });

  it('exporta limitadores globais prontos para uso', () => {
    expect(typeof globalLimiter).toBe('function');
    expect(typeof authLimiter).toBe('function');
  });
});
