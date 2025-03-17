#!/bin/bash

# Exit on error
set -e

echo "Preparing for EC2 deployment at 54.244.203.243..."

# Update test script to use EC2 IP
sed -i.bak 's/HOST="localhost:8000"/HOST="54.244.203.243"/' test_dashboard_connectivity.sh
echo "Updated test_dashboard_connectivity.sh to use EC2 IP"

# Create a README with deployment instructions
cat > EC2_DEPLOYMENT_INSTRUCTIONS.md << EOF
# EC2 Deployment Instructions

## Prerequisites
- EC2 instance with Docker and Docker Compose installed
- Port 80 open in the security group

## Deployment Steps

1. Upload the codebase to the EC2 instance:
   \`\`\`
   scp -r -i your-key.pem ChatBotGen-Local/ ec2-user@54.244.203.243:~
   \`\`\`

2. SSH into the EC2 instance:
   \`\`\`
   ssh -i your-key.pem ec2-user@54.244.203.243
   \`\`\`

3. Navigate to the application directory:
   \`\`\`
   cd ChatBotGen-Local
   \`\`\`

4. Run the deployment script:
   \`\`\`
   ./deploy_ec2.sh
   \`\`\`

5. Test dashboard connectivity:
   \`\`\`
   ./test_dashboard_connectivity.sh
   \`\`\`

## Troubleshooting

If you encounter issues, check the logs:
\`\`\`
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend-static
\`\`\`

EOF

echo "Created EC2_DEPLOYMENT_INSTRUCTIONS.md"

echo "Preparation complete!"
echo "Your application is ready for EC2 deployment."
echo "Please follow the instructions in EC2_DEPLOYMENT_INSTRUCTIONS.md" 