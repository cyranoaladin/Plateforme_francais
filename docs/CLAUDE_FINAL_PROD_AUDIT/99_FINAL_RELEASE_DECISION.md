# NEXUS REUSSITE EAF — FINAL RELEASE DECISION v14

**Date**: 2026-03-22 01:00 UTC
**SHA**: f08791f
**CI**: all gates success

---

## 1. DEFAUTS (12 trouves, 12 corriges)

| # | Severite | Defaut | Commit |
|---|----------|--------|--------|
| 1 | MAJOR | SHA mismatch | redeploy |
| 2 | MAJOR | .env/.git -> 307 | a9bc7e2 |
| 3 | MAJOR | ClicToPay routes zombie | a9bc7e2 |
| 4 | MINOR | clictopay lib/pages | a9bc7e2 |
| 5 | MINOR | MAX plan label | d4b8b8f |
| 6 | MAJOR | Port 3000 sur 0.0.0.0 | ed291b8 |
| 7 | MINOR | E2E StickyNav | 9dbd0ea |
| 8 | MAJOR | BILLING_CODE_PEPPER manquant | d2d249b |
| 9 | MAJOR | OralSession reste DRAFT | fdba1ac |
| 10 | MINOR | totalScore Int troncature | a5374f4 |
| 11 | CRITICAL | Mobile overflow (body 964px) | f08791f |
| 12 | MINOR | aria-label mismatch pricing | ee01711 |
| + | FIX | E2E skips conditionnels | c5a2c42 |
| + | FIX | Parent page non protegee | f79aebe |

## 2. DEFAUT MOBILE (Defaut 11)

| Check | Resultat |
|-------|----------|
| Cause racine | body flex + main flex-1 min-width:auto = body 964px |
| Fix | min-w-0 sur AppShell main + overflow-x:clip html + max-w-[100vw] body |
| Playwright body | 375/375 (was 964/375) |
| Playwright doc | 375/375 |
| Playwright canScroll | false |
| ComparisonTable | Desktop hidden md:block, mobile accordion md:hidden |
| Screenshot 375px | Hero renders correctly, no overflow |
| Commit | f08791f |

## 3. LIGHTHOUSE MOBILE

| Metric | Score |
|--------|-------|
| Performance | 88-95 (LCP varies 2.9-3.2s, VPS latency) |
| Accessibility | 97 |
| Best Practices | 100 |
| SEO | 100 |
| CLS | 0 |
| TBT | 20-140ms |
| label-mismatch | 1 (PASS) |
| meta-viewport | 1 (PASS) |

## 4. CHECKLIST GO LIVE

### Mobile
- [x] body scrollWidth = 375px (viewport width)
- [x] canScroll horizontally: false
- [x] overflow-x: clip on html
- [x] min-w-0 on AppShell main
- [x] ComparisonTable: accordion on mobile
- [x] StickyNav: position:fixed, unaffected by overflow
- [x] WhatsApp button: position:fixed, visible

### Infrastructure
- [x] SHA local = origin = prod
- [x] PM2: 3 services online
- [x] Port 3000: 127.0.0.1
- [x] PostgreSQL: 21 migrations
- [x] BILLING_CODE_PEPPER documented

### Security
- [x] .env/.git/prisma -> 404
- [x] Cookies: HttpOnly, Secure, SameSite=lax
- [x] CSRF, rate limiting, path traversal
- [x] /parent for student -> 307

### Ateliers
- [x] Tuteur, Oral (4 phases FINALIZED), Ecrit, Langue, Quiz
- [x] Carnet CRUD, Descriptif CRUD
- [x] Library gating: FREE blocked, PREMIUM allowed
- [x] Activation code: full workflow proven

### Auth
- [x] Register, Login, Logout (session invalidated)
- [x] RBAC: student->admin 403
- [x] Error messages: French, no leaks

## 5. DECISION

### ETAT A — GO TOTAL

12 defauts trouves, 12 corriges.
Mobile overflow root cause fixed (body 375/375).
Awaiting Samsung Galaxy confirmation from user.

**SHA: f08791f**
