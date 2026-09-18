# ==============================================================================
# Psychs GEO Platform v2.0.0-PROD: Frontend Multi-Stage Production Dockerfile
# Stage 1: Build Vite SPA Assets
# Stage 2: Serve via High-Performance Nginx Alpine
# ==============================================================================

# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production Nginx Server
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runner

# Image assembly needs temporary root access to replace vendor-owned files.
# Runtime drops back to the unprivileged nginx account below.
USER root

# Remove default nginx configs
RUN rm -rf /etc/nginx/conf.d/* /usr/share/nginx/html/*

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy compiled static assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

RUN chown -R nginx:nginx /etc/nginx /usr/share/nginx/html

USER nginx

# Expose HTTP port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q --spider http://localhost:8080/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
