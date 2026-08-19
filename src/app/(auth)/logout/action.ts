"use server"; // Server Action. 브라우저가 세션 쿠키를 직접 지우지 않는다.

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

import { signOut } from "@/lib/auth"; // Auth.js. User 행은 건드리지 않는다.

/** 세션을 끊고 로그인 화면으로 redirect한다. */
export async function logoutAction() { // 셸 로그아웃 버튼이 form action으로 호출.
    await signOut({ // 세션 쿠키만 지운다. User 행은 그대로. 다음은 /login.
        redirectTo: "/login", // 공개 홈 `/`가 아니다. 다시 쓰려면 로그인이 필요하게.
    }); // 객체/호출 끝.
} // 블록 끝.
