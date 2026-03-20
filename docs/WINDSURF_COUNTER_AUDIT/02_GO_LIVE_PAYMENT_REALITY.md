# PHASE 2 — PAIEMENT GO-LIVE RÉALITÉ

> Audit contradictoire Nexus Réussite EAF  
> Date: 2026-03-21  
> Phase: 2 — Payment Reality  
> Auditeur: Windsurf Counter-Audit

---

## 1. DÉCISION MÉTIER OFFICIELLE

**Go-live autorisé:**
- ✅ Virement bancaire
- ✅ Espèces  
- ✅ WhatsApp (+216 99 19 28 29)
- ❌ Carte bancaire (désactivé)
- ❌ Flouci (désactivé)
- ❌ ClicToPay (désactivé — à confirmer)

**Flow attendu:**
1. Utilisateur paie par virement/espèces
2. Admin génère un code d'activation
3. Utilisateur saisit le code sur `/pricing`
4. Plan activé immédiatement

---

## 2. AUDIT ROUTES PAIEMENT

### 2.1 Route: Redeem Code (Activation par code) ✅

**Fichier:** `src/app/api/v1/billing/redeem-code/route.ts`

| Aspect | État | Preuve |
|--------|------|--------|
| **Fonctionnalité** | ✅ Active | Route POST complète, validation CSRF, rate-limit 5/h |
| **Authentification** | ✅ Requise | `requireAuthenticatedUser()` |
| **Rate limiting** | ✅ 5 essais/heure | `checkRateLimit({ limit: 5, windowMs: 60*60*1000 })` |
| **Réponses** | ✅ Complètes | 200/400/409/410/429 |

**Verdict:** Route opérationnelle pour le go-live manuel.

---

### 2.2 Route: Manual Payment (Validation admin) ⚠️

**Fichier:** `src/app/api/v1/admin/manual-payment/route.ts`

| Aspect | État | Preuve | Issue |
|--------|------|--------|-------|
| **Authentification** | ✅ Admin requis | `requireUserRole('admin')` | — |
| **CSRF** | ✅ Validé | `validateCsrf()` | — |
| **Rate limit** | ✅ 10 req/min | `checkRateLimit({ limit: 10 })` | — |
| **Plans supportés** | ✅ PREMIUM/PRO/MAX | `z.enum(['PREMIUM', 'PRO', 'MAX'])` | ⚠️ ID MAX exposé |
| **Provider** | 🔴 **CLICTOPAY** | Ligne 57: `provider: 'CLICTOPAY'` | **INCORRECT** |
| **OrderRef** | 🔴 **MANUAL-** | Ligne 61: `orderRef: 'MANUAL-${reference}'` | Confusant |

**🔴 ISSUE CRITIQUE:**
```typescript
// Ligne 57 — Provider incorrect
provider: 'CLICTOPAY', // On utilise CLICTOPAY comme provider par défaut
```
Le paiement manuel est enregistré comme `CLICTOPAY` en base! C'est trompeur pour l'audit et les rapports.

**Recommandation:** Changer pour `provider: 'MANUAL'` ou `'VIREMENT'`.

---

### 2.3 Route: ClicToPay Init ❌ ACTIVE MAIS NE DEVRAIT PAS L'ÊTRE

**Fichier:** `src/app/api/v1/payments/clictopay/init/route.ts`

| Aspect | État | Preuve |
|--------|------|--------|
| **Route active** | 🔴 **OUI** | Route POST complète et fonctionnelle |
| **Authentification** | ✅ Requise | `getAuthenticatedUserId()` |
| **CSRF** | ✅ Validé | `validateCsrf()` |
| **Rate limit** | ✅ 5 req/min | `checkRateLimit({ limit: 5 })` |
| **Plans acceptés** | 🔴 PREMIUM/PRO/MONTHLY/LIFETIME | `z.enum(['PREMIUM', 'PRO', 'MONTHLY', 'LIFETIME'])` |
| **Initiation ClicToPay** | 🔴 **ACTIVE** | `initiateClicToPayPayment()` appelé |

**🔴 BLOQUANT:** La route ClicToPay est **toujours fonctionnelle**! Elle peut initier des paiements carte si les credentials sont configurés.

**Vérification requise:**
```bash
# Vérifier si CLICTOPAY_USERNAME et CLICTOPAY_PASSWORD sont configurés en prod
ssh root@88.99.254.59 "grep -E 'CLICTO' /opt/eaf_platform/.env.production"
```

---

### 2.4 Route: ClicToPay Callback ❌ ACTIVE MAIS NE DEVRAIT PAS L'ÊTRE

**Fichier:** `src/app/api/v1/payments/clictopay/callback/route.ts`

| Aspect | État | Preuve |
|--------|------|--------|
| **Route active** | 🔴 **OUI** | GET + POST complets |
| **IP Allowlist** | ⚠️ Configurable | `CLICTOPAY_IP_ALLOWLIST` |
| **HMAC Signature** | ⚠️ Configurable | `CLICTOPAY_WEBHOOK_SECRET` |
| **Idempotence** | ✅ Gérée | Vérifie `status: 'ACCEPTED'` |
| **Email confirmation** | ✅ Envoyé | `sendSubscriptionConfirmationEmail()` |

**🔴 BLOQUANT:** Le webhook ClicToPay est **toujours actif** et peut traiter des paiements!

---

### 2.5 Route: ClicToPay Status ❌ UTILISÉE PAR LE FRONT

**Fichier:** `src/app/api/v1/payments/clictopay/status/route.ts`

**Usage:**
```typescript
// src/app/pricing/page.tsx lignes 225, 280
await apiFetch('/api/v1/payments/clictopay/status')
```

🔴 La page pricing dépend encore de l'endpoint ClicToPay pour afficher le statut de facturation!

---

## 3. MATRICE DE CONTRADICTION PAIEMENT

| Claim officiel | Réalité code | Écart | Sévérité |
|----------------|--------------|-------|----------|
| ClicToPay **désactivé** | Routes init/callback **actives** | 🔴 Paiement carte possible | **BLOQUANT** |
| Flouci **non actif** | Mentionné dans UI | 🟡 Confusion UX | Mineur |
| Provider = Manuel | Provider = 'CLICTOPAY' en DB | 🔴 Audit trompeur | **MAJEUR** |
| 3 plans | 4 IDs (FREE/PREMIUM/PRO/MAX) | 🟡 Complexité cachée | Mineur |

---

## 4. TESTS MANUELS REQUIS (Non exécutés — besoin env prod)

### 4.1 Scénarios à valider:

| # | Scénario | Méthode | Attendu | Statut |
|---|----------|---------|---------|--------|
| 1 | Génération code PREMIUM | Admin | Code valide 30j | ⏳ À tester |
| 2 | Génération code PRO | Admin | Code valide 30j | ⏳ À tester |
| 3 | Redeem code valide | Élève | Upgrade immédiat | ⏳ À tester |
| 4 | Redeem code invalide | Élève | Erreur 400 | ⏳ À tester |
| 5 | Redeem code utilisé | Élève | Erreur 409 | ⏳ À tester |
| 6 | Redeem code expiré | Élève | Erreur 410 | ⏳ À tester |
| 7 | Double soumission | Élève | Idempotence | ⏳ À tester |
| 8 | Redeem non auth | Anonyme | 401 redirect | ⏳ À tester |
| 9 | User déjà PREMIUM | Élève | ? | ⏳ À tester |
| 10 | User déjà PRO | Élève | ? | ⏳ À tester |
| 11 | Paiement ClicToPay | Carte | Bloqué? | ⏳ À tester |

---

## 5. RÉSIDUS CLICTOPAY À NETTOYER

### 5.1 Routes à neutraliser ou supprimer:

```
/api/v1/payments/clictopay/init          → Désactiver ou retourner 503
/api/v1/payments/clictopay/callback      → Garder (idempotence) mais bloquer IPs
/api/v1/payments/clictopay/status        → Migrer vers /api/v1/billing/status
/api/v1/payments/clictopay/public-status → Évaluer utilité
```

### 5.2 Pages à corriger:

```
src/app/pricing/page.tsx                → Ligne 225, 280: Remplacer endpoint
src/app/paiement/confirmation/page.tsx   → Vérifier utilité post-manual
src/app/paiement/refus/page.tsx          → Vérifier utilité post-manual
```

### 5.3 Lib à refactorer:

```
src/lib/payments/clictopay.ts            → Isoler ou désactiver
src/lib/payments/availability.ts         → Message correct
```

---

## 6. VERDICT PHASE 2

| Critère | Évaluation | Justification |
|---------|------------|---------------|
| **Flow manuel complet** | ⚠️ Partiel | Code generation + redeem OK, mais ClicToPay parasite |
| **ClicToPay désactivé** | ❌ **NON** | Routes actives, potentiellement fonctionnelles |
| **UI cohérente** | 🟡 Partielle | Flouci mentionné, IDs techniques exposés |
| **Auditabilité** | 🔴 **NON** | Paiements manuels marqués CLICTOPAY en DB |
| **Sécurité** | 🟡 À vérifier | IP allowlist ClicToPay configurée? |

---

## 7. BLOQUANTS IDENTIFIÉS

### 🔴 B-001: ClicToPay toujours opérationnel
**Preuve:** Routes init et callback actives, peuvent traiter des paiements.
**Impact:** Paiement carte possible si credentials configurés.
**Action:** Désactiver routes ou vérifier credentials non configurés.

### 🔴 B-002: Provider manuel = 'CLICTOPAY'
**Preuve:** `src/app/api/v1/admin/manual-payment/route.ts:57`
**Impact:** Rapports de paiement trompeurs, audit impossible.
**Action:** Changer provider à 'MANUAL'.

### 🟡 B-003: Pricing dépend de ClicToPay
**Preuve:** `src/app/pricing/page.tsx:225,280` appelle `/api/v1/payments/clictopay/status`
**Impact:** Dépendance technique non nécessaire.
**Action:** Créer endpoint billing status indépendant.

---

## 8. RECOMMANDATIONS IMMÉDIATES

1. **Vérifier env production:** `CLICTOPAY_USERNAME` et `CLICTOPAY_PASSWORD` sont-ils configurés?
2. **Si oui:** Bloquer immédiatement ou neutraliser les routes.
3. **Si non:** Les routes échoueront mais polluent les logs.
4. **Corriger provider:** `'MANUAL'` au lieu de `'CLICTOPAY'`.
5. **Créer endpoint billing:** Indépendant de ClicToPay.

---

**Statut Phase 2:** ❌ **NO-GO** — ClicToPay encore actif, provider manuel incorrect.

> **Preuves:** Voir fichiers cités avec numéros de ligne.  
> **SHA audité:** b86d6fc57b5d1275492ec5607c77c1e032a95581
