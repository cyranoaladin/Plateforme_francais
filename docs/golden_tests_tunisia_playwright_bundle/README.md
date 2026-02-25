# Golden Tests Tunisie — Version Playwright (autonome CI)

Cette version **ne dépend pas d’un serveur déjà lancé** :
- Elle démarre Postgres via `docker compose up -d`
- Applique les migrations Prisma
- Build l’app Next.js
- Lance `next start`
- Exécute les tests Playwright
- Arrête proprement (SIGTERM) en fin de run

## Fichiers fournis
- `playwright.config.ts` : utilise `webServer` pour démarrer automatiquement l’environnement
- `scripts/pw_webserver_tunisia.mjs` : orchestration DB + migrations + build + server
- `tests/golden_tunisia.spec.ts` : tests golden (horaire + convocation + 403 examen)
- `scripts/yaml_lite.cjs` : parseur YAML minimal (si config YAML utilisée)

## Prérequis
- Node.js 20+
- Docker + docker compose
- Prisma configuré (schema.prisma)
- Playwright installé (dev dependency) : `npm i -D @playwright/test`

## Installation Playwright (CI)
```bash
npx playwright install --with-deps
```

## Commandes
```bash
# Exécute tout (webServer auto + tests)
npx playwright test tests/golden_tunisia.spec.ts
```

## Variables d’environnement utiles
- `BASE_URL` (défaut http://127.0.0.1:3000)
- `CONFIG_PATH` : chemin vers `config_defaults_tunisia_v3_0.json` ou `registry_v3_0_tunisia.yaml`
- `DB_PORT` (défaut 5433), `PG_SERVICE` (défaut eaf_postgres), `DB_NAME` (défaut eaf_db)
- `API_PREFIX` n’est pas nécessaire ici (routes codées en /api/v1)

## CI GitHub Actions (exemple)
```yaml
- uses: actions/checkout@v4
- uses: actions/setup-node@v4
  with:
    node-version: 20
- run: npm ci
- run: npx playwright install --with-deps
- run: npx playwright test tests/golden_tunisia.spec.ts
```
