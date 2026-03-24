# Plans et facturation

## Les 3 plans

| Critère | Freemium | Premium | Masterium |
|---------|----------|---------|-----------|
| **ID technique interne** | `FREE` | `PREMIUM` | `PRO` |
| **Prix** | 0 TND | 99 TND/mois | 129 TND/mois |
| **Cycle** | gratuit | mensuel | mensuel |

Les identifiants techniques (`FREE`, `PREMIUM`, `PRO`) restent internes au code et à la base de données. Les payloads visibles côté produit et côté APIs exposées doivent utiliser uniquement `FREEMIUM`, `PREMIUM` et `MASTERIUM`, avec les libellés commerciaux Freemium, Premium et Masterium.

Des reliquats legacy comme `MAX` ont existé côté code, mais ils ne doivent plus être exposés ni utilisables dans le produit live.

## Quotas par plan

| Quota | Freemium | Premium | Masterium |
|-------|----------|---------|-----------|
| Sessions orales | 1/mois | 10/semaine | illimité |
| Corrections écrites | 2/mois | 20/mois | illimité |
| Questions tuteur | 3/jour | 100/jour | illimité |
| OCR copies | 2/mois | 20/mois | 50/mois |
| Tokens LLM | 8 000/jour | 50 000/jour | 200 000/jour |
| Recherches RAG | 50/jour | 500/jour | illimité |
| Quiz par jour | 3/jour | 30/jour | illimité |

## Feature flags par plan

| Feature | Freemium | Premium | Masterium |
|---------|----------|---------|-----------|
| Rapport PDF oral | non | oui | oui |
| Historique rapports oral | non | non | oui |
| Répétition espacée | basic | advanced | ai |
| Tableau de bord parent | non | oui | oui |
| Support | FAQ | email | prioritaire |
| Parcours adaptatif | non | oui | oui |
| Avocat du diable | non | oui | oui |
| Graph RAG | non | non | oui |
| Bibliothèque complète | non | oui | oui |

## Flux de paiement

Au lancement, le paiement est manuel :

1. L'élève contacte l'équipe et effectue un virement bancaire ou un paiement en espèces.
2. L'administrateur se connecte à la page `/admin`.
3. L'administrateur génère un code d'activation en sélectionnant le plan et la durée.
4. Le code est affiché une seule fois en clair (format : `EAF-XXXXXXXXXXXX`).
5. L'administrateur communique le code à l'élève.
6. L'élève saisit le code sur la plateforme pour activer son plan.

Aucun checkout carte n’est actif au lancement. Les anciens reliquats de paiement en ligne ne font pas partie du produit live et ne doivent pas être présentés comme une option disponible.

## Détails techniques

### Source de vérité

Le fichier `src/lib/billing/plan-catalog.ts` définit les plans, quotas et drapeaux de fonctionnalités. Toute modification de plan doit se faire dans ce fichier.

### Codes d'activation

- Génération : `src/scripts/generate-activation-codes.ts` (CLI) ou `/admin` (UI)
- Format : `EAF` suivi de 12 caractères hexadécimaux
- Stockage : le code est haché (SHA-256 avec pepper `BILLING_CODE_PEPPER`) avant insertion en base
- Le code en clair n'est jamais stocké ; il est affiché une seule fois à la génération
- Redemption : `src/lib/billing/redeem.ts`

### Suivi de consommation

Le fichier `src/lib/billing/usage.ts` vérifie les quotas à chaque appel API facturé. Quand un quota est atteint, l'API retourne une erreur 429 avec le détail du quota dépassé.

### Administration

La page `/admin` permet de :
- Générer des codes d'activation (choix du plan et de la durée)
- Voir les codes générés et leur statut (utilisé/non utilisé)
- Gérer les paiements manuels
