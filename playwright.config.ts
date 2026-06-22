import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

const backendDir = path.resolve(__dirname, 'backend');
const frontendDir = path.resolve(__dirname, 'frontend');

/**
 * Sobe automaticamente o backend (com banco de teste semeado) e o frontend,
 * e roda os fluxos E2E contra a SPA real.
 */
export default defineConfig({
  testDir: './e2e/specs',
  testMatch: '**/*.e2e.ts',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'e2e/report' }]],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm run e2e:serve',
      cwd: backendDir,
      url: 'http://localhost:3333/health',
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
      env: {
        DATABASE_URL: 'file:./e2e.db',
        JWT_SECRET: 'e2e-secret',
        JWT_EXPIRES_IN: '7d',
        PORT: '3333',
        NODE_ENV: 'test',
        CLIENT_URL: 'http://localhost:5173',
      },
    },
    {
      command: 'npm run dev',
      cwd: frontendDir,
      url: 'http://localhost:5173',
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
