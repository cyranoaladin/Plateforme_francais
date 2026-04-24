# Classification des scripts de check

## Scripts exécutables localement (avec .env.e2e)

| Script | Description | Commande |
|--------|-------------|----------|
| `check-release-integrity.sh` | Vérifie l'intégrité du build | `bash scripts/check-release-integrity.sh` |
| `smoke-test-production.sh` | Tests HTTP de base | `bash scripts/smoke-test-production.sh` |

## Scripts server-only (nécessitent secrets prod)

| Script | Description | Classification | Mode d'exécution |
|--------|-------------|----------------|------------------|
| `check-all-production.sh` | Master check | PROD | `ssh root@eaf.nexusreussite.academy bash /opt/eaf/current/scripts/check-all-production.sh` |
| `check-db-prod.sh` | Check DB | PROD | Server only |
| `check-redis-prod.sh` | Check Redis | PROD | Server only |
| `check-mcp-prod.sh` | Check MCP | PROD | Server only |
| `check-worker-prod.sh` | Check Worker | PROD | Server only |
| `check-llm-prod.sh` | Check LLM | PROD | Server only |
| `check-rag-prod.sh` | Check RAG | PROD | Server only |
| `check-memory-prod.sh` | Check Memory | PROD | Server only |
| `check-billing-prod.sh` | Check Billing | PROD | Server only |
| `check-env-production.sh` | Check env | PROD | Server only |
| `check-secrets-exposure.sh` | Check secrets | PROD | Server only |

## Commandes de check E2E (alternatives locales)

```bash
# Health check HTTP
curl -s http://127.0.0.1:3110/api/v1/health | jq .

# Check DB via Prisma
export $(grep -v '^#' .env.e2e | xargs) && npx prisma db execute --stdin < <(echo "SELECT 1;")

# Check Redis
redis-cli -h localhost -p 6380 ping
```
