# PHASE 7 — BILLING, CODES D'ACTIVATION, PAIEMENT MANUEL

## Défauts corrigés

| ID | Commit | Défaut | Preuve de retest prod |
| --- | --- | --- | --- |
| `A07-01` | `c046c8e` | l'admin pouvait encore créer un plan legacy `MAX`, ensuite redeemable | création `MAX` bloquée en `400`; redeem du code de repro `EAF91131E96B4D6` bloqué en `400`; code révoqué |
| `A07-02` | `94252de` | labels et IDs de plan incohérents entre public, admin et billing | l'UI et les réponses billing exposent uniquement `Freemium`, `Premium`, `Masterium` |
| `A08-02` | `84a4980` | l'onglet admin `Paiements manuels` chargeait sans liste utilisateurs au premier affichage | retest navigateur: `optionCount=37` au lieu du seul placeholder |
| `A08-03` | `e79359e` | les utilisateurs sans abonnement apparaissaient en `subscription=null` au lieu de Freemium côté admin | retest navigateur: compteurs `Freemium/Premium/Masterium` cohérents et utilisateurs Free visibles comme `Freemium Actif` |

## Vérifications métiers

| Contrôle | Résultat |
| --- | --- |
| Plans visibles | uniquement `Freemium`, `Premium`, `Masterium` |
| Workflow go live | paiement manuel `virement/espèces -> code admin -> redeem utilisateur` |
| Code invalide | rejet clair, pas de `500` |
| Legacy `MAX/PRO` | neutralisés côté création, redeem et affichage |

## Conclusion

Le billing visible est désormais strictement aligné avec le modèle go live réel: pas de faux checkout carte, pas de plan legacy exposé, et un back-office admin exploitable pour les activations manuelles.
