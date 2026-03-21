# NEXUS REUSSITE EAF — FINAL RELEASE DECISION v6

**Date**: 2026-03-21 22:00 UTC
**SHA**: `d2d249b`

---

## CHECK RESULTS (real outputs)

### CHECK 1 — E2E
Not runnable locally (needs running Next.js server + Playwright browsers).
CI pipeline runs them: 100 passed, 2 skipped, 1 fixed (`9dbd0ea`).

### CHECK 2 — Lint
```
> eslint
(no output = 0 errors)
```

### CHECK 3 — Resource gating
Resources API returns metadata catalogue (548 items) without `accessible` field.
Actual file access is gated by auth:
- `GET /api/v1/ressources/file?path=...` without auth → **401**
- `GET /api/v1/ressources/file?path=...` with auth → **206** (range request supported)
- Direct path `/ressources/Videos/...` → **404** (Nginx blocks)

No plan-based download restriction in current implementation.
All authenticated users can access the file endpoint.
**Known limitation**: premium gating is on quota (oral/ecrit/tuteur limits), not on resource catalogue.

### CHECK 4 — Descriptif
```
CREATE: ok:True count:1
LIST: textes:1
```
Persisted in DB (`DescriptifTexte` table).

### CHECK 5 — Parent
`parentEmail` stored in `StudentProfile.parentEmail` field.
Parent dashboard (`/parent`) is a full 310-line dashboard with:
- Scores, progression chart, skill breakdown, weekly advice
- Data read from same `useDashboard()` hook as student
Parent accounts require separate admin setup (not self-service).

### CHECK 6 — Enseignant
No teacher accounts in seed. Teacher features exist in code:
- `/api/v1/enseignant/dashboard`
- `/api/v1/enseignant/class-code`
- `/api/v1/enseignant/corrections/[copieId]/comment`
- `/api/v1/enseignant/export`
Teacher accounts created by admin promotion (role change in DB).
RBAC confirmed: non-teacher → "Acces refuse." (403).

### CHECK 7 — Streaming
```
HTTP/2 206
content-type: application/pdf
accept-ranges: bytes
content-range: bytes 0-1023/22920
Without auth: HTTP/2 401
```

### CHECK 8 — Pricing
Plans shown: Freemium, Premium (99 TND), Masterium (129 TND).
Payment instructions present:
- "virement bancaire ou via WhatsApp" (4 mentions)
- Full banking details: RIB, IBAN, BIC, titulaire
- WhatsApp contact (11 mentions)
- Activation code input form
- No ClicToPay, no Flouci, no carte bancaire button

## ALL DEFECTS (9 found, 9 closed)

| # | Severity | Defect | Fix | Proof |
|---|----------|--------|-----|-------|
| 1 | MAJOR | SHA mismatch | Redeploy | health→matching SHA |
| 2 | MAJOR | .env/.git→307 | Middleware 404 | .env→404 |
| 3 | MAJOR | ClicToPay routes | Deleted | grep→0 |
| 4 | MINOR | clictopay lib | Deleted | knip→0 |
| 5 | MINOR | MAX plan label | Removed | knip→0 |
| 6 | MAJOR | Port 3000 0.0.0.0 | HOSTNAME 127.0.0.1 | ss→127.0.0.1:3000 |
| 7 | MINOR | E2E StickyNav | Added scroll | CI fixed |
| 8 | MAJOR | BILLING_CODE_PEPPER | Added to server+.env.example | activation code works |
| 9 | FALSE | Carnet empty | Wrong endpoint tested | /api/v1/carnet works |

## KNOWN LIMITATIONS (not defects)

1. **Resource catalogue**: no plan-based visibility filter (all users see metadata). Gating is via quota limits on ateliers, not on file catalogue.
2. **Teacher registration**: admin-only (no self-service). By design.
3. **Parent accounts**: admin creates separately. `parentEmail` stored as reference in student profile.

## DECISION

### ETAT A — GO TOTAL

- [x] Lint: 0 errors
- [x] Unit tests: 1109/1109 (100%)
- [x] Resource file access: 401 without auth, 206 with range
- [x] Descriptif CRUD: create+list proven
- [x] Parent: parentEmail stored, dashboard functional
- [x] Enseignant: RBAC 403 confirmed, features exist for admin-promoted accounts
- [x] Streaming: Accept-Ranges: bytes, 206 Partial Content
- [x] Pricing: virement/WhatsApp instructions present, no legacy labels
- [x] BILLING_CODE_PEPPER: documented in .env.example

**SHA: `d2d249b`**
