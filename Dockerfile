# ── Stage 1: Dependencies ─────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# ── Stage 2: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
# Restore execute permissions on all bin scripts after cross-stage COPY
RUN chmod -R +x node_modules/.bin
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# NEXT_PUBLIC_* vars are baked into the client bundle at build time.
# NEXT_PUBLIC_LIVE_API_URL must be the public-facing HTTPS base URL of the
# deployment (e.g. https://gyt.example.com) so the browser WebSocket for live
# PR reviews can reach wss://gyt.example.com/live/ws through HAProxy.
ARG  NEXT_PUBLIC_LIVE_API_URL
ENV  NEXT_PUBLIC_LIVE_API_URL=${NEXT_PUBLIC_LIVE_API_URL}

# NEXT_PUBLIC_GRAPHQL_URL is read server-side at runtime (not baked) because
# the browser always calls the relative path /graphql which HAProxy routes.
ARG  NEXT_PUBLIC_GRAPHQL_URL
ENV  NEXT_PUBLIC_GRAPHQL_URL=${NEXT_PUBLIC_GRAPHQL_URL}

RUN npm run build

# ── Stage 3: Runtime ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

COPY --from=builder /app/.next         ./.next
COPY --from=builder /app/node_modules  ./node_modules
COPY --from=builder /app/package.json  ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts

USER nextjs

EXPOSE 3000

CMD ["npm", "run", "start"]
