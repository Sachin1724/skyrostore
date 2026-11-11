# Next.js storefront. Build from the repo root: docker build -f apps/storefront/Dockerfile .
# NEXT_PUBLIC_* values are baked in at build time, so they are build args.
FROM node:22-bookworm-slim AS base
RUN corepack enable && corepack prepare pnpm@11.9.0 --activate
WORKDIR /repo

FROM base AS build
ARG NEXT_PUBLIC_MEDUSA_URL
ARG NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_REGION_ID
ARG NEXT_PUBLIC_SALES_CHANNEL_ID
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/storefront/package.json apps/storefront/
RUN pnpm install --frozen-lockfile --filter @skyrostore/storefront...
COPY apps/storefront apps/storefront
RUN pnpm --filter @skyrostore/storefront build

FROM node:22-bookworm-slim AS run
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
RUN useradd --system --uid 1001 next
COPY --from=build --chown=next /repo/apps/storefront/.next/standalone ./
COPY --from=build --chown=next /repo/apps/storefront/.next/static ./apps/storefront/.next/static
COPY --from=build --chown=next /repo/apps/storefront/public ./apps/storefront/public
USER next
EXPOSE 3000
CMD ["node", "apps/storefront/server.js"]
