# Assainissement Linguistique Global — Design

## Objectif

Supprimer du projet Nexus Réussite EAF tout défaut linguistique susceptible de nuire à la crédibilité commerciale, pédagogique ou éditoriale du produit: orthographe française dégradée, accents manquants, apostrophes incorrectes, formulations bancales, anglicismes visibles inutiles et incohérences de vocabulaire produit.

## Portée

La passe couvre l'ensemble du dépôt, avec une priorité stricte donnée au texte visible par les utilisateurs et aux messages réellement exposés en production.

### Couche A — Texte visible frontend

- Landing, pricing, login, pages légales, contact
- Dashboard élève et shells de navigation
- Parcours, profil, ateliers, bibliothèque, quiz, tuteur
- Dashboards parent, enseignant, admin

### Couche B — Communications utilisateur

- Emails transactionnels
- Libellés et messages d'accompagnement métier

### Couche C — Messages backend exposés

- Réponses JSON utilisateur
- Erreurs, validations, quotas, sécurité, auth, billing

### Couche D — Contenus pédagogiques et prompts

- Prompts LLM et générateurs
- Contenus pédagogiques auxiliaires susceptibles de ressortir côté utilisateur

### Couche E — Documentation et reste du repo

- README
- docs d'audit et de pilotage
- commentaires ou contenus internes non exécutés

## Règles de sécurité

- Ne jamais modifier les identifiants techniques, enums, routes, slugs, noms de clés JSON, contrats d'API ou valeurs métier servant de protocole.
- Corriger le français visible, pas la mécanique interne, sauf si un élément technique fuit côté utilisateur.
- Ne pas casser les tests, snapshots, garde-fous de copy ou contrats backend.

## Charte linguistique cible

- Français correct, naturel, sobre, premium et pédagogique
- Accents complets
- Apostrophes typographiques `’` dans le copy visible lorsque le contexte le permet
- Terminologie cohérente: `Écrit`, `Oral`, `Tableau de bord`, `Bibliothèque`, `Connexion`, `Freemium`, `Premium`, `Masterium`
- Aucun français ASCII dégradé dans les surfaces visibles
- Aucun anglicisme visible non justifié

## Méthode d'audit

1. Recherche large des chaînes suspectes dans le repo.
2. Qualification de chaque occurrence:
   - visible user-facing
   - exposé indirectement
   - interne non visible
   - technique à ne pas toucher
3. Correction par couches, du plus critique au moins critique.
4. Vérification après chaque lot:
   - `npm run ci:fr-copy`
   - `npx tsc --noEmit`
   - `npm run lint`
   - tests ciblés si la surface le justifie
5. Déploiement et revalidation production pour les lots qui touchent les surfaces live.

## Architecture de mise en oeuvre

Le travail se fait par lots indépendants mais ordonnés:

1. landing et surfaces marketing
2. dashboards et shell applicatif
3. messages métier exposés
4. emails et contenus pédagogiques
5. documentation et nettoyage final

Chaque lot doit rester testable séparément et pouvoir être commité sans dépendre d'un nettoyage global du repo.

## Vérification attendue

- disparition des fautes flagrantes sur les surfaces live
- `ci:fr-copy` vert sans élargissement opportuniste de la baseline
- `tsc` et `lint` verts
- absence de régression visuelle ou fonctionnelle sur les zones retouchées

## Critère de fin

La passe est terminée quand:

- les surfaces visibles critiques sont linguistiquement propres,
- les messages exposés sont homogènes,
- les docs finales reflètent les corrections réelles,
- et l'état livré en production est prouvé par `local = origin = prod`.
