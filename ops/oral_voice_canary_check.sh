#!/usr/bin/env bash
# ==============================================================================
# oral_voice_canary_check.sh — Post-activation canary health check
#
# Usage: ./ops/oral_voice_canary_check.sh [domain] [log-lines]
#   domain defaults to eaf.nexusreussite.academy
#   log-lines defaults to 200
#
# Run this ON THE SERVER after activating server voice mode.
# It checks health, voice mode, and recent audio-turn log patterns.
# ==============================================================================
set -euo pipefail

DOMAIN="${1:-eaf.nexusreussite.academy}"
LOG_LINES="${2:-200}"
HEALTH_URL="https://$DOMAIN/api/v1/health"
ISSUES=0

echo "============================================"
echo "  Oral Voice Canary — Health Check"
echo "  Target: $DOMAIN"
echo "  Date:   $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "============================================"
echo ""

# ── 1. Health endpoint ──
echo -n "[1/4] Health endpoint... "
HEALTH=$(curl -sf "$HEALTH_URL" 2>/dev/null) || { echo "FAIL"; ISSUES=$((ISSUES+1)); HEALTH="{}"; }
STATUS=$(echo "$HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status','?'))" 2>/dev/null || echo "?")
[ "$STATUS" = "ok" ] && echo "OK" || { echo "FAIL (status: $STATUS)"; ISSUES=$((ISSUES+1)); }

# ── 2. Voice mode ──
echo -n "[2/4] Voice mode... "
REQ=$(echo "$HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('voice',{}).get('requestedVoiceMode','?'))" 2>/dev/null)
EFF=$(echo "$HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('voice',{}).get('effectiveVoiceMode','?'))" 2>/dev/null)
STT=$(echo "$HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('voice',{}).get('sttAvailable','?'))" 2>/dev/null)
TTS=$(echo "$HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('voice',{}).get('ttsAvailable','?'))" 2>/dev/null)
echo "requested=$REQ effective=$EFF stt=$STT tts=$TTS"

if [ "$REQ" = "server" ] && [ "$EFF" = "browser" ]; then
  echo "       !! Server requested but effective=browser — STT unavailable"
  ISSUES=$((ISSUES+1))
fi
if [ "$REQ" = "server" ] && [ "$EFF" = "server" ] && [ "$STT" = "True" ]; then
  echo "       Server mode is ACTIVE and STT available"
fi

# ── 3. PM2 status ──
echo -n "[3/4] PM2 eaf-nextjs... "
if command -v pm2 &>/dev/null; then
  PM2_STATUS=$(pm2 jlist 2>/dev/null | python3 -c "import sys,json; procs=json.load(sys.stdin); matches=[p for p in procs if p['name']=='eaf-nextjs']; print(matches[0]['pm2_env']['status'] if matches else 'missing')" 2>/dev/null || echo "?")
  echo "$PM2_STATUS"
  [ "$PM2_STATUS" != "online" ] && ISSUES=$((ISSUES+1))
else
  echo "SKIP (run on server)"
fi

# ── 4. Audio-turn log analysis ──
echo ""
echo "[4/4] Audio-turn log analysis (last $LOG_LINES lines)..."
if command -v pm2 &>/dev/null; then
  LOGS=$(pm2 logs eaf-nextjs --lines "$LOG_LINES" --nostream 2>/dev/null || echo "")

  COMPLETED=$(echo "$LOGS" | grep -c "audio-turn.completed" 2>/dev/null || echo "0")
  FALLBACKS=$(echo "$LOGS" | grep -c "audio-turn.fallback" 2>/dev/null || echo "0")
  STT_ERRORS=$(echo "$LOGS" | grep -c "audio-turn.stt.error" 2>/dev/null || echo "0")
  TTS_ERRORS=$(echo "$LOGS" | grep -c "audio-turn.tts.error" 2>/dev/null || echo "0")

  echo "  Completed:  $COMPLETED"
  echo "  Fallbacks:  $FALLBACKS"
  echo "  STT errors: $STT_ERRORS"
  echo "  TTS errors: $TTS_ERRORS"

  TOTAL=$((COMPLETED + FALLBACKS))
  if [ "$TOTAL" -gt 0 ]; then
    FALLBACK_PCT=$((FALLBACKS * 100 / TOTAL))
    echo "  Fallback rate: ${FALLBACK_PCT}%"
    [ "$FALLBACK_PCT" -gt 30 ] && { echo "  !! Fallback rate > 30% — ROLLBACK RECOMMENDED"; ISSUES=$((ISSUES+1)); }
    [ "$FALLBACK_PCT" -gt 10 ] && [ "$FALLBACK_PCT" -le 30 ] && echo "  !! Fallback rate > 10% — investigate"
  else
    echo "  No audio-turn activity yet (expected if canary just started)"
  fi

  if [ "$STT_ERRORS" -gt 5 ]; then
    echo "  !! High STT error count — investigate"
    ISSUES=$((ISSUES+1))
  fi
else
  echo "  SKIP (pm2 not found — run on server)"
fi

echo ""
echo "============================================"
if [ "$ISSUES" -gt 0 ]; then
  echo "  VERDICT: DEGRADED / ROLLBACK RECOMMENDED"
  echo "  $ISSUES issue(s) found."
else
  echo "  VERDICT: OK — Canary is healthy."
fi
echo "============================================"
exit "$ISSUES"
