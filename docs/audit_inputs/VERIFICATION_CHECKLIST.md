# Verification Checklist — Nexus Réussite EAF

## Before corrective work

### Baseline capture
- [ ] Read `AUDIT_BRIEF.md`
- [ ] Read `KNOWN_RISKS.md`
- [ ] Read canonical docs listed in `docs/00_INDEX.md`
- [ ] Confirm current branch / diff scope
- [ ] Confirm target files and remediation lot boundaries

### Build / static / tests baseline
- [ ] `npm run build`
- [ ] `npm run typecheck`
- [ ] `npm run test:unit`
- [ ] `npm run test:e2e`
- [ ] `npm run test:contracts`
- [ ] `npm run mcp:test`
- [ ] `npm run check:fr-copy`

### Environment / runtime assumptions
- [ ] review `.env.example`
- [ ] review `packages/mcp-server/.env.example`
- [ ] run `node scripts/check-env.js` in the intended production-like context when relevant
- [ ] confirm `ecosystem.config.cjs` matches current operational expectations
- [ ] confirm `scripts/nginx-eaf.conf` still reflects intended MCP/network exposure

### Prisma / data layer
- [ ] inspect `prisma/schema.prisma`
- [ ] inspect `prisma/migrations/*`
- [ ] confirm whether migrations are additive, conflicting, or historical noise
- [ ] identify fallback persistence codepaths before changing repositories

### Critical endpoints to baseline
- [ ] auth
  - `src/app/api/v1/auth/register/route.ts`
  - `src/app/api/v1/auth/login/route.ts`
  - `src/app/api/v1/auth/logout/route.ts`
  - `src/app/api/v1/auth/me/route.ts`
- [ ] teacher scope / RBAC
  - `src/app/api/v1/enseignant/dashboard/route.ts`
  - `src/app/api/v1/enseignant/export/route.ts`
  - `src/app/api/v1/enseignant/corrections/[copieId]/comment/route.ts`
- [ ] billing / payments
  - `src/app/api/v1/billing/status/route.ts`
  - `src/app/api/v1/billing/check-quota/route.ts`
  - `src/app/api/v1/billing/redeem-code/route.ts`
  - `src/app/api/v1/payments/clictopay/init/route.ts`
  - `src/app/api/v1/payments/clictopay/callback/route.ts`
  - `src/app/api/v1/payments/clictopay/status/route.ts`
  - `src/app/api/v1/payments/clictopay/public-status/route.ts`
- [ ] written exam / files
  - `src/app/api/v1/epreuves/generate/route.ts`
  - `src/app/api/v1/epreuves/[epreuveId]/copie/route.ts`
  - `src/app/api/v1/epreuves/copies/[copieId]/file/route.ts`
  - `src/app/api/v1/epreuves/copies/[copieId]/report/route.ts`
- [ ] oral
  - `src/app/api/v1/oral/session/start/route.ts`
  - `src/app/api/v1/oral/session/[sessionId]/interact/route.ts`
  - `src/app/api/v1/oral/session/[sessionId]/end/route.ts`
- [ ] worker / cron / MCP
  - `src/lib/queue/start-worker.ts`
  - `src/app/api/v1/cron/revision-reminders/route.ts`
  - `src/app/api/v1/cron/weekly-reports/route.ts`
  - `src/app/api/mcp/health/route.ts`

### Rollback readiness
- [ ] define which files constitute the lot
- [ ] ensure rollback can revert only that lot
- [ ] note any schema/data migration that would complicate rollback

## After corrective work

### Re-run mandatory checks
- [ ] `npm run build`
- [ ] `npm run typecheck`
- [ ] `npm run test:unit`
- [ ] `npm run test:e2e`
- [ ] `npm run test:contracts`
- [ ] `npm run mcp:test`
- [ ] `npm run check:fr-copy`

### Targeted verification by domain

#### Auth / session / CSRF
- [ ] register still works with expected role restrictions
- [ ] login still sets session cookie and CSRF behavior correctly
- [ ] protected API routes reject unauthenticated requests consistently
- [ ] no regression between `middleware.ts` and `proxy.ts`

#### Teacher scope / RBAC
- [ ] teacher can access own class data
- [ ] teacher cannot access unrelated student/copy data
- [ ] admin override, if any, is still intentional and explicit
- [ ] export and teacher comment routes enforce the same scope assumptions

#### Billing / quotas
- [ ] `billing/status` reflects real subscription state
- [ ] quota checks still align with `src/lib/billing/context.ts` and `src/lib/billing/usage.ts`
- [ ] production-like failure modes do not silently allow abuse

#### Payment callback / status
- [ ] callback path still updates transactions idempotently
- [ ] invalid source / invalid allowlist behavior is correct
- [ ] public status path does not leak more than intended
- [ ] subscription state changes remain coherent after accepted/refused/error transitions

#### Worker / queue
- [ ] correction submission still enqueues correctly
- [ ] production path does not fall back silently to in-process worker
- [ ] worker startup command still matches `ecosystem.config.cjs`
- [ ] Redis failure behavior remains explicit

#### Cron
- [ ] local scheduler behavior remains limited to intended local mode
- [ ] production cron routes still require proper secret/auth
- [ ] no duplicate scheduling semantics were introduced

#### Storage / files
- [ ] prod assumptions still require `STORAGE_PROVIDER=s3`
- [ ] file download routes still enforce access checks
- [ ] local-only dev behavior was not reintroduced into prod paths

#### MCP
- [ ] `npm run mcp:test` still passes
- [ ] `src/app/api/mcp/health/route.ts` still reflects real MCP reachability
- [ ] no change accidentally assumes MCP is public-facing

#### Prisma / data
- [ ] schema still generates cleanly if touched
- [ ] no repository change reintroduced unsafe prod fallback
- [ ] migrations, if added, are narrow and reversible

### Documentation / operator sanity
- [ ] if runtime truth changed, canonical docs were updated
- [ ] no historical or contradictory doc was introduced
- [ ] commands documented still exist in `package.json`

### Final rollback check
- [ ] lot can be reverted independently
- [ ] rollback does not leave schema or queue state inconsistent
- [ ] operator notes are explicit for any non-trivial deployment change
