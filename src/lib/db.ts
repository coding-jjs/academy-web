import "server-only"; // 클라이언트 번들에 Prisma가 들어가면 DATABASE_URL이 새므로 맨 위.

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

import { PrismaClient } from "@/generate/prisma/client"; // generate 산출물. 앱 런타임만. CLI는 prisma.config.
import { PrismaPg } from "@prisma/adapter-pg"; // Prisma 7 pg adapter. 엔진 바이너리가 아니다.

const connectionString = process.env.DATABASE_URL; // 런타임 풀링 URL. migrate용 DIRECT_URL이 아니다.

if (!connectionString) { // 풀링 URL이 없으면 기동 실패. 요청마다 부분 실패하지 않게.
    throw new Error("DATABASE_URL이 설정되지 않았습니다."); // 기동 실패. jwt·data.ts가 같은 클라이언트를 쓴다.
}

const globalForPrisma = globalThis as unknown as { // hot reload마다 커넥션이 늘지 않게 붙일 자리.
    prisma: PrismaClient | undefined; // 개발 전용 슬롯. 프로덕션은 모듈 스코프 한 개.
};

/** 앱 전역 Prisma. 서버 모듈만 import한다. */
export const prisma = // 런타임 DATABASE_URL. migrate는 DIRECT_URL.
    globalForPrisma.prisma ?? // 런타임 DATABASE_URL. migrate는 DIRECT_URL.
    new PrismaClient({ // data.ts 읽기·actions.ts 쓰기·jwt 재검사가 같은 클라이언트.
        adapter: new PrismaPg(connectionString), // Prisma 7 pg adapter. 엔진 바이너리가 아니다.
    });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma; // 개발 hot reload마다 커넥션이 늘지 않게. 프로덕션은 모듈 스코프 한 개면 충분.
