import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.spec.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      all: true,
      // Camada de lógica + componentes reutilizáveis (gate 100%).
      // As páginas (view) são validadas pelos testes E2E (Playwright).
      include: [
        'src/utils/**/*.ts',
        'src/services/**/*.ts',
        'src/contexts/**/*.tsx',
        'src/hooks/**/*.ts',
        'src/components/**/*.{ts,tsx}',
      ],
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
