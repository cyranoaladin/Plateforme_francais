# 08 - Authentication, Sessions & RBAC

**Date:** 2026-03-20
**Environment:** Production (eaf-platform)

---

## Login Flow

### Invalid Credentials

Returns `{"error":"Email ou mot de passe incorrect."}` -- no information leakage (does not reveal whether email exists).

### Valid Login (eleve.free@eaf.local)

Returns `{"ok":true}` with the following cookies:

| Cookie        | Secure | HttpOnly | SameSite | Notes                          |
|---------------|--------|----------|----------|--------------------------------|
| `eaf_session` | Yes    | Yes      | lax      | Correct                        |
| `eaf_role`    | Yes    | Yes      | lax      | Correct                        |
| `eaf_csrf`    | Yes    | No       | lax      | No HttpOnly -- correct for JS access |

---

## API Auth Protection

All protected API endpoints return **401** without authentication:

| Endpoint                      | Status |
|-------------------------------|--------|
| `/api/v1/student/profile`     | 401    |
| `/api/v1/admin/stats`         | 401    |
| `/api/v1/billing/status`      | 401    |
| `/api/v1/carnet`              | 401    |
| `/api/v1/enseignant/dashboard`| 401    |

---

## Public APIs

| Endpoint              | Status | Notes          |
|-----------------------|--------|----------------|
| `/api/v1/health`      | 200    |                |
| `/api/v1/csrf`        | 200    |                |
| `/api/v1/exam-info`   | 200    |                |
| `/api/v1/ressources`  | 200    |                |
| `/api/v1/contact`     | 405    | POST only, correct |

---

## RBAC Tests

### Eleve role (eleve.free@eaf.local)

| Endpoint                      | Expected | Actual | Result |
|-------------------------------|----------|--------|--------|
| `/api/v1/admin/stats`         | 403      | 403    | PASS   |
| `/api/v1/admin/users`         | 403      | 403    | PASS   |
| `/api/v1/enseignant/dashboard`| 403      | 403    | PASS   |

### Admin role (admin@eaf.local)

| Endpoint              | Expected | Actual        | Result |
|-----------------------|----------|---------------|--------|
| `/api/v1/admin/stats` | 200      | 200 with data | PASS   |

---

## Authenticated Endpoints (eleve.free@eaf.local)

| Endpoint                  | Status | Response                                          |
|---------------------------|--------|---------------------------------------------------|
| `/api/v1/auth/me`         | 200    | Correct user data                                 |
| `/api/v1/student/profile`  | 200    | Complete profile with `skillMap`, `studyPlan`     |
| `/api/v1/billing/status`   | 200    | `plan=FREE`, `isActive=false`                     |

---

## Seed Accounts on Production

| Email                        | Role   | Plan      |
|------------------------------|--------|-----------|
| `admin@eaf.local`            | admin  | --        |
| `eleve.free@eaf.local`       | eleve  | FREE      |
| `eleve.pro@eaf.local`        | eleve  | PREMIUM   |
| `eleve.masterium@eaf.local`  | eleve  | PRO       |
| `jean@eaf.local`             | eleve  | legacy    |
