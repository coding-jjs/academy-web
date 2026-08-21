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

import type { AppRole } from "@/types/roles";
import type { UserRole, UserStatus } from "@/generate/prisma/client";
import { getAuditRequestMetadata } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { finalizeExpiredWithdrawalsForUser } from "@/lib/student-lifecycle";

/** requireRole·jwt 콜백이 세션에 심는 최소 신원. */
export type UsableAccount = {
    id: string;
    role: AppRole;
    onboardingCompleted: boolean;
};

/** 로그인 경로 등 headers()가 없는 곳에서도 호출되므로 실패하면 빈 메타로 진행한다. */
async function readAuditMetadata() {
    try {
        return await getAuditRequestMetadata();
    } catch {
        return { ipAddress: null, userAgent: null };
    }
}

function toUsable(user: {
    id: string;
    role: UserRole;
    onboardingCompleteAt: Date | null;
}): UsableAccount {
    return {
        id: user.id,
        role: user.role,
        onboardingCompleted: user.onboardingCompleteAt !== null,
    };
}

/** 업무 진입을 막는 확정 상태. ACTIVE만 통과. */
function isClosedStatus(status: UserStatus) {
    return status === "BLOCKED" || status === "WITHDRAWN";
}

/**
 * userId로 사용 가능 계정을 돌려준다. 없거나 닫혔으면 null.
 *
 * 학생·학부모·게스트는 조회 시점에 퇴원 유예가 끝났는지 보고,
 * 끝났으면 User를 WITHDRAWN으로 확정한 뒤 null을 준다.
 * 그래서 JWT가 살아 있어도 유예가 끝나는 순간부터 로그인이 막힌다.
 */
export async function getUsableAccount(
    userId: string,
): Promise<UsableAccount | null> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            role: true,
            status: true,
            onboardingCompleteAt: true,
        },
    });

    if (!user || isClosedStatus(user.status)) return null;

    if (
        user.role === "STUDENT" ||
        user.role === "PARENT" ||
        user.role === "GUEST"
    ) {
        const finalized = await finalizeExpiredWithdrawalsForUser(
            userId,
            new Date(),
            await readAuditMetadata(),
        );

        if (finalized) {
            const fresh = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    role: true,
                    status: true,
                    onboardingCompleteAt: true,
                },
            });
            if (!fresh || isClosedStatus(fresh.status)) return null;
            return toUsable(fresh);
        }
    }

    return toUsable(user);
}

/**
 * 이메일로 사용 가능 계정을 찾는다.
 * jwt 콜백은 토큰에 email만 있으므로 이 경로를 탄다.
 */
export async function getUsableAccountByEmail(email: string) {
    const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
    });
    if (!user) return null;
    return getUsableAccount(user.id);
}
