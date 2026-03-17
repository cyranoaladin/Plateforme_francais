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

## Known limitations

1. **Baselines require a seeded database** -- connected page tests need a test user (`eleve.pro@eaf.local` / `ProTest2026!`)
2. **CI stability** -- screenshots are platform-dependent (font rendering varies across OS). CI should use a Docker container with consistent fonts
3. **Consent banner** -- dismissed via click in tests; if the banner DOM changes, tests may need updating
4. **Mobile dark mode** -- not yet covered (can be added in a future lot)
5. **Dynamic content** -- pages with live data (dashboard counters, dates) may cause false positives

## Troubleshooting

| Symptom | Fix |
|---|---|
| Tests fail with "no baseline" | Run `npm run test:visual:update` to generate initial baselines |
| Pixel diff on CI but not locally | Ensure CI uses the same browser version and OS fonts (use Docker) |
| Auth tests fail | Verify the test user exists in the database (`npm run db:seed`) |
| Consent banner blocks screenshots | The `dismissConsent()` helper clicks "Accepter"; check the button selector |
| Timeout on `webServer` | Increase `timeout` in `playwright.visual.config.ts` or set `E2E_BASE_URL` |
| Baseline generation fails immediately | Verify PostgreSQL is running on the configured port (`5433` by default in `.env`) |
