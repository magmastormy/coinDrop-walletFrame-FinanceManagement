# Frontend build stage
FROM node:latest AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Backend build stage
FROM node:latest AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend ./
RUN npm run build

# Production stage
FROM node:latest

# Create app directory and user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app

# Copy backend files
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/node_modules ./node_modules

# Copy frontend build to public directory
COPY --from=frontend-builder /app/dist ./public

# Ensure uploads directory exists
RUN mkdir -p uploads/receipts uploads/profile-pictures uploads/community reports logs

# Set proper ownership
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Environment setup
ENV NODE_ENV=production
ENV PORT=5000
ENV CORS_ORIGIN=http://localhost:3000

# Expose port
EXPOSE $PORT

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:$PORT/api/health || exit 1

# Start the application
CMD [ "node", "dist/server.js" ]