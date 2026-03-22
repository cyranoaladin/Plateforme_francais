# PHASE 11 — SÉCURITÉ ET ROBUSTESSE

> **Audit revalidé 2026-03-22** — Code audit + prod tests, SHA `9e386b5`

---

## 1. En-têtes de sécurité HTTP

| Header | Valeur | Résultat |
|--------|--------|----------|
| Content-Security-Policy | ✅ Avec nonce dynamique | ✅ |
| X-Frame-Options | DENY | ✅ |
| X-Content-Type-Options | nosniff | ✅ |
| Referrer-Policy | strict-origin-when-cross-origin | ✅ |
| Permissions-Policy | camera=(), microphone=(self), geolocation=() | ✅ |
| Strict-Transport-Security | max-age=63072000; includeSubDomains; preload | ✅ |

## 2. CSRF Protection

| Aspect | Résultat |
|--------|----------|
| Pattern | Double-submit cookie | ✅ |
| Token endpoint | GET /api/v1/csrf → 200, token 48 hex chars | ✅ |
| Cookie | `eaf_csrf`, httpOnly=false (correct pour double-submit), secure=true | ✅ |
| Validation | `validateCsrf()` sur tous les POST protégés | ✅ |

## 3. Authentication

| Aspect | Résultat |
|--------|----------|
| Session storage | DB (Prisma Session model) | ✅ |
| Session cookie | `eaf_session`, httpOnly=true, secure=true, sameSite=lax | ✅ |
| Password hashing | bcrypt avec salt | ✅ |
| Credential error | Message générique "Email ou mot de passe incorrect." | ✅ |
| Forgot password | Ne révèle pas l'existence de l'email | ✅ |

## 4. Rate Limiting

| Aspect | Résultat |
|--------|----------|
| Backend | Redis INCRBY + TTL | ✅ |
| FAIL-CLOSED | ✅ En prod, bloque si Redis indisponible | ✅ |
| Login | 10/min | ✅ (configuré) |
| Register | Limité | ✅ |
| Redeem code | 5/heure/user | ✅ |
| Oral start | 3/heure/user | ✅ |
| Admin codes | 20/min | ✅ |
| Test automatisé | ⚠️ Non déclenché après 12 tentatives (timing/proxy) | À re-tester |

## 5. IDOR (Insecure Direct Object Reference)

| Test | Résultat |
|------|----------|
| userId depuis session (jamais depuis request params) | ✅ |
| `getAuthenticatedUserId()` utilisé partout | ✅ |
| Aucun `request.body.userId` trouvé dans les API | ✅ |

## 6. RBAC

| Test | Résultat |
|------|----------|
| 17 guards sur 8 fichiers API | ✅ |
| Admin bypass implicite dans tous les guards | ✅ |
| Enseignant routes → requireUserRole('enseignant') | ✅ |
| Parent routes → role check | ✅ |
| Élève routes → requireEleve() | ✅ |

## 7. Open Redirect

| Test | Résultat |
|------|----------|
| `/login?redirect=https://evil.com` | ✅ SÉCURISÉ — sanitisé ligne 353 login/page.tsx |
| `/login?redirect=//evil.com` | ✅ SÉCURISÉ — rejeté (startsWith('//')) |
| `/login?redirect=javascript:alert(1)` | ✅ SÉCURISÉ — rejeté (ne commence pas par '/') |

## 8. XSS

| Test | Résultat |
|------|----------|
| `/login?mode=<script>alert(1)</script>` | ✅ Bloqué (React escaping) |
| `/contact?subject=<img onerror=alert(1)>` | ✅ SÉCURISÉ — subject validé contre allowlist SUBJECTS |
| LLM output | ✅ `sanitizeLlmText()` utilisé côté front |
| CSP avec nonce | ✅ Empêche inline script injection |

## 9. Path Traversal

| Test | Résultat |
|------|----------|
| `/api/v1/ressources/file?path=../../etc/passwd` | ✅ 401 (auth required first) |
| `/api/v1/ressources/file?path=..%2F..%2Fetc%2Fpasswd` | ✅ 401 |

## 10. Method Restriction

| Test | Résultat |
|------|----------|
| GET /api/v1/auth/login | ✅ 405 |
| GET /api/v1/auth/register | ✅ 405 |
| DELETE /api/v1/auth/login | ✅ 405 |

## 11. Quota FAIL-CLOSED

| Aspect | Résultat |
|--------|----------|
| Redis down en prod → quota denied | ✅ |
| Redis down en dev → fallback allow | ✅ |
| `BillingContextUnavailableError` → 503 | ✅ |

## 12. Production Hardening

| Aspect | Résultat |
|--------|----------|
| Local persistence fallback blocked in prod | ✅ |
| Email throws if RESEND_API_KEY missing in prod | ✅ |
| ClicToPay callback denies if IP allowlist not set | ✅ |
| Teacher dashboard/export returns 503 if DB down | ✅ |

## Défauts

| ID | Sévérité | Description |
|----|----------|-------------|
| P11-001 | HAUTE | `BILLING_CODE_PEPPER` fallback dans `redeem.ts:46` — variable doit être dans .env prod (réf. P7-001) |
| P11-002 | MOYENNE | MCP server bind 0.0.0.0 — devrait être 127.0.0.1 en prod (réf. P0-004) |
| P11-003 | BASSE | Rate limit login non déclenché en test automatisé (réf. P3-001) |
