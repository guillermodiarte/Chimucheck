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
echo "Starting application..."
exec node server.js
