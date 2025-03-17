#!/bin/sh

# Get the host information from environment variables or use defaults
HOST="${PUBLIC_HOST:-localhost}"
PROTOCOL="${PUBLIC_PROTOCOL:-http}"
PORT="${PUBLIC_PORT:-80}"

# Construct the full URL
BACKEND_URL="${PROTOCOL}://${HOST}"
if [ "$PORT" != "80" ] && [ "$PORT" != "443" ]; then
  BACKEND_URL="${BACKEND_URL}:${PORT}"
fi

echo "Setting backend URL to: $BACKEND_URL"

# Copy files from source to Nginx directory
cp -r /frontend_source/* /usr/share/nginx/html/

# Find all HTML and JS files and replace the backend URL
find /usr/share/nginx/html -type f -name "*.html" -o -name "*.js" | xargs sed -i "s|http://127.0.0.1:8000|${BACKEND_URL}|g"
find /usr/share/nginx/html -type f -name "*.html" -o -name "*.js" | xargs sed -i "s|ws://127.0.0.1:8000|${PROTOCOL/http/ws}://${HOST}|g"

# Start nginx
exec nginx -g 'daemon off;' 