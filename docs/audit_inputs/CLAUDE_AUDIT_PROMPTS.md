# Claude Audit Prompts — Nexus Réussite EAF

## 1. Intake initial

```text
You are auditing the repository `/home/alaeddine/Documents/Plateforme_Francais/eaf_platform`.
Start by reading only these files: `AUDIT_BRIEF.md`, `KNOWN_RISKS.md`, `README.md`, `docs/00_INDEX.md`, `docs/01_SYSTEME_COMPLET.md`, `docs/03_TECHNIQUE_DONNEES_IA_MCP.md`, `docs/04_EXPLOITATION_TESTS_DEPLOIEMENT.md`, `docs/05_ARBORESCENCE_COMPLETE.md`, `package.json`, `prisma/schema.prisma`, `packages/mcp-server/README.md`.
Output only:
1. your understanding of the real system,
2. confirmed vs uncertain areas,
3. the audit order you will follow.
Do not propose fixes yet. Do not trust docs blindly. Recross-check any high-impact claim in code.
```

## 2. Cartographie technique

```text
Map the real architecture of `/home/alaeddine/Documents/Plateforme_Francais/eaf_platform` without changing code.
You must cover exact entry points and boundaries:
- `src/app`
- `src/app/api/v1`
- `src/lib/auth/*`
- `src/lib/billing/*`
- `src/lib/payments/clictopay.ts`
- `src/lib/queue/*`
- `src/lib/cron/scheduler.ts`
- `src/lib/storage/*`
- `src/lib/mcp/client.ts`
- `middleware.ts`
- `proxy.ts`
- `prisma/schema.prisma`
- `packages/mcp-server/src/*`
Return:
- system map,
- critical paths,
- cross-module dependencies,
- duplicate or overlapping control layers,
- areas where code and docs may diverge.
Do not remediate yet.
```

## 3. Audit approfondi

```text
Perform a deep technical audit of `/home/alaeddine/Documents/Plateforme_Francais/eaf_platform`.
Focus on:
- auth/session/csrf/rate limit,
- role checks and teacher scope,
- billing/quota enforcement,
- ClicToPay init/callback/status flows,
- BullMQ worker and Redis failure semantics,
- cron routes vs local scheduler,
- storage and file access,
- Prisma schema/repositories/fallback persistence,
- MCP boundary and internal exposure,
- tests, CI, deployment assumptions.
For every finding, classify it as one of:
- confirmed bug,
- security risk,
- production risk,
- architectural debt,
- intentional tradeoff,
- uncertain / needs proof.
Do not start fixing. Quote exact file paths.
```

## 4. Contre-audit

```text
Review your own previous audit critically on `/home/alaeddine/Documents/Plateforme_Francais/eaf_platform`.
Challenge every major finding against live code and canonical docs.
Specifically verify you did not confuse:
- dev/test fallback with production behavior,
- historical assumptions with current implementation,
- docs counts with live counts,
- role checks with full data scope enforcement,
- internal MCP design with public exposure.
Output:
- findings you confirm,
- findings you retract or downgrade,
- findings still uncertain,
- places where your first audit was too aggressive or too trusting.
Do not implement fixes.
```

## 5. Plan de remédiation

```text
Using the confirmed findings for `/home/alaeddine/Documents/Plateforme_Francais/eaf_platform`, produce a remediation plan.
Base it on these project constraints:
- small lots,
- exact file paths,
- no generic advice,
- distinguish P0/P1/P2,
- separate security blockers from cleanup,
- preserve recent production hardening.
You must use and align with:
- `REMEDIATION_BACKLOG.md`
- `VERIFICATION_CHECKLIST.md`
- `KNOWN_RISKS.md`
Return:
- ordered remediation lots,
- dependencies between lots,
- tests to add first,
- verification commands per lot,
- rollback concerns.
Do not code yet.
```

## 6. Implémentation P0

```text
Implement only confirmed P0 items in `/home/alaeddine/Documents/Plateforme_Francais/eaf_platform`.
Rules:
- no broad refactor,
- no opportunistic cleanup,
- test first for each behavior change,
- keep surface area narrow,
- preserve current production hardening unless you have proof it is wrong.
Before touching code, restate:
- exact P0 scope,
- target files,
- failing tests you will write first,
- verification commands.
After each increment, run the relevant tests.
Do not mix P1/P2 work into this phase.
```

## 7. Implémentation P1/P2

```text
Implement the validated P1/P2 remediation lots for `/home/alaeddine/Documents/Plateforme_Francais/eaf_platform`.
Rules:
- keep lots independent,
- no cross-cutting rewrite unless explicitly justified,
- preserve behavior already hardened in production,
- add tests for regressions and edge cases,
- keep docs aligned only when code truth changes.
Use exact file paths and explicit verification after every lot.
If a suspected issue is not proven in code, stop and mark it uncertain instead of rewriting preemptively.
```

## 8. Stabilisation finale

```text
Perform final stabilization on `/home/alaeddine/Documents/Plateforme_Francais/eaf_platform` after remediation.
You must verify:
- `npm run build`
- `npm run typecheck`
- `npm run test:unit`
- `npm run test:e2e`
- `npm run test:contracts`
- `npm run mcp:test`
- `npm run check:fr-copy`
- `node scripts/check-env.js` in the correct production-like context if needed
Also verify critical flows conceptually or with tests:
- auth,
- teacher RBAC/scope,
- billing/quota,
- payment callback/status,
- worker,
- cron,
- MCP health,
- Prisma migration assumptions.
Return only:
- what passed,
- what remains uncertain,
- what should not ship,
- what is safe to declare stabilized.
```
