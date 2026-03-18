# Visual QA -- Nexus Réussite EAF

## Overview

The visual QA system uses **Playwright screenshot comparison** to catch unintended UI regressions across public, connected, and mobile surfaces. Tests compare current renders against committed baseline screenshots with a 1% pixel tolerance.

## Test suites

| Project | File | Auth required | Viewport |
|---|---|---|---|
| `public-visual` | `visual-regression.spec.ts` | No | 1280x720 |
| `connected-visual` | `connected-visual.spec.ts` | Yes (via `auth.setup.ts`) | 1280x720 |
| `mobile-visual` | `mobile-visual.spec.ts` | Yes | 390x844 (iPhone 14) |

Each suite tests both **light** and **dark** mode (except mobile, light only for now).

### Pages covered

- **Public:** landing, pricing, login, contact, mentions-legales, cgu
- **Connected:** dashboard, bibliotheque, mon-parcours, quiz, profil, carnet, atelier-ecrit
- **Mobile:** landing, pricing, login, contact + dashboard, bibliotheque, mon-parcours, atelier-ecrit

## Generating baselines

Baselines are the reference screenshots stored in `tests/visual/*-snapshots/`.

**Prerequisite:** PostgreSQL doit être démarré sur le port configuré (5433 par défaut dans `.env`).

```bash
# 1. Ensure database is running and seeded
npx prisma db push
npm run db:seed

# 2. Start dev server (or let Playwright build & serve automatically)
npm run dev

# 3. Generate baselines (uses E2E_BASE_URL if server already running)
E2E_BASE_URL=http://localhost:3000 npm run test:visual:update

# 4. Verify baselines are clean
ls -la tests/visual/*-snapshots/

# 5. Commit baselines
git add tests/visual/*-snapshots/
git commit -m "chore: add visual regression baselines"
```

Without `E2E_BASE_URL`, Playwright builds the app and serves it on port 3110 automatically (see `playwright.visual.config.ts`).

## Running visual regression tests

```bash
# Run all suites
npm run test:visual

# Run a single suite
npm run test:visual:public
npm run test:visual:connected
npm run test:visual:mobile

# Update baselines after intentional changes
npm run test:visual:update
```

## Theme system

The app supports three modes: **system**, **light**, **dark** via a tri-state pill selector in the sidebar (desktop) and a popover in the mobile bottom nav.

- Theme preference is stored in `localStorage` under key `eaf_theme` (`light` | `dark`; absent = system)
- **FOUC prevention:** an inline `<script>` in `layout.tsx` reads `localStorage` synchronously before first paint and adds `.dark` if needed
- After hydration, `ThemeProvider` adds the `theme-ready` class to `<html>` (via `rAF + setTimeout(50ms)`) to enable CSS transitions only after the initial theme is painted
- CSS custom properties are defined in `globals.css` under `:root` (light) and `.dark` (dark)
- Visual tests inject `.dark` on `<html>` via `page.evaluate()` to test dark mode
- All components should use `var(--token)` instead of hardcoded colors
- Key tokens: `--navy`, `--surface-parchment`, `--card`, `--text-body`, `--border-strong`, `--teal`, `--accent-bronze`

## Prérequis infrastructure (diagnostic LOT 12)

La génération de baselines nécessite une base PostgreSQL opérationnelle. Deux blocages ont été identifiés factuellement le 2026-03-18 :

### Blocage 1 — Port PostgreSQL

Le projet configure `DATABASE_URL` sur le port **5433** (`.env` et `.env.local`), mais le cluster PostgreSQL 16/main tourne sur le port **5432** par défaut.

**Diagnostic :**
```bash
pg_lsclusters          # Vérifie le port réel du cluster
pg_isready -p 5432     # Doit répondre "accepting connections"
pg_isready -p 5433     # Échoue si aucun cluster n'écoute sur 5433
```

**Correction :** modifier le port dans `.env` et `.env.local` :
```
DATABASE_URL=postgresql://eaf_user:eaf_password@localhost:5432/eaf_local
```

### Blocage 2 — Extension pgvector manquante

Même avec le bon port, `prisma db push` échoue avec `type "vector" does not exist`. L'extension pgvector est utilisée par 3 modèles RAG (Chunk, WeakSkillEntry, MemorySummary).

**Correction :**
```bash
sudo apt install postgresql-16-pgvector
sudo systemctl restart postgresql
```

### Procédure complète de déblocage

```bash
# 1. Installer pgvector
sudo apt install postgresql-16-pgvector
sudo systemctl restart postgresql

# 2. Corriger le port (si nécessaire)
sed -i 's/:5433\//:5432\//' .env .env.local

# 3. Vérifier avec le script de précheck
bash scripts/visual-qa-precheck.sh

# 4. Pousser le schéma et seeder
npx prisma db push
npm run db:seed

# 5. Générer les baselines
npm run dev                                              # terminal 1
E2E_BASE_URL=http://localhost:3000 npm run test:visual:update  # terminal 2

# 6. Commiter les baselines
git add tests/visual/*-snapshots/
git commit -m "chore: add visual regression baselines"
```

## Script de précheck

Un script de diagnostic automatique est disponible :

```bash
bash scripts/visual-qa-precheck.sh
```

Il vérifie : Node, Playwright, `.env.local`, `DATABASE_URL`, PostgreSQL (port + accessibilité), pgvector, Prisma, seed, et les fichiers de test. Chaque point est affiché avec un indicateur vert/rouge/jaune et des solutions proposées.

## Known limitations

1. **Baselines require a seeded database** -- connected page tests need a test user (`eleve.pro@eaf.local` / `ProTest2026!`)
2. **CI stability** -- screenshots are platform-dependent (font rendering varies across OS). CI should use a Docker container with consistent fonts
3. **Consent banner** -- dismissed via click in tests; if the banner DOM changes, tests may need updating
4. **Mobile dark mode** -- not yet covered (can be added in a future lot)
5. **Dynamic content** -- pages with live data (dashboard counters, dates) may cause false positives
6. **Baselines non générées (LOT 12)** -- blocage par port PostgreSQL (5433 vs 5432) et pgvector manquant. Voir section "Prérequis infrastructure" ci-dessus

## Troubleshooting

| Symptom | Fix |
|---|---|
| Tests fail with "no baseline" | Run `npm run test:visual:update` to generate initial baselines |
| Pixel diff on CI but not locally | Ensure CI uses the same browser version and OS fonts (use Docker) |
| Auth tests fail | Verify the test user exists in the database (`npm run db:seed`) |
| Consent banner blocks screenshots | The `dismissConsent()` helper clicks "Accepter"; check the button selector |
| Timeout on `webServer` | Increase `timeout` in `playwright.visual.config.ts` or set `E2E_BASE_URL` |
| `prisma db push` échoue "vector" | Installer pgvector : `sudo apt install postgresql-16-pgvector` |
| PostgreSQL "connection refused" | Vérifier le port réel avec `pg_lsclusters` et corriger `DATABASE_URL` |
| Précheck rapide | Lancer `bash scripts/visual-qa-precheck.sh` pour un diagnostic complet |
