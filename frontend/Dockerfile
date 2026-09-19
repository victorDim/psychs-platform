# ==============================================================================
# Psychs GEO Platform v2.0.0-PROD: Frontend Multi-Stage Production Dockerfile
# Stage 1: Build Vite SPA Assets
# Stage 2: Serve via High-Performance Nginx Alpine
# ==============================================================================

# Stage 1: Builder
FROM node:24-alpine@sha256:ebfe2f90462722a7a4de65e91990e97fe0d401c70e0e762c5b53302f905ec1c1 AS builder

WORKDIR /app

# Public SPA configuration is compiled into the Vite bundle. Never pass a
# confidential client secret as a build argument.
ARG VITE_API_BASE_URL=/api/v2
ARG VITE_OIDC_AUTHORITY=
ARG VITE_OIDC_CLIENT_ID=
ARG VITE_OIDC_AUDIENCE=psychs-api
ARG VITE_OIDC_SCOPE="openid profile email offline_access projects:read projects:write"
ARG VITE_OIDC_STEP_UP_ACR_VALUES=
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL} \
    VITE_OIDC_AUTHORITY=${VITE_OIDC_AUTHORITY} \
    VITE_OIDC_CLIENT_ID=${VITE_OIDC_CLIENT_ID} \
    VITE_OIDC_AUDIENCE=${VITE_OIDC_AUDIENCE} \
    VITE_OIDC_SCOPE=${VITE_OIDC_SCOPE} \
    VITE_OIDC_STEP_UP_ACR_VALUES=${VITE_OIDC_STEP_UP_ACR_VALUES}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production Nginx Server
FROM nginxinc/nginx-unprivileged:1.30-alpine@sha256:daa17b944bac2b578e962da4c61ad72a59233b3c63abea17113acaf4e6b9aea4 AS runner

# Image assembly needs temporary root access to replace vendor-owned files.
# Runtime drops back to the unprivileged nginx account below.
USER root

# Refresh distribution packages so rebuilt images receive fixes published
# between upstream image releases. The vulnerability gate verifies the result.
RUN apk upgrade --no-cache

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
