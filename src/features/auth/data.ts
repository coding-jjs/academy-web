import "server-only";

/**
 * 개발 로그인 화면에 보여줄 @test.local ACTIVE 사용자 목록을 읽는다.
 *
 * 호출: `(auth)/login/page.tsx`가 서버 컴포넌트에서 불러 select options를 만든다.
 * 전제: `isDevLoginEnabled()`가 켜진 로컬/스테이징에서만 의미가 있다.
 *
 * 의도적으로 하지 않는 일:
 * - 운영에서 테스트 계정을 노출하지 않는다 → 플래그가 꺼지면 빈 배열.
 * - BLOCKED/INACTIVE 계정은 고르지 않는다 → 로그인해도 막히는 행을 보여 주지 않기 위함.
 * - 비밀번호를 읽거나 만들지 않는다 → 개발 프로바이더가 이메일만 받는다.
 *
 * 관련: `features/auth/types.ts`, `lib/dev-login.ts`, `features/auth/actions.ts`.
 */

import { prisma } from "@/lib/db";
import {
    DEV_LOGIN_ROLES,
    isDevLoginEnabled,
} from "@/lib/dev-login";
import type { DevelopmentTestUser } from "@/features/auth/types";

/**
 * 개발 로그인용 테스트 계정 목록.
 *
 * @returns 이메일·이름·역할만. 운영이거나 플래그 off면 `[]`.
 * @sideEffects 없음. 읽기 전용.
 */
export async function getDevelopmentTestUsers(): Promise<
    DevelopmentTestUser[]
> {
    if (!isDevLoginEnabled()) return [];

    return prisma.user.findMany({
        where: {
            status: "ACTIVE",
            email: { endsWith: "@test.local" },
            role: { in: [...DEV_LOGIN_ROLES] },
        },
        orderBy: [{ role: "asc" }, { name: "asc" }],
        select: { email: true, name: true, role: true },
    });
}
