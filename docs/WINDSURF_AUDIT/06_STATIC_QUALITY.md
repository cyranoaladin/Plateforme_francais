# 06 — Static Quality Audit (Phase C)

Date: 2026-03-20

## Checks Executed

| Check | Result | Notes |
|-------|--------|-------|
| npm ci | PASS | 1034 packages, 0 vulnerabilities |
| npx tsc --noEmit | PASS | Zero type errors |
| npm run lint | PASS | Zero ESLint errors |
| npx knip | PASS | After removing 4 unused deps (hono, @stryker-mutator/core, @stryker-mutator/vitest-runner, next from mcp-server) |
| npm run test:unit | PASS | 160 files, 1106 tests, after fixing health-route.test.ts (env var fallback) |
| npm run build | PASS | All routes compiled |
| Secret scan | PASS | No hardcoded secrets, only process.env references and CI mock values |
| console.log scan | PASS | Only 2 in CLI script (generate-activation-codes.ts), acceptable |
| TODO/FIXME scan | PASS | Zero remaining |
| localhost scan | PASS | 1 occurrence in MCP health fallback (server-side, acceptable) |

## Issues Found & Fixed

1. **health-route.test.ts**: Expected `BUILD_GIT_SHA` env var but route was changed to read files. Fix: restored env var fallback in health route.
2. **CSP connect-src leaked internal URLs** (`127.0.0.1:18001`, `api.mistral.ai`, `api.openai.com`). Fix: removed server-only URLs from client CSP.
3. **SubscriptionPlan enum divergence**: Prisma had `PREMIUM` but not `MAX`, prod DB had `MAX` but not `PREMIUM`. Fix: added both to schema + migration 0016.
4. **Unused deps**: `hono` (root), `@stryker-mutator/core`, `@stryker-mutator/vitest-runner`, `next` (mcp-server). Fix: removed from package.json.

All fixes committed and deployed.
