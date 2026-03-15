# Canary Business — Activation Mode Vocal Serveur

## But du canary

Valider en conditions réelles que le pipeline vocal serveur (Whisper STT + LLM + OpenAI TTS)
fonctionne correctement, avec une qualité acceptable, un coût maîtrisé et une expérience
utilisateur cohérente, avant de l'ouvrir à l'ensemble des utilisateurs.

## Prérequis obligatoires

| # | Prérequis | Responsable | Vérifié ? |
|---|---|---|---|
| 1 | Clé OpenAI valide provisionnée dans `.env` | Ops / CTO | |
| 2 | Budget quotidien API défini et validé (Whisper + TTS) | Product owner | |
| 3 | Accès dashboard OpenAI pour monitoring coûts | Ops | |
| 4 | Pre-flight check passé (ops/oral_voice_preflight.sh) | Ops | |
| 5 | Contact urgence identifié pour rollback | Ops / CTO | |
| 6 | Utilisateurs canary identifiés (internes) | Product owner | |

## Budget à valider

Estimation de coût par session orale complète (4 phases) :

| Service | Coût estimé par phase | x4 phases |
|---|---|---|
| Whisper STT (~30s audio) | ~0.005 USD | ~0.02 USD |
| LLM évaluation | ~0.01-0.05 USD | ~0.04-0.20 USD |
| OpenAI TTS (~200 mots feedback) | ~0.003 USD | ~0.012 USD |
| **Total par session** | | **~0.07-0.23 USD** |

Pour 10 sessions/jour en canary : **~0.7-2.3 USD/jour**.

Seuil d'alerte recommandé : **5 USD/jour**.
Seuil de rollback recommandé : **10 USD/jour**.

## Durée recommandée du canary

**5 jours ouvrés** (1 semaine business).

## Nombre d'utilisateurs recommandé

**2-5 utilisateurs internes** identifiés par le product owner.
Pas d'ouverture publique pendant le canary.

## Procédure d'activation

```bash
# 1. Sur le serveur, lancer le pre-flight
cd /opt/eaf_platform
bash ops/oral_voice_preflight.sh

# 2. Si GO, ajouter ORAL_VOICE_MODE=server dans .env
echo 'ORAL_VOICE_MODE=server' >> .env

# 3. Redémarrer (delete+start obligatoire)
pm2 delete eaf-nextjs
pm2 start ecosystem.config.cjs --only eaf-nextjs --env production
pm2 save

# 4. Vérifier
curl -s https://eaf.nexusreussite.academy/api/v1/health | python3 -m json.tool
# → effectiveVoiceMode: "server", sttAvailable: true
```

## Critères GO (maintenir le canary)

- Health endpoint : `status: "ok"`, `effectiveVoiceMode: "server"`
- Latence totale audio-turn < 15s (p95)
- Taux de fallback < 10%
- Coût quotidien < budget validé
- Aucune plainte utilisateur sur la qualité
- Aucun incident de confidentialité
- `ops/oral_voice_canary_check.sh` retourne OK

## Critères ROLLBACK (arrêter immédiatement)

- Latence totale > 30s pendant > 10 minutes consécutives
- Taux de fallback > 30%
- Coût quotidien dépassant le seuil convenu
- Erreurs STT > 20/heure
- Rate limit OpenAI (429) récurrent
- Incident de confidentialité suspecté
- Demande du product owner ou du CTO

## Procédure de rollback (< 2 minutes)

```bash
cd /opt/eaf_platform
sed -i '/^ORAL_VOICE_MODE/d' .env
pm2 delete eaf-nextjs
pm2 start ecosystem.config.cjs --only eaf-nextjs --env production
pm2 save
curl -s https://eaf.nexusreussite.academy/api/v1/health | python3 -m json.tool
# → effectiveVoiceMode: "browser"
```

## Monitoring quotidien pendant le canary

```bash
# Lancer depuis le serveur
bash ops/oral_voice_canary_check.sh
```

Vérifier aussi le dashboard OpenAI pour les coûts réels.

## Message support en cas d'échec utilisateur

Si un utilisateur canary rencontre le message "Transcription serveur indisponible" :

> "Le service de transcription vocale IA est temporairement indisponible.
> Votre navigateur prend le relais automatiquement pour la reconnaissance vocale.
> L'expérience reste fonctionnelle. Nous investiguons le problème."

## Wording commercial autorisé pendant le canary

- "Nous testons une transcription vocale améliorée par IA"
- "Fonctionnalité en phase de test interne"
- "Votre audio est transcrit par un service IA, puis immédiatement supprimé"

## Wording interdit pendant le canary

- "Nouveau : oral temps réel avec IA" (faux — tour par tour)
- "Correction instantanée" (faux — latence 5-15s)
- "Conversation naturelle avec le jury" (faux — semi-duplex)
- "Voix humaine de l'examinateur" (faux — synthèse TTS)
- "Premium vocal" (pas encore validé comme offre)
- "Aucun audio envoyé au serveur" (faux en mode server)
