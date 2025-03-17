#!/bin/bash

# Exit on error
set -e

echo "Starting deployment to EC2 instance..."

# Make sure we have the latest code
if [ -d ".git" ]; then
  echo "Updating from git..."
  git pull
else
  echo "Not a git repository. Continuing with local files."
fi

# Ensure .env file exists
if [ ! -f ".env" ]; then
  echo "Creating .env file..."
  cat > .env << EOF
API_KEY_1 = "app-cEBy9PIjQ7AqhnuJiDDUOzZA"
API_KEY_2 = "app-B5k4WVqXNhi4tkb1vPl1jNEn" #not working
API_KEY_3 = "app-jqxu9a3lVE0kRGZQnoSWHIgN"
API_KEY_4 = "app-kjgj6yVn2ZlrAtmdcZcmC63k"
API_KEY_5 = "app-BCh1kMaGYarXKndrpOdW16gH"

# EC2 configuration
PUBLIC_HOST=54.244.203.243
PUBLIC_PROTOCOL=http
PUBLIC_PORT=80
EOF
fi

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p backend/bots
mkdir -p uploads
mkdir -p backend/template
mkdir -p frontend/frontend
mkdir -p persistent_data

# Ensure templates exist for chat window
if [ ! -d "backend/template" ]; then
  echo "Warning: backend/template directory is missing. Chat window templates might not be available."
fi

# Set correct permissions
echo "Setting correct permissions..."
chmod -R 755 backend
chmod -R 755 frontend
chmod -R 755 uploads
chmod -R 755 persistent_data

# Make script executable
chmod +x frontend/entrypoint.sh

# Bring down any existing containers
echo "Stopping any running containers..."
docker-compose down 2>/dev/null || true

# Start in production mode
echo "Starting application in production mode..."
docker-compose -f docker-compose.prod.yml up -d

echo "Deployment complete! Application should be running at http://54.186.186.66"
echo "You can check logs with: docker-compose -f docker-compose.prod.yml logs -f"
echo "To check backend logs: docker-compose -f docker-compose.prod.yml logs -f backend"
echo "To check frontend logs: docker-compose -f docker-compose.prod.yml logs -f frontend-static" 