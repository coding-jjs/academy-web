/**
 * Prisma 7 CLI 설정 (`migrate` / `generate` / `validate`).
 * 스키마·마이그레이션 경로와 **DIRECT_URL**을 알려 풀링 연결이 아닌 직접 Postgres에 붙게 한다.
 *
 * 호출: `prisma` CLI, `npm run validate`의 `prisma validate`.
 * 앱 런타임은 이 파일을 쓰지 않는다 → `lib/db.ts`의 `DATABASE_URL` + pg adapter.
 *
 * DIRECT_URL을 쓰는 이유: migrate의 advisory lock은 PgBouncer 트랜잭션 풀에서 실패한다.
 * dotenv는 `.env.local`만 읽는다 — Next와 같은 파일을 보게 하기 위함.
 *
 * 의도적으로 하지 않는 일:
 * - 시드 스크립트를 여기 붙이지 않는다 → `scripts/*.mjs`가 DIRECT_URL로 직접 붙는다.
 * - PrismaClient 옵션을 두지 않는다 → `lib/db.ts`.
 *
 * 관련: `prisma/schema.prisma`, `lib/db.ts`.
 */

import { config } from "dotenv"; // CLI가 셸 env만 보면 DIRECT_URL이 빠진다.
import { defineConfig, env } from "prisma/config"; // Prisma 7 CLI. 런타임 PrismaClient는 lib/db.ts.

config({ path: ".env.local" }); // Next와 같은 .env.local. CLI가 셸 env만 보면 DIRECT_URL이 빠진다.

export default defineConfig({ // migrate/generate/validate. 앱 런타임은 DATABASE_URL.
    schema: "prisma/schema.prisma", // 앱 런타임 스키마. generate 산출물은 src/generate.

    migrations: { // 시드 SQL은 여기 두지 않는다. scripts/*.mjs가 DIRECT_URL로 붙는다.
        path: "prisma/migrations", // migrate 이력. 시드 SQL은 여기 두지 않는다.
    },

    datasource: { // 풀링 DATABASE_URL이 아님. advisory lock은 PgBouncer에서 실패한다.
        url: env("DIRECT_URL"), // 풀링 DATABASE_URL이 아님. advisory lock은 PgBouncer에서 실패한다.
    },
});
