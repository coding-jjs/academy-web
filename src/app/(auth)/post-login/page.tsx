/**
 * `/post-login` 로그인 직후 역할 홈 분기.
 *
 * Google/테스트 로그인 콜백이 `/director` 같은 업무 URL을 몰라도 되게
 * `auth()` → `getRoleHomePath(role)`로만 보낸다. `requireRole`은 쓰지 않는다.
 * 세션이 없으면 `/login`.
 *
 * GUEST 홈은 `/`(공개 홈). `/guest`는 다시 `/`로 redirect하므로
 * 문의 화면(`/guest/inquiry`)으로 보내지 않는다.
 *
 * 의도적으로 하지 않는 일:
 * - 온보딩 여부를 여기서 다시 검사하지 않는다. 미완료 GUEST는 `/signup`이 막는다.
 * - JWT를 갱신하지 않는다.
 */

import { redirect } from "next/navigation"; // UI를 그리지 않는다. 역할 홈으로만 보낸다.
import { auth } from "@/lib/auth"; // JWT만. getUsableAccount는 역할 홈 layout의 requireRole.
import { getRoleHomePath } from "@/lib/role-routes"; // 역할 → 홈 URL. GUEST는 /.

/** 세션 역할에 맞는 홈으로 즉시 redirect한다. UI를 그리지 않는다. */
export default async function PostLoginPage() { // 로그인 콜백 분기. requireRole 없음.
    const session = await auth(); // JWT만 본다. 없으면 로그인.

    if (!session?.user?.id) { // 미로그인. 역할 홈을 열지 않는다.
        redirect("/login"); // 업무 URL을 보여 주지 않는다.
    } // 블록 끝.

    redirect(getRoleHomePath(session.user.role)); // 역할 홈으로. GUEST는 / — /guest는 다시 / 로 보낸다.
} // 블록 끝.
