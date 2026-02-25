import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    exclude: ['tests/e2e/**'],
    environment: 'node',
    pool: 'forks',
    testTimeout: 30_000,
    hookTimeout: 10_000,
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts', 'src/app/api/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/types.ts',
        'src/**/types/**',
        'src/lib/db/migrations/**',
      ],
      thresholds: {
        lines: 80,
        branches: 75,
        functions: 80,
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
