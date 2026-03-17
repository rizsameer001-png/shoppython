# ─────────────────────────────────────────────────────────────────────────────
# MarketPro Client — Dockerfile
# Stage 1: Vite build  |  Stage 2: Nginx serve
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /build

# Install deps first (cached layer unless package.json changes)
COPY client/package.json client/package-lock.json* ./
RUN npm ci --silent

# Copy source and build
COPY client/ .

# Build args become VITE_ env vars at build time
ARG VITE_API_URL=/api
ARG VITE_RAZORPAY_KEY_ID
ARG VITE_STRIPE_PUBLISHABLE_KEY
ARG VITE_UPI_ID
ARG VITE_UPI_NAME=MarketPro

ENV VITE_API_URL=$VITE_API_URL \
    VITE_RAZORPAY_KEY_ID=$VITE_RAZORPAY_KEY_ID \
    VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY \
    VITE_UPI_ID=$VITE_UPI_ID \
    VITE_UPI_NAME=$VITE_UPI_NAME

RUN npm run build


# ── Stage 2: nginx serve ──────────────────────────────────────────────────────
FROM nginx:1.25-alpine AS runtime

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Custom nginx config: SPA routing + API proxy + gzip + caching
COPY --from=builder /build/dist /usr/share/nginx/html

# nginx config is injected via Docker Compose / build arg
# We write it inline so the image is self-contained
RUN cat > /etc/nginx/conf.d/marketpro.conf << 'NGINX'
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript
               text/xml application/xml image/svg+xml;

    # Cache static assets aggressively
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # index.html: no cache (always fresh for SPA)
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # All client routes → index.html (React Router)
    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINX

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
