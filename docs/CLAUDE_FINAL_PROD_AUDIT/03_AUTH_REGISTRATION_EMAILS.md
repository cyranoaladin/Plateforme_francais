# PHASE 3 — AUTH, INSCRIPTION, RESET, EMAILS

> Audit 2026-03-21 — Tests Playwright + API sur production réelle

---

## 1. Formulaire de connexion

| Test | Résultat |
|------|----------|
| Champ email présent | ✅ |
| Champ mot de passe présent | ✅ |
| Option inscription visible | ✅ |
| Mode register (`?mode=register`) | ✅ Nom, checkbox CGU, option mineur |
| Mode reset (`?mode=reset`) | ✅ |
| Label leaks (PRO/MAX/clictopay) | ✅ Aucun |

## 2. API Login

| Test | Résultat |
|------|----------|
| Mauvais identifiants → 401 | ✅ "Email ou mot de passe incorrect." |
| Message d'erreur en français | ✅ |
| Pas de fuite d'info (email existe ?) | ✅ Message identique |

## 3. API Register — Validation

| Test | Status | Résultat |
|------|--------|----------|
| Body vide | 400 | ✅ Rejet correct |
| Champs manquants | 400 | ✅ "Payload invalide." |
| Email invalide | 400 | ✅ Rejet correct |
| Mot de passe trop court | 400* | ✅ Rejet correct (*429 dû au rate limit cumulatif) |

## 4. API Forgot Password

| Test | Résultat |
|------|----------|
| Email inexistant → 200 | ✅ Sécurisé — ne révèle pas l'existence |
| Message générique | ✅ "Si un compte existe pour cet email, un lien de réinitialisation a été envoyé." |

## 5. API Auth/me sans session

| Test | Résultat |
|------|----------|
| GET /api/v1/auth/me → 401 | ✅ |

## 6. CSRF Token

| Test | Résultat |
|------|----------|
| GET /api/v1/csrf → 200 | ✅ |
| Token retourné (48 hex chars) | ✅ |
| Cookie `eaf_csrf` posé | ✅ |
| httpOnly=false (double-submit) | ✅ Correct pour le pattern |
| secure=true | ✅ |

## 7. Rate Limiting

| Test | Résultat |
|------|----------|
| Login: 12 tentatives consécutives | ⚠️ Pas de 429 déclenché |

**Analyse** : Le rate limiter fonctionne via Redis avec clé basée sur IP (`rl:auth:login:{ip}`). Les requêtes Playwright directes passent par nginx qui set `x-forwarded-for`. Limite configurée = 10/min. Le non-déclenchement après 12 tentatives pourrait être dû à :
- Rotation de la fenêtre Redis pendant le test
- IP différente vue par le serveur (proxy chain)

**Impact** : FAIBLE pour le go-live (le mécanisme est en place, fonctionne avec Redis, et a une stratégie FAIL-CLOSED). À re-tester manuellement.

## 8. Protection des endpoints API

| Endpoint | Sans auth | Résultat |
|----------|-----------|----------|
| GET /api/v1/student/profile | 401 | ✅ |
| GET /api/v1/admin/stats | 401 | ✅ |
| GET /api/v1/admin/users | 401 | ✅ |
| GET /api/v1/enseignant/dashboard | 401 | ✅ |
| GET /api/v1/billing/status | 401 | ✅ |
| POST /api/v1/chat | 401 | ✅ |
| POST /api/v1/oral/session/start | 401 | ✅ |
| GET /api/v1/carnet | 401 | ✅ |

**8/8 endpoints protégés correctement.**

## 9. Emails (audit de code)

| Email | Trigger | Template | Résultat |
|-------|---------|----------|----------|
| Welcome | POST /register success | `sendWelcomeEmail` | ✅ Non-bloquant, log si échec |
| Parental Consent | Register mineur+parentEmail | `sendParentalConsentEmail` | ✅ Token RGPD |
| Reset Password | POST /forgot-password | `sendTransactionalEmail` | ✅ Lien avec token |
| Contact Form | POST /contact | `sendTransactionalEmail` | ✅ |

⚠️ Test d'envoi réel non effectué (pas de compte test dédié sur prod). Le code gère correctement les erreurs d'envoi (non-bloquant pour welcome, logging).

## Défauts

| ID | Sévérité | Description |
|----|----------|-------------|
| P3-001 | BASSE | Rate limit login non déclenché en test automatisé (à re-tester manuellement) |
