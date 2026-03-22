# PHASE 10 — COHÉRENCE FRONT / BACK / DB

> **Audit revalidé 2026-03-22** — Code audit + prod tests, SHA `9e386b5`

---

## Plan IDs et labels

| ID interne (DB) | Prisma enum | Plan Catalog label | PLAN_DISPLAY_LABELS | Pricing page | Admin page |
|-----------------|------------|-------------------|-------------------|-------------|------------|
| FREE | ✅ SubscriptionPlan | Freemium | Freemium | ✅ Freemium | ✅ Freemium |
| PREMIUM | ✅ SubscriptionPlan | Premium | Premium | ✅ Premium | ✅ Premium |
| PRO | ✅ SubscriptionPlan | Masterium | Masterium | ✅ Masterium | ✅ Masterium |
| MAX | ✅ SubscriptionPlan | Masterium | Masterium | N/A (hidden) | ✅ Masterium Lifetime |

**Verdict** : ✅ Cohérent. MAX est non-enumerable dans PLAN_CATALOG (Object.keys() = 3 plans visibles).

## Quotas front vs back

| Feature | Plan Catalog | Check-Quota API | Workshop APIs | Pricing display |
|---------|-------------|----------------|---------------|-----------------|
| ORAL_SESSIONS | ✅ Défini | ✅ Validé | ✅ consumeQuota | ✅ Affiché |
| WRITTEN_CORRECTIONS | ✅ Défini | ✅ Validé | ✅ checkBillingQuota | ✅ Affiché |
| TUTOR_QUESTIONS | ✅ Défini | ✅ Validé | ✅ consumeQuota | ✅ Affiché |
| OCR_COPIES | ✅ Défini | ✅ Validé | ✅ | ✅ Affiché |
| LLM_TOKENS | ✅ Défini | ✅ Validé | ✅ | Interne |
| RAG_SEARCH | ✅ Défini | ✅ Validé | ✅ | Interne |
| QUIZ_PER_DAY | ✅ Défini | ✅ Validé | ✅ consumeQuota | ✅ Affiché |

**Verdict** : ✅ Cohérent. Toutes les features sont définies, vérifiées et consommées.

## Routes front vs API

| Page front | API call | Route exists | Résultat |
|-----------|---------|-------------|----------|
| /dashboard | /api/v1/memory/timeline | ✅ | ✅ |
| /atelier-oral | /api/v1/oral/session/* | ✅ | ✅ |
| /atelier-ecrit | /api/v1/epreuves/* | ✅ | ✅ |
| /atelier-langue | /api/v1/langue/* | ✅ | ✅ |
| /quiz | /api/v1/quiz/* | ✅ | ✅ |
| /tuteur | /api/v1/tuteur/message, /api/v1/chat | ✅ | ✅ |
| /pricing | /api/v1/billing/status, /api/v1/billing/redeem-code | ✅ | ✅ |
| /profil | /api/v1/student/profile | ✅ | ✅ |
| /carnet | /api/v1/carnet | ✅ | ✅ |
| /admin | /api/v1/admin/* | ✅ | ✅ |
| /enseignant | /api/v1/enseignant/* | ✅ | ✅ |
| /contact | /api/v1/contact | ✅ | ✅ |
| /login | /api/v1/auth/login, /register, /forgot-password | ✅ | ✅ |

## Middleware vs pages

| Public path (middleware) | Page exists | Résultat |
|------------------------|------------|----------|
| / | ✅ | ✅ |
| /login | ✅ | ✅ |
| /pricing | ✅ | ✅ |
| /contact | ✅ | ✅ |
| /mentions-legales | ✅ | ✅ |
| /cgu | ✅ | ✅ |
| /politique-de-confidentialite | ✅ | ✅ |
| /robots.txt | ✅ (static) | ✅ |
| /sitemap.xml | ✅ (static) | ✅ |
| /ressources | ✅ | ✅ |

## Legacy plan names

`normalizePlanId()` dans plan-catalog.ts gère correctement les noms legacy :
- MONTHLY → PREMIUM
- LIFETIME → PRO
- Inconnu → FREE

## Défauts

Aucun défaut de cohérence identifié.
