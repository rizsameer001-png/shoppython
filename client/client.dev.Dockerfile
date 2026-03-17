# ─────────────────────────────────────────────────────────────────────────────
# MarketPro Client — Development Dockerfile
# Runs Vite dev server with hot-module replacement
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Install deps (cached layer)
COPY client/package.json client/package-lock.json* ./
RUN npm ci --silent

# Source is mounted as a volume at runtime — not copied here
EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
