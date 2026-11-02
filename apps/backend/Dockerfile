# Medusa backend. Build from the repo root: docker build -f apps/backend/Dockerfile .
FROM node:22-bookworm-slim AS base
RUN corepack enable && corepack prepare pnpm@11.9.0 --activate
WORKDIR /repo

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/backend/package.json apps/backend/
RUN pnpm install --frozen-lockfile --filter @skyrostore/backend...
COPY apps/backend apps/backend
RUN pnpm --filter @skyrostore/backend build

FROM base AS run
ENV NODE_ENV=production
COPY --from=build /repo /repo
# Compiled output; node resolves dependencies from apps/backend/node_modules above it.
WORKDIR /repo/apps/backend/.medusa/server
RUN cp /repo/apps/backend/supabase-ca.crt . 2>/dev/null || true
EXPOSE 9000
# Migrations run once per deploy (RUN_MIGRATIONS=1 on a single instance), never on every replica.
CMD ["sh", "-c", "if [ \"$RUN_MIGRATIONS\" = \"1\" ]; then npx medusa db:migrate; fi && exec npx medusa start --port 9000"]
