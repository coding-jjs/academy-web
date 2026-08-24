# Next.js standalone + Prisma migrate 이미지.
# Lightsail에서 docker compose가 runner(앱)와 migrator(배포 시 한 번)로 나눠 쓴다.
#
# 빌드 시 DATABASE_URL 등이 필요한 이유: `src/lib/db.ts`와 `src/lib/supabase/admin.ts`가
# 모듈 로드 시 env를 읽는다. 값은 플레이스홀더로 두고, 실제 비밀은 런타임 env로 넣는다.
# NEXT_PUBLIC_* 만 클라이언트 번들에 박히므로 compose build.args로 실값을 넘긴다.

FROM node:22-bookworm-slim AS base

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps

COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma

# prisma generate(postinstall)가 prisma.config.ts의 DIRECT_URL을 읽는다.
ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build"
ENV DIRECT_URL="postgresql://build:build@127.0.0.1:5432/build"

RUN npm ci

FROM deps AS builder

COPY . .

ARG NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co"
ARG NEXT_PUBLIC_APP_URL="http://localhost:3000"
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NODE_ENV=production
ENV AUTH_SECRET="build-placeholder-auth-secret-32chars"
ENV SUPABASE_SERVICE_ROLE_KEY="build-placeholder"

RUN mkdir -p public \
    && npx prisma generate \
    && npm run build

FROM deps AS migrator

ENV NODE_ENV=production

COPY prisma ./prisma
COPY prisma.config.ts ./

CMD ["npx", "prisma", "migrate", "deploy"]

FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN groupadd --system nextjs \
    && useradd --system --gid nextjs --create-home nextjs

COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nextjs /app/public ./public

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3000/').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
