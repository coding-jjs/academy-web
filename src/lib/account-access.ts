/**
 * "지금 이 User로 로그인·업무를 해도 되는가"를 DB 기준으로 판정한다.
 *
 * 호출:
 * - `auth.config.ts` jwt/signIn 콜백 — 세션을 만들기 전
 * - `auth-guard.ts` requireRole — 페이지에 들이기 전
 *
 * 규칙:
 * - BLOCKED / WITHDRAWN → null. 쿠키가 남아 있어도 업무 진입 불가.
 * - STUDENT / PARENT / GUEST만 퇴원 유예 만료 시 User를 WITHDRAWN으로 확정한다.
 *   (원장·교사·직원은 원생 퇴원과 로그인 계정을 묶지 않는다)
 *
 * 하지 않는 일: 역할이 URL과 맞는지는 보지 않는다 → requireRole / proxy.
 */

import type { AppRole } from "@/types/roles"; // 세션에 실을 역할. 권한 키 맵은 여기 없다.
import type { UserRole, UserStatus } from "@/generate/prisma/client"; // BLOCKED/WITHDRAWN. ENROLLED는 Student.
import { getAuditRequestMetadata } from "@/lib/audit"; // jwt 콜백처럼 headers()가 없으면 빈 메타.
import { prisma } from "@/lib/db"; // JWT가 아니라 DB 상태. updateAge 0과 맞춤.
import { finalizeExpiredWithdrawalsForUser } from "@/lib/student-lifecycle"; // 유예 끝 WITHDRAWN 원생만 확정.

/** requireRole·jwt 콜백이 세션에 심는 최소 신원. */
export type UsableAccount = { // 권한 키 맵은 세션에 없다. userHasPermission이 본다.
    id: string; // User.id. JWT userId.
    role: AppRole; // 권한 키 맵은 여기 없다. userHasPermission이 본다.
    onboardingCompleted: boolean; // 시각이 찍혔는지만.
};

/** 로그인 경로 등 headers()가 없는 곳에서도 호출되므로 실패하면 빈 메타로 진행한다. */
async function readAuditMetadata() { // jwt 콜백처럼 headers()가 없으면 빈 메타로 진행. 확정 자체를 막지 않는다.
    try { // headers()가 없으면 throw. 확정은 계속.
        return await getAuditRequestMetadata(); // jwt 콜백처럼 headers()가 없으면 빈 메타로 진행. 확정 자체를 막지 않는다.
    } catch { // jwt 경로. IP/UA만 비운다.
        return { ipAddress: null, userAgent: null }; // 퇴원 확정 audit는 남기되 IP/UA만 비운다.
    }
}

function toUsable(user: { // 세션에 실을 최소 신원. URL 역할 일치는 보지 않는다.
    id: string; // User.id.
    role: UserRole; // AppRole과 같은 문자열.
    onboardingCompleteAt: Date | null; // 시각이 찍혔는지만 boolean으로.
}): UsableAccount { // requireRole이 이 값으로 JWT 옛 role을 덮는다.
    return { // 세션에 실을 최소 신원. 온보딩 완료는 시각이 찍혔는지만 본다.
        id: user.id, // JWT userId.
        role: user.role, // proxy·requireRole이 URL과 맞출 역할.
        onboardingCompleted: user.onboardingCompleteAt !== null, // signup 분기. 역할 부여와는 별개.
    };
}

/** 업무 진입을 막는 확정 상태. ACTIVE만 통과. */
function isClosedStatus(status: UserStatus) { // PAUSED는 Student 상태. User는 ACTIVE만 통과.
    return status === "BLOCKED" || status === "WITHDRAWN"; // ACTIVE만 통과. 쿠키가 남아 있어도 업무 진입을 막는다.
}

/**
 * userId로 사용 가능 계정을 돌려준다. 없거나 닫혔으면 null.
 *
 * 학생·학부모·게스트는 조회 시점에 퇴원 유예가 끝났는지 보고,
 * 끝났으면 User를 WITHDRAWN으로 확정한 뒤 null을 준다.
 * 그래서 JWT가 살아 있어도 유예가 끝나는 순간부터 로그인이 막힌다.
 */
export async function getUsableAccount( // BLOCKED/WITHDRAWN이면 null. 학생·학부모·게스트만 유예 확정.
    userId: string, // JWT userId 또는 signIn의 existing.id.
): Promise<UsableAccount | null> { // null이면 jwt가 신원만 비운다. 쿠키는 maxAge까지.
    const user = await prisma.user.findUnique({ // JWT가 아니라 DB 상태. 방금 BLOCKED된 계정이 쿠키 maxAge 동안 들어오는 것을 막는다.
        where: { id: userId }, // 없는 id면 null.
        select: { // 최소 컬럼. 권한 키는 안 읽는다.
            id: true, // 세션 userId.
            role: true, // STUDENT/PARENT/GUEST만 퇴원 확정.
            status: true, // BLOCKED/WITHDRAWN이면 null.
            onboardingCompleteAt: true, // signup 분기.
        },
    });

    if (!user || isClosedStatus(user.status)) return null; // 없거나 닫힌 계정은 세션을 만들지 않는다.

    if ( // BLOCKED/WITHDRAWN이면 null. 학생·학부모·게스트만 유예 확정.
        user.role === "STUDENT" || // 원생 로그인. 유예 만료 시 WITHDRAWN 확정.
        user.role === "PARENT" || // 학부모. 남은 자녀 링크가 있으면 ACTIVE로 남을 수 있다.
        user.role === "GUEST" // 학생·학부모·게스트만 퇴원 확정. 원장·교사·직원 로그인을 원생 퇴원과 묶지 않는다.
    ) { // 원장·교사·직원은 이 분기를 타지 않는다.
        const finalized = await finalizeExpiredWithdrawalsForUser( // BLOCKED/WITHDRAWN이면 null. 학생·학부모·게스트만 유예 확정.
            userId, // 로그인 중인 userId. 시스템이 자동 확정해도 actor.
            new Date(), // 유예가 끝난 WITHDRAWN 원생만 확정. 당일은 조회를 유지.
            await readAuditMetadata(), // 유예가 끝난 WITHDRAWN 원생만 확정. 당일은 조회를 유지.
        );

        if (finalized) { // 확정 후 WITHDRAWN이면 null. JWT가 살아 있어도 유예 끝부터 막힌다.
            const fresh = await prisma.user.findUnique({ // 확정 후 상태. 학부모는 남은 자녀가 있으면 ACTIVE.
                where: { id: userId }, // 같은 User.
                select: { // 최소 컬럼.
                    id: true, // 세션.
                    role: true, // GUEST로 바뀌었을 수 있다.
                    status: true, // WITHDRAWN이면 null.
                    onboardingCompleteAt: true, // signup 분기 유지.
                },
            });
            if (!fresh || isClosedStatus(fresh.status)) return null; // 학부모는 남은 자녀 링크가 있으면 ACTIVE로 남을 수 있다.
            return toUsable(fresh); // 아직 ACTIVE면 세션을 준다.
        }
    }

    return toUsable(user); // URL 역할 일치는 보지 않는다 → requireRole / proxy.
}

/**
 * 이메일로 사용 가능 계정을 찾는다.
 * jwt 콜백은 토큰에 email만 있으므로 이 경로를 탄다.
 */
export async function getUsableAccountByEmail(email: string) { // jwt 콜백. 토큰의 옛 role을 믿지 않는다.
    const user = await prisma.user.findUnique({ // jwt 콜백은 토큰에 email만 있으므로 id로 바꾼 뒤 같은 판정을 탄다.
        where: { email }, // Google 세션 이메일. 폼 값이 아니다.
        select: { id: true }, // id만. 나머지는 getUsableAccount.
    });
    if (!user) return null; // 없는 이메일은 JWT 신원만 비운다.
    return getUsableAccount(user.id); // BLOCKED/유예 만료까지 같은 규칙.
}
