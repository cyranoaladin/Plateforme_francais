#!/usr/bin/env bash
set -euo pipefail

ERRORS=0

echo "🔍 Vérification : absence de traces Vercel..."

VERCEL_PKGS=$(node -e "
  const pkg = require('./package.json');
  const all = { ...pkg.dependencies, ...pkg.devDependencies };
  const found = Object.keys(all).filter(k =>
    k.startsWith('@vercel/') || k === 'next-on-pages'
  );
  if (found.length) process.stdout.write(found.join('\n') + '\n');
" 2>/dev/null || true)
if [ -n "$VERCEL_PKGS" ]; then
  echo "❌ Packages Vercel dans package.json :"
  echo "$VERCEL_PKGS" | sed 's/^/   /'
  ERRORS=$((ERRORS + 1))
fi

for f in vercel.json .vercelignore .vercel; do
  if [ -e "$f" ]; then
    echo "❌ Fichier Vercel détecté : $f"
    ERRORS=$((ERRORS + 1))
  fi
done

if grep -r "VERCEL_" .github/workflows/ --include="*.yml" -l 2>/dev/null | grep -q .; then
  echo "❌ Variables VERCEL_* dans les workflows :"
  grep -r "VERCEL_" .github/workflows/ --include="*.yml" -n | sed 's/^/   /'
  ERRORS=$((ERRORS + 1))
fi

CRON_MAX_DURATION=$(grep -r "export const maxDuration" src/app/api/v1/cron/ \
  --include="*.ts" -l 2>/dev/null || true)
if [ -n "$CRON_MAX_DURATION" ]; then
  echo "⚠️  maxDuration trouvé dans des routes cron (convention Vercel — ignoré sur PM2) :"
  echo "$CRON_MAX_DURATION" | sed 's/^/   /'
  echo "   → Supprimer ces lignes (voir purge Vercel)"
  ERRORS=$((ERRORS + 1))
fi

echo ""
if [ "$ERRORS" -eq 0 ]; then
  echo "✅ Aucune trace Vercel — repo 100% serveur dédié"
  exit 0
else
  echo "❌ $ERRORS problème(s) détecté(s)"
  exit 1
fi
