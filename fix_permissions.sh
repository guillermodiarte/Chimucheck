#!/bin/bash

echo "Fixing permissions for Docker volumes..."

# Ensure directories exist
mkdir -p ./public/uploads
mkdir -p ./data

# Set ownership to 1001:1001 (nextjs user inside container)
# You might need sudo to run this depending on your VPS user
chown -R 1001:1001 ./public/uploads
chown -R 1001:1001 ./data

# Set permissions to read/write/execute for owner, read/execute for group/others
chmod -R 755 ./public/uploads
chmod -R 755 ./data

echo "Permissions fixed. Now restart your container."
