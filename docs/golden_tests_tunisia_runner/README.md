# Runner — Golden Tests Tunisie (centres à l'étranger, groupe 1B)

Ce runner valide automatiquement :
1) **Horaire officiel écrit EAF Tunisie** : 2026-06-08 08:00–12:00 (Africa/Tunis)
2) **Convocation** : 07:30 (30 minutes avant)
3) **Refus correct en mode examen** : une demande de rédaction complète doit renvoyer **HTTP 403**

## Prérequis
- Node.js 20+
- Un serveur Next.js lancé (par ex. `npm run dev`)
- Base URL par défaut : `http://localhost:3000`

## Usage
```bash
# dans la racine du repo
node scripts/run_golden_tunisia.mjs
```

## Variables d’environnement
- `BASE_URL` (défaut `http://localhost:3000`)
- `API_PREFIX` (défaut `/api/v1`)
- `CONFIG_PATH` (optionnel) : chemin vers `config_defaults_tunisia_v3_0.json` ou `registry_v3_0_tunisia.yaml`
- `REQUIRE_SERVER=true|false` (défaut true) : si false, le runner ne fait que valider la config.

## Intégration npm
Ajouter dans `package.json` :
```json
{
  "scripts": {
    "test:golden:tn": "node scripts/run_golden_tunisia.mjs"
  }
}
```

## CI
Dans GitHub Actions, exécuter ce runner **après** que l’app soit démarrée (ou dans un job E2E Playwright).
