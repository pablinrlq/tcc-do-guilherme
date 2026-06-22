import { defineConfig } from 'vitest/config';
import path from 'node:path';

// Banco de teste isolado (nunca toca o dev.db). Caminho absoluto para evitar
// ambiguidade de resolução relativa do SQLite entre CLI e runtime do Prisma.
const TEST_DB_URL = 'file:' + path.resolve(process.cwd(), 'prisma/test.db');

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // Variáveis carregadas no worker ANTES de importar env.ts/Prisma.
    env: {
      DATABASE_URL: TEST_DB_URL,
      JWT_SECRET: 'test-secret',
      JWT_EXPIRES_IN: '1h',
      NODE_ENV: 'test',
      CLIENT_URL: 'http://localhost:5173',
    },
    globalSetup: ['./tests/global-setup.ts'],
    setupFiles: ['./tests/setup.ts'],
    // SQLite (arquivo único) não tolera escrita concorrente entre workers.
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      all: true,
      include: ['src/**/*.ts'],
      // Bootstrap validado por integração/E2E, fora do gate de cobertura.
      exclude: ['src/server.ts', 'src/config/prisma.ts'],
      reporter: ['text', 'text-summary', 'html', 'lcov'],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
