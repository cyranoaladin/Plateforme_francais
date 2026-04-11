#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# CHECK SECRETS EXPOSURE
# Vérifie qu'aucun secret n'est exposé dans l'arbre runtime
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

ERRORS=0

echo "🔒 Vérification des secrets exposés..."
echo ""

# Patterns à rechercher (clés API, secrets, tokens)
PATTERNS=(
    'api[_-]?key\s*[=:]\s*["'\'''][a-zA-Z0-9_-]{16,}'
    'api[_-]?secret\s*[=:]\s*["'\'''][a-zA-Z0-9_-]{16,}'
    'secret[_-]?key\s*[=:]\s*["'\'''][a-zA-Z0-9_-]{16,}'
    'private[_-]?key\s*[=:]\s*["'\'''][a-zA-Z0-9_-]{16,}'
    'password\s*[=:]\s*["'\'''][^"'\''"]+'
    'sk-[a-zA-Z0-9]{20,}'
    'Bearer\s+[a-zA-Z0-9_-]{20,}'
    'AKIA[0-9A-Z]{16}'
    'ghp_[a-zA-Z0-9]{36}'
    'glpat-[a-zA-Z0-9\-]{20}'
    'eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*'
)

echo "1️⃣ Vérification des fichiers .env* dans git..."
if git -C "${PROJECT_ROOT}" ls-files | grep -E '^\.env' | grep -v '^\.env\.example$' | grep -v '^\.env\.test$'; then
    echo "❌ ERREUR: Fichiers .env* (hors example/test) présents dans git!"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ Pas de fichiers .env sensibles dans git"
fi
echo ""

echo "2️⃣ Vérification des patterns de secrets dans le code..."
for pattern in "${PATTERNS[@]}"; do
    # Exclure node_modules, .env.example, et les fichiers de test
    MATCHES=$(grep -r -n -E "${pattern}" "${PROJECT_ROOT}" \
        --include="*.ts" --include="*.tsx" --include="*.js" --include="*.mjs" --include="*.json" \
        --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist \
        --exclude-dir=coverage --exclude=.env.example 2>/dev/null || true)
    
    if [[ -n "${MATCHES}" ]]; then
        echo "⚠️  Pattern suspect trouvé: ${pattern}"
        echo "${MATCHES}" | head -5
        echo ""
    fi
done
echo ""

echo "3️⃣ Vérification des fichiers de backup..."
BACKUP_FILES=$(find "${PROJECT_ROOT}" -maxdepth 2 -name "*.backup" -o -name "*.bak" -o -name "*.old" 2>/dev/null | grep -v node_modules || true)
if [[ -n "${BACKUP_FILES}" ]]; then
    echo "❌ Fichiers de backup trouvés:"
    echo "${BACKUP_FILES}"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ Pas de fichiers de backup"
fi
echo ""

echo "4️⃣ Vérification des clés dans .env (local)..."
if [[ -f "${PROJECT_ROOT}/.env" ]]; then
    # Vérifier que les secrets ne sont pas les valeurs par défaut
    if grep -E 'SESSION_SECRET=[a-z0-9]{32}' "${PROJECT_ROOT}/.env" | grep -v 'change\|random\|minimum' > /dev/null; then
        echo "⚠️  SESSION_SECRET semble être une valeur statique dans .env"
    fi
fi
echo ""

echo "5️⃣ Vérification des permissions des fichiers sensibles..."
ENV_FILES=$(find "${PROJECT_ROOT}" -maxdepth 2 -name ".env*" -type f 2>/dev/null | grep -v node_modules || true)
for file in ${ENV_FILES}; do
    if [[ -f "${file}" ]]; then
        PERMS=$(stat -c %a "${file}" 2>/dev/null || stat -f %Lp "${file}" 2>/dev/null)
        if [[ "${PERMS}" != "600" && "${PERMS}" != "644" ]]; then
            echo "⚠️  Permissions trop ouvertes sur ${file}: ${PERMS} (devrait être 600 ou 644)"
        fi
    fi
done
echo ""

if [[ ${ERRORS} -gt 0 ]]; then
    echo "❌ ${ERRORS} erreur(s) critique(s) trouvée(s)!"
    exit 1
else
    echo "✅ Vérification des secrets terminée - aucune exposition critique"
    exit 0
fi
