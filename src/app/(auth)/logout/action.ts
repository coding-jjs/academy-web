"use server";

/**
 * 로그아웃 Server Action.
 *
 * 호출: AdminShell·MemberShell의 로그아웃 버튼이 form action으로 제출한다.
 * Auth.js `signOut`이 세션 쿠키를 지운 뒤 `/login`으로 보낸다.
 *
 * 의도적으로 하지 않는 일:
 * - User 행을 삭제·차단하지 않는다.
 * - `/` 공개 홈으로 보내지 않는다. 다시 쓰려면 로그인이 필요하게 `/login`으로 고정.
 */

import { signOut } from "@/lib/auth";

/** 세션을 끊고 로그인 화면으로 redirect한다. */
export async function logoutAction() {
    await signOut({
        redirectTo: "/login",
    });
}
