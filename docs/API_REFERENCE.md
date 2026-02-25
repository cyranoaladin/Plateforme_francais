# Référence API v1

Base path: `/api/v1`

## Conventions générales
- Auth requise sur toutes les routes sauf:
  - `POST /auth/login`
  - `POST /auth/register`
  - `GET /health`
- Protection CSRF (double-submit cookie) sur les routes mutatives:
  - header requis: `X-CSRF-Token`
  - cookie: `eaf_csrf`
- Corps JSON validés via Zod (sauf upload multipart)
- Format d'erreur standard: `{ "error": string }`

## Auth
### `POST /auth/register`
Body:
```json
{ "email": "string", "password": "string>=8", "displayName?": "string", "role?": "eleve|enseignant|parent" }
```
Réponse: `{ "ok": true }` (201)

### `POST /auth/login`
Body:
```json
{ "email": "string", "password": "string" }
```
Réponse: `{ "ok": true }` (200)

Rate limit: 10 req/min/IP sur login et register (`Retry-After` en cas de 429).

### `POST /auth/logout`
Réponse: `{ "ok": true }`

### `GET /auth/me`
Réponse:
```json
{ "id": "string", "email": "string", "role": "eleve|enseignant|parent", "profile": { "...": "..." } }
```

## Santé
### `GET /health`
Réponse:
```json
{ "status": "ok", "timestamp": "ISO", "app": "EAF Premium" }
```

## Profil / mémoire
### `GET /student/profile`
Retourne le profil courant.

### `PUT /student/profile`
Body partiel (tous champs optionnels):
- `displayName`, `classLevel`, `targetScore`, `establishment`, `eafDate`
- `onboardingCompleted`, `selectedOeuvres[]`, `classCode`
- `parcoursProgress[]`, `badges[]`, `preferredObjects[]`, `weakSkills[]`

### `POST /memory/events`
Body:
```json
{ "type?": "navigation|interaction|discussion|resource|evaluation|quiz|auth", "feature?": "string", "path?": "string", "payload?": { "k": "v" } }
```
Réponse: `{ "ok": true }` (201)

### `GET /memory/timeline?limit=50&type=evaluation`
Réponse:
```json
{ "timeline": [ { "id": "...", "type": "...", "feature": "...", "payload": {}, "createdAt": "ISO" } ], "total": 0, "limit": 50 }
```

## RAG
### `POST /rag/search`
Body:
```json
{ "query": "string", "maxResults?": 1-10 }
```
Réponse:
```json
{ "results": [ { "id": "...", "title": "...", "type": "...", "level": "...", "excerpt": "...", "url": "...", "score": 0 } ] }
```
Moteur:
- tente vector search pgvector en premier
- fallback lexical si indisponible

## Atelier langue
### `POST /evaluations/langue`
Body:
```json
{ "exerciseId": 1|2, "answer": "string" }
```
Réponse: évaluation structurée (score, feedback, pistes).

## Atelier écrit
### `POST /epreuves/generate`
Body:
```json
{ "type": "commentaire|dissertation|contraction_essai", "oeuvre?": "string", "theme?": "string" }
```
Réponse:
```json
{ "epreuveId": "...", "sujet": "...", "texte": "...", "consignes": "...", "bareme": {}, "generatedAt": "ISO" }
```

### `POST /epreuves/{epreuveId}/copie`
Content-Type: `multipart/form-data`
- champ: `file`
- types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`
- limite: `MAX_UPLOAD_SIZE_MB` (20MB par défaut)

Réponse 202:
```json
{ "copieId": "...", "status": "pending", "newBadges": ["..."] }
```

### `GET /epreuves/{epreuveId}/copie/{copieId}`
Réponse:
```json
{ "copieId": "...", "status": "pending|processing|done|error", "correction": {}, "ocrText": "...", "createdAt": "ISO", "correctedAt": "ISO" }
```

### `GET /epreuves/copies/{copieId}/report`
Réponse: PDF (`application/pdf`)

## Atelier oral
### `POST /oral/session/start`
Body:
```json
{ "oeuvre": "string", "extrait?": "string", "questionGrammaire?": "string" }
```
Réponse:
```json
{ "sessionId": "...", "texte": "...", "questionGrammaire": "...", "instructions": "..." }
```

### `POST /oral/session/{sessionId}/interact`
Body:
```json
{ "step": "LECTURE|EXPLICATION|GRAMMAIRE|ENTRETIEN", "transcript": "string", "duration": 1-1800 }
```
Réponse:
```json
{ "feedback": "...", "score": 0, "max": 0, "points_forts": [], "axes": [], "relance?": "..." }
```

### `POST /oral/session/{sessionId}/end`
Body:
```json
{ "notes?": "string" }
```
Réponse:
```json
{ "note": 0, "totalScore": 0, "totalMax": 0, "details": [], "bilan": "...", "notes": "...", "newBadges": [] }
```

## Onboarding / parcours / quiz
### `POST /onboarding/complete`
Body:
```json
{ "displayName": "...", "classLevel": "...", "establishment?": "...", "eafDate": "YYYY-MM-DD", "selectedOeuvres": ["..."], "weakSignals": ["..."], "classCode?": "..." }
```
Réponse: message de bienvenue personnalisé.

### `POST /parcours/generate`
Body:
```json
{ "forceRegenerate?": true }
```
Réponse:
```json
{ "semaines": [ { "numero": 1, "objectif": "...", "activites": [ { "type": "...", "titre": "...", "duree": "...", "lien": "..." } ] } ] }
```

### `POST /quiz/generate`
Body:
```json
{ "theme": "string", "difficulte": 1|2|3, "nbQuestions": 5|10|20 }
```
Réponse:
```json
{ "questions": [ { "id": "...", "enonce": "...", "options": ["..."], "bonneReponse": 0, "explication": "..." } ] }
```

## Tuteur IA
### `POST /tuteur/message`
Body:
```json
{ "message": "string", "conversationHistory": [ { "role": "user|assistant", "content": "string" } ] }
```
Réponse:
```json
{ "answer": "...", "citations": [ { "index": 1, "title": "...", "source": "...", "url": "..." } ], "suggestions": ["..."] }
```

## Gamification
### `POST /badges/evaluate`
Body:
```json
{ "trigger?": "first_copy|quiz_perfect|oral_done|score", "score?": 0 }
```
Réponse: état badges + nouveaux badges débloqués.

### `GET /badges/list`
Réponse:
```json
{ "badges": ["..."] }
```

## Espace enseignant
Accès réservé au rôle `enseignant`.

### `GET /enseignant/dashboard`
Réponse:
```json
{ "classCode": "ABC123", "students": [], "distribution": [], "copies": [] }
```

### `GET /enseignant/export`
Réponse: CSV (`text/csv`)

### `POST /enseignant/class-code`
Réponse:
```json
{ "classCode": "ABC123" }
```

### `POST /enseignant/corrections/{copieId}/comment`
Body:
```json
{ "comment": "string" }
```
Réponse:
```json
{ "ok": true, "commentaireEnseignant": "..." }
```

## Monitoring
### `GET /metrics/vitals`
- Avec query params (`name`, `value`) => enregistre une mesure
- Sans params => retourne l'agrégation courante

Réponse:
```json
{ "vitals": { "LCP": { "count": 0, "total": 0, "avg": 0, "last": 0 }, "FID": { "count": 0, "total": 0, "avg": 0, "last": 0 }, "CLS": { "count": 0, "total": 0, "avg": 0, "last": 0 } } }
```
