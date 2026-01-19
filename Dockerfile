# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source files
COPY . .

# Build web version
RUN npm run build:web

# Production stage
FROM node:20-alpine
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built files
COPY --from=builder /app/dist/web ./dist/web
COPY --from=builder /app/src/server ./src/server

# Set ownership
RUN chown -R appuser:appgroup /app

# Create docs directory with proper permissions
RUN mkdir -p /app/docs && chown -R appuser:appgroup /app/docs

USER appuser

ENV NODE_ENV=production
ENV PORT=3000
ENV DOCS_PATH=/app/docs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "src/server/index.js"]
