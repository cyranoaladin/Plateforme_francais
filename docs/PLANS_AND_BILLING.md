# Plans et facturation — Nexus Réussite EAF

## Plans disponibles

| Plan | Label visible | ID technique | Prix |
|------|--------------|-------------|------|
| Freemium | Freemium | FREE | 0 TND |
| Premium | Premium | PREMIUM | 99 TND/mois |
| Masterium | Masterium | PRO | 129 TND/mois |

> Les IDs techniques (FREE, PREMIUM, PRO) ne sont jamais visibles côté utilisateur.

## Quotas par plan

| Fonctionnalité | Freemium | Premium | Masterium |
|----------------|----------|---------|-----------|
| Sessions orales | 1/mois | 10/semaine | Illimité |
| Corrections écrites | 2/mois | 20/mois | Illimité |
| Échanges tuteur | 3/jour | 100/jour | Illimité |
| OCR copies | Bloqué | 20/mois | 50/mois |
| Quiz | 1/jour | 30/jour | Illimité |
| Bibliothèque | Échantillon | Complète | Complète |
| Rapport PDF oral | Non | Oui | Oui |
| Recherche avancée corpus | Non | Non | Oui |
| Support prioritaire | Non | Non | Oui |

## Flux de paiement (go live)

Le paiement actif au lancement est **manuel** :

1. L'utilisateur contacte Nexus Réussite via **WhatsApp (+216 99 19 28 29)** ou par email
2. Il effectue un **virement bancaire** ou paie en **espèces**
3. L'**admin** valide le paiement et génère un **code d'activation** depuis `/admin`
4. L'admin communique le code à l'utilisateur
5. L'utilisateur saisit le code sur la page `/pricing` (section "Activation")
6. Le plan s'active automatiquement avec la durée configurée

### Génération de codes (admin)

L'admin accède à `/admin` > onglet "Codes d'activation" :
- Sélectionne le plan : Premium ou Masterium
- Définit la durée (30, 90, 365 jours)
- Le code est généré au format `EAF-XXXX...` (affiché une seule fois)
- Le code est hashé en base de données (non récupérable après affichage)

### Activation de code (utilisateur)

- Page `/pricing` → section "Activation avec un code"
- L'utilisateur saisit le code reçu
- Le plan s'active immédiatement
- Message de confirmation avec la date de fin

### Cas d'erreur gérés

| Cas | Message |
|-----|---------|
| Code invalide | "Code introuvable. Vérifie la saisie." |
| Code déjà utilisé | "Ce code a déjà été utilisé." |
| Code expiré | "Ce code a expiré." |

## Configuration technique

Le système de plans est défini dans :
- `src/lib/billing/plan-catalog.ts` — définition des plans, quotas et labels
- `src/lib/billing/usage.ts` — vérification et consommation des quotas
- `src/lib/billing/quotas.ts` — messages paywall
- `src/lib/billing/library-gating.ts` — gating bibliothèque freemium
- `src/lib/billing/redeem.ts` — logique de redemption des codes

## Méthodes de paiement futures

ClicToPay (carte bancaire tunisienne) et Flouci sont prévus mais **non actifs** au lancement. Les CTA payants redirigent vers WhatsApp.
