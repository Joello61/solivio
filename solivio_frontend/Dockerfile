# Image du frontend Solivio (Next.js 16, Node.js 24 LTS).
#
# Sortie "standalone" de Next.js (next.config.ts) : l'image finale ne contient
# que le serveur et ses dependances, executes sans root.
#
# Les variables NEXT_PUBLIC_* sont figees a la construction. NEXT_PUBLIC_API_URL
# reste vide pour les images deployees : le navigateur appelle /api sur son
# propre domaine (route vers le backend par Traefik), la meme image sert donc la
# preproduction et la production. Le code serveur joint le backend par API_URL,
# lu a l'execution.

FROM node:24-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-alpine AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_API_URL=""
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npm run build

FROM node:24-alpine AS final

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -S solivio && adduser -S solivio -G solivio

COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

USER solivio

EXPOSE 3000

# 127.0.0.1 et non localhost : dans Alpine, localhost resout d'abord en IPv6 alors
# que le serveur Next.js n'ecoute qu'en IPv4 (HOSTNAME=0.0.0.0). /tmp/drain : voir
# le Dockerfile du backend, meme bascule sans coupure.
HEALTHCHECK --interval=5s --timeout=3s --start-period=30s --start-interval=5s --retries=2 \
  CMD [ ! -f /tmp/drain ] && wget -qO- http://127.0.0.1:3000/api/health || exit 1

ENTRYPOINT ["node", "server.js"]
