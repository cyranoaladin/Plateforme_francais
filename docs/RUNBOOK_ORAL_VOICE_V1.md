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
6. **Fallback rate** : chercher `audio-turn.stt.error` dans les logs

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

## Procédure d'activation du mode serveur (opt-in)

```bash
# Pré-requis OBLIGATOIRES :
# 1. OPENAI_API_KEY valide et configurée dans /opt/eaf_platform/.env
# 2. Budget API Whisper/TTS validé avec le product owner
# 3. Monitoring des coûts en place

# Étape 1 — Ajouter les variables
echo 'ORAL_VOICE_MODE=server' >> /opt/eaf_platform/.env
# Si pas encore fait :
# echo 'OPENAI_API_KEY=sk-...' >> /opt/eaf_platform/.env

# Étape 2 — Redémarrer (delete+start pour refresh env)
cd /opt/eaf_platform
pm2 delete eaf-nextjs
pm2 start ecosystem.config.cjs --only eaf-nextjs --env production
pm2 save

# Étape 3 — Vérifier
pm2 env $(pm2 id eaf-nextjs) | grep ORAL_VOICE_MODE
# Doit afficher : ORAL_VOICE_MODE: server

# Étape 4 — Smoke test
# Ouvrir /atelier-oral, démarrer une session, vérifier que :
# - Le micro enregistre via MediaRecorder (pas Web Speech)
# - Le transcript revient du serveur (pas de "fallbackToWebSpeech")
# - L'audio jury est audible
# - Le message de confidentialité mentionne "OpenAI Whisper"
```

## Procédure de rollback vers browser

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

# Étape 4 — Smoke test
curl -s https://eaf.nexusreussite.academy/api/v1/health
# Doit retourner {"status":"ok"}
```

Temps de rollback : < 2 minutes.

**ATTENTION** : `pm2 restart` seul ne suffit PAS pour changer les env vars.
Il faut `pm2 delete` + `pm2 start` pour que l'ecosystem config relise le `.env`.

## Traçabilité déploiement

Le script `scripts/deploy.sh` injecte `BUILD_GIT_SHA` au moment du build serveur (car `.git` est absent sur le serveur après rsync).
Le SHA est ensuite visible dans `/api/v1/health` → `release.gitSha`.

Pour vérifier que le bon code est déployé :
```bash
curl -s https://eaf.nexusreussite.academy/api/v1/health | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'SHA: {d[\"release\"][\"gitSha\"]}  Build: {d[\"release\"][\"buildTime\"]}')"
```

## Ce qu'il ne faut JAMAIS promettre commercialement

- "oral temps réel" → le système est tour par tour, pas temps réel
- "correction instantanée" → latence LLM 3-10s minimum
- "conversation naturelle avec le jury" → semi-duplex, pas duplex
- "voix humaine de l'examinateur" → synthèse vocale (TTS)
- "aucun audio envoyé à nos serveurs" quand mode server est actif → l'audio transite par OpenAI Whisper
