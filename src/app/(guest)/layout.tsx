/**
 * `(guest)` URL 그룹 레이아웃. `/guest/*`를 감싼다.
 *
 * `requireRole("GUEST")` 후 `MemberShell role="guest"`를 씌운다.
 * 역할 부여 전 계정은 문의(`/guest/inquiry`) 등 제한된 멤버 화면만 쓴다.
 *
 * `/guest` 자체는 공개 홈 `/`로 redirect한다. 문의는 `/guest/inquiry`.
 * proxy matcher는 `/guest/:path*`를 커버하므로 미로그인·다른 역할은 여기로 못 들어온다.
 */

import type { ReactNode } from "react";
import MemberShell from "@/components/layout/MemberShell";
import { requireRole } from "@/lib/auth-guard";

/** 온보딩 끝난 GUEST만 통과시키고 게스트 내비를 붙인다. */
export default async function GuestLayout({ children }: { children: ReactNode }) {
    const session = await requireRole("GUEST");
    return (
        <MemberShell role="guest" userName={session.user.name}>
            {children}
        </MemberShell>
    );
}
