#!/usr/bin/env bash
# ==============================================================================
# Automated PostgreSQL Database Backup Script
# Creates a timestamped, gzip-compressed snapshot of the database.
# ==============================================================================
set -euo pipefail

BACKUP_DIR="$(pwd)/backups"
TIMESTAMP="$(date +'%Y%m%d_%H%M%S')"
BACKUP_FILE="${BACKUP_DIR}/sms_backup_${TIMESTAMP}.sql.gz"

DB_USER="${POSTGRES_USER:-sms_user}"
DB_NAME="${POSTGRES_DB:-sms_db}"

mkdir -p "${BACKUP_DIR}"

echo "==> Initiating PostgreSQL database backup..."

# Detect active container (production 'sms-db' or development 'sms-db-dev')
CONTAINER_NAME=""
if docker ps --format '{{.Names}}' | grep -q "^sms-db$"; then
    CONTAINER_NAME="sms-db"
elif docker ps --format '{{.Names}}' | grep -q "^sms-db-dev$"; then
    CONTAINER_NAME="sms-db-dev"
fi

if [ -n "${CONTAINER_NAME}" ]; then
    echo "==> Backing up database from container [${CONTAINER_NAME}]..."
    docker exec -t "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" "${DB_NAME}" | gzip > "${BACKUP_FILE}"
elif [ -f "backend/db.sqlite3" ]; then
    echo "==> PostgreSQL container not running. Backing up local SQLite database..."
    BACKUP_FILE="${BACKUP_DIR}/sms_sqlite_backup_${TIMESTAMP}.sqlite3.gz"
    gzip -c "backend/db.sqlite3" > "${BACKUP_FILE}"
else
    echo "ERROR: Neither PostgreSQL container nor backend/db.sqlite3 found."
    exit 1
fi

FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "✅ Backup completed successfully!"
echo "   File: ${BACKUP_FILE}"
echo "   Size: ${FILE_SIZE}"
