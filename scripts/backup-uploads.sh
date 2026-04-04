#!/usr/bin/env bash
set -euo pipefail

DATE="$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR="/backup/nexus-uploads/$DATE"

mkdir -p "$BACKUP_DIR"
cp -r .data/uploads/ "$BACKUP_DIR/"
echo "Backup créé : $BACKUP_DIR"

find /backup/nexus-uploads/ -mindepth 1 -maxdepth 1 -mtime +30 -exec rm -rf {} +
echo "Anciens backups nettoyés (>30j)"
