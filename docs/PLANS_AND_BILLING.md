# Plans et facturation

## Les 3 plans

| Critere | Freemium | Premium | Masterium |
|---------|----------|---------|-----------|
| **ID technique** | `FREE` | `PREMIUM` | `PRO` |
| **Prix** | 0 TND | 99 TND/mois | 129 TND/mois |
| **Cycle** | gratuit | mensuel | mensuel |

Les identifiants techniques (`FREE`, `PREMIUM`, `PRO`) sont utilises dans le code et la base de donnees. Les noms affiches aux utilisateurs sont Freemium, Premium et Masterium.

Un plan `MAX` existe dans le code mais est masque et non disponible au lancement.

## Quotas par plan

| Quota | Freemium | Premium | Masterium |
|-------|----------|---------|-----------|
| Sessions orales | 1/mois | 10/semaine | illimite |
| Corrections ecrites | 2/mois | 20/mois | illimite |
| Questions tuteur | 3/jour | 100/jour | illimite |
| OCR copies | 0 | 20/mois | 50/mois |
| Tokens LLM | 5 000/jour | 50 000/jour | 200 000/jour |
| Recherches RAG | 50/jour | 500/jour | illimite |
| Quiz par jour | 1/jour | 30/jour | illimite |

## Feature flags par plan

| Feature | Freemium | Premium | Masterium |
|---------|----------|---------|-----------|
| Rapport PDF oral | non | oui | oui |
| Historique rapports oral | non | non | oui |
| Repetition espacee | basic | advanced | ai |
| Tableau de bord parent | non | oui | oui |
| Support | FAQ | email | prioritaire |
| Parcours adaptatif | non | oui | oui |
| Avocat du diable | non | oui | oui |
| Graph RAG | non | non | oui |
| Bibliotheque complete | non | oui | oui |

## Flux de paiement

Au lancement, le paiement est manuel :

1. L'eleve contacte l'equipe et effectue un virement bancaire ou un paiement en especes.
2. L'administrateur se connecte a la page `/admin`.
3. L'administrateur genere un code d'activation en selectionnant le plan et la duree.
4. Le code est affiche une seule fois en clair (format : `EAF-XXXXXXXXXXXX`).
5. L'administrateur communique le code a l'eleve.
6. L'eleve saisit le code sur la plateforme pour activer son plan.

Un flux ClicToPay (paiement en ligne) est pre-cable dans le code (`src/app/api/v1/payments/clictopay/`) mais n'est pas actif au lancement.

## Details techniques

### Source de verite

Le fichier `src/lib/billing/plan-catalog.ts` definit les plans, quotas et flags. Toute modification de plan doit se faire dans ce fichier.

### Codes d'activation

- Generation : `src/scripts/generate-activation-codes.ts` (CLI) ou `/admin` (UI)
- Format : `EAF` suivi de 12 caracteres hexadecimaux
- Stockage : le code est hache (SHA-256 avec pepper `BILLING_CODE_PEPPER`) avant insertion en base
- Le code en clair n'est jamais stocke ; il est affiche une seule fois a la generation
- Redemption : `src/lib/billing/redeem.ts`

### Suivi de consommation

Le fichier `src/lib/billing/usage.ts` verifie les quotas a chaque appel API facture. Quand un quota est atteint, l'API retourne une erreur 429 avec le detail du quota depasse.

### Administration

La page `/admin` permet de :
- Generer des codes d'activation (choix du plan et de la duree)
- Voir les codes generes et leur statut (utilise/non utilise)
- Gerer les paiements manuels
