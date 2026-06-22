import { describe, it, expect, vi } from 'vitest';

/**
 * Cobre os valores padrão de env.ts quando nenhuma variável de ambiente
 * está definida (dotenv é mockado para não recarregar do arquivo .env).
 */
describe('env — valores padrão', () => {
  it('aplica defaults seguros de desenvolvimento', async () => {
    const keys = [
      'DATABASE_URL',
      'JWT_SECRET',
      'JWT_EXPIRES_IN',
      'PORT',
      'NODE_ENV',
      'UPLOAD_DIR',
      'MAX_UPLOAD_SIZE_MB',
      'CLIENT_URL',
    ];
    const saved: Record<string, string | undefined> = {};
    for (const k of keys) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
    vi.resetModules();
    vi.doMock('dotenv', () => ({ default: { config: () => ({}) }, config: () => ({}) }));

    try {
      const { env } = await import('../../src/config/env');
      expect(env.databaseUrl).toBe('file:./dev.db');
      expect(env.jwtSecret).toBe('skillex-dev-secret');
      expect(env.jwtExpiresIn).toBe('7d');
      expect(env.port).toBe(3333);
      expect(env.nodeEnv).toBe('development');
      expect(env.uploadDir).toBe('uploads');
      expect(env.maxUploadSizeMb).toBe(5);
      expect(env.clientUrl).toBe('http://localhost:5173');
      expect(env.isDev).toBe(true);
    } finally {
      for (const k of keys) {
        if (saved[k] !== undefined) process.env[k] = saved[k];
      }
      vi.doUnmock('dotenv');
      vi.resetModules();
    }
  });
});
