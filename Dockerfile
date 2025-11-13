# Multi-stage build for production-ready container

# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/client

# Copy frontend package files
COPY client/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy frontend source
COPY client/ ./

# Build frontend
RUN npm run build

# Stage 2: Build backend dependencies
FROM node:18-alpine AS backend-builder

WORKDIR /app

# Copy backend package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Stage 3: Production image
FROM node:18-alpine

# Install security updates
RUN apk --no-cache upgrade && \
    apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy backend dependencies from builder
COPY --from=backend-builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy built frontend from builder
COPY --from=frontend-builder --chown=nodejs:nodejs /app/client/build ./client/build

# Copy backend source
COPY --chown=nodejs:nodejs server ./server
COPY --chown=nodejs:nodejs package*.json ./
COPY --chown=nodejs:nodejs .env.example ./.env.example

# Create necessary directories
RUN mkdir -p logs database uploads && \
    chown -R nodejs:nodejs logs database uploads

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "server/index.js"]
