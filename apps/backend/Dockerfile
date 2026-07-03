FROM node:22-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/tsconfig.json apps/backend/
COPY apps/backend/prisma/ apps/backend/prisma/
COPY apps/backend/src/ apps/backend/src/

RUN npm ci --include-workspace-root && \
    npm run prisma:generate --workspace=apps/backend && \
    npm run build --workspace=apps/backend

EXPOSE 3001

CMD ["node", "apps/backend/dist/src/main.js"]
