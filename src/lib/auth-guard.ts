/**
 * 서버 페이지·레이아웃의 역할 가드.
 *
 * 호출: 각 역할 그룹 `layout.tsx`와 일부 `page.tsx`가 `requireRole("DIRECTOR")`처럼 호출한다.
 * proxy.ts가 URL prefix로 1차 거르지만, JWT만 보면 방금 BLOCKED/퇴원된 계정이
 * 쿠키 maxAge(8시간) 동안 들어올 수 있다. 그래서 여기서 DB `getUsableAccount`를 다시 본다.
 *
 * 실패 시 동작:
 * - 세션 없음 / 사용 불가 계정 → `/login` (업무 URL을 보여주지 않음)
 * - 로그인은 됐지만 이 레이아웃의 역할이 아님 → `/post-login` (본인 홈으로)
 *
 * 권한 키(billing 등)는 여기서 보지 않는다 → `userHasPermission`.
 */

import { redirect } from "next/navigation";
import type { AppRole } from "@/types/roles";
import { getUsableAccount } from "@/lib/account-access";
import { auth } from "@/lib/auth";

/**
 * 현재 세션이 `roles` 중 하나인지 확인하고, DB 기준으로 보강한 세션을 돌려준다.
 *
 * @param roles 이 레이아웃/페이지가 허용하는 역할. 하나라도 맞으면 통과.
 * @returns session.user.id/role/onboardingCompleted를 DB 값으로 덮은 세션.
 *          JWT에 남은 옛 역할이 화면에 쓰이지 않게 하기 위함.
 */
export async function requireRole(...roles: AppRole[]) {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    const account = await getUsableAccount(session.user.id);
    if (!account) {
        redirect("/login");
    }

    if (!roles.includes(account.role)) {
        redirect("/post-login");
    }

    return {
        ...session,
        user: {
            ...session.user,
            id: account.id,
            role: account.role,
            onboardingCompleted: account.onboardingCompleted,
        },
    };
}
