import { describe, it, expect, vi } from 'vitest';
import { api } from '../helpers/app';
import { prisma } from '../../src/config/prisma';

describe('app base', () => {
  it('GET /health responde ok com banco disponível', async () => {
    const res = await api.get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', service: 'skillex-api', db: 'up' });
  });

  it('GET /health responde 503 quando o banco está indisponível', async () => {
    const spy = vi.spyOn(prisma, '$queryRaw').mockRejectedValueOnce(new Error('db down'));
    const res = await api.get('/health');
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: 'unavailable', service: 'skillex-api', db: 'down' });
    spy.mockRestore();
  });

  it('aplica headers de segurança do helmet', async () => {
    const res = await api.get('/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin');
  });

  it('rota inexistente responde 404 padronizado', async () => {
    const res = await api.get('/api/inexistente');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Rota não encontrada');
  });

  it('GET /api-docs.json retorna o schema OpenAPI como JSON', async () => {
    const res = await api.get('/api-docs.json');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('openapi');
  });
});
