# ── web image: Vite build → Caddy ─────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM caddy:2-alpine AS web
COPY --from=build /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
EXPOSE 80

# ── api image: Hono + better-sqlite3 ──────────────────────────────────────────
FROM node:22-alpine AS api
# build tools needed by better-sqlite3 native addon
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev
COPY server/ .
COPY src/shared/ ./src/shared/
RUN addgroup -S app && adduser -S app -G app
USER app
VOLUME /data
EXPOSE 3000
CMD ["node", "index.js"]
