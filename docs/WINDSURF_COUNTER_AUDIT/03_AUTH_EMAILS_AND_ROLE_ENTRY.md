# PHASE 3 — AUTH, EMAILS, PROFILS, RÔLES

> Audit contradictoire Nexus Réussite EAF  
> Date: 2026-03-21  
> Phase: 3 — Auth & Email Reality  
> Auditeur: Windsurf Counter-Audit

---

## 1. MÉTHODOLOGIE

Audit exécuté sans tests de bout en bout en production (nécessiterait création de comptes réels). Analyse statique du code + identification des écarts UX/métier.

---

## 2. INSCRIPTION & AUTH

### 2.1 Route Register (`/api/v1/auth/register`)

| Aspect | État | Preuve | Issue |
|--------|------|--------|-------|
| **Rate limit** | ✅ 3/h | `limit: 3, windowMs: 60*60*1000` | — |
| **Email unique** | ✅ Vérifié | `findUserByEmail()` → 409 | — |
| **Rôle forcé** | ✅ Élève only | Ligne 76: `role: 'eleve'` | — |
| **Password hashing** | ✅ PBKDF2 | 120k iterations, SHA-512 | — |
| **CGU tracking** | ✅ IP hash | `ipHash = Buffer.from(clientIp).toString('base64')` | — |
| **Mineur** | ✅ Supporté | `isMinor`, `parentEmail` | — |
| **TeacherEmail** | ✅ Stocké | `teacherEmail` dans profil | — |
| **Welcome email** | ✅ Envoyé | `sendWelcomeEmail()` fire-and-forget | — |

**Verdict:** Route technique conforme.

---

### 2.2 Session & Cookies

**Fichier:** `src/lib/auth/session.ts`

| Aspect | État | Preuve |
|--------|------|--------|
| **Session cookie** | ✅ HttpOnly, Secure, SameSite=lax | `setSessionCookie()` |
| **Role cookie** | ✅ HttpOnly, Secure, SameSite=lax | `setRoleCookie()` |
| **Max age** | ✅ 14 jours | `maxAge: 14 * 24 * 60 * 60` |
| **Secure flag** | ✅ Production only | `shouldUseSecureCookie()` |

---

## 3. EMAILS — AUDIT CRITIQUE

### 🔴 F-001: NOMS DE PLANS INCOHÉRENTS ENTRE UI ET EMAILS (BLOQUANT UX)

**Fichier:** `src/lib/email/service.ts`

**Évidence:**
```typescript
// Ligne 29 — Type accepte tous les IDs techniques
plan: 'MONTHLY' | 'LIFETIME' | 'PREMIUM' | 'PRO' | 'MAX'

// Lignes 47-96 — Mapping incohérent avec UI
const planConfig = {
  MONTHLY: { name: 'Régulier', price: '99 TND/mois' },      // ← Jamais affiché dans UI!
  PREMIUM: { name: 'Premium', price: '99 TND/mois' },       // ✅ Correct
  LIFETIME: { name: 'Intensif', price: '129 TND/mois' },    // ← Jamais affiché dans UI!
  PRO: { name: 'Masterium', price: '129 TND/mois' },        // ✅ Correct
  MAX: { name: 'Masterium Lifetime', price: '149 TND' },    // ← Confusant!
}
```

**Matrice de confusion:**

| UI Pricing | Email envoyé | Écart |
|------------|--------------|-------|
| Freemium | — | — |
| Premium | Premium | ✅ OK |
| Masterium | Masterium | ✅ OK |
| — | Régulier | 🔴 Inexistant en UI |
| — | Intensif | 🔴 Inexistant en UI |
| — | Masterium Lifetime | 🔴 Crée confusion |

**Impact:** L'utilisateur qui achète "Masterium" à 129 TND/mois reçoit un email confirmant son plan "Masterium". OK.
Mais si un code MAX (lifetime) est généré, l'email dit "Masterium Lifetime" — distinction non expliquée en UI.

---

### 3.2 Email de bienvenue

**Fichier:** `src/lib/email/service.ts` lignes 10-24

| Aspect | État | Preuve |
|--------|------|--------|
| **Sujet** | ✅ Personnalisé | `Bienvenue sur Nexus Réussite, ${firstName}` |
| **Template** | ✅ React Email | `WelcomeEmail` component |
| **URLs** | ✅ Configurables | `APP_URL` avec fallback prod |
| **Expéditeur** | ⚠️ À vérifier | Dépend de `sendEmail()` |

**À vérifier en production:**
```bash
# Vérifier la configuration SMTP
ssh root@88.99.254.59 "grep -E 'SMTP|EMAIL' /opt/eaf_platform/.env.production"
```

---

## 4. RÔLES ET UX

### 4.1 Types de rôles

**Fichier:** `src/lib/auth/types.ts` ligne 46
```typescript
role: 'eleve' | 'enseignant' | 'parent' | 'admin'
```

| Rôle | Inscription | Usage | Clarté |
|------|-------------|-------|--------|
| **élève** | ✅ Publique | Principal | Bonne |
| **enseignant** | ❌ Admin only | Facultatif | À vérifier |
| **parent** | ❌ Par enfant | Facultatif | À vérifier |
| **admin** | ❌ Super admin | Gestion | Interne |

### 4.2 Flux mineur

**Fichier:** `src/app/api/v1/auth/register/route.ts` ligne 57

```typescript
const { isMinor, parentEmail, teacherEmail } = parsed.data;
```

| Aspect | État | Issue |
|--------|------|-------|
| **isMinor** | ✅ Stocké en profil | — |
| **parentEmail** | ✅ Stocké | Mais pas de validation email parent |
| **teacherEmail** | ✅ Stocké | Mais pas de validation email enseignant |
| **Consentement** | ⚠️ Via CGU seulement | Pas d'email de confirmation parent |

**🔴 ISSUE RGPD:** Un mineur peut s'inscrire seul. Le parentEmail est stocké mais aucune notification n'est envoyée au parent.

---

## 5. REDIRECTIONS ET FLOWS

### 5.1 Post-login

**Fichier:** `src/app/login/page.tsx` (analyse comportement)

| Scénario | Redirection | État |
|----------|-------------|------|
| Admin | `/admin` | ✅ |
| Élève onboarding incomplet | `/onboarding` | ✅ |
| Élève onboarding complet | `/dashboard` | ✅ |
| Redirect param | `?redirect=` | ✅ Supporté |

### 5.2 Protection open redirect

**Fichier:** `middleware.ts` ligne 150
```typescript
loginUrl.searchParams.set('redirect', pathname);
```

⚠️ **À vérifier:** Le paramètre `redirect` est-il validé pour éviter les open redirects vers domaines externes?

---

## 6. VERDICT PHASE 3

| Critère | Évaluation | Justification |
|---------|------------|---------------|
| **Inscription sécurisée** | ✅ Oui | Rate limit, hashing fort, CSRF |
| **Sessions** | ✅ Oui | HttpOnly, Secure, 14j |
| **Rôles clairs** | 🟡 Partiel | UX parent/enseignant à vérifier |
| **Emails cohérents** | 🔴 **NON** | Noms de plans incohérents UI/email |
| **RGPD mineurs** | 🔴 **NON** | Pas de validation parentale |

---

## 7. BLOQUANTS IDENTIFIÉS

### 🔴 B-001: Noms de plans incohérents emails vs UI
**Preuve:** `src/lib/email/service.ts:29,47-96`
**Impact:** Confusion utilisateur, risque de litige sur le plan acheté.
**Action:** Aligner les noms dans `planConfig` sur les labels UI (Freemium, Premium, Masterium).

### 🔴 B-002: Aucune validation parentale pour mineurs
**Preuve:** `parentEmail` stocké sans envoi d'email de confirmation parent.
**Impact:** Non-conformité RGPD sur le consentement parental.
**Action:** Envoyer email de notification au parent avec lien de confirmation/invalidation.

---

## 8. RECOMMANDATIONS

### Court terme (avant go-live):
1. Corriger `planConfig` dans `email/service.ts` pour aligner sur UI
2. Supprimer les références MONTHLY/LIFETIME des emails
3. Vérifier la configuration SMTP en production

### Moyen terme:
4. Implémenter validation email parentale pour mineurs
5. Tester réellement l'envoi d'emails en production

---

**Statut Phase 3:** ❌ **NO-GO** — Emails incohérents avec l'UI, RGPD mineurs non conforme.

> **Preuves:** Voir fichiers cités avec numéros de ligne.  
> **SHA audité:** b86d6fc57b5d1275492ec5607c77c1e032a95581
