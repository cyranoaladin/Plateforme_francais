import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx', 'tests/integration/**/*.test.ts'],
    exclude: ['tests/e2e/**'],
    globals: true,
    environment: 'node',
    setupFiles: ['tests/setup-jsdom.ts'],
    pool: 'forks',
    testTimeout: 15_000,
    hookTimeout: 10_000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        'src/**/*.d.ts',
        'src/app/**/page.tsx',
        'src/app/**/layout.tsx',
        'node_modules/',
        '**/*.config.*',
      ],
      thresholds: {
        // Alignés sur les gates CI (.github/workflows/ci-cd.yml env.COVERAGE_GATE_*)
        // Baseline mesurée 2026-04-11 : lines 39.39% / functions 36.69% / branches 34.42% / statements 38.94%
        // Augmenter de +2% par sprint jusqu'à : lines/statements 55%, branches 45%.
        lines: 38,
        functions: 35,
        branches: 33,
        statements: 37,
      },
    },
    env: {
      LLM_ROUTER_ENABLED: 'false',
      LLM_COST_TRACKING: 'false',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/eaf_test',
      REDIS_URL: 'redis://localhost:6379',
      MCP_SERVER_URL: 'http://localhost:3100',
      MCP_API_KEY: 'test-key',
      SESSION_SECRET: 'test-secret-minimum-32-chars-long',
      CSRF_SECRET: 'test-csrf-secret-minimum-32-chars',
      COOKIE_SECURE: 'false',
      NODE_ENV: 'test',
      RESSOURCES_ROOT: '../eaf_ressources',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
