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

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getRoleHomePath } from "@/lib/role-routes";

/** 세션 역할에 맞는 홈으로 즉시 redirect한다. UI를 그리지 않는다. */
export default async function PostLoginPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    redirect(getRoleHomePath(session.user.role));
}
