# PR — Frontend premium Nexus Réussite EAF

## Résumé

Transformation complète du frontend élève en produit visuel industrialisé : design system à tokens CSS, dark mode opérationnel, sélecteur de thème tri-état, primitives UI matures, qualité éditoriale française et QA visuelle par régression Playwright avec 30 baselines stables.

## Changements majeurs

- **Design system** — 252 tokens CSS (`globals.css`), migration de 98,4 % des couleurs hexadécimales vers des variables CSS. Couverture complète light et dark.
- **Dark mode** — ~100 tokens light, ~85 dark, appliqués sur toutes les surfaces élève. Sélecteur tri-état dans la sidebar (desktop) et la navigation mobile (popover). Prévention du FOUC par script synchrone.
- **Primitives UI** — Button (6 variantes), Card (hoverable), Badge, Input, Textarea, Select, SectionHeader, StateNotice (6 variantes dont empty). Barrel export via `ui/index.ts`.
- **QA visuelle** — 3 suites Playwright (public, connected, mobile), 31 tests, 30 baselines stables. Config séparée (`playwright.visual.config.ts`), auth automatisée, scripts npm dédiés.
- **Qualité française** — 7 passes éditoriales sur toutes les surfaces élève : apostrophes typographiques, ligatures, accents, ponctuation, ton professionnel.

## Impacts visibles

- Toutes les pages élève ont un rendu cohérent en mode clair et sombre.
- Le thème suit automatiquement les préférences système ou peut être sélectionné manuellement.
- Aucun flash de mauvais thème au chargement (FOUC prevention).
- Les pages légales (CGU, mentions légales, politique de confidentialité) sont créées et stylées.

## Impacts techniques

- 96 fichiers modifiés, +4 927 / −2 542 lignes.
- 30 fichiers PNG de baselines (~14 Mo).
- Aucune modification du backend, de l'infrastructure, du middleware ou de la sécurité.
- Aucun secret commité.
- Seule erreur TypeScript : `csrf/route.ts` (pré-existante, hors périmètre).

## QA réalisée

| Vérification | Résultat |
|---|---|
| TypeScript (`tsc --noEmit`) | Aucune erreur nouvelle |
| Visual regression (31 tests) | 31/31 passés |
| Double run de stabilité | 31/31 confirmé |
| Audit secrets commités | Aucun |
| Périmètre respecté | Aucune contamination backend/infra |

## Limites restantes

1. **bibliotheque** exclue des tests visuels (contenu de recherche dynamique).
2. **pricing mobile** exclu (hauteur de page variable).
3. Baselines générées sous Linux — les polices peuvent varier en CI (utiliser Docker).
4. Régénération des baselines nécessite PostgreSQL + pgvector (Docker recommandé).

## Points à surveiller après merge

- Vérifier que le dark mode fonctionne sur les navigateurs cibles.
- En cas de changement de polices ou de layout majeur, régénérer les baselines (`npm run test:visual:update`).
- Le rate-limiter d'auth (in-memory, 10 tentatives/min) peut bloquer les tests visuels si le serveur n'est pas redémarré entre les runs.

## Checklist pré-push (complétée)

- [x] `npx tsc --noEmit` — pas d'erreur nouvelle
- [x] `git diff --cached` — pas de secret, pas de `.env`
- [x] Historique lisible (13 commits LOT 2→13)
- [x] Snapshots présents dans `tests/visual/*-snapshots/`

## Checklist post-merge

- [ ] Vérifier le rendu light et dark en staging/preview
- [ ] Exécuter `npm run test:visual` si un environnement CI le permet
- [ ] Vérifier que le consent banner s'affiche correctement
- [ ] Vérifier le sélecteur de thème dans la sidebar
- [ ] Vérifier la landing page mobile (bandeau sticky bas)
