#!/usr/bin/env bash
# ==============================================================================
# Database Restore Script with Safety Confirmations
# Restores a PostgreSQL compressed backup (.sql.gz) into the active database.
# ==============================================================================
set -euo pipefail

BACKUP_DIR="$(pwd)/backups"
DB_USER="${POSTGRES_USER:-sms_user}"
DB_NAME="${POSTGRES_DB:-sms_db}"

BACKUP_FILE="${1:-}"

if [ -z "${BACKUP_FILE}" ]; then
    echo "Available backups in ${BACKUP_DIR}:"
    if [ ! -d "${BACKUP_DIR}" ] || [ -z "$(ls -A "${BACKUP_DIR}" 2>/dev/null)" ]; then
        echo "No backup files found in ${BACKUP_DIR}."
        exit 1
    fi
    ls -lh "${BACKUP_DIR}"
    echo ""
    echo "Usage: ./scripts/restore-db.sh backups/sms_backup_YYYYMMDD_HHMMSS.sql.gz"
    exit 1
fi

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "ERROR: Backup file '${BACKUP_FILE}' does not exist."
    exit 1
fi

# Detect active PostgreSQL container
CONTAINER_NAME=""
if docker ps --format '{{.Names}}' | grep -q "^sms-db$"; then
    CONTAINER_NAME="sms-db"
elif docker ps --format '{{.Names}}' | grep -q "^sms-db-dev$"; then
    CONTAINER_NAME="sms-db-dev"
fi

if [ -z "${CONTAINER_NAME}" ]; then
    echo "ERROR: No running PostgreSQL container (sms-db or sms-db-dev) found."
    echo "Start containers first with: make dev or make prod"
    exit 1
fi

echo "⚠️  WARNING: Restoring will overwrite existing data in [${DB_NAME}] on [${CONTAINER_NAME}]!"
read -p "Are you sure you want to proceed? [y/N]: " -r CONFIRM
if [[ ! "${CONFIRM}" =~ ^[Yy]$ ]]; then
    echo "Restore aborted by user."
    exit 0
fi

echo "==> Restoring database from [${BACKUP_FILE}]..."
gunzip -c "${BACKUP_FILE}" | docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}"

echo "✅ Database restore completed successfully!"
