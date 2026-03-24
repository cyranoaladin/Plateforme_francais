# API Reference — Nexus Réussite EAF

> Documentation complète de l'API REST v1

---

## 🌐 Base URL

```
Production: https://eaf.nexusreussite.academy/api/v1
Local:      http://localhost:3000/api/v1
```

## 🔐 Authentification

L'API utilise des **sessions server-side** via cookies HTTP-only.

### Headers requis pour routes protégées

| Header | Description | Exemple |
|--------|-------------|---------|
| `Cookie` | Session cookie | `eaf_session=<token>` |
| `X-CSRF-Token` | Protection CSRF | `abc123...` (obtenu via `/csrf`) |

### Obtenir un token CSRF

```bash
GET /api/v1/csrf

# Response:
{
  "csrfToken": "abc123..."
}
# Le cookie csrf_token est également défini
```

---

## 📚 Endpoints par catégorie

### 🔑 Authentification

#### POST `/auth/register`
Inscrire un nouvel élève.

**Request:**
```json
{
  "email": "eleve@example.com",
  "password": "SecurePass123!",
  "displayName": "Jean Dupont",
  "isMinor": true,
  "parentEmail": "parent@example.com",
  "teacherEmail": null,
  "acceptedCgu": true,
  "cguVersion": "2026-03"
}
```

**Response 201:**
```json
{
  "ok": true,
  "user": {
    "id": "uuid",
    "email": "eleve@example.com",
    "role": "eleve"
  }
}
```

**RGPD:** Si `isMinor: true`, un email de consentement parental est automatiquement envoyé à `parentEmail`.

---

#### POST `/auth/login`
Connecter un utilisateur.

**Request:**
```json
{
  "email": "eleve@example.com",
  "password": "SecurePass123!"
}
```

**Response 200:**
```json
{
  "ok": true,
  "user": {
    "id": "uuid",
    "email": "eleve@example.com",
    "role": "eleve",
    "profile": {
      "displayName": "Jean Dupont",
      "onboardingCompleted": true
    }
  }
}
```

---

#### POST `/auth/logout`
Déconnecter l'utilisateur.

**Auth:** ✅ Requise  
**Response 200:** `{ "ok": true }`

---

#### GET `/auth/me`
Obtenir les informations de l'utilisateur connecté.

**Auth:** ✅ Requise  
**Response 200:**
```json
{
  "id": "uuid",
  "email": "eleve@example.com",
  "role": "eleve",
  "profile": {
    "displayName": "Jean Dupont",
    "classLevel": "Première générale",
    "targetScore": "14/20",
    "onboardingCompleted": true,
    "selectedOeuvres": ["Candide", "Les Misérables"],
    "parentEmail": "parent@example.com",
    "isMinor": true,
    "parentConsentStatus": "granted"
  },
  "subscription": {
    "plan": "PREMIUM",
    "status": "ACTIVE"
  }
}
```

---

#### POST `/auth/forgot-password`
Demander un reset de mot de passe.

**Request:**
```json
{
  "email": "eleve@example.com"
}
```

**Response 200:** `{ "ok": true }`  
*(Envoi d'email avec lien de reset)*

---

#### POST `/auth/reset-password`
Confirmer le reset de mot de passe.

**Request:**
```json
{
  "token": "reset-token",
  "password": "NewPass123!"
}
```

**Response 200:** `{ "ok": true }`

---

### 💳 Facturation

#### GET `/billing/status`
Obtenir le statut de facturation de l'utilisateur.

**Auth:** ✅ Requise  
**Response 200:**
```json
{
  "subscription": {
    "plan": "PREMIUM",
    "status": "ACTIVE",
    "currentPeriodEnd": "2026-04-21T00:00:00Z"
  },
  "lastPayment": {
    "status": "ACCEPTED",
    "plan": "PREMIUM",
    "orderRef": "EAF-2026-001",
    "completedAt": "2026-03-21T10:30:00Z"
  },
  "quotas": {
    "oralSessions": { "used": 3, "limit": 10, "remaining": 7 },
    "writtenCorrections": { "used": 5, "limit": 20, "remaining": 15 },
    "tutorQuestions": { "used": 25, "limit": 100, "remaining": 75 }
  }
}
```

---

#### POST `/billing/redeem-code`
Activer un code d'activation.

**Auth:** ✅ Requise + CSRF  
**Request:**
```json
{
  "code": "EAF-ABCD-EFGH-IJKL"
}
```

**Response 200:**
```json
{
  "ok": true,
  "plan": "PREMIUM",
  "expiresAt": "2026-04-21T00:00:00Z"
}
```

**Erreurs:**
- `400`: Code invalide
- `404`: Code non trouvé
- `409`: Code déjà utilisé
- `410`: Code expiré

---

#### GET `/billing/check-quota`
Vérifier le quota pour une feature.

**Auth:** ✅ Requise  
**Query params:** `?feature=ORAL_SESSIONS`  
**Response 200:**
```json
{
  "feature": "ORAL_SESSIONS",
  "allowed": true,
  "remaining": 7,
  "limit": 10,
  "period": "week"
}
```

---

### 👨‍💼 Admin

#### GET `/admin/activation-codes`
Lister les codes d'activation.

**Auth:** ✅ Admin uniquement  
**Query params:** `?status=CREATED&plan=PREMIUM`  
**Response 200:**
```json
{
  "codes": [
    {
      "id": "uuid",
      "plan": "PREMIUM",
      "durationDays": 30,
      "status": "CREATED",
      "createdAt": "2026-03-21T10:00:00Z",
      "expiresAt": "2026-04-21T00:00:00Z"
    }
  ],
  "total": 150,
  "byStatus": {
    "CREATED": 50,
    "DELIVERED": 30,
    "REDEEMED": 70
  }
}
```

---

#### POST `/admin/activation-codes`
Générer des codes d'activation.

**Auth:** ✅ Admin + CSRF  
**Request:**
```json
{
  "plan": "PREMIUM",
  "count": 10,
  "durationDays": 30,
  "prefix": "MARS-2026"
}
```

**Response 201:**
```json
{
  "ok": true,
  "codes": [
    "EAF-MARS-2026-XXXX-XXXX",
    "EAF-MARS-2026-YYYY-YYYY"
  ],
  "generated": 10
}
```

---

#### POST `/admin/manual-payment`
Valider un paiement manuel.

**Auth:** ✅ Admin + CSRF  
**Request:**
```json
{
  "userId": "uuid",
  "plan": "PREMIUM",
  "amountTnd": 99,
  "orderRef": "VIREMENT-2026-001",
  "notes": "Paiement reçu par virement bancaire"
}
```

**Response 200:**
```json
{
  "ok": true,
  "subscription": {
    "plan": "PREMIUM",
    "status": "ACTIVE",
    "currentPeriodEnd": "2026-04-21T00:00:00Z"
  }
}
```

---

#### GET `/admin/users`
Lister les utilisateurs.

**Auth:** ✅ Admin  
**Query params:** `?role=eleve&plan=PREMIUM&page=1`  
**Response 200:**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "eleve@example.com",
      "role": "eleve",
      "plan": "PREMIUM",
      "createdAt": "2026-03-01T00:00:00Z",
      "lastActive": "2026-03-21T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 150
  }
}
```

---

#### GET `/admin/stats`
Statistiques globales.

**Auth:** ✅ Admin  
**Response 200:**
```json
{
  "users": {
    "total": 1500,
    "byRole": { "eleve": 1400, "enseignant": 50, "admin": 5 },
    "activeToday": 120
  },
  "subscriptions": {
    "byPlan": { "FREEMIUM": 1000, "PREMIUM": 400, "MASTERIUM": 100 },
    "conversionRate": 33.3
  },
  "usage": {
    "oralSessionsToday": 45,
    "writtenSubmissionsToday": 23,
    "llmTokensToday": 150000
  }
}
```

---

### 🎤 Atelier Oral

#### POST `/oral/session/start`
Démarrer une session d'oral.

**Auth:** ✅ Requise + Quota  
**Request:**
```json
{
  "mode": "SIMULATION",
  "oeuvre": "Candide"
}
```

**Response 201:**
```json
{
  "sessionId": "uuid",
  "status": "PREPARING",
  "oeuvre": "Candide",
  "extrait": "Il faut cultiver notre jardin...",
  "questionGrammaire": "Analysez la valeur du subjonctif...",
  "message": "Suivez les 4 étapes officielles : lecture (2 min), explication (8 min), grammaire (2 min), entretien (8 min sur l’œuvre choisie)."
}
```

---

#### POST `/oral/session/[sessionId]/interact`
Interaction pendant la session d'oral.

**Auth:** ✅ Requise  
**Request:**
```json
{
  "phase": "LECTURE",
  "transcript": "Voici ma lecture et mon commentaire..."
}
```

**Response 200:**
```json
{
  "feedback": "La lecture est claire, mais il faut accentuer les liaisons.",
  "score": 1.5,
  "maxScore": 2
}
```

---

#### POST `/oral/session/[sessionId]/end`
Finaliser la session d'oral.

**Auth:** ✅ Requise  
**Request:**
```json
{
  "notes": "Bilan final"
}
```

**Response 200:**
```json
{
  "bilan": {
    "note": 14.5,
    "feedback": "Excellent point sur...",
    "axesProgres": ["Citations", "Transitions"],
    "resume": "Bonne maîtrise globale, encore un effort sur la précision des références."
  }
}
```

---

### ✍️ Atelier Écrit

#### POST `/epreuves/generate`
Générer un sujet d'épreuve.

**Auth:** ✅ Requise + Quota  
**Request:**
```json
{
  "type": "DISSERTATION",
  "objetEtude": "Roman",
  "difficulte": "STANDARD"
}
```

**Response 201:**
```json
{
  "epreuveId": "uuid",
  "sujet": "Le personnage de roman est-il un être social...",
  "texte": "Extrait de Madame Bovary...",
  "consignes": "Vous rédigerez une dissertation...",
  "bareme": {
    "introduction": 2,
    "developpement": 12,
    "conclusion": 2,
    "style": 4
  }
}
```

---

#### POST `/epreuves/[epreuveId]/copie`
Déposer une copie.

**Auth:** ✅ Requise  
**Content-Type:** `multipart/form-data`  
**Body:**
- `file`: PDF ou image de la copie
- `texte`: (optionnel) Version texte

**Response 201:**
```json
{
  "copieId": "uuid",
  "status": "pending",
  "ocrPending": true,
  "correctionETA": "2026-03-21T12:00:00Z"
}
```

---

#### GET `/epreuves/copies/[copieId]`
Obtenir le statut et la correction.

**Auth:** ✅ Requise  
**Response 200:**
```json
{
  "copieId": "uuid",
  "status": "done",
  "ocrText": "Texte extrait...",
  "correction": {
    "note": 12.5,
    "feedback": "Introduction bien structurée...",
    "pointsForts": ["Thèse claire", "Exemples pertinents"],
    "axesAmelioration": ["Transitions", "Citations"],
    "details": [
      { "categorie": "Introduction", "note": 1.5, "commentaire": "..." }
    ]
  }
}
```

---

### 🤖 Tuteur IA

#### POST `/chat`
Envoyer un message au tuteur IA.

**Auth:** ✅ Requise + Quota tokens  
**Request:**
```json
{
  "message": "Explique-moi la différence entre thèse et problématique",
  "context": {
    "oeuvre": "Candide",
    "typeExercice": "dissertation"
  }
}
```

**Response 200:**
```json
{
  "response": "La thèse est la position que vous défendez...",
  "sources": [
    { "title": "Guide méthodologique", "relevance": 0.95 }
  ],
  "tokensUsed": 250,
  "suggestedFollowUp": [
    "Comment formuler une bonne problématique ?",
    "Exemples de thèses efficaces"
  ]
}
```

---

#### POST `/llm/orchestrate`
Router vers skill LLM spécialisé.

**Auth:** ✅ Requise  
**Request:**
```json
{
  "skill": "correcteur",
  "payload": {
    "texte": "Ma copie...",
    "type": "dissertation"
  }
}
```

**Response 200:**
```json
{
  "skill": "correcteur",
  "result": {
    "note": 13,
    "feedback": "...",
    "corrections": [...]
  },
  "latencyMs": 2500,
  "model": "mistral-medium"
}
```

**Skills disponibles:**
- `correcteur` — Correction de copies
- `coach-oral` — Préparation oral
- `quiz-maitre` — Génération quiz
- `pastiche` — Exercices pastiche
- `grammaire` — Explications grammaire
- `coach-lecture` — Analyse de texte

---

### 📚 RAG

#### POST `/rag/query`
Recherche sémantique dans la base de connaissances.

**Auth:** ✅ Requise  
**Request:**
```json
{
  "query": "optimisme candide philosophie",
  "limit": 5,
  "filters": {
    "oeuvre": "Candide",
    "type": "analyse"
  }
}
```

**Response 200:**
```json
{
  "results": [
    {
      "id": "chunk-uuid",
      "content": "L'optimisme de Pangloss...",
      "source": "Analyse littéraire - Candide",
      "relevance": 0.92,
      "authorityLevel": "A"
    }
  ],
  "latencyMs": 150
}
```

---

### 📊 Monitoring

#### GET `/health`
Health check de l'application.

**Auth:** ❌ Public  
**Response 200:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "release": {
    "gitSha": "abc123...",
    "buildTime": "2026-03-21T10:00:00Z"
  },
  "services": {
    "database": "connected",
    "redis": "connected",
    "rag": "available"
  },
  "timestamp": "2026-03-21T10:30:00Z"
}
```

---

#### POST `/metrics/vitals`
Collecte des Web Vitals.

**Auth:** ❌ Public  
**Request:**
```json
{
  "name": "LCP",
  "value": 1200,
  "rating": "good",
  "url": "/dashboard"
}
```

---

### 📧 Contact

#### POST `/contact`
Envoyer un message via le formulaire de contact.

**Auth:** ❌ Public  
**Rate limit:** 3/minute/IP  
**Request:**
```json
{
  "name": "Jean Dupont",
  "email": "jean@example.com",
  "subject": "Question technique",
  "message": "Je rencontre un problème avec...",
  "category": "support"
}
```

**Response 200:**
```json
{
  "ok": true,
  "ticketId": "TICKET-2026-001"
}
```

---

## ❌ Codes d'erreur

| Code | Description | Exemple |
|------|-------------|---------|
| `400` | Bad Request | Paramètres invalides |
| `401` | Unauthorized | Session manquante/expirée |
| `403` | Forbidden | Rôle insuffisant |
| `404` | Not Found | Ressource inexistante |
| `409` | Conflict | Conflit (email déjà utilisé) |
| `429` | Too Many Requests | Rate limit dépassé |
| `500` | Internal Error | Erreur serveur |
| `503` | Service Unavailable | Service temporairement indisponible |

### Format des erreurs

```json
{
  "error": "Message explicite",
  "code": "ERROR_CODE",
  "details": {
    "field": "email",
    "message": "Email déjà utilisé"
  }
}
```

---

## 📊 Rate Limiting

| Route | Limite | Période |
|-------|--------|---------|
| `/auth/register` | 3 | 60 minutes |
| `/auth/login` | 5 | 15 minutes |
| `/contact` | 3 | 60 minutes |
| `/chat` | 100 | jour |
| API générale | 1000 | heure |

**Headers de réponse:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1711022400
Retry-After: 300 (en cas de 429)
```

---

## 🔄 Webhooks

Aucun webhook exposé actuellement. Les notifications sont gérées via:
- Email (SMTP)
- Web Push (optionnel)

---

<p align="center">
  <a href="./COMPLETE_GUIDE.md">← Retour au guide complet</a>
</p>
