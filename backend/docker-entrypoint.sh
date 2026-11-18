#!/bin/sh
set -e

echo "=== Student Management System Backend Container Starting ==="

# Wait for PostgreSQL if configured
if [ "$DB_ENGINE" = "postgresql" ] || [ "$DB_ENGINE" = "postgres" ] || [ "$DB_ENGINE" = "django.db.backends.postgresql" ]; then
    echo "Waiting for PostgreSQL database at ${DB_HOST:-db}:${DB_PORT:-5432}..."
    python << END
import sys
import socket
import time

host = "${DB_HOST:-db}"
port = int("${DB_PORT:-5432}")

start_time = time.time()
while True:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(2.0)
        s.connect((host, port))
        s.close()
        print(f"PostgreSQL at {host}:{port} is reachable.")
        break
    except Exception:
        if time.time() - start_time > 60:
            print(f"Error: Timeout waiting for PostgreSQL at {host}:{port}", file=sys.stderr)
            sys.exit(1)
        time.sleep(1)
END
fi

# Apply database migrations
echo "Applying database migrations..."
python manage.py migrate --noinput

# Collect static assets
echo "Collecting static assets..."
python manage.py collectstatic --noinput || true

# Seed demo data if requested
if [ "$SEED_DEMO" = "true" ] || [ "$SEED_DEMO" = "True" ] || [ "$SEED_DEMO" = "1" ]; then
    echo "Seeding initial demo data..."
    python manage.py seed_demo || true
fi

echo "=== Backend initialization complete. Starting server ==="
exec "$@"
