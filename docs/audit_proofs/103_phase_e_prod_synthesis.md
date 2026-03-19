# PHASE E — Vérification production (curl + SSH)

## Objectif
Vérifier l’état de santé en production, la cohérence SHA, les headers sécurité, et investiguer toute anomalie observable (écarts vs repo, dépendances externes).

---

## 1) Santé globale (app + DB) et release
- Endpoint: `https://eaf.nexusreussite.academy/api/v1/health`
- Résultat: `status: ok`, `checks.db: ok`, `checks.app: ok`
- Release servie:
  - `gitSha`: `ef50c75`
  - `buildTime`: `2026-03-19T16:22:54.853Z`
  - `nodeEnv`: `production`
- Preuve: `docs/audit_proofs/70_prod_health.json`

### Cohérence SHA vs repo
- HEAD local (short): `ef50c75`
  - Preuve: `docs/audit_proofs/74_local_head_short.txt`
- Lookup commit `ef50c75...`
  - Preuve: `docs/audit_proofs/75_prod_sha_lookup.txt`

---

## 2) Headers sécurité (prod)
- Health headers:
  - Preuve: `docs/audit_proofs/71_prod_health_headers.txt`
- Home headers:
  - Preuve: `docs/audit_proofs/72_prod_home_headers.txt`
- Login headers:
  - Preuve: `docs/audit_proofs/73_prod_login_headers.txt`

---

## 3) Pages / routes clés (prod)
- `/api/v1/ressources` : HTTP 200
  - Preuve: `docs/audit_proofs/78_prod_ressources_headers.txt`
- `/dashboard` (non authentifié) : HTTP 307 vers `/login?redirect=%2Fdashboard`
  - Preuve: `docs/audit_proofs/79_prod_dashboard_headers.txt`

---

## 4) État MCP (health)
- `/api/mcp/health` (prod) indique MCP reachable (localhost:3100) avec `tools`.
  - Preuve: `docs/audit_proofs/77_prod_mcp_health.json`

### Clarification “tools count” (repo)
- Le champ `tools` côté `/api/mcp/health` était auparavant basé sur un fallback non fiable quand `toolCount` était absent.
- Correctif appliqué côté app Next:
  - Preuve: `docs/audit_proofs/87_api_mcp_health_route_fixed.ts.txt`
- Correctif appliqué côté MCP server HTTP: `/health` renvoie maintenant `toolCount`.
  - Preuves:
    - `docs/audit_proofs/101_mcp_transport_http_toolcount_fix.ts.txt`
    - `docs/audit_proofs/102_mcp_server_tool_definitions_export.ts.txt`

---

## 5) Incident RAG (prod)

### Symptômes via curl
- `/api/v1/rag/health` retourne `status: degraded` avec `external_rag.healthy=false`.
  - Preuve: `docs/audit_proofs/76_prod_rag_health.json`
- `/api/v1/rag/health` retourne HTTP 503.
  - Preuve: `docs/audit_proofs/80_prod_rag_health_headers.txt`
- Le service externe `https://rag-api.nexusreussite.academy/health` retourne HTTP 504.
  - Preuves: `docs/audit_proofs/81_rag_api_health.txt`, `docs/audit_proofs/82_rag_api_health_headers.txt`

### Synthèse d’impact / recommandations
- Preuve: `docs/audit_proofs/89_prod_rag_incident_summary.md`

---

## 6) Root-cause RAG via SSH (sans secrets)

### Nginx rag-api
- `rag-api.nexusreussite.academy` reverse-proxy vers `http://127.0.0.1:18001`.
- Preuves:
  - `docs/audit_proofs/91_ssh_rag_nginx_vhost_and_upstream.txt`
  - `docs/audit_proofs/92_ssh_rag_upstream_18001_and_docker_health.txt`

### Upstream docker
- Le conteneur `compose-ingestor-1` (uvicorn `api:app`, port 8001) est `unhealthy`.
- Les probes montrent:
  - TCP connect OK sur 8001 mais absence de réponse HTTP (`NO_RESPONSE`).
  - `curl` sur `127.0.0.1:18001/health` time-out.
- Preuves:
  - `docs/audit_proofs/93_ssh_rag_compose_ingestor_debug.txt`
  - `docs/audit_proofs/94_ssh_rag_ingestor_runtime_probe.txt`
  - `docs/audit_proofs/96_ssh_rag_ingestor_health_route_and_socket_probe.txt`
  - `docs/audit_proofs/98_ssh_rag_ingestor_socket_and_api_probe_fixed.txt`

### Conclusion
Le `504` public de `rag-api` est dû à un upstream applicatif (`compose-ingestor-1`) non répondant (hang / starvation / deadlock). Nginx sert correctement le vhost mais ne reçoit pas de réponse de l’upstream.

---

## État final PHASE E
- Santé globale de l’app principale: OK
- SHA prod vs repo: cohérent
- Headers sécurité: présents
- Anomalie majeure: RAG externe indisponible / upstream docker unhealthy (root-cause identifié via SSH)
