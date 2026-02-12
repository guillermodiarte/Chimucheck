#!/bin/sh
set -e

# Run migrations
echo "Running migrations..."
if ! npx prisma migrate deploy; then
    echo "Migration failed! Attempting to reset database..."
    npx prisma migrate reset --force
    echo "Database reset complete. Re-running migrations..."
    npx prisma migrate deploy
fi

# Run seed
if [ -f "prisma/seed.js" ]; then
    echo "Running seed..."
    node prisma/seed.js
fi

# Start the application
# Start the application
echo "Starting application..."

# Find server.js (handles cases where it's nested in standalone/project-name)
SERVER_JS=$(find . -type f -name "server.js" | head -n 1)

if [ -z "$SERVER_JS" ]; then
    echo "ERROR: server.js not found in $(pwd)"
    echo "Listing directory contents:"
    ls -R
    exit 1
fi

echo "Found server.js at: $SERVER_JS"
exec node "$SERVER_JS"
