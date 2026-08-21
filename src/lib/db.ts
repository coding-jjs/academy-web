import "server-only";

/**
 * 서버 전용 PrismaClient.
 * Prisma 7은 드라이버 엔진이 아니라 `DATABASE_URL` + pg adapter로 붙는다.
 *
 * 호출: 서버 페이지·Server Action·`account-access` 등 DB를 읽는 모든 서버 모듈.
 * 클라이언트 번들에 넣으면 안 되므로 `import "server-only"`를 맨 위에 둔다.
 *
 * 읽기/쓰기 모두 이 싱글톤. 개발에선 `globalThis`에 붙여 hot reload마다
 * 커넥션이 늘지 않게 한다. 프로덕션은 모듈 스코프 한 개면 충분하다.
 *
 * 의도적으로 하지 않는 일:
 * - migrate/generate용 연결은 쓰지 않는다 → `prisma.config.ts`의 `DIRECT_URL`
 *   (풀러 DATABASE_URL은 마이그레이션 advisory lock에 부적합).
 * - 트랜잭션 헬퍼를 감싸지 않는다. 호출부가 `prisma.$transaction`을 직접 연다.
 *
 * 관련: `prisma/schema.prisma`, `prisma.config.ts`.
 */

import { PrismaClient } from "@/generate/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL이 설정되지 않았습니다.");
}

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

/** 앱 전역 Prisma. 서버 모듈만 import한다. */
export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        adapter: new PrismaPg(connectionString),
    });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
