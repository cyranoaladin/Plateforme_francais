import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    exclude: ['tests/e2e/**'],
    environment: 'node',
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
        // Temporary progressive gate (2026-03-05), raised stepwise in CI roadmap.
        lines: 45,
        functions: 43,
        branches: 37,
        statements: 45,
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
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
