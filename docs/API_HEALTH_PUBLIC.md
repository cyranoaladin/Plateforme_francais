# API Health Endpoint - Documentation Publique

## Vue d'ensemble

L'endpoint `/api/v1/health` fournit un statut de santé minimal et public du service Nexus Réussite EAF, conçu pour le monitoring externe et les load balancers.

**Caractéristiques**:
- ✅ Endpoint **public** (aucune authentification requise)
- ✅ Payload **minimal** (pas de détails sensibles sur l'infrastructure)
- ✅ Réponse **rapide** (timeout 5s max)
- ✅ **Fail-closed** en production (503 si dépendances critiques indisponibles)

## Endpoint

```
GET /api/v1/health
```

**URL Production**: `https://eaf.nexusreussite.academy/api/v1/health`

**URL Staging**: `https://staging.nexusreussite.academy/api/v1/health`

## Réponses

### Service Sain (200 OK)

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": "ok",
  "service": "nexus-eaf"
}
```

**Signification**: Toutes les dépendances critiques (base de données, Redis) sont accessibles et fonctionnelles.

**Usage monitoring**:
- Probe health check pour load balancers (Nginx, HAProxy)
- Monitoring externe (UptimeRobot, Pingdom, etc.)
- Smoke tests post-déploiement

### Service Dégradé (503 Service Unavailable)

```http
HTTP/1.1 503 Service Unavailable
Content-Type: application/json

{
  "status": "degraded",
  "service": "nexus-eaf"
}
```

**Signification**: Une ou plusieurs dépendances critiques sont indisponibles (ex: base de données inaccessible, Redis down).

**Action requise**: Investigation immédiate, le service ne peut pas traiter les requêtes utilisateur de manière fiable.

## Politique de Divulgation

### ✅ Informations Publiques

- Statut binaire (ok / degraded)
- Nom du service
- Code HTTP standard (200 / 503)

### ❌ Informations NON Divulguées

Pour des raisons de sécurité, l'endpoint **ne divulgue PAS**:
- Détails sur les dépendances spécifiques en échec
- Messages d'erreur techniques ou stack traces
- Versions de composants ou de bibliothèques
- Noms de serveurs ou d'instances
- Métriques de performance internes
- Configuration ou variables d'environnement

**Rationale**: Limiter la surface d'information disponible aux attaquants potentiels (reconnaissance passive).

## Dépendances Vérifiées

L'endpoint health vérifie les dépendances critiques suivantes:

1. **Base de données PostgreSQL**
   - Test: `SELECT 1` query
   - Timeout: 5 secondes
   - Critique: OUI (503 si échec)

2. **Redis** (optionnel selon configuration)
   - Test: Ping Redis
   - Timeout: 2 secondes
   - Critique: NON en lecture seule (200 même si Redis down dans certains scénarios)

**Note**: Les dépendances non-critiques (ex: services externes comme Mistral AI ou Brevo) ne sont **pas** vérifiées par cet endpoint pour éviter les faux positifs.

## Exemples d'utilisation

### Monitoring Externe (UptimeRobot)

**Configuration**:
- URL: `https://eaf.nexusreussite.academy/api/v1/health`
- Méthode: GET
- Intervalle: 5 minutes
- Timeout: 30 secondes
- Alerte si: Status code ≠ 200 OU body ne contient pas `"status":"ok"`

### Load Balancer Health Check (Nginx)

```nginx
upstream eaf_backend {
    server 127.0.0.1:3000;

    # Health check passif
    check interval=5000 rise=2 fall=3 timeout=3000 type=http;
    check_http_send "GET /api/v1/health HTTP/1.0\r\n\r\n";
    check_http_expect_alive http_2xx;
}
```

### Smoke Test Post-Déploiement

```bash
#!/bin/bash
# Smoke test Blue-Green deployment

NEXT_PORT=3001  # Port du nouveau slot
SMOKE_OK=0

for i in {1..30}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    "http://127.0.0.1:${NEXT_PORT}/api/v1/health")

  if [ "$STATUS" = "200" ]; then
    RESPONSE=$(curl -s "http://127.0.0.1:${NEXT_PORT}/api/v1/health")
    if echo "$RESPONSE" | grep -q '"status":"ok"'; then
      SMOKE_OK=1
      echo "✓ Smoke test passed"
      break
    fi
  fi

  sleep 2
done

if [ "$SMOKE_OK" = "0" ]; then
  echo "✗ Smoke test failed - aborting deployment"
  exit 1
fi
```

### Monitoring Programmatique (Node.js)

```javascript
const https = require('https');

function checkHealth(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 5000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const health = JSON.parse(data);
          if (res.statusCode === 200 && health.status === 'ok') {
            resolve({ healthy: true, data: health });
          } else {
            resolve({ healthy: false, data: health });
          }
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

// Usage
checkHealth('https://eaf.nexusreussite.academy/api/v1/health')
  .then(result => {
    if (result.healthy) {
      console.log('Service is healthy');
    } else {
      console.error('Service is degraded', result.data);
    }
  })
  .catch(err => console.error('Health check failed', err));
```

## Fréquence d'Appel

**Recommandations**:
- **Monitoring externe**: 1-5 minutes (équilibrer réactivité vs charge)
- **Load balancer**: 5-10 secondes (health check actif)
- **CI/CD smoke tests**: 1-2 secondes pendant 30-60 secondes max
- **Clients applicatifs**: **NON** - ne pas utiliser pour circuit breaker côté client

⚠️ **Rate limiting**: L'endpoint health n'a **pas** de rate limiting strict, mais un usage abusif (> 100 req/s) peut être bloqué au niveau Nginx.

## Différence avec Métriques Internes

Ce endpoint est **distinct** de:
- `/api/v1/metrics/vitals`: Métriques Web Vitals (client-side performance)
- `/api/mcp/health`: Health check interne MCP Server (non public, authentifié)
- Endpoints internes de monitoring détaillé (non exposés publiquement)

Pour des métriques détaillées ou diagnostics internes, utiliser les outils de monitoring internes (PM2, logs, APM).

## SLA et Disponibilité

**Objectif**: Disponibilité ≥ 99.5% (mensuel)

**Temps de réponse cible**:
- p50: < 100ms
- p95: < 500ms
- p99: < 2s

**Downtime planifié**: Notifications 48h à l'avance via status page

## Contact et Support

**En cas de problème persistant**:
- Vérifier status page: [URL status page si disponible]
- Support technique: [contact support]
- Escalation urgence: Voir RUNBOOK_PRODUCTION.md

---

**Dernière mise à jour**: 2026-03-15
**Version**: 1.0.0
**Audience**: Équipes externes, SRE, monitoring
