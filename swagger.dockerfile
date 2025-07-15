# ConsentHub API Documentation Server

FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY swagger-package.json package.json
COPY package-lock.json* ./

# Install dependencies
RUN npm install --only=production

# Copy application files
COPY swagger-server.js .
COPY docs/ ./docs/

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the server
CMD ["npm", "start"]
