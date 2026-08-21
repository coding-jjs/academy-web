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

import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

config({ path: ".env.local" });

export default defineConfig({
    schema: "prisma/schema.prisma",

    migrations: {
        path: "prisma/migrations",
    },

    datasource: {
        url: env("DIRECT_URL"),
    },
});
