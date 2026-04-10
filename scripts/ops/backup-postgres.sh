#!/bin/bash
# Backup PostgreSQL quotidien vers S3
set -euo pipefail

DB_NAME="eaf_prod"
DB_USER="nexus_eaf_user"
BACKUP_DIR="/tmp/pg_backups"
S3_BUCKET="s3://nexus-eaf-uploads/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="eaf_backup_${DATE}.sql.gz"
RETENTION_DAYS=7

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting PostgreSQL backup..."

# Dump et compression
pg_dump -U "$DB_USER" -h localhost "$DB_NAME" | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

# Upload vers S3
if aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}" "${S3_BUCKET}/" --endpoint-url https://nbg1.your-objectstorage.com; then
    echo "[$(date)] Backup uploaded to S3: ${BACKUP_FILE}"
    
    # Nettoyage local
    rm -f "${BACKUP_DIR}/${BACKUP_FILE}"
    
    # Nettoyage S3 (garder 7 jours)
    aws s3 ls "${S3_BUCKET}/" --endpoint-url https://nbg1.your-objectstorage.com | \
        awk '{print $4}' | \
        sort -r | \
        tail -n +8 | \
        xargs -I {} aws s3 rm "${S3_BUCKET}/{}" --endpoint-url https://nbg1.your-objectstorage.com 2>/dev/null || true
    
    echo "[$(date)] Backup complete. Retention: ${RETENTION_DAYS} days"
else
    echo "[$(date)] ERROR: Backup upload failed"
    exit 1
fi
