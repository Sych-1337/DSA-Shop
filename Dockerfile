# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable
COPY package.json pnpm-lock.yaml .npmrc ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN pnpm install --frozen-lockfile

FROM node:22-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Build-time placeholders — real DATABASE_URL is injected at runtime on Render.
# Prefer Native Environment (not Docker) on Render so migrate+build can use live Postgres.
ARG DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build?schema=public
ARG BETTER_AUTH_SECRET=build-time-secret-at-least-32-characters-long
ARG APP_URL=http://localhost:3000
ENV DATABASE_URL=$DATABASE_URL
ENV BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET
ENV APP_URL=$APP_URL
ENV BETTER_AUTH_URL=$APP_URL
# Avoid hard-failing static generation when DB is unreachable during image build.
ENV DATABASE_SSL=false
RUN pnpm exec prisma generate && pnpm build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOME=/home/nextjs
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/* \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 --home /home/nextjs nextjs \
  && mkdir -p /home/nextjs \
  && chown -R nextjs:nodejs /home/nextjs /app
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
USER nextjs
EXPOSE 3000
# Bypass corepack/pnpm — nextjs user has no writable HOME for package-manager download.
CMD ["node", "node_modules/next/dist/bin/next", "start"]
