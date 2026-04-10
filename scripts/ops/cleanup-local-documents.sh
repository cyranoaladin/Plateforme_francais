#!/bin/bash
# Nettoie les documents locaux déjà migrés vers S3
set -euo pipefail

LOCAL_DIR="/opt/eaf_platform/.data/uploads/documents"
S3_BUCKET="s3://nexus-eaf-uploads/documents"
DRY_RUN=${1:-"--dry-run"}

if [ "$DRY_RUN" = "--dry-run" ]; then
    echo "[DRY RUN] Analyse des fichiers à nettoyer..."
fi

# Vérifier si AWS CLI est configuré
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo "❌ AWS CLI non configuré. Configurez les credentials S3."
    exit 1
fi

DELETED=0
SKIPPED=0

# Parcourir les dossiers utilisateurs
for userDir in "$LOCAL_DIR"/user-*; do
    if [ ! -d "$userDir" ]; then
        continue
    fi
    
    userId=$(basename "$userDir")
    echo "Traitement de $userId..."
    
    # Parcourir les fichiers
    find "$userDir" -type f | while read -r localFile; do
        # Extraire le chemin relatif
        relPath="${localFile#$LOCAL_DIR/}"
        s3Path="$S3_BUCKET/$relPath"
        
        # Vérifier si le fichier existe sur S3
        if aws s3 ls "$s3Path" >/dev/null 2>&1; then
            if [ "$DRY_RUN" = "--execute" ]; then
                rm -f "$localFile"
                echo "  ✓ Supprimé: $relPath"
            else
                echo "  [DRY] Serait supprimé: $relPath"
            fi
            ((DELETED++))
        else
            echo "  ⚠ Non trouvé sur S3, conservé: $relPath"
            ((SKIPPED++))
        fi
    done
done

echo ""
echo "Résumé:"
echo "  Fichiers traités: $((DELETED + SKIPPED))"
echo "  À supprimer: $DELETED"
echo "  Conservés: $SKIPPED"

if [ "$DRY_RUN" = "--dry-run" ]; then
    echo ""
    echo "Pour exécuter réellement: $0 --execute"
fi
