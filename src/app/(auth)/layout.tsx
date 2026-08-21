/**
 * `(auth)` 그룹 레이아웃. `/login` `/signup` `/post-login`을 감싼다.
 *
 * AdminShell·MemberShell을 쓰지 않는다. 인증 화면은 내비 없이 좁은 카드만
 * 보여 업무 URL과 시각적으로 분리한다. `requireRole`도 없다 —
 * 미로그인·GUEST가 들어와야 한다.
 *
 * `/post-login`도 이 레이아웃을 타지만 본문은 바로 redirect한다.
 */

import type { ReactNode } from "react";

/** 인증 라우트는 셸 없이 children만 통과시킨다. */
export default function AuthLayout({ children }: { children: ReactNode }) {
    return children;
}
