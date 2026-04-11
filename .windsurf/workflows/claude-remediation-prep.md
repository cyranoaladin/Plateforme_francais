---
description: Prepare narrow, testable remediation batches after the external audit without attempting a broad rewrite
---
# Claude Remediation Prep Workflow

1. Read the current audit handoff files first:
   - `AUDIT_BRIEF.md`
   - `REMEDIATION_BACKLOG.md`
   - `VERIFICATION_CHECKLIST.md`
   - `KNOWN_RISKS.md`

2. Re-read the exact files affected by the findings before planning changes. Do not batch unrelated subsystems together.

3. Split remediation into small lots with explicit boundaries. Each lot must have:
   - a narrow objective
   - exact target files
   - exact tests to add or run
   - a rollback story
   - no opportunistic cleanup outside scope

4. Use this default lot order unless the audit proves another order is safer:
   - P0 security / auth / permissions / payment / quota / worker / cron blockers
   - P1 robustness / consistency / observability / CI
   - P2 cleanup / simplification / non-critical refactors

5. For every lot, write down:
   - what is confirmed broken vs only suspected
   - what existing hardening must be preserved
   - which runtime behavior is prod-only, dev-only, or test-only

6. Never prepare a remediation lot that simultaneously changes:
   - auth gate layering
   - payment flow
   - queue/worker semantics
   - persistence fallback semantics
   unless the audit proves they are inseparable.

7. Require tests before behavior changes. For each lot:
   - write failing tests first where production code changes are involved
   - run the targeted tests
   - implement the minimum fix
   - rerun targeted tests
   - rerun broader verification only after the lot is green

8. Keep change surface limited. If a planned lot touches too many files or domains, split it again.

9. Use verification by lot. At minimum choose from:
   - `npm run typecheck`
   - `npm run test:unit`
   - `npm run test:e2e`
   - `npm run test:contracts`
   - `npm run mcp:test`
   - `npm run check:fr-copy`
   - `node scripts/check-env.js`

10. Re-check these critical boundaries before approving a lot:
   - `middleware.ts` vs `proxy.ts`
   - teacher scope in `src/app/api/v1/enseignant/*`
   - payment callback/state transitions in `src/lib/payments/clictopay.ts`
   - queue fail-safe behavior in `src/lib/queue/*`
   - cron semantics in `src/lib/cron/scheduler.ts` and `src/app/api/v1/cron/*`
   - storage prod rules in `src/lib/storage/provider.ts`
   - MCP internal-only assumptions in `packages/mcp-server` and `scripts/nginx-eaf.conf`

11. Reserve final stabilization for a dedicated phase. Do not declare the project stabilized at the end of a single remediation lot.

12. Final stabilization prep must include:
   - full verification command list
   - explicit remaining uncertainties
   - deployment/rollback notes if infra-sensitive files changed
   - confirmation that docs were only updated where runtime truth changed
