#!/usr/bin/env bash
# ==============================================================================
# rag-diagnostic.sh — Diagnose RAG pipeline on production server
# Run ON the server: bash /opt/eaf_platform/scripts/rag-diagnostic.sh
# ==============================================================================
set -euo pipefail

RAG_URL="${RAG_API_URL:-http://127.0.0.1:18001}"
RAG_TOKEN="${RAG_API_TOKEN:-}"
CHROMA_URL="${CHROMA_URL:-http://127.0.0.1:8000}"
COLLECTION="${RAG_COLLECTION:-rag_francais_premiere}"

echo "═══════════════════════════════════════════"
echo "  RAG DIAGNOSTIC — $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "═══════════════════════════════════════════"
echo ""

# --- 1. Check services ---
echo "[1/8] Services status..."
echo -n "  Ingestor ($RAG_URL): "
if curl -sf -o /dev/null --max-time 3 "$RAG_URL/health"; then
  echo "✅ UP"
else
  echo "❌ DOWN"
fi

echo -n "  ChromaDB ($CHROMA_URL): "
if curl -sf -o /dev/null --max-time 3 "$CHROMA_URL/api/v1/heartbeat"; then
  echo "✅ UP"
else
  echo "❌ DOWN"
fi

# --- 2. Check token ---
echo ""
echo "[2/8] Auth token..."
if [ -z "$RAG_TOKEN" ]; then
  echo "  ❌ RAG_API_TOKEN is EMPTY — loading from .env..."
  if [ -f /opt/eaf_platform/.env ]; then
    RAG_TOKEN=$(grep -m1 '^RAG_API_TOKEN=' /opt/eaf_platform/.env | cut -d= -f2- || true)
  fi
  if [ -z "$RAG_TOKEN" ]; then
    echo "  ❌ Not found in .env either. Token missing!"
  else
    echo "  ✅ Loaded from .env (${#RAG_TOKEN} chars)"
  fi
else
  echo "  ✅ Token set (${#RAG_TOKEN} chars)"
fi

AUTH_HEADER=""
if [ -n "$RAG_TOKEN" ]; then
  AUTH_HEADER="-H Authorization:\ Bearer\ $RAG_TOKEN"
fi

# --- 3. Health endpoint ---
echo ""
echo "[3/8] Ingestor /health response..."
HEALTH=$(curl -sf --max-time 5 -H "Authorization: Bearer $RAG_TOKEN" "$RAG_URL/health" 2>/dev/null || echo "FAILED")
echo "  $HEALTH"

# --- 4. Collections ---
echo ""
echo "[4/8] Collections..."
COLLECTIONS=$(curl -sf --max-time 5 -H "Authorization: Bearer $RAG_TOKEN" "$RAG_URL/collections" 2>/dev/null || echo "FAILED")
echo "  $COLLECTIONS"

# --- 5. Stats ---
echo ""
echo "[5/8] Collection stats ($COLLECTION)..."
STATS=$(curl -sf --max-time 10 -H "Authorization: Bearer $RAG_TOKEN" "$RAG_URL/stats/$COLLECTION" 2>/dev/null || echo "FAILED")
echo "  $STATS"

# --- 6. ChromaDB direct query ---
echo ""
echo "[6/8] ChromaDB direct — list collections..."
CHROMA_COLS=$(curl -sf --max-time 5 "$CHROMA_URL/api/v1/collections" 2>/dev/null || echo "FAILED")
echo "  $CHROMA_COLS" | python3 -c "import sys,json; cols=json.load(sys.stdin); [print(f'  {c[\"name\"]}: {c.get(\"metadata\",{})}') for c in cols]" 2>/dev/null || echo "  $CHROMA_COLS"

# --- 7. Search tests (various payload formats) ---
echo ""
echo "[7/8] Search tests..."

echo "  --- Test A: field 'q', no filters ---"
RESULT_A=$(curl -sf --max-time 10 \
  -H "Authorization: Bearer $RAG_TOKEN" \
  -H "Content-Type: application/json" \
  -X POST "$RAG_URL/search" \
  -d "{\"q\":\"Phèdre Racine tragédie\",\"collection\":\"$COLLECTION\",\"k\":3}" 2>/dev/null || echo "FAILED")
echo "  $RESULT_A" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  Results: {len(d.get(\"results\",d.get(\"hits\",[])))} | Keys: {list(d.keys())}')" 2>/dev/null || echo "  Raw: ${RESULT_A:0:500}"

echo ""
echo "  --- Test B: field 'query', no filters ---"
RESULT_B=$(curl -sf --max-time 10 \
  -H "Authorization: Bearer $RAG_TOKEN" \
  -H "Content-Type: application/json" \
  -X POST "$RAG_URL/search" \
  -d "{\"query\":\"Phèdre Racine tragédie\",\"collection\":\"$COLLECTION\",\"top_k\":3}" 2>/dev/null || echo "FAILED")
echo "  $RESULT_B" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  Results: {len(d.get(\"results\",d.get(\"hits\",[])))} | Keys: {list(d.keys())}')" 2>/dev/null || echo "  Raw: ${RESULT_B:0:500}"

echo ""
echo "  --- Test C: field 'q' WITH matiere filter ---"
RESULT_C=$(curl -sf --max-time 10 \
  -H "Authorization: Bearer $RAG_TOKEN" \
  -H "Content-Type: application/json" \
  -X POST "$RAG_URL/search" \
  -d "{\"q\":\"Phèdre Racine\",\"collection\":\"$COLLECTION\",\"k\":3,\"filters\":{\"matiere\":\"Français\"}}" 2>/dev/null || echo "FAILED")
echo "  $RESULT_C" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  Results: {len(d.get(\"results\",d.get(\"hits\",[])))} | Keys: {list(d.keys())}')" 2>/dev/null || echo "  Raw: ${RESULT_C:0:500}"

echo ""
echo "  --- Test D: NO auth header ---"
RESULT_D=$(curl -sf --max-time 10 \
  -H "Content-Type: application/json" \
  -X POST "$RAG_URL/search" \
  -d "{\"q\":\"Phèdre Racine\",\"collection\":\"$COLLECTION\",\"k\":3}" 2>/dev/null || echo "FAILED")
echo "  $RESULT_D" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  Results: {len(d.get(\"results\",d.get(\"hits\",[])))} | Keys: {list(d.keys())}')" 2>/dev/null || echo "  Raw: ${RESULT_D:0:500}"

echo ""
echo "  --- Test E: /rag/query endpoint ---"
RESULT_E=$(curl -sf --max-time 10 \
  -H "Authorization: Bearer $RAG_TOKEN" \
  -H "Content-Type: application/json" \
  -X POST "$RAG_URL/rag/query" \
  -d "{\"query\":\"Phèdre Racine tragédie\",\"collection\":\"$COLLECTION\",\"top_k\":3}" 2>/dev/null || echo "FAILED")
echo "  $RESULT_E" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  Keys: {list(d.keys())} | Answer len: {len(d.get(\"answer\",\"\"))}')" 2>/dev/null || echo "  Raw: ${RESULT_E:0:500}"

# --- 8. ChromaDB direct search ---
echo ""
echo "[8/8] ChromaDB DIRECT search (bypass ingestor)..."

# Get collection ID first
COLLECTION_ID=$(curl -sf --max-time 5 "$CHROMA_URL/api/v1/collections" 2>/dev/null | python3 -c "
import sys, json
cols = json.load(sys.stdin)
for c in cols:
    if c['name'] == '$COLLECTION':
        print(c['id'])
        break
" 2>/dev/null || echo "")

if [ -n "$COLLECTION_ID" ]; then
  echo "  Collection ID: $COLLECTION_ID"

  # Get count
  COUNT=$(curl -sf --max-time 5 "$CHROMA_URL/api/v1/collections/$COLLECTION_ID/count" 2>/dev/null || echo "?")
  echo "  Document count: $COUNT"

  # Peek at first doc
  echo "  --- First document peek ---"
  PEEK=$(curl -sf --max-time 10 \
    -H "Content-Type: application/json" \
    -X POST "$CHROMA_URL/api/v1/collections/$COLLECTION_ID/get" \
    -d '{"limit":1,"include":["metadatas","documents"]}' 2>/dev/null || echo "FAILED")
  echo "$PEEK" | python3 -c "
import sys, json
d = json.load(sys.stdin)
if d.get('documents'):
    print(f'  Doc[0] (first 200 chars): {d[\"documents\"][0][:200]}')
if d.get('metadatas'):
    print(f'  Metadata[0]: {d[\"metadatas\"][0]}')
if d.get('ids'):
    print(f'  ID[0]: {d[\"ids\"][0]}')
" 2>/dev/null || echo "  Raw: ${PEEK:0:500}"

  # Check if embeddings exist
  echo "  --- Embedding check ---"
  EMB_CHECK=$(curl -sf --max-time 10 \
    -H "Content-Type: application/json" \
    -X POST "$CHROMA_URL/api/v1/collections/$COLLECTION_ID/get" \
    -d '{"limit":1,"include":["embeddings"]}' 2>/dev/null || echo "FAILED")
  echo "$EMB_CHECK" | python3 -c "
import sys, json
d = json.load(sys.stdin)
embs = d.get('embeddings', [])
if embs and embs[0]:
    print(f'  ✅ Embeddings present — dim={len(embs[0])}, first 3 values: {embs[0][:3]}')
else:
    print(f'  ❌ NO embeddings found! Chunks stored without vectors.')
" 2>/dev/null || echo "  Raw: ${EMB_CHECK:0:300}"

else
  echo "  ❌ Collection '$COLLECTION' not found in ChromaDB"
fi

echo ""
echo "═══════════════════════════════════════════"
echo "  DIAGNOSTIC COMPLETE"
echo "═══════════════════════════════════════════"
