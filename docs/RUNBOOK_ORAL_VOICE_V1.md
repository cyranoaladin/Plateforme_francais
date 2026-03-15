# Runbook Oral Voice V1

## Architecture

```
Client (navigateur)
  ├── Mode browser (défaut) : Web Speech API STT + speechSynthesis TTS
  └── Mode server : MediaRecorder → POST /audio-turn → Whisper STT → LLM → OpenAI TTS → base64 audio
```

## État production actuel (2026-03-15, post-hardening)

- **SHA déployé** : `98ebe5f` (PR #41 — hardening observability)
- **Mode actif** : `browser` (ORAL_VOICE_MODE absent)
- **OPENAI_API_KEY** : vide en prod — le mode server est inopérant sans cette clé
- **Code server** : déployé et prêt, mais inactif
- **Observabilité** : `/api/v1/health` expose `release.gitSha`, `release.buildTime`, `voice.requestedVoiceMode`, `voice.effectiveVoiceMode`

## Variables d'environnement

| Variable | Valeurs | Défaut | Pré-requis |
|---|---|---|---|
| `ORAL_VOICE_MODE` | `browser` / `server` / `auto` | absent = `browser` | — |
| `OPENAI_API_KEY` | clé API OpenAI | — | **obligatoire** pour mode server |
| `OPENAI_TTS_MODEL` | `tts-1` / `tts-1-hd` | `tts-1` | OPENAI_API_KEY |
| `OPENAI_TTS_VOICE` | `alloy` / `echo` / `fable` / `onyx` / `nova` / `shimmer` | `alloy` | OPENAI_API_KEY |
| `OPENAI_STT_MODEL` | `whisper-1` | `whisper-1` | OPENAI_API_KEY |

## Distinction requestedVoiceMode / effectiveVoiceMode

| Concept | Source | Signification |
|---|---|---|
| `requestedVoiceMode` | Variable `ORAL_VOICE_MODE` | Ce que l'opérateur demande (`browser`, `server`, `auto`) |
| `effectiveVoiceMode` | Calcul runtime | Ce que le système utilise réellement (browser si STT indisponible) |

Le front-end se base **uniquement sur `effectiveVoiceMode`** pour choisir le pipeline vocal.
Ceci empêche l'activation silencieuse du mode serveur quand STT est indisponible.

Visible dans :
- `/api/v1/health` → `voice.requestedVoiceMode` / `voice.effectiveVoiceMode`
- `/api/v1/oral/capabilities` → mêmes champs

## Checks quotidiens

1. **Santé** : `curl -s https://eaf.nexusreussite.academy/api/v1/health` → vérifier `status:"ok"`, `release.gitSha`, `voice.effectiveVoiceMode`
2. **PM2** : `pm2 list | grep eaf` — vérifier que les 3 processus EAF sont `online`
3. **Logs erreurs** : `pm2 logs eaf-nextjs --lines 50 --nostream | grep -i error`
4. **Sessions orales** : vérifier qu'aucune session ne reste en `PASSAGE_RUNNING` > 1h

Si mode server actif :
5. **Coûts OpenAI** : vérifier le dashboard OpenAI pour Whisper/TTS
6. **Fallback rate** : `pm2 logs eaf-nextjs --nostream | grep 'audio-turn.fallback' | wc -l`
7. **Latence** : `pm2 logs eaf-nextjs --nostream | grep 'audio-turn.completed'` → vérifier `totalLatencyMs`
8. **Erreurs STT** : `pm2 logs eaf-nextjs --nostream | grep 'audio-turn.stt.error' | wc -l`

## Symptomes critiques et actions

| Symptome | Cause probable | Action |
|---|---|---|
| `fallbackToWebSpeech: true` systématique | OPENAI_API_KEY invalide, vide, ou quota dépassé | Vérifier la clé, le quota OpenAI |
| Latence audio-turn > 20s | Whisper surchargé ou timeout réseau | Rollback vers browser |
| Erreur 413 fréquente | Audio > 25 Mo (sessions très longues) | Normal, ajuster MAX_AUDIO_SIZE si nécessaire |
| Erreur 429 fréquente | Rate limiter LLM atteint | Vérifier les seuils dans `llm-rate-limiter.ts` |
| TTS silencieux (pas d'audio jury) | `generateTtsAudio` retourne null | Vérifier OPENAI_API_KEY ou revenir en browser |
| Coûts API anormaux | Sessions massives ou boucle | Rollback vers browser immédiatement |
| Processus non-EAF impactés | Problème de déploiement | **Ne jamais toucher** brevet-master, journey-web, mf-backend, mfai-main |

## Seuils d'alerte

- Latence p95 audio-turn > 15s : investigation
- Latence p95 audio-turn > 30s : rollback vers browser
- Taux de fallback STT > 20% : investigation
- Coût OpenAI quotidien > seuil budgétaire : rollback vers browser

## Protocole d'activation du mode serveur vocal

### Prérequis obligatoires (go/no-go)

| # | Prérequis | Comment vérifier | Bloquant ? |
|---|---|---|---|
| 1 | `OPENAI_API_KEY` valide | `curl https://api.openai.com/v1/models -H "Authorization: Bearer $KEY"` → 200 | OUI |
| 2 | Budget API Whisper/TTS validé par le product owner | Accord écrit (email/Slack) | OUI |
| 3 | Seuil budgétaire quotidien défini | Montant convenu en euros/jour | OUI |
| 4 | Personne responsable identifiée | Nom + moyen de contact d'urgence | OUI |
| 5 | Logs accessibles pour monitoring | `pm2 logs eaf-nextjs --lines 5` fonctionne | OUI |
| 6 | Health endpoint opérationnel | `/api/v1/health` → `status: "ok"` | OUI |

### Variables d'environnement requises

```env
# Dans /opt/eaf_platform/.env
OPENAI_API_KEY=sk-...            # Clé API OpenAI valide
ORAL_VOICE_MODE=server           # Ou "auto" pour laisser le système décider
OPENAI_TTS_MODEL=tts-1           # Optionnel (défaut: tts-1)
OPENAI_TTS_VOICE=alloy           # Optionnel (défaut: alloy)
```

### Procédure d'activation pas à pas

```bash
# ═══════════════════════════════════════════════════
# ACTIVATION MODE SERVEUR VOCAL — CHECKLIST OPÉRATEUR
# ═══════════════════════════════════════════════════

# 0. Vérifier l'état actuel
curl -s https://eaf.nexusreussite.academy/api/v1/health | python3 -m json.tool
# → doit afficher status:"ok", effectiveVoiceMode:"browser"

# 1. Ajouter la clé OpenAI (si pas déjà fait)
ssh root@88.99.254.59
cd /opt/eaf_platform
# ATTENTION : ne jamais copier la clé dans un terminal partagé ou un log
echo 'OPENAI_API_KEY=sk-...' >> .env

# 2. Activer le mode serveur
echo 'ORAL_VOICE_MODE=server' >> .env

# 3. Redémarrer le processus (delete+start OBLIGATOIRE, pas restart)
pm2 delete eaf-nextjs
pm2 start ecosystem.config.cjs --only eaf-nextjs --env production
pm2 save

# 4. Attendre 5s que le processus démarre
sleep 5

# 5. Vérifier que les env vars sont chargées
pm2 env $(pm2 id eaf-nextjs) | grep ORAL_VOICE_MODE
# → doit afficher : ORAL_VOICE_MODE: server

# 6. Vérifier le health endpoint
curl -s https://eaf.nexusreussite.academy/api/v1/health | python3 -m json.tool
# → doit afficher :
#   requestedVoiceMode: "server"
#   effectiveVoiceMode: "server"
#   sttAvailable: true
#   ttsAvailable: true

# Si effectiveVoiceMode reste "browser" alors que requestedVoiceMode est "server" :
# → la clé OpenAI est absente, invalide, ou le provider STT est indisponible
# → NE PAS continuer. Diagnostiquer d'abord.
```

### Vérification immédiate post-activation

```bash
# 7. Smoke test fonctionnel (depuis un navigateur)
# a) Ouvrir https://eaf.nexusreussite.academy/atelier-oral
# b) Démarrer une session orale
# c) Vérifier que le label affiche "Mode vocal serveur"
# d) Enregistrer un audio de 5-10 secondes via le micro
# e) Soumettre : le transcript doit revenir du serveur (pas de fallback)
# f) L'audio jury doit être audible (pas le speechSynthesis du navigateur)
# g) Vérifier les logs : pm2 logs eaf-nextjs --lines 20 --nostream
#    → chercher "audio-turn.completed" avec sttOk:true, ttsOk:true
```

### Canary : test sur périmètre réduit

Avant d'annoncer publiquement le mode serveur :
1. Tester avec 1-2 utilisateurs internes pendant 24h
2. Surveiller les logs : `pm2 logs eaf-nextjs --nostream | grep audio-turn`
3. Vérifier qu'aucun `audio-turn.fallback` n'apparaît
4. Mesurer la latence via les logs (`totalLatencyMs`)
5. Vérifier le coût OpenAI sur le dashboard après 24h

### Indicateurs à mesurer pendant 24h

| Indicateur | Log pattern | Seuil alerte | Seuil rollback |
|---|---|---|---|
| Latence STT | `audio-turn.completed` → `sttLatencyMs` | > 10s | > 30s |
| Latence TTS | `audio-turn.completed` → `ttsLatencyMs` | > 8s | > 20s |
| Latence totale | `audio-turn.completed` → `totalLatencyMs` | > 15s | > 30s |
| Taux fallback | `audio-turn.fallback` vs `audio-turn.completed` | > 10% | > 30% |
| Erreurs STT | `audio-turn.stt.error` count | > 5/h | > 20/h |
| Erreurs TTS | `audio-turn.tts.error` count | > 5/h | > 20/h |
| Coût quotidien | Dashboard OpenAI | > 50% budget | > budget |
| Taille audio | `audio-turn.completed` → `audioSizeBytes` | > 10 MB | > 20 MB |

### Conditions go / no-go pour maintien du mode serveur

**GO** (maintenir le mode serveur) :
- Latence totale p95 < 15s
- Taux de fallback < 10%
- Coût quotidien < budget validé
- Aucune plainte utilisateur sur la qualité de transcription
- Aucun incident de confidentialité

**NO-GO** (rollback immédiat vers browser) :
- Latence totale p95 > 30s pendant > 10 minutes
- Taux de fallback > 30%
- Coût quotidien dépassant le budget
- Erreur 429 (rate limit OpenAI) récurrente
- Incident de confidentialité suspecté

### Procédure de rollback vers browser (< 2 minutes)

```bash
# Étape 1 — Retirer la variable
cd /opt/eaf_platform
sed -i '/^ORAL_VOICE_MODE/d' .env

# Étape 2 — Redémarrer (delete+start obligatoire pour rafraîchir l'env PM2)
pm2 delete eaf-nextjs
pm2 start ecosystem.config.cjs --only eaf-nextjs --env production
pm2 save

# Étape 3 — Vérifier
pm2 env $(pm2 id eaf-nextjs) | grep ORAL_VOICE_MODE
# Ne doit rien afficher

# Étape 4 — Vérifier le health endpoint
curl -s https://eaf.nexusreussite.academy/api/v1/health | python3 -m json.tool
# → effectiveVoiceMode doit être "browser"
```

**ATTENTION** : `pm2 restart` seul ne suffit PAS pour changer les env vars.
Il faut `pm2 delete` + `pm2 start` pour que l'ecosystem config relise le `.env`.

### Wording commercial autorisé après activation du mode serveur

- "Simulation orale avec transcription automatique par intelligence artificielle"
- "Votre audio est transcrit par un service IA, puis immédiatement supprimé"
- "Feedback vocal du jury par synthèse vocale"
- "Mode vocal serveur avec transcription IA (Whisper)"

### Wording interdit même après activation

- "Oral temps réel" → le système est tour par tour, pas temps réel
- "Correction instantanée" → latence LLM 3-10s minimum
- "Conversation naturelle avec le jury" → semi-duplex, pas duplex
- "Voix humaine de l'examinateur" → synthèse vocale (TTS)
- "Aucun audio envoyé à nos serveurs" → faux en mode serveur
- "Premium vocal" si effectiveVoiceMode est browser → mensonger

## Traçabilité déploiement

Le script `scripts/deploy.sh` injecte `BUILD_GIT_SHA` au moment du build serveur (car `.git` est absent sur le serveur après rsync).
Le SHA est ensuite visible dans `/api/v1/health` → `release.gitSha`.

Pour vérifier que le bon code est déployé :
```bash
curl -s https://eaf.nexusreussite.academy/api/v1/health | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'SHA: {d[\"release\"][\"gitSha\"]}  Build: {d[\"release\"][\"buildTime\"]}')"
```

