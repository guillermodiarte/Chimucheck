#!/bin/sh
set -e

# Ensure data directory exists for SQLite
if [ ! -d "/app/data" ]; then
    echo "Creating /app/data directory..."
    mkdir -p /app/data
fi

# Ensure avatar directory exists
if [ ! -d "/app/public/avatars" ]; then
    echo "Creating /app/public/avatars..."
    mkdir -p /app/public/avatars
fi

# Ensure user can write to data and images
# Trying to fix permissions at runtime (might need root, but we are running as nextjs user?)
# If running as non-root, this might fail, but let's try or skip
echo "Checking directory permissions..."
ls -ld /app/data || echo "Cannot list /app/data"
ls -ld /app/public/avatars || echo "Cannot list /app/public/avatars"

# Run migrations
echo "Running migrations..."
if ! npx prisma migrate deploy; then
    echo "Migration failed! Attempting to reset database..."
    npx prisma migrate reset --force
    echo "Database reset complete. Re-running migrations..."
    npx prisma migrate deploy
fi

# Sync schema changes not yet in migration files (e.g. Json -> String)
echo "Pushing schema changes..."
npx prisma db push --accept-data-loss 2>/dev/null || echo "db push skipped"

# Fix corrupt data: replace empty/invalid games values with valid JSON "[]"
echo "Fixing tournament data..."
if [ -f "prisma/fix-games.js" ]; then
    node prisma/fix-games.js
fi

# Run seed
if [ -f "prisma/seed.js" ]; then
    echo "Running seed..."
    node prisma/seed.js
fi

# Start the application
echo "Starting application..."

# Prioritize standard standalone locations
if [ -f "./server.js" ]; then
    SERVER_JS="./server.js"
elif [ -f "./.next/standalone/server.js" ]; then
    SERVER_JS="./.next/standalone/server.js"
else
    # Fallback search, excluding node_modules to avoid false positives
    SERVER_JS=$(find . -type f -name "server.js" -not -path "*/node_modules/*" | head -n 1)
fi

if [ -z "$SERVER_JS" ]; then
    echo "ERROR: server.js not found in $(pwd)"
    echo "Listing root directory:"
    ls -la
    echo "Listing .next directory (if exists):"
    ls -la .next || echo ".next missing"
    exit 1
fi

echo "Found server.js at: $SERVER_JS"
exec node "$SERVER_JS"
