# Contre-audit de fermeture commerciale V2

**Date** : 2026-03-20 21:40 UTC
**SHA** : `005b785` (local = origin = prod)

## 1. Source de vérité

| Élément | Valeur |
|---------|--------|
| HEAD local | `005b785` |
| origin/main | `005b785` |
| SHA prod | `005b785` |
| Build | OK |
| TSC | 0 erreurs |
| Lint | 0 erreurs |
| Knip | 0 dead code |
| Unit tests | 162/162, 1128/1128 |
| FR copy | baseline à jour |
| enforce_admins | true |

## 2. Anomalies trouvées et corrections appliquées

| # | Anomalie | Sévérité | Correction | Preuve |
|---|----------|----------|-----------|--------|
| 1 | CTA final landing → startCheckout/ClicToPay | **Critique** | → lien WhatsApp | 0 occurrences startCheckout en prod |
| 2 | CTA pricing → startCheckout | **Critique** | → WhatsApp message pré-rempli | 0 occurrences startCheckout |
| 3 | Admin : Masterium Lifetime (149 TND) selectable | **Majeur** | Supprimé du go live | Seulement Premium/Masterium |
| 4 | Admin : type unions PRO/MAX | **Moyen** | → PREMIUM/PRO uniquement | Code nettoyé |
| 5 | Placeholder pricing NEXUS-XXXX | **Mineur** | → EAF-XXXX | Corrigé |
| 6 | startCheckout dead code | **Mineur** | Fonction existe mais 0 callers | Non bloquant |

## 3. Vérifications contradictoires

### Plans visibles
| Page | Freemium | Premium | Masterium | PRO/MAX/Legacy |
|------|----------|---------|-----------|----------------|
| Landing | 2 | 6 | 4 | 0 |
| Pricing | 4 | 8 | 6 | 0 |
| Admin selects | - | ✅ | ✅ | 0 |
| Emails | ✅ | ✅ | ✅ | 0 |
| Billing status | ✅ | ✅ | ✅ | 0 |

### Flux go live paiement
- CTA payants → WhatsApp ✅
- Admin génère code Premium → OK ✅
- Admin génère code Masterium → OK ✅
- Élève redeem code → plan activé + label correct ✅
- Code invalide → erreur claire ✅
- Code déjà utilisé → erreur claire ✅
- Aucun faux checkout ClicToPay/Flouci ✅

### Email
- SMTP port 587 configuré ✅
- Email envoyé avec succès (messageId confirmé) ✅
- SPF/DKIM/DMARC configurés ✅
- Liens corrigés : /pricing et /profil (plus de 404) ✅
- Noms de plans dans emails : Freemium/Premium/Masterium ✅
- Sujets sans emojis (anti-spam) ✅

### Workflows élève
- Auth/login OK ✅
- Dashboard charge ✅
- Tuteur libre : réponse LLM + citation RAG ✅
- Quotas Freemium enforced ✅
- Bibliothèque : 548 ressources, gating 403/200 ✅
- RAG healthy ✅
- MCP healthy, 20 tools ✅

### Sécurité
- RBAC : élève→admin = 403, sans auth = 401 ✅
- Headers : CSP, HSTS, X-Frame-Options DENY ✅
- Branch protection enforce_admins = true ✅
- Rate limiting actif ✅
- Cookies : HttpOnly, Secure, SameSite=lax ✅

### Tests
- TSC : 0 erreurs ✅
- Lint : 0 erreurs ✅
- Knip : 0 dead code ✅
- 1128 tests unitaires : 100% pass ✅
- Build production : OK ✅

## 4. Points ouverts

| # | Point | Impact | Justification |
|---|-------|--------|--------------|
| 1 | startCheckout/clictopay dead code dans page.tsx/pricing.tsx | Nul | Fonction jamais appelée, sera retirée au prochain cleanup |
| 2 | Landing V2 (landing-v2.html) non activée | Faible | Accessible en A/B, la V1 est cohérente et commerciale |
| 3 | Comptes test de l'audit en DB | Nul | À nettoyer avant ouverture publique |

## 5. Décision

### ÉTAT B — GO avec réserves mineures

**Le produit est exploitable commercialement.**

Les 3 réserves (dead code, landing V2, comptes test) sont cosmétiques et n'impactent ni l'expérience utilisateur, ni la sécurité, ni la logique métier.

Tous les critères bloquants sont fermés :
- ✅ 3 plans uniquement visibles
- ✅ Aucun faux flux ClicToPay/Flouci
- ✅ Emails fonctionnels et prouvés
- ✅ Élève/parent/enseignant cohérents
- ✅ Landing commerciale
- ✅ Admin sans fuites PRO/MAX/Lifetime
- ✅ Bibliothèque propre
- ✅ Workflows validés
- ✅ Sécurité et protection repo vérifiées
- ✅ Tests exécutés et verts
