#!/bin/bash

# Set the host (use localhost for local testing, EC2 IP for production)
HOST="localhost:8000"  # Change to 54.244.203.243 for EC2 testing
BOT_CODE="slxtTk"  # Replace with a valid bot code from your system

# Output colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "Testing dashboard connectivity to chat window..."
echo "Using host: $HOST"
echo "Using bot code: $BOT_CODE"
echo "----------------------------------------"

# Function to test an endpoint
test_endpoint() {
    endpoint=$1
    description=$2
    
    echo -n "Testing $description: "
    response=$(curl -s "http://$HOST/$endpoint")
    
    if [[ $response == *"error"* ]]; then
        echo -e "${RED}Failed${NC}"
        echo "Response: $response"
    else
        echo -e "${GREEN}Success${NC}"
    fi
}

# Test basic endpoints
test_endpoint "get-bots-files" "Bot files listing"
test_endpoint "get_chatIcon/$BOT_CODE" "Chat icon retrieval"
test_endpoint "get_botIcon/$BOT_CODE" "Bot icon retrieval" 
test_endpoint "get_bg/$BOT_CODE" "Background retrieval"
test_endpoint "header_img/$BOT_CODE" "Header image retrieval"
test_endpoint "chatbox_text/$BOT_CODE" "Chatbox text retrieval"
test_endpoint "chat_gradient/$BOT_CODE" "Chat gradient retrieval"

echo "----------------------------------------"
echo "Dashboard connectivity test complete."
echo "If all tests passed, your dashboard should work correctly with the chat window."
echo "If any tests failed, check your backend logs for more details:"
echo "docker-compose logs -f backend" 