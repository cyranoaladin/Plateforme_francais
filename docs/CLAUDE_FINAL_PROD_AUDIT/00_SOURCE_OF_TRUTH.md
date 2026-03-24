# PHASE 0 — SOURCE DE VÉRITÉ

> Relevé final de cette session d'audit contradictoire, daté du 2026-03-24.

## 1. Alignement SHA

| Emplacement | Valeur |
| --- | --- |
| Local `HEAD` | `b06cfbbb26389b7ec4438d8bfa206a50c2da039d` |
| `origin/main` | `b06cfbbb26389b7ec4438d8bfa206a50c2da039d` |
| Production (`/api/v1/health`) | `b06cfbb` |
| Heure de build servie | `2026-03-24T06:44:22Z` |

Conclusion: `local = origin = prod`.

## 2. État applicatif

| Service | Preuve |
| --- | --- |
| App Next.js | `/api/v1/health` → `status=ok`, `checks.app=ok` |
| PostgreSQL | déploiement Prisma: `24 migrations found`, `No pending migrations to apply` |
| Redis | vérifié pendant la session: `PONG`, bind `127.0.0.1:6379` |
| SMTP | `/opt/eaf_platform/.env`: `SMTP_HOST=smtp.hostinger.com`, `SMTP_PORT=587`, `EMAIL_FROM=Nexus Réussite <contact@nexusreussite.academy>` |
| RAG | `/api/v1/rag/health` → `status=ok`, collection `rag_francais_premiere=11910` chunks |
| MCP | `/api/mcp/health` → `status=healthy`, `tools=24`, `latencyMs=13` |

## 3. PM2 et reverse proxy

| Vérification | Résultat |
| --- | --- |
| PM2 EAF | `eaf-nextjs`, `eaf-mcp`, `eaf-worker` online après déploiement final |
| Nginx | `nginx -t` OK pendant le déploiement final |
| HTTPS | actif |
| HSTS | présent |
| CSP | présente |
| `X-Frame-Options` | `DENY` |

## 4. Exposition et hygiène serveur

- Ports publics vérifiés pendant l'audit: `22`, `80`, `443`.
- Ports sensibles observés sur loopback seulement: `3000`, `3100`, `5432`, `5433`, `5435`, `6379`, `11434`.
- Après `A12-02`, les artefacts non production `.venv`, `.vscode`, `.windsurf`, `.windsurf_audit_logs`, `.windsurfrules`, `.superpowers`, `.claude`, `forensics`, `UI_UX` sont absents de `/opt/eaf_platform`.

## 5. Conclusion

La production servie au moment de la clôture est bien le SHA `b06cfbb`, avec une base, un cache, un SMTP, un RAG et un MCP opérationnels.
