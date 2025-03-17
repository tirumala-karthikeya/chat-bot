# Use Node.js 18 as the base image
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first (dependency installation step)
COPY "landing page"/package*.json ./

# Install dependencies
RUN npm install

# Copy the application code
COPY "landing page"/ ./landing-page/
COPY frontend/ ./frontend/

# Expose the port your app runs on
EXPOSE 3001

# Start the application with the correct port
CMD ["node", "landing-page/index.js", "3001"]
