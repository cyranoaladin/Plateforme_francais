#!/usr/bin/env bash

set -euo pipefail

STACK=(
  "fix/sse-paywall-hardening"
  "fix/oral-session-decomposition"
  "fix/oral-passage-decomposition"
  "fix/ecrit-page-decomposition"
  "fix/pr-workflow-hardening"
)

git fetch origin

for BRANCH in "${STACK[@]}"; do
  echo "→ Rebasing $BRANCH on main..."
  git checkout "$BRANCH"
  git rebase origin/main
  git push origin "$BRANCH" --force-with-lease
  echo "✅ $BRANCH rebased and pushed"
done

echo ""
echo "✅ Stack rebased. Merge PRs in order: #59 → #60 → #61 → #62 → #63"
