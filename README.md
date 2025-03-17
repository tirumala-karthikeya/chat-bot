# ChatApp Deployment

This repository contains a full-stack chat application with a dynamic dashboard that can be deployed locally or on an EC2 instance.

## Features

- Real-time chat interface with WebSocket communication
- File and image uploads
- URL sharing functionality
- Customizable chat interface (icons, backgrounds, gradients)
- Dashboard for managing bots and chat configurations
- Docker-based deployment for both local and production environments

## Local Deployment

To run the application locally:

```bash
docker-compose up -d
```

## EC2 Deployment

To deploy to an EC2 instance, follow these steps:

1. Clone this repository
2. Run the deployment script:
   ```bash
   ./deploy_ec2.sh
   ```
3. Test the dashboard connectivity:
   ```bash
   ./test_dashboard_connectivity.sh
   ```

For more detailed instructions, see the [EC2 Deployment Instructions](EC2_DEPLOYMENT_INSTRUCTIONS.md).

## Architecture

- **Backend**: FastAPI (Python)
- **Frontend**: Static HTML/CSS/JS
- **Infrastructure**: Docker, Nginx
- **External APIs**: Integration with next-agi.com API for AI responses

## License

[MIT](LICENSE) 