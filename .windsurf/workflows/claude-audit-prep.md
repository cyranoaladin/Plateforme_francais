---
description: Regenerate the Claude audit pack for the current repository without introducing a new documentation source of truth
---
# Claude Audit Prep Workflow

1. Read the canonical docs in this order:
   - `README.md`
   - `docs/00_INDEX.md`
   - `docs/01_SYSTEME_COMPLET.md`
   - `docs/03_TECHNIQUE_DONNEES_IA_MCP.md`
   - `docs/04_EXPLOITATION_TESTS_DEPLOIEMENT.md`
   - `docs/05_ARBORESCENCE_COMPLETE.md`
   - `packages/mcp-server/README.md`

2. Read the current audit pack if it exists:
   - `AUDIT_BRIEF.md`
   - `CLAUDE_AUDIT_PROMPTS.md`
   - `REMEDIATION_BACKLOG.md`
   - `VERIFICATION_CHECKLIST.md`
   - `KNOWN_RISKS.md`

3. Re-map the live repo before editing any audit file. Verify at minimum:
   - `package.json`
   - `prisma/schema.prisma`
   - `ecosystem.config.cjs`
   - `scripts/check-env.js`
   - `scripts/nginx-eaf.conf`
   - `middleware.ts`
   - `proxy.ts`
   - `src/lib/auth/*`
   - `src/lib/billing/*`
   - `src/lib/payments/clictopay.ts`
   - `src/lib/queue/*`
   - `src/lib/cron/scheduler.ts`
   - `src/lib/storage/*`
   - `src/lib/mcp/client.ts`
   - `packages/mcp-server/src/*`

4. Distinguish explicitly in regenerated output:
   - confirmed in code
   - probable / to verify
   - historical / potentially obsolete

5. Preserve the current documentation policy:
   - canonical docs remain the main documentation center
   - the audit pack is a handoff layer for external auditing, not a new competing source of truth
   - if code contradicts docs, report the contradiction instead of smoothing it over

6. Regenerate these files only if their content is still accurate and specific:
   - `AUDIT_BRIEF.md`
   - `CLAUDE_AUDIT_PROMPTS.md`
   - `REMEDIATION_BACKLOG.md`
   - `VERIFICATION_CHECKLIST.md`
   - `KNOWN_RISKS.md`

7. When regenerating `CLAUDE_AUDIT_PROMPTS.md`, keep exactly 8 prompts:
   - Intake initial
   - Cartographie technique
   - Audit approfondi
   - Contre-audit
   - Plan de remédiation
   - Implémentation P0
   - Implémentation P1/P2
   - Stabilisation finale

8. Do not write generic prompts. Every prompt must reference the real repository layout, real commands, and real high-risk files.

9. Re-verify the following commands against `package.json` before writing them into the pack:
   - `npm run build`
   - `npm run typecheck`
   - `npm run test:unit`
   - `npm run test:e2e`
   - `npm run test:contracts`
   - `npm run mcp:test`
   - `npm run check:fr-copy`
   - `node scripts/check-env.js`

10. Call out uncertain areas honestly. Do not turn uncertainty into fake certainty.

11. Before finishing, verify that all file paths referenced in the pack still exist. Remove stale paths instead of leaving them as cargo-cult references.

12. End with a short summary listing:
   - files regenerated
   - commands confirmed
   - unresolved uncertainties left for the external audit
