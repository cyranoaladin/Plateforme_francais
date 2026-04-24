#!/usr/bin/env bash
# ==============================================================================
# gen-arborescence.sh — Génère l'arborescence de production (sans artefacts)
# Usage : ./scripts/gen-arborescence.sh [répertoire] [fichier_sortie]
# Défaut : répertoire courant → docs/arborescence_prod_LATEST.txt
# ==============================================================================
set -euo pipefail

ROOT="${1:-.}"
OUT="${2:-docs/arborescence_prod_LATEST.txt}"

# Répertoires à exclure (identiques à .rsyncignore)
PRUNE=(
  .git
  node_modules
  .next
  dist
  out
  .venv
  venv
  __pycache__
  coverage
  test-results
  playwright-report
  blob-report
  .data
  ressources
  .worktrees
  .claude
  .codex
  .archives
  .qwen
  .windsurf
  .superpowers
  .antigravity
  .vscode
  .idea
  UI_UX
  packages/mcp-server/node_modules
  packages/mcp-server/dist
)

# Construire les arguments -prune pour find
PRUNE_ARGS=()
for dir in "${PRUNE[@]}"; do
  PRUNE_ARGS+=(-path "*/$dir" -prune -o)
done

mkdir -p "$(dirname "$OUT")"

{
  echo "# Arborescence production EAF — $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo "# Racine : $ROOT"
  echo "#"
  find -L "$ROOT" \
    "${PRUNE_ARGS[@]}" \
    -not -name "*.log" \
    -not -name "*.pyc" \
    -not -name "*.pyo" \
    -not -name "*.tsbuildinfo" \
    -not -name "arborescence*.txt" \
    -print \
  | sort
} > "$OUT"

LINE_COUNT=$(wc -l < "$OUT")
echo "✅ Arborescence générée : $OUT ($LINE_COUNT lignes)"
