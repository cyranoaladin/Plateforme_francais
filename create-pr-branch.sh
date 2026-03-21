#!/bin/bash
# Script pour créer une branche et push via PR (Option C)
# C'est la méthode recommandée quand la protection de branche est stricte

set -e

echo "========================================="
echo "  OPTION C: CREATION DE BRANCHE + PR"
echo "========================================="
echo ""

BRANCH_NAME="fix/p0-manual-payment-$(date +%Y%m%d-%H%M%S)"

echo "1. Création de la branche: $BRANCH_NAME"
git checkout -b "$BRANCH_NAME"

echo ""
echo "2. Push de la branche sur origin..."
git push origin "$BRANCH_NAME"

echo ""
echo -e "\033[0;32m✓ Branche poussée avec succès!\033[0m"
echo ""
echo "========================================="
echo "  PROCHAINES ÉTAPES"
echo "========================================="
echo ""
echo "1. Allez sur GitHub:"
echo "   https://github.com/cyranoaladin/Plateforme_francais/pulls"
echo ""
echo "2. Créez une Pull Request:"
echo "   - Base: main"
echo "   - Compare: $BRANCH_NAME"
echo "   - Titre: fix(P0): neutralize ClicToPay, fix provider manual, align admin labels"
echo ""
echo "3. Mergez la PR (avec 'Create a merge commit' ou 'Squash and merge')"
echo ""
echo "4. Retournez sur main localement:"
echo "   git checkout main"
echo "   git pull origin main"
echo ""
echo "SHA du commit: $(git rev-parse HEAD)"
echo "Branche: $BRANCH_NAME"
