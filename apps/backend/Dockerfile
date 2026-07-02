FROM node:22-alpine

RUN apk add --no-cache openssl tini curl

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/tsconfig.json apps/backend/tsconfig.build.json apps/backend/nest-cli.json apps/backend/
COPY apps/shared/package.json apps/shared/tsconfig.json apps/shared/
COPY apps/backend/prisma/ apps/backend/prisma/
COPY apps/shared/src/ apps/shared/src/
COPY apps/backend/src/ apps/backend/src/

RUN npm ci --include-workspace-root && \
    npm run prisma:generate --workspace=apps/backend && \
    npm run build --workspace=apps/shared && \
    npm run build --workspace=apps/backend

EXPOSE 3001

USER root

CMD ["sh", "-c", "echo '=== BACKEND CONTAINER STARTING ===' && node --trace-uncaught apps/backend/dist/src/main.js"]
