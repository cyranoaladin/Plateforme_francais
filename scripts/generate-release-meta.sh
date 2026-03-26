#!/bin/bash
# Script pour générer les métadonnées de release (.git_sha et .build_time)
# À exécuter avant le build Next.js

set -e

# Déterminer le répertoire racine de l'application
APP_ROOT="${APP_ROOT:-$(pwd)}"

# Générer le SHA git
GIT_SHA=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")

# Écrire dans les fichiers
echo "$GIT_SHA" > "$APP_ROOT/.git_sha"
echo "$BUILD_TIME" > "$APP_ROOT/.build_time"

echo "✓ Release metadata generated:"
echo "  SHA: $GIT_SHA"
echo "  Time: $BUILD_TIME"
