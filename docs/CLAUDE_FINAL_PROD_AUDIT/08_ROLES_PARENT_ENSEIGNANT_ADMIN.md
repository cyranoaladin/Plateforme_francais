# PHASE 8 — RÔLES PARENT / ENSEIGNANT / ADMIN

> Audit 2026-03-21 — Code review + API tests sur production

---

## RBAC (Role-Based Access Control)

### Guard implementation (`src/lib/auth/guard.ts`)

| Guard | Logique | Résultat |
|-------|---------|----------|
| `requireAuthenticatedUser()` | Session cookie → DB lookup | ✅ |
| `requireUserRole('admin')` | auth.user.role === 'admin' | ✅ |
| `requireUserRole('enseignant')` | auth.user.role === 'enseignant' OR admin | ✅ |
| `requireUserRole('parent')` | auth.user.role === 'parent' OR admin | ✅ |
| `requireEleve()` | auth.user.role === 'eleve' OR admin | ✅ |

Admin a accès à tous les rôles (bypass implicite dans chaque guard).

## Admin (`/admin`)

| Aspect | Résultat |
|--------|----------|
| Page | ✅ 697 lignes, tabs: users, codes, payments |
| API stats | ✅ `GET /api/v1/admin/stats` — requireUserRole('admin') |
| API users | ✅ `GET /api/v1/admin/users` — requireUserRole('admin') |
| API activation codes | ✅ `GET/POST /api/v1/admin/activation-codes` — requireUserRole('admin') |
| API manual payment | ✅ `POST /api/v1/admin/manual-payment` — requireUserRole('admin') |
| Plan labels admin | ✅ Cohérent (Freemium/Premium/Masterium/Masterium Lifetime) |
| Code generation | ✅ Format EAF + 12 hex, plainCode retourné une seule fois |
| CSRF + rate limit | ✅ Sur tous les POST |

### API Tests Production

| Endpoint | Sans auth | Résultat |
|----------|-----------|----------|
| GET /api/v1/admin/stats | 401 | ✅ |
| GET /api/v1/admin/users | 401 | ✅ |

## Enseignant (`/enseignant`)

| Aspect | Résultat |
|--------|----------|
| Page | ✅ Client component |
| API dashboard | ✅ `GET /api/v1/enseignant/dashboard` — requireUserRole('enseignant') |
| API export | ✅ `GET /api/v1/enseignant/export` — requireUserRole('enseignant') |
| API class-code | ✅ `GET/POST /api/v1/enseignant/class-code` — requireUserRole('enseignant') |
| API corrections comment | ✅ requireUserRole('enseignant') |
| Prod hardening | ✅ 503 si DB indisponible (pas de fallback local) |

### API Tests Production

| Endpoint | Sans auth | Résultat |
|----------|-----------|----------|
| GET /api/v1/enseignant/dashboard | 401 | ✅ |
| GET /api/v1/enseignant/export | 401 | ✅ |

## Parent (`/parent`)

| Aspect | Résultat |
|--------|----------|
| Page | ✅ Client component |
| Flag gating | ✅ `PARENT_DASHBOARD` flag (FREE=false, PREMIUM+=true) |
| Consentement parental | ✅ Token RGPD via `generateConsentToken()` |

## Défauts

Aucun défaut bloquant identifié. RBAC correctement implémenté sur tous les endpoints.
