# PHASE 1 — AUDIT DU REPO ET DES CLAIMS

> Audit contradictoire Nexus Réussite EAF  
> Date: 2026-03-21  
> Phase: 1 — Repo & Claims  
> Auditeur: Windsurf Counter-Audit (hostile au faux positif)

---

## 1. MÉTHODOLOGIE

Audit exécuté sans faire confiance aux conclusions précédentes. Chaque fichier relu depuis le code source. Aucune supposition non vérifiée.

Fichiers audités:
- README.md
- package.json  
- middleware.ts
- next.config.ts
- src/lib/billing/plan-catalog.ts
- src/app/pricing/page.tsx
- src/app/admin/page.tsx
- prisma/schema.prisma (sections billing/subscription)

---

## 2. FINDINGS CRITIQUES

### 🔴 F-001: IDs TECHNIQUES EXPOSÉS DANS L'ADMIN (BLOQUANT COMMERCIAL)

**Localisation:** `src/app/admin/page.tsx`

**Évidence:**
```typescript
// Ligne 90 — Type exposé dans le state
type newCodePlan = 'PREMIUM' | 'PRO'  // ← PRO est un ID technique

// Ligne 228-233 — Mapping couleurs avec IDs techniques
const planColors: Record<string, string> = {
  FREE: 'bg-gray-100 text-gray-800',      // ← FREE affiché
  PREMIUM: 'bg-blue-100 text-blue-800',   // ← PREMIUM affiché  
  PRO: 'bg-purple-100 text-purple-800',   // ← PRO affiché (devrait être Masterium)
  MAX: 'bg-purple-100 text-purple-800', // ← MAX legacy affiché
};

// Ligne 367 — Affichage brut dans le tableau admin
{stats.subscriptionsByPlan.map((item) => (
  <span key={item.plan} className="font-medium">{item.plan}</span>  // ← FREE/PREMIUM/PRO affiché
  <Badge className={planColors[item.plan]}>{item.count} utilisateurs</Badge>
))}

// Ligne 476-477 — Dropdown génération code
<option value="PREMIUM">Premium (99 TND/mois)</option>
<option value="PRO">Masterium (129 TND/mois)</option>  // ← Value = PRO, label = Masterium
```

**Impact:** L'administrateur voit des IDs techniques (FREE, PREMIUM, PRO, MAX) au lieu des noms commerciaux (Freemium, Premium, Masterium). C'est confusant et non professionnel.

**Contradiction avec README:** Le README promet "Premium / Masterium" mais l'admin affiche "PREMIUM / PRO".

---

### 🔴 F-002: COEXISTENCE PRO+MAX INTERNE — RISQUE DE CONFUSION (BLOQUANT LOGIQUE)

**Localisation:** `src/lib/billing/plan-catalog.ts`

**Évidence:**
```typescript
// Lignes 99-124 — Plan PRO = Masterium 129 TND
PRO: {
  id: 'PRO',
  label: 'Masterium',
  priceTnd: 129,
  billingCycle: 'monthly',
}

// Lignes 128-160 — Plan MAX = Masterium 149 TND (caché via defineProperty)
const _maxPlan: PlanConfig = {
  id: 'MAX',
  label: 'Masterium',  // ← Même label que PRO !
  priceTnd: 149,       // ← Prix différent !
  billingCycle: 'lifetime',
}

// Ligne 155-160 — Caché volontairement
Object.defineProperty(PLAN_CATALOG, 'MAX', {
  value: _maxPlan,
  enumerable: false,  // ← Caché de Object.keys()
  configurable: true,
  writable: true,
});
```

**Impact:**
- Deux plans "Masterium" existent avec des prix différents (129 vs 149)
- Le MAX est caché mais accessible via `PLAN_CATALOG.MAX`
- Risque de générer des codes pour le mauvais plan
- Aucune distinction claire entre Masterium mensuel (PRO) et Masterium lifetime (MAX)

**Contradiction:** Le README ne mentionne qu'un seul Masterium à 129 TND.

---

### 🔴 F-003: ENDPOINTS CLICTOPAY TOUJOURS ACTIFS (RÉSIDU DE PAIEMENT)

**Localisation:** `middleware.ts` + `src/app/pricing/page.tsx`

**Évidence:**
```typescript
// middleware.ts lignes 39-40
const PUBLIC_API_PATHS = new Set([
  // ...
  '/api/v1/payments/clictopay/callback',      // ← Toujours public
  '/api/v1/payments/clictopay/public-status',   // ← Toujours public
]);

// pricing/page.tsx lignes 225, 280
const payload = await apiFetch<BillingStatusPayload>('/api/v1/payments/clictopay/status', {
  redirectOnUnauthorized: false,
});
// ...
const updated = await apiFetch<BillingStatusPayload>('/api/v1/payments/clictopay/status');
```

**Impact:**
- La page pricing appelle encore les endpoints ClicToPay
- Les routes sont encore publiques
- ClicToPay est censé être désactivé au profit du paiement manuel
- Potentiel de confusion: l'appel peut échouer silencieusement ou retourner des données obsolètes

---

### 🟡 F-004: CHECKOUT PLAN PRO EXPOSÉ DANS PRICING (ID TECHNIQUE)

**Localisation:** `src/app/pricing/page.tsx`

**Évidence:**
```typescript
// Ligne 134 — checkoutPlan = 'PRO' pour Masterium
{
  id: 'PRO',           // ← ID technique
  title: 'Masterium',  // ← Label user
  checkoutPlan: 'PRO', // ← ID technique exposé dans le code client
}
```

**Impact:** Même si l'utilisateur final ne voit que "Masterium", le code client expose l'ID technique 'PRO' dans la logique checkout.

---

### 🟡 F-005: STATUTS BRUTS EXPOSÉS DANS L'UI

**Localisation:** `src/app/pricing/page.tsx` + `src/app/admin/page.tsx`

**Évidence:**
```typescript
// pricing/page.tsx ligne 409 — Mapping conditionnel
<p className="mt-1 font-semibold text-white">
  {{ ACTIVE: 'Actif', CANCELLED: 'Annulé', PAST_DUE: 'Échéance dépassée', TRIALING: 'Essai' }
    [billing?.subscription.status ?? 'ACTIVE'] ?? billing?.subscription.status}
</p>

// admin/page.tsx lignes 367, 394, 437, 446 — Affichage direct
<span className="font-medium">{item.plan}</span>
<Badge className={planColors[payment.plan]}>{payment.plan}</Badge>
<Badge className={planColors[user.subscription.plan]}>{user.subscription.plan}</Badge>
```

**Impact:** Dans l'admin, les statuts (ACTIVE, PENDING, ACCEPTED) et plans (FREE, PREMIUM, PRO) sont affichés bruts sans traduction.

---

### 🟡 F-006: FLOUCI MENTIONNÉ MAIS NON ACTIF (CLAIMS NON VÉRIFIÉS)

**Localisation:** `src/app/pricing/page.tsx`

**Évidence:**
```typescript
// Ligne 163 — FAQ
{
  q: 'Comment fonctionne le paiement ?',
  a: '...Le paiement carte et Flouci seront réactivés dès que leur implémentation sera finalisée.'
}

// Ligne 364 — Tags
['Aucun paiement avant essai', 'Virement bancaire actif', 'WhatsApp actif', 
 'Carte bientôt disponible', 'Flouci bientôt disponible']

// Ligne 658 — Section Flouci
<p>Flouci est prévu mais pas encore actif en production.</p>
<button>Flouci bientôt disponible</button>
```

**Impact:** Mentionner Flouci comme "bientôt disponible" crée une attente non fondée. Le paiement manuel est le seul mode actif.

---

### 🟢 F-007: README ALIGNÉ SUR LE GO-LIVE MANUEL

**Constat:** Le README mentionne correctement:
> "Paiement au lancement : virement bancaire ou espèces → l'admin génère un code d'activation → l'élève le saisit sur la plateforme."

**Évidence:**
```markdown
| Plan | Prix |
|------|------|
| **Freemium** | 0 TND |
| **Premium** | 99 TND/mois |
| **Masterium** | 129 TND/mois |
```

Ce point est conforme à la stratégie go-live.

---

## 3. MATRICE DE CONTRADICTION

| Source | Claim | Réalité | Écart |
|--------|-------|---------|-------|
| README | 3 plans: Freemium/Premium/Masterium | 4 IDs: FREE/PREMIUM/PRO/MAX | 🔴 ID MAX caché |
| Admin | Labels commerciaux | IDs techniques exposés | 🔴 FREE/PREMIUM/PRO visibles |
| Pricing | Paiement manuel only | Appels ClicToPay actifs | 🔴 Résidu technique |
| Plan Catalog | Masterium 129 TND | Masterium 129 ET 149 TND | 🔴 Double définition |
| Middleware | CSP clean | Routes ClicToPay publiques | 🟡 Résidu sécurité |

---

## 4. ÉVALUATION PAR FICHIER

| Fichier | État | Issues |
|---------|------|--------|
| README.md | ✅ Propre | Aligné sur go-live manuel |
| plan-catalog.ts | 🔴 Critique | Coexistence PRO/MAX confuse |
| pricing/page.tsx | 🟡 Fragile | ClicToPay calls + PRO exposed |
| admin/page.tsx | 🔴 Critique | IDs techniques partout |
| middleware.ts | 🟡 Fragile | Routes ClicToPay publiques |
| next.config.ts | ✅ Propre | Headers corrects |

---

## 5. VERDICT PHASE 1

**CONCLUSION:** Le repo contient des **écarts significatifs** entre les claims marketing (3 plans simples) et la réalité technique (4 IDs avec confusion PRO/MAX).

**Bloquants identifiés:**
1. IDs techniques exposés dans l'admin (PRO, FREE, PREMIUM visibles)
2. Double définition Masterium (PRO 129 vs MAX 149)
3. Endpoints ClicToPay toujours actifs malgré le go-live manuel

**Recommandation:**
- Corriger l'affichage admin pour masquer les IDs techniques
- Clarifier la distinction PRO/MAX ou supprimer MAX
- Nettoyer les appels ClicToPay restants
- Uniformiser les labels entre tous les écrans

**Statut:** ❌ **NO-GO** pour exploitation commerciale sans correction des IDs techniques exposés.

---

> **Preuves:** Voir fichiers sources cités avec numéros de ligne.  
> **SHA audité:** b86d6fc57b5d1275492ec5607c77c1e032a95581
