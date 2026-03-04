# 🧪 SCRIPTS DE TESTS MANUELS — VALIDATION P1

**Projet:** Nexus Réussite EAF  
**Date:** 1er mars 2026  
**Objectif:** Valider manuellement les fixes P1 en pré-production

---

## 📋 SOMMAIRE

1. [Test P1-01: Rate Limit Fail-Closed](#p1-01-rate-limit-fail-closed)
2. [Test P1-02: Input Sanitization (XSS)](#p1-02-input-sanitization-xss)
3. [Test P1-03: Error Messages Génériques](#p1-03-error-messages-generiques)
4. [Test P1-04: Payment Flow](#p1-04-payment-flow)
5. [Rapport de Validation](#rapport-de-validation)

---

## 🚀 PRÉREQUIS

```bash
# URL de pré-production
export PREPROD_URL="https://eaf-preprod.yourdomain.com"

# Token d'authentification (à récupérer après login)
export AUTH_TOKEN="your_jwt_token"

# Outils requis
# - curl
# - jq (pour parser JSON)
# - node (pour scripts)
```

---

## P1-01: RATE LIMIT FAIL-CLOSED

### Objectif
Vérifier que le rate limiting bloque les requêtes excessives et fail-closed en production.

### Test 1: Rate Limit Normal

```bash
#!/bin/bash
# Fichier: tests/manual/test-rate-limit.sh

echo "=== Test Rate Limit Normal ==="
echo "Envoi de 15 requêtes rapides..."

for i in {1..15}; do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$PREPROD_URL/api/v1/oral/session/start" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -d '{"oeuvre":"Cahier de Douai"}')
  
  echo "Requête $i: HTTP $HTTP_CODE"
  
  if [ "$HTTP_CODE" = "429" ]; then
    echo "✅ Rate limiting activé à la requête $i"
    break
  fi
done

echo "Test terminé"
```

**Exécution:**
```bash
chmod +x tests/manual/test-rate-limit.sh
./tests/manual/test-rate-limit.sh
```

**Résultat Attendu:**
```
Requête 1: HTTP 200
Requête 2: HTTP 200
...
Requête 6: HTTP 429
✅ Rate limiting activé à la requête 6
```

---

### Test 2: Rate Limit avec Redis Down (Simulation)

```bash
#!/bin/bash
# Fichier: tests/manual/test-rate-limit-redis-down.sh

echo "=== Test Rate Limit avec Redis Down ==="

# Si vous avez accès à Redis en pré-prod
# Option 1: Stopper Redis temporairement
# redis-cli -h your-redis-host SHUTDOWN

# Option 2: Modifier temporairement REDIS_URL pour pointer vers un port invalide
export REDIS_URL="redis://localhost:9999"

echo "Envoi de 5 requêtes avec Redis indisponible..."

for i in {1..5}; do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$PREPROD_URL/api/v1/oral/session/start" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -d '{"oeuvre":"Cahier de Douai"}')
  
  echo "Requête $i: HTTP $HTTP_CODE"
  
  if [ "$HTTP_CODE" = "429" ]; then
    echo "✅ FAIL-CLOSED: Requête bloquée (Redis down)"
  elif [ "$HTTP_CODE" = "200" ]; then
    echo "⚠️ FAIL-OPEN: Requête autorisée (danger en production!)"
  fi
done

# Redémarrer Redis
# redis-server --daemonize yes

echo "Test terminé"
```

**Résultat Attendu (Production):**
```
Requête 1: HTTP 429
✅ FAIL-CLOSED: Requête bloquée (Redis down)
Requête 2: HTTP 429
✅ FAIL-CLOSED: Requête bloquée (Redis down)
...
```

---

## P1-02: INPUT SANITIZATION (XSS)

### Objectif
Vérifier que les inputs utilisateur sont sanitizés et que le XSS est bloqué.

### Test 1: XSS dans Onboarding

```bash
#!/bin/bash
# Fichier: tests/manual/test-xss-onboarding.sh

echo "=== Test XSS dans Onboarding ==="

# Payload XSS
XSS_PAYLOAD='<script>alert(document.cookie)</script>'

echo "Envoi de payload XSS: $XSS_PAYLOAD"

RESPONSE=$(curl -s -X POST "$PREPROD_URL/api/v1/onboarding/complete" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "{
    \"displayName\": \"$XSS_PAYLOAD\",
    \"classLevel\": \"Première générale\",
    \"eafDate\": \"2026-06-15\",
    \"selectedOeuvres\": [\"Cahier de Douai\"],
    \"weakSignals\": []
  }")

echo "Réponse: $RESPONSE"

# Vérifier en base de données (via API ou accès direct)
PROFILE=$(curl -s "$PREPROD_URL/api/v1/student/profile" \
  -H "Authorization: Bearer $AUTH_TOKEN")

echo "Profil utilisateur: $PROFILE"

# Vérifier si displayName est échappé
if echo "$PROFILE" | grep -q "&lt;script&gt;"; then
  echo "✅ XSS BLOQUÉ: displayName est échappé"
elif echo "$PROFILE" | grep -q "<script>"; then
  echo "❌ FAILLE XSS: displayName non échappé!"
else
  echo "⚠️ Résultat inconnu"
fi
```

**Exécution:**
```bash
chmod +x tests/manual/test-xss-onboarding.sh
./tests/manual/test-xss-onboarding.sh
```

**Résultat Attendu:**
```
=== Test XSS dans Onboarding ===
Envoi de payload XSS: <script>alert(document.cookie)</script>
Réponse: {"ok":true,...}
Profil utilisateur: {"displayName":"&lt;script&gt;alert(document.cookie)&lt;/script&gt;",...}
✅ XSS BLOQUÉ: displayName est échappé
```

---

### Test 2: XSS dans Tuteur

```bash
#!/bin/bash
# Fichier: tests/manual/test-xss-tuteur.sh

echo "=== Test XSS dans Tuteur ==="

# Payload XSS
XSS_PAYLOAD='<img src=x onerror=alert(1)>'

echo "Envoi de payload XSS: $XSS_PAYLOAD"

RESPONSE=$(curl -s -X POST "$PREPROD_URL/api/v1/tuteur/message" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "{
    \"message\": \"$XSS_PAYLOAD\",
    \"conversationHistory\": []
  }")

echo "Réponse: $RESPONSE"

# Vérifier si la réponse contient le payload échappé
if echo "$RESPONSE" | grep -q "&lt;img"; then
  echo "✅ XSS BLOQUÉ: Message est échappé"
elif echo "$RESPONSE" | grep -q "<img"; then
  echo "❌ FAILLE XSS: Message non échappé!"
else
  echo "⚠️ Résultat inconnu"
fi
```

---

### Test 3: XSS Avancé (Multiple Vectors)

```bash
#!/bin/bash
# Fichier: tests/manual/test-xss-vectors.sh

echo "=== Test XSS - Multiple Vectors ==="

XSS_PAYLOADS=(
  '<script>alert(1)</script>'
  '<img src=x onerror=alert(1)>'
  '<svg onload=alert(1)>'
  'javascript:alert(1)'
  '<iframe src="data:text/html,<script>alert(1)</script>">'
  '<body onload=alert(1)>'
  '"><script>alert(1)</script>'
  '<IMG """><SCRIPT>alert("XSS")</SCRIPT>">'
)

for payload in "${XSS_PAYLOADS[@]}"; do
  echo ""
  echo "Testing: $payload"
  
  RESPONSE=$(curl -s -X POST "$PREPROD_URL/api/v1/tuteur/message" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -d "{\"message\": \"$payload\", \"conversationHistory\": []}")
  
  # Vérifier échappement
  if echo "$RESPONSE" | grep -qE "&(lt|gt|quot|amp);"; then
    echo "✅ BLOQUÉ: Payload échappé"
  else
    echo "⚠️ À vérifier manuellement"
  fi
done

echo ""
echo "Test terminé"
```

---

## P1-03: ERROR MESSAGES GÉNÉRIQUES

### Objectif
Vérifier que les messages d'erreur ne révèlent pas d'informations sensibles.

### Test 1: Copie Inexistante

```bash
#!/bin/bash
# Fichier: tests/manual/test-error-messages.sh

echo "=== Test Error Messages Génériques ==="

# Test 1: Copie inexistante
echo ""
echo "Test 1: Copie inexistante"
RESPONSE=$(curl -s "$PREPROD_URL/api/v1/epreuves/fake-id/copie/fake-copie-id" \
  -H "Authorization: Bearer $AUTH_TOKEN")

echo "Réponse: $RESPONSE"

if echo "$RESPONSE" | grep -q "Ressource non disponible"; then
  echo "✅ MESSAGE GÉNÉRIQUE: 'Ressource non disponible'"
elif echo "$RESPONSE" | grep -q "Copie introuvable"; then
  echo "❌ FUITE INFO: 'Copie introuvable'"
else
  echo "⚠️ Message inconnu"
fi

# Test 2: Session inexistante
echo ""
echo "Test 2: Session inexistante"
RESPONSE=$(curl -s -X POST "$PREPROD_URL/api/v1/oral/session/fake-session-id/interact" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{"step":"LECTURE","transcript":"test","duration":60}')

echo "Réponse: $RESPONSE"

if echo "$RESPONSE" | grep -q "Ressource non disponible"; then
  echo "✅ MESSAGE GÉNÉRIQUE: 'Ressource non disponible'"
elif echo "$RESPONSE" | grep -q "Session introuvable"; then
  echo "❌ FUITE INFO: 'Session introuvable'"
else
  echo "⚠️ Message inconnu"
fi

# Test 3: Épreuve inexistante
echo ""
echo "Test 3: Épreuve inexistante"
RESPONSE=$(curl -s "$PREPROD_URL/api/v1/epreuves/fake-epreuve-id/copie" \
  -H "Authorization: Bearer $AUTH_TOKEN")

echo "Réponse: $RESPONSE"

if echo "$RESPONSE" | grep -q "Ressource non disponible"; then
  echo "✅ MESSAGE GÉNÉRIQUE: 'Ressource non disponible'"
elif echo "$RESPONSE" | grep -q "Épreuve introuvable"; then
  echo "❌ FUITE INFO: 'Épreuve introuvable'"
else
  echo "⚠️ Message inconnu"
fi

echo ""
echo "Test terminé"
```

---

## P1-04: PAYMENT FLOW

### Objectif
Vérifier que le flow de paiement fonctionne correctement.

### Test 1: Pages de Paiement

```bash
#!/bin/bash
# Fichier: tests/manual/test-payment-pages.sh

echo "=== Test Payment Flow ==="

# Test 1: Page pricing
echo ""
echo "Test 1: Page Pricing"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PREPROD_URL/pricing")
echo "HTTP Code: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Page pricing accessible"
  
  # Vérifier contenu
  CONTENT=$(curl -s "$PREPROD_URL/pricing")
  
  if echo "$CONTENT" | grep -qi "FREE"; then
    echo "✅ Plan FREE visible"
  fi
  
  if echo "$CONTENT" | grep -qi "PRO\|MONTHLY"; then
    echo "✅ Plan PRO visible"
  fi
  
  if echo "$CONTENT" | grep -qi "MAX\|LIFETIME"; then
    echo "✅ Plan MAX visible"
  fi
else
  echo "❌ Page pricing inaccessible"
fi

# Test 2: Page confirmation
echo ""
echo "Test 2: Page Confirmation"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PREPROD_URL/paiement/confirmation")
echo "HTTP Code: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Page confirmation accessible"
else
  echo "❌ Page confirmation inaccessible"
fi

# Test 3: Page refus
echo ""
echo "Test 3: Page Refus"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PREPROD_URL/paiement/refus")
echo "HTTP Code: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Page refus accessible"
else
  echo "❌ Page refus inaccessible"
fi

echo ""
echo "Test terminé"
```

---

## 📊 RAPPORT DE VALIDATION

### Template de Rapport

```markdown
# Rapport de Validation Manuelle — P1 Fixes

**Date:** [DATE]  
**Testeur:** [NOM]  
**Environnement:** Pré-production  
**URL:** [URL]

---

## Résultats

### P1-01: Rate Limit Fail-Closed

| Test | Résultat | Notes |
|------|----------|-------|
| Rate limit normal | ✅ / ❌ | |
| Fail-closed (Redis down) | ✅ / ❌ | |

**Commentaires:** [À compléter]

---

### P1-02: Input Sanitization (XSS)

| Test | Résultat | Notes |
|------|----------|-------|
| XSS onboarding | ✅ / ❌ | |
| XSS tuteur | ✅ / ❌ | |
| XSS multiple vectors | ✅ / ❌ | |

**Commentaires:** [À compléter]

---

### P1-03: Error Messages Génériques

| Test | Résultat | Notes |
|------|----------|-------|
| Copie inexistante | ✅ / ❌ | |
| Session inexistante | ✅ / ❌ | |
| Épreuve inexistante | ✅ / ❌ | |

**Commentaires:** [À compléter]

---

### P1-04: Payment Flow

| Test | Résultat | Notes |
|------|----------|-------|
| Page pricing | ✅ / ❌ | |
| Page confirmation | ✅ / ❌ | |
| Page refus | ✅ / ❌ | |

**Commentaires:** [À compléter]

---

## Validation Globale

- [ ] P1-01 validé
- [ ] P1-02 validé
- [ ] P1-03 validé
- [ ] P1-04 validé

**Statut:** ✅ VALIDÉ / ❌ NON VALIDÉ

**Signature:** [NOM]  
**Date:** [DATE]
```

---

## 🎯 EXÉCUTION COMPLÈTE

### Script Tout-en-Un

```bash
#!/bin/bash
# Fichier: tests/manual/run-all-tests.sh

echo "╔════════════════════════════════════════════════════════╗"
echo "║  NEXUS EAF — TESTS MANUELS DE VALIDATION P1           ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Vérifier prérequis
if [ -z "$PREPROD_URL" ]; then
  echo "❌ ERREUR: PREPROD_URL non défini"
  echo "Exportez: export PREPROD_URL=\"https://eaf-preprod.yourdomain.com\""
  exit 1
fi

if [ -z "$AUTH_TOKEN" ]; then
  echo "❌ ERREUR: AUTH_TOKEN non défini"
  echo "Récupérez le token après login via /api/v1/auth/login"
  exit 1
fi

echo "✅ Prérequis OK"
echo "URL: $PREPROD_URL"
echo ""

# Exécuter tests
echo "┌────────────────────────────────────────────────────────┐"
echo "│ P1-01: Rate Limit Fail-Closed                         │"
echo "└────────────────────────────────────────────────────────┘"
./tests/manual/test-rate-limit.sh
echo ""

echo "┌────────────────────────────────────────────────────────┐"
echo "│ P1-02: Input Sanitization (XSS)                       │"
echo "└────────────────────────────────────────────────────────┘"
./tests/manual/test-xss-onboarding.sh
./tests/manual/test-xss-tuteur.sh
./tests/manual/test-xss-vectors.sh
echo ""

echo "┌────────────────────────────────────────────────────────┐"
echo "│ P1-03: Error Messages Génériques                      │"
echo "└────────────────────────────────────────────────────────┘"
./tests/manual/test-error-messages.sh
echo ""

echo "┌────────────────────────────────────────────────────────┐"
echo "│ P1-04: Payment Flow                                   │"
echo "└────────────────────────────────────────────────────────┘"
./tests/manual/test-payment-pages.sh
echo ""

echo "╔════════════════════════════════════════════════════════╗"
echo "║  TOUS LES TESTS SONT TERMINÉS                         ║"
echo "╚════════════════════════════════════════════════════════╝"
```

**Exécution:**
```bash
chmod +x tests/manual/run-all-tests.sh
export PREPROD_URL="https://eaf-preprod.yourdomain.com"
export AUTH_TOKEN="your_token"
./tests/manual/run-all-tests.sh
```

---

## 📞 SUPPORT

**Documentation:**
- [GUIDE_DEPLOIEMENT_PREPROD.md](./GUIDE_DEPLOIEMENT_PREPROD.md)
- [RAPPORT_VALIDATION_FIXES_P1.md](./RAPPORT_VALIDATION_FIXES_P1.md)

**Contacts:**
- Lead Developer: [À compléter]
- QA Engineer: [À compléter]

---

**Fin des Scripts de Tests Manuels**
