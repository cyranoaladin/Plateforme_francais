#!/usr/bin/env bash
# ==============================================================================
# oral_voice_preflight.sh — Pre-flight check before server voice mode activation
#
# Usage: ./ops/oral_voice_preflight.sh [domain]
#   domain defaults to eaf.nexusreussite.academy
#
# Run this ON THE SERVER before activating ORAL_VOICE_MODE=server.
# It verifies all prerequisites and outputs a clear GO / NO-GO verdict.
# ==============================================================================
set -euo pipefail

DOMAIN="${1:-eaf.nexusreussite.academy}"
HEALTH_URL="https://$DOMAIN/api/v1/health"
APP_DIR="/opt/eaf_platform"
FAIL=0
WARN=0

echo "============================================"
echo "  Oral Voice Server — Pre-flight Check"
echo "  Target: $DOMAIN"
echo "  Date:   $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "============================================"
echo ""

# ── 1. Health endpoint ──
echo -n "[1/8] Health endpoint... "
HEALTH=$(curl -sf "$HEALTH_URL" 2>/dev/null) || { echo "FAIL (unreachable)"; FAIL=$((FAIL+1)); HEALTH="{}"; }
STATUS=$(echo "$HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status','?'))" 2>/dev/null || echo "?")
if [ "$STATUS" = "ok" ]; then
  echo "OK (status: $STATUS)"
else
  echo "FAIL (status: $STATUS)"
  FAIL=$((FAIL+1))
fi

# ── 2. Release metadata ──
echo -n "[2/8] Release metadata... "
GIT_SHA=$(echo "$HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('release',{}).get('gitSha','?'))" 2>/dev/null || echo "?")
BUILD_TIME=$(echo "$HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('release',{}).get('buildTime','?'))" 2>/dev/null || echo "?")
if [ "$GIT_SHA" != "?" ] && [ "$GIT_SHA" != "unknown" ] && [ "$BUILD_TIME" != "?" ]; then
  echo "OK (SHA: $GIT_SHA, built: $BUILD_TIME)"
else
  echo "WARN (SHA: $GIT_SHA, built: $BUILD_TIME)"
  WARN=$((WARN+1))
fi

# ── 3. Current voice mode ──
echo -n "[3/8] Current voice mode... "
REQ_MODE=$(echo "$HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('voice',{}).get('requestedVoiceMode','?'))" 2>/dev/null || echo "?")
EFF_MODE=$(echo "$HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('voice',{}).get('effectiveVoiceMode','?'))" 2>/dev/null || echo "?")
echo "requested=$REQ_MODE, effective=$EFF_MODE"
if [ "$REQ_MODE" = "server" ] && [ "$EFF_MODE" = "browser" ]; then
  echo "       !! ORAL_VOICE_MODE=server but effective=browser — STT likely unavailable"
  FAIL=$((FAIL+1))
fi

# ── 4. PM2 EAF processes ──
echo -n "[4/8] PM2 EAF processes... "
if command -v pm2 &>/dev/null; then
  NEXTJS_STATUS=$(pm2 jlist 2>/dev/null | python3 -c "import sys,json; procs=json.load(sys.stdin); matches=[p for p in procs if p['name']=='eaf-nextjs']; print(matches[0]['pm2_env']['status'] if matches else 'not_found')" 2>/dev/null || echo "unknown")
  if [ "$NEXTJS_STATUS" = "online" ]; then
    echo "OK (eaf-nextjs: online)"
  else
    echo "FAIL (eaf-nextjs: $NEXTJS_STATUS)"
    FAIL=$((FAIL+1))
  fi
else
  echo "SKIP (pm2 not found — run this on the server)"
  WARN=$((WARN+1))
fi

# ── 5. OPENAI_API_KEY presence ──
echo -n "[5/8] OPENAI_API_KEY in .env... "
if [ -f "$APP_DIR/.env" ]; then
  if grep -q "^OPENAI_API_KEY=.\+" "$APP_DIR/.env" 2>/dev/null; then
    # Check it's not empty or placeholder
    KEY_LEN=$(grep "^OPENAI_API_KEY=" "$APP_DIR/.env" | cut -d= -f2 | tr -d '[:space:]' | wc -c)
    if [ "$KEY_LEN" -gt 10 ]; then
      echo "OK (key present, ${KEY_LEN} chars — NOT displayed)"
    else
      echo "FAIL (key too short or empty)"
      FAIL=$((FAIL+1))
    fi
  else
    echo "ABSENT — server voice mode NOT activable"
    FAIL=$((FAIL+1))
  fi
else
  echo "FAIL (.env not found at $APP_DIR/.env)"
  FAIL=$((FAIL+1))
fi

# ── 6. STT/TTS availability from health ──
echo -n "[6/8] STT/TTS availability... "
STT_AVAIL=$(echo "$HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('voice',{}).get('sttAvailable',False))" 2>/dev/null || echo "?")
TTS_AVAIL=$(echo "$HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('voice',{}).get('ttsAvailable',False))" 2>/dev/null || echo "?")
echo "STT=$STT_AVAIL, TTS=$TTS_AVAIL"
if [ "$STT_AVAIL" = "False" ] && [ "$REQ_MODE" != "browser" ]; then
  echo "       !! STT unavailable — server mode will fall back to browser"
  WARN=$((WARN+1))
fi

# ── 7. ORAL_VOICE_MODE env var in .env ──
echo -n "[7/8] ORAL_VOICE_MODE in .env... "
if [ -f "$APP_DIR/.env" ]; then
  ENV_MODE=$(grep "^ORAL_VOICE_MODE=" "$APP_DIR/.env" 2>/dev/null | cut -d= -f2 | tr -d '[:space:]' || echo "absent")
  if [ -z "$ENV_MODE" ]; then
    echo "absent (= browser default)"
  else
    echo "$ENV_MODE"
  fi
else
  echo "SKIP (.env not found)"
fi

# ── 8. Disk space ──
echo -n "[8/8] Disk space... "
if command -v df &>/dev/null; then
  DISK_PCT=$(df "$APP_DIR" 2>/dev/null | awk 'NR==2{print $5}' | tr -d '%' || echo "0")
  if [ "$DISK_PCT" -lt 90 ]; then
    echo "OK (${DISK_PCT}% used)"
  else
    echo "WARN (${DISK_PCT}% used — low disk)"
    WARN=$((WARN+1))
  fi
else
  echo "SKIP"
fi

echo ""
echo "============================================"
if [ "$FAIL" -gt 0 ]; then
  echo "  VERDICT: NO-GO ($FAIL failure(s), $WARN warning(s))"
  echo "  Server voice mode is NOT activable."
  echo "============================================"
  exit 1
elif [ "$WARN" -gt 0 ]; then
  echo "  VERDICT: CONDITIONAL GO ($WARN warning(s))"
  echo "  Review warnings before proceeding."
  echo "============================================"
  exit 0
else
  echo "  VERDICT: GO — Canary activation is safe to proceed."
  echo "============================================"
  exit 0
fi
