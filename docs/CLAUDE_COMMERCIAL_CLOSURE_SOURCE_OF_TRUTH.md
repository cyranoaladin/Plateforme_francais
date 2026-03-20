# Source de vérité — Fermeture commerciale

**Date** : 2026-03-20 19:50 UTC
**SHA local** : `8e33cd6`
**SHA origin/main** : `8e33cd6`
**SHA prod** : `8e33cd6` (déployé à 18:55 UTC)

## Services prod

| Service | Statut |
|---------|--------|
| Next.js (PM2 eaf-nextjs) | online |
| MCP server (PM2 eaf-mcp) | online, 20 tools |
| Worker (PM2 eaf-worker) | online |
| PostgreSQL | healthy (docker, port 5433) |
| Redis | PONG (port 6379) |
| Nginx | syntax ok, ports 80/443 |
| RAG ingestor | healthy (TCP healthcheck) |

## Divergences corrigées dans cette session

1. **Prod 4 commits en retard** → déployé `5372f76` puis `8e33cd6`
2. **Labels plans parasites** : PRO/MAX visibles dans admin → corrigé en Premium/Masterium
3. **Message redeem** : affichait ID technique → utilise maintenant PLAN_CATALOG.label
4. **Placeholder code** : `NEXUS-PRO-XXXX` → `EAF-XXXX-XXXX-XXXX`
5. **SMTP non configuré en prod** : 0 variables SMTP → ajoutées (mot de passe à remplir)

## Points ouverts

- SMTP_PASS doit être renseigné avec le vrai mot de passe Hostinger pour que les emails partent
- Le mot de passe actuel est un placeholder `REMPLACER_PAR_VRAI_MOT_DE_PASSE`
