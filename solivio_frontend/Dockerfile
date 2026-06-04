# Dockerfile - solivio-frontend (Next.js 16 / Node.js 24 LTS)
# Place this file at: solivio-frontend/Dockerfile
#
# Multi-stage build:
#   deps    - install production and dev dependencies
#   build   - compile Next.js with standalone output
#   final   - minimal image with standalone output only
#
# IMPORTANT: next.config.ts must have output: 'standalone'
# Without it the standalone directory is not generated and this Dockerfile fails.
#
# Example next.config.ts:
#   const nextConfig: NextConfig = {
#     output: 'standalone',
#   }
#   export default nextConfig

# -----------------------------------------------------------------------------
# Stage 1: install dependencies
# -----------------------------------------------------------------------------
FROM node:24-alpine AS deps

WORKDIR /app

# copy lockfile before package.json for better cache invalidation
COPY package.json package-lock.json* ./
RUN npm ci

# -----------------------------------------------------------------------------
# Stage 2: build
# -----------------------------------------------------------------------------
FROM node:24-alpine AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_TELEMETRY_DISABLED prevents Next.js from sending build telemetry
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# -----------------------------------------------------------------------------
# Stage 3: final runtime image
# -----------------------------------------------------------------------------
FROM node:24-alpine AS final

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# non-root user
RUN addgroup -S solivio && adduser -S solivio -G solivio

# standalone output includes only what is needed to run the server
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

USER solivio

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

HEALTHCHECK \
  --interval=30s \
  --timeout=5s \
  --start-period=30s \
  --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

ENTRYPOINT ["node", "server.js"]