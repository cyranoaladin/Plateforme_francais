# Secrets GitHub Actions requis — CI/CD Pipeline

Ce document liste tous les secrets qui doivent être configurés dans
**Settings → Secrets and variables → Actions** du dépôt GitHub pour que le pipeline
`Nexus EAF - CI/CD Pipeline` fonctionne correctement.

---

## Secrets obligatoires pour le déploiement (Gate 6b)

| Secret | Description | Exemple de format |
|---|---|---|
| `PROD_DATABASE_URL` | URL PostgreSQL de production (active le déploiement si défini) | `postgresql://user:pass@host:5432/eaf_prod` |
| `PROD_REDIS_URL` | URL Redis de production | `redis://:password@host:6379` |
| `PROD_SESSION_SECRET` | Secret de session (≥ 32 chars) | Chaîne aléatoire ≥ 32 caractères |
| `PROD_CSRF_SECRET` | Secret CSRF (≥ 32 chars) | Chaîne aléatoire ≥ 32 caractères |
| `PROD_MISTRAL_API_KEY` | Clé API Mistral pour les features LLM | `sk-...` |
| `PROD_BILLING_CODE_PEPPER` | Pepper de hachage des codes d'activation (obligatoire) | Chaîne aléatoire ≥ 32 caractères |
| `PROD_MCP_API_KEY` | Clé API pour le serveur MCP | Chaîne aléatoire ≥ 32 caractères |
| `PROD_CRON_SECRET` | Secret CRON pour les routes cron protégées (≥ 32 chars) | Chaîne aléatoire ≥ 32 caractères |
| `PROD_NEXT_PUBLIC_APP_URL` | URL publique de l'application | `https://eaf.nexusreussite.academy` |
| `PROD_HOST` | Hostname SSH du serveur de production | `88.99.254.59` |
| `PROD_USER` | Utilisateur SSH | `root` |
| `PROD_SSH_KEY` | Clé privée SSH (PEM complet) | `-----BEGIN OPENSSH PRIVATE KEY-----...` |

---

## Secrets optionnels (analyses de sécurité)

| Secret | Description | Comportement si absent |
|---|---|---|
| `SNYK_TOKEN` | Token Snyk pour le scan de vulnérabilités | Scan Snyk ignoré (notice dans les logs) |

---

## Variables d'environnement CI (non-secrets)

Ces variables sont définies directement dans le workflow `.github/workflows/ci-cd.yml`
et **ne nécessitent pas de secrets** :

| Variable | Valeur CI | Usage |
|---|---|---|
| `DATABASE_URL` | `postgresql://test:test@localhost:5432/eaf_test` | Tests d'intégration |
| `REDIS_URL` | `redis://localhost:6379` | Tests unitaires + intégration |
| `LLM_PROVIDER` | `mock` | Évite les appels LLM réels en CI |
| `SESSION_SECRET` | Valeur de test (32+ chars) | Tests d'authentification |
| `CSRF_SECRET` | Valeur de test (32+ chars) | Tests CSRF |
| `MISTRAL_API_KEY` | `ci_mock_mistral_key_not_real` | Valeur fictive marquée explicitement |

---

## Comportement du pipeline si les secrets sont absents

- **`PROD_DATABASE_URL` absent** → Gate 6b (déploiement) skippé avec warning, pipeline vert.
- **`PROD_SSH_KEY` / `PROD_HOST` / `PROD_USER` absents** → L'action `appleboy/ssh-action` échouera si le déploiement est tenté.
- **`SNYK_TOKEN` absent** → Notice dans les logs, scan ignoré, pipeline vert.

---

## Configuration recommandée pour un go-live

1. Configurer tous les secrets **obligatoires** via l'interface GitHub.
2. Vérifier que `PROD_BILLING_CODE_PEPPER` est unique et non partagé entre environnements.
3. Générer `PROD_SESSION_SECRET` et `PROD_CSRF_SECRET` avec `openssl rand -base64 48`.
4. Tester le déploiement SSH manuellement une première fois avant d'activer le pipeline.
