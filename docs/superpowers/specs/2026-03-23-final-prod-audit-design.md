# Final Production Audit Design

**Date:** 2026-03-23
**Product:** Nexus Réussite EAF
**Production target:** `https://eaf.nexusreussite.academy`
**Server target:** `root@88.99.254.59`

## Goal

Run a full pre-commercial-release counter-expertise on the real production system, starting from zero, with no trust in prior audit artifacts. Every finding must be either:

- reproduced and documented,
- corrected with a traceable code change,
- deployed to production,
- revalidated with proof,

or explicitly qualified as a remaining release blocker with exact business impact.

## Recommended Execution Model

Use a sequential audit with blocking gates.

Rationale:

- Production state changes after each fix, so broad upfront auditing would create stale evidence.
- The user requires proof per finding, including post-deploy validation.
- Critical issues must stop transversal progress until they are fixed or precisely qualified.

## Execution Rules

### Source of truth

- Production measurements taken during this session are the only valid truth source.
- Existing audit files in `docs/CLAUDE_FINAL_PROD_AUDIT/` are not trusted and must be rewritten from fresh measurements.
- For each phase, commands, observations, defects, fixes, and retest evidence must be recorded in the matching phase file.

### Severity and blocking

- `CRITIQUE`: blocks progression immediately until corrected or explicitly qualified as a release blocker.
- `MAJEUR`: blocks release decision and may block downstream phases when it invalidates later evidence.
- `MINEUR`: documented and deferred only if business impact is limited and non-launch-blocking.

### Correction policy

- A defect is corrected only after it is reproduced and its root cause is identified.
- Any code or config change must be tested locally when feasible before deployment.
- No defect is marked fixed without post-deploy production evidence.

### Commit and deployment policy

- One commit per corrected defect when practical.
- Commit format for audit fixes: `fix(audit-phase-N): <description> [audit-ID]`
- Push target: `origin main`
- Deployment method: `bash scripts/deploy.sh root@88.99.254.59`

### Evidence policy

Acceptable evidence includes:

- `curl` responses and headers,
- `ssh` output for PM2, Nginx, PostgreSQL, Redis, and logs,
- database checks via Prisma or `psql`,
- Playwright/browser validation when UI behavior matters,
- local test output when used to validate a fix before deploy.

No issue may be closed with speculative wording such as "should work".

## Operational Decomposition

### Block A

- Phase 0: source of truth and infrastructure state
- Phase 1: exhaustive surface mapping

Purpose: establish deployment integrity, real infra state, and exact application surfaces before business-flow testing.

### Block B

- Phase 2: public pages and anonymous flows
- Phase 3: authentication, registration, reset, emails

Purpose: validate the acquisition funnel, public-facing security posture, and entry into authenticated flows.

### Block C

- Phase 4: student dashboard and student flows
- Phase 5: student workshops end to end
- Phase 6: library, resources, and media streaming

Purpose: validate the commercial core of the product for Freemium, Premium, and Masterium users.

### Block D

- Phase 7: billing, activation codes, manual payment workflow
- Phase 8: parent, teacher, and admin roles
- Phase 10: front/API/DB consistency

Purpose: validate monetization, role isolation, administration, and data consistency across layers.

### Block E

- Phase 9: AI, RAG, LLM, MCP, memory
- Phase 11: security and hardening
- Phase 12: technical tests and CI
- Phase 13: UX, wording, and commercial readiness
- Phase 14: final release decision

Purpose: validate advanced capabilities, hardening, technical quality gates, commercial clarity, and final go/no-go criteria.

## Artifacts

Primary audit outputs live in:

- `docs/CLAUDE_FINAL_PROD_AUDIT/00_SOURCE_OF_TRUTH.md`
- `docs/CLAUDE_FINAL_PROD_AUDIT/01_SURFACE_MAP.md`
- `docs/CLAUDE_FINAL_PROD_AUDIT/02_PUBLIC_ANONYMOUS_FLOWS.md`
- `docs/CLAUDE_FINAL_PROD_AUDIT/03_AUTH_REGISTRATION_EMAILS.md`
- `docs/CLAUDE_FINAL_PROD_AUDIT/04_STUDENT_DASHBOARD_AND_FLOWS.md`
- `docs/CLAUDE_FINAL_PROD_AUDIT/05_STUDENT_WORKSHOPS_END_TO_END.md`
- `docs/CLAUDE_FINAL_PROD_AUDIT/06_LIBRARY_AND_MEDIA.md`
- `docs/CLAUDE_FINAL_PROD_AUDIT/07_BILLING_AND_MANUAL_ACTIVATION.md`
- `docs/CLAUDE_FINAL_PROD_AUDIT/08_ROLES_PARENT_TEACHER_ADMIN.md`
- `docs/CLAUDE_FINAL_PROD_AUDIT/09_AI_RAG_LLM_MCP_MEMORY.md`
- `docs/CLAUDE_FINAL_PROD_AUDIT/10_FRONT_BACK_DB_CONSISTENCY.md`
- `docs/CLAUDE_FINAL_PROD_AUDIT/11_SECURITY_AND_HARDENING.md`
- `docs/CLAUDE_FINAL_PROD_AUDIT/12_TESTS_AND_CI.md`
- `docs/CLAUDE_FINAL_PROD_AUDIT/13_UX_COPY_AND_COMMERCIAL_READINESS.md`
- `docs/CLAUDE_FINAL_PROD_AUDIT/99_FINAL_RELEASE_DECISION.md`

Each defect gets a stable identifier such as `A03-02` and is tracked in:

- the phase document,
- the commit message when fixed,
- the retest proof after deployment,
- the final release decision document.

## Test Data and Safety Controls

- All audit-created users, notes, activation flows, and related entities use explicit `audit-*` identifiers.
- Secrets are never copied into audit documents; only presence, absence, format, and minimum-strength checks are recorded.
- Potentially noisy tests such as rate limits, quotas, and emails use isolated audit accounts.
- If a capability cannot be verified because of missing access, unavailable external dependency, or lack of mailbox/log visibility, it is recorded as an audit blockage with explicit impact.

## Exit Criteria

A phase is closed only when:

- its prescribed checks were actually run,
- results are documented,
- every defect is either fixed with post-deploy proof or explicitly carried as a remaining issue with business impact.

`GO TOTAL` is impossible if any surface remains untested or any major release criterion remains unresolved.
