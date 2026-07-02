# ─── Build Stage ──────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /build

RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/tsconfig.json apps/backend/tsconfig.build.json apps/backend/nest-cli.json apps/backend/
COPY apps/backend/prisma/ apps/backend/prisma/
COPY apps/shared/package.json apps/shared/tsconfig.json apps/shared/
COPY apps/shared/src/ apps/shared/src/

RUN npm ci --include-workspace-root && \
    cd apps/shared && npm run build && cd ../.. && \
    node node_modules/.bin/prisma generate --schema=apps/backend/prisma/schema.prisma

COPY apps/backend/src/ apps/backend/src/

RUN cd apps/backend && npm run build && cd ../.. && \
    npm prune --omit=dev

# ─── Production Stage ───────────────────────────────
FROM node:22-alpine AS production

RUN apk add --no-cache openssl tini curl && \
    addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY --from=builder /build/node_modules node_modules/
COPY --from=builder /build/apps/shared apps/shared/
COPY --from=builder /build/apps/backend/dist apps/backend/dist/
COPY --from=builder /build/apps/backend/prisma apps/backend/prisma/
COPY --from=builder /build/apps/backend/package.json apps/backend/
COPY --from=builder /build/package.json ./

ENV NODE_ENV=production \
    PORT=3001 \
    PRISMA_CLIENT_ENGINE_TYPE=binary

EXPOSE 3001

USER appuser

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -sf http://localhost:3001/api/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/backend/dist/src/main.js"]
