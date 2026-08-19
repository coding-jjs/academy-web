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

import { redirect } from "next/navigation"; // 실패 시 /login 또는 /post-login. 거절 페이지만 보여 주지 않는다.
import type { AppRole } from "@/types/roles"; // 레이아웃이 허용하는 역할. 권한 키는 여기 없다.
import { getUsableAccount } from "@/lib/account-access"; // BLOCKED/WITHDRAWN이면 null. JWT 8시간을 믿지 않는다.
import { auth } from "@/lib/auth"; // JWT 세션. proxy 1차 가드 후에도 DB와 맞춘다.

/**
 * 현재 세션이 `roles` 중 하나인지 확인하고, DB 기준으로 보강한 세션을 돌려준다.
 *
 * @param roles 이 레이아웃/페이지가 허용하는 역할. 하나라도 맞으면 통과.
 * @returns session.user.id/role/onboardingCompleted를 DB 값으로 덮은 세션.
 *          JWT에 남은 옛 역할이 화면에 쓰이지 않게 하기 위함.
 */
export async function requireRole(...roles: AppRole[]) { // layout → page → data/actions. 권한 키는 userHasPermission.
    const session = await auth(); // JWT. proxy 1차 가드 후에도 페이지에서 DB와 맞춰 본다.

    if (!session?.user?.id) { // 비로그인은 업무 URL을 보여 주지 않는다.
        redirect("/login"); // 로그인 후 callback으로 돌아올 수 있게 /login만.
    }

    const account = await getUsableAccount(session.user.id); // BLOCKED/퇴원 확정이면 null. JWT 8시간을 믿지 않는다.
    if (!account) { // 쿠키가 남아 있어도 업무 화면을 열지 않는다.
        redirect("/login"); // 사용 불가 계정도 로그인 화면. 본인 홈이 아님.
    }

    if (!roles.includes(account.role)) { // 학부모가 /director 를 친 경우처럼 URL 그룹이 다름.
        redirect("/post-login"); // 역할 홈으로 보낸다. 거절 페이지만 보여 주지 않는다.
    }

    return { // JWT에 남은 옛 role을 DB 값으로 덮어 Screen·셸에 쓰이게 한다.
        ...session, // 나머지 세션 필드 유지. 권한 키 맵은 싣지 않는다.
        user: { // 권한 키 맵은 세션에 싣지 않는다. userHasPermission이 요청마다 grant를 본다.
            ...session.user, // name/email/image는 JWT. id/role/onboarding은 DB.
            id: account.id, // getUsableAccount가 읽은 User.id.
            role: account.role, // 원장이 방금 바꾼 역할이 다음 요청에 반영되게.
            onboardingCompleted: account.onboardingCompleted, // 온보딩 미완료 GUEST는 signup 분기에 쓰인다.
        },
    };
}
