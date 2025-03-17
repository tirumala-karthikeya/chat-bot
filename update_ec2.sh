#!/bin/bash

# Exit on error
set -e

echo "Starting update for EC2 deployment..."

# Ensure the persistent_data directory exists and has correct permissions
echo "Setting up persistent data directory..."
mkdir -p persistent_data
chmod -R 755 persistent_data

# Commit the nginx.conf changes
echo "Committing changes..."
git add nginx.conf
git commit -m "Fix nginx configuration for asset endpoints" || true

# Push changes to GitHub repository
echo "Pushing changes to GitHub..."
git push || echo "Failed to push changes. Continuing with deployment."

# Restart the containers to apply the new configuration
echo "Restarting containers with updated configuration..."
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build frontend-static

echo "Update completed! The application should now handle asset endpoints correctly."
echo "You can check logs with: docker-compose -f docker-compose.prod.yml logs -f frontend-static" 