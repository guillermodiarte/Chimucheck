#!/bin/sh
set -e

# Run migrations
echo "Running migrations..."
npx prisma migrate deploy

# Run seed
if [ -f "prisma/seed.js" ]; then
    echo "Running seed..."
    node prisma/seed.js
fi

# Start the application
echo "Starting application..."
exec node server.js
