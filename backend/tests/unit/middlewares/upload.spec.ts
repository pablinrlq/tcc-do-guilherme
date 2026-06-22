import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Cobre o ramo de criação do diretório de upload (quando ele ainda não existe).
 * O ramo "diretório já existe" é coberto pelo import normal do módulo nos
 * testes de integração. O fileFilter/storage são cobertos pelo upload real
 * em tests/integration/users.spec.ts.
 */
describe('upload middleware — criação de diretório', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('cria o diretório de upload quando ausente', async () => {
    const mkdirSync = vi.fn();
    const existsSync = vi.fn(() => false);
    vi.doMock('node:fs', () => ({
      default: { existsSync, mkdirSync },
      existsSync,
      mkdirSync,
    }));

    await import('../../../src/middlewares/upload');

    expect(existsSync).toHaveBeenCalled();
    expect(mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
  });
});
