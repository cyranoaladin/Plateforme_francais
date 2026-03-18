# Handoff frontend — Nexus Réussite EAF

> Document de transmission pour le chantier frontend premium (LOT 2 → LOT 13).
> Rédigé le 2026-03-18. Branche : `main`, 12 commits d'avance sur `origin/main`.

---

## 1. Ce qui a été accompli

Le frontend élève a été transformé en produit visuel industrialisé :

- **Migration complète vers un design system à tokens CSS** — suppression de 98,4 % des valeurs hexadécimales codées en dur au profit de variables CSS cohérentes.
- **Dark mode opérationnel** — environ 100 tokens light et 85 tokens dark, appliqués sur l'ensemble des surfaces élève, publiques et connectées.
- **Sélecteur de thème tri-état** (system / light / dark) — intégré dans la sidebar desktop et la navigation mobile, avec persistence localStorage et détection automatique des préférences système.
- **Prévention du FOUC** — script synchrone en `<head>` pour appliquer le thème avant le premier paint, complété par une classe `theme-ready` qui active les transitions CSS après hydration.
- **Primitives UI matures** — Button, Card (avec prop `hoverable`), Badge, Input, Textarea, Select, SectionHeader, StateNotice (avec variante `empty`), toutes compatibles dark mode.
- **Qualité éditoriale française** — 7 passes de relecture, correction des apostrophes typographiques, ligatures œ, accents, ponctuation.
- **QA visuelle par régression Playwright** — 30 baselines stables, 31 tests passants, configuration complète avec auth, light/dark et mobile.

## 2. Design system

### Fichier principal

`src/app/globals.css` — 252 tokens CSS au total.

### Structure des tokens

- `:root` — tokens light (couleurs, surfaces, typographie, ombres, bordures)
- `.dark` — overrides dark mode
- Tokens principaux : `--navy`, `--surface-parchment`, `--card`, `--text-body`, `--border-strong`, `--teal`, `--accent-bronze`, `--gold-deep`

### Convention d'usage

Tous les composants utilisent la syntaxe Tailwind v4 avec valeurs arbitraires :
```
text-[var(--navy)]  bg-[var(--surface-parchment)]  border-[var(--border-strong)]
```

Aucune couleur hexadécimale codée en dur ne doit être ajoutée. Pour introduire une nouvelle couleur, ajouter un token dans `globals.css`.

## 3. Thème light/dark

### Composants clés

| Fichier | Rôle |
|---|---|
| `src/components/theme/theme-provider.tsx` | Contexte React, persistence, détection auto |
| `src/app/layout.tsx` | Script inline anti-FOUC dans `<head>` |
| `src/components/layout/sidebar.tsx` | Sélecteur tri-état desktop + mobile |
| `src/app/globals.css` | Tokens `:root` et `.dark` |

### Fonctionnement

1. Au chargement, le script inline lit `localStorage('eaf_theme')` et applique `.dark` si nécessaire avant le premier paint.
2. Le `ThemeProvider` hydrate, lit la préférence stockée (ou `matchMedia`), et gère les changements.
3. Après un `rAF + setTimeout(50ms)`, la classe `theme-ready` est ajoutée pour activer les transitions CSS.
4. Le sélecteur permet de choisir entre système, clair et sombre.

## 4. Primitives UI

Exportées depuis `src/components/ui/index.ts` :

| Composant | Fichier | Notes |
|---|---|---|
| `Button` | `button.tsx` | Variantes : primary, secondary, outline, ghost, danger, premium |
| `Card` | `card.tsx` | Prop `hoverable` pour effet de survol |
| `Badge` | `badge.tsx` | Variantes sémantiques avec tokens |
| `Input` | `input.tsx` | Compatible dark mode |
| `Textarea` | `textarea.tsx` | Compatible dark mode |
| `Select` | `select.tsx` | Compatible dark mode |
| `SectionHeader` | `section-header.tsx` | Titre + sous-titre avec badge optionnel |
| `StateNotice` | `state-notice.tsx` | Variantes : info, success, warning, error, loading, empty |

## 5. QA visuelle

### Documentation complète

`docs/VISUAL_QA.md`

### Suites de tests

| Suite | Fichier | Tests | Snapshots |
|---|---|---|---|
| public-visual | `visual-regression.spec.ts` | 12 | 12 |
| connected-visual | `connected-visual.spec.ts` | 12 | 12 |
| mobile-visual | `mobile-visual.spec.ts` | 7 | 6 |

### Pages exclues

- **bibliotheque** (connected + mobile) — contenu de recherche dynamique, screenshots instables.
- **pricing** (mobile uniquement) — hauteur de page fluctuante due à l'accordéon FAQ.

### Commandes

```bash
npm run test:visual              # exécuter tous les tests visuels
npm run test:visual:update       # régénérer les baselines
npm run test:visual:public       # suite publique uniquement
npm run test:visual:connected    # suite connectée uniquement
npm run test:visual:mobile       # suite mobile uniquement
```

### Prérequis pour régénérer les baselines

1. PostgreSQL avec pgvector (via Docker : `docker run -d -p 5433:5432 -e POSTGRES_USER=eaf_user -e POSTGRES_PASSWORD=eaf_password -e POSTGRES_DB=eaf_local pgvector/pgvector:pg16`)
2. `npx prisma db push --accept-data-loss`
3. `npm run db:seed`
4. Serveur de dev actif sur le port 3000
5. `E2E_BASE_URL=http://localhost:3000 npm run test:visual:update`

Script de diagnostic : `bash scripts/visual-qa-precheck.sh`

## 6. Structure des fichiers modifiés

```
src/app/globals.css                      # Design system tokens (252 tokens)
src/app/layout.tsx                       # Script anti-FOUC, polices
src/components/theme/theme-provider.tsx  # Thème tri-état
src/components/layout/sidebar.tsx        # Sélecteur de thème
src/components/ui/*.tsx                  # Primitives UI
src/components/public/*.tsx              # Header/Footer publics
src/components/consent/ConsentBanner.tsx # Bannière de consentement
src/app/bienvenue/sections/*.tsx         # Sections landing page
src/app/*/page.tsx                       # Pages élève (35+ fichiers)
tests/visual/*.ts                        # Tests visuels
tests/visual/*-snapshots/*.png           # 30 baselines
playwright.visual.config.ts             # Configuration Playwright
docs/VISUAL_QA.md                        # Documentation QA
scripts/visual-qa-precheck.sh            # Script de précheck
```

## 7. Reliquats hors périmètre frontend

Ces éléments ne font **pas** partie du chantier frontend et n'ont pas été touchés :

| Élément | Statut | Note |
|---|---|---|
| `csrf/route.ts` | Erreur TypeScript pré-existante | Import de `getOrCreateCsrfToken` inexistant |
| Middleware / rate-limit | Non touché | Fonctionnel tel quel |
| Redis | Non touché | Non requis pour le frontend |
| Backend métier / API | Non touché | |
| Infrastructure / déploiement | Non touché | |
| Tests unitaires backend | Non touchés | |

## 8. Points de vigilance après merge

1. **Baselines platform-dependent** — les snapshots portent le suffixe `-linux`. En CI, utiliser un conteneur Docker avec les mêmes polices pour éviter les faux positifs.
2. **Rate-limiter auth** — les tests visuels connectés consomment une tentative de login. Si la suite est relancée plusieurs fois sans redémarrer le serveur, le rate-limiter peut bloquer l'auth.
3. **`force-dynamic` dans layout.tsx** — toutes les pages sont rendues dynamiquement. Si cela change, vérifier que le dark mode et le ThemeProvider continuent de fonctionner.
4. **Polices Google Fonts** — Inter et Playfair Display sont chargées via `next/font/google`. En cas de changement de CDN ou de politique réseau, les baselines visuelles changeront.
