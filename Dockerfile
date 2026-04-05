# ---------- Builder ----------
FROM node:20-slim AS builder

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml* ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build


# ---------- Runner ----------
FROM node:20-slim

WORKDIR /app

RUN corepack enable

RUN apt-get update && apt-get install -y netcat-openbsd

# install only prod deps
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/open-api ./open-api
COPY --from=builder /app/ ./

# logs dir
RUN mkdir -p /app/logs

ENV NODE_ENV=production

EXPOSE 3000


CMD ["node", "dist/server.js"]