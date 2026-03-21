# PHASE 7 — BILLING, CODES ACTIVATION, PAIEMENT MANUEL

> Audit 2026-03-21 — Code review + API tests sur production

---

## Architecture Billing

| Composant | Fichier | Résultat |
|-----------|---------|----------|
| Plan Catalog | `src/lib/billing/plan-catalog.ts` | ✅ 4 plans (FREE/PREMIUM/PRO/MAX), quotas, flags, labels |
| Billing Context | `src/lib/billing/context.ts` | ✅ Fallback FREE si pas d'abonnement ou expiré |
| Quota Enforcement | `src/lib/billing/usage.ts` | ✅ Redis INCRBY + TTL, FAIL-CLOSED en prod |
| Code Redemption | `src/lib/billing/redeem.ts` | ✅ Transactionnel Prisma, hashing pepper, validation |
| Check Quota API | `src/app/api/v1/billing/check-quota/route.ts` | ✅ 7 features validées |
| Redeem Code API | `src/app/api/v1/billing/redeem-code/route.ts` | ✅ auth + CSRF + rate limit (5/h) |
| Billing Status API | `src/app/api/v1/billing/status/route.ts` | ✅ auth required |

## Plan Labels (cohérence front/back)

| ID interne | Label affiché | Pricing page | Admin page | Plan catalog |
|-----------|---------------|-------------|------------|-------------|
| FREE | Freemium | ✅ | ✅ | ✅ |
| PREMIUM | Premium | ✅ | ✅ | ✅ |
| PRO | Masterium | ✅ | ✅ | ✅ |
| MAX | Masterium Lifetime | N/A (non-enum) | ✅ | ✅ |

## Code Activation Flow

1. Admin génère code → `POST /api/v1/admin/activation-codes` (auth admin + CSRF + rate limit 20/min)
2. Code format: `EAF` + 12 hex chars aléatoires
3. Code hashé avec pepper SHA-256 avant stockage
4. Élève saisit code sur `/pricing` → `POST /api/v1/billing/redeem-code`
5. Validation transactionnelle: format → hash lookup → status check → expiry → plan upsert

## Sécurité du flux

| Test | Résultat |
|------|----------|
| Redeem sans auth | ✅ 401 |
| Admin codes sans auth | ✅ 401 |
| Admin codes sans rôle admin | ✅ 403 |
| CSRF requis | ✅ |
| Rate limit redeem | ✅ 5 tentatives/heure/user |
| Code déjà utilisé | ✅ 409 |
| Code révoqué | ✅ 409 |
| Code expiré | ✅ 410 |
| Plan stacking | ✅ Extension depuis max(currentEnd, now) |
| Plan upgrade | ✅ Garde le plan le plus élevé |

## Défauts

| ID | Sévérité | Description |
|----|----------|-------------|
| P7-001 | HAUTE | `BILLING_CODE_PEPPER` utilise fallback `'eaf-default-pepper-change-me'` si variable d'environnement absente (ligne 46 redeem.ts). **À corriger** : ajouter la variable à `.env` prod ou bloquer le démarrage sans. |

> Note: Le memory indique que le code a été durci pour bloquer sans pepper, mais le code actuel (`redeem.ts:46`) conserve le fallback. Vérifier si `check-env.js` bloque en amont.
