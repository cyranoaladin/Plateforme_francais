# Plans et Quotas - Nexus Réussite EAF

Document officiel des plans d'abonnement et de leurs quotas.

## Plans disponibles

| Plan | Prix | Facturation |
|------|------|-------------|
| **Freemium** (FREE) | Gratuit | - |
| **Premium** | 99 TND/mois | Mensuelle |
| **Masterium** (PRO) | 129 TND/mois | Mensuelle |

## Quotas détaillés

### Freemium

| Feature | Quota | Période |
|---------|-------|---------|
| Sessions orales | 1 | mois |
| Corrections écrites | 2 | mois |
| Questions tuteur IA | 3 | jour |
| Copies OCR | 0 | mois |
| Tokens LLM | 8 000 | jour |
| Recherches RAG | 50 | jour |
| Quiz par jour | 3 | jour |
| Sessions orales/heure | 6 | - |

**Fonctionnalités:**
- ❌ Rapport PDF oral
- ❌ Historique rapports oraux
- ✅ Répétition espacée (basique)
- ❌ Dashboard parent
- ✅ Support FAQ uniquement
- ❌ Parcours adaptatif
- ❌ Avocat du diable
- ❌ Graph RAG
- ❌ Bibliothèque complète

### Premium

| Feature | Quota | Période |
|---------|-------|---------|
| Sessions orales | 10 | semaine |
| Corrections écrites | 20 | mois |
| Questions tuteur IA | 100 | jour |
| Copies OCR | 20 | mois |
| Tokens LLM | 50 000 | jour |
| Recherches RAG | 500 | jour |
| Quiz par jour | 30 | jour |
| Sessions orales/heure | 20 | - |

**Fonctionnalités:**
- ✅ Rapport PDF oral
- ✅ Historique rapports oraux
- ✅ Répétition espacée (avancée)
- ✅ Dashboard parent
- ✅ Support email
- ✅ Parcours adaptatif
- ✅ Avocat du diable
- ❌ Graph RAG
- ✅ Bibliothèque complète

### Masterium

| Feature | Quota | Période |
|---------|-------|---------|
| Sessions orales | Illimité | semaine |
| Corrections écrites | Illimité | mois |
| Questions tuteur IA | Illimité | jour |
| Copies OCR | 50 | mois |
| Tokens LLM | 200 000 | jour |
| Recherches RAG | Illimité | jour |
| Quiz par jour | Illimité | jour |
| Sessions orales/heure | 60 | - |

**Fonctionnalités:**
- ✅ Rapport PDF oral
- ✅ Historique rapports oraux
- ✅ Répétition espacée (IA)
- ✅ Dashboard parent
- ✅ Support prioritaire
- ✅ Parcours adaptatif
- ✅ Avocat du diable
- ✅ Graph RAG
- ✅ Bibliothèque complète

## Codes d'activation

Les admins peuvent générer des codes d'activation pour:
- Premium (1 mois, 3 mois, 12 mois)
- Masterium (1 mois, 3 mois, 12 mois)

## Paiement manuel (Tunisie)

Pour les utilisateurs sans accès à Stripe, les paiements manuels sont traités par l'admin via:
- Confirmation de commande
- Enregistrement de paiement manuel
- Activation immédiate de l'abonnement

## Gestion des quotas en temps réel

Les quotas sont vérifiés avant chaque action:
- `GET /api/v1/billing/check-quota` - Vérifier les quotas restants
- `GET /api/v1/billing/usage` - Consulter la consommation actuelle

## Dépassement de quota

En cas de dépassement:
- Message explicite à l'utilisateur
- Suggestion de passage au plan supérieur
- Possibilité d'acheter des crédits additionnels (à venir)

## Mises à jour

Dernière mise à jour: 10 avril 2026
