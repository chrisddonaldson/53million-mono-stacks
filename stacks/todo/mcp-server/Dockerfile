# Use Node.js 20 Alpine for smaller image
FROM node:20-alpine

# Install build dependencies
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies (use npm install if no package-lock.json exists)
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source code
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# Remove dev dependencies after build to reduce image size
RUN npm prune --production && npm cache clean --force

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mcp -u 1001 -G nodejs

# Change ownership of app directory
RUN chown -R mcp:nodejs /app

# Switch to non-root user
USER mcp

# Expose the port the app runs on
EXPOSE 8603

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); http.get('http://localhost:8603/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => { process.exit(1); });"

# Start the server
CMD ["npm", "start"]