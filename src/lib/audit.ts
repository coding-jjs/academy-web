/**
 * 감사 로그 헬퍼.
 * 원장 조치·상태 전이를 `auditLog`에 남겨 나중에 "누가 무엇을 바꿨는지"를 추적한다.
 *
 * 호출:
 * - `student-lifecycle.ts`, `features/users|permissions|families|messages|reports` actions
 * - `api/admin/bootstrap-director`
 * - `account-access.ts`는 메타만 `getAuditRequestMetadata`로 읽는다
 *
 * 서버 전용 (`headers()`). `writeAuditLog`는 반드시 같은 트랜잭션 클라이언트에 써서
 * 업무 update가 롤백되면 로그만 남는 일을 막는다.
 *
 * 의도적으로 하지 않는 일:
 * - 조회용 페이지 뷰는 남기지 않는다. 상태 전이·권한 변경·쪽지 발송 같은 쓰기만.
 * - IP/UA 파싱 실패를 throw하지 않는다 — 헤더가 없는 경로(jwt 콜백)도 호출한다.
 *
 * 관련: `student-lifecycle.ts`, `account-access.ts`.
 */

import { isIP } from "node:net"; // 프록시가 "unknown"을 넣으면 IP가 아니라서 버린다.
import { headers } from "next/headers"; // jwt 콜백에는 없음. account-access가 빈 메타로 삼킨다.
import type { Prisma } from "@/generate/prisma/client"; // TransactionClient. 단독 create를 쓰지 않는다.

/** 요청에서 건질 수 있는 감사 부가 정보. 없거나 형식이 아니면 null. */
export type AuditRequestMetadata = { // jwt 콜백은 빈 메타. 확정 자체를 막지 않는다.
    ipAddress: string | null; // 형식이 아니면 null. jwt 콜백은 빈 메타.
    userAgent: string | null; // 512자로 자름.
};

/**
 * 현재 요청의 IP·UA. `x-forwarded-for` 첫 hop을 쓰고, IP가 아니면 버린다
 * (프록시가 "unknown"을 넣는 경우). UA는 512자로 잘라 로그 행이 비대해지지 않게 한다.
 *
 * jwt 콜백처럼 `headers()`가 없는 곳에서 부르면 throw한다.
 * 그 경로는 `account-access.readAuditMetadata`가 빈 메타로 삼킨다.
 */
export async function getAuditRequestMetadata(): Promise<AuditRequestMetadata> { // jwt 콜백에는 없음. 퇴원 확정은 빈 메타로도 진행.
    const requestHeaders = await headers(); // jwt 콜백에는 없음. account-access가 빈 메타로 삼킨다.
    const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]; // 첫 hop. 프록시가 "unknown"을 넣으면 IP가 아니라서 버린다.
    const candidateIp = ( // forwarded-for가 없으면 x-real-ip. 둘 다 없으면 빈 문자열.
        forwardedFor ?? // 같은 tx에 audit. 페이지 뷰는 안 남긴다.
        requestHeaders.get("x-real-ip") ?? // 같은 tx에 audit. 페이지 뷰는 안 남긴다.
        "" // 헤더 없음. isIP가 false가 되어 null.
    ).trim(); // 공백 IP를 통과시키지 않는다.

    return { // IP가 아니면 null. UA는 512자로 잘라 로그 행이 비대해지지 않게.
        ipAddress: isIP(candidateIp) ? candidateIp : null, // "unknown"은 IP가 아니라서 버린다.
        userAgent: requestHeaders.get("user-agent")?.slice(0, 512) ?? null, // 512자. 페이지 뷰는 남기지 않는다.
    };
}

/**
 * 같은 트랜잭션에 audit 행을 넣는다. 단독 `prisma.auditLog.create`를 쓰지 않는 이유:
 * 학생 퇴원과 로그가 어긋나면 원장이 "조치했는데 기록이 없다"가 된다.
 *
 * @param tx 업무 write와 한 커밋에 묶을 클라이언트
 * @param input.targetId 없으면 null. 시스템 시드 같은 대상 없는 액션용
 * @param input.details JSON. 없으면 `{}` — DB 컬럼이 NOT NULL인 전제
 */
export async function writeAuditLog( // 같은 tx에 audit. 페이지 뷰는 안 남긴다.
    tx: Prisma.TransactionClient, // 업무 update와 한 커밋. 롤백되면 로그만 남는 일을 막는다.
    input: { // 페이지 뷰는 남기지 않는다. 상태 전이·권한·쪽지 쓰기만.
        actorUserId: string; // 시스템이 자동 확정해도 로그인 중인 userId.
        action: string; // STUDENT_WITHDRAWN 등.
        targetType: string; // STUDENT / USER 등.
        targetId?: string | null; // 시드처럼 대상 없는 액션은 null.
        details?: Prisma.InputJsonValue; // 없으면 {}. NOT NULL 전제.
        metadata: AuditRequestMetadata; // jwt 경로는 빈 IP/UA.
    },
) { // 같은 tx. 단독 prisma.auditLog.create를 쓰지 않는다.
    await tx.auditLog.create({ // 같은 tx에 넣어 업무 update가 롤백되면 로그만 남는 일을 막는다.
        data: { // 조회용 페이지 뷰는 남기지 않는다.
            actorUserId: input.actorUserId, // 시스템이 자동 확정해도 로그인 중인 userId.
            action: input.action, // STUDENT_WITHDRAWN 등. 페이지 뷰는 남기지 않는다.
            targetType: input.targetType, // STUDENT. 시드는 대상 없을 수 있다.
            targetId: input.targetId ?? null, // 시드처럼 대상 없는 액션은 null.
            details: input.details ?? {}, // NOT NULL 전제.
            ipAddress: input.metadata.ipAddress, // 형식이 아니면 null.
            userAgent: input.metadata.userAgent, // 512자.
        },
    });
}
