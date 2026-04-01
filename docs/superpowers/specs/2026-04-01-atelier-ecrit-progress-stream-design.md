# Atelier Ecrit Progress Stream Design

## Goal

Ajouter un suivi temps réel de la correction écrite sans remplacer le worker asynchrone existant. La progression doit survivre à un refresh et permettre un reconnect propre côté client.

## Current State

- Le dépôt de copie passe par `POST /api/v1/epreuves/[epreuveId]/copie`.
- La correction est exécutée en arrière-plan via `runCorrectionWorker(copieId)`.
- Le frontend utilise aujourd'hui un polling toutes les 3 secondes sur le statut final.
- Aucun historique de progression intermédiaire n'est persisté.

## Recommended Architecture

### 1. Persisted Progress Events

Introduire une table dédiée `CopieProgressEvent` liée à `CopieDeposee`.

Chaque événement représente un jalon métier horodaté, par exemple:

- `queued`
- `ocr_started`
- `ocr_done`
- `correction_started`
- `correction_done`
- `report_ready`
- `failed`

Champs recommandés:

- `id`
- `copieId`
- `stage`
- `message`
- `progress`
- `payload` JSON optionnel
- `createdAt`

Le worker continue de piloter le traitement, mais il écrit désormais des événements explicites à chaque étape.

### 2. SSE Endpoint With Replay

Ajouter une route SSE dédiée:

- `GET /api/v1/epreuves/copies/[copieId]/events`

Comportement:

- vérifie l'authentification et l'ownership
- relit l'historique des événements déjà persistés
- envoie cet historique au client
- garde ensuite la connexion ouverte avec heartbeats et diffusion des nouveaux événements

Le reconnect doit être fiable après refresh. La route peut utiliser `Last-Event-ID` ou un mécanisme équivalent fondé sur le dernier `id` transmis.

### 3. Worker Event Publication

Le worker écrit les événements au moment exact où le traitement change d'étape:

- juste après la création de la copie: `queued`
- avant OCR: `ocr_started`
- après OCR: `ocr_done`
- avant correction LLM: `correction_started`
- après normalisation réussie: `correction_done`
- après persistance finale et rapport prêt: `report_ready`
- en cas d'échec final: `failed`

Le statut final de la copie reste la source de vérité métier. Les événements servent au suivi UX et au reconnect.

### 4. Frontend Consumption

La page de correction écrite remplace le polling principal par un `EventSource`:

- au chargement, elle ouvre le flux SSE
- elle hydrate l'UI avec l'historique déjà renvoyé
- elle met à jour la timeline et l'étape active au fil des événements
- quand `report_ready` arrive, elle recharge le statut final et le rapport

Un fallback polling peut être conservé en dernier recours si le navigateur ou la connexion SSE échoue.

## Data Contract

Exemple d'événement SSE:

```json
{
  "type": "progress",
  "event": {
    "id": "evt_123",
    "copieId": "copie_123",
    "stage": "ocr_started",
    "message": "Lecture OCR en cours...",
    "progress": 25,
    "createdAt": "2026-04-01T01:00:00.000Z"
  }
}
```

## Error Handling

- Si la base est indisponible, l'écriture d'événements de progression doit échouer comme le reste du flux écrit. Pas de second canal non persistant.
- Si la SSE tombe, le client doit pouvoir reconnecter sans perdre l'historique.
- Si un événement ne peut pas être diffusé en live, il reste récupérable depuis la base au prochain reconnect.

## Testing Strategy

- tests repository: create/list ordered events
- tests worker: ordre et contenu des événements publiés
- tests route SSE: ownership, historique initial, content type SSE
- tests frontend: remplacement du polling par EventSource, reprise après reconnect
- test de régression: refresh en plein traitement conserve la progression

## Non-Goals

- pas de streaming token par token du texte de correction
- pas de suppression du worker asynchrone
- pas de refonte de la logique OCR/correcteur dans ce lot
