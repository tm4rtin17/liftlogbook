# ── Stage 1: build frontend ────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /build

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html tsconfig.json tsconfig.node.json vite.config.ts \
     postcss.config.js tailwind.config.js ./
COPY public ./public
COPY src ./src

RUN npm run build

# ── Stage 2: build server ──────────────────────────────────────────────
FROM node:20-alpine AS server-builder
WORKDIR /build

# Required to compile better-sqlite3 native bindings on Alpine
RUN apk add --no-cache python3 make g++

COPY server/package.json server/package-lock.json ./
RUN npm ci

COPY server/tsconfig.json ./
COPY server/src ./src

RUN npm run build

# Reinstall only production dependencies to keep the final image lean
RUN npm ci --omit=dev

# ── Stage 3: production image ──────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

RUN addgroup -S liftlogbook && adduser -S liftlogbook -G liftlogbook

# Compiled server + its dependencies
COPY --from=server-builder /build/node_modules ./server/node_modules
COPY --from=server-builder /build/dist        ./server/dist

# Built frontend (served as static files by the Express app)
COPY --from=frontend-builder /build/dist ./dist

# Data directory — mount a volume here to persist the SQLite database
RUN mkdir -p data && chown -R liftlogbook:liftlogbook /app

USER liftlogbook

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "server/dist/index.js"]
